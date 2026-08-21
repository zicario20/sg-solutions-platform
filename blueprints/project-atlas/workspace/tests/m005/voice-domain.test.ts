import { describe, expect, it } from "vitest";
import {
  evaluateReceptionCommand,
  makeVoiceCallReceipt,
  type ReceptionContext,
  type VoiceCall,
  type VoiceCommand,
} from "../../packages/domain/src/voice/index.ts";

const requestedAt = new Date("2026-08-20T12:00:00.000Z");

function command(overrides: Partial<VoiceCommand> = {}): VoiceCommand {
  return {
    commandId: "voice_command_001",
    callId: "voice_call_001",
    idempotencyKey: "voice_idempotency_001",
    operation: "provide_public_information",
    locale: "es",
    correlationId: "voice_correlation_001",
    requestedAt,
    confirmed: false,
    ...overrides,
  };
}

const prospectContext: ReceptionContext = {
  verificationStatus: "unverified",
  callerKind: "prospect",
  providerMode: "mock",
};

describe("M005 provider-neutral voice domain", () => {
  it("denies professional and financial execution without exposing a callable path", () => {
    expect(
      evaluateReceptionCommand(command({ operation: "payment_mutation" }), prospectContext),
    ).toEqual({ kind: "deny" });
    expect(
      evaluateReceptionCommand(command({ operation: "professional_filing" }), prospectContext),
    ).toEqual({ kind: "deny" });
  });

  it("requires current platform verification for personalized read operations", () => {
    expect(
      evaluateReceptionCommand(command({ operation: "safe_status" }), prospectContext),
    ).toEqual({ kind: "verification_required" });

    expect(
      evaluateReceptionCommand(command({ operation: "safe_status" }), {
        ...prospectContext,
        callerKind: "client",
        verificationStatus: "verified",
      }),
    ).toEqual({ kind: "allow" });
  });

  it("requires confirmation before a durable owner command", () => {
    expect(
      evaluateReceptionCommand(command({ operation: "request_appointment" }), prospectContext),
    ).toEqual({ kind: "confirmation_required" });
    expect(
      evaluateReceptionCommand(
        command({ operation: "request_appointment", confirmed: true }),
        prospectContext,
      ),
    ).toEqual({ kind: "allow" });
  });

  it("rejects non-mock execution and unknown runtime operations", () => {
    expect(
      evaluateReceptionCommand(command(), { ...prospectContext, providerMode: "disabled" }),
    ).toEqual({ kind: "deny" });
    expect(
      evaluateReceptionCommand(command({ operation: "unknown_runtime_operation" as never }), prospectContext),
    ).toEqual({ kind: "deny" });
  });

  it("creates a call-bound idempotency receipt with no caller or content fields", () => {
    const receipt = makeVoiceCallReceipt(command());
    expect(receipt).toMatchObject({
      receiptId: "voice_receipt_voice_command_001",
      callId: "voice_call_001",
      commandId: "voice_command_001",
      idempotencyKey: "voice_idempotency_001",
      state: "reserved",
    });
    expect(JSON.stringify(receipt)).not.toMatch(/phone|audio|transcript|body|account/iu);
  });

  it("keeps lifecycle, verification and transfer as independent metadata axes", () => {
    const call: VoiceCall = {
      callId: "voice_call_001",
      correlationId: "voice_correlation_001",
      providerMode: "mock",
      providerConnectionId: "mock_connection",
      providerCallReferenceDigest: "a".repeat(64),
      locale: "es",
      lifecycle: "active",
      verificationStatus: "unverified",
      transferStatus: "none",
      version: 1,
      createdAt: requestedAt,
      updatedAt: requestedAt,
    };
    expect(call).toMatchObject({
      lifecycle: "active",
      verificationStatus: "unverified",
      transferStatus: "none",
    });
  });
});
