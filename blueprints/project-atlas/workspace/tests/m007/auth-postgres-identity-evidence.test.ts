import { createPersistentOAuthAccountService } from "@atlas/auth";
import { PostgresAuthIdentityRepository, type AuthSql, type AuthTransactionSql } from "@atlas/database";
import { describe, expect, it } from "vitest";

type Executed = { readonly transaction: number; readonly statement: string; readonly parameters: readonly unknown[] };

class FakeIdentitySql implements AuthSql {
  readonly executed: Executed[] = [];
  private transaction = 0;

  constructor(private readonly crmResolution: "linked" | "conflict" = "linked") {}

  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    const transaction = ++this.transaction;
    return callback({
      unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) => {
        this.executed.push({ transaction, statement, parameters });
        if (statement.includes("from auth_supabase_identity_evidence")) {
          return [{ id: "supabase-evidence-1", provider_subject: "subject-1" }] as R;
        }
        if (statement.includes("insert into auth_accounts")) {
          return [{ id: "account-1", status: "active" }] as R;
        }
        if (statement.includes("insert into auth_external_identities")) {
          return [{ id: "external-1" }] as R;
        }
        if (statement.includes("from auth_crm_party_evidence")) {
          return [{
            id: "crm-evidence-1",
            resolution: this.crmResolution,
            relationship_receipt: this.crmResolution === "linked" ? "crm-link-1" : null,
          }] as R;
        }
        return [] as R;
      },
    });
  }
}

const verifiedIdentity = {
  issuer: "https://supabase.example/auth/v1",
  audience: "authenticated",
  subject: "subject-1",
  emailVerified: true as const,
  expiresAt: Date.now() + 60_000,
  transactionId: "provider-transaction-1",
  provider: "google" as const,
};

describe("M007 PostgreSQL identity evidence", () => {
  it("creates the account, external identity, CRM link, and hash-only session in one transaction", async () => {
    const sql = new FakeIdentitySql();
    const service = createPersistentOAuthAccountService({
      repository: new PostgresAuthIdentityRepository(sql),
      issuer: verifiedIdentity.issuer,
      audience: verifiedIdentity.audience,
      resolveCrm: async () => ({ kind: "linked", relationshipReceipt: "crm-link-1", partyId: "party-1" }),
    });

    const result = await service.authenticate(verifiedIdentity);

    expect(result).toMatchObject({ kind: "authenticated", accountId: "account-1" });
    if (result.kind !== "authenticated") throw new Error("expected authenticated result");
    const accountTransaction = sql.executed.filter((entry) => entry.statement.includes("auth_accounts"))[0]?.transaction;
    const atomicStatements = sql.executed.filter((entry) => entry.transaction === accountTransaction).map((entry) => entry.statement);
    expect(atomicStatements).toEqual([
      expect.stringContaining("from auth_supabase_identity_evidence"),
      expect.stringContaining("from auth_crm_party_evidence"),
      expect.stringContaining("insert into auth_accounts"),
      expect.stringContaining("insert into auth_external_identities"),
      expect.stringContaining("insert into auth_party_links"),
      expect.stringContaining("insert into auth_sessions"),
    ]);
    expect(sql.executed.flatMap((entry) => entry.parameters)).not.toContain(result.handle);
    expect(sql.executed.find((entry) => entry.statement.includes("insert into auth_sessions"))?.parameters).toContain(result.handleDigest);
  });

  it("persists a manual-review conflict and never creates a session", async () => {
    const sql = new FakeIdentitySql("conflict");
    const service = createPersistentOAuthAccountService({
      repository: new PostgresAuthIdentityRepository(sql),
      issuer: verifiedIdentity.issuer,
      audience: verifiedIdentity.audience,
      resolveCrm: async () => ({ kind: "conflict", partyId: "party-1" }),
    });

    await expect(service.authenticate(verifiedIdentity)).resolves.toEqual({ kind: "manual_review" });
    expect(sql.executed.some((entry) => entry.statement.includes("insert into auth_identity_conflicts"))).toBe(true);
    expect(sql.executed.some((entry) => entry.statement.includes("insert into auth_sessions"))).toBe(false);
  });
});
