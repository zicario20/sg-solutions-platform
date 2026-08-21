import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type OAuthTransactionInsert = Readonly<{ id: string; purpose: "sign_in" | "link"; provider: "google"; stateDigest: string; nonceDigest: string; pkceVerifierDigest: string; browserBindingDigest: string; redirectHash: string; nonceCiphertext: string; pkceVerifierCiphertext: string; returnIntent: string; callbackUrl: string; expiresAt: Date; now: Date }>;
type OAuthConsumeInput = Readonly<{ stateDigest: string; nonceDigest: string; pkceVerifierDigest: string; browserBindingDigest: string; redirectHash: string; now: Date }>;
const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[]) => transaction.unsafe<T>(statement, parameters);

/** Pre-auth OAuth storage through narrow SECURITY DEFINER functions only. */
export class PostgresOAuthTransactionRepository {
  constructor(private readonly sql: AuthSql) {}
  async issue(input: OAuthTransactionInsert): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_issue_oauth_transaction($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)", [input.id, input.purpose, input.provider, input.stateDigest, input.nonceDigest, input.pkceVerifierDigest, input.browserBindingDigest, input.redirectHash, input.nonceCiphertext, input.pkceVerifierCiphertext, input.returnIntent, input.callbackUrl, input.expiresAt, input.now]));
  }
  async load(input: { stateDigest: string; browserBindingDigest: string; now: Date }): Promise<{ nonceCiphertext: string; pkceVerifierCiphertext: string } | undefined> { const rows = await this.sql.begin((transaction) => query<readonly { nonce_ciphertext: string; pkce_verifier_ciphertext: string }[]>(transaction, "select * from atlas_auth_load_oauth_transaction($1,$2,$3)", [input.stateDigest,input.browserBindingDigest,input.now])); const row = rows[0]; return row ? { nonceCiphertext: row.nonce_ciphertext, pkceVerifierCiphertext: row.pkce_verifier_ciphertext } : undefined; }
  async consume(input: OAuthConsumeInput): Promise<{ readonly kind: "consumed" | "denied" | "replay_denied" }> {
    const rows = await this.sql.begin((transaction) => query<readonly { outcome: "consumed" | "replay_denied" }[]>(transaction, "select atlas_auth_consume_oauth_transaction($1,$2,$3,$4,$5,$6) as outcome", [input.stateDigest, input.nonceDigest, input.pkceVerifierDigest, input.browserBindingDigest, input.redirectHash, input.now]));
    return { kind: rows[0]?.outcome === "consumed" ? "consumed" : "replay_denied" };
  }
}
