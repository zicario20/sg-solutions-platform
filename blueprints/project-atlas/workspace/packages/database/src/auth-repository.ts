export type ProofConsumeResult = { readonly kind: "consumed" } | { readonly kind: "replay_denied" };

export interface AuthRepository {
  consumeProof(proofDigest: string): Promise<ProofConsumeResult>;
}

export class MemoryAuthRepository implements AuthRepository {
  private readonly consumedProofs = new Set<string>();

  async consumeProof(proofDigest: string): Promise<ProofConsumeResult> {
    if (!proofDigest || this.consumedProofs.has(proofDigest)) return { kind: "replay_denied" };
    this.consumedProofs.add(proofDigest);
    return { kind: "consumed" };
  }

  async consumeProofTwice(proofDigest: string): Promise<readonly [ProofConsumeResult, ProofConsumeResult]> {
    return [await this.consumeProof(proofDigest), await this.consumeProof(proofDigest)];
  }
}

export type AuthTransactionSql = {
  unsafe<T>(query: string, parameters?: readonly unknown[]): Promise<T>;
};

export type AuthSql = {
  begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T>;
};

export async function withAuthTransaction<T>(
  sql: AuthSql,
  activeSessionId: string,
  operation: (transaction: AuthTransactionSql) => Promise<T>,
): Promise<T> {
  if (!activeSessionId) throw new Error("AUTH_SESSION_REQUIRED");
  return sql.begin(async (transaction) => {
    await transaction.unsafe(
      "select atlas_auth_initialize_session_context($1)",
      [activeSessionId],
    );
    return operation(transaction);
  });
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly sql: AuthSql, private readonly activeSessionId: string) {}

  async consumeProof(proofDigest: string): Promise<ProofConsumeResult> {
    if (!proofDigest) return { kind: "replay_denied" };
    return withAuthTransaction(this.sql, this.activeSessionId, async (transaction) => {
      const result = await transaction.unsafe<readonly { id: string }[]>(
        `update auth_proofs set state = 'consumed', consumed_at = now(), version = version + 1,
          updated_at = now() where proof_digest = $1 and state = 'issued' and expires_at > now()
          returning id`,
        [proofDigest],
      );
      return result[0] ? { kind: "consumed" } : { kind: "replay_denied" };
    });
  }
}
