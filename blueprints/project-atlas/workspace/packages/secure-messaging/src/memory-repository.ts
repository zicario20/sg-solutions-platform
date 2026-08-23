import type { MessagingAuditEvent, StoredConversation, StoredMessage } from "./contracts.ts";
import type { SecureMessagingRepository } from "./repository.ts";
export class MemoryMessagingRepository implements SecureMessagingRepository {
  readonly conversations = new Map<string, StoredConversation>();
  readonly audit: MessagingAuditEvent[] = [];
  async createConversation(conversation: StoredConversation): Promise<void> {
    this.conversations.set(conversation.opaqueRef, conversation);
  }
  async getConversation(conversationRef: string): Promise<StoredConversation | undefined> {
    return this.conversations.get(conversationRef);
  }
  async listConversations(
    ownerAccountId: string,
    contextRef: string,
  ): Promise<readonly StoredConversation[]> {
    return [...this.conversations.values()].filter(
      (conversation) =>
        conversation.ownerAccountId === ownerAccountId && conversation.contextRef === contextRef,
    );
  }
  async appendClientMessage(
    conversationRef: string,
    message: StoredMessage,
    updatedAt: Date,
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationRef);
    if (!conversation) return false;
    this.conversations.set(conversationRef, {
      ...conversation,
      messages: [...conversation.messages, message],
      state: "waiting_for_staff",
      updatedAt,
    });
    return true;
  }
  async appendInternalNote(
    conversationRef: string,
    note: StoredConversation["internalNotes"][number],
    updatedAt: Date,
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationRef);
    if (!conversation) return false;
    this.conversations.set(conversationRef, {
      ...conversation,
      internalNotes: [...conversation.internalNotes, note],
      updatedAt,
    });
    return true;
  }
  async attachDocumentReference(
    conversationRef: string,
    documentRef: string,
    updatedAt: Date,
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationRef);
    if (!conversation) return false;
    this.conversations.set(conversationRef, {
      ...conversation,
      documentRefs: conversation.documentRefs.includes(documentRef)
        ? conversation.documentRefs
        : [...conversation.documentRefs, documentRef],
      updatedAt,
    });
    return true;
  }
  async appendAudit(event: MessagingAuditEvent): Promise<void> {
    this.audit.push(event);
  }
  async listAudit(conversationRef: string): Promise<readonly MessagingAuditEvent[]> {
    return this.audit.filter((event) => event.conversationRef === conversationRef);
  }
}
