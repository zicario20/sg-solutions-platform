import type { VoiceCommand, VoiceOperationResult } from "@atlas/domain";
import { VOICE_COMMAND_OPERATIONS } from "@atlas/domain";
import type { VoiceLifecycleRepository } from "@atlas/database";
import type { VoiceOperationsFacade } from "./operations-facade.ts";
import { issueVoiceServiceCredential } from "./service-auth.ts";

const canonicalId = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
const digest = /^[0-9a-f]{64}$/u;

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("SYNTHETIC_CONTRACT_INVALID");
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== [...keys].sort().join(",")) {
    throw new Error("SYNTHETIC_CONTRACT_INVALID");
  }
  return record;
}

function dateValue(value: unknown): Date {
  if (typeof value !== "string") throw new Error("SYNTHETIC_CONTRACT_INVALID");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error("SYNTHETIC_CONTRACT_INVALID");
  return parsed;
}

function parseCommand(value: unknown): VoiceCommand {
  const record = exactRecord(value, [
    "commandId",
    "callId",
    "idempotencyKey",
    "operation",
    "locale",
    "correlationId",
    "requestedAt",
    "confirmed",
  ]);
  if (
    typeof record.commandId !== "string" ||
    !canonicalId.test(record.commandId) ||
    typeof record.callId !== "string" ||
    !canonicalId.test(record.callId) ||
    typeof record.idempotencyKey !== "string" ||
    !canonicalId.test(record.idempotencyKey) ||
    typeof record.correlationId !== "string" ||
    !canonicalId.test(record.correlationId) ||
    typeof record.operation !== "string" ||
    !VOICE_COMMAND_OPERATIONS.includes(record.operation as VoiceCommand["operation"]) ||
    (record.locale !== "es" && record.locale !== "en") ||
    typeof record.confirmed !== "boolean"
  ) {
    throw new Error("SYNTHETIC_CONTRACT_INVALID");
  }
  return {
    commandId: record.commandId,
    callId: record.callId,
    idempotencyKey: record.idempotencyKey,
    operation: record.operation as VoiceCommand["operation"],
    locale: record.locale,
    correlationId: record.correlationId,
    requestedAt: dateValue(record.requestedAt),
    confirmed: record.confirmed,
  };
}

export class SyntheticVoicePlatform {
  private sequence = 0;
  private readonly issued = new Map<string, string>();

  constructor(
    private readonly dependencies: {
      facade: VoiceOperationsFacade;
      lifecycle: VoiceLifecycleRepository;
      serviceSecret: string | Uint8Array;
    },
  ) {}

  async startCall(value: unknown): Promise<string> {
    const record = exactRecord(value, [
      "call_id",
      "correlation_id",
      "provider_connection_id",
      "provider_reference_digest",
      "body_digest",
      "locale",
      "admitted_at",
    ]);
    if (
      typeof record.call_id !== "string" ||
      !canonicalId.test(record.call_id) ||
      typeof record.correlation_id !== "string" ||
      !canonicalId.test(record.correlation_id) ||
      typeof record.provider_connection_id !== "string" ||
      !canonicalId.test(record.provider_connection_id) ||
      typeof record.provider_reference_digest !== "string" ||
      !digest.test(record.provider_reference_digest) ||
      typeof record.body_digest !== "string" ||
      !digest.test(record.body_digest) ||
      (record.locale !== "es" && record.locale !== "en")
    ) {
      throw new Error("SYNTHETIC_CONTRACT_INVALID");
    }
    return this.dependencies.lifecycle.startCall({
      callId: record.call_id,
      correlationId: record.correlation_id,
      providerConnectionId: record.provider_connection_id,
      providerReferenceDigest: record.provider_reference_digest,
      locale: record.locale,
      admittedAt: dateValue(record.admitted_at),
    });
  }

  async issueTicket(value: unknown): Promise<string> {
    const command = parseCommand(value);
    if (!(await this.dependencies.lifecycle.authorizes(command.callId, command.correlationId))) {
      throw new Error("SYNTHETIC_CALL_NOT_ADMITTED");
    }
    this.sequence += 1;
    const credential = issueVoiceServiceCredential(
      {
        callId: command.callId,
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        operation: command.operation,
        nonce: `synthetic_voice_nonce_${String(this.sequence).padStart(24, "0")}`,
        issuedAt: new Date(command.requestedAt.getTime() - 1_000),
        expiresAt: new Date(command.requestedAt.getTime() + 60_000),
      },
      this.dependencies.serviceSecret,
    );
    this.issued.set(credential, `${command.callId}\u0000${command.commandId}`);
    return credential;
  }

  async execute(value: unknown, credential: unknown): Promise<VoiceOperationResult> {
    const command = parseCommand(value);
    if (
      typeof credential !== "string" ||
      this.issued.get(credential) !== `${command.callId}\u0000${command.commandId}`
    ) {
      return { kind: "denied" };
    }
    this.issued.delete(credential);
    const result = await this.dependencies.facade.execute(command, {
      credential,
      now: command.requestedAt,
    });
    if (result.kind !== "unavailable") {
      await this.dependencies.lifecycle.record(command, result, command.requestedAt);
    }
    return result;
  }

  snapshot(callId: string) {
    if (!canonicalId.test(callId)) throw new Error("SYNTHETIC_CONTRACT_INVALID");
    return this.dependencies.lifecycle.snapshot(callId);
  }
}
