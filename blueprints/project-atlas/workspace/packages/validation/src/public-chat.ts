import { z } from "zod";

export const CHAT_MESSAGE_MAX_CHARACTERS = 2_000;

export const chatLocaleSchema = z.enum(["es", "en"]);
export type ChatLocale = z.infer<typeof chatLocaleSchema>;

const idempotencyKeySchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/^[a-z][a-z0-9_-]+$/);
const expectedVersionSchema = z.number().int().positive().max(2_147_483_647);

const startConversationSchema = z
  .object({
    locale: chatLocaleSchema,
    noticeVersion: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9][a-z0-9._-]+$/),
    noticeAcknowledged: z.literal(true),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict();

const messageEnvelopeSchema = z
  .object({
    text: z.string(),
    idempotencyKey: idempotencyKeySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const handoffRequestSchema = z
  .object({
    reason: z.enum([
      "visitor_requested",
      "complaint",
      "safety",
      "policy_required",
      "assistant_unavailable",
    ]),
    idempotencyKey: idempotencyKeySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const closeConversationSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

const changeChatLocaleSchema = z
  .object({
    locale: chatLocaleSchema,
    idempotencyKey: idempotencyKeySchema,
    expectedVersion: expectedVersionSchema,
  })
  .strict();

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type AcceptMessageInput = {
  text: string;
  idempotencyKey: string;
  expectedVersion: number;
};
export type HandoffInput = z.infer<typeof handoffRequestSchema>;
export type CloseConversationInput = z.infer<typeof closeConversationSchema>;
export type ChangeChatLocaleInput = z.infer<typeof changeChatLocaleSchema>;

export type SensitiveReason =
  | "government_identifier"
  | "payment_card"
  | "bank_account"
  | "credential"
  | "markup";

export type ChatContentInspection =
  | { allowed: true; normalized: string }
  | { allowed: false; reason: SensitiveReason };

const GOVERNMENT_IDENTIFIER =
  /(?<!\p{N})\p{Nd}{3}[\p{Zs}\p{Pd}]?\p{Nd}{2}[\p{Zs}\p{Pd}]?\p{Nd}{4}(?!\p{N})/u;
const PAYMENT_CARD = /(?<!\p{Nd})(?:\p{Nd}[\p{Zs}\p{Pd}-]*?){13,19}(?!\p{Nd})/u;
const BANK_ACCOUNT =
  /\b(?:routing|aba|account|cuenta|ruta)\b[^\p{Nd}\n]{0,16}(?:\p{Nd}[\p{Zs}\p{Pd}-]?){6,17}(?!\p{Nd})/iu;
const CREDENTIAL =
  /(?:\b(?:api[ _-]?key|password|contrase(?:ñ|n)a|secret|token)\b\s*[:=]\s*\S{8,}|\bsk_[a-z0-9_-]{16,})/iu;
const MARKUP = /(?:<\/?[a-z][^>]{0,512}>|<!--|<!doctype\b|<\?xml\b)/iu;

function normalizePlainText(value: string): string {
  return value.replace(/\r\n?/gu, "\n").normalize("NFC").trim();
}

function hasProhibitedControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      ((codePoint >= 0 && codePoint <= 8) ||
        codePoint === 11 ||
        codePoint === 12 ||
        (codePoint >= 14 && codePoint <= 31) ||
        (codePoint >= 127 && codePoint <= 159))
    );
  });
}

function hasBidirectionalControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint === 0x061c ||
      codePoint === 0x200e ||
      codePoint === 0x200f ||
      (codePoint !== undefined && codePoint >= 0x202a && codePoint <= 0x202e) ||
      (codePoint !== undefined && codePoint >= 0x2066 && codePoint <= 0x2069)
    );
  });
}

function validatePlainText(value: string, maxCharacters = CHAT_MESSAGE_MAX_CHARACTERS): string {
  const normalized = normalizePlainText(value);

  if (!normalized) {
    throw new Error("CHAT_MESSAGE_TEXT is required");
  }
  if (hasProhibitedControlCharacter(normalized) || hasBidirectionalControlCharacter(normalized)) {
    throw new Error("CHAT_MESSAGE_TEXT contains prohibited control characters");
  }
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters < 1) {
    throw new Error("CHAT_MESSAGE_MAX_CHARACTERS must be a positive integer");
  }
  if ([...normalized].length > maxCharacters) {
    throw new Error(`CHAT_MESSAGE_TEXT must contain at most ${maxCharacters} characters`);
  }

  return normalized;
}

export function parseStartConversation(input: unknown): StartConversationInput {
  return startConversationSchema.parse(input);
}

export function parseChatMessage(
  input: unknown,
  maxCharacters = CHAT_MESSAGE_MAX_CHARACTERS,
): AcceptMessageInput {
  const envelope = messageEnvelopeSchema.parse(input);
  return { ...envelope, text: validatePlainText(envelope.text, maxCharacters) };
}

export function parseHandoffRequest(input: unknown): HandoffInput {
  return handoffRequestSchema.parse(input);
}

export function parseCloseConversation(input: unknown): CloseConversationInput {
  return closeConversationSchema.parse(input);
}

export function parseChangeChatLocale(input: unknown): ChangeChatLocaleInput {
  return changeChatLocaleSchema.parse(input);
}

export function inspectProhibitedChatContent(text: string): ChatContentInspection {
  const normalized = validatePlainText(text);

  if (MARKUP.test(normalized)) {
    return { allowed: false, reason: "markup" };
  }
  if (BANK_ACCOUNT.test(normalized)) {
    return { allowed: false, reason: "bank_account" };
  }
  if (GOVERNMENT_IDENTIFIER.test(normalized)) {
    return { allowed: false, reason: "government_identifier" };
  }
  if (CREDENTIAL.test(normalized)) {
    return { allowed: false, reason: "credential" };
  }
  if (PAYMENT_CARD.test(normalized)) {
    return { allowed: false, reason: "payment_card" };
  }

  return { allowed: true, normalized };
}
