import { describe, expect, it } from "vitest";
import {
  expireChannelRecoveryState,
  MemoryCommunicationsRepository,
  reconcileMessageTemplate,
  reconcileUnknownDispatch,
} from "@atlas/domain";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

function templateReceipt(version: number, state: "provider_approved" | "paused") {
  return {
    receiptId: `receipt_template_${version}`,
    owner: "communications" as const,
    operation: "template_provider_reconciliation" as const,
    templateId: "template_1",
    locale: "en" as const,
    definitionVersion: 1,
    providerVersion: version,
    providerState: state,
    issuedAt: NOW,
    expiresAt: TOMORROW,
    correlationId: `correlation_${version}`,
  };
}

describe("WhatsApp reconciliation and recovery jobs", () => {
  it("keeps template projections monotonic and capability-gated", async () => {
    const repository = new MemoryCommunicationsRepository({
      templates: [{ templateId: "template_1", locale: "en", definitionVersion: 1, internallyApproved: true, providerState: "provider_approved", providerVersion: 3, updatedAt: NOW }],
    });
    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: false }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toEqual({ status: "manual_review", code: "template_reconciliation_unsupported" });
    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "paused", providerVersion: 4, correlationId: "correlation_4", receipt: templateReceipt(4, "paused"), now: NOW })).toMatchObject({ status: "applied", providerVersion: 4, providerState: "paused" });
    expect(await reconcileMessageTemplate({ repository, capability: { templateProjection: true }, templateId: "template_1", locale: "en", providerState: "provider_approved", providerVersion: 3, correlationId: "correlation_3", receipt: templateReceipt(3, "provider_approved"), now: NOW })).toMatchObject({ status: "regressive", providerVersion: 4, providerState: "paused" });
  });

  it("forbids automatic resend and requires explicit dispatch reconciliation", async () => {
    let calls = 0;
    const repository = {
      reconcileOutbound: async () => { calls += 1; return { status: "not_found" as const }; },
    } as unknown as MemoryCommunicationsRepository;
    expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW, automaticResend: true })).toEqual({ status: "manual_review", code: "automatic_resend_forbidden" });
    expect(calls).toBe(0);
    expect(await reconcileUnknownDispatch({ repository, commandId: "command_1", attemptId: "attempt_1", now: NOW })).toEqual({ status: "not_found" });
    expect(calls).toBe(1);
  });

  it("bounds recovery discovery and marks ambiguous outbound work manual-only", async () => {
    const repository = {
      findRecoveryWork: async () => [
        { kind: "outbound_dispatch_unknown" as const, commandId: "command_1", attemptId: "attempt_1" },
        { kind: "outbound_lease_expired" as const, commandId: "command_2", attemptId: "attempt_2" },
        { kind: "inbound_lease_expired" as const, eventId: "event_retry", attempts: 1 },
        { kind: "inbound_lease_expired" as const, eventId: "event_exhausted", attempts: 3 },
      ],
    } as unknown as MemoryCommunicationsRepository;
    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 11 })).toEqual({ status: "rejected", code: "inbound_retry_limit_invalid" });
    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4, maxInboundAttempts: 3 })).toEqual({
      status: "completed",
      code: "recovery_work_found",
      work: [
        { kind: "outbound_dispatch_unknown", commandId: "command_1", attemptId: "attempt_1", disposition: "manual_review", terminal: true },
        { kind: "outbound_lease_expired", commandId: "command_2", attemptId: "attempt_2", disposition: "manual_review", terminal: true },
        { kind: "inbound_lease_expired", eventId: "event_retry", attempts: 1, disposition: "retry_allowed", terminal: false },
        { kind: "inbound_lease_expired", eventId: "event_exhausted", attempts: 3, disposition: "dead_letter", terminal: true },
      ],
    });
  });
});
