import {
  type CommunicationEventPersistenceRecord,
  type CommunicationEventSchemaVersion,
  isSupportedCommunicationEventSchemaVersion,
  type PersistedTemplateComponent,
  validateCommunicationEventRecord,
} from "@atlas/database";
import type {
  CanonicalInteractiveEnvelope,
  CanonicalMediaEnvelope,
  CanonicalProviderEnvelope,
  CanonicalStatusEnvelope,
  CanonicalTemplateProjectionEnvelope,
  UnsupportedVerifiedEnvelope,
} from "./meta-contracts.ts";

export type SafePersistedProviderEnvelope =
  | (Omit<CanonicalMediaEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
  | CanonicalTemplateProjectionEnvelope
  | UnsupportedVerifiedEnvelope;

export type ProviderEnvelopeDeserializationResult =
  | Readonly<{ status: "available"; envelope: SafePersistedProviderEnvelope }>
  | Readonly<{
      status: "not_reversible";
      eventKind: "interactive_reply" | "message_status" | "text_message";
      reason: "metadata_only" | "verified_context_required";
    }>;

export type ProviderEnvelopePersistenceContext = Readonly<{
  schemaVersion: CommunicationEventSchemaVersion;
  senderBindingId?: string;
}>;

const BASE_KEYS = ["connectionId", "externalEventReference", "receivedAt", "correlationId"];
const UNSUPPORTED_REASONS = new Set([
  "ambiguous_payload",
  "connection_mismatch",
  "malformed_payload",
  "payload_too_large",
  "template_manual_review",
  "unsupported_event",
  "unverified_context",
]);
const TEMPLATE_COMPONENT_TYPES = new Set(["header", "body", "footer", "buttons"]);
const TEMPLATE_COMPONENT_FORMATS = new Set(["text", "image", "video", "document"]);
const META_EVENT_REFERENCE_PATTERN = /^meta_evt_[0-9a-f]{32,64}$/u;
const META_MESSAGE_REFERENCE_PATTERN = /^wamid\.[A-Za-z0-9_]{16,120}$/u;
const META_GRAPH_NUMERIC_REFERENCE_PATTERN = /^[1-9][0-9]{5,31}$/u;
const PERSISTENCE_CONTEXT_KEYS = new Set(["schemaVersion", "senderBindingId"]);

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

function isMetaReference(value: unknown, pattern: RegExp): value is string {
  return typeof value === "string" && pattern.test(value);
}

function assertPersistenceContext(
  value: unknown,
): asserts value is ProviderEnvelopePersistenceContext {
  if (
    !isObject(value) ||
    Object.keys(value).some((key) => !PERSISTENCE_CONTEXT_KEYS.has(key)) ||
    !isSupportedCommunicationEventSchemaVersion(value.schemaVersion) ||
    (value.senderBindingId !== undefined && !isNonEmptyString(value.senderBindingId))
  ) {
    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  }
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function assertBase(value: Record<string, unknown>): void {
  if (
    !isNonEmptyString(value.connectionId) ||
    !isMetaReference(value.externalEventReference, META_EVENT_REFERENCE_PATTERN) ||
    !isValidDate(value.receivedAt) ||
    !isNonEmptyString(value.correlationId)
  ) {
    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  }
}

function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
  if (!isObject(value)) return false;
  const keys = Object.keys(value);
  if (
    !keys.includes("type") ||
    keys.some((key) => !["type", "format", "text"].includes(key)) ||
    !TEMPLATE_COMPONENT_TYPES.has(String(value.type))
  ) {
    return false;
  }
  if (value.format !== undefined && !TEMPLATE_COMPONENT_FORMATS.has(String(value.format))) {
    return false;
  }
  if (value.text !== undefined && typeof value.text !== "string") return false;
  return true;
}

function assertProviderEnvelope(
  value: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
): void {
  if (!isObject(value) || typeof value.kind !== "string") {
    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  }
  switch (value.kind) {
    case "text_message":
      if (
        !hasExactKeys(value, [
          ...BASE_KEYS,
          "kind",
          "messageReference",
          "senderEndpoint",
          "text",
          "occurredAt",
        ]) ||
        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
        !isNonEmptyString(value.senderEndpoint) ||
        typeof value.text !== "string" ||
        !isValidDate(value.occurredAt)
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      assertBase(value);
      return;
    case "interactive_reply":
      if (
        !hasExactKeys(value, [
          ...BASE_KEYS,
          "kind",
          "messageReference",
          "senderEndpoint",
          "replyKind",
          "replyId",
          "replyTitle",
          "occurredAt",
        ]) ||
        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
        !isNonEmptyString(value.senderEndpoint) ||
        !["button", "list"].includes(String(value.replyKind)) ||
        !isNonEmptyString(value.replyId) ||
        typeof value.replyTitle !== "string" ||
        !isValidDate(value.occurredAt)
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      assertBase(value);
      return;
    case "message_status":
      if (
        !hasExactKeys(value, [
          ...BASE_KEYS,
          "kind",
          "externalMessageReference",
          "status",
          "occurredAt",
        ]) ||
        !isMetaReference(value.externalMessageReference, META_MESSAGE_REFERENCE_PATTERN) ||
        !["sent", "delivered", "read", "failed"].includes(String(value.status)) ||
        !isValidDate(value.occurredAt)
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      assertBase(value);
      return;
    case "media_reference":
      if (
        !hasExactKeys(value, [
          ...BASE_KEYS,
          "kind",
          "messageReference",
          "senderEndpoint",
          "occurredAt",
          "media",
        ]) ||
        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
        !isNonEmptyString(value.senderEndpoint) ||
        !isValidDate(value.occurredAt) ||
        !isObject(value.media) ||
        Object.keys(value.media).some(
          (key) => !["externalReference", "declaredKind", "mimeType", "checksum"].includes(key),
        ) ||
        !isMetaReference(value.media.externalReference, META_GRAPH_NUMERIC_REFERENCE_PATTERN) ||
        !["image", "document", "audio", "sticker", "video"].includes(
          String(value.media.declaredKind),
        ) ||
        (value.media.mimeType !== undefined && !isNonEmptyString(value.media.mimeType)) ||
        (value.media.checksum !== undefined &&
          (typeof value.media.checksum !== "string" ||
            !/^[0-9a-f]{64}$/u.test(value.media.checksum)))
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      assertBase(value);
      return;
    case "template_projection": {
      const projection = value.projection;
      if (
        !hasExactKeys(value, [...BASE_KEYS, "kind", "projection"]) ||
        !isObject(projection) ||
        !hasExactKeys(projection, [
          "templateId",
          "locale",
          "state",
          "version",
          "updatedAt",
          "providerReference",
          "templateKey",
          "category",
          "components",
          "status",
          "providerVersion",
          "providerTimestamp",
        ]) ||
        !isNonEmptyString(projection.templateId) ||
        !["es", "en"].includes(String(projection.locale)) ||
        ![
          "draft",
          "internally_approved",
          "submitted",
          "provider_approved",
          "provider_rejected",
          "paused",
          "disabled",
          "superseded",
        ].includes(String(projection.state)) ||
        !Number.isSafeInteger(projection.version) ||
        Number(projection.version) <= 0 ||
        !isValidDate(projection.updatedAt) ||
        !isMetaReference(projection.providerReference, META_GRAPH_NUMERIC_REFERENCE_PATTERN) ||
        !isNonEmptyString(projection.templateKey) ||
        !["authentication", "marketing", "utility"].includes(String(projection.category)) ||
        !Array.isArray(projection.components) ||
        !projection.components.every(isTemplateComponent) ||
        !["submitted", "provider_approved", "provider_rejected", "paused", "disabled"].includes(
          String(projection.status),
        ) ||
        !isNonEmptyString(projection.providerVersion) ||
        !isValidDate(projection.providerTimestamp)
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      assertBase(value);
      return;
    }
    case "unsupported_verified":
      if (
        !hasExactKeys(value, ["kind", "connectionId", "reason", "receivedAt", "correlationId"]) ||
        !isNonEmptyString(value.connectionId) ||
        !UNSUPPORTED_REASONS.has(String(value.reason)) ||
        !isValidDate(value.receivedAt) ||
        !isNonEmptyString(value.correlationId)
      ) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
      }
      return;
    default:
      throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
  }
}

const EMPTY_TYPED_FIELDS = Object.freeze({
  bindingId: null,
  messageReference: null,
  externalMessageReference: null,
  canonicalText: null,
  deliveryState: null,
  interactiveKind: null,
  interactiveId: null,
  interactiveTitle: null,
  mediaExternalReference: null,
  mediaDeclaredKind: null,
  mediaMimeType: null,
  mediaChecksum: null,
  templateId: null,
  templateAuthorityState: null,
  templateAuthorityVersion: null,
  templateAuthorityUpdatedAt: null,
  templateProviderReference: null,
  templateKey: null,
  templateLocale: null,
  templateCategory: null,
  templateProviderState: null,
  templateProviderVersion: null,
  templateProviderTimestamp: null,
  templateComponents: null,
  unsupportedReason: null,
});

export function serializeMetaCanonicalEnvelope(
  envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
  context: ProviderEnvelopePersistenceContext,
): CommunicationEventPersistenceRecord {
  assertPersistenceContext(context);
  assertProviderEnvelope(envelope);
  const base = {
    ...EMPTY_TYPED_FIELDS,
    connectionId: envelope.connectionId,
    externalEventReference:
      envelope.kind === "unsupported_verified" ? null : envelope.externalEventReference,
    correlationId: envelope.correlationId,
    receivedAt: envelope.receivedAt,
    eventKind: envelope.kind,
    schemaVersion: context.schemaVersion,
    bodyRetentionPolicy: "metadata_only" as const,
    occurredAt:
      envelope.kind === "unsupported_verified"
        ? envelope.receivedAt
        : envelope.kind === "template_projection"
          ? envelope.projection.providerTimestamp
          : envelope.occurredAt,
  };
  let record: CommunicationEventPersistenceRecord;
  switch (envelope.kind) {
    case "text_message":
      if (!isNonEmptyString(context.senderBindingId)) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
      }
      record = {
        ...base,
        bindingId: context.senderBindingId,
        messageReference: envelope.messageReference,
      };
      break;
    case "interactive_reply":
      if (!isNonEmptyString(context.senderBindingId)) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
      }
      record = {
        ...base,
        bindingId: context.senderBindingId,
        messageReference: envelope.messageReference,
        interactiveKind: envelope.replyKind,
      };
      break;
    case "message_status":
      record = {
        ...base,
        externalMessageReference: envelope.externalMessageReference,
        deliveryState: envelope.status,
      };
      break;
    case "media_reference":
      if (!isNonEmptyString(context.senderBindingId)) {
        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
      }
      record = {
        ...base,
        bindingId: context.senderBindingId,
        messageReference: envelope.messageReference,
        mediaExternalReference: envelope.media.externalReference,
        mediaDeclaredKind: envelope.media.declaredKind,
        mediaMimeType: envelope.media.mimeType ?? null,
        mediaChecksum: envelope.media.checksum ?? null,
      };
      break;
    case "template_projection":
      record = {
        ...base,
        templateId: envelope.projection.templateId,
        templateAuthorityState: envelope.projection.state,
        templateAuthorityVersion: envelope.projection.version,
        templateAuthorityUpdatedAt: envelope.projection.updatedAt,
        templateProviderReference: envelope.projection.providerReference,
        templateKey: envelope.projection.templateKey,
        templateLocale: envelope.projection.locale,
        templateCategory: envelope.projection.category,
        templateProviderState: envelope.projection.status,
        templateProviderVersion: envelope.projection.providerVersion,
        templateProviderTimestamp: envelope.projection.providerTimestamp,
        templateComponents: envelope.projection.components.map((component) => ({
          type: component.type,
          ...(component.format === undefined ? {} : { format: component.format }),
        })),
      };
      break;
    case "unsupported_verified":
      record = { ...base, unsupportedReason: envelope.reason };
      break;
  }
  return validateCommunicationEventRecord(record);
}

function required<T>(value: T | null): T {
  if (value === null) throw new Error("COMMUNICATION_EVENT_RECORD_INVALID");
  return value;
}

export function deserializeMetaCanonicalEnvelopeRecord(
  input: unknown,
): ProviderEnvelopeDeserializationResult {
  const record = validateCommunicationEventRecord(input);
  const supportedBase = () => ({
    connectionId: record.connectionId,
    externalEventReference: required(record.externalEventReference),
    correlationId: record.correlationId,
    receivedAt: record.receivedAt,
  });
  switch (record.eventKind) {
    case "text_message":
      return { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" };
    case "interactive_reply":
      return {
        status: "not_reversible",
        eventKind: "interactive_reply",
        reason: "metadata_only",
      };
    case "message_status":
      return {
        status: "not_reversible",
        eventKind: "message_status",
        reason: "verified_context_required",
      };
    case "media_reference":
      return {
        status: "available",
        envelope: {
          ...supportedBase(),
          kind: "media_reference",
          senderBindingId: required(record.bindingId),
          messageReference: required(record.messageReference),
          occurredAt: record.occurredAt,
          media: {
            externalReference: required(record.mediaExternalReference),
            declaredKind: required(record.mediaDeclaredKind),
            ...(record.mediaMimeType === null ? {} : { mimeType: record.mediaMimeType }),
            ...(record.mediaChecksum === null ? {} : { checksum: record.mediaChecksum }),
          },
        },
      };
    case "template_projection":
      return {
        status: "available",
        envelope: {
          ...supportedBase(),
          kind: "template_projection",
          projection: {
            templateId: required(record.templateId),
            locale: required(record.templateLocale),
            state: required(record.templateAuthorityState),
            version: required(record.templateAuthorityVersion),
            updatedAt: required(record.templateAuthorityUpdatedAt),
            providerReference: required(record.templateProviderReference),
            templateKey: required(record.templateKey),
            category: required(record.templateCategory),
            status: required(record.templateProviderState),
            providerVersion: required(record.templateProviderVersion),
            providerTimestamp: required(record.templateProviderTimestamp),
            components: required(record.templateComponents).map((component) => ({
              type: component.type,
              ...(component.format === undefined ? {} : { format: component.format }),
            })),
          },
        },
      };
    case "unsupported_verified":
      return {
        status: "available",
        envelope: {
          kind: "unsupported_verified",
          connectionId: record.connectionId,
          reason: required(record.unsupportedReason),
          receivedAt: record.receivedAt,
          correlationId: record.correlationId,
        },
      };
  }
}
