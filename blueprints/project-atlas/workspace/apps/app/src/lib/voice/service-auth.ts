import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ServiceIdentityVerifier } from "@atlas/auth";
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

export type VoiceCredentialRepositoryResult =
  | "issued"
  | "consumed"
  | "replay"
  | "capacity"
  | "unavailable";
export type VoiceCredentialRepositoryDurability = "shared_durable" | "bounded_test" | "unavailable";

type VoiceCredentialRepositoryInput = Readonly<{
  namespace: string;
  token: string;
  expiresAt: Date;
  now: Date;
}>;

export interface VoiceCredentialRepository {
  readonly durability: VoiceCredentialRepositoryDurability;
  consumeNonce(input: VoiceCredentialRepositoryInput): Promise<VoiceCredentialRepositoryResult>;
  issueCredential(input: VoiceCredentialRepositoryInput): Promise<VoiceCredentialRepositoryResult>;
  consumeCredential(
    input: VoiceCredentialRepositoryInput,
  ): Promise<VoiceCredentialRepositoryResult>;
}

type MemoryCredentialEntry = {
  state: "pending" | "consumed";
  expiresAt: number;
};

const credentialNamespace = /^[a-z][a-z0-9_.:-]{2,63}$/u;
const MAX_REPOSITORY_TOKEN_BYTES = 4_096;
const MAX_TEST_REPOSITORY_CAPACITY = 100_000;

function validRepositoryInput(input: VoiceCredentialRepositoryInput): boolean {
  return (
    credentialNamespace.test(input.namespace) &&
    Buffer.byteLength(input.token, "utf8") > 0 &&
    Buffer.byteLength(input.token, "utf8") <= MAX_REPOSITORY_TOKEN_BYTES &&
    Number.isFinite(input.expiresAt.getTime()) &&
    Number.isFinite(input.now.getTime()) &&
    input.expiresAt > input.now
  );
}

function repositoryKey(input: VoiceCredentialRepositoryInput): string {
  return createHash("sha256").update(`${input.namespace}\u0000${input.token}`).digest("hex");
}

export class UnavailableVoiceCredentialRepository implements VoiceCredentialRepository {
  readonly durability = "unavailable" as const;

  async consumeNonce(): Promise<VoiceCredentialRepositoryResult> {
    return "unavailable";
  }
  async issueCredential(): Promise<VoiceCredentialRepositoryResult> {
    return "unavailable";
  }
  async consumeCredential(): Promise<VoiceCredentialRepositoryResult> {
    return "unavailable";
  }
}

export class BoundedMemoryVoiceCredentialRepository implements VoiceCredentialRepository {
  readonly durability = "bounded_test" as const;
  private readonly entries = new Map<string, MemoryCredentialEntry>();
  private readonly capacity: number;

  constructor(options: { capacity: number }) {
    if (
      !Number.isSafeInteger(options.capacity) ||
      options.capacity < 1 ||
      options.capacity > MAX_TEST_REPOSITORY_CAPACITY
    ) {
      throw new Error("VOICE_CREDENTIAL_CAPACITY_INVALID");
    }
    this.capacity = options.capacity;
  }

  get entryCount(): number {
    return this.entries.size;
  }

  private cleanup(now: Date): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now.getTime()) this.entries.delete(key);
    }
  }

  async consumeNonce(
    input: VoiceCredentialRepositoryInput,
  ): Promise<VoiceCredentialRepositoryResult> {
    if (!validRepositoryInput(input)) return "unavailable";
    this.cleanup(input.now);
    const key = repositoryKey(input);
    if (this.entries.has(key)) return "replay";
    if (this.entries.size >= this.capacity) return "capacity";
    this.entries.set(key, {
      state: "consumed",
      expiresAt: input.expiresAt.getTime(),
    });
    return "consumed";
  }

  async issueCredential(
    input: VoiceCredentialRepositoryInput,
  ): Promise<VoiceCredentialRepositoryResult> {
    if (!validRepositoryInput(input)) return "unavailable";
    this.cleanup(input.now);
    const key = repositoryKey(input);
    if (this.entries.has(key)) return "replay";
    if (this.entries.size >= this.capacity) return "capacity";
    this.entries.set(key, {
      state: "pending",
      expiresAt: input.expiresAt.getTime(),
    });
    return "issued";
  }

  async consumeCredential(
    input: VoiceCredentialRepositoryInput,
  ): Promise<VoiceCredentialRepositoryResult> {
    if (!validRepositoryInput(input)) return "unavailable";
    this.cleanup(input.now);
    const key = repositoryKey(input);
    const entry = this.entries.get(key);
    if (entry?.state !== "pending") return "replay";
    entry.state = "consumed";
    return "consumed";
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
  private readonly repository: VoiceCredentialRepository;
  private readonly repositoryReady: boolean;
  private readonly canonicalVerifier: ServiceIdentityVerifier;

  constructor(
    secret: string | Uint8Array,
    repository: VoiceCredentialRepository | undefined,
    options: { allowBoundedTestRepository?: boolean } = {},
  ) {
    this.secret = secretBytes(secret);
    this.repository = repository ?? new UnavailableVoiceCredentialRepository();
    this.repositoryReady =
      this.repository.durability === "shared_durable" ||
      (options.allowBoundedTestRepository === true &&
        this.repository.durability === "bounded_test");
    this.canonicalVerifier = new ServiceIdentityVerifier({ verify: async () => true });
  }

  async verify(token: string, command: VoiceCommand, now: Date): Promise<boolean> {
    if (!this.repositoryReady || !Number.isFinite(now.getTime())) return false;
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
    if (
      (
        await this.canonicalVerifier.verify(
          { audience: AUDIENCE, scopes: ["voice.execute"] },
          { audience: AUDIENCE, scopes: ["voice.execute"] },
        )
      ).kind !== "allowed"
    )
      return false;
    try {
      return (
        (await this.repository.consumeNonce({
          namespace: "voice_service_nonce",
          token: claims.nonce,
          expiresAt: new Date(claims.expiresAt),
          now,
        })) === "consumed"
      );
    } catch {
      return false;
    }
  }
}
