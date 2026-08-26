import {
  expireChannelRecoveryState,
  MemoryCommunicationsRepository,
  reconcileMessageTemplate,
  reconcileUnknownDispatch,
} from "@atlas/domain";
import { describe, expect, it } from "vitest";

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
      templates: [
        {
          templateId: "template_1",
          locale: "en",
          definitionVersion: 1,
          internallyApproved: true,
          providerState: "provider_approved",
          providerVersion: 3,
          updatedAt: NOW,
        },
      ],
    });
    expect(
      await reconcileMessageTemplate({
        repository,
        capability: { templateProjection: false },
        templateId: "template_1",
        locale: "en",
        providerState: "paused",
        providerVersion: 4,
        correlationId: "correlation_4",
        receipt: templateReceipt(4, "paused"),
        now: NOW,
      }),
    ).toEqual({ status: "manual_review", code: "template_reconciliation_unsupported" });
    expect(
      await reconcileMessageTemplate({
        repository,
        capability: { templateProjection: true },
        templateId: "template_1",
        locale: "en",
        providerState: "paused",
        providerVersion: 4,
        correlationId: "correlation_4",
        receipt: templateReceipt(4, "paused"),
        now: NOW,
      }),
    ).toMatchObject({ status: "applied", providerVersion: 4, providerState: "paused" });
    expect(
      await reconcileMessageTemplate({
        repository,
        capability: { templateProjection: true },
        templateId: "template_1",
        locale: "en",
        providerState: "provider_approved",
        providerVersion: 3,
        correlationId: "correlation_3",
        receipt: templateReceipt(3, "provider_approved"),
        now: NOW,
      }),
    ).toMatchObject({ status: "regressive", providerVersion: 4, providerState: "paused" });
  });

  it("forbids automatic resend and requires explicit dispatch reconciliation", async () => {
    let calls = 0;
    const repository = {
      reconcileOutbound: async () => {
        calls += 1;
        return { status: "not_found" as const };
      },
    } as unknown as MemoryCommunicationsRepository;
    expect(
      await reconcileUnknownDispatch({
        repository,
        commandId: "command_1",
        attemptId: "attempt_1",
        now: NOW,
        automaticResend: true,
      }),
    ).toEqual({ status: "manual_review", code: "automatic_resend_forbidden" });
    expect(calls).toBe(0);
    expect(
      await reconcileUnknownDispatch({
        repository,
        commandId: "command_1",
        attemptId: "attempt_1",
        now: NOW,
      }),
    ).toEqual({ status: "not_found" });
    expect(calls).toBe(1);
  });

  it("bounds recovery discovery and marks ambiguous outbound work manual-only", async () => {
    const repository = {
      findRecoveryWork: async () => [
        {
          kind: "outbound_dispatch_unknown" as const,
          commandId: "command_1",
          attemptId: "attempt_1",
        },
        { kind: "outbound_lease_expired" as const, commandId: "command_2", attemptId: "attempt_2" },
        { kind: "inbound_lease_expired" as const, eventId: "event_retry", attempts: 1 },
        { kind: "inbound_lease_expired" as const, eventId: "event_exhausted", attempts: 3 },
      ],
      deadLetterExpiredInbound: async () => ({ status: "dead_lettered" as const }),
    } as unknown as MemoryCommunicationsRepository;
    expect(await expireChannelRecoveryState({ repository, now: NOW, limit: 4 })).toEqual({
      status: "completed",
      code: "recovery_work_found",
      work: [
        {
          kind: "outbound_dispatch_unknown",
          commandId: "command_1",
          attemptId: "attempt_1",
          disposition: "manual_review",
          terminal: true,
        },
        {
          kind: "outbound_lease_expired",
          commandId: "command_2",
          attemptId: "attempt_2",
          disposition: "manual_review",
          terminal: true,
        },
        {
          kind: "inbound_lease_expired",
          eventId: "event_retry",
          attempts: 1,
          disposition: "retry_allowed",
          terminal: false,
        },
        {
          kind: "inbound_lease_expired",
          eventId: "event_exhausted",
          attempts: 3,
          disposition: "dead_letter",
          terminal: true,
        },
      ],
    });
  });

  it("persists exhausted inbound recovery once and never reopens it under a later higher caller limit", async () => {
    const repository = new MemoryCommunicationsRepository({
      policies: [
        {
          policyId: "policy_recovery",
          bindingId: "binding_recovery",
          state: "normal",
          version: 7,
          fence: 1,
          updatedAt: NOW,
        },
      ],
    });
    await repository.acceptInbound({
      connectionId: "connection_recovery",
      providerEventId: "provider_event_recovery",
      providerBodyDigest: "body_digest_recovery",
      endpointDigests: [{ version: "v1", digest: "endpoint_digest_recovery" }],
      optOutSignal: "none",
      envelope: {
        event: {
          eventId: "event_recovery",
          channel: "whatsapp",
          locale: "en",
          connectionState: "active",
          bindingId: "binding_recovery",
          conversationId: "conversation_recovery",
          messageId: "message_recovery",
          receivedAt: NOW,
          state: "persisted",
          correlationId: "correlation_recovery",
        },
        conversation: {
          id: "conversation_recovery",
          channel: "whatsapp",
          locale: "en",
          status: "new",
          participantIds: ["participant_recovery"],
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
          lastActivityAt: NOW,
        },
        participant: {
          participantId: "participant_recovery",
          conversationId: "conversation_recovery",
          bindingId: "binding_recovery",
          role: "external_contact",
          createdAt: NOW,
        },
        message: {
          id: "message_recovery",
          conversationId: "conversation_recovery",
          channel: "whatsapp",
          direction: "inbound",
          senderParticipantId: "participant_recovery",
          locale: "en",
          kind: "text",
          body: "Synthetic recovery input",
          createdAt: NOW,
        },
      },
    });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const claimAt = new Date(NOW.getTime() + attempt * 120_000);
      await expect(
        repository.claimInbound({
          eventId: "event_recovery",
          leaseOwner: `worker_${attempt}`,
          leaseExpiresAt: new Date(claimAt.getTime() + 60_000),
          now: claimAt,
          requiredPolicyVersion: 7,
        }),
      ).resolves.toMatchObject({ status: "claimed", leaseVersion: attempt + 1 });
    }

    const expiredAt = new Date(NOW.getTime() + 6 * 60_000);
    await expect(
      expireChannelRecoveryState({ repository, now: expiredAt, limit: 10 }),
    ).resolves.toMatchObject({
      status: "completed",
      work: [
        { eventId: "event_recovery", attempts: 3, disposition: "dead_letter", terminal: true },
      ],
    });
    expect(repository.referenceState().inbound[0]).toMatchObject({
      eventId: "event_recovery",
      state: "dead_letter",
      leaseVersion: 4,
    });

    await expect(
      (expireChannelRecoveryState as (input: Record<string, unknown>) => Promise<unknown>)({
        repository,
        now: new Date(expiredAt.getTime() + 60_000),
        limit: 10,
        maxInboundAttempts: 99,
      }),
    ).resolves.toEqual({ status: "completed", code: "no_recovery_work", work: [] });
  });
});
