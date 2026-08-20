import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { VerifiedWebhookContext } from "./meta-contracts.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
const CHALLENGE = /^[A-Za-z0-9._~-]{1,512}$/u;
const SIGNATURE = /^sha256=([a-f0-9]{64})$/u;

export type MetaChallengeResult =
  | { readonly accepted: true; readonly challenge: string }
  | { readonly accepted: false; readonly reason: "verification_rejected" };

export type VerifyMetaWebhookInput = {
  readonly raw: Uint8Array;
  readonly signatureHeader: string | undefined;
  readonly appSecret: string;
  readonly connectionId: string;
  readonly businessAccountId: string;
  readonly phoneNumberId: string;
  readonly correlationId: string;
  readonly verifiedAt: Date;
};

export type MetaWebhookVerificationResult =
  | { readonly status: "verified"; readonly context: VerifiedWebhookContext }
  | {
      readonly status: "rejected";
      readonly reason: "signature_rejected" | "verification_rejected";
    };

export type ResolvedVerifiedWebhookContext = {
  readonly connectionId: string;
  readonly businessAccountId: string;
  readonly phoneNumberId: string;
  readonly correlationId: string;
  readonly verifiedAt: Date;
};

type VerifiedWebhookBinding = ResolvedVerifiedWebhookContext & {
  readonly rawDigest: Uint8Array;
};

const verifiedWebhookBindings = new WeakMap<VerifiedWebhookContext, VerifiedWebhookBinding>();

function digestRaw(raw: Uint8Array): Uint8Array {
  return createHash("sha256").update(raw).digest();
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function resolveVerifiedMetaWebhookContext(
  raw: Uint8Array,
  context: VerifiedWebhookContext,
): ResolvedVerifiedWebhookContext | null {
  if (!(raw instanceof Uint8Array) || !context || typeof context !== "object") return null;
  const binding = verifiedWebhookBindings.get(context);
  if (!binding) return null;
  const suppliedDigest = digestRaw(raw);
  if (
    suppliedDigest.byteLength !== binding.rawDigest.byteLength ||
    !timingSafeEqual(suppliedDigest, binding.rawDigest)
  ) {
    return null;
  }

  return Object.freeze({
    connectionId: binding.connectionId,
    businessAccountId: binding.businessAccountId,
    phoneNumberId: binding.phoneNumberId,
    correlationId: binding.correlationId,
    verifiedAt: new Date(binding.verifiedAt),
  });
}

export function verifyMetaChallenge(
  query: URLSearchParams,
  configuredVerifyToken: string,
): MetaChallengeResult {
  const modes = query.getAll("hub.mode");
  const tokens = query.getAll("hub.verify_token");
  const challenges = query.getAll("hub.challenge");
  const validConfiguredToken =
    configuredVerifyToken.length >= 16 && configuredVerifyToken.length <= 4_096;

  if (
    modes.length !== 1 ||
    tokens.length !== 1 ||
    challenges.length !== 1 ||
    modes[0] !== "subscribe" ||
    !validConfiguredToken ||
    !constantTimeTextEqual(tokens[0] ?? "", configuredVerifyToken) ||
    !CHALLENGE.test(challenges[0] ?? "")
  ) {
    return { accepted: false, reason: "verification_rejected" };
  }

  return { accepted: true, challenge: challenges[0] as string };
}

export function verifyMetaWebhookSignature(
  raw: Uint8Array,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!(raw instanceof Uint8Array)) return false;
  const match = signatureHeader?.match(SIGNATURE);
  if (!match || appSecret.length < 16 || appSecret.length > 4_096) return false;

  const received = Buffer.from(match[1] as string, "hex");
  const expected = createHmac("sha256", appSecret).update(raw).digest();
  return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
}

export function verifyMetaWebhook(input: VerifyMetaWebhookInput): MetaWebhookVerificationResult {
  if (
    !(input.raw instanceof Uint8Array) ||
    !IDENTIFIER.test(input.connectionId) ||
    !PROVIDER_IDENTIFIER.test(input.businessAccountId) ||
    !PROVIDER_IDENTIFIER.test(input.phoneNumberId) ||
    !IDENTIFIER.test(input.correlationId) ||
    !(input.verifiedAt instanceof Date) ||
    Number.isNaN(input.verifiedAt.valueOf())
  ) {
    return { status: "rejected", reason: "verification_rejected" };
  }

  const rawSnapshot = Uint8Array.from(input.raw);
  if (!verifyMetaWebhookSignature(rawSnapshot, input.signatureHeader, input.appSecret)) {
    return { status: "rejected", reason: "signature_rejected" };
  }

  const context: VerifiedWebhookContext = Object.freeze({ kind: "verified_meta_webhook" });
  verifiedWebhookBindings.set(context, {
    connectionId: input.connectionId,
    businessAccountId: input.businessAccountId,
    phoneNumberId: input.phoneNumberId,
    correlationId: input.correlationId,
    verifiedAt: new Date(input.verifiedAt),
    rawDigest: digestRaw(rawSnapshot),
  });
  return { status: "verified", context };
}
