import { createHash } from "node:crypto";
import type {
  CommunicationsReferenceState,
  CommunicationsRepository,
  CommunicationsSeed,
} from "@atlas/domain";
import { describe, expect, it } from "vitest";

export type CommunicationsRepositoryHarness = {
  repository: CommunicationsRepository;
  inspectState?: () => Promise<CommunicationsReferenceState> | CommunicationsReferenceState;
  close?: () => Promise<void>;
};

export type CommunicationsRepositoryHarnessFactory = (
  scenario: string,
) => Promise<CommunicationsRepositoryHarness>;

export const CONFORMANCE_NOW = new Date("2026-08-20T12:00:00.000Z");
export const CONFORMANCE_LEASE_END = new Date(CONFORMANCE_NOW.getTime() + 60_000);
export const CONFORMANCE_TOMORROW = new Date("2026-08-21T12:00:00.000Z");

function suffix(scenario: string): string {
  return createHash("sha256").update(scenario).digest("hex").slice(0, 16);
}

export function communicationsConformanceIds(scenario: string) {
  const id = suffix(scenario);
  return {
    bindingId: `binding_${id}`,
    commandId: `command_${id}`,
    connectionId: `connection_${id}`,
    conversationId: `conversation_${id}`,
    eventId: `event_${id}`,
    messageId: `message_${id}`,
    outboundMessageId: `outbound_message_${id}`,
    participantId: `participant_${id}`,
    providerEventId: `meta_evt_${id}${id}`,
  };
}

export function communicationsConformanceSeed(scenario: string): CommunicationsSeed {
  const value = communicationsConformanceIds(scenario);
  return {
    bindings: [
      {
        bindingId: value.bindingId,
        channel: "whatsapp",
        trustState: "reverified",
        freshUntil: CONFORMANCE_TOMORROW,
        createdAt: CONFORMANCE_NOW,
        updatedAt: CONFORMANCE_NOW,
      },
    ],
    policies: [
      {
        policyId: `policy_${suffix(scenario)}`,
        bindingId: value.bindingId,
        state: "normal",
        version: 7,
        fence: 42,
        updatedAt: CONFORMANCE_NOW,
      },
    ],
    consents: [
      {
        bindingId: value.bindingId,
        purpose: "transactional",
        state: "granted",
        version: 1,
        receipt: {
          receiptId: `consent_${suffix(scenario)}`,
          owner: "consent",
          operation: "consent_confirmation",
          bindingId: value.bindingId,
          issuedAt: CONFORMANCE_NOW,
          expiresAt: CONFORMANCE_TOMORROW,
        },
        changedAt: CONFORMANCE_NOW,
      },
    ],
    connections: [{ channel: "whatsapp", state: "active" }],
    templates: [
      {
        templateId: `template_${suffix(scenario)}`,
        locale: "en",
        definitionVersion: 1,
        internallyApproved: true,
        providerState: "provider_approved",
        providerVersion: 1,
        updatedAt: CONFORMANCE_NOW,
      },
    ],
  };
}

function inbound(scenario: string, optOutSignal: "none" | "pending" = "none") {
  const value = communicationsConformanceIds(scenario);
  return {
    connectionId: value.connectionId,
    providerEventId: value.providerEventId,
    providerBodyDigest: "a".repeat(64),
    endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
    optOutSignal,
    envelope: {
      event: {
        eventId: value.eventId,
        channel: "whatsapp" as const,
        locale: "en" as const,
        connectionState: "active" as const,
        bindingId: value.bindingId,
        conversationId: value.conversationId,
        messageId: value.messageId,
        receivedAt: CONFORMANCE_NOW,
        state: "persisted" as const,
        correlationId: `correlation_${suffix(scenario)}`,
      },
      conversation: {
        id: value.conversationId,
        channel: "whatsapp" as const,
        locale: "en" as const,
        status: "new" as const,
        participantIds: [value.participantId],
        version: 1,
        createdAt: CONFORMANCE_NOW,
        updatedAt: CONFORMANCE_NOW,
        lastActivityAt: CONFORMANCE_NOW,
      },
      participant: {
        participantId: value.participantId,
        conversationId: value.conversationId,
        bindingId: value.bindingId,
        role: "external_contact" as const,
        createdAt: CONFORMANCE_NOW,
      },
      message: {
        id: value.messageId,
        conversationId: value.conversationId,
        channel: "whatsapp" as const,
        direction: "inbound" as const,
        senderParticipantId: value.participantId,
        locale: "en" as const,
        kind: "text" as const,
        body: "SYNTHETIC-CONFORMANCE-PLAINTEXT-MUST-NOT-PERSIST",
        createdAt: CONFORMANCE_NOW,
      },
    },
  };
}

async function withHarness<T>(
  factory: CommunicationsRepositoryHarnessFactory,
  scenario: string,
  work: (harness: CommunicationsRepositoryHarness) => Promise<T>,
): Promise<T> {
  const harness = await factory(scenario);
  try {
    return await work(harness);
  } finally {
    await harness.close?.();
  }
}

async function queueOutbound(repository: CommunicationsRepository, scenario: string) {
  const value = communicationsConformanceIds(scenario);
  const templateId = `template_${suffix(scenario)}`;
  await repository.acceptInbound(inbound(scenario));
  const created = await repository.createOutbound({
    command: {
      commandId: value.commandId,
      channel: "whatsapp",
      locale: "en",
      conversationId: value.conversationId,
      bindingId: value.bindingId,
      messageId: value.outboundMessageId,
      idempotencyKey: `idempotency_${suffix(scenario)}`,
      state: "draft",
      createdAt: CONFORMANCE_NOW,
      correlationId: `correlation_out_${suffix(scenario)}`,
    },
    message: {
      id: value.outboundMessageId,
      conversationId: value.conversationId,
      channel: "whatsapp",
      direction: "outbound",
      senderParticipantId: `participant_system_${suffix(scenario)}`,
      recipientParticipantId: value.participantId,
      locale: "en",
      kind: "text",
      body: "SYNTHETIC-OUTBOUND-PLAINTEXT-MUST-NOT-PERSIST",
      createdAt: CONFORMANCE_NOW,
    },
    purpose: "transactional",
    templateId,
  });
  expect(created).toEqual({
    status: "created",
    commandId: value.commandId,
    messageId: value.outboundMessageId,
  });
  await expect(
    repository.finalizeOutbound({
      commandId: value.commandId,
      fingerprint: "c".repeat(64),
      requiredPolicyVersion: 7,
      requiredFence: 42,
      endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
      authorizationReceipt: {
        receiptId: `dispatch_${suffix(scenario)}`,
        owner: "communications",
        operation: "outbound_dispatch",
        bindingId: value.bindingId,
        destinationKey: "b".repeat(64),
        issuedAt: CONFORMANCE_NOW,
        expiresAt: CONFORMANCE_TOMORROW,
      },
      now: CONFORMANCE_NOW,
    }),
  ).resolves.toMatchObject({ status: "created", commandId: value.commandId });
  return value;
}

export function runCommunicationsRepositoryConformance(
  label: string,
  factory: CommunicationsRepositoryHarnessFactory,
  enabled = true,
): void {
  const suite = enabled ? describe : describe.skip;
  suite(`${label} communications repository conformance`, () => {
    it("atomically accepts metadata-only inbound, replays exact duplicates, and fences opt-out", async () => {
      await withHarness(factory, `${label}-accept`, async ({ repository, inspectState }) => {
        const command = inbound(`${label}-accept`, "pending");
        await expect(repository.acceptInbound(command)).resolves.toMatchObject({
          status: "accepted",
          eventId: command.envelope.event.eventId,
          endpointDigestVersion: "endpoint.v1",
          endpointDigest: "b".repeat(64),
        });
        await expect(repository.acceptInbound(command)).resolves.toMatchObject({
          status: "duplicate",
          eventId: command.envelope.event.eventId,
        });
        await expect(
          repository.acceptInbound({ ...command, providerBodyDigest: "d".repeat(64) }),
        ).resolves.toEqual({
          status: "replay_mismatch",
          code: "provider_replay_mismatch",
        });
        const claim = await repository.claimInbound({
          eventId: command.envelope.event.eventId,
          leaseOwner: "inbound-owner-secret",
          leaseExpiresAt: CONFORMANCE_LEASE_END,
          now: CONFORMANCE_NOW,
          requiredPolicyVersion: 8,
        });
        expect(claim).toMatchObject({ status: "claimed", policyState: "opt_out_pending" });
        if (inspectState) {
          const serialized = JSON.stringify(await inspectState());
          expect(serialized).not.toContain("SYNTHETIC-CONFORMANCE-PLAINTEXT-MUST-NOT-PERSIST");
          expect(serialized).not.toContain("inbound-owner-secret");
        }
      });
    });

    it("rejects non-finite, inactive, and overlong leases before claiming work", async () => {
      for (const [caseName, leaseExpiresAt] of [
        ["non-finite", new Date(Number.NaN)],
        ["inactive", CONFORMANCE_NOW],
        ["overlong", new Date(CONFORMANCE_NOW.getTime() + 15 * 60_000 + 1)],
      ] as const) {
        await withHarness(factory, `${label}-lease-${caseName}`, async ({ repository }) => {
          const command = inbound(`${label}-lease-${caseName}`);
          await repository.acceptInbound(command);
          await expect(
            repository.claimInbound({
              eventId: command.envelope.event.eventId,
              leaseOwner: "bounded-owner-secret",
              leaseExpiresAt,
              now: CONFORMANCE_NOW,
              requiredPolicyVersion: 7,
            }),
          ).resolves.toEqual({ status: "not_claimed", code: "lease_conflict" });
        });
      }
    });

    it("requires the active lease owner and optimistic version for inbound completion", async () => {
      await withHarness(factory, `${label}-completion`, async ({ repository }) => {
        const command = inbound(`${label}-completion`);
        await repository.acceptInbound(command);
        const claimed = await repository.claimInbound({
          eventId: command.envelope.event.eventId,
          leaseOwner: "inbound-owner-secret",
          leaseExpiresAt: CONFORMANCE_LEASE_END,
          now: CONFORMANCE_NOW,
          requiredPolicyVersion: 7,
        });
        expect(claimed.status).toBe("claimed");
        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_INBOUND_NOT_CLAIMED");
        await expect(
          repository.completeInbound({
            eventId: command.envelope.event.eventId,
            leaseOwner: "wrong-owner-secret",
            leaseVersion: claimed.leaseVersion,
            outcome: "applied",
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toBe("conflict");
        await expect(
          repository.completeInbound({
            eventId: command.envelope.event.eventId,
            leaseOwner: "inbound-owner-secret",
            leaseVersion: claimed.leaseVersion + 1,
            outcome: "applied",
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toBe("conflict");
        await expect(
          repository.completeInbound({
            eventId: command.envelope.event.eventId,
            leaseOwner: "inbound-owner-secret",
            leaseVersion: claimed.leaseVersion,
            outcome: "applied",
            now: CONFORMANCE_LEASE_END,
          }),
        ).resolves.toBe("conflict");
        await expect(
          repository.completeInbound({
            eventId: command.envelope.event.eventId,
            leaseOwner: "inbound-owner-secret",
            leaseVersion: claimed.leaseVersion,
            outcome: "applied",
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toBe("completed");
      });
    });

    it("creates one durable attempt, stores no raw lease/provider/body values, and completes once", async () => {
      await withHarness(factory, `${label}-dispatch`, async ({ repository, inspectState }) => {
        const scenario = `${label}-dispatch`;
        const value = await queueOutbound(repository, scenario);
        const claimed = await repository.claimOutbound({
          commandId: value.commandId,
          attemptId: `attempt_${suffix(scenario)}`,
          leaseOwner: "outbound-owner-secret",
          leaseExpiresAt: CONFORMANCE_LEASE_END,
          now: CONFORMANCE_NOW,
        });
        expect(claimed).toMatchObject({ status: "claimed", attempt: { ordinal: 1, leaseVersion: 1 } });
        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
        await expect(
          repository.markDispatchOutcome({
            commandId: value.commandId,
            attemptId: claimed.attempt.attemptId,
            leaseOwner: "outbound-owner-secret",
            leaseVersion: claimed.attempt.leaseVersion,
            outcome: "accepted",
            providerReference: "RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST",
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toBe("completed");
        await expect(
          repository.markDispatchOutcome({
            commandId: value.commandId,
            attemptId: claimed.attempt.attemptId,
            leaseOwner: "outbound-owner-secret",
            leaseVersion: claimed.attempt.leaseVersion,
            outcome: "accepted",
            providerReference: "RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST",
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toBe("completed");
        if (inspectState) {
          const serialized = JSON.stringify(await inspectState());
          expect(serialized).not.toContain("SYNTHETIC-OUTBOUND-PLAINTEXT-MUST-NOT-PERSIST");
          expect(serialized).not.toContain("outbound-owner-secret");
          expect(serialized).not.toContain("RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST");
        }
      });
    });

    it("rechecks the current binding policy before creating a dispatch attempt", async () => {
      await withHarness(factory, `${label}-policy-fence`, async ({ repository, inspectState }) => {
        const scenario = `${label}-policy-fence`;
        const value = await queueOutbound(repository, scenario);
        await repository.withdrawContact({
          bindingId: value.bindingId,
          now: CONFORMANCE_NOW,
          evidence: {
            source: "authority",
            receipt: {
              receiptId: `withdrawal_${suffix(scenario)}`,
              owner: "consent",
              operation: "contact_withdrawal",
              bindingId: value.bindingId,
              issuedAt: CONFORMANCE_NOW,
              expiresAt: CONFORMANCE_TOMORROW,
              correlationId: `withdrawal_correlation_${suffix(scenario)}`,
            },
          },
        });
        await expect(
          repository.claimOutbound({
            commandId: value.commandId,
            attemptId: `attempt_${suffix(scenario)}`,
            leaseOwner: "outbound-owner-secret",
            leaseExpiresAt: CONFORMANCE_LEASE_END,
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toEqual({ status: "not_claimed", code: "contact_policy_denied" });
        if (inspectState) {
          expect((await inspectState()).attempts).toHaveLength(0);
        }
      });
    });

    it("binds reconciliation receipts to the exact command and attempt", async () => {
      await withHarness(factory, `${label}-reconciliation`, async ({ repository }) => {
        const scenario = `${label}-reconciliation`;
        const value = await queueOutbound(repository, scenario);
        const attemptId = `attempt_${suffix(scenario)}`;
        const claimed = await repository.claimOutbound({
          commandId: value.commandId,
          attemptId,
          leaseOwner: "outbound-owner-secret",
          leaseExpiresAt: CONFORMANCE_LEASE_END,
          now: CONFORMANCE_NOW,
        });
        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
        await repository.markDispatchOutcome({
          commandId: value.commandId,
          attemptId,
          leaseOwner: "outbound-owner-secret",
          leaseVersion: claimed.attempt.leaseVersion,
          outcome: "unknown",
          now: CONFORMANCE_NOW,
        });
        const receipt = {
          receiptId: `reconcile_${suffix(scenario)}`,
          owner: "communications" as const,
          operation: "dispatch_reconciliation" as const,
          source: "provider_lookup" as const,
          bindingId: value.bindingId,
          commandId: value.commandId,
          attemptId,
          outcome: "confirmed_not_sent" as const,
          issuedAt: CONFORMANCE_NOW,
          expiresAt: CONFORMANCE_TOMORROW,
          correlationId: `correlation_out_${suffix(scenario)}`,
        };
        await expect(
          repository.reconcileOutbound({
            commandId: value.commandId,
            attemptId,
            receipt: { ...receipt, attemptId: "attempt_wrong" },
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toMatchObject({ status: "denied", code: "reconciliation_receipt_invalid" });
        await expect(
          repository.reconcileOutbound({
            commandId: value.commandId,
            attemptId,
            receipt,
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toEqual({ status: "reconciled", commandState: "confirmed_not_sent" });
        await expect(
          repository.reconcileOutbound({
            commandId: value.commandId,
            attemptId,
            receipt,
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toEqual({ status: "duplicate", commandState: "confirmed_not_sent" });
        await expect(
          repository.reconcileOutbound({
            commandId: value.commandId,
            attemptId,
            receipt: { ...receipt, outcome: "terminal_failure" },
            now: CONFORMANCE_NOW,
          }),
        ).resolves.toEqual({ status: "conflict", code: "reconciliation_receipt_mismatch" });
      });
    });
  });
}
