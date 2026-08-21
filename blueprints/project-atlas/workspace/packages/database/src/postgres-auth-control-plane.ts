import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type SessionInsert = { id: string; accountId: string; handleDigest: string; familyId: string; generation: number; assurance: "aal1" | "aal2"; idleExpiresAt: Date; absoluteExpiresAt: Date; now: Date };

async function query<T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[] = []): Promise<T> { return transaction.unsafe<T>(statement, parameters); }

/** PostgreSQL-only durable operations. Raw handles/proofs are deliberately absent from this API. */
export class PostgresAuthControlPlaneRepository {
  constructor(private readonly sql: AuthSql) {}
  async createSession(input: SessionInsert): Promise<void> {
    await this.sql.begin(async (transaction) => { await query(transaction, `insert into auth_sessions (id, account_id, handle_digest, family_id, generation, assurance, state, idle_expires_at, absolute_expires_at, version, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,'active',$7,$8,1,$9,$9)`, [input.id, input.accountId, input.handleDigest, input.familyId, input.generation, input.assurance, input.idleExpiresAt, input.absoluteExpiresAt, input.now]); });
  }
  async rotateSession(input: { handleDigest: string; next: SessionInsert; now: Date }): Promise<"rotated" | "family_revoked"> {
    return this.sql.begin(async (transaction) => {
      const rows = await query<readonly { id: string; family_id: string; generation: number; state: string; idle_expires_at: Date; absolute_expires_at: Date }[]>(transaction, `select id, family_id, generation, state, idle_expires_at, absolute_expires_at from auth_sessions where handle_digest = $1 for update`, [input.handleDigest]);
      const current = rows[0];
      if (!current || current.state !== "active" || current.idle_expires_at <= input.now || current.absolute_expires_at <= input.now) { if (current) await query(transaction, `update auth_sessions set state = 'revoked', revoked_at = $2, updated_at = $2 where family_id = $1 and state in ('active','rotating')`, [current.family_id, input.now]); return "family_revoked"; }
      const closed = await query<readonly { id: string }[]>(transaction, `update auth_sessions set state = 'rotated', updated_at = $2, version = version + 1 where id = $1 and state = 'active' returning id`, [current.id, input.now]);
      if (!closed[0]) return "family_revoked";
      await query(transaction, `insert into auth_sessions (id, account_id, handle_digest, family_id, generation, assurance, state, idle_expires_at, absolute_expires_at, version, created_at, updated_at) select $1, account_id, $2, family_id, generation + 1, assurance, 'active', $3, $4, 1, $5, $5 from auth_sessions where id = $6`, [input.next.id, input.next.handleDigest, input.next.idleExpiresAt, input.next.absoluteExpiresAt, input.now, current.id]);
      return "rotated";
    });
  }
  async admit(input: { bucketDigest: string; purpose: string; commandId: string; accountId: string | null; now: Date }): Promise<"accepted" | "rate_limited"> {
    const rows = await this.sql.begin(async (transaction) => query<readonly { allowed: boolean }[]>(transaction, `select atlas_auth_admit_pre_auth($1,$2,$3,$4) as allowed`, [input.bucketDigest, input.purpose, input.commandId, input.now]));
    return rows[0]?.allowed ? "accepted" : "rate_limited";
  }
  async revokeByHandleDigest(handleDigest: string, now: Date): Promise<boolean> {
    return this.sql.begin(async (transaction) => {
      const rows = await query<readonly { id: string }[]>(transaction, `update auth_sessions set state = 'revoked', revoked_at = $2, updated_at = $2, version = version + 1 where handle_digest = $1 and state in ('active','rotating') returning id`, [handleDigest, now]);
      return Boolean(rows[0]);
    });
  }
  async revokeOthersByHandleDigest(handleDigest: string, now: Date): Promise<boolean> {
    return this.sql.begin(async (transaction) => {
      const rows = await query<readonly { id: string }[]>(transaction, `with current_session as (select id, account_id from auth_sessions where handle_digest = $1 and state = 'active' for update), revoked as (update auth_sessions set state = 'revoked', revoked_at = $2, updated_at = $2, version = version + 1 where account_id = (select account_id from current_session) and id <> (select id from current_session) and state in ('active','rotating') returning id) select id from current_session`, [handleDigest, now]);
      return Boolean(rows[0]);
    });
  }
}
