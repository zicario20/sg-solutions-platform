import { existsSync, readFileSync } from "node:fs";
import {
  createServerEmailAuthService,
  deriveSessionCsrfToken,
  hmacIdentifier,
} from "../../packages/auth/src/index.ts";
import { PostgresAuthControlPlaneRepository } from "../../packages/database/src/index.ts";
import {
  buildAuthRiskKeyDigests,
  createConfiguredAuthControlPlane,
  createDurableAuthHttpFactory,
  createOAuthInvitationEntryPoints,
} from "../../apps/app/src/lib/auth/http.ts";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import {
  InvitationAcceptView,
  ResetPasswordView,
  VerifyEmailView,
} from "../../packages/ui/src/index.ts";
import { authCopy } from "../../packages/i18n/src/index.ts";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL("../../drizzle/0034_m007_cyber_neo_auth_remediation.sql", import.meta.url);
const migration = existsSync(migrationUrl) ? readFileSync(migrationUrl, "utf8") : "";
const auditMigrationUrl = new URL("../../drizzle/0035_m007_rate_audit_outcomes.sql", import.meta.url);
const auditMigration = existsSync(auditMigrationUrl) ? readFileSync(auditMigrationUrl, "utf8") : "";
const uiProps = { locale: "en" as const, copy: authCopy.en, csrf: "csrf-token" };

type ElementNode = { readonly type: unknown; readonly props: Record<string, unknown> & { readonly children?: unknown } };
const elements = (node: unknown, result: ElementNode[] = []): ElementNode[] => {
  if (Array.isArray(node)) { for (const child of node) elements(child, result); return result; }
  if (!node || typeof node !== "object" || !("type" in node) || !("props" in node)) return result;
  const element = node as ElementNode;
  if (typeof element.type === "function") return elements(element.type(element.props), result);
  result.push(element);
  elements(element.props.children, result);
  return result;
};

describe("M007 Cyber Neo remediation", () => {
  it("CN-001 denies a verified authority when the durable account cannot establish a session", async () => {
    const authority = { kind: "verified" as const, subject: "subject-1", emailVerified: true as const, accessToken: "provider-token" };
    const service = createServerEmailAuthService({
      provider: { signUp: async () => ({ kind: "accepted" }), signIn: async () => authority, sendVerification: async () => ({ kind: "accepted" }), requestRecovery: async () => ({ kind: "accepted" }), consumeVerification: async () => authority, consumeRecovery: async () => authority, updatePassword: async () => ({ kind: "accepted" }), logout: async () => undefined },
      repository: { consumeProviderToken: async () => true, establishSession: async () => ({ kind: "denied" as const }), loadProviderToken: async () => undefined, clearProviderToken: async () => undefined },
      sealProviderToken: (value) => value,
    });

    await expect(service.signIn({ email: "person@example.com", password: "long-password" })).resolves.toEqual({ kind: "accepted", internalOutcome: "denied" });
    expect(migration).toContain("status NOT IN ('active','pending_verification')");
    expect(migration).toContain("authentication_epoch=authentication_epoch+1");
  });

  it("CN-002 accepts invitations only by same-origin POST with session-bound CSRF", async () => {
    const accepted: string[] = [];
    const secret = "csrf-secret-at-least-32-bytes-long";
    const csrf = deriveSessionCsrfToken(secret, "session-handle");
    const handler = createDurableAuthHttpFactory({
      sessions: { list: async () => [], rotate: async () => ({ kind: "family_revoked" as const }), revokeCurrent: async () => ({ kind: "denied" as const }), revokeOthers: async () => ({ kind: "denied" as const }) },
      invitations: { accept: async (input) => { accepted.push(input.proof); return { kind: "consumed" as const }; } },
    }, secret, { canonicalOrigin: "https://portal.example" });
    const headers = { origin: "https://portal.example", cookie: `__Host-atlas_auth=session-handle; __Host-atlas_csrf=${csrf}`, "content-type": "application/x-www-form-urlencoded" };

    await expect(handler.acceptInvitation(new Request("https://portal.example/api/auth/invitations/accept", { method: "GET", headers }))).resolves.toMatchObject({ status: 403 });
    await expect(handler.acceptInvitation(new Request("https://portal.example/api/auth/invitations/accept", { method: "POST", headers: { ...headers, origin: "https://evil.example" }, body: `id=invite-1&code=invite-code&csrf=${csrf}` }))).resolves.toMatchObject({ status: 403 });
    await expect(handler.acceptInvitation(new Request("https://portal.example/api/auth/invitations/accept", { method: "POST", headers, body: `id=invite-1&code=invite-code&csrf=${csrf}` }))).resolves.toMatchObject({ status: 202 });
    expect(accepted).toEqual(["invite-code"]);
  });

  it("CN-003 admits any non-empty set of one to five present risk dimensions", () => {
    const keys = buildAuthRiskKeyDigests("risk-secret-at-least-32-bytes-long", "login", { ip: undefined, account: undefined, email: "person@example.com", phone: "", device: undefined });
    expect(keys).toHaveLength(1);
    expect(migration).toContain("cardinality(p_keys)<1 OR cardinality(p_keys)>5");
    expect(migration).not.toContain("cardinality(p_keys) <> 5");
  });

  it("CN-003 fails closed with a neutral response when no trusted risk dimension exists", async () => {
    const queries: { statement: string; parameters: readonly unknown[] }[] = [];
    const sql = { begin: async (callback: (transaction: { unsafe: <T>(statement: string, parameters?: readonly unknown[]) => Promise<T> }) => Promise<unknown>) => callback({ unsafe: async <T>(statement: string, parameters: readonly unknown[] = []) => { queries.push({ statement, parameters }); return statement.includes("append_audit") ? [{ appended: true }] as T : [{ allowed: true }] as T; } }) };
    const controlPlane = createConfiguredAuthControlPlane({ DATABASE_URL: "postgres://db", AUTH_CONTROL_HMAC_KEY: "risk-secret-at-least-32-bytes-long", AUTH_CANONICAL_ORIGIN: "https://portal.example" }, { sql });
    if (!controlPlane) throw new Error("expected configured control plane");
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", trustProxyHeaders: false, controlPlane });
    let starts = 0;
    const routes = createOAuthInvitationEntryPoints({ start: async () => { starts += 1; return { kind: "redirect" as const, location: "https://provider.example/authorize" }; }, callback: async () => ({ kind: "denied" as const }), issueInvitation: async () => ({ kind: "unavailable" as const }) }, { security: { admit: async (command, request) => (await runtime.admit(command, request)).kind, auditOutcome: runtime.auditOutcome } });

    const response = await routes.start(new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST", headers: { "x-forwarded-for": "203.0.113.8", "x-request-id": "zero-risk-request" } }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ kind: "accepted" });
    expect(starts).toBe(0);
    expect(queries.some((query) => query.statement.includes("admit_and_enqueue"))).toBe(false);
    expect(queries.some((query) => query.statement.includes("append_audit") && query.parameters.includes("rate_limited"))).toBe(true);
  });

  it("CN-003 derives a flow-specific rate key from verification and reset codes", async () => {
    const admissions: readonly unknown[][] = [];
    const sql = { begin: async (callback: (transaction: { unsafe: <T>(statement: string, parameters?: readonly unknown[]) => Promise<T> }) => Promise<unknown>) => callback({ unsafe: async <T>(statement: string, parameters: readonly unknown[] = []) => { if (statement.includes("admit_and_enqueue")) (admissions as unknown[][]).push(parameters); return [{ allowed: true }] as T; } }) };
    const controlPlane = createConfiguredAuthControlPlane({ DATABASE_URL: "postgres://db", AUTH_CONTROL_HMAC_KEY: "risk-secret-at-least-32-bytes-long", AUTH_CANONICAL_ORIGIN: "https://portal.example" }, { sql });
    if (!controlPlane) throw new Error("expected configured control plane");
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", controlPlane });
    const request = (path: string, code: string) => new Request(`https://portal.example/api/auth/${path}`, { method: "POST", headers: { origin: "https://portal.example", "content-type": "application/x-www-form-urlencoded" }, body: `code=${code}` });

    await expect(runtime.admit("verify", request("verify", "verify-code"))).resolves.toEqual({ kind: "accepted" });
    await expect(runtime.admit("reset", request("reset", "reset-code"))).resolves.toEqual({ kind: "accepted" });
    expect(admissions).toHaveLength(2);
    expect(admissions.every((parameters) => Array.isArray(parameters[1]) && parameters[1].length === 1)).toBe(true);
    expect(admissions[0]?.[1]).not.toEqual(admissions[1]?.[1]);
  });

  it("CN-004 separates identical dimensions across authentication actions", () => {
    const secret = "risk-secret-at-least-32-bytes-long";
    const dimensions = { ip: undefined, account: undefined, email: "person@example.com", phone: undefined, device: undefined };
    const login = buildAuthRiskKeyDigests(secret, "login", dimensions);
    const recovery = buildAuthRiskKeyDigests(secret, "recovery", dimensions);
    expect(login).toEqual([hmacIdentifier(secret, "login:email", "person@example.com")]);
    expect(recovery).not.toEqual(login);
  });

  it("CN-005 rotates with five SQL arguments and derives the original absolute expiry", async () => {
    let statement = ""; let parameters: readonly unknown[] = [];
    const repository = new PostgresAuthControlPlaneRepository({ begin: async (callback) => callback({ unsafe: async <T>(query: string, values: readonly unknown[] = []) => { statement = query; parameters = values; return [{ outcome: "rotated" }] as T; } }) });
    await repository.rotateSession({ handleDigest: "current-digest", next: { id: "next-session", handleDigest: "next-digest", idleExpiresAt: new Date("2026-08-21T12:30:00Z") }, now: new Date("2026-08-21T12:00:00Z") });
    expect(statement).toContain("atlas_auth_rotate_session($1,$2,$3,$4,$5)");
    expect(parameters).toHaveLength(5);
    expect(migration).toContain("current_row.absolute_expires_at");
    expect(migration).toContain("v_account_status NOT IN ('active','pending_verification')");
  });

  it("CN-006 renders user-entered POST codes and never reflects URL proofs", () => {
    const invitation = InvitationAcceptView({ ...uiProps, invitation: { id: "raw-id", proof: "raw-proof", contactId: "raw-contact", scope: "raw-scope", identityEvidenceId: "raw-evidence" } } as never);
    const names = [ResetPasswordView(uiProps as never), VerifyEmailView(uiProps as never), invitation].flatMap((view) => elements(view).filter((node) => node.type === "input").map((node) => node.props.name));
    expect(names.filter((name) => name === "code")).toHaveLength(3);
    expect(names).not.toContain("proof");
    for (const page of ["reset-password", "verify-email", "invitations/accept"]) {
      const source = readFileSync(new URL(`../../apps/app/src/app/client/${page}/page.tsx`, import.meta.url), "utf8");
      expect(source).not.toMatch(/proof|token_hash|contact_id|identity_evidence_id/u);
    }
  });

  it("CN-007 appends final outcomes for email authentication and authenticated mutations", async () => {
    const audited: string[] = [];
    const secret = "csrf-secret-at-least-32-bytes-long";
    const csrf = deriveSessionCsrfToken(secret, "session-handle");
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", csrfSecret: secret, controlPlane: {
      admit: async () => ({ kind: "accepted" as const }),
      auditOutcome: async (input) => { audited.push(`${input.purpose}:${input.outcome}`); },
      revokeCurrent: async () => ({ kind: "revoked" as const }),
      revokeOthers: async () => ({ kind: "revoked" as const }),
    }, emailAuth: { signUp: async () => ({ kind: "accepted", internalOutcome: "accepted" }), signIn: async () => ({ kind: "accepted", internalOutcome: "accepted" }), sendVerification: async () => ({ kind: "accepted", internalOutcome: "accepted" }), consumeVerification: async () => ({ kind: "accepted", internalOutcome: "accepted" }), requestRecovery: async () => ({ kind: "accepted", internalOutcome: "accepted" }), consumeReset: async () => ({ kind: "accepted", internalOutcome: "accepted" }), logout: async () => undefined } });
    await runtime.handle("login", new Request("https://portal.example/api/auth/login", { method: "POST", headers: { origin: "https://portal.example", "content-type": "application/x-www-form-urlencoded", "x-request-id": "request-login-0001" }, body: "email=person%40example.com&password=password" }));
    await runtime.handle("logout", new Request("https://portal.example/api/auth/logout", { method: "POST", headers: { origin: "https://portal.example", cookie: `__Host-atlas_auth=session-handle; __Host-atlas_csrf=${csrf}`, "content-type": "application/x-www-form-urlencoded", "x-request-id": "request-logout-0001" }, body: `csrf=${csrf}` }));
    expect(audited).toEqual(["login:accepted", "logout:revoked"]);
  });

  it("CN-007 keeps public responses neutral while auditing every internal provider outcome", async () => {
    const outcomes: string[] = [];
    const repository = { consumeProviderToken: async () => true, establishSession: async () => ({ kind: "established" as const, accountId: "account-1" }), loadProviderToken: async () => undefined, clearProviderToken: async () => undefined };
    const providerBase = { signIn: async () => ({ kind: "denied" as const }), sendVerification: async () => ({ kind: "accepted" as const }), requestRecovery: async () => ({ kind: "accepted" as const }), consumeVerification: async () => ({ kind: "denied" as const }), consumeRecovery: async () => ({ kind: "denied" as const }), updatePassword: async () => ({ kind: "denied" as const }), logout: async () => undefined };
    const cases = [
      ["provider_denied", async () => ({ kind: "denied" as const })],
      ["provider_unavailable", async () => ({ kind: "unavailable" as const })],
      ["provider_error", async () => ({ kind: "invalid" as const })],
      ["provider_exception", async () => { throw new Error("provider failed"); }],
      ["accepted", async () => ({ kind: "accepted" as const })],
    ] as const;

    for (const [expectedOutcome, signUp] of cases) {
      const service = createServerEmailAuthService({ provider: { ...providerBase, signUp: signUp as never }, repository, sealProviderToken: (value) => value });
      const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", csrfSecret: "csrf-secret-at-least-32-bytes-long", controlPlane: { admit: async () => ({ kind: "accepted" as const }), auditOutcome: async (input) => { outcomes.push(input.outcome); }, revokeCurrent: async () => ({ kind: "denied" as const }), revokeOthers: async () => ({ kind: "denied" as const }) }, emailAuth: service });
      const response = await runtime.handle("register", new Request("https://portal.example/api/auth/register", { method: "POST", headers: { origin: "https://portal.example", "content-type": "application/x-www-form-urlencoded" }, body: "email=person%40example.com&password=long-password" }));
      expect(response.status).toBe(202);
      await expect(response.json()).resolves.toEqual({ kind: "accepted" });
      expect(outcomes.at(-1)).toBe(expectedOutcome);
    }

    const authority = { kind: "verified" as const, subject: "subject-1", emailVerified: true as const, accessToken: "provider-token" };
    const authenticated = createServerEmailAuthService({ provider: { ...providerBase, signUp: async () => ({ kind: "accepted" as const }), signIn: async () => authority }, repository, sealProviderToken: (value) => value });
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", csrfSecret: "csrf-secret-at-least-32-bytes-long", controlPlane: { admit: async () => ({ kind: "accepted" as const }), auditOutcome: async (input) => { outcomes.push(input.outcome); }, revokeCurrent: async () => ({ kind: "denied" as const }), revokeOthers: async () => ({ kind: "denied" as const }) }, emailAuth: authenticated });
    const success = await runtime.handle("login", new Request("https://portal.example/api/auth/login", { method: "POST", headers: { origin: "https://portal.example", "content-type": "application/x-www-form-urlencoded" }, body: "email=person%40example.com&password=long-password" }));
    expect(success.status).toBe(204);
    expect(outcomes.at(-1)).toBe("succeeded");
    expect(auditMigration).toContain("provider_denied");
    expect(auditMigration).toContain("provider_unavailable");
    expect(auditMigration).toContain("provider_error");
    expect(auditMigration).toContain("provider_exception");
  });

  it("CN-008 turns every CRM receipt ownership collision into manual review before session insertion", () => {
    const ownershipCheck = migration.indexOf("v_party_account<>v_account OR v_party_state<>'active'");
    const manualReview = migration.indexOf("'relationship_receipt_conflict'");
    const sessionInsert = migration.indexOf("INSERT INTO public.auth_sessions", manualReview);
    expect(ownershipCheck).toBeGreaterThan(-1);
    expect(manualReview).toBeGreaterThan(ownershipCheck);
    expect(sessionInsert).toBeGreaterThan(manualReview);
  });
});
