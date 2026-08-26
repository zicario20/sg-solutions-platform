import { createHash } from "node:crypto";
import type { VoiceCommand } from "@atlas/domain";
import type { VoiceOperationsFacade, VoiceServiceContext } from "./operations-facade.ts";

export const RECOVERY_OPERATIONS = [
  "request_transfer",
  "request_voicemail",
  "request_callback",
] as const satisfies readonly VoiceCommand["operation"][];

export type VoiceRecoveryReason =
  | "facade_unavailable"
  | "provider_unavailable"
  | "media_unavailable"
  | "misunderstood_limit"
  | "human_unavailable";

export type RecoverVoiceCallInput = Readonly<{
  callId: string;
  correlationId: string;
  reason: VoiceRecoveryReason;
  locale: "es" | "en";
  fallback: "transfer" | "voicemail" | "callback";
  callerConfirmed: boolean;
  now: Date;
  facade: VoiceOperationsFacade;
  credentialFor(command: VoiceCommand): VoiceServiceContext;
}>;

export type VoiceRecoveryResult =
  | {
      outcome: "transfer_requested" | "voicemail_requested" | "callback_requested";
      receiptId: string;
    }
  | {
      outcome: "ended";
      code: "confirmation_required" | "invalid_request" | "unavailable" | "denied";
    };

const canonicalId = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;

function operationFor(
  fallback: RecoverVoiceCallInput["fallback"],
): (typeof RECOVERY_OPERATIONS)[number] {
  if (fallback === "transfer") return "request_transfer";
  if (fallback === "voicemail") return "request_voicemail";
  return "request_callback";
}

export async function recoverVoiceCall(input: RecoverVoiceCallInput): Promise<VoiceRecoveryResult> {
  if (
    !canonicalId.test(input.callId) ||
    !canonicalId.test(input.correlationId) ||
    !(input.now instanceof Date) ||
    !Number.isFinite(input.now.getTime())
  ) {
    return { outcome: "ended", code: "invalid_request" };
  }
  if ((input.fallback === "callback" || input.fallback === "voicemail") && !input.callerConfirmed) {
    return { outcome: "ended", code: "confirmation_required" };
  }

  const operation = operationFor(input.fallback);
  const digest = createHash("sha256")
    .update(
      [
        "voice-recovery.v1",
        input.callId,
        input.reason,
        input.fallback,
        String(input.callerConfirmed),
      ].join("\n"),
    )
    .digest("hex")
    .slice(0, 24);
  const commandId = `voice_recovery_${digest}`;
  const command: VoiceCommand = {
    commandId,
    callId: input.callId,
    idempotencyKey: `${commandId}_idempotency`,
    operation,
    locale: input.locale,
    correlationId: input.correlationId,
    requestedAt: input.now,
    confirmed: input.callerConfirmed,
  };
  const result = await input.facade.execute(command, input.credentialFor(command));
  if (
    result.kind === "completed" &&
    (result.outcome === "transfer_requested" ||
      result.outcome === "voicemail_requested" ||
      result.outcome === "callback_requested")
  ) {
    return {
      outcome: result.outcome,
      receiptId: result.receiptId,
    };
  }
  return {
    outcome: "ended",
    code: result.kind === "denied" ? "denied" : "unavailable",
  };
}
