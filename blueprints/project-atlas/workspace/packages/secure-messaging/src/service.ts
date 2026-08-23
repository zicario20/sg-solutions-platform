import { authorizeConversation } from "./authorization.ts";
import type { MessageCipher } from "./cipher.ts";
import type { SecureMessagingDocumentAccess } from "./document-access.ts";
import type {
  ClientConversationDto,
  ClientInboxItemDto,
  ConversationReason,
  MessagingActor,
  MessagingAuditEvent,
  StaffMessagingActor,
  StoredConversation,
} from "./contracts.ts";
import type { SecureMessagingRepository } from "./repository.ts";
const clean = (value: string, maximum: number) =>
  value
    .replace(/[\r\n\t]+/gu, " ")
    .trim()
    .slice(0, maximum);
const documentReference = /^doc1_[A-Za-z0-9_-]+$/u;
const conversationReasons = new Set<ConversationReason>([
  "general_question",
  "service_status",
  "document_question",
  "payment_question",
  "appointment_question",
  "technical_support",
  "complaint",
  "security_issue",
  "other",
]);
export class SecureMessagingService {
  private sequence = 0;
  constructor(
    private readonly dependencies: Readonly<{
      repository: SecureMessagingRepository;
      cipher: MessageCipher;
      now?: () => Date;
      documentAccess?: SecureMessagingDocumentAccess;
    }>,
  ) {}
  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }
  private ref(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence.toString(36).padStart(16, "0")}`;
  }
  private async audit(conversationRef: string, action: string, actorRef: string): Promise<void> {
    const event: MessagingAuditEvent = {
      opaqueRef: this.ref("msga1"),
      conversationRef,
      action,
      actorRef,
      createdAt: this.now(),
    };
    await this.dependencies.repository.appendAudit(event);
  }
  async createConversation(
    input: Readonly<{
      actor: MessagingActor;
      subject: string;
      reason: ConversationReason;
      locale: "es" | "en";
    }>,
  ) {
    const subject = clean(input.subject, 160);
    if (!subject || !conversationReasons.has(input.reason)) throw new Error("invalid_subject");
    const timestamp = this.now();
    const conversation: StoredConversation = {
      opaqueRef: this.ref("conv1"),
      ownerAccountId: input.actor.accountId,
      contextRef: input.actor.contextRef,
      authorizationEpoch: input.actor.authorizationEpoch,
      policyEpoch: input.actor.policyEpoch,
      clientVisible: true,
      subject,
      reason: input.reason,
      state: "new",
      messages: [],
      internalNotes: [],
      documentRefs: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.dependencies.repository.createConversation(conversation);
    await this.audit(conversation.opaqueRef, "conversation_created", input.actor.accountId);
    return { opaqueRef: conversation.opaqueRef };
  }
  async sendClientMessage(
    input: Readonly<{ actor: MessagingActor; conversationRef: string; body: string }>,
  ) {
    const conversation = await this.dependencies.repository.getConversation(input.conversationRef);
    const body = clean(input.body, 4_000);
    if (!conversation || !authorizeConversation(input.actor, conversation) || !body)
      return { kind: "not_found" as const };
    const timestamp = this.now();
    const appended = await this.dependencies.repository.appendClientMessage(
      conversation.opaqueRef,
      {
        opaqueRef: this.ref("msg1"),
        ciphertext: this.dependencies.cipher.seal(body),
        sender: "client",
        createdAt: timestamp,
      },
      timestamp,
    );
    if (!appended) return { kind: "not_found" as const };
    await this.audit(conversation.opaqueRef, "client_message_sent", input.actor.accountId);
    return { kind: "sent" as const };
  }
  async addInternalNote(
    input: Readonly<{ actor: StaffMessagingActor; conversationRef: string; body: string }>,
  ) {
    const conversation = await this.dependencies.repository.getConversation(input.conversationRef);
    const body = clean(input.body, 4_000);
    if (!conversation || !input.actor.canManageSecureMessages || !body)
      return { kind: "not_found" as const };
    const timestamp = this.now();
    const appended = await this.dependencies.repository.appendInternalNote(
      conversation.opaqueRef,
      {
        opaqueRef: this.ref("note1"),
        ciphertext: this.dependencies.cipher.seal(body),
        createdAt: timestamp,
      },
      timestamp,
    );
    if (!appended) return { kind: "not_found" as const };
    await this.audit(conversation.opaqueRef, "internal_note_added", input.actor.accountId);
    return { kind: "added" as const };
  }
  async listClientInbox(input: Readonly<{ actor: MessagingActor }>) {
    const conversations = await this.dependencies.repository.listConversations(
      input.actor.accountId,
      input.actor.contextRef,
    );
    const items: ClientInboxItemDto[] = conversations
      .filter((conversation) => authorizeConversation(input.actor, conversation))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .map((conversation) => ({
        opaqueRef: conversation.opaqueRef,
        subject: conversation.subject,
        state: conversation.state,
        preview: conversation.messages.length > 0 ? "Secure message activity" : "No messages yet",
        updatedAt: conversation.updatedAt.toISOString(),
      }));
    return { kind: "found" as const, items };
  }
  async attachDocumentReference(
    input: Readonly<{ actor: MessagingActor; conversationRef: string; documentRef: string }>,
  ) {
    const conversation = await this.dependencies.repository.getConversation(input.conversationRef);
    if (
      !conversation ||
      !authorizeConversation(input.actor, conversation) ||
      !documentReference.test(input.documentRef) ||
      !(await this.dependencies.documentAccess?.canReference({
        actor: input.actor,
        documentRef: input.documentRef,
      }))
    )
      return { kind: "not_found" as const };
    const attached = await this.dependencies.repository.attachDocumentReference(
      conversation.opaqueRef,
      input.documentRef,
      this.now(),
    );
    if (!attached) return { kind: "not_found" as const };
    await this.audit(conversation.opaqueRef, "document_reference_added", input.actor.accountId);
    return { kind: "attached" as const };
  }
  async auditFor(conversationRef: string) {
    return this.dependencies.repository.listAudit(conversationRef);
  }
  async getClientConversation(
    input: Readonly<{ actor: MessagingActor; conversationRef: string }>,
  ): Promise<{ kind: "found"; conversation: ClientConversationDto } | { kind: "not_found" }> {
    const conversation = await this.dependencies.repository.getConversation(input.conversationRef);
    if (!conversation || !authorizeConversation(input.actor, conversation))
      return { kind: "not_found" };
    try {
      return {
        kind: "found",
        conversation: {
          opaqueRef: conversation.opaqueRef,
          subject: conversation.subject,
          reason: conversation.reason,
          state: conversation.state,
          documentRefs: conversation.documentRefs,
          messages: conversation.messages.map((message) => ({
            opaqueRef: message.opaqueRef,
            body: this.dependencies.cipher.open(message.ciphertext),
            createdAt: message.createdAt.toISOString(),
            sender: message.sender,
          })),
        },
      };
    } catch {
      return { kind: "not_found" };
    }
  }
}
