import type { MetaCredentialResolver, MetaTemplateConnectionAuthority } from "./credentials.ts";
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
  type ProviderReconciliationResult,
  type ProviderTemplateReconciliationQuery,
  type ProviderTemplateReconciliationResult,
  type UnsupportedVerifiedEnvelope,
  type VerifiedWebhookContext,
  type WhatsAppProviderAdapter,
} from "./meta-contracts.ts";
import {
  type ResolvedVerifiedWebhookContext,
  resolveVerifiedMetaWebhookContext,
} from "./meta-webhook.ts";

type JsonRecord = Record<string, unknown>;

export type MetaCloudAdapterOptions = {
  readonly credentials: MetaCredentialResolver;
  readonly fetch: typeof fetch;
  readonly capabilityObservedAt: Date;
  readonly maxNormalizedPayloadBytes: number;
  readonly maxProviderResponseBytes: number;
};

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const EXTERNAL_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,255}$/u;
const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
const ENDPOINT = /^\+[1-9][0-9]{7,14}$/u;
const GRAPH_VERSION = /^v[1-9][0-9]*\.[0-9]+$/u;
const MIME_TYPE = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,63}$/u;
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
const MAX_TEMPLATE_AUTHORITY_LIFETIME_MS = 24 * 60 * 60 * 1_000;
// These statuses prove the provider rejected the request before accepting a message. Timeouts,
// throttling, conflict, redirects, informational responses and server failures remain ambiguous.
const PRE_ACCEPTANCE_REJECTION_STATUSES = new Set([
  400, 401, 403, 404, 405, 406, 410, 411, 413, 414, 415, 422,
]);

class DuplicateJsonKeyError extends Error {}

class BoundedJsonParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): unknown {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.index !== this.source.length) throw new SyntaxError("trailing JSON input");
    return value;
  }

  private parseValue(depth: number): unknown {
    if (depth > MAX_JSON_DEPTH) throw new SyntaxError("JSON nesting limit exceeded");
    this.skipWhitespace();
    const current = this.source[this.index];
    if (current === "{") return this.parseObject(depth + 1);
    if (current === "[") return this.parseArray(depth + 1);
    if (current === '"') return this.parseString();
    if (this.source.startsWith("true", this.index)) {
      this.index += 4;
      return true;
    }
    if (this.source.startsWith("false", this.index)) {
      this.index += 5;
      return false;
    }
    if (this.source.startsWith("null", this.index)) {
      this.index += 4;
      return null;
    }
    return this.parseNumber();
  }

  private parseObject(depth: number): JsonRecord {
    this.index += 1;
    const output = Object.create(null) as JsonRecord;
    const keys = new Set<string>();
    this.skipWhitespace();
    if (this.source[this.index] === "}") {
      this.index += 1;
      return output;
    }
    while (true) {
      this.skipWhitespace();
      if (this.source[this.index] !== '"') throw new SyntaxError("object key expected");
      const key = this.parseString();
      if (keys.has(key)) throw new DuplicateJsonKeyError();
      keys.add(key);
      if (keys.size > MAX_JSON_COLLECTION_ENTRIES) throw new SyntaxError("object limit exceeded");
      this.skipWhitespace();
      if (this.source[this.index] !== ":") throw new SyntaxError("object colon expected");
      this.index += 1;
      output[key] = this.parseValue(depth);
      this.skipWhitespace();
      const delimiter = this.source[this.index];
      if (delimiter === "}") {
        this.index += 1;
        return output;
      }
      if (delimiter !== ",") throw new SyntaxError("object delimiter expected");
      this.index += 1;
    }
  }

  private parseArray(depth: number): unknown[] {
    this.index += 1;
    const output: unknown[] = [];
    this.skipWhitespace();
    if (this.source[this.index] === "]") {
      this.index += 1;
      return output;
    }
    while (true) {
      if (output.length >= MAX_JSON_COLLECTION_ENTRIES)
        throw new SyntaxError("array limit exceeded");
      output.push(this.parseValue(depth));
      this.skipWhitespace();
      const delimiter = this.source[this.index];
      if (delimiter === "]") {
        this.index += 1;
        return output;
      }
      if (delimiter !== ",") throw new SyntaxError("array delimiter expected");
      this.index += 1;
    }
  }

  private parseString(): string {
    const start = this.index;
    this.index += 1;
    let codeUnits = 0;
    while (this.index < this.source.length) {
      const character = this.source[this.index];
      if (character === '"') {
        this.index += 1;
        const parsed = JSON.parse(this.source.slice(start, this.index)) as unknown;
        if (typeof parsed !== "string") throw new SyntaxError("JSON string expected");
        return parsed;
      }
      if (character === "\\") {
        this.index += 1;
        const escaped = this.source[this.index];
        if (escaped === "u") {
          const digits = this.source.slice(this.index + 1, this.index + 5);
          if (!/^[a-fA-F0-9]{4}$/u.test(digits)) throw new SyntaxError("invalid unicode escape");
          this.index += 5;
        } else if (escaped && '"\\/bfnrt'.includes(escaped)) {
          this.index += 1;
        } else {
          throw new SyntaxError("invalid string escape");
        }
      } else {
        if (!character || character.charCodeAt(0) < 0x20) throw new SyntaxError("invalid string");
        this.index += 1;
      }
      codeUnits += 1;
      if (codeUnits > MAX_JSON_STRING_CODE_UNITS) throw new SyntaxError("string limit exceeded");
    }
    throw new SyntaxError("unterminated string");
  }

  private parseNumber(): number {
    const match = this.source
      .slice(this.index)
      .match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u);
    if (!match) throw new SyntaxError("JSON value expected");
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new SyntaxError("non-finite JSON number");
    return value;
  }

  private skipWhitespace(): void {
    while (/\s/u.test(this.source[this.index] ?? "")) this.index += 1;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: JsonRecord, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function hasExactOwnKeys(value: JsonRecord, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

function hasUnsafeControl(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) {
      return true;
    }
  }
  return false;
}

function hasWhitespaceOrControl(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f) return true;
  }
  return false;
}

function isString(value: unknown, minimum: number, maximum: number): value is string {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    value.length <= maximum &&
    !hasUnsafeControl(value)
  );
}

function plausibleUnixSeconds(value: number, verifiedAt: Date): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= MIN_PROVIDER_UNIX_SECONDS &&
    value <= Math.floor(verifiedAt.valueOf() / 1_000) + MAX_PROVIDER_FUTURE_SKEW_SECONDS
  );
}

function parseTimestamp(value: unknown, verifiedAt: Date): Date | null {
  if (typeof value !== "string" || !/^[1-9][0-9]{9}$/u.test(value)) return null;
  const seconds = Number(value);
  if (!plausibleUnixSeconds(seconds, verifiedAt)) return null;
  const date = new Date(seconds * 1_000);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseNumericTimestamp(value: unknown, verifiedAt: Date): Date | null {
  if (typeof value !== "number" || !plausibleUnixSeconds(value, verifiedAt)) return null;
  const date = new Date(value * 1_000);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseProviderJson(
  raw: Uint8Array,
): { status: "parsed"; value: unknown } | { status: "duplicate" | "malformed" } {
  try {
    const source = new TextDecoder("utf-8", { fatal: true }).decode(raw);
    return { status: "parsed", value: new BoundedJsonParser(source).parse() };
  } catch (error) {
    return { status: error instanceof DuplicateJsonKeyError ? "duplicate" : "malformed" };
  }
}

function unverified(): UnsupportedVerifiedEnvelope {
  return Object.freeze({
    kind: "unsupported_verified",
    connectionId: "unverified",
    reason: "unverified_context",
    receivedAt: new Date(0),
    correlationId: "unverified",
  });
}

function unsupported(
  context: ResolvedVerifiedWebhookContext,
  reason: UnsupportedVerifiedEnvelope["reason"],
): UnsupportedVerifiedEnvelope {
  return Object.freeze({
    kind: "unsupported_verified",
    connectionId: context.connectionId,
    reason,
    receivedAt: new Date(context.verifiedAt),
    correlationId: context.correlationId,
  });
}

type MessageRoot = {
  change: JsonRecord;
  value: JsonRecord;
  entryTime: unknown;
};

function messageRoot(
  payload: unknown,
  context: ResolvedVerifiedWebhookContext,
): MessageRoot | UnsupportedVerifiedEnvelope {
  if (!isRecord(payload) || !hasOnlyKeys(payload, ["object", "entry"])) {
    return unsupported(context, "unsupported_event");
  }
  if (payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry)) {
    return unsupported(context, "unsupported_event");
  }
  if (payload.entry.length !== 1) return unsupported(context, "ambiguous_payload");
  const entry = payload.entry[0];
  if (!isRecord(entry) || !hasOnlyKeys(entry, ["id", "time", "changes"])) {
    return unsupported(context, "unsupported_event");
  }
  if (entry.id !== context.businessAccountId) return unsupported(context, "connection_mismatch");
  if (!Array.isArray(entry.changes) || entry.changes.length !== 1) {
    return unsupported(context, "ambiguous_payload");
  }
  const change = entry.changes[0];
  if (!isRecord(change) || !hasOnlyKeys(change, ["field", "value"]) || !isRecord(change.value)) {
    return unsupported(context, "malformed_payload");
  }
  return { change, value: change.value, entryTime: entry.time };
}

function normalizeMessage(
  value: JsonRecord,
  context: ResolvedVerifiedWebhookContext,
): CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope {
  if (
    !hasOnlyKeys(value, [
      "messaging_product",
      "metadata",
      "contacts",
      "messages",
      "statuses",
      "errors",
    ]) ||
    value.messaging_product !== "whatsapp" ||
    !isRecord(value.metadata) ||
    !hasOnlyKeys(value.metadata, ["display_phone_number", "phone_number_id"]) ||
    !PROVIDER_IDENTIFIER.test(String(value.metadata.phone_number_id ?? ""))
  ) {
    return unsupported(context, "malformed_payload");
  }
  if (value.metadata.phone_number_id !== context.phoneNumberId) {
    return unsupported(context, "connection_mismatch");
  }
  const hasMessages = Array.isArray(value.messages);
  const hasStatuses = Array.isArray(value.statuses);
  if (hasMessages === hasStatuses) return unsupported(context, "ambiguous_payload");

  if (hasStatuses) {
    if ((value.statuses as unknown[]).length !== 1)
      return unsupported(context, "ambiguous_payload");
    const status = (value.statuses as unknown[])[0];
    if (
      !isRecord(status) ||
      !hasOnlyKeys(status, [
        "id",
        "status",
        "timestamp",
        "recipient_id",
        "conversation",
        "pricing",
        "errors",
      ]) ||
      !EXTERNAL_IDENTIFIER.test(String(status.id ?? "")) ||
      !["sent", "delivered", "read", "failed"].includes(String(status.status))
    ) {
      return unsupported(context, "malformed_payload");
    }
    const occurredAt = parseTimestamp(status.timestamp, context.verifiedAt);
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
      correlationId: context.correlationId,
    });
  }

  if ((value.messages as unknown[]).length !== 1) return unsupported(context, "ambiguous_payload");
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
  const occurredAt = parseTimestamp(message.timestamp, context.verifiedAt);
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

  if (message.type === "text") {
    if (
      !hasOnlyKeys(message, [...commonKeys, "text"]) ||
      !isRecord(message.text) ||
      !hasOnlyKeys(message.text, ["body"]) ||
      !isString(message.text.body, 1, 4_096)
    ) {
      return unsupported(context, "malformed_payload");
    }
    return Object.freeze({ ...base, kind: "text_message", text: message.text.body });
  }

  if (message.type === "button") {
    if (
      !hasOnlyKeys(message, [...commonKeys, "button"]) ||
      !isRecord(message.button) ||
      !hasOnlyKeys(message.button, ["payload", "text"]) ||
      !isString(message.button.payload, 1, 256) ||
      !isString(message.button.text, 1, 256)
    ) {
      return unsupported(context, "malformed_payload");
    }
    return Object.freeze({
      ...base,
      kind: "interactive_reply",
      replyKind: "button",
      replyId: message.button.payload,
      replyTitle: message.button.text,
    });
  }

  if (message.type === "interactive") {
    if (!hasOnlyKeys(message, [...commonKeys, "interactive"]) || !isRecord(message.interactive)) {
      return unsupported(context, "malformed_payload");
    }
    const interactive = message.interactive;
    if (interactive.type === "button_reply" && isRecord(interactive.button_reply)) {
      if (
        !hasOnlyKeys(interactive, ["type", "button_reply"]) ||
        !hasOnlyKeys(interactive.button_reply, ["id", "title"]) ||
        !isString(interactive.button_reply.id, 1, 256) ||
        !isString(interactive.button_reply.title, 1, 256)
      ) {
        return unsupported(context, "malformed_payload");
      }
      return Object.freeze({
        ...base,
        kind: "interactive_reply",
        replyKind: "button",
        replyId: interactive.button_reply.id,
        replyTitle: interactive.button_reply.title,
      });
    }
    if (interactive.type === "list_reply" && isRecord(interactive.list_reply)) {
      if (
        !hasOnlyKeys(interactive, ["type", "list_reply"]) ||
        !hasOnlyKeys(interactive.list_reply, ["id", "title", "description"]) ||
        !isString(interactive.list_reply.id, 1, 256) ||
        !isString(interactive.list_reply.title, 1, 256) ||
        (interactive.list_reply.description !== undefined &&
          !isString(interactive.list_reply.description, 0, 256))
      ) {
        return unsupported(context, "malformed_payload");
      }
      return Object.freeze({
        ...base,
        kind: "interactive_reply",
        replyKind: "list",
        replyId: interactive.list_reply.id,
        replyTitle: interactive.list_reply.title,
      });
    }
    return unsupported(context, "unsupported_event");
  }

  if (["audio", "document", "image", "sticker", "video"].includes(String(message.type))) {
    const kind = message.type as "audio" | "document" | "image" | "sticker" | "video";
    if (!hasOnlyKeys(message, [...commonKeys, kind]) || !isRecord(message[kind])) {
      return unsupported(context, "malformed_payload");
    }
    const media = message[kind] as JsonRecord;
    if (
      !hasOnlyKeys(media, [
        "id",
        "mime_type",
        "sha256",
        "filename",
        "caption",
        "voice",
        "animated",
      ]) ||
      !EXTERNAL_IDENTIFIER.test(String(media.id ?? "")) ||
      (media.mime_type !== undefined &&
        (typeof media.mime_type !== "string" || !MIME_TYPE.test(media.mime_type))) ||
      (media.sha256 !== undefined &&
        (typeof media.sha256 !== "string" || !CHECKSUM.test(media.sha256))) ||
      (media.filename !== undefined && !isString(media.filename, 0, 512)) ||
      (media.caption !== undefined && !isString(media.caption, 0, 4_096)) ||
      (media.voice !== undefined && typeof media.voice !== "boolean") ||
      (media.animated !== undefined && typeof media.animated !== "boolean")
    ) {
      return unsupported(context, "malformed_payload");
    }
    return Object.freeze({
      ...base,
      kind: "media_reference",
      media: Object.freeze({
        externalReference: String(media.id),
        declaredKind: kind,
        ...(typeof media.mime_type === "string" ? { mimeType: media.mime_type } : {}),
        ...(typeof media.sha256 === "string" ? { checksum: media.sha256 } : {}),
      }),
    });
  }

  return unsupported(context, "unsupported_event");
}

type SupportedTemplateStatus = "disabled" | "paused" | "provider_approved" | "provider_rejected";
type SupportedTemplateCategory = "authentication" | "marketing" | "utility";

const STATUS_BY_TEMPLATE_EVENT = new Map<string, SupportedTemplateStatus>([
  ["APPROVED", "provider_approved"],
  ["DISABLED", "disabled"],
  ["PAUSED", "paused"],
  ["REJECTED", "provider_rejected"],
]);
const CATEGORY_BY_PROVIDER = new Map<string, SupportedTemplateCategory>([
  ["AUTHENTICATION", "authentication"],
  ["MARKETING", "marketing"],
  ["UTILITY", "utility"],
]);

function validTemplateConnectionAuthority(
  authority: unknown,
  context: ResolvedVerifiedWebhookContext,
): authority is MetaTemplateConnectionAuthority {
  if (
    !isRecord(authority) ||
    !hasExactOwnKeys(authority, [
      "connectionId",
      "businessAccountId",
      "authorityReceiptId",
      "authorityVersion",
      "correlationId",
      "issuedAt",
      "expiresAt",
      "templateOwningConnectionCount",
    ]) ||
    authority.connectionId !== context.connectionId ||
    authority.businessAccountId !== context.businessAccountId ||
    authority.correlationId !== context.correlationId ||
    typeof authority.authorityReceiptId !== "string" ||
    !IDENTIFIER.test(authority.authorityReceiptId) ||
    !Number.isSafeInteger(authority.authorityVersion) ||
    (authority.authorityVersion as number) < 1 ||
    (authority.authorityVersion as number) > 1_000_000 ||
    authority.templateOwningConnectionCount !== 1 ||
    !(authority.issuedAt instanceof Date) ||
    !(authority.expiresAt instanceof Date)
  ) {
    return false;
  }
  const issuedAt = authority.issuedAt.valueOf();
  const expiresAt = authority.expiresAt.valueOf();
  const verifiedAt = context.verifiedAt.valueOf();
  return (
    Number.isFinite(issuedAt) &&
    Number.isFinite(expiresAt) &&
    issuedAt <= verifiedAt &&
    verifiedAt <= expiresAt &&
    expiresAt - issuedAt <= MAX_TEMPLATE_AUTHORITY_LIFETIME_MS
  );
}

async function normalizeTemplate(
  value: JsonRecord,
  entryTime: unknown,
  context: ResolvedVerifiedWebhookContext,
  credentials: MetaCredentialResolver,
): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
  const status =
    typeof value.event === "string" ? STATUS_BY_TEMPLATE_EVENT.get(value.event) : undefined;
  const category =
    typeof value.message_template_category === "string"
      ? CATEGORY_BY_PROVIDER.get(value.message_template_category)
      : undefined;

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
    status === undefined ||
    !EXTERNAL_IDENTIFIER.test(String(value.message_template_id ?? "")) ||
    typeof value.message_template_name !== "string" ||
    !TEMPLATE_NAME.test(value.message_template_name) ||
    typeof value.message_template_language !== "string" ||
    !/^(?:en|es)_[A-Z]{2}$/u.test(value.message_template_language) ||
    category === undefined ||
    !Array.isArray(value.message_template_components) ||
    !/^[1-9][0-9]{0,8}$/u.test(String(value.message_template_version ?? "")) ||
    (value.reason !== undefined && value.reason !== null && !isString(value.reason, 0, 1_024))
  ) {
    return unsupported(context, "template_manual_review");
  }

  const providerTimestamp = parseNumericTimestamp(entryTime, context.verifiedAt);
  const providerVersion = String(value.message_template_version);
  const version = Number(providerVersion);
  const components: { type: "body" | "footer" | "header"; format?: "text"; text: string }[] = [];
  const seenTypes = new Set<string>();
  for (const candidate of value.message_template_components) {
    if (
      !isRecord(candidate) ||
      typeof candidate.type !== "string" ||
      seenTypes.has(candidate.type)
    ) {
      return unsupported(context, "template_manual_review");
    }
    seenTypes.add(candidate.type);
    if (
      candidate.type === "HEADER" &&
      hasOnlyKeys(candidate, ["type", "format", "text"]) &&
      candidate.format === "TEXT" &&
      isString(candidate.text, 1, 1_024)
    ) {
      components.push({ type: "header", format: "text", text: candidate.text });
      continue;
    }
    if (
      (candidate.type === "BODY" || candidate.type === "FOOTER") &&
      hasOnlyKeys(candidate, ["type", "text"]) &&
      isString(candidate.text, 1, 4_096)
    ) {
      components.push({
        type: candidate.type === "BODY" ? "body" : "footer",
        text: candidate.text,
      });
      continue;
    }
    return unsupported(context, "template_manual_review");
  }
  if (!providerTimestamp || !Number.isSafeInteger(version) || !seenTypes.has("BODY")) {
    return unsupported(context, "template_manual_review");
  }

  let authority: unknown;
  try {
    authority = await credentials.resolveTemplateConnectionAuthority({
      connectionId: context.connectionId,
      businessAccountId: context.businessAccountId,
      correlationId: context.correlationId,
      verifiedAt: new Date(context.verifiedAt),
    });
  } catch {
    return unsupported(context, "template_manual_review");
  }
  if (!validTemplateConnectionAuthority(authority, context)) {
    return unsupported(context, "template_manual_review");
  }

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
    projection: Object.freeze({
      templateId: templateKey,
      locale,
      state: status,
      version,
      updatedAt: new Date(providerTimestamp),
      providerReference,
      templateKey,
      category,
      components: frozenComponents,
      status,
      providerVersion,
      providerTimestamp: new Date(providerTimestamp),
    }),
  });
}

function isUnsupportedRoot(
  root: MessageRoot | UnsupportedVerifiedEnvelope,
): root is UnsupportedVerifiedEnvelope {
  return Object.hasOwn(root, "kind");
}

async function normalizePayload(
  payload: unknown,
  context: ResolvedVerifiedWebhookContext,
  credentials: MetaCredentialResolver,
): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
  const root = messageRoot(payload, context);
  if (isUnsupportedRoot(root)) return root;
  if (root.change.field === "messages") return normalizeMessage(root.value, context);
  if (root.change.field === "message_template_status_update") {
    return normalizeTemplate(root.value, root.entryTime, context, credentials);
  }
  return unsupported(context, "unsupported_event");
}

function validTemplateContent(content: unknown): boolean {
  if (
    !isRecord(content) ||
    !hasOnlyKeys(content, ["kind", "providerTemplateName", "languageCode", "components"]) ||
    content.kind !== "template" ||
    !TEMPLATE_NAME.test(String(content.providerTemplateName ?? "")) ||
    !LANGUAGE_CODE.test(String(content.languageCode ?? "")) ||
    !Array.isArray(content.components) ||
    content.components.length === 0 ||
    content.components.length > 4
  ) {
    return false;
  }
  return content.components.every((component) => {
    if (!isRecord(component)) return false;
    if (component.type === "header" || component.type === "body") {
      return (
        hasOnlyKeys(component, ["type", "parameters"]) &&
        Array.isArray(component.parameters) &&
        component.parameters.length <= 10 &&
        component.parameters.every(
          (parameter) =>
            isRecord(parameter) &&
            hasOnlyKeys(parameter, ["type", "text"]) &&
            parameter.type === "text" &&
            isString(parameter.text, 1, 1_024),
        )
      );
    }
    if (
      component.type !== "button" ||
      !hasOnlyKeys(component, ["type", "subType", "index", "parameters"]) ||
      component.subType !== "quick_reply" ||
      !Number.isInteger(component.index) ||
      (component.index as number) < 0 ||
      (component.index as number) > 9 ||
      !Array.isArray(component.parameters) ||
      component.parameters.length !== 1
    ) {
      return false;
    }
    const parameter = component.parameters[0];
    return (
      isRecord(parameter) &&
      hasOnlyKeys(parameter, ["type", "payload"]) &&
      parameter.type === "payload" &&
      isString(parameter.payload, 1, 256)
    );
  });
}

function validDispatchCommand(command: unknown): command is ProviderDispatchCommand {
  if (
    !isRecord(command) ||
    !hasOnlyKeys(command, [
      "connectionId",
      "recipientEndpoint",
      "correlationId",
      "idempotencyKey",
      "content",
    ]) ||
    !IDENTIFIER.test(String(command.connectionId ?? "")) ||
    !ENDPOINT.test(String(command.recipientEndpoint ?? "")) ||
    !IDENTIFIER.test(String(command.correlationId ?? "")) ||
    !IDENTIFIER.test(String(command.idempotencyKey ?? "")) ||
    !isRecord(command.content)
  ) {
    return false;
  }
  if (command.content.kind === "text") {
    return (
      hasOnlyKeys(command.content, ["kind", "body"]) && isString(command.content.body, 1, 4_096)
    );
  }
  return validTemplateContent(command.content);
}

function validDispatchSecret(value: unknown): value is {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
} {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["accessToken", "phoneNumberId", "graphApiVersion"]) &&
    typeof value.accessToken === "string" &&
    value.accessToken.length >= 16 &&
    value.accessToken.length <= 4_096 &&
    !hasWhitespaceOrControl(value.accessToken) &&
    typeof value.phoneNumberId === "string" &&
    PROVIDER_IDENTIFIER.test(value.phoneNumberId) &&
    typeof value.graphApiVersion === "string" &&
    GRAPH_VERSION.test(value.graphApiVersion)
  );
}

function dispatchBody(command: ProviderDispatchCommand): JsonRecord {
  const base = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: command.recipientEndpoint.slice(1),
  } as const;
  if (command.content.kind === "text") {
    return { ...base, type: "text", text: { preview_url: false, body: command.content.body } };
  }
  return {
    ...base,
    type: "template",
    template: {
      name: command.content.providerTemplateName,
      language: { code: command.content.languageCode },
      components: command.content.components.map((component) => ({
        type: component.type,
        ...(component.type === "button"
          ? { sub_type: component.subType, index: String(component.index) }
          : {}),
        parameters:
          component.type === "button"
            ? component.parameters.map((parameter) => ({
                type: "payload",
                payload: parameter.payload,
              }))
            : component.parameters.map((parameter) => ({ type: "text", text: parameter.text })),
      })),
    },
  };
}

async function readBoundedResponse(
  response: Response,
  maximumBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array | null> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      if (signal.aborted) {
        await reader.cancel();
        return null;
      }
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cancellation is best-effort; response details remain unread and are never logged.
  }
}

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
  ) {
    return null;
  }
  return String(message.id);
}

const unsupportedReconciliation = Object.freeze({
  status: "unsupported",
  reason: "activation_review_required",
} as const);

export function createMetaCloudAdapter(options: MetaCloudAdapterOptions): WhatsAppProviderAdapter {
  if (
    typeof options.fetch !== "function" ||
    !(options.capabilityObservedAt instanceof Date) ||
    Number.isNaN(options.capabilityObservedAt.valueOf()) ||
    !Number.isSafeInteger(options.maxNormalizedPayloadBytes) ||
    options.maxNormalizedPayloadBytes < 256 ||
    options.maxNormalizedPayloadBytes > 1_048_576 ||
    !Number.isSafeInteger(options.maxProviderResponseBytes) ||
    options.maxProviderResponseBytes < 256 ||
    options.maxProviderResponseBytes > 262_144
  ) {
    throw new TypeError("Invalid Meta adapter options");
  }
  const observedAt = new Date(options.capabilityObservedAt);

  return Object.freeze({
    capabilities(): ProviderCapabilitySnapshot {
      return Object.freeze({
        requestIdempotency: false,
        stableReference: false,
        messageLookup: false,
        statusReconciliation: false,
        mediaReferences: true,
        templateProjection: true,
        get observedAt(): Date {
          return new Date(observedAt);
        },
        supportedInboundKinds: Object.freeze([...META_SUPPORTED_INBOUND_KINDS]),
        supportedStatusKinds: Object.freeze([...META_SUPPORTED_STATUS_KINDS]),
      });
    },

    async normalizeVerifiedEvent(
      raw: Uint8Array,
      context: VerifiedWebhookContext,
    ): Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope> {
      if (!(raw instanceof Uint8Array)) return unverified();
      const rawSnapshot = Uint8Array.from(raw);
      const resolvedContext = resolveVerifiedMetaWebhookContext(rawSnapshot, context);
      if (!resolvedContext) return unverified();
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
      return normalizePayload(parsed.value, resolvedContext, options.credentials);
    },

    async dispatch(
      command: ProviderDispatchCommand,
      signal: AbortSignal,
    ): Promise<ProviderDispatchResult> {
      if (!validDispatchCommand(command)) {
        return { status: "confirmed_not_sent", reason: "invalid_command" };
      }
      if (signal.aborted) {
        return { status: "confirmed_not_sent", reason: "aborted_before_dispatch" };
      }

      let secret: unknown;
      try {
        secret = await options.credentials.resolveDispatchSecret(command.connectionId);
      } catch {
        return { status: "confirmed_not_sent", reason: "credentials_unavailable" };
      }
      if (!validDispatchSecret(secret)) {
        return { status: "confirmed_not_sent", reason: "invalid_configuration" };
      }
      if (signal.aborted) {
        return { status: "confirmed_not_sent", reason: "aborted_before_dispatch" };
      }

      const url = `https://graph.facebook.com/${secret.graphApiVersion}/${secret.phoneNumberId}/messages`;
      let response: Response;
      try {
        response = await options.fetch(url, {
          method: "POST",
          headers: {
            authorization: `Bearer ${secret.accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(dispatchBody(command)),
          signal,
          redirect: "error",
        });
      } catch {
        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
      }

      const status = response.status;
      if (!Number.isInteger(status) || status < 200 || status > 299) {
        await cancelResponseBody(response);
        if (!PRE_ACCEPTANCE_REJECTION_STATUSES.has(status)) {
          return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
        }
        return {
          status: "confirmed_not_sent",
          reason: "provider_rejected",
          statusCode: status,
        };
      }
      const rawResponse = await readBoundedResponse(
        response,
        options.maxProviderResponseBytes,
        signal,
      );
      if (!rawResponse) return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
      const externalMessageReference = acceptedReference(rawResponse);
      if (!externalMessageReference) {
        return { status: "dispatch_unknown", reason: "acceptance_ambiguous" };
      }
      return { status: "accepted", externalMessageReference };
    },

    async reconcile(
      _attempt: ProviderReconciliationQuery,
      _signal: AbortSignal,
    ): Promise<ProviderReconciliationResult> {
      return unsupportedReconciliation;
    },

    async reconcileMessages(
      _query: ProviderMessageReconciliationQuery,
      _signal: AbortSignal,
    ): Promise<ProviderMessageReconciliationResult> {
      return unsupportedReconciliation;
    },

    async reconcileTemplates(
      _query: ProviderTemplateReconciliationQuery,
      _signal: AbortSignal,
    ): Promise<ProviderTemplateReconciliationResult> {
      return unsupportedReconciliation;
    },
  });
}
