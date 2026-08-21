import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[]) => transaction.unsafe<T>(statement, parameters);
type InvitationIssue = { id: string; proofDigest: string; contactId: string; scope: string; inviterAccountId: string; expectedProviderSubject: string; expiresAt: Date; now: Date };
type InvitationConsume = { id: string; proofDigest: string; sessionHandleDigest: string; now: Date };

export class PostgresAuthSessionInvitationRepository {
  constructor(private readonly sql: AuthSql) {}
  async issue(input: InvitationIssue): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_issue_invitation($1,$2,$3,$4,$5,$6,$7,$8)", [input.id, input.proofDigest, input.contactId, input.scope, input.inviterAccountId, input.expectedProviderSubject, input.expiresAt, input.now]));
  }
  async createInvitation(input: InvitationIssue): Promise<void> { return this.issue(input); }
  async consume(input: InvitationConsume): Promise<{ kind: "consumed" | "manual_review" }> {
    const rows = await this.sql.begin((transaction) => query<readonly { outcome: "consumed" | "manual_review" }[]>(transaction, "select atlas_auth_consume_invitation($1,$2,$3,$4) as outcome", [input.id, input.proofDigest, input.sessionHandleDigest, input.now]));
    return { kind: rows[0]?.outcome === "consumed" ? "consumed" : "manual_review" };
  }
  async acceptInvitation(input: InvitationConsume): Promise<{ kind: "consumed" | "manual_review" }> { return this.consume(input); }
  async createSession(input: { id: string; accountId: string; handleDigest: string; familyId: string; assurance: "aal1" | "aal2"; idleExpiresAt: Date; absoluteExpiresAt: Date; now: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_create_session($1,$2,$3,$4,$5,$6,$7,$8)", [input.id, input.accountId, input.handleDigest, input.familyId, input.assurance, input.idleExpiresAt, input.absoluteExpiresAt, input.now]));
  }
  async listAndTouchSessions(handleDigest: string, now: Date): Promise<readonly { id: string; created_at: Date; is_current: boolean }[]> {
    return this.sql.begin((transaction) => query(transaction, "select * from atlas_auth_list_sessions($1,$2)", [handleDigest, now]));
  }
}
