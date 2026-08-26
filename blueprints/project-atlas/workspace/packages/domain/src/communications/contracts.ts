export type ChannelKind = "public_web" | "whatsapp";
export type ChannelLocale = "es" | "en";

export type ChannelConnectionState =
  | "disabled"
  | "configured"
  | "sandbox_verified"
  | "production_verified"
  | "active"
  | "suspended"
  | "retired";

export type ProviderEventState =
  | "received"
  | "signature_verified"
  | "bounded_normalization"
  | "persisted"
  | "applied"
  | "ignored_duplicate"
  | "manual_review"
  | "rejected_invalid"
  | "quarantined"
  | "dead_letter";

export type OutboundCommandState =
  | "draft"
  | "policy_checked"
  | "queued"
  | "dispatching"
  | "provider_accepted"
  | "dispatch_unknown"
  | "reconciliation_required"
  | "reconciled_accepted"
  | "confirmed_not_sent"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "expired"
  | "cancelled"
  | "manual_review";

export type ContactPolicyState = "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";

export type ContactPurpose = "conversational" | "transactional" | "service" | "marketing";

export type ContactConsentState =
  | "not_requested"
  | "granted"
  | "withdrawn"
  | "expired"
  | "superseded";

export type TemplateLifecycleState =
  | "draft"
  | "internally_approved"
  | "submitted"
  | "provider_approved"
  | "provider_rejected"
  | "paused"
  | "disabled"
  | "superseded";

export type ConversationOwnershipState =
  | "new"
  | "ai_active"
  | "human_requested"
  | "waiting_for_human"
  | "human_active"
  | "returned_to_ai"
  | "closed"
  | "expired"
  | "restricted";

export type BindingTrustState =
  | "unlinked"
  | "candidate_match"
  | "linked_contact"
  | "verification_due"
  | "reverified"
  | "reassignment_suspected"
  | "suspended"
  | "revoked";

export type InboundChannelEvent = {
  eventId: string;
  channel: ChannelKind;
  locale: ChannelLocale;
  connectionState: ChannelConnectionState;
  bindingId: string;
  conversationId: string;
  messageId: string;
  receivedAt: Date;
  state: ProviderEventState;
  correlationId: string;
};

export type OutboundMessageCommand = {
  commandId: string;
  channel: ChannelKind;
  locale: ChannelLocale;
  conversationId: string;
  bindingId: string;
  messageId: string;
  idempotencyKey: string;
  state: OutboundCommandState;
  createdAt: Date;
  correlationId: string;
};

export type OutboundDispatchAttempt = {
  attemptId: string;
  commandId: string;
  ordinal: number;
  state: OutboundCommandState;
  startedAt: Date;
  completedAt?: Date;
  correlationId: string;
  externalMessageReferenceDigest?: string;
};

export type ChannelContactPolicy = {
  policyId: string;
  bindingId: string;
  state: ContactPolicyState;
  version: number;
  updatedAt: Date;
};

export type ContactChannelBinding = {
  bindingId: string;
  channel: ChannelKind;
  trustState: BindingTrustState;
  createdAt: Date;
  updatedAt: Date;
};

export type ChannelConversation = {
  id: string;
  channel: ChannelKind;
  locale: ChannelLocale;
  status: ConversationOwnershipState;
  participantIds: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  closedAt?: Date;
};

export type ChannelMessage = {
  id: string;
  conversationId: string;
  channel: ChannelKind;
  direction: "inbound" | "outbound" | "system";
  senderParticipantId: string;
  recipientParticipantId?: string;
  locale: ChannelLocale;
  kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
  body: string | null;
  createdAt: Date;
};

export type ChannelParticipant = {
  participantId: string;
  conversationId: string;
  bindingId: string;
  role: "external_contact" | "assistant" | "human" | "system";
  createdAt: Date;
};

export type ChannelHandoffReceipt = {
  receiptId: string;
  conversationId: string;
  state: "requested" | "queued" | "unavailable";
  issuedAt: Date;
};

export type CanonicalMediaReference = {
  mediaReferenceId: string;
  contentType: string;
  byteLength: number;
  checksum: string;
};

export type DomainReceipt = {
  receiptId: string;
  owner: "communications" | "identity" | "consent";
  operation: "handoff" | "binding_verification" | "consent_confirmation";
  resourceId: string;
  idempotencyKey: string;
  issuedAt: Date;
  expiresAt: Date;
};

export type ProviderCapabilitySnapshot = {
  channel: ChannelKind;
  connectionState: ChannelConnectionState;
  supportsTemplates: boolean;
  supportsMedia: boolean;
  capturedAt: Date;
};

export type MessageTemplateProjection = {
  templateId: string;
  locale: ChannelLocale;
  state: TemplateLifecycleState;
  version: number;
  updatedAt: Date;
};

export type ChannelAuditEvent = {
  event:
    | "inbound_received"
    | "inbound_rejected"
    | "inbound_applied"
    | "outbound_queued"
    | "outbound_dispatched"
    | "outbound_manual_review"
    | "policy_updated"
    | "binding_suspended";
  channel: ChannelKind;
  correlationId: string;
  occurredAt: Date;
  reasonCode?: string;
};
