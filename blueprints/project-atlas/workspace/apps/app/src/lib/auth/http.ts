import {
  createDurableOAuthTransactionService,
  createOpaqueValue,
  createPersistentOAuthAccountService,
  digestOpaqueProof,
  type AuthCommand,
  type CrmPartyResolutionEvidence,
  type OfficialSupabaseIdentity,
} from "@atlas/auth";
import {
  PostgresAuthControlPlaneRepository,
  PostgresAuthIdentityRepository,
  PostgresAuthSessionInvitationRepository,
  PostgresOAuthTransactionRepository,
  type AuthSql,
} from "@atlas/database";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { createServerAuthRuntime, type ServerAuthControlPlane } from "./server-runtime.ts";

export type DefaultOAuthAdapter = {
  start(input?: { readonly browserBinding: string }): Promise<{ kind: "started"; state: string; nonce: string; pkceVerifier: string } | { kind: "unavailable" }>;
  callback(input: { readonly state: string; readonly nonce: string; readonly pkceVerifier: string; readonly browserBinding?: string }): Promise<{ kind: "authenticated"; handle: string } | { kind: "denied" | "manual_review" | "unavailable" }>;
  issueInvitation(): Promise<{ kind: "issued"; id: string; proof: string } | { kind: "denied" | "unavailable" }>;
};

export type DefaultOAuthDependencies = Readonly<{
  sql?: AuthSql;
  provider?: { verifyGoogle(input: { readonly state: string; readonly nonce: string; readonly pkceVerifier: string }): Promise<OfficialSupabaseIdentity | undefined> };
  crm?: { resolve(input: { readonly subject: string; readonly supabaseEvidenceId: string }): Promise<CrmPartyResolutionEvidence> };
}>;

const unavailableOAuthAdapter = (): DefaultOAuthAdapter => ({
  start: async () => ({ kind: "unavailable" }),
  callback: async () => ({ kind: "unavailable" }),
  issueInvitation: async () => ({ kind: "unavailable" }),
});

const isOAuthOverride = (candidate: DefaultOAuthAdapter | DefaultOAuthDependencies): candidate is DefaultOAuthAdapter =>
  "start" in candidate && typeof candidate.start === "function" && "callback" in candidate && typeof candidate.callback === "function";

export function createDefaultOAuthAdapter(
  env: Record<string, string | undefined>,
  dependenciesOrOverride: DefaultOAuthDependencies | DefaultOAuthAdapter = {},
): DefaultOAuthAdapter {
  const issuer = env.SUPABASE_ISSUER?.trim();
  const audience = env.SUPABASE_AUDIENCE?.trim();
  const canonicalOrigin = env.AUTH_CANONICAL_ORIGIN?.trim();
  const providerEnabled = env.SUPABASE_OAUTH_ENABLED === "true" && Boolean(issuer) && Boolean(audience);
  if (providerEnabled && isOAuthOverride(dependenciesOrOverride)) return dependenciesOrOverride;
  const enabled = providerEnabled && Boolean(env.DATABASE_URL) && Boolean(canonicalOrigin && /^https:\/\/[^/?#]+$/u.test(canonicalOrigin));
  if (!enabled || isOAuthOverride(dependenciesOrOverride)) return unavailableOAuthAdapter();
  const { sql, provider, crm } = dependenciesOrOverride;
  if (!sql || !provider || !crm || !issuer || !audience || !canonicalOrigin) return unavailableOAuthAdapter();

  const transactions = createDurableOAuthTransactionService(new PostgresOAuthTransactionRepository(sql));
  const accounts = createPersistentOAuthAccountService({ repository: new PostgresAuthIdentityRepository(sql), issuer, audience, resolveCrm: crm.resolve.bind(crm) });
  const callbackUrl = `${canonicalOrigin}/api/auth/oauth/google/callback`;
  return {
    async start(input) {
      if (!input?.browserBinding) return { kind: "unavailable" };
      const transaction = await transactions.begin({ provider: "google", purpose: "sign_in", callbackUrl, returnIntent: "/client", browserBinding: input.browserBinding });
      return { kind: "started", state: transaction.state, nonce: transaction.nonce, pkceVerifier: transaction.pkceVerifier };
    },
    async callback(input) {
      if (!input.browserBinding) return { kind: "denied" };
      const consumed = await transactions.consume({ ...input, browserBinding: input.browserBinding, callbackUrl });
      if (consumed.kind !== "consumed") return { kind: "denied" };
      const identity = await provider.verifyGoogle(input);
      if (!identity) return { kind: "denied" };
      const result = await accounts.authenticate(identity);
      return result.kind === "authenticated" ? { kind: "authenticated", handle: result.handle } : result;
    },
    issueInvitation: async () => ({ kind: "unavailable" }),
  };
}

type DurableHttpAdapter = { sessions: { list(handle: string): Promise<readonly { id: string }[]>; rotate(handle: string): Promise<{ kind: "rotated"; handle: string } | { kind: "family_revoked" }>; revokeCurrent(handle: string): Promise<{ kind: "revoked" | "denied" }>; revokeOthers(handle: string): Promise<{ kind: "revoked" | "denied" }> }; invitations: { accept(input: { id: string; proof: string; contactId: string; scope: string; identityEvidenceId: string }): Promise<{ kind: "consumed" | "manual_review" }> } };
const requestCookie = (request: Request, name: string) => request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const csrf = (request: Request) => { const value = requestCookie(request, "__Host-atlas_csrf"); return Boolean(value && value === request.headers.get("x-atlas-csrf")); };

export function createDurableAuthHttpFactory(adapter: DurableHttpAdapter) {
  return {
    sessions: async (request: Request) => { const handle = requestCookie(request, "__Host-atlas_auth"); if (!handle || !csrf(request)) return Response.json({ kind: "denied" }, { status: 403 }); return Response.json({ sessions: await adapter.sessions.list(handle) }, { status: 200, headers: { "cache-control": "private, no-store" } }); },
    rotate: async (request: Request) => { const handle = requestCookie(request, "__Host-atlas_auth"); if (!handle || !csrf(request)) return Response.json({ kind: "denied" }, { status: 403 }); const result = await adapter.sessions.rotate(handle); return result.kind === "rotated" ? new Response(null, { status: 204, headers: { "set-cookie": `__Host-atlas_auth=${encodeURIComponent(result.handle)}; Path=/; HttpOnly; Secure; SameSite=Lax` } }) : Response.json({ kind: "denied" }, { status: 403 }); },
    acceptInvitation: async (request: Request) => { const form = await request.formData(); const result = await adapter.invitations.accept({ id: String(form.get("id") ?? ""), proof: String(form.get("proof") ?? ""), contactId: String(form.get("contact_id") ?? ""), scope: String(form.get("scope") ?? ""), identityEvidenceId: String(form.get("identity_evidence_id") ?? "") }); return Response.json({ kind: "accepted" }, { status: result.kind === "consumed" ? 202 : 202 }); },
  };
}
type OAuthInvitationAdapter = DefaultOAuthAdapter;
export function createOAuthInvitationEntryPoints(adapter: OAuthInvitationAdapter) {
  return {
    start: async (request: Request) => {
      const browserBinding = requestCookie(request, "__Host-atlas_oauth") ?? createOpaqueValue();
      const result = await adapter.start({ browserBinding });
      return result.kind === "started"
        ? Response.json({ state: result.state, nonce: result.nonce, pkceVerifier: result.pkceVerifier }, { status: 202, headers: { "cache-control": "no-store", "set-cookie": `__Host-atlas_oauth=${encodeURIComponent(browserBinding)}; Path=/; HttpOnly; Secure; SameSite=Lax` } })
        : Response.json({ kind: "unavailable" }, { status: 503 });
    },
    callback: async (request: Request) => {
      const url = new URL(request.url);
      const result = await adapter.callback({ state: url.searchParams.get("state") ?? "", nonce: url.searchParams.get("nonce") ?? "", pkceVerifier: url.searchParams.get("code_verifier") ?? "", browserBinding: requestCookie(request, "__Host-atlas_oauth") });
      if (result.kind === "authenticated") {
        const headers = new Headers({ "cache-control": "no-store" });
        headers.append("set-cookie", `__Host-atlas_auth=${encodeURIComponent(result.handle)}; Path=/; HttpOnly; Secure; SameSite=Lax`);
        headers.append("set-cookie", "__Host-atlas_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
        return new Response(null, { status: 204, headers });
      }
      return Response.json({ kind: result.kind === "unavailable" ? "unavailable" : "accepted" }, { status: result.kind === "unavailable" ? 503 : result.kind === "manual_review" ? 202 : 403 });
    },
    issueInvitation: async (_request: Request) => { const result = await adapter.issueInvitation(); return result.kind === "issued" ? Response.json({ id: result.id, proof: result.proof }, { status: 202, headers: { "cache-control": "no-store" } }) : Response.json({ kind: result.kind === "unavailable" ? "unavailable" : "denied" }, { status: result.kind === "unavailable" ? 503 : 403 }); },
  };
}

function configuredDurableAdapter(): DurableHttpAdapter | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !process.env.AUTH_CANONICAL_ORIGIN) return undefined;
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1 }) as unknown as AuthSql;
  const sessions = new PostgresAuthControlPlaneRepository(sql); const durable = new PostgresAuthSessionInvitationRepository(sql);
  return { sessions: { list: async (handle) => (await durable.listAndTouchSessions(digestOpaqueProof(handle), new Date())).map((row) => ({ id: row.id })), rotate: async (handle) => { const now = new Date(); const next = createOpaqueValue(); const result = await sessions.rotateSession({ handleDigest: digestOpaqueProof(handle), next: { id: createOpaqueValue(), accountId: "", handleDigest: digestOpaqueProof(next), familyId: "", generation: 0, assurance: "aal1", now, idleExpiresAt: new Date(now.getTime() + 30 * 60_000), absoluteExpiresAt: new Date(now.getTime() + 8 * 60 * 60_000) }, now }); return result === "rotated" ? { kind: "rotated" as const, handle: next } : { kind: "family_revoked" as const }; }, revokeCurrent: async (handle) => ({ kind: await sessions.revokeByHandleDigest(digestOpaqueProof(handle), new Date()) ? "revoked" as const : "denied" as const }), revokeOthers: async (handle) => ({ kind: await sessions.revokeOthersByHandleDigest(digestOpaqueProof(handle), new Date()) ? "revoked" as const : "denied" as const }) }, invitations: { accept: async (input) => durable.acceptDurableInvitation({ id: input.id, proofDigest: digestOpaqueProof(input.proof), identityEvidenceId: input.identityEvidenceId, contactId: input.contactId, scope: input.scope, now: new Date() }) } };
}

function configuredOAuthAdapter(): DefaultOAuthAdapter {
  return createDefaultOAuthAdapter(process.env);
}

export function createAuthEntryPoints(loadAdapter: () => Promise<DurableHttpAdapter | undefined> | DurableHttpAdapter | undefined) {
  return { get: async (request: Request) => { if (new URL(request.url).pathname.endsWith("/sessions")) { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).sessions(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } return authGet(request); }, post: async (request: Request) => { const url = new URL(request.url); if (url.pathname.endsWith("/sessions") && request.headers.get("x-atlas-session-action") === "rotate") { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).rotate(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } if (url.pathname.includes("/invitations/accept")) { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).acceptInvitation(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } return authPost(request); } };
}

const routeCommand = (pathname: string): AuthCommand => pathname.includes("register") ? "register" : pathname.includes("logout") ? "logout" : pathname.includes("verify") ? "verify" : pathname.includes("reset") ? "reset" : pathname.includes("recovery") ? "recovery" : pathname.includes("sessions") ? "sessions" : pathname.includes("step-up") ? "step_up" : pathname.includes("oauth/google/start") ? "oauth_start" : pathname.includes("oauth/google/callback") ? "oauth_callback" : "login";

function configuredControlPlane(): ServerAuthControlPlane | undefined {
  const databaseUrl = process.env.DATABASE_URL; const hmacKey = process.env.AUTH_CONTROL_HMAC_KEY;
  if (!databaseUrl || !hmacKey || !process.env.AUTH_CANONICAL_ORIGIN) return undefined;
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1 });
  // The postgres driver has a richer generic result type; this port exposes only transactional unsafe queries.
  const repository = new PostgresAuthControlPlaneRepository(sql as unknown as AuthSql);
  const digest = (value: string) => createHash("sha256").update(`${hmacKey}\u0000${value}`, "utf8").digest("base64url");
  return {
    admit: async (input) => ({ kind: await repository.admit({ bucketDigest: digest(`${input.purpose}:${input.identifier}`), purpose: input.purpose, commandId: input.requestId, accountId: null, now: input.now }) }),
    revokeCurrent: async (input) => ({ kind: await repository.revokeByHandleDigest(digest(input.sessionHandle), input.now) ? "revoked" : "denied" }),
    revokeOthers: async (input) => ({ kind: await repository.revokeOthersByHandleDigest(digest(input.sessionHandle), input.now) ? "revoked" : "denied" }),
  };
}

function configuredRuntime() { return createServerAuthRuntime({ canonicalOrigin: process.env.AUTH_CANONICAL_ORIGIN ?? "https://invalid.local", controlPlane: configuredControlPlane() }); }

export function createAuthRouteHandler(runtime: ReturnType<typeof createServerAuthRuntime>, command: AuthCommand) {
  return async (request: Request): Promise<Response> => {
    return runtime.handle(command, request);
  };
}

export function isPublicAuthPath(pathname: string): boolean { return ["/client/sign-in", "/client/register", "/client/verify-email", "/client/recovery", "/client/reset-password"].includes(pathname); }

export async function authPost(request: Request): Promise<Response> {
  if (new URL(request.url).pathname.endsWith("/oauth/google/start")) return createOAuthInvitationEntryPoints(configuredOAuthAdapter()).start(request);
  if (new URL(request.url).pathname.endsWith("/sessions") && request.headers.get("x-atlas-session-action") === "rotate") return createAuthEntryPoints(configuredDurableAdapter).post(request);
  if (new URL(request.url).pathname.includes("/invitations/accept")) return createAuthEntryPoints(configuredDurableAdapter).post(request);
  return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
}

export async function authGet(request?: Request): Promise<Response> {
  if (request && new URL(request.url).pathname.endsWith("/sessions")) return createAuthEntryPoints(configuredDurableAdapter).get(request);
  if (request && new URL(request.url).pathname.endsWith("/oauth/google/callback")) return createOAuthInvitationEntryPoints(configuredOAuthAdapter()).callback(request);
  if (request) return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
  const result = { status: 503, body: { kind: "unavailable" as const } };
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
}
