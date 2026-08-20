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
    secondaryBindingId: `binding_secondary_${id}`,
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
  const binding = (bindingId: string) => ({
    bindingId,
    channel: "whatsapp" as const,
    trustState: "reverified" as const,
    freshUntil: CONFORMANCE_TOMORROW,
    createdAt: CONFORMANCE_NOW,
    updatedAt: CONFORMANCE_NOW,
  });
  const policy = (bindingId: string, discriminator: string) => ({
    policyId: `policy_${discriminator}_${suffix(scenario)}`,
    bindingId,
    state: "normal" as const,
    version: 7,
    fence: 42,
    updatedAt: CONFORMANCE_NOW,
  });
  const consent = (
    bindingId: string,
    discriminator: string,
    purpose: "transactional" | "service" = "transactional",
  ) => ({
    bindingId,
    purpose,
    state: "granted" as const,
    version: 1,
    receipt: {
      receiptId: `consent_${discriminator}_${purpose}_${suffix(scenario)}`,
      owner: "consent" as const,
      operation: "consent_confirmation" as const,
      bindingId,
      issuedAt: CONFORMANCE_NOW,
      expiresAt: CONFORMANCE_TOMORROW,
    },
    authorityReceiptId: `consent_${discriminator}_${purpose}_${suffix(scenario)}`,
    changedAt: CONFORMANCE_NOW,
  });
  return {
    bindings: [binding(value.bindingId), binding(value.secondaryBindingId)],
    policies: [policy(value.bindingId, "primary"), policy(value.secondaryBindingId, "secondary")],
    consents: [
      consent(value.bindingId, "primary"),
      consent(value.bindingId, "primary", "service"),
      consent(value.secondaryBindingId, "secondary"),
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

async function queueOutbound(
  repository: CommunicationsRepository,
  scenario: string,
  policy = { version: 7, fence: 42 },
) {
  const value = communicationsConformanceIds(scenario);
  const templateId = `template_${suffix(scenario)}`;
  await repository.acceptInbound(inbound(scenario));
  const draft = {
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
  } as const;
  const created = await repository.createOutbound(draft);
  expect(created).toEqual({
    status: "created",
    commandId: value.commandId,
    messageId: value.outboundMessageId,
  });
  await expect(
    repository.finalizeOutbound({
      commandId: value.commandId,
      fingerprint: "c".repeat(64),
      requiredPolicyVersion: policy.version,
      requiredFence: policy.fence,
      endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
      authorizationReceipt: {
        receiptId: `dispatch_${suffix(scenario)}`,
        owner: "communications",
        operation: "outbound_dispatch",
        bindingId: value.bindingId,
        destinationKey: `endpoint_ref:${"b".repeat(64)}`,
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

    it("allocates distinct inbound ordinals and rejects cross-binding provider replay", async () => {
      await withHarness(factory, `${label}-inbound-order`, async ({ repository, inspectState }) => {
        const scenario = `${label}-inbound-order`;
        const first = inbound(scenario);
        const second = structuredClone(first);
        second.providerEventId = `meta_evt_${suffix(`${scenario}-second`).repeat(2)}`;
        second.providerBodyDigest = "d".repeat(64);
        second.envelope.event.eventId = `event_${suffix(`${scenario}-second`)}`;
        second.envelope.event.messageId = `message_${suffix(`${scenario}-second`)}`;
        second.envelope.message.id = second.envelope.event.messageId;
        await expect(Promise.all([repository.acceptInbound(first), repository.acceptInbound(second)]))
          .resolves.toEqual([
            expect.objectContaining({ status: "accepted" }),
            expect.objectContaining({ status: "accepted" }),
          ]);
        const crossBinding = structuredClone(first);
        crossBinding.envelope.event.bindingId = communicationsConformanceIds(scenario).secondaryBindingId;
        crossBinding.envelope.participant.bindingId = crossBinding.envelope.event.bindingId;
        await expect(repository.acceptInbound(crossBinding)).resolves.toEqual({
          status: "replay_mismatch",
          code: "provider_replay_mismatch",
        });
        if (inspectState) {
          const state = await inspectState();
          expect(state.inbound.map((row) => row.ordinal).sort()).toEqual([1, 2]);
        }
      });
    });

    it("uses zero-based persisted inbound versions and increments every lease claim", async () => {
      await withHarness(factory, `${label}-inbound-versions`, async ({ repository, inspectState }) => {
        const scenario = `${label}-inbound-versions`;
        const command = inbound(scenario);
        await expect(repository.acceptInbound(command)).resolves.toMatchObject({ status: "accepted" });
        if (inspectState) {
          expect((await inspectState()).inbound).toContainEqual(
            expect.objectContaining({ eventId: command.envelope.event.eventId, leaseVersion: 0 }),
          );
        }
        await expect(repository.claimInbound({
          eventId: command.envelope.event.eventId,
          leaseOwner: "first-owner",
          leaseExpiresAt: CONFORMANCE_LEASE_END,
          now: CONFORMANCE_NOW,
          requiredPolicyVersion: 7,
        })).resolves.toMatchObject({ status: "claimed", leaseVersion: 1 });
        const reclaimNow = new Date(CONFORMANCE_LEASE_END.getTime() + 1);
        await expect(repository.claimInbound({
          eventId: command.envelope.event.eventId,
          leaseOwner: "second-owner",
          leaseExpiresAt: new Date(reclaimNow.getTime() + 60_000),
          now: reclaimNow,
          requiredPolicyVersion: 7,
        })).resolves.toMatchObject({ status: "claimed", leaseVersion: 2 });
      });
    });

    it("rejects opposite cross-binding provider replays without binding-lock inversion", async () => {
      await withHarness(factory, `${label}-opposite-replay`, async ({ repository }) => {
        const scenario = `${label}-opposite-replay`;
        const value = communicationsConformanceIds(scenario);
        const primary = inbound(scenario);
        const secondary = structuredClone(primary);
        secondary.providerEventId = `meta_evt_${suffix(`${scenario}-secondary`).repeat(2)}`;
        secondary.providerBodyDigest = "d".repeat(64);
        secondary.envelope.event.eventId = `event_${suffix(`${scenario}-secondary`)}`;
        secondary.envelope.event.messageId = `message_${suffix(`${scenario}-secondary`)}`;
        secondary.envelope.event.bindingId = value.secondaryBindingId;
        secondary.envelope.message.id = secondary.envelope.event.messageId;
        secondary.envelope.participant.id = `participant_${suffix(`${scenario}-secondary`)}`;
        secondary.envelope.participant.bindingId = value.secondaryBindingId;
        await repository.acceptInbound(primary);
        await repository.acceptInbound(secondary);
        const primaryAsSecondary = structuredClone(primary);
        primaryAsSecondary.envelope.event.bindingId = value.secondaryBindingId;
        primaryAsSecondary.envelope.participant.bindingId = value.secondaryBindingId;
        const secondaryAsPrimary = structuredClone(secondary);
        secondaryAsPrimary.envelope.event.bindingId = value.bindingId;
        secondaryAsPrimary.envelope.participant.bindingId = value.bindingId;
        await expect(Promise.all([
          repository.acceptInbound(primaryAsSecondary),
          repository.acceptInbound(secondaryAsPrimary),
        ])).resolves.toEqual([
          { status: "replay_mismatch", code: "provider_replay_mismatch" },
          { status: "replay_mismatch", code: "provider_replay_mismatch" },
        ]);
      });
    });

    it("uses body identity for honest outbound duplicate states and binding-scoped keys", async () => {
      await withHarness(factory, `${label}-outbound-identity`, async ({ repository }) => {
        const scenario = `${label}-outbound-identity`;
        const value = communicationsConformanceIds(scenario);
        await repository.acceptInbound(inbound(scenario));
        const draft = {
          command: {
            commandId: value.commandId,
            channel: "whatsapp" as const,
            locale: "en" as const,
            conversationId: value.conversationId,
            bindingId: value.bindingId,
            messageId: value.outboundMessageId,
            idempotencyKey: `shared_${suffix(scenario)}`,
            state: "draft" as const,
            createdAt: CONFORMANCE_NOW,
            correlationId: `correlation_out_${suffix(scenario)}`,
          },
          message: {
            id: value.outboundMessageId,
            conversationId: value.conversationId,
            channel: "whatsapp" as const,
            direction: "outbound" as const,
            senderParticipantId: `participant_system_${suffix(scenario)}`,
            recipientParticipantId: value.participantId,
            locale: "en" as const,
            kind: "text" as const,
            body: "ORIGINAL-BODY",
            createdAt: CONFORMANCE_NOW,
          },
          purpose: "transactional" as const,
          templateId: `template_${suffix(scenario)}`,
        };
        await expect(repository.createOutbound(draft)).resolves.toMatchObject({ status: "created" });
        await expect(repository.createOutbound(draft)).resolves.toMatchObject({
          status: "duplicate",
          reason: "outbound_draft_unresolved",
        });
        await expect(
          repository.createOutbound({ ...draft, message: { ...draft.message, body: "ALTERED-BODY" } }),
        ).resolves.toEqual({ status: "conflict", code: "idempotency_mismatch" });
        await expect(repository.createOutbound({
          ...draft,
          command: { ...draft.command, locale: "es" },
          message: { ...draft.message, locale: "es" },
        })).resolves.toEqual({ status: "conflict", code: "idempotency_mismatch" });
        await expect(repository.finalizeOutbound({
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
            destinationKey: `endpoint_ref:${"b".repeat(64)}`,
            issuedAt: CONFORMANCE_NOW,
            expiresAt: CONFORMANCE_TOMORROW,
          },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({ status: "created" });
        await expect(repository.createOutbound(draft)).resolves.toEqual({
          status: "duplicate",
          commandId: value.commandId,
          messageId: value.outboundMessageId,
          commandState: "queued",
        });
        const secondary = {
          ...draft,
          command: {
            ...draft.command,
            commandId: `command_secondary_${suffix(scenario)}`,
            bindingId: value.secondaryBindingId,
          },
          message: {
            ...draft.message,
            id: `message_secondary_${suffix(scenario)}`,
          },
        };
        await expect(repository.createOutbound(secondary)).resolves.toMatchObject({ status: "created" });
      });
    });

    it("serializes concurrent outbound creation to one canonical winner", async () => {
      const draftFor = (scenario: string, discriminator: string, body: string) => {
        const value = communicationsConformanceIds(scenario);
        const identity = suffix(`${scenario}-${discriminator}`);
        return {
          command: {
            commandId: `command_${identity}`,
            channel: "whatsapp" as const,
            locale: "en" as const,
            conversationId: value.conversationId,
            bindingId: value.bindingId,
            messageId: `message_${identity}`,
            idempotencyKey: `race_${suffix(scenario)}`,
            state: "draft" as const,
            createdAt: CONFORMANCE_NOW,
            correlationId: `correlation_${identity}`,
          },
          message: {
            id: `message_${identity}`,
            conversationId: value.conversationId,
            channel: "whatsapp" as const,
            direction: "outbound" as const,
            senderParticipantId: `participant_system_${suffix(scenario)}`,
            recipientParticipantId: value.participantId,
            locale: "en" as const,
            kind: "text" as const,
            body,
            createdAt: CONFORMANCE_NOW,
          },
          purpose: "transactional" as const,
          templateId: `template_${suffix(scenario)}`,
        };
      };
      await withHarness(factory, `${label}-outbound-race-same`, async ({ repository, inspectState }) => {
        const scenario = `${label}-outbound-race-same`;
        await repository.acceptInbound(inbound(scenario));
        const draft = draftFor(scenario, "same", "SAME-BODY");
        const results = await Promise.all([
          repository.createOutbound(draft),
          repository.createOutbound(structuredClone(draft)),
        ]);
        expect(results.map((result) => result.status).sort()).toEqual(["created", "duplicate"]);
        if (inspectState) {
          expect((await inspectState()).outbound).toEqual([
            expect.objectContaining({ commandId: draft.command.commandId, state: "draft" }),
          ]);
        }
      });
      await withHarness(factory, `${label}-outbound-race-altered`, async ({ repository, inspectState }) => {
        const scenario = `${label}-outbound-race-altered`;
        await repository.acceptInbound(inbound(scenario));
        const first = draftFor(scenario, "first", "FIRST-BODY");
        const second = draftFor(scenario, "second", "SECOND-BODY");
        const results = await Promise.all([
          repository.createOutbound(first),
          repository.createOutbound(second),
        ]);
        expect(results.map((result) => result.status).sort()).toEqual(["conflict", "created"]);
        if (inspectState) {
          const state = await inspectState();
          expect(state.outbound).toHaveLength(1);
          expect([first.command.commandId, second.command.commandId]).toContain(
            state.outbound[0]?.commandId,
          );
        }
      });
    });

    it("round-trips failure and unknown outcomes and applies provider statuses idempotently", async () => {
      for (const outcome of ["known_failure", "unknown"] as const) {
        await withHarness(factory, `${label}-outcome-${outcome}`, async ({ repository, inspectState }) => {
          const scenario = `${label}-outcome-${outcome}`;
          const value = await queueOutbound(repository, scenario);
          const attemptId = `attempt_${suffix(scenario)}`;
          const claimed = await repository.claimOutbound({
            commandId: value.commandId,
            attemptId,
            leaseOwner: "outcome-owner",
            leaseExpiresAt: CONFORMANCE_LEASE_END,
            now: CONFORMANCE_NOW,
          });
          if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
          await expect(repository.markDispatchOutcome({
            commandId: value.commandId,
            attemptId,
            leaseOwner: "outcome-owner",
            leaseVersion: claimed.attempt.leaseVersion,
            outcome,
            now: CONFORMANCE_NOW,
          })).resolves.toBe("completed");
          if (inspectState) {
            const attempt = (await inspectState()).attempts.find((row) => row.attemptId === attemptId);
            expect(attempt?.resultCode).toBe(outcome);
          }
        });
      }
      await withHarness(factory, `${label}-provider-status`, async ({ repository, inspectState }) => {
        const scenario = `${label}-provider-status`;
        const value = await queueOutbound(repository, scenario);
        const attemptId = `attempt_${suffix(scenario)}`;
        const claimed = await repository.claimOutbound({ commandId: value.commandId, attemptId,
          leaseOwner: "status-owner", leaseExpiresAt: CONFORMANCE_LEASE_END, now: CONFORMANCE_NOW });
        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
        await repository.markDispatchOutcome({ commandId: value.commandId, attemptId,
          leaseOwner: "status-owner", leaseVersion: claimed.attempt.leaseVersion,
          outcome: "accepted", now: CONFORMANCE_NOW });
        const status = { commandId: value.commandId, providerEventId: `status_${suffix(scenario)}`,
          status: "delivered" as const, occurredAt: CONFORMANCE_NOW };
        await expect(repository.applyProviderStatus(status)).resolves.toMatchObject({ status: "applied" });
        await expect(repository.applyProviderStatus(status)).resolves.toMatchObject({ status: "duplicate" });
        if (inspectState) expect((await inspectState()).providerStatuses).toContainEqual(status);
      });
    });

    it("advances consent provenance, persists withdrawal history, and binds template definitions", async () => {
      await withHarness(factory, `${label}-authority-history`, async ({ repository, inspectState }) => {
        const scenario = `${label}-authority-history`;
        const value = communicationsConformanceIds(scenario);
        const nextReceipt = {
          receiptId: `consent_next_${suffix(scenario)}`,
          owner: "consent" as const,
          operation: "consent_grant" as const,
          bindingId: value.bindingId,
          issuedAt: CONFORMANCE_NOW,
          expiresAt: CONFORMANCE_TOMORROW,
        };
        await expect(repository.grantConsentFromReceipt({ bindingId: value.bindingId,
          purpose: "transactional", operation: "consent_grant", receipt: nextReceipt,
          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "changed", version: 2 });
        await expect(repository.grantConsentFromReceipt({ bindingId: value.bindingId,
          purpose: "transactional", operation: "consent_grant", receipt: nextReceipt,
          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "duplicate", version: 2 });
        const accepted = inbound(scenario);
        await repository.acceptInbound(accepted);
        const inboundReceipt = { receiptId: `withdraw_${suffix(scenario)}`,
          owner: "communications" as const, operation: "inbound_opt_out" as const,
          bindingId: value.bindingId, eventId: accepted.envelope.event.eventId,
          issuedAt: CONFORMANCE_NOW, expiresAt: CONFORMANCE_TOMORROW,
          correlationId: accepted.envelope.event.correlationId };
        await expect(repository.withdrawContact({ bindingId: value.bindingId,
          evidence: { source: "inbound_event", receipt: { ...inboundReceipt, owner: "consent" as never } },
          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "denied" });
        await expect(repository.withdrawContact({ bindingId: value.bindingId,
          evidence: { source: "inbound_event", receipt: inboundReceipt }, now: CONFORMANCE_NOW }))
          .resolves.toMatchObject({ status: "changed" });
        const templateId = `template_${suffix(scenario)}`;
        await expect(repository.reconcileTemplate({ templateId, locale: "en",
          providerState: "provider_approved", providerVersion: 2,
          correlationId: `template_${suffix(scenario)}`,
          receipt: { receiptId: `template_receipt_${suffix(scenario)}`,
            owner: "communications", operation: "template_provider_reconciliation",
            templateId, locale: "en", definitionVersion: 99, providerVersion: 2,
            providerState: "provider_approved", issuedAt: CONFORMANCE_NOW,
            expiresAt: CONFORMANCE_TOMORROW, correlationId: `template_${suffix(scenario)}` },
          now: CONFORMANCE_NOW })).resolves.toEqual({ status: "denied", code: "provider_receipt_invalid" });
        if (inspectState) {
          const state = await inspectState();
          expect(state.consentHistory
            .filter((record) => record.bindingId === value.bindingId && record.purpose === "transactional")
            .slice(-2)
            .map(({ state, version, authorityReceiptId }) => ({ state, version, authorityReceiptId })))
            .toEqual([
              { state: "granted", version: 2, authorityReceiptId: nextReceipt.receiptId },
              { state: "withdrawn", version: 3, authorityReceiptId: undefined },
            ]);
          expect(state.withdrawalHistory.at(-1)).toMatchObject({
            bindingId: value.bindingId,
            source: "inbound_event",
            receiptId: inboundReceipt.receiptId,
            eventId: inboundReceipt.eventId,
          });
        }
      });
    });

    it("atomically withdraws multiple purpose histories from one contact evidence receipt", async () => {
      await withHarness(factory, `${label}-contact-withdrawal`, async ({ repository, inspectState }) => {
        const scenario = `${label}-contact-withdrawal`;
        const value = communicationsConformanceIds(scenario);
        for (const purpose of ["transactional", "service"] as const) {
          await expect(repository.grantConsentFromReceipt({
            bindingId: value.bindingId,
            purpose,
            operation: "consent_grant",
            receipt: {
              receiptId: `grant_${purpose}_${suffix(scenario)}`,
              owner: "consent",
              operation: "consent_grant",
              bindingId: value.bindingId,
              issuedAt: CONFORMANCE_NOW,
              expiresAt: CONFORMANCE_TOMORROW,
            },
            now: CONFORMANCE_NOW,
          })).resolves.toMatchObject({ status: "changed", version: 2 });
        }
        await expect(repository.grantConsentFromReceipt({
          bindingId: value.bindingId,
          purpose: "transactional",
          operation: "consent_grant",
          receipt: {
            receiptId: `grant_transactional_next_${suffix(scenario)}`,
            owner: "consent",
            operation: "consent_grant",
            bindingId: value.bindingId,
            issuedAt: CONFORMANCE_NOW,
            expiresAt: CONFORMANCE_TOMORROW,
          },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({ status: "changed", version: 3 });
        const preQueue = await repository.referenceState();
        const policy = preQueue.policies
          .filter((record) => record.bindingId === value.bindingId)
          .reduce((latest, record) => record.version > latest.version ? record : latest);
        const queued = await queueOutbound(repository, scenario, {
          version: policy.version,
          fence: policy.fence,
        });
        const receipt = {
          receiptId: `contact_withdrawal_${suffix(scenario)}`,
          owner: "consent" as const,
          operation: "contact_withdrawal" as const,
          bindingId: value.bindingId,
          issuedAt: CONFORMANCE_NOW,
          expiresAt: CONFORMANCE_TOMORROW,
          correlationId: `withdrawal_${suffix(scenario)}`,
        };
        await expect(repository.withdrawContact({
          bindingId: value.bindingId,
          evidence: { source: "authority", receipt },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({
          status: "changed",
          cancelledCommandIds: [queued.commandId],
        });
        const after = inspectState ? await inspectState() : await repository.referenceState();
        for (const [purpose, version] of [["transactional", 4], ["service", 3]] as const) {
          expect(after.consentHistory
            .filter((record) => record.bindingId === value.bindingId && record.purpose === purpose)
            .at(-1))
            .toMatchObject({
              state: "withdrawn",
              version,
              authorityReceiptId: undefined,
            });
        }
        expect(after.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
          .toEqual([
            expect.objectContaining({
              bindingId: value.bindingId,
              source: "authority",
              receiptId: receipt.receiptId,
              correlationId: receipt.correlationId,
            }),
          ]);
        expect(after.policies
          .filter((record) => record.bindingId === value.bindingId)
          .every((record) => record.state === "withdrawn"))
          .toBe(true);
        expect(after.outbound).toContainEqual(expect.objectContaining({
          commandId: queued.commandId,
          state: "cancelled",
        }));
        await expect(repository.withdrawContact({
          bindingId: value.bindingId,
          evidence: { source: "authority", receipt },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({ status: "duplicate", cancelledCommandIds: [] });
        const alteredWindowResults = await Promise.all([
          repository.withdrawContact({
            bindingId: value.bindingId,
            evidence: {
              source: "authority",
              receipt: {
                ...receipt,
                issuedAt: new Date(receipt.issuedAt.getTime() - 1),
              },
            },
            now: CONFORMANCE_NOW,
          }),
          repository.withdrawContact({
            bindingId: value.bindingId,
            evidence: {
              source: "authority",
              receipt: {
                ...receipt,
                expiresAt: new Date(receipt.expiresAt.getTime() + 1),
              },
            },
            now: CONFORMANCE_NOW,
          }),
        ]);
        expect(alteredWindowResults).toEqual([
          { status: "denied", code: "withdrawal_evidence_invalid" },
          { status: "denied", code: "withdrawal_evidence_invalid" },
        ]);
        await expect(repository.withdrawContact({
          bindingId: value.bindingId,
          evidence: {
            source: "authority",
            receipt: { ...receipt, correlationId: `${receipt.correlationId}_mismatch` },
          },
          now: CONFORMANCE_NOW,
        })).resolves.toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
        const finalState = inspectState ? await inspectState() : await repository.referenceState();
        expect(finalState.withdrawalHistory.filter((record) => record.receiptId === receipt.receiptId))
          .toHaveLength(1);
        expect(finalState.withdrawalHistory.at(-1)).toMatchObject({
          owner: receipt.owner,
          operation: receipt.operation,
          issuedAt: receipt.issuedAt,
          expiresAt: receipt.expiresAt,
        });
      });
    });

    it("owns withdrawal receipt timestamps after persistence", async () => {
      await withHarness(factory, `${label}-withdrawal-date-ownership`, async ({ repository }) => {
        const scenario = `${label}-withdrawal-date-ownership`;
        const value = communicationsConformanceIds(scenario);
        const issuedAt = new Date(CONFORMANCE_NOW.getTime());
        const expiresAt = new Date(CONFORMANCE_TOMORROW.getTime());
        const receipt = {
          receiptId: `withdrawal_date_ownership_${suffix(scenario)}`,
          owner: "consent" as const,
          operation: "contact_withdrawal" as const,
          bindingId: value.bindingId,
          issuedAt: new Date(issuedAt.getTime()),
          expiresAt: new Date(expiresAt.getTime()),
          correlationId: `withdrawal_date_ownership_${suffix(scenario)}`,
        };
        await expect(repository.withdrawContact({
          bindingId: value.bindingId,
          evidence: { source: "authority", receipt },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({ status: "changed" });

        receipt.issuedAt.setTime(receipt.issuedAt.getTime() - 1);
        receipt.expiresAt.setTime(receipt.expiresAt.getTime() + 1);

        await expect(repository.withdrawContact({
          bindingId: value.bindingId,
          evidence: {
            source: "authority",
            receipt: {
              ...receipt,
              issuedAt,
              expiresAt,
            },
          },
          now: CONFORMANCE_NOW,
        })).resolves.toMatchObject({ status: "duplicate" });
        const storedState = await repository.referenceState();
        expect(storedState).toMatchObject({
          withdrawalHistory: [
            expect.objectContaining({
              receiptId: receipt.receiptId,
              issuedAt,
              expiresAt,
            }),
          ],
        });
      });
    });
  });
}
