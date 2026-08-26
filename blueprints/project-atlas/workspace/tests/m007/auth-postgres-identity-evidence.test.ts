import { createPersistentOAuthAccountService } from "@atlas/auth";
import {
  type AuthSql,
  type AuthTransactionSql,
  PostgresAuthIdentityRepository,
} from "@atlas/database";
import { describe, expect, it } from "vitest";

type Executed = {
  readonly transaction: number;
  readonly statement: string;
  readonly parameters: readonly unknown[];
};

class FakeIdentitySql implements AuthSql {
  readonly executed: Executed[] = [];
  private transaction = 0;

  constructor(private readonly crmResolution: "linked" | "conflict" = "linked") {}

  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    const transaction = ++this.transaction;
    return callback({
      unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) => {
        this.executed.push({ transaction, statement, parameters });
        if (statement.includes("atlas_auth_authenticate_identity"))
          return [
            {
              kind: this.crmResolution === "linked" ? "authenticated" : "manual_review",
              account_id: this.crmResolution === "linked" ? "account-1" : null,
            },
          ] as R;
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
  it("passes verified evidence to the restricted PostgreSQL identity procedure without a raw session handle", async () => {
    const sql = new FakeIdentitySql();
    const service = createPersistentOAuthAccountService({
      repository: new PostgresAuthIdentityRepository(sql),
      issuer: verifiedIdentity.issuer,
      audience: verifiedIdentity.audience,
      resolveCrm: async () => ({
        kind: "linked",
        relationshipReceipt: "crm-link-1",
        partyId: "party-1",
      }),
    });

    const result = await service.authenticate(verifiedIdentity);

    expect(result).toMatchObject({ kind: "authenticated", accountId: "account-1" });
    if (result.kind !== "authenticated") throw new Error("expected authenticated result");
    expect(
      sql.executed.some((entry) => entry.statement.includes("atlas_auth_store_supabase_evidence")),
    ).toBe(true);
    expect(
      sql.executed.some((entry) => entry.statement.includes("atlas_auth_store_crm_evidence")),
    ).toBe(true);
    const authentication = sql.executed.find((entry) =>
      entry.statement.includes("atlas_auth_authenticate_identity"),
    );
    expect(authentication?.parameters).toContain(verifiedIdentity.issuer);
    expect(authentication?.parameters).toContain(verifiedIdentity.audience);
    expect(sql.executed.flatMap((entry) => entry.parameters)).not.toContain(result.handle);
    expect(authentication?.parameters).toContain(result.handleDigest);
  });

  it("persists a manual-review conflict and never creates a session", async () => {
    const sql = new FakeIdentitySql("conflict");
    const service = createPersistentOAuthAccountService({
      repository: new PostgresAuthIdentityRepository(sql),
      issuer: verifiedIdentity.issuer,
      audience: verifiedIdentity.audience,
      resolveCrm: async () => ({ kind: "conflict", partyId: "party-1" }),
    });

    await expect(service.authenticate(verifiedIdentity)).resolves.toEqual({
      kind: "manual_review",
    });
    expect(
      sql.executed.some((entry) => entry.statement.includes("atlas_auth_authenticate_identity")),
    ).toBe(true);
  });
});
