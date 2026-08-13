export type ChatLocale = "es" | "en";

export type ConversationStatus =
  | "new"
  | "ai_active"
  | "human_requested"
  | "waiting_for_human"
  | "human_active"
  | "returned_to_ai"
  | "closed"
  | "expired"
  | "restricted";

export type ChatActor = "visitor" | "assistant" | "human" | "system";
export type MessageState = "accepted" | "answered" | "failed" | "handoff_required";

export type PublicCitation = {
  sourceId: string;
  title: string;
  path: string;
  locale: ChatLocale;
};

export type PublicChatMessage = {
  id: string;
  actor: ChatActor;
  body: string;
  state: MessageState;
  citations: PublicCitation[];
  createdAt: Date;
};

export type PublicChatConversation = {
  id: string;
  version: number;
  locale: ChatLocale;
  status: ConversationStatus;
  sessionHash: string;
  noticeVersion: string;
  correlationId: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  closedAt?: Date;
  handoffReceiptId?: string;
  messages: PublicChatMessage[];
};

export type PublicChatProjection = {
  id: string;
  version: number;
  locale: ChatLocale;
  status: ConversationStatus;
  messages: PublicChatMessage[];
  expiresAt: Date;
};

export type ChatFailureCode =
  | "not_found"
  | "expired"
  | "revoked"
  | "conflict"
  | "invalid_transition"
  | "human_active"
  | "content_rejected"
  | "moderation_unavailable"
  | "knowledge_unavailable"
  | "assistant_unavailable"
  | "handoff_required"
  | "handoff_unavailable";

export type ChatCommandSuccess = {
  ok: true;
  projection: PublicChatProjection;
  replayed: boolean;
};

export type ChatCommandFailure = {
  ok: false;
  code: ChatFailureCode;
  reason?: string;
  projection?: PublicChatProjection;
};

export type ChatCommandResult = ChatCommandSuccess | ChatCommandFailure;

export type PublicSessionContext = {
  sessionHash: string;
  correlationId: string;
};

export type ConversationCommit = {
  conversation: PublicChatConversation;
  expectedVersion: number;
  idempotencyKey: string;
  result: ChatCommandResult;
};

export interface ConversationRepository {
  create(conversation: PublicChatConversation): Promise<void>;
  findOwned(conversationId: string, sessionHash: string): Promise<PublicChatConversation | null>;
  findCommandResult(
    conversationId: string,
    idempotencyKey: string,
  ): Promise<ChatCommandResult | null>;
  commit(command: ConversationCommit): Promise<"committed" | "conflict">;
}

export type AuditEvent = {
  name:
    | "chat_conversation_started"
    | "chat_message_accepted"
    | "chat_message_rejected"
    | "chat_response_failed"
    | "chat_handoff_requested"
    | "chat_handoff_queued"
    | "chat_conversation_closed";
  conversationId: string;
  correlationId: string;
  version: number;
  locale: ChatLocale;
  reason?: string;
};

export interface AuditPort {
  record(event: AuditEvent): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdFactory {
  next(prefix: "conversation" | "message"): string;
}
