export type CommunicationEventKind =
  | "text_message"
  | "interactive_reply"
  | "message_status"
  | "media_reference"
  | "template_projection"
  | "unsupported_verified";

export type PersistedTemplateComponent = Readonly<{
  type: "header" | "body" | "footer" | "buttons";
  format?: "text" | "image" | "video" | "document";
  text?: string;
}>;

export type CommunicationEventPersistenceRecord = Readonly<{
  connectionId: string;
  externalEventReference: string | null;
  correlationId: string;
  receivedAt: Date;
  eventKind: CommunicationEventKind;
  schemaVersion: string;
  bindingId: string | null;
  messageReference: string | null;
  externalMessageReference: string | null;
  canonicalText: string | null;
  deliveryState: "sent" | "delivered" | "read" | "failed" | null;
  interactiveKind: "button" | "list" | null;
  interactiveId: string | null;
  interactiveTitle: string | null;
  mediaExternalReference: string | null;
  mediaDeclaredKind: "image" | "document" | "audio" | "sticker" | "video" | null;
  mediaMimeType: string | null;
  mediaChecksum: string | null;
  templateId: string | null;
  templateAuthorityState:
    | "draft"
    | "internally_approved"
    | "submitted"
    | "provider_approved"
    | "provider_rejected"
    | "paused"
    | "disabled"
    | "superseded"
    | null;
  templateAuthorityVersion: number | null;
  templateAuthorityUpdatedAt: Date | null;
  templateProviderReference: string | null;
  templateKey: string | null;
  templateLocale: "es" | "en" | null;
  templateCategory: "authentication" | "marketing" | "utility" | null;
  templateProviderState:
    | "submitted"
    | "provider_approved"
    | "provider_rejected"
    | "paused"
    | "disabled"
    | null;
  templateProviderVersion: string | null;
  templateProviderTimestamp: Date | null;
  templateComponents: readonly PersistedTemplateComponent[] | null;
  unsupportedReason:
    | "ambiguous_payload"
    | "connection_mismatch"
    | "malformed_payload"
    | "payload_too_large"
    | "template_manual_review"
    | "unsupported_event"
    | "unverified_context"
    | null;
  bodyRetentionPolicy: "metadata_only" | "synthetic_local_text" | "approved";
  occurredAt: Date;
}>;

const RECORD_KEYS = Object.freeze([
  "connectionId",
  "externalEventReference",
  "correlationId",
  "receivedAt",
  "eventKind",
  "schemaVersion",
  "bindingId",
  "messageReference",
  "externalMessageReference",
  "canonicalText",
  "deliveryState",
  "interactiveKind",
  "interactiveId",
  "interactiveTitle",
  "mediaExternalReference",
  "mediaDeclaredKind",
  "mediaMimeType",
  "mediaChecksum",
  "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
  "templateKey",
  "templateLocale",
  "templateCategory",
  "templateProviderState",
  "templateProviderVersion",
  "templateProviderTimestamp",
  "templateComponents",
  "unsupportedReason",
  "bodyRetentionPolicy",
  "occurredAt",
] satisfies readonly (keyof CommunicationEventPersistenceRecord)[]);

const EVENT_KINDS = new Set<CommunicationEventKind>([
  "text_message",
  "interactive_reply",
  "message_status",
  "media_reference",
  "template_projection",
  "unsupported_verified",
]);
const DELIVERY_STATES = new Set(["sent", "delivered", "read", "failed"]);
const INTERACTIVE_KINDS = new Set(["button", "list"]);
const MEDIA_KINDS = new Set(["image", "document", "audio", "sticker", "video"]);
const TEMPLATE_LOCALES = new Set(["es", "en"]);
const TEMPLATE_AUTHORITY_STATES = new Set([
  "draft",
  "internally_approved",
  "submitted",
  "provider_approved",
  "provider_rejected",
  "paused",
  "disabled",
  "superseded",
]);
const TEMPLATE_CATEGORIES = new Set(["authentication", "marketing", "utility"]);
const TEMPLATE_STATES = new Set([
  "submitted",
  "provider_approved",
  "provider_rejected",
  "paused",
  "disabled",
]);
const UNSUPPORTED_REASONS = new Set([
  "ambiguous_payload",
  "connection_mismatch",
  "malformed_payload",
  "payload_too_large",
  "template_manual_review",
  "unsupported_event",
  "unverified_context",
]);
const COMPONENT_TYPES = new Set(["header", "body", "footer", "buttons"]);
const COMPONENT_FORMATS = new Set(["text", "image", "video", "document"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function isNull(value: unknown): value is null {
  return value === null;
}

function hasOnlyNulls(record: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => isNull(record[key]));
}

function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
  if (!isObject(value)) return false;
  const keys = Object.keys(value);
  if (
    keys.some((key) => !["type", "format", "text"].includes(key)) ||
    !COMPONENT_TYPES.has(String(value.type))
  ) {
    return false;
  }
  if (value.format !== undefined && !COMPONENT_FORMATS.has(String(value.format))) return false;
  return value.text === undefined || typeof value.text === "string";
}

const MESSAGE_ONLY_FIELDS = [
  "externalMessageReference",
  "deliveryState",
  "interactiveKind",
  "interactiveId",
  "interactiveTitle",
  "mediaExternalReference",
  "mediaDeclaredKind",
  "mediaMimeType",
  "mediaChecksum",
  "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
  "templateKey",
  "templateLocale",
  "templateCategory",
  "templateProviderState",
  "templateProviderVersion",
  "templateProviderTimestamp",
  "templateComponents",
  "unsupportedReason",
] as const;

function hasValidTypedShape(record: Record<string, unknown>): boolean {
  switch (record.eventKind) {
    case "text_message":
      return (
        isNonEmptyString(record.bindingId) &&
        isNonEmptyString(record.messageReference) &&
        ((record.bodyRetentionPolicy === "metadata_only" && isNull(record.canonicalText)) ||
          (["synthetic_local_text", "approved"].includes(String(record.bodyRetentionPolicy)) &&
            typeof record.canonicalText === "string")) &&
        hasOnlyNulls(record, MESSAGE_ONLY_FIELDS)
      );
    case "interactive_reply":
      return (
        record.bodyRetentionPolicy === "metadata_only" &&
        isNull(record.canonicalText) &&
        isNonEmptyString(record.bindingId) &&
        isNonEmptyString(record.messageReference) &&
        INTERACTIVE_KINDS.has(String(record.interactiveKind)) &&
        isNonEmptyString(record.interactiveId) &&
        typeof record.interactiveTitle === "string" &&
        hasOnlyNulls(record, [
          "externalMessageReference",
          "deliveryState",
          "mediaExternalReference",
          "mediaDeclaredKind",
          "mediaMimeType",
          "mediaChecksum",
          "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
          "templateKey",
          "templateLocale",
          "templateCategory",
          "templateProviderState",
          "templateProviderVersion",
          "templateProviderTimestamp",
          "templateComponents",
          "unsupportedReason",
        ])
      );
    case "message_status":
      return (
        record.bodyRetentionPolicy === "metadata_only" &&
        isNull(record.canonicalText) &&
        isNonEmptyString(record.externalMessageReference) &&
        DELIVERY_STATES.has(String(record.deliveryState)) &&
        hasOnlyNulls(record, [
          "bindingId",
          "messageReference",
          "interactiveKind",
          "interactiveId",
          "interactiveTitle",
          "mediaExternalReference",
          "mediaDeclaredKind",
          "mediaMimeType",
          "mediaChecksum",
          "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
          "templateKey",
          "templateLocale",
          "templateCategory",
          "templateProviderState",
          "templateProviderVersion",
          "templateProviderTimestamp",
          "templateComponents",
          "unsupportedReason",
        ])
      );
    case "media_reference":
      return (
        record.bodyRetentionPolicy === "metadata_only" &&
        isNull(record.canonicalText) &&
        isNonEmptyString(record.bindingId) &&
        isNonEmptyString(record.messageReference) &&
        isNonEmptyString(record.mediaExternalReference) &&
        MEDIA_KINDS.has(String(record.mediaDeclaredKind)) &&
        isNullableNonEmptyString(record.mediaMimeType) &&
        (record.mediaChecksum === null ||
          (typeof record.mediaChecksum === "string" &&
            /^[0-9a-f]{64}$/u.test(record.mediaChecksum))) &&
        hasOnlyNulls(record, [
          "externalMessageReference",
          "deliveryState",
          "interactiveKind",
          "interactiveId",
          "interactiveTitle",
          "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
          "templateKey",
          "templateLocale",
          "templateCategory",
          "templateProviderState",
          "templateProviderVersion",
          "templateProviderTimestamp",
          "templateComponents",
          "unsupportedReason",
        ])
      );
    case "template_projection":
      return (
        record.bodyRetentionPolicy === "metadata_only" &&
        isNull(record.canonicalText) &&
        isNonEmptyString(record.templateId) &&
        TEMPLATE_AUTHORITY_STATES.has(String(record.templateAuthorityState)) &&
        Number.isSafeInteger(record.templateAuthorityVersion) &&
        Number(record.templateAuthorityVersion) > 0 &&
        isValidDate(record.templateAuthorityUpdatedAt) &&
        isNonEmptyString(record.templateProviderReference) &&
        isNonEmptyString(record.templateKey) &&
        TEMPLATE_LOCALES.has(String(record.templateLocale)) &&
        TEMPLATE_CATEGORIES.has(String(record.templateCategory)) &&
        TEMPLATE_STATES.has(String(record.templateProviderState)) &&
        isNonEmptyString(record.templateProviderVersion) &&
        isValidDate(record.templateProviderTimestamp) &&
        Array.isArray(record.templateComponents) &&
        record.templateComponents.every(isTemplateComponent) &&
        hasOnlyNulls(record, [
          "bindingId",
          "messageReference",
          "externalMessageReference",
          "deliveryState",
          "interactiveKind",
          "interactiveId",
          "interactiveTitle",
          "mediaExternalReference",
          "mediaDeclaredKind",
          "mediaMimeType",
          "mediaChecksum",
          "unsupportedReason",
        ])
      );
    case "unsupported_verified":
      return (
        record.bodyRetentionPolicy === "metadata_only" &&
        isNull(record.externalEventReference) &&
        isNull(record.canonicalText) &&
        UNSUPPORTED_REASONS.has(String(record.unsupportedReason)) &&
        hasOnlyNulls(record, [
          "bindingId",
          "messageReference",
          "externalMessageReference",
          "deliveryState",
          "interactiveKind",
          "interactiveId",
          "interactiveTitle",
          "mediaExternalReference",
          "mediaDeclaredKind",
          "mediaMimeType",
          "mediaChecksum",
          "templateId",
  "templateAuthorityState",
  "templateAuthorityVersion",
  "templateAuthorityUpdatedAt",
  "templateProviderReference",
          "templateKey",
          "templateLocale",
          "templateCategory",
          "templateProviderState",
          "templateProviderVersion",
          "templateProviderTimestamp",
          "templateComponents",
        ])
      );
    default:
      return false;
  }
}

export function validateCommunicationEventRecord(
  value: unknown,
): CommunicationEventPersistenceRecord {
  if (
    !isObject(value) ||
    !hasExactKeys(value, RECORD_KEYS) ||
    !EVENT_KINDS.has(value.eventKind as CommunicationEventKind) ||
    !isNonEmptyString(value.connectionId) ||
    !isNonEmptyString(value.correlationId) ||
    !isNonEmptyString(value.schemaVersion) ||
    !isValidDate(value.receivedAt) ||
    !isValidDate(value.occurredAt) ||
    (value.eventKind !== "unsupported_verified" &&
      !isNonEmptyString(value.externalEventReference)) ||
    !hasValidTypedShape(value)
  ) {
    throw new Error("COMMUNICATION_EVENT_RECORD_INVALID");
  }
  return value as CommunicationEventPersistenceRecord;
}
