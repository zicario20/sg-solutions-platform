import { describe, expect, it } from "vitest";
import { MemoryVoiceCommandReceiptRepository } from "../../packages/database/src/voice-command-repository.ts";
import type { VoiceCommand } from "../../packages/domain/src/voice/index.ts";
import {
  VoiceOperationsFacade,
  type VoiceServiceContext,
} from "../../apps/app/src/lib/voice/operations-facade.ts";
import {
  createFailClosedOwnerPorts,
  type OwnerPorts,
} from "../../apps/app/src/lib/voice/owner-ports.ts";
import {
  issueVoiceServiceCredential,
  MemoryVoiceServiceNonceStore,
  VoiceServiceAuthenticator,
} from "../../apps/app/src/lib/voice/service-auth.ts";

const secret = Buffer.from("m005-synthetic-service-secret-00000000000000000000000000000000");
const now = new Date("2026-08-20T12:00:00.000Z");

function command(overrides: Partial<VoiceCommand> = {}): VoiceCommand {
  return {
    commandId: "voice_command_001",
    callId: "voice_call_001",
    idempotencyKey: "voice_idempotency_001",
    operation: "request_appointment",
    locale: "es",
    correlationId: "voice_correlation_001",
    requestedAt: now,
    confirmed: true,
    ...overrides,
  };
}

function contextFor(input: VoiceCommand, nonce: string): VoiceServiceContext {
  return {
    now,
    credential: issueVoiceServiceCredential(
      {
        callId: input.callId,
        commandId: input.commandId,
        idempotencyKey: input.idempotencyKey,
        operation: input.operation,
        nonce,
        issuedAt: new Date(now.getTime() - 1_000),
        expiresAt: new Date(now.getTime() + 60_000),
      },
      secret,
    ),
  };
}

function setup(overrides: Partial<OwnerPorts> = {}) {
  const receipts = new MemoryVoiceCommandReceiptRepository();
  const owners = { ...createFailClosedOwnerPorts(), ...overrides };
  const facade = new VoiceOperationsFacade({
    authenticator: new VoiceServiceAuthenticator(
      secret,
      new MemoryVoiceServiceNonceStore(),
    ),
    receipts,
    owners,
  });
  return { facade, receipts };
}

describe("M005 scoped voice operations facade", () => {
  it("requires verification before any personalized status projection", async () => {
    const input = command({ operation: "safe_status", confirmed: false });
    const { facade } = setup();
    await expect(facade.execute(input, contextFor(input, "nonce_safe_status_00000001"))).resolves.toEqual({
      kind: "verification_required",
    });
  });

  it("denies prohibited execution even with a verified caller context", async () => {
    const input = command({ operation: "payment_mutation" });
    const { facade } = setup();
    await expect(
      facade.execute(input, contextFor(input, "nonce_payment_deny_00000001")),
    ).resolves.toEqual({ kind: "denied" });
  });

  it("rejects tampered, expired, mismatched and replayed service credentials", async () => {
    let ownerCalls = 0;
    const input = command();
    const { facade } = setup({
      requestAppointment: async () => {
        ownerCalls += 1;
        return { receiptId: "appointment_receipt_001", outcome: "appointment_requested" };
      },
    });
    const valid = contextFor(input, "nonce_auth_boundary_00000001");
    await expect(
      facade.execute(input, { ...valid, credential: `${valid.credential}x` }),
    ).resolves.toEqual({ kind: "denied" });
    await expect(
      facade.execute(input, { ...valid, now: new Date(now.getTime() + 120_000) }),
    ).resolves.toEqual({ kind: "denied" });
    const wrongCall = command({ callId: "voice_call_other" });
    await expect(
      facade.execute(wrongCall, contextFor(input, "nonce_wrong_call_000000001")),
    ).resolves.toEqual({ kind: "denied" });
    await expect(facade.execute(input, valid)).resolves.toMatchObject({ kind: "completed" });
    await expect(facade.execute(input, valid)).resolves.toEqual({ kind: "denied" });
    expect(ownerCalls).toBe(1);
  });

  it("reserves a durable call-bound receipt before invoking an owner and replays safely", async () => {
    let ownerCalls = 0;
    let observedState: string | undefined;
    const input = command();
    const receipts = new MemoryVoiceCommandReceiptRepository();
    const owners = {
      ...createFailClosedOwnerPorts(),
      requestAppointment: async () => {
        ownerCalls += 1;
        observedState = (
          await receipts.find(input.callId, input.idempotencyKey)
        )?.state;
        return { receiptId: "appointment_receipt_001", outcome: "appointment_requested" } as const;
      },
    };
    const facade = new VoiceOperationsFacade({
      authenticator: new VoiceServiceAuthenticator(
        secret,
        new MemoryVoiceServiceNonceStore(),
      ),
      receipts,
      owners,
    });

    const first = await facade.execute(input, contextFor(input, "nonce_appointment_000000001"));
    const replay = await facade.execute(input, contextFor(input, "nonce_appointment_000000002"));

    expect(observedState).toBe("reserved");
    expect(first).toEqual({
      kind: "completed",
      outcome: "appointment_requested",
      receiptId: "appointment_receipt_001",
    });
    expect(replay).toEqual(first);
    expect(ownerCalls).toBe(1);
    expect(await receipts.find(input.callId, input.idempotencyKey)).toMatchObject({
      state: "completed",
      commandId: input.commandId,
    });
  });

  it("rejects an idempotency key reused with altered command intent", async () => {
    let ownerCalls = 0;
    const first = command();
    const altered = command({
      commandId: "voice_command_002",
      operation: "request_callback",
    });
    const { facade } = setup({
      requestAppointment: async () => {
        ownerCalls += 1;
        return { receiptId: "appointment_receipt_001", outcome: "appointment_requested" };
      },
      requestCallback: async () => {
        ownerCalls += 1;
        return { receiptId: "callback_receipt_001", outcome: "callback_requested" };
      },
    });
    await expect(
      facade.execute(first, contextFor(first, "nonce_conflict_first_000001")),
    ).resolves.toMatchObject({ kind: "completed" });
    await expect(
      facade.execute(altered, contextFor(altered, "nonce_conflict_second_00001")),
    ).resolves.toEqual({ kind: "denied" });
    expect(ownerCalls).toBe(1);
  });

  it("rejects an owner receipt whose outcome belongs to another operation", async () => {
    const input = command();
    const { facade } = setup({
      requestAppointment: async () => ({
        receiptId: "wrong_owner_receipt_001",
        outcome: "lead_created",
      }),
    });
    await expect(
      facade.execute(input, contextFor(input, "nonce_wrong_outcome_00000001")),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("keeps client projections portal-first even after synthetic verification", async () => {
    const input = command({ operation: "payment_projection" });
    const { facade } = setup({
      resolveVerification: async () => ({
        callId: input.callId,
        status: "verified",
        callerKind: "client",
        receiptId: "verification_receipt_001",
        issuedAt: new Date(now.getTime() - 5_000),
        expiresAt: new Date(now.getTime() + 60_000),
      }),
    });
    await expect(
      facade.execute(input, contextFor(input, "nonce_portal_first_00000001")),
    ).resolves.toMatchObject({ kind: "completed", outcome: "portal_required" });
  });
});
