import { z } from "zod";

const safeCode = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z][a-z0-9_]{1,63}$/u);
const safeOpaqueToken = z
  .string()
  .trim()
  .min(20)
  .max(180)
  .regex(/^[A-Za-z0-9._:-]+$/u);
const answerValue = z.union([
  z.string().trim().max(2_000),
  z.number().finite().safe(),
  z.boolean(),
]);
const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

const answers = z
  .record(safeCode, answerValue)
  .refine((record) => Object.keys(record).length > 0 && Object.keys(record).length <= 48)
  .refine((record) => Object.keys(record).every((key) => !forbiddenKeys.has(key)))
  .transform((record) => Object.freeze({ ...record }));

const consents = z
  .record(safeCode, z.boolean())
  .refine((record) => Object.keys(record).length <= 16)
  .refine((record) => Object.keys(record).every((key) => !forbiddenKeys.has(key)))
  .transform((record) => Object.freeze({ ...record }));

const attributionValue = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => !/[\r\n]/u.test(value));
const attribution = z
  .object({
    landingPage: attributionValue.optional(),
    referrer: attributionValue.optional(),
    utmSource: attributionValue.optional(),
    utmMedium: attributionValue.optional(),
    utmCampaign: attributionValue.optional(),
    utmTerm: attributionValue.optional(),
    utmContent: attributionValue.optional(),
    partnerCode: attributionValue.optional(),
  })
  .strict()
  .optional()
  .transform((value) => (value === undefined ? undefined : Object.freeze({ ...value })));

export const publicSubmissionEnvelopeSchema = z
  .object({
    formCode: safeCode,
    formVersion: z
      .string()
      .trim()
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u),
    locale: z.preprocess(
      (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
      z.enum(["es", "en"]),
    ),
    nonce: safeOpaqueToken,
    idempotencyKey: safeOpaqueToken,
    answers,
    consents,
    attribution,
    honeypot: z.literal("").optional(),
  })
  .strict();

export type PublicSubmissionEnvelope = z.infer<typeof publicSubmissionEnvelopeSchema>;

export function parsePublicSubmissionEnvelope(value: unknown): PublicSubmissionEnvelope {
  return publicSubmissionEnvelopeSchema.parse(value);
}

export function normalizePublicEmail(value: string): string {
  return z.string().trim().email().max(254).parse(value).toLowerCase();
}

export function normalizePublicPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/gu, "");
  const withCountry = compact.startsWith("+") ? compact : `+1${compact}`;
  if (!/^\+[1-9]\d{7,14}$/u.test(withCountry)) throw new Error("PUBLIC_PHONE_INVALID");
  return withCountry;
}

export function normalizeUsState(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/u.test(normalized)) throw new Error("PUBLIC_STATE_INVALID");
  return normalized;
}
