import { createDefaultOAuthAdapter, createOAuthInvitationEntryPoints } from "../../apps/app/src/lib/auth/http.ts";
import { type AuthSql, type AuthTransactionSql } from "@atlas/database";
import { describe, expect, it } from "vitest";

class FakeOAuthSql implements AuthSql {
  readonly statements: string[] = [];

  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    return callback({
      unsafe: async <R>(statement: string) => {
        this.statements.push(statement);
        if (statement.includes("update auth_transactions")) return [{ id: "oauth-transaction-1" }] as R;
        if (statement.includes("from auth_supabase_identity_evidence")) return [{ id: "supabase-evidence-1", provider_subject: "subject-1" }] as R;
        if (statement.includes("insert into auth_accounts")) return [{ id: "account-1", status: "active" }] as R;
        if (statement.includes("insert into auth_external_identities")) return [{ id: "external-1" }] as R;
        if (statement.includes("from auth_crm_party_evidence")) return [{ id: "crm-evidence-1", resolution: "linked", relationship_receipt: "crm-link-1" }] as R;
        return [] as R;
      },
    });
  }
}

describe("M007 default OAuth entrypoint wiring", () => {
  it("composes PostgreSQL evidence repositories and returns a session only after verified callback persistence", async () => {
    const sql = new FakeOAuthSql();
    const adapter = createDefaultOAuthAdapter({
      DATABASE_URL: "postgres://configured",
      AUTH_CANONICAL_ORIGIN: "https://portal.example",
      SUPABASE_OAUTH_ENABLED: "true",
      SUPABASE_ISSUER: "https://supabase.example/auth/v1",
      SUPABASE_AUDIENCE: "authenticated",
    }, {
      sql,
      provider: { verifyGoogle: async () => ({ issuer: "https://supabase.example/auth/v1", audience: "authenticated", subject: "subject-1", emailVerified: true, expiresAt: Date.now() + 60_000, transactionId: "provider-transaction-1", provider: "google" }) },
      crm: { resolve: async () => ({ kind: "linked", relationshipReceipt: "crm-link-1", partyId: "party-1" }) },
    });
    const routes = createOAuthInvitationEntryPoints(adapter);

    const started = await routes.start(new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST", headers: { origin: "https://portal.example" } }));
    const transaction = await started.json() as { state: string; nonce: string; pkceVerifier: string };
    const bindingCookie = started.headers.get("set-cookie") ?? "";
    const callback = await routes.callback(new Request(`https://portal.example/api/auth/oauth/google/callback?state=${transaction.state}&nonce=${transaction.nonce}&code_verifier=${transaction.pkceVerifier}`, { headers: { origin: "https://portal.example", cookie: bindingCookie } }));

    expect(started.status).toBe(202);
    expect(callback.status).toBe(204);
    expect(callback.headers.get("set-cookie")).toContain("__Host-atlas_auth=");
    expect(sql.statements.some((statement) => statement.includes("auth_supabase_identity_evidence"))).toBe(true);
    expect(sql.statements.some((statement) => statement.includes("auth_crm_party_evidence"))).toBe(true);
    expect(sql.statements.some((statement) => statement.includes("insert into auth_sessions"))).toBe(true);
  });

  it("fails closed with a neutral unavailable response when provider composition is missing", async () => {
    const adapter = createDefaultOAuthAdapter({ DATABASE_URL: "postgres://configured", AUTH_CANONICAL_ORIGIN: "https://portal.example", SUPABASE_OAUTH_ENABLED: "true", SUPABASE_ISSUER: "issuer", SUPABASE_AUDIENCE: "audience" }, { sql: new FakeOAuthSql() });
    const response = await createOAuthInvitationEntryPoints(adapter).start(new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST" }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ kind: "unavailable" });
  });
});
