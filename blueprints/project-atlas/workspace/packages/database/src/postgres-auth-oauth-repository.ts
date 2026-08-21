import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type OAuthTransactionInsert = Readonly<{ id: string; purpose: "sign_in" | "link"; provider: "google"; stateDigest: string; nonceDigest: string; pkceVerifierDigest: string; browserBindingDigest: string; redirectHash: string; returnIntent: string; callbackUrl: string; expiresAt: Date; now: Date }>;
type OAuthConsumeInput = Readonly<{ stateDigest: string; nonceDigest: string; pkceVerifierDigest: string; browserBindingDigest: string; redirectHash: string; now: Date }>;

async function query<T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[] = []): Promise<T> { return transaction.unsafe<T>(statement, parameters); }

/** Atomic OAuth state store. Only SHA-256 digests cross this persistence boundary. */
export class PostgresOAuthTransactionRepository {
  constructor(private readonly sql: AuthSql) {}
  async issue(input: OAuthTransactionInsert): Promise<void> {
    await this.sql.begin(async (transaction) => query(transaction, `insert into auth_transactions (id, purpose, provider, state_digest, nonce_digest, pkce_verifier_digest, browser_binding_digest, return_intent, callback_url, state, expires_at, version, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,1,$11,$11)`, [input.id, input.purpose, input.provider, input.stateDigest, input.nonceDigest, input.pkceVerifierDigest, input.browserBindingDigest, input.returnIntent, input.callbackUrl, input.expiresAt, input.now]));
  }
  async consume(input: OAuthConsumeInput): Promise<{ readonly kind: "consumed" | "denied" | "replay_denied" }> {
    return this.sql.begin(async (transaction) => {
      const rows = await query<readonly { id: string }[]>(transaction, `update auth_transactions set state = 'consumed', consumed_at = $6, updated_at = $6, version = version + 1 where state = 'pending' and expires_at > $6 and state_digest = $1 and nonce_digest = $2 and pkce_verifier_digest = $3 and browser_binding_digest = $4 and encode(digest(callback_url, 'sha256'), 'base64') = $5 returning id`, [input.stateDigest, input.nonceDigest, input.pkceVerifierDigest, input.browserBindingDigest, input.redirectHash, input.now]);
      return rows[0] ? { kind: "consumed" } : { kind: "replay_denied" };
    });
  }
}
