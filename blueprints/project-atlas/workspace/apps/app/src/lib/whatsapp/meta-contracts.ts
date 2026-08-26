import type {
  MessageTemplateProjection,
  OutboundCommandState,
  TemplateLifecycleState,
} from "@atlas/domain";

export type VerifiedWebhookContext = {
  readonly kind: "verified_meta_webhook";
};

export type UnsupportedVerifiedReason =
  | "ambiguous_payload"
  | "connection_mismatch"
  | "malformed_payload"
  | "payload_too_large"
  | "template_manual_review"
  | "unsupported_event"
  | "unverified_context";

export type UnsupportedVerifiedEnvelope = {
  readonly kind: "unsupported_verified";
  readonly connectionId: string;
  readonly reason: UnsupportedVerifiedReason;
  readonly receivedAt: Date;
  readonly correlationId: string;
};

type CanonicalEnvelopeBase = {
  readonly connectionId: string;
  readonly externalEventReference: string;
  readonly receivedAt: Date;
  readonly correlationId: string;
};

export type CanonicalTextEnvelope = CanonicalEnvelopeBase & {
  readonly kind: "text_message";
  readonly messageReference: string;
  readonly senderEndpoint: string;
  readonly text: string;
  readonly occurredAt: Date;
};

export type CanonicalInteractiveEnvelope = CanonicalEnvelopeBase & {
  readonly kind: "interactive_reply";
  readonly messageReference: string;
  readonly senderEndpoint: string;
  readonly replyKind: "button" | "list";
  readonly replyId: string;
  readonly replyTitle: string;
  readonly occurredAt: Date;
};

export type CanonicalMediaEnvelope = CanonicalEnvelopeBase & {
  readonly kind: "media_reference";
  readonly messageReference: string;
  readonly senderEndpoint: string;
  readonly occurredAt: Date;
  readonly media: {
    readonly externalReference: string;
    readonly declaredKind: "audio" | "document" | "image" | "sticker" | "video";
    readonly mimeType?: string;
    readonly checksum?: string;
  };
};

export type CanonicalStatusEnvelope = CanonicalEnvelopeBase & {
  readonly kind: "message_status";
  readonly externalMessageReference: string;
  readonly status: Extract<OutboundCommandState, "sent" | "delivered" | "read" | "failed">;
  readonly occurredAt: Date;
};

export type CanonicalTemplateComponent = {
  readonly type: "body" | "buttons" | "footer" | "header";
  readonly format?: "document" | "image" | "text" | "video";
  readonly text?: string;
};

export type CanonicalTemplateProjection = MessageTemplateProjection & {
  readonly providerReference: string;
  readonly templateKey: string;
  readonly category: "authentication" | "marketing" | "utility";
  readonly components: readonly CanonicalTemplateComponent[];
  readonly status: Extract<
    TemplateLifecycleState,
    "submitted" | "provider_approved" | "provider_rejected" | "paused" | "disabled"
  >;
  readonly providerVersion: string;
  readonly providerTimestamp: Date;
};

export type CanonicalTemplateProjectionEnvelope = CanonicalEnvelopeBase & {
  readonly kind: "template_projection";
  readonly projection: CanonicalTemplateProjection;
};

export type CanonicalProviderEnvelope =
  | CanonicalInteractiveEnvelope
  | CanonicalMediaEnvelope
  | CanonicalStatusEnvelope
  | CanonicalTemplateProjectionEnvelope
  | CanonicalTextEnvelope;

export type ProviderTextDispatchContent = {
  readonly kind: "text";
  readonly body: string;
};

export type ProviderTemplateTextComponent = {
  readonly type: "body" | "header";
  readonly parameters: readonly { readonly type: "text"; readonly text: string }[];
};

export type ProviderTemplateQuickReplyComponent = {
  readonly type: "button";
  readonly subType: "quick_reply";
  readonly index: number;
  readonly parameters: readonly [{ readonly type: "payload"; readonly payload: string }];
};

export type ProviderTemplateDispatchComponent =
  | ProviderTemplateQuickReplyComponent
  | ProviderTemplateTextComponent;

export type ProviderTemplateDispatchContent = {
  readonly kind: "template";
  readonly providerTemplateName: string;
  readonly languageCode: string;
  readonly components: readonly ProviderTemplateDispatchComponent[];
};

export type ProviderDispatchCommand = {
  readonly connectionId: string;
  readonly recipientEndpoint: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly content: ProviderTemplateDispatchContent | ProviderTextDispatchContent;
};

export type ProviderDispatchResult =
  | { readonly status: "accepted"; readonly externalMessageReference: string }
  | {
      readonly status: "confirmed_not_sent";
      readonly reason:
        | "aborted_before_dispatch"
        | "credentials_unavailable"
        | "invalid_command"
        | "invalid_configuration"
        | "provider_rejected";
      readonly statusCode?: number;
    }
  | { readonly status: "dispatch_unknown"; readonly reason: "acceptance_ambiguous" };

export type ProviderReconciliationQuery = {
  readonly connectionId: string;
  readonly attemptId: string;
};

export type ProviderMessageReconciliationQuery = {
  readonly connectionId: string;
  readonly cursor: string | null;
  readonly limit: number;
};

export type ProviderTemplateReconciliationQuery = ProviderMessageReconciliationQuery;

export type ProviderReconciliationResult = {
  readonly status: "unsupported";
  readonly reason: "activation_review_required";
};

export type ProviderMessageReconciliationResult = ProviderReconciliationResult;
export type ProviderTemplateReconciliationResult = ProviderReconciliationResult;

export type ProviderInboundKind =
  | "interactive_reply"
  | "media_reference"
  | "message_status"
  | "template_projection"
  | "text_message";

export type ProviderStatusKind = "delivered" | "failed" | "read" | "sent";

export type ProviderCapabilitySnapshot = {
  readonly requestIdempotency: false;
  readonly stableReference: false;
  readonly messageLookup: false;
  readonly statusReconciliation: false;
  readonly mediaReferences: true;
  readonly templateProjection: true;
  readonly observedAt: Date;
  readonly supportedInboundKinds: readonly ProviderInboundKind[];
  readonly supportedStatusKinds: readonly ProviderStatusKind[];
};

export interface WhatsAppProviderAdapter {
  capabilities(): ProviderCapabilitySnapshot;
  normalizeVerifiedEvent(
    raw: Uint8Array,
    context: VerifiedWebhookContext,
  ): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope>;
  dispatch(command: ProviderDispatchCommand, signal: AbortSignal): Promise<ProviderDispatchResult>;
  reconcile(
    attempt: ProviderReconciliationQuery,
    signal: AbortSignal,
  ): Promise<ProviderReconciliationResult>;
  reconcileMessages(
    query: ProviderMessageReconciliationQuery,
    signal: AbortSignal,
  ): Promise<ProviderMessageReconciliationResult>;
  reconcileTemplates(
    query: ProviderTemplateReconciliationQuery,
    signal: AbortSignal,
  ): Promise<ProviderTemplateReconciliationResult>;
}

export const META_SUPPORTED_INBOUND_KINDS = Object.freeze([
  "text_message",
  "interactive_reply",
  "message_status",
  "media_reference",
  "template_projection",
] satisfies readonly ProviderInboundKind[]);

export const META_SUPPORTED_STATUS_KINDS = Object.freeze([
  "sent",
  "delivered",
  "read",
  "failed",
] satisfies readonly ProviderStatusKind[]);
