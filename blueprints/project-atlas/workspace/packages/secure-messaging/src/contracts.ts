export type MessagingActor = Readonly<{
  accountId: string;
  contextRef: string;
  assurance: "aal1" | "aal2";
  authorizationEpoch: string;
  policyEpoch: string;
}>;
export type StaffMessagingActor = Readonly<{ accountId: string; canManageSecureMessages: true }>;
export type ConversationReason =
  | "general_question"
  | "service_status"
  | "document_question"
  | "payment_question"
  | "appointment_question"
  | "technical_support"
  | "complaint"
  | "security_issue"
  | "other";
export type ConversationState =
  | "new"
  | "waiting_for_client"
  | "waiting_for_staff"
  | "waiting_for_human"
  | "human_active"
  | "resolved"
  | "closed"
  | "archived"
  | "blocked";
export type StoredMessage = Readonly<{
  opaqueRef: string;
  ciphertext: string;
  sender: "client" | "staff";
  createdAt: Date;
}>;
export type StoredConversation = Readonly<{
  opaqueRef: string;
  ownerAccountId: string;
  contextRef: string;
  authorizationEpoch: string;
  policyEpoch: string;
  clientVisible: boolean;
  subject: string;
  reason: ConversationReason;
  state: ConversationState;
  messages: readonly StoredMessage[];
  internalNotes: readonly Readonly<{ opaqueRef: string; ciphertext: string; createdAt: Date }>[];
  documentRefs: readonly string[];
  createdAt: Date;
  updatedAt: Date;
}>;
export type MessagingAuditEvent = Readonly<{
  opaqueRef: string;
  conversationRef: string;
  action: string;
  actorRef: string;
  createdAt: Date;
}>;
export type ClientMessage = Readonly<{
  opaqueRef: string;
  body: string;
  createdAt: string;
  sender: "client" | "staff";
}>;
export type ClientConversationDto = Readonly<{
  opaqueRef: string;
  subject: string;
  reason: ConversationReason;
  state: ConversationState;
  documentRefs: readonly string[];
  messages: readonly ClientMessage[];
}>;
export type ClientInboxItemDto = Readonly<{
  opaqueRef: string;
  subject: string;
  state: ConversationState;
  preview: string;
  updatedAt: string;
}>;
