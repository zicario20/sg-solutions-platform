import { createHmac } from "node:crypto";
import {
  type AuthCommand,
  type CrmPartyResolutionEvidence,
  createOpaqueValue,
  createPersistentOAuthAccountService,
  createPkceChallenge,
  digestOpaqueProof,
  type OfficialSupabaseIdentity,
  openServerSecret,
  sealServerSecret,
  verifySessionCsrfToken,
} from "@atlas/auth";
import {
  type AuthSql,
  createPostgresAuthSql,
  PostgresAuthControlPlaneRepository,
  PostgresAuthIdentityRepository,
  PostgresAuthSessionInvitationRepository,
  PostgresDurableAuthControlsRepository,
  PostgresOAuthTransactionRepository,
} from "@atlas/database";
import { createConfiguredEmailAuth } from "./configured-email-auth.ts";
import { createConfiguredOAuthDependencies } from "./configured-oauth-dependencies.ts";
import {
  type AuthAuditOutcome,
  type AuthAuditPurpose,
  createServerAuthRuntime,
  type ServerAuthControlPlane,
} from "./server-runtime.ts";
import {
  buildAuthRiskKeyDigests,
  canonicalSessionHandleDigest,
  createSessionCookieHeaders,
} from "./session-security.ts";

export { createConfiguredOAuthDependencies } from "./configured-oauth-dependencies.ts";
export {
  buildAuthRiskKeyDigests,
  canonicalSessionHandleDigest,
  createSessionCookieHeaders,
} from "./session-security.ts";

export type DefaultOAuthAdapter = {
  start(input?: {
    readonly browserBinding: string;
  }): Promise<{ kind: "redirect"; location: string } | { kind: "unavailable" }>;
  callback(input: {
    readonly state: string;
    readonly code: string;
    readonly browserBinding?: string;
  }): Promise<
    { kind: "authenticated"; handle: string } | { kind: "denied" | "manual_review" | "unavailable" }
  >;
  issueInvitation(): Promise<
    { kind: "issued"; id: string; proof: string } | { kind: "denied" | "unavailable" }
  >;
};

export type DefaultOAuthDependencies = Readonly<{
  sql?: AuthSql;
  provider?: {
    authorizationUrl(input: {
      state: string;
      nonce: string;
      codeChallenge: string;
      redirectUri: string;
    }): string;
    exchangeAndVerify(input: {
      code: string;
      pkceVerifier: string;
      expectedNonce: string;
      redirectUri: string;
    }): Promise<OfficialSupabaseIdentity | undefined>;
  };
  crm?: {
    resolve(input: {
      readonly subject: string;
      readonly supabaseEvidenceId: string;
    }): Promise<CrmPartyResolutionEvidence>;
  };
}>;

const unavailableOAuthAdapter = (): DefaultOAuthAdapter => ({
  start: async () => ({ kind: "unavailable" }),
  callback: async () => ({ kind: "unavailable" }),
  issueInvitation: async () => ({ kind: "unavailable" }),
});

const isOAuthOverride = (
  candidate: DefaultOAuthAdapter | DefaultOAuthDependencies,
): candidate is DefaultOAuthAdapter =>
  "start" in candidate &&
  typeof candidate.start === "function" &&
  "callback" in candidate &&
  typeof candidate.callback === "function";

export function createDefaultOAuthAdapter(
  env: Record<string, string | undefined>,
  dependenciesOrOverride: DefaultOAuthDependencies | DefaultOAuthAdapter = {},
): DefaultOAuthAdapter {
  const issuer = env.SUPABASE_ISSUER?.trim();
  const audience = env.SUPABASE_AUDIENCE?.trim();
  const canonicalOrigin = env.AUTH_CANONICAL_ORIGIN?.trim();
  const oauthSecret = env.AUTH_OAUTH_SECRET_KEY?.trim();
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const providerEnabled =
    env.SUPABASE_OAUTH_ENABLED === "true" && Boolean(issuer) && Boolean(audience);
  if (providerEnabled && isOAuthOverride(dependenciesOrOverride)) return dependenciesOrOverride;
  const enabled =
    providerEnabled &&
    Boolean(env.DATABASE_URL) &&
    Boolean(oauthSecret && oauthSecret.length >= 32) &&
    Boolean(canonicalOrigin && /^https:\/\/[^/?#]+$/u.test(canonicalOrigin)) &&
    Boolean(supabaseUrl && /^https:\/\/[^/?#]+$/u.test(supabaseUrl));
  if (!enabled || isOAuthOverride(dependenciesOrOverride)) return unavailableOAuthAdapter();
  const { sql, provider, crm } = dependenciesOrOverride;
  if (!sql || !provider || !crm || !issuer || !audience || !canonicalOrigin || !oauthSecret)
    return unavailableOAuthAdapter();

  const transactions = new PostgresOAuthTransactionRepository(sql);
  const accounts = createPersistentOAuthAccountService({
    repository: new PostgresAuthIdentityRepository(sql),
    issuer,
    audience,
    resolveCrm: crm.resolve.bind(crm),
  });
  const callbackUrl = `${canonicalOrigin}/api/auth/oauth/google/callback`;
  return {
    async start(input) {
      if (!input?.browserBinding) return { kind: "unavailable" };
      const state = createOpaqueValue();
      const nonce = createOpaqueValue();
      const pkceVerifier = createOpaqueValue();
      const issued = new Date();
      const location = provider.authorizationUrl({
        state,
        nonce,
        codeChallenge: createPkceChallenge(pkceVerifier),
        redirectUri: callbackUrl,
      });
      try {
        const authorize = new URL(location);
        const configured = new URL(supabaseUrl ?? "");
        if (authorize.origin !== configured.origin || authorize.pathname !== "/auth/v1/authorize")
          return { kind: "unavailable" };
      } catch {
        return { kind: "unavailable" };
      }
      await transactions.issue({
        id: createOpaqueValue(),
        purpose: "sign_in",
        provider: "google",
        stateDigest: digestOpaqueProof(state),
        nonceDigest: digestOpaqueProof(nonce),
        pkceVerifierDigest: digestOpaqueProof(pkceVerifier),
        browserBindingDigest: digestOpaqueProof(input.browserBinding),
        redirectHash: digestOpaqueProof(callbackUrl),
        nonceCiphertext: sealServerSecret(oauthSecret, nonce),
        pkceVerifierCiphertext: sealServerSecret(oauthSecret, pkceVerifier),
        returnIntent: "/client",
        callbackUrl,
        expiresAt: new Date(issued.getTime() + 10 * 60_000),
        now: issued,
      });
      return { kind: "redirect", location };
    },
    async callback(input) {
      if (!input.browserBinding || !input.state || !input.code) return { kind: "denied" };
      const stored = await transactions.load({
        stateDigest: digestOpaqueProof(input.state),
        browserBindingDigest: digestOpaqueProof(input.browserBinding),
        now: new Date(),
      });
      if (!stored) return { kind: "denied" };
      let nonce: string;
      let pkceVerifier: string;
      try {
        nonce = openServerSecret(oauthSecret, stored.nonceCiphertext);
        pkceVerifier = openServerSecret(oauthSecret, stored.pkceVerifierCiphertext);
      } catch {
        return { kind: "denied" };
      }
      const identity = await provider.exchangeAndVerify({
        code: input.code,
        pkceVerifier,
        expectedNonce: nonce,
        redirectUri: callbackUrl,
      });
      if (!identity) return { kind: "denied" };
      const consumed = await transactions.consume({
        stateDigest: digestOpaqueProof(input.state),
        nonceDigest: digestOpaqueProof(nonce),
        pkceVerifierDigest: digestOpaqueProof(pkceVerifier),
        browserBindingDigest: digestOpaqueProof(input.browserBinding),
        redirectHash: digestOpaqueProof(callbackUrl),
        now: new Date(),
      });
      if (consumed.kind !== "consumed") return { kind: "denied" };
      const result = await accounts.authenticate(identity);
      return result.kind === "authenticated"
        ? { kind: "authenticated", handle: result.handle }
        : result;
    },
    issueInvitation: async () => ({ kind: "unavailable" }),
  };
}

type ActiveAuthSession = {
  readonly id: string;
  readonly createdAt?: Date;
  readonly current?: boolean;
};
type DurableHttpAdapter = {
  sessions: {
    list(handle: string): Promise<readonly ActiveAuthSession[]>;
    rotate(
      handle: string,
    ): Promise<{ kind: "rotated"; handle: string } | { kind: "family_revoked" }>;
    revokeCurrent(handle: string): Promise<{ kind: "revoked" | "denied" }>;
    revokeOthers(handle: string): Promise<{ kind: "revoked" | "denied" }>;
  };
  invitations: {
    accept(input: {
      id: string;
      proof: string;
      sessionHandle: string;
    }): Promise<{ kind: "consumed" | "manual_review" }>;
  };
};
type DurableHttpSecurity = {
  readonly canonicalOrigin: string;
  readonly auditOutcome?: (input: {
    readonly purpose: AuthAuditPurpose;
    readonly outcome: AuthAuditOutcome;
    readonly requestId: string;
    readonly now: Date;
  }) => Promise<void>;
};
const requestCookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
const csrf = (request: Request, handle: string, secret: string) => {
  const value = requestCookie(request, "__Host-atlas_csrf");
  return Boolean(
    value &&
      value === request.headers.get("x-atlas-csrf") &&
      verifySessionCsrfToken(secret, handle, value),
  );
};

export function createDurableAuthHttpFactory(
  adapter: DurableHttpAdapter,
  csrfSecret = process.env.AUTH_SESSION_CSRF_SECRET ?? "",
  security: DurableHttpSecurity = { canonicalOrigin: process.env.AUTH_CANONICAL_ORIGIN ?? "" },
) {
  const respond = (status: number, body?: Record<string, unknown>) =>
    body
      ? Response.json(body, {
          status,
          headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" },
        })
      : new Response(null, {
          status,
          headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" },
        });
  const audit = async (purpose: AuthAuditPurpose, outcome: AuthAuditOutcome, request: Request) =>
    security.auditOutcome?.({
      purpose,
      outcome,
      requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
      now: new Date(),
    });
  const mutationHandle = async (request: Request) => {
    if (
      request.method !== "POST" ||
      !security.canonicalOrigin ||
      new URL(request.url).origin !== security.canonicalOrigin ||
      request.headers.get("origin") !== security.canonicalOrigin
    )
      return undefined;
    const handle = requestCookie(request, "__Host-atlas_auth");
    const csrfCookie = requestCookie(request, "__Host-atlas_csrf");
    const form = await request
      .clone()
      .formData()
      .catch(() => new FormData());
    const csrfRequest = request.headers.get("x-atlas-csrf") ?? String(form.get("csrf") ?? "");
    return handle &&
      csrfCookie &&
      csrfRequest &&
      csrfCookie === csrfRequest &&
      verifySessionCsrfToken(csrfSecret, handle, csrfRequest)
      ? handle
      : undefined;
  };
  return {
    sessions: async (request: Request) => {
      const handle = requestCookie(request, "__Host-atlas_auth");
      if (!handle || !csrf(request, handle, csrfSecret))
        return Response.json({ kind: "denied" }, { status: 403 });
      const sessions = (await adapter.sessions.list(handle)).slice(0, 20).map((session, index) => ({
        displayRef: `session-${index + 1}`,
        createdAt: session.createdAt,
        current: session.current === true,
      }));
      return Response.json(
        { sessions },
        { status: 200, headers: { "cache-control": "private, no-store" } },
      );
    },
    rotate: async (request: Request) => {
      const handle = await mutationHandle(request);
      if (!handle) {
        await audit("sessions", "denied", request);
        return respond(403, { kind: "denied" });
      }
      const result = await adapter.sessions.rotate(handle);
      await audit("sessions", result.kind === "rotated" ? "rotated" : "denied", request);
      if (result.kind !== "rotated") return respond(403, { kind: "denied" });
      const headers = new Headers({
        "cache-control": "private, no-store",
        "referrer-policy": "no-referrer",
      });
      for (const value of createSessionCookieHeaders(result.handle, csrfSecret))
        headers.append("set-cookie", value);
      return new Response(null, { status: 204, headers });
    },
    acceptInvitation: async (request: Request) => {
      const handle = await mutationHandle(request);
      if (!handle) {
        await audit("invitation_accept", "denied", request);
        return respond(403, { kind: "denied" });
      }
      const form = await request.formData();
      const result = await adapter.invitations.accept({
        id: String(form.get("id") ?? ""),
        proof: String(form.get("code") ?? ""),
        sessionHandle: handle,
      });
      const outcome = result.kind === "consumed" ? "accepted" : "manual_review";
      await audit("invitation_accept", outcome, request);
      return respond(202, { kind: outcome });
    },
  };
}
type OAuthInvitationAdapter = DefaultOAuthAdapter;
type OAuthSecurity = {
  admit(
    command: "oauth_start" | "oauth_callback",
    request: Request,
  ): Promise<"accepted" | "rate_limited" | "unavailable">;
  auditOutcome(
    command: "oauth_start" | "oauth_callback",
    outcome:
      | "redirected"
      | "authenticated"
      | "denied"
      | "manual_review"
      | "unavailable"
      | "rate_limited",
    request: Request,
  ): Promise<void>;
};
export function createOAuthInvitationEntryPoints(
  adapter: OAuthInvitationAdapter,
  input: string | { csrfSecret?: string; security?: OAuthSecurity } = process.env
    .AUTH_SESSION_CSRF_SECRET ?? "",
) {
  const csrfSecret = typeof input === "string" ? input : (input.csrfSecret ?? "");
  const security = typeof input === "string" ? undefined : input.security;
  return {
    start: async (request: Request) => {
      if (security) {
        const admitted = await security.admit("oauth_start", request);
        if (admitted !== "accepted") {
          await security.auditOutcome("oauth_start", admitted, request);
          return Response.json(
            { kind: "accepted" },
            { status: admitted === "rate_limited" ? 202 : 503 },
          );
        }
      }
      const browserBinding = requestCookie(request, "__Host-atlas_oauth") ?? createOpaqueValue();
      const result = await adapter.start({ browserBinding });
      await security?.auditOutcome(
        "oauth_start",
        result.kind === "redirect" ? "redirected" : "unavailable",
        request,
      );
      return result.kind === "redirect"
        ? new Response(null, {
            status: 303,
            headers: {
              location: result.location,
              "cache-control": "no-store",
              "set-cookie": `__Host-atlas_oauth=${encodeURIComponent(browserBinding)}; Path=/; HttpOnly; Secure; SameSite=Lax`,
            },
          })
        : Response.json({ kind: "unavailable" }, { status: 503 });
    },
    callback: async (request: Request) => {
      if (security) {
        const admitted = await security.admit("oauth_callback", request);
        if (admitted !== "accepted") {
          await security.auditOutcome("oauth_callback", admitted, request);
          return Response.json(
            { kind: admitted === "rate_limited" ? "accepted" : "unavailable" },
            { status: admitted === "rate_limited" ? 202 : 503 },
          );
        }
      }
      const url = new URL(request.url);
      const result = await adapter.callback({
        state: url.searchParams.get("state") ?? "",
        code: url.searchParams.get("code") ?? "",
        browserBinding: requestCookie(request, "__Host-atlas_oauth"),
      });
      await security?.auditOutcome("oauth_callback", result.kind, request);
      if (result.kind === "authenticated") {
        const headers = new Headers({ "cache-control": "no-store" });
        if (!csrfSecret) return Response.json({ kind: "unavailable" }, { status: 503 });
        for (const value of createSessionCookieHeaders(result.handle, csrfSecret))
          headers.append("set-cookie", value);
        headers.append(
          "set-cookie",
          "__Host-atlas_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        );
        return new Response(null, { status: 204, headers });
      }
      return Response.json(
        { kind: result.kind === "unavailable" ? "unavailable" : "accepted" },
        {
          status: result.kind === "unavailable" ? 503 : result.kind === "manual_review" ? 202 : 403,
        },
      );
    },
    issueInvitation: async (_request: Request) => {
      const result = await adapter.issueInvitation();
      return result.kind === "issued"
        ? Response.json(
            { id: result.id, proof: result.proof },
            { status: 202, headers: { "cache-control": "no-store" } },
          )
        : Response.json(
            { kind: result.kind === "unavailable" ? "unavailable" : "denied" },
            { status: result.kind === "unavailable" ? 503 : 403 },
          );
    },
  };
}

function configuredDurableAdapter(): DurableHttpAdapter | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !process.env.AUTH_CANONICAL_ORIGIN) return undefined;
  const sql = createPostgresAuthSql(databaseUrl);
  const sessions = new PostgresAuthControlPlaneRepository(sql);
  const durable = new PostgresAuthSessionInvitationRepository(sql);
  return {
    sessions: {
      list: async (handle) =>
        (await durable.listAndTouchSessions(canonicalSessionHandleDigest(handle), new Date())).map(
          (row) => ({ id: row.id, createdAt: row.created_at, current: row.is_current }),
        ),
      rotate: async (handle) => {
        const now = new Date();
        const next = createOpaqueValue();
        const result = await sessions.rotateSession({
          handleDigest: canonicalSessionHandleDigest(handle),
          next: {
            id: createOpaqueValue(),
            handleDigest: canonicalSessionHandleDigest(next),
            idleExpiresAt: new Date(now.getTime() + 30 * 60_000),
          },
          now,
        });
        return result === "rotated"
          ? { kind: "rotated" as const, handle: next }
          : { kind: "family_revoked" as const };
      },
      revokeCurrent: async (handle) => ({
        kind: (await sessions.revokeByHandleDigest(
          canonicalSessionHandleDigest(handle),
          new Date(),
        ))
          ? ("revoked" as const)
          : ("denied" as const),
      }),
      revokeOthers: async (handle) => ({
        kind: (await sessions.revokeOthersByHandleDigest(
          canonicalSessionHandleDigest(handle),
          new Date(),
        ))
          ? ("revoked" as const)
          : ("denied" as const),
      }),
    },
    invitations: {
      accept: async (input) =>
        durable.consume({
          id: input.id,
          proofDigest: digestOpaqueProof(input.proof),
          sessionHandleDigest: canonicalSessionHandleDigest(input.sessionHandle),
          now: new Date(),
        }),
    },
  };
}

export function createAuthSessionPageLoader(
  loadAdapter: () =>
    | Promise<
        | { readonly sessions: { list(handle: string): Promise<readonly ActiveAuthSession[]> } }
        | undefined
      >
    | { readonly sessions: { list(handle: string): Promise<readonly ActiveAuthSession[]> } }
    | undefined,
) {
  return async (handle: string): Promise<readonly ActiveAuthSession[]> => {
    if (!handle) return [];
    try {
      return (await loadAdapter())?.sessions.list(handle) ?? [];
    } catch {
      return [];
    }
  };
}
export const loadConfiguredAuthSessions = createAuthSessionPageLoader(configuredDurableAdapter);

function configuredOAuthAdapter(): DefaultOAuthAdapter {
  return createDefaultOAuthAdapter(
    process.env,
    createConfiguredOAuthDependencies(process.env) ?? {},
  );
}

export function createAuthEntryPoints(
  loadAdapter: () => Promise<DurableHttpAdapter | undefined> | DurableHttpAdapter | undefined,
  csrfSecret = process.env.AUTH_SESSION_CSRF_SECRET ?? "",
  canonicalOrigin = process.env.AUTH_CANONICAL_ORIGIN ?? "",
  controlPlane: ServerAuthControlPlane | undefined = configuredControlPlane(),
) {
  const durableSecurity = { canonicalOrigin, auditOutcome: controlPlane?.auditOutcome };
  return {
    get: async (request: Request) => {
      if (new URL(request.url).pathname.endsWith("/sessions")) {
        const adapter = await loadAdapter();
        return adapter
          ? createDurableAuthHttpFactory(adapter, csrfSecret, durableSecurity).sessions(request)
          : Response.json({ kind: "unavailable" }, { status: 503 });
      }
      return authGet(request);
    },
    post: async (request: Request) => {
      const url = new URL(request.url);
      if (
        url.pathname.endsWith("/sessions") &&
        request.headers.get("x-atlas-session-action") === "rotate"
      ) {
        const adapter = await loadAdapter();
        return adapter
          ? createDurableAuthHttpFactory(adapter, csrfSecret, durableSecurity).rotate(request)
          : Response.json({ kind: "unavailable" }, { status: 503 });
      }
      if (url.pathname.includes("/invitations/accept")) {
        const adapter = await loadAdapter();
        return adapter
          ? createDurableAuthHttpFactory(adapter, csrfSecret, durableSecurity).acceptInvitation(
              request,
            )
          : Response.json({ kind: "unavailable" }, { status: 503 });
      }
      return authPost(request);
    },
  };
}

const routeCommand = (pathname: string): AuthCommand =>
  pathname.includes("register")
    ? "register"
    : pathname.includes("logout")
      ? "logout"
      : pathname.includes("verify")
        ? "verify"
        : pathname.includes("reset")
          ? "reset"
          : pathname.includes("recovery")
            ? "recovery"
            : pathname.includes("sessions")
              ? "sessions"
              : pathname.includes("step-up")
                ? "step_up"
                : pathname.includes("oauth/google/start")
                  ? "oauth_start"
                  : pathname.includes("oauth/google/callback")
                    ? "oauth_callback"
                    : "login";

export function createConfiguredAuthControlPlane(
  environment: Record<string, string | undefined>,
  dependencies: { readonly sql?: AuthSql } = {},
): ServerAuthControlPlane | undefined {
  const databaseUrl = environment.DATABASE_URL;
  const hmacKey = environment.AUTH_CONTROL_HMAC_KEY;
  if (!databaseUrl || !hmacKey || !environment.AUTH_CANONICAL_ORIGIN) return undefined;
  const sql = dependencies.sql ?? createPostgresAuthSql(databaseUrl);
  const sessions = new PostgresAuthControlPlaneRepository(sql);
  const controls = new PostgresDurableAuthControlsRepository(sql);
  const digest = (purpose: string, value: string) =>
    createHmac("sha256", hmacKey).update(`${purpose}\u0000${value}`, "utf8").digest("base64url");
  const profiles: Record<
    AuthCommand,
    { readonly threshold: number; readonly windowSeconds: number }
  > = {
    register: { threshold: 5, windowSeconds: 900 },
    login: { threshold: 10, windowSeconds: 60 },
    logout: { threshold: 20, windowSeconds: 60 },
    verify: { threshold: 8, windowSeconds: 600 },
    recovery: { threshold: 5, windowSeconds: 900 },
    reset: { threshold: 5, windowSeconds: 900 },
    sessions: { threshold: 20, windowSeconds: 60 },
    step_up: { threshold: 5, windowSeconds: 300 },
    oauth_start: { threshold: 20, windowSeconds: 60 },
    oauth_callback: { threshold: 20, windowSeconds: 60 },
  };
  const notification = (
    purpose: AuthCommand,
    enabled: boolean,
    eventKey: string,
    ownerKeyDigest: string,
  ) => {
    if (!enabled) return undefined;
    const channel =
      purpose === "verify" || purpose === "step_up"
        ? ("otp" as const)
        : purpose === "login"
          ? ("security_alert" as const)
          : ("email" as const);
    return {
      commandId: digest("outbox_command", eventKey),
      purpose:
        purpose === "recovery"
          ? "recovery_email"
          : purpose === "register"
            ? "verification_email"
            : purpose === "login"
              ? "login_security_alert"
              : "auth_otp",
      channel,
      idempotencyKey: digest("outbox_idempotency", eventKey),
      payload: { ownerKeyDigest, action: purpose },
    };
  };
  return {
    admit: async (input) => {
      const eventKey = digest("audit_event", `${input.purpose}:${input.requestId}`);
      let riskKeyDigests: readonly string[];
      try {
        riskKeyDigests = buildAuthRiskKeyDigests(hmacKey, input.purpose, input.risk);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "AUTH_RISK_DIMENSION_REQUIRED")
          throw error;
        try {
          await controls.appendAudit({
            eventKey,
            eventName: `${input.purpose}_admission`,
            outcome: "rate_limited",
            correlationId: input.requestId,
            metadata: { outcome: "rate_limited", reasonCode: "missing_risk_dimension" },
            now: input.now,
          });
        } catch {
          /* Admission remains denied if audit storage is unavailable. */
        }
        return { kind: "rate_limited" as const };
      }
      const providerEnabled =
        input.purpose === "verify" || input.purpose === "step_up"
          ? environment.AUTH_OTP_PROVIDER_ENABLED === "true"
          : input.purpose === "login"
            ? environment.AUTH_SECURITY_ALERT_PROVIDER_ENABLED === "true"
            : environment.AUTH_EMAIL_PROVIDER_ENABLED === "true";
      const primaryRiskKeyDigest = riskKeyDigests[0];
      if (!primaryRiskKeyDigest) throw new Error("AUTH_RISK_DIMENSION_REQUIRED");
      const result = await controls.admitAndEnqueue({
        action: input.purpose,
        riskKeyDigests,
        ...profiles[input.purpose],
        eventKey,
        correlationId: input.requestId,
        metadata: { riskClass: "multi_key" },
        outbox: notification(input.purpose, providerEnabled, eventKey, primaryRiskKeyDigest),
        now: input.now,
      });
      return result;
    },
    auditOutcome: async (input) => {
      await controls.appendAudit({
        eventKey: digest("audit_event", `${input.purpose}:outcome:${input.requestId}`),
        eventName: `${input.purpose}_outcome`,
        outcome: input.outcome,
        correlationId: input.requestId,
        metadata: { outcome: input.outcome },
        now: input.now,
      });
    },
    revokeCurrent: async (input) => ({
      kind: (await sessions.revokeByHandleDigest(
        canonicalSessionHandleDigest(input.sessionHandle),
        input.now,
      ))
        ? "revoked"
        : "denied",
    }),
    revokeOthers: async (input) => ({
      kind: (await sessions.revokeOthersByHandleDigest(
        canonicalSessionHandleDigest(input.sessionHandle),
        input.now,
      ))
        ? "revoked"
        : "denied",
    }),
  };
}

function configuredControlPlane(): ServerAuthControlPlane | undefined {
  return createConfiguredAuthControlPlane(process.env);
}

function configuredRuntime() {
  return createServerAuthRuntime({
    canonicalOrigin: process.env.AUTH_CANONICAL_ORIGIN ?? "https://invalid.local",
    csrfSecret: process.env.AUTH_SESSION_CSRF_SECRET,
    trustProxyHeaders: process.env.AUTH_TRUST_PROXY_HEADERS === "true",
    controlPlane: configuredControlPlane(),
    emailAuth: createConfiguredEmailAuth(process.env),
  });
}

function configuredOAuthEntryPoints() {
  const runtime = configuredRuntime();
  return createOAuthInvitationEntryPoints(configuredOAuthAdapter(), {
    csrfSecret: process.env.AUTH_SESSION_CSRF_SECRET,
    security: {
      admit: async (command, request) => (await runtime.admit(command, request)).kind,
      auditOutcome: runtime.auditOutcome,
    },
  });
}

export function createAuthRouteHandler(
  runtime: ReturnType<typeof createServerAuthRuntime>,
  command: AuthCommand,
) {
  return async (request: Request): Promise<Response> => {
    return runtime.handle(command, request);
  };
}

export function isPublicAuthPath(pathname: string): boolean {
  return [
    "/client/sign-in",
    "/client/register",
    "/client/verify-email",
    "/client/recovery",
    "/client/reset-password",
  ].includes(pathname);
}

export async function authPost(request: Request): Promise<Response> {
  if (new URL(request.url).pathname.endsWith("/oauth/google/start"))
    return configuredOAuthEntryPoints().start(request);
  if (
    new URL(request.url).pathname.endsWith("/sessions") &&
    request.headers.get("x-atlas-session-action") === "rotate"
  )
    return createAuthEntryPoints(configuredDurableAdapter).post(request);
  if (new URL(request.url).pathname.includes("/invitations/accept"))
    return createAuthEntryPoints(configuredDurableAdapter).post(request);
  return createAuthRouteHandler(
    configuredRuntime(),
    routeCommand(new URL(request.url).pathname),
  )(request);
}

export async function authGet(request?: Request): Promise<Response> {
  if (request && new URL(request.url).pathname.endsWith("/sessions"))
    return createAuthEntryPoints(configuredDurableAdapter).get(request);
  if (request && new URL(request.url).pathname.endsWith("/oauth/google/callback"))
    return configuredOAuthEntryPoints().callback(request);
  if (request)
    return createAuthRouteHandler(
      configuredRuntime(),
      routeCommand(new URL(request.url).pathname),
    )(request);
  const result = { status: 503, body: { kind: "unavailable" as const } };
  return Response.json(result.body, {
    status: result.status,
    headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" },
  });
}
