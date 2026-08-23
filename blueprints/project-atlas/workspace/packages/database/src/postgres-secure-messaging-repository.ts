import type {
  MessagingAuditEvent,
  SecureMessagingRepository,
  StoredConversation,
  StoredMessage,
} from "@atlas/secure-messaging";
import type postgres from "postgres";

type ConversationRow = {
  id: string;
  owner_account_id: string;
  context_ref: string;
  authorization_epoch: number;
  policy_epoch: number;
  client_visible: boolean;
  subject: string;
  reason: StoredConversation["reason"];
  state: StoredConversation["state"];
  created_at: Date;
  updated_at: Date;
};
type EntryRow = {
  id: string;
  audience: "client" | "internal";
  sender: "client" | "staff";
  body_ciphertext: string;
  created_at: Date;
};

export class PostgresSecureMessagingRepository implements SecureMessagingRepository {
  constructor(private readonly sql: postgres.Sql) {}

  async createConversation(conversation: StoredConversation): Promise<void> {
    await this
      .sql`insert into secure_message_conversations (id, owner_account_id, context_ref, authorization_epoch, policy_epoch, client_visible, subject, reason, state, version, created_at, updated_at) values (${conversation.opaqueRef}, ${conversation.ownerAccountId}, ${conversation.contextRef}, ${Number(conversation.authorizationEpoch)}, ${Number(conversation.policyEpoch)}, ${conversation.clientVisible}, ${conversation.subject}, ${conversation.reason}, ${conversation.state}, 1, ${conversation.createdAt}, ${conversation.updatedAt})`;
  }
  async getConversation(conversationRef: string): Promise<StoredConversation | undefined> {
    const row = (
      await this.sql<
        ConversationRow[]
      >`select id, owner_account_id, context_ref, authorization_epoch, policy_epoch, client_visible, subject, reason, state, created_at, updated_at from secure_message_conversations where id = ${conversationRef} limit 1`
    )[0];
    return row ? this.loadConversation(row) : undefined;
  }
  async listConversations(
    ownerAccountId: string,
    contextRef: string,
  ): Promise<readonly StoredConversation[]> {
    const rows = await this.sql<
      ConversationRow[]
    >`select id, owner_account_id, context_ref, authorization_epoch, policy_epoch, client_visible, subject, reason, state, created_at, updated_at from secure_message_conversations where owner_account_id = ${ownerAccountId} and context_ref = ${contextRef} order by updated_at desc`;
    return Promise.all(rows.map((row) => this.loadConversation(row)));
  }
  async appendClientMessage(
    conversationRef: string,
    message: StoredMessage,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.sql.begin(async (transaction) => {
      const updated = await transaction<
        { id: string }[]
      >`update secure_message_conversations set state = 'waiting_for_staff', updated_at = ${updatedAt}, version = version + 1 where id = ${conversationRef} returning id`;
      if (updated.length !== 1) return false;
      const next =
        (
          await transaction<
            { ordinal: number }[]
          >`select coalesce(max(ordinal), 0)::integer + 1 as ordinal from secure_message_entries where conversation_id = ${conversationRef}`
        )[0]?.ordinal ?? 1;
      await transaction`insert into secure_message_entries (id, conversation_id, ordinal, audience, sender, body_ciphertext, created_at) values (${message.opaqueRef}, ${conversationRef}, ${next}, 'client', ${message.sender}, ${message.ciphertext}, ${message.createdAt})`;
      return true;
    });
  }
  async appendInternalNote(
    conversationRef: string,
    note: StoredConversation["internalNotes"][number],
    updatedAt: Date,
  ): Promise<boolean> {
    return this.sql.begin(async (transaction) => {
      const updated = await transaction<
        { id: string }[]
      >`update secure_message_conversations set updated_at = ${updatedAt}, version = version + 1 where id = ${conversationRef} returning id`;
      if (updated.length !== 1) return false;
      const next =
        (
          await transaction<
            { ordinal: number }[]
          >`select coalesce(max(ordinal), 0)::integer + 1 as ordinal from secure_message_entries where conversation_id = ${conversationRef}`
        )[0]?.ordinal ?? 1;
      await transaction`insert into secure_message_entries (id, conversation_id, ordinal, audience, sender, body_ciphertext, created_at) values (${note.opaqueRef}, ${conversationRef}, ${next}, 'internal', 'staff', ${note.ciphertext}, ${note.createdAt})`;
      return true;
    });
  }
  async attachDocumentReference(
    conversationRef: string,
    documentRef: string,
    updatedAt: Date,
  ): Promise<boolean> {
    return this.sql.begin(async (transaction) => {
      const updated = await transaction<
        { id: string }[]
      >`update secure_message_conversations set updated_at = ${updatedAt}, version = version + 1 where id = ${conversationRef} returning id`;
      if (updated.length !== 1) return false;
      await transaction`insert into secure_message_document_references (id, conversation_id, document_id, created_at) values (${`msgdoc_${conversationRef}_${documentRef}`}, ${conversationRef}, ${documentRef}, ${updatedAt}) on conflict (conversation_id, document_id) do nothing`;
      return true;
    });
  }
  async appendAudit(event: MessagingAuditEvent): Promise<void> {
    await this
      .sql`insert into secure_message_audit_events (id, conversation_id, event_name, actor_account_id, created_at) values (${event.opaqueRef}, ${event.conversationRef}, ${event.action}, ${event.actorRef}, ${event.createdAt})`;
  }
  async listAudit(conversationRef: string): Promise<readonly MessagingAuditEvent[]> {
    const rows = await this.sql<
      {
        id: string;
        conversation_id: string;
        event_name: string;
        actor_account_id: string;
        created_at: Date;
      }[]
    >`select id, conversation_id, event_name, actor_account_id, created_at from secure_message_audit_events where conversation_id = ${conversationRef} order by created_at asc`;
    return rows.map((row) => ({
      opaqueRef: row.id,
      conversationRef: row.conversation_id,
      action: row.event_name,
      actorRef: row.actor_account_id,
      createdAt: row.created_at,
    }));
  }
  private async loadConversation(row: ConversationRow): Promise<StoredConversation> {
    const [entries, documents] = await Promise.all([
      this.sql<
        EntryRow[]
      >`select id, audience, sender, body_ciphertext, created_at from secure_message_entries where conversation_id = ${row.id} order by ordinal asc`,
      this.sql<
        { document_id: string }[]
      >`select document_id from secure_message_document_references where conversation_id = ${row.id} order by created_at asc`,
    ]);
    return {
      opaqueRef: row.id,
      ownerAccountId: row.owner_account_id,
      contextRef: row.context_ref,
      authorizationEpoch: String(row.authorization_epoch),
      policyEpoch: String(row.policy_epoch),
      clientVisible: row.client_visible,
      subject: row.subject,
      reason: row.reason,
      state: row.state,
      messages: entries
        .filter((entry) => entry.audience === "client")
        .map((entry) => ({
          opaqueRef: entry.id,
          ciphertext: entry.body_ciphertext,
          sender: entry.sender,
          createdAt: entry.created_at,
        })),
      internalNotes: entries
        .filter((entry) => entry.audience === "internal")
        .map((entry) => ({
          opaqueRef: entry.id,
          ciphertext: entry.body_ciphertext,
          createdAt: entry.created_at,
        })),
      documentRefs: documents.map((document) => document.document_id),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
