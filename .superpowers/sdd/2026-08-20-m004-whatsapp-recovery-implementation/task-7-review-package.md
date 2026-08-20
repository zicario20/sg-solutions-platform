# Review package Task 7

## Commits
33f06fc feat(database): add canonical communications persistence

## Stat
 .../project-atlas/workspace/apps/app/package.json  |    1 +
 .../lib/whatsapp/provider-envelope-persistence.ts  |  490 +++
 .../0006_m004_communications_role_bootstrap.sql    |   17 +
 .../drizzle/0007_m004_communications_schema.sql    |  561 +++
 .../drizzle/0008_m004_communications_backfill.sql  |  509 +++
 .../workspace/drizzle/meta/0006_snapshot.json      | 1045 +++++
 .../workspace/drizzle/meta/0007_snapshot.json      | 4465 ++++++++++++++++++++
 .../workspace/drizzle/meta/0008_snapshot.json      | 4465 ++++++++++++++++++++
 .../workspace/drizzle/meta/_journal.json           |   23 +-
 blueprints/project-atlas/workspace/package.json    |    2 +
 .../workspace/packages/database/package.json       |    2 +
 .../scripts/provision-communications-runtime.ts    |  187 +
 .../scripts/validate-communications-runtime.ts     |  146 +
 .../database/src/communication-contact-evidence.ts |  202 +
 .../database/src/communication-event-envelope.ts   |  415 ++
 .../workspace/packages/database/src/index.ts       |    2 +
 .../workspace/packages/database/src/schema.ts      | 1038 +++++
 .../workspace/packages/database/tsconfig.json      |    3 +
 blueprints/project-atlas/workspace/pnpm-lock.yaml  |    3 +
 .../m004/communications-contact-evidence.test.ts   |  269 ++
 .../m004/communications-envelope-codec.test.ts     |  271 ++
 .../tests/m004/communications-schema.test.ts       | 1280 ++++++
 22 files changed, 15395 insertions(+), 1 deletion(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/package.json b/blueprints/project-atlas/workspace/apps/app/package.json
index d7da16f..b8c11b8 100644
--- a/blueprints/project-atlas/workspace/apps/app/package.json
+++ b/blueprints/project-atlas/workspace/apps/app/package.json
@@ -3,20 +3,21 @@
   "private": true,
   "type": "module",
   "scripts": {
     "build": "next build",
     "dev": "next dev",
     "start": "next start",
     "typecheck": "tsc -p tsconfig.json --noEmit"
   },
   "dependencies": {
     "@atlas/config": "workspace:*",
+    "@atlas/database": "workspace:*",
     "@atlas/domain": "workspace:*",
     "@atlas/ui": "workspace:*",
     "@tailwindcss/postcss": "4.3.3",
     "next": "16.2.12",
     "postcss": "8.5.25",
     "react": "19.2.8",
     "react-dom": "19.2.8",
     "tailwindcss": "4.3.3"
   }
 }
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
new file mode 100644
index 0000000..0511897
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
@@ -0,0 +1,490 @@
+import {
+  type CommunicationEventPersistenceRecord,
+  type PersistedTemplateComponent,
+  validateCommunicationEventRecord,
+} from "@atlas/database";
+import type {
+  CanonicalInteractiveEnvelope,
+  CanonicalMediaEnvelope,
+  CanonicalProviderEnvelope,
+  CanonicalStatusEnvelope,
+  CanonicalTemplateProjectionEnvelope,
+  CanonicalTextEnvelope,
+  UnsupportedVerifiedEnvelope,
+} from "./meta-contracts.ts";
+
+export type SafePersistedProviderEnvelope =
+  | (Omit<CanonicalTextEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
+  | (Omit<CanonicalInteractiveEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
+  | (Omit<CanonicalMediaEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
+  | CanonicalStatusEnvelope
+  | CanonicalTemplateProjectionEnvelope
+  | UnsupportedVerifiedEnvelope;
+
+export type ProviderEnvelopeDeserializationResult =
+  | Readonly<{ status: "available"; envelope: SafePersistedProviderEnvelope }>
+  | Readonly<{
+      status: "not_reversible";
+      eventKind: "text_message";
+      reason: "metadata_only";
+    }>;
+
+export type ProviderEnvelopePersistenceContext = Readonly<{
+  schemaVersion: string;
+  senderBindingId?: string;
+  textRetentionPolicy?: "metadata_only" | "synthetic_local_text" | "approved";
+}>;
+
+const BASE_KEYS = ["connectionId", "externalEventReference", "receivedAt", "correlationId"];
+const UNSUPPORTED_REASONS = new Set([
+  "ambiguous_payload",
+  "connection_mismatch",
+  "malformed_payload",
+  "payload_too_large",
+  "template_manual_review",
+  "unsupported_event",
+  "unverified_context",
+]);
+const TEMPLATE_COMPONENT_TYPES = new Set(["header", "body", "footer", "buttons"]);
+const TEMPLATE_COMPONENT_FORMATS = new Set(["text", "image", "video", "document"]);
+
+function isObject(value: unknown): value is Record<string, unknown> {
+  return typeof value === "object" && value !== null && !Array.isArray(value);
+}
+
+function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
+  const actual = Object.keys(value).sort();
+  const expected = [...keys].sort();
+  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
+}
+
+function isNonEmptyString(value: unknown): value is string {
+  return typeof value === "string" && value.trim().length > 0;
+}
+
+function isValidDate(value: unknown): value is Date {
+  return value instanceof Date && Number.isFinite(value.getTime());
+}
+
+function assertBase(value: Record<string, unknown>): void {
+  if (
+    !isNonEmptyString(value.connectionId) ||
+    !isNonEmptyString(value.externalEventReference) ||
+    !isValidDate(value.receivedAt) ||
+    !isNonEmptyString(value.correlationId)
+  ) {
+    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  }
+}
+
+function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
+  if (!isObject(value)) return false;
+  const keys = Object.keys(value);
+  if (
+    !keys.includes("type") ||
+    keys.some((key) => !["type", "format", "text"].includes(key)) ||
+    !TEMPLATE_COMPONENT_TYPES.has(String(value.type))
+  ) {
+    return false;
+  }
+  if (value.format !== undefined && !TEMPLATE_COMPONENT_FORMATS.has(String(value.format))) {
+    return false;
+  }
+  return value.text === undefined || typeof value.text === "string";
+}
+
+function assertProviderEnvelope(
+  value: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
+): void {
+  if (!isObject(value) || typeof value.kind !== "string") {
+    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  }
+  switch (value.kind) {
+    case "text_message":
+      if (
+        !hasExactKeys(value, [
+          ...BASE_KEYS,
+          "kind",
+          "messageReference",
+          "senderEndpoint",
+          "text",
+          "occurredAt",
+        ]) ||
+        !isNonEmptyString(value.messageReference) ||
+        !isNonEmptyString(value.senderEndpoint) ||
+        typeof value.text !== "string" ||
+        !isValidDate(value.occurredAt)
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      assertBase(value);
+      return;
+    case "interactive_reply":
+      if (
+        !hasExactKeys(value, [
+          ...BASE_KEYS,
+          "kind",
+          "messageReference",
+          "senderEndpoint",
+          "replyKind",
+          "replyId",
+          "replyTitle",
+          "occurredAt",
+        ]) ||
+        !isNonEmptyString(value.messageReference) ||
+        !isNonEmptyString(value.senderEndpoint) ||
+        !["button", "list"].includes(String(value.replyKind)) ||
+        !isNonEmptyString(value.replyId) ||
+        typeof value.replyTitle !== "string" ||
+        !isValidDate(value.occurredAt)
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      assertBase(value);
+      return;
+    case "message_status":
+      if (
+        !hasExactKeys(value, [
+          ...BASE_KEYS,
+          "kind",
+          "externalMessageReference",
+          "status",
+          "occurredAt",
+        ]) ||
+        !isNonEmptyString(value.externalMessageReference) ||
+        !["sent", "delivered", "read", "failed"].includes(String(value.status)) ||
+        !isValidDate(value.occurredAt)
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      assertBase(value);
+      return;
+    case "media_reference":
+      if (
+        !hasExactKeys(value, [
+          ...BASE_KEYS,
+          "kind",
+          "messageReference",
+          "senderEndpoint",
+          "occurredAt",
+          "media",
+        ]) ||
+        !isNonEmptyString(value.messageReference) ||
+        !isNonEmptyString(value.senderEndpoint) ||
+        !isValidDate(value.occurredAt) ||
+        !isObject(value.media) ||
+        Object.keys(value.media).some(
+          (key) => !["externalReference", "declaredKind", "mimeType", "checksum"].includes(key),
+        ) ||
+        !isNonEmptyString(value.media.externalReference) ||
+        !["image", "document", "audio", "sticker", "video"].includes(String(value.media.declaredKind)) ||
+        (value.media.mimeType !== undefined && !isNonEmptyString(value.media.mimeType)) ||
+        (value.media.checksum !== undefined &&
+          (typeof value.media.checksum !== "string" ||
+            !/^[0-9a-f]{64}$/u.test(value.media.checksum)))
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      assertBase(value);
+      return;
+    case "template_projection": {
+      const projection = value.projection;
+      if (
+        !hasExactKeys(value, [...BASE_KEYS, "kind", "projection"]) ||
+        !isObject(projection) ||
+        !hasExactKeys(projection, [
+          "templateId",
+          "locale",
+          "state",
+          "version",
+          "updatedAt",
+          "providerReference",
+          "templateKey",
+          "category",
+          "components",
+          "status",
+          "providerVersion",
+          "providerTimestamp",
+        ]) ||
+        !isNonEmptyString(projection.templateId) ||
+        !["es", "en"].includes(String(projection.locale)) ||
+        !["draft", "internally_approved", "submitted", "provider_approved", "provider_rejected", "paused", "disabled", "superseded"].includes(String(projection.state)) ||
+        !Number.isSafeInteger(projection.version) ||
+        Number(projection.version) <= 0 ||
+        !isValidDate(projection.updatedAt) ||
+        !isNonEmptyString(projection.providerReference) ||
+        !isNonEmptyString(projection.templateKey) ||
+        !["authentication", "marketing", "utility"].includes(String(projection.category)) ||
+        !Array.isArray(projection.components) ||
+        !projection.components.every(isTemplateComponent) ||
+        !["submitted", "provider_approved", "provider_rejected", "paused", "disabled"].includes(
+          String(projection.status),
+        ) ||
+        !isNonEmptyString(projection.providerVersion) ||
+        !isValidDate(projection.providerTimestamp)
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      assertBase(value);
+      return;
+    }
+    case "unsupported_verified":
+      if (
+        !hasExactKeys(value, ["kind", "connectionId", "reason", "receivedAt", "correlationId"]) ||
+        !isNonEmptyString(value.connectionId) ||
+        !UNSUPPORTED_REASONS.has(String(value.reason)) ||
+        !isValidDate(value.receivedAt) ||
+        !isNonEmptyString(value.correlationId)
+      ) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+      }
+      return;
+    default:
+      throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  }
+}
+
+const EMPTY_TYPED_FIELDS = Object.freeze({
+  bindingId: null,
+  messageReference: null,
+  externalMessageReference: null,
+  canonicalText: null,
+  deliveryState: null,
+  interactiveKind: null,
+  interactiveId: null,
+  interactiveTitle: null,
+  mediaExternalReference: null,
+  mediaDeclaredKind: null,
+  mediaMimeType: null,
+  mediaChecksum: null,
+  templateId: null,
+  templateAuthorityState: null,
+  templateAuthorityVersion: null,
+  templateAuthorityUpdatedAt: null,
+  templateProviderReference: null,
+  templateKey: null,
+  templateLocale: null,
+  templateCategory: null,
+  templateProviderState: null,
+  templateProviderVersion: null,
+  templateProviderTimestamp: null,
+  templateComponents: null,
+  unsupportedReason: null,
+});
+
+export function serializeMetaCanonicalEnvelope(
+  envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
+  context: ProviderEnvelopePersistenceContext,
+): CommunicationEventPersistenceRecord {
+  assertProviderEnvelope(envelope);
+  if (!isNonEmptyString(context.schemaVersion)) {
+    throw new Error("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  }
+  const base = {
+    ...EMPTY_TYPED_FIELDS,
+    connectionId: envelope.connectionId,
+    externalEventReference:
+      envelope.kind === "unsupported_verified" ? null : envelope.externalEventReference,
+    correlationId: envelope.correlationId,
+    receivedAt: envelope.receivedAt,
+    eventKind: envelope.kind,
+    schemaVersion: context.schemaVersion,
+    bodyRetentionPolicy: "metadata_only" as const,
+    occurredAt:
+      envelope.kind === "unsupported_verified"
+        ? envelope.receivedAt
+        : envelope.kind === "template_projection"
+          ? envelope.projection.providerTimestamp
+          : envelope.occurredAt,
+  };
+  let record: CommunicationEventPersistenceRecord;
+  switch (envelope.kind) {
+    case "text_message":
+      if (!isNonEmptyString(context.senderBindingId)) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
+      }
+      {
+        const retentionPolicy = context.textRetentionPolicy ?? "metadata_only";
+        record = {
+          ...base,
+          bindingId: context.senderBindingId,
+          messageReference: envelope.messageReference,
+          canonicalText: retentionPolicy === "metadata_only" ? null : envelope.text,
+          bodyRetentionPolicy: retentionPolicy,
+        };
+      }
+      break;
+    case "interactive_reply":
+      if (!isNonEmptyString(context.senderBindingId)) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
+      }
+      record = {
+        ...base,
+        bindingId: context.senderBindingId,
+        messageReference: envelope.messageReference,
+        interactiveKind: envelope.replyKind,
+        interactiveId: envelope.replyId,
+        interactiveTitle: envelope.replyTitle,
+      };
+      break;
+    case "message_status":
+      record = {
+        ...base,
+        externalMessageReference: envelope.externalMessageReference,
+        deliveryState: envelope.status,
+      };
+      break;
+    case "media_reference":
+      if (!isNonEmptyString(context.senderBindingId)) {
+        throw new Error("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
+      }
+      record = {
+        ...base,
+        bindingId: context.senderBindingId,
+        messageReference: envelope.messageReference,
+        mediaExternalReference: envelope.media.externalReference,
+        mediaDeclaredKind: envelope.media.declaredKind,
+        mediaMimeType: envelope.media.mimeType ?? null,
+        mediaChecksum: envelope.media.checksum ?? null,
+      };
+      break;
+    case "template_projection":
+      record = {
+        ...base,
+        templateId: envelope.projection.templateId,
+        templateAuthorityState: envelope.projection.state,
+        templateAuthorityVersion: envelope.projection.version,
+        templateAuthorityUpdatedAt: envelope.projection.updatedAt,
+        templateProviderReference: envelope.projection.providerReference,
+        templateKey: envelope.projection.templateKey,
+        templateLocale: envelope.projection.locale,
+        templateCategory: envelope.projection.category,
+        templateProviderState: envelope.projection.status,
+        templateProviderVersion: envelope.projection.providerVersion,
+        templateProviderTimestamp: envelope.projection.providerTimestamp,
+        templateComponents: envelope.projection.components.map((component) => ({
+          type: component.type,
+          ...(component.format === undefined ? {} : { format: component.format }),
+          ...(component.text === undefined ? {} : { text: component.text }),
+        })),
+      };
+      break;
+    case "unsupported_verified":
+      record = { ...base, unsupportedReason: envelope.reason };
+      break;
+  }
+  return validateCommunicationEventRecord(record);
+}
+
+function required<T>(value: T | null): T {
+  if (value === null) throw new Error("COMMUNICATION_EVENT_RECORD_INVALID");
+  return value;
+}
+
+export function deserializeMetaCanonicalEnvelopeRecord(
+  input: unknown,
+): ProviderEnvelopeDeserializationResult {
+  const record = validateCommunicationEventRecord(input);
+  const supportedBase = () => ({
+    connectionId: record.connectionId,
+    externalEventReference: required(record.externalEventReference),
+    correlationId: record.correlationId,
+    receivedAt: record.receivedAt,
+  });
+  switch (record.eventKind) {
+    case "text_message":
+      if (record.bodyRetentionPolicy === "metadata_only") {
+        return { status: "not_reversible", eventKind: "text_message", reason: "metadata_only" };
+      }
+      return {
+        status: "available",
+        envelope: {
+          ...supportedBase(),
+          kind: "text_message",
+          senderBindingId: required(record.bindingId),
+          messageReference: required(record.messageReference),
+          text: required(record.canonicalText),
+          occurredAt: record.occurredAt,
+        },
+      };
+    case "interactive_reply":
+      return {
+        status: "available",
+        envelope: {
+          ...supportedBase(),
+          kind: "interactive_reply",
+          senderBindingId: required(record.bindingId),
+          messageReference: required(record.messageReference),
+          replyKind: required(record.interactiveKind),
+          replyId: required(record.interactiveId),
+          replyTitle: required(record.interactiveTitle),
+          occurredAt: record.occurredAt,
+        },
+      };
+    case "message_status":
+      return {
+        status: "available",
+        envelope: {
+          ...supportedBase(),
+          kind: "message_status",
+          externalMessageReference: required(record.externalMessageReference),
+          status: required(record.deliveryState),
+          occurredAt: record.occurredAt,
+        },
+      };
+    case "media_reference":
+      return {
+        status: "available",
+        envelope: {
+          ...supportedBase(),
+          kind: "media_reference",
+          senderBindingId: required(record.bindingId),
+          messageReference: required(record.messageReference),
+          occurredAt: record.occurredAt,
+          media: {
+            externalReference: required(record.mediaExternalReference),
+            declaredKind: required(record.mediaDeclaredKind),
+            ...(record.mediaMimeType === null ? {} : { mimeType: record.mediaMimeType }),
+            ...(record.mediaChecksum === null ? {} : { checksum: record.mediaChecksum }),
+          },
+        },
+      };
+    case "template_projection":
+      return {
+        status: "available",
+        envelope: {
+          ...supportedBase(),
+          kind: "template_projection",
+          projection: {
+            templateId: required(record.templateId),
+            locale: required(record.templateLocale),
+            state: required(record.templateAuthorityState),
+            version: required(record.templateAuthorityVersion),
+            updatedAt: required(record.templateAuthorityUpdatedAt),
+            providerReference: required(record.templateProviderReference),
+            templateKey: required(record.templateKey),
+            category: required(record.templateCategory),
+            status: required(record.templateProviderState),
+            providerVersion: required(record.templateProviderVersion),
+            providerTimestamp: required(record.templateProviderTimestamp),
+            components: required(record.templateComponents).map((component) => ({
+              type: component.type,
+              ...(component.format === undefined ? {} : { format: component.format }),
+              ...(component.text === undefined ? {} : { text: component.text }),
+            })),
+          },
+        },
+      };
+    case "unsupported_verified":
+      return {
+        status: "available",
+        envelope: {
+          kind: "unsupported_verified",
+          connectionId: record.connectionId,
+          reason: required(record.unsupportedReason),
+          receivedAt: record.receivedAt,
+          correlationId: record.correlationId,
+        },
+      };
+  }
+}
diff --git a/blueprints/project-atlas/workspace/drizzle/0006_m004_communications_role_bootstrap.sql b/blueprints/project-atlas/workspace/drizzle/0006_m004_communications_role_bootstrap.sql
new file mode 100644
index 0000000..4f3ca26
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0006_m004_communications_role_bootstrap.sql
@@ -0,0 +1,17 @@
+-- Drizzle custom migration generated with:
+-- drizzle-kit generate --custom --name m004_communications_role_bootstrap
+--
+-- PostgreSQL roles are cluster-global while Drizzle migrations are database-local. The guarded
+-- bootstrap makes the chain reproducible in multiple disposable databases on one cluster.
+
+DO $$
+BEGIN
+  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_communications_gateway') THEN
+    CREATE ROLE atlas_communications_gateway
+      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
+  END IF;
+
+  ALTER ROLE atlas_communications_gateway WITH
+    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
+END
+$$;
diff --git a/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql b/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql
new file mode 100644
index 0000000..4e0373b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql
@@ -0,0 +1,561 @@
+CREATE TABLE "communication_audit_events" (
+	"id" text PRIMARY KEY NOT NULL,
+	"sequence" bigint NOT NULL,
+	"conversation_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"event_name" varchar(64) NOT NULL,
+	"aggregate_type" varchar(24) NOT NULL,
+	"aggregate_id" text NOT NULL,
+	"result_code" varchar(32) NOT NULL,
+	"reason_code" varchar(48),
+	"version" integer NOT NULL,
+	"locale" varchar(2),
+	"purpose" varchar(24),
+	"policy_version" integer,
+	"correlation_id" text NOT NULL,
+	"occurred_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_audit_events_conversation_sequence_unique" UNIQUE("conversation_id","sequence"),
+	CONSTRAINT "communication_audit_events_channel_valid" CHECK ("communication_audit_events"."channel_kind" in ('public_web', 'whatsapp')),
+	CONSTRAINT "communication_audit_events_sequence_positive" CHECK ("communication_audit_events"."sequence" > 0),
+	CONSTRAINT "communication_audit_events_locale_valid" CHECK ("communication_audit_events"."locale" is null or "communication_audit_events"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_audit_events_purpose_valid" CHECK ("communication_audit_events"."purpose" is null or "communication_audit_events"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
+	CONSTRAINT "communication_audit_events_aggregate_valid" CHECK ("communication_audit_events"."aggregate_type" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')),
+	CONSTRAINT "communication_audit_events_result_valid" CHECK ("communication_audit_events"."result_code" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')),
+	CONSTRAINT "communication_audit_events_version_positive" CHECK ("communication_audit_events"."version" > 0),
+	CONSTRAINT "communication_audit_events_policy_version_positive" CHECK ("communication_audit_events"."policy_version" is null or "communication_audit_events"."policy_version" > 0)
+);
+--> statement-breakpoint
+ALTER TABLE "communication_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_channel_connections" (
+	"id" text PRIMARY KEY NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"adapter_key" varchar(32) NOT NULL,
+	"readiness_state" varchar(32) NOT NULL,
+	"policy_version" varchar(80) NOT NULL,
+	"version" integer NOT NULL,
+	"configured_at" timestamp with time zone,
+	"verified_at" timestamp with time zone,
+	"suspended_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_channel_connections_id_channel_unique" UNIQUE("id","channel_kind"),
+	CONSTRAINT "communication_channel_connections_channel_valid" CHECK ("communication_channel_connections"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_channel_connections_adapter_valid" CHECK ("communication_channel_connections"."adapter_key" = 'meta_cloud'),
+	CONSTRAINT "communication_channel_connections_readiness_valid" CHECK ("communication_channel_connections"."readiness_state" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')),
+	CONSTRAINT "communication_channel_connections_version_positive" CHECK ("communication_channel_connections"."version" > 0)
+);
+--> statement-breakpoint
+ALTER TABLE "communication_channel_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_contact_bindings" (
+	"id" text PRIMARY KEY NOT NULL,
+	"connection_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"endpoint_digest" char(64) NOT NULL,
+	"endpoint_digest_key_version" varchar(80) NOT NULL,
+	"trust_state" varchar(32) NOT NULL,
+	"locale" varchar(2) NOT NULL,
+	"contact_policy_version" integer NOT NULL,
+	"version" integer NOT NULL,
+	"verification_receipt_id" text,
+	"endpoint_verified_at" timestamp with time zone,
+	"verification_expires_at" timestamp with time zone,
+	"wrong_person_reported_at" timestamp with time zone,
+	"reassignment_risk_at" timestamp with time zone,
+	"suspended_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_contact_bindings_id_connection_channel_unique" UNIQUE("id","connection_id","channel_kind"),
+	CONSTRAINT "communication_contact_bindings_id_channel_unique" UNIQUE("id","channel_kind"),
+	CONSTRAINT "communication_contact_bindings_endpoint_unique" UNIQUE("connection_id","endpoint_digest_key_version","endpoint_digest"),
+	CONSTRAINT "communication_contact_bindings_channel_valid" CHECK ("communication_contact_bindings"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_contact_bindings_trust_valid" CHECK ("communication_contact_bindings"."trust_state" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')),
+	CONSTRAINT "communication_contact_bindings_locale_valid" CHECK ("communication_contact_bindings"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_contact_bindings_endpoint_digest_valid" CHECK ("communication_contact_bindings"."endpoint_digest" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_contact_bindings_policy_version_positive" CHECK ("communication_contact_bindings"."contact_policy_version" > 0),
+	CONSTRAINT "communication_contact_bindings_version_positive" CHECK ("communication_contact_bindings"."version" > 0),
+	CONSTRAINT "communication_contact_bindings_verification_window_valid" CHECK ("communication_contact_bindings"."verification_expires_at" is null or ("communication_contact_bindings"."endpoint_verified_at" is not null and "communication_contact_bindings"."verification_expires_at" > "communication_contact_bindings"."endpoint_verified_at"))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_contact_bindings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_contact_evidence_events" (
+	"id" text PRIMARY KEY NOT NULL,
+	"binding_id" text NOT NULL,
+	"sequence" bigint NOT NULL,
+	"event_kind" varchar(40) NOT NULL,
+	"purpose" varchar(24),
+	"consent_state" varchar(24),
+	"fence_state" varchar(24),
+	"binding_trust_state" varchar(32),
+	"review_resolution" varchar(16),
+	"evidence_receipt_id" text NOT NULL,
+	"receipt_kind" varchar(40) NOT NULL,
+	"owning_domain" varchar(80) NOT NULL,
+	"authority_role" varchar(32) NOT NULL,
+	"authority_version" integer,
+	"triggering_event_id" text,
+	"policy_version" varchar(80),
+	"correlation_id" text NOT NULL,
+	"receipt_issued_at" timestamp with time zone,
+	"receipt_valid_until" timestamp with time zone,
+	"occurred_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_contact_evidence_events_binding_sequence_unique" UNIQUE("binding_id","sequence"),
+	CONSTRAINT "communication_contact_evidence_events_receipt_unique" UNIQUE("evidence_receipt_id"),
+	CONSTRAINT "communication_contact_evidence_events_kind_valid" CHECK ("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')),
+	CONSTRAINT "communication_contact_evidence_events_authority_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'contact_review') or ("communication_contact_evidence_events"."event_kind" in ('binding_suspended', 'binding_revalidated') and "communication_contact_evidence_events"."authority_role" = 'binding_verification')),
+	CONSTRAINT "communication_contact_evidence_events_receipt_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."receipt_kind" = 'consent_evidence') or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."receipt_kind" = 'contact_withdrawal') or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_detection') or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."receipt_kind" = 'ambiguous_opt_out_resolution') or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."receipt_kind" = 'binding_suspension') or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."receipt_kind" = 'binding_revalidation')),
+	CONSTRAINT "communication_contact_evidence_events_state_shape_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_granted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_regranted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'opt_out_pending' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_cleared' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'clear' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'withdraw' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'suspended' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'reverified' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null)),
+	CONSTRAINT "communication_contact_evidence_events_sequence_positive" CHECK ("communication_contact_evidence_events"."sequence" > 0),
+	CONSTRAINT "communication_contact_evidence_events_receipt_window_valid" CHECK (("communication_contact_evidence_events"."receipt_issued_at" is null and "communication_contact_evidence_events"."receipt_valid_until" is null) or ("communication_contact_evidence_events"."receipt_issued_at" is not null and "communication_contact_evidence_events"."receipt_valid_until" is not null and "communication_contact_evidence_events"."receipt_valid_until" > "communication_contact_evidence_events"."receipt_issued_at"))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_contact_policies" (
+	"id" text PRIMARY KEY NOT NULL,
+	"binding_id" text NOT NULL,
+	"purpose" varchar(24) NOT NULL,
+	"consent_state" varchar(24) NOT NULL,
+	"fence_state" varchar(24) NOT NULL,
+	"decision_code" varchar(32),
+	"evidence_receipt_id" text,
+	"version" integer NOT NULL,
+	"evaluated_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_contact_policies_binding_purpose_unique" UNIQUE("binding_id","purpose"),
+	CONSTRAINT "communication_contact_policies_purpose_valid" CHECK ("communication_contact_policies"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
+	CONSTRAINT "communication_contact_policies_consent_valid" CHECK ("communication_contact_policies"."consent_state" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')),
+	CONSTRAINT "communication_contact_policies_fence_valid" CHECK ("communication_contact_policies"."fence_state" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')),
+	CONSTRAINT "communication_contact_policies_decision_valid" CHECK ("communication_contact_policies"."decision_code" is null or "communication_contact_policies"."decision_code" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')),
+	CONSTRAINT "communication_contact_policies_version_positive" CHECK ("communication_contact_policies"."version" > 0)
+);
+--> statement-breakpoint
+ALTER TABLE "communication_contact_policies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_conversations" (
+	"id" text PRIMARY KEY NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"locale" varchar(2) NOT NULL,
+	"status" varchar(32) NOT NULL,
+	"version" integer NOT NULL,
+	"correlation_id" text NOT NULL,
+	"last_activity_at" timestamp with time zone NOT NULL,
+	"expires_at" timestamp with time zone,
+	"closed_at" timestamp with time zone,
+	"reconciliation_required" boolean DEFAULT false NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_conversations_id_channel_unique" UNIQUE("id","channel_kind"),
+	CONSTRAINT "communication_conversations_channel_valid" CHECK ("communication_conversations"."channel_kind" in ('public_web', 'whatsapp')),
+	CONSTRAINT "communication_conversations_locale_valid" CHECK ("communication_conversations"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_conversations_status_valid" CHECK ("communication_conversations"."status" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')),
+	CONSTRAINT "communication_conversations_version_positive" CHECK ("communication_conversations"."version" > 0),
+	CONSTRAINT "communication_conversations_expiry_valid" CHECK ("communication_conversations"."expires_at" is null or "communication_conversations"."expires_at" > "communication_conversations"."created_at"),
+	CONSTRAINT "communication_conversations_public_expiry_required" CHECK ("communication_conversations"."channel_kind" <> 'public_web' or "communication_conversations"."expires_at" is not null)
+);
+--> statement-breakpoint
+ALTER TABLE "communication_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_dispatch_attempts" (
+	"id" text PRIMARY KEY NOT NULL,
+	"command_id" text NOT NULL,
+	"connection_id" text NOT NULL,
+	"attempt_ordinal" integer NOT NULL,
+	"request_idempotency" boolean NOT NULL,
+	"stable_reference_capability" boolean NOT NULL,
+	"message_lookup_capability" boolean NOT NULL,
+	"status_reconciliation_capability" boolean NOT NULL,
+	"media_references_capability" boolean NOT NULL,
+	"template_projection_capability" boolean NOT NULL,
+	"capability_observed_at" timestamp with time zone NOT NULL,
+	"expected_policy_version" integer NOT NULL,
+	"request_digest" char(64) NOT NULL,
+	"stable_reference" text,
+	"external_message_reference" text,
+	"state" varchar(32) NOT NULL,
+	"result_code" varchar(32),
+	"provider_io_capability_hash" char(64),
+	"provider_io_started_at" timestamp with time zone,
+	"started_at" timestamp with time zone NOT NULL,
+	"completed_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_dispatch_attempts_command_ordinal_unique" UNIQUE("command_id","attempt_ordinal"),
+	CONSTRAINT "communication_dispatch_attempts_external_reference_unique" UNIQUE("connection_id","external_message_reference"),
+	CONSTRAINT "communication_dispatch_attempts_ordinal_positive" CHECK ("communication_dispatch_attempts"."attempt_ordinal" > 0),
+	CONSTRAINT "communication_dispatch_attempts_request_digest_valid" CHECK ("communication_dispatch_attempts"."request_digest" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_dispatch_attempts_policy_version_positive" CHECK ("communication_dispatch_attempts"."expected_policy_version" > 0),
+	CONSTRAINT "communication_dispatch_attempts_state_valid" CHECK ("communication_dispatch_attempts"."state" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')),
+	CONSTRAINT "communication_dispatch_attempts_result_valid" CHECK ("communication_dispatch_attempts"."result_code" is null or "communication_dispatch_attempts"."result_code" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')),
+	CONSTRAINT "communication_dispatch_attempts_completion_valid" CHECK ("communication_dispatch_attempts"."completed_at" is null or "communication_dispatch_attempts"."completed_at" >= "communication_dispatch_attempts"."started_at"),
+	CONSTRAINT "communication_dispatch_attempts_provider_io_capability_valid" CHECK (("communication_dispatch_attempts"."provider_io_capability_hash" is null and "communication_dispatch_attempts"."provider_io_started_at" is null) or ("communication_dispatch_attempts"."provider_io_capability_hash" ~ '^[0-9a-f]{64}$' and "communication_dispatch_attempts"."provider_io_started_at" is not null and "communication_dispatch_attempts"."provider_io_started_at" >= "communication_dispatch_attempts"."started_at"))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_event_envelopes" (
+	"id" text PRIMARY KEY NOT NULL,
+	"receipt_id" text NOT NULL,
+	"connection_id" text NOT NULL,
+	"channel_kind" varchar(16) DEFAULT 'whatsapp' NOT NULL,
+	"event_kind" varchar(32) NOT NULL,
+	"schema_version" varchar(32) NOT NULL,
+	"conversation_id" text,
+	"participant_id" text,
+	"binding_id" text,
+	"message_id" text,
+	"message_reference" text,
+	"external_message_reference" text,
+	"canonical_text" text,
+	"delivery_state" varchar(24),
+	"interactive_kind" varchar(16),
+	"interactive_id" varchar(240),
+	"interactive_title" varchar(240),
+	"media_external_reference" text,
+	"media_declared_kind" varchar(16),
+	"media_mime_type" varchar(160),
+	"media_checksum" char(64),
+	"template_id" text,
+	"template_authority_state" varchar(32),
+	"template_authority_version" integer,
+	"template_authority_updated_at" timestamp with time zone,
+	"template_provider_reference" text,
+	"template_key" varchar(120),
+	"template_locale" varchar(2),
+	"template_category" varchar(24),
+	"template_provider_state" varchar(32),
+	"template_provider_version" varchar(80),
+	"template_provider_timestamp" timestamp with time zone,
+	"template_components" jsonb,
+	"unsupported_reason" varchar(48),
+	"body_retention_policy" varchar(24) DEFAULT 'metadata_only' NOT NULL,
+	"occurred_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_event_envelopes_receipt_id_unique" UNIQUE("receipt_id"),
+	CONSTRAINT "communication_event_envelopes_kind_valid" CHECK ("communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')),
+	CONSTRAINT "communication_event_envelopes_channel_valid" CHECK ("communication_event_envelopes"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_event_envelopes_retention_valid" CHECK (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)),
+	CONSTRAINT "communication_event_envelopes_typed_shape_valid" CHECK (("communication_event_envelopes"."event_kind" = 'text_message' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and (("communication_event_envelopes"."body_retention_policy" = 'metadata_only' and "communication_event_envelopes"."canonical_text" is null) or ("communication_event_envelopes"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_event_envelopes"."canonical_text" is not null)) and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'interactive_reply' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."interactive_kind" is not null and "communication_event_envelopes"."interactive_kind" in ('button', 'list') and "communication_event_envelopes"."interactive_id" is not null and "communication_event_envelopes"."interactive_title" is not null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'message_status' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is not null and "communication_event_envelopes"."delivery_state" is not null and "communication_event_envelopes"."delivery_state" in ('sent', 'delivered', 'read', 'failed') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'media_reference' and "communication_event_envelopes"."binding_id" is not null and "communication_event_envelopes"."message_reference" is not null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."media_external_reference" is not null and "communication_event_envelopes"."media_declared_kind" is not null and "communication_event_envelopes"."media_declared_kind" in ('image', 'document', 'audio', 'sticker', 'video') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."template_provider_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'template_projection' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."template_id" is not null and "communication_event_envelopes"."template_authority_state" is not null and "communication_event_envelopes"."template_authority_state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and "communication_event_envelopes"."template_authority_version" is not null and "communication_event_envelopes"."template_authority_version" > 0 and "communication_event_envelopes"."template_authority_updated_at" is not null and "communication_event_envelopes"."template_provider_reference" is not null and "communication_event_envelopes"."template_key" is not null and "communication_event_envelopes"."template_locale" is not null and "communication_event_envelopes"."template_locale" in ('es', 'en') and "communication_event_envelopes"."template_category" is not null and "communication_event_envelopes"."template_category" in ('authentication', 'marketing', 'utility') and "communication_event_envelopes"."template_provider_state" is not null and "communication_event_envelopes"."template_provider_state" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and "communication_event_envelopes"."template_provider_version" is not null and "communication_event_envelopes"."template_provider_timestamp" is not null and "communication_event_envelopes"."template_components" is not null and jsonb_typeof("communication_event_envelopes"."template_components") = 'array' and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."unsupported_reason" is null) or ("communication_event_envelopes"."event_kind" = 'unsupported_verified' and "communication_event_envelopes"."binding_id" is null and "communication_event_envelopes"."message_reference" is null and "communication_event_envelopes"."canonical_text" is null and "communication_event_envelopes"."external_message_reference" is null and "communication_event_envelopes"."unsupported_reason" is not null and "communication_event_envelopes"."unsupported_reason" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and "communication_event_envelopes"."interactive_kind" is null and "communication_event_envelopes"."delivery_state" is null and "communication_event_envelopes"."media_external_reference" is null and "communication_event_envelopes"."template_provider_reference" is null)),
+	CONSTRAINT "communication_event_envelopes_field_ownership_valid" CHECK (("communication_event_envelopes"."binding_id" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."message_reference" is null or "communication_event_envelopes"."event_kind" in ('text_message', 'interactive_reply', 'media_reference')) and ("communication_event_envelopes"."external_message_reference" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."canonical_text" is null or "communication_event_envelopes"."event_kind" = 'text_message') and ("communication_event_envelopes"."delivery_state" is null or "communication_event_envelopes"."event_kind" = 'message_status') and ("communication_event_envelopes"."interactive_kind" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_id" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."interactive_title" is null or "communication_event_envelopes"."event_kind" = 'interactive_reply') and ("communication_event_envelopes"."media_external_reference" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_declared_kind" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_mime_type" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."event_kind" = 'media_reference') and ("communication_event_envelopes"."template_id" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_authority_updated_at" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_reference" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_key" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_locale" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_category" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_state" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_version" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_provider_timestamp" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."template_components" is null or "communication_event_envelopes"."event_kind" = 'template_projection') and ("communication_event_envelopes"."unsupported_reason" is null or "communication_event_envelopes"."event_kind" = 'unsupported_verified')),
+	CONSTRAINT "communication_event_envelopes_reference_shape_valid" CHECK (("communication_event_envelopes"."participant_id" is null or "communication_event_envelopes"."conversation_id" is not null) and ("communication_event_envelopes"."message_id" is null or "communication_event_envelopes"."conversation_id" is not null)),
+	CONSTRAINT "communication_event_envelopes_media_checksum_valid" CHECK ("communication_event_envelopes"."media_checksum" is null or "communication_event_envelopes"."media_checksum" ~ '^[0-9a-f]{64}$')
+);
+--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_handoffs" (
+	"id" text PRIMARY KEY NOT NULL,
+	"conversation_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"state" varchar(24) NOT NULL,
+	"reason_code" varchar(48) NOT NULL,
+	"receipt_id" text,
+	"correlation_id" text NOT NULL,
+	"assigned_participant_id" text,
+	"requested_at" timestamp with time zone NOT NULL,
+	"queued_at" timestamp with time zone,
+	"accepted_at" timestamp with time zone,
+	"closed_at" timestamp with time zone,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_handoffs_channel_valid" CHECK ("communication_handoffs"."channel_kind" in ('public_web', 'whatsapp')),
+	CONSTRAINT "communication_handoffs_state_valid" CHECK ("communication_handoffs"."state" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')),
+	CONSTRAINT "communication_handoffs_reason_valid" CHECK ("communication_handoffs"."reason_code" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown'))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_handoffs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_message_templates" (
+	"id" text PRIMARY KEY NOT NULL,
+	"template_key" varchar(120) NOT NULL,
+	"locale" varchar(2) NOT NULL,
+	"purpose" varchar(24) NOT NULL,
+	"definition_source" varchar(32) NOT NULL,
+	"definition_version" integer NOT NULL,
+	"variable_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
+	"state" varchar(32) NOT NULL,
+	"internally_approved" boolean DEFAULT false NOT NULL,
+	"approval_receipt_id" text,
+	"approval_receipt_issued_at" timestamp with time zone,
+	"approval_receipt_valid_until" timestamp with time zone,
+	"external_reference" text,
+	"projection_version" integer,
+	"provider_receipt_id" text,
+	"provider_correlation_id" text,
+	"provider_receipt_issued_at" timestamp with time zone,
+	"provider_receipt_valid_until" timestamp with time zone,
+	"category" varchar(48),
+	"observed_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_message_templates_definition_unique" UNIQUE("template_key","locale","definition_version"),
+	CONSTRAINT "communication_message_templates_locale_valid" CHECK ("communication_message_templates"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_message_templates_purpose_valid" CHECK ("communication_message_templates"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
+	CONSTRAINT "communication_message_templates_source_valid" CHECK ("communication_message_templates"."definition_source" in ('synthetic_test_fixture', 'approved_policy')),
+	CONSTRAINT "communication_message_templates_state_valid" CHECK ("communication_message_templates"."state" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')),
+	CONSTRAINT "communication_message_templates_variables_valid" CHECK (jsonb_typeof("communication_message_templates"."variable_keys") = 'array'),
+	CONSTRAINT "communication_message_templates_definition_version_positive" CHECK ("communication_message_templates"."definition_version" > 0),
+	CONSTRAINT "communication_message_templates_projection_version_positive" CHECK ("communication_message_templates"."projection_version" is null or "communication_message_templates"."projection_version" > 0),
+	CONSTRAINT "communication_message_templates_approval_valid" CHECK (("communication_message_templates"."internally_approved" = false and "communication_message_templates"."approval_receipt_id" is null and "communication_message_templates"."approval_receipt_issued_at" is null and "communication_message_templates"."approval_receipt_valid_until" is null) or ("communication_message_templates"."internally_approved" = true and "communication_message_templates"."approval_receipt_id" is not null and "communication_message_templates"."approval_receipt_issued_at" is not null and "communication_message_templates"."approval_receipt_valid_until" > "communication_message_templates"."approval_receipt_issued_at")),
+	CONSTRAINT "communication_message_templates_provider_receipt_valid" CHECK (("communication_message_templates"."provider_receipt_id" is null and "communication_message_templates"."provider_correlation_id" is null and "communication_message_templates"."provider_receipt_issued_at" is null and "communication_message_templates"."provider_receipt_valid_until" is null) or ("communication_message_templates"."provider_receipt_id" is not null and "communication_message_templates"."provider_correlation_id" is not null and "communication_message_templates"."provider_receipt_issued_at" is not null and "communication_message_templates"."provider_receipt_valid_until" > "communication_message_templates"."provider_receipt_issued_at"))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_messages" (
+	"id" text PRIMARY KEY NOT NULL,
+	"conversation_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"ordinal" integer NOT NULL,
+	"direction" varchar(16) NOT NULL,
+	"sender_participant_id" text NOT NULL,
+	"recipient_participant_id" text,
+	"locale" varchar(2) NOT NULL,
+	"kind" varchar(24) NOT NULL,
+	"state" varchar(24) NOT NULL,
+	"body" text,
+	"body_stored" boolean DEFAULT false NOT NULL,
+	"body_retention_policy" varchar(24) DEFAULT 'metadata_only' NOT NULL,
+	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
+	"rejection_reason" varchar(48),
+	"external_message_reference" text,
+	"created_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_messages_id_conversation_unique" UNIQUE("id","conversation_id"),
+	CONSTRAINT "communication_messages_conversation_ordinal_unique" UNIQUE("conversation_id","ordinal"),
+	CONSTRAINT "communication_messages_channel_valid" CHECK ("communication_messages"."channel_kind" in ('public_web', 'whatsapp')),
+	CONSTRAINT "communication_messages_ordinal_positive" CHECK ("communication_messages"."ordinal" > 0),
+	CONSTRAINT "communication_messages_direction_valid" CHECK ("communication_messages"."direction" in ('inbound', 'outbound', 'system')),
+	CONSTRAINT "communication_messages_locale_valid" CHECK ("communication_messages"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_messages_kind_valid" CHECK ("communication_messages"."kind" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')),
+	CONSTRAINT "communication_messages_state_valid" CHECK ("communication_messages"."state" in ('accepted', 'answered', 'failed', 'handoff_required')),
+	CONSTRAINT "communication_messages_body_retention_valid" CHECK (("communication_messages"."body_retention_policy" = 'metadata_only' and "communication_messages"."body_stored" = false and "communication_messages"."body" is null) or ("communication_messages"."body_retention_policy" in ('synthetic_local_text', 'approved') and "communication_messages"."body_stored" = true and "communication_messages"."body" is not null))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_outbound_commands" (
+	"id" text PRIMARY KEY NOT NULL,
+	"conversation_id" text NOT NULL,
+	"binding_id" text NOT NULL,
+	"connection_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"locale" varchar(2) NOT NULL,
+	"purpose" varchar(24) NOT NULL,
+	"message_reference" text,
+	"template_key" varchar(120),
+	"template_definition_version" varchar(80),
+	"destination_key" varchar(120),
+	"owning_receipt_id" text NOT NULL,
+	"owning_domain" varchar(80) NOT NULL,
+	"owning_reference" text NOT NULL,
+	"owning_receipt_issued_at" timestamp with time zone NOT NULL,
+	"owning_receipt_valid_until" timestamp with time zone NOT NULL,
+	"owning_receipt_correlation_id" text NOT NULL,
+	"expected_policy_version" integer NOT NULL,
+	"idempotency_key" varchar(128) NOT NULL,
+	"fingerprint" char(64) NOT NULL,
+	"correlation_id" text NOT NULL,
+	"state" varchar(32) NOT NULL,
+	"version" integer NOT NULL,
+	"lease_owner_id" text,
+	"lease_token_hash" char(64),
+	"lease_expires_at" timestamp with time zone,
+	"scheduled_at" timestamp with time zone,
+	"expires_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_outbound_commands_id_connection_unique" UNIQUE("id","connection_id"),
+	CONSTRAINT "communication_outbound_commands_binding_key_unique" UNIQUE("binding_id","idempotency_key"),
+	CONSTRAINT "communication_outbound_commands_channel_valid" CHECK ("communication_outbound_commands"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_outbound_commands_fingerprint_valid" CHECK ("communication_outbound_commands"."fingerprint" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_outbound_commands_lease_token_hash_valid" CHECK ("communication_outbound_commands"."lease_token_hash" is null or "communication_outbound_commands"."lease_token_hash" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_outbound_commands_locale_valid" CHECK ("communication_outbound_commands"."locale" in ('es', 'en')),
+	CONSTRAINT "communication_outbound_commands_purpose_valid" CHECK ("communication_outbound_commands"."purpose" in ('conversational', 'transactional', 'service', 'marketing')),
+	CONSTRAINT "communication_outbound_commands_state_valid" CHECK ("communication_outbound_commands"."state" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')),
+	CONSTRAINT "communication_outbound_commands_policy_version_positive" CHECK ("communication_outbound_commands"."expected_policy_version" > 0),
+	CONSTRAINT "communication_outbound_commands_version_positive" CHECK ("communication_outbound_commands"."version" > 0),
+	CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK ("communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at"),
+	CONSTRAINT "communication_outbound_commands_destination_reference_opaque" CHECK ("communication_outbound_commands"."destination_key" is null or (char_length("communication_outbound_commands"."destination_key") <= 120 and "communication_outbound_commands"."destination_key" ~ '^(portal\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')),
+	CONSTRAINT "communication_outbound_commands_lease_valid" CHECK (("communication_outbound_commands"."lease_owner_id" is null and "communication_outbound_commands"."lease_token_hash" is null and "communication_outbound_commands"."lease_expires_at" is null) or ("communication_outbound_commands"."lease_owner_id" is not null and "communication_outbound_commands"."lease_token_hash" is not null and "communication_outbound_commands"."lease_expires_at" is not null)),
+	CONSTRAINT "communication_outbound_commands_expiry_valid" CHECK ("communication_outbound_commands"."expires_at" is null or "communication_outbound_commands"."expires_at" > "communication_outbound_commands"."created_at")
+);
+--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_participants" (
+	"id" text PRIMARY KEY NOT NULL,
+	"conversation_id" text NOT NULL,
+	"channel_kind" varchar(16) NOT NULL,
+	"kind" varchar(16) NOT NULL,
+	"channel_binding_id" text,
+	"joined_at" timestamp with time zone NOT NULL,
+	"left_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_participants_id_conversation_unique" UNIQUE("id","conversation_id"),
+	CONSTRAINT "communication_participants_id_conversation_channel_unique" UNIQUE("id","conversation_id","channel_kind"),
+	CONSTRAINT "communication_participants_channel_valid" CHECK ("communication_participants"."channel_kind" in ('public_web', 'whatsapp')),
+	CONSTRAINT "communication_participants_kind_valid" CHECK ("communication_participants"."kind" in ('external', 'automated', 'human', 'system')),
+	CONSTRAINT "communication_participants_membership_window_valid" CHECK ("communication_participants"."left_at" is null or "communication_participants"."left_at" >= "communication_participants"."joined_at")
+);
+--> statement-breakpoint
+ALTER TABLE "communication_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_provider_event_receipts" (
+	"id" text PRIMARY KEY NOT NULL,
+	"connection_id" text NOT NULL,
+	"channel_kind" varchar(16) DEFAULT 'whatsapp' NOT NULL,
+	"external_event_reference" text NOT NULL,
+	"body_digest" char(64) NOT NULL,
+	"event_kind" varchar(32) NOT NULL,
+	"state" varchar(32) NOT NULL,
+	"schema_version" varchar(32) NOT NULL,
+	"signature_verified" boolean NOT NULL,
+	"correlation_id" text NOT NULL,
+	"outcome_reason" varchar(48),
+	"processing_version" integer NOT NULL,
+	"lease_owner_id" text,
+	"lease_token_hash" char(64),
+	"lease_expires_at" timestamp with time zone,
+	"received_at" timestamp with time zone NOT NULL,
+	"persisted_at" timestamp with time zone NOT NULL,
+	"processed_at" timestamp with time zone,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_provider_event_receipts_id_connection_unique" UNIQUE("id","connection_id"),
+	CONSTRAINT "communication_provider_event_receipts_identity_unique" UNIQUE("connection_id","external_event_reference"),
+	CONSTRAINT "communication_provider_event_receipts_kind_valid" CHECK ("communication_provider_event_receipts"."event_kind" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')),
+	CONSTRAINT "communication_provider_event_receipts_state_valid" CHECK ("communication_provider_event_receipts"."state" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')),
+	CONSTRAINT "communication_provider_event_receipts_signature_valid" CHECK ("communication_provider_event_receipts"."signature_verified" = true),
+	CONSTRAINT "communication_provider_event_receipts_channel_valid" CHECK ("communication_provider_event_receipts"."channel_kind" = 'whatsapp'),
+	CONSTRAINT "communication_provider_event_receipts_body_digest_valid" CHECK ("communication_provider_event_receipts"."body_digest" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_provider_event_receipts_lease_token_hash_valid" CHECK ("communication_provider_event_receipts"."lease_token_hash" is null or "communication_provider_event_receipts"."lease_token_hash" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_provider_event_receipts_version_positive" CHECK ("communication_provider_event_receipts"."processing_version" > 0),
+	CONSTRAINT "communication_provider_event_receipts_lease_valid" CHECK (("communication_provider_event_receipts"."lease_owner_id" is null and "communication_provider_event_receipts"."lease_token_hash" is null and "communication_provider_event_receipts"."lease_expires_at" is null) or ("communication_provider_event_receipts"."lease_owner_id" is not null and "communication_provider_event_receipts"."lease_token_hash" is not null and "communication_provider_event_receipts"."lease_expires_at" is not null))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_provider_event_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "public_chat_conversation_sessions" (
+	"id" text PRIMARY KEY NOT NULL,
+	"conversation_id" text NOT NULL,
+	"channel_kind" varchar(16) DEFAULT 'public_web' NOT NULL,
+	"session_id" text NOT NULL,
+	"participant_id" text NOT NULL,
+	"notice_version" varchar(80) NOT NULL,
+	"start_idempotency_key" varchar(128) NOT NULL,
+	"start_fingerprint" char(64) NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	"updated_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "public_chat_conversation_sessions_conversation_unique" UNIQUE("conversation_id"),
+	CONSTRAINT "public_chat_conversation_sessions_session_start_key_unique" UNIQUE("session_id","start_idempotency_key"),
+	CONSTRAINT "public_chat_conversation_sessions_start_fingerprint_valid" CHECK ("public_chat_conversation_sessions"."start_fingerprint" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "public_chat_conversation_sessions_channel_valid" CHECK ("public_chat_conversation_sessions"."channel_kind" = 'public_web')
+);
+--> statement-breakpoint
+ALTER TABLE "public_chat_conversation_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+ALTER TABLE "communication_audit_events" ADD CONSTRAINT "communication_audit_events_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_contact_bindings" ADD CONSTRAINT "communication_contact_bindings_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_contact_bindings" ADD CONSTRAINT "communication_contact_bindings_connection_channel_fk" FOREIGN KEY ("connection_id","channel_kind") REFERENCES "public"."communication_channel_connections"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."communication_contact_bindings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_contact_policies" ADD CONSTRAINT "communication_contact_policies_binding_id_communication_contact_bindings_id_fk" FOREIGN KEY ("binding_id") REFERENCES "public"."communication_contact_bindings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_command_connection_fk" FOREIGN KEY ("command_id","connection_id") REFERENCES "public"."communication_outbound_commands"("id","connection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_receipt_connection_fk" FOREIGN KEY ("receipt_id","connection_id") REFERENCES "public"."communication_provider_event_receipts"("id","connection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_participant_conversation_channel_fk" FOREIGN KEY ("participant_id","conversation_id","channel_kind") REFERENCES "public"."communication_participants"("id","conversation_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_message_conversation_fk" FOREIGN KEY ("message_id","conversation_id") REFERENCES "public"."communication_messages"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" ADD CONSTRAINT "communication_event_envelopes_binding_connection_channel_fk" FOREIGN KEY ("binding_id","connection_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","connection_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_handoffs" ADD CONSTRAINT "communication_handoffs_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_handoffs" ADD CONSTRAINT "communication_handoffs_assignee_conversation_fk" FOREIGN KEY ("assigned_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sender_conversation_fk" FOREIGN KEY ("sender_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_recipient_conversation_fk" FOREIGN KEY ("recipient_participant_id","conversation_id") REFERENCES "public"."communication_participants"("id","conversation_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_binding_connection_channel_fk" FOREIGN KEY ("binding_id","connection_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","connection_id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_participants" ADD CONSTRAINT "communication_participants_binding_channel_fk" FOREIGN KEY ("channel_binding_id","channel_kind") REFERENCES "public"."communication_contact_bindings"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_provider_event_receipts" ADD CONSTRAINT "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."communication_channel_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_provider_event_receipts" ADD CONSTRAINT "communication_provider_event_receipts_connection_channel_fk" FOREIGN KEY ("connection_id","channel_kind") REFERENCES "public"."communication_channel_connections"("id","channel_kind") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."public_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_conversation_channel_fk" FOREIGN KEY ("conversation_id","channel_kind") REFERENCES "public"."communication_conversations"("id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "public_chat_conversation_sessions" ADD CONSTRAINT "public_chat_conversation_sessions_participant_conversation_channel_fk" FOREIGN KEY ("participant_id","conversation_id","channel_kind") REFERENCES "public"."communication_participants"("id","conversation_id","channel_kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+CREATE INDEX "communication_audit_events_aggregate_idx" ON "communication_audit_events" USING btree ("aggregate_type","aggregate_id","occurred_at");--> statement-breakpoint
+CREATE INDEX "communication_channel_connections_readiness_idx" ON "communication_channel_connections" USING btree ("readiness_state","updated_at");--> statement-breakpoint
+CREATE INDEX "communication_contact_bindings_trust_idx" ON "communication_contact_bindings" USING btree ("trust_state","updated_at");--> statement-breakpoint
+CREATE INDEX "communication_contact_evidence_events_binding_idx" ON "communication_contact_evidence_events" USING btree ("binding_id","sequence");--> statement-breakpoint
+CREATE INDEX "communication_contact_policies_fence_idx" ON "communication_contact_policies" USING btree ("fence_state","updated_at");--> statement-breakpoint
+CREATE INDEX "communication_conversations_activity_idx" ON "communication_conversations" USING btree ("channel_kind","last_activity_at");--> statement-breakpoint
+CREATE INDEX "communication_conversations_reconciliation_idx" ON "communication_conversations" USING btree ("reconciliation_required","updated_at");--> statement-breakpoint
+CREATE INDEX "communication_dispatch_attempts_recovery_idx" ON "communication_dispatch_attempts" USING btree ("state","completed_at");--> statement-breakpoint
+CREATE INDEX "communication_event_envelopes_conversation_idx" ON "communication_event_envelopes" USING btree ("conversation_id","occurred_at");--> statement-breakpoint
+CREATE INDEX "communication_handoffs_state_idx" ON "communication_handoffs" USING btree ("state","updated_at");--> statement-breakpoint
+CREATE INDEX "communication_message_templates_projection_idx" ON "communication_message_templates" USING btree ("state","observed_at");--> statement-breakpoint
+CREATE INDEX "communication_messages_conversation_idx" ON "communication_messages" USING btree ("conversation_id","ordinal");--> statement-breakpoint
+CREATE INDEX "communication_messages_external_reference_idx" ON "communication_messages" USING btree ("external_message_reference");--> statement-breakpoint
+CREATE INDEX "communication_outbound_commands_work_idx" ON "communication_outbound_commands" USING btree ("state","lease_expires_at","scheduled_at");--> statement-breakpoint
+CREATE INDEX "communication_participants_conversation_idx" ON "communication_participants" USING btree ("conversation_id","joined_at");--> statement-breakpoint
+CREATE INDEX "communication_provider_event_receipts_work_idx" ON "communication_provider_event_receipts" USING btree ("state","lease_expires_at","received_at");--> statement-breakpoint
+CREATE INDEX "public_chat_conversation_sessions_session_idx" ON "public_chat_conversation_sessions" USING btree ("session_id","created_at");--> statement-breakpoint
+CREATE POLICY "communication_audit_events_public_chat_scope" ON "communication_audit_events" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_audit_events"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_audit_events"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK ("communication_audit_events"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_audit_events"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+CREATE POLICY "communication_audit_events_communications_scope" ON "communication_audit_events" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_audit_events"."channel_kind" = 'whatsapp') WITH CHECK ("communication_audit_events"."channel_kind" = 'whatsapp');--> statement-breakpoint
+CREATE POLICY "communication_channel_connections_communications_scope" ON "communication_channel_connections" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_contact_bindings_communications_scope" ON "communication_contact_bindings" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_contact_evidence_events_communications_select" ON "communication_contact_evidence_events" AS PERMISSIVE FOR SELECT TO "atlas_communications_gateway" USING (true);--> statement-breakpoint
+CREATE POLICY "communication_contact_evidence_events_communications_insert" ON "communication_contact_evidence_events" AS PERMISSIVE FOR INSERT TO "atlas_communications_gateway" WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_contact_policies_communications_scope" ON "communication_contact_policies" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_conversations_public_chat_scope" ON "communication_conversations" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_conversations"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_conversations"."id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK ("communication_conversations"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_conversations"."id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+CREATE POLICY "communication_conversations_communications_scope" ON "communication_conversations" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_conversations"."channel_kind" = 'whatsapp') WITH CHECK ("communication_conversations"."channel_kind" = 'whatsapp');--> statement-breakpoint
+CREATE POLICY "communication_dispatch_attempts_communications_scope" ON "communication_dispatch_attempts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_event_envelopes_communications_scope" ON "communication_event_envelopes" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_handoffs_public_chat_scope" ON "communication_handoffs" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_handoffs"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_handoffs"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK ("communication_handoffs"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_handoffs"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+CREATE POLICY "communication_handoffs_communications_scope" ON "communication_handoffs" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_handoffs"."channel_kind" = 'whatsapp') WITH CHECK ("communication_handoffs"."channel_kind" = 'whatsapp');--> statement-breakpoint
+CREATE POLICY "communication_message_templates_communications_scope" ON "communication_message_templates" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_messages_public_chat_scope" ON "communication_messages" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_messages"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_messages"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK ("communication_messages"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_messages"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+CREATE POLICY "communication_messages_communications_scope" ON "communication_messages" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_messages"."channel_kind" = 'whatsapp') WITH CHECK ("communication_messages"."channel_kind" = 'whatsapp');--> statement-breakpoint
+CREATE POLICY "communication_outbound_commands_communications_scope" ON "communication_outbound_commands" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_participants_public_chat_scope" ON "communication_participants" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("communication_participants"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_participants"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK ("communication_participants"."channel_kind" = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "communication_participants"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+CREATE POLICY "communication_participants_communications_scope" ON "communication_participants" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING ("communication_participants"."channel_kind" = 'whatsapp') WITH CHECK ("communication_participants"."channel_kind" = 'whatsapp');--> statement-breakpoint
+CREATE POLICY "communication_provider_event_receipts_communications_scope" ON "communication_provider_event_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "public_chat_conversation_sessions_public_chat_scope" ON "public_chat_conversation_sessions" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING ("public_chat_conversation_sessions"."session_id" = nullif(current_setting('atlas.public_chat_session_id', true), '')) WITH CHECK ("public_chat_conversation_sessions"."session_id" = nullif(current_setting('atlas.public_chat_session_id', true), ''));
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/0008_m004_communications_backfill.sql b/blueprints/project-atlas/workspace/drizzle/0008_m004_communications_backfill.sql
new file mode 100644
index 0000000..253f24b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0008_m004_communications_backfill.sql
@@ -0,0 +1,509 @@
+-- Drizzle custom migration generated with:
+-- drizzle-kit generate --custom --name m004_communications_backfill
+--
+-- Preparatory forward-only copy. M003 tables, foreign keys and read/write paths remain intact.
+
+LOCK TABLE
+  public_chat_conversations,
+  public_chat_messages,
+  public_chat_handoffs,
+  public_chat_audit_events
+IN SHARE MODE;
+--> statement-breakpoint
+DO $$
+BEGIN
+  IF EXISTS (SELECT 1 FROM communication_conversations LIMIT 1)
+    OR EXISTS (SELECT 1 FROM communication_participants LIMIT 1)
+    OR EXISTS (SELECT 1 FROM public_chat_conversation_sessions LIMIT 1)
+    OR EXISTS (SELECT 1 FROM communication_messages LIMIT 1)
+    OR EXISTS (SELECT 1 FROM communication_handoffs LIMIT 1)
+    OR EXISTS (SELECT 1 FROM communication_audit_events LIMIT 1)
+  THEN
+    RAISE EXCEPTION 'M004_BACKFILL_TARGET_NOT_EMPTY';
+  END IF;
+
+  IF EXISTS (
+    SELECT 1 FROM public_chat_audit_events
+    WHERE event_name NOT IN (
+      'chat_conversation_started', 'chat_message_accepted', 'chat_message_rejected',
+      'chat_response_failed', 'chat_handoff_requested', 'chat_handoff_queued',
+      'chat_locale_changed', 'chat_conversation_closed'
+    )
+  ) THEN
+    RAISE EXCEPTION 'M004_BACKFILL_INCOMPATIBLE_AUDIT_EVENT';
+  END IF;
+END
+$$;
+--> statement-breakpoint
+INSERT INTO communication_conversations (
+  id, channel_kind, locale, status, version, correlation_id, last_activity_at, expires_at,
+  closed_at, reconciliation_required, created_at, updated_at
+)
+SELECT id, 'public_web', locale, status, version, correlation_id, last_activity_at, expires_at,
+  closed_at, reconciliation_required, created_at, updated_at
+FROM public_chat_conversations;
+--> statement-breakpoint
+WITH expected_participants AS (
+  SELECT c.id AS conversation_id, 'external'::varchar(16) AS participant_kind,
+    c.created_at AS joined_at, c.updated_at
+  FROM public_chat_conversations c
+  UNION
+  SELECT m.conversation_id,
+    CASE m.actor
+      WHEN 'visitor' THEN 'external'::varchar(16)
+      WHEN 'assistant' THEN 'automated'::varchar(16)
+      WHEN 'human' THEN 'human'::varchar(16)
+      WHEN 'system' THEN 'system'::varchar(16)
+    END,
+    min(m.created_at), max(c.updated_at)
+  FROM public_chat_messages m
+  JOIN public_chat_conversations c ON c.id = m.conversation_id
+  GROUP BY m.conversation_id, m.actor
+)
+INSERT INTO communication_participants (
+  id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
+  created_at, updated_at
+)
+SELECT 'participant_' || md5(conversation_id || ':' || participant_kind), conversation_id,
+  'public_web', participant_kind, NULL, min(joined_at), NULL, min(joined_at), max(updated_at)
+FROM expected_participants
+GROUP BY conversation_id, participant_kind;
+--> statement-breakpoint
+INSERT INTO public_chat_conversation_sessions (
+  id, conversation_id, channel_kind, session_id, participant_id, notice_version,
+  start_idempotency_key, start_fingerprint, created_at, updated_at
+)
+SELECT 'session_link_' || md5(c.id), c.id, 'public_web', c.session_id,
+  'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
+  c.start_fingerprint, c.created_at, c.updated_at
+FROM public_chat_conversations c;
+--> statement-breakpoint
+INSERT INTO communication_messages (
+  id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+  recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
+  actions, rejection_reason, external_message_reference, created_at
+)
+SELECT m.id, m.conversation_id, 'public_web', m.ordinal + 1,
+  CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
+    WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
+  'participant_' || md5(m.conversation_id || ':' || CASE m.actor
+    WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+    WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
+  NULL, c.locale,
+  CASE WHEN m.actor = 'system' THEN 'system'
+    WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
+  m.state, m.body, m.body_stored,
+  CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
+  m.actions, m.rejection_reason, NULL, m.created_at
+FROM public_chat_messages m
+JOIN public_chat_conversations c ON c.id = m.conversation_id;
+--> statement-breakpoint
+INSERT INTO communication_handoffs (
+  id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
+  assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
+)
+SELECT h.id, h.conversation_id, 'public_web',
+  CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
+  h.reason, h.receipt_id, c.correlation_id, NULL, h.requested_at, h.queued_at, NULL, NULL,
+  h.updated_at
+FROM public_chat_handoffs h
+JOIN public_chat_conversations c ON c.id = h.conversation_id;
+--> statement-breakpoint
+INSERT INTO communication_audit_events (
+  id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
+  result_code, reason_code, version, locale, purpose, policy_version, correlation_id,
+  occurred_at, created_at
+)
+SELECT a.id, a.sequence, a.conversation_id, 'public_web', a.event_name,
+  CASE a.event_name
+    WHEN 'chat_message_accepted' THEN 'message' WHEN 'chat_message_rejected' THEN 'message'
+    WHEN 'chat_response_failed' THEN 'message' WHEN 'chat_handoff_requested' THEN 'handoff'
+    WHEN 'chat_handoff_queued' THEN 'handoff' ELSE 'conversation' END,
+  CASE
+    WHEN a.event_name IN ('chat_message_accepted', 'chat_message_rejected', 'chat_response_failed')
+      THEN COALESCE((SELECT m.id FROM public_chat_messages m
+        WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
+        ORDER BY m.ordinal LIMIT 1), a.conversation_id)
+    WHEN a.event_name IN ('chat_handoff_requested', 'chat_handoff_queued')
+      THEN COALESCE((SELECT h.id FROM public_chat_handoffs h
+        WHERE h.conversation_id = a.conversation_id ORDER BY h.requested_at LIMIT 1), a.conversation_id)
+    ELSE a.conversation_id
+  END,
+  CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
+    WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
+    WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
+    WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
+    WHEN 'chat_conversation_closed' THEN 'closed' END,
+  a.reason, a.version, a.locale, NULL, NULL, a.correlation_id, a.created_at, a.created_at
+FROM public_chat_audit_events a;
+--> statement-breakpoint
+DO $$
+BEGIN
+  IF EXISTS (
+    (SELECT id, 'public_web'::varchar(16), locale, status, version, correlation_id,
+      last_activity_at, expires_at, closed_at, reconciliation_required, created_at, updated_at
+     FROM public_chat_conversations)
+    EXCEPT
+    (SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+      expires_at, closed_at, reconciliation_required, created_at, updated_at
+     FROM communication_conversations WHERE channel_kind = 'public_web')
+  ) OR EXISTS (
+    (SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+      expires_at, closed_at, reconciliation_required, created_at, updated_at
+     FROM communication_conversations WHERE channel_kind = 'public_web')
+    EXCEPT
+    (SELECT id, 'public_web'::varchar(16), locale, status, version, correlation_id,
+      last_activity_at, expires_at, closed_at, reconciliation_required, created_at, updated_at
+     FROM public_chat_conversations)
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: conversations'; END IF;
+
+  IF EXISTS (
+    (SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id,
+      'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
+      c.start_fingerprint, c.created_at, c.updated_at FROM public_chat_conversations c)
+    EXCEPT
+    (SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
+      start_idempotency_key, start_fingerprint, created_at, updated_at
+     FROM public_chat_conversation_sessions)
+  ) OR EXISTS (
+    (SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
+      start_idempotency_key, start_fingerprint, created_at, updated_at
+     FROM public_chat_conversation_sessions)
+    EXCEPT
+    (SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id,
+      'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
+      c.start_fingerprint, c.created_at, c.updated_at FROM public_chat_conversations c)
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: public session ownership'; END IF;
+
+  IF EXISTS (
+    WITH candidates AS (
+      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
+        c.created_at AS joined_at, c.updated_at FROM public_chat_conversations c
+      UNION
+      SELECT m.conversation_id,
+        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
+        m.created_at, c.updated_at
+      FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id
+    ), expected AS (
+      SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
+        'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
+        min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
+        max(updated_at) AS updated_at
+      FROM candidates GROUP BY conversation_id, kind
+    )
+    SELECT * FROM expected
+    EXCEPT
+    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
+      created_at, updated_at FROM communication_participants WHERE channel_kind = 'public_web'
+  ) OR EXISTS (
+    WITH candidates AS (
+      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
+        c.created_at AS joined_at, c.updated_at FROM public_chat_conversations c
+      UNION
+      SELECT m.conversation_id,
+        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
+        m.created_at, c.updated_at
+      FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id
+    ), expected AS (
+      SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
+        'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
+        min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
+        max(updated_at) AS updated_at
+      FROM candidates GROUP BY conversation_id, kind
+    )
+    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
+      created_at, updated_at FROM communication_participants WHERE channel_kind = 'public_web'
+    EXCEPT
+    SELECT * FROM expected
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: participants'; END IF;
+
+  IF EXISTS (
+    (SELECT m.id, m.conversation_id, m.ordinal + 1,
+      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
+        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
+      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
+        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
+      NULL::text, c.locale, CASE WHEN m.actor = 'system' THEN 'system'
+        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
+      m.state, m.body, m.body_stored,
+      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
+      m.actions, m.rejection_reason, NULL::text, m.created_at
+     FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id)
+    EXCEPT
+    (SELECT id, conversation_id, ordinal, direction, sender_participant_id,
+      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
+      actions, rejection_reason, external_message_reference, created_at
+     FROM communication_messages WHERE channel_kind = 'public_web')
+  ) OR EXISTS (
+    (SELECT id, conversation_id, ordinal, direction, sender_participant_id,
+      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
+      actions, rejection_reason, external_message_reference, created_at
+     FROM communication_messages WHERE channel_kind = 'public_web')
+    EXCEPT
+    (SELECT m.id, m.conversation_id, m.ordinal + 1,
+      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
+        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
+      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
+        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
+      NULL::text, c.locale, CASE WHEN m.actor = 'system' THEN 'system'
+        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
+      m.state, m.body, m.body_stored,
+      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
+      m.actions, m.rejection_reason, NULL::text, m.created_at
+     FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id)
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: messages'; END IF;
+
+  IF EXISTS (
+    (SELECT h.id, h.conversation_id,
+      CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
+      h.reason, h.receipt_id, c.correlation_id, NULL::text, h.requested_at, h.queued_at,
+      NULL::timestamptz, NULL::timestamptz, h.updated_at
+     FROM public_chat_handoffs h JOIN public_chat_conversations c ON c.id = h.conversation_id)
+    EXCEPT
+    (SELECT id, conversation_id, state, reason_code, receipt_id, correlation_id,
+      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
+     FROM communication_handoffs WHERE channel_kind = 'public_web')
+  ) OR EXISTS (
+    (SELECT id, conversation_id, state, reason_code, receipt_id, correlation_id,
+      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
+     FROM communication_handoffs WHERE channel_kind = 'public_web')
+    EXCEPT
+    (SELECT h.id, h.conversation_id,
+      CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
+      h.reason, h.receipt_id, c.correlation_id, NULL::text, h.requested_at, h.queued_at,
+      NULL::timestamptz, NULL::timestamptz, h.updated_at
+     FROM public_chat_handoffs h JOIN public_chat_conversations c ON c.id = h.conversation_id)
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: handoffs'; END IF;
+
+  IF EXISTS (
+    (SELECT a.id, a.sequence, a.conversation_id, a.event_name,
+      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
+        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
+        WHEN 'chat_handoff_requested' THEN 'handoff' WHEN 'chat_handoff_queued' THEN 'handoff'
+        ELSE 'conversation' END,
+      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
+        THEN COALESCE((SELECT m.id FROM public_chat_messages m
+          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
+          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
+        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
+        THEN COALESCE((SELECT h.id FROM public_chat_handoffs h WHERE h.conversation_id = a.conversation_id
+          ORDER BY h.requested_at LIMIT 1), a.conversation_id) ELSE a.conversation_id END,
+      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
+        WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
+        WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
+        WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
+        WHEN 'chat_conversation_closed' THEN 'closed' END,
+      a.reason, a.version, a.locale, NULL::varchar(24), NULL::integer,
+      a.correlation_id, a.created_at, a.created_at
+     FROM public_chat_audit_events a)
+    EXCEPT
+    (SELECT id, sequence, conversation_id, event_name, aggregate_type, aggregate_id, result_code,
+      reason_code, version, locale, purpose, policy_version, correlation_id, occurred_at, created_at
+     FROM communication_audit_events WHERE channel_kind = 'public_web')
+  ) OR EXISTS (
+    (SELECT id, sequence, conversation_id, event_name, aggregate_type, aggregate_id, result_code,
+      reason_code, version, locale, purpose, policy_version, correlation_id, occurred_at, created_at
+     FROM communication_audit_events WHERE channel_kind = 'public_web')
+    EXCEPT
+    (SELECT a.id, a.sequence, a.conversation_id, a.event_name,
+      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
+        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
+        WHEN 'chat_handoff_requested' THEN 'handoff' WHEN 'chat_handoff_queued' THEN 'handoff'
+        ELSE 'conversation' END,
+      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
+        THEN COALESCE((SELECT m.id FROM public_chat_messages m
+          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
+          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
+        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
+        THEN COALESCE((SELECT h.id FROM public_chat_handoffs h WHERE h.conversation_id = a.conversation_id
+          ORDER BY h.requested_at LIMIT 1), a.conversation_id) ELSE a.conversation_id END,
+      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
+        WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
+        WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
+        WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
+        WHEN 'chat_conversation_closed' THEN 'closed' END,
+      a.reason, a.version, a.locale, NULL::varchar(24), NULL::integer,
+      a.correlation_id, a.created_at, a.created_at
+     FROM public_chat_audit_events a)
+  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: audit'; END IF;
+END
+$$;
+--> statement-breakpoint
+DO $$
+BEGIN
+  IF NOT EXISTS (
+    SELECT 1 FROM pg_roles
+    WHERE rolname = current_user AND (rolsuper OR rolbypassrls)
+  ) THEN
+    RAISE EXCEPTION 'M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS';
+  END IF;
+END
+$$;
+--> statement-breakpoint
+CREATE OR REPLACE FUNCTION atlas_bootstrap_public_chat_conversation(
+  public_chat_session_id text,
+  conversation_id text,
+  participant_id text,
+  session_link_id text,
+  locale varchar(2),
+  correlation_id text,
+  notice_version varchar(80),
+  start_idempotency_key varchar(128),
+  start_fingerprint char(64),
+  occurred_at timestamptz,
+  expires_at timestamptz
+) RETURNS void
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = pg_catalog, public
+AS $$
+DECLARE
+  scoped_session_id text := nullif(current_setting('atlas.public_chat_session_id', true), '');
+BEGIN
+  IF scoped_session_id IS NULL OR scoped_session_id <> public_chat_session_id THEN
+    RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_SESSION_MISMATCH';
+  END IF;
+  IF conversation_id = '' OR participant_id = '' OR session_link_id = ''
+    OR start_fingerprint !~ '^[0-9a-f]{64}$' OR expires_at <= occurred_at
+  THEN RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_INPUT_INVALID'; END IF;
+  IF NOT EXISTS (
+    SELECT 1 FROM public.public_chat_sessions s
+    WHERE s.id = scoped_session_id AND s.revoked_at IS NULL AND s.expires_at > occurred_at
+  ) THEN RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_SESSION_INVALID'; END IF;
+
+  INSERT INTO public.communication_conversations (
+    id, channel_kind, locale, status, version, correlation_id, last_activity_at, expires_at,
+    reconciliation_required, created_at, updated_at
+  ) VALUES (
+    conversation_id, 'public_web', locale, 'new', 1, correlation_id, occurred_at, expires_at,
+    false, occurred_at, occurred_at
+  );
+  INSERT INTO public.communication_participants (
+    id, conversation_id, channel_kind, kind, joined_at, created_at, updated_at
+  ) VALUES (
+    participant_id, conversation_id, 'public_web', 'external', occurred_at, occurred_at, occurred_at
+  );
+  INSERT INTO public.public_chat_conversation_sessions (
+    id, conversation_id, channel_kind, session_id, participant_id, notice_version,
+    start_idempotency_key, start_fingerprint, created_at, updated_at
+  ) VALUES (
+    session_link_id, conversation_id, 'public_web', scoped_session_id, participant_id,
+    notice_version, start_idempotency_key, start_fingerprint, occurred_at, occurred_at
+  );
+  INSERT INTO public.communication_audit_events (
+    id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
+    result_code, version, locale, correlation_id, occurred_at, created_at
+  ) VALUES (
+    'audit_' || md5(conversation_id || ':bootstrap'), 1, conversation_id, 'public_web',
+    'chat_conversation_started', 'conversation', conversation_id, 'new', 1, locale,
+    correlation_id, occurred_at, occurred_at
+  );
+END
+$$;
+--> statement-breakpoint
+REVOKE ALL ON FUNCTION atlas_bootstrap_public_chat_conversation(
+  text, text, text, text, varchar, text, varchar, varchar, char, timestamptz, timestamptz
+) FROM PUBLIC;
+--> statement-breakpoint
+GRANT EXECUTE ON FUNCTION atlas_bootstrap_public_chat_conversation(
+  text, text, text, text, varchar, text, varchar, varchar, char, timestamptz, timestamptz
+) TO atlas_public_chat_gateway;
+--> statement-breakpoint
+ALTER TABLE "communication_channel_connections" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_contact_bindings" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_contact_policies" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_conversations" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_participants" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "public_chat_conversation_sessions" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_messages" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_provider_event_receipts" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_event_envelopes" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_message_templates" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_handoffs" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_audit_events" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+REVOKE ALL ON TABLE
+  "communication_channel_connections", "communication_contact_bindings",
+  "communication_contact_evidence_events", "communication_contact_policies",
+  "communication_conversations", "communication_participants",
+  "public_chat_conversation_sessions", "communication_messages",
+  "communication_provider_event_receipts", "communication_event_envelopes",
+  "communication_message_templates", "communication_outbound_commands",
+  "communication_dispatch_attempts", "communication_handoffs", "communication_audit_events"
+FROM PUBLIC;
+--> statement-breakpoint
+DO $$
+DECLARE browser_role text; communication_table text;
+BEGIN
+  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
+    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
+      FOREACH communication_table IN ARRAY ARRAY[
+        'communication_channel_connections', 'communication_contact_bindings',
+        'communication_contact_evidence_events', 'communication_contact_policies',
+        'communication_conversations', 'communication_participants',
+        'public_chat_conversation_sessions', 'communication_messages',
+        'communication_provider_event_receipts', 'communication_event_envelopes',
+        'communication_message_templates', 'communication_outbound_commands',
+        'communication_dispatch_attempts', 'communication_handoffs', 'communication_audit_events'
+      ] LOOP
+        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', communication_table, browser_role);
+      END LOOP;
+    END IF;
+  END LOOP;
+END
+$$;
+--> statement-breakpoint
+REVOKE ALL ON TABLE
+  "communication_channel_connections", "communication_contact_bindings",
+  "communication_contact_evidence_events", "communication_contact_policies",
+  "communication_conversations", "communication_participants",
+  "public_chat_conversation_sessions", "communication_messages",
+  "communication_provider_event_receipts", "communication_event_envelopes",
+  "communication_message_templates", "communication_outbound_commands",
+  "communication_dispatch_attempts", "communication_handoffs", "communication_audit_events"
+FROM atlas_public_chat_gateway, atlas_communications_gateway;
+--> statement-breakpoint
+GRANT USAGE ON SCHEMA public TO atlas_public_chat_gateway, atlas_communications_gateway;
+--> statement-breakpoint
+GRANT SELECT, INSERT, UPDATE ON TABLE
+  "communication_conversations", "communication_participants", "communication_messages",
+  "communication_handoffs"
+TO atlas_public_chat_gateway, atlas_communications_gateway;
+--> statement-breakpoint
+GRANT SELECT, INSERT ON TABLE "communication_audit_events"
+TO atlas_public_chat_gateway, atlas_communications_gateway;
+--> statement-breakpoint
+GRANT SELECT ON TABLE "public_chat_conversation_sessions"
+TO atlas_public_chat_gateway;
+--> statement-breakpoint
+GRANT SELECT, INSERT, UPDATE ON TABLE
+  "communication_channel_connections", "communication_contact_bindings",
+  "communication_contact_policies", "communication_provider_event_receipts",
+  "communication_message_templates", "communication_outbound_commands",
+  "communication_dispatch_attempts"
+TO atlas_communications_gateway;
+--> statement-breakpoint
+GRANT SELECT, INSERT ON TABLE
+  "communication_contact_evidence_events", "communication_event_envelopes"
+TO atlas_communications_gateway;
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0006_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0006_snapshot.json
new file mode 100644
index 0000000..c022d9d
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0006_snapshot.json
@@ -0,0 +1,1045 @@
+{
+  "id": "8b642d6d-01b9-484c-bdcf-ce9bcb486815",
+  "prevId": "2dda01e5-3e92-4d83-ab75-a87021227c27",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.public_chat_audit_events": {
+      "name": "public_chat_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_audit_events",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_audit_sequence_unique": {
+          "name": "public_chat_audit_sequence_unique",
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_audit_events_server_gateway_only": {
+          "name": "public_chat_audit_events_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_audit_locale_valid": {
+          "name": "public_chat_audit_locale_valid",
+          "value": "\"public_chat_audit_events\".\"locale\" in ('es', 'en')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_citations": {
+      "name": "public_chat_citations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_id": {
+          "name": "source_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "path": {
+          "name": "path",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "summary": {
+          "name": "summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "disclosure": {
+          "name": "disclosure",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_kind": {
+          "name": "source_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_citations_message_id_public_chat_messages_id_fk": {
+          "name": "public_chat_citations_message_id_public_chat_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "tableTo": "public_chat_messages",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "columns": [
+            "message_id",
+            "source_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_citations_server_gateway_only": {
+          "name": "public_chat_citations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_citations_locale_valid": {
+          "name": "public_chat_citations_locale_valid",
+          "value": "\"public_chat_citations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_citations_source_kind_valid": {
+          "name": "public_chat_citations_source_kind_valid",
+          "value": "\"public_chat_citations\".\"source_kind\" is null or \"public_chat_citations\".\"source_kind\" = 'provider'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversations": {
+      "name": "public_chat_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_receipt_id": {
+          "name": "handoff_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_reason": {
+          "name": "handoff_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversations_expiry_idx": {
+          "name": "public_chat_conversations_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "public_chat_conversations_reconciliation_idx": {
+          "name": "public_chat_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversations_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversations_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversations",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "tableTo": "public_chat_sessions",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversations_session_start_key_unique": {
+          "name": "public_chat_conversations_session_start_key_unique",
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_conversations_server_gateway_only": {
+          "name": "public_chat_conversations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversations_version_positive": {
+          "name": "public_chat_conversations_version_positive",
+          "value": "\"public_chat_conversations\".\"version\" > 0"
+        },
+        "public_chat_conversations_locale_valid": {
+          "name": "public_chat_conversations_locale_valid",
+          "value": "\"public_chat_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_conversations_status_valid": {
+          "name": "public_chat_conversations_status_valid",
+          "value": "\"public_chat_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "public_chat_conversations_expiry_valid": {
+          "name": "public_chat_conversations_expiry_valid",
+          "value": "\"public_chat_conversations\".\"expires_at\" > \"public_chat_conversations\".\"created_at\""
+        },
+        "public_chat_conversations_handoff_reason_valid": {
+          "name": "public_chat_conversations_handoff_reason_valid",
+          "value": "\"public_chat_conversations\".\"handoff_reason\" is null or \"public_chat_conversations\".\"handoff_reason\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable')"
+        },
+        "public_chat_conversations_handoff_state_valid": {
+          "name": "public_chat_conversations_handoff_state_valid",
+          "value": "(\"public_chat_conversations\".\"status\" in ('human_requested', 'waiting_for_human') and \"public_chat_conversations\".\"handoff_reason\" is not null) or (\"public_chat_conversations\".\"status\" not in ('human_requested', 'waiting_for_human'))"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_handoffs": {
+      "name": "public_chat_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_handoffs_status_idx": {
+          "name": "public_chat_handoffs_status_idx",
+          "columns": [
+            {
+              "expression": "status",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_handoffs",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_handoffs_server_gateway_only": {
+          "name": "public_chat_handoffs_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_handoffs_status_valid": {
+          "name": "public_chat_handoffs_status_valid",
+          "value": "\"public_chat_handoffs\".\"status\" in ('human_requested', 'waiting_for_human')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_idempotency": {
+      "name": "public_chat_idempotency",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_kind": {
+          "name": "command_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_fingerprint": {
+          "name": "command_fingerprint",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_version": {
+          "name": "expected_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result": {
+          "name": "result",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_idempotency_lease_idx": {
+          "name": "public_chat_idempotency_lease_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_idempotency_server_gateway_only": {
+          "name": "public_chat_idempotency_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_idempotency_state_valid": {
+          "name": "public_chat_idempotency_state_valid",
+          "value": "\"public_chat_idempotency\".\"state\" in ('in_progress', 'completed')"
+        },
+        "public_chat_idempotency_command_kind_valid": {
+          "name": "public_chat_idempotency_command_kind_valid",
+          "value": "\"public_chat_idempotency\".\"command_kind\" in ('message', 'handoff', 'locale', 'close')"
+        },
+        "public_chat_idempotency_completion_valid": {
+          "name": "public_chat_idempotency_completion_valid",
+          "value": "(\"public_chat_idempotency\".\"state\" = 'completed' and \"public_chat_idempotency\".\"result\" is not null and \"public_chat_idempotency\".\"completed_at\" is not null) or (\"public_chat_idempotency\".\"state\" = 'in_progress' and \"public_chat_idempotency\".\"completed_at\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_messages": {
+      "name": "public_chat_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "actor": {
+          "name": "actor",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_messages_conversation_idx": {
+          "name": "public_chat_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_messages_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_messages_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_messages",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_messages_conversation_ordinal_unique": {
+          "name": "public_chat_messages_conversation_ordinal_unique",
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_messages_server_gateway_only": {
+          "name": "public_chat_messages_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_messages_actor_valid": {
+          "name": "public_chat_messages_actor_valid",
+          "value": "\"public_chat_messages\".\"actor\" in ('visitor', 'assistant', 'human', 'system')"
+        },
+        "public_chat_messages_state_valid": {
+          "name": "public_chat_messages_state_valid",
+          "value": "\"public_chat_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "public_chat_messages_body_retention_valid": {
+          "name": "public_chat_messages_body_retention_valid",
+          "value": "(\"public_chat_messages\".\"body_stored\" = true and \"public_chat_messages\".\"body\" is not null) or (\"public_chat_messages\".\"body_stored\" = false and \"public_chat_messages\".\"body\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_rate_limits": {
+      "name": "public_chat_rate_limits",
+      "schema": "",
+      "columns": {
+        "bucket_hash": {
+          "name": "bucket_hash",
+          "type": "char(64)",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "count": {
+          "name": "count",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "window_started_at": {
+          "name": "window_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_rate_limits_expiry_idx": {
+          "name": "public_chat_rate_limits_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_rate_limits_server_gateway_only": {
+          "name": "public_chat_rate_limits_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_rate_limits_count_positive": {
+          "name": "public_chat_rate_limits_count_positive",
+          "value": "\"public_chat_rate_limits\".\"count\" > 0"
+        },
+        "public_chat_rate_limits_window_valid": {
+          "name": "public_chat_rate_limits_window_valid",
+          "value": "\"public_chat_rate_limits\".\"expires_at\" > \"public_chat_rate_limits\".\"window_started_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_sessions": {
+      "name": "public_chat_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_hash": {
+          "name": "session_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "csrf_hash": {
+          "name": "csrf_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revoked_at": {
+          "name": "revoked_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_sessions_expiry_idx": {
+          "name": "public_chat_sessions_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "columns": [
+            "session_hash"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_sessions_server_gateway_only": {
+          "name": "public_chat_sessions_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {},
+      "isRLSEnabled": true
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "views": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json
new file mode 100644
index 0000000..aea4fc7
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json
@@ -0,0 +1,4465 @@
+{
+  "id": "9fd63f9f-d3bc-43f9-a56b-f985527cbca3",
+  "prevId": "8b642d6d-01b9-484c-bdcf-ce9bcb486815",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.communication_audit_events": {
+      "name": "communication_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_type": {
+          "name": "aggregate_type",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_id": {
+          "name": "aggregate_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_audit_events_aggregate_idx": {
+          "name": "communication_audit_events_aggregate_idx",
+          "columns": [
+            {
+              "expression": "aggregate_type",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "aggregate_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_audit_events_conversation_channel_fk": {
+          "name": "communication_audit_events_conversation_channel_fk",
+          "tableFrom": "communication_audit_events",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_audit_events_conversation_sequence_unique": {
+          "name": "communication_audit_events_conversation_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ]
+        }
+      },
+      "policies": {
+        "communication_audit_events_public_chat_scope": {
+          "name": "communication_audit_events_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_audit_events_communications_scope": {
+          "name": "communication_audit_events_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_audit_events_channel_valid": {
+          "name": "communication_audit_events_channel_valid",
+          "value": "\"communication_audit_events\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_audit_events_sequence_positive": {
+          "name": "communication_audit_events_sequence_positive",
+          "value": "\"communication_audit_events\".\"sequence\" > 0"
+        },
+        "communication_audit_events_locale_valid": {
+          "name": "communication_audit_events_locale_valid",
+          "value": "\"communication_audit_events\".\"locale\" is null or \"communication_audit_events\".\"locale\" in ('es', 'en')"
+        },
+        "communication_audit_events_purpose_valid": {
+          "name": "communication_audit_events_purpose_valid",
+          "value": "\"communication_audit_events\".\"purpose\" is null or \"communication_audit_events\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_audit_events_aggregate_valid": {
+          "name": "communication_audit_events_aggregate_valid",
+          "value": "\"communication_audit_events\".\"aggregate_type\" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')"
+        },
+        "communication_audit_events_result_valid": {
+          "name": "communication_audit_events_result_valid",
+          "value": "\"communication_audit_events\".\"result_code\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')"
+        },
+        "communication_audit_events_version_positive": {
+          "name": "communication_audit_events_version_positive",
+          "value": "\"communication_audit_events\".\"version\" > 0"
+        },
+        "communication_audit_events_policy_version_positive": {
+          "name": "communication_audit_events_policy_version_positive",
+          "value": "\"communication_audit_events\".\"policy_version\" is null or \"communication_audit_events\".\"policy_version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_channel_connections": {
+      "name": "communication_channel_connections",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "adapter_key": {
+          "name": "adapter_key",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "readiness_state": {
+          "name": "readiness_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "configured_at": {
+          "name": "configured_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verified_at": {
+          "name": "verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_channel_connections_readiness_idx": {
+          "name": "communication_channel_connections_readiness_idx",
+          "columns": [
+            {
+              "expression": "readiness_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_channel_connections_id_channel_unique": {
+          "name": "communication_channel_connections_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_channel_connections_communications_scope": {
+          "name": "communication_channel_connections_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_channel_connections_channel_valid": {
+          "name": "communication_channel_connections_channel_valid",
+          "value": "\"communication_channel_connections\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_channel_connections_adapter_valid": {
+          "name": "communication_channel_connections_adapter_valid",
+          "value": "\"communication_channel_connections\".\"adapter_key\" = 'meta_cloud'"
+        },
+        "communication_channel_connections_readiness_valid": {
+          "name": "communication_channel_connections_readiness_valid",
+          "value": "\"communication_channel_connections\".\"readiness_state\" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')"
+        },
+        "communication_channel_connections_version_positive": {
+          "name": "communication_channel_connections_version_positive",
+          "value": "\"communication_channel_connections\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_bindings": {
+      "name": "communication_contact_bindings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest": {
+          "name": "endpoint_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest_key_version": {
+          "name": "endpoint_digest_key_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "trust_state": {
+          "name": "trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "contact_policy_version": {
+          "name": "contact_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "verification_receipt_id": {
+          "name": "verification_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_verified_at": {
+          "name": "endpoint_verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verification_expires_at": {
+          "name": "verification_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "wrong_person_reported_at": {
+          "name": "wrong_person_reported_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reassignment_risk_at": {
+          "name": "reassignment_risk_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_bindings_trust_idx": {
+          "name": "communication_contact_bindings_trust_idx",
+          "columns": [
+            {
+              "expression": "trust_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_bindings_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_contact_bindings_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_contact_bindings_connection_channel_fk": {
+          "name": "communication_contact_bindings_connection_channel_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_bindings_id_connection_channel_unique": {
+          "name": "communication_contact_bindings_id_connection_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_id_channel_unique": {
+          "name": "communication_contact_bindings_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_endpoint_unique": {
+          "name": "communication_contact_bindings_endpoint_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "endpoint_digest_key_version",
+            "endpoint_digest"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_bindings_communications_scope": {
+          "name": "communication_contact_bindings_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_bindings_channel_valid": {
+          "name": "communication_contact_bindings_channel_valid",
+          "value": "\"communication_contact_bindings\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_contact_bindings_trust_valid": {
+          "name": "communication_contact_bindings_trust_valid",
+          "value": "\"communication_contact_bindings\".\"trust_state\" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')"
+        },
+        "communication_contact_bindings_locale_valid": {
+          "name": "communication_contact_bindings_locale_valid",
+          "value": "\"communication_contact_bindings\".\"locale\" in ('es', 'en')"
+        },
+        "communication_contact_bindings_endpoint_digest_valid": {
+          "name": "communication_contact_bindings_endpoint_digest_valid",
+          "value": "\"communication_contact_bindings\".\"endpoint_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_contact_bindings_policy_version_positive": {
+          "name": "communication_contact_bindings_policy_version_positive",
+          "value": "\"communication_contact_bindings\".\"contact_policy_version\" > 0"
+        },
+        "communication_contact_bindings_version_positive": {
+          "name": "communication_contact_bindings_version_positive",
+          "value": "\"communication_contact_bindings\".\"version\" > 0"
+        },
+        "communication_contact_bindings_verification_window_valid": {
+          "name": "communication_contact_bindings_verification_window_valid",
+          "value": "\"communication_contact_bindings\".\"verification_expires_at\" is null or (\"communication_contact_bindings\".\"endpoint_verified_at\" is not null and \"communication_contact_bindings\".\"verification_expires_at\" > \"communication_contact_bindings\".\"endpoint_verified_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_evidence_events": {
+      "name": "communication_contact_evidence_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_trust_state": {
+          "name": "binding_trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "review_resolution": {
+          "name": "review_resolution",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_kind": {
+          "name": "receipt_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_role": {
+          "name": "authority_role",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_version": {
+          "name": "authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "triggering_event_id": {
+          "name": "triggering_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_issued_at": {
+          "name": "receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_valid_until": {
+          "name": "receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_evidence_events_binding_idx": {
+          "name": "communication_contact_evidence_events_binding_idx",
+          "columns": [
+            {
+              "expression": "binding_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "sequence",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_evidence_events_binding_sequence_unique": {
+          "name": "communication_contact_evidence_events_binding_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "sequence"
+          ]
+        },
+        "communication_contact_evidence_events_receipt_unique": {
+          "name": "communication_contact_evidence_events_receipt_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "evidence_receipt_id"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_evidence_events_communications_select": {
+          "name": "communication_contact_evidence_events_communications_select",
+          "as": "PERMISSIVE",
+          "for": "SELECT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true"
+        },
+        "communication_contact_evidence_events_communications_insert": {
+          "name": "communication_contact_evidence_events_communications_insert",
+          "as": "PERMISSIVE",
+          "for": "INSERT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_evidence_events_kind_valid": {
+          "name": "communication_contact_evidence_events_kind_valid",
+          "value": "\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')"
+        },
+        "communication_contact_evidence_events_authority_valid": {
+          "name": "communication_contact_evidence_events_authority_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
+        },
+        "communication_contact_evidence_events_sequence_positive": {
+          "name": "communication_contact_evidence_events_sequence_positive",
+          "value": "\"communication_contact_evidence_events\".\"sequence\" > 0"
+        },
+        "communication_contact_evidence_events_receipt_window_valid": {
+          "name": "communication_contact_evidence_events_receipt_window_valid",
+          "value": "(\"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"receipt_issued_at\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" > \"communication_contact_evidence_events\".\"receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_policies": {
+      "name": "communication_contact_policies",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "decision_code": {
+          "name": "decision_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "evaluated_at": {
+          "name": "evaluated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_policies_fence_idx": {
+          "name": "communication_contact_policies_fence_idx",
+          "columns": [
+            {
+              "expression": "fence_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_policies_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_policies_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_policies",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_policies_binding_purpose_unique": {
+          "name": "communication_contact_policies_binding_purpose_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "purpose"
+          ]
+        }
+      },
+      "policies": {
+        "communication_contact_policies_communications_scope": {
+          "name": "communication_contact_policies_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_policies_purpose_valid": {
+          "name": "communication_contact_policies_purpose_valid",
+          "value": "\"communication_contact_policies\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_contact_policies_consent_valid": {
+          "name": "communication_contact_policies_consent_valid",
+          "value": "\"communication_contact_policies\".\"consent_state\" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')"
+        },
+        "communication_contact_policies_fence_valid": {
+          "name": "communication_contact_policies_fence_valid",
+          "value": "\"communication_contact_policies\".\"fence_state\" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')"
+        },
+        "communication_contact_policies_decision_valid": {
+          "name": "communication_contact_policies_decision_valid",
+          "value": "\"communication_contact_policies\".\"decision_code\" is null or \"communication_contact_policies\".\"decision_code\" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')"
+        },
+        "communication_contact_policies_version_positive": {
+          "name": "communication_contact_policies_version_positive",
+          "value": "\"communication_contact_policies\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_conversations": {
+      "name": "communication_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_conversations_activity_idx": {
+          "name": "communication_conversations_activity_idx",
+          "columns": [
+            {
+              "expression": "channel_kind",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "last_activity_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "communication_conversations_reconciliation_idx": {
+          "name": "communication_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_conversations_id_channel_unique": {
+          "name": "communication_conversations_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_conversations_public_chat_scope": {
+          "name": "communication_conversations_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_conversations_communications_scope": {
+          "name": "communication_conversations_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_conversations_channel_valid": {
+          "name": "communication_conversations_channel_valid",
+          "value": "\"communication_conversations\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_conversations_locale_valid": {
+          "name": "communication_conversations_locale_valid",
+          "value": "\"communication_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "communication_conversations_status_valid": {
+          "name": "communication_conversations_status_valid",
+          "value": "\"communication_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "communication_conversations_version_positive": {
+          "name": "communication_conversations_version_positive",
+          "value": "\"communication_conversations\".\"version\" > 0"
+        },
+        "communication_conversations_expiry_valid": {
+          "name": "communication_conversations_expiry_valid",
+          "value": "\"communication_conversations\".\"expires_at\" is null or \"communication_conversations\".\"expires_at\" > \"communication_conversations\".\"created_at\""
+        },
+        "communication_conversations_public_expiry_required": {
+          "name": "communication_conversations_public_expiry_required",
+          "value": "\"communication_conversations\".\"channel_kind\" <> 'public_web' or \"communication_conversations\".\"expires_at\" is not null"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_attempts": {
+      "name": "communication_dispatch_attempts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_ordinal": {
+          "name": "attempt_ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_idempotency": {
+          "name": "request_idempotency",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference_capability": {
+          "name": "stable_reference_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_lookup_capability": {
+          "name": "message_lookup_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status_reconciliation_capability": {
+          "name": "status_reconciliation_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "media_references_capability": {
+          "name": "media_references_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "template_projection_capability": {
+          "name": "template_projection_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "capability_observed_at": {
+          "name": "capability_observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_digest": {
+          "name": "request_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference": {
+          "name": "stable_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_capability_hash": {
+          "name": "provider_io_capability_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_started_at": {
+          "name": "provider_io_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_dispatch_attempts_recovery_idx": {
+          "name": "communication_dispatch_attempts_recovery_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "completed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_dispatch_attempts_command_connection_fk": {
+          "name": "communication_dispatch_attempts_command_connection_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_dispatch_attempts_command_ordinal_unique": {
+          "name": "communication_dispatch_attempts_command_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "command_id",
+            "attempt_ordinal"
+          ]
+        },
+        "communication_dispatch_attempts_external_reference_unique": {
+          "name": "communication_dispatch_attempts_external_reference_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_message_reference"
+          ]
+        }
+      },
+      "policies": {
+        "communication_dispatch_attempts_communications_scope": {
+          "name": "communication_dispatch_attempts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_attempts_ordinal_positive": {
+          "name": "communication_dispatch_attempts_ordinal_positive",
+          "value": "\"communication_dispatch_attempts\".\"attempt_ordinal\" > 0"
+        },
+        "communication_dispatch_attempts_request_digest_valid": {
+          "name": "communication_dispatch_attempts_request_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"request_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_policy_version_positive": {
+          "name": "communication_dispatch_attempts_policy_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"expected_policy_version\" > 0"
+        },
+        "communication_dispatch_attempts_state_valid": {
+          "name": "communication_dispatch_attempts_state_valid",
+          "value": "\"communication_dispatch_attempts\".\"state\" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_dispatch_attempts_result_valid": {
+          "name": "communication_dispatch_attempts_result_valid",
+          "value": "\"communication_dispatch_attempts\".\"result_code\" is null or \"communication_dispatch_attempts\".\"result_code\" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')"
+        },
+        "communication_dispatch_attempts_completion_valid": {
+          "name": "communication_dispatch_attempts_completion_valid",
+          "value": "\"communication_dispatch_attempts\".\"completed_at\" is null or \"communication_dispatch_attempts\".\"completed_at\" >= \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_io_capability_valid": {
+          "name": "communication_dispatch_attempts_provider_io_capability_valid",
+          "value": "(\"communication_dispatch_attempts\".\"provider_io_capability_hash\" is null and \"communication_dispatch_attempts\".\"provider_io_started_at\" is null) or (\"communication_dispatch_attempts\".\"provider_io_capability_hash\" ~ '^[0-9a-f]{64}$' and \"communication_dispatch_attempts\".\"provider_io_started_at\" is not null and \"communication_dispatch_attempts\".\"provider_io_started_at\" >= \"communication_dispatch_attempts\".\"started_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_event_envelopes": {
+      "name": "communication_event_envelopes",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_text": {
+          "name": "canonical_text",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "delivery_state": {
+          "name": "delivery_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_kind": {
+          "name": "interactive_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_id": {
+          "name": "interactive_id",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_title": {
+          "name": "interactive_title",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_external_reference": {
+          "name": "media_external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_declared_kind": {
+          "name": "media_declared_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_mime_type": {
+          "name": "media_mime_type",
+          "type": "varchar(160)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_checksum": {
+          "name": "media_checksum",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_id": {
+          "name": "template_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_state": {
+          "name": "template_authority_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_version": {
+          "name": "template_authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_updated_at": {
+          "name": "template_authority_updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_reference": {
+          "name": "template_provider_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_locale": {
+          "name": "template_locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_category": {
+          "name": "template_category",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_state": {
+          "name": "template_provider_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_version": {
+          "name": "template_provider_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_timestamp": {
+          "name": "template_provider_timestamp",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_components": {
+          "name": "template_components",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "unsupported_reason": {
+          "name": "unsupported_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_event_envelopes_conversation_idx": {
+          "name": "communication_event_envelopes_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_event_envelopes_receipt_connection_fk": {
+          "name": "communication_event_envelopes_receipt_connection_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "receipt_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_conversation_channel_fk": {
+          "name": "communication_event_envelopes_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_participant_conversation_channel_fk": {
+          "name": "communication_event_envelopes_participant_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_message_conversation_fk": {
+          "name": "communication_event_envelopes_message_conversation_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_messages",
+          "columnsFrom": [
+            "message_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_binding_connection_channel_fk": {
+          "name": "communication_event_envelopes_binding_connection_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_event_envelopes_receipt_id_unique": {
+          "name": "communication_event_envelopes_receipt_id_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "receipt_id"
+          ]
+        }
+      },
+      "policies": {
+        "communication_event_envelopes_communications_scope": {
+          "name": "communication_event_envelopes_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_event_envelopes_kind_valid": {
+          "name": "communication_event_envelopes_kind_valid",
+          "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_event_envelopes_channel_valid": {
+          "name": "communication_event_envelopes_channel_valid",
+          "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_event_envelopes_retention_valid": {
+          "name": "communication_event_envelopes_retention_valid",
+          "value": "(\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)"
+        },
+        "communication_event_envelopes_typed_shape_valid": {
+          "name": "communication_event_envelopes_typed_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and ((\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)) and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+        },
+        "communication_event_envelopes_field_ownership_valid": {
+          "name": "communication_event_envelopes_field_ownership_valid",
+          "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
+        },
+        "communication_event_envelopes_reference_shape_valid": {
+          "name": "communication_event_envelopes_reference_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null)"
+        },
+        "communication_event_envelopes_media_checksum_valid": {
+          "name": "communication_event_envelopes_media_checksum_valid",
+          "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_handoffs": {
+      "name": "communication_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "assigned_participant_id": {
+          "name": "assigned_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "accepted_at": {
+          "name": "accepted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_handoffs_state_idx": {
+          "name": "communication_handoffs_state_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_handoffs_conversation_channel_fk": {
+          "name": "communication_handoffs_conversation_channel_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_handoffs_assignee_conversation_fk": {
+          "name": "communication_handoffs_assignee_conversation_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "assigned_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_handoffs_public_chat_scope": {
+          "name": "communication_handoffs_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_handoffs_communications_scope": {
+          "name": "communication_handoffs_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_handoffs_channel_valid": {
+          "name": "communication_handoffs_channel_valid",
+          "value": "\"communication_handoffs\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_handoffs_state_valid": {
+          "name": "communication_handoffs_state_valid",
+          "value": "\"communication_handoffs\".\"state\" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')"
+        },
+        "communication_handoffs_reason_valid": {
+          "name": "communication_handoffs_reason_valid",
+          "value": "\"communication_handoffs\".\"reason_code\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_message_templates": {
+      "name": "communication_message_templates",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_source": {
+          "name": "definition_source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_version": {
+          "name": "definition_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "variable_keys": {
+          "name": "variable_keys",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "internally_approved": {
+          "name": "internally_approved",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "approval_receipt_id": {
+          "name": "approval_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_issued_at": {
+          "name": "approval_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_valid_until": {
+          "name": "approval_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_reference": {
+          "name": "external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "projection_version": {
+          "name": "projection_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_id": {
+          "name": "provider_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_correlation_id": {
+          "name": "provider_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_issued_at": {
+          "name": "provider_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_valid_until": {
+          "name": "provider_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "category": {
+          "name": "category",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "observed_at": {
+          "name": "observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_message_templates_projection_idx": {
+          "name": "communication_message_templates_projection_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "observed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_message_templates_definition_unique": {
+          "name": "communication_message_templates_definition_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "template_key",
+            "locale",
+            "definition_version"
+          ]
+        }
+      },
+      "policies": {
+        "communication_message_templates_communications_scope": {
+          "name": "communication_message_templates_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_message_templates_locale_valid": {
+          "name": "communication_message_templates_locale_valid",
+          "value": "\"communication_message_templates\".\"locale\" in ('es', 'en')"
+        },
+        "communication_message_templates_purpose_valid": {
+          "name": "communication_message_templates_purpose_valid",
+          "value": "\"communication_message_templates\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_message_templates_source_valid": {
+          "name": "communication_message_templates_source_valid",
+          "value": "\"communication_message_templates\".\"definition_source\" in ('synthetic_test_fixture', 'approved_policy')"
+        },
+        "communication_message_templates_state_valid": {
+          "name": "communication_message_templates_state_valid",
+          "value": "\"communication_message_templates\".\"state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')"
+        },
+        "communication_message_templates_variables_valid": {
+          "name": "communication_message_templates_variables_valid",
+          "value": "jsonb_typeof(\"communication_message_templates\".\"variable_keys\") = 'array'"
+        },
+        "communication_message_templates_definition_version_positive": {
+          "name": "communication_message_templates_definition_version_positive",
+          "value": "\"communication_message_templates\".\"definition_version\" > 0"
+        },
+        "communication_message_templates_projection_version_positive": {
+          "name": "communication_message_templates_projection_version_positive",
+          "value": "\"communication_message_templates\".\"projection_version\" is null or \"communication_message_templates\".\"projection_version\" > 0"
+        },
+        "communication_message_templates_approval_valid": {
+          "name": "communication_message_templates_approval_valid",
+          "value": "(\"communication_message_templates\".\"internally_approved\" = false and \"communication_message_templates\".\"approval_receipt_id\" is null and \"communication_message_templates\".\"approval_receipt_issued_at\" is null and \"communication_message_templates\".\"approval_receipt_valid_until\" is null) or (\"communication_message_templates\".\"internally_approved\" = true and \"communication_message_templates\".\"approval_receipt_id\" is not null and \"communication_message_templates\".\"approval_receipt_issued_at\" is not null and \"communication_message_templates\".\"approval_receipt_valid_until\" > \"communication_message_templates\".\"approval_receipt_issued_at\")"
+        },
+        "communication_message_templates_provider_receipt_valid": {
+          "name": "communication_message_templates_provider_receipt_valid",
+          "value": "(\"communication_message_templates\".\"provider_receipt_id\" is null and \"communication_message_templates\".\"provider_correlation_id\" is null and \"communication_message_templates\".\"provider_receipt_issued_at\" is null and \"communication_message_templates\".\"provider_receipt_valid_until\" is null) or (\"communication_message_templates\".\"provider_receipt_id\" is not null and \"communication_message_templates\".\"provider_correlation_id\" is not null and \"communication_message_templates\".\"provider_receipt_issued_at\" is not null and \"communication_message_templates\".\"provider_receipt_valid_until\" > \"communication_message_templates\".\"provider_receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_messages": {
+      "name": "communication_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "direction": {
+          "name": "direction",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sender_participant_id": {
+          "name": "sender_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "recipient_participant_id": {
+          "name": "recipient_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_messages_conversation_idx": {
+          "name": "communication_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "ordinal",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "communication_messages_external_reference_idx": {
+          "name": "communication_messages_external_reference_idx",
+          "columns": [
+            {
+              "expression": "external_message_reference",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_messages_conversation_channel_fk": {
+          "name": "communication_messages_conversation_channel_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_messages_sender_conversation_fk": {
+          "name": "communication_messages_sender_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "sender_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_messages_recipient_conversation_fk": {
+          "name": "communication_messages_recipient_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "recipient_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_messages_id_conversation_unique": {
+          "name": "communication_messages_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_messages_conversation_ordinal_unique": {
+          "name": "communication_messages_conversation_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ]
+        }
+      },
+      "policies": {
+        "communication_messages_public_chat_scope": {
+          "name": "communication_messages_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_messages_communications_scope": {
+          "name": "communication_messages_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_messages_channel_valid": {
+          "name": "communication_messages_channel_valid",
+          "value": "\"communication_messages\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_messages_ordinal_positive": {
+          "name": "communication_messages_ordinal_positive",
+          "value": "\"communication_messages\".\"ordinal\" > 0"
+        },
+        "communication_messages_direction_valid": {
+          "name": "communication_messages_direction_valid",
+          "value": "\"communication_messages\".\"direction\" in ('inbound', 'outbound', 'system')"
+        },
+        "communication_messages_locale_valid": {
+          "name": "communication_messages_locale_valid",
+          "value": "\"communication_messages\".\"locale\" in ('es', 'en')"
+        },
+        "communication_messages_kind_valid": {
+          "name": "communication_messages_kind_valid",
+          "value": "\"communication_messages\".\"kind\" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')"
+        },
+        "communication_messages_state_valid": {
+          "name": "communication_messages_state_valid",
+          "value": "\"communication_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "communication_messages_body_retention_valid": {
+          "name": "communication_messages_body_retention_valid",
+          "value": "(\"communication_messages\".\"body_retention_policy\" = 'metadata_only' and \"communication_messages\".\"body_stored\" = false and \"communication_messages\".\"body\" is null) or (\"communication_messages\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_messages\".\"body_stored\" = true and \"communication_messages\".\"body\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_outbound_commands": {
+      "name": "communication_outbound_commands",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_definition_version": {
+          "name": "template_definition_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "destination_key": {
+          "name": "destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_id": {
+          "name": "owning_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_issued_at": {
+          "name": "owning_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_valid_until": {
+          "name": "owning_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_correlation_id": {
+          "name": "owning_receipt_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fingerprint": {
+          "name": "fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scheduled_at": {
+          "name": "scheduled_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_outbound_commands_work_idx": {
+          "name": "communication_outbound_commands_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "scheduled_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_outbound_commands_conversation_channel_fk": {
+          "name": "communication_outbound_commands_conversation_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_outbound_commands_binding_connection_channel_fk": {
+          "name": "communication_outbound_commands_binding_connection_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_outbound_commands_id_connection_unique": {
+          "name": "communication_outbound_commands_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_outbound_commands_binding_key_unique": {
+          "name": "communication_outbound_commands_binding_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "communication_outbound_commands_communications_scope": {
+          "name": "communication_outbound_commands_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_outbound_commands_channel_valid": {
+          "name": "communication_outbound_commands_channel_valid",
+          "value": "\"communication_outbound_commands\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_outbound_commands_fingerprint_valid": {
+          "name": "communication_outbound_commands_fingerprint_valid",
+          "value": "\"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_token_hash_valid": {
+          "name": "communication_outbound_commands_lease_token_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_locale_valid": {
+          "name": "communication_outbound_commands_locale_valid",
+          "value": "\"communication_outbound_commands\".\"locale\" in ('es', 'en')"
+        },
+        "communication_outbound_commands_purpose_valid": {
+          "name": "communication_outbound_commands_purpose_valid",
+          "value": "\"communication_outbound_commands\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_outbound_commands_state_valid": {
+          "name": "communication_outbound_commands_state_valid",
+          "value": "\"communication_outbound_commands\".\"state\" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_outbound_commands_policy_version_positive": {
+          "name": "communication_outbound_commands_policy_version_positive",
+          "value": "\"communication_outbound_commands\".\"expected_policy_version\" > 0"
+        },
+        "communication_outbound_commands_version_positive": {
+          "name": "communication_outbound_commands_version_positive",
+          "value": "\"communication_outbound_commands\".\"version\" > 0"
+        },
+        "communication_outbound_commands_owning_receipt_window_valid": {
+          "name": "communication_outbound_commands_owning_receipt_window_valid",
+          "value": "\"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\""
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or (char_length(\"communication_outbound_commands\".\"destination_key\") <= 120 and \"communication_outbound_commands\".\"destination_key\" ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')"
+        },
+        "communication_outbound_commands_lease_valid": {
+          "name": "communication_outbound_commands_lease_valid",
+          "value": "(\"communication_outbound_commands\".\"lease_owner_id\" is null and \"communication_outbound_commands\".\"lease_token_hash\" is null and \"communication_outbound_commands\".\"lease_expires_at\" is null) or (\"communication_outbound_commands\".\"lease_owner_id\" is not null and \"communication_outbound_commands\".\"lease_token_hash\" is not null and \"communication_outbound_commands\".\"lease_expires_at\" is not null)"
+        },
+        "communication_outbound_commands_expiry_valid": {
+          "name": "communication_outbound_commands_expiry_valid",
+          "value": "\"communication_outbound_commands\".\"expires_at\" is null or \"communication_outbound_commands\".\"expires_at\" > \"communication_outbound_commands\".\"created_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_participants": {
+      "name": "communication_participants",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_binding_id": {
+          "name": "channel_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "joined_at": {
+          "name": "joined_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "left_at": {
+          "name": "left_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_participants_conversation_idx": {
+          "name": "communication_participants_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "joined_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_participants_conversation_channel_fk": {
+          "name": "communication_participants_conversation_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_participants_binding_channel_fk": {
+          "name": "communication_participants_binding_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "channel_binding_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_participants_id_conversation_unique": {
+          "name": "communication_participants_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_participants_id_conversation_channel_unique": {
+          "name": "communication_participants_id_conversation_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ]
+        }
+      },
+      "policies": {
+        "communication_participants_public_chat_scope": {
+          "name": "communication_participants_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_participants_communications_scope": {
+          "name": "communication_participants_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_participants_channel_valid": {
+          "name": "communication_participants_channel_valid",
+          "value": "\"communication_participants\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_participants_kind_valid": {
+          "name": "communication_participants_kind_valid",
+          "value": "\"communication_participants\".\"kind\" in ('external', 'automated', 'human', 'system')"
+        },
+        "communication_participants_membership_window_valid": {
+          "name": "communication_participants_membership_window_valid",
+          "value": "\"communication_participants\".\"left_at\" is null or \"communication_participants\".\"left_at\" >= \"communication_participants\".\"joined_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_event_receipts": {
+      "name": "communication_provider_event_receipts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "external_event_reference": {
+          "name": "external_event_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body_digest": {
+          "name": "body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "signature_verified": {
+          "name": "signature_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome_reason": {
+          "name": "outcome_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "processing_version": {
+          "name": "processing_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "received_at": {
+          "name": "received_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "persisted_at": {
+          "name": "persisted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "processed_at": {
+          "name": "processed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_provider_event_receipts_work_idx": {
+          "name": "communication_provider_event_receipts_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "received_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_provider_event_receipts_connection_channel_fk": {
+          "name": "communication_provider_event_receipts_connection_channel_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_provider_event_receipts_id_connection_unique": {
+          "name": "communication_provider_event_receipts_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_provider_event_receipts_identity_unique": {
+          "name": "communication_provider_event_receipts_identity_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_event_reference"
+          ]
+        }
+      },
+      "policies": {
+        "communication_provider_event_receipts_communications_scope": {
+          "name": "communication_provider_event_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_event_receipts_kind_valid": {
+          "name": "communication_provider_event_receipts_kind_valid",
+          "value": "\"communication_provider_event_receipts\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_provider_event_receipts_state_valid": {
+          "name": "communication_provider_event_receipts_state_valid",
+          "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
+        },
+        "communication_provider_event_receipts_signature_valid": {
+          "name": "communication_provider_event_receipts_signature_valid",
+          "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
+        },
+        "communication_provider_event_receipts_channel_valid": {
+          "name": "communication_provider_event_receipts_channel_valid",
+          "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_provider_event_receipts_body_digest_valid": {
+          "name": "communication_provider_event_receipts_body_digest_valid",
+          "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_lease_token_hash_valid": {
+          "name": "communication_provider_event_receipts_lease_token_hash_valid",
+          "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_version_positive": {
+          "name": "communication_provider_event_receipts_version_positive",
+          "value": "\"communication_provider_event_receipts\".\"processing_version\" > 0"
+        },
+        "communication_provider_event_receipts_lease_valid": {
+          "name": "communication_provider_event_receipts_lease_valid",
+          "value": "(\"communication_provider_event_receipts\".\"lease_owner_id\" is null and \"communication_provider_event_receipts\".\"lease_token_hash\" is null and \"communication_provider_event_receipts\".\"lease_expires_at\" is null) or (\"communication_provider_event_receipts\".\"lease_owner_id\" is not null and \"communication_provider_event_receipts\".\"lease_token_hash\" is not null and \"communication_provider_event_receipts\".\"lease_expires_at\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_audit_events": {
+      "name": "public_chat_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_audit_events",
+          "tableTo": "public_chat_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_audit_sequence_unique": {
+          "name": "public_chat_audit_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_audit_events_server_gateway_only": {
+          "name": "public_chat_audit_events_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_audit_locale_valid": {
+          "name": "public_chat_audit_locale_valid",
+          "value": "\"public_chat_audit_events\".\"locale\" in ('es', 'en')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_citations": {
+      "name": "public_chat_citations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_id": {
+          "name": "source_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "path": {
+          "name": "path",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "summary": {
+          "name": "summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "disclosure": {
+          "name": "disclosure",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_kind": {
+          "name": "source_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_citations_message_id_public_chat_messages_id_fk": {
+          "name": "public_chat_citations_message_id_public_chat_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "tableTo": "public_chat_messages",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "message_id",
+            "source_id"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_citations_server_gateway_only": {
+          "name": "public_chat_citations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_citations_locale_valid": {
+          "name": "public_chat_citations_locale_valid",
+          "value": "\"public_chat_citations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_citations_source_kind_valid": {
+          "name": "public_chat_citations_source_kind_valid",
+          "value": "\"public_chat_citations\".\"source_kind\" is null or \"public_chat_citations\".\"source_kind\" = 'provider'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversation_sessions": {
+      "name": "public_chat_conversation_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'public_web'"
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversation_sessions_session_idx": {
+          "name": "public_chat_conversation_sessions_session_idx",
+          "columns": [
+            {
+              "expression": "session_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "public_chat_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_participant_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_participant_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversation_sessions_conversation_unique": {
+          "name": "public_chat_conversation_sessions_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id"
+          ]
+        },
+        "public_chat_conversation_sessions_session_start_key_unique": {
+          "name": "public_chat_conversation_sessions_session_start_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_conversation_sessions_public_chat_scope": {
+          "name": "public_chat_conversation_sessions_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')",
+          "withCheck": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversation_sessions_start_fingerprint_valid": {
+          "name": "public_chat_conversation_sessions_start_fingerprint_valid",
+          "value": "\"public_chat_conversation_sessions\".\"start_fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "public_chat_conversation_sessions_channel_valid": {
+          "name": "public_chat_conversation_sessions_channel_valid",
+          "value": "\"public_chat_conversation_sessions\".\"channel_kind\" = 'public_web'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversations": {
+      "name": "public_chat_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_receipt_id": {
+          "name": "handoff_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_reason": {
+          "name": "handoff_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversations_expiry_idx": {
+          "name": "public_chat_conversations_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "public_chat_conversations_reconciliation_idx": {
+          "name": "public_chat_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversations_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversations_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversations",
+          "tableTo": "public_chat_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversations_session_start_key_unique": {
+          "name": "public_chat_conversations_session_start_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_conversations_server_gateway_only": {
+          "name": "public_chat_conversations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversations_version_positive": {
+          "name": "public_chat_conversations_version_positive",
+          "value": "\"public_chat_conversations\".\"version\" > 0"
+        },
+        "public_chat_conversations_locale_valid": {
+          "name": "public_chat_conversations_locale_valid",
+          "value": "\"public_chat_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_conversations_status_valid": {
+          "name": "public_chat_conversations_status_valid",
+          "value": "\"public_chat_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "public_chat_conversations_expiry_valid": {
+          "name": "public_chat_conversations_expiry_valid",
+          "value": "\"public_chat_conversations\".\"expires_at\" > \"public_chat_conversations\".\"created_at\""
+        },
+        "public_chat_conversations_handoff_reason_valid": {
+          "name": "public_chat_conversations_handoff_reason_valid",
+          "value": "\"public_chat_conversations\".\"handoff_reason\" is null or \"public_chat_conversations\".\"handoff_reason\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable')"
+        },
+        "public_chat_conversations_handoff_state_valid": {
+          "name": "public_chat_conversations_handoff_state_valid",
+          "value": "(\"public_chat_conversations\".\"status\" in ('human_requested', 'waiting_for_human') and \"public_chat_conversations\".\"handoff_reason\" is not null) or (\"public_chat_conversations\".\"status\" not in ('human_requested', 'waiting_for_human'))"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_handoffs": {
+      "name": "public_chat_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_handoffs_status_idx": {
+          "name": "public_chat_handoffs_status_idx",
+          "columns": [
+            {
+              "expression": "status",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_handoffs",
+          "tableTo": "public_chat_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_handoffs_server_gateway_only": {
+          "name": "public_chat_handoffs_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_handoffs_status_valid": {
+          "name": "public_chat_handoffs_status_valid",
+          "value": "\"public_chat_handoffs\".\"status\" in ('human_requested', 'waiting_for_human')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_idempotency": {
+      "name": "public_chat_idempotency",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_kind": {
+          "name": "command_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_fingerprint": {
+          "name": "command_fingerprint",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_version": {
+          "name": "expected_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result": {
+          "name": "result",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_idempotency_lease_idx": {
+          "name": "public_chat_idempotency_lease_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "tableTo": "public_chat_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_idempotency_server_gateway_only": {
+          "name": "public_chat_idempotency_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_idempotency_state_valid": {
+          "name": "public_chat_idempotency_state_valid",
+          "value": "\"public_chat_idempotency\".\"state\" in ('in_progress', 'completed')"
+        },
+        "public_chat_idempotency_command_kind_valid": {
+          "name": "public_chat_idempotency_command_kind_valid",
+          "value": "\"public_chat_idempotency\".\"command_kind\" in ('message', 'handoff', 'locale', 'close')"
+        },
+        "public_chat_idempotency_completion_valid": {
+          "name": "public_chat_idempotency_completion_valid",
+          "value": "(\"public_chat_idempotency\".\"state\" = 'completed' and \"public_chat_idempotency\".\"result\" is not null and \"public_chat_idempotency\".\"completed_at\" is not null) or (\"public_chat_idempotency\".\"state\" = 'in_progress' and \"public_chat_idempotency\".\"completed_at\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_messages": {
+      "name": "public_chat_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "actor": {
+          "name": "actor",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_messages_conversation_idx": {
+          "name": "public_chat_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_messages_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_messages_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_messages",
+          "tableTo": "public_chat_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_messages_conversation_ordinal_unique": {
+          "name": "public_chat_messages_conversation_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_messages_server_gateway_only": {
+          "name": "public_chat_messages_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_messages_actor_valid": {
+          "name": "public_chat_messages_actor_valid",
+          "value": "\"public_chat_messages\".\"actor\" in ('visitor', 'assistant', 'human', 'system')"
+        },
+        "public_chat_messages_state_valid": {
+          "name": "public_chat_messages_state_valid",
+          "value": "\"public_chat_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "public_chat_messages_body_retention_valid": {
+          "name": "public_chat_messages_body_retention_valid",
+          "value": "(\"public_chat_messages\".\"body_stored\" = true and \"public_chat_messages\".\"body\" is not null) or (\"public_chat_messages\".\"body_stored\" = false and \"public_chat_messages\".\"body\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_rate_limits": {
+      "name": "public_chat_rate_limits",
+      "schema": "",
+      "columns": {
+        "bucket_hash": {
+          "name": "bucket_hash",
+          "type": "char(64)",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "count": {
+          "name": "count",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "window_started_at": {
+          "name": "window_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_rate_limits_expiry_idx": {
+          "name": "public_chat_rate_limits_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_rate_limits_server_gateway_only": {
+          "name": "public_chat_rate_limits_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_rate_limits_count_positive": {
+          "name": "public_chat_rate_limits_count_positive",
+          "value": "\"public_chat_rate_limits\".\"count\" > 0"
+        },
+        "public_chat_rate_limits_window_valid": {
+          "name": "public_chat_rate_limits_window_valid",
+          "value": "\"public_chat_rate_limits\".\"expires_at\" > \"public_chat_rate_limits\".\"window_started_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_sessions": {
+      "name": "public_chat_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_hash": {
+          "name": "session_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "csrf_hash": {
+          "name": "csrf_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revoked_at": {
+          "name": "revoked_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_sessions_expiry_idx": {
+          "name": "public_chat_sessions_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_hash"
+          ]
+        }
+      },
+      "policies": {
+        "public_chat_sessions_server_gateway_only": {
+          "name": "public_chat_sessions_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {},
+      "isRLSEnabled": true
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json
new file mode 100644
index 0000000..6cfaa8d
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json
@@ -0,0 +1,4465 @@
+{
+  "id": "cd54789b-00b1-43b5-8fb1-c5f85969ec0f",
+  "prevId": "9fd63f9f-d3bc-43f9-a56b-f985527cbca3",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.communication_audit_events": {
+      "name": "communication_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_type": {
+          "name": "aggregate_type",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_id": {
+          "name": "aggregate_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_audit_events_aggregate_idx": {
+          "name": "communication_audit_events_aggregate_idx",
+          "columns": [
+            {
+              "expression": "aggregate_type",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "aggregate_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_audit_events_conversation_channel_fk": {
+          "name": "communication_audit_events_conversation_channel_fk",
+          "tableFrom": "communication_audit_events",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_audit_events_conversation_sequence_unique": {
+          "name": "communication_audit_events_conversation_sequence_unique",
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_audit_events_public_chat_scope": {
+          "name": "communication_audit_events_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_audit_events_communications_scope": {
+          "name": "communication_audit_events_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_audit_events_channel_valid": {
+          "name": "communication_audit_events_channel_valid",
+          "value": "\"communication_audit_events\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_audit_events_sequence_positive": {
+          "name": "communication_audit_events_sequence_positive",
+          "value": "\"communication_audit_events\".\"sequence\" > 0"
+        },
+        "communication_audit_events_locale_valid": {
+          "name": "communication_audit_events_locale_valid",
+          "value": "\"communication_audit_events\".\"locale\" is null or \"communication_audit_events\".\"locale\" in ('es', 'en')"
+        },
+        "communication_audit_events_purpose_valid": {
+          "name": "communication_audit_events_purpose_valid",
+          "value": "\"communication_audit_events\".\"purpose\" is null or \"communication_audit_events\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_audit_events_aggregate_valid": {
+          "name": "communication_audit_events_aggregate_valid",
+          "value": "\"communication_audit_events\".\"aggregate_type\" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')"
+        },
+        "communication_audit_events_result_valid": {
+          "name": "communication_audit_events_result_valid",
+          "value": "\"communication_audit_events\".\"result_code\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')"
+        },
+        "communication_audit_events_version_positive": {
+          "name": "communication_audit_events_version_positive",
+          "value": "\"communication_audit_events\".\"version\" > 0"
+        },
+        "communication_audit_events_policy_version_positive": {
+          "name": "communication_audit_events_policy_version_positive",
+          "value": "\"communication_audit_events\".\"policy_version\" is null or \"communication_audit_events\".\"policy_version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_channel_connections": {
+      "name": "communication_channel_connections",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "adapter_key": {
+          "name": "adapter_key",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "readiness_state": {
+          "name": "readiness_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "configured_at": {
+          "name": "configured_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verified_at": {
+          "name": "verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_channel_connections_readiness_idx": {
+          "name": "communication_channel_connections_readiness_idx",
+          "columns": [
+            {
+              "expression": "readiness_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_channel_connections_id_channel_unique": {
+          "name": "communication_channel_connections_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_channel_connections_communications_scope": {
+          "name": "communication_channel_connections_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_channel_connections_channel_valid": {
+          "name": "communication_channel_connections_channel_valid",
+          "value": "\"communication_channel_connections\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_channel_connections_adapter_valid": {
+          "name": "communication_channel_connections_adapter_valid",
+          "value": "\"communication_channel_connections\".\"adapter_key\" = 'meta_cloud'"
+        },
+        "communication_channel_connections_readiness_valid": {
+          "name": "communication_channel_connections_readiness_valid",
+          "value": "\"communication_channel_connections\".\"readiness_state\" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')"
+        },
+        "communication_channel_connections_version_positive": {
+          "name": "communication_channel_connections_version_positive",
+          "value": "\"communication_channel_connections\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_bindings": {
+      "name": "communication_contact_bindings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest": {
+          "name": "endpoint_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest_key_version": {
+          "name": "endpoint_digest_key_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "trust_state": {
+          "name": "trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "contact_policy_version": {
+          "name": "contact_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "verification_receipt_id": {
+          "name": "verification_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_verified_at": {
+          "name": "endpoint_verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verification_expires_at": {
+          "name": "verification_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "wrong_person_reported_at": {
+          "name": "wrong_person_reported_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reassignment_risk_at": {
+          "name": "reassignment_risk_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_bindings_trust_idx": {
+          "name": "communication_contact_bindings_trust_idx",
+          "columns": [
+            {
+              "expression": "trust_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_bindings_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_contact_bindings_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_contact_bindings",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_contact_bindings_connection_channel_fk": {
+          "name": "communication_contact_bindings_connection_channel_fk",
+          "tableFrom": "communication_contact_bindings",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_bindings_id_connection_channel_unique": {
+          "name": "communication_contact_bindings_id_connection_channel_unique",
+          "columns": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_bindings_id_channel_unique": {
+          "name": "communication_contact_bindings_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_bindings_endpoint_unique": {
+          "name": "communication_contact_bindings_endpoint_unique",
+          "columns": [
+            "connection_id",
+            "endpoint_digest_key_version",
+            "endpoint_digest"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_bindings_communications_scope": {
+          "name": "communication_contact_bindings_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_bindings_channel_valid": {
+          "name": "communication_contact_bindings_channel_valid",
+          "value": "\"communication_contact_bindings\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_contact_bindings_trust_valid": {
+          "name": "communication_contact_bindings_trust_valid",
+          "value": "\"communication_contact_bindings\".\"trust_state\" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')"
+        },
+        "communication_contact_bindings_locale_valid": {
+          "name": "communication_contact_bindings_locale_valid",
+          "value": "\"communication_contact_bindings\".\"locale\" in ('es', 'en')"
+        },
+        "communication_contact_bindings_endpoint_digest_valid": {
+          "name": "communication_contact_bindings_endpoint_digest_valid",
+          "value": "\"communication_contact_bindings\".\"endpoint_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_contact_bindings_policy_version_positive": {
+          "name": "communication_contact_bindings_policy_version_positive",
+          "value": "\"communication_contact_bindings\".\"contact_policy_version\" > 0"
+        },
+        "communication_contact_bindings_version_positive": {
+          "name": "communication_contact_bindings_version_positive",
+          "value": "\"communication_contact_bindings\".\"version\" > 0"
+        },
+        "communication_contact_bindings_verification_window_valid": {
+          "name": "communication_contact_bindings_verification_window_valid",
+          "value": "\"communication_contact_bindings\".\"verification_expires_at\" is null or (\"communication_contact_bindings\".\"endpoint_verified_at\" is not null and \"communication_contact_bindings\".\"verification_expires_at\" > \"communication_contact_bindings\".\"endpoint_verified_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_evidence_events": {
+      "name": "communication_contact_evidence_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_trust_state": {
+          "name": "binding_trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "review_resolution": {
+          "name": "review_resolution",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_kind": {
+          "name": "receipt_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_role": {
+          "name": "authority_role",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_version": {
+          "name": "authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "triggering_event_id": {
+          "name": "triggering_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_issued_at": {
+          "name": "receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_valid_until": {
+          "name": "receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_evidence_events_binding_idx": {
+          "name": "communication_contact_evidence_events_binding_idx",
+          "columns": [
+            {
+              "expression": "binding_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "sequence",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_evidence_events_binding_sequence_unique": {
+          "name": "communication_contact_evidence_events_binding_sequence_unique",
+          "columns": [
+            "binding_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_evidence_events_receipt_unique": {
+          "name": "communication_contact_evidence_events_receipt_unique",
+          "columns": [
+            "evidence_receipt_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_evidence_events_communications_select": {
+          "name": "communication_contact_evidence_events_communications_select",
+          "as": "PERMISSIVE",
+          "for": "SELECT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true"
+        },
+        "communication_contact_evidence_events_communications_insert": {
+          "name": "communication_contact_evidence_events_communications_insert",
+          "as": "PERMISSIVE",
+          "for": "INSERT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_evidence_events_kind_valid": {
+          "name": "communication_contact_evidence_events_kind_valid",
+          "value": "\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')"
+        },
+        "communication_contact_evidence_events_authority_valid": {
+          "name": "communication_contact_evidence_events_authority_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
+        },
+        "communication_contact_evidence_events_sequence_positive": {
+          "name": "communication_contact_evidence_events_sequence_positive",
+          "value": "\"communication_contact_evidence_events\".\"sequence\" > 0"
+        },
+        "communication_contact_evidence_events_receipt_window_valid": {
+          "name": "communication_contact_evidence_events_receipt_window_valid",
+          "value": "(\"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"receipt_issued_at\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" > \"communication_contact_evidence_events\".\"receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_policies": {
+      "name": "communication_contact_policies",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "decision_code": {
+          "name": "decision_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "evaluated_at": {
+          "name": "evaluated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_policies_fence_idx": {
+          "name": "communication_contact_policies_fence_idx",
+          "columns": [
+            {
+              "expression": "fence_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_policies_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_policies_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_policies",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_policies_binding_purpose_unique": {
+          "name": "communication_contact_policies_binding_purpose_unique",
+          "columns": [
+            "binding_id",
+            "purpose"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_policies_communications_scope": {
+          "name": "communication_contact_policies_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_policies_purpose_valid": {
+          "name": "communication_contact_policies_purpose_valid",
+          "value": "\"communication_contact_policies\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_contact_policies_consent_valid": {
+          "name": "communication_contact_policies_consent_valid",
+          "value": "\"communication_contact_policies\".\"consent_state\" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')"
+        },
+        "communication_contact_policies_fence_valid": {
+          "name": "communication_contact_policies_fence_valid",
+          "value": "\"communication_contact_policies\".\"fence_state\" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')"
+        },
+        "communication_contact_policies_decision_valid": {
+          "name": "communication_contact_policies_decision_valid",
+          "value": "\"communication_contact_policies\".\"decision_code\" is null or \"communication_contact_policies\".\"decision_code\" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')"
+        },
+        "communication_contact_policies_version_positive": {
+          "name": "communication_contact_policies_version_positive",
+          "value": "\"communication_contact_policies\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_conversations": {
+      "name": "communication_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_conversations_activity_idx": {
+          "name": "communication_conversations_activity_idx",
+          "columns": [
+            {
+              "expression": "channel_kind",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "last_activity_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "communication_conversations_reconciliation_idx": {
+          "name": "communication_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_conversations_id_channel_unique": {
+          "name": "communication_conversations_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_conversations_public_chat_scope": {
+          "name": "communication_conversations_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_conversations_communications_scope": {
+          "name": "communication_conversations_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_conversations_channel_valid": {
+          "name": "communication_conversations_channel_valid",
+          "value": "\"communication_conversations\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_conversations_locale_valid": {
+          "name": "communication_conversations_locale_valid",
+          "value": "\"communication_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "communication_conversations_status_valid": {
+          "name": "communication_conversations_status_valid",
+          "value": "\"communication_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "communication_conversations_version_positive": {
+          "name": "communication_conversations_version_positive",
+          "value": "\"communication_conversations\".\"version\" > 0"
+        },
+        "communication_conversations_expiry_valid": {
+          "name": "communication_conversations_expiry_valid",
+          "value": "\"communication_conversations\".\"expires_at\" is null or \"communication_conversations\".\"expires_at\" > \"communication_conversations\".\"created_at\""
+        },
+        "communication_conversations_public_expiry_required": {
+          "name": "communication_conversations_public_expiry_required",
+          "value": "\"communication_conversations\".\"channel_kind\" <> 'public_web' or \"communication_conversations\".\"expires_at\" is not null"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_attempts": {
+      "name": "communication_dispatch_attempts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_ordinal": {
+          "name": "attempt_ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_idempotency": {
+          "name": "request_idempotency",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference_capability": {
+          "name": "stable_reference_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_lookup_capability": {
+          "name": "message_lookup_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status_reconciliation_capability": {
+          "name": "status_reconciliation_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "media_references_capability": {
+          "name": "media_references_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "template_projection_capability": {
+          "name": "template_projection_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "capability_observed_at": {
+          "name": "capability_observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_digest": {
+          "name": "request_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference": {
+          "name": "stable_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_capability_hash": {
+          "name": "provider_io_capability_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_started_at": {
+          "name": "provider_io_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_dispatch_attempts_recovery_idx": {
+          "name": "communication_dispatch_attempts_recovery_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "completed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_dispatch_attempts_command_connection_fk": {
+          "name": "communication_dispatch_attempts_command_connection_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "command_id",
+            "connection_id"
+          ],
+          "tableTo": "communication_outbound_commands",
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_dispatch_attempts_command_ordinal_unique": {
+          "name": "communication_dispatch_attempts_command_ordinal_unique",
+          "columns": [
+            "command_id",
+            "attempt_ordinal"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_dispatch_attempts_external_reference_unique": {
+          "name": "communication_dispatch_attempts_external_reference_unique",
+          "columns": [
+            "connection_id",
+            "external_message_reference"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_dispatch_attempts_communications_scope": {
+          "name": "communication_dispatch_attempts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_attempts_ordinal_positive": {
+          "name": "communication_dispatch_attempts_ordinal_positive",
+          "value": "\"communication_dispatch_attempts\".\"attempt_ordinal\" > 0"
+        },
+        "communication_dispatch_attempts_request_digest_valid": {
+          "name": "communication_dispatch_attempts_request_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"request_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_policy_version_positive": {
+          "name": "communication_dispatch_attempts_policy_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"expected_policy_version\" > 0"
+        },
+        "communication_dispatch_attempts_state_valid": {
+          "name": "communication_dispatch_attempts_state_valid",
+          "value": "\"communication_dispatch_attempts\".\"state\" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_dispatch_attempts_result_valid": {
+          "name": "communication_dispatch_attempts_result_valid",
+          "value": "\"communication_dispatch_attempts\".\"result_code\" is null or \"communication_dispatch_attempts\".\"result_code\" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')"
+        },
+        "communication_dispatch_attempts_completion_valid": {
+          "name": "communication_dispatch_attempts_completion_valid",
+          "value": "\"communication_dispatch_attempts\".\"completed_at\" is null or \"communication_dispatch_attempts\".\"completed_at\" >= \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_io_capability_valid": {
+          "name": "communication_dispatch_attempts_provider_io_capability_valid",
+          "value": "(\"communication_dispatch_attempts\".\"provider_io_capability_hash\" is null and \"communication_dispatch_attempts\".\"provider_io_started_at\" is null) or (\"communication_dispatch_attempts\".\"provider_io_capability_hash\" ~ '^[0-9a-f]{64}$' and \"communication_dispatch_attempts\".\"provider_io_started_at\" is not null and \"communication_dispatch_attempts\".\"provider_io_started_at\" >= \"communication_dispatch_attempts\".\"started_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_event_envelopes": {
+      "name": "communication_event_envelopes",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_text": {
+          "name": "canonical_text",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "delivery_state": {
+          "name": "delivery_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_kind": {
+          "name": "interactive_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_id": {
+          "name": "interactive_id",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_title": {
+          "name": "interactive_title",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_external_reference": {
+          "name": "media_external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_declared_kind": {
+          "name": "media_declared_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_mime_type": {
+          "name": "media_mime_type",
+          "type": "varchar(160)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_checksum": {
+          "name": "media_checksum",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_id": {
+          "name": "template_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_state": {
+          "name": "template_authority_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_version": {
+          "name": "template_authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_updated_at": {
+          "name": "template_authority_updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_reference": {
+          "name": "template_provider_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_locale": {
+          "name": "template_locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_category": {
+          "name": "template_category",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_state": {
+          "name": "template_provider_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_version": {
+          "name": "template_provider_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_timestamp": {
+          "name": "template_provider_timestamp",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_components": {
+          "name": "template_components",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "unsupported_reason": {
+          "name": "unsupported_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_event_envelopes_conversation_idx": {
+          "name": "communication_event_envelopes_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_event_envelopes_receipt_connection_fk": {
+          "name": "communication_event_envelopes_receipt_connection_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "receipt_id",
+            "connection_id"
+          ],
+          "tableTo": "communication_provider_event_receipts",
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_event_envelopes_conversation_channel_fk": {
+          "name": "communication_event_envelopes_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_participant_conversation_channel_fk": {
+          "name": "communication_event_envelopes_participant_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_message_conversation_fk": {
+          "name": "communication_event_envelopes_message_conversation_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "message_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_messages",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_binding_connection_channel_fk": {
+          "name": "communication_event_envelopes_binding_connection_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_event_envelopes_receipt_id_unique": {
+          "name": "communication_event_envelopes_receipt_id_unique",
+          "columns": [
+            "receipt_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_event_envelopes_communications_scope": {
+          "name": "communication_event_envelopes_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_event_envelopes_kind_valid": {
+          "name": "communication_event_envelopes_kind_valid",
+          "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_event_envelopes_channel_valid": {
+          "name": "communication_event_envelopes_channel_valid",
+          "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_event_envelopes_retention_valid": {
+          "name": "communication_event_envelopes_retention_valid",
+          "value": "(\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)"
+        },
+        "communication_event_envelopes_typed_shape_valid": {
+          "name": "communication_event_envelopes_typed_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and ((\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null) or (\"communication_event_envelopes\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_event_envelopes\".\"canonical_text\" is not null)) and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+        },
+        "communication_event_envelopes_field_ownership_valid": {
+          "name": "communication_event_envelopes_field_ownership_valid",
+          "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
+        },
+        "communication_event_envelopes_reference_shape_valid": {
+          "name": "communication_event_envelopes_reference_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null)"
+        },
+        "communication_event_envelopes_media_checksum_valid": {
+          "name": "communication_event_envelopes_media_checksum_valid",
+          "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_handoffs": {
+      "name": "communication_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "assigned_participant_id": {
+          "name": "assigned_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "accepted_at": {
+          "name": "accepted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_handoffs_state_idx": {
+          "name": "communication_handoffs_state_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_handoffs_conversation_channel_fk": {
+          "name": "communication_handoffs_conversation_channel_fk",
+          "tableFrom": "communication_handoffs",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_handoffs_assignee_conversation_fk": {
+          "name": "communication_handoffs_assignee_conversation_fk",
+          "tableFrom": "communication_handoffs",
+          "columnsFrom": [
+            "assigned_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "set null"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_handoffs_public_chat_scope": {
+          "name": "communication_handoffs_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_handoffs_communications_scope": {
+          "name": "communication_handoffs_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_handoffs_channel_valid": {
+          "name": "communication_handoffs_channel_valid",
+          "value": "\"communication_handoffs\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_handoffs_state_valid": {
+          "name": "communication_handoffs_state_valid",
+          "value": "\"communication_handoffs\".\"state\" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')"
+        },
+        "communication_handoffs_reason_valid": {
+          "name": "communication_handoffs_reason_valid",
+          "value": "\"communication_handoffs\".\"reason_code\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_message_templates": {
+      "name": "communication_message_templates",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_source": {
+          "name": "definition_source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_version": {
+          "name": "definition_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "variable_keys": {
+          "name": "variable_keys",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "internally_approved": {
+          "name": "internally_approved",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "approval_receipt_id": {
+          "name": "approval_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_issued_at": {
+          "name": "approval_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_valid_until": {
+          "name": "approval_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_reference": {
+          "name": "external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "projection_version": {
+          "name": "projection_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_id": {
+          "name": "provider_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_correlation_id": {
+          "name": "provider_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_issued_at": {
+          "name": "provider_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_valid_until": {
+          "name": "provider_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "category": {
+          "name": "category",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "observed_at": {
+          "name": "observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_message_templates_projection_idx": {
+          "name": "communication_message_templates_projection_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "observed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_message_templates_definition_unique": {
+          "name": "communication_message_templates_definition_unique",
+          "columns": [
+            "template_key",
+            "locale",
+            "definition_version"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_message_templates_communications_scope": {
+          "name": "communication_message_templates_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_message_templates_locale_valid": {
+          "name": "communication_message_templates_locale_valid",
+          "value": "\"communication_message_templates\".\"locale\" in ('es', 'en')"
+        },
+        "communication_message_templates_purpose_valid": {
+          "name": "communication_message_templates_purpose_valid",
+          "value": "\"communication_message_templates\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_message_templates_source_valid": {
+          "name": "communication_message_templates_source_valid",
+          "value": "\"communication_message_templates\".\"definition_source\" in ('synthetic_test_fixture', 'approved_policy')"
+        },
+        "communication_message_templates_state_valid": {
+          "name": "communication_message_templates_state_valid",
+          "value": "\"communication_message_templates\".\"state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')"
+        },
+        "communication_message_templates_variables_valid": {
+          "name": "communication_message_templates_variables_valid",
+          "value": "jsonb_typeof(\"communication_message_templates\".\"variable_keys\") = 'array'"
+        },
+        "communication_message_templates_definition_version_positive": {
+          "name": "communication_message_templates_definition_version_positive",
+          "value": "\"communication_message_templates\".\"definition_version\" > 0"
+        },
+        "communication_message_templates_projection_version_positive": {
+          "name": "communication_message_templates_projection_version_positive",
+          "value": "\"communication_message_templates\".\"projection_version\" is null or \"communication_message_templates\".\"projection_version\" > 0"
+        },
+        "communication_message_templates_approval_valid": {
+          "name": "communication_message_templates_approval_valid",
+          "value": "(\"communication_message_templates\".\"internally_approved\" = false and \"communication_message_templates\".\"approval_receipt_id\" is null and \"communication_message_templates\".\"approval_receipt_issued_at\" is null and \"communication_message_templates\".\"approval_receipt_valid_until\" is null) or (\"communication_message_templates\".\"internally_approved\" = true and \"communication_message_templates\".\"approval_receipt_id\" is not null and \"communication_message_templates\".\"approval_receipt_issued_at\" is not null and \"communication_message_templates\".\"approval_receipt_valid_until\" > \"communication_message_templates\".\"approval_receipt_issued_at\")"
+        },
+        "communication_message_templates_provider_receipt_valid": {
+          "name": "communication_message_templates_provider_receipt_valid",
+          "value": "(\"communication_message_templates\".\"provider_receipt_id\" is null and \"communication_message_templates\".\"provider_correlation_id\" is null and \"communication_message_templates\".\"provider_receipt_issued_at\" is null and \"communication_message_templates\".\"provider_receipt_valid_until\" is null) or (\"communication_message_templates\".\"provider_receipt_id\" is not null and \"communication_message_templates\".\"provider_correlation_id\" is not null and \"communication_message_templates\".\"provider_receipt_issued_at\" is not null and \"communication_message_templates\".\"provider_receipt_valid_until\" > \"communication_message_templates\".\"provider_receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_messages": {
+      "name": "communication_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "direction": {
+          "name": "direction",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sender_participant_id": {
+          "name": "sender_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "recipient_participant_id": {
+          "name": "recipient_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_messages_conversation_idx": {
+          "name": "communication_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "ordinal",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "communication_messages_external_reference_idx": {
+          "name": "communication_messages_external_reference_idx",
+          "columns": [
+            {
+              "expression": "external_message_reference",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_messages_conversation_channel_fk": {
+          "name": "communication_messages_conversation_channel_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_messages_sender_conversation_fk": {
+          "name": "communication_messages_sender_conversation_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "sender_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_messages_recipient_conversation_fk": {
+          "name": "communication_messages_recipient_conversation_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "recipient_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_messages_id_conversation_unique": {
+          "name": "communication_messages_id_conversation_unique",
+          "columns": [
+            "id",
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_messages_conversation_ordinal_unique": {
+          "name": "communication_messages_conversation_ordinal_unique",
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_messages_public_chat_scope": {
+          "name": "communication_messages_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_messages_communications_scope": {
+          "name": "communication_messages_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_messages_channel_valid": {
+          "name": "communication_messages_channel_valid",
+          "value": "\"communication_messages\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_messages_ordinal_positive": {
+          "name": "communication_messages_ordinal_positive",
+          "value": "\"communication_messages\".\"ordinal\" > 0"
+        },
+        "communication_messages_direction_valid": {
+          "name": "communication_messages_direction_valid",
+          "value": "\"communication_messages\".\"direction\" in ('inbound', 'outbound', 'system')"
+        },
+        "communication_messages_locale_valid": {
+          "name": "communication_messages_locale_valid",
+          "value": "\"communication_messages\".\"locale\" in ('es', 'en')"
+        },
+        "communication_messages_kind_valid": {
+          "name": "communication_messages_kind_valid",
+          "value": "\"communication_messages\".\"kind\" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')"
+        },
+        "communication_messages_state_valid": {
+          "name": "communication_messages_state_valid",
+          "value": "\"communication_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "communication_messages_body_retention_valid": {
+          "name": "communication_messages_body_retention_valid",
+          "value": "(\"communication_messages\".\"body_retention_policy\" = 'metadata_only' and \"communication_messages\".\"body_stored\" = false and \"communication_messages\".\"body\" is null) or (\"communication_messages\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_messages\".\"body_stored\" = true and \"communication_messages\".\"body\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_outbound_commands": {
+      "name": "communication_outbound_commands",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_definition_version": {
+          "name": "template_definition_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "destination_key": {
+          "name": "destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_id": {
+          "name": "owning_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_issued_at": {
+          "name": "owning_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_valid_until": {
+          "name": "owning_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_correlation_id": {
+          "name": "owning_receipt_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fingerprint": {
+          "name": "fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scheduled_at": {
+          "name": "scheduled_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_outbound_commands_work_idx": {
+          "name": "communication_outbound_commands_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "scheduled_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_outbound_commands_conversation_channel_fk": {
+          "name": "communication_outbound_commands_conversation_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_outbound_commands_binding_connection_channel_fk": {
+          "name": "communication_outbound_commands_binding_connection_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_outbound_commands_id_connection_unique": {
+          "name": "communication_outbound_commands_id_connection_unique",
+          "columns": [
+            "id",
+            "connection_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_outbound_commands_binding_key_unique": {
+          "name": "communication_outbound_commands_binding_key_unique",
+          "columns": [
+            "binding_id",
+            "idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_outbound_commands_communications_scope": {
+          "name": "communication_outbound_commands_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_outbound_commands_channel_valid": {
+          "name": "communication_outbound_commands_channel_valid",
+          "value": "\"communication_outbound_commands\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_outbound_commands_fingerprint_valid": {
+          "name": "communication_outbound_commands_fingerprint_valid",
+          "value": "\"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_token_hash_valid": {
+          "name": "communication_outbound_commands_lease_token_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_locale_valid": {
+          "name": "communication_outbound_commands_locale_valid",
+          "value": "\"communication_outbound_commands\".\"locale\" in ('es', 'en')"
+        },
+        "communication_outbound_commands_purpose_valid": {
+          "name": "communication_outbound_commands_purpose_valid",
+          "value": "\"communication_outbound_commands\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_outbound_commands_state_valid": {
+          "name": "communication_outbound_commands_state_valid",
+          "value": "\"communication_outbound_commands\".\"state\" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_outbound_commands_policy_version_positive": {
+          "name": "communication_outbound_commands_policy_version_positive",
+          "value": "\"communication_outbound_commands\".\"expected_policy_version\" > 0"
+        },
+        "communication_outbound_commands_version_positive": {
+          "name": "communication_outbound_commands_version_positive",
+          "value": "\"communication_outbound_commands\".\"version\" > 0"
+        },
+        "communication_outbound_commands_owning_receipt_window_valid": {
+          "name": "communication_outbound_commands_owning_receipt_window_valid",
+          "value": "\"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\""
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or (char_length(\"communication_outbound_commands\".\"destination_key\") <= 120 and \"communication_outbound_commands\".\"destination_key\" ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')"
+        },
+        "communication_outbound_commands_lease_valid": {
+          "name": "communication_outbound_commands_lease_valid",
+          "value": "(\"communication_outbound_commands\".\"lease_owner_id\" is null and \"communication_outbound_commands\".\"lease_token_hash\" is null and \"communication_outbound_commands\".\"lease_expires_at\" is null) or (\"communication_outbound_commands\".\"lease_owner_id\" is not null and \"communication_outbound_commands\".\"lease_token_hash\" is not null and \"communication_outbound_commands\".\"lease_expires_at\" is not null)"
+        },
+        "communication_outbound_commands_expiry_valid": {
+          "name": "communication_outbound_commands_expiry_valid",
+          "value": "\"communication_outbound_commands\".\"expires_at\" is null or \"communication_outbound_commands\".\"expires_at\" > \"communication_outbound_commands\".\"created_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_participants": {
+      "name": "communication_participants",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_binding_id": {
+          "name": "channel_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "joined_at": {
+          "name": "joined_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "left_at": {
+          "name": "left_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_participants_conversation_idx": {
+          "name": "communication_participants_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "joined_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_participants_conversation_channel_fk": {
+          "name": "communication_participants_conversation_channel_fk",
+          "tableFrom": "communication_participants",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_participants_binding_channel_fk": {
+          "name": "communication_participants_binding_channel_fk",
+          "tableFrom": "communication_participants",
+          "columnsFrom": [
+            "channel_binding_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_participants_id_conversation_unique": {
+          "name": "communication_participants_id_conversation_unique",
+          "columns": [
+            "id",
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_participants_id_conversation_channel_unique": {
+          "name": "communication_participants_id_conversation_channel_unique",
+          "columns": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_participants_public_chat_scope": {
+          "name": "communication_participants_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_participants_communications_scope": {
+          "name": "communication_participants_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_participants_channel_valid": {
+          "name": "communication_participants_channel_valid",
+          "value": "\"communication_participants\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_participants_kind_valid": {
+          "name": "communication_participants_kind_valid",
+          "value": "\"communication_participants\".\"kind\" in ('external', 'automated', 'human', 'system')"
+        },
+        "communication_participants_membership_window_valid": {
+          "name": "communication_participants_membership_window_valid",
+          "value": "\"communication_participants\".\"left_at\" is null or \"communication_participants\".\"left_at\" >= \"communication_participants\".\"joined_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_event_receipts": {
+      "name": "communication_provider_event_receipts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "external_event_reference": {
+          "name": "external_event_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body_digest": {
+          "name": "body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "signature_verified": {
+          "name": "signature_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome_reason": {
+          "name": "outcome_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "processing_version": {
+          "name": "processing_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "received_at": {
+          "name": "received_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "persisted_at": {
+          "name": "persisted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "processed_at": {
+          "name": "processed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_provider_event_receipts_work_idx": {
+          "name": "communication_provider_event_receipts_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "received_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_provider_event_receipts_connection_channel_fk": {
+          "name": "communication_provider_event_receipts_connection_channel_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_provider_event_receipts_id_connection_unique": {
+          "name": "communication_provider_event_receipts_id_connection_unique",
+          "columns": [
+            "id",
+            "connection_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_provider_event_receipts_identity_unique": {
+          "name": "communication_provider_event_receipts_identity_unique",
+          "columns": [
+            "connection_id",
+            "external_event_reference"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_provider_event_receipts_communications_scope": {
+          "name": "communication_provider_event_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_event_receipts_kind_valid": {
+          "name": "communication_provider_event_receipts_kind_valid",
+          "value": "\"communication_provider_event_receipts\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_provider_event_receipts_state_valid": {
+          "name": "communication_provider_event_receipts_state_valid",
+          "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
+        },
+        "communication_provider_event_receipts_signature_valid": {
+          "name": "communication_provider_event_receipts_signature_valid",
+          "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
+        },
+        "communication_provider_event_receipts_channel_valid": {
+          "name": "communication_provider_event_receipts_channel_valid",
+          "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_provider_event_receipts_body_digest_valid": {
+          "name": "communication_provider_event_receipts_body_digest_valid",
+          "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_lease_token_hash_valid": {
+          "name": "communication_provider_event_receipts_lease_token_hash_valid",
+          "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_version_positive": {
+          "name": "communication_provider_event_receipts_version_positive",
+          "value": "\"communication_provider_event_receipts\".\"processing_version\" > 0"
+        },
+        "communication_provider_event_receipts_lease_valid": {
+          "name": "communication_provider_event_receipts_lease_valid",
+          "value": "(\"communication_provider_event_receipts\".\"lease_owner_id\" is null and \"communication_provider_event_receipts\".\"lease_token_hash\" is null and \"communication_provider_event_receipts\".\"lease_expires_at\" is null) or (\"communication_provider_event_receipts\".\"lease_owner_id\" is not null and \"communication_provider_event_receipts\".\"lease_token_hash\" is not null and \"communication_provider_event_receipts\".\"lease_expires_at\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_audit_events": {
+      "name": "public_chat_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_audit_events",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_audit_sequence_unique": {
+          "name": "public_chat_audit_sequence_unique",
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_audit_events_server_gateway_only": {
+          "name": "public_chat_audit_events_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_audit_locale_valid": {
+          "name": "public_chat_audit_locale_valid",
+          "value": "\"public_chat_audit_events\".\"locale\" in ('es', 'en')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_citations": {
+      "name": "public_chat_citations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_id": {
+          "name": "source_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "path": {
+          "name": "path",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "summary": {
+          "name": "summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "disclosure": {
+          "name": "disclosure",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_kind": {
+          "name": "source_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_citations_message_id_public_chat_messages_id_fk": {
+          "name": "public_chat_citations_message_id_public_chat_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "tableTo": "public_chat_messages",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "columns": [
+            "message_id",
+            "source_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_citations_server_gateway_only": {
+          "name": "public_chat_citations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_citations_locale_valid": {
+          "name": "public_chat_citations_locale_valid",
+          "value": "\"public_chat_citations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_citations_source_kind_valid": {
+          "name": "public_chat_citations_source_kind_valid",
+          "value": "\"public_chat_citations\".\"source_kind\" is null or \"public_chat_citations\".\"source_kind\" = 'provider'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversation_sessions": {
+      "name": "public_chat_conversation_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'public_web'"
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversation_sessions_session_idx": {
+          "name": "public_chat_conversation_sessions_session_idx",
+          "columns": [
+            {
+              "expression": "session_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "tableTo": "public_chat_sessions",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "public_chat_conversation_sessions_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "public_chat_conversation_sessions_participant_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_participant_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversation_sessions_conversation_unique": {
+          "name": "public_chat_conversation_sessions_conversation_unique",
+          "columns": [
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "public_chat_conversation_sessions_session_start_key_unique": {
+          "name": "public_chat_conversation_sessions_session_start_key_unique",
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_conversation_sessions_public_chat_scope": {
+          "name": "public_chat_conversation_sessions_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')",
+          "withCheck": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversation_sessions_start_fingerprint_valid": {
+          "name": "public_chat_conversation_sessions_start_fingerprint_valid",
+          "value": "\"public_chat_conversation_sessions\".\"start_fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "public_chat_conversation_sessions_channel_valid": {
+          "name": "public_chat_conversation_sessions_channel_valid",
+          "value": "\"public_chat_conversation_sessions\".\"channel_kind\" = 'public_web'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversations": {
+      "name": "public_chat_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_receipt_id": {
+          "name": "handoff_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_reason": {
+          "name": "handoff_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversations_expiry_idx": {
+          "name": "public_chat_conversations_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "public_chat_conversations_reconciliation_idx": {
+          "name": "public_chat_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversations_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversations_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversations",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "tableTo": "public_chat_sessions",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversations_session_start_key_unique": {
+          "name": "public_chat_conversations_session_start_key_unique",
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_conversations_server_gateway_only": {
+          "name": "public_chat_conversations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversations_version_positive": {
+          "name": "public_chat_conversations_version_positive",
+          "value": "\"public_chat_conversations\".\"version\" > 0"
+        },
+        "public_chat_conversations_locale_valid": {
+          "name": "public_chat_conversations_locale_valid",
+          "value": "\"public_chat_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_conversations_status_valid": {
+          "name": "public_chat_conversations_status_valid",
+          "value": "\"public_chat_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "public_chat_conversations_expiry_valid": {
+          "name": "public_chat_conversations_expiry_valid",
+          "value": "\"public_chat_conversations\".\"expires_at\" > \"public_chat_conversations\".\"created_at\""
+        },
+        "public_chat_conversations_handoff_reason_valid": {
+          "name": "public_chat_conversations_handoff_reason_valid",
+          "value": "\"public_chat_conversations\".\"handoff_reason\" is null or \"public_chat_conversations\".\"handoff_reason\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable')"
+        },
+        "public_chat_conversations_handoff_state_valid": {
+          "name": "public_chat_conversations_handoff_state_valid",
+          "value": "(\"public_chat_conversations\".\"status\" in ('human_requested', 'waiting_for_human') and \"public_chat_conversations\".\"handoff_reason\" is not null) or (\"public_chat_conversations\".\"status\" not in ('human_requested', 'waiting_for_human'))"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_handoffs": {
+      "name": "public_chat_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_handoffs_status_idx": {
+          "name": "public_chat_handoffs_status_idx",
+          "columns": [
+            {
+              "expression": "status",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_handoffs",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_handoffs_server_gateway_only": {
+          "name": "public_chat_handoffs_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_handoffs_status_valid": {
+          "name": "public_chat_handoffs_status_valid",
+          "value": "\"public_chat_handoffs\".\"status\" in ('human_requested', 'waiting_for_human')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_idempotency": {
+      "name": "public_chat_idempotency",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_kind": {
+          "name": "command_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_fingerprint": {
+          "name": "command_fingerprint",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_version": {
+          "name": "expected_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result": {
+          "name": "result",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_idempotency_lease_idx": {
+          "name": "public_chat_idempotency_lease_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_idempotency_server_gateway_only": {
+          "name": "public_chat_idempotency_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_idempotency_state_valid": {
+          "name": "public_chat_idempotency_state_valid",
+          "value": "\"public_chat_idempotency\".\"state\" in ('in_progress', 'completed')"
+        },
+        "public_chat_idempotency_command_kind_valid": {
+          "name": "public_chat_idempotency_command_kind_valid",
+          "value": "\"public_chat_idempotency\".\"command_kind\" in ('message', 'handoff', 'locale', 'close')"
+        },
+        "public_chat_idempotency_completion_valid": {
+          "name": "public_chat_idempotency_completion_valid",
+          "value": "(\"public_chat_idempotency\".\"state\" = 'completed' and \"public_chat_idempotency\".\"result\" is not null and \"public_chat_idempotency\".\"completed_at\" is not null) or (\"public_chat_idempotency\".\"state\" = 'in_progress' and \"public_chat_idempotency\".\"completed_at\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_messages": {
+      "name": "public_chat_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "actor": {
+          "name": "actor",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_messages_conversation_idx": {
+          "name": "public_chat_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_messages_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_messages_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_messages",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_messages_conversation_ordinal_unique": {
+          "name": "public_chat_messages_conversation_ordinal_unique",
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_messages_server_gateway_only": {
+          "name": "public_chat_messages_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_messages_actor_valid": {
+          "name": "public_chat_messages_actor_valid",
+          "value": "\"public_chat_messages\".\"actor\" in ('visitor', 'assistant', 'human', 'system')"
+        },
+        "public_chat_messages_state_valid": {
+          "name": "public_chat_messages_state_valid",
+          "value": "\"public_chat_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "public_chat_messages_body_retention_valid": {
+          "name": "public_chat_messages_body_retention_valid",
+          "value": "(\"public_chat_messages\".\"body_stored\" = true and \"public_chat_messages\".\"body\" is not null) or (\"public_chat_messages\".\"body_stored\" = false and \"public_chat_messages\".\"body\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_rate_limits": {
+      "name": "public_chat_rate_limits",
+      "schema": "",
+      "columns": {
+        "bucket_hash": {
+          "name": "bucket_hash",
+          "type": "char(64)",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "count": {
+          "name": "count",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "window_started_at": {
+          "name": "window_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_rate_limits_expiry_idx": {
+          "name": "public_chat_rate_limits_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_rate_limits_server_gateway_only": {
+          "name": "public_chat_rate_limits_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_rate_limits_count_positive": {
+          "name": "public_chat_rate_limits_count_positive",
+          "value": "\"public_chat_rate_limits\".\"count\" > 0"
+        },
+        "public_chat_rate_limits_window_valid": {
+          "name": "public_chat_rate_limits_window_valid",
+          "value": "\"public_chat_rate_limits\".\"expires_at\" > \"public_chat_rate_limits\".\"window_started_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_sessions": {
+      "name": "public_chat_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_hash": {
+          "name": "session_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "csrf_hash": {
+          "name": "csrf_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revoked_at": {
+          "name": "revoked_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_sessions_expiry_idx": {
+          "name": "public_chat_sessions_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "columns": [
+            "session_hash"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_sessions_server_gateway_only": {
+          "name": "public_chat_sessions_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {},
+      "isRLSEnabled": true
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "views": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index 7eb0437..0176e8b 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -36,13 +36,34 @@
       "when": 1786636914096,
       "tag": "0004_lazy_gressill",
       "breakpoints": true
     },
     {
       "idx": 5,
       "version": "7",
       "when": 1786637266730,
       "tag": "0005_greedy_proudstar",
       "breakpoints": true
+    },
+    {
+      "idx": 6,
+      "version": "7",
+      "when": 1787247871684,
+      "tag": "0006_m004_communications_role_bootstrap",
+      "breakpoints": true
+    },
+    {
+      "idx": 7,
+      "version": "7",
+      "when": 1787248559021,
+      "tag": "0007_m004_communications_schema",
+      "breakpoints": true
+    },
+    {
+      "idx": 8,
+      "version": "7",
+      "when": 1787248565135,
+      "tag": "0008_m004_communications_backfill",
+      "breakpoints": true
     }
   ]
-}
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/package.json b/blueprints/project-atlas/workspace/package.json
index 9b382aa..378486d 100644
--- a/blueprints/project-atlas/workspace/package.json
+++ b/blueprints/project-atlas/workspace/package.json
@@ -6,20 +6,22 @@
     "node": "24.18.1"
   },
   "packageManager": "pnpm@11.18.0",
   "scripts": {
     "build": "turbo run build",
     "contract:imports": "tsx --tsconfig tsconfig.json tests/contract/module-resolution.ts",
     "db:generate": "drizzle-kit generate --config packages/database/drizzle.config.ts",
     "db:migrate": "drizzle-kit migrate --config packages/database/drizzle.config.ts",
     "db:chat:provision-local": "tsx --tsconfig tsconfig.json packages/database/scripts/provision-public-chat-runtime.ts",
     "db:chat:validate-runtime": "tsx --tsconfig tsconfig.json packages/database/scripts/validate-public-chat-runtime.ts",
+    "db:communications:provision-local": "tsx --tsconfig tsconfig.json packages/database/scripts/provision-communications-runtime.ts",
+    "db:communications:validate-runtime": "tsx --tsconfig tsconfig.json packages/database/scripts/validate-communications-runtime.ts",
     "db:seed": "tsx --tsconfig tsconfig.json packages/database/scripts/seed.ts",
     "dev": "turbo run dev --parallel",
     "format": "biome check --write .",
     "format:check": "biome check .",
     "lint": "biome lint .",
     "scaffold:validate": "corepack pnpm lint && corepack pnpm format:check && corepack pnpm typecheck && corepack pnpm test && corepack pnpm contract:imports",
     "test": "vitest run",
     "test:e2e": "playwright test",
     "test:e2e:www": "node tests/support/run-www-e2e.mjs",
     "test:e2e:m003": "node tests/support/run-m003-e2e.mjs",
diff --git a/blueprints/project-atlas/workspace/packages/database/package.json b/blueprints/project-atlas/workspace/packages/database/package.json
index 034cbc3..bab7e42 100644
--- a/blueprints/project-atlas/workspace/packages/database/package.json
+++ b/blueprints/project-atlas/workspace/packages/database/package.json
@@ -1,18 +1,20 @@
 {
   "name": "@atlas/database",
   "private": true,
   "type": "module",
   "exports": {
     ".": "./src/index.ts"
   },
   "scripts": {
     "build": "tsc -p tsconfig.json --noEmit",
+    "runtime:communications:provision-local": "tsx --tsconfig ../../tsconfig.json scripts/provision-communications-runtime.ts",
+    "runtime:communications:validate": "tsx --tsconfig ../../tsconfig.json scripts/validate-communications-runtime.ts",
     "typecheck": "tsc -p tsconfig.json --noEmit"
   },
   "dependencies": {
     "@atlas/domain": "workspace:*",
     "drizzle-orm": "0.45.2",
     "postgres": "3.4.9",
     "zod": "4.4.3"
   }
 }
diff --git a/blueprints/project-atlas/workspace/packages/database/scripts/provision-communications-runtime.ts b/blueprints/project-atlas/workspace/packages/database/scripts/provision-communications-runtime.ts
new file mode 100644
index 0000000..a29a3bc
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/scripts/provision-communications-runtime.ts
@@ -0,0 +1,187 @@
+import { resolve } from "node:path";
+import { fileURLToPath } from "node:url";
+import postgres from "postgres";
+
+export const communicationsRuntimeRoleNames = Object.freeze({
+  gateway: "atlas_communications_gateway",
+  runtime: "atlas_communications_runtime",
+});
+
+export function assertLoopbackCommunicationsDatabaseUrl(rawUrl: string): URL {
+  const url = new URL(rawUrl);
+  if (!new Set(["127.0.0.1", "localhost", "::1", "[::1]"]).has(url.hostname)) {
+    throw new Error("COMMUNICATIONS_LOCAL_PROVISION_REQUIRES_LOOPBACK_DATABASE");
+  }
+  return url;
+}
+
+function quoteLiteral(value: string): string {
+  return `'${value.replaceAll("'", "''")}'`;
+}
+
+function quoteIdentifier(value: string): string {
+  return `"${value.replaceAll('"', '""')}"`;
+}
+
+export async function provisionCommunicationsRuntime(input: {
+  adminUrl: string;
+  runtimePassword: string;
+}): Promise<void> {
+  assertLoopbackCommunicationsDatabaseUrl(input.adminUrl);
+  if (input.runtimePassword.length < 32) {
+    throw new Error("ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD_MUST_HAVE_AT_LEAST_32_CHARACTERS");
+  }
+
+  const sql = postgres(input.adminUrl, { max: 1, prepare: false });
+  try {
+    const gateway = await sql<
+      Array<{
+        exists: boolean;
+        rolcanlogin: boolean | null;
+        rolbypassrls: boolean | null;
+        rolsuper: boolean | null;
+      }>
+    >`
+      select
+        count(*) = 1 as exists,
+        bool_or(rolcanlogin) as rolcanlogin,
+        bool_or(rolbypassrls) as rolbypassrls,
+        bool_or(rolsuper) as rolsuper
+      from pg_roles
+      where rolname = ${communicationsRuntimeRoleNames.gateway}
+    `;
+    const gatewayRole = gateway[0];
+    if (
+      !gatewayRole?.exists ||
+      gatewayRole.rolcanlogin ||
+      gatewayRole.rolbypassrls ||
+      gatewayRole.rolsuper
+    ) {
+      throw new Error("COMMUNICATIONS_GATEWAY_ROLE_NOT_MIGRATED_OR_UNSAFE");
+    }
+
+    const runtime = await sql<Array<{ exists: boolean }>>`
+      select exists(
+        select 1 from pg_roles where rolname = ${communicationsRuntimeRoleNames.runtime}
+      ) as exists
+    `;
+    const runtimeName = quoteIdentifier(communicationsRuntimeRoleNames.runtime);
+    const password = quoteLiteral(input.runtimePassword);
+    if (!runtime[0]?.exists) {
+      await sql.unsafe(
+        `CREATE ROLE ${runtimeName} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
+      );
+    } else {
+      await sql.unsafe(
+        `ALTER ROLE ${runtimeName} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${password}`,
+      );
+    }
+
+    const databases = await sql<Array<{ database_name: string }>>`
+      select current_database() as database_name
+    `;
+    const databaseName = databases[0]?.database_name;
+    if (!databaseName) throw new Error("COMMUNICATIONS_DATABASE_NAME_UNAVAILABLE");
+    const database = quoteIdentifier(databaseName);
+    const gatewayName = quoteIdentifier(communicationsRuntimeRoleNames.gateway);
+
+    const directMemberships = await sql<Array<{ member_name: string; role_name: string }>>`
+      select member.rolname as member_name, granted.rolname as role_name
+      from pg_auth_members membership
+      join pg_roles member on member.oid = membership.member
+      join pg_roles granted on granted.oid = membership.roleid
+      where member.rolname in (
+        ${communicationsRuntimeRoleNames.runtime},
+        ${communicationsRuntimeRoleNames.gateway}
+      )
+    `;
+    for (const membership of directMemberships) {
+      await sql.unsafe(
+        `REVOKE ${quoteIdentifier(membership.role_name)} FROM ${quoteIdentifier(membership.member_name)}`,
+      );
+    }
+
+    await sql.unsafe(`REVOKE ALL ON DATABASE ${database} FROM ${runtimeName}`);
+    await sql.unsafe(`GRANT CONNECT ON DATABASE ${database} TO ${runtimeName}`);
+    await sql.unsafe(`REVOKE ALL ON SCHEMA public FROM ${runtimeName}`);
+    await sql.unsafe(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${runtimeName}`);
+    await sql.unsafe(`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${runtimeName}`);
+    await sql.unsafe(`GRANT ${gatewayName} TO ${runtimeName}`);
+    await sql.unsafe(`REVOKE ADMIN OPTION FOR ${gatewayName} FROM ${runtimeName}`);
+
+    const publicGateway = await sql<Array<{ exists: boolean }>>`
+      select exists(select 1 from pg_roles where rolname = 'atlas_public_chat_gateway') as exists
+    `;
+    if (publicGateway[0]?.exists) {
+      await sql.unsafe(`REVOKE "atlas_public_chat_gateway" FROM ${runtimeName}`);
+    }
+
+    const closure = await sql<Array<{ admin_path: boolean; role_name: string }>>`
+      with recursive role_closure(roleid, admin_path, path) as (
+        select membership.roleid, membership.admin_option,
+          array[membership.member, membership.roleid]::oid[]
+        from pg_auth_members membership
+        where membership.member = (
+          select oid from pg_roles where rolname = ${communicationsRuntimeRoleNames.runtime}
+        )
+        union all
+        select membership.roleid,
+          role_closure.admin_path or membership.admin_option,
+          role_closure.path || membership.roleid
+        from role_closure
+        join pg_auth_members membership on membership.member = role_closure.roleid
+        where not membership.roleid = any(role_closure.path)
+      )
+      select granted.rolname as role_name, bool_or(role_closure.admin_path) as admin_path
+      from role_closure
+      join pg_roles granted on granted.oid = role_closure.roleid
+      group by granted.rolname
+      order by granted.rolname
+    `;
+    if (
+      closure.length !== 1 ||
+      closure[0]?.role_name !== communicationsRuntimeRoleNames.gateway ||
+      closure[0].admin_path
+    ) {
+      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
+    }
+
+    const gatewayClosure = await sql<Array<{ role_name: string }>>`
+      with recursive role_closure(roleid, path) as (
+        select membership.roleid, array[membership.member, membership.roleid]::oid[]
+        from pg_auth_members membership
+        where membership.member = (
+          select oid from pg_roles where rolname = ${communicationsRuntimeRoleNames.gateway}
+        )
+        union all
+        select membership.roleid, role_closure.path || membership.roleid
+        from role_closure
+        join pg_auth_members membership on membership.member = role_closure.roleid
+        where not membership.roleid = any(role_closure.path)
+      )
+      select granted.rolname as role_name
+      from role_closure
+      join pg_roles granted on granted.oid = role_closure.roleid
+    `;
+    if (gatewayClosure.length !== 0) {
+      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
+    }
+  } finally {
+    await sql.end({ timeout: 5 });
+  }
+}
+
+function isMainModule(): boolean {
+  const entry = process.argv[1];
+  return Boolean(entry && resolve(entry) === resolve(fileURLToPath(import.meta.url)));
+}
+
+if (isMainModule()) {
+  const environment = process.env;
+  const adminUrl = environment.DIRECT_DATABASE_URL;
+  const runtimePassword = environment.ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD;
+  if (!adminUrl) throw new Error("DIRECT_DATABASE_URL_REQUIRED");
+  if (!runtimePassword) throw new Error("ATLAS_COMMUNICATIONS_RUNTIME_PASSWORD_REQUIRED");
+  await provisionCommunicationsRuntime({ adminUrl, runtimePassword });
+  console.log("COMMUNICATIONS_LOCAL_RUNTIME_ROLE_PROVISIONED");
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/scripts/validate-communications-runtime.ts b/blueprints/project-atlas/workspace/packages/database/scripts/validate-communications-runtime.ts
new file mode 100644
index 0000000..cd36bb8
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/scripts/validate-communications-runtime.ts
@@ -0,0 +1,146 @@
+import { resolve } from "node:path";
+import { fileURLToPath } from "node:url";
+import postgres from "postgres";
+import {
+  assertLoopbackCommunicationsDatabaseUrl,
+  communicationsRuntimeRoleNames,
+} from "./provision-communications-runtime.ts";
+
+export async function validateCommunicationsRuntime(runtimeUrl: string): Promise<void> {
+  assertLoopbackCommunicationsDatabaseUrl(runtimeUrl);
+  const sql = postgres(runtimeUrl, { max: 1, prepare: false });
+  try {
+    const principals = await sql<
+      Array<{
+        current_user: string;
+        communications_member: boolean;
+        public_chat_member: boolean;
+        rolbypassrls: boolean;
+        rolinherit: boolean;
+        rolsuper: boolean;
+      }>
+    >`
+      select
+        current_user,
+        pg_has_role(current_user, ${communicationsRuntimeRoleNames.gateway}, 'member')
+          as communications_member,
+        case
+          when exists(select 1 from pg_roles where rolname = 'atlas_public_chat_gateway')
+            then pg_has_role(current_user, 'atlas_public_chat_gateway', 'member')
+          else false
+        end as public_chat_member,
+        rolbypassrls,
+        rolinherit,
+        rolsuper
+      from pg_roles
+      where rolname = current_user
+    `;
+    const principal = principals[0];
+    if (
+      principal?.current_user !== communicationsRuntimeRoleNames.runtime ||
+      !principal.communications_member ||
+      principal.public_chat_member ||
+      principal.rolbypassrls ||
+      principal.rolinherit ||
+      principal.rolsuper
+    ) {
+      throw new Error("COMMUNICATIONS_RUNTIME_PRINCIPAL_UNSAFE");
+    }
+
+    const closure = await sql<Array<{ admin_path: boolean; role_name: string }>>`
+      with recursive role_closure(roleid, admin_path, path) as (
+        select membership.roleid, membership.admin_option,
+          array[membership.member, membership.roleid]::oid[]
+        from pg_auth_members membership
+        where membership.member = (
+          select oid from pg_roles where rolname = current_user
+        )
+        union all
+        select membership.roleid,
+          role_closure.admin_path or membership.admin_option,
+          role_closure.path || membership.roleid
+        from role_closure
+        join pg_auth_members membership on membership.member = role_closure.roleid
+        where not membership.roleid = any(role_closure.path)
+      )
+      select granted.rolname as role_name, bool_or(role_closure.admin_path) as admin_path
+      from role_closure
+      join pg_roles granted on granted.oid = role_closure.roleid
+      group by granted.rolname
+      order by granted.rolname
+    `;
+    if (
+      closure.length !== 1 ||
+      closure[0]?.role_name !== communicationsRuntimeRoleNames.gateway ||
+      closure[0].admin_path
+    ) {
+      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
+    }
+
+    const gatewayClosure = await sql<Array<{ role_name: string }>>`
+      with recursive role_closure(roleid, path) as (
+        select membership.roleid, array[membership.member, membership.roleid]::oid[]
+        from pg_auth_members membership
+        where membership.member = (
+          select oid from pg_roles where rolname = ${communicationsRuntimeRoleNames.gateway}
+        )
+        union all
+        select membership.roleid, role_closure.path || membership.roleid
+        from role_closure
+        join pg_auth_members membership on membership.member = role_closure.roleid
+        where not membership.roleid = any(role_closure.path)
+      )
+      select granted.rolname as role_name
+      from role_closure
+      join pg_roles granted on granted.oid = role_closure.roleid
+    `;
+    if (gatewayClosure.length !== 0) {
+      throw new Error("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
+    }
+
+    let directAccessDenied = false;
+    try {
+      await sql`select count(*) from communication_channel_connections`;
+    } catch {
+      directAccessDenied = true;
+    }
+    if (!directAccessDenied) throw new Error("COMMUNICATIONS_RUNTIME_HAS_UNSCOPED_DIRECT_ACCESS");
+
+    await sql.begin(async (tx) => {
+      await tx.unsafe(`set local role ${communicationsRuntimeRoleNames.gateway}`);
+      const role = await tx<Array<{ current_role: string }>>`select current_role`;
+      if (role[0]?.current_role !== communicationsRuntimeRoleNames.gateway) {
+        throw new Error("COMMUNICATIONS_RUNTIME_SET_ROLE_FAILED");
+      }
+      await tx`select count(*) from communication_channel_connections`;
+      await tx`select count(*) from communication_conversations`;
+    });
+
+    let publicSessionDenied = false;
+    try {
+      await sql.begin(async (tx) => {
+        await tx.unsafe(`set local role ${communicationsRuntimeRoleNames.gateway}`);
+        await tx`select count(*) from public_chat_sessions`;
+      });
+    } catch {
+      publicSessionDenied = true;
+    }
+    if (!publicSessionDenied) {
+      throw new Error("COMMUNICATIONS_RUNTIME_CAN_ACCESS_PUBLIC_CHAT_SESSIONS");
+    }
+  } finally {
+    await sql.end({ timeout: 5 });
+  }
+}
+
+function isMainModule(): boolean {
+  const entry = process.argv[1];
+  return Boolean(entry && resolve(entry) === resolve(fileURLToPath(import.meta.url)));
+}
+
+if (isMainModule()) {
+  const runtimeUrl = process.env.COMMUNICATIONS_DATABASE_URL;
+  if (!runtimeUrl) throw new Error("COMMUNICATIONS_DATABASE_URL_REQUIRED");
+  await validateCommunicationsRuntime(runtimeUrl);
+  console.log("COMMUNICATIONS_RUNTIME_PRINCIPAL_VALID");
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communication-contact-evidence.ts b/blueprints/project-atlas/workspace/packages/database/src/communication-contact-evidence.ts
new file mode 100644
index 0000000..33c921e
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/src/communication-contact-evidence.ts
@@ -0,0 +1,202 @@
+export type ContactPurpose = "conversational" | "transactional" | "service" | "marketing";
+
+export type PersistedContactEvidenceEvent = Readonly<{
+  sequence: number;
+  eventKind:
+    | "consent_granted"
+    | "consent_withdrawn"
+    | "consent_regranted"
+    | "ambiguous_opt_out_detected"
+    | "ambiguous_opt_out_cleared"
+    | "ambiguous_opt_out_withdrawn"
+    | "binding_suspended"
+    | "binding_revalidated";
+  purpose: ContactPurpose | null;
+  consentState: "granted" | "withdrawn" | null;
+  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review" | null;
+  bindingTrustState: "suspended" | "reverified" | null;
+  reviewResolution: "clear" | "withdraw" | null;
+  authorityVersion: number | null;
+  evidenceReceiptId: string;
+  receiptKind:
+    | "consent_evidence"
+    | "contact_withdrawal"
+    | "ambiguous_opt_out_detection"
+    | "ambiguous_opt_out_resolution"
+    | "binding_suspension"
+    | "binding_revalidation";
+}>;
+
+type ReconstructedPolicy = Readonly<{
+  consentState: "granted" | "withdrawn";
+  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
+  authorityVersion: number;
+  evidenceReceiptId: string;
+}>;
+
+export type ReconstructedContactControlState = Readonly<{
+  bindingTrustState: "suspended" | "reverified" | null;
+  policies: Readonly<Partial<Record<ContactPurpose, ReconstructedPolicy>>>;
+}>;
+
+const EXPECTED_RECEIPT_KIND = {
+  consent_granted: "consent_evidence",
+  consent_withdrawn: "contact_withdrawal",
+  consent_regranted: "consent_evidence",
+  ambiguous_opt_out_detected: "ambiguous_opt_out_detection",
+  ambiguous_opt_out_cleared: "ambiguous_opt_out_resolution",
+  ambiguous_opt_out_withdrawn: "ambiguous_opt_out_resolution",
+  binding_suspended: "binding_suspension",
+  binding_revalidated: "binding_revalidation",
+} as const;
+
+function invalid(): never {
+  throw new Error("CONTACT_EVIDENCE_HISTORY_INVALID");
+}
+
+function assertBindingEventShape(event: PersistedContactEvidenceEvent): void {
+  if (
+    event.purpose !== null ||
+    event.consentState !== null ||
+    event.fenceState !== null ||
+    event.reviewResolution !== null ||
+    event.authorityVersion !== null ||
+    (event.eventKind === "binding_suspended" && event.bindingTrustState !== "suspended") ||
+    (event.eventKind === "binding_revalidated" && event.bindingTrustState !== "reverified")
+  ) {
+    invalid();
+  }
+}
+
+function assertPolicyEventShape(
+  event: PersistedContactEvidenceEvent,
+): asserts event is PersistedContactEvidenceEvent & {
+  purpose: ContactPurpose;
+  consentState: "granted" | "withdrawn";
+  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
+  authorityVersion: number;
+} {
+  if (
+    event.purpose === null ||
+    event.consentState === null ||
+    event.fenceState === null ||
+    event.bindingTrustState !== null ||
+    event.authorityVersion === null ||
+    !Number.isSafeInteger(event.authorityVersion) ||
+    event.authorityVersion <= 0
+  ) {
+    invalid();
+  }
+  const valid =
+    (event.eventKind === "consent_granted" &&
+      event.consentState === "granted" &&
+      event.fenceState === "normal" &&
+      event.reviewResolution === null) ||
+    (event.eventKind === "consent_withdrawn" &&
+      event.consentState === "withdrawn" &&
+      event.fenceState === "withdrawn" &&
+      event.reviewResolution === null) ||
+    (event.eventKind === "consent_regranted" &&
+      event.consentState === "granted" &&
+      event.fenceState === "normal_after_review" &&
+      event.reviewResolution === null) ||
+    (event.eventKind === "ambiguous_opt_out_detected" &&
+      event.consentState === "granted" &&
+      event.fenceState === "opt_out_pending" &&
+      event.reviewResolution === null) ||
+    (event.eventKind === "ambiguous_opt_out_cleared" &&
+      event.consentState === "granted" &&
+      event.fenceState === "normal_after_review" &&
+      event.reviewResolution === "clear") ||
+    (event.eventKind === "ambiguous_opt_out_withdrawn" &&
+      event.consentState === "withdrawn" &&
+      event.fenceState === "withdrawn" &&
+      event.reviewResolution === "withdraw");
+  if (!valid) invalid();
+}
+
+function assertPolicyTransition(
+  event: PersistedContactEvidenceEvent & {
+    purpose: ContactPurpose;
+    consentState: "granted" | "withdrawn";
+    fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
+    authorityVersion: number;
+  },
+  prior: ReconstructedPolicy | undefined,
+): void {
+  if (prior && event.authorityVersion <= prior.authorityVersion) invalid();
+  switch (event.eventKind) {
+    case "consent_granted":
+      if (prior) invalid();
+      return;
+    case "consent_withdrawn":
+      if (prior?.consentState !== "granted" || prior.fenceState === "opt_out_pending") {
+        invalid();
+      }
+      return;
+    case "consent_regranted":
+      if (prior?.consentState !== "withdrawn" || prior.fenceState !== "withdrawn") {
+        invalid();
+      }
+      return;
+    case "ambiguous_opt_out_detected":
+      if (prior?.consentState !== "granted" || prior.fenceState === "opt_out_pending") {
+        invalid();
+      }
+      return;
+    case "ambiguous_opt_out_cleared":
+    case "ambiguous_opt_out_withdrawn":
+      if (prior?.consentState !== "granted" || prior.fenceState !== "opt_out_pending") {
+        invalid();
+      }
+      return;
+    case "binding_suspended":
+    case "binding_revalidated":
+      invalid();
+  }
+}
+
+export function reconstructContactControlState(
+  history: readonly PersistedContactEvidenceEvent[],
+): ReconstructedContactControlState {
+  const receipts = new Set<string>();
+  const policies: Partial<Record<ContactPurpose, ReconstructedPolicy>> = {};
+  let bindingTrustState: "suspended" | "reverified" | null = null;
+  let expectedSequence = 1;
+
+  for (const event of history) {
+    if (
+      event.sequence !== expectedSequence ||
+      event.evidenceReceiptId.trim().length === 0 ||
+      receipts.has(event.evidenceReceiptId) ||
+      event.receiptKind !== EXPECTED_RECEIPT_KIND[event.eventKind]
+    ) {
+      invalid();
+    }
+    expectedSequence += 1;
+    receipts.add(event.evidenceReceiptId);
+
+    if (event.eventKind === "binding_suspended" || event.eventKind === "binding_revalidated") {
+      assertBindingEventShape(event);
+      if (
+        (event.eventKind === "binding_suspended" && bindingTrustState === "suspended") ||
+        (event.eventKind === "binding_revalidated" && bindingTrustState !== "suspended")
+      ) {
+        invalid();
+      }
+      bindingTrustState = event.bindingTrustState;
+      continue;
+    }
+
+    assertPolicyEventShape(event);
+    assertPolicyTransition(event, policies[event.purpose]);
+    policies[event.purpose] = {
+      consentState: event.consentState,
+      fenceState: event.fenceState,
+      authorityVersion: event.authorityVersion,
+      evidenceReceiptId: event.evidenceReceiptId,
+    };
+  }
+
+  return { bindingTrustState, policies };
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
new file mode 100644
index 0000000..9d4939e
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
@@ -0,0 +1,415 @@
+export type CommunicationEventKind =
+  | "text_message"
+  | "interactive_reply"
+  | "message_status"
+  | "media_reference"
+  | "template_projection"
+  | "unsupported_verified";
+
+export type PersistedTemplateComponent = Readonly<{
+  type: "header" | "body" | "footer" | "buttons";
+  format?: "text" | "image" | "video" | "document";
+  text?: string;
+}>;
+
+export type CommunicationEventPersistenceRecord = Readonly<{
+  connectionId: string;
+  externalEventReference: string | null;
+  correlationId: string;
+  receivedAt: Date;
+  eventKind: CommunicationEventKind;
+  schemaVersion: string;
+  bindingId: string | null;
+  messageReference: string | null;
+  externalMessageReference: string | null;
+  canonicalText: string | null;
+  deliveryState: "sent" | "delivered" | "read" | "failed" | null;
+  interactiveKind: "button" | "list" | null;
+  interactiveId: string | null;
+  interactiveTitle: string | null;
+  mediaExternalReference: string | null;
+  mediaDeclaredKind: "image" | "document" | "audio" | "sticker" | "video" | null;
+  mediaMimeType: string | null;
+  mediaChecksum: string | null;
+  templateId: string | null;
+  templateAuthorityState:
+    | "draft"
+    | "internally_approved"
+    | "submitted"
+    | "provider_approved"
+    | "provider_rejected"
+    | "paused"
+    | "disabled"
+    | "superseded"
+    | null;
+  templateAuthorityVersion: number | null;
+  templateAuthorityUpdatedAt: Date | null;
+  templateProviderReference: string | null;
+  templateKey: string | null;
+  templateLocale: "es" | "en" | null;
+  templateCategory: "authentication" | "marketing" | "utility" | null;
+  templateProviderState:
+    | "submitted"
+    | "provider_approved"
+    | "provider_rejected"
+    | "paused"
+    | "disabled"
+    | null;
+  templateProviderVersion: string | null;
+  templateProviderTimestamp: Date | null;
+  templateComponents: readonly PersistedTemplateComponent[] | null;
+  unsupportedReason:
+    | "ambiguous_payload"
+    | "connection_mismatch"
+    | "malformed_payload"
+    | "payload_too_large"
+    | "template_manual_review"
+    | "unsupported_event"
+    | "unverified_context"
+    | null;
+  bodyRetentionPolicy: "metadata_only" | "synthetic_local_text" | "approved";
+  occurredAt: Date;
+}>;
+
+const RECORD_KEYS = Object.freeze([
+  "connectionId",
+  "externalEventReference",
+  "correlationId",
+  "receivedAt",
+  "eventKind",
+  "schemaVersion",
+  "bindingId",
+  "messageReference",
+  "externalMessageReference",
+  "canonicalText",
+  "deliveryState",
+  "interactiveKind",
+  "interactiveId",
+  "interactiveTitle",
+  "mediaExternalReference",
+  "mediaDeclaredKind",
+  "mediaMimeType",
+  "mediaChecksum",
+  "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+  "templateKey",
+  "templateLocale",
+  "templateCategory",
+  "templateProviderState",
+  "templateProviderVersion",
+  "templateProviderTimestamp",
+  "templateComponents",
+  "unsupportedReason",
+  "bodyRetentionPolicy",
+  "occurredAt",
+] satisfies readonly (keyof CommunicationEventPersistenceRecord)[]);
+
+const EVENT_KINDS = new Set<CommunicationEventKind>([
+  "text_message",
+  "interactive_reply",
+  "message_status",
+  "media_reference",
+  "template_projection",
+  "unsupported_verified",
+]);
+const DELIVERY_STATES = new Set(["sent", "delivered", "read", "failed"]);
+const INTERACTIVE_KINDS = new Set(["button", "list"]);
+const MEDIA_KINDS = new Set(["image", "document", "audio", "sticker", "video"]);
+const TEMPLATE_LOCALES = new Set(["es", "en"]);
+const TEMPLATE_AUTHORITY_STATES = new Set([
+  "draft",
+  "internally_approved",
+  "submitted",
+  "provider_approved",
+  "provider_rejected",
+  "paused",
+  "disabled",
+  "superseded",
+]);
+const TEMPLATE_CATEGORIES = new Set(["authentication", "marketing", "utility"]);
+const TEMPLATE_STATES = new Set([
+  "submitted",
+  "provider_approved",
+  "provider_rejected",
+  "paused",
+  "disabled",
+]);
+const UNSUPPORTED_REASONS = new Set([
+  "ambiguous_payload",
+  "connection_mismatch",
+  "malformed_payload",
+  "payload_too_large",
+  "template_manual_review",
+  "unsupported_event",
+  "unverified_context",
+]);
+const COMPONENT_TYPES = new Set(["header", "body", "footer", "buttons"]);
+const COMPONENT_FORMATS = new Set(["text", "image", "video", "document"]);
+
+function isObject(value: unknown): value is Record<string, unknown> {
+  return typeof value === "object" && value !== null && !Array.isArray(value);
+}
+
+function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
+  const actual = Object.keys(value).sort();
+  const expected = [...keys].sort();
+  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
+}
+
+function isNonEmptyString(value: unknown): value is string {
+  return typeof value === "string" && value.trim().length > 0;
+}
+
+function isNullableNonEmptyString(value: unknown): value is string | null {
+  return value === null || isNonEmptyString(value);
+}
+
+function isValidDate(value: unknown): value is Date {
+  return value instanceof Date && Number.isFinite(value.getTime());
+}
+
+function isNull(value: unknown): value is null {
+  return value === null;
+}
+
+function hasOnlyNulls(record: Record<string, unknown>, keys: readonly string[]): boolean {
+  return keys.every((key) => isNull(record[key]));
+}
+
+function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
+  if (!isObject(value)) return false;
+  const keys = Object.keys(value);
+  if (
+    keys.some((key) => !["type", "format", "text"].includes(key)) ||
+    !COMPONENT_TYPES.has(String(value.type))
+  ) {
+    return false;
+  }
+  if (value.format !== undefined && !COMPONENT_FORMATS.has(String(value.format))) return false;
+  return value.text === undefined || typeof value.text === "string";
+}
+
+const MESSAGE_ONLY_FIELDS = [
+  "externalMessageReference",
+  "deliveryState",
+  "interactiveKind",
+  "interactiveId",
+  "interactiveTitle",
+  "mediaExternalReference",
+  "mediaDeclaredKind",
+  "mediaMimeType",
+  "mediaChecksum",
+  "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+  "templateKey",
+  "templateLocale",
+  "templateCategory",
+  "templateProviderState",
+  "templateProviderVersion",
+  "templateProviderTimestamp",
+  "templateComponents",
+  "unsupportedReason",
+] as const;
+
+function hasValidTypedShape(record: Record<string, unknown>): boolean {
+  switch (record.eventKind) {
+    case "text_message":
+      return (
+        isNonEmptyString(record.bindingId) &&
+        isNonEmptyString(record.messageReference) &&
+        ((record.bodyRetentionPolicy === "metadata_only" && isNull(record.canonicalText)) ||
+          (["synthetic_local_text", "approved"].includes(String(record.bodyRetentionPolicy)) &&
+            typeof record.canonicalText === "string")) &&
+        hasOnlyNulls(record, MESSAGE_ONLY_FIELDS)
+      );
+    case "interactive_reply":
+      return (
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.canonicalText) &&
+        isNonEmptyString(record.bindingId) &&
+        isNonEmptyString(record.messageReference) &&
+        INTERACTIVE_KINDS.has(String(record.interactiveKind)) &&
+        isNonEmptyString(record.interactiveId) &&
+        typeof record.interactiveTitle === "string" &&
+        hasOnlyNulls(record, [
+          "externalMessageReference",
+          "deliveryState",
+          "mediaExternalReference",
+          "mediaDeclaredKind",
+          "mediaMimeType",
+          "mediaChecksum",
+          "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+          "templateKey",
+          "templateLocale",
+          "templateCategory",
+          "templateProviderState",
+          "templateProviderVersion",
+          "templateProviderTimestamp",
+          "templateComponents",
+          "unsupportedReason",
+        ])
+      );
+    case "message_status":
+      return (
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.canonicalText) &&
+        isNonEmptyString(record.externalMessageReference) &&
+        DELIVERY_STATES.has(String(record.deliveryState)) &&
+        hasOnlyNulls(record, [
+          "bindingId",
+          "messageReference",
+          "interactiveKind",
+          "interactiveId",
+          "interactiveTitle",
+          "mediaExternalReference",
+          "mediaDeclaredKind",
+          "mediaMimeType",
+          "mediaChecksum",
+          "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+          "templateKey",
+          "templateLocale",
+          "templateCategory",
+          "templateProviderState",
+          "templateProviderVersion",
+          "templateProviderTimestamp",
+          "templateComponents",
+          "unsupportedReason",
+        ])
+      );
+    case "media_reference":
+      return (
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.canonicalText) &&
+        isNonEmptyString(record.bindingId) &&
+        isNonEmptyString(record.messageReference) &&
+        isNonEmptyString(record.mediaExternalReference) &&
+        MEDIA_KINDS.has(String(record.mediaDeclaredKind)) &&
+        isNullableNonEmptyString(record.mediaMimeType) &&
+        (record.mediaChecksum === null ||
+          (typeof record.mediaChecksum === "string" &&
+            /^[0-9a-f]{64}$/u.test(record.mediaChecksum))) &&
+        hasOnlyNulls(record, [
+          "externalMessageReference",
+          "deliveryState",
+          "interactiveKind",
+          "interactiveId",
+          "interactiveTitle",
+          "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+          "templateKey",
+          "templateLocale",
+          "templateCategory",
+          "templateProviderState",
+          "templateProviderVersion",
+          "templateProviderTimestamp",
+          "templateComponents",
+          "unsupportedReason",
+        ])
+      );
+    case "template_projection":
+      return (
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.canonicalText) &&
+        isNonEmptyString(record.templateId) &&
+        TEMPLATE_AUTHORITY_STATES.has(String(record.templateAuthorityState)) &&
+        Number.isSafeInteger(record.templateAuthorityVersion) &&
+        Number(record.templateAuthorityVersion) > 0 &&
+        isValidDate(record.templateAuthorityUpdatedAt) &&
+        isNonEmptyString(record.templateProviderReference) &&
+        isNonEmptyString(record.templateKey) &&
+        TEMPLATE_LOCALES.has(String(record.templateLocale)) &&
+        TEMPLATE_CATEGORIES.has(String(record.templateCategory)) &&
+        TEMPLATE_STATES.has(String(record.templateProviderState)) &&
+        isNonEmptyString(record.templateProviderVersion) &&
+        isValidDate(record.templateProviderTimestamp) &&
+        Array.isArray(record.templateComponents) &&
+        record.templateComponents.every(isTemplateComponent) &&
+        hasOnlyNulls(record, [
+          "bindingId",
+          "messageReference",
+          "externalMessageReference",
+          "deliveryState",
+          "interactiveKind",
+          "interactiveId",
+          "interactiveTitle",
+          "mediaExternalReference",
+          "mediaDeclaredKind",
+          "mediaMimeType",
+          "mediaChecksum",
+          "unsupportedReason",
+        ])
+      );
+    case "unsupported_verified":
+      return (
+        record.bodyRetentionPolicy === "metadata_only" &&
+        isNull(record.externalEventReference) &&
+        isNull(record.canonicalText) &&
+        UNSUPPORTED_REASONS.has(String(record.unsupportedReason)) &&
+        hasOnlyNulls(record, [
+          "bindingId",
+          "messageReference",
+          "externalMessageReference",
+          "deliveryState",
+          "interactiveKind",
+          "interactiveId",
+          "interactiveTitle",
+          "mediaExternalReference",
+          "mediaDeclaredKind",
+          "mediaMimeType",
+          "mediaChecksum",
+          "templateId",
+  "templateAuthorityState",
+  "templateAuthorityVersion",
+  "templateAuthorityUpdatedAt",
+  "templateProviderReference",
+          "templateKey",
+          "templateLocale",
+          "templateCategory",
+          "templateProviderState",
+          "templateProviderVersion",
+          "templateProviderTimestamp",
+          "templateComponents",
+        ])
+      );
+    default:
+      return false;
+  }
+}
+
+export function validateCommunicationEventRecord(
+  value: unknown,
+): CommunicationEventPersistenceRecord {
+  if (
+    !isObject(value) ||
+    !hasExactKeys(value, RECORD_KEYS) ||
+    !EVENT_KINDS.has(value.eventKind as CommunicationEventKind) ||
+    !isNonEmptyString(value.connectionId) ||
+    !isNonEmptyString(value.correlationId) ||
+    !isNonEmptyString(value.schemaVersion) ||
+    !isValidDate(value.receivedAt) ||
+    !isValidDate(value.occurredAt) ||
+    (value.eventKind !== "unsupported_verified" &&
+      !isNonEmptyString(value.externalEventReference)) ||
+    !hasValidTypedShape(value)
+  ) {
+    throw new Error("COMMUNICATION_EVENT_RECORD_INVALID");
+  }
+  return value as CommunicationEventPersistenceRecord;
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/src/index.ts b/blueprints/project-atlas/workspace/packages/database/src/index.ts
index 3ecb2cc..0f3075f 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/index.ts
@@ -1,5 +1,7 @@
 export const DATABASE_PACKAGE_ID = "@atlas/database";
 
+export * from "./communication-contact-evidence.ts";
+export * from "./communication-event-envelope.ts";
 export * from "./postgres-public-chat-store.ts";
 export * from "./public-chat-repository.ts";
 export * from "./schema.ts";
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index 82c30ff..f7bd7d5 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -1,21 +1,23 @@
 import { sql } from "drizzle-orm";
 import {
   bigint,
   boolean,
   char,
   check,
+  foreignKey,
   getTableConfig,
   index,
   integer,
   jsonb,
   pgPolicy,
+  pgRole,
   pgTable,
   text,
   timestamp,
   unique,
   varchar,
 } from "drizzle-orm/pg-core";
 
 const gatewayAccess = (name: string) =>
   pgPolicy(`${name}_server_gateway_only`, {
     as: "permissive",
@@ -23,20 +25,61 @@ const gatewayAccess = (name: string) =>
     to: "atlas_public_chat_gateway",
     using: sql`true`,
     withCheck: sql`true`,
   });
 
 const timestamps = {
   createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
 };
 
+const publicChatGatewayRole = pgRole("atlas_public_chat_gateway").existing();
+export const communicationsGatewayRole = pgRole("atlas_communications_gateway").existing();
+
+const communicationsOnly = (name: string) =>
+  pgPolicy(`${name}_communications_scope`, {
+    as: "permissive",
+    for: "all",
+    to: communicationsGatewayRole,
+    using: sql`true`,
+    withCheck: sql`true`,
+  });
+
+const publicSessionId = sql`nullif(current_setting('atlas.public_chat_session_id', true), '')`;
+
+const publicConversationScope = (conversationId: unknown, channelKind: unknown) =>
+  sql`${channelKind} = 'public_web' and exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = ${conversationId}
+      and pcs.session_id = ${publicSessionId}
+  )`;
+
+const communicationsConversationScope = (channelKind: unknown) => sql`${channelKind} = 'whatsapp'`;
+
+const sharedPolicies = (name: string, conversationId: unknown, channelKind: unknown) => [
+  pgPolicy(`${name}_public_chat_scope`, {
+    as: "permissive",
+    for: "all",
+    to: publicChatGatewayRole,
+    using: publicConversationScope(conversationId, channelKind),
+    withCheck: publicConversationScope(conversationId, channelKind),
+  }),
+  pgPolicy(`${name}_communications_scope`, {
+    as: "permissive",
+    for: "all",
+    to: communicationsGatewayRole,
+    using: communicationsConversationScope(channelKind),
+    withCheck: communicationsConversationScope(channelKind),
+  }),
+];
+
 export const publicChatSessions = pgTable(
   "public_chat_sessions",
   {
     id: text("id").primaryKey(),
     sessionHash: char("session_hash", { length: 64 }).notNull().unique(),
     csrfHash: char("csrf_hash", { length: 64 }).notNull(),
     correlationId: text("correlation_id").notNull(),
     expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
     revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
     ...timestamps,
@@ -262,11 +305,1006 @@ export const publicChatAuditEvents = pgTable(
     correlationId: text("correlation_id").notNull(),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     unique("public_chat_audit_sequence_unique").on(table.conversationId, table.sequence),
     check("public_chat_audit_locale_valid", sql`${table.locale} in ('es', 'en')`),
     gatewayAccess("public_chat_audit_events"),
   ],
 ).enableRLS();
 
+export const communicationChannelConnections = pgTable(
+  "communication_channel_connections",
+  {
+    id: text("id").primaryKey(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    adapterKey: varchar("adapter_key", { length: 32 }).notNull(),
+    readinessState: varchar("readiness_state", { length: 32 }).notNull(),
+    policyVersion: varchar("policy_version", { length: 80 }).notNull(),
+    version: integer("version").notNull(),
+    configuredAt: timestamp("configured_at", { withTimezone: true, mode: "date" }),
+    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
+    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    unique("communication_channel_connections_id_channel_unique").on(table.id, table.channelKind),
+    check(
+      "communication_channel_connections_channel_valid",
+      sql`${table.channelKind} = 'whatsapp'`,
+    ),
+    check(
+      "communication_channel_connections_adapter_valid",
+      sql`${table.adapterKey} = 'meta_cloud'`,
+    ),
+    check(
+      "communication_channel_connections_readiness_valid",
+      sql`${table.readinessState} in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')`,
+    ),
+    check("communication_channel_connections_version_positive", sql`${table.version} > 0`),
+    index("communication_channel_connections_readiness_idx").on(
+      table.readinessState,
+      table.updatedAt,
+    ),
+    communicationsOnly("communication_channel_connections"),
+  ],
+).enableRLS();
+
+export const communicationContactBindings = pgTable(
+  "communication_contact_bindings",
+  {
+    id: text("id").primaryKey(),
+    connectionId: text("connection_id")
+      .notNull()
+      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    endpointDigest: char("endpoint_digest", { length: 64 }).notNull(),
+    endpointDigestKeyVersion: varchar("endpoint_digest_key_version", { length: 80 }).notNull(),
+    trustState: varchar("trust_state", { length: 32 }).notNull(),
+    locale: varchar("locale", { length: 2 }).notNull(),
+    contactPolicyVersion: integer("contact_policy_version").notNull(),
+    version: integer("version").notNull(),
+    verificationReceiptId: text("verification_receipt_id"),
+    endpointVerifiedAt: timestamp("endpoint_verified_at", { withTimezone: true, mode: "date" }),
+    verificationExpiresAt: timestamp("verification_expires_at", {
+      withTimezone: true,
+      mode: "date",
+    }),
+    wrongPersonReportedAt: timestamp("wrong_person_reported_at", {
+      withTimezone: true,
+      mode: "date",
+    }),
+    reassignmentRiskAt: timestamp("reassignment_risk_at", {
+      withTimezone: true,
+      mode: "date",
+    }),
+    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_contact_bindings_connection_channel_fk",
+      columns: [table.connectionId, table.channelKind],
+      foreignColumns: [
+        communicationChannelConnections.id,
+        communicationChannelConnections.channelKind,
+      ],
+    }).onDelete("restrict"),
+    unique("communication_contact_bindings_id_connection_channel_unique").on(
+      table.id,
+      table.connectionId,
+      table.channelKind,
+    ),
+    unique("communication_contact_bindings_id_channel_unique").on(table.id, table.channelKind),
+    unique("communication_contact_bindings_endpoint_unique").on(
+      table.connectionId,
+      table.endpointDigestKeyVersion,
+      table.endpointDigest,
+    ),
+    check("communication_contact_bindings_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
+    check(
+      "communication_contact_bindings_trust_valid",
+      sql`${table.trustState} in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')`,
+    ),
+    check("communication_contact_bindings_locale_valid", sql`${table.locale} in ('es', 'en')`),
+    check(
+      "communication_contact_bindings_endpoint_digest_valid",
+      sql`${table.endpointDigest} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_contact_bindings_policy_version_positive",
+      sql`${table.contactPolicyVersion} > 0`,
+    ),
+    check("communication_contact_bindings_version_positive", sql`${table.version} > 0`),
+    check(
+      "communication_contact_bindings_verification_window_valid",
+      sql`${table.verificationExpiresAt} is null or (${table.endpointVerifiedAt} is not null and ${table.verificationExpiresAt} > ${table.endpointVerifiedAt})`,
+    ),
+    index("communication_contact_bindings_trust_idx").on(table.trustState, table.updatedAt),
+    communicationsOnly("communication_contact_bindings"),
+  ],
+).enableRLS();
+
+export const communicationContactEvidenceEvents = pgTable(
+  "communication_contact_evidence_events",
+  {
+    id: text("id").primaryKey(),
+    bindingId: text("binding_id")
+      .notNull()
+      .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
+    sequence: bigint("sequence", { mode: "number" }).notNull(),
+    eventKind: varchar("event_kind", { length: 40 }).notNull(),
+    purpose: varchar("purpose", { length: 24 }),
+    consentState: varchar("consent_state", { length: 24 }),
+    fenceState: varchar("fence_state", { length: 24 }),
+    bindingTrustState: varchar("binding_trust_state", { length: 32 }),
+    reviewResolution: varchar("review_resolution", { length: 16 }),
+    evidenceReceiptId: text("evidence_receipt_id").notNull(),
+    receiptKind: varchar("receipt_kind", { length: 40 }).notNull(),
+    owningDomain: varchar("owning_domain", { length: 80 }).notNull(),
+    authorityRole: varchar("authority_role", { length: 32 }).notNull(),
+    authorityVersion: integer("authority_version"),
+    triggeringEventId: text("triggering_event_id"),
+    policyVersion: varchar("policy_version", { length: 80 }),
+    correlationId: text("correlation_id").notNull(),
+    receiptIssuedAt: timestamp("receipt_issued_at", { withTimezone: true, mode: "date" }),
+    receiptValidUntil: timestamp("receipt_valid_until", { withTimezone: true, mode: "date" }),
+    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    unique("communication_contact_evidence_events_binding_sequence_unique").on(
+      table.bindingId,
+      table.sequence,
+    ),
+    unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId),
+    check(
+      "communication_contact_evidence_events_kind_valid",
+      sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
+    ),
+    check(
+      "communication_contact_evidence_events_authority_valid",
+      sql`(${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
+    ),
+    check(
+      "communication_contact_evidence_events_receipt_valid",
+      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
+    ),
+    check(
+      "communication_contact_evidence_events_state_shape_valid",
+      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
+    ),
+    check("communication_contact_evidence_events_sequence_positive", sql`${table.sequence} > 0`),
+    check(
+      "communication_contact_evidence_events_receipt_window_valid",
+      sql`(${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.receiptIssuedAt} is not null and ${table.receiptValidUntil} is not null and ${table.receiptValidUntil} > ${table.receiptIssuedAt})`,
+    ),
+    index("communication_contact_evidence_events_binding_idx").on(table.bindingId, table.sequence),
+    pgPolicy("communication_contact_evidence_events_communications_select", {
+      as: "permissive",
+      for: "select",
+      to: communicationsGatewayRole,
+      using: sql`true`,
+    }),
+    pgPolicy("communication_contact_evidence_events_communications_insert", {
+      as: "permissive",
+      for: "insert",
+      to: communicationsGatewayRole,
+      withCheck: sql`true`,
+    }),
+  ],
+).enableRLS();
+
+export const communicationContactPolicies = pgTable(
+  "communication_contact_policies",
+  {
+    id: text("id").primaryKey(),
+    bindingId: text("binding_id")
+      .notNull()
+      .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
+    purpose: varchar("purpose", { length: 24 }).notNull(),
+    consentState: varchar("consent_state", { length: 24 }).notNull(),
+    fenceState: varchar("fence_state", { length: 24 }).notNull(),
+    decisionCode: varchar("decision_code", { length: 32 }),
+    evidenceReceiptId: text("evidence_receipt_id"),
+    version: integer("version").notNull(),
+    evaluatedAt: timestamp("evaluated_at", { withTimezone: true, mode: "date" }).notNull(),
+    ...timestamps,
+  },
+  (table) => [
+    unique("communication_contact_policies_binding_purpose_unique").on(
+      table.bindingId,
+      table.purpose,
+    ),
+    check(
+      "communication_contact_policies_purpose_valid",
+      sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
+    ),
+    check(
+      "communication_contact_policies_consent_valid",
+      sql`${table.consentState} in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')`,
+    ),
+    check(
+      "communication_contact_policies_fence_valid",
+      sql`${table.fenceState} in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')`,
+    ),
+    check(
+      "communication_contact_policies_decision_valid",
+      sql`${table.decisionCode} is null or ${table.decisionCode} in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')`,
+    ),
+    check("communication_contact_policies_version_positive", sql`${table.version} > 0`),
+    index("communication_contact_policies_fence_idx").on(table.fenceState, table.updatedAt),
+    communicationsOnly("communication_contact_policies"),
+  ],
+).enableRLS();
+
+export const communicationConversations = pgTable(
+  "communication_conversations",
+  {
+    id: text("id").primaryKey(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    locale: varchar("locale", { length: 2 }).notNull(),
+    status: varchar("status", { length: 32 }).notNull(),
+    version: integer("version").notNull(),
+    correlationId: text("correlation_id").notNull(),
+    lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: "date" }).notNull(),
+    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
+    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
+    reconciliationRequired: boolean("reconciliation_required").notNull().default(false),
+    ...timestamps,
+  },
+  (table) => [
+    unique("communication_conversations_id_channel_unique").on(table.id, table.channelKind),
+    check(
+      "communication_conversations_channel_valid",
+      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
+    ),
+    check("communication_conversations_locale_valid", sql`${table.locale} in ('es', 'en')`),
+    check(
+      "communication_conversations_status_valid",
+      sql`${table.status} in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')`,
+    ),
+    check("communication_conversations_version_positive", sql`${table.version} > 0`),
+    check(
+      "communication_conversations_expiry_valid",
+      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}`,
+    ),
+    check(
+      "communication_conversations_public_expiry_required",
+      sql`${table.channelKind} <> 'public_web' or ${table.expiresAt} is not null`,
+    ),
+    index("communication_conversations_activity_idx").on(table.channelKind, table.lastActivityAt),
+    index("communication_conversations_reconciliation_idx").on(
+      table.reconciliationRequired,
+      table.updatedAt,
+    ),
+    ...sharedPolicies("communication_conversations", table.id, table.channelKind),
+  ],
+).enableRLS();
+
+export const communicationParticipants = pgTable(
+  "communication_participants",
+  {
+    id: text("id").primaryKey(),
+    conversationId: text("conversation_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    kind: varchar("kind", { length: 16 }).notNull(),
+    channelBindingId: text("channel_binding_id"),
+    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).notNull(),
+    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_participants_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("cascade"),
+    foreignKey({
+      name: "communication_participants_binding_channel_fk",
+      columns: [table.channelBindingId, table.channelKind],
+      foreignColumns: [communicationContactBindings.id, communicationContactBindings.channelKind],
+    }).onDelete("restrict"),
+    unique("communication_participants_id_conversation_unique").on(table.id, table.conversationId),
+    unique("communication_participants_id_conversation_channel_unique").on(
+      table.id,
+      table.conversationId,
+      table.channelKind,
+    ),
+    check(
+      "communication_participants_channel_valid",
+      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
+    ),
+    check(
+      "communication_participants_kind_valid",
+      sql`${table.kind} in ('external', 'automated', 'human', 'system')`,
+    ),
+    check(
+      "communication_participants_membership_window_valid",
+      sql`${table.leftAt} is null or ${table.leftAt} >= ${table.joinedAt}`,
+    ),
+    index("communication_participants_conversation_idx").on(table.conversationId, table.joinedAt),
+    ...sharedPolicies("communication_participants", table.conversationId, table.channelKind),
+  ],
+).enableRLS();
+
+export const publicChatConversationSessions = pgTable(
+  "public_chat_conversation_sessions",
+  {
+    id: text("id").primaryKey(),
+    conversationId: text("conversation_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("public_web"),
+    sessionId: text("session_id")
+      .notNull()
+      .references(() => publicChatSessions.id, { onDelete: "cascade" }),
+    participantId: text("participant_id").notNull(),
+    noticeVersion: varchar("notice_version", { length: 80 }).notNull(),
+    startIdempotencyKey: varchar("start_idempotency_key", { length: 128 }).notNull(),
+    startFingerprint: char("start_fingerprint", { length: 64 }).notNull(),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "public_chat_conversation_sessions_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("cascade"),
+    foreignKey({
+      name: "public_chat_conversation_sessions_participant_conversation_channel_fk",
+      columns: [table.participantId, table.conversationId, table.channelKind],
+      foreignColumns: [
+        communicationParticipants.id,
+        communicationParticipants.conversationId,
+        communicationParticipants.channelKind,
+      ],
+    }).onDelete("cascade"),
+    unique("public_chat_conversation_sessions_conversation_unique").on(table.conversationId),
+    unique("public_chat_conversation_sessions_session_start_key_unique").on(
+      table.sessionId,
+      table.startIdempotencyKey,
+    ),
+    check(
+      "public_chat_conversation_sessions_start_fingerprint_valid",
+      sql`${table.startFingerprint} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "public_chat_conversation_sessions_channel_valid",
+      sql`${table.channelKind} = 'public_web'`,
+    ),
+    index("public_chat_conversation_sessions_session_idx").on(table.sessionId, table.createdAt),
+    pgPolicy("public_chat_conversation_sessions_public_chat_scope", {
+      as: "permissive",
+      for: "all",
+      to: publicChatGatewayRole,
+      using: sql`${table.sessionId} = ${publicSessionId}`,
+      withCheck: sql`${table.sessionId} = ${publicSessionId}`,
+    }),
+  ],
+).enableRLS();
+
+export const communicationMessages = pgTable(
+  "communication_messages",
+  {
+    id: text("id").primaryKey(),
+    conversationId: text("conversation_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    ordinal: integer("ordinal").notNull(),
+    direction: varchar("direction", { length: 16 }).notNull(),
+    senderParticipantId: text("sender_participant_id").notNull(),
+    recipientParticipantId: text("recipient_participant_id"),
+    locale: varchar("locale", { length: 2 }).notNull(),
+    kind: varchar("kind", { length: 24 }).notNull(),
+    state: varchar("state", { length: 24 }).notNull(),
+    body: text("body"),
+    bodyStored: boolean("body_stored").notNull().default(false),
+    bodyRetentionPolicy: varchar("body_retention_policy", { length: 24 })
+      .notNull()
+      .default("metadata_only"),
+    actions: jsonb("actions").notNull().default(sql`'[]'::jsonb`),
+    rejectionReason: varchar("rejection_reason", { length: 48 }),
+    externalMessageReference: text("external_message_reference"),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_messages_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("cascade"),
+    foreignKey({
+      name: "communication_messages_sender_conversation_fk",
+      columns: [table.senderParticipantId, table.conversationId],
+      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_messages_recipient_conversation_fk",
+      columns: [table.recipientParticipantId, table.conversationId],
+      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
+    }).onDelete("restrict"),
+    unique("communication_messages_id_conversation_unique").on(table.id, table.conversationId),
+    unique("communication_messages_conversation_ordinal_unique").on(
+      table.conversationId,
+      table.ordinal,
+    ),
+    check(
+      "communication_messages_channel_valid",
+      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
+    ),
+    check("communication_messages_ordinal_positive", sql`${table.ordinal} > 0`),
+    check(
+      "communication_messages_direction_valid",
+      sql`${table.direction} in ('inbound', 'outbound', 'system')`,
+    ),
+    check("communication_messages_locale_valid", sql`${table.locale} in ('es', 'en')`),
+    check(
+      "communication_messages_kind_valid",
+      sql`${table.kind} in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')`,
+    ),
+    check(
+      "communication_messages_state_valid",
+      sql`${table.state} in ('accepted', 'answered', 'failed', 'handoff_required')`,
+    ),
+    check(
+      "communication_messages_body_retention_valid",
+      sql`(${table.bodyRetentionPolicy} = 'metadata_only' and ${table.bodyStored} = false and ${table.body} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.bodyStored} = true and ${table.body} is not null)`,
+    ),
+    index("communication_messages_conversation_idx").on(table.conversationId, table.ordinal),
+    index("communication_messages_external_reference_idx").on(table.externalMessageReference),
+    ...sharedPolicies("communication_messages", table.conversationId, table.channelKind),
+  ],
+).enableRLS();
+
+export const communicationProviderEventReceipts = pgTable(
+  "communication_provider_event_receipts",
+  {
+    id: text("id").primaryKey(),
+    connectionId: text("connection_id")
+      .notNull()
+      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("whatsapp"),
+    externalEventReference: text("external_event_reference").notNull(),
+    bodyDigest: char("body_digest", { length: 64 }).notNull(),
+    eventKind: varchar("event_kind", { length: 32 }).notNull(),
+    state: varchar("state", { length: 32 }).notNull(),
+    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
+    signatureVerified: boolean("signature_verified").notNull(),
+    correlationId: text("correlation_id").notNull(),
+    outcomeReason: varchar("outcome_reason", { length: 48 }),
+    processingVersion: integer("processing_version").notNull(),
+    leaseOwnerId: text("lease_owner_id"),
+    leaseTokenHash: char("lease_token_hash", { length: 64 }),
+    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
+    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
+    persistedAt: timestamp("persisted_at", { withTimezone: true, mode: "date" }).notNull(),
+    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_provider_event_receipts_connection_channel_fk",
+      columns: [table.connectionId, table.channelKind],
+      foreignColumns: [
+        communicationChannelConnections.id,
+        communicationChannelConnections.channelKind,
+      ],
+    }).onDelete("restrict"),
+    unique("communication_provider_event_receipts_id_connection_unique").on(
+      table.id,
+      table.connectionId,
+    ),
+    unique("communication_provider_event_receipts_identity_unique").on(
+      table.connectionId,
+      table.externalEventReference,
+    ),
+    check(
+      "communication_provider_event_receipts_kind_valid",
+      sql`${table.eventKind} in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')`,
+    ),
+    check(
+      "communication_provider_event_receipts_state_valid",
+      sql`${table.state} in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')`,
+    ),
+    check(
+      "communication_provider_event_receipts_signature_valid",
+      sql`${table.signatureVerified} = true`,
+    ),
+    check(
+      "communication_provider_event_receipts_channel_valid",
+      sql`${table.channelKind} = 'whatsapp'`,
+    ),
+    check(
+      "communication_provider_event_receipts_body_digest_valid",
+      sql`${table.bodyDigest} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_provider_event_receipts_lease_token_hash_valid",
+      sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_provider_event_receipts_version_positive",
+      sql`${table.processingVersion} > 0`,
+    ),
+    check(
+      "communication_provider_event_receipts_lease_valid",
+      sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
+    ),
+    index("communication_provider_event_receipts_work_idx").on(
+      table.state,
+      table.leaseExpiresAt,
+      table.receivedAt,
+    ),
+    communicationsOnly("communication_provider_event_receipts"),
+  ],
+).enableRLS();
+
+export const communicationEventEnvelopes = pgTable(
+  "communication_event_envelopes",
+  {
+    id: text("id").primaryKey(),
+    receiptId: text("receipt_id").notNull().unique(),
+    connectionId: text("connection_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("whatsapp"),
+    eventKind: varchar("event_kind", { length: 32 }).notNull(),
+    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
+    conversationId: text("conversation_id"),
+    participantId: text("participant_id"),
+    bindingId: text("binding_id"),
+    messageId: text("message_id"),
+    messageReference: text("message_reference"),
+    externalMessageReference: text("external_message_reference"),
+    canonicalText: text("canonical_text"),
+    deliveryState: varchar("delivery_state", { length: 24 }),
+    interactiveKind: varchar("interactive_kind", { length: 16 }),
+    interactiveId: varchar("interactive_id", { length: 240 }),
+    interactiveTitle: varchar("interactive_title", { length: 240 }),
+    mediaExternalReference: text("media_external_reference"),
+    mediaDeclaredKind: varchar("media_declared_kind", { length: 16 }),
+    mediaMimeType: varchar("media_mime_type", { length: 160 }),
+    mediaChecksum: char("media_checksum", { length: 64 }),
+    templateId: text("template_id"),
+    templateAuthorityState: varchar("template_authority_state", { length: 32 }),
+    templateAuthorityVersion: integer("template_authority_version"),
+    templateAuthorityUpdatedAt: timestamp("template_authority_updated_at", {
+      withTimezone: true,
+      mode: "date",
+    }),
+    templateProviderReference: text("template_provider_reference"),
+    templateKey: varchar("template_key", { length: 120 }),
+    templateLocale: varchar("template_locale", { length: 2 }),
+    templateCategory: varchar("template_category", { length: 24 }),
+    templateProviderState: varchar("template_provider_state", { length: 32 }),
+    templateProviderVersion: varchar("template_provider_version", { length: 80 }),
+    templateProviderTimestamp: timestamp("template_provider_timestamp", {
+      withTimezone: true,
+      mode: "date",
+    }),
+    templateComponents: jsonb("template_components"),
+    unsupportedReason: varchar("unsupported_reason", { length: 48 }),
+    bodyRetentionPolicy: varchar("body_retention_policy", { length: 24 })
+      .notNull()
+      .default("metadata_only"),
+    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_event_envelopes_receipt_connection_fk",
+      columns: [table.receiptId, table.connectionId],
+      foreignColumns: [
+        communicationProviderEventReceipts.id,
+        communicationProviderEventReceipts.connectionId,
+      ],
+    }).onDelete("cascade"),
+    foreignKey({
+      name: "communication_event_envelopes_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_event_envelopes_participant_conversation_channel_fk",
+      columns: [table.participantId, table.conversationId, table.channelKind],
+      foreignColumns: [
+        communicationParticipants.id,
+        communicationParticipants.conversationId,
+        communicationParticipants.channelKind,
+      ],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_event_envelopes_message_conversation_fk",
+      columns: [table.messageId, table.conversationId],
+      foreignColumns: [communicationMessages.id, communicationMessages.conversationId],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_event_envelopes_binding_connection_channel_fk",
+      columns: [table.bindingId, table.connectionId, table.channelKind],
+      foreignColumns: [
+        communicationContactBindings.id,
+        communicationContactBindings.connectionId,
+        communicationContactBindings.channelKind,
+      ],
+    }).onDelete("restrict"),
+    check(
+      "communication_event_envelopes_kind_valid",
+      sql`${table.eventKind} in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')`,
+    ),
+    check("communication_event_envelopes_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
+    check(
+      "communication_event_envelopes_retention_valid",
+      sql`(${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.canonicalText} is not null)`,
+    ),
+    check(
+      "communication_event_envelopes_typed_shape_valid",
+      sql`(${table.eventKind} = 'text_message' and ${table.bindingId} is not null and ${table.messageReference} is not null and ((${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.canonicalText} is not null)) and ${table.externalMessageReference} is null and ${table.deliveryState} is null and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'interactive_reply' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.interactiveKind} is not null and ${table.interactiveKind} in ('button', 'list') and ${table.interactiveId} is not null and ${table.interactiveTitle} is not null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'message_status' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is not null and ${table.deliveryState} is not null and ${table.deliveryState} in ('sent', 'delivered', 'read', 'failed') and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'media_reference' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.mediaExternalReference} is not null and ${table.mediaDeclaredKind} is not null and ${table.mediaDeclaredKind} in ('image', 'document', 'audio', 'sticker', 'video') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'template_projection' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.templateId} is not null and ${table.templateAuthorityState} is not null and ${table.templateAuthorityState} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and ${table.templateAuthorityVersion} is not null and ${table.templateAuthorityVersion} > 0 and ${table.templateAuthorityUpdatedAt} is not null and ${table.templateProviderReference} is not null and ${table.templateKey} is not null and ${table.templateLocale} is not null and ${table.templateLocale} in ('es', 'en') and ${table.templateCategory} is not null and ${table.templateCategory} in ('authentication', 'marketing', 'utility') and ${table.templateProviderState} is not null and ${table.templateProviderState} in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and ${table.templateProviderVersion} is not null and ${table.templateProviderTimestamp} is not null and ${table.templateComponents} is not null and jsonb_typeof(${table.templateComponents}) = 'array' and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'unsupported_verified' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.unsupportedReason} is not null and ${table.unsupportedReason} in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null)`,
+    ),
+    check(
+      "communication_event_envelopes_field_ownership_valid",
+      sql`(${table.bindingId} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.messageReference} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.externalMessageReference} is null or ${table.eventKind} = 'message_status') and (${table.canonicalText} is null or ${table.eventKind} = 'text_message') and (${table.deliveryState} is null or ${table.eventKind} = 'message_status') and (${table.interactiveKind} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveId} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveTitle} is null or ${table.eventKind} = 'interactive_reply') and (${table.mediaExternalReference} is null or ${table.eventKind} = 'media_reference') and (${table.mediaDeclaredKind} is null or ${table.eventKind} = 'media_reference') and (${table.mediaMimeType} is null or ${table.eventKind} = 'media_reference') and (${table.mediaChecksum} is null or ${table.eventKind} = 'media_reference') and (${table.templateId} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityState} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityUpdatedAt} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderReference} is null or ${table.eventKind} = 'template_projection') and (${table.templateKey} is null or ${table.eventKind} = 'template_projection') and (${table.templateLocale} is null or ${table.eventKind} = 'template_projection') and (${table.templateCategory} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderState} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderTimestamp} is null or ${table.eventKind} = 'template_projection') and (${table.templateComponents} is null or ${table.eventKind} = 'template_projection') and (${table.unsupportedReason} is null or ${table.eventKind} = 'unsupported_verified')`,
+    ),
+    check(
+      "communication_event_envelopes_reference_shape_valid",
+      sql`(${table.participantId} is null or ${table.conversationId} is not null) and (${table.messageId} is null or ${table.conversationId} is not null)`,
+    ),
+    check(
+      "communication_event_envelopes_media_checksum_valid",
+      sql`${table.mediaChecksum} is null or ${table.mediaChecksum} ~ '^[0-9a-f]{64}$'`,
+    ),
+    index("communication_event_envelopes_conversation_idx").on(
+      table.conversationId,
+      table.occurredAt,
+    ),
+    communicationsOnly("communication_event_envelopes"),
+  ],
+).enableRLS();
+
+export const communicationMessageTemplates = pgTable(
+  "communication_message_templates",
+  {
+    id: text("id").primaryKey(),
+    templateKey: varchar("template_key", { length: 120 }).notNull(),
+    locale: varchar("locale", { length: 2 }).notNull(),
+    purpose: varchar("purpose", { length: 24 }).notNull(),
+    definitionSource: varchar("definition_source", { length: 32 }).notNull(),
+    definitionVersion: integer("definition_version").notNull(),
+    variableKeys: jsonb("variable_keys").notNull().default(sql`'[]'::jsonb`),
+    state: varchar("state", { length: 32 }).notNull(),
+    internallyApproved: boolean("internally_approved").notNull().default(false),
+    approvalReceiptId: text("approval_receipt_id"),
+    approvalReceiptIssuedAt: timestamp("approval_receipt_issued_at", { withTimezone: true, mode: "date" }),
+    approvalReceiptValidUntil: timestamp("approval_receipt_valid_until", { withTimezone: true, mode: "date" }),
+    externalReference: text("external_reference"),
+    projectionVersion: integer("projection_version"),
+    providerReceiptId: text("provider_receipt_id"),
+    providerCorrelationId: text("provider_correlation_id"),
+    providerReceiptIssuedAt: timestamp("provider_receipt_issued_at", { withTimezone: true, mode: "date" }),
+    providerReceiptValidUntil: timestamp("provider_receipt_valid_until", { withTimezone: true, mode: "date" }),
+    category: varchar("category", { length: 48 }),
+    observedAt: timestamp("observed_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    unique("communication_message_templates_definition_unique").on(
+      table.templateKey,
+      table.locale,
+      table.definitionVersion,
+    ),
+    check("communication_message_templates_locale_valid", sql`${table.locale} in ('es', 'en')`),
+    check(
+      "communication_message_templates_purpose_valid",
+      sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
+    ),
+    check(
+      "communication_message_templates_source_valid",
+      sql`${table.definitionSource} in ('synthetic_test_fixture', 'approved_policy')`,
+    ),
+    check(
+      "communication_message_templates_state_valid",
+      sql`${table.state} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')`,
+    ),
+    check(
+      "communication_message_templates_variables_valid",
+      sql`jsonb_typeof(${table.variableKeys}) = 'array'`,
+    ),
+    check("communication_message_templates_definition_version_positive", sql`${table.definitionVersion} > 0`),
+    check("communication_message_templates_projection_version_positive", sql`${table.projectionVersion} is null or ${table.projectionVersion} > 0`),
+    check(
+      "communication_message_templates_approval_valid",
+      sql`(${table.internallyApproved} = false and ${table.approvalReceiptId} is null and ${table.approvalReceiptIssuedAt} is null and ${table.approvalReceiptValidUntil} is null) or (${table.internallyApproved} = true and ${table.approvalReceiptId} is not null and ${table.approvalReceiptIssuedAt} is not null and ${table.approvalReceiptValidUntil} > ${table.approvalReceiptIssuedAt})`,
+    ),
+    check(
+      "communication_message_templates_provider_receipt_valid",
+      sql`(${table.providerReceiptId} is null and ${table.providerCorrelationId} is null and ${table.providerReceiptIssuedAt} is null and ${table.providerReceiptValidUntil} is null) or (${table.providerReceiptId} is not null and ${table.providerCorrelationId} is not null and ${table.providerReceiptIssuedAt} is not null and ${table.providerReceiptValidUntil} > ${table.providerReceiptIssuedAt})`,
+    ),
+    index("communication_message_templates_projection_idx").on(table.state, table.observedAt),
+    communicationsOnly("communication_message_templates"),
+  ],
+).enableRLS();
+
+export const communicationOutboundCommands = pgTable(
+  "communication_outbound_commands",
+  {
+    id: text("id").primaryKey(),
+    conversationId: text("conversation_id").notNull(),
+    bindingId: text("binding_id").notNull(),
+    connectionId: text("connection_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    locale: varchar("locale", { length: 2 }).notNull(),
+    purpose: varchar("purpose", { length: 24 }).notNull(),
+    messageReference: text("message_reference"),
+    templateKey: varchar("template_key", { length: 120 }),
+    templateDefinitionVersion: varchar("template_definition_version", { length: 80 }),
+    destinationKey: varchar("destination_key", { length: 120 }),
+    owningReceiptId: text("owning_receipt_id").notNull(),
+    owningDomain: varchar("owning_domain", { length: 80 }).notNull(),
+    owningReference: text("owning_reference").notNull(),
+    owningReceiptIssuedAt: timestamp("owning_receipt_issued_at", { withTimezone: true, mode: "date" }).notNull(),
+    owningReceiptValidUntil: timestamp("owning_receipt_valid_until", { withTimezone: true, mode: "date" }).notNull(),
+    owningReceiptCorrelationId: text("owning_receipt_correlation_id").notNull(),
+    expectedPolicyVersion: integer("expected_policy_version").notNull(),
+    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
+    fingerprint: char("fingerprint", { length: 64 }).notNull(),
+    correlationId: text("correlation_id").notNull(),
+    state: varchar("state", { length: 32 }).notNull(),
+    version: integer("version").notNull(),
+    leaseOwnerId: text("lease_owner_id"),
+    leaseTokenHash: char("lease_token_hash", { length: 64 }),
+    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
+    scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
+    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_outbound_commands_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_outbound_commands_binding_connection_channel_fk",
+      columns: [table.bindingId, table.connectionId, table.channelKind],
+      foreignColumns: [
+        communicationContactBindings.id,
+        communicationContactBindings.connectionId,
+        communicationContactBindings.channelKind,
+      ],
+    }).onDelete("restrict"),
+    unique("communication_outbound_commands_id_connection_unique").on(table.id, table.connectionId),
+    unique("communication_outbound_commands_binding_key_unique").on(
+      table.bindingId,
+      table.idempotencyKey,
+    ),
+    check("communication_outbound_commands_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
+    check(
+      "communication_outbound_commands_fingerprint_valid",
+      sql`${table.fingerprint} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_outbound_commands_lease_token_hash_valid",
+      sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check("communication_outbound_commands_locale_valid", sql`${table.locale} in ('es', 'en')`),
+    check(
+      "communication_outbound_commands_purpose_valid",
+      sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
+    ),
+    check(
+      "communication_outbound_commands_state_valid",
+      sql`${table.state} in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')`,
+    ),
+    check(
+      "communication_outbound_commands_policy_version_positive",
+      sql`${table.expectedPolicyVersion} > 0`,
+    ),
+    check("communication_outbound_commands_version_positive", sql`${table.version} > 0`),
+    check(
+      "communication_outbound_commands_owning_receipt_window_valid",
+      sql`${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt}`,
+    ),
+    check(
+      "communication_outbound_commands_destination_reference_opaque",
+      sql`${table.destinationKey} is null or (char_length(${table.destinationKey}) <= 120 and ${table.destinationKey} ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')`,
+    ),
+    check(
+      "communication_outbound_commands_lease_valid",
+      sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
+    ),
+    check(
+      "communication_outbound_commands_expiry_valid",
+      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}`,
+    ),
+    index("communication_outbound_commands_work_idx").on(
+      table.state,
+      table.leaseExpiresAt,
+      table.scheduledAt,
+    ),
+    communicationsOnly("communication_outbound_commands"),
+  ],
+).enableRLS();
+
+export const communicationDispatchAttempts = pgTable(
+  "communication_dispatch_attempts",
+  {
+    id: text("id").primaryKey(),
+    commandId: text("command_id").notNull(),
+    connectionId: text("connection_id")
+      .notNull()
+      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
+    attemptOrdinal: integer("attempt_ordinal").notNull(),
+    requestIdempotency: boolean("request_idempotency").notNull(),
+    stableReferenceCapability: boolean("stable_reference_capability").notNull(),
+    messageLookupCapability: boolean("message_lookup_capability").notNull(),
+    statusReconciliationCapability: boolean("status_reconciliation_capability").notNull(),
+    mediaReferencesCapability: boolean("media_references_capability").notNull(),
+    templateProjectionCapability: boolean("template_projection_capability").notNull(),
+    capabilityObservedAt: timestamp("capability_observed_at", {
+      withTimezone: true,
+      mode: "date",
+    }).notNull(),
+    expectedPolicyVersion: integer("expected_policy_version").notNull(),
+    requestDigest: char("request_digest", { length: 64 }).notNull(),
+    stableReference: text("stable_reference"),
+    externalMessageReference: text("external_message_reference"),
+    state: varchar("state", { length: 32 }).notNull(),
+    resultCode: varchar("result_code", { length: 32 }),
+    providerIoCapabilityHash: char("provider_io_capability_hash", { length: 64 }),
+    providerIoStartedAt: timestamp("provider_io_started_at", { withTimezone: true, mode: "date" }),
+    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
+    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
+    ...timestamps,
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_dispatch_attempts_command_connection_fk",
+      columns: [table.commandId, table.connectionId],
+      foreignColumns: [
+        communicationOutboundCommands.id,
+        communicationOutboundCommands.connectionId,
+      ],
+    }).onDelete("cascade"),
+    unique("communication_dispatch_attempts_command_ordinal_unique").on(
+      table.commandId,
+      table.attemptOrdinal,
+    ),
+    unique("communication_dispatch_attempts_external_reference_unique").on(
+      table.connectionId,
+      table.externalMessageReference,
+    ),
+    check("communication_dispatch_attempts_ordinal_positive", sql`${table.attemptOrdinal} > 0`),
+    check(
+      "communication_dispatch_attempts_request_digest_valid",
+      sql`${table.requestDigest} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_dispatch_attempts_policy_version_positive",
+      sql`${table.expectedPolicyVersion} > 0`,
+    ),
+    check(
+      "communication_dispatch_attempts_state_valid",
+      sql`${table.state} in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')`,
+    ),
+    check(
+      "communication_dispatch_attempts_result_valid",
+      sql`${table.resultCode} is null or ${table.resultCode} in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')`,
+    ),
+    check(
+      "communication_dispatch_attempts_completion_valid",
+      sql`${table.completedAt} is null or ${table.completedAt} >= ${table.startedAt}`,
+    ),
+    check(
+      "communication_dispatch_attempts_provider_io_capability_valid",
+      sql`(${table.providerIoCapabilityHash} is null and ${table.providerIoStartedAt} is null) or (${table.providerIoCapabilityHash} ~ '^[0-9a-f]{64}$' and ${table.providerIoStartedAt} is not null and ${table.providerIoStartedAt} >= ${table.startedAt})`,
+    ),
+    index("communication_dispatch_attempts_recovery_idx").on(table.state, table.completedAt),
+    communicationsOnly("communication_dispatch_attempts"),
+  ],
+).enableRLS();
+
+export const communicationHandoffs = pgTable(
+  "communication_handoffs",
+  {
+    id: text("id").primaryKey(),
+    conversationId: text("conversation_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    state: varchar("state", { length: 24 }).notNull(),
+    reasonCode: varchar("reason_code", { length: 48 }).notNull(),
+    receiptId: text("receipt_id"),
+    correlationId: text("correlation_id").notNull(),
+    assignedParticipantId: text("assigned_participant_id"),
+    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
+    queuedAt: timestamp("queued_at", { withTimezone: true, mode: "date" }),
+    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
+    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
+    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_handoffs_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("cascade"),
+    foreignKey({
+      name: "communication_handoffs_assignee_conversation_fk",
+      columns: [table.assignedParticipantId, table.conversationId],
+      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
+    }).onDelete("set null"),
+    check(
+      "communication_handoffs_channel_valid",
+      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
+    ),
+    check(
+      "communication_handoffs_state_valid",
+      sql`${table.state} in ('requested', 'queued', 'accepted', 'closed', 'unavailable')`,
+    ),
+    check(
+      "communication_handoffs_reason_valid",
+      sql`${table.reasonCode} in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')`,
+    ),
+    index("communication_handoffs_state_idx").on(table.state, table.updatedAt),
+    ...sharedPolicies("communication_handoffs", table.conversationId, table.channelKind),
+  ],
+).enableRLS();
+
+export const communicationAuditEvents = pgTable(
+  "communication_audit_events",
+  {
+    id: text("id").primaryKey(),
+    sequence: bigint("sequence", { mode: "number" }).notNull(),
+    conversationId: text("conversation_id").notNull(),
+    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
+    eventName: varchar("event_name", { length: 64 }).notNull(),
+    aggregateType: varchar("aggregate_type", { length: 24 }).notNull(),
+    aggregateId: text("aggregate_id").notNull(),
+    resultCode: varchar("result_code", { length: 32 }).notNull(),
+    reasonCode: varchar("reason_code", { length: 48 }),
+    version: integer("version").notNull(),
+    locale: varchar("locale", { length: 2 }),
+    purpose: varchar("purpose", { length: 24 }),
+    policyVersion: integer("policy_version"),
+    correlationId: text("correlation_id").notNull(),
+    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_audit_events_conversation_channel_fk",
+      columns: [table.conversationId, table.channelKind],
+      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
+    }).onDelete("cascade"),
+    unique("communication_audit_events_conversation_sequence_unique").on(
+      table.conversationId,
+      table.sequence,
+    ),
+    check(
+      "communication_audit_events_channel_valid",
+      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
+    ),
+    check("communication_audit_events_sequence_positive", sql`${table.sequence} > 0`),
+    check(
+      "communication_audit_events_locale_valid",
+      sql`${table.locale} is null or ${table.locale} in ('es', 'en')`,
+    ),
+    check(
+      "communication_audit_events_purpose_valid",
+      sql`${table.purpose} is null or ${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
+    ),
+    check(
+      "communication_audit_events_aggregate_valid",
+      sql`${table.aggregateType} in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')`,
+    ),
+    check(
+      "communication_audit_events_result_valid",
+      sql`${table.resultCode} in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')`,
+    ),
+    check("communication_audit_events_version_positive", sql`${table.version} > 0`),
+    check(
+      "communication_audit_events_policy_version_positive",
+      sql`${table.policyVersion} is null or ${table.policyVersion} > 0`,
+    ),
+    index("communication_audit_events_aggregate_idx").on(
+      table.aggregateType,
+      table.aggregateId,
+      table.occurredAt,
+    ),
+    ...sharedPolicies("communication_audit_events", table.conversationId, table.channelKind),
+  ],
+).enableRLS();
+
 export const getPublicChatTableConfig = getTableConfig;
diff --git a/blueprints/project-atlas/workspace/packages/database/tsconfig.json b/blueprints/project-atlas/workspace/packages/database/tsconfig.json
index 5c3012f..39dfe44 100644
--- a/blueprints/project-atlas/workspace/packages/database/tsconfig.json
+++ b/blueprints/project-atlas/workspace/packages/database/tsconfig.json
@@ -1,5 +1,8 @@
 {
   "extends": "../../tsconfig.json",
+  "compilerOptions": {
+    "types": ["node"]
+  },
   "include": ["src/**/*.ts", "src/**/*.tsx", "*.config.ts", "scripts/**/*.ts"],
   "exclude": ["node_modules/**"]
 }
diff --git a/blueprints/project-atlas/workspace/pnpm-lock.yaml b/blueprints/project-atlas/workspace/pnpm-lock.yaml
index df47985..5666295 100644
--- a/blueprints/project-atlas/workspace/pnpm-lock.yaml
+++ b/blueprints/project-atlas/workspace/pnpm-lock.yaml
@@ -48,20 +48,23 @@ importers:
         version: 6.0.3
       vitest:
         specifier: 4.1.10
         version: 4.1.10(@opentelemetry/api@1.9.1)(@types/node@24.13.3)(vite@8.2.1(@types/node@24.13.3)(esbuild@0.25.12)(jiti@2.7.0)(terser@5.49.2)(tsx@4.23.1)(yaml@2.9.0))
 
   apps/app:
     dependencies:
       '@atlas/config':
         specifier: workspace:*
         version: link:../../packages/config
+      '@atlas/database':
+        specifier: workspace:*
+        version: link:../../packages/database
       '@atlas/domain':
         specifier: workspace:*
         version: link:../../packages/domain
       '@atlas/ui':
         specifier: workspace:*
         version: link:../../packages/ui
       '@tailwindcss/postcss':
         specifier: 4.3.3
         version: 4.3.3
       next:
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-contact-evidence.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-contact-evidence.test.ts
new file mode 100644
index 0000000..d6c7042
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-contact-evidence.test.ts
@@ -0,0 +1,269 @@
+import { describe, expect, it } from "vitest";
+import {
+  type PersistedContactEvidenceEvent,
+  reconstructContactControlState,
+} from "../../packages/database/src/communication-contact-evidence.ts";
+
+function event(
+  sequence: number,
+  input: Omit<PersistedContactEvidenceEvent, "sequence" | "evidenceReceiptId" | "receiptKind">,
+): PersistedContactEvidenceEvent {
+  const receiptKind = {
+    consent_granted: "consent_evidence",
+    consent_withdrawn: "contact_withdrawal",
+    consent_regranted: "consent_evidence",
+    ambiguous_opt_out_detected: "ambiguous_opt_out_detection",
+    ambiguous_opt_out_cleared: "ambiguous_opt_out_resolution",
+    ambiguous_opt_out_withdrawn: "ambiguous_opt_out_resolution",
+    binding_suspended: "binding_suspension",
+    binding_revalidated: "binding_revalidation",
+  } as const;
+  return {
+    ...input,
+    sequence,
+    evidenceReceiptId: `receipt_${sequence}`,
+    receiptKind: receiptKind[input.eventKind],
+  };
+}
+
+function consentEvent(
+  sequence: number,
+  input: Pick<PersistedContactEvidenceEvent, "eventKind" | "consentState" | "fenceState"> &
+    Partial<Pick<PersistedContactEvidenceEvent, "reviewResolution">>,
+): PersistedContactEvidenceEvent {
+  return event(sequence, {
+    ...input,
+    purpose: "conversational",
+    bindingTrustState: null,
+    reviewResolution: input.reviewResolution ?? null,
+    authorityVersion: sequence,
+  });
+}
+
+describe("M004 durable contact evidence reconstruction", () => {
+  it("reconstructs grant, withdrawal and receipt-specific reconsent after restart", () => {
+    const state = reconstructContactControlState([
+      consentEvent(1, {
+        eventKind: "consent_granted",
+        consentState: "granted",
+        fenceState: "normal",
+      }),
+      consentEvent(2, {
+        eventKind: "consent_withdrawn",
+        consentState: "withdrawn",
+        fenceState: "withdrawn",
+      }),
+      consentEvent(3, {
+        eventKind: "consent_regranted",
+        consentState: "granted",
+        fenceState: "normal_after_review",
+      }),
+    ]);
+    expect(state.policies.conversational).toEqual({
+      authorityVersion: 3,
+      consentState: "granted",
+      fenceState: "normal_after_review",
+      evidenceReceiptId: "receipt_3",
+    });
+  });
+
+  it("preserves granted consent and advances its authority after ambiguous opt-out is cleared", () => {
+    const state = reconstructContactControlState([
+      consentEvent(1, {
+        eventKind: "consent_granted",
+        consentState: "granted",
+        fenceState: "normal",
+      }),
+      consentEvent(2, {
+        eventKind: "ambiguous_opt_out_detected",
+        consentState: "granted",
+        fenceState: "opt_out_pending",
+      }),
+      consentEvent(3, {
+        eventKind: "ambiguous_opt_out_cleared",
+        consentState: "granted",
+        fenceState: "normal_after_review",
+        reviewResolution: "clear",
+      }),
+    ]);
+    expect(state.policies.conversational).toEqual({
+      authorityVersion: 3,
+      consentState: "granted",
+      fenceState: "normal_after_review",
+      evidenceReceiptId: "receipt_3",
+    });
+  });
+
+  it("reconstructs a reviewed ambiguous withdrawal", () => {
+    const state = reconstructContactControlState([
+      consentEvent(1, {
+        eventKind: "consent_granted",
+        consentState: "granted",
+        fenceState: "normal",
+      }),
+      consentEvent(2, {
+        eventKind: "ambiguous_opt_out_detected",
+        consentState: "granted",
+        fenceState: "opt_out_pending",
+      }),
+      consentEvent(3, {
+        eventKind: "ambiguous_opt_out_withdrawn",
+        consentState: "withdrawn",
+        fenceState: "withdrawn",
+        reviewResolution: "withdraw",
+      }),
+    ]);
+    expect(state.policies.conversational?.consentState).toBe("withdrawn");
+  });
+
+  it("reconstructs suspension followed by receipt-specific revalidation", () => {
+    const state = reconstructContactControlState([
+      event(1, {
+        eventKind: "binding_suspended",
+        purpose: null,
+        consentState: null,
+        fenceState: null,
+        bindingTrustState: "suspended",
+        reviewResolution: null,
+        authorityVersion: null,
+      }),
+      event(2, {
+        eventKind: "binding_revalidated",
+        purpose: null,
+        consentState: null,
+        fenceState: null,
+        bindingTrustState: "reverified",
+        reviewResolution: null,
+        authorityVersion: null,
+      }),
+    ]);
+    expect(state.bindingTrustState).toBe("reverified");
+  });
+
+  it.each([
+    [
+      "clearing without a pending review",
+      [
+        consentEvent(1, {
+          eventKind: "consent_granted",
+          consentState: "granted",
+          fenceState: "normal",
+        }),
+        consentEvent(2, {
+          eventKind: "ambiguous_opt_out_cleared",
+          consentState: "granted",
+          fenceState: "normal_after_review",
+          reviewResolution: "clear",
+        }),
+      ],
+    ],
+    [
+      "null-overwriting a clear outcome",
+      [
+        consentEvent(1, {
+          eventKind: "consent_granted",
+          consentState: "granted",
+          fenceState: "normal",
+        }),
+        consentEvent(2, {
+          eventKind: "ambiguous_opt_out_detected",
+          consentState: "granted",
+          fenceState: "opt_out_pending",
+        }),
+        {
+          ...consentEvent(3, {
+            eventKind: "ambiguous_opt_out_cleared",
+            consentState: "granted",
+            fenceState: "normal_after_review",
+            reviewResolution: "clear",
+          }),
+          consentState: null,
+        },
+      ],
+    ],
+    [
+      "revalidating without suspension",
+      [
+        event(1, {
+          eventKind: "binding_revalidated",
+          purpose: null,
+          consentState: null,
+          fenceState: null,
+          bindingTrustState: "reverified",
+          reviewResolution: null,
+          authorityVersion: null,
+        }),
+      ],
+    ],
+    [
+      "accepting an out-of-order sequence",
+      [
+        consentEvent(2, {
+          eventKind: "consent_granted",
+          consentState: "granted",
+          fenceState: "normal",
+        }),
+        consentEvent(1, {
+          eventKind: "consent_withdrawn",
+          consentState: "withdrawn",
+          fenceState: "withdrawn",
+        }),
+      ],
+    ],
+    [
+      "accepting an authority version regression",
+      [
+        consentEvent(1, {
+          eventKind: "consent_granted",
+          consentState: "granted",
+          fenceState: "normal",
+        }),
+        {
+          ...consentEvent(2, {
+            eventKind: "consent_withdrawn",
+            consentState: "withdrawn",
+            fenceState: "withdrawn",
+          }),
+          authorityVersion: 1,
+        },
+      ],
+    ],
+  ] satisfies readonly [string, readonly PersistedContactEvidenceEvent[]][])(
+    "fails closed instead of %s",
+    (_label, history) => {
+      expect(() => reconstructContactControlState(history)).toThrowError(
+        "CONTACT_EVIDENCE_HISTORY_INVALID",
+      );
+    },
+  );
+
+  it("fails closed on duplicate receipt evidence", () => {
+    const first = consentEvent(1, {
+      eventKind: "consent_granted",
+      consentState: "granted",
+      fenceState: "normal",
+    });
+    const second = consentEvent(2, {
+      eventKind: "consent_withdrawn",
+      consentState: "withdrawn",
+      fenceState: "withdrawn",
+    });
+    expect(() =>
+      reconstructContactControlState([
+        first,
+        { ...second, evidenceReceiptId: first.evidenceReceiptId },
+      ]),
+    ).toThrowError("CONTACT_EVIDENCE_HISTORY_INVALID");
+  });
+
+  it("fails closed when evidence uses a receipt kind from a different transition", () => {
+    const granted = consentEvent(1, {
+      eventKind: "consent_granted",
+      consentState: "granted",
+      fenceState: "normal",
+    });
+    expect(() =>
+      reconstructContactControlState([{ ...granted, receiptKind: "binding_revalidation" }]),
+    ).toThrowError("CONTACT_EVIDENCE_HISTORY_INVALID");
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts
new file mode 100644
index 0000000..99f3a5b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts
@@ -0,0 +1,271 @@
+import { describe, expect, it } from "vitest";
+import type {
+  CanonicalProviderEnvelope,
+  UnsupportedVerifiedEnvelope,
+} from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
+import {
+  deserializeMetaCanonicalEnvelopeRecord,
+  serializeMetaCanonicalEnvelope,
+} from "../../apps/app/src/lib/whatsapp/provider-envelope-persistence.ts";
+import { validateCommunicationEventRecord } from "../../packages/database/src/communication-event-envelope.ts";
+
+const occurredAt = new Date("2026-08-14T10:00:00.000Z");
+const receivedAt = new Date("2026-08-14T10:00:01.000Z");
+const base = {
+  connectionId: "connection_synthetic",
+  externalEventReference: "event_synthetic",
+  correlationId: "correlation_synthetic",
+  receivedAt,
+};
+
+const providerFixtures = [
+  {
+    ...base,
+    kind: "text_message",
+    messageReference: "message_text",
+    senderEndpoint: "sender_endpoint_synthetic_text",
+    text: "synthetic text",
+    occurredAt,
+  },
+  {
+    ...base,
+    kind: "interactive_reply",
+    messageReference: "message_interactive",
+    senderEndpoint: "sender_endpoint_synthetic_interactive",
+    replyKind: "button",
+    replyId: "service_credit",
+    replyTitle: "Credit",
+    occurredAt,
+  },
+  {
+    ...base,
+    kind: "message_status",
+    externalMessageReference: "message_status",
+    status: "delivered",
+    occurredAt,
+  },
+  {
+    ...base,
+    kind: "media_reference",
+    messageReference: "message_media",
+    senderEndpoint: "sender_endpoint_synthetic_media",
+    occurredAt,
+    media: {
+      externalReference: "media_synthetic",
+      declaredKind: "sticker",
+      mimeType: "image/webp",
+      checksum: "a".repeat(64),
+    },
+  },
+  {
+    ...base,
+    kind: "template_projection",
+    projection: {
+      templateId: "template_synthetic",
+      locale: "es",
+      state: "internally_approved",
+      version: 3,
+      updatedAt: occurredAt,
+      providerReference: "provider_template_synthetic",
+      templateKey: "appointment_notice",
+      category: "utility",
+      components: [{ type: "body", format: "text", text: "Synthetic" }],
+      status: "provider_approved",
+      providerVersion: "provider.synthetic.v1",
+      providerTimestamp: occurredAt,
+    },
+  },
+  {
+    kind: "unsupported_verified",
+    connectionId: "connection_synthetic",
+    reason: "unsupported_event",
+    receivedAt,
+    correlationId: "correlation_synthetic",
+  },
+] satisfies readonly (CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope)[];
+
+const safeExpected = [
+  {
+    ...providerFixtures[0],
+    senderEndpoint: undefined,
+    senderBindingId: "binding_synthetic",
+  },
+  {
+    ...providerFixtures[1],
+    senderEndpoint: undefined,
+    senderBindingId: "binding_synthetic",
+  },
+  providerFixtures[2],
+  {
+    ...providerFixtures[3],
+    senderEndpoint: undefined,
+    senderBindingId: "binding_synthetic",
+  },
+  providerFixtures[4],
+  providerFixtures[5],
+].map((fixture) => {
+  const { senderEndpoint: _discarded, ...safe } = fixture as typeof fixture & {
+    senderEndpoint?: string;
+  };
+  return safe;
+});
+describe("M004 deterministic Meta envelope persistence codec", () => {
+  it.each(providerFixtures.map((event, index) => ({ event, index, kind: event.kind })))(
+    "round-trips the real $kind variant into its safe persisted projection",
+    ({ event, index }) => {
+      const record = serializeMetaCanonicalEnvelope(event, {
+        schemaVersion: "meta-envelope.v1",
+        senderBindingId: "binding_synthetic",
+        textRetentionPolicy: "synthetic_local_text",
+      });
+      expect(validateCommunicationEventRecord(record)).toBe(record);
+      expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
+        status: "available",
+        envelope: safeExpected[index],
+      });
+      expect(JSON.stringify(record)).not.toContain("sender_endpoint_synthetic");
+      expect(Object.keys(record)).not.toEqual(
+        expect.arrayContaining([
+          "rawPayload",
+          "providerPayload",
+          "senderEndpoint",
+          "providerError",
+        ]),
+      );
+    },
+  );
+
+  it("uses the status externalMessageReference and persists every provider template authority field", () => {
+    const status = serializeMetaCanonicalEnvelope(providerFixtures[2], {
+      schemaVersion: "meta-envelope.v1",
+    });
+    expect(status.externalMessageReference).toBe("message_status");
+    expect(status.messageReference).toBeNull();
+
+    const template = serializeMetaCanonicalEnvelope(providerFixtures[4], {
+      schemaVersion: "meta-envelope.v1",
+    });
+    expect(template).toMatchObject({
+      templateId: "template_synthetic",
+      templateAuthorityState: "internally_approved",
+      templateAuthorityVersion: 3,
+      templateAuthorityUpdatedAt: occurredAt,
+      templateProviderReference: "provider_template_synthetic",
+      templateProviderState: "provider_approved",
+      templateProviderVersion: "provider.synthetic.v1",
+      templateProviderTimestamp: occurredAt,
+    });
+  });
+
+  it("accepts metadata-only text without retaining canonical text", () => {
+    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
+      schemaVersion: "meta-envelope.v1",
+      senderBindingId: "binding_synthetic",
+      textRetentionPolicy: "metadata_only",
+    });
+
+    expect(record).toMatchObject({
+      eventKind: "text_message",
+      canonicalText: null,
+      bodyRetentionPolicy: "metadata_only",
+    });
+    expect(validateCommunicationEventRecord(record)).toBe(record);
+    expect(deserializeMetaCanonicalEnvelopeRecord(record)).toEqual({
+      status: "not_reversible",
+      eventKind: "text_message",
+      reason: "metadata_only",
+    });
+  });
+
+  it("defaults text persistence to metadata-only when no retention gate is supplied", () => {
+    const record = serializeMetaCanonicalEnvelope(providerFixtures[0], {
+      schemaVersion: "meta-envelope.v1",
+      senderBindingId: "binding_synthetic",
+    });
+
+    expect(record.canonicalText).toBeNull();
+    expect(record.bodyRetentionPolicy).toBe("metadata_only");
+  });
+
+  it("does not invent an external event reference for unsupported verified input", () => {
+    const record = serializeMetaCanonicalEnvelope(providerFixtures[5], {
+      schemaVersion: "meta-envelope.v1",
+    });
+    expect(record.externalEventReference).toBeNull();
+  });
+
+  it.each([
+    {
+      label: "top-level provider key",
+      event: { ...providerFixtures[0], rawPayload: "forbidden" },
+    },
+    {
+      label: "nested media key",
+      event: {
+        ...providerFixtures[3],
+        media: {
+          ...(
+            providerFixtures[3] as Extract<CanonicalProviderEnvelope, { kind: "media_reference" }>
+          ).media,
+          url: "forbidden",
+        },
+      },
+    },
+    {
+      label: "nested template component key",
+      event: {
+        ...providerFixtures[4],
+        projection: {
+          ...(
+            providerFixtures[4] as Extract<
+              CanonicalProviderEnvelope,
+              { kind: "template_projection" }
+            >
+          ).projection,
+          components: [{ type: "body", format: "text", text: "Synthetic", payload: "forbidden" }],
+        },
+      },
+    },
+    {
+      label: "unsupported external event reference",
+      event: { ...providerFixtures[5], externalEventReference: "invented" },
+    },
+  ])("rejects an unexpected $label instead of persisting it", ({ event }) => {
+    expect(() =>
+      serializeMetaCanonicalEnvelope(event as CanonicalProviderEnvelope, {
+        schemaVersion: "meta-envelope.v1",
+        senderBindingId: "binding_synthetic",
+        textRetentionPolicy: "synthetic_local_text",
+      }),
+    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_INVALID");
+  });
+
+  it("requires a safe binding reference instead of retaining a raw sender endpoint", () => {
+    expect(() =>
+      serializeMetaCanonicalEnvelope(providerFixtures[0], {
+        schemaVersion: "meta-envelope.v1",
+        textRetentionPolicy: "synthetic_local_text",
+      }),
+    ).toThrowError("CANONICAL_PROVIDER_ENVELOPE_BINDING_REQUIRED");
+  });
+
+  it.each([
+    ["text_message", "canonicalText"],
+    ["interactive_reply", "interactiveKind"],
+    ["message_status", "externalMessageReference"],
+    ["media_reference", "mediaExternalReference"],
+    ["template_projection", "templateProviderReference"],
+    ["unsupported_verified", "unsupportedReason"],
+  ] as const)("rejects a PostgreSQL-nullable required field for %s", (kind, field) => {
+    const fixture = providerFixtures.find((event) => event.kind === kind);
+    if (!fixture) throw new Error("TEST_FIXTURE_NOT_FOUND");
+    const record = serializeMetaCanonicalEnvelope(fixture, {
+      schemaVersion: "meta-envelope.v1",
+      senderBindingId: "binding_synthetic",
+      textRetentionPolicy: "synthetic_local_text",
+    });
+    expect(() => validateCommunicationEventRecord({ ...record, [field]: null })).toThrowError(
+      "COMMUNICATION_EVENT_RECORD_INVALID",
+    );
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
new file mode 100644
index 0000000..6f562bf
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -0,0 +1,1280 @@
+import { existsSync, readdirSync, readFileSync } from "node:fs";
+import { fileURLToPath } from "node:url";
+import { describe, expect, it } from "vitest";
+import {
+  assertLoopbackCommunicationsDatabaseUrl,
+  communicationsRuntimeRoleNames,
+} from "../../packages/database/scripts/provision-communications-runtime.ts";
+import {
+  createPublicChatSql,
+  type PublicChatSql,
+} from "../../packages/database/src/postgres-public-chat-store.ts";
+import * as databaseSchema from "../../packages/database/src/schema.ts";
+
+const REQUIRED_TABLE_EXPORTS = [
+  "communicationChannelConnections",
+  "communicationContactBindings",
+  "communicationContactPolicies",
+  "communicationContactEvidenceEvents",
+  "communicationConversations",
+  "communicationParticipants",
+  "publicChatConversationSessions",
+  "communicationMessages",
+  "communicationProviderEventReceipts",
+  "communicationEventEnvelopes",
+  "communicationMessageTemplates",
+  "communicationOutboundCommands",
+  "communicationDispatchAttempts",
+  "communicationHandoffs",
+  "communicationAuditEvents",
+] as const;
+
+const SHARED_TABLE_EXPORTS = [
+  "communicationConversations",
+  "communicationParticipants",
+  "communicationMessages",
+  "communicationHandoffs",
+  "communicationAuditEvents",
+] as const;
+
+const M004_ONLY_TABLE_EXPORTS = [
+  "communicationChannelConnections",
+  "communicationContactBindings",
+  "communicationContactPolicies",
+  "communicationProviderEventReceipts",
+  "communicationEventEnvelopes",
+  "communicationMessageTemplates",
+  "communicationOutboundCommands",
+  "communicationDispatchAttempts",
+] as const;
+
+type TableConfig = ReturnType<typeof databaseSchema.getPublicChatTableConfig>;
+
+function tableConfig(exportName: (typeof REQUIRED_TABLE_EXPORTS)[number]): TableConfig {
+  const table = (databaseSchema as Record<string, unknown>)[exportName];
+  expect(table, `${exportName} must be exported by the Drizzle schema`).toBeDefined();
+  return databaseSchema.getPublicChatTableConfig(
+    table as Parameters<typeof databaseSchema.getPublicChatTableConfig>[0],
+  );
+}
+
+function policyRoleName(role: unknown): string {
+  if (typeof role === "string") return role;
+  if (role && typeof role === "object" && "name" in role) return String(role.name);
+  return String(role);
+}
+
+function migrationDirectory(): string {
+  return fileURLToPath(new URL("../../drizzle/", import.meta.url));
+}
+
+function currentM004Migrations(): { bootstrap: string; structural: string; backfill: string } {
+  const directory = migrationDirectory();
+  const names = readdirSync(directory).filter((name) => /^000[678]_.*\.sql$/u.test(name));
+  const bootstrap = names.find((name) => name === "0006_m004_communications_role_bootstrap.sql");
+  const structural = names.find((name) =>
+    /^0007_(?!m004_communications_backfill).*\.sql$/u.test(name),
+  );
+  const backfill = names.find((name) => name === "0008_m004_communications_backfill.sql");
+  expect(bootstrap, "the generated custom 0006 role bootstrap is required").toBeDefined();
+  expect(structural, "one generated 0007 structural migration is required").toBeDefined();
+  expect(backfill, "the generated custom 0008 backfill migration is required").toBeDefined();
+  return { bootstrap: bootstrap ?? "", structural: structural ?? "", backfill: backfill ?? "" };
+}
+
+const BACKFILL_PARITY_FRAGMENTS = [
+  {
+    fragment: "SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id",
+    count: 2,
+  },
+  {
+    fragment:
+      "SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version",
+    count: 2,
+  },
+  { fragment: "NULL::text, h.requested_at, h.queued_at,", count: 2 },
+  { fragment: "NULL::timestamptz, NULL::timestamptz, h.updated_at", count: 2 },
+  {
+    fragment:
+      "      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at",
+    count: 2,
+  },
+] as const;
+
+function assertBackfillParityContract(sql: string): void {
+  for (const { count, fragment } of BACKFILL_PARITY_FRAGMENTS) {
+    if (sql.split(fragment).length - 1 !== count) {
+      throw new Error(`M004_TEST_PARITY_FRAGMENT_MISSING:${fragment}`);
+    }
+  }
+}
+
+function assertDisposablePostgresUrl(rawUrl: string): void {
+  const url = assertLoopbackCommunicationsDatabaseUrl(rawUrl);
+  if (!/^atlas_m004_(fresh|upgrade|rls|role_a|role_b)(?:_|$)/u.test(url.pathname.slice(1))) {
+    throw new Error("M004_INTEGRATION_REQUIRES_NAMED_DISPOSABLE_DATABASE");
+  }
+}
+
+async function applyMigrationRange(sql: PublicChatSql, first: number, last: number): Promise<void> {
+  const migrations = readdirSync(migrationDirectory())
+    .filter((name) => /^\d{4}_.*\.sql$/u.test(name))
+    .sort();
+  for (const migration of migrations) {
+    const index = Number.parseInt(migration.slice(0, 4), 10);
+    if (index < first || index > last) continue;
+    const body = readFileSync(`${migrationDirectory()}${migration}`, "utf8");
+    for (const statement of body.split("--> statement-breakpoint")) {
+      if (statement.trim()) await sql.unsafe(statement);
+    }
+  }
+}
+
+async function seedSyntheticM003(sql: PublicChatSql): Promise<void> {
+  const now = new Date("2026-08-13T18:00:00.000Z");
+  const later = new Date("2026-08-13T18:05:00.000Z");
+  const third = new Date("2026-08-13T18:06:00.000Z");
+  const fourth = new Date("2026-08-13T18:07:00.000Z");
+  const fifth = new Date("2026-08-13T18:08:00.000Z");
+  const sixth = new Date("2026-08-13T18:09:00.000Z");
+  const seventh = new Date("2026-08-13T18:10:00.000Z");
+  const eighth = new Date("2026-08-13T18:11:00.000Z");
+  const expiry = new Date("2026-08-13T18:30:00.000Z");
+  await sql.begin(async (tx) => {
+    await tx.unsafe("set local role atlas_public_chat_gateway");
+    await tx`
+      insert into public_chat_sessions (
+        id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
+      ) values (
+        'session_m004_upgrade', ${"a".repeat(64)}, ${"b".repeat(64)},
+        'correlation_m004_upgrade', ${expiry}, ${now}, ${now}
+      )
+    `;
+    await tx`
+      insert into public_chat_conversations (
+        id, session_id, version, locale, status, notice_version, correlation_id,
+        last_activity_at, expires_at, reconciliation_required, created_at, updated_at,
+        start_idempotency_key, start_fingerprint
+      ) values (
+        'conversation_m004_upgrade', 'session_m004_upgrade', 3, 'es', 'waiting_for_human',
+        'public-chat-notice.v1', 'correlation_m004_upgrade', ${later}, ${expiry}, false,
+        ${now}, ${later}, 'start_m004_upgrade', ${"c".repeat(64)}
+      )
+    `;
+    await tx`
+      insert into public_chat_messages (
+        id, conversation_id, ordinal, actor, state, body, body_stored, actions,
+        rejection_reason, created_at
+      ) values
+        ('message_m004_upgrade_1', 'conversation_m004_upgrade', 1, 'visitor', 'accepted',
+          null, false, '[]'::jsonb, null, ${now}),
+        ('message_m004_upgrade_2', 'conversation_m004_upgrade', 2, 'assistant', 'answered',
+          'synthetic answer', true, '[]'::jsonb, null, ${later}),
+        ('message_m004_upgrade_3', 'conversation_m004_upgrade', 3, 'human', 'failed',
+          null, false, '[]'::jsonb, 'synthetic_failure', ${third}),
+        ('message_m004_upgrade_4', 'conversation_m004_upgrade', 4, 'system', 'handoff_required',
+          null, false, '[]'::jsonb, null, ${fourth})
+    `;
+    await tx`
+      insert into public_chat_handoffs (
+        id, conversation_id, status, reason, receipt_id, requested_at, queued_at, updated_at
+      ) values (
+        'handoff_m004_upgrade', 'conversation_m004_upgrade', 'waiting_for_human',
+        'visitor_requested', 'receipt_m004_upgrade', ${now}, ${later}, ${later}
+      )
+    `;
+    await tx`
+      insert into public_chat_audit_events (
+        id, sequence, conversation_id, event_name, reason, version, locale,
+        correlation_id, created_at
+      ) values
+        ('audit_m004_upgrade_1', 1, 'conversation_m004_upgrade',
+          'chat_conversation_started', null, 1, 'es', 'correlation_m004_upgrade', ${now}),
+        ('audit_m004_upgrade_2', 2, 'conversation_m004_upgrade',
+          'chat_message_accepted', null, 2, 'es', 'correlation_m004_upgrade', ${now}),
+        ('audit_m004_upgrade_3', 3, 'conversation_m004_upgrade',
+          'chat_message_rejected', 'synthetic_failure', 3, 'es',
+          'correlation_m004_upgrade', ${third}),
+        ('audit_m004_upgrade_4', 4, 'conversation_m004_upgrade',
+          'chat_response_failed', 'synthetic_failure', 4, 'es',
+          'correlation_m004_upgrade', ${fourth}),
+        ('audit_m004_upgrade_5', 5, 'conversation_m004_upgrade',
+          'chat_handoff_requested', 'visitor_requested', 5, 'es',
+          'correlation_m004_upgrade', ${fifth}),
+        ('audit_m004_upgrade_6', 6, 'conversation_m004_upgrade',
+          'chat_handoff_queued', 'visitor_requested', 6, 'es',
+          'correlation_m004_upgrade', ${sixth}),
+        ('audit_m004_upgrade_7', 7, 'conversation_m004_upgrade',
+          'chat_locale_changed', null, 7, 'es', 'correlation_m004_upgrade', ${seventh}),
+        ('audit_m004_upgrade_8', 8, 'conversation_m004_upgrade',
+          'chat_conversation_closed', null, 8, 'es', 'correlation_m004_upgrade', ${eighth})
+    `;
+  });
+}
+
+describe("M004 canonical communications Drizzle schema", () => {
+  it("defines every preparatory table with RLS and an opaque primary key", () => {
+    for (const exportName of REQUIRED_TABLE_EXPORTS) {
+      const config = tableConfig(exportName);
+      expect(config.enableRLS, `${config.name} must enable RLS`).toBe(true);
+      expect(config.columns.find((column) => column.name === "id")?.primary).toBe(true);
+    }
+  });
+
+  it("has no raw endpoint, credential, URL, provider-payload, or payment-card column", () => {
+    const prohibited = new Set([
+      "phone",
+      "phone_number",
+      "access_token",
+      "verify_token",
+      "credential",
+      "secret",
+      "url",
+      "raw_payload",
+      "provider_payload",
+      "pan",
+      "cvv",
+      "card_number",
+    ]);
+    for (const exportName of REQUIRED_TABLE_EXPORTS) {
+      const columns = tableConfig(exportName).columns.map((column) => column.name);
+      expect(columns.filter((column) => prohibited.has(column))).toEqual([]);
+    }
+
+    const bindingColumns = tableConfig("communicationContactBindings").columns.map(
+      (column) => column.name,
+    );
+    expect(bindingColumns).toEqual(
+      expect.arrayContaining(["endpoint_digest", "endpoint_digest_key_version"]),
+    );
+
+    const messageColumns = tableConfig("communicationMessages").columns.map(
+      (column) => column.name,
+    );
+    expect(messageColumns).toEqual(
+      expect.arrayContaining(["body", "body_stored", "body_retention_policy"]),
+    );
+    const envelopeColumns = tableConfig("communicationEventEnvelopes").columns.map(
+      (column) => column.name,
+    );
+    expect(envelopeColumns).toEqual(
+      expect.arrayContaining([
+        "canonical_text",
+        "body_retention_policy",
+        "schema_version",
+        "external_message_reference",
+        "template_provider_reference",
+        "template_provider_version",
+        "template_provider_timestamp",
+      ]),
+    );
+  });
+
+  it("enforces exact discriminator checks and durable identity invariants", () => {
+    const expectedChecks: Record<string, readonly string[]> = {
+      communicationChannelConnections: [
+        "communication_channel_connections_channel_valid",
+        "communication_channel_connections_readiness_valid",
+      ],
+      communicationContactBindings: [
+        "communication_contact_bindings_channel_valid",
+        "communication_contact_bindings_trust_valid",
+        "communication_contact_bindings_locale_valid",
+      ],
+      communicationContactPolicies: [
+        "communication_contact_policies_purpose_valid",
+        "communication_contact_policies_consent_valid",
+        "communication_contact_policies_fence_valid",
+      ],
+      communicationContactEvidenceEvents: [
+        "communication_contact_evidence_events_kind_valid",
+        "communication_contact_evidence_events_authority_valid",
+        "communication_contact_evidence_events_receipt_valid",
+        "communication_contact_evidence_events_state_shape_valid",
+        "communication_contact_evidence_events_sequence_positive",
+      ],
+      communicationConversations: [
+        "communication_conversations_channel_valid",
+        "communication_conversations_locale_valid",
+        "communication_conversations_status_valid",
+        "communication_conversations_version_positive",
+      ],
+      communicationParticipants: ["communication_participants_kind_valid"],
+      communicationMessages: [
+        "communication_messages_channel_valid",
+        "communication_messages_direction_valid",
+        "communication_messages_locale_valid",
+        "communication_messages_kind_valid",
+        "communication_messages_state_valid",
+        "communication_messages_body_retention_valid",
+      ],
+      communicationProviderEventReceipts: [
+        "communication_provider_event_receipts_kind_valid",
+        "communication_provider_event_receipts_state_valid",
+      ],
+      communicationEventEnvelopes: [
+        "communication_event_envelopes_kind_valid",
+        "communication_event_envelopes_retention_valid",
+        "communication_event_envelopes_typed_shape_valid",
+        "communication_event_envelopes_reference_shape_valid",
+      ],
+      communicationMessageTemplates: [
+        "communication_message_templates_locale_valid",
+        "communication_message_templates_purpose_valid",
+        "communication_message_templates_state_valid",
+      ],
+      communicationOutboundCommands: [
+        "communication_outbound_commands_channel_valid",
+        "communication_outbound_commands_locale_valid",
+        "communication_outbound_commands_purpose_valid",
+        "communication_outbound_commands_state_valid",
+      ],
+      communicationDispatchAttempts: [
+        "communication_dispatch_attempts_state_valid",
+        "communication_dispatch_attempts_result_valid",
+      ],
+      communicationHandoffs: [
+        "communication_handoffs_state_valid",
+        "communication_handoffs_reason_valid",
+      ],
+      communicationAuditEvents: [
+        "communication_audit_events_channel_valid",
+        "communication_audit_events_locale_valid",
+        "communication_audit_events_purpose_valid",
+        "communication_audit_events_aggregate_valid",
+        "communication_audit_events_result_valid",
+      ],
+    };
+    for (const [exportName, names] of Object.entries(expectedChecks)) {
+      const checks = tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
+        (constraint) => constraint.name,
+      );
+      expect(checks).toEqual(expect.arrayContaining(names));
+    }
+
+    expect(
+      tableConfig("communicationContactBindings").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toEqual(
+      expect.arrayContaining([
+        "communication_contact_bindings_endpoint_unique",
+        "communication_contact_bindings_id_channel_unique",
+      ]),
+    );
+    expect(
+      tableConfig("communicationProviderEventReceipts").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("communication_provider_event_receipts_identity_unique");
+    expect(
+      tableConfig("communicationOutboundCommands").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("communication_outbound_commands_binding_key_unique");
+    expect(
+      tableConfig("communicationDispatchAttempts").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("communication_dispatch_attempts_command_ordinal_unique");
+    expect(
+      tableConfig("communicationMessages").uniqueConstraints.map((constraint) => constraint.name),
+    ).toContain("communication_messages_conversation_ordinal_unique");
+    expect(
+      tableConfig("communicationAuditEvents").uniqueConstraints.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("communication_audit_events_conversation_sequence_unique");
+
+    expect(
+      tableConfig("communicationParticipants").foreignKeys.map((key) => key.getName()),
+    ).toEqual(
+      expect.arrayContaining([
+        "communication_participants_conversation_channel_fk",
+        "communication_participants_binding_channel_fk",
+      ]),
+    );
+    expect(tableConfig("communicationMessages").foreignKeys.map((key) => key.getName())).toEqual(
+      expect.arrayContaining([
+        "communication_messages_conversation_channel_fk",
+        "communication_messages_sender_conversation_fk",
+        "communication_messages_recipient_conversation_fk",
+      ]),
+    );
+    expect(
+      tableConfig("publicChatConversationSessions").foreignKeys.map((key) => key.getName()),
+    ).toEqual(
+      expect.arrayContaining([
+        "public_chat_conversation_sessions_conversation_channel_fk",
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+        "public_chat_conversation_sessions_participant_conversation_channel_fk",
+      ]),
+    );
+    expect(tableConfig("communicationHandoffs").foreignKeys.map((key) => key.getName())).toEqual(
+      expect.arrayContaining([
+        "communication_handoffs_conversation_channel_fk",
+        "communication_handoffs_assignee_conversation_fk",
+      ]),
+    );
+    expect(
+      tableConfig("communicationOutboundCommands").foreignKeys.map((key) => key.getName()),
+    ).toEqual(
+      expect.arrayContaining([
+        "communication_outbound_commands_conversation_channel_fk",
+        "communication_outbound_commands_binding_connection_channel_fk",
+      ]),
+    );
+    expect(
+      tableConfig("communicationDispatchAttempts").foreignKeys.map((key) => key.getName()),
+    ).toContain("communication_dispatch_attempts_command_connection_fk");
+    expect(
+      tableConfig("communicationEventEnvelopes").foreignKeys.map((key) => key.getName()),
+    ).toEqual(
+      expect.arrayContaining([
+        "communication_event_envelopes_receipt_connection_fk",
+        "communication_event_envelopes_conversation_channel_fk",
+        "communication_event_envelopes_participant_conversation_channel_fk",
+        "communication_event_envelopes_message_conversation_fk",
+        "communication_event_envelopes_binding_connection_channel_fk",
+      ]),
+    );
+    expect(
+      tableConfig("communicationConversations").indexes.map((value) => value.config.name),
+    ).toEqual(
+      expect.arrayContaining([
+        "communication_conversations_activity_idx",
+        "communication_conversations_reconciliation_idx",
+      ]),
+    );
+    expect(
+      tableConfig("communicationProviderEventReceipts").indexes.map((value) => value.config.name),
+    ).toContain("communication_provider_event_receipts_work_idx");
+    expect(
+      tableConfig("communicationOutboundCommands").indexes.map((value) => value.config.name),
+    ).toContain("communication_outbound_commands_work_idx");
+  });
+
+  it("declares separate least-privilege policies for public-chat and communications scopes", () => {
+    for (const exportName of SHARED_TABLE_EXPORTS) {
+      const policies = tableConfig(exportName).policies;
+      expect(policies.map((policy) => policy.name)).toEqual(
+        expect.arrayContaining([
+          `${tableConfig(exportName).name}_public_chat_scope`,
+          `${tableConfig(exportName).name}_communications_scope`,
+        ]),
+      );
+      expect(policies.some((policy) => policy.name.endsWith("_public_chat_insert"))).toBe(false);
+      expect(policies.flatMap((policy) => [policy.to].flat().map(policyRoleName))).toEqual(
+        expect.arrayContaining(["atlas_public_chat_gateway", "atlas_communications_gateway"]),
+      );
+    }
+    for (const exportName of M004_ONLY_TABLE_EXPORTS) {
+      const policies = tableConfig(exportName).policies;
+      expect(policies).toHaveLength(1);
+      expect([policies[0]?.to].flat().map(policyRoleName)).toEqual([
+        "atlas_communications_gateway",
+      ]);
+    }
+    const publicSessionPolicies = tableConfig("publicChatConversationSessions").policies;
+    expect(publicSessionPolicies).toHaveLength(1);
+    expect([publicSessionPolicies[0]?.to].flat().map(policyRoleName)).toEqual([
+      "atlas_public_chat_gateway",
+    ]);
+
+    const evidencePolicies = tableConfig("communicationContactEvidenceEvents").policies;
+    expect(evidencePolicies.map((policy) => policy.name)).toEqual([
+      "communication_contact_evidence_events_communications_select",
+      "communication_contact_evidence_events_communications_insert",
+    ]);
+  });
+
+  it("stores a deterministic allowlisted envelope shape for every canonical event kind", () => {
+    const columns = tableConfig("communicationEventEnvelopes").columns.map((column) => column.name);
+    expect(columns).toEqual(
+      expect.arrayContaining([
+        "connection_id",
+        "channel_kind",
+        "delivery_state",
+        "interactive_kind",
+        "interactive_id",
+        "interactive_title",
+        "external_message_reference",
+        "media_external_reference",
+        "media_declared_kind",
+        "media_mime_type",
+        "media_checksum",
+        "template_provider_reference",
+        "template_key",
+        "template_locale",
+        "template_category",
+        "template_provider_state",
+        "template_provider_version",
+        "template_provider_timestamp",
+        "unsupported_reason",
+      ]),
+    );
+    expect(columns).not.toEqual(
+      expect.arrayContaining([
+        "raw_payload",
+        "provider_payload",
+        "provider_error",
+        "sender_endpoint",
+        "control_kind",
+      ]),
+    );
+    expect(tableConfig("communicationEventEnvelopes").checks.map((value) => value.name)).toContain(
+      "communication_event_envelopes_field_ownership_valid",
+    );
+  });
+
+  it("requires exact hexadecimal digests and positive durable ordering values", () => {
+    const expectedChecks: Record<string, readonly string[]> = {
+      communicationContactBindings: ["communication_contact_bindings_endpoint_digest_valid"],
+      communicationProviderEventReceipts: [
+        "communication_provider_event_receipts_body_digest_valid",
+        "communication_provider_event_receipts_lease_token_hash_valid",
+      ],
+      communicationEventEnvelopes: ["communication_event_envelopes_media_checksum_valid"],
+      communicationOutboundCommands: [
+        "communication_outbound_commands_fingerprint_valid",
+        "communication_outbound_commands_lease_token_hash_valid",
+      ],
+      communicationDispatchAttempts: ["communication_dispatch_attempts_request_digest_valid"],
+      communicationMessages: ["communication_messages_ordinal_positive"],
+      communicationAuditEvents: ["communication_audit_events_sequence_positive"],
+    };
+    for (const [exportName, checks] of Object.entries(expectedChecks)) {
+      expect(
+        tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
+          (value) => value.name,
+        ),
+      ).toEqual(expect.arrayContaining(checks));
+    }
+  });
+});
+
+describe("M004 generated migration authority and preparatory backfill", () => {
+  it("records generated bootstrap, structural and backfill migrations without hand-authored metadata", () => {
+    const migrations = currentM004Migrations();
+    const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
+    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
+      entries: Array<{ idx: number; tag: string }>;
+    };
+    expect(journal.entries.slice(-3).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
+      { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
+      { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
+      { idx: 8, tag: "0008_m004_communications_backfill" },
+    ]);
+    for (const index of ["0006", "0007", "0008"]) {
+      expect(
+        existsSync(
+          fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
+        ),
+      ).toBe(true);
+    }
+  });
+
+  it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
+    const { bootstrap, structural, backfill } = currentM004Migrations();
+    const sql = [bootstrap, structural, backfill]
+      .map((file) =>
+        readFileSync(fileURLToPath(new URL(`../../drizzle/${file}`, import.meta.url)), "utf8"),
+      )
+      .join("\n");
+    for (const exportName of REQUIRED_TABLE_EXPORTS) {
+      const name = tableConfig(exportName).name;
+      expect(sql).toContain(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`);
+      expect(sql).toContain(`"${name}"`);
+    }
+    expect(sql).toContain("REVOKE ALL ON TABLE");
+    expect(sql).toContain("atlas_communications_gateway");
+    expect(sql).toContain("NOSUPERUSER");
+    expect(sql).toContain("NOBYPASSRLS");
+    expect(sql).toContain("NOLOGIN");
+    expect(sql).toContain("ARRAY['anon', 'authenticated']");
+    expect(sql).not.toContain("FROM PUBLIC, anon, authenticated");
+    expect(sql).not.toMatch(/GRANT\s+[^;]*DELETE/iu);
+    expect(sql).toContain('GRANT SELECT ON TABLE "public_chat_conversation_sessions"');
+    expect(sql).not.toContain('GRANT SELECT, INSERT ON TABLE "public_chat_conversation_sessions"');
+  });
+
+  it("bootstraps the cluster-global role idempotently before per-database structural DDL", () => {
+    const { bootstrap, structural } = currentM004Migrations();
+    const bootstrapSql = readFileSync(`${migrationDirectory()}${bootstrap}`, "utf8");
+    const structuralSql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
+    expect(bootstrapSql).toContain("IF NOT EXISTS");
+    expect(bootstrapSql).toContain("CREATE ROLE atlas_communications_gateway");
+    expect(bootstrapSql).toContain("ALTER ROLE atlas_communications_gateway");
+    expect(structuralSql).not.toMatch(/CREATE\s+ROLE\s+"?atlas_communications_gateway"?/iu);
+  });
+
+  it("generates the real Meta envelope columns, explicit required checks and binding-channel FK", () => {
+    const { structural } = currentM004Migrations();
+    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
+    for (const column of [
+      "external_message_reference",
+      "template_provider_reference",
+      "template_provider_version",
+      "template_provider_timestamp",
+    ]) {
+      expect(sql).toContain(`"${column}"`);
+    }
+    expect(sql).toContain("communication_contact_bindings_id_channel_unique");
+    expect(sql).toContain("communication_participants_binding_channel_fk");
+    expect(sql).toContain('"consent_state" is not null');
+    expect(sql).toContain('"authority_version" is not null');
+    expect(sql).toContain('"template_provider_timestamp" is not null');
+    expect(sql).not.toContain('"control_kind"');
+    expect(sql).not.toContain('"sender_endpoint"');
+  });
+
+  it("installs one narrowly-scoped audited public-chat bootstrap function", () => {
+    const { backfill } = currentM004Migrations();
+    const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
+    expect(sql).toContain("atlas_bootstrap_public_chat_conversation");
+    expect(sql).toContain("SECURITY DEFINER");
+    expect(sql).toContain("SET search_path = pg_catalog, public");
+    expect(sql).toContain("REVOKE ALL ON FUNCTION");
+    expect(sql).toContain("GRANT EXECUTE ON FUNCTION");
+    expect(sql).toContain("public_chat_session_id");
+    expect(sql).toContain("M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS");
+    expect(sql).toContain("rolbypassrls");
+  });
+
+  it("backfills M003 exactly and leaves its read/write path and foreign keys intact", () => {
+    const { backfill } = currentM004Migrations();
+    const sql = readFileSync(
+      fileURLToPath(new URL(`../../drizzle/${backfill}`, import.meta.url)),
+      "utf8",
+    );
+    const normalizedSql = sql.toLowerCase();
+    for (const source of [
+      "public_chat_conversations",
+      "public_chat_messages",
+      "public_chat_handoffs",
+      "public_chat_audit_events",
+    ]) {
+      expect(normalizedSql).toContain(`from ${source}`);
+    }
+    expect(sql).toContain("M004_BACKFILL_TARGET_NOT_EMPTY");
+    expect(sql).toContain("M004_BACKFILL_INCOMPATIBLE_AUDIT_EVENT");
+    expect(sql).toContain("M004_BACKFILL_PARITY_FAILED");
+    expect(sql).toContain("M004_BACKFILL_PARITY_FAILED: participants");
+    expect(sql).toContain("sender_participant_id");
+    expect(sql).toContain("aggregate_type");
+    expect(sql).toContain("aggregate_id");
+    expect(sql).toContain("result_code");
+    expect(sql).toContain("occurred_at");
+    expect(normalizedSql).toContain("lock table");
+    expect(normalizedSql).toContain("in share mode");
+    expect(sql).toContain("EXCEPT");
+    expect(sql).not.toMatch(/drop\s+table\s+"?public_chat_/iu);
+    expect(sql).not.toMatch(/alter\s+table\s+"?public_chat_(citations|idempotency)"?/iu);
+  });
+
+  it("guards every newly audited session-link and handoff parity field against omission", () => {
+    const { backfill } = currentM004Migrations();
+    const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
+    expect(() => assertBackfillParityContract(sql)).not.toThrow();
+    for (const { fragment } of BACKFILL_PARITY_FRAGMENTS) {
+      expect(() => assertBackfillParityContract(sql.replace(fragment, "MUTATED_OUT"))).toThrowError(
+        `M004_TEST_PARITY_FRAGMENT_MISSING:${fragment}`,
+      );
+    }
+  });
+
+  it("registers separate idempotent runtime provision and validation commands", () => {
+    const rootPackage = JSON.parse(
+      readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
+    ) as { scripts: Record<string, string> };
+    const databasePackage = JSON.parse(
+      readFileSync(
+        fileURLToPath(new URL("../../packages/database/package.json", import.meta.url)),
+        "utf8",
+      ),
+    ) as { scripts: Record<string, string> };
+    expect(rootPackage.scripts).toMatchObject({
+      "db:communications:provision-local": expect.stringContaining(
+        "provision-communications-runtime.ts",
+      ),
+      "db:communications:validate-runtime": expect.stringContaining(
+        "validate-communications-runtime.ts",
+      ),
+    });
+    expect(databasePackage.scripts).toMatchObject({
+      "runtime:communications:provision-local": expect.stringContaining(
+        "provision-communications-runtime.ts",
+      ),
+      "runtime:communications:validate": expect.stringContaining(
+        "validate-communications-runtime.ts",
+      ),
+    });
+    expect(communicationsRuntimeRoleNames).toEqual({
+      gateway: "atlas_communications_gateway",
+      runtime: "atlas_communications_runtime",
+    });
+    expect(() =>
+      assertLoopbackCommunicationsDatabaseUrl("postgres://127.0.0.1:5432/atlas"),
+    ).not.toThrow();
+    expect(() =>
+      assertLoopbackCommunicationsDatabaseUrl("postgres://db.example.test/atlas"),
+    ).toThrowError("COMMUNICATIONS_LOCAL_PROVISION_REQUIRES_LOOPBACK_DATABASE");
+    const provision = readFileSync(
+      fileURLToPath(
+        new URL(
+          "../../packages/database/scripts/provision-communications-runtime.ts",
+          import.meta.url,
+        ),
+      ),
+      "utf8",
+    );
+    const validate = readFileSync(
+      fileURLToPath(
+        new URL(
+          "../../packages/database/scripts/validate-communications-runtime.ts",
+          import.meta.url,
+        ),
+      ),
+      "utf8",
+    );
+    for (const source of [provision, validate]) {
+      expect(source).toContain("with recursive");
+      expect(source).toContain("admin_option");
+      expect(source).toContain("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
+    }
+  });
+});
+
+const integrationEnvironment = (
+  globalThis as { process?: { env?: Record<string, string | undefined> } }
+).process?.env;
+const freshPostgresUrl = integrationEnvironment?.M004_POSTGRES_FRESH_URL;
+const upgradePostgresUrl = integrationEnvironment?.M004_POSTGRES_UPGRADE_URL;
+const publicChatRuntimeUrl = integrationEnvironment?.M004_PUBLIC_CHAT_RUNTIME_URL;
+const communicationsRuntimeUrl = integrationEnvironment?.M004_COMMUNICATIONS_RUNTIME_URL;
+const roleDatabaseAUrl = integrationEnvironment?.M004_POSTGRES_ROLE_A_URL;
+const roleDatabaseBUrl = integrationEnvironment?.M004_POSTGRES_ROLE_B_URL;
+
+describe.sequential("M004 disposable real-Postgres migration and RLS contract", () => {
+  it.runIf(Boolean(roleDatabaseAUrl && roleDatabaseBUrl))(
+    "replays the cluster-global 0006 role bootstrap in two databases on one disposable cluster",
+    async () => {
+      if (!roleDatabaseAUrl || !roleDatabaseBUrl)
+        throw new Error("M004_ROLE_DATABASE_URLS_REQUIRED");
+      assertDisposablePostgresUrl(roleDatabaseAUrl);
+      assertDisposablePostgresUrl(roleDatabaseBUrl);
+      const first = createPublicChatSql(roleDatabaseAUrl);
+      const second = createPublicChatSql(roleDatabaseBUrl);
+      try {
+        await applyMigrationRange(first, 6, 6);
+        await applyMigrationRange(second, 6, 6);
+        const roles = await second<Array<{ count: number }>>`
+          select count(*)::int as count from pg_roles
+          where rolname = 'atlas_communications_gateway'
+        `;
+        expect(roles).toEqual([{ count: 1 }]);
+      } finally {
+        await first.end({ timeout: 5 });
+        await second.end({ timeout: 5 });
+      }
+    },
+  );
+
+  it.runIf(Boolean(freshPostgresUrl))(
+    "applies the complete 0000 through 0008 chain to an empty disposable database",
+    async () => {
+      if (!freshPostgresUrl) throw new Error("M004_POSTGRES_FRESH_URL_REQUIRED");
+      assertDisposablePostgresUrl(freshPostgresUrl);
+      const sql = createPublicChatSql(freshPostgresUrl);
+      try {
+        await applyMigrationRange(sql, 0, 8);
+        const tables = await sql<Array<{ table_name: string }>>`
+          select table_name
+          from information_schema.tables
+          where table_schema = 'public' and table_name like 'communication%'
+          order by table_name
+        `;
+        expect(tables.map(({ table_name }) => table_name)).toEqual(
+          expect.arrayContaining([
+            "communication_audit_events",
+            "communication_channel_connections",
+            "communication_contact_bindings",
+            "communication_contact_evidence_events",
+            "communication_contact_policies",
+            "communication_conversations",
+            "communication_dispatch_attempts",
+            "communication_event_envelopes",
+            "communication_handoffs",
+            "communication_message_templates",
+            "communication_messages",
+            "communication_outbound_commands",
+            "communication_participants",
+            "communication_provider_event_receipts",
+          ]),
+        );
+        const rls = await sql<
+          Array<{ relforcerowsecurity: boolean; relrowsecurity: boolean; table_name: string }>
+        >`
+          select relname as table_name, relrowsecurity, relforcerowsecurity
+          from pg_class
+          where relnamespace = 'public'::regnamespace
+            and (relname like 'communication%' or relname = 'public_chat_conversation_sessions')
+        `;
+        expect(rls).toHaveLength(15);
+        expect(
+          rls.every(
+            ({ relforcerowsecurity, relrowsecurity }) => relforcerowsecurity && relrowsecurity,
+          ),
+        ).toBe(true);
+      } finally {
+        await sql.end({ timeout: 5 });
+      }
+    },
+  );
+
+  it.runIf(Boolean(upgradePostgresUrl))(
+    "upgrades populated synthetic 0005 data without losing IDs, order, state, timestamps, or references",
+    async () => {
+      if (!upgradePostgresUrl) throw new Error("M004_POSTGRES_UPGRADE_URL_REQUIRED");
+      assertDisposablePostgresUrl(upgradePostgresUrl);
+      const sql = createPublicChatSql(upgradePostgresUrl);
+      try {
+        await applyMigrationRange(sql, 0, 5);
+        await seedSyntheticM003(sql);
+        await applyMigrationRange(sql, 6, 8);
+
+        const conversation = await sql<
+          Array<{ channel_kind: string; id: string; status: string; version: number }>
+        >`
+          select id, channel_kind, status, version
+          from communication_conversations
+          where id = 'conversation_m004_upgrade'
+        `;
+        expect(conversation).toEqual([
+          {
+            channel_kind: "public_web",
+            id: "conversation_m004_upgrade",
+            status: "waiting_for_human",
+            version: 3,
+          },
+        ]);
+        const messages = await sql<Array<{ id: string; ordinal: number; state: string }>>`
+          select id, ordinal, state
+          from communication_messages
+          where conversation_id = 'conversation_m004_upgrade'
+          order by ordinal
+        `;
+        expect(messages).toEqual([
+          { id: "message_m004_upgrade_1", ordinal: 1, state: "accepted" },
+          { id: "message_m004_upgrade_2", ordinal: 2, state: "answered" },
+          { id: "message_m004_upgrade_3", ordinal: 3, state: "failed" },
+          { id: "message_m004_upgrade_4", ordinal: 4, state: "handoff_required" },
+        ]);
+        const participants = await sql<Array<{ kind: string }>>`
+          select kind from communication_participants
+          where conversation_id = 'conversation_m004_upgrade'
+          order by kind
+        `;
+        expect(participants).toEqual([
+          { kind: "automated" },
+          { kind: "external" },
+          { kind: "human" },
+          { kind: "system" },
+        ]);
+        const audits = await sql<
+          Array<{
+            aggregate_id: string;
+            aggregate_type: string;
+            event_name: string;
+            occurred_at: Date;
+            result_code: string;
+          }>
+        >`
+          select event_name, aggregate_type, aggregate_id, result_code, occurred_at
+          from communication_audit_events
+          where conversation_id = 'conversation_m004_upgrade'
+          order by sequence
+        `;
+        expect(audits).toHaveLength(8);
+        expect(audits.map(({ event_name }) => event_name)).toEqual([
+          "chat_conversation_started",
+          "chat_message_accepted",
+          "chat_message_rejected",
+          "chat_response_failed",
+          "chat_handoff_requested",
+          "chat_handoff_queued",
+          "chat_locale_changed",
+          "chat_conversation_closed",
+        ]);
+        expect(
+          audits.every(({ aggregate_id, aggregate_type, occurred_at, result_code }) =>
+            Boolean(aggregate_id && aggregate_type && occurred_at && result_code),
+          ),
+        ).toBe(true);
+        const parity = await sql<
+          Array<{ audits: number; handoffs: number; messages: number; sessions: number }>
+        >`
+          select
+            (select count(*)::int from communication_messages
+              where conversation_id = 'conversation_m004_upgrade') as messages,
+            (select count(*)::int from communication_handoffs
+              where conversation_id = 'conversation_m004_upgrade') as handoffs,
+            (select count(*)::int from communication_audit_events
+              where conversation_id = 'conversation_m004_upgrade') as audits,
+            (select count(*)::int from public_chat_conversation_sessions
+              where conversation_id = 'conversation_m004_upgrade') as sessions
+        `;
+        expect(parity).toEqual([{ audits: 8, handoffs: 1, messages: 4, sessions: 1 }]);
+      } finally {
+        await sql.end({ timeout: 5 });
+      }
+    },
+  );
+
+  it.runIf(Boolean(freshPostgresUrl))(
+    "rejects PostgreSQL NULL bypasses and a public participant linked to a WhatsApp binding",
+    async () => {
+      if (!freshPostgresUrl) throw new Error("M004_POSTGRES_FRESH_URL_REQUIRED");
+      assertDisposablePostgresUrl(freshPostgresUrl);
+      const sql = createPublicChatSql(freshPostgresUrl);
+      const suffix = crypto.randomUUID().replaceAll("-", "");
+      const connectionId = `connection_null_contract_${suffix}`;
+      const bindingId = `binding_null_contract_${suffix}`;
+      const now = new Date();
+      const expiresAt = new Date(now.getTime() + 30 * 60_000);
+      try {
+        await sql.begin(async (tx) => {
+          await tx.unsafe("set local role atlas_communications_gateway");
+          await tx`
+            insert into communication_channel_connections (
+              id, channel_kind, adapter_key, readiness_state, policy_version, version,
+              created_at, updated_at
+            ) values (
+              ${connectionId}, 'whatsapp', 'meta_cloud', 'disabled', 'wa-policy.synthetic.v1', 1,
+              ${now}, ${now}
+            )
+          `;
+          await tx`
+            insert into communication_contact_bindings (
+              id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
+              trust_state, locale, contact_policy_version, version, created_at, updated_at
+            ) values (
+              ${bindingId}, ${connectionId}, 'whatsapp', ${"a".repeat(64)}, 'digest.synthetic.v1',
+              'linked_contact', 'en', 1, 1, ${now}, ${now}
+            )
+          `;
+        });
+
+        const invalidEnvelopeCases = [
+          {
+            eventKind: "text_message",
+            receiptId: `receipt_text_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
+             message_reference, canonical_text, body_retention_policy, occurred_at, created_at,
+             updated_at)
+           values ('envelope_text_${suffix}', 'receipt_text_${suffix}', '${connectionId}',
+             'text_message', 'meta-envelope.v1', '${bindingId}', 'message_text', null, 'approved',
+             now(), now(), now())`,
+          },
+          {
+            eventKind: "interactive_reply",
+            receiptId: `receipt_interactive_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
+             message_reference, interactive_kind, interactive_id, interactive_title,
+             occurred_at, created_at, updated_at)
+           values ('envelope_interactive_${suffix}', 'receipt_interactive_${suffix}',
+             '${connectionId}', 'interactive_reply', 'meta-envelope.v1', '${bindingId}',
+             'message_interactive', null, 'reply', 'Reply', now(), now(), now())`,
+          },
+          {
+            eventKind: "message_status",
+            receiptId: `receipt_status_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version,
+             external_message_reference, delivery_state, occurred_at, created_at, updated_at)
+           values ('envelope_status_${suffix}', 'receipt_status_${suffix}', '${connectionId}',
+             'message_status', 'meta-envelope.v1', null, 'delivered', now(), now(), now())`,
+          },
+          {
+            eventKind: "media_reference",
+            receiptId: `receipt_media_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
+             message_reference, media_external_reference, media_declared_kind,
+             occurred_at, created_at, updated_at)
+           values ('envelope_media_${suffix}', 'receipt_media_${suffix}', '${connectionId}',
+             'media_reference', 'meta-envelope.v1', '${bindingId}', 'message_media', null,
+             'document', now(), now(), now())`,
+          },
+          {
+            eventKind: "template_projection",
+            receiptId: `receipt_template_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version,
+             template_provider_reference, template_key, template_locale, template_category,
+             template_provider_state, template_provider_version, template_provider_timestamp, template_components,
+             occurred_at, created_at, updated_at)
+           values ('envelope_template_${suffix}', 'receipt_template_${suffix}', '${connectionId}',
+             'template_projection', 'meta-envelope.v1', null, 'template_key', 'en', 'utility',
+             'provider_approved', 'provider.v1', now(), '[]'::jsonb, now(), now(), now())`,
+          },
+          {
+            eventKind: "unsupported_verified",
+            receiptId: `receipt_unsupported_${suffix}`,
+            statement: `insert into communication_event_envelopes
+            (id, receipt_id, connection_id, event_kind, schema_version, unsupported_reason,
+             occurred_at, created_at, updated_at)
+           values ('envelope_unsupported_${suffix}', 'receipt_unsupported_${suffix}',
+             '${connectionId}', 'unsupported_verified', 'meta-envelope.v1', null,
+             now(), now(), now())`,
+          },
+        ];
+        for (const { eventKind, receiptId, statement } of invalidEnvelopeCases) {
+          await expect(
+            sql.begin(async (tx) => {
+              await tx.unsafe("set local role atlas_communications_gateway");
+              await tx.unsafe(`insert into communication_provider_event_receipts
+                (id, connection_id, channel_kind, external_event_reference, body_digest,
+                 event_kind, state, schema_version, signature_verified, correlation_id,
+                 processing_version, received_at, persisted_at, created_at, updated_at)
+                values ('${receiptId}', '${connectionId}', 'whatsapp',
+                 'event_${eventKind}_${suffix}', '${"b".repeat(64)}', '${eventKind}', 'persisted',
+                 'meta-envelope.v1', true, 'correlation_${eventKind}_${suffix}', 1,
+                 now(), now(), now(), now())`);
+              await tx.unsafe(statement);
+            }),
+          ).rejects.toThrow();
+        }
+
+        const publicSessionId = `session_binding_channel_${suffix}`;
+        const publicConversationId = `conversation_binding_channel_${suffix}`;
+        const publicParticipantId = `participant_binding_channel_${suffix}`;
+        await sql.begin(async (tx) => {
+          await tx.unsafe("set local role atlas_public_chat_gateway");
+          await tx.unsafe(`set local atlas.public_chat_session_id = '${publicSessionId}'`);
+          await tx`
+            insert into public_chat_sessions (
+              id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
+            ) values (
+              ${publicSessionId}, ${"c".repeat(64)}, ${"d".repeat(64)},
+              ${`correlation_public_${suffix}`}, ${expiresAt}, ${now}, ${now}
+            )
+          `;
+          await tx`
+            select atlas_bootstrap_public_chat_conversation(
+              ${publicSessionId}, ${publicConversationId}, ${publicParticipantId},
+              ${`session_link_binding_channel_${suffix}`}, 'en',
+              ${`correlation_public_${suffix}`}, 'public-chat-notice.v1',
+              ${`start_binding_channel_${suffix}`}, ${"e".repeat(64)}, ${now}, ${expiresAt}
+            )
+          `;
+        });
+        await expect(
+          sql.begin(async (tx) => {
+            await tx.unsafe("set local role atlas_public_chat_gateway");
+            await tx.unsafe(`set local atlas.public_chat_session_id = '${publicSessionId}'`);
+            await tx`
+              update communication_participants set channel_binding_id = ${bindingId}
+              where id = ${publicParticipantId}
+            `;
+          }),
+        ).rejects.toThrow();
+      } finally {
+        await sql.end({ timeout: 5 });
+      }
+    },
+  );
+
+  it.runIf(Boolean(publicChatRuntimeUrl && communicationsRuntimeUrl))(
+    "enforces direct-principal denial and cross-channel, cross-session RLS isolation",
+    async () => {
+      if (!publicChatRuntimeUrl || !communicationsRuntimeUrl) {
+        throw new Error("M004_RUNTIME_URLS_REQUIRED");
+      }
+      assertDisposablePostgresUrl(publicChatRuntimeUrl);
+      assertDisposablePostgresUrl(communicationsRuntimeUrl);
+      const publicSql = createPublicChatSql(publicChatRuntimeUrl);
+      const communicationsSql = createPublicChatSql(communicationsRuntimeUrl);
+      const suffix = crypto.randomUUID().replaceAll("-", "");
+      const sessionId = `session_${suffix}`;
+      const publicConversationId = `public_conversation_${suffix}`;
+      const participantId = `participant_${suffix}`;
+      const whatsappConversationId = `whatsapp_conversation_${suffix}`;
+      const now = new Date();
+      const expiresAt = new Date(now.getTime() + 30 * 60_000);
+      try {
+        await expect(publicSql`select count(*) from communication_conversations`).rejects.toThrow();
+        await expect(
+          communicationsSql`select count(*) from communication_conversations`,
+        ).rejects.toThrow();
+
+        await publicSql.begin(async (tx) => {
+          await tx.unsafe("set local role atlas_public_chat_gateway");
+          await tx.unsafe(`set local atlas.public_chat_session_id = '${sessionId}'`);
+          await tx`
+            insert into public_chat_sessions (
+              id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
+            ) values (
+              ${sessionId}, ${"d".repeat(64)}, ${"e".repeat(64)}, ${`correlation_${suffix}`},
+              ${expiresAt}, ${now}, ${now}
+            )
+          `;
+          await tx`
+            select atlas_bootstrap_public_chat_conversation(
+              ${sessionId}, ${publicConversationId}, ${participantId}, ${`session_link_${suffix}`},
+              'es', ${`correlation_${suffix}`}, 'public-chat-notice.v1', ${`start_${suffix}`},
+              ${"f".repeat(64)}, ${now}, ${expiresAt}
+            )
+          `;
+          const visible = await tx<Array<{ id: string }>>`
+            select id from communication_conversations where id = ${publicConversationId}
+          `;
+          expect(visible).toEqual([{ id: publicConversationId }]);
+          const sessionLinkPrivilege = await tx<Array<{ can_insert: boolean }>>`
+            select has_table_privilege(
+              current_role,
+              'public.public_chat_conversation_sessions',
+              'INSERT'
+            ) as can_insert
+          `;
+          expect(sessionLinkPrivilege).toEqual([{ can_insert: false }]);
+        });
+        await expect(
+          publicSql.begin(async (tx) => {
+            await tx.unsafe("set local role atlas_public_chat_gateway");
+            await tx`select count(*) from communication_channel_connections`;
+          }),
+        ).rejects.toThrow();
+        await expect(
+          publicSql.begin(async (tx) => {
+            await tx.unsafe("set local role atlas_public_chat_gateway");
+            await tx.unsafe(`set local atlas.public_chat_session_id = '${sessionId}'`);
+            await tx`
+              insert into communication_conversations (
+                id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+                expires_at, reconciliation_required, created_at, updated_at
+              ) values (
+                ${`orphan_${suffix}`}, 'public_web', 'es', 'new', 1, ${`orphan_${suffix}`},
+                ${now}, ${expiresAt}, false, ${now}, ${now}
+              )
+            `;
+          }),
+        ).rejects.toThrow();
+
+        await communicationsSql.begin(async (tx) => {
+          await tx.unsafe("set local role atlas_communications_gateway");
+          await tx`
+            insert into communication_conversations (
+              id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+              reconciliation_required, created_at, updated_at
+            ) values (
+              ${whatsappConversationId}, 'whatsapp', 'en', 'new', 1,
+              ${`correlation_whatsapp_${suffix}`}, ${now}, false, ${now}, ${now}
+            )
+          `;
+          const visible = await tx<Array<{ id: string }>>`
+            select id from communication_conversations
+            where id in (${publicConversationId}, ${whatsappConversationId})
+          `;
+          expect(visible).toEqual([{ id: whatsappConversationId }]);
+        });
+        await expect(
+          communicationsSql.begin(async (tx) => {
+            await tx.unsafe("set local role atlas_communications_gateway");
+            await tx`select count(*) from public_chat_conversation_sessions`;
+          }),
+        ).rejects.toThrow();
+
+        await publicSql.begin(async (tx) => {
+          await tx.unsafe("set local role atlas_public_chat_gateway");
+          await tx.unsafe("set local atlas.public_chat_session_id = 'different_session'");
+          const crossSession = await tx<Array<{ id: string }>>`
+            select id from communication_conversations where id = ${publicConversationId}
+          `;
+          expect(crossSession).toEqual([]);
+        });
+        await expect(
+          publicSql.begin(async (tx) => {
+            await tx.unsafe("set local role atlas_public_chat_gateway");
+            await tx.unsafe("set local atlas.public_chat_session_id = 'different_session'");
+            await tx`
+              insert into communication_messages (
+                id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+                locale, kind, state, body, body_stored, body_retention_policy, actions, created_at
+              ) values (
+                ${`cross_message_${suffix}`}, ${publicConversationId}, 'public_web', 2,
+                'inbound', ${participantId}, 'es', 'text', 'accepted', null, false,
+                'metadata_only', '[]'::jsonb, ${now}
+              )
+            `;
+          }),
+        ).rejects.toThrow();
+      } finally {
+        await publicSql.end({ timeout: 5 });
+        await communicationsSql.end({ timeout: 5 });
+      }
+    },
+  );
+});
+
+
+describe("Task 7 recovered current-contract schema guards", () => {
+  it("preserves neutral contact linkage and current durable authority evidence", () => {
+    const bindingChecks = tableConfig("communicationContactBindings").checks.map(
+      (value) => value.name,
+    );
+    expect(bindingChecks).toContain("communication_contact_bindings_trust_valid");
+
+    const evidenceColumns = tableConfig("communicationContactEvidenceEvents").columns.map(
+      (column) => column.name,
+    );
+    expect(evidenceColumns).toEqual(
+      expect.arrayContaining(["receipt_issued_at", "receipt_valid_until"]),
+    );
+
+    const outboundColumns = tableConfig("communicationOutboundCommands").columns.map(
+      (column) => column.name,
+    );
+    expect(outboundColumns).toEqual(
+      expect.arrayContaining([
+        "owning_receipt_issued_at",
+        "owning_receipt_valid_until",
+        "owning_receipt_correlation_id",
+      ]),
+    );
+
+    const attemptColumns = tableConfig("communicationDispatchAttempts").columns.map(
+      (column) => column.name,
+    );
+    expect(attemptColumns).toEqual(
+      expect.arrayContaining(["provider_io_capability_hash", "provider_io_started_at"]),
+    );
+
+    const { structural } = currentM004Migrations();
+    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
+    expect(sql).toContain("linked_contact");
+    expect(sql).not.toContain("linked_prospect");
+    expect(sql).not.toContain("linked_client");
+  });
+
+  it("persists every current template authority axis and the full safe media discriminator", () => {
+    const columns = tableConfig("communicationEventEnvelopes").columns.map(
+      (column) => column.name,
+    );
+    expect(columns).toEqual(
+      expect.arrayContaining([
+        "template_id",
+        "template_authority_state",
+        "template_authority_version",
+        "template_authority_updated_at",
+        "template_provider_state",
+        "template_provider_version",
+      ]),
+    );
+    const { structural } = currentM004Migrations();
+    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
+    expect(sql).toContain("sticker");
+  });
+});
```
