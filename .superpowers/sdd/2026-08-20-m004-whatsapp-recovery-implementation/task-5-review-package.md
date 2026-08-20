# Review package Task 5

## Commits
04c0de4 feat(m004): add inactive Meta Cloud adapter

## Stat
 .../project-atlas/workspace/apps/app/package.json  |   1 +
 .../apps/app/src/lib/whatsapp/credentials.ts       |  30 +
 .../apps/app/src/lib/whatsapp/meta-adapter.ts      | 837 +++++++++++++++++++++
 .../apps/app/src/lib/whatsapp/meta-contracts.ts    | 229 ++++++
 .../apps/app/src/lib/whatsapp/meta-webhook.ts      | 146 ++++
 blueprints/project-atlas/workspace/pnpm-lock.yaml  |   3 +
 .../workspace/tests/m004/meta-adapter.test.ts      | 528 +++++++++++++
 .../workspace/tests/m004/meta-webhook.test.ts      | 136 ++++
 8 files changed, 1910 insertions(+)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/package.json b/blueprints/project-atlas/workspace/apps/app/package.json
index 2935666..d7da16f 100644
--- a/blueprints/project-atlas/workspace/apps/app/package.json
+++ b/blueprints/project-atlas/workspace/apps/app/package.json
@@ -3,19 +3,20 @@
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
+    "@atlas/domain": "workspace:*",
     "@atlas/ui": "workspace:*",
     "@tailwindcss/postcss": "4.3.3",
     "next": "16.2.12",
     "postcss": "8.5.25",
     "react": "19.2.8",
     "react-dom": "19.2.8",
     "tailwindcss": "4.3.3"
   }
 }
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts
new file mode 100644
index 0000000..68eaf82
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts
@@ -0,0 +1,30 @@
+export interface MetaCredentialResolver {
+  resolveVerificationSecret(
+    connectionId: string,
+  ): Promise<{ appSecret: string; verifyToken: string }>;
+  resolveDispatchSecret(connectionId: string): Promise<{
+    accessToken: string;
+    phoneNumberId: string;
+    graphApiVersion: string;
+  }>;
+}
+
+export class MetaCredentialsUnavailableError extends Error {
+  readonly code = "credentials_unavailable" as const;
+
+  constructor() {
+    super("Meta credentials are unavailable");
+    this.name = "MetaCredentialsUnavailableError";
+  }
+}
+
+export function createFailClosedMetaCredentialResolver(): MetaCredentialResolver {
+  const unavailable = async (): Promise<never> => {
+    throw new MetaCredentialsUnavailableError();
+  };
+
+  return Object.freeze({
+    resolveVerificationSecret: unavailable,
+    resolveDispatchSecret: unavailable,
+  });
+}
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
new file mode 100644
index 0000000..6835729
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts
@@ -0,0 +1,837 @@
+import type { MetaCredentialResolver } from "./credentials.ts";
+import {
+  type CanonicalProviderEnvelope,
+  META_SUPPORTED_INBOUND_KINDS,
+  META_SUPPORTED_STATUS_KINDS,
+  type ProviderCapabilitySnapshot,
+  type ProviderDispatchCommand,
+  type ProviderDispatchResult,
+  type ProviderMessageReconciliationQuery,
+  type ProviderMessageReconciliationResult,
+  type ProviderReconciliationQuery,
+  type ProviderReconciliationResult,
+  type ProviderTemplateReconciliationQuery,
+  type ProviderTemplateReconciliationResult,
+  type UnsupportedVerifiedEnvelope,
+  type VerifiedWebhookContext,
+  type WhatsAppProviderAdapter,
+} from "./meta-contracts.ts";
+import {
+  type ResolvedVerifiedWebhookContext,
+  resolveVerifiedMetaWebhookContext,
+} from "./meta-webhook.ts";
+
+type JsonRecord = Record<string, unknown>;
+
+export type MetaCloudAdapterOptions = {
+  readonly credentials: MetaCredentialResolver;
+  readonly fetch: typeof fetch;
+  readonly capabilityObservedAt: Date;
+  readonly maxNormalizedPayloadBytes: number;
+  readonly maxProviderResponseBytes: number;
+};
+
+const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
+const EXTERNAL_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,255}$/u;
+const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
+const ENDPOINT = /^\+[1-9][0-9]{7,14}$/u;
+const GRAPH_VERSION = /^v[1-9][0-9]*\.[0-9]+$/u;
+const MIME_TYPE = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}$/u;
+const CHECKSUM = /^[a-f0-9]{64}$/u;
+const TEMPLATE_NAME = /^[a-z0-9][a-z0-9_]{0,511}$/u;
+const LANGUAGE_CODE = /^(?:en|es)_[A-Z]{2}$/u;
+const BCP47_LANGUAGE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/u;
+const MAX_JSON_DEPTH = 20;
+const MAX_JSON_COLLECTION_ENTRIES = 64;
+const MAX_JSON_STRING_CODE_UNITS = 8_192;
+
+class DuplicateJsonKeyError extends Error {}
+
+class BoundedJsonParser {
+  private index = 0;
+
+  constructor(private readonly source: string) {}
+
+  parse(): unknown {
+    this.skipWhitespace();
+    const value = this.parseValue(0);
+    this.skipWhitespace();
+    if (this.index !== this.source.length) throw new SyntaxError("trailing JSON input");
+    return value;
+  }
+
+  private parseValue(depth: number): unknown {
+    if (depth > MAX_JSON_DEPTH) throw new SyntaxError("JSON nesting limit exceeded");
+    this.skipWhitespace();
+    const current = this.source[this.index];
+    if (current === "{") return this.parseObject(depth + 1);
+    if (current === "[") return this.parseArray(depth + 1);
+    if (current === '"') return this.parseString();
+    if (this.source.startsWith("true", this.index)) {
+      this.index += 4;
+      return true;
+    }
+    if (this.source.startsWith("false", this.index)) {
+      this.index += 5;
+      return false;
+    }
+    if (this.source.startsWith("null", this.index)) {
+      this.index += 4;
+      return null;
+    }
+    return this.parseNumber();
+  }
+
+  private parseObject(depth: number): JsonRecord {
+    this.index += 1;
+    const output = Object.create(null) as JsonRecord;
+    const keys = new Set<string>();
+    this.skipWhitespace();
+    if (this.source[this.index] === "}") {
+      this.index += 1;
+      return output;
+    }
+    while (true) {
+      this.skipWhitespace();
+      if (this.source[this.index] !== '"') throw new SyntaxError("object key expected");
+      const key = this.parseString();
+      if (keys.has(key)) throw new DuplicateJsonKeyError();
+      keys.add(key);
+      if (keys.size > MAX_JSON_COLLECTION_ENTRIES) throw new SyntaxError("object limit exceeded");
+      this.skipWhitespace();
+      if (this.source[this.index] !== ":") throw new SyntaxError("object colon expected");
+      this.index += 1;
+      output[key] = this.parseValue(depth);
+      this.skipWhitespace();
+      const delimiter = this.source[this.index];
+      if (delimiter === "}") {
+        this.index += 1;
+        return output;
+      }
+      if (delimiter !== ",") throw new SyntaxError("object delimiter expected");
+      this.index += 1;
+    }
+  }
+
+  private parseArray(depth: number): unknown[] {
+    this.index += 1;
+    const output: unknown[] = [];
+    this.skipWhitespace();
+    if (this.source[this.index] === "]") {
+      this.index += 1;
+      return output;
+    }
+    while (true) {
+      if (output.length >= MAX_JSON_COLLECTION_ENTRIES) throw new SyntaxError("array limit exceeded");
+      output.push(this.parseValue(depth));
+      this.skipWhitespace();
+      const delimiter = this.source[this.index];
+      if (delimiter === "]") {
+        this.index += 1;
+        return output;
+      }
+      if (delimiter !== ",") throw new SyntaxError("array delimiter expected");
+      this.index += 1;
+    }
+  }
+
+  private parseString(): string {
+    const start = this.index;
+    this.index += 1;
+    let codeUnits = 0;
+    while (this.index < this.source.length) {
+      const character = this.source[this.index];
+      if (character === '"') {
+        this.index += 1;
+        const parsed = JSON.parse(this.source.slice(start, this.index)) as unknown;
+        if (typeof parsed !== "string") throw new SyntaxError("JSON string expected");
+        return parsed;
+      }
+      if (character === "\\") {
+        this.index += 1;
+        const escaped = this.source[this.index];
+        if (escaped === "u") {
+          const digits = this.source.slice(this.index + 1, this.index + 5);
+          if (!/^[a-fA-F0-9]{4}$/u.test(digits)) throw new SyntaxError("invalid unicode escape");
+          this.index += 5;
+        } else if (escaped && '"\\/bfnrt'.includes(escaped)) {
+          this.index += 1;
+        } else {
+          throw new SyntaxError("invalid string escape");
+        }
+      } else {
+        if (!character || character.charCodeAt(0) < 0x20) throw new SyntaxError("invalid string");
+        this.index += 1;
+      }
+      codeUnits += 1;
+      if (codeUnits > MAX_JSON_STRING_CODE_UNITS) throw new SyntaxError("string limit exceeded");
+    }
+    throw new SyntaxError("unterminated string");
+  }
+
+  private parseNumber(): number {
+    const match = this.source
+      .slice(this.index)
+      .match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u);
+    if (!match) throw new SyntaxError("JSON value expected");
+    this.index += match[0].length;
+    const value = Number(match[0]);
+    if (!Number.isFinite(value)) throw new SyntaxError("non-finite JSON number");
+    return value;
+  }
+
+  private skipWhitespace(): void {
+    while (/\s/u.test(this.source[this.index] ?? "")) this.index += 1;
+  }
+}
+
+function isRecord(value: unknown): value is JsonRecord {
+  return value !== null && typeof value === "object" && !Array.isArray(value);
+}
+
+function hasOnlyKeys(value: JsonRecord, allowed: readonly string[]): boolean {
+  return Object.keys(value).every((key) => allowed.includes(key));
+}
+
+function hasUnsafeControl(value: string): boolean {
+  for (const character of value) {
+    const code = character.charCodeAt(0);
+    if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) {
+      return true;
+    }
+  }
+  return false;
+}
+
+function hasWhitespaceOrControl(value: string): boolean {
+  for (const character of value) {
+    const code = character.charCodeAt(0);
+    if (code <= 0x20 || code === 0x7f) return true;
+  }
+  return false;
+}
+
+function isString(value: unknown, minimum: number, maximum: number): value is string {
+  return (
+    typeof value === "string" &&
+    value.length >= minimum &&
+    value.length <= maximum &&
+    !hasUnsafeControl(value)
+  );
+}
+
+function parseTimestamp(value: unknown): Date | null {
+  if (typeof value !== "string" || !/^[0-9]{10,13}$/u.test(value)) return null;
+  const date = new Date(Number(value) * 1_000);
+  return Number.isNaN(date.valueOf()) ? null : date;
+}
+
+function parseNumericTimestamp(value: unknown): Date | null {
+  if (!Number.isSafeInteger(value) || (value as number) < 1_000_000_000) return null;
+  const date = new Date((value as number) * 1_000);
+  return Number.isNaN(date.valueOf()) ? null : date;
+}
+
+function parseProviderJson(
+  raw: Uint8Array,
+): { status: "parsed"; value: unknown } | { status: "duplicate" | "malformed" } {
+  try {
+    const source = new TextDecoder("utf-8", { fatal: true }).decode(raw);
+    return { status: "parsed", value: new BoundedJsonParser(source).parse() };
+  } catch (error) {
+    return { status: error instanceof DuplicateJsonKeyError ? "duplicate" : "malformed" };
+  }
+}
+
+function unverified(): UnsupportedVerifiedEnvelope {
+  return Object.freeze({
+    kind: "unsupported_verified",
+    connectionId: "unverified",
+    reason: "unverified_context",
+    receivedAt: new Date(0),
+    correlationId: "unverified",
+  });
+}
+
+function unsupported(
+  context: ResolvedVerifiedWebhookContext,
+  reason: UnsupportedVerifiedEnvelope["reason"],
+): UnsupportedVerifiedEnvelope {
+  return Object.freeze({
+    kind: "unsupported_verified",
+    connectionId: context.connectionId,
+    reason,
+    receivedAt: new Date(context.verifiedAt),
+    correlationId: context.correlationId,
+  });
+}
+
+type MessageRoot = {
+  change: JsonRecord;
+  value: JsonRecord;
+  entryTime: unknown;
+};
+
+function messageRoot(
+  payload: unknown,
+  context: ResolvedVerifiedWebhookContext,
+): MessageRoot | UnsupportedVerifiedEnvelope {
+  if (!isRecord(payload) || !hasOnlyKeys(payload, ["object", "entry"])) {
+    return unsupported(context, "unsupported_event");
+  }
+  if (payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
+    return unsupported(context, "unsupported_event");
+  }
+  if (payload.entry.length !== 1) return unsupported(context, "ambiguous_payload");
+  const entry = payload.entry[0];
+  if (!isRecord(entry) || !hasOnlyKeys(entry, ["id", "time", "changes"])) {
+    return unsupported(context, "unsupported_event");
+  }
+  if (entry.id !== context.businessAccountId) return unsupported(context, "connection_mismatch");
+  if (!Array.isArray(entry.changes) || entry.changes.length !== 1) {
+    return unsupported(context, "ambiguous_payload");
+  }
+  const change = entry.changes[0];
+  if (!isRecord(change) || !hasOnlyKeys(change, ["field", "value"]) || !isRecord(change.value)) {
+    return unsupported(context, "malformed_payload");
+  }
+  return { change, value: change.value, entryTime: entry.time };
+}
+
+function normalizeMessage(
+  value: JsonRecord,
+  context: ResolvedVerifiedWebhookContext,
+): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
+  if (
+    !hasOnlyKeys(value, ["messaging_product", "metadata", "contacts", "messages", "statuses", "errors"]) ||
+    value.messaging_product !== "whatsapp" ||
+    !isRecord(value.metadata) ||
+    !hasOnlyKeys(value.metadata, ["display_phone_number", "phone_number_id"]) ||
+    !PROVIDER_IDENTIFIER.test(String(value.metadata.phone_number_id ?? ""))
+  ) {
+    return unsupported(context, "malformed_payload");
+  }
+  if (value.metadata.phone_number_id !== context.phoneNumberId) {
+    return unsupported(context, "connection_mismatch");
+  }
+  const hasMessages = Array.isArray(value.messages);
+  const hasStatuses = Array.isArray(value.statuses);
+  if (hasMessages === hasStatuses) return unsupported(context, "ambiguous_payload");
+
+  if (hasStatuses) {
+    if ((value.statuses as unknown[]).length !== 1) return unsupported(context, "ambiguous_payload");
+    const status = (value.statuses as unknown[])[0];
+    if (
+      !isRecord(status) ||
+      !hasOnlyKeys(status, ["id", "status", "timestamp", "recipient_id", "conversation", "pricing", "errors"]) ||
+      !EXTERNAL_IDENTIFIER.test(String(status.id ?? "")) ||
+      !["sent", "delivered", "read", "failed"].includes(String(status.status))
+    ) {
+      return unsupported(context, "malformed_payload");
+    }
+    const occurredAt = parseTimestamp(status.timestamp);
+    if (!occurredAt) return unsupported(context, "malformed_payload");
+    const state = status.status as "delivered" | "failed" | "read" | "sent";
+    return Object.freeze({
+      kind: "message_status",
+      connectionId: context.connectionId,
+      externalEventReference: `${String(status.id)}:${state}:${String(status.timestamp)}`,
+      externalMessageReference: String(status.id),
+      status: state,
+      occurredAt,
+      receivedAt: new Date(context.verifiedAt),
+      correlationId: context.correlationId,
+    });
+  }
+
+  if ((value.messages as unknown[]).length !== 1) return unsupported(context, "ambiguous_payload");
+  const message = (value.messages as unknown[])[0];
+  if (!isRecord(message)) return unsupported(context, "malformed_payload");
+  const commonKeys = ["from", "id", "timestamp", "type", "context"];
+  if (
+    !EXTERNAL_IDENTIFIER.test(String(message.id ?? "")) ||
+    typeof message.from !== "string" ||
+    !/^[1-9][0-9]{7,14}$/u.test(message.from)
+  ) {
+    return unsupported(context, "malformed_payload");
+  }
+  const occurredAt = parseTimestamp(message.timestamp);
+  if (!occurredAt) return unsupported(context, "malformed_payload");
+  const base = {
+    connectionId: context.connectionId,
+    externalEventReference: String(message.id),
+    messageReference: String(message.id),
+    senderEndpoint: `+${message.from}`,
+    occurredAt,
+    receivedAt: new Date(context.verifiedAt),
+    correlationId: context.correlationId,
+  } as const;
+
+  if (message.type === "text") {
+    if (
+      !hasOnlyKeys(message, [...commonKeys, "text"]) ||
+      !isRecord(message.text) ||
+      !hasOnlyKeys(message.text, ["body"]) ||
+      !isString(message.text.body, 1, 4_096)
+    ) {
+      return unsupported(context, "malformed_payload");
+    }
+    return Object.freeze({ ...base, kind: "text_message", text: message.text.body });
+  }
+
+  if (message.type === "button") {
+    if (
+      !hasOnlyKeys(message, [...commonKeys, "button"]) ||
+      !isRecord(message.button) ||
+      !hasOnlyKeys(message.button, ["payload", "text"]) ||
+      !isString(message.button.payload, 1, 256) ||
+      !isString(message.button.text, 1, 256)
+    ) {
+      return unsupported(context, "malformed_payload");
+    }
+    return Object.freeze({
+      ...base,
+      kind: "interactive_reply",
+      replyKind: "button",
+      replyId: message.button.payload,
+      replyTitle: message.button.text,
+    });
+  }
+
+  if (message.type === "interactive") {
+    if (!hasOnlyKeys(message, [...commonKeys, "interactive"]) || !isRecord(message.interactive)) {
+      return unsupported(context, "malformed_payload");
+    }
+    const interactive = message.interactive;
+    if (interactive.type === "button_reply" && isRecord(interactive.button_reply)) {
+      if (
+        !hasOnlyKeys(interactive, ["type", "button_reply"]) ||
+        !hasOnlyKeys(interactive.button_reply, ["id", "title"]) ||
+        !isString(interactive.button_reply.id, 1, 256) ||
+        !isString(interactive.button_reply.title, 1, 256)
+      ) {
+        return unsupported(context, "malformed_payload");
+      }
+      return Object.freeze({
+        ...base,
+        kind: "interactive_reply",
+        replyKind: "button",
+        replyId: interactive.button_reply.id,
+        replyTitle: interactive.button_reply.title,
+      });
+    }
+    if (interactive.type === "list_reply" && isRecord(interactive.list_reply)) {
+      if (
+        !hasOnlyKeys(interactive, ["type", "list_reply"]) ||
+        !hasOnlyKeys(interactive.list_reply, ["id", "title", "description"]) ||
+        !isString(interactive.list_reply.id, 1, 256) ||
+        !isString(interactive.list_reply.title, 1, 256) ||
+        (interactive.list_reply.description !== undefined &&
+          !isString(interactive.list_reply.description, 0, 256))
+      ) {
+        return unsupported(context, "malformed_payload");
+      }
+      return Object.freeze({
+        ...base,
+        kind: "interactive_reply",
+        replyKind: "list",
+        replyId: interactive.list_reply.id,
+        replyTitle: interactive.list_reply.title,
+      });
+    }
+    return unsupported(context, "unsupported_event");
+  }
+
+  if (["audio", "document", "image", "sticker", "video"].includes(String(message.type))) {
+    const kind = message.type as "audio" | "document" | "image" | "sticker" | "video";
+    if (!hasOnlyKeys(message, [...commonKeys, kind]) || !isRecord(message[kind])) {
+      return unsupported(context, "malformed_payload");
+    }
+    const media = message[kind] as JsonRecord;
+    if (
+      !hasOnlyKeys(media, ["id", "mime_type", "sha256", "filename", "caption", "voice", "animated"]) ||
+      !EXTERNAL_IDENTIFIER.test(String(media.id ?? "")) ||
+      (media.mime_type !== undefined &&
+        (typeof media.mime_type !== "string" || !MIME_TYPE.test(media.mime_type))) ||
+      (media.sha256 !== undefined &&
+        (typeof media.sha256 !== "string" || !CHECKSUM.test(media.sha256))) ||
+      (media.filename !== undefined && !isString(media.filename, 0, 512)) ||
+      (media.caption !== undefined && !isString(media.caption, 0, 4_096)) ||
+      (media.voice !== undefined && typeof media.voice !== "boolean") ||
+      (media.animated !== undefined && typeof media.animated !== "boolean")
+    ) {
+      return unsupported(context, "malformed_payload");
+    }
+    return Object.freeze({
+      ...base,
+      kind: "media_reference",
+      media: Object.freeze({
+        externalReference: String(media.id),
+        declaredKind: kind,
+        ...(typeof media.mime_type === "string" ? { mimeType: media.mime_type } : {}),
+        ...(typeof media.sha256 === "string" ? { checksum: media.sha256 } : {}),
+      }),
+    });
+  }
+
+  return unsupported(context, "unsupported_event");
+}
+
+function normalizeTemplate(
+  value: JsonRecord,
+  entryTime: unknown,
+  context: ResolvedVerifiedWebhookContext,
+): UnsupportedVerifiedEnvelope {
+  if (
+    !hasOnlyKeys(value, [
+      "event",
+      "message_template_id",
+      "message_template_name",
+      "message_template_language",
+      "message_template_category",
+      "message_template_components",
+      "reason",
+    ]) ||
+    !isString(value.event, 1, 64) ||
+    !EXTERNAL_IDENTIFIER.test(String(value.message_template_id ?? "")) ||
+    !isString(value.message_template_name, 1, 512) ||
+    typeof value.message_template_language !== "string" ||
+    !BCP47_LANGUAGE.test(value.message_template_language) ||
+    (value.message_template_category !== undefined &&
+      !["AUTHENTICATION", "MARKETING", "UTILITY"].includes(String(value.message_template_category))) ||
+    (value.message_template_components !== undefined &&
+      !Array.isArray(value.message_template_components)) ||
+    (value.reason !== undefined && value.reason !== null && !isString(value.reason, 0, 1_024)) ||
+    !parseNumericTimestamp(entryTime)
+  ) {
+    return unsupported(context, "malformed_payload");
+  }
+
+  return unsupported(context, "template_manual_review");
+}
+
+function normalizePayload(
+  payload: unknown,
+  context: ResolvedVerifiedWebhookContext,
+): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
+  const root = messageRoot(payload, context);
+  if ("kind" in root) return root;
+  if (root.change.field === "messages") return normalizeMessage(root.value, context);
+  if (root.change.field === "message_template_status_update") {
+    return normalizeTemplate(root.value, root.entryTime, context);
+  }
+  return unsupported(context, "unsupported_event");
+}
+
+function validTemplateContent(content: unknown): boolean {
+  if (
+    !isRecord(content) ||
+    !hasOnlyKeys(content, ["kind", "providerTemplateName", "languageCode", "components"]) ||
+    content.kind !== "template" ||
+    !TEMPLATE_NAME.test(String(content.providerTemplateName ?? "")) ||
+    !LANGUAGE_CODE.test(String(content.languageCode ?? "")) ||
+    !Array.isArray(content.components) ||
+    content.components.length === 0 ||
+    content.components.length > 4
+  ) {
+    return false;
+  }
+  return content.components.every((component) => {
+    if (!isRecord(component)) return false;
+    if (component.type === "header" || component.type === "body") {
+      return (
+        hasOnlyKeys(component, ["type", "parameters"]) &&
+        Array.isArray(component.parameters) &&
+        component.parameters.length <= 10 &&
+        component.parameters.every(
+          (parameter) =>
+            isRecord(parameter) &&
+            hasOnlyKeys(parameter, ["type", "text"]) &&
+            parameter.type === "text" &&
+            isString(parameter.text, 1, 1_024),
+        )
+      );
+    }
+    if (
+      component.type !== "button" ||
+      !hasOnlyKeys(component, ["type", "subType", "index", "parameters"]) ||
+      component.subType !== "quick_reply" ||
+      !Number.isInteger(component.index) ||
+      (component.index as number) < 0 ||
+      (component.index as number) > 9 ||
+      !Array.isArray(component.parameters) ||
+      component.parameters.length !== 1
+    ) {
+      return false;
+    }
+    const parameter = component.parameters[0];
+    return (
+      isRecord(parameter) &&
+      hasOnlyKeys(parameter, ["type", "payload"]) &&
+      parameter.type === "payload" &&
+      isString(parameter.payload, 1, 256)
+    );
+  });
+}
+
+function validDispatchCommand(command: unknown): command is ProviderDispatchCommand {
+  if (
+    !isRecord(command) ||
+    !hasOnlyKeys(command, ["connectionId", "recipientEndpoint", "correlationId", "idempotencyKey", "content"]) ||
+    !IDENTIFIER.test(String(command.connectionId ?? "")) ||
+    !ENDPOINT.test(String(command.recipientEndpoint ?? "")) ||
+    !IDENTIFIER.test(String(command.correlationId ?? "")) ||
+    !IDENTIFIER.test(String(command.idempotencyKey ?? "")) ||
+    !isRecord(command.content)
+  ) {
+    return false;
+  }
+  if (command.content.kind === "text") {
+    return hasOnlyKeys(command.content, ["kind", "body"]) && isString(command.content.body, 1, 4_096);
+  }
+  return validTemplateContent(command.content);
+}
+
+function validDispatchSecret(value: unknown): value is {
+  accessToken: string;
+  phoneNumberId: string;
+  graphApiVersion: string;
+} {
+  return (
+    isRecord(value) &&
+    hasOnlyKeys(value, ["accessToken", "phoneNumberId", "graphApiVersion"]) &&
+    typeof value.accessToken === "string" &&
+    value.accessToken.length >= 16 &&
+    value.accessToken.length <= 4_096 &&
+    !hasWhitespaceOrControl(value.accessToken) &&
+    typeof value.phoneNumberId === "string" &&
+    PROVIDER_IDENTIFIER.test(value.phoneNumberId) &&
+    typeof value.graphApiVersion === "string" &&
+    GRAPH_VERSION.test(value.graphApiVersion)
+  );
+}
+
+function dispatchBody(command: ProviderDispatchCommand): JsonRecord {
+  const base = {
+    messaging_product: "whatsapp",
+    recipient_type: "individual",
+    to: command.recipientEndpoint.slice(1),
+  } as const;
+  if (command.content.kind === "text") {
+    return { ...base, type: "text", text: { preview_url: false, body: command.content.body } };
+  }
+  return {
+    ...base,
+    type: "template",
+    template: {
+      name: command.content.providerTemplateName,
+      language: { code: command.content.languageCode },
+      components: command.content.components.map((component) => ({
+        type: component.type,
+        ...(component.type === "button"
+          ? { sub_type: component.subType, index: String(component.index) }
+          : {}),
+        parameters:
+          component.type === "button"
+            ? component.parameters.map((parameter) => ({ type: "payload", payload: parameter.payload }))
+            : component.parameters.map((parameter) => ({ type: "text", text: parameter.text })),
+      })),
+    },
+  };
+}
+
+async function readBoundedResponse(
+  response: Response,
+  maximumBytes: number,
+  signal: AbortSignal,
+): Promise<Uint8Array | null> {
+  if (!response.body) return new Uint8Array();
+  const reader = response.body.getReader();
+  const chunks: Uint8Array[] = [];
+  let total = 0;
+  try {
+    while (true) {
+      if (signal.aborted) {
+        await reader.cancel();
+        return null;
+      }
+      const part = await reader.read();
+      if (part.done) break;
+      total += part.value.byteLength;
+      if (total > maximumBytes) {
+        await reader.cancel();
+        return null;
+      }
+      chunks.push(part.value);
+    }
+  } catch {
+    return null;
+  } finally {
+    reader.releaseLock();
+  }
+  const combined = new Uint8Array(total);
+  let offset = 0;
+  for (const chunk of chunks) {
+    combined.set(chunk, offset);
+    offset += chunk.byteLength;
+  }
+  return combined;
+}
+
+function acceptedReference(raw: Uint8Array): string | null {
+  const parsed = parseProviderJson(raw);
+  if (parsed.status !== "parsed" || !isRecord(parsed.value)) return null;
+  if (!hasOnlyKeys(parsed.value, ["messaging_product", "contacts", "messages"])) return null;
+  if (!Array.isArray(parsed.value.messages) || parsed.value.messages.length !== 1) return null;
+  const message = parsed.value.messages[0];
+  if (
+    !isRecord(message) ||
+    !hasOnlyKeys(message, ["id"]) ||
+    !EXTERNAL_IDENTIFIER.test(String(message.id ?? ""))
+  ) {
+    return null;
+  }
+  return String(message.id);
+}
+
+const unsupportedReconciliation = Object.freeze({
+  status: "unsupported",
+  reason: "activation_review_required",
+} as const);
+
+export function createMetaCloudAdapter(options: MetaCloudAdapterOptions): WhatsAppProviderAdapter {
+  if (
+    typeof options.fetch !== "function" ||
+    !(options.capabilityObservedAt instanceof Date) ||
+    Number.isNaN(options.capabilityObservedAt.valueOf()) ||
+    !Number.isSafeInteger(options.maxNormalizedPayloadBytes) ||
+    options.maxNormalizedPayloadBytes < 256 ||
+    options.maxNormalizedPayloadBytes > 1_048_576 ||
+    !Number.isSafeInteger(options.maxProviderResponseBytes) ||
+    options.maxProviderResponseBytes < 256 ||
+    options.maxProviderResponseBytes > 262_144
+  ) {
+    throw new TypeError("Invalid Meta adapter options");
+  }
+  const observedAt = new Date(options.capabilityObservedAt);
+
+  return Object.freeze({
+    capabilities(): ProviderCapabilitySnapshot {
+      return Object.freeze({
+        requestIdempotency: false,
+        stableReference: false,
+        messageLookup: false,
+        statusReconciliation: false,
+        mediaReferences: true,
+        templateProjection: false,
+        get observedAt(): Date {
+          return new Date(observedAt);
+        },
+        supportedInboundKinds: Object.freeze([...META_SUPPORTED_INBOUND_KINDS]),
+        supportedStatusKinds: Object.freeze([...META_SUPPORTED_STATUS_KINDS]),
+      });
+    },
+
+    async normalizeVerifiedEvent(
+      raw: Uint8Array,
+      context: VerifiedWebhookContext,
+    ): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
+      if (!(raw instanceof Uint8Array)) return unverified();
+      const rawSnapshot = Uint8Array.from(raw);
+      const resolvedContext = resolveVerifiedMetaWebhookContext(rawSnapshot, context);
+      if (!resolvedContext) return unverified();
+      if (rawSnapshot.byteLength > options.maxNormalizedPayloadBytes) {
+        return unsupported(resolvedContext, "payload_too_large");
+      }
+      const parsed = parseProviderJson(rawSnapshot);
+      if (parsed.status !== "parsed") {
+        return unsupported(
+          resolvedContext,
+          parsed.status === "duplicate" ? "ambiguous_payload" : "malformed_payload",
+        );
+      }
+      return normalizePayload(parsed.value, resolvedContext);
+    },
+
+    async dispatch(
+      command: ProviderDispatchCommand,
+      signal: AbortSignal,
+    ): Promise<ProviderDispatchResult> {
+      if (!validDispatchCommand(command)) {
+        return { status: "confirmed_not_sent", reason: "invalid_command" };
+      }
+      if (signal.aborted) {
+        return { status: "confirmed_not_sent", reason: "aborted_before_dispatch" };
+      }
+
+      let secret: unknown;
+      try {
+        secret = await options.credentials.resolveDispatchSecret(command.connectionId);
+      } catch {
+        return { status: "confirmed_not_sent", reason: "credentials_unavailable" };
+      }
+      if (!validDispatchSecret(secret)) {
+        return { status: "confirmed_not_sent", reason: "invalid_configuration" };
+      }
+      if (signal.aborted) {
+        return { status: "confirmed_not_sent", reason: "aborted_before_dispatch" };
+      }
+
+      const url = `https://graph.facebook.com/${secret.graphApiVersion}/${secret.phoneNumberId}/messages`;
+      let response: Response;
+      try {
+        response = await options.fetch(url, {
+          method: "POST",
+          headers: {
+            authorization: `Bearer ${secret.accessToken}`,
+            "content-type": "application/json",
+          },
+          body: JSON.stringify(dispatchBody(command)),
+          signal,
+          redirect: "error",
+        });
+      } catch {
+        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
+      }
+
+      if ((response.status >= 300 && response.status < 400) || response.status >= 500) {
+        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
+      }
+      if (!response.ok) {
+        return {
+          status: "confirmed_not_sent",
+          reason: "provider_rejected",
+          statusCode: response.status,
+        };
+      }
+      const rawResponse = await readBoundedResponse(response, options.maxProviderResponseBytes, signal);
+      if (!rawResponse) return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
+      const externalMessageReference = acceptedReference(rawResponse);
+      if (!externalMessageReference) {
+        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
+      }
+      return { status: "accepted", externalMessageReference };
+    },
+
+    async reconcile(
+      _attempt: ProviderReconciliationQuery,
+      _signal: AbortSignal,
+    ): Promise<ProviderReconciliationResult> {
+      return unsupportedReconciliation;
+    },
+
+    async reconcileMessages(
+      _query: ProviderMessageReconciliationQuery,
+      _signal: AbortSignal,
+    ): Promise<ProviderMessageReconciliationResult> {
+      return unsupportedReconciliation;
+    },
+
+    async reconcileTemplates(
+      _query: ProviderTemplateReconciliationQuery,
+      _signal: AbortSignal,
+    ): Promise<ProviderTemplateReconciliationResult> {
+      return unsupportedReconciliation;
+    },
+  });
+}
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts
new file mode 100644
index 0000000..646c4e4
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts
@@ -0,0 +1,229 @@
+import type {
+  ChannelLocale,
+  MessageTemplateProjection,
+  OutboundCommandState,
+  TemplateLifecycleState,
+} from "@atlas/domain";
+
+export type VerifiedWebhookContext = {
+  readonly kind: "verified_meta_webhook";
+};
+
+export type UnsupportedVerifiedReason =
+  | "ambiguous_payload"
+  | "connection_mismatch"
+  | "malformed_payload"
+  | "payload_too_large"
+  | "template_manual_review"
+  | "unsupported_event"
+  | "unverified_context";
+
+export type UnsupportedVerifiedEnvelope = {
+  readonly kind: "unsupported_verified";
+  readonly connectionId: string;
+  readonly reason: UnsupportedVerifiedReason;
+  readonly receivedAt: Date;
+  readonly correlationId: string;
+};
+
+type CanonicalEnvelopeBase = {
+  readonly connectionId: string;
+  readonly externalEventReference: string;
+  readonly receivedAt: Date;
+  readonly correlationId: string;
+};
+
+export type CanonicalTextEnvelope = CanonicalEnvelopeBase & {
+  readonly kind: "text_message";
+  readonly messageReference: string;
+  readonly senderEndpoint: string;
+  readonly text: string;
+  readonly occurredAt: Date;
+};
+
+export type CanonicalInteractiveEnvelope = CanonicalEnvelopeBase & {
+  readonly kind: "interactive_reply";
+  readonly messageReference: string;
+  readonly senderEndpoint: string;
+  readonly replyKind: "button" | "list";
+  readonly replyId: string;
+  readonly replyTitle: string;
+  readonly occurredAt: Date;
+};
+
+export type CanonicalMediaEnvelope = CanonicalEnvelopeBase & {
+  readonly kind: "media_reference";
+  readonly messageReference: string;
+  readonly senderEndpoint: string;
+  readonly occurredAt: Date;
+  readonly media: {
+    readonly externalReference: string;
+    readonly declaredKind: "audio" | "document" | "image" | "sticker" | "video";
+    readonly mimeType?: string;
+    readonly checksum?: string;
+  };
+};
+
+export type CanonicalStatusEnvelope = CanonicalEnvelopeBase & {
+  readonly kind: "message_status";
+  readonly externalMessageReference: string;
+  readonly status: Extract<OutboundCommandState, "sent" | "delivered" | "read" | "failed">;
+  readonly occurredAt: Date;
+};
+
+export type CanonicalTemplateComponent = {
+  readonly type: "body" | "buttons" | "footer" | "header";
+  readonly format?: "document" | "image" | "text" | "video";
+  readonly text?: string;
+};
+
+export type CanonicalTemplateProjection = MessageTemplateProjection & {
+  readonly providerReference: string;
+  readonly templateKey: string;
+  readonly category: "authentication" | "marketing" | "utility";
+  readonly components: readonly CanonicalTemplateComponent[];
+  readonly status: Extract<
+    TemplateLifecycleState,
+    "submitted" | "provider_approved" | "provider_rejected" | "paused" | "disabled"
+  >;
+  readonly providerVersion: string;
+  readonly providerTimestamp: Date;
+};
+
+export type CanonicalTemplateProjectionEnvelope = CanonicalEnvelopeBase & {
+  readonly kind: "template_projection";
+  readonly projection: CanonicalTemplateProjection;
+};
+
+export type CanonicalProviderEnvelope =
+  | CanonicalInteractiveEnvelope
+  | CanonicalMediaEnvelope
+  | CanonicalStatusEnvelope
+  | CanonicalTemplateProjectionEnvelope
+  | CanonicalTextEnvelope;
+
+export type ProviderTextDispatchContent = {
+  readonly kind: "text";
+  readonly body: string;
+};
+
+export type ProviderTemplateTextComponent = {
+  readonly type: "body" | "header";
+  readonly parameters: readonly { readonly type: "text"; readonly text: string }[];
+};
+
+export type ProviderTemplateQuickReplyComponent = {
+  readonly type: "button";
+  readonly subType: "quick_reply";
+  readonly index: number;
+  readonly parameters: readonly [{ readonly type: "payload"; readonly payload: string }];
+};
+
+export type ProviderTemplateDispatchComponent =
+  | ProviderTemplateQuickReplyComponent
+  | ProviderTemplateTextComponent;
+
+export type ProviderTemplateDispatchContent = {
+  readonly kind: "template";
+  readonly providerTemplateName: string;
+  readonly languageCode: string;
+  readonly components: readonly ProviderTemplateDispatchComponent[];
+};
+
+export type ProviderDispatchCommand = {
+  readonly connectionId: string;
+  readonly recipientEndpoint: string;
+  readonly correlationId: string;
+  readonly idempotencyKey: string;
+  readonly content: ProviderTemplateDispatchContent | ProviderTextDispatchContent;
+};
+
+export type ProviderDispatchResult =
+  | { readonly status: "accepted"; readonly externalMessageReference: string }
+  | {
+      readonly status: "confirmed_not_sent";
+      readonly reason:
+        | "aborted_before_dispatch"
+        | "credentials_unavailable"
+        | "invalid_command"
+        | "invalid_configuration"
+        | "provider_rejected";
+      readonly statusCode?: number;
+    }
+  | { readonly status: "dispatch_unknown"; readonly reason: "acceptance_ambiguous" };
+
+export type ProviderReconciliationQuery = {
+  readonly connectionId: string;
+  readonly attemptId: string;
+};
+
+export type ProviderMessageReconciliationQuery = {
+  readonly connectionId: string;
+  readonly cursor: string | null;
+  readonly limit: number;
+};
+
+export type ProviderTemplateReconciliationQuery = ProviderMessageReconciliationQuery;
+
+export type ProviderReconciliationResult = {
+  readonly status: "unsupported";
+  readonly reason: "activation_review_required";
+};
+
+export type ProviderMessageReconciliationResult = ProviderReconciliationResult;
+export type ProviderTemplateReconciliationResult = ProviderReconciliationResult;
+
+export type ProviderInboundKind =
+  | "interactive_reply"
+  | "media_reference"
+  | "message_status"
+  | "text_message";
+
+export type ProviderStatusKind = "delivered" | "failed" | "read" | "sent";
+
+export type ProviderCapabilitySnapshot = {
+  readonly requestIdempotency: false;
+  readonly stableReference: false;
+  readonly messageLookup: false;
+  readonly statusReconciliation: false;
+  readonly mediaReferences: true;
+  readonly templateProjection: false;
+  readonly observedAt: Date;
+  readonly supportedInboundKinds: readonly ProviderInboundKind[];
+  readonly supportedStatusKinds: readonly ProviderStatusKind[];
+};
+
+export interface WhatsAppProviderAdapter {
+  capabilities(): ProviderCapabilitySnapshot;
+  normalizeVerifiedEvent(
+    raw: Uint8Array,
+    context: VerifiedWebhookContext,
+  ): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope>;
+  dispatch(command: ProviderDispatchCommand, signal: AbortSignal): Promise<ProviderDispatchResult>;
+  reconcile(
+    attempt: ProviderReconciliationQuery,
+    signal: AbortSignal,
+  ): Promise<ProviderReconciliationResult>;
+  reconcileMessages(
+    query: ProviderMessageReconciliationQuery,
+    signal: AbortSignal,
+  ): Promise<ProviderMessageReconciliationResult>;
+  reconcileTemplates(
+    query: ProviderTemplateReconciliationQuery,
+    signal: AbortSignal,
+  ): Promise<ProviderTemplateReconciliationResult>;
+}
+
+export const META_SUPPORTED_INBOUND_KINDS = Object.freeze([
+  "text_message",
+  "interactive_reply",
+  "message_status",
+  "media_reference",
+] satisfies readonly ProviderInboundKind[]);
+
+export const META_SUPPORTED_STATUS_KINDS = Object.freeze([
+  "sent",
+  "delivered",
+  "read",
+  "failed",
+] satisfies readonly ProviderStatusKind[]);
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts
new file mode 100644
index 0000000..fc373c1
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts
@@ -0,0 +1,146 @@
+import { createHash, createHmac, timingSafeEqual } from "node:crypto";
+import type { VerifiedWebhookContext } from "./meta-contracts.ts";
+
+const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
+const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
+const CHALLENGE = /^[A-Za-z0-9._~-]{1,512}$/u;
+const SIGNATURE = /^sha256=([a-f0-9]{64})$/u;
+
+export type MetaChallengeResult =
+  | { readonly accepted: true; readonly challenge: string }
+  | { readonly accepted: false; readonly reason: "verification_rejected" };
+
+export type VerifyMetaWebhookInput = {
+  readonly raw: Uint8Array;
+  readonly signatureHeader: string | undefined;
+  readonly appSecret: string;
+  readonly connectionId: string;
+  readonly businessAccountId: string;
+  readonly phoneNumberId: string;
+  readonly correlationId: string;
+  readonly verifiedAt: Date;
+};
+
+export type MetaWebhookVerificationResult =
+  | { readonly status: "verified"; readonly context: VerifiedWebhookContext }
+  | {
+      readonly status: "rejected";
+      readonly reason: "signature_rejected" | "verification_rejected";
+    };
+
+export type ResolvedVerifiedWebhookContext = {
+  readonly connectionId: string;
+  readonly businessAccountId: string;
+  readonly phoneNumberId: string;
+  readonly correlationId: string;
+  readonly verifiedAt: Date;
+};
+
+type VerifiedWebhookBinding = ResolvedVerifiedWebhookContext & {
+  readonly rawDigest: Uint8Array;
+};
+
+const verifiedWebhookBindings = new WeakMap<VerifiedWebhookContext, VerifiedWebhookBinding>();
+
+function digestRaw(raw: Uint8Array): Uint8Array {
+  return createHash("sha256").update(raw).digest();
+}
+
+function constantTimeTextEqual(left: string, right: string): boolean {
+  const leftDigest = createHash("sha256").update(left, "utf8").digest();
+  const rightDigest = createHash("sha256").update(right, "utf8").digest();
+  return timingSafeEqual(leftDigest, rightDigest);
+}
+
+export function resolveVerifiedMetaWebhookContext(
+  raw: Uint8Array,
+  context: VerifiedWebhookContext,
+): ResolvedVerifiedWebhookContext | null {
+  if (!(raw instanceof Uint8Array) || !context || typeof context !== "object") return null;
+  const binding = verifiedWebhookBindings.get(context);
+  if (!binding) return null;
+  const suppliedDigest = digestRaw(raw);
+  if (
+    suppliedDigest.byteLength !== binding.rawDigest.byteLength ||
+    !timingSafeEqual(suppliedDigest, binding.rawDigest)
+  ) {
+    return null;
+  }
+
+  return Object.freeze({
+    connectionId: binding.connectionId,
+    businessAccountId: binding.businessAccountId,
+    phoneNumberId: binding.phoneNumberId,
+    correlationId: binding.correlationId,
+    verifiedAt: new Date(binding.verifiedAt),
+  });
+}
+
+export function verifyMetaChallenge(
+  query: URLSearchParams,
+  configuredVerifyToken: string,
+): MetaChallengeResult {
+  const modes = query.getAll("hub.mode");
+  const tokens = query.getAll("hub.verify_token");
+  const challenges = query.getAll("hub.challenge");
+  const validConfiguredToken =
+    configuredVerifyToken.length >= 16 && configuredVerifyToken.length <= 4_096;
+
+  if (
+    modes.length !== 1 ||
+    tokens.length !== 1 ||
+    challenges.length !== 1 ||
+    modes[0] !== "subscribe" ||
+    !validConfiguredToken ||
+    !constantTimeTextEqual(tokens[0] ?? "", configuredVerifyToken) ||
+    !CHALLENGE.test(challenges[0] ?? "")
+  ) {
+    return { accepted: false, reason: "verification_rejected" };
+  }
+
+  return { accepted: true, challenge: challenges[0] as string };
+}
+
+export function verifyMetaWebhookSignature(
+  raw: Uint8Array,
+  signatureHeader: string | undefined,
+  appSecret: string,
+): boolean {
+  if (!(raw instanceof Uint8Array)) return false;
+  const match = signatureHeader?.match(SIGNATURE);
+  if (!match || appSecret.length < 16 || appSecret.length > 4_096) return false;
+
+  const received = Buffer.from(match[1] as string, "hex");
+  const expected = createHmac("sha256", appSecret).update(raw).digest();
+  return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
+}
+
+export function verifyMetaWebhook(input: VerifyMetaWebhookInput): MetaWebhookVerificationResult {
+  if (
+    !(input.raw instanceof Uint8Array) ||
+    !IDENTIFIER.test(input.connectionId) ||
+    !PROVIDER_IDENTIFIER.test(input.businessAccountId) ||
+    !PROVIDER_IDENTIFIER.test(input.phoneNumberId) ||
+    !IDENTIFIER.test(input.correlationId) ||
+    !(input.verifiedAt instanceof Date) ||
+    Number.isNaN(input.verifiedAt.valueOf())
+  ) {
+    return { status: "rejected", reason: "verification_rejected" };
+  }
+
+  const rawSnapshot = Uint8Array.from(input.raw);
+  if (!verifyMetaWebhookSignature(rawSnapshot, input.signatureHeader, input.appSecret)) {
+    return { status: "rejected", reason: "signature_rejected" };
+  }
+
+  const context: VerifiedWebhookContext = Object.freeze({ kind: "verified_meta_webhook" });
+  verifiedWebhookBindings.set(context, {
+    connectionId: input.connectionId,
+    businessAccountId: input.businessAccountId,
+    phoneNumberId: input.phoneNumberId,
+    correlationId: input.correlationId,
+    verifiedAt: new Date(input.verifiedAt),
+    rawDigest: digestRaw(rawSnapshot),
+  });
+  return { status: "verified", context };
+}
diff --git a/blueprints/project-atlas/workspace/pnpm-lock.yaml b/blueprints/project-atlas/workspace/pnpm-lock.yaml
index fd5674a..df47985 100644
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
+      '@atlas/domain':
+        specifier: workspace:*
+        version: link:../../packages/domain
       '@atlas/ui':
         specifier: workspace:*
         version: link:../../packages/ui
       '@tailwindcss/postcss':
         specifier: 4.3.3
         version: 4.3.3
       next:
         specifier: 16.2.12
         version: 16.2.12(@babel/core@7.29.7(supports-color@8.1.1))(@opentelemetry/api@1.9.1)(@playwright/test@1.62.1)(@types/node@24.13.3)(react-dom@19.2.8(react@19.2.8))(react@19.2.8)
       postcss:
diff --git a/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
new file mode 100644
index 0000000..197169e
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts
@@ -0,0 +1,528 @@
+import { createHmac } from "node:crypto";
+import { describe, expect, it, vi } from "vitest";
+import { createFailClosedMetaCredentialResolver } from "../../apps/app/src/lib/whatsapp/credentials.ts";
+import { createMetaCloudAdapter } from "../../apps/app/src/lib/whatsapp/meta-adapter.ts";
+import type {
+  ProviderDispatchCommand,
+  VerifiedWebhookContext,
+} from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
+import { verifyMetaWebhook } from "../../apps/app/src/lib/whatsapp/meta-webhook.ts";
+
+const APP_SECRET = "synthetic-meta-app-secret-task5";
+const ACCESS_TOKEN = "synthetic-meta-access-token-task5";
+const CONNECTION_ID = "connection_synthetic_meta";
+const BUSINESS_ACCOUNT_ID = "100000000000001";
+const PHONE_NUMBER_ID = "200000000000002";
+const OBSERVED_AT = new Date("2026-08-13T23:15:00.000Z");
+
+function rawJson(value: unknown): Uint8Array {
+  return new TextEncoder().encode(JSON.stringify(value));
+}
+
+function verifiedContext(
+  raw: Uint8Array,
+  overrides: Partial<{
+    connectionId: string;
+    businessAccountId: string;
+    phoneNumberId: string;
+  }> = {},
+): VerifiedWebhookContext {
+  const result = verifyMetaWebhook({
+    raw,
+    signatureHeader: `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`,
+    appSecret: APP_SECRET,
+    connectionId: overrides.connectionId ?? CONNECTION_ID,
+    businessAccountId: overrides.businessAccountId ?? BUSINESS_ACCOUNT_ID,
+    phoneNumberId: overrides.phoneNumberId ?? PHONE_NUMBER_ID,
+    correlationId: "correlation_synthetic_meta",
+    verifiedAt: OBSERVED_AT,
+  });
+  if (result.status !== "verified") throw new Error("synthetic fixture failed verification");
+  return result.context;
+}
+
+function messagePayload(message: Record<string, unknown>) {
+  return {
+    object: "whatsapp_business_account",
+    entry: [{
+      id: BUSINESS_ACCOUNT_ID,
+      changes: [{
+        field: "messages",
+        value: {
+          messaging_product: "whatsapp",
+          metadata: {
+            display_phone_number: "15550000000",
+            phone_number_id: PHONE_NUMBER_ID,
+          },
+          contacts: [{ profile: { name: "Synthetic Person" }, wa_id: "15550000001" }],
+          messages: [message],
+        },
+      }],
+    }],
+  };
+}
+
+function statusPayload(status: Record<string, unknown>) {
+  return {
+    object: "whatsapp_business_account",
+    entry: [{
+      id: BUSINESS_ACCOUNT_ID,
+      changes: [{
+        field: "messages",
+        value: {
+          messaging_product: "whatsapp",
+          metadata: { phone_number_id: PHONE_NUMBER_ID },
+          statuses: [status],
+        },
+      }],
+    }],
+  };
+}
+
+function templatePayload(event = "APPROVED") {
+  return {
+    object: "whatsapp_business_account",
+    entry: [{
+      id: BUSINESS_ACCOUNT_ID,
+      time: 1_786_661_700,
+      changes: [{
+        field: "message_template_status_update",
+        value: {
+          event,
+          message_template_id: "300000000000003",
+          message_template_name: "PRIVATE-TEMPLATE-NAME",
+          message_template_language: "en-US",
+          message_template_category: "UTILITY",
+        },
+      }],
+    }],
+  };
+}
+
+function credentials(overrides: Record<string, string> = {}) {
+  return {
+    resolveVerificationSecret: async () => ({
+      appSecret: APP_SECRET,
+      verifyToken: "synthetic-meta-verify-token-task5",
+    }),
+    resolveDispatchSecret: async () => ({
+      accessToken: ACCESS_TOKEN,
+      phoneNumberId: PHONE_NUMBER_ID,
+      graphApiVersion: "v25.0",
+      ...overrides,
+    }),
+  };
+}
+
+function createAdapter(
+  fetchImplementation: typeof fetch = vi.fn(async () => {
+    throw new Error("fetch was not configured");
+  }),
+  resolver = credentials(),
+) {
+  return createMetaCloudAdapter({
+    credentials: resolver,
+    fetch: fetchImplementation,
+    capabilityObservedAt: OBSERVED_AT,
+    maxNormalizedPayloadBytes: 64 * 1024,
+    maxProviderResponseBytes: 16 * 1024,
+  });
+}
+
+function textCommand(overrides: Partial<ProviderDispatchCommand> = {}): ProviderDispatchCommand {
+  return {
+    connectionId: CONNECTION_ID,
+    recipientEndpoint: "+15550000001",
+    correlationId: "correlation_dispatch_synthetic",
+    idempotencyKey: "idempotency_dispatch_synthetic",
+    content: { kind: "text", body: "Synthetic hello" },
+    ...overrides,
+  };
+}
+
+describe("inactive Meta Cloud adapter normalization", () => {
+  it("binds normalization to the exact immutable raw bytes that were verified", async () => {
+    const signedRaw = rawJson(messagePayload({
+      from: "15550000001",
+      id: "wamid.synthetic.signed",
+      timestamp: "1786661700",
+      type: "text",
+      text: { body: "signed-private-marker" },
+    }));
+    const substitutedRaw = rawJson(messagePayload({
+      from: "15550000001",
+      id: "wamid.synthetic.substituted",
+      timestamp: "1786661700",
+      type: "text",
+      text: { body: "substituted-private-marker" },
+    }));
+
+    const result = await createAdapter().normalizeVerifiedEvent(
+      substitutedRaw,
+      verifiedContext(signedRaw),
+    );
+
+    expect(result).toMatchObject({ kind: "unsupported_verified", reason: "unverified_context" });
+    expect(JSON.stringify(result)).not.toContain("private-marker");
+  });
+
+  it("rejects a copied verification capability", async () => {
+    const raw = rawJson(messagePayload({
+      from: "15550000001",
+      id: "wamid.synthetic.forged",
+      timestamp: "1786661700",
+      type: "text",
+      text: { body: "safe" },
+    }));
+    const forged = { ...verifiedContext(raw) } as VerifiedWebhookContext;
+
+    await expect(createAdapter().normalizeVerifiedEvent(raw, forged)).resolves.toMatchObject({
+      kind: "unsupported_verified",
+      reason: "unverified_context",
+    });
+  });
+
+  it("returns a deeply immutable capability snapshot", () => {
+    const adapter = createAdapter();
+    const snapshot = adapter.capabilities();
+
+    expect(snapshot).toEqual({
+      requestIdempotency: false,
+      stableReference: false,
+      messageLookup: false,
+      statusReconciliation: false,
+      mediaReferences: true,
+      templateProjection: false,
+      observedAt: OBSERVED_AT,
+      supportedInboundKinds: ["text_message", "interactive_reply", "message_status", "media_reference"],
+      supportedStatusKinds: ["sent", "delivered", "read", "failed"],
+    });
+    expect(Object.isFrozen(snapshot)).toBe(true);
+    expect(Object.isFrozen(snapshot.supportedInboundKinds)).toBe(true);
+    snapshot.observedAt.setUTCFullYear(1999);
+    expect(adapter.capabilities().observedAt.toISOString()).toBe("2026-08-13T23:15:00.000Z");
+  });
+
+  it("normalizes a supported text message into canonical fields", async () => {
+    const raw = rawJson(messagePayload({
+      from: "15550000001",
+      id: "wamid.synthetic.text.1",
+      timestamp: "1786661700",
+      type: "text",
+      text: { body: "Necesito información" },
+    }));
+
+    await expect(createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw))).resolves.toEqual({
+      kind: "text_message",
+      connectionId: CONNECTION_ID,
+      externalEventReference: "wamid.synthetic.text.1",
+      messageReference: "wamid.synthetic.text.1",
+      senderEndpoint: "+15550000001",
+      text: "Necesito información",
+      occurredAt: new Date("2026-08-13T22:55:00.000Z"),
+      receivedAt: OBSERVED_AT,
+      correlationId: "correlation_synthetic_meta",
+    });
+  });
+
+  it.each([
+    ["interactive button", {
+      from: "15550000001", id: "wamid.synthetic.button", timestamp: "1786661700", type: "interactive",
+      interactive: { type: "button_reply", button_reply: { id: "service_credit", title: "Credit" } },
+    }, { replyKind: "button", replyId: "service_credit", replyTitle: "Credit" }],
+    ["interactive list", {
+      from: "15550000001", id: "wamid.synthetic.list", timestamp: "1786661700", type: "interactive",
+      interactive: { type: "list_reply", list_reply: { id: "service_tax", title: "Taxes", description: "Synthetic" } },
+    }, { replyKind: "list", replyId: "service_tax", replyTitle: "Taxes" }],
+    ["template quick reply", {
+      from: "15550000001", id: "wamid.synthetic.template-button", timestamp: "1786661700", type: "button",
+      button: { payload: "service_credit", text: "Credit" },
+    }, { replyKind: "button", replyId: "service_credit", replyTitle: "Credit" }],
+  ])("normalizes one supported %s", async (_label, message, expected) => {
+    const raw = rawJson(messagePayload(message));
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+    expect(result).toMatchObject({
+      kind: "interactive_reply",
+      connectionId: CONNECTION_ID,
+      senderEndpoint: "+15550000001",
+      ...expected,
+    });
+  });
+
+  it.each(["image", "audio", "video", "document", "sticker"])(
+    "normalizes only %s media-reference metadata",
+    async (type) => {
+      const marker = "PRIVATE-CAPTION-OR-FILENAME";
+      const raw = rawJson(messagePayload({
+        from: "15550000001",
+        id: `wamid.synthetic.${type}`,
+        timestamp: "1786661700",
+        type,
+        [type]: {
+          id: `media.synthetic.${type}`,
+          mime_type: type === "document" ? "application/pdf" : `${type}/synthetic`,
+          sha256: "a".repeat(64),
+          caption: marker,
+          filename: marker,
+        },
+      }));
+      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+      expect(result).toMatchObject({
+        kind: "media_reference",
+        media: {
+          externalReference: `media.synthetic.${type}`,
+          declaredKind: type,
+          checksum: "a".repeat(64),
+        },
+      });
+      expect(JSON.stringify(result)).not.toContain(marker);
+    },
+  );
+
+  it.each(["sent", "delivered", "read", "failed"])(
+    "normalizes the supported %s status without recipient or provider errors",
+    async (status) => {
+      const raw = rawJson(statusPayload({
+        id: "wamid.synthetic.outbound.1",
+        status,
+        timestamp: "1786661700",
+        recipient_id: "15550000001",
+        errors: [{ code: 13_100, title: "PRIVATE-PROVIDER-ERROR" }],
+      }));
+      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+      expect(result).toMatchObject({
+        kind: "message_status",
+        externalMessageReference: "wamid.synthetic.outbound.1",
+        status,
+      });
+      expect(JSON.stringify(result)).not.toContain("15550000001");
+      expect(JSON.stringify(result)).not.toContain("PRIVATE-PROVIDER-ERROR");
+    },
+  );
+
+  it.each(["APPROVED", "REJECTED", "PAUSED", "DISABLED", "MYSTERY_STATUS"])(
+    "keeps the WABA-level template %s callback minimized and manual until activation review",
+    async (event) => {
+      const raw = rawJson(templatePayload(event));
+      const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+      expect(result).toEqual({
+        kind: "unsupported_verified",
+        connectionId: CONNECTION_ID,
+        reason: "template_manual_review",
+        receivedAt: OBSERVED_AT,
+        correlationId: "correlation_synthetic_meta",
+      });
+      expect(JSON.stringify(result)).not.toContain(event);
+      expect(JSON.stringify(result)).not.toContain("PRIVATE-TEMPLATE-NAME");
+    },
+  );
+
+  it.each([
+    ["account", { businessAccountId: "999999999999999", phoneNumberId: PHONE_NUMBER_ID }],
+    ["phone", { businessAccountId: BUSINESS_ACCOUNT_ID, phoneNumberId: "999999999999999" }],
+  ])("rejects %s mapping mismatch without reflecting identifiers", async (_label, mismatch) => {
+    const raw = rawJson(messagePayload({
+      from: "15550000001", id: "wamid.synthetic.mismatch", timestamp: "1786661700", type: "text", text: { body: "safe" },
+    }));
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw, mismatch));
+    expect(result).toMatchObject({ kind: "unsupported_verified", reason: "connection_mismatch" });
+    expect(JSON.stringify(result)).not.toContain("999999999999999");
+  });
+
+  it.each([
+    ["duplicate JSON key", new TextEncoder().encode('{"object":"whatsapp_business_account","object":"other","entry":[]}')],
+    ["multiple entries", rawJson({ object: "whatsapp_business_account", entry: [{ id: BUSINESS_ACCOUNT_ID }, { id: BUSINESS_ACCOUNT_ID }] })],
+    ["unsupported event", rawJson({ object: "whatsapp_business_account", entry: [{ id: BUSINESS_ACCOUNT_ID, marker: "PRIVATE-RAW" }] })],
+  ])("returns a minimized unsupported envelope for %s", async (_label, raw) => {
+    const result = await createAdapter().normalizeVerifiedEvent(raw, verifiedContext(raw));
+    expect(result).toMatchObject({ kind: "unsupported_verified" });
+    expect(JSON.stringify(result)).not.toContain("PRIVATE-RAW");
+  });
+});
+
+describe("inactive Meta Cloud adapter dispatch", () => {
+  it("uses injected fetch with the exact URL, bearer header, allowlisted text JSON, and caller signal", async () => {
+    let captured: { url: string; init?: RequestInit } | undefined;
+    const fetchImplementation: typeof fetch = vi.fn(async (input, init) => {
+      captured = { url: String(input), init };
+      return new Response(JSON.stringify({ messages: [{ id: "wamid.synthetic.accepted.1" }] }), { status: 200 });
+    });
+    const controller = new AbortController();
+
+    await expect(createAdapter(fetchImplementation).dispatch(textCommand(), controller.signal)).resolves.toEqual({
+      status: "accepted",
+      externalMessageReference: "wamid.synthetic.accepted.1",
+    });
+    expect(captured).toEqual({
+      url: `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
+      init: {
+        method: "POST",
+        redirect: "error",
+        signal: controller.signal,
+        headers: { authorization: `Bearer ${ACCESS_TOKEN}`, "content-type": "application/json" },
+        body: JSON.stringify({
+          messaging_product: "whatsapp",
+          recipient_type: "individual",
+          to: "15550000001",
+          type: "text",
+          text: { preview_url: false, body: "Synthetic hello" },
+        }),
+      },
+    });
+  });
+
+  it("maps an allowlisted template and quick-reply payload without arbitrary fields", async () => {
+    let body: unknown;
+    const fetchImplementation: typeof fetch = vi.fn(async (_input, init) => {
+      body = JSON.parse(String(init?.body));
+      return new Response(JSON.stringify({ messages: [{ id: "wamid.synthetic.template.1" }] }), { status: 200 });
+    });
+    const command = textCommand({
+      content: {
+        kind: "template",
+        providerTemplateName: "synthetic_appointment_notice",
+        languageCode: "es_US",
+        components: [{
+          type: "button",
+          subType: "quick_reply",
+          index: 0,
+          parameters: [{ type: "payload", payload: "service_credit" }],
+        }],
+      },
+    });
+
+    await createAdapter(fetchImplementation).dispatch(command, new AbortController().signal);
+    expect(body).toEqual({
+      messaging_product: "whatsapp",
+      recipient_type: "individual",
+      to: "15550000001",
+      type: "template",
+      template: {
+        name: "synthetic_appointment_notice",
+        language: { code: "es_US" },
+        components: [{
+          type: "button",
+          sub_type: "quick_reply",
+          index: "0",
+          parameters: [{ type: "payload", payload: "service_credit" }],
+        }],
+      },
+    });
+  });
+
+  it.each([
+    ["unsafe recipient", { recipientEndpoint: "+1555/../000001" }],
+    ["empty text", { content: { kind: "text", body: "" } }],
+    ["oversized text", { content: { kind: "text", body: "x".repeat(4_097) } }],
+    ["unknown content", { content: { kind: "raw", body: "PRIVATE-BODY" } }],
+  ])("rejects %s before credential resolution or fetch", async (_label, overrides) => {
+    const resolveDispatchSecret = vi.fn();
+    const fetchImplementation = vi.fn();
+    const adapter = createAdapter(fetchImplementation as unknown as typeof fetch, {
+      resolveVerificationSecret: vi.fn(),
+      resolveDispatchSecret,
+    });
+    const result = await adapter.dispatch(
+      textCommand(overrides as Partial<ProviderDispatchCommand>),
+      new AbortController().signal,
+    );
+    expect(result).toEqual({ status: "confirmed_not_sent", reason: "invalid_command" });
+    expect(resolveDispatchSecret).not.toHaveBeenCalled();
+    expect(fetchImplementation).not.toHaveBeenCalled();
+    expect(JSON.stringify(result)).not.toContain("PRIVATE");
+  });
+
+  it.each([
+    ["version traversal", { graphApiVersion: "v25.0/../me" }],
+    ["version query", { graphApiVersion: "v25.0?fields=id" }],
+    ["phone traversal", { phoneNumberId: "200/../messages" }],
+    ["phone query", { phoneNumberId: "200?access_token=PRIVATE" }],
+  ])("rejects unsafe %s before fetch without reflection", async (_label, override) => {
+    const fetchImplementation = vi.fn();
+    const result = await createAdapter(
+      fetchImplementation as unknown as typeof fetch,
+      credentials(override),
+    ).dispatch(textCommand(), new AbortController().signal);
+    expect(result).toEqual({ status: "confirmed_not_sent", reason: "invalid_configuration" });
+    expect(fetchImplementation).not.toHaveBeenCalled();
+    expect(JSON.stringify(result)).not.toContain(Object.values(override)[0]);
+  });
+
+  it("does no lookup or I/O when already aborted", async () => {
+    const fetchImplementation = vi.fn();
+    const resolveDispatchSecret = vi.fn();
+    const controller = new AbortController();
+    controller.abort();
+    const result = await createAdapter(fetchImplementation as unknown as typeof fetch, {
+      resolveVerificationSecret: vi.fn(),
+      resolveDispatchSecret,
+    }).dispatch(textCommand(), controller.signal);
+    expect(result).toEqual({ status: "confirmed_not_sent", reason: "aborted_before_dispatch" });
+    expect(resolveDispatchSecret).not.toHaveBeenCalled();
+    expect(fetchImplementation).not.toHaveBeenCalled();
+  });
+
+  it("returns bounded known rejection for 4xx without reading response details into the result", async () => {
+    const result = await createAdapter(vi.fn(async () => new Response(
+      JSON.stringify({ error: { message: "PRIVATE-RESPONSE", token: ACCESS_TOKEN } }),
+      { status: 400 },
+    ))).dispatch(textCommand(), new AbortController().signal);
+    expect(result).toEqual({ status: "confirmed_not_sent", reason: "provider_rejected", statusCode: 400 });
+    expect(JSON.stringify(result)).not.toContain("PRIVATE");
+    expect(JSON.stringify(result)).not.toContain(ACCESS_TOKEN);
+  });
+
+  it.each([
+    ["network failure", vi.fn(async () => { throw new Error("PRIVATE-NETWORK"); })],
+    ["server failure", vi.fn(async () => new Response("PRIVATE-UPSTREAM", { status: 503 }))],
+    ["redirect", vi.fn(async () => new Response(null, { status: 302 }))],
+    ["empty success", vi.fn(async () => new Response(JSON.stringify({ messages: [] }), { status: 200 }))],
+    ["multiple references", vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: "one" }, { id: "two" }] }), { status: 200 }))],
+    ["oversized response", vi.fn(async () => new Response("x".repeat(20_000), { status: 200 }))],
+  ])("classifies %s as dispatch_unknown and never retries", async (_label, fetchImplementation) => {
+    const result = await createAdapter(fetchImplementation as unknown as typeof fetch)
+      .dispatch(textCommand(), new AbortController().signal);
+    expect(result).toEqual({ status: "dispatch_unknown", reason: "acceptance_ambiguous" });
+    expect(fetchImplementation).toHaveBeenCalledTimes(1);
+    expect(JSON.stringify(result)).not.toContain("PRIVATE");
+  });
+
+  it("never logs credentials, endpoint, body, or provider response", async () => {
+    const spies = [
+      vi.spyOn(console, "log").mockImplementation(() => undefined),
+      vi.spyOn(console, "warn").mockImplementation(() => undefined),
+      vi.spyOn(console, "error").mockImplementation(() => undefined),
+    ];
+    try {
+      await createAdapter(vi.fn(async () => new Response("PRIVATE-RAW", { status: 500 })))
+        .dispatch(textCommand(), new AbortController().signal);
+      expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
+    } finally {
+      for (const spy of spies) spy.mockRestore();
+    }
+  });
+
+  it("keeps dispatch, message, and template reconciliation unsupported without provider I/O", async () => {
+    const fetchImplementation = vi.fn();
+    const adapter = createAdapter(fetchImplementation as unknown as typeof fetch);
+    const signal = new AbortController().signal;
+    await expect(adapter.reconcile({ connectionId: CONNECTION_ID, attemptId: "attempt_synthetic" }, signal))
+      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
+    await expect(adapter.reconcileMessages({ connectionId: CONNECTION_ID, cursor: null, limit: 10 }, signal))
+      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
+    await expect(adapter.reconcileTemplates({ connectionId: CONNECTION_ID, cursor: null, limit: 10 }, signal))
+      .resolves.toEqual({ status: "unsupported", reason: "activation_review_required" });
+    expect(fetchImplementation).not.toHaveBeenCalled();
+  });
+
+  it("provides a production resolver that fails closed without echoing connection input", async () => {
+    const resolver = createFailClosedMetaCredentialResolver();
+    await expect(resolver.resolveVerificationSecret("PRIVATE-CONNECTION")).rejects.toMatchObject({
+      name: "MetaCredentialsUnavailableError",
+      code: "credentials_unavailable",
+    });
+    await resolver.resolveDispatchSecret("PRIVATE-CONNECTION").catch((error: unknown) => {
+      expect(String(error)).not.toContain("PRIVATE-CONNECTION");
+    });
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts b/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts
new file mode 100644
index 0000000..dbd3fd9
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts
@@ -0,0 +1,136 @@
+import { createHmac } from "node:crypto";
+import { describe, expect, it, vi } from "vitest";
+import {
+  verifyMetaChallenge,
+  verifyMetaWebhook,
+  verifyMetaWebhookSignature,
+} from "../../apps/app/src/lib/whatsapp/meta-webhook.ts";
+
+const APP_SECRET = "synthetic-meta-app-secret-task5";
+const VERIFY_TOKEN = "synthetic-meta-verify-token-task5";
+
+function sign(raw: Uint8Array): string {
+  return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
+}
+
+function webhookInput(raw: Uint8Array, signatureHeader: string | undefined = sign(raw)) {
+  return {
+    raw,
+    signatureHeader,
+    appSecret: APP_SECRET,
+    connectionId: "connection_synthetic_meta",
+    businessAccountId: "100000000000001",
+    phoneNumberId: "200000000000002",
+    correlationId: "correlation_synthetic_meta",
+    verifiedAt: new Date("2026-08-13T23:00:00.000Z"),
+  } as const;
+}
+
+describe("Meta webhook verification", () => {
+  it("returns only the bounded challenge for exact subscribe mode and token", () => {
+    const query = new URLSearchParams({
+      "hub.mode": "subscribe",
+      "hub.verify_token": VERIFY_TOKEN,
+      "hub.challenge": "123456789",
+    });
+
+    expect(verifyMetaChallenge(query, VERIFY_TOKEN)).toEqual({
+      accepted: true,
+      challenge: "123456789",
+    });
+  });
+
+  it.each([
+    ["wrong mode", { "hub.mode": "SUBSCRIBE", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1" }],
+    ["wrong token", { "hub.mode": "subscribe", "hub.verify_token": "PRIVATE-TOKEN", "hub.challenge": "1" }],
+    ["empty challenge", { "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "" }],
+    ["control character", { "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1\n2" }],
+    ["oversized challenge", { "hub.mode": "subscribe", "hub.verify_token": VERIFY_TOKEN, "hub.challenge": "1".repeat(513) }],
+  ])("rejects %s without reflecting query values", (_label, values) => {
+    const result = verifyMetaChallenge(new URLSearchParams(values), VERIFY_TOKEN);
+
+    expect(result).toEqual({ accepted: false, reason: "verification_rejected" });
+    expect(JSON.stringify(result)).not.toContain("PRIVATE");
+  });
+
+  it("rejects duplicate verification fields as ambiguous", () => {
+    const query = new URLSearchParams();
+    query.append("hub.mode", "subscribe");
+    query.append("hub.mode", "subscribe");
+    query.append("hub.verify_token", VERIFY_TOKEN);
+    query.append("hub.challenge", "1234");
+
+    expect(verifyMetaChallenge(query, VERIFY_TOKEN)).toEqual({
+      accepted: false,
+      reason: "verification_rejected",
+    });
+  });
+
+  it("verifies lowercase sha256 HMAC over untouched raw bytes", () => {
+    const raw = new TextEncoder().encode('{"message":"á","escaped":"\\u00e1"}');
+    const reencoded = new TextEncoder().encode('{"message":"á","escaped":"á"}');
+
+    expect(verifyMetaWebhookSignature(raw, sign(raw), APP_SECRET)).toBe(true);
+    expect(verifyMetaWebhookSignature(reencoded, sign(raw), APP_SECRET)).toBe(false);
+  });
+
+  it.each([
+    undefined,
+    "",
+    "sha1=0123456789abcdef",
+    `SHA256=${"a".repeat(64)}`,
+    `sha256=${"A".repeat(64)}`,
+    "sha256=abc",
+    `sha256=${"a".repeat(66)}`,
+    `sha256=${"g".repeat(64)}`,
+  ])("rejects malformed signatures", (signatureHeader) => {
+    const raw = new TextEncoder().encode('{"safe":true}');
+    expect(verifyMetaWebhookSignature(raw, signatureHeader, APP_SECRET)).toBe(false);
+  });
+
+  it("verifies before parse and returns an opaque context without raw or credentials", () => {
+    const marker = "PRIVATE-INVALID-JSON";
+    const raw = new TextEncoder().encode(`{${marker}`);
+    const result = verifyMetaWebhook(webhookInput(raw));
+
+    expect(result.status).toBe("verified");
+    expect(JSON.stringify(result)).not.toContain(marker);
+    expect(JSON.stringify(result)).not.toContain(APP_SECRET);
+    if (result.status === "verified") {
+      expect(result.context).toEqual({ kind: "verified_meta_webhook" });
+      expect(Object.isFrozen(result.context)).toBe(true);
+      expect(JSON.stringify(result.context)).not.toContain("100000000000001");
+      expect(JSON.stringify(result.context)).not.toContain("200000000000002");
+    }
+  });
+
+  it("returns one minimized invalid-signature result without parsing, logging, or reflecting content", () => {
+    const marker = "PRIVATE-INVALID-SIGNATURE-BODY";
+    const raw = new TextEncoder().encode(`{${marker}`);
+    const logSpies = [
+      vi.spyOn(console, "log").mockImplementation(() => undefined),
+      vi.spyOn(console, "warn").mockImplementation(() => undefined),
+      vi.spyOn(console, "error").mockImplementation(() => undefined),
+    ];
+    try {
+      const result = verifyMetaWebhook(webhookInput(raw, `sha256=${"0".repeat(64)}`));
+      expect(result).toEqual({ status: "rejected", reason: "signature_rejected" });
+      expect(JSON.stringify(result)).not.toContain(marker);
+      expect(JSON.stringify(result)).not.toContain(APP_SECRET);
+      expect(logSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
+    } finally {
+      for (const spy of logSpies) spy.mockRestore();
+    }
+  });
+
+  it("fails closed on malformed verification metadata without echoing it", () => {
+    const raw = new TextEncoder().encode('{"safe":true}');
+    const result = verifyMetaWebhook({
+      ...webhookInput(raw),
+      connectionId: "../PRIVATE-CONNECTION",
+    });
+
+    expect(result).toEqual({ status: "rejected", reason: "verification_rejected" });
+    expect(JSON.stringify(result)).not.toContain("PRIVATE");
+  });
+});
```
