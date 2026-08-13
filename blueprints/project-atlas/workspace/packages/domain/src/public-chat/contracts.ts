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
  summary: string;
  disclosure: string;
  sourceKind: "provider" | null;
};

export type PublicChatAction = {
  key: "help_center" | "human_support";
  path: string;
};

export type PublicChatMessage = {
  id: string;
  actor: ChatActor;
  body: string | null;
  state: MessageState;
  citations: PublicCitation[];
  actions: PublicChatAction[];
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
  handoffReason?:
    | "visitor_requested"
    | "complaint"
    | "safety"
    | "policy_required"
    | "assistant_unavailable";
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
  | "command_in_progress"
  | "invalid_transition"
  | "human_active"
  | "content_rejected"
  | "moderation_unavailable"
  | "knowledge_unavailable"
  | "assistant_unavailable"
  | "clarification_required"
  | "handoff_required"
  | "handoff_unavailable";

export type ChatReasonCode =
  | "ambiguous"
  | "government_identifier"
  | "payment_card"
  | "bank_account"
  | "credential"
  | "markup"
  | "abuse"
  | "safety"
  | "policy_required"
  | "visitor_requested"
  | "complaint"
  | "assistant_unavailable"
  | "disabled"
  | "timeout"
  | "provider_error"
  | "response_invalid"
  | "response_rejected"
  | "unknown";

export type ChatCommandSuccess = {
  ok: true;
  projection: PublicChatProjection;
  replayed: boolean;
};

export type ChatCommandFailure = {
  ok: false;
  code: ChatFailureCode;
  reason?: ChatReasonCode;
  projection?: PublicChatProjection;
};

export type ChatCommandResult = ChatCommandSuccess | ChatCommandFailure;

export type PublicSessionContext = {
  sessionHash: string;
  correlationId: string;
};

export type CommandReservation = {
  conversationId: string;
  expectedVersion: number;
  idempotencyKey: string;
  leaseExpiresAt: Date;
};

export type CommandClaimResult =
  | { status: "claimed"; leaseToken: string }
  | { status: "completed"; result: ChatCommandResult }
  | { status: "in_progress" }
  | { status: "conflict" };

export type ChatCommandKind = "message" | "handoff" | "locale" | "close";

export type ClaimedCommandAdvance = {
  kind: ChatCommandKind;
  conversation: PublicChatConversation;
  expectedVersion: number;
  idempotencyKey: string;
  leaseToken: string;
};

export type CommandCompletion = ClaimedCommandAdvance & {
  result: ChatCommandResult;
};

export interface ConversationRepository {
  create(conversation: PublicChatConversation): Promise<void>;
  findOwned(conversationId: string, sessionHash: string): Promise<PublicChatConversation | null>;
  findCommandResult(
    conversationId: string,
    idempotencyKey: string,
  ): Promise<ChatCommandResult | null>;
  claimCommand(command: CommandReservation): Promise<CommandClaimResult>;
  waitForCommandResult(
    conversationId: string,
    idempotencyKey: string,
    waitUntil: Date,
  ): Promise<ChatCommandResult | null>;
  advanceClaimedCommand(command: ClaimedCommandAdvance): Promise<"advanced" | "conflict">;
  completeCommand(command: CommandCompletion): Promise<"completed" | "conflict">;
}

export type AuditEvent = {
  name:
    | "chat_conversation_started"
    | "chat_message_accepted"
    | "chat_message_rejected"
    | "chat_response_failed"
    | "chat_handoff_requested"
    | "chat_handoff_queued"
    | "chat_locale_changed"
    | "chat_conversation_closed";
  conversationId: string;
  correlationId: string;
  version: number;
  locale: ChatLocale;
  reason?: ChatReasonCode;
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
