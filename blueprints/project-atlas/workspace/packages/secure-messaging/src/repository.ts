import type { MessagingAuditEvent, StoredConversation, StoredMessage } from "./contracts.ts";
export type SecureMessagingRepository = Readonly<{
  createConversation(conversation: StoredConversation): Promise<void>;
  getConversation(conversationRef: string): Promise<StoredConversation | undefined>;
  listConversations(
    ownerAccountId: string,
    contextRef: string,
  ): Promise<readonly StoredConversation[]>;
  appendClientMessage(
    conversationRef: string,
    message: StoredMessage,
    updatedAt: Date,
  ): Promise<boolean>;
  appendInternalNote(
    conversationRef: string,
    note: StoredConversation["internalNotes"][number],
    updatedAt: Date,
  ): Promise<boolean>;
  attachDocumentReference(
    conversationRef: string,
    documentRef: string,
    updatedAt: Date,
  ): Promise<boolean>;
  appendAudit(event: MessagingAuditEvent): Promise<void>;
  listAudit(conversationRef: string): Promise<readonly MessagingAuditEvent[]>;
}>;
