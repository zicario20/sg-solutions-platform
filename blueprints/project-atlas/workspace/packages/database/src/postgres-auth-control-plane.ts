import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type SessionInsert = { id: string; accountId: string; handleDigest: string; familyId: string; generation: number; assurance: "aal1" | "aal2"; idleExpiresAt: Date; absoluteExpiresAt: Date; now: Date };
const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[] = []) => transaction.unsafe<T>(statement, parameters);

/** PostgreSQL-only durable operations. Raw handles/proofs are deliberately absent from this API. */
export class PostgresAuthControlPlaneRepository {
  constructor(private readonly sql: AuthSql) {}
  async createSession(input: SessionInsert): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_create_session($1,$2,$3,$4,$5,$6,$7,$8)", [input.id,input.accountId,input.handleDigest,input.familyId,input.assurance,input.idleExpiresAt,input.absoluteExpiresAt,input.now]));
  }
  async rotateSession(input: { handleDigest: string; next: SessionInsert; now: Date }): Promise<"rotated" | "family_revoked"> {
    const rows = await this.sql.begin((transaction) => query<readonly { outcome: "rotated" | "family_revoked" }[]>(transaction, "select atlas_auth_rotate_session($1,$2,$3,$4,$5,$6) as outcome", [input.handleDigest,input.next.id,input.next.handleDigest,input.next.idleExpiresAt,input.next.absoluteExpiresAt,input.now]));
    return rows[0]?.outcome === "rotated" ? "rotated" : "family_revoked";
  }
  async admit(input: { bucketDigest: string; purpose: string; commandId: string; accountId: string | null; now: Date }): Promise<"accepted" | "rate_limited"> {
    const rows = await this.sql.begin((transaction) => query<readonly { allowed: boolean }[]>(transaction, "select atlas_auth_admit_pre_auth($1,$2,$3,$4) as allowed", [input.bucketDigest,input.purpose,input.commandId,input.now]));
    return rows[0]?.allowed ? "accepted" : "rate_limited";
  }
  async revokeByHandleDigest(handleDigest: string, now: Date): Promise<boolean> {
    const rows = await this.sql.begin((transaction) => query<readonly { revoked: boolean }[]>(transaction, "select atlas_auth_revoke_current($1,$2) as revoked", [handleDigest,now]));
    return rows[0]?.revoked === true;
  }
  async revokeOthersByHandleDigest(handleDigest: string, now: Date): Promise<boolean> {
    const rows = await this.sql.begin((transaction) => query<readonly { revoked: boolean }[]>(transaction, "select atlas_auth_revoke_others($1,$2) as revoked", [handleDigest,now]));
    return rows[0]?.revoked === true;
  }
}
