import { createHmac, timingSafeEqual } from "node:crypto";
import type { VoiceCommand, VoiceCommandOperation } from "@atlas/domain";

const ISSUER = "atlas-platform";
const AUDIENCE = "voice-operations-facade";
const MAX_CREDENTIAL_MILLISECONDS = 2 * 60_000;
const CLOCK_SKEW_MILLISECONDS = 5_000;
const TOKEN_MAX_BYTES = 2_048;
const canonicalId = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const canonicalNonce = /^[A-Za-z0-9_-]{24,128}$/u;

type CredentialClaims = {
  version: 1;
  issuer: typeof ISSUER;
  audience: typeof AUDIENCE;
  callId: string;
  commandId: string;
  idempotencyKey: string;
  operation: VoiceCommandOperation;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export interface VoiceServiceNonceStore {
  consume(nonce: string, expiresAt: Date, now: Date): Promise<boolean>;
}

export class MemoryVoiceServiceNonceStore implements VoiceServiceNonceStore {
  private readonly consumed = new Map<string, number>();

  async consume(nonce: string, expiresAt: Date, now: Date): Promise<boolean> {
    for (const [key, expiry] of this.consumed) {
      if (expiry <= now.getTime()) this.consumed.delete(key);
    }
    if (this.consumed.has(nonce)) return false;
    this.consumed.set(nonce, expiresAt.getTime());
    return true;
  }
}

function secretBytes(secret: string | Uint8Array): Buffer {
  const bytes = typeof secret === "string" ? Buffer.from(secret, "utf8") : Buffer.from(secret);
  if (bytes.byteLength < 32) throw new Error("VOICE_SERVICE_SECRET_TOO_SHORT");
  return bytes;
}

function sign(body: string, secret: Buffer): Buffer {
  return createHmac("sha256", secret).update(`v1.${body}`).digest();
}

export function issueVoiceServiceCredential(
  input: {
    callId: string;
    commandId: string;
    idempotencyKey: string;
    operation: VoiceCommandOperation;
    nonce: string;
    issuedAt: Date;
    expiresAt: Date;
  },
  secret: string | Uint8Array,
): string {
  if (
    !canonicalId.test(input.callId) ||
    !canonicalId.test(input.commandId) ||
    !canonicalId.test(input.idempotencyKey) ||
    !canonicalNonce.test(input.nonce) ||
    !Number.isFinite(input.issuedAt.getTime()) ||
    !Number.isFinite(input.expiresAt.getTime()) ||
    input.expiresAt <= input.issuedAt ||
    input.expiresAt.getTime() - input.issuedAt.getTime() > MAX_CREDENTIAL_MILLISECONDS
  ) {
    throw new Error("VOICE_SERVICE_CREDENTIAL_INPUT_INVALID");
  }
  const claims: CredentialClaims = {
    version: 1,
    issuer: ISSUER,
    audience: AUDIENCE,
    callId: input.callId,
    commandId: input.commandId,
    idempotencyKey: input.idempotencyKey,
    operation: input.operation,
    nonce: input.nonce,
    issuedAt: input.issuedAt.getTime(),
    expiresAt: input.expiresAt.getTime(),
  };
  const body = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signature = sign(body, secretBytes(secret)).toString("base64url");
  return `v1.${body}.${signature}`;
}

function parseCredential(token: string, secret: Buffer): CredentialClaims | undefined {
  if (Buffer.byteLength(token, "utf8") > TOKEN_MAX_BYTES) return undefined;
  const [version, body, suppliedSignature, extra] = token.split(".");
  if (version !== "v1" || !body || !suppliedSignature || extra !== undefined) return undefined;
  let supplied: Buffer;
  let parsed: unknown;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
    const expected = sign(body, secret);
    if (supplied.byteLength !== expected.byteLength || !timingSafeEqual(supplied, expected)) {
      return undefined;
    }
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  const claims = parsed as Record<string, unknown>;
  const expectedKeys = [
    "audience",
    "callId",
    "commandId",
    "expiresAt",
    "idempotencyKey",
    "issuedAt",
    "issuer",
    "nonce",
    "operation",
    "version",
  ];
  if (Object.keys(claims).sort().join(",") !== expectedKeys.join(",")) return undefined;
  if (
    claims.version !== 1 ||
    claims.issuer !== ISSUER ||
    claims.audience !== AUDIENCE ||
    typeof claims.callId !== "string" ||
    typeof claims.commandId !== "string" ||
    typeof claims.idempotencyKey !== "string" ||
    typeof claims.operation !== "string" ||
    typeof claims.nonce !== "string" ||
    typeof claims.issuedAt !== "number" ||
    typeof claims.expiresAt !== "number"
  ) {
    return undefined;
  }
  return claims as CredentialClaims;
}

export class VoiceServiceAuthenticator {
  private readonly secret: Buffer;

  constructor(
    secret: string | Uint8Array,
    private readonly nonces: VoiceServiceNonceStore,
  ) {
    this.secret = secretBytes(secret);
  }

  async verify(token: string, command: VoiceCommand, now: Date): Promise<boolean> {
    if (!Number.isFinite(now.getTime())) return false;
    const claims = parseCredential(token, this.secret);
    if (
      !claims ||
      claims.callId !== command.callId ||
      claims.commandId !== command.commandId ||
      claims.idempotencyKey !== command.idempotencyKey ||
      claims.operation !== command.operation ||
      !canonicalId.test(claims.callId) ||
      !canonicalId.test(claims.commandId) ||
      !canonicalId.test(claims.idempotencyKey) ||
      !canonicalNonce.test(claims.nonce) ||
      claims.issuedAt > now.getTime() + CLOCK_SKEW_MILLISECONDS ||
      claims.expiresAt <= now.getTime() ||
      claims.expiresAt <= claims.issuedAt ||
      claims.expiresAt - claims.issuedAt > MAX_CREDENTIAL_MILLISECONDS
    ) {
      return false;
    }
    return this.nonces.consume(claims.nonce, new Date(claims.expiresAt), now);
  }
}
