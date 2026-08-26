import { describe, expect, it } from "vitest";
import { VoiceOperationsFacade } from "../../apps/app/src/lib/voice/operations-facade.ts";
import { createFailClosedOwnerPorts } from "../../apps/app/src/lib/voice/owner-ports.ts";
import {
  type RecoverVoiceCallInput,
  recoverVoiceCall,
} from "../../apps/app/src/lib/voice/recovery-jobs.ts";
import {
  BoundedMemoryVoiceCredentialRepository,
  issueVoiceServiceCredential,
  VoiceServiceAuthenticator,
} from "../../apps/app/src/lib/voice/service-auth.ts";
import { MemoryVoiceCommandReceiptRepository } from "../../packages/database/src/voice-command-repository.ts";

const now = new Date("2026-08-20T12:00:00.000Z");
const secret = Buffer.from("m005-recovery-secret-000000000000000000000000000000000000");

function setup() {
  let callbackCalls = 0;
  let nonce = 0;
  const observedLocales: string[] = [];
  const facade = new VoiceOperationsFacade({
    authenticator: new VoiceServiceAuthenticator(
      secret,
      new BoundedMemoryVoiceCredentialRepository({ capacity: 128 }),
      { allowBoundedTestRepository: true },
    ),
    receipts: new MemoryVoiceCommandReceiptRepository(),
    owners: {
      ...createFailClosedOwnerPorts(),
      requestCallback: async (input) => {
        callbackCalls += 1;
        observedLocales.push(input.locale);
        return {
          receiptId: "callback_recovery_receipt_001",
          outcome: "callback_requested",
        };
      },
    },
  });
  const base: Omit<RecoverVoiceCallInput, "fallback" | "callerConfirmed"> = {
    callId: "voice_call_001",
    correlationId: "voice_correlation_001",
    reason: "facade_unavailable",
    locale: "en",
    now,
    facade,
    credentialFor: (command) => {
      nonce += 1;
      return {
        now,
        credential: issueVoiceServiceCredential(
          {
            callId: command.callId,
            commandId: command.commandId,
            idempotencyKey: command.idempotencyKey,
            operation: command.operation,
            nonce: `voice_recovery_nonce_${String(nonce).padStart(8, "0")}`,
            issuedAt: new Date(now.getTime() - 1_000),
            expiresAt: new Date(now.getTime() + 60_000),
          },
          secret,
        ),
      };
    },
  };
  return { base, callbackCalls: () => callbackCalls, observedLocales };
}

describe("M005 safe voice recovery", () => {
  it("persists a confirmed callback exactly once through facade replay", async () => {
    const { base, callbackCalls, observedLocales } = setup();
    const input: RecoverVoiceCallInput = {
      ...base,
      fallback: "callback",
      callerConfirmed: true,
    };
    const first = await recoverVoiceCall(input);
    const replay = await recoverVoiceCall(input);
    expect(first).toEqual({
      outcome: "callback_requested",
      receiptId: "callback_recovery_receipt_001",
    });
    expect(replay).toEqual(first);
    expect(callbackCalls()).toBe(1);
    expect(observedLocales).toEqual(["en"]);
  });

  it("does not create callback or voicemail without caller confirmation", async () => {
    const { base, callbackCalls } = setup();
    await expect(
      recoverVoiceCall({
        ...base,
        fallback: "callback",
        callerConfirmed: false,
      }),
    ).resolves.toEqual({ outcome: "ended", code: "confirmation_required" });
    expect(callbackCalls()).toBe(0);
  });

  it("never maps recovery to a sensitive or outbound-call operation", async () => {
    const source = await import("../../apps/app/src/lib/voice/recovery-jobs.ts");
    expect(source.RECOVERY_OPERATIONS).toEqual([
      "request_transfer",
      "request_voicemail",
      "request_callback",
    ]);
    expect(source.RECOVERY_OPERATIONS).not.toContain("payment_mutation");
    expect(source.RECOVERY_OPERATIONS).not.toContain("secure_message");
  });
});
