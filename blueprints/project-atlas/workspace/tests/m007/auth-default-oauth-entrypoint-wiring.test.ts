import type { AuthSql, AuthTransactionSql } from "@atlas/database";
import { describe, expect, it } from "vitest";
import {
  createDefaultOAuthAdapter,
  createOAuthInvitationEntryPoints,
} from "../../apps/app/src/lib/auth/http.ts";

class FakeOAuthSql implements AuthSql {
  readonly statements: string[] = [];
  private nonceCiphertext = "";
  private pkceVerifierCiphertext = "";

  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    return callback({
      unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) => {
        this.statements.push(statement);
        if (statement.includes("atlas_auth_issue_oauth_transaction")) {
          this.nonceCiphertext = String(parameters[8]);
          this.pkceVerifierCiphertext = String(parameters[9]);
          return [] as R;
        }
        if (statement.includes("atlas_auth_load_oauth_transaction"))
          return [
            {
              nonce_ciphertext: this.nonceCiphertext,
              pkce_verifier_ciphertext: this.pkceVerifierCiphertext,
            },
          ] as R;
        if (statement.includes("atlas_auth_consume_oauth_transaction"))
          return [{ outcome: "consumed" }] as R;
        if (statement.includes("atlas_auth_authenticate_identity"))
          return [{ kind: "authenticated", account_id: "account-1" }] as R;
        return [] as R;
      },
    });
  }
}

describe("M007 default OAuth entrypoint wiring", () => {
  it("composes PostgreSQL evidence repositories and returns a session only after verified callback persistence", async () => {
    const sql = new FakeOAuthSql();
    const adapter = createDefaultOAuthAdapter(
      {
        DATABASE_URL: "postgres://configured",
        AUTH_CANONICAL_ORIGIN: "https://portal.example",
        SUPABASE_OAUTH_ENABLED: "true",
        SUPABASE_ISSUER: "https://supabase.example/auth/v1",
        SUPABASE_AUDIENCE: "authenticated",
        SUPABASE_URL: "https://supabase.example",
        AUTH_OAUTH_SECRET_KEY: "oauth-secret-at-least-32-characters-long",
      },
      {
        sql,
        provider: {
          authorizationUrl: ({ state }) =>
            `https://supabase.example/auth/v1/authorize?state=${state}`,
          exchangeAndVerify: async ({ code }) =>
            code === "code-1"
              ? {
                  issuer: "https://supabase.example/auth/v1",
                  audience: "authenticated",
                  subject: "subject-1",
                  emailVerified: true,
                  expiresAt: Date.now() + 60_000,
                  transactionId: "provider-transaction-1",
                  provider: "google",
                }
              : undefined,
        },
        crm: {
          resolve: async () => ({
            kind: "linked",
            relationshipReceipt: "crm-link-1",
            partyId: "party-1",
          }),
        },
      },
    );
    const routes = createOAuthInvitationEntryPoints(adapter, "csrf-secret-at-least-32-bytes-long");

    const started = await routes.start(
      new Request("https://portal.example/api/auth/oauth/google/start", {
        method: "POST",
        headers: { origin: "https://portal.example" },
      }),
    );
    const state =
      new URL(started.headers.get("location") ?? "https://invalid.example").searchParams.get(
        "state",
      ) ?? "";
    const bindingCookie = started.headers.get("set-cookie") ?? "";
    const callback = await routes.callback(
      new Request(
        `https://portal.example/api/auth/oauth/google/callback?state=${state}&code=code-1`,
        { headers: { origin: "https://portal.example", cookie: bindingCookie } },
      ),
    );

    expect(started.status).toBe(303);
    expect(callback.status).toBe(204);
    expect(callback.headers.get("set-cookie")).toContain("__Host-atlas_auth=");
    expect(
      sql.statements.some((statement) => statement.includes("atlas_auth_store_supabase_evidence")),
    ).toBe(true);
    expect(
      sql.statements.some((statement) => statement.includes("atlas_auth_store_crm_evidence")),
    ).toBe(true);
    expect(
      sql.statements.some((statement) => statement.includes("atlas_auth_authenticate_identity")),
    ).toBe(true);
  });

  it("fails closed with a neutral unavailable response when provider composition is missing", async () => {
    const adapter = createDefaultOAuthAdapter(
      {
        DATABASE_URL: "postgres://configured",
        AUTH_CANONICAL_ORIGIN: "https://portal.example",
        SUPABASE_OAUTH_ENABLED: "true",
        SUPABASE_ISSUER: "issuer",
        SUPABASE_AUDIENCE: "audience",
      },
      { sql: new FakeOAuthSql() },
    );
    const response = await createOAuthInvitationEntryPoints(adapter).start(
      new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST" }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ kind: "unavailable" });
  });
});
