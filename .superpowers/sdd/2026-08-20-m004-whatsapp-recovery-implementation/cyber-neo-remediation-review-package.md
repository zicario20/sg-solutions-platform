# Cyber Neo Remediation Review
Base: 70889fb
Head: 59a788e
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
index 19d2c25..9510049 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
@@ -445,111 +445,116 @@ async function readRawBody(
       byteLength += snapshot.byteLength;
     }
   } finally {
     if (!cleanupOwnsReader) releaseReader(reader);
   }
 
   if (declaredBytes !== null && declaredBytes !== byteLength) {
     throw new IngressFailure("content_length_invalid", 400, "invalid");
   }
   const raw = new Uint8Array(byteLength);
   let offset = 0;
   for (const chunk of chunks) {
     raw.set(chunk, offset);
     offset += chunk.byteLength;
   }
   return raw;
 }
 
 function isCanonicalEnvelope(
   envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
 ): envelope is CanonicalProviderEnvelope {
   return envelope.kind !== "unsupported_verified";
 }
 
 function createSafeCorrelationId(dependencies: WhatsAppIngressDependencies): string {
   try {
     const candidate = dependencies.createCorrelationId();
     if (CORRELATION_ID.test(candidate)) return candidate;
   } catch {
     // The fixed fallback contains no request-derived data.
   }
   return "correlation_unavailable";
 }
 
 export function createWhatsAppIngressHandler(
   dependencies: WhatsAppIngressDependencies,
 ): WhatsAppIngressHandler {
   requirePositiveSafeInteger(dependencies.limits.maxRawBodyBytes, "max raw body bytes");
   requirePositiveSafeInteger(dependencies.limits.readTimeoutMilliseconds, "read timeout");
   requirePositiveSafeInteger(dependencies.limits.totalTimeoutMilliseconds, "total timeout");
+  let retiredCleanupCount = 0;
 
   return async (request, context) => {
     const correlationId = createSafeCorrelationId(dependencies);
     if (request.method !== "GET" && request.method !== "POST") {
       return response(dependencies, correlationId, 405, "method not allowed", "method_rejected", {
         allow: "GET, POST",
       });
     }
     if (!dependencies.limits.providerTrafficAllowed) {
       return response(dependencies, correlationId, 503, "unavailable", "provider_disabled");
     }
     if (!IDENTIFIER.test(context.connectionId)) {
       return failureResponse(
         dependencies,
         correlationId,
         new IngressFailure("invalid_connection", 400, "invalid"),
       );
     }
 
     let declaredBytes: number | null = null;
     try {
       if (request.method === "POST") {
         declaredBytes = validatePostHeaders(request, dependencies.limits.maxRawBodyBytes);
       }
     } catch (error) {
       if (error instanceof IngressFailure) {
         return failureResponse(dependencies, correlationId, error);
       }
       return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
     }
 
+    if (retiredCleanupCount > 0) {
+      return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
+    }
+
     const release = dependencies.semaphore.tryAcquire();
     if (!release) {
       return failureResponse(
         dependencies,
         correlationId,
         new IngressFailure("concurrency_exhausted", 503, "unavailable"),
       );
     }
     let releaseDeferred = false;
     let released = false;
     const releaseOnce = () => {
       if (released) return;
       released = true;
       release();
     };
     try {
       if (!dependencies.rateBudget.tryConsume(dependencies.clock.now())) {
         return failureResponse(
           dependencies,
           correlationId,
           new IngressFailure("rate_exhausted", 429, "unavailable"),
         );
       }
 
       const deadline = dependencies.clock.now() + dependencies.limits.totalTimeoutMilliseconds;
       const abortController = new AbortController();
       try {
         const authority = await withinTotal(
           dependencies.authorityResolver.resolveWebhookConnectionAuthority(
             context.connectionId,
             abortController.signal,
           ),
           deadline,
           dependencies.clock,
           abortController,
         );
         if (!validateAuthority(authority, context.connectionId, dependencies.clock.now())) {
           throw new IngressFailure("authority_rejected", 403, "invalid");
         }
         const secret = await withinTotal(
@@ -599,51 +604,69 @@ export function createWhatsAppIngressHandler(
         }
 
         const envelope = await withinTotal(
           dependencies.adapter.normalizeVerifiedEvent(
             raw,
             verification.context,
             abortController.signal,
           ),
           deadline,
           dependencies.clock,
           abortController,
         );
         if (!isCanonicalEnvelope(envelope)) {
           throw new IngressFailure("payload_rejected", 400, "invalid");
         }
 
         const acceptance = await withinTotal(
           dependencies.acceptInbound(
             {
               authority,
               connectionId: context.connectionId,
               providerEventId: envelope.externalEventReference,
               providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
               envelope,
               correlationId,
             },
             abortController.signal,
           ),
           deadline,
           dependencies.clock,
           abortController,
         );
         if (acceptance.status === "accepted" || acceptance.status === "duplicate") {
           return response(dependencies, correlationId, 200, "accepted", acceptance.status);
         }
         throw new IngressFailure("replay_mismatch", 409, "invalid");
       } catch (error) {
         if (error instanceof IngressFailure) {
           if (error.cleanup) {
             releaseDeferred = true;
-            void error.cleanup.then(releaseOnce, releaseOnce);
+            let cleanupFinished = false;
+            let retired = false;
+            const finishCleanup = () => {
+              if (cleanupFinished) return;
+              cleanupFinished = true;
+              clearTimeout(retirementTimer);
+              if (retired) {
+                retiredCleanupCount = Math.max(0, retiredCleanupCount - 1);
+              } else {
+                releaseOnce();
+              }
+            };
+            const retirementTimer = setTimeout(() => {
+              if (cleanupFinished) return;
+              retired = true;
+              retiredCleanupCount += 1;
+              releaseOnce();
+            }, dependencies.limits.totalTimeoutMilliseconds);
+            void error.cleanup.then(finishCleanup, finishCleanup);
           }
           return failureResponse(dependencies, correlationId, error);
         }
         return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
       }
     } finally {
       if (!releaseDeferred) releaseOnce();
     }
   };
 }
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
index ad63e06..3ae9411 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts
@@ -1,151 +1,149 @@
 import {
   type CommunicationEventSchemaVersion,
   type CommunicationEventPersistenceRecord,
   type PersistedTemplateComponent,
   isSupportedCommunicationEventSchemaVersion,
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
-  | (Omit<CanonicalInteractiveEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
   | (Omit<CanonicalMediaEnvelope, "senderEndpoint"> & { readonly senderBindingId: string })
-  | CanonicalStatusEnvelope
   | CanonicalTemplateProjectionEnvelope
   | UnsupportedVerifiedEnvelope;
 
 export type ProviderEnvelopeDeserializationResult =
   | Readonly<{ status: "available"; envelope: SafePersistedProviderEnvelope }>
   | Readonly<{
       status: "not_reversible";
-      eventKind: "text_message";
-      reason: "metadata_only";
+      eventKind: "interactive_reply" | "message_status" | "text_message";
+      reason: "metadata_only" | "verified_context_required";
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
 
 function assertPersistenceContext(value: unknown): asserts value is ProviderEnvelopePersistenceContext {
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
-    keys.some((key) => !["type", "format", "text"].includes(key)) ||
+    keys.some((key) => !["type", "format"].includes(key)) ||
     !TEMPLATE_COMPONENT_TYPES.has(String(value.type))
   ) {
     return false;
   }
   if (value.format !== undefined && !TEMPLATE_COMPONENT_FORMATS.has(String(value.format))) {
     return false;
   }
-  return value.text === undefined || typeof value.text === "string";
+  return true;
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
@@ -297,192 +295,175 @@ export function serializeMetaCanonicalEnvelope(
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
-        interactiveId: envelope.replyId,
-        interactiveTitle: envelope.replyTitle,
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
-          ...(component.text === undefined ? {} : { text: component.text }),
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
-        status: "available",
-        envelope: {
-          ...supportedBase(),
-          kind: "interactive_reply",
-          senderBindingId: required(record.bindingId),
-          messageReference: required(record.messageReference),
-          replyKind: required(record.interactiveKind),
-          replyId: required(record.interactiveId),
-          replyTitle: required(record.interactiveTitle),
-          occurredAt: record.occurredAt,
-        },
+        status: "not_reversible",
+        eventKind: "interactive_reply",
+        reason: "metadata_only",
       };
     case "message_status":
       return {
-        status: "available",
-        envelope: {
-          ...supportedBase(),
-          kind: "message_status",
-          externalMessageReference: required(record.externalMessageReference),
-          status: required(record.deliveryState),
-          occurredAt: record.occurredAt,
-        },
+        status: "not_reversible",
+        eventKind: "message_status",
+        reason: "verified_context_required",
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
-              ...(component.text === undefined ? {} : { text: component.text }),
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
diff --git a/blueprints/project-atlas/workspace/drizzle/0015_m004_provider_status_authenticity.sql b/blueprints/project-atlas/workspace/drizzle/0015_m004_provider_status_authenticity.sql
new file mode 100644
index 0000000..f7b2cd3
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0015_m004_provider_status_authenticity.sql
@@ -0,0 +1,36 @@
+CREATE TABLE "communication_provider_status_verifications" (
+  "receipt_id" text PRIMARY KEY NOT NULL,
+  "command_id" text NOT NULL,
+  "attempt_id" text NOT NULL,
+  "connection_id" text NOT NULL,
+  "external_message_reference_digest" char(64) NOT NULL,
+  "provider_event_id" text NOT NULL,
+  "status" varchar(24) NOT NULL,
+  "occurred_at" timestamp with time zone NOT NULL,
+  "verified_at" timestamp with time zone NOT NULL,
+  "body_digest" char(64) NOT NULL,
+  "correlation_id" text NOT NULL,
+  "created_at" timestamp with time zone NOT NULL,
+  CONSTRAINT "communication_provider_status_verifications_connection_event_unique" UNIQUE("connection_id", "provider_event_id"),
+  CONSTRAINT "communication_provider_status_verifications_status_valid" CHECK ("status" in ('sent', 'delivered', 'read', 'failed')),
+  CONSTRAINT "communication_provider_status_verifications_digest_valid" CHECK ("external_message_reference_digest" ~ '^[0-9a-f]{64}$' and "body_digest" ~ '^[0-9a-f]{64}$'),
+  CONSTRAINT "communication_provider_status_verifications_command_fk" FOREIGN KEY ("command_id") REFERENCES "communication_outbound_commands"("id") ON DELETE cascade,
+  CONSTRAINT "communication_provider_status_verifications_attempt_fk" FOREIGN KEY ("attempt_id") REFERENCES "communication_dispatch_attempts"("id") ON DELETE cascade,
+  CONSTRAINT "communication_provider_status_verifications_connection_fk" FOREIGN KEY ("connection_id") REFERENCES "communication_channel_connections"("id") ON DELETE restrict
+);
+--> statement-breakpoint
+ALTER TABLE "communication_provider_status_verifications" ENABLE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_provider_status_verifications" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+REVOKE ALL ON TABLE "communication_provider_status_verifications" FROM PUBLIC;
+--> statement-breakpoint
+GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "communication_provider_status_verifications" TO "atlas_communications_gateway";
+--> statement-breakpoint
+CREATE POLICY "communication_provider_status_verifications_communications_scope" ON "communication_provider_status_verifications" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
+  select 1 from communication_outbound_commands command
+  where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
+)) WITH CHECK (exists (
+  select 1 from communication_outbound_commands command
+  where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
+));
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index e80b850..ca30a1b 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -69,43 +69,50 @@
       "idx": 9,
       "version": "7",
       "when": 1787251995592,
       "tag": "0009_m004_communications_cutover_guard",
       "breakpoints": true
     },
     {
       "idx": 10,
       "version": "7",
       "when": 1787254194838,
       "tag": "0010_m004_communications_canonical_cutover",
       "breakpoints": true
     },
     {
       "idx": 11,
       "version": "7",
       "when": 1787254199495,
       "tag": "0011_m004_receipt_security_hardening",
       "breakpoints": true
     },
     {
       "idx": 12,
       "version": "7",
       "when": 1787255710919,
       "tag": "0012_m004_inbound_processing_version_parity",
       "breakpoints": true
     },
     {
       "idx": 13,
       "version": "7",
       "when": 1787256657727,
       "tag": "0013_m004_contact_withdrawal_evidence",
       "breakpoints": true
     },
     {
       "idx": 14,
       "version": "7",
       "when": 1787257764344,
       "tag": "0014_m004_typed_withdrawal_evidence",
       "breakpoints": true
+    },
+    {
+      "idx": 15,
+      "version": "7",
+      "when": 1787259000000,
+      "tag": "0015_m004_provider_status_authenticity",
+      "breakpoints": true
     }
   ]
-}
\ No newline at end of file
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
index b5402c6..553d0dc 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts
@@ -1,57 +1,56 @@
 export const SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS = ["meta-envelope.v1"] as const;
 
 export type CommunicationEventSchemaVersion =
   (typeof SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS)[number];
 
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
-  text?: string;
 }>;
 
 export type CommunicationEventPersistenceRecord = Readonly<{
   connectionId: string;
   externalEventReference: string | null;
   correlationId: string;
   receivedAt: Date;
   eventKind: CommunicationEventKind;
   schemaVersion: CommunicationEventSchemaVersion;
   bindingId: string | null;
   messageReference: string | null;
   externalMessageReference: string | null;
   canonicalText: null;
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
@@ -176,133 +175,133 @@ export function isCanonicalOpaqueProviderReference(value: unknown): value is str
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
 
 function hasValidCanonicalReferences(record: Record<string, unknown>): boolean {
   return CANONICAL_REFERENCE_FIELDS.every(
     (field) => record[field] === null || isCanonicalOpaqueProviderReference(record[field]),
   );
 }
 
 function isTemplateComponent(value: unknown): value is PersistedTemplateComponent {
   if (!isObject(value)) return false;
   const keys = Object.keys(value);
   if (
-    keys.some((key) => !["type", "format", "text"].includes(key)) ||
+    keys.some((key) => !["type", "format"].includes(key)) ||
     !COMPONENT_TYPES.has(String(value.type))
   ) {
     return false;
   }
   if (value.format !== undefined && !COMPONENT_FORMATS.has(String(value.format))) return false;
-  return value.text === undefined || typeof value.text === "string";
+  return true;
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
         isCanonicalOpaqueProviderReference(record.messageReference) &&
         record.bodyRetentionPolicy === "metadata_only" &&
         isNull(record.canonicalText) &&
         hasOnlyNulls(record, MESSAGE_ONLY_FIELDS)
       );
     case "interactive_reply":
       return (
         record.bodyRetentionPolicy === "metadata_only" &&
         isNull(record.canonicalText) &&
         isNonEmptyString(record.bindingId) &&
         isCanonicalOpaqueProviderReference(record.messageReference) &&
         INTERACTIVE_KINDS.has(String(record.interactiveKind)) &&
-        isNonEmptyString(record.interactiveId) &&
-        typeof record.interactiveTitle === "string" &&
+        isNull(record.interactiveId) &&
+        isNull(record.interactiveTitle) &&
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
         isCanonicalOpaqueProviderReference(record.externalMessageReference) &&
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
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts b/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts
index 7e93e3e..62dc89d 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts
@@ -1,13 +1,14 @@
-import type { CommunicationsRepository } from "@atlas/domain";
+import type { CommunicationsRepository, VerifiedProviderStatusReceiptResolver } from "@atlas/domain";
 import {
   type CommunicationsSql,
   PostgresCommunicationsRepository,
 } from "./postgres-communications-store.ts";
 
 export function createPostgresCommunicationsRepository(
   sql: CommunicationsSql,
+  providerStatusReceiptResolver?: VerifiedProviderStatusReceiptResolver,
 ): CommunicationsRepository & Pick<PostgresCommunicationsRepository, "referenceState"> {
-  return new PostgresCommunicationsRepository(sql);
+  return new PostgresCommunicationsRepository(sql, providerStatusReceiptResolver);
 }
 
 export * from "./postgres-communications-store.ts";
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index 247068a..2a84f17 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -7,80 +7,83 @@ import {
   type ApproveTemplateDefinition,
   type BindingChangeResult,
   type ClaimInboundCommand,
   type ClaimOutboundCommand,
   canonicalEndpointReference,
   type CommunicationsReferenceState,
   type CommunicationsRepository,
   type CompleteInboundCommand,
   type ConsentChangeResult,
   type ConsentRecord,
   type CreateOutboundCommand,
   type CreateOutboundResult,
   type DispatchReconciliationOutcome,
   type EvaluateTemplateEligibility,
   evaluateAuthorityChange,
   evaluateOutboundPolicy,
   type FailOutboundDraftCommand,
   type FinalizeOutboundCommand,
   type GrantConsentCommand,
   type InboundClaimResult,
   type MarkDispatchOutcomeCommand,
   type OutboundClaimResult,
   type OutboundAuthorizationReceipt,
   type OutboundCommandState,
   type ProviderStatusResult,
   type RecoveryCandidate,
   type RecoveryQuery,
   type ReconcileOutboundCommand,
   type ReconcileOutboundResult,
   type ReconcileTemplateCommand,
   type RegisterTemplateDefinition,
   type ResolveOptOutCommand,
   type RevalidateBindingCommand,
   type SuspendBindingCommand,
   type TemplateEligibilityResult,
   type TemplateLifecycleState,
   type TemplateReconciliationResult,
   type TemplateResult,
   type WithdrawContactCommand,
   type WithdrawContactResult,
+  sameVerifiedProviderStatusRecord,
+  type VerifiedProviderStatusReceiptRecord,
+  type VerifiedProviderStatusReceiptResolver,
 } from "@atlas/domain";
 import postgres from "postgres";
 
 type TransactionSql = postgres.TransactionSql<Record<string, never>>;
 export type CommunicationsSql = postgres.Sql<Record<string, never>>;
 type SqlValue = string | number | boolean | Date | null;
 
 export const COMMUNICATIONS_TRANSACTION_SQL = {
   attestPrincipal: `
     with recursive runtime_closure(role_oid, admin_path, path) as (
       select membership.roleid, membership.admin_option,
         array[membership.member, membership.roleid]::oid[]
       from pg_auth_members membership
       where membership.member = (select oid from pg_roles where rolname = session_user)
       union all
       select membership.roleid,
         runtime_closure.admin_path or membership.admin_option,
         runtime_closure.path || membership.roleid
       from runtime_closure
       join pg_auth_members membership on membership.member = runtime_closure.role_oid
       where not membership.roleid = any(runtime_closure.path)
     ), gateway_closure(role_oid, path) as (
       select membership.roleid, array[membership.member, membership.roleid]::oid[]
       from pg_auth_members membership
       where membership.member = (
         select oid from pg_roles where rolname = 'atlas_communications_gateway'
       )
       union all
       select membership.roleid, gateway_closure.path || membership.roleid
       from gateway_closure
       join pg_auth_members membership on membership.member = gateway_closure.role_oid
       where not membership.roleid = any(gateway_closure.path)
     )
     select session_role.rolname as principal_name,
       pg_has_role(session_user, 'atlas_communications_gateway', 'member') as is_member,
       (select count(*)::integer from runtime_closure) as closure_count,
       coalesce((select bool_or(admin_path) from runtime_closure), false) as admin_path,
       (select count(*)::integer from gateway_closure) as gateway_closure_count,
       session_role.rolbypassrls, session_role.rolinherit, session_role.rolsuper
     from pg_roles session_role
@@ -229,81 +232,86 @@ type CommandRow = {
   owning_destination_key: string | null;
   owning_receipt_issued_at: Date | null;
   owning_receipt_valid_until: Date | null;
   idempotency_key: string;
   fingerprint: string | null;
   correlation_id: string;
   state: OutboundCommandState;
   version: number;
   lease_owner_id: string | null;
   lease_expires_at: Date | null;
   created_at: Date;
   failure_code: string | null;
 };
 
 type InboundRow = {
   event_id: string;
   binding_id: string;
   conversation_id: string;
   message_id: string;
   participant_id: string;
   connection_state: AcceptInboundCommand["envelope"]["event"]["connectionState"];
   locale: "es" | "en";
   correlation_id: string;
   received_at: Date;
   event_state: AcceptInboundCommand["envelope"]["event"]["state"];
   conversation_status: AcceptInboundCommand["envelope"]["conversation"]["status"];
   conversation_version: number;
   conversation_created_at: Date;
   conversation_updated_at: Date;
   last_activity_at: Date;
   closed_at: Date | null;
   participant_role: string;
   participant_created_at: Date;
   message_direction: "inbound" | "outbound" | "system";
   recipient_participant_id: string | null;
   message_kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
   message_created_at: Date;
 };
 
 export class PostgresCommunicationsRepository implements CommunicationsRepository {
-  constructor(private readonly sql: CommunicationsSql) {}
+  constructor(
+    private readonly sql: CommunicationsSql,
+    private readonly providerStatusReceiptResolver: VerifiedProviderStatusReceiptResolver = {
+      resolve: () => null,
+    },
+  ) {}
 
   async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
     const activeDigest = input.endpointDigests[0];
     if (!activeDigest) return { status: "replay_mismatch", code: "provider_replay_mismatch" };
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const binding = (
         await query<{
           id: string;
           endpoint_digest: string;
           endpoint_digest_key_version: string;
         }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.envelope.event.bindingId])
       )[0];
       if (
         !binding ||
         !input.endpointDigests.some(
           (digest) =>
             digest.version === binding.endpoint_digest_key_version &&
             digest.digest === binding.endpoint_digest,
         )
       ) {
         return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
       }
       const existing = (
         await query<{
           id: string;
           body_digest: string;
           binding_id: string;
           endpoint_digest: string;
           endpoint_digest_key_version: string;
         }>(
           tx,
           `select receipt.id, receipt.body_digest, envelope.binding_id, binding.endpoint_digest,
              binding.endpoint_digest_key_version
            from communication_provider_event_receipts receipt
            join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
            join communication_contact_bindings binding on binding.id = envelope.binding_id
            where receipt.connection_id = $1 and receipt.external_event_reference = $2
            limit 1 for update of receipt`,
           [input.connectionId, input.providerEventId],
         )
@@ -1043,131 +1051,175 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       }
       if (attempt.state !== "dispatching") {
         return input.outcome === "accepted" &&
           ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
           ["provider_accepted", "sent", "delivered", "read"].includes(command.state)
           ? "completed"
           : "conflict";
       }
       if (
         command.state !== "dispatching" ||
         command.lease_owner_id !== ownerHash ||
         command.version !== input.leaseVersion
       ) {
         return "conflict";
       }
       const persistence = DISPATCH_OUTCOME_PERSISTENCE[input.outcome];
       const state = persistence.state;
       await query(
         tx,
         `update communication_dispatch_attempts set state = $2, result_code = $3,
            provider_reference_digest = $4, completed_at = $5, updated_at = $5 where id = $1`,
         [
           input.attemptId,
           state,
           persistence.resultCode,
           input.providerReference ? sha256(input.providerReference) : null,
           input.now,
         ],
       );
       await query(
         tx,
         `update communication_outbound_commands set state = $2, lease_owner_id = null,
            lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
         [input.commandId, state, input.now],
       );
       return "completed";
     });
   }
 
   async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
+    const evidence = this.providerStatusReceiptResolver.resolve(input.receipt);
+    if (!evidence) return { status: "denied", code: "verified_receipt_invalid" };
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const command = (
         await query<CommandRow>(
           tx,
           `select * from communication_outbound_commands where id = $1 for update`,
           [input.commandId],
         )
       )[0];
       if (!command) return { status: "not_found" } as const;
-      const prior = await query<{ provider_event_id: string }>(
+      const attempt = (
+        await query<{ id: string; provider_reference_digest: string | null }>(
+          tx,
+          `select id, provider_reference_digest from communication_dispatch_attempts
+           where id = $1 and command_id = $2 for update`,
+          [input.attemptId, input.commandId],
+        )
+      )[0];
+      if (
+        !attempt ||
+        command.connection_id !== evidence.connectionId ||
+        attempt.provider_reference_digest !== sha256(evidence.externalMessageReference)
+      ) {
+        return { status: "denied", code: "provider_status_binding_mismatch" } as const;
+      }
+      const receiptRecord: VerifiedProviderStatusReceiptRecord = {
+        ...evidence,
+        commandId: input.commandId,
+        attemptId: input.attemptId,
+        externalMessageReferenceDigest: sha256(evidence.externalMessageReference),
+      };
+      const prior = await query<VerifiedProviderStatusReceiptRecord>(
         tx,
-        `select provider_event_id from communication_provider_status_receipts
-         where command_id = $1 and provider_event_id = $2`,
-        [input.commandId, input.providerEventId],
+        `select receipt_id as "receiptId", 'meta_hmac_sha256' as verification,
+           connection_id as "connectionId", command_id as "commandId", attempt_id as "attemptId",
+           external_message_reference_digest as "externalMessageReferenceDigest",
+           provider_event_id as "providerEventId", status, occurred_at as "occurredAt",
+           verified_at as "verifiedAt", body_digest as "bodyDigest", correlation_id as "correlationId"
+         from communication_provider_status_verifications
+         where connection_id = $1 and provider_event_id = $2 for update`,
+        [evidence.connectionId, evidence.providerEventId],
       );
-      if (prior[0]) return { status: "duplicate", commandState: command.state };
+      if (prior[0]) {
+        return sameVerifiedProviderStatusRecord(prior[0], receiptRecord)
+          ? { status: "duplicate", commandState: command.state }
+          : { status: "conflict", code: "provider_status_replay_mismatch" };
+      }
       await query(
         tx,
-        `insert into communication_provider_status_receipts (
-          command_id, provider_event_id, status, occurred_at, created_at
-        ) values ($1, $2, $3, $4, $4)`,
-        [input.commandId, input.providerEventId, input.status, input.occurredAt],
+        `insert into communication_provider_status_verifications (
+          receipt_id, command_id, attempt_id, connection_id, external_message_reference_digest,
+          provider_event_id, status, occurred_at, verified_at, body_digest, correlation_id, created_at
+        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $9)`,
+        [
+          evidence.receiptId,
+          input.commandId,
+          input.attemptId,
+          evidence.connectionId,
+          receiptRecord.externalMessageReferenceDigest,
+          evidence.providerEventId,
+          evidence.status,
+          evidence.occurredAt,
+          evidence.verifiedAt,
+          evidence.bodyDigest,
+          evidence.correlationId,
+        ],
       );
       const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
       let status: "applied" | "regressive" = "applied";
-      let nextState: OutboundCommandState = input.status;
-      if (input.status === "failed") {
+      let nextState: OutboundCommandState = evidence.status;
+      if (evidence.status === "failed") {
         if (!["provider_accepted", "dispatching", "queued"].includes(command.state)) {
           status = "regressive";
           nextState = command.state;
         }
       } else if (
-        (rank[input.status] ?? 0) <= (rank[command.state] ?? 0) ||
+        (rank[evidence.status] ?? 0) <= (rank[command.state] ?? 0) ||
         ["failed", "expired", "cancelled", "manual_review"].includes(command.state)
       ) {
         status = "regressive";
         nextState = command.state;
       }
       if (status === "applied") {
         await query(
           tx,
           `update communication_outbound_commands set state = $2, lease_owner_id = null,
              lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
           [input.commandId, nextState, input.occurredAt],
         );
         await query(
           tx,
-          `update communication_dispatch_attempts set state = $2, completed_at = $3, updated_at = $3
-           where id = (select id from communication_dispatch_attempts
-             where command_id = $1 order by attempt_ordinal desc limit 1)`,
-          [input.commandId, nextState, input.occurredAt],
+          `update communication_dispatch_attempts set state = $3, completed_at = $4, updated_at = $4
+           where id = $1 and command_id = $2`,
+           [input.attemptId, input.commandId, nextState, evidence.occurredAt],
         );
       }
       return { status, commandState: nextState };
     });
   }
 
   async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
     const authority = evaluateAuthorityChange({
       operation: input.operation,
       bindingId: input.bindingId,
       receipt: input.receipt,
       now: input.now,
     });
     if (!authority.allowed) return { status: "denied", code: authority.code };
     return withCommunicationsTransaction(this.sql, async (tx) => {
       await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
       const policy = (
         await query<{ consent_state: ConsentRecord["state"]; version: number }>(
           tx,
           COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
           [input.bindingId, input.purpose],
         )
       )[0];
       if (!policy) return { status: "denied", code: "policy_state_invalid" } as const;
       if (policy.consent_state === "withdrawn" && input.operation !== "reconsent") {
         return { status: "denied", code: "reconsent_receipt_required" } as const;
       }
       if (input.operation === "reconsent" && policy.consent_state !== "withdrawn") {
         return { status: "denied", code: "reconsent_receipt_required" } as const;
       }
       const latest = (
         await query<{ evidence_receipt_id: string; authority_version: number }>(tx,
           `select evidence_receipt_id, authority_version
            from communication_contact_evidence_events
            where binding_id = $1 and purpose = $2
              and event_kind in ('consent_granted', 'consent_regranted')
            order by sequence desc limit 1 for update`,
           [input.bindingId, input.purpose])
       )[0];
       if (policy.consent_state === "granted" && latest?.evidence_receipt_id === input.receipt!.receiptId) {
@@ -1803,81 +1855,86 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
          returning id`,
         [input.eventId, input.expectedAttempts, input.now],
       );
       if (updated[0]) return { status: "dead_lettered" } as const;
 
       const current = (
         await query<{
           state: string;
           processing_version: number;
           lease_expires_at: Date | null;
         }>(
           tx,
           `select state, processing_version, lease_expires_at
            from communication_provider_event_receipts where id = $1`,
           [input.eventId],
         )
       )[0];
       if (!current) return { status: "conflict", code: "not_found" } as const;
       if (current.state === "dead_letter") return { status: "already_terminal" } as const;
       if (current.state !== "persisted") {
         return { status: "conflict", code: "state_changed" } as const;
       }
       if (current.processing_version !== input.expectedAttempts) {
         return { status: "conflict", code: "version_mismatch" } as const;
       }
       return { status: "conflict", code: "lease_not_expired" } as const;
     });
   }
 
   async referenceState(): Promise<CommunicationsReferenceState> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
         await Promise.all([
           query<Record<string, unknown>>(tx, `select receipt.id as "eventId", receipt.state, receipt.processing_version as "leaseVersion", message.ordinal from communication_provider_event_receipts receipt join communication_event_envelopes envelope on envelope.receipt_id = receipt.id join communication_messages message on message.id = envelope.message_id order by receipt.id`),
           query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
           query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, case result_code when 'failed' then 'known_failure' when 'dispatch_unknown' then 'unknown' else result_code end as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
           query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
           query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, case when event_kind = 'consent_withdrawn' then null else evidence_receipt_id end as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
           query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
-          query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
+          query<Record<string, unknown>>(tx, `select receipt_id as "receiptId", 'meta_hmac_sha256' as verification,
+            connection_id as "connectionId", command_id as "commandId", attempt_id as "attemptId",
+            external_message_reference_digest as "externalMessageReferenceDigest",
+            provider_event_id as "providerEventId", status, occurred_at as "occurredAt",
+            verified_at as "verifiedAt", body_digest as "bodyDigest", correlation_id as "correlationId"
+            from communication_provider_status_verifications order by connection_id, provider_event_id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", case when owning_domain = 'M004' then 'communications' else 'consent' end as owner, case when owning_domain = 'M004' then 'inbound_opt_out' else 'contact_withdrawal' end as operation, triggering_event_id as "eventId", correlation_id as "correlationId", receipt_issued_at as "issuedAt", receipt_valid_until as "expiresAt", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
         ]);
       return {
         inbound,
         outbound,
         attempts,
         policies: policies as unknown as CommunicationsReferenceState["policies"],
         bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
         consentHistory: consentHistory.map((record) =>
           record.authorityReceiptId === null
             ? { ...record, authorityReceiptId: undefined }
             : record,
         ) as unknown as CommunicationsReferenceState["consentHistory"],
         templates: templates as unknown as CommunicationsReferenceState["templates"],
         providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
         withdrawalHistory: withdrawals as unknown as CommunicationsReferenceState["withdrawalHistory"],
       };
     });
   }
 
   private async loadInbound(tx: TransactionSql, eventId: string): Promise<InboundRow | undefined> {
     return (
       await query<InboundRow>(
         tx,
         `select receipt.id as event_id, envelope.binding_id, envelope.conversation_id,
           envelope.message_id, envelope.participant_id,
           connection.readiness_state as connection_state, conversation.locale,
           receipt.correlation_id, receipt.received_at, receipt.state as event_state,
           conversation.status as conversation_status, conversation.version as conversation_version,
           conversation.created_at as conversation_created_at,
           conversation.updated_at as conversation_updated_at,
           conversation.last_activity_at, conversation.closed_at,
           participant.kind as participant_role, participant.created_at as participant_created_at,
           message.direction as message_direction, message.recipient_participant_id,
           message.kind as message_kind, message.created_at as message_created_at
         from communication_provider_event_receipts receipt
         join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
         join communication_channel_connections connection on connection.id = receipt.connection_id
         join communication_conversations conversation on conversation.id = envelope.conversation_id
         join communication_participants participant on participant.id = envelope.participant_id
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index 8ecce09..0b7a60d 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -1296,80 +1296,125 @@ export const communicationDispatchAttempts = pgTable(
     ),
     check(
       "communication_dispatch_attempts_provider_io_capability_valid",
       sql`(${table.providerIoCapabilityHash} is null and ${table.providerIoStartedAt} is null) or (${table.providerIoCapabilityHash} ~ '^[0-9a-f]{64}$' and ${table.providerIoStartedAt} is not null and ${table.providerIoStartedAt} >= ${table.startedAt})`,
     ),
     index("communication_dispatch_attempts_recovery_idx").on(table.state, table.completedAt),
     communicationsOnly("communication_dispatch_attempts"),
   ],
 ).enableRLS();
 
 export const communicationProviderStatusReceipts = pgTable(
   "communication_provider_status_receipts",
   {
     commandId: text("command_id")
       .notNull()
       .references(() => communicationOutboundCommands.id, { onDelete: "cascade" }),
     providerEventId: text("provider_event_id").notNull(),
     status: varchar("status", { length: 24 }).notNull(),
     occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     primaryKey({
       name: "communication_provider_status_receipts_command_event_pk",
       columns: [table.commandId, table.providerEventId],
     }),
     check(
       "communication_provider_status_receipts_status_valid",
       sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
     ),
     pgPolicy("communication_provider_status_receipts_communications_scope", {
       as: "permissive",
       for: "all",
       to: communicationsGatewayRole,
       using: communicationsCommandScope(table.commandId),
       withCheck: communicationsCommandScope(table.commandId),
     }),
   ],
 ).enableRLS();
 
+export const communicationProviderStatusVerifications = pgTable(
+  "communication_provider_status_verifications",
+  {
+    receiptId: text("receipt_id").primaryKey(),
+    commandId: text("command_id")
+      .notNull()
+      .references(() => communicationOutboundCommands.id, { onDelete: "cascade" }),
+    attemptId: text("attempt_id")
+      .notNull()
+      .references(() => communicationDispatchAttempts.id, { onDelete: "cascade" }),
+    connectionId: text("connection_id")
+      .notNull()
+      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
+    externalMessageReferenceDigest: char("external_message_reference_digest", { length: 64 }).notNull(),
+    providerEventId: text("provider_event_id").notNull(),
+    status: varchar("status", { length: 24 }).notNull(),
+    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
+    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }).notNull(),
+    bodyDigest: char("body_digest", { length: 64 }).notNull(),
+    correlationId: text("correlation_id").notNull(),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    unique("communication_provider_status_verifications_connection_event_unique").on(
+      table.connectionId,
+      table.providerEventId,
+    ),
+    check(
+      "communication_provider_status_verifications_status_valid",
+      sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
+    ),
+    check(
+      "communication_provider_status_verifications_digest_valid",
+      sql`${table.externalMessageReferenceDigest} ~ '^[0-9a-f]{64}$' and ${table.bodyDigest} ~ '^[0-9a-f]{64}$'`,
+    ),
+    pgPolicy("communication_provider_status_verifications_communications_scope", {
+      as: "permissive",
+      for: "all",
+      to: communicationsGatewayRole,
+      using: communicationsCommandScope(table.commandId),
+      withCheck: communicationsCommandScope(table.commandId),
+    }),
+  ],
+).enableRLS();
+
 export const communicationDispatchReconciliationReceipts = pgTable(
   "communication_dispatch_reconciliation_receipts",
   {
     receiptId: text("receipt_id").primaryKey(),
     receiptDigest: char("receipt_digest", { length: 64 }).notNull(),
     commandId: text("command_id").notNull(),
     attemptId: text("attempt_id").notNull(),
     bindingId: text("binding_id").notNull(),
     source: varchar("source", { length: 32 }).notNull(),
     outcome: varchar("outcome", { length: 32 }).notNull(),
     correlationId: text("correlation_id").notNull(),
     issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
     expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     foreignKey({
       name: "communication_dispatch_reconciliation_receipts_attempt_command_fk",
       columns: [table.attemptId, table.commandId],
       foreignColumns: [communicationDispatchAttempts.id, communicationDispatchAttempts.commandId],
     }).onDelete("restrict"),
     foreignKey({
       name: "communication_dispatch_reconciliation_receipts_command_binding_fk",
       columns: [table.commandId, table.bindingId],
       foreignColumns: [communicationOutboundCommands.id, communicationOutboundCommands.bindingId],
     }).onDelete("restrict"),
     check(
       "communication_dispatch_reconciliation_receipts_digest_valid",
       sql`${table.receiptDigest} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_source_valid",
       sql`${table.source} in ('provider_lookup', 'manual_authority')`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_outcome_valid",
       sql`${table.outcome} in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_window_valid",
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
index 0e8ec63..a5f45de 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
@@ -83,80 +83,81 @@ export type BindingTrustState =
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
+  externalMessageReference?: string;
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
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
index b3adf5a..4b999e5 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
@@ -1,7 +1,8 @@
 export * from "./contracts.ts";
 export * from "./state-machines.ts";
 export * from "./channel-policy.ts";
 export * from "./repository.ts";
+export * from "./provider-status.ts";
 export * from "./memory-repository.ts";
 export * from "./service.ts";
 export * from "./jobs.ts";
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 7458c06..2512a1a 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -9,234 +9,244 @@ import type {
   ApplyProviderStatusCommand,
   BindingChangeResult,
   ClaimInboundCommand,
   ClaimOutboundCommand,
   CommunicationsReferenceState,
   CommunicationsRepository,
   CommunicationsSeed,
   CompleteInboundCommand,
   ConsentChangeResult,
   ConsentRecord,
   CreateOutboundCommand,
   CreateOutboundResult,
   DeadLetterExpiredInboundCommand,
   DeadLetterExpiredInboundResult,
   EvaluateTemplateEligibility,
   FailOutboundDraftCommand,
   FinalizeOutboundCommand,
   GrantConsentCommand,
   InboundClaimResult,
   MarkDispatchOutcomeCommand,
   OutboundClaimResult,
   ProviderStatusResult,
   RecoveryCandidate,
   RecoveryQuery,
   ReconcileOutboundCommand,
   ReconcileOutboundResult,
   ReconcileTemplateCommand,
   RegisterTemplateDefinition,
   ApproveTemplateDefinition,
   ResolveOptOutCommand,
   RevalidateBindingCommand,
   SuspendBindingCommand,
   TemplateEligibilityResult,
   TemplateRecord,
   TemplateReconciliationResult,
   TemplateResult,
   WithdrawContactCommand,
   WithdrawContactResult,
   WithdrawalHistoryRecord,
 } from "./repository.ts";
+import {
+  sameVerifiedProviderStatusRecord,
+  type VerifiedProviderStatusReceiptRecord,
+  type VerifiedProviderStatusReceiptResolver,
+} from "./provider-status.ts";
 import type {
   ChannelConnectionState,
   ChannelContactPolicy,
   ChannelKind,
   ContactChannelBinding,
   OutboundCommandState,
   OutboundDispatchAttempt,
 } from "./contracts.ts";
 
 type InboundRecord = {
   replayKey: string;
   providerBodyDigest: string;
   endpointDigests: AcceptInboundCommand["endpointDigests"];
   envelope: AcceptInboundCommand["envelope"];
   ordinal: number;
   state: "persisted" | "applied" | "manual_review" | "dead_letter";
   leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
 };
 
 type OutboundRecord = CreateOutboundCommand & {
   messageBodyDigest: string;
   fingerprint?: string;
   requiredPolicyVersion?: number;
   requiredFence?: number;
   endpointDigests?: FinalizeOutboundCommand["endpointDigests"];
   authorizationReceipt?: FinalizeOutboundCommand["authorizationReceipt"];
   failureCode?: FailOutboundDraftCommand["code"];
   state: OutboundCommandState;
   leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
   blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
 };
 
 type AttemptRecord = OutboundDispatchAttempt & {
   resultCode?: MarkDispatchOutcomeCommand["outcome"];
   leaseOwnerHash: string;
   leaseVersion: number;
   leaseExpiresAt: Date;
 };
 
 type ReconciledCommandState = Extract<
   ReconcileOutboundResult,
   { commandState: unknown }
 >["commandState"];
 
 type StoredReconciliationResult = {
   status: "reconciled";
   commandState: ReconciledCommandState;
 };
 
 type StoredReconciliationReceipt = {
   identity: string;
   result: StoredReconciliationResult;
 };
 
 type LockOperation =
   | "accept_inbound"
   | "claim_inbound"
   | "claim_outbound"
   | "complete_outbound"
   | "dead_letter_inbound"
   | "apply_provider_status"
   | "reconcile_outbound"
   | "withdraw_contact"
   | "grant_consent"
   | "resolve_opt_out"
   | "suspend_binding"
   | "revalidate_binding";
 
 export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
   lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
+  providerStatusReceiptResolver?: VerifiedProviderStatusReceiptResolver;
 };
 
 const DELIVERY_RANK: Readonly<Record<"sent" | "delivered" | "read", number>> = {
   sent: 1,
   delivered: 2,
   read: 3,
 };
 
 const MAX_LEASE_MILLISECONDS = 15 * 60_000;
 
 async function sha256(value: string): Promise<string> {
   const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
   return [...new Uint8Array(digest)]
     .map((byte) => byte.toString(16).padStart(2, "0"))
     .join("");
 }
 
 function validClaimLease(now: Date, expiresAt: Date): boolean {
   return (
     Number.isFinite(now.getTime()) &&
     Number.isFinite(expiresAt.getTime()) &&
     expiresAt > now &&
     expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS
   );
 }
 
 function metadataOnlyEnvelope(
   envelope: AcceptInboundCommand["envelope"],
 ): AcceptInboundCommand["envelope"] {
   return { ...clone(envelope), message: { ...clone(envelope.message), body: null } };
 }
 
 function metadataOnlyMessage(
   message: CreateOutboundCommand["message"],
 ): CreateOutboundCommand["message"] {
   return { ...clone(message), body: null };
 }
 
 function clone<T>(value: T): T {
   return structuredClone(value);
 }
 
 function currentReceipt(input: {
   issuedAt: Date;
   expiresAt: Date;
 }, now: Date): boolean {
   return (
     Number.isFinite(input.issuedAt.getTime()) &&
     Number.isFinite(input.expiresAt.getTime()) &&
     input.issuedAt <= now &&
     input.expiresAt > now
   );
 }
 
 export class MemoryCommunicationsRepository implements CommunicationsRepository {
   private readonly inboundByReplay = new Map<string, InboundRecord>();
   private readonly inboundById = new Map<string, InboundRecord>();
   private readonly outboundById = new Map<string, OutboundRecord>();
   private readonly outboundByIdempotency = new Map<string, OutboundRecord>();
   private readonly attempts = new Map<string, AttemptRecord>();
   private readonly policies = new Map<string, ChannelContactPolicy & { fence: number }>();
   private readonly bindings = new Map<
     string,
     ContactChannelBinding & { freshUntil: Date }
   >();
   private readonly consents = new Map<string, ConsentRecord>();
   private readonly consentHistory: ConsentRecord[] = [];
   private readonly connections = new Map<
     string,
     { channel: ChannelKind; state: ChannelConnectionState }
   >();
   private readonly templates = new Map<string, TemplateRecord>();
-  private readonly providerStatuses = new Map<string, ApplyProviderStatusCommand>();
+  private readonly providerStatuses = new Map<string, VerifiedProviderStatusReceiptRecord>();
   private readonly withdrawalHistory: WithdrawalHistoryRecord[] = [];
   private readonly reconciliationReceipts = new Map<string, StoredReconciliationReceipt>();
   private readonly bindingLockTails = new Map<string, Promise<void>>();
   private readonly lockBoundary?: MemoryCommunicationsRepositoryOptions["lockBoundary"];
+  private readonly providerStatusReceiptResolver: VerifiedProviderStatusReceiptResolver;
 
   constructor(options: MemoryCommunicationsRepositoryOptions = {}) {
     this.lockBoundary = options.lockBoundary;
+    this.providerStatusReceiptResolver = options.providerStatusReceiptResolver ?? {
+      resolve: () => null,
+    };
     for (const binding of options.bindings ?? []) {
       this.bindings.set(binding.bindingId, clone(binding));
     }
     for (const policy of options.policies ?? []) {
       this.policies.set(policy.bindingId, clone(policy));
     }
     for (const consent of options.consents ?? []) {
       this.consents.set(this.consentKey(consent.bindingId, consent.purpose), clone(consent));
     }
     for (const connection of options.connections ?? []) {
       this.connections.set(connection.channel, clone(connection));
     }
     for (const template of options.templates ?? []) {
       this.templates.set(this.templateKey(template.templateId, template.locale), clone(template));
     }
   }
 
   async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
     return this.withBindingLock(input.envelope.event.bindingId, "accept_inbound", async () => {
       const replayKey = `${input.connectionId}\u0000${input.providerEventId}`;
       const existing = this.inboundByReplay.get(replayKey);
       if (existing) {
         if (
           existing.providerBodyDigest !== input.providerBodyDigest ||
           existing.envelope.event.bindingId !== input.envelope.event.bindingId
         ) {
           return { status: "replay_mismatch", code: "provider_replay_mismatch" };
         }
         const activeDigest = existing.endpointDigests[0];
         if (!activeDigest) {
           return { status: "replay_mismatch", code: "provider_replay_mismatch" };
         }
         return {
           status: "duplicate",
           eventId: existing.envelope.event.eventId,
           endpointDigestVersion: activeDigest.version,
           endpointDigest: activeDigest.digest,
         };
       }
 
@@ -553,113 +563,141 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     if (!found) return "conflict";
     return this.withBindingLock(found.command.bindingId, "complete_outbound", async () => {
       const record = this.outboundById.get(input.commandId);
       const attempt = this.attempts.get(input.attemptId);
       if (
         !record ||
         !attempt ||
         attempt.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
         attempt.leaseVersion !== input.leaseVersion ||
         !this.validLeaseCompletion(input.now, attempt.leaseExpiresAt)
       ) {
         return "conflict";
       }
       if (attempt.state !== "dispatching") {
         return input.outcome === "accepted" &&
           ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
           ["provider_accepted", "sent", "delivered", "read"].includes(record.state)
           ? "completed"
           : "conflict";
       }
       if (
         record.state !== "dispatching" ||
         record.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
         record.leaseVersion !== input.leaseVersion
       ) {
         return "conflict";
       }
       const state: OutboundCommandState =
         input.outcome === "accepted"
           ? "provider_accepted"
           : input.outcome === "unknown"
             ? "dispatch_unknown"
             : "failed";
       record.state = state;
       record.command.state = state;
       record.leaseOwnerHash = undefined;
       record.leaseExpiresAt = undefined;
       attempt.state = state;
       attempt.resultCode = input.outcome;
       attempt.completedAt = input.now;
+      attempt.externalMessageReference = input.providerReference;
       return "completed";
     });
   }
 
   async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
+    const evidence = this.providerStatusReceiptResolver.resolve(input.receipt);
+    if (!evidence) return { status: "denied", code: "verified_receipt_invalid" };
+
     const found = this.outboundById.get(input.commandId);
     if (!found) return { status: "not_found" };
     return this.withBindingLock(found.command.bindingId, "apply_provider_status", async () => {
       const record = this.outboundById.get(input.commandId)!;
-      const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
-      if (this.providerStatuses.has(eventKey)) {
-        return { status: "duplicate", commandState: record.state };
+      const attempt = this.attempts.get(input.attemptId);
+      if (!attempt || attempt.commandId !== input.commandId) return { status: "not_found" };
+      if (
+        record.command.connectionId !== evidence.connectionId ||
+        attempt.externalMessageReference !== evidence.externalMessageReference
+      ) {
+        return { status: "denied", code: "provider_status_binding_mismatch" };
+      }
+
+      const receiptRecord: VerifiedProviderStatusReceiptRecord = {
+        ...evidence,
+        commandId: input.commandId,
+        attemptId: input.attemptId,
+        externalMessageReferenceDigest: await sha256(evidence.externalMessageReference),
+      };
+      const eventKey = `${evidence.connectionId}\u0000${evidence.providerEventId}`;
+      const prior = this.providerStatuses.get(eventKey);
+      if (prior) {
+        return sameVerifiedProviderStatusRecord(prior, receiptRecord)
+          ? { status: "duplicate", commandState: record.state }
+          : { status: "conflict", code: "provider_status_replay_mismatch" };
       }
-      this.providerStatuses.set(eventKey, clone(input));
-      if (input.status === "failed") {
+      this.providerStatuses.set(eventKey, clone(receiptRecord));
+      if (evidence.status === "failed") {
         if (["provider_accepted", "dispatching", "queued"].includes(record.state)) {
-          this.closeActiveAttempt(record, "failed", input.occurredAt);
+          record.state = "failed";
+          record.command.state = "failed";
+          attempt.state = "failed";
+          attempt.completedAt = clone(evidence.occurredAt);
           return { status: "applied", commandState: "failed" };
         }
         return { status: "regressive", commandState: record.state };
       }
       const currentRank =
         record.state === "sent" || record.state === "delivered" || record.state === "read"
           ? DELIVERY_RANK[record.state]
           : 0;
-      if (DELIVERY_RANK[input.status] <= currentRank) {
+      if (DELIVERY_RANK[evidence.status] <= currentRank) {
         return { status: "regressive", commandState: record.state };
       }
       if (["failed", "expired", "cancelled", "manual_review"].includes(record.state)) {
         return { status: "regressive", commandState: record.state };
       }
-      this.closeActiveAttempt(record, input.status, input.occurredAt);
-      return { status: "applied", commandState: input.status };
+      record.state = evidence.status;
+      record.command.state = evidence.status;
+      attempt.state = evidence.status;
+      attempt.completedAt = clone(evidence.occurredAt);
+      return { status: "applied", commandState: evidence.status };
     });
   }
 
   async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
     return this.withBindingLock(input.bindingId, "grant_consent", async () => {
       const authority = evaluateAuthorityChange({
         operation: input.operation,
         bindingId: input.bindingId,
         receipt: input.receipt,
         now: input.now,
       });
       if (!authority.allowed) return { status: "denied", code: authority.code };
       const key = this.consentKey(input.bindingId, input.purpose);
       const current = this.consents.get(key);
       if (current?.state === "withdrawn" && input.operation !== "reconsent") {
         return { status: "denied", code: "reconsent_receipt_required" };
       }
       if (current?.state === "granted" && current.authorityReceiptId === input.receipt?.receiptId) {
         return { status: "duplicate", state: "granted", version: current.version };
       }
       const next: ConsentRecord = {
         bindingId: input.bindingId,
         purpose: input.purpose,
         state: "granted",
         version: (current?.version ?? 0) + 1,
         receipt: {
           receiptId: input.receipt!.receiptId,
           owner: "consent",
           operation: "consent_confirmation",
           bindingId: input.bindingId,
           issuedAt: input.receipt!.issuedAt,
           expiresAt: input.receipt!.expiresAt,
         },
         authorityReceiptId: input.receipt!.receiptId,
         changedAt: input.now,
       };
       this.consents.set(key, next);
       this.consentHistory.push(clone(next));
       return { status: "changed", state: "granted", version: next.version };
     });
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/provider-status.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/provider-status.ts
new file mode 100644
index 0000000..757764f
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/provider-status.ts
@@ -0,0 +1,129 @@
+declare const verifiedProviderStatusReceiptBrand: unique symbol;
+
+export type ProviderStatusValue = "sent" | "delivered" | "read" | "failed";
+
+export type VerifiedProviderStatusReceipt = Readonly<{
+  [verifiedProviderStatusReceiptBrand]: true;
+}>;
+
+export type VerifiedProviderStatusEvidence = Readonly<{
+  receiptId: string;
+  verification: "meta_hmac_sha256";
+  connectionId: string;
+  externalMessageReference: string;
+  providerEventId: string;
+  status: ProviderStatusValue;
+  occurredAt: Date;
+  verifiedAt: Date;
+  bodyDigest: string;
+  correlationId: string;
+}>;
+
+export type VerifiedProviderStatusReceiptRecord = Omit<
+  VerifiedProviderStatusEvidence,
+  "externalMessageReference"
+> &
+  Readonly<{
+    commandId: string;
+    attemptId: string;
+    externalMessageReferenceDigest: string;
+  }>;
+
+export interface VerifiedProviderStatusReceiptIssuer {
+  issue(
+    evidence: Omit<VerifiedProviderStatusEvidence, "receiptId" | "verification">,
+  ): VerifiedProviderStatusReceipt;
+}
+
+export interface VerifiedProviderStatusReceiptResolver {
+  resolve(receipt: unknown): VerifiedProviderStatusEvidence | null;
+}
+
+const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$/u;
+const RECEIPT_ID = /^provider_status_[0-9a-f]{32}$/u;
+const DIGEST = /^[0-9a-f]{64}$/u;
+const STATUSES = new Set<ProviderStatusValue>(["sent", "delivered", "read", "failed"]);
+
+function cloneEvidence(evidence: VerifiedProviderStatusEvidence): VerifiedProviderStatusEvidence {
+  return Object.freeze({
+    ...evidence,
+    occurredAt: new Date(evidence.occurredAt),
+    verifiedAt: new Date(evidence.verifiedAt),
+  });
+}
+
+function validDate(value: unknown): value is Date {
+  return value instanceof Date && Number.isFinite(value.valueOf());
+}
+
+function validEvidence(evidence: VerifiedProviderStatusEvidence): boolean {
+  return (
+    RECEIPT_ID.test(evidence.receiptId) &&
+    evidence.verification === "meta_hmac_sha256" &&
+    IDENTIFIER.test(evidence.connectionId) &&
+    IDENTIFIER.test(evidence.externalMessageReference) &&
+    IDENTIFIER.test(evidence.providerEventId) &&
+    STATUSES.has(evidence.status) &&
+    validDate(evidence.occurredAt) &&
+    validDate(evidence.verifiedAt) &&
+    DIGEST.test(evidence.bodyDigest) &&
+    IDENTIFIER.test(evidence.correlationId)
+  );
+}
+
+export function sameVerifiedProviderStatusRecord(
+  left: VerifiedProviderStatusReceiptRecord,
+  right: VerifiedProviderStatusReceiptRecord,
+): boolean {
+  return (
+    left.receiptId === right.receiptId &&
+    left.verification === right.verification &&
+    left.connectionId === right.connectionId &&
+    left.commandId === right.commandId &&
+    left.attemptId === right.attemptId &&
+    left.externalMessageReferenceDigest === right.externalMessageReferenceDigest &&
+    left.providerEventId === right.providerEventId &&
+    left.status === right.status &&
+    left.occurredAt.valueOf() === right.occurredAt.valueOf() &&
+    left.verifiedAt.valueOf() === right.verifiedAt.valueOf() &&
+    left.bodyDigest === right.bodyDigest &&
+    left.correlationId === right.correlationId
+  );
+}
+
+export function createVerifiedProviderStatusReceiptAuthority(options: {
+  readonly nextReceiptId?: () => string;
+} = {}): Readonly<{
+  issuer: VerifiedProviderStatusReceiptIssuer;
+  resolver: VerifiedProviderStatusReceiptResolver;
+}> {
+  const evidenceByReceipt = new WeakMap<object, VerifiedProviderStatusEvidence>();
+  const nextReceiptId = options.nextReceiptId ?? (() => {
+    if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
+      throw new Error("VERIFIED_PROVIDER_STATUS_RECEIPT_UNAVAILABLE");
+    }
+    return `provider_status_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
+  });
+
+  const issuer: VerifiedProviderStatusReceiptIssuer = Object.freeze({
+    issue(input) {
+      const evidence = cloneEvidence({
+        ...input,
+        receiptId: nextReceiptId(),
+        verification: "meta_hmac_sha256",
+      });
+      if (!validEvidence(evidence)) throw new Error("VERIFIED_PROVIDER_STATUS_EVIDENCE_INVALID");
+      const receipt = Object.freeze(Object.create(null)) as VerifiedProviderStatusReceipt;
+      evidenceByReceipt.set(receipt, evidence);
+      return receipt;
+    },
+  });
+  const resolver: VerifiedProviderStatusReceiptResolver = Object.freeze({
+    resolve(receipt) {
+      if (typeof receipt !== "object" || receipt === null) return null;
+      const evidence = evidenceByReceipt.get(receipt);
+      return evidence ? cloneEvidence(evidence) : null;
+    },
+  });
+  return Object.freeze({ issuer, resolver });
+}
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
index 7763348..6bd2fec 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts
@@ -1,62 +1,66 @@
 import type {
   ChannelConnectionState,
   ChannelContactPolicy,
   ChannelConversation,
   ChannelKind,
   ChannelLocale,
   ChannelMessage,
   ChannelParticipant,
   ContactChannelBinding,
   ContactConsentState,
   ContactPurpose,
   DomainReceipt,
   InboundChannelEvent,
   OutboundCommandState,
   OutboundDispatchAttempt,
   OutboundMessageCommand,
   TemplateLifecycleState,
 } from "./contracts.ts";
 import type {
   OutboundAuthorizationReceipt,
   OwningAuthorityReceipt,
 } from "./channel-policy.ts";
+import type {
+  VerifiedProviderStatusReceipt,
+  VerifiedProviderStatusReceiptRecord,
+} from "./provider-status.ts";
 
 export type EndpointDigest = {
   version: string;
   digest: string;
 };
 
 export type CanonicalInboundEnvelope = {
   event: InboundChannelEvent;
   conversation: ChannelConversation;
   participant: ChannelParticipant;
   message: ChannelMessage;
 };
 
 export type AcceptInboundCommand = {
   connectionId: string;
   providerEventId: string;
   providerBodyDigest: string;
   endpointDigests: readonly EndpointDigest[];
   envelope: CanonicalInboundEnvelope;
   optOutSignal: "none" | "pending";
 };
 
 export type AcceptInboundResult =
   | {
       status: "accepted" | "duplicate";
       eventId: string;
       endpointDigestVersion: string;
       endpointDigest: string;
     }
   | { status: "replay_mismatch"; code: "provider_replay_mismatch" };
 
 export type ClaimInboundCommand = {
   eventId: string;
   leaseOwner: string;
   leaseExpiresAt: Date;
   now: Date;
   requiredPolicyVersion: number;
 };
 
 export type InboundClaimResult =
@@ -149,91 +153,95 @@ export type OutboundClaimResult =
     }
   | {
       status: "not_claimed";
       code:
         | "not_found"
         | "lease_conflict"
         | "dispatch_unknown_non_retryable"
         | "already_completed"
         | "binding_not_found"
         | "policy_not_found"
         | "consent_not_found"
         | "contact_policy_denied"
         | "marketing_denied"
         | "binding_not_reverified"
         | "binding_freshness_invalid"
         | "binding_stale"
         | "consent_not_granted"
         | "consent_receipt_missing"
         | "consent_receipt_invalid"
         | "policy_version_mismatch"
         | "policy_fence_mismatch"
         | "connection_not_ready"
         | "template_ineligible"
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "destination_mismatch";
     };
 
 export type MarkDispatchOutcomeCommand = {
   commandId: string;
   attemptId: string;
   leaseOwner: string;
   leaseVersion: number;
   outcome: "accepted" | "known_failure" | "unknown";
   now: Date;
   providerReference?: string;
 };
 
 export type ApplyProviderStatusCommand = {
   commandId: string;
-  providerEventId: string;
-  status: "sent" | "delivered" | "read" | "failed";
-  occurredAt: Date;
+  attemptId: string;
+  receipt: VerifiedProviderStatusReceipt;
 };
 
 export type ProviderStatusResult =
   | {
       status: "applied" | "duplicate" | "regressive";
       commandState: OutboundCommandState;
     }
-  | { status: "not_found" };
+  | { status: "not_found" }
+  | {
+      status: "denied";
+      code: "verified_receipt_invalid" | "provider_status_binding_mismatch";
+    }
+  | { status: "conflict"; code: "provider_status_replay_mismatch" };
 
 export type ConsentRecord = {
   bindingId: string;
   purpose: ContactPurpose;
   state: ContactConsentState;
   version: number;
   receipt?: import("./channel-policy.ts").ConsentReceipt;
   authorityReceiptId?: string;
   changedAt: Date;
 };
 
 export type GrantConsentCommand = {
   bindingId: string;
   purpose: ContactPurpose;
   operation: "consent_grant" | "reconsent";
   receipt?: OwningAuthorityReceipt;
   now: Date;
 };
 
 export type ConsentChangeResult =
   | {
       status: "changed" | "duplicate" | "unchanged";
       state: ContactConsentState;
       version: number;
     }
   | {
       status: "denied";
       code:
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "reconsent_receipt_required"
         | "policy_state_invalid";
     };
 
 export type AmbiguousOptOutResolutionResult =
   | {
       status: "changed";
       policyState: "normal_after_review";
       policyVersion: number;
     }
@@ -520,55 +528,55 @@ export interface CommunicationsRepository {
   applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult>;
   grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult>;
   withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult>;
   resolveAmbiguousOptOutFromReceipt(
     input: ResolveOptOutCommand,
   ): Promise<AmbiguousOptOutResolutionResult>;
   suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult>;
   revalidateBindingFromReceipt(input: RevalidateBindingCommand): Promise<BindingChangeResult>;
   reconcileTemplate(input: ReconcileTemplateCommand): Promise<TemplateReconciliationResult>;
   reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult>;
   findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]>;
   deadLetterExpiredInbound(
     input: DeadLetterExpiredInboundCommand,
   ): Promise<DeadLetterExpiredInboundResult>;
   registerTemplateDefinition(input: RegisterTemplateDefinition & { now: Date }): Promise<TemplateResult>;
   approveTemplateDefinition(
     input: ApproveTemplateDefinition & { now: Date },
   ): Promise<TemplateResult>;
   evaluateTemplateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult>;
 }
 
 export interface MessageTemplateService {
   registerInternalDefinition(input: RegisterTemplateDefinition): Promise<TemplateResult>;
   recordInternalApproval(input: ApproveTemplateDefinition): Promise<TemplateResult>;
   applyProviderProjection(input: ReconcileTemplateCommand): Promise<TemplateResult>;
   evaluateEligibility(
     input: EvaluateTemplateEligibility,
   ): Promise<TemplateEligibilityResult>;
 }
 
 export type CommunicationsReferenceState = {
   inbound: readonly Record<string, unknown>[];
   outbound: readonly Record<string, unknown>[];
   attempts: readonly Record<string, unknown>[];
   policies: readonly (ChannelContactPolicy & { fence: number })[];
   bindings: readonly (ContactChannelBinding & { freshUntil: Date })[];
   consentHistory: readonly ConsentRecord[];
   templates: readonly TemplateRecord[];
-  providerStatuses: readonly ApplyProviderStatusCommand[];
+  providerStatuses: readonly VerifiedProviderStatusReceiptRecord[];
   withdrawalHistory: readonly WithdrawalHistoryRecord[];
 };
 
 export type CommunicationsSeed = {
   bindings?: readonly (ContactChannelBinding & { freshUntil: Date })[];
   policies?: readonly (ChannelContactPolicy & { fence: number })[];
   consents?: readonly ConsentRecord[];
   connections?: readonly { channel: ChannelKind; state: ChannelConnectionState }[];
   templates?: readonly TemplateRecord[];
 };
 
 export type HandoffRequestResult =
   | { status: "queued"; receipt?: DomainReceipt }
   | { status: "unavailable" };
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
index f90cc32..5219bde 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts
@@ -1,207 +1,163 @@
 import type {
   ChannelKind,
   ChannelLocale,
   ChannelMessage,
-  DomainReceipt,
 } from "./contracts.ts";
 import type {
   AcceptInboundResult,
   CanonicalInboundEnvelope,
   CommunicationsRepository,
   EndpointDigest,
   EvaluateTemplateEligibility,
-  HandoffRequestResult,
   MessageTemplateService,
   ReconcileOutboundCommand,
   ReconcileOutboundResult,
   ReconcileTemplateCommand,
   RegisterTemplateDefinition,
   ApproveTemplateDefinition,
   TemplateEligibilityResult,
   TemplateResult,
 } from "./repository.ts";
 
 export type EndpointDigestKey = {
   purpose: "communications_endpoint_digest";
   version: string;
   key: string;
 };
 
 export interface EndpointDigestKeyResolver {
   resolve(): Promise<
     | {
         status: "available";
         active: EndpointDigestKey;
         prior: readonly EndpointDigestKey[];
       }
     | { status: "unavailable" }
   >;
 }
 
 export interface KeyedDigestPort {
   digest(input: { key: string; payload: string }): Promise<string>;
 }
 
 export interface DestinationResolutionPort {
   resolve(input: { bindingId: string }): Promise<
     | { status: "resolved"; endpoint: string }
     | { status: "unavailable" }
   >;
 }
 
 export interface BoundedExecutor {
   run<T>(operation: string, timeoutMs: number, action: () => Promise<T>): Promise<T>;
 }
 
 export interface OutboundProviderPort {
   dispatch(input: {
     commandId: string;
     attemptId: string;
     destination: string;
     message: ChannelMessage;
   }): Promise<
     | { status: "accepted"; providerReference?: string }
     | { status: "failed"; code: string }
     | { status: "unavailable" }
   >;
 }
 
-export interface PublicKnowledgePort {
-  answer(input: { prompt: string; locale: ChannelLocale }): Promise<
-    | { status: "available"; text: string; sourceReceipt?: string }
-    | { status: "unavailable" }
-  >;
-}
-
 export interface ContentPolicyPort {
   evaluate(input: { text: string }):
     | { allowed: true; code: "allowed" }
     | { allowed: false; code: string };
 }
 
-export interface HandoffPort {
-  request(input: {
-    conversationId: string;
-    idempotencyKey: string;
-  }): Promise<HandoffRequestResult>;
-}
-
 export type CommunicationsServiceDependencies = {
   repository: CommunicationsRepository;
   clock: { now(): Date };
   ids: { next(kind: string): string };
   endpointDigestKeys: EndpointDigestKeyResolver;
   keyedDigest: KeyedDigestPort;
   destinationResolver: DestinationResolutionPort;
   boundedExecutor: BoundedExecutor;
   provider: OutboundProviderPort;
-  publicKnowledge: PublicKnowledgePort;
-  contentPolicy: ContentPolicyPort;
-  handoff: HandoffPort;
   providerTimeoutMs: number;
-  knowledgeTimeoutMs: number;
-  handoffTimeoutMs: number;
 };
 
 export type AcceptInboundApplicationCommand = {
   connectionId: string;
   providerEventId: string;
   providerBodyDigest: string;
   endpoint: string;
   envelope: CanonicalInboundEnvelope;
   optOutSignal: "none" | "pending";
 };
 
 export type QueueOutboundApplicationCommand = {
   channel: ChannelKind;
   locale: ChannelLocale;
   conversationId: string;
   bindingId: string;
   body: string;
   purpose: import("./contracts.ts").ContactPurpose;
   templateId: string;
   idempotencyKey: string;
   fingerprint: string;
   requiredPolicyVersion: number;
   requiredFence: number;
   authorizationReceipt?: import("./channel-policy.ts").OutboundAuthorizationReceipt;
   correlationId: string;
 };
 
 type EndpointResolution =
   | { status: "available"; endpoint: string; digests: readonly EndpointDigest[] }
   | {
       status: "unavailable";
       code:
         | "destination_unavailable"
         | "endpoint_digest_key_unavailable"
         | "endpoint_digest_key_invalid";
     };
 
 const KEY_VERSION = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
-const RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
 const ENDPOINT_DIGEST_DOMAIN = "communications:endpoint-digest:v1\u0000";
 const MAX_PRIOR_ENDPOINT_KEYS = 3;
 
-function validDate(value: Date): boolean {
-  return Number.isFinite(value.getTime());
-}
-
-function validHandoffReceipt(
-  receipt: DomainReceipt | undefined,
-  input: { conversationId: string; idempotencyKey: string; now: Date },
-): boolean {
-  return Boolean(
-    receipt &&
-      receipt.owner === "communications" &&
-      receipt.operation === "handoff" &&
-      RECEIPT_ID.test(receipt.receiptId) &&
-      receipt.resourceId === input.conversationId &&
-      receipt.idempotencyKey === input.idempotencyKey &&
-      validDate(receipt.issuedAt) &&
-      validDate(receipt.expiresAt) &&
-      receipt.issuedAt <= input.now &&
-      receipt.expiresAt > input.now,
-  );
-}
-
 export class CommunicationsService {
   constructor(private readonly dependencies: CommunicationsServiceDependencies) {}
 
   async acceptInbound(
     input: AcceptInboundApplicationCommand,
   ): Promise<
     | AcceptInboundResult
     | {
         status: "unavailable";
         code: "endpoint_digest_key_unavailable" | "endpoint_digest_key_invalid";
       }
   > {
     const resolved = await this.digestEndpoint(input.endpoint);
     if (resolved.status === "unavailable") {
       return {
         status: "unavailable",
         code:
           resolved.code === "destination_unavailable"
             ? "endpoint_digest_key_unavailable"
             : resolved.code,
       };
     }
     return this.dependencies.repository.acceptInbound({
       connectionId: input.connectionId,
       providerEventId: input.providerEventId,
       providerBodyDigest: input.providerBodyDigest,
       endpointDigests: resolved.digests,
       envelope: input.envelope,
       optOutSignal: input.optOutSignal,
     });
   }
 
   async queueOutbound(input: QueueOutboundApplicationCommand): Promise<Record<string, unknown>> {
     const copy = this.dependencies.contentPolicy.evaluate({ text: input.body });
     if (!copy.allowed) return { status: "unavailable", code: "prohibited_content" };
     const now = this.dependencies.clock.now();
     const commandId = this.dependencies.ids.next("outbound_command");
     const messageId = this.dependencies.ids.next("outbound_message");
     const draft = await this.dependencies.repository.createOutbound({
       command: {
@@ -357,219 +313,89 @@ export class CommunicationsService {
         const completion = await this.dependencies.repository.markDispatchOutcome({
           commandId: input.commandId,
           attemptId,
           leaseOwner: input.leaseOwner,
           leaseVersion: claim.attempt.leaseVersion,
           outcome: "accepted",
           providerReference: providerResult.providerReference,
           now: this.dependencies.clock.now(),
         });
         if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
         return { status: "accepted", attemptId };
       }
       const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "known_failure",
         now: this.dependencies.clock.now(),
       });
       if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return {
         status: "not_dispatched",
         code: providerResult.status === "unavailable" ? "provider_unavailable" : "provider_rejected",
         attemptId,
       };
     } catch {
       const completion = await this.dependencies.repository.markDispatchOutcome({
         commandId: input.commandId,
         attemptId,
         leaseOwner: input.leaseOwner,
         leaseVersion: claim.attempt.leaseVersion,
         outcome: "unknown",
         now: this.dependencies.clock.now(),
       });
       if (completion === "conflict") return this.dispatchCompletionConflict(input.commandId, attemptId);
       return { status: "dispatch_unknown", code: "provider_outcome_ambiguous", attemptId };
     }
   }
 
-  async processInbound(input: {
-    eventId: string;
-    leaseOwner: string;
-    leaseExpiresAt: Date;
-    requiredPolicyVersion: number;
-    action: "public_knowledge" | "handoff";
-    prompt?: string;
-    idempotencyKey?: string;
-  }): Promise<Record<string, unknown>> {
-    const claim = await this.dependencies.repository.claimInbound({
-      eventId: input.eventId,
-      leaseOwner: input.leaseOwner,
-      leaseExpiresAt: input.leaseExpiresAt,
-      requiredPolicyVersion: input.requiredPolicyVersion,
-      now: this.dependencies.clock.now(),
-    });
-    if (claim.status === "not_claimed") {
-      return { status: "conflict", code: claim.code };
-    }
-    if (claim.policyState === "opt_out_pending" || claim.policyState === "withdrawn") {
-      if (!(await this.completeInbound(claim, input, "applied"))) {
-        return this.inboundCompletionConflict(input.eventId);
-      }
-      return { status: "opt_out_pending", eventId: input.eventId };
-    }
-    if (input.action === "handoff") {
-      const idempotencyKey = input.idempotencyKey ?? "";
-      try {
-        const result = await this.dependencies.boundedExecutor.run(
-          "communications_handoff",
-          this.dependencies.handoffTimeoutMs,
-          () =>
-            this.dependencies.handoff.request({
-              conversationId: claim.envelope.conversation.id,
-              idempotencyKey,
-            }),
-        );
-        if (result.status !== "queued") {
-          if (!(await this.completeInbound(claim, input, "manual_review"))) {
-            return this.inboundCompletionConflict(input.eventId);
-          }
-          return { status: "manual", code: "handoff_unavailable" };
-        }
-        if (
-          !validHandoffReceipt(result.receipt, {
-            conversationId: claim.envelope.conversation.id,
-            idempotencyKey,
-            now: this.dependencies.clock.now(),
-          })
-        ) {
-          if (!(await this.completeInbound(claim, input, "manual_review"))) {
-            return this.inboundCompletionConflict(input.eventId);
-          }
-          return { status: "manual", code: "handoff_receipt_missing" };
-        }
-        if (!(await this.completeInbound(claim, input, "applied"))) {
-          return this.inboundCompletionConflict(input.eventId);
-        }
-        return { status: "handoff_queued", receiptId: result.receipt!.receiptId };
-      } catch {
-        if (!(await this.completeInbound(claim, input, "manual_review"))) {
-          return this.inboundCompletionConflict(input.eventId);
-        }
-        return { status: "manual", code: "handoff_unavailable" };
-      }
-    }
-
-    try {
-      const answer = await this.dependencies.boundedExecutor.run(
-        "communications_public_knowledge",
-        this.dependencies.knowledgeTimeoutMs,
-        () =>
-          this.dependencies.publicKnowledge.answer({
-            prompt: input.prompt ?? "",
-            locale: claim.envelope.event.locale,
-          }),
-      );
-      if (answer.status !== "available") {
-        if (!(await this.completeInbound(claim, input, "manual_review"))) {
-          return this.inboundCompletionConflict(input.eventId);
-        }
-        return { status: "manual", code: "knowledge_unavailable" };
-      }
-      if (!answer.sourceReceipt) {
-        if (!(await this.completeInbound(claim, input, "manual_review"))) {
-          return this.inboundCompletionConflict(input.eventId);
-        }
-        return { status: "manual", code: "knowledge_receipt_missing" };
-      }
-      const decision = this.dependencies.contentPolicy.evaluate({ text: answer.text });
-      if (!decision.allowed) {
-        if (!(await this.completeInbound(claim, input, "manual_review"))) {
-          return this.inboundCompletionConflict(input.eventId);
-        }
-        return { status: "manual", code: "prohibited_content" };
-      }
-      if (!(await this.completeInbound(claim, input, "applied"))) {
-        return this.inboundCompletionConflict(input.eventId);
-      }
-      return {
-        status: "answered",
-        text: answer.text,
-        sourceReceipt: answer.sourceReceipt,
-      };
-    } catch {
-      if (!(await this.completeInbound(claim, input, "manual_review"))) {
-        return this.inboundCompletionConflict(input.eventId);
-      }
-      return { status: "manual", code: "knowledge_unavailable" };
-    }
-  }
-
-  private async completeInbound(
-    claim: Extract<Awaited<ReturnType<CommunicationsRepository["claimInbound"]>>, { status: "claimed" }>,
-    input: { eventId: string; leaseOwner: string },
-    outcome: "applied" | "manual_review" | "dead_letter",
-  ): Promise<boolean> {
-    return (await this.dependencies.repository.completeInbound({
-      eventId: input.eventId,
-      leaseOwner: input.leaseOwner,
-      leaseVersion: claim.leaseVersion,
-      outcome,
-      now: this.dependencies.clock.now(),
-    })) === "completed";
-  }
-
   async reconcileOutbound(
     input: Omit<ReconcileOutboundCommand, "now">,
   ): Promise<ReconcileOutboundResult> {
     return this.dependencies.repository.reconcileOutbound({
       ...input,
       now: this.dependencies.clock.now(),
     });
   }
 
-  private inboundCompletionConflict(eventId: string): Record<string, unknown> {
-    return { status: "recovery_required", code: "inbound_completion_conflict", eventId };
-  }
-
   private dispatchCompletionConflict(
     commandId: string,
     attemptId: string,
   ): Record<string, unknown> {
     return {
       status: "recovery_required",
       code: "dispatch_completion_conflict",
       commandId,
       attemptId,
     };
   }
 
   private async resolveDestination(bindingId: string): Promise<EndpointResolution> {
     try {
       const destination = await this.dependencies.destinationResolver.resolve({ bindingId });
       if (destination.status !== "resolved" || !destination.endpoint) {
         return { status: "unavailable", code: "destination_unavailable" };
       }
       return this.digestEndpoint(destination.endpoint);
     } catch {
       return { status: "unavailable", code: "destination_unavailable" };
     }
   }
 
   private async digestEndpoint(endpoint: string): Promise<EndpointResolution> {
     let ring: Awaited<ReturnType<EndpointDigestKeyResolver["resolve"]>>;
     try {
       ring = await this.dependencies.endpointDigestKeys.resolve();
     } catch {
       return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
     }
     if (ring.status !== "available") {
       return { status: "unavailable", code: "endpoint_digest_key_unavailable" };
     }
     const keys = [ring.active, ...ring.prior];
     const versions = new Set<string>();
     if (
       ring.prior.length > MAX_PRIOR_ENDPOINT_KEYS ||
       keys.some(
         (candidate) =>
```
