import type { MessagingActor, SecureMessagingDocumentAccess } from "@atlas/secure-messaging";
import type postgres from "postgres";

export class PostgresSecureMessagingDocumentAccess implements SecureMessagingDocumentAccess {
  constructor(private readonly sql: postgres.Sql) {}
  async canReference(
    input: Readonly<{ actor: MessagingActor; documentRef: string }>,
  ): Promise<boolean> {
    const rows = await this.sql<
      { id: string }[]
    >`select id from document_records where id = ${input.documentRef} and owner_account_id = ${input.actor.accountId} and context_ref = ${input.actor.contextRef} and client_visible = true and authorization_epoch = ${Number(input.actor.authorizationEpoch)} and policy_epoch = ${Number(input.actor.policyEpoch)} and lifecycle = 'active' limit 1`;
    return rows.length === 1;
  }
}
