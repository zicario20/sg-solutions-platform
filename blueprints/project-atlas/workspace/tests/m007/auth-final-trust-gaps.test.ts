import { describe, expect, it } from "vitest";
import {
  createDurableInvitationService,
  createPersistentOAuthAccountService,
  deriveSessionCsrfToken,
  digestOpaqueProof,
} from "../../packages/auth/src/index.ts";
import {
  PostgresAuthIdentityRepository,
  PostgresAuthControlPlaneRepository,
  PostgresDurableAuthControlsRepository,
  PostgresOAuthTransactionRepository,
  PostgresAuthSessionInvitationRepository,
  type AuthSql,
} from "../../packages/database/src/index.ts";
import {
  buildAuthRiskKeyDigests,
  canonicalSessionHandleDigest,
  createConfiguredOAuthDependencies,
  createSessionCookieHeaders,
} from "../../apps/app/src/lib/auth/http.ts";

class FakeSql implements AuthSql {
  readonly statements: string[] = [];
  readonly parameters: readonly unknown[][] = [];

  async begin<T>(callback: (transaction: { unsafe<R>(query: string, parameters?: readonly unknown[]): Promise<R> }) => Promise<T>): Promise<T> {
    return callback({
      unsafe: async <R>(query: string, parameters: readonly unknown[] = []): Promise<R> => {
        this.statements.push(query.replace(/\s+/gu, " ").trim());
        this.parameters.push(parameters);
        if (query.includes("atlas_auth_rotate_session")) return [{ outcome: "rotated" }] as R;
        if (query.includes("atlas_auth_revoke_current") || query.includes("atlas_auth_revoke_others")) return [{ revoked: true }] as R;
        if (query.includes("atlas_auth_consume_oauth_transaction")) return [{ outcome: "consumed" }] as R;
        if (query.includes("atlas_auth_authenticate_identity")) return [{ kind: "authenticated", account_id: "account-1" }] as R;
        if (query.includes("atlas_auth_consume_invitation")) return [{ outcome: "consumed" }] as R;
        if (query.includes("atlas_auth_append_audit")) return [{ appended: true }] as R;
        if (query.includes("atlas_auth_admit_and_enqueue")) return [{ allowed: true }] as R;
        if (query.includes("atlas_auth_lease_outbox")) return [] as R;
        if (query.includes("update auth_transactions")) return [{ id: "transaction-1" }] as R;
        if (query.includes("select id, provider_subject")) return [{ id: "evidence-1", provider_subject: "subject-1" }] as R;
        if (query.includes("select id, resolution")) return [{ id: "crm-1", resolution: "linked", relationship_receipt: "receipt-1" }] as R;
        if (query.includes("insert into auth_accounts")) return [{ id: "account-1", status: "active" }] as R;
        if (query.includes("insert into auth_external_identities")) return [{ id: "external-1", account_id: "account-1" }] as R;
        if (query.includes("returning id")) return [{ id: "row-1" }] as R;
        if (query.includes("atlas_auth_admit_risk_keys")) return [{ allowed: true }] as R;
        return [] as R;
      },
    });
  }
}

const now = new Date("2026-08-21T12:00:00.000Z");

describe("AR-001 canonical session and CSRF lifecycle", () => {
  it("uses the same raw-to-digest mapping for OAuth creation and control-plane lookup", async () => {
    let storedDigest = "";
    const service = createPersistentOAuthAccountService({
      issuer: "https://issuer.example",
      audience: "atlas",
      resolveCrm: async () => ({ kind: "linked", partyId: "party-1", relationshipReceipt: "receipt-1" }),
      repository: {
        storeSupabaseEvidence: async () => undefined,
        storeCrmEvidence: async () => undefined,
        authenticate: async (input) => {
          storedDigest = input.session.handleDigest;
          return { kind: "authenticated", accountId: "account-1" };
        },
      },
    }, () => now);

    const result = await service.authenticate({
      provider: "google",
      issuer: "https://issuer.example",
      audience: "atlas",
      subject: "subject-1",
      emailVerified: true,
      expiresAt: now.getTime() + 60_000,
      transactionId: "provider-transaction-1",
    });

    expect(result.kind).toBe("authenticated");
    if (result.kind !== "authenticated") throw new Error("expected authenticated result");
    expect(storedDigest).toBe(digestOpaqueProof(result.handle));
    expect(canonicalSessionHandleDigest(result.handle)).toBe(storedDigest);
  });

  it("emits a session-bound readable CSRF cookie beside the HttpOnly auth cookie", () => {
    const headers = createSessionCookieHeaders("raw-session-handle", "csrf-secret-at-least-32-bytes-long");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toContain("__Host-atlas_auth=raw-session-handle");
    expect(headers[0]).toContain("HttpOnly");
    expect(headers[1]).toContain(`__Host-atlas_csrf=${deriveSessionCsrfToken("csrf-secret-at-least-32-bytes-long", "raw-session-handle")}`);
    expect(headers[1]).not.toContain("HttpOnly");
    expect(headers[1]).toContain("Secure");
    expect(headers[1]).toContain("SameSite=Strict");
  });
});

describe("AR-002 and AR-005 restricted PostgreSQL repositories", () => {
  it("uses narrow OAuth and identity functions instead of direct table DML", async () => {
    const sql = new FakeSql();
    const oauth = new PostgresOAuthTransactionRepository(sql);
    await oauth.issue({ id: "transaction-1", purpose: "sign_in", provider: "google", stateDigest: "s".repeat(32), nonceDigest: "n".repeat(32), pkceVerifierDigest: "p".repeat(32), browserBindingDigest: "b".repeat(32), redirectHash: "r".repeat(32), returnIntent: "/client", callbackUrl: "https://app.example/api/auth/oauth/google/callback", expiresAt: new Date(now.getTime() + 60_000), now });
    await oauth.consume({ stateDigest: "s".repeat(32), nonceDigest: "n".repeat(32), pkceVerifierDigest: "p".repeat(32), browserBindingDigest: "b".repeat(32), redirectHash: "r".repeat(32), now });

    const identities = new PostgresAuthIdentityRepository(sql);
    await identities.storeSupabaseEvidence({ id: "evidence-1", identity: { provider: "google", issuer: "https://issuer.example", audience: "atlas", subject: "subject-1", emailVerified: true, expiresAt: now.getTime() + 60_000, transactionId: "provider-transaction-1" }, verifiedAt: now });
    await identities.storeCrmEvidence({ id: "crm-1", supabaseEvidenceId: "evidence-1", resolution: { kind: "linked", partyId: "party-1", relationshipReceipt: "receipt-1" }, verifiedAt: now, expiresAt: new Date(now.getTime() + 60_000) });
    await identities.authenticate({ supabaseEvidenceId: "evidence-1", crmEvidenceId: "crm-1", expectedIssuer: "https://issuer.example", expectedAudience: "atlas", accountId: "account-1", externalIdentityId: "external-1", partyLinkId: "party-link-1", conflictId: "conflict-1", session: { id: "session-1", handleDigest: "h".repeat(32), familyId: "family-1", assurance: "aal1", idleExpiresAt: new Date(now.getTime() + 30_000), absoluteExpiresAt: new Date(now.getTime() + 60_000) }, now });

    expect(sql.statements).toHaveLength(5);
    expect(sql.statements.every((statement) => /^select (?:\* from )?atlas_auth_/u.test(statement))).toBe(true);
    expect(sql.parameters[0]).toContain("r".repeat(32));
  });

  it("uses narrow session lifecycle functions for create, rotate and revoke", async () => {
    const sql = new FakeSql();
    const sessions = new PostgresAuthControlPlaneRepository(sql);
    const next = { id: "session-2", accountId: "", handleDigest: "n".repeat(32), familyId: "", generation: 0, assurance: "aal1" as const, idleExpiresAt: new Date(now.getTime() + 30_000), absoluteExpiresAt: new Date(now.getTime() + 60_000), now };
    await sessions.createSession({ ...next, id: "session-1", accountId: "account-1", handleDigest: "h".repeat(32), familyId: "family-1", generation: 1 });
    await sessions.rotateSession({ handleDigest: "h".repeat(32), next, now });
    await sessions.revokeByHandleDigest("n".repeat(32), now);
    await sessions.revokeOthersByHandleDigest("n".repeat(32), now);
    expect(sql.statements).toHaveLength(4);
    expect(sql.statements.every((statement) => /^select (?:\* from )?atlas_auth_/u.test(statement))).toBe(true);
  });

  it("uses narrow invitation, audit and outbox functions instead of direct table DML", async () => {
    const sql = new FakeSql();
    const invitations = new PostgresAuthSessionInvitationRepository(sql);
    await invitations.issue({ id: "invitation-1", proofDigest: "p".repeat(32), contactId: "contact-1", scope: "client", inviterAccountId: "account-1", expectedProviderSubject: "subject-1", expiresAt: new Date(now.getTime() + 60_000), now });
    await invitations.consume({ id: "invitation-1", proofDigest: "p".repeat(32), sessionHandleDigest: "s".repeat(32), now });

    const controls = new PostgresDurableAuthControlsRepository(sql);
    await controls.appendAudit({ eventKey: "event-key-0000001", eventName: "sign_in", outcome: "accepted", correlationId: "correlation-00001", metadata: { outcome: "accepted" }, now });
    await controls.admitAndEnqueue({ action: "sign_in", riskKeyDigests: ["a".repeat(32), "b".repeat(32)], threshold: 5, windowSeconds: 60, eventKey: "event-key-0000002", correlationId: "correlation-00002", metadata: { outcome: "attempted" }, now });
    await controls.lease({ owner: "worker-00000001", leasePurpose: "dispatch", limit: 5, now, leaseExpiresAt: new Date(now.getTime() + 30_000) });

    expect(sql.statements).toHaveLength(5);
    expect(sql.statements.every((statement) => /^select (?:\* from )?atlas_auth_/u.test(statement))).toBe(true);
  });
});

describe("AR-003 configured OAuth composition", () => {
  it("constructs concrete SQL, provider and CRM ports only from complete server configuration", () => {
    const calls: string[] = [];
    const factories = {
      createSql: (databaseUrl: string) => { calls.push(`sql:${databaseUrl}`); return new FakeSql(); },
      createProvider: () => { calls.push("provider"); return { verifyGoogle: async () => undefined }; },
      createCrm: () => { calls.push("crm"); return { resolve: async () => ({ kind: "unavailable" as const }) }; },
    };
    const complete = createConfiguredOAuthDependencies({
      DATABASE_URL: "postgres://database.example/atlas",
      SUPABASE_URL: "https://supabase.example",
      SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_AUTH_ISSUER: "https://issuer.example",
      SUPABASE_AUTH_AUDIENCE: "atlas",
      CRM_AUTH_RESOLUTION_URL: "https://crm.example/auth/resolve",
      CRM_AUTH_TOKEN: "crm-token",
      AUTH_SESSION_CSRF_SECRET: "csrf-secret-at-least-32-bytes-long",
    }, factories);

    expect(complete).toBeDefined();
    expect(calls).toEqual(["sql:postgres://database.example/atlas", "provider", "crm"]);
    expect(createConfiguredOAuthDependencies({ DATABASE_URL: "postgres://database.example/atlas" }, factories)).toBeUndefined();
  });
});

describe("AR-006 invitation subject binding", () => {
  it("fixes the expected provider subject at issue and consumes using only server session evidence", async () => {
    let issuedSubject = "";
    let consumed: Record<string, unknown> = {};
    const service = createDurableInvitationService({
      issue: async (input) => { issuedSubject = input.expectedProviderSubject; },
      consume: async (input) => { consumed = input; return { kind: "consumed" }; },
    }, () => now);

    const invitation = await service.issue({ contactId: "contact-1", scope: "client", inviterAccountId: "account-1", expectedProviderSubject: "subject-1" });
    await service.consume({ id: invitation.id, proof: invitation.proof, sessionHandle: "raw-session-handle" });

    expect(issuedSubject).toBe("subject-1");
    expect(consumed).toMatchObject({ id: invitation.id, sessionHandleDigest: digestOpaqueProof("raw-session-handle") });
    expect(consumed).not.toHaveProperty("contactId");
    expect(consumed).not.toHaveProperty("scope");
    expect(consumed).not.toHaveProperty("identityEvidenceId");
  });
});

describe("AR-007 nonshared risk dimensions", () => {
  it("omits absent dimensions while preserving all present risk keys", () => {
    const keys = buildAuthRiskKeyDigests("risk-secret-at-least-32-bytes-long", "login", {
      ip: "203.0.113.10",
      account: undefined,
      email: "person@example.com",
      phone: "",
      device: undefined,
    });
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
    expect(keys.every((key) => key.length >= 32)).toBe(true);
  });
});
