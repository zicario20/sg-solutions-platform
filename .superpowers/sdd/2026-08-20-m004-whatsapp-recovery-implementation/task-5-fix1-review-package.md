# Task 5 fix round 1

## Commits
a1a8524 fix(m004): harden Meta adapter review findings

## Stat
 .../apps/app/src/lib/whatsapp/meta-adapter.ts      | 170 +++++++++++++++---
 .../apps/app/src/lib/whatsapp/meta-contracts.ts    |   4 +-
 .../apps/app/src/lib/whatsapp/meta-webhook.ts      |   9 +
 .../workspace/tests/m004/meta-adapter.test.ts      | 199 +++++++++++++++++----
 .../workspace/tests/m004/meta-webhook.test.ts      |  29 +++
 5 files changed, 353 insertions(+), 58 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
index 6835729..618f1b5 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
@@ -33,24 +33,43 @@ export type MetaCloudAdapterOptions = {
 
 const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
 const EXTERNAL_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,255}$/u;
 const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
 const ENDPOINT = /^\+[1-9][0-9]{7,14}$/u;
 const GRAPH_VERSION = /^v[1-9][0-9]*\.[0-9]+$/u;
 const MIME_TYPE = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}$/u;
 const CHECKSUM = /^[a-f0-9]{64}$/u;
 const TEMPLATE_NAME = /^[a-z0-9][a-z0-9_]{0,511}$/u;
 const LANGUAGE_CODE = /^(?:en|es)_[A-Z]{2}$/u;
-const BCP47_LANGUAGE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/u;
 const MAX_JSON_DEPTH = 20;
 const MAX_JSON_COLLECTION_ENTRIES = 64;
 const MAX_JSON_STRING_CODE_UNITS = 8_192;
+// Provider callback timestamps are exact Unix seconds. The floor excludes legacy/impossible data,
+// while five minutes of forward skew permits ordinary clock drift without accepting future events.
+const MIN_PROVIDER_UNIX_SECONDS = 1_577_836_800;
+const MAX_PROVIDER_FUTURE_SKEW_SECONDS = 300;
+// These statuses prove the provider rejected the request before accepting a message. Timeouts,
+// throttling, conflict, redirects, informational responses and server failures remain ambiguous.
+const PRE_ACCEPTANCE_REJECTION_STATUSES = new Set([
+  400,
+  401,
+  403,
+  404,
+  405,
+  406,
+  410,
+  411,
+  413,
+  414,
+  415,
+  422,
+]);
 
 class DuplicateJsonKeyError extends Error {}
 
 class BoundedJsonParser {
   private index = 0;
 
   constructor(private readonly source: string) {}
 
   parse(): unknown {
     this.skipWhitespace();
@@ -213,29 +232,39 @@ function hasWhitespaceOrControl(value: string): boolean {
 
 function isString(value: unknown, minimum: number, maximum: number): value is string {
   return (
     typeof value === "string" &&
     value.length >= minimum &&
     value.length <= maximum &&
     !hasUnsafeControl(value)
   );
 }
 
-function parseTimestamp(value: unknown): Date | null {
-  if (typeof value !== "string" || !/^[0-9]{10,13}$/u.test(value)) return null;
-  const date = new Date(Number(value) * 1_000);
+function plausibleUnixSeconds(value: number, verifiedAt: Date): boolean {
+  return (
+    Number.isSafeInteger(value) &&
+    value >= MIN_PROVIDER_UNIX_SECONDS &&
+    value <= Math.floor(verifiedAt.valueOf() / 1_000) + MAX_PROVIDER_FUTURE_SKEW_SECONDS
+  );
+}
+
+function parseTimestamp(value: unknown, verifiedAt: Date): Date | null {
+  if (typeof value !== "string" || !/^[1-9][0-9]{9}$/u.test(value)) return null;
+  const seconds = Number(value);
+  if (!plausibleUnixSeconds(seconds, verifiedAt)) return null;
+  const date = new Date(seconds * 1_000);
   return Number.isNaN(date.valueOf()) ? null : date;
 }
 
-function parseNumericTimestamp(value: unknown): Date | null {
-  if (!Number.isSafeInteger(value) || (value as number) < 1_000_000_000) return null;
-  const date = new Date((value as number) * 1_000);
+function parseNumericTimestamp(value: unknown, verifiedAt: Date): Date | null {
+  if (typeof value !== "number" || !plausibleUnixSeconds(value, verifiedAt)) return null;
+  const date = new Date(value * 1_000);
   return Number.isNaN(date.valueOf()) ? null : date;
 }
 
 function parseProviderJson(
   raw: Uint8Array,
 ): { status: "parsed"; value: unknown } | { status: "duplicate" | "malformed" } {
   try {
     const source = new TextDecoder("utf-8", { fatal: true }).decode(raw);
     return { status: "parsed", value: new BoundedJsonParser(source).parse() };
   } catch (error) {
@@ -322,21 +351,21 @@ function normalizeMessage(
     if ((value.statuses as unknown[]).length !== 1) return unsupported(context, "ambiguous_payload");
     const status = (value.statuses as unknown[])[0];
     if (
       !isRecord(status) ||
       !hasOnlyKeys(status, ["id", "status", "timestamp", "recipient_id", "conversation", "pricing", "errors"]) ||
       !EXTERNAL_IDENTIFIER.test(String(status.id ?? "")) ||
       !["sent", "delivered", "read", "failed"].includes(String(status.status))
     ) {
       return unsupported(context, "malformed_payload");
     }
-    const occurredAt = parseTimestamp(status.timestamp);
+    const occurredAt = parseTimestamp(status.timestamp, context.verifiedAt);
     if (!occurredAt) return unsupported(context, "malformed_payload");
     const state = status.status as "delivered" | "failed" | "read" | "sent";
     return Object.freeze({
       kind: "message_status",
       connectionId: context.connectionId,
       externalEventReference: `${String(status.id)}:${state}:${String(status.timestamp)}`,
       externalMessageReference: String(status.id),
       status: state,
       occurredAt,
       receivedAt: new Date(context.verifiedAt),
@@ -348,21 +377,21 @@ function normalizeMessage(
   const message = (value.messages as unknown[])[0];
   if (!isRecord(message)) return unsupported(context, "malformed_payload");
   const commonKeys = ["from", "id", "timestamp", "type", "context"];
   if (
     !EXTERNAL_IDENTIFIER.test(String(message.id ?? "")) ||
     typeof message.from !== "string" ||
     !/^[1-9][0-9]{7,14}$/u.test(message.from)
   ) {
     return unsupported(context, "malformed_payload");
   }
-  const occurredAt = parseTimestamp(message.timestamp);
+  const occurredAt = parseTimestamp(message.timestamp, context.verifiedAt);
   if (!occurredAt) return unsupported(context, "malformed_payload");
   const base = {
     connectionId: context.connectionId,
     externalEventReference: String(message.id),
     messageReference: String(message.id),
     senderEndpoint: `+${message.from}`,
     occurredAt,
     receivedAt: new Date(context.verifiedAt),
     correlationId: context.correlationId,
   } as const;
@@ -474,47 +503,124 @@ function normalizeMessage(
     });
   }
 
   return unsupported(context, "unsupported_event");
 }
 
 function normalizeTemplate(
   value: JsonRecord,
   entryTime: unknown,
   context: ResolvedVerifiedWebhookContext,
-): UnsupportedVerifiedEnvelope {
+): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
+  const statusByEvent = {
+    APPROVED: "provider_approved",
+    DISABLED: "disabled",
+    PAUSED: "paused",
+    REJECTED: "provider_rejected",
+  } as const;
+  const categoryByProvider = {
+    AUTHENTICATION: "authentication",
+    MARKETING: "marketing",
+    UTILITY: "utility",
+  } as const;
+
   if (
     !hasOnlyKeys(value, [
       "event",
       "message_template_id",
       "message_template_name",
       "message_template_language",
       "message_template_category",
       "message_template_components",
+      "message_template_version",
       "reason",
     ]) ||
-    !isString(value.event, 1, 64) ||
+    typeof value.event !== "string" ||
+    !(value.event in statusByEvent) ||
     !EXTERNAL_IDENTIFIER.test(String(value.message_template_id ?? "")) ||
-    !isString(value.message_template_name, 1, 512) ||
+    typeof value.message_template_name !== "string" ||
+    !TEMPLATE_NAME.test(value.message_template_name) ||
     typeof value.message_template_language !== "string" ||
-    !BCP47_LANGUAGE.test(value.message_template_language) ||
-    (value.message_template_category !== undefined &&
-      !["AUTHENTICATION", "MARKETING", "UTILITY"].includes(String(value.message_template_category))) ||
-    (value.message_template_components !== undefined &&
-      !Array.isArray(value.message_template_components)) ||
-    (value.reason !== undefined && value.reason !== null && !isString(value.reason, 0, 1_024)) ||
-    !parseNumericTimestamp(entryTime)
+    !/^(?:en|es)_[A-Z]{2}$/u.test(value.message_template_language) ||
+    typeof value.message_template_category !== "string" ||
+    !(value.message_template_category in categoryByProvider) ||
+    !Array.isArray(value.message_template_components) ||
+    !/^[1-9][0-9]{0,8}$/u.test(String(value.message_template_version ?? "")) ||
+    (value.reason !== undefined && value.reason !== null && !isString(value.reason, 0, 1_024))
   ) {
-    return unsupported(context, "malformed_payload");
+    return unsupported(context, "template_manual_review");
+  }
+
+  const providerTimestamp = parseNumericTimestamp(entryTime, context.verifiedAt);
+  const providerVersion = String(value.message_template_version);
+  const version = Number(providerVersion);
+  const components: { type: "body" | "footer" | "header"; format?: "text"; text: string }[] = [];
+  const seenTypes = new Set<string>();
+  for (const candidate of value.message_template_components) {
+    if (!isRecord(candidate) || typeof candidate.type !== "string" || seenTypes.has(candidate.type)) {
+      return unsupported(context, "template_manual_review");
+    }
+    seenTypes.add(candidate.type);
+    if (
+      candidate.type === "HEADER" &&
+      hasOnlyKeys(candidate, ["type", "format", "text"]) &&
+      candidate.format === "TEXT" &&
+      isString(candidate.text, 1, 1_024)
+    ) {
+      components.push({ type: "header", format: "text", text: candidate.text });
+      continue;
+    }
+    if (
+      (candidate.type === "BODY" || candidate.type === "FOOTER") &&
+      hasOnlyKeys(candidate, ["type", "text"]) &&
+      isString(candidate.text, 1, 4_096)
+    ) {
+      components.push({
+        type: candidate.type === "BODY" ? "body" : "footer",
+        text: candidate.text,
+      });
+      continue;
+    }
+    return unsupported(context, "template_manual_review");
+  }
+  if (!providerTimestamp || !Number.isSafeInteger(version) || !seenTypes.has("BODY")) {
+    return unsupported(context, "template_manual_review");
   }
 
-  return unsupported(context, "template_manual_review");
+  const status = statusByEvent[value.event as keyof typeof statusByEvent];
+  const category =
+    categoryByProvider[value.message_template_category as keyof typeof categoryByProvider];
+  const locale = value.message_template_language.startsWith("en_") ? "en" : "es";
+  const providerReference = String(value.message_template_id);
+  const templateKey = value.message_template_name;
+  const frozenComponents = Object.freeze(components.map((component) => Object.freeze(component)));
+  return Object.freeze({
+    kind: "template_projection",
+    connectionId: context.connectionId,
+    externalEventReference: `${providerReference}:${value.event}:${providerVersion}`,
+    receivedAt: new Date(context.verifiedAt),
+    correlationId: context.correlationId,
+    projection: Object.freeze({
+      templateId: templateKey,
+      locale,
+      state: status,
+      version,
+      updatedAt: new Date(providerTimestamp),
+      providerReference,
+      templateKey,
+      category,
+      components: frozenComponents,
+      status,
+      providerVersion,
+      providerTimestamp: new Date(providerTimestamp),
+    }),
+  });
 }
 
 function normalizePayload(
   payload: unknown,
   context: ResolvedVerifiedWebhookContext,
 ): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
   const root = messageRoot(payload, context);
   if ("kind" in root) return root;
   if (root.change.field === "messages") return normalizeMessage(root.value, context);
   if (root.change.field === "message_template_status_update") {
@@ -671,20 +777,28 @@ async function readBoundedResponse(
   }
   const combined = new Uint8Array(total);
   let offset = 0;
   for (const chunk of chunks) {
     combined.set(chunk, offset);
     offset += chunk.byteLength;
   }
   return combined;
 }
 
+async function cancelResponseBody(response: Response): Promise<void> {
+  try {
+    await response.body?.cancel();
+  } catch {
+    // Cancellation is best-effort; response details remain unread and are never logged.
+  }
+}
+
 function acceptedReference(raw: Uint8Array): string | null {
   const parsed = parseProviderJson(raw);
   if (parsed.status !== "parsed" || !isRecord(parsed.value)) return null;
   if (!hasOnlyKeys(parsed.value, ["messaging_product", "contacts", "messages"])) return null;
   if (!Array.isArray(parsed.value.messages) || parsed.value.messages.length !== 1) return null;
   const message = parsed.value.messages[0];
   if (
     !isRecord(message) ||
     !hasOnlyKeys(message, ["id"]) ||
     !EXTERNAL_IDENTIFIER.test(String(message.id ?? ""))
@@ -716,21 +830,21 @@ export function createMetaCloudAdapter(options: MetaCloudAdapterOptions): WhatsA
   const observedAt = new Date(options.capabilityObservedAt);
 
   return Object.freeze({
     capabilities(): ProviderCapabilitySnapshot {
       return Object.freeze({
         requestIdempotency: false,
         stableReference: false,
         messageLookup: false,
         statusReconciliation: false,
         mediaReferences: true,
-        templateProjection: false,
+        templateProjection: true,
         get observedAt(): Date {
           return new Date(observedAt);
         },
         supportedInboundKinds: Object.freeze([...META_SUPPORTED_INBOUND_KINDS]),
         supportedStatusKinds: Object.freeze([...META_SUPPORTED_STATUS_KINDS]),
       });
     },
 
     async normalizeVerifiedEvent(
       raw: Uint8Array,
@@ -787,28 +901,30 @@ export function createMetaCloudAdapter(options: MetaCloudAdapterOptions): WhatsA
             "content-type": "application/json",
           },
           body: JSON.stringify(dispatchBody(command)),
           signal,
           redirect: "error",
         });
       } catch {
         return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
       }
 
-      if ((response.status >= 300 && response.status < 400) || response.status >= 500) {
-        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
-      }
-      if (!response.ok) {
+      const status = response.status;
+      if (!Number.isInteger(status) || status < 200 || status > 299) {
+        await cancelResponseBody(response);
+        if (!PRE_ACCEPTANCE_REJECTION_STATUSES.has(status)) {
+          return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
+        }
         return {
           status: "confirmed_not_sent",
           reason: "provider_rejected",
-          statusCode: response.status,
+          statusCode: status,
         };
       }
       const rawResponse = await readBoundedResponse(response, options.maxProviderResponseBytes, signal);
       if (!rawResponse) return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
       const externalMessageReference = acceptedReference(rawResponse);
       if (!externalMessageReference) {
         return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
       }
       return { status: "accepted", externalMessageReference };
     },
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts
index 646c4e4..08b8f78 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts
@@ -170,31 +170,32 @@ export type ProviderReconciliationResult = {
   readonly reason: "activation_review_required";
 };
 
 export type ProviderMessageReconciliationResult = ProviderReconciliationResult;
 export type ProviderTemplateReconciliationResult = ProviderReconciliationResult;
 
 export type ProviderInboundKind =
   | "interactive_reply"
   | "media_reference"
   | "message_status"
+  | "template_projection"
   | "text_message";
 
 export type ProviderStatusKind = "delivered" | "failed" | "read" | "sent";
 
 export type ProviderCapabilitySnapshot = {
   readonly requestIdempotency: false;
   readonly stableReference: false;
   readonly messageLookup: false;
   readonly statusReconciliation: false;
   readonly mediaReferences: true;
-  readonly templateProjection: false;
+  readonly templateProjection: true;
   readonly observedAt: Date;
   readonly supportedInboundKinds: readonly ProviderInboundKind[];
   readonly supportedStatusKinds: readonly ProviderStatusKind[];
 };
 
 export interface WhatsAppProviderAdapter {
   capabilities(): ProviderCapabilitySnapshot;
   normalizeVerifiedEvent(
     raw: Uint8Array,
     context: VerifiedWebhookContext,
@@ -212,18 +213,19 @@ export interface WhatsAppProviderAdapter {
     query: ProviderTemplateReconciliationQuery,
     signal: AbortSignal,
   ): Promise<ProviderTemplateReconciliationResult>;
 }
 
 export const META_SUPPORTED_INBOUND_KINDS = Object.freeze([
   "text_message",
   "interactive_reply",
   "message_status",
   "media_reference",
+  "template_projection",
 ] satisfies readonly ProviderInboundKind[]);
 
 export const META_SUPPORTED_STATUS_KINDS = Object.freeze([
   "sent",
   "delivered",
   "read",
   "failed",
 ] satisfies readonly ProviderStatusKind[]);
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts
index fc373c1..221a502 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts
@@ -7,20 +7,21 @@ const CHALLENGE = /^[A-Za-z0-9._~-]{1,512}$/u;
 const SIGNATURE = /^sha256=([a-f0-9]{64})$/u;
 
 export type MetaChallengeResult =
   | { readonly accepted: true; readonly challenge: string }
   | { readonly accepted: false; readonly reason: "verification_rejected" };
 
 export type VerifyMetaWebhookInput = {
   readonly raw: Uint8Array;
   readonly signatureHeader: string | undefined;
   readonly appSecret: string;
+  readonly maxRawBodyBytes: number;
   readonly connectionId: string;
   readonly businessAccountId: string;
   readonly phoneNumberId: string;
   readonly correlationId: string;
   readonly verifiedAt: Date;
 };
 
 export type MetaWebhookVerificationResult =
   | { readonly status: "verified"; readonly context: VerifiedWebhookContext }
   | {
@@ -111,20 +112,28 @@ export function verifyMetaWebhookSignature(
   if (!match || appSecret.length < 16 || appSecret.length > 4_096) return false;
 
   const received = Buffer.from(match[1] as string, "hex");
   const expected = createHmac("sha256", appSecret).update(raw).digest();
   return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
 }
 
 export function verifyMetaWebhook(input: VerifyMetaWebhookInput): MetaWebhookVerificationResult {
   if (
     !(input.raw instanceof Uint8Array) ||
+    !Number.isSafeInteger(input.maxRawBodyBytes) ||
+    input.maxRawBodyBytes <= 0 ||
+    input.raw.byteLength > input.maxRawBodyBytes
+  ) {
+    return { status: "rejected", reason: "verification_rejected" };
+  }
+
+  if (
     !IDENTIFIER.test(input.connectionId) ||
     !PROVIDER_IDENTIFIER.test(input.businessAccountId) ||
     !PROVIDER_IDENTIFIER.test(input.phoneNumberId) ||
     !IDENTIFIER.test(input.correlationId) ||
     !(input.verifiedAt instanceof Date) ||
     Number.isNaN(input.verifiedAt.valueOf())
   ) {
     return { status: "rejected", reason: "verification_rejected" };
   }
 
diff --git a/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
index 197169e..9c8628e 100644
--- a/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
@@ -29,20 +29,21 @@ function verifiedContext(
 ): VerifiedWebhookContext {
   const result = verifyMetaWebhook({
     raw,
     signatureHeader: `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`,
     appSecret: APP_SECRET,
     connectionId: overrides.connectionId ?? CONNECTION_ID,
     businessAccountId: overrides.businessAccountId ?? BUSINESS_ACCOUNT_ID,
     phoneNumberId: overrides.phoneNumberId ?? PHONE_NUMBER_ID,
     correlationId: "correlation_synthetic_meta",
     verifiedAt: OBSERVED_AT,
+    maxRawBodyBytes: 64 * 1024,
   });
   if (result.status !== "verified") throw new Error("synthetic fixture failed verification");
   return result.context;
 }
 
 function messagePayload(message: Record<string, unknown>) {
   return {
     object: "whatsapp_business_account",
     entry: [{
       id: BUSINESS_ACCOUNT_ID,
@@ -72,34 +73,44 @@ function statusPayload(status: Record<string, unknown>) {
         value: {
           messaging_product: "whatsapp",
           metadata: { phone_number_id: PHONE_NUMBER_ID },
           statuses: [status],
         },
       }],
     }],
   };
 }
 
-function templatePayload(event = "APPROVED") {
+function templatePayload(
+  overrides: Record<string, unknown> = {},
+  entryTime: number = 1_786_661_700,
+) {
   return {
     object: "whatsapp_business_account",
     entry: [{
       id: BUSINESS_ACCOUNT_ID,
-      time: 1_786_661_700,
+      time: entryTime,
       changes: [{
         field: "message_template_status_update",
         value: {
-          event,
+          event: "APPROVED",
           message_template_id: "300000000000003",
-          message_template_name: "PRIVATE-TEMPLATE-NAME",
-          message_template_language: "en-US",
+          message_template_name: "synthetic_appointment_notice",
+          message_template_language: "en_US",
           message_template_category: "UTILITY",
+          message_template_components: [
+            { type: "HEADER", format: "TEXT", text: "Synthetic header" },
+            { type: "BODY", text: "Synthetic body" },
+            { type: "FOOTER", text: "Synthetic footer" },
+          ],
+          message_template_version: "3",
+          ...overrides,
         },
       }],
     }],
   };
 }
 
 function credentials(overrides: Record<string, string> = {}) {
   return {
     resolveVerificationSecret: async () => ({
       appSecret: APP_SECRET,
@@ -133,20 +144,38 @@ function textCommand(overrides: Partial<ProviderDispatchCommand> = {}): Provider
   return {
     connectionId: CONNECTION_ID,
     recipientEndpoint: "+15550000001",
     correlationId: "correlation_dispatch_synthetic",
     idempotencyKey: "idempotency_dispatch_synthetic",
     content: { kind: "text", body: "Synthetic hello" },
     ...overrides,
   };
 }
 
+function controlledUnreadResponse(status: number) {
+  const marker = `PRIVATE-UNREAD-STATUS-${String(status)}`;
+  const cancel = vi.fn(async () => undefined);
+  const body = new ReadableStream<Uint8Array>({
+    start(controller) {
+      controller.enqueue(new TextEncoder().encode(marker));
+    },
+    cancel,
+  });
+  const getReader = vi.spyOn(body, "getReader");
+  return {
+    response: { status, body } as unknown as Response,
+    cancel,
+    getReader,
+    marker,
+  };
+}
+
 describe("inactive Meta Cloud adapter normalization", () => {
   it("binds normalization to the exact immutable raw bytes that were verified", async () => {
     const signedRaw = rawJson(messagePayload({
       from: "15550000001",
       id: "wamid.synthetic.signed",
       timestamp: "1786661700",
       type: "text",
       text: { body: "signed-private-marker" },
     }));
     const substitutedRaw = rawJson(messagePayload({
@@ -185,23 +214,29 @@ describe("inactive Meta Cloud adapter normalization", () => {
   it("returns a deeply immutable capability snapshot", () => {
     const adapter = createAdapter();
     const snapshot = adapter.capabilities();
 
     expect(snapshot).toEqual({
       requestIdempotency: false,
       stableReference: false,
       messageLookup: false,
       statusReconciliation: false,
       mediaReferences: true,
-      templateProjection: false,
+      templateProjection: true,
       observedAt: OBSERVED_AT,
-      supportedInboundKinds: ["text_message", "interactive_reply", "message_status", "media_reference"],
+      supportedInboundKinds: [
+        "text_message",
+        "interactive_reply",
+        "message_status",
+        "media_reference",
+        "template_projection",
+      ],
       supportedStatusKinds: ["sent", "delivered", "read", "failed"],
     });
     expect(Object.isFrozen(snapshot)).toBe(true);
     expect(Object.isFrozen(snapshot.supportedInboundKinds)).toBe(true);
     snapshot.observedAt.setUTCFullYear(1999);
     expect(adapter.capabilities().observedAt.toISOString()).toBe("2026-08-13T23:15:00.000Z");
   });
 
   it("normalizes a supported text message into canonical fields", async () => {
     const raw = rawJson(messagePayload({
@@ -293,37 +328,109 @@ describe("inactive Meta Cloud adapter normalization", () => {
       expect(result).toMatchObject({
         kind: "message_status",
         externalMessageReference: "wamid.synthetic.outbound.1",
         status,
       });
       expect(JSON.stringify(result)).not.toContain("15550000001");
       expect(JSON.stringify(result)).not.toContain("PRIVATE-PROVIDER-ERROR");
     },
   );
 
-  it.each(["APPROVED", "REJECTED", "PAUSED", "DISABLED", "MYSTERY_STATUS"])(
-    "keeps the WABA-level template %s callback minimized and manual until activation review",
-    async (event) => {
-      const raw = rawJson(templatePayload(event));
-      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
-      expect(result).toEqual({
-        kind: "unsupported_verified",
-        connectionId: CONNECTION_ID,
-        reason: "template_manual_review",
-        receivedAt: OBSERVED_AT,
-        correlationId: "correlation_synthetic_meta",
-      });
-      expect(JSON.stringify(result)).not.toContain(event);
-      expect(JSON.stringify(result)).not.toContain("PRIVATE-TEMPLATE-NAME");
-    },
+  it("normalizes the exact complete approved template callback into a canonical projection", async () => {
+    const raw = rawJson(templatePayload());
+
+    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toEqual({
+      kind: "template_projection",
+      connectionId: CONNECTION_ID,
+      externalEventReference: "300000000000003:APPROVED:3",
+      receivedAt: OBSERVED_AT,
+      correlationId: "correlation_synthetic_meta",
+      projection: {
+        templateId: "synthetic_appointment_notice",
+        locale: "en",
+        state: "provider_approved",
+        version: 3,
+        updatedAt: new Date("2026-08-13T22:55:00.000Z"),
+        providerReference: "300000000000003",
+        templateKey: "synthetic_appointment_notice",
+        category: "utility",
+        components: [
+          { type: "header", format: "text", text: "Synthetic header" },
+          { type: "body", text: "Synthetic body" },
+          { type: "footer", text: "Synthetic footer" },
+        ],
+        status: "provider_approved",
+        providerVersion: "3",
+        providerTimestamp: new Date("2026-08-13T22:55:00.000Z"),
+      },
+    });
+  });
+
+  it.each([
+    ["REJECTED", "provider_rejected"],
+    ["PAUSED", "paused"],
+    ["DISABLED", "disabled"],
+  ])("normalizes complete %s template callback without activating it", async (event, state) => {
+    const raw = rawJson(templatePayload({ event }));
+
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+    expect(result).toMatchObject({
+      kind: "template_projection",
+      projection: { state, status: state },
+    });
+    expect(result).not.toMatchObject({ projection: { state: "provider_approved" } });
+  });
+
+  it.each([
+    ["unknown status", { event: "MYSTERY_STATUS" }, 1_786_661_700],
+    ["regressive pending status", { event: "PENDING" }, 1_786_661_700],
+    ["zero provider version", { message_template_version: "0" }, 1_786_661_700],
+    ["missing components", { message_template_components: undefined }, 1_786_661_700],
+    ["non-canonical locale", { message_template_language: "en-US" }, 1_786_661_700],
+    ["millisecond entry time", {}, 1_786_661_700_000],
+    ["far-future entry time", {}, 4_102_444_800],
+  ])("keeps %s template callback minimized for manual review", async (_label, overrides, time) => {
+    const raw = rawJson(templatePayload(overrides, time));
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+    expect(result).toEqual({
+      kind: "unsupported_verified",
+      connectionId: CONNECTION_ID,
+      reason: "template_manual_review",
+      receivedAt: OBSERVED_AT,
+      correlationId: "correlation_synthetic_meta",
+    });
+    expect(JSON.stringify(result)).not.toContain("MYSTERY_STATUS");
+    expect(JSON.stringify(result)).not.toContain("synthetic_appointment_notice");
+  },
   );
 
+  it.each([
+    ["millisecond timestamp", "1786661700000"],
+    ["overflow timestamp", "99999999999999999999"],
+    ["pre-plausibility timestamp", "0999999999"],
+    ["far-future timestamp", "4102444800"],
+    ["beyond receipt skew", "1786663201"],
+  ])("rejects an official message carrying a %s", async (_label, timestamp) => {
+    const raw = rawJson(messagePayload({
+      from: "15550000001",
+      id: "wamid.synthetic.timestamp",
+      timestamp,
+      type: "text",
+      text: { body: "safe" },
+    }));
+
+    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toMatchObject({
+      kind: "unsupported_verified",
+      reason: "malformed_payload",
+    });
+  });
+
   it.each([
     ["account", { businessAccountId: "999999999999999", phoneNumberId: PHONE_NUMBER_ID }],
     ["phone", { businessAccountId: BUSINESS_ACCOUNT_ID, phoneNumberId: "999999999999999" }],
   ])("rejects %s mapping mismatch without reflecting identifiers", async (_label, mismatch) => {
     const raw = rawJson(messagePayload({
       from: "15550000001", id: "wamid.synthetic.mismatch", timestamp: "1786661700", type: "text", text: { body: "safe" },
     }));
     const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw, mismatch));
     expect(result).toMatchObject({ kind: "unsupported_verified", reason: "connection_mismatch" });
     expect(JSON.stringify(result)).not.toContain("999999999999999");
@@ -455,28 +562,60 @@ describe("inactive Meta Cloud adapter dispatch", () => {
     controller.abort();
     const result = await createAdapter(fetchImplementation as unknown as typeof fetch, {
       resolveVerificationSecret: vi.fn(),
       resolveDispatchSecret,
     }).dispatch(textCommand(), controller.signal);
     expect(result).toEqual({ status: "confirmed_not_sent", reason: "aborted_before_dispatch" });
     expect(resolveDispatchSecret).not.toHaveBeenCalled();
     expect(fetchImplementation).not.toHaveBeenCalled();
   });
 
-  it("returns bounded known rejection for 4xx without reading response details into the result", async () => {
-    const result = await createAdapter(vi.fn(async () => new Response(
-      JSON.stringify({ error: { message: "PRIVATE-RESPONSE", token: ACCESS_TOKEN } }),
-      { status: 400 },
-    ))).dispatch(textCommand(), new AbortController().signal);
-    expect(result).toEqual({ status: "confirmed_not_sent", reason: "provider_rejected", statusCode: 400 });
-    expect(JSON.stringify(result)).not.toContain("PRIVATE");
-    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN);
+  it.each([400, 401, 403, 404, 405, 406, 410, 411, 413, 414, 415, 422])(
+    "treats documented pre-acceptance rejection status %s as confirmed_not_sent and cancels unread body",
+    async (statusCode) => {
+      const { response, cancel, getReader, marker } = controlledUnreadResponse(statusCode);
+      const result = await createAdapter(vi.fn(async () => response))
+        .dispatch(textCommand(), new AbortController().signal);
+
+      expect(result).toEqual({ status: "confirmed_not_sent", reason: "provider_rejected", statusCode });
+      expect(cancel).toHaveBeenCalledTimes(1);
+      expect(getReader).not.toHaveBeenCalled();
+      expect(JSON.stringify(result)).not.toContain(marker);
+    },
+  );
+
+  it.each([0, 199, 302, 408, 409, 418, 429, 500, 503, 599, 600, Number.NaN, 418.5])(
+    "treats uncertain HTTP status %s as dispatch_unknown and cancels unread body",
+    async (statusCode) => {
+      const { response, cancel, getReader, marker } = controlledUnreadResponse(statusCode);
+      const result = await createAdapter(vi.fn(async () => response))
+        .dispatch(textCommand(), new AbortController().signal);
+
+      expect(result).toEqual({ status: "dispatch_unknown", reason: "acceptance_ambiguous" });
+      expect(cancel).toHaveBeenCalledTimes(1);
+      expect(getReader).not.toHaveBeenCalled();
+      expect(JSON.stringify(result)).not.toContain(marker);
+    },
+  );
+
+  it("treats an abort thrown after fetch begins as ambiguous", async () => {
+    const controller = new AbortController();
+    const fetchImplementation = vi.fn(async () => {
+      controller.abort();
+      throw new DOMException("PRIVATE-ABORT", "AbortError");
+    });
+
+    await expect(createAdapter(fetchImplementation as unknown as typeof fetch)
+      .dispatch(textCommand(), controller.signal)).resolves.toEqual({
+      status: "dispatch_unknown",
+      reason: "acceptance_ambiguous",
+    });
   });
 
   it.each([
     ["network failure", vi.fn(async () => { throw new Error("PRIVATE-NETWORK"); })],
     ["server failure", vi.fn(async () => new Response("PRIVATE-UPSTREAM", { status: 503 }))],
     ["redirect", vi.fn(async () => new Response(null, { status: 302 }))],
     ["empty success", vi.fn(async () => new Response(JSON.stringify({ messages: [] }), { status: 200 }))],
     ["multiple references", vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: "one" }, { id: "two" }] }), { status: 200 }))],
     ["oversized response", vi.fn(async () => new Response("x".repeat(20_000), { status: 200 }))],
   ])("classifies %s as dispatch_unknown and never retries", async (_label, fetchImplementation) => {
diff --git a/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts b/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts
index dbd3fd9..a9fa0a4 100644
--- a/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts
@@ -11,20 +11,21 @@ const VERIFY_TOKEN = "synthetic-meta-verify-token-task5";
 
 function sign(raw: Uint8Array): string {
   return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
 }
 
 function webhookInput(raw: Uint8Array, signatureHeader: string | undefined = sign(raw)) {
   return {
     raw,
     signatureHeader,
     appSecret: APP_SECRET,
+    maxRawBodyBytes: 64 * 1024,
     connectionId: "connection_synthetic_meta",
     businessAccountId: "100000000000001",
     phoneNumberId: "200000000000002",
     correlationId: "correlation_synthetic_meta",
     verifiedAt: new Date("2026-08-13T23:00:00.000Z"),
   } as const;
 }
 
 describe("Meta webhook verification", () => {
   it("returns only the bounded challenge for exact subscribe mode and token", () => {
@@ -126,11 +127,39 @@ describe("Meta webhook verification", () => {
   it("fails closed on malformed verification metadata without echoing it", () => {
     const raw = new TextEncoder().encode('{"safe":true}');
     const result = verifyMetaWebhook({
       ...webhookInput(raw),
       connectionId: "../PRIVATE-CONNECTION",
     });
 
     expect(result).toEqual({ status: "rejected", reason: "verification_rejected" });
     expect(JSON.stringify(result)).not.toContain("PRIVATE");
   });
+
+  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY])(
+    "requires a positive safe-integer raw-body limit instead of treating %s as configured",
+    (maxRawBodyBytes) => {
+      const raw = new TextEncoder().encode('{"safe":true}');
+
+      expect(verifyMetaWebhook({ ...webhookInput(raw), maxRawBodyBytes })).toEqual({
+        status: "rejected",
+        reason: "verification_rejected",
+      });
+    },
+  );
+
+  it("rejects an oversized body before copying or hashing its bytes", () => {
+    const raw = new Uint8Array(32);
+    Object.defineProperty(raw, Symbol.iterator, {
+      value: () => {
+        throw new Error("raw bytes were copied before the size gate");
+      },
+    });
+
+    expect(
+      verifyMetaWebhook({
+        ...webhookInput(raw, `sha256=${"0".repeat(64)}`),
+        maxRawBodyBytes: 31,
+      }),
+    ).toEqual({ status: "rejected", reason: "verification_rejected" });
+  });
 });
```
