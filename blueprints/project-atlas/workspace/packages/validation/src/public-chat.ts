import { z } from "zod";

export const CHAT_MESSAGE_MAX_CHARACTERS = 2_000;

export const chatLocaleSchema = z.enum(["es", "en"]);
export type ChatLocale = z.infer<typeof chatLocaleSchema>;

const idempotencyKeySchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/^[a-z][a-z0-9_-]+$/);
const expectedVersionSchema = z.number().int().positive();

const startConversationSchema = z
  .object({
    locale: chatLocaleSchema,
    noticeVersion: z.string().min(3).max(80).regex(/^[a-z0-9][a-z0-9._-]+$/),
    noticeAcknowledged: z.literal(true),
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

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type AcceptMessageInput = {
  text: string;
  idempotencyKey: string;
  expectedVersion: number;
};
export type HandoffInput = z.infer<typeof handoffRequestSchema>;

export type SensitiveReason =
  | "government_identifier"
  | "payment_card"
  | "bank_account"
  | "credential";

export type ChatContentInspection =
  | { allowed: true; normalized: string }
  | { allowed: false; reason: SensitiveReason };

const BIDI_CONTROL_CHARACTERS = /[\u202A-\u202E\u2066-\u2069]/u;
const GOVERNMENT_IDENTIFIER = /\b\d{3}-\d{2}-\d{4}\b/u;
const PAYMENT_CARD = /\b(?:\d[ -]*?){13,19}\b/u;
const BANK_ACCOUNT =
  /\b(?:routing|aba|account|cuenta|ruta)\b[^\d\n]{0,16}(?:\d[ -]?){6,17}\b/iu;
const CREDENTIAL =
  /(?:\b(?:api[ _-]?key|password|contrase(?:ñ|n)a|secret|token)\b\s*[:=]\s*\S{8,}|\bsk_[a-z0-9_-]{16,})/iu;

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
        codePoint === 127)
    );
  });
}

function validatePlainText(value: string): string {
  const normalized = normalizePlainText(value);

  if (!normalized) {
    throw new Error("CHAT_MESSAGE_TEXT is required");
  }
  if (
    hasProhibitedControlCharacter(normalized) ||
    BIDI_CONTROL_CHARACTERS.test(normalized)
  ) {
    throw new Error("CHAT_MESSAGE_TEXT contains prohibited control characters");
  }
  if ([...normalized].length > CHAT_MESSAGE_MAX_CHARACTERS) {
    throw new Error(`CHAT_MESSAGE_TEXT must contain at most ${CHAT_MESSAGE_MAX_CHARACTERS} characters`);
  }

  return normalized;
}

export function parseStartConversation(input: unknown): StartConversationInput {
  return startConversationSchema.parse(input);
}

export function parseChatMessage(input: unknown): AcceptMessageInput {
  const envelope = messageEnvelopeSchema.parse(input);
  return { ...envelope, text: validatePlainText(envelope.text) };
}

export function parseHandoffRequest(input: unknown): HandoffInput {
  return handoffRequestSchema.parse(input);
}

export function inspectProhibitedChatContent(text: string): ChatContentInspection {
  const normalized = validatePlainText(text);

  if (GOVERNMENT_IDENTIFIER.test(normalized)) {
    return { allowed: false, reason: "government_identifier" };
  }
  if (CREDENTIAL.test(normalized)) {
    return { allowed: false, reason: "credential" };
  }
  if (BANK_ACCOUNT.test(normalized)) {
    return { allowed: false, reason: "bank_account" };
  }
  if (PAYMENT_CARD.test(normalized)) {
    return { allowed: false, reason: "payment_card" };
  }

  return { allowed: true, normalized };
}
