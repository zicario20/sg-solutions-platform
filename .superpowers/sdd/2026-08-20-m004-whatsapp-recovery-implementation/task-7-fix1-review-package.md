# Task 7 fix round 1

## Commits
0273639 fix(database): harden communications envelope codec

## Stat
 .../lib/whatsapp/provider-envelope-persistence.ts  |  74 ++++----
 .../drizzle/0007_m004_communications_schema.sql    |   9 +-
 .../workspace/drizzle/meta/0007_snapshot.json      |  20 ++-
 .../workspace/drizzle/meta/0008_snapshot.json      |  22 ++-
 .../workspace/drizzle/meta/_journal.json           |   4 +-
 .../database/src/communication-event-envelope.ts   |  58 +++++--
 .../workspace/packages/database/src/schema.ts      |  18 +-
 .../m004/communications-envelope-codec.test.ts     | 190 +++++++++++++++++----
 .../tests/m004/communications-schema.test.ts       |  11 +-
 9 files changed, 306 insertions(+), 100 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
index 0511897..ad63e06 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
@@ -1,82 +1,100 @@
 import {
+  type CommunicationEventSchemaVersion,
   type CommunicationEventPersistenceRecord,
   type PersistedTemplateComponent,
+  isSupportedCommunicationEventSchemaVersion,
   validateCommunicationEventRecord,
 } from "@atlas/database";
 import type {
   CanonicalInteractiveEnvelope,
   CanonicalMediaEnvelope,
   CanonicalProviderEnvelope,
   CanonicalStatusEnvelope,
   CanonicalTemplateProjectionEnvelope,
-  CanonicalTextEnvelope,
   UnsupportedVerifiedEnvelope,
 } from "./meta-contracts.ts";
 
 export type SafePersistedProviderEnvelope =
-  | (Omit<CanonicalTextEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
   | (Omit<CanonicalInteractiveEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
   | (Omit<CanonicalMediaEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
   | CanonicalStatusEnvelope
   | CanonicalTemplateProjectionEnvelope
   | UnsupportedVerifiedEnvelope;
 
 export type ProviderEnvelopeDeserializationResult =
   | Readonly<{ status: "available"; envelope: SafePersistedProviderEnvelope }>
   | Readonly<{
       status: "not_reversible";
       eventKind: "text_message";
       reason: "metadata_only";
     }>;
 
 export type ProviderEnvelopePersistenceContext = Readonly<{
-  schemaVersion: string;
+  schemaVersion: CommunicationEventSchemaVersion;
   senderBindingId?: string;
-  textRetentionPolicy?: "metadata_only" | "synthetic_local_text" | "approved";
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
+const META_EVENT_REFERENCE_PATTERN = /^meta_evt_[0-9a-f]{32,64}$/u;
+const META_MESSAGE_REFERENCE_PATTERN = /^wamid\.[A-Za-z0-9_]{16,120}$/u;
+const META_GRAPH_NUMERIC_REFERENCE_PATTERN = /^[1-9][0-9]{5,31}$/u;
+const PERSISTENCE_CONTEXT_KEYS = new Set(["schemaVersion", "senderBindingId"]);
 
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
 
+function isMetaReference(value: unknown, pattern: RegExp): value is string {
+  return typeof value === "string" && pattern.test(value);
+}
+
+function assertPersistenceContext(value: unknown): asserts value is ProviderEnvelopePersistenceContext {
+  if (
+    !isObject(value) ||
+    Object.keys(value).some((key) => !PERSISTENCE_CONTEXT_KEYS.has(key)) ||
+    !isSupportedCommunicationEventSchemaVersion(value.schemaVersion) ||
+    (value.senderBindingId !== undefined && !isNonEmptyString(value.senderBindingId))
+  ) {
+    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  }
+}
+
 function isValidDate(value: unknown): value is Date {
   return value instanceof Date && Number.isFinite(value.getTime());
 }
 
 function assertBase(value: Record<string, unknown>): void {
   if (
     !isNonEmptyString(value.connectionId) ||
-    !isNonEmptyString(value.externalEventReference) ||
+    !isMetaReference(value.externalEventReference, META_EVENT_REFERENCE_PATTERN) ||
     !isValidDate(value.receivedAt) ||
     !isNonEmptyString(value.correlationId)
   ) {
     throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
   }
 }
 
 function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
   if (!isObject(value)) return false;
   const keys = Object.keys(value);
@@ -103,87 +121,87 @@ function assertProviderEnvelope(
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
-        !isNonEmptyString(value.messageReference) ||
+        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
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
-        !isNonEmptyString(value.messageReference) ||
+        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
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
-        !isNonEmptyString(value.externalMessageReference) ||
+        !isMetaReference(value.externalMessageReference, META_MESSAGE_REFERENCE_PATTERN) ||
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
-        !isNonEmptyString(value.messageReference) ||
+        !isMetaReference(value.messageReference, META_MESSAGE_REFERENCE_PATTERN) ||
         !isNonEmptyString(value.senderEndpoint) ||
         !isValidDate(value.occurredAt) ||
         !isObject(value.media) ||
         Object.keys(value.media).some(
           (key) => !["externalReference", "declaredKind", "mimeType", "checksum"].includes(key),
         ) ||
-        !isNonEmptyString(value.media.externalReference) ||
+        !isMetaReference(value.media.externalReference, META_GRAPH_NUMERIC_REFERENCE_PATTERN) ||
         !["image", "document", "audio", "sticker", "video"].includes(String(value.media.declaredKind)) ||
         (value.media.mimeType !== undefined && !isNonEmptyString(value.media.mimeType)) ||
         (value.media.checksum !== undefined &&
           (typeof value.media.checksum !== "string" ||
             !/^[0-9a-f]{64}$/u.test(value.media.checksum)))
       ) {
         throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
       }
       assertBase(value);
       return;
@@ -205,21 +223,21 @@ function assertProviderEnvelope(
           "status",
           "providerVersion",
           "providerTimestamp",
         ]) ||
         !isNonEmptyString(projection.templateId) ||
         !["es", "en"].includes(String(projection.locale)) ||
         !["draft", "internally_approved", "submitted", "provider_approved", "provider_rejected", "paused", "disabled", "superseded"].includes(String(projection.state)) ||
         !Number.isSafeInteger(projection.version) ||
         Number(projection.version) <= 0 ||
         !isValidDate(projection.updatedAt) ||
-        !isNonEmptyString(projection.providerReference) ||
+        !isMetaReference(projection.providerReference, META_GRAPH_NUMERIC_REFERENCE_PATTERN) ||
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
@@ -269,24 +287,22 @@ const EMPTY_TYPED_FIELDS = Object.freeze({
   templateProviderVersion: null,
   templateProviderTimestamp: null,
   templateComponents: null,
   unsupportedReason: null,
 });
 
 export function serializeMetaCanonicalEnvelope(
   envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
   context: ProviderEnvelopePersistenceContext,
 ): CommunicationEventPersistenceRecord {
+  assertPersistenceContext(context);
   assertProviderEnvelope(envelope);
-  if (!isNonEmptyString(context.schemaVersion)) {
-    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
-  }
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
@@ -296,30 +312,25 @@ export function serializeMetaCanonicalEnvelope(
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
-      {
-        const retentionPolicy = context.textRetentionPolicy ?? "metadata_only";
-        record = {
-          ...base,
-          bindingId: context.senderBindingId,
-          messageReference: envelope.messageReference,
-          canonicalText: retentionPolicy === "metadata_only" ? null : envelope.text,
-          bodyRetentionPolicy: retentionPolicy,
-        };
-      }
+      record = {
+        ...base,
+        bindingId: context.senderBindingId,
+        messageReference: envelope.messageReference,
+      };
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
@@ -386,34 +397,21 @@ export function deserializeMetaCanonicalEnvelopeRecord(
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
-      if (record.bodyRetentionPolicy === "metadata_only") {
-        return { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" };
-      }
-      return {
-        status: "available",
-        envelope: {
-          ...supportedBase(),
-          kind: "text_message",
-          senderBindingId: required(record.bindingId),
-          messageReference: required(record.messageReference),
-          text: required(record.canonicalText),
-          occurredAt: record.occurredAt,
-        },
-      };
+      return { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" };
     case "interactive_reply":
       return {
         status: "available",
         envelope: {
           ...supportedBase(),
           kind: "interactive_reply",
           senderBindingId: required(record.bindingId),
           messageReference: required(record.messageReference),
           replyKind: required(record.interactiveKind),
           replyId: required(record.interactiveId),
diff --git a/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql b/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql
index 4e0373b..b356d4e 100644
--- a/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql
+++ b/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql
@@ -226,24 +226,25 @@ CREATE TABLE "communication_event_envelopes" (
 	"template_provider_timestamp" timestamp with time zone,
 	"template_components" jsonb,
 	"unsupported_reason" varchar(48),
 	"body_retention_policy" varchar(24) DEFAULT 'metadata_only' NOT NULL,
 	"occurred_at" timestamp with time zone NOT NULL,
 	"created_at" timestamp with time zone NOT NULL,
 	"updated_at" timestamp with time zone NOT NULL,
 	CONSTRAINT "communication_event_envelopes_receipt_id_unique" UNIQUE("receipt_id"),
 	CONSTRAINT "communication_event_envelopes_kind_valid" CHECK ("communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')),
 	CONSTRAINT "communication_event_envelopes_channel_valid" CHECK ("communication_event_envelopes"."channel_kind" = 'whatsapp'),
-	CONSTRAINT "communication_event_envelopes_retention_valid" CHECK (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)),
-	CONSTRAINT "communication_event_envelopes_typed_shape_valid" CHECK (("communication_event_envelopes"."event_kind" = 'text_message' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)) and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'interactive_reply' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."interactive_kind" is not null and "communication_event_envelopes"."interactive_kind" in ('button', 'list') and "communication_event_envelopes"."interactive_id" is not null and "communication_event_envelopes"."interactive_title" is not null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'message_status' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is not null and "communication_event_envelopes"."delivery_state" is not null and "communication_event_envelopes"."delivery_state" in ('sent', 'delivered', 'read', 'failed') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'media_reference' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."media_external_reference" is not null and "communication_event_envelopes"."media_declared_kind" is not null and "communication_event_envelopes"."media_declared_kind" in ('image', 'document', 'audio', 'sticker', 'video') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'template_projection' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."template_id" is not null and "communication_event_envelopes"."template_authority_state" is not null and "communication_event_envelopes"."template_authority_state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and "communication_event_envelopes"."template_authority_version" is not null and "communication_event_envelopes"."template_authority_version" > 0 and "communication_event_envelopes"."template_authority_updated_at" is not null and "communication_event_envelopes"."template_provider_reference" is not null and "communication_event_envelopes"."template_key" is not null and "communication_event_envelopes"."template_locale" is not null and "communication_event_envelopes"."template_locale" in ('es', 'en') and "communication_event_envelopes"."template_category" is not null and "communication_event_envelopes"."template_category" in ('authentication', 'marketing', 'utility') and "communication_event_envelopes"."template_provider_state" is not null and "communication_event_envelopes"."template_provider_state" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and "communication_event_envelopes"."template_provider_version" is not null and "communication_event_envelopes"."template_provider_timestamp" is not null and "communication_event_envelopes"."template_components" is not null and jsonb_typeof("communication_event_envelopes"."template_components") = 'array' and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'unsupported_verified' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."unsupported_reason" is not null and "communication_event_envelopes"."unsupported_reason" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null)),
+	CONSTRAINT "communication_event_envelopes_schema_version_valid" CHECK ("communication_event_envelopes"."schema_version" = 'meta-envelope.v1'),
+	CONSTRAINT "communication_event_envelopes_retention_valid" CHECK ("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null),
+	CONSTRAINT "communication_event_envelopes_typed_shape_valid" CHECK (("communication_event_envelopes"."event_kind" = 'text_message' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'interactive_reply' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."interactive_kind" is not null and "communication_event_envelopes"."interactive_kind" in ('button', 'list') and "communication_event_envelopes"."interactive_id" is not null and "communication_event_envelopes"."interactive_title" is not null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'message_status' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is not null and "communication_event_envelopes"."delivery_state" is not null and "communication_event_envelopes"."delivery_state" in ('sent', 'delivered', 'read', 'failed') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'media_reference' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."media_external_reference" is not null and "communication_event_envelopes"."media_declared_kind" is not null and "communication_event_envelopes"."media_declared_kind" in ('image', 'document', 'audio', 'sticker', 'video') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'template_projection' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."template_id" is not null and "communication_event_envelopes"."template_authority_state" is not null and "communication_event_envelopes"."template_authority_state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and "communication_event_envelopes"."template_authority_version" is not null and "communication_event_envelopes"."template_authority_version" > 0 and "communication_event_envelopes"."template_authority_updated_at" is not null and "communication_event_envelopes"."template_provider_reference" is not null and "communication_event_envelopes"."template_key" is not null and "communication_event_envelopes"."template_locale" is not null and "communication_event_envelopes"."template_locale" in ('es', 'en') and "communication_event_envelopes"."template_category" is not null and "communication_event_envelopes"."template_category" in ('authentication', 'marketing', 'utility') and "communication_event_envelopes"."template_provider_state" is not null and "communication_event_envelopes"."template_provider_state" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and "communication_event_envelopes"."template_provider_version" is not null and "communication_event_envelopes"."template_provider_timestamp" is not null and "communication_event_envelopes"."template_components" is not null and jsonb_typeof("communication_event_envelopes"."template_components") = 'array' and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'unsupported_verified' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."unsupported_reason" is not null and "communication_event_envelopes"."unsupported_reason" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null)),
 	CONSTRAINT "communication_event_envelopes_field_ownership_valid" CHECK (("communication_event_envelopes"."binding_id" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."message_reference" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."external_message_reference" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."canonical_text" is null or "communication_event_envelopes"."event_kind" = 'text_message') and ("communication_event_envelopes"."delivery_state" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."interactive_kind" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_id" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_title" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."media_external_reference" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_declared_kind" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_mime_type" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."template_id" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_updated_at" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_reference" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_key" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_locale" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_category" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_timestamp" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_components" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."unsupported_reason" is null or "communication_event_envelopes"."event_kind" = 'unsupported_verified')),
-	CONSTRAINT "communication_event_envelopes_reference_shape_valid" CHECK (("communication_event_envelopes"."participant_id" is null or "communication_event_envelopes"."conversation_id" is not null) and ("communication_event_envelopes"."message_id" is null or "communication_event_envelopes"."conversation_id" is not null)),
+	CONSTRAINT "communication_event_envelopes_reference_shape_valid" CHECK (("communication_event_envelopes"."participant_id" is null or "communication_event_envelopes"."conversation_id" is not null) and ("communication_event_envelopes"."message_id" is null or "communication_event_envelopes"."conversation_id" is not null) and ("communication_event_envelopes"."message_reference" is null or (char_length("communication_event_envelopes"."message_reference") <= 128 and "communication_event_envelopes"."message_reference" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and ("communication_event_envelopes"."external_message_reference" is null or (char_length("communication_event_envelopes"."external_message_reference") <= 128 and "communication_event_envelopes"."external_message_reference" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and ("communication_event_envelopes"."media_external_reference" is null or (char_length("communication_event_envelopes"."media_external_reference") <= 128 and "communication_event_envelopes"."media_external_reference" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and ("communication_event_envelopes"."template_provider_reference" is null or (char_length("communication_event_envelopes"."template_provider_reference") <= 128 and "communication_event_envelopes"."template_provider_reference" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))),
 	CONSTRAINT "communication_event_envelopes_media_checksum_valid" CHECK ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."media_checksum" ~ '^[0-9a-f]{64}$')
 );
 --> statement-breakpoint
 ALTER TABLE "communication_event_envelopes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
 CREATE TABLE "communication_handoffs" (
 	"id" text PRIMARY KEY NOT NULL,
 	"conversation_id" text NOT NULL,
 	"channel_kind" varchar(16) NOT NULL,
 	"state" varchar(24) NOT NULL,
 	"reason_code" varchar(48) NOT NULL,
@@ -413,20 +414,22 @@ CREATE TABLE "communication_provider_event_receipts" (
 	"persisted_at" timestamp with time zone NOT NULL,
 	"processed_at" timestamp with time zone,
 	"created_at" timestamp with time zone NOT NULL,
 	"updated_at" timestamp with time zone NOT NULL,
 	CONSTRAINT "communication_provider_event_receipts_id_connection_unique" UNIQUE("id","connection_id"),
 	CONSTRAINT "communication_provider_event_receipts_identity_unique" UNIQUE("connection_id","external_event_reference"),
 	CONSTRAINT "communication_provider_event_receipts_kind_valid" CHECK ("communication_provider_event_receipts"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')),
 	CONSTRAINT "communication_provider_event_receipts_state_valid" CHECK ("communication_provider_event_receipts"."state" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')),
 	CONSTRAINT "communication_provider_event_receipts_signature_valid" CHECK ("communication_provider_event_receipts"."signature_verified" = true),
 	CONSTRAINT "communication_provider_event_receipts_channel_valid" CHECK ("communication_provider_event_receipts"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_provider_event_receipts_schema_version_valid" CHECK ("communication_provider_event_receipts"."schema_version" = 'meta-envelope.v1'),
+	CONSTRAINT "communication_provider_event_receipts_external_event_reference_valid" CHECK ("communication_provider_event_receipts"."external_event_reference" ~ '^meta_evt_[0-9a-f]{32,64}$'),
 	CONSTRAINT "communication_provider_event_receipts_body_digest_valid" CHECK ("communication_provider_event_receipts"."body_digest" ~ '^[0-9a-f]{64}$'),
 	CONSTRAINT "communication_provider_event_receipts_lease_token_hash_valid" CHECK ("communication_provider_event_receipts"."lease_token_hash" is null or "communication_provider_event_receipts"."lease_token_hash" ~ '^[0-9a-f]{64}$'),
 	CONSTRAINT "communication_provider_event_receipts_version_positive" CHECK ("communication_provider_event_receipts"."processing_version" > 0),
 	CONSTRAINT "communication_provider_event_receipts_lease_valid" CHECK (("communication_provider_event_receipts"."lease_owner_id" is null and "communication_provider_event_receipts"."lease_token_hash" is null and "communication_provider_event_receipts"."lease_expires_at" is null) or ("communication_provider_event_receipts"."lease_owner_id" is not null and "communication_provider_event_receipts"."lease_token_hash" is not null and "communication_provider_event_receipts"."lease_expires_at" is not null))
 );
 --> statement-breakpoint
 ALTER TABLE "communication_provider_event_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
 CREATE TABLE "public_chat_conversation_sessions" (
 	"id" text PRIMARY KEY NOT NULL,
 	"conversation_id" text NOT NULL,
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json
index aea4fc7..1d7857f 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json
@@ -1,12 +1,12 @@
 {
-  "id": "9fd63f9f-d3bc-43f9-a56b-f985527cbca3",
+  "id": "4374007d-d5c4-418a-bfdf-c269a4ec25e1",
   "prevId": "8b642d6d-01b9-484c-bdcf-ce9bcb486815",
   "version": "7",
   "dialect": "postgresql",
   "tables": {
     "public.communication_audit_events": {
       "name": "communication_audit_events",
       "schema": "",
       "columns": {
         "id": {
           "name": "id",
@@ -1788,35 +1788,39 @@
       },
       "checkConstraints": {
         "communication_event_envelopes_kind_valid": {
           "name": "communication_event_envelopes_kind_valid",
           "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
         },
         "communication_event_envelopes_channel_valid": {
           "name": "communication_event_envelopes_channel_valid",
           "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
         },
+        "communication_event_envelopes_schema_version_valid": {
+          "name": "communication_event_envelopes_schema_version_valid",
+          "value": "\"communication_event_envelopes\".\"schema_version\" = 'meta-envelope.v1'"
+        },
         "communication_event_envelopes_retention_valid": {
           "name": "communication_event_envelopes_retention_valid",
-          "value": "(\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)"
+          "value": "\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null"
         },
         "communication_event_envelopes_typed_shape_valid": {
           "name": "communication_event_envelopes_typed_shape_valid",
-          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and ((\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)) and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
         },
         "communication_event_envelopes_field_ownership_valid": {
           "name": "communication_event_envelopes_field_ownership_valid",
           "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
         },
         "communication_event_envelopes_reference_shape_valid": {
           "name": "communication_event_envelopes_reference_shape_valid",
-          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null)"
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_reference\" is null or (char_length(\"communication_event_envelopes\".\"message_reference\") <= 128 and \"communication_event_envelopes\".\"message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or (char_length(\"communication_event_envelopes\".\"external_message_reference\") <= 128 and \"communication_event_envelopes\".\"external_message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"media_external_reference\" is null or (char_length(\"communication_event_envelopes\".\"media_external_reference\") <= 128 and \"communication_event_envelopes\".\"media_external_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"template_provider_reference\" is null or (char_length(\"communication_event_envelopes\".\"template_provider_reference\") <= 128 and \"communication_event_envelopes\".\"template_provider_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))"
         },
         "communication_event_envelopes_media_checksum_valid": {
           "name": "communication_event_envelopes_media_checksum_valid",
           "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
         }
       },
       "isRLSEnabled": true
     },
     "public.communication_handoffs": {
       "name": "communication_handoffs",
@@ -3220,20 +3224,28 @@
           "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
         },
         "communication_provider_event_receipts_signature_valid": {
           "name": "communication_provider_event_receipts_signature_valid",
           "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
         },
         "communication_provider_event_receipts_channel_valid": {
           "name": "communication_provider_event_receipts_channel_valid",
           "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
         },
+        "communication_provider_event_receipts_schema_version_valid": {
+          "name": "communication_provider_event_receipts_schema_version_valid",
+          "value": "\"communication_provider_event_receipts\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_provider_event_receipts_external_event_reference_valid": {
+          "name": "communication_provider_event_receipts_external_event_reference_valid",
+          "value": "\"communication_provider_event_receipts\".\"external_event_reference\" ~ '^meta_evt_[0-9a-f]{32,64}$'"
+        },
         "communication_provider_event_receipts_body_digest_valid": {
           "name": "communication_provider_event_receipts_body_digest_valid",
           "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_provider_event_receipts_lease_token_hash_valid": {
           "name": "communication_provider_event_receipts_lease_token_hash_valid",
           "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_provider_event_receipts_version_positive": {
           "name": "communication_provider_event_receipts_version_positive",
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json
index 6cfaa8d..ec88e22 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json
@@ -1,13 +1,13 @@
 {
-  "id": "cd54789b-00b1-43b5-8fb1-c5f85969ec0f",
-  "prevId": "9fd63f9f-d3bc-43f9-a56b-f985527cbca3",
+  "id": "b9c77877-d264-4438-931f-f735a86d06f8",
+  "prevId": "4374007d-d5c4-418a-bfdf-c269a4ec25e1",
   "version": "7",
   "dialect": "postgresql",
   "tables": {
     "public.communication_audit_events": {
       "name": "communication_audit_events",
       "schema": "",
       "columns": {
         "id": {
           "name": "id",
           "type": "text",
@@ -1788,35 +1788,39 @@
       },
       "checkConstraints": {
         "communication_event_envelopes_kind_valid": {
           "name": "communication_event_envelopes_kind_valid",
           "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
         },
         "communication_event_envelopes_channel_valid": {
           "name": "communication_event_envelopes_channel_valid",
           "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
         },
+        "communication_event_envelopes_schema_version_valid": {
+          "name": "communication_event_envelopes_schema_version_valid",
+          "value": "\"communication_event_envelopes\".\"schema_version\" = 'meta-envelope.v1'"
+        },
         "communication_event_envelopes_retention_valid": {
           "name": "communication_event_envelopes_retention_valid",
-          "value": "(\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)"
+          "value": "\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null"
         },
         "communication_event_envelopes_typed_shape_valid": {
           "name": "communication_event_envelopes_typed_shape_valid",
-          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and ((\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)) and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
         },
         "communication_event_envelopes_field_ownership_valid": {
           "name": "communication_event_envelopes_field_ownership_valid",
           "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
         },
         "communication_event_envelopes_reference_shape_valid": {
           "name": "communication_event_envelopes_reference_shape_valid",
-          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null)"
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_reference\" is null or (char_length(\"communication_event_envelopes\".\"message_reference\") <= 128 and \"communication_event_envelopes\".\"message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or (char_length(\"communication_event_envelopes\".\"external_message_reference\") <= 128 and \"communication_event_envelopes\".\"external_message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"media_external_reference\" is null or (char_length(\"communication_event_envelopes\".\"media_external_reference\") <= 128 and \"communication_event_envelopes\".\"media_external_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"template_provider_reference\" is null or (char_length(\"communication_event_envelopes\".\"template_provider_reference\") <= 128 and \"communication_event_envelopes\".\"template_provider_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))"
         },
         "communication_event_envelopes_media_checksum_valid": {
           "name": "communication_event_envelopes_media_checksum_valid",
           "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
         }
       },
       "isRLSEnabled": true
     },
     "public.communication_handoffs": {
       "name": "communication_handoffs",
@@ -3220,20 +3224,28 @@
           "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
         },
         "communication_provider_event_receipts_signature_valid": {
           "name": "communication_provider_event_receipts_signature_valid",
           "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
         },
         "communication_provider_event_receipts_channel_valid": {
           "name": "communication_provider_event_receipts_channel_valid",
           "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
         },
+        "communication_provider_event_receipts_schema_version_valid": {
+          "name": "communication_provider_event_receipts_schema_version_valid",
+          "value": "\"communication_provider_event_receipts\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_provider_event_receipts_external_event_reference_valid": {
+          "name": "communication_provider_event_receipts_external_event_reference_valid",
+          "value": "\"communication_provider_event_receipts\".\"external_event_reference\" ~ '^meta_evt_[0-9a-f]{32,64}$'"
+        },
         "communication_provider_event_receipts_body_digest_valid": {
           "name": "communication_provider_event_receipts_body_digest_valid",
           "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_provider_event_receipts_lease_token_hash_valid": {
           "name": "communication_provider_event_receipts_lease_token_hash_valid",
           "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_provider_event_receipts_version_positive": {
           "name": "communication_provider_event_receipts_version_positive",
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index 0176e8b..da6ce00 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -47,23 +47,23 @@
     {
       "idx": 6,
       "version": "7",
       "when": 1787247871684,
       "tag": "0006_m004_communications_role_bootstrap",
       "breakpoints": true
     },
     {
       "idx": 7,
       "version": "7",
-      "when": 1787248559021,
+      "when": 1787249878408,
       "tag": "0007_m004_communications_schema",
       "breakpoints": true
     },
     {
       "idx": 8,
       "version": "7",
-      "when": 1787248565135,
+      "when": 1787249879081,
       "tag": "0008_m004_communications_backfill",
       "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
index 9d4939e..b5402c6 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
@@ -1,35 +1,40 @@
+export const SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS = ["meta-envelope.v1"] as const;
+
+export type CommunicationEventSchemaVersion =
+  (typeof SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS)[number];
+
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
-  schemaVersion: string;
+  schemaVersion: CommunicationEventSchemaVersion;
   bindingId: string | null;
   messageReference: string | null;
   externalMessageReference: string | null;
-  canonicalText: string | null;
+  canonicalText: null;
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
@@ -60,21 +65,21 @@ export type CommunicationEventPersistenceRecord = Readonly<{
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
-  bodyRetentionPolicy: "metadata_only" | "synthetic_local_text" | "approved";
+  bodyRetentionPolicy: "metadata_only";
   occurredAt: Date;
 }>;
 
 const RECORD_KEYS = Object.freeze([
   "connectionId",
   "externalEventReference",
   "correlationId",
   "receivedAt",
   "eventKind",
   "schemaVersion",
@@ -141,20 +146,39 @@ const UNSUPPORTED_REASONS = new Set([
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
+const SUPPORTED_SCHEMA_VERSIONS = new Set<string>(SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS);
+const CANONICAL_OPAQUE_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._]{0,127}$/u;
+const CANONICAL_REFERENCE_FIELDS = [
+  "externalEventReference",
+  "messageReference",
+  "externalMessageReference",
+  "mediaExternalReference",
+  "templateProviderReference",
+] as const;
+
+export function isSupportedCommunicationEventSchemaVersion(
+  value: unknown,
+): value is CommunicationEventSchemaVersion {
+  return typeof value === "string" && SUPPORTED_SCHEMA_VERSIONS.has(value);
+}
+
+export function isCanonicalOpaqueProviderReference(value: unknown): value is string {
+  return typeof value === "string" && CANONICAL_OPAQUE_REFERENCE_PATTERN.test(value);
+}
 
 function isObject(value: unknown): value is Record<string, unknown> {
   return typeof value === "object" && value !== null && !Array.isArray(value);
 }
 
 function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
   const actual = Object.keys(value).sort();
   const expected = [...keys].sort();
   return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
 }
@@ -172,20 +196,26 @@ function isValidDate(value: unknown): value is Date {
 }
 
 function isNull(value: unknown): value is null {
   return value === null;
 }
 
 function hasOnlyNulls(record: Record<string, unknown>, keys: readonly string[]): boolean {
   return keys.every((key) => isNull(record[key]));
 }
 
+function hasValidCanonicalReferences(record: Record<string, unknown>): boolean {
+  return CANONICAL_REFERENCE_FIELDS.every(
+    (field) => record[field] === null || isCanonicalOpaqueProviderReference(record[field]),
+  );
+}
+
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
@@ -215,32 +245,31 @@ const MESSAGE_ONLY_FIELDS = [
   "templateProviderTimestamp",
   "templateComponents",
   "unsupportedReason",
 ] as const;
 
 function hasValidTypedShape(record: Record<string, unknown>): boolean {
   switch (record.eventKind) {
     case "text_message":
       return (
         isNonEmptyString(record.bindingId) &&
-        isNonEmptyString(record.messageReference) &&
-        ((record.bodyRetentionPolicy === "metadata_only" && isNull(record.canonicalText)) ||
-          (["synthetic_local_text", "approved"].includes(String(record.bodyRetentionPolicy)) &&
-            typeof record.canonicalText === "string")) &&
+        isCanonicalOpaqueProviderReference(record.messageReference) &&
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.canonicalText) &&
         hasOnlyNulls(record, MESSAGE_ONLY_FIELDS)
       );
     case "interactive_reply":
       return (
         record.bodyRetentionPolicy === "metadata_only" &&
         isNull(record.canonicalText) &&
         isNonEmptyString(record.bindingId) &&
-        isNonEmptyString(record.messageReference) &&
+        isCanonicalOpaqueProviderReference(record.messageReference) &&
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
@@ -256,21 +285,21 @@ function hasValidTypedShape(record: Record<string, unknown>): boolean {
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
-        isNonEmptyString(record.externalMessageReference) &&
+        isCanonicalOpaqueProviderReference(record.externalMessageReference) &&
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
@@ -288,22 +317,22 @@ function hasValidTypedShape(record: Record<string, unknown>): boolean {
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
-        isNonEmptyString(record.messageReference) &&
-        isNonEmptyString(record.mediaExternalReference) &&
+        isCanonicalOpaqueProviderReference(record.messageReference) &&
+        isCanonicalOpaqueProviderReference(record.mediaExternalReference) &&
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
@@ -325,21 +354,21 @@ function hasValidTypedShape(record: Record<string, unknown>): boolean {
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
-        isNonEmptyString(record.templateProviderReference) &&
+        isCanonicalOpaqueProviderReference(record.templateProviderReference) &&
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
@@ -395,21 +424,22 @@ function hasValidTypedShape(record: Record<string, unknown>): boolean {
 
 export function validateCommunicationEventRecord(
   value: unknown,
 ): CommunicationEventPersistenceRecord {
   if (
     !isObject(value) ||
     !hasExactKeys(value, RECORD_KEYS) ||
     !EVENT_KINDS.has(value.eventKind as CommunicationEventKind) ||
     !isNonEmptyString(value.connectionId) ||
     !isNonEmptyString(value.correlationId) ||
-    !isNonEmptyString(value.schemaVersion) ||
+    !isSupportedCommunicationEventSchemaVersion(value.schemaVersion) ||
     !isValidDate(value.receivedAt) ||
     !isValidDate(value.occurredAt) ||
     (value.eventKind !== "unsupported_verified" &&
-      !isNonEmptyString(value.externalEventReference)) ||
+      !isCanonicalOpaqueProviderReference(value.externalEventReference)) ||
+    !hasValidCanonicalReferences(value) ||
     !hasValidTypedShape(value)
   ) {
     throw new Error("COMMUNICATION_EVENT_RECORD_INVALID");
   }
   return value as CommunicationEventPersistenceRecord;
 }
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index f7bd7d5..f80f59c 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -804,20 +804,28 @@ export const communicationProviderEventReceipts = pgTable(
       sql`${table.state} in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')`,
     ),
     check(
       "communication_provider_event_receipts_signature_valid",
       sql`${table.signatureVerified} = true`,
     ),
     check(
       "communication_provider_event_receipts_channel_valid",
       sql`${table.channelKind} = 'whatsapp'`,
     ),
+    check(
+      "communication_provider_event_receipts_schema_version_valid",
+      sql`${table.schemaVersion} = 'meta-envelope.v1'`,
+    ),
+    check(
+      "communication_provider_event_receipts_external_event_reference_valid",
+      sql`${table.externalEventReference} ~ '^meta_evt_[0-9a-f]{32,64}$'`,
+    ),
     check(
       "communication_provider_event_receipts_body_digest_valid",
       sql`${table.bodyDigest} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_provider_event_receipts_lease_token_hash_valid",
       sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_provider_event_receipts_version_positive",
@@ -920,35 +928,39 @@ export const communicationEventEnvelopes = pgTable(
         communicationContactBindings.id,
         communicationContactBindings.connectionId,
         communicationContactBindings.channelKind,
       ],
     }).onDelete("restrict"),
     check(
       "communication_event_envelopes_kind_valid",
       sql`${table.eventKind} in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')`,
     ),
     check("communication_event_envelopes_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
+    check(
+      "communication_event_envelopes_schema_version_valid",
+      sql`${table.schemaVersion} = 'meta-envelope.v1'`,
+    ),
     check(
       "communication_event_envelopes_retention_valid",
-      sql`(${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.canonicalText} is not null)`,
+      sql`${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null`,
     ),
     check(
       "communication_event_envelopes_typed_shape_valid",
-      sql`(${table.eventKind} = 'text_message' and ${table.bindingId} is not null and ${table.messageReference} is not null and ((${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.canonicalText} is not null)) and ${table.externalMessageReference} is null and ${table.deliveryState} is null and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'interactive_reply' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.interactiveKind} is not null and ${table.interactiveKind} in ('button', 'list') and ${table.interactiveId} is not null and ${table.interactiveTitle} is not null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'message_status' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is not null and ${table.deliveryState} is not null and ${table.deliveryState} in ('sent', 'delivered', 'read', 'failed') and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'media_reference' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.mediaExternalReference} is not null and ${table.mediaDeclaredKind} is not null and ${table.mediaDeclaredKind} in ('image', 'document', 'audio', 'sticker', 'video') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'template_projection' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.templateId} is not null and ${table.templateAuthorityState} is not null and ${table.templateAuthorityState} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and ${table.templateAuthorityVersion} is not null and ${table.templateAuthorityVersion} > 0 and ${table.templateAuthorityUpdatedAt} is not null and ${table.templateProviderReference} is not null and ${table.templateKey} is not null and ${table.templateLocale} is not null and ${table.templateLocale} in ('es', 'en') and ${table.templateCategory} is not null and ${table.templateCategory} in ('authentication', 'marketing', 'utility') and ${table.templateProviderState} is not null and ${table.templateProviderState} in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and ${table.templateProviderVersion} is not null and ${table.templateProviderTimestamp} is not null and ${table.templateComponents} is not null and jsonb_typeof(${table.templateComponents}) = 'array' and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'unsupported_verified' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.unsupportedReason} is not null and ${table.unsupportedReason} in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null)`,
+      sql`(${table.eventKind} = 'text_message' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.deliveryState} is null and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'interactive_reply' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.interactiveKind} is not null and ${table.interactiveKind} in ('button', 'list') and ${table.interactiveId} is not null and ${table.interactiveTitle} is not null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'message_status' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is not null and ${table.deliveryState} is not null and ${table.deliveryState} in ('sent', 'delivered', 'read', 'failed') and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'media_reference' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.mediaExternalReference} is not null and ${table.mediaDeclaredKind} is not null and ${table.mediaDeclaredKind} in ('image', 'document', 'audio', 'sticker', 'video') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'template_projection' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.templateId} is not null and ${table.templateAuthorityState} is not null and ${table.templateAuthorityState} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and ${table.templateAuthorityVersion} is not null and ${table.templateAuthorityVersion} > 0 and ${table.templateAuthorityUpdatedAt} is not null and ${table.templateProviderReference} is not null and ${table.templateKey} is not null and ${table.templateLocale} is not null and ${table.templateLocale} in ('es', 'en') and ${table.templateCategory} is not null and ${table.templateCategory} in ('authentication', 'marketing', 'utility') and ${table.templateProviderState} is not null and ${table.templateProviderState} in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and ${table.templateProviderVersion} is not null and ${table.templateProviderTimestamp} is not null and ${table.templateComponents} is not null and jsonb_typeof(${table.templateComponents}) = 'array' and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'unsupported_verified' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.unsupportedReason} is not null and ${table.unsupportedReason} in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null)`,
     ),
     check(
       "communication_event_envelopes_field_ownership_valid",
       sql`(${table.bindingId} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.messageReference} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.externalMessageReference} is null or ${table.eventKind} = 'message_status') and (${table.canonicalText} is null or ${table.eventKind} = 'text_message') and (${table.deliveryState} is null or ${table.eventKind} = 'message_status') and (${table.interactiveKind} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveId} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveTitle} is null or ${table.eventKind} = 'interactive_reply') and (${table.mediaExternalReference} is null or ${table.eventKind} = 'media_reference') and (${table.mediaDeclaredKind} is null or ${table.eventKind} = 'media_reference') and (${table.mediaMimeType} is null or ${table.eventKind} = 'media_reference') and (${table.mediaChecksum} is null or ${table.eventKind} = 'media_reference') and (${table.templateId} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityState} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityUpdatedAt} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderReference} is null or ${table.eventKind} = 'template_projection') and (${table.templateKey} is null or ${table.eventKind} = 'template_projection') and (${table.templateLocale} is null or ${table.eventKind} = 'template_projection') and (${table.templateCategory} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderState} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderTimestamp} is null or ${table.eventKind} = 'template_projection') and (${table.templateComponents} is null or ${table.eventKind} = 'template_projection') and (${table.unsupportedReason} is null or ${table.eventKind} = 'unsupported_verified')`,
     ),
     check(
       "communication_event_envelopes_reference_shape_valid",
-      sql`(${table.participantId} is null or ${table.conversationId} is not null) and (${table.messageId} is null or ${table.conversationId} is not null)`,
+      sql`(${table.participantId} is null or ${table.conversationId} is not null) and (${table.messageId} is null or ${table.conversationId} is not null) and (${table.messageReference} is null or (char_length(${table.messageReference}) <= 128 and ${table.messageReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.externalMessageReference} is null or (char_length(${table.externalMessageReference}) <= 128 and ${table.externalMessageReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.mediaExternalReference} is null or (char_length(${table.mediaExternalReference}) <= 128 and ${table.mediaExternalReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.templateProviderReference} is null or (char_length(${table.templateProviderReference}) <= 128 and ${table.templateProviderReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))`,
     ),
     check(
       "communication_event_envelopes_media_checksum_valid",
       sql`${table.mediaChecksum} is null or ${table.mediaChecksum} ~ '^[0-9a-f]{64}$'`,
     ),
     index("communication_event_envelopes_conversation_idx").on(
       table.conversationId,
       table.occurredAt,
     ),
     communicationsOnly("communication_event_envelopes"),
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts
index 99f3a5b..64317f8 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts
@@ -1,79 +1,82 @@
 import { describe, expect, it } from "vitest";
 import type {
   CanonicalProviderEnvelope,
   UnsupportedVerifiedEnvelope,
 } from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
 import {
   deserializeMetaCanonicalEnvelopeRecord,
   serializeMetaCanonicalEnvelope,
 } from "../../apps/app/src/lib/whatsapp/provider-envelope-persistence.ts";
-import { validateCommunicationEventRecord } from "../../packages/database/src/communication-event-envelope.ts";
+import {
+  SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS,
+  validateCommunicationEventRecord,
+} from "../../packages/database/src/communication-event-envelope.ts";
 
 const occurredAt = new Date("2026-08-14T10:00:00.000Z");
 const receivedAt = new Date("2026-08-14T10:00:01.000Z");
 const base = {
   connectionId: "connection_synthetic",
-  externalEventReference: "event_synthetic",
+  externalEventReference: "meta_evt_0123456789abcdef0123456789abcdef",
   correlationId: "correlation_synthetic",
   receivedAt,
 };
 
 const providerFixtures = [
   {
     ...base,
     kind: "text_message",
-    messageReference: "message_text",
+    messageReference: "wamid.SYNTHETICMESSAGETEXT0001",
     senderEndpoint: "sender_endpoint_synthetic_text",
     text: "synthetic text",
     occurredAt,
   },
   {
     ...base,
     kind: "interactive_reply",
-    messageReference: "message_interactive",
+    messageReference: "wamid.SYNTHETICMESSAGEINTERACTIVE0001",
     senderEndpoint: "sender_endpoint_synthetic_interactive",
     replyKind: "button",
     replyId: "service_credit",
     replyTitle: "Credit",
     occurredAt,
   },
   {
     ...base,
     kind: "message_status",
-    externalMessageReference: "message_status",
+    externalMessageReference: "wamid.SYNTHETICMESSAGESTATUS0001",
     status: "delivered",
     occurredAt,
   },
   {
     ...base,
     kind: "media_reference",
-    messageReference: "message_media",
+    messageReference: "wamid.SYNTHETICMESSAGEMEDIA0001",
     senderEndpoint: "sender_endpoint_synthetic_media",
     occurredAt,
     media: {
-      externalReference: "media_synthetic",
+      externalReference: "123456789012345",
       declaredKind: "sticker",
       mimeType: "image/webp",
       checksum: "a".repeat(64),
     },
   },
   {
     ...base,
     kind: "template_projection",
     projection: {
       templateId: "template_synthetic",
       locale: "es",
       state: "internally_approved",
       version: 3,
       updatedAt: occurredAt,
-      providerReference: "provider_template_synthetic",
+      providerReference: "987654321098765",
       templateKey: "appointment_notice",
       category: "utility",
       components: [{ type: "body", format: "text", text: "Synthetic" }],
       status: "provider_approved",
       providerVersion: "provider.synthetic.v1",
       providerTimestamp: occurredAt,
     },
   },
   {
     kind: "unsupported_verified",
@@ -109,90 +112,94 @@ const safeExpected = [
   };
   return safe;
 });
 describe("M004 deterministic Meta envelope persistence codec", () => {
   it.each(providerFixtures.map((event, index) => ({ event, index, kind: event.kind })))(
     "round-trips the real $kind variant into its safe persisted projection",
     ({ event, index }) => {
       const record = serializeMetaCanonicalEnvelope(event, {
         schemaVersion: "meta-envelope.v1",
         senderBindingId: "binding_synthetic",
-        textRetentionPolicy: "synthetic_local_text",
       });
       expect(validateCommunicationEventRecord(record)).toBe(record);
-      expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
-        status: "available",
-        envelope: safeExpected[index],
-      });
+      expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual(
+        event.kind === "text_message"
+          ? { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" }
+          : { status: "available", envelope: safeExpected[index] },
+      );
       expect(JSON.stringify(record)).not.toContain("sender_endpoint_synthetic");
+      expect(JSON.stringify(record)).not.toContain("synthetic text");
       expect(Object.keys(record)).not.toEqual(
         expect.arrayContaining([
           "rawPayload",
           "providerPayload",
           "senderEndpoint",
           "providerError",
         ]),
       );
     },
   );
 
   it("uses the status externalMessageReference and persists every provider template authority field", () => {
     const status = serializeMetaCanonicalEnvelope(providerFixtures[2], {
       schemaVersion: "meta-envelope.v1",
     });
-    expect(status.externalMessageReference).toBe("message_status");
+    expect(status.externalMessageReference).toBe("wamid.SYNTHETICMESSAGESTATUS0001");
     expect(status.messageReference).toBeNull();
 
     const template = serializeMetaCanonicalEnvelope(providerFixtures[4], {
       schemaVersion: "meta-envelope.v1",
     });
     expect(template).toMatchObject({
       templateId: "template_synthetic",
       templateAuthorityState: "internally_approved",
       templateAuthorityVersion: 3,
       templateAuthorityUpdatedAt: occurredAt,
-      templateProviderReference: "provider_template_synthetic",
+      templateProviderReference: "987654321098765",
       templateProviderState: "provider_approved",
       templateProviderVersion: "provider.synthetic.v1",
       templateProviderTimestamp: occurredAt,
     });
   });
 
-  it("accepts metadata-only text without retaining canonical text", () => {
+  it("always persists text as metadata-only without retaining canonical text", () => {
     const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
       schemaVersion: "meta-envelope.v1",
       senderBindingId: "binding_synthetic",
-      textRetentionPolicy: "metadata_only",
     });
 
     expect(record).toMatchObject({
       eventKind: "text_message",
       canonicalText: null,
       bodyRetentionPolicy: "metadata_only",
     });
     expect(validateCommunicationEventRecord(record)).toBe(record);
     expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
       status: "not_reversible",
       eventKind: "text_message",
       reason: "metadata_only",
     });
+    expect(JSON.stringify(record)).not.toContain("synthetic text");
   });
 
-  it("defaults text persistence to metadata-only when no retention gate is supplied", () => {
-    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
-      schemaVersion: "meta-envelope.v1",
-      senderBindingId: "binding_synthetic",
-    });
-
-    expect(record.canonicalText).toBeNull();
-    expect(record.bodyRetentionPolicy).toBe("metadata_only");
-  });
+  it.each(["approved", "synthetic_local_text"])(
+    "rejects the removed caller-selectable %s retention mode",
+    (textRetentionPolicy) => {
+      expect(() =>
+        serializeMetaCanonicalEnvelope(providerFixtures[0], {
+          schemaVersion: "meta-envelope.v1",
+          senderBindingId: "binding_synthetic",
+          textRetentionPolicy,
+        } as never),
+      ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+    },
+  );
 
   it("does not invent an external event reference for unsupported verified input", () => {
     const record = serializeMetaCanonicalEnvelope(providerFixtures[5], {
       schemaVersion: "meta-envelope.v1",
     });
     expect(record.externalEventReference).toBeNull();
   });
 
   it.each([
     {
@@ -228,44 +235,167 @@ describe("M004 deterministic Meta envelope persistence codec", () => {
     },
     {
       label: "unsupported external event reference",
       event: { ...providerFixtures[5], externalEventReference: "invented" },
     },
   ])("rejects an unexpected $label instead of persisting it", ({ event }) => {
     expect(() =>
       serializeMetaCanonicalEnvelope(event as CanonicalProviderEnvelope, {
         schemaVersion: "meta-envelope.v1",
         senderBindingId: "binding_synthetic",
-        textRetentionPolicy: "synthetic_local_text",
       }),
     ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
   });
 
   it("requires a safe binding reference instead of retaining a raw sender endpoint", () => {
     expect(() =>
       serializeMetaCanonicalEnvelope(providerFixtures[0], {
         schemaVersion: "meta-envelope.v1",
-        textRetentionPolicy: "synthetic_local_text",
       }),
     ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
   });
 
+  const referenceTargets = [
+    {
+      label: "event",
+      fixture: providerFixtures[0],
+      wrongShape: "event_0123456789abcdef0123456789abcdef",
+      persistedField: "externalEventReference",
+    },
+    {
+      label: "message",
+      fixture: providerFixtures[0],
+      wrongShape: "meta_message_0123456789abcdef",
+      persistedField: "messageReference",
+    },
+    {
+      label: "status message",
+      fixture: providerFixtures[2],
+      wrongShape: "message_status_0123456789abcdef",
+      persistedField: "externalMessageReference",
+    },
+    {
+      label: "media",
+      fixture: providerFixtures[3],
+      wrongShape: "meta_media_0123456789abcdef",
+      persistedField: "mediaExternalReference",
+    },
+    {
+      label: "template",
+      fixture: providerFixtures[4],
+      wrongShape: "meta_template_0123456789abcdef",
+      persistedField: "templateProviderReference",
+    },
+  ] as const;
+
+  function withProviderReference(
+    label: (typeof referenceTargets)[number]["label"],
+    fixture: (typeof providerFixtures)[number],
+    reference: string,
+  ): unknown {
+    switch (label) {
+      case "event":
+        return { ...fixture, externalEventReference: reference };
+      case "message":
+        return { ...fixture, messageReference: reference };
+      case "status message":
+        return { ...fixture, externalMessageReference: reference };
+      case "media":
+        return {
+          ...fixture,
+          media: {
+            ...(fixture as Extract<CanonicalProviderEnvelope, { kind: "media_reference" }>).media,
+            externalReference: reference,
+          },
+        };
+      case "template":
+        return {
+          ...fixture,
+          projection: {
+            ...(fixture as Extract<CanonicalProviderEnvelope, { kind: "template_projection" }>).projection,
+            providerReference: reference,
+          },
+        };
+    }
+  }
+
+  const hostileOpaqueReferences = [
+    "https://graph.facebook.com/object",
+    "https://access-token@example.test/object?token=secret",
+    "+15551234567",
+    "155-512-34567",
+    "reference?token=secret",
+    "reference with whitespace",
+    "reference\u0000control",
+    `reference_${"a".repeat(256)}`,
+  ] as const;
+
+  for (const target of referenceTargets) {
+    it.each([...hostileOpaqueReferences, target.wrongShape])(
+      `rejects an invalid ${target.label} provider reference %j before conversion`,
+      (reference) => {
+        expect(() =>
+          serializeMetaCanonicalEnvelope(
+            withProviderReference(target.label, target.fixture, reference) as CanonicalProviderEnvelope,
+            { schemaVersion: "meta-envelope.v1", senderBindingId: "binding_synthetic" },
+          ),
+        ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      },
+    );
+  }
+
+  it.each(referenceTargets)(
+    "independently rejects unsafe canonical $label references at database validation",
+    (target) => {
+      const record = serializeMetaCanonicalEnvelope(target.fixture, {
+        schemaVersion: "meta-envelope.v1",
+        senderBindingId: "binding_synthetic",
+      });
+      for (const reference of hostileOpaqueReferences) {
+        expect(() =>
+          validateCommunicationEventRecord({
+            ...record,
+            [target.persistedField]: reference,
+          }),
+        ).toThrowError("COMMUNICATION_EVENT_RECORD_INVALID");
+      }
+    },
+  );
+
+  it("shares one exact supported envelope schema version across both validators", () => {
+    expect(SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS).toEqual(["meta-envelope.v1"]);
+    const valid = serializeMetaCanonicalEnvelope(providerFixtures[0], {
+      schemaVersion: "meta-envelope.v1",
+      senderBindingId: "binding_synthetic",
+    });
+    for (const schemaVersion of ["", "meta-envelope.v2", "META-ENVELOPE.V1", " meta-envelope.v1"] as const) {
+      expect(() =>
+        serializeMetaCanonicalEnvelope(providerFixtures[0], {
+          schemaVersion: schemaVersion as "meta-envelope.v1",
+          senderBindingId: "binding_synthetic",
+        }),
+      ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      expect(() => validateCommunicationEventRecord({ ...valid, schemaVersion })).toThrowError(
+        "COMMUNICATION_EVENT_RECORD_INVALID",
+      );
+    }
+  });
+
   it.each([
-    ["text_message", "canonicalText"],
+    ["text_message", "messageReference"],
     ["interactive_reply", "interactiveKind"],
     ["message_status", "externalMessageReference"],
     ["media_reference", "mediaExternalReference"],
     ["template_projection", "templateProviderReference"],
     ["unsupported_verified", "unsupportedReason"],
   ] as const)("rejects a PostgreSQL-nullable required field for %s", (kind, field) => {
     const fixture = providerFixtures.find((event) => event.kind === kind);
     if (!fixture) throw new Error("TEST_FIXTURE_NOT_FOUND");
     const record = serializeMetaCanonicalEnvelope(fixture, {
       schemaVersion: "meta-envelope.v1",
       senderBindingId: "binding_synthetic",
-      textRetentionPolicy: "synthetic_local_text",
     });
     expect(() => validateCommunicationEventRecord({ ...record, [field]: null })).toThrowError(
       "COMMUNICATION_EVENT_RECORD_INVALID",
     );
   });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 6f562bf..3007e72 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -304,23 +304,26 @@ describe("M004 canonical communications Drizzle schema", () => {
         "communication_messages_channel_valid",
         "communication_messages_direction_valid",
         "communication_messages_locale_valid",
         "communication_messages_kind_valid",
         "communication_messages_state_valid",
         "communication_messages_body_retention_valid",
       ],
       communicationProviderEventReceipts: [
         "communication_provider_event_receipts_kind_valid",
         "communication_provider_event_receipts_state_valid",
+        "communication_provider_event_receipts_schema_version_valid",
+        "communication_provider_event_receipts_external_event_reference_valid",
       ],
       communicationEventEnvelopes: [
         "communication_event_envelopes_kind_valid",
+        "communication_event_envelopes_schema_version_valid",
         "communication_event_envelopes_retention_valid",
         "communication_event_envelopes_typed_shape_valid",
         "communication_event_envelopes_reference_shape_valid",
       ],
       communicationMessageTemplates: [
         "communication_message_templates_locale_valid",
         "communication_message_templates_purpose_valid",
         "communication_message_templates_state_valid",
       ],
       communicationOutboundCommands: [
@@ -612,20 +615,26 @@ describe("M004 generated migration authority and preparatory backfill", () => {
     const { structural } = currentM004Migrations();
     const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
     for (const column of [
       "external_message_reference",
       "template_provider_reference",
       "template_provider_version",
       "template_provider_timestamp",
     ]) {
       expect(sql).toContain(`"${column}"`);
     }
+    expect(sql).toContain(
+      'CONSTRAINT "communication_event_envelopes_schema_version_valid" CHECK ("communication_event_envelopes"."schema_version" = \'meta-envelope.v1\')',
+    );
+    expect(sql).toContain(
+      'CONSTRAINT "communication_event_envelopes_retention_valid" CHECK ("communication_event_envelopes"."body_retention_policy" = \'metadata_only\' and "communication_event_envelopes"."canonical_text" is null)',
+    );
     expect(sql).toContain("communication_contact_bindings_id_channel_unique");
     expect(sql).toContain("communication_participants_binding_channel_fk");
     expect(sql).toContain('"consent_state" is not null');
     expect(sql).toContain('"authority_version" is not null');
     expect(sql).toContain('"template_provider_timestamp" is not null');
     expect(sql).not.toContain('"control_kind"');
     expect(sql).not.toContain('"sender_endpoint"');
   });
 
   it("installs one narrowly-scoped audited public-chat bootstrap function", () => {
@@ -1033,21 +1042,21 @@ describe.sequential("M004 disposable real-Postgres migration and RLS contract",
         ];
         for (const { eventKind, receiptId, statement } of invalidEnvelopeCases) {
           await expect(
             sql.begin(async (tx) => {
               await tx.unsafe("set local role atlas_communications_gateway");
               await tx.unsafe(`insert into communication_provider_event_receipts
                 (id, connection_id, channel_kind, external_event_reference, body_digest,
                  event_kind, state, schema_version, signature_verified, correlation_id,
                  processing_version, received_at, persisted_at, created_at, updated_at)
                 values ('${receiptId}', '${connectionId}', 'whatsapp',
-                 'event_${eventKind}_${suffix}', '${"b".repeat(64)}', '${eventKind}', 'persisted',
+                 'meta_evt_${suffix}', '${"b".repeat(64)}', '${eventKind}', 'persisted',
                  'meta-envelope.v1', true, 'correlation_${eventKind}_${suffix}', 1,
                  now(), now(), now(), now())`);
               await tx.unsafe(statement);
             }),
           ).rejects.toThrow();
         }
 
         const publicSessionId = `session_binding_channel_${suffix}`;
         const publicConversationId = `conversation_binding_channel_${suffix}`;
         const publicParticipantId = `participant_binding_channel_${suffix}`;
```
