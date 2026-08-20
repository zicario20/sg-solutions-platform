# Task 5 fix round 2

## Commits
d0ab15c fix(whatsapp): require trusted template authority

## Stat
 .../apps/app/src/lib/whatsapp/credentials.ts       |  20 ++++
 .../apps/app/src/lib/whatsapp/meta-adapter.ts      | 129 ++++++++++++++++-----
 .../workspace/tests/m004/meta-adapter.test.ts      | 103 +++++++++++++++-
 3 files changed, 225 insertions(+), 27 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts
index 68eaf82..1712639 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts
@@ -1,30 +1,50 @@
 export interface MetaCredentialResolver {
   resolveVerificationSecret(
     connectionId: string,
   ): Promise<{ appSecret: string; verifyToken: string }>;
   resolveDispatchSecret(connectionId: string): Promise<{
     accessToken: string;
     phoneNumberId: string;
     graphApiVersion: string;
   }>;
+  resolveTemplateConnectionAuthority(input: MetaTemplateAuthorityRequest): Promise<MetaTemplateConnectionAuthority>;
+}
+
+export interface MetaTemplateAuthorityRequest {
+  connectionId: string;
+  businessAccountId: string;
+  correlationId: string;
+  verifiedAt: Date;
+}
+
+export interface MetaTemplateConnectionAuthority {
+  connectionId: string;
+  businessAccountId: string;
+  authorityReceiptId: string;
+  authorityVersion: number;
+  correlationId: string;
+  issuedAt: Date;
+  expiresAt: Date;
+  templateOwningConnectionCount: number;
 }
 
 export class MetaCredentialsUnavailableError extends Error {
   readonly code = "credentials_unavailable" as const;
 
   constructor() {
     super("Meta credentials are unavailable");
     this.name = "MetaCredentialsUnavailableError";
   }
 }
 
 export function createFailClosedMetaCredentialResolver(): MetaCredentialResolver {
   const unavailable = async (): Promise<never> => {
     throw new MetaCredentialsUnavailableError();
   };
 
   return Object.freeze({
     resolveVerificationSecret: unavailable,
     resolveDispatchSecret: unavailable,
+    resolveTemplateConnectionAuthority: unavailable,
   });
 }
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
index 618f1b5..efb589c 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
@@ -1,11 +1,14 @@
-import type { MetaCredentialResolver } from "./credentials.ts";
+import type {
+  MetaCredentialResolver,
+  MetaTemplateConnectionAuthority,
+} from "./credentials.ts";
 import {
   type CanonicalProviderEnvelope,
   META_SUPPORTED_INBOUND_KINDS,
   META_SUPPORTED_STATUS_KINDS,
   type ProviderCapabilitySnapshot,
   type ProviderDispatchCommand,
   type ProviderDispatchResult,
   type ProviderMessageReconciliationQuery,
   type ProviderMessageReconciliationResult,
   type ProviderReconciliationQuery,
@@ -40,20 +43,21 @@ const MIME_TYPE = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}\/[A-Za-z0-9][A-Za-z0-9
 const CHECKSUM = /^[a-f0-9]{64}$/u;
 const TEMPLATE_NAME = /^[a-z0-9][a-z0-9_]{0,511}$/u;
 const LANGUAGE_CODE = /^(?:en|es)_[A-Z]{2}$/u;
 const MAX_JSON_DEPTH = 20;
 const MAX_JSON_COLLECTION_ENTRIES = 64;
 const MAX_JSON_STRING_CODE_UNITS = 8_192;
 // Provider callback timestamps are exact Unix seconds. The floor excludes legacy/impossible data,
 // while five minutes of forward skew permits ordinary clock drift without accepting future events.
 const MIN_PROVIDER_UNIX_SECONDS = 1_577_836_800;
 const MAX_PROVIDER_FUTURE_SKEW_SECONDS = 300;
+const MAX_TEMPLATE_AUTHORITY_LIFETIME_MS = 24 * 60 * 60 * 1_000;
 // These statuses prove the provider rejected the request before accepting a message. Timeouts,
 // throttling, conflict, redirects, informational responses and server failures remain ambiguous.
 const PRE_ACCEPTANCE_REJECTION_STATUSES = new Set([
   400,
   401,
   403,
   404,
   405,
   406,
   410,
@@ -205,20 +209,25 @@ class BoundedJsonParser {
 }
 
 function isRecord(value: unknown): value is JsonRecord {
   return value !== null && typeof value === "object" && !Array.isArray(value);
 }
 
 function hasOnlyKeys(value: JsonRecord, allowed: readonly string[]): boolean {
   return Object.keys(value).every((key) => allowed.includes(key));
 }
 
+function hasExactOwnKeys(value: JsonRecord, expected: readonly string[]): boolean {
+  const keys = Reflect.ownKeys(value);
+  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
+}
+
 function hasUnsafeControl(value: string): boolean {
   for (const character of value) {
     const code = character.charCodeAt(0);
     if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) {
       return true;
     }
   }
   return false;
 }
 
@@ -499,57 +508,106 @@ function normalizeMessage(
         declaredKind: kind,
         ...(typeof media.mime_type === "string" ? { mimeType: media.mime_type } : {}),
         ...(typeof media.sha256 === "string" ? { checksum: media.sha256 } : {}),
       }),
     });
   }
 
   return unsupported(context, "unsupported_event");
 }
 
-function normalizeTemplate(
+type SupportedTemplateStatus = "disabled" | "paused" | "provider_approved" | "provider_rejected";
+type SupportedTemplateCategory = "authentication" | "marketing" | "utility";
+
+const STATUS_BY_TEMPLATE_EVENT = new Map<string, SupportedTemplateStatus>([
+  ["APPROVED", "provider_approved"],
+  ["DISABLED", "disabled"],
+  ["PAUSED", "paused"],
+  ["REJECTED", "provider_rejected"],
+]);
+const CATEGORY_BY_PROVIDER = new Map<string, SupportedTemplateCategory>([
+  ["AUTHENTICATION", "authentication"],
+  ["MARKETING", "marketing"],
+  ["UTILITY", "utility"],
+]);
+
+function validTemplateConnectionAuthority(
+  authority: unknown,
+  context: ResolvedVerifiedWebhookContext,
+): authority is MetaTemplateConnectionAuthority {
+  if (
+    !isRecord(authority) ||
+    !hasExactOwnKeys(authority, [
+      "connectionId",
+      "businessAccountId",
+      "authorityReceiptId",
+      "authorityVersion",
+      "correlationId",
+      "issuedAt",
+      "expiresAt",
+      "templateOwningConnectionCount",
+    ]) ||
+    authority.connectionId !== context.connectionId ||
+    authority.businessAccountId !== context.businessAccountId ||
+    authority.correlationId !== context.correlationId ||
+    typeof authority.authorityReceiptId !== "string" ||
+    !IDENTIFIER.test(authority.authorityReceiptId) ||
+    !Number.isSafeInteger(authority.authorityVersion) ||
+    (authority.authorityVersion as number) < 1 ||
+    (authority.authorityVersion as number) > 1_000_000 ||
+    authority.templateOwningConnectionCount !== 1 ||
+    !(authority.issuedAt instanceof Date) ||
+    !(authority.expiresAt instanceof Date)
+  ) {
+    return false;
+  }
+  const issuedAt = authority.issuedAt.valueOf();
+  const expiresAt = authority.expiresAt.valueOf();
+  const verifiedAt = context.verifiedAt.valueOf();
+  return (
+    Number.isFinite(issuedAt) &&
+    Number.isFinite(expiresAt) &&
+    issuedAt <= verifiedAt &&
+    verifiedAt <= expiresAt &&
+    expiresAt - issuedAt <= MAX_TEMPLATE_AUTHORITY_LIFETIME_MS
+  );
+}
+
+async function normalizeTemplate(
   value: JsonRecord,
   entryTime: unknown,
   context: ResolvedVerifiedWebhookContext,
-): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
-  const statusByEvent = {
-    APPROVED: "provider_approved",
-    DISABLED: "disabled",
-    PAUSED: "paused",
-    REJECTED: "provider_rejected",
-  } as const;
-  const categoryByProvider = {
-    AUTHENTICATION: "authentication",
-    MARKETING: "marketing",
-    UTILITY: "utility",
-  } as const;
+  credentials: MetaCredentialResolver,
+): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
+  const status = typeof value.event === "string" ? STATUS_BY_TEMPLATE_EVENT.get(value.event) : undefined;
+  const category = typeof value.message_template_category === "string"
+    ? CATEGORY_BY_PROVIDER.get(value.message_template_category)
+    : undefined;
 
   if (
     !hasOnlyKeys(value, [
       "event",
       "message_template_id",
       "message_template_name",
       "message_template_language",
       "message_template_category",
       "message_template_components",
       "message_template_version",
       "reason",
     ]) ||
-    typeof value.event !== "string" ||
-    !(value.event in statusByEvent) ||
+    status === undefined ||
     !EXTERNAL_IDENTIFIER.test(String(value.message_template_id ?? "")) ||
     typeof value.message_template_name !== "string" ||
     !TEMPLATE_NAME.test(value.message_template_name) ||
     typeof value.message_template_language !== "string" ||
     !/^(?:en|es)_[A-Z]{2}$/u.test(value.message_template_language) ||
-    typeof value.message_template_category !== "string" ||
-    !(value.message_template_category in categoryByProvider) ||
+    category === undefined ||
     !Array.isArray(value.message_template_components) ||
     !/^[1-9][0-9]{0,8}$/u.test(String(value.message_template_version ?? "")) ||
     (value.reason !== undefined && value.reason !== null && !isString(value.reason, 0, 1_024))
   ) {
     return unsupported(context, "template_manual_review");
   }
 
   const providerTimestamp = parseNumericTimestamp(entryTime, context.verifiedAt);
   const providerVersion = String(value.message_template_version);
   const version = Number(providerVersion);
@@ -579,23 +637,35 @@ function normalizeTemplate(
         text: candidate.text,
       });
       continue;
     }
     return unsupported(context, "template_manual_review");
   }
   if (!providerTimestamp || !Number.isSafeInteger(version) || !seenTypes.has("BODY")) {
     return unsupported(context, "template_manual_review");
   }
 
-  const status = statusByEvent[value.event as keyof typeof statusByEvent];
-  const category =
-    categoryByProvider[value.message_template_category as keyof typeof categoryByProvider];
+  let authority: unknown;
+  try {
+    authority = await credentials.resolveTemplateConnectionAuthority({
+      connectionId: context.connectionId,
+      businessAccountId: context.businessAccountId,
+      correlationId: context.correlationId,
+      verifiedAt: new Date(context.verifiedAt),
+    });
+  } catch {
+    return unsupported(context, "template_manual_review");
+  }
+  if (!validTemplateConnectionAuthority(authority, context)) {
+    return unsupported(context, "template_manual_review");
+  }
+
   const locale = value.message_template_language.startsWith("en_") ? "en" : "es";
   const providerReference = String(value.message_template_id);
   const templateKey = value.message_template_name;
   const frozenComponents = Object.freeze(components.map((component) => Object.freeze(component)));
   return Object.freeze({
     kind: "template_projection",
     connectionId: context.connectionId,
     externalEventReference: `${providerReference}:${value.event}:${providerVersion}`,
     receivedAt: new Date(context.verifiedAt),
     correlationId: context.correlationId,
@@ -609,29 +679,36 @@ function normalizeTemplate(
       templateKey,
       category,
       components: frozenComponents,
       status,
       providerVersion,
       providerTimestamp: new Date(providerTimestamp),
     }),
   });
 }
 
-function normalizePayload(
+function isUnsupportedRoot(
+  root: MessageRoot | UnsupportedVerifiedEnvelope,
+): root is UnsupportedVerifiedEnvelope {
+  return Object.hasOwn(root, "kind");
+}
+
+async function normalizePayload(
   payload: unknown,
   context: ResolvedVerifiedWebhookContext,
-): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
+  credentials: MetaCredentialResolver,
+): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
   const root = messageRoot(payload, context);
-  if ("kind" in root) return root;
+  if (isUnsupportedRoot(root)) return root;
   if (root.change.field === "messages") return normalizeMessage(root.value, context);
   if (root.change.field === "message_template_status_update") {
-    return normalizeTemplate(root.value, root.entryTime, context);
+    return normalizeTemplate(root.value, root.entryTime, context, credentials);
   }
   return unsupported(context, "unsupported_event");
 }
 
 function validTemplateContent(content: unknown): boolean {
   if (
     !isRecord(content) ||
     !hasOnlyKeys(content, ["kind", "providerTemplateName", "languageCode", "components"]) ||
     content.kind !== "template" ||
     !TEMPLATE_NAME.test(String(content.providerTemplateName ?? "")) ||
@@ -857,21 +934,21 @@ export function createMetaCloudAdapter(options: MetaCloudAdapterOptions): WhatsA
       if (rawSnapshot.byteLength > options.maxNormalizedPayloadBytes) {
         return unsupported(resolvedContext, "payload_too_large");
       }
       const parsed = parseProviderJson(rawSnapshot);
       if (parsed.status !== "parsed") {
         return unsupported(
           resolvedContext,
           parsed.status === "duplicate" ? "ambiguous_payload" : "malformed_payload",
         );
       }
-      return normalizePayload(parsed.value, resolvedContext);
+      return normalizePayload(parsed.value, resolvedContext, options.credentials);
     },
 
     async dispatch(
       command: ProviderDispatchCommand,
       signal: AbortSignal,
     ): Promise<ProviderDispatchResult> {
       if (!validDispatchCommand(command)) {
         return { status: "confirmed_not_sent", reason: "invalid_command" };
       }
       if (signal.aborted) {
diff --git a/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
index 9c8628e..4f50d66 100644
--- a/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
@@ -103,32 +103,53 @@ function templatePayload(
             { type: "FOOTER", text: "Synthetic footer" },
           ],
           message_template_version: "3",
           ...overrides,
         },
       }],
     }],
   };
 }
 
-function credentials(overrides: Record<string, string> = {}) {
+function templateAuthority(overrides: Record<string, unknown> = {}) {
+  return {
+    connectionId: CONNECTION_ID,
+    businessAccountId: BUSINESS_ACCOUNT_ID,
+    authorityReceiptId: "synthetic_template_authority_receipt",
+    authorityVersion: 1,
+    correlationId: "correlation_synthetic_meta",
+    issuedAt: new Date("2026-08-13T23:00:00.000Z"),
+    expiresAt: new Date("2026-08-14T00:00:00.000Z"),
+    templateOwningConnectionCount: 1,
+    ...overrides,
+  };
+}
+
+function credentials(
+  overrides: Record<string, string> = {},
+  authority: ReturnType<typeof templateAuthority> | null = templateAuthority(),
+) {
   return {
     resolveVerificationSecret: async () => ({
       appSecret: APP_SECRET,
       verifyToken: "synthetic-meta-verify-token-task5",
     }),
     resolveDispatchSecret: async () => ({
       accessToken: ACCESS_TOKEN,
       phoneNumberId: PHONE_NUMBER_ID,
       graphApiVersion: "v25.0",
       ...overrides,
     }),
+    resolveTemplateConnectionAuthority: vi.fn(async () => {
+      if (authority === null) throw new Error("synthetic authority unavailable");
+      return authority;
+    }),
   };
 }
 
 function createAdapter(
   fetchImplementation: typeof fetch = vi.fn(async () => {
     throw new Error("fetch was not configured");
   }),
   resolver = credentials(),
 ) {
   return createMetaCloudAdapter({
@@ -373,20 +394,92 @@ describe("inactive Meta Cloud adapter normalization", () => {
     const raw = rawJson(templatePayload({ event }));
 
     const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
     expect(result).toMatchObject({
       kind: "template_projection",
       projection: { state, status: state },
     });
     expect(result).not.toMatchObject({ projection: { state: "provider_approved" } });
   });
 
+  it("requests exact trusted authority for the verified connection, WABA, and correlation", async () => {
+    const raw = rawJson(templatePayload());
+    const resolver = credentials();
+
+    await expect(createAdapter(undefined, resolver).normalizeVerifiedEvent(raw, verifiedContext(raw)))
+      .resolves.toMatchObject({ kind: "template_projection" });
+    expect(resolver.resolveTemplateConnectionAuthority).toHaveBeenCalledWith({
+      connectionId: CONNECTION_ID,
+      businessAccountId: BUSINESS_ACCOUNT_ID,
+      correlationId: "correlation_synthetic_meta",
+      verifiedAt: OBSERVED_AT,
+    });
+  });
+
+  it.each([
+    ["missing authority", null],
+    ["wrong connection", templateAuthority({ connectionId: "connection_synthetic_other" })],
+    ["wrong WABA", templateAuthority({ businessAccountId: "999999999999999" })],
+    ["wrong correlation", templateAuthority({ correlationId: "correlation_synthetic_other" })],
+    ["stale evidence", templateAuthority({ expiresAt: new Date("2026-08-13T23:14:59.999Z") })],
+    ["future evidence", templateAuthority({ issuedAt: new Date("2026-08-13T23:15:00.001Z") })],
+    ["multiple-phone WABA ambiguity", templateAuthority({ templateOwningConnectionCount: 2 })],
+    ["missing receipt identity", templateAuthority({ authorityReceiptId: undefined })],
+  ])("keeps a complete template callback manual with %s", async (_label, authority) => {
+    const raw = rawJson(templatePayload());
+    const result = await createAdapter(undefined, credentials({}, authority))
+      .normalizeVerifiedEvent(raw, verifiedContext(raw));
+
+    expect(result).toEqual({
+      kind: "unsupported_verified",
+      connectionId: CONNECTION_ID,
+      reason: "template_manual_review",
+      receivedAt: OBSERVED_AT,
+      correlationId: "correlation_synthetic_meta",
+    });
+    expect(JSON.stringify(result)).not.toContain("synthetic_template_authority_receipt");
+    expect(JSON.stringify(result)).not.toContain("synthetic_appointment_notice");
+  });
+
+  it.each([
+    ["event", "constructor"],
+    ["event", "toString"],
+    ["event", "__proto__"],
+    ["message_template_category", "constructor"],
+    ["message_template_category", "toString"],
+    ["message_template_category", "__proto__"],
+  ])("rejects prototype-key template %s %s without canonical output", async (field, prototypeKey) => {
+    const raw = rawJson(templatePayload({ [field]: prototypeKey }));
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+
+    expect(result).toEqual({
+      kind: "unsupported_verified",
+      connectionId: CONNECTION_ID,
+      reason: "template_manual_review",
+      receivedAt: OBSERVED_AT,
+      correlationId: "correlation_synthetic_meta",
+    });
+    expect(result).not.toHaveProperty("projection");
+  });
+
+  it("rejects an inherited template event instead of treating it as an own canonical field", async () => {
+    const payload = templatePayload();
+    const value = payload.entry[0]?.changes[0]?.value;
+    delete value.event;
+    Object.setPrototypeOf(value, { event: "APPROVED" });
+    const raw = rawJson(payload);
+
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+    expect(result).toMatchObject({ kind: "unsupported_verified", reason: "template_manual_review" });
+    expect(result).not.toHaveProperty("projection");
+  });
+
   it.each([
     ["unknown status", { event: "MYSTERY_STATUS" }, 1_786_661_700],
     ["regressive pending status", { event: "PENDING" }, 1_786_661_700],
     ["zero provider version", { message_template_version: "0" }, 1_786_661_700],
     ["missing components", { message_template_components: undefined }, 1_786_661_700],
     ["non-canonical locale", { message_template_language: "en-US" }, 1_786_661_700],
     ["millisecond entry time", {}, 1_786_661_700_000],
     ["far-future entry time", {}, 4_102_444_800],
   ])("keeps %s template callback minimized for manual review", async (_label, overrides, time) => {
     const raw = rawJson(templatePayload(overrides, time));
@@ -656,12 +749,20 @@ describe("inactive Meta Cloud adapter dispatch", () => {
 
   it("provides a production resolver that fails closed without echoing connection input", async () => {
     const resolver = createFailClosedMetaCredentialResolver();
     await expect(resolver.resolveVerificationSecret("PRIVATE-CONNECTION")).rejects.toMatchObject({
       name: "MetaCredentialsUnavailableError",
       code: "credentials_unavailable",
     });
     await resolver.resolveDispatchSecret("PRIVATE-CONNECTION").catch((error: unknown) => {
       expect(String(error)).not.toContain("PRIVATE-CONNECTION");
     });
+    await resolver.resolveTemplateConnectionAuthority({
+      connectionId: "PRIVATE-CONNECTION",
+      businessAccountId: "PRIVATE-WABA",
+      correlationId: "PRIVATE-CORRELATION",
+      verifiedAt: OBSERVED_AT,
+    }).catch((error: unknown) => {
+      expect(String(error)).not.toContain("PRIVATE");
+    });
   });
 });
```
