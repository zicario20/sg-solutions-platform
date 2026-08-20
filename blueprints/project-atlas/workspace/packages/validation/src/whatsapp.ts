import { inspectProhibitedChatContent } from "./public-chat.ts";

export const WHATSAPP_TEXT_MAX_CHARACTERS = 2_000;
export const WHATSAPP_MEDIA_MAX_BYTES = 25 * 1024 * 1024;

export type WhatsAppLocale = "es" | "en";
export type ChannelCopyKey =
  | "automated_identity"
  | "sensitive_data_refusal"
  | "unsupported_media"
  | "portal_fallback"
  | "provider_unavailable"
  | "human_unavailable"
  | "opt_out_receipt"
  | "reconsent_guidance";
export type ChannelCopyCatalog = Readonly<
  Partial<Record<ChannelCopyKey, Readonly<Partial<Record<WhatsAppLocale, string>>>>>
>;

export type WhatsAppMediaMetadata = {
  mediaReferenceId: string;
  contentType: string;
  byteLength: number;
  checksum: string;
};

export type WhatsAppInboundInput = {
  eventId: string;
  bindingId?: string;
  conversationId?: string;
  messageId?: string;
  locale?: WhatsAppLocale;
  receivedAt?: Date;
  text?: string;
  interactiveReplyId?: string;
  media?: WhatsAppMediaMetadata;
};

export const EMPTY_CHANNEL_COPY_CATALOG: ChannelCopyCatalog = Object.freeze({});

const CANONICAL_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
const CONTENT_TYPE = /^[a-z]+\/[a-z0-9.+-]{1,127}$/i;
const CHECKSUM = /^[a-f0-9]{64}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const COPY_KEYS: readonly ChannelCopyKey[] = [
  "automated_identity",
  "sensitive_data_refusal",
  "unsupported_media",
  "portal_fallback",
  "provider_unavailable",
  "human_unavailable",
  "opt_out_receipt",
  "reconsent_guidance",
];

function invalidInput(): never {
  throw new Error("WHATSAPP_INPUT_INVALID");
}

function invalidText(): never {
  throw new Error("WHATSAPP_TEXT_REJECTED");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCanonicalId(value: unknown): string {
  if (typeof value !== "string" || !CANONICAL_ID.test(value)) invalidInput();
  return value;
}

function parseTimestamp(value: unknown): Date {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) invalidInput();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalidInput();
  return parsed;
}

function hasUnsafeControl(value: string): boolean {
  const controlView = value.normalize("NFKC");
  return [...controlView].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint === 0x061c ||
      codePoint === 0x200e ||
      codePoint === 0x200f ||
      (codePoint !== undefined &&
        ((codePoint >= 0 && codePoint <= 8) ||
          codePoint === 11 ||
          codePoint === 12 ||
          (codePoint >= 14 && codePoint <= 31) ||
          (codePoint >= 127 && codePoint <= 159) ||
          (codePoint >= 0x202a && codePoint <= 0x202e) ||
          (codePoint >= 0x2066 && codePoint <= 0x2069))));
  });
}

function parseMedia(value: unknown): WhatsAppMediaMetadata {
  if (!isRecord(value) || Object.keys(value).length !== 4) invalidInput();
  const { mediaReferenceId, contentType, byteLength, checksum } = value;
  if (
    typeof mediaReferenceId !== "string" ||
    !CANONICAL_ID.test(mediaReferenceId) ||
    typeof contentType !== "string" ||
    !CONTENT_TYPE.test(contentType) ||
    typeof byteLength !== "number" ||
    !Number.isSafeInteger(byteLength) ||
    byteLength < 1 ||
    byteLength > WHATSAPP_MEDIA_MAX_BYTES ||
    typeof checksum !== "string" ||
    !CHECKSUM.test(checksum)
  ) {
    invalidInput();
  }
  return { mediaReferenceId, contentType, byteLength, checksum };
}

export function parseWhatsAppText(input: unknown): string {
  if (typeof input !== "string" || hasUnsafeControl(input)) invalidText();
  try {
    const inspection = inspectProhibitedChatContent(input);
    if (!inspection.allowed || [...inspection.normalized].length > WHATSAPP_TEXT_MAX_CHARACTERS) {
      invalidText();
    }
    return inspection.normalized;
  } catch {
    invalidText();
  }
}

export function parseWhatsAppInboundInput(input: unknown): WhatsAppInboundInput {
  if (!isRecord(input)) invalidInput();
  const allowedKeys = new Set([
    "eventId",
    "bindingId",
    "conversationId",
    "messageId",
    "locale",
    "receivedAt",
    "text",
    "interactiveReplyId",
    "media",
  ]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) invalidInput();

  const result: WhatsAppInboundInput = { eventId: parseCanonicalId(input.eventId) };
  if (input.bindingId !== undefined) result.bindingId = parseCanonicalId(input.bindingId);
  if (input.conversationId !== undefined) result.conversationId = parseCanonicalId(input.conversationId);
  if (input.messageId !== undefined) result.messageId = parseCanonicalId(input.messageId);
  if (input.locale !== undefined) {
    if (input.locale !== "es" && input.locale !== "en") invalidInput();
    result.locale = input.locale;
  }
  if (input.receivedAt === undefined) invalidInput();
  result.receivedAt = parseTimestamp(input.receivedAt);
  if (input.text !== undefined) result.text = parseWhatsAppText(input.text);
  if (input.interactiveReplyId !== undefined) {
    result.interactiveReplyId = parseCanonicalId(input.interactiveReplyId);
  }
  if (input.media !== undefined) result.media = parseMedia(input.media);
  return result;
}

export function resolveChannelCopy(
  catalog: ChannelCopyCatalog,
  locale: WhatsAppLocale,
  key: ChannelCopyKey,
): { available: true; text: string } | { available: false; code: "copy_unavailable" } {
  if (!validateChannelCopyCatalog(catalog).valid) {
    return { available: false, code: "copy_unavailable" };
  }
  const text = catalog[key]?.[locale];
  return typeof text === "string" && text.trim().length > 0
    ? { available: true, text }
    : { available: false, code: "copy_unavailable" };
}

export function validateChannelCopyCatalog(
  catalog: ChannelCopyCatalog,
): { valid: true } | { valid: false; code: "copy_locale_missing" | "copy_invalid" } {
  for (const key of COPY_KEYS) {
    const localized = catalog[key];
    if (localized?.es === undefined || localized.en === undefined) {
      return { valid: false, code: "copy_locale_missing" };
    }
    if (
      typeof localized.es !== "string" ||
      typeof localized.en !== "string" ||
      !localized.es.trim() ||
      !localized.en.trim() ||
      localized.es.length > 500 ||
      localized.en.length > 500 ||
      hasUnsafeControl(localized.es) ||
      hasUnsafeControl(localized.en)
    ) {
      return { valid: false, code: "copy_invalid" };
    }
  }
  return { valid: true };
}
