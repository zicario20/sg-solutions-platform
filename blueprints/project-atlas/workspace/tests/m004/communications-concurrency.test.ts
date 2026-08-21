import { describe, expect, it } from "vitest";
import * as communicationsModule from "../../packages/domain/src/communications/index.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const LATER = new Date("2026-08-20T12:05:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

type RuntimeApi = {
  MemoryCommunicationsRepository: new (options?: Record<string, unknown>) => any;
  CommunicationsService: new (dependencies: Record<string, unknown>) => any;
  processInboundChannelEvent: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  createVerifiedProviderStatusReceiptAuthority: (options?: Record<string, unknown>) => any;
};

function runtimeApi(): RuntimeApi {
  expect(communicationsModule).toHaveProperty("MemoryCommunicationsRepository");
  expect(communicationsModule).toHaveProperty("CommunicationsService");
  expect(communicationsModule).toHaveProperty("processInboundChannelEvent");
  expect(communicationsModule).toHaveProperty("createVerifiedProviderStatusReceiptAuthority");
  return communicationsModule as unknown as RuntimeApi;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function validWithdrawalEvidence(issuedAt = NOW) {
  return {
    source: "authority",
    receipt: {
      receiptId: "receipt_withdrawal_1",
      owner: "consent",
      operation: "contact_withdrawal",
      bindingId: "binding_1",
      issuedAt,
      expiresAt: TOMORROW,
      correlationId: "withdrawal_correlation_1",
    },
  };
}

function reconciliationReceipt(input: {
  commandId: string;
  attemptId: string;
  outcome: "reconciled_accepted" | "confirmed_not_sent" | "terminal_failure";
  source?: "provider_lookup" | "manual_authority";
  receiptId?: string;
  bindingId?: string;
  correlationId?: string;
}) {
  return {
    receiptId: input.receiptId ?? `receipt_reconcile_${input.outcome}`,
    owner: "communications",
    operation: "dispatch_reconciliation",
    source: input.source ?? "provider_lookup",
    bindingId: input.bindingId ?? "binding_1",
    commandId: input.commandId,
    attemptId: input.attemptId,
    outcome: input.outcome,
    issuedAt: NOW,
    expiresAt: TOMORROW,
    correlationId: input.correlationId ?? "correlation_out_1",
  };
}

function repositoryOptions(overrides: Record<string, unknown> = {}) {
  return {
    bindings: [
      {
        bindingId: "binding_1",
        channel: "whatsapp",
        trustState: "reverified",
        freshUntil: TOMORROW,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    policies: [
      {
        policyId: "policy_1",
        bindingId: "binding_1",
        state: "normal",
        version: 7,
        fence: 42,
        updatedAt: NOW,
      },
    ],
    consents: [
      {
        bindingId: "binding_1",
        purpose: "transactional",
        state: "granted",
        version: 1,
        receipt: {
          receiptId: "consent_receipt_1",
          owner: "consent",
          operation: "consent_confirmation",
          bindingId: "binding_1",
          issuedAt: NOW,
          expiresAt: TOMORROW,
        },
        changedAt: NOW,
      },
    ],
    connections: [{ channel: "whatsapp", state: "active" }],
    templates: [
      {
        templateId: "template_1",
        locale: "en",
        definitionVersion: 1,
        internallyApproved: true,
        providerState: "provider_approved",
        providerVersion: 1,
        updatedAt: NOW,
      },
    ],
    ...overrides,
  };
}

function createRepository(overrides: Record<string, unknown> = {}) {
  const { MemoryCommunicationsRepository, createVerifiedProviderStatusReceiptAuthority } = runtimeApi();
  const authority = createVerifiedProviderStatusReceiptAuthority({
    nextReceiptId: (() => {
      let sequence = 0;
      return () => `provider_status_${(++sequence).toString(16).padStart(32, "0")}`;
    })(),
  });
  const repository = new MemoryCommunicationsRepository(
    repositoryOptions({ ...overrides, providerStatusReceiptResolver: authority.resolver }),
  );
  repository.issueProviderStatusReceipt = authority.issuer.issue;
  return repository;
}

function providerStatus(
  repository: any,
  commandId: string,
  attemptId: string,
  connectionId: string,
  providerEventId: string,
  status: "sent" | "delivered" | "read" | "failed",
  occurredAt: Date,
) {
  return {
    commandId,
    attemptId,
    receipt: repository.issueProviderStatusReceipt({
      connectionId,
      externalMessageReference: "provider_ref_1",
      providerEventId,
      status,
      occurredAt,
      verifiedAt: occurredAt,
      bodyDigest: "a".repeat(64),
      correlationId: "correlation_out_1",
    }),
  };
}

function validM002Receipt(correlationId: string) {
  return {
    receiptId: "m002_receipt_1",
    owner: "public_knowledge",
    source: "M002",
    sourceId: "source_1",
    sourceVersion: "v1",
    reviewVersion: "v1",
    disclosureVersion: "v1",
    issuedAt: NOW,
    expiresAt: TOMORROW,
    correlationId,
  };
}

function createService(repository: any, provider: Record<string, unknown>) {
  const { CommunicationsService } = runtimeApi();
  let id = 0;
  return new CommunicationsService({
    repository,
    clock: { now: () => NOW },
    ids: { next: (kind: string) => `${kind}_${++id}` },
    endpointDigestKeys: {
      resolve: async () => ({
        status: "available",
        active: {
          purpose: "communications_endpoint_digest",
          version: "v1",
          key: "SERVER_KEY",
        },
        prior: [],
      }),
    },
    keyedDigest: { digest: async () => "endpoint_digest_v1" },
    destinationResolver: {
      resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
    },
    boundedExecutor: {
      run: async (_operation: string, _timeoutMs: number, action: () => Promise<unknown>) =>
        action(),
    },
    provider,
    publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
    handoff: { request: async () => ({ status: "unavailable" }) },
    providerTimeoutMs: 2_000,
    knowledgeTimeoutMs: 500,
    handoffTimeoutMs: 500,
  });
}

async function queueOutbound(service: any, overrides: Record<string, unknown> = {}) {
  return service.queueOutbound({
    channel: "whatsapp",
    locale: "en",
    conversationId: "conversation_1",
    bindingId: "binding_1",
    body: "Synthetic outbound message",
    purpose: "transactional",
    templateId: "template_1",
    idempotencyKey: "outbound_key_1",
    fingerprint: "outbound_fingerprint_1",
    requiredPolicyVersion: 7,
    requiredFence: 42,
    authorizationReceipt: {
      receiptId: "dispatch_receipt_1",
      owner: "communications",
      operation: "outbound_dispatch",
      bindingId: "binding_1",
      destinationKey: "endpoint_ref:endpoint_digest_v1",
      issuedAt: NOW,
      expiresAt: TOMORROW,
    },
    correlationId: "correlation_out_1",
    ...overrides,
  });
}

describe("atomic opt-out and dispatch fencing", () => {
  it("uses a controlled binding lock so withdrawal wins before a queued dispatch claim", async () => {
    const withdrawalEntered = deferred();
    const releaseWithdrawal = deferred();
    const repository = createRepository({
      lockBoundary: async ({ operation }: { operation: string }) => {
        if (operation === "withdraw_contact") {
          withdrawalEntered.resolve();
          await releaseWithdrawal.promise;
        }
      },
    });
    let providerCalls = 0;
    const service = createService(repository, {
      dispatch: async () => {
        providerCalls += 1;
        return { status: "accepted", providerReference: "provider_ref_1" };
      },
    });
    const queued = await queueOutbound(service);
    expect(queued).toMatchObject({ status: "created" });

    const withdrawal = repository.withdrawContact({
      bindingId: "binding_1",
      evidence: validWithdrawalEvidence(),
      now: NOW,
    });
    await withdrawalEntered.promise;
    const dispatch = service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    releaseWithdrawal.resolve();

    await expect(withdrawal).resolves.toMatchObject({ status: "changed", state: "withdrawn" });
    await expect(dispatch).resolves.toEqual({ status: "not_dispatched", code: "contact_policy_denied" });
    expect(providerCalls).toBe(0);
    expect(repository.referenceState().outbound[0]).toMatchObject({ state: "cancelled" });
  });

  it("uses the same lock so a dispatch claim that wins before withdrawal may complete", async () => {
    const claimEntered = deferred();
    const releaseClaim = deferred();
    const providerEntered = deferred();
    const releaseProvider = deferred();
    const repository = createRepository({
      lockBoundary: async ({ operation }: { operation: string }) => {
        if (operation === "claim_outbound") {
          claimEntered.resolve();
          await releaseClaim.promise;
        }
      },
    });
    const service = createService(repository, {
      dispatch: async () => {
        providerEntered.resolve();
        await releaseProvider.promise;
        return { status: "accepted", providerReference: "provider_ref_1" };
      },
    });
    const queued = await queueOutbound(service);
    const dispatch = service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    await claimEntered.promise;
    const withdrawal = repository.withdrawContact({
      bindingId: "binding_1",
      evidence: validWithdrawalEvidence(),
      now: NOW,
    });
    releaseClaim.resolve();
    await providerEntered.promise;
    await expect(withdrawal).resolves.toMatchObject({ status: "changed", state: "withdrawn" });
    releaseProvider.resolve();

    await expect(dispatch).resolves.toMatchObject({ status: "accepted" });
    expect(repository.referenceState().attempts[0]).toMatchObject({
      state: "provider_accepted",
    });
  });
});

describe("durable leases, attempts and recovery", () => {
  it("persists the dispatch attempt before provider I/O and gates completion by owner/version", async () => {
    const repository = createRepository();
    let durableAttemptObserved = false;
    const service = createService(repository, {
      dispatch: async ({ attemptId }: { attemptId: string }) => {
        durableAttemptObserved = repository
          .referenceState()
          .attempts.some((attempt: { attemptId: string; state: string }) =>
            attempt.attemptId === attemptId && attempt.state === "dispatching");
        return { status: "accepted", providerReference: "provider_ref_1" };
      },
    });
    const queued = await queueOutbound(service);

    const result = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });

    expect(durableAttemptObserved).toBe(true);
    expect(result).toMatchObject({ status: "accepted", attemptId: "dispatch_attempt_3" });
    const state = repository.referenceState();
    expect(state.attempts[0]).toMatchObject({ state: "provider_accepted", leaseVersion: 1 });
    expect(
      await repository.markDispatchOutcome({
        commandId: queued.commandId,
        attemptId: result.attemptId,
        leaseOwner: "wrong_worker",
        leaseVersion: 1,
        outcome: "known_failure",
        now: LATER,
      }),
    ).toBe("conflict");
    expect(repository.referenceState().outbound[0]).toMatchObject({ state: "provider_accepted" });
  });

  it("records ambiguous dispatch as non-retryable recovery work", async () => {
    const repository = createRepository();
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("private provider timeout detail");
      },
    });
    const queued = await queueOutbound(service);

    const first = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    const retry = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_2",
      leaseExpiresAt: TOMORROW,
    });

    expect(first).toMatchObject({ status: "dispatch_unknown", code: "provider_outcome_ambiguous" });
    expect(JSON.stringify(first)).not.toContain("private provider timeout detail");
    expect(retry).toEqual({ status: "not_dispatched", code: "dispatch_unknown_non_retryable" });
    expect(await repository.findRecoveryWork({ now: LATER, limit: 10 })).toEqual([
      expect.objectContaining({
        kind: "outbound_dispatch_unknown",
        commandId: queued.commandId,
        attemptId: first.attemptId,
      }),
    ]);
  });

  it("rejects stale inbound lease completion without changing canonical state", async () => {
    const repository = createRepository();
    const accepted = await repository.acceptInbound({
      connectionId: "connection_1",
      providerEventId: "provider_event_1",
      providerBodyDigest: "body_digest_1",
      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
      envelope: {
        event: {
          eventId: "event_1",
          channel: "whatsapp",
          locale: "en",
          connectionState: "active",
          bindingId: "binding_1",
          conversationId: "conversation_1",
          messageId: "message_1",
          receivedAt: NOW,
          state: "persisted",
          correlationId: "correlation_1",
        },
        conversation: {
          id: "conversation_1",
          channel: "whatsapp",
          locale: "en",
          status: "new",
          participantIds: ["participant_1"],
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
          lastActivityAt: NOW,
        },
        participant: {
          participantId: "participant_1",
          conversationId: "conversation_1",
          bindingId: "binding_1",
          role: "external_contact",
          createdAt: NOW,
        },
        message: {
          id: "message_1",
          conversationId: "conversation_1",
          channel: "whatsapp",
          direction: "inbound",
          senderParticipantId: "participant_1",
          locale: "en",
          kind: "text",
          body: "Synthetic body",
          createdAt: NOW,
        },
      },
      optOutSignal: "none",
    });
    expect(accepted).toMatchObject({ status: "accepted" });
    const claim = await repository.claimInbound({
      eventId: "event_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      now: NOW,
      requiredPolicyVersion: 7,
    });
    expect(claim).toMatchObject({ status: "claimed", leaseVersion: 1 });

    expect(
      await repository.completeInbound({
        eventId: "event_1",
        leaseOwner: "worker_2",
        leaseVersion: 1,
        outcome: "applied",
        now: LATER,
      }),
    ).toBe("conflict");
    expect(repository.referenceState().inbound[0]).toMatchObject({ state: "persisted" });
  });

  it("rejects expired or non-finite lease completion for the owning worker", async () => {
    const repository = createRepository();
    await repository.acceptInbound({
      connectionId: "connection_1",
      providerEventId: "provider_event_expiry",
      providerBodyDigest: "body_digest_expiry",
      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
      envelope: {
        event: {
          eventId: "event_expiry",
          channel: "whatsapp",
          locale: "en",
          connectionState: "active",
          bindingId: "binding_1",
          conversationId: "conversation_1",
          messageId: "message_expiry",
          receivedAt: NOW,
          state: "persisted",
          correlationId: "correlation_expiry",
        },
        conversation: {
          id: "conversation_1",
          channel: "whatsapp",
          locale: "en",
          status: "new",
          participantIds: ["participant_1"],
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
          lastActivityAt: NOW,
        },
        participant: {
          participantId: "participant_1",
          conversationId: "conversation_1",
          bindingId: "binding_1",
          role: "external_contact",
          createdAt: NOW,
        },
        message: {
          id: "message_expiry",
          conversationId: "conversation_1",
          channel: "whatsapp",
          direction: "inbound",
          senderParticipantId: "participant_1",
          locale: "en",
          kind: "text",
          body: "Synthetic body",
          createdAt: NOW,
        },
      },
      optOutSignal: "none",
    });
    const inboundClaim = await repository.claimInbound({
      eventId: "event_expiry",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      now: NOW,
      requiredPolicyVersion: 7,
    });
    expect(inboundClaim).toMatchObject({ status: "claimed", leaseVersion: 1 });
    expect(
      await repository.completeInbound({
        eventId: "event_expiry",
        leaseOwner: "worker_1",
        leaseVersion: 1,
        outcome: "applied",
        now: TOMORROW,
      }),
    ).toBe("conflict");
    expect(
      await repository.completeInbound({
        eventId: "event_expiry",
        leaseOwner: "worker_1",
        leaseVersion: 1,
        outcome: "applied",
        now: new Date("invalid"),
      }),
    ).toBe("conflict");

    const service = createService(repository, {
      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
    });
    const queued = await queueOutbound(service);
    const outboundClaim = await repository.claimOutbound({
      commandId: queued.commandId,
      attemptId: "attempt_expiry",
      leaseOwner: "worker_2",
      leaseExpiresAt: LATER,
      now: NOW,
    });
    expect(outboundClaim).toMatchObject({ status: "claimed", attempt: { leaseVersion: 1 } });
    expect(
      await repository.markDispatchOutcome({
        commandId: queued.commandId,
        attemptId: "attempt_expiry",
        leaseOwner: "worker_2",
        leaseVersion: 1,
        outcome: "accepted",
        now: TOMORROW,
      }),
    ).toBe("conflict");
  });

  it("returns recovery instead of success when inbound or outbound completion loses its lease", async () => {
    let inboundNow = NOW;
    const inboundRepository = createRepository();
    const { CommunicationsService } = runtimeApi();
    const baseDependencies = {
      repository: inboundRepository,
      clock: { now: () => inboundNow },
      ids: { next: (kind: string) => `${kind}_recovery` },
      endpointDigestKeys: {
        resolve: async () => ({
          status: "available",
          active: { purpose: "communications_endpoint_digest", version: "v1", key: "key" },
          prior: [],
        }),
      },
      keyedDigest: { digest: async () => "endpoint_digest_v1" },
      destinationResolver: {
        resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
      },
      boundedExecutor: {
        run: async (_operation: string, _timeout: number, action: () => Promise<unknown>) => action(),
      },
      provider: { dispatch: async () => ({ status: "accepted" }) },
      publicKnowledge: {
        answer: async () => {
          inboundNow = TOMORROW;
          return { status: "available", text: "Synthetic answer", sourceReceipt: "receipt_1" };
        },
      },
      contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
      handoff: { request: async () => ({ status: "unavailable" }) },
      providerTimeoutMs: 2_000,
      knowledgeTimeoutMs: 500,
      handoffTimeoutMs: 500,
    };
    const expiringInboundService = new CommunicationsService(baseDependencies);
    await expiringInboundService.acceptInbound({
      connectionId: "connection_recovery",
      providerEventId: "provider_event_recovery",
      providerBodyDigest: "body_recovery",
      endpoint: "raw:endpoint:synthetic",
      envelope: {
        event: {
          eventId: "event_recovery",
          channel: "whatsapp",
          locale: "en",
          connectionState: "active",
          bindingId: "binding_1",
          conversationId: "conversation_1",
          messageId: "message_recovery",
          receivedAt: NOW,
          state: "persisted",
          correlationId: "correlation_recovery",
        },
        conversation: {
          id: "conversation_1",
          channel: "whatsapp",
          locale: "en",
          status: "new",
          participantIds: ["participant_1"],
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
          lastActivityAt: NOW,
        },
        participant: {
          participantId: "participant_1",
          conversationId: "conversation_1",
          bindingId: "binding_1",
          role: "external_contact",
          createdAt: NOW,
        },
        message: {
          id: "message_recovery",
          conversationId: "conversation_1",
          channel: "whatsapp",
          direction: "inbound",
          senderParticipantId: "participant_1",
          locale: "en",
          kind: "text",
          body: "Synthetic body",
          createdAt: NOW,
        },
      },
      optOutSignal: "none",
    });
    expect(
      await runtimeApi().processInboundChannelEvent({
        repository: inboundRepository,
        executor: {
          run: async (_operation: string, _timeout: number, action: () => Promise<unknown>) => action(),
        },
        contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
        publicOrientation: {
          answer: async () => ({
            status: "available",
            text: "Synthetic answer",
            receipt: validM002Receipt("correlation_recovery"),
          }),
        },
        eventId: "event_recovery",
        leaseOwner: "worker_recovery",
        leaseExpiresAt: LATER,
        requiredPolicyVersion: 7,
        intent: "public_orientation",
        prompt: "Synthetic question",
        now: NOW,
        knowledgeTimeoutMs: 500,
        ownerTimeoutMs: 500,
      }),
    ).toMatchObject({ status: "answered", text: "Synthetic answer" });

    let outboundNow = NOW;
    const outboundRepository = createRepository();
    const expiringOutboundService = new CommunicationsService({
      ...baseDependencies,
      repository: outboundRepository,
      clock: { now: () => outboundNow },
      ids: (() => {
        let id = 0;
        return { next: (kind: string) => `${kind}_${++id}` };
      })(),
      provider: {
        dispatch: async () => {
          outboundNow = TOMORROW;
          return { status: "accepted" };
        },
      },
    });
    const queued = await queueOutbound(expiringOutboundService);
    expect(
      await expiringOutboundService.dispatchOutbound({
        commandId: queued.commandId,
        leaseOwner: "worker_recovery",
        leaseExpiresAt: LATER,
      }),
    ).toEqual({
      status: "recovery_required",
      code: "dispatch_completion_conflict",
      commandId: queued.commandId,
      attemptId: "dispatch_attempt_3",
    });
  });
});

describe("monotonic exactly-once provider statuses", () => {
  it("ignores duplicate and delayed regressive statuses without moving backward", async () => {
    const repository = createRepository();
    const queued = await queueOutbound(createService(repository));
    const claimed = await repository.claimOutbound({
      commandId: queued.commandId,
      attemptId: "attempt_status_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      now: NOW,
    });
    expect(claimed).toMatchObject({ status: "claimed" });
    if (claimed.status !== "claimed") throw new Error("STATUS_ATTEMPT_NOT_CLAIMED");
    await repository.markDispatchOutcome({
      commandId: queued.commandId,
      attemptId: claimed.attempt.attemptId,
      leaseOwner: "worker_1",
      leaseVersion: claimed.attempt.leaseVersion,
      outcome: "accepted",
      providerReference: "provider_ref_1",
      now: NOW,
    });
    const { attemptId } = claimed.attempt;
    const connectionId = "connection_1";
    const delivered = providerStatus(
      repository,
      queued.commandId,
      attemptId,
      connectionId,
      "status_event_2",
      "delivered",
      LATER,
    );

    expect(
      await repository.applyProviderStatus(delivered),
    ).toMatchObject({ status: "applied", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus(delivered),
    ).toMatchObject({ status: "duplicate", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus(
        providerStatus(repository, queued.commandId, attemptId, connectionId, "status_event_1", "sent", NOW),
      ),
    ).toMatchObject({ status: "regressive", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus(
        providerStatus(repository, queued.commandId, attemptId, connectionId, "status_event_3", "read", TOMORROW),
      ),
    ).toMatchObject({ status: "applied", commandState: "read" });
    expect(repository.referenceState().providerStatuses).toHaveLength(3);
  });

  it("closes the active attempt when provider status arrives before dispatch completion", async () => {
    const repository = createRepository();
    const queued = await queueOutbound(createService(repository));
    const claimed = await repository.claimOutbound({
      commandId: queued.commandId,
      attemptId: "attempt_early_status_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      now: NOW,
    });
    expect(claimed).toMatchObject({ status: "claimed" });
    if (claimed.status !== "claimed") throw new Error("EARLY_STATUS_ATTEMPT_NOT_CLAIMED");
    const { attemptId } = claimed.attempt;
    const connectionId = "connection_1";

    expect(
      await repository.applyProviderStatus(
        providerStatus(repository, queued.commandId, attemptId, connectionId, "early_status_1", "sent", NOW),
      ),
    ).toEqual({ status: "denied", code: "provider_status_binding_mismatch" });

    await repository.markDispatchOutcome({
      commandId: queued.commandId,
      attemptId,
      leaseOwner: "worker_1",
      leaseVersion: claimed.attempt.leaseVersion,
      outcome: "accepted",
      providerReference: "provider_ref_1",
      now: NOW,
    });
    expect(
      await repository.applyProviderStatus(
        providerStatus(repository, queued.commandId, attemptId, connectionId, "status_event_1", "sent", NOW),
      ),
    ).toMatchObject({ status: "applied", commandState: "sent" });
    expect(repository.referenceState().attempts).toEqual([
      expect.objectContaining({ state: "sent", completedAt: NOW }),
    ]);
  });
});

describe("controlled inbound opt-out and reconciliation races", () => {
  it("serializes inbound opt-out acceptance before processing a prior event", async () => {
    let acceptCount = 0;
    const optOutEntered = deferred();
    const releaseOptOut = deferred();
    const repository = createRepository({
      lockBoundary: async ({ operation }: { operation: string }) => {
        if (operation === "accept_inbound" && ++acceptCount === 2) {
          optOutEntered.resolve();
          await releaseOptOut.promise;
        }
      },
    });
    const service = createService(repository, {
      dispatch: async () => ({ status: "accepted" }),
    });
    await repository.acceptInbound({
      connectionId: "connection_1",
      providerEventId: "provider_event_prior",
      providerBodyDigest: "body_prior",
      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
      envelope: {
        event: {
          eventId: "event_prior",
          channel: "whatsapp",
          locale: "en",
          connectionState: "active",
          bindingId: "binding_1",
          conversationId: "conversation_1",
          messageId: "message_prior",
          receivedAt: NOW,
          state: "persisted",
          correlationId: "correlation_prior",
        },
        conversation: {
          id: "conversation_1",
          channel: "whatsapp",
          locale: "en",
          status: "new",
          participantIds: ["participant_1"],
          version: 1,
          createdAt: NOW,
          updatedAt: NOW,
          lastActivityAt: NOW,
        },
        participant: {
          participantId: "participant_1",
          conversationId: "conversation_1",
          bindingId: "binding_1",
          role: "external_contact",
          createdAt: NOW,
        },
        message: {
          id: "message_prior",
          conversationId: "conversation_1",
          channel: "whatsapp",
          direction: "inbound",
          senderParticipantId: "participant_1",
          locale: "en",
          kind: "text",
          body: "Synthetic body",
          createdAt: NOW,
        },
      },
      optOutSignal: "none",
    });
    const optOutEnvelope = repository.referenceState().inbound[0].envelope as any;
    const acceptOptOut = repository.acceptInbound({
      connectionId: "connection_1",
      providerEventId: "provider_event_opt_out",
      providerBodyDigest: "body_opt_out",
      endpointDigests: [{ version: "v1", digest: "endpoint_digest_v1" }],
      envelope: {
        ...optOutEnvelope,
        event: {
          ...optOutEnvelope.event,
          eventId: "event_opt_out",
          messageId: "message_opt_out",
          correlationId: "correlation_opt_out",
        },
        message: { ...optOutEnvelope.message, id: "message_opt_out", body: null },
      },
      optOutSignal: "pending",
    });
    await optOutEntered.promise;
    const processPrior = runtimeApi().processInboundChannelEvent({
      repository,
      executor: {
        run: async (_operation: string, _timeout: number, action: () => Promise<unknown>) => action(),
      },
      contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
      publicOrientation: {
        answer: async () => ({
          status: "available",
          text: "Synthetic answer",
          receipt: validM002Receipt("correlation_prior"),
        }),
      },
      eventId: "event_prior",
      leaseOwner: "worker_prior",
      leaseExpiresAt: LATER,
      requiredPolicyVersion: 7,
      intent: "public_orientation",
      prompt: "Synthetic question",
      now: NOW,
      knowledgeTimeoutMs: 500,
      ownerTimeoutMs: 500,
    });
    releaseOptOut.resolve();

    await expect(acceptOptOut).resolves.toMatchObject({ status: "accepted" });
    await expect(processPrior).resolves.toEqual({
      status: "recovery_required",
      code: "policy_version_mismatch",
      eventId: "event_prior",
    });
  });

  it("reconciles unknown and expired dispatches from typed evidence without resending", async () => {
    const repository = createRepository();
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("ambiguous");
      },
    });
    const queued = await queueOutbound(service);
    const unknown = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    expect(repository.reconcileOutbound).toBeTypeOf("function");

    expect(
      await repository.reconcileOutbound({
        commandId: queued.commandId,
        attemptId: unknown.attemptId,
        now: NOW,
      }),
    ).toEqual({ status: "denied", code: "reconciliation_receipt_missing" });
    expect(
      await service.reconcileOutbound({
        commandId: queued.commandId,
        attemptId: unknown.attemptId,
        receipt: reconciliationReceipt({
          commandId: queued.commandId,
          attemptId: unknown.attemptId,
          outcome: "reconciled_accepted",
        }),
      }),
    ).toMatchObject({ status: "reconciled", commandState: "reconciled_accepted" });
    expect(
      await service.dispatchOutbound({
        commandId: queued.commandId,
        leaseOwner: "worker_2",
        leaseExpiresAt: TOMORROW,
      }),
    ).toEqual({ status: "not_dispatched", code: "already_completed" });

    const expiredRepository = createRepository();
    const expiredService = createService(expiredRepository, {
      dispatch: async () => ({ status: "accepted" }),
    });
    const expiredQueued = await queueOutbound(expiredService);
    const expiredClaim = await expiredRepository.claimOutbound({
      commandId: expiredQueued.commandId,
      attemptId: "attempt_expired_reconcile",
      leaseOwner: "worker_expired",
      leaseExpiresAt: LATER,
      now: NOW,
    });
    expect(expiredClaim).toMatchObject({ status: "claimed" });
    expect(
      await expiredRepository.reconcileOutbound({
        commandId: expiredQueued.commandId,
        attemptId: "attempt_expired_reconcile",
        receipt: {
          ...reconciliationReceipt({
            commandId: expiredQueued.commandId,
            attemptId: "attempt_expired_reconcile",
            outcome: "confirmed_not_sent",
            source: "manual_authority",
          }),
          issuedAt: TOMORROW,
          expiresAt: new Date("2026-08-22T12:00:00.000Z"),
        },
        now: TOMORROW,
      }),
    ).toMatchObject({ status: "reconciled", commandState: "confirmed_not_sent" });
  });

  it("serializes contradictory reconciliation receipts so exactly one settles", async () => {
    const reconcileEntered = deferred();
    const releaseReconcile = deferred();
    const repository = createRepository({
      lockBoundary: async ({ operation }: { operation: string }) => {
        if (operation === "reconcile_outbound") {
          reconcileEntered.resolve();
          await releaseReconcile.promise;
        }
      },
    });
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("ambiguous");
      },
    });
    expect(repository.reconcileOutbound).toBeTypeOf("function");
    const queued = await queueOutbound(service);
    const unknown = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    const acceptedReceipt = reconciliationReceipt({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      outcome: "reconciled_accepted",
      source: "manual_authority",
    });
    const notSentReceipt = reconciliationReceipt({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      outcome: "confirmed_not_sent",
      source: "provider_lookup",
    });
    const first = repository.reconcileOutbound({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      receipt: acceptedReceipt,
      now: NOW,
    });
    await reconcileEntered.promise;
    const second = repository.reconcileOutbound({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      receipt: notSentReceipt,
      now: NOW,
    });
    releaseReconcile.resolve();

    await expect(first).resolves.toEqual({
      status: "reconciled",
      commandState: "reconciled_accepted",
    });
    await expect(second).resolves.toEqual({
      status: "conflict",
      code: "reconciliation_already_settled",
      commandState: "reconciled_accepted",
    });
    expect(repository.referenceState().outbound[0]).toMatchObject({
      state: "reconciled_accepted",
    });
    expect(repository.referenceState().attempts[0]).toMatchObject({
      state: "reconciled_accepted",
    });
  });

  it("replays an identical reconciliation receipt idempotently", async () => {
    const repository = createRepository();
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("ambiguous");
      },
    });
    const queued = await queueOutbound(service);
    const unknown = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    const receipt = reconciliationReceipt({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      outcome: "terminal_failure",
      source: "manual_authority",
    });

    await expect(
      repository.reconcileOutbound({
        commandId: queued.commandId,
        attemptId: unknown.attemptId,
        receipt,
        now: NOW,
      }),
    ).resolves.toEqual({ status: "reconciled", commandState: "failed" });
    await expect(
      repository.reconcileOutbound({
        commandId: queued.commandId,
        attemptId: unknown.attemptId,
        receipt,
        now: NOW,
      }),
    ).resolves.toEqual({ status: "duplicate", commandState: "failed" });
  });

  it("fails closed when a reconciliation receipt id is reused with a different identity", async () => {
    const repository = createRepository();
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("ambiguous");
      },
    });
    const queued = await queueOutbound(service);
    const unknown = await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    const receipt = reconciliationReceipt({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      outcome: "reconciled_accepted",
      receiptId: "receipt_reused",
    });
    await repository.reconcileOutbound({
      commandId: queued.commandId,
      attemptId: unknown.attemptId,
      receipt,
      now: NOW,
    });
    const settledState = repository.referenceState();

    await expect(
      repository.reconcileOutbound({
        commandId: queued.commandId,
        attemptId: unknown.attemptId,
        receipt: { ...receipt, outcome: "confirmed_not_sent" },
        now: NOW,
      }),
    ).resolves.toEqual({
      status: "conflict",
      code: "reconciliation_receipt_mismatch",
    });
    expect(repository.referenceState()).toEqual(settledState);
  });

  it("rejects cross-command attempt pairings before locking or consuming receipt ids", async () => {
    const base = repositoryOptions();
    const reconciliationLocks: Array<{ bindingId: string; operation: string }> = [];
    const repository = createRepository({
      bindings: [
        ...base.bindings,
        {
          bindingId: "binding_2",
          channel: "whatsapp",
          trustState: "reverified",
          freshUntil: TOMORROW,
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
      policies: [
        ...base.policies,
        {
          policyId: "policy_2",
          bindingId: "binding_2",
          state: "normal",
          version: 7,
          fence: 42,
          updatedAt: NOW,
        },
      ],
      consents: [
        ...base.consents,
        {
          bindingId: "binding_2",
          purpose: "transactional",
          state: "granted",
          version: 1,
          receipt: {
            receiptId: "consent_receipt_2",
            owner: "consent",
            operation: "consent_confirmation",
            bindingId: "binding_2",
            issuedAt: NOW,
            expiresAt: TOMORROW,
          },
          changedAt: NOW,
        },
      ],
      lockBoundary: async (input: { bindingId: string; operation: string }) => {
        if (input.operation === "reconcile_outbound") reconciliationLocks.push(input);
      },
    });
    const service = createService(repository, {
      dispatch: async () => {
        throw new Error("ambiguous");
      },
    });
    const commandA = await queueOutbound(service);
    const commandB = await queueOutbound(service, {
      bindingId: "binding_2",
      idempotencyKey: "outbound_key_2",
      correlationId: "correlation_out_2",
      authorizationReceipt: {
        receiptId: "dispatch_receipt_2",
        owner: "communications",
        operation: "outbound_dispatch",
        bindingId: "binding_2",
        destinationKey: "endpoint_ref:endpoint_digest_v1",
        issuedAt: NOW,
        expiresAt: TOMORROW,
      },
    });
    const attemptA = await service.dispatchOutbound({
      commandId: commandA.commandId,
      leaseOwner: "worker_a",
      leaseExpiresAt: LATER,
    });
    const attemptB = await service.dispatchOutbound({
      commandId: commandB.commandId,
      leaseOwner: "worker_b",
      leaseExpiresAt: LATER,
    });
    expect(attemptA).toMatchObject({ status: "dispatch_unknown" });
    expect(attemptB).toMatchObject({ status: "dispatch_unknown" });
    const beforeCrossPair = repository.referenceState();

    await expect(
      repository.reconcileOutbound({
        commandId: commandA.commandId,
        attemptId: attemptB.attemptId,
        receipt: reconciliationReceipt({
          commandId: commandA.commandId,
          attemptId: attemptB.attemptId,
          outcome: "reconciled_accepted",
          receiptId: "receipt_cross_pair_a",
        }),
        now: NOW,
      }),
    ).resolves.toEqual({ status: "conflict", code: "reconciliation_binding_mismatch" });
    expect(repository.referenceState()).toEqual(beforeCrossPair);
    expect(reconciliationLocks).toEqual([]);

    await expect(
      repository.reconcileOutbound({
        commandId: commandA.commandId,
        attemptId: attemptA.attemptId,
        receipt: reconciliationReceipt({
          commandId: commandA.commandId,
          attemptId: attemptA.attemptId,
          outcome: "reconciled_accepted",
          receiptId: "receipt_cross_pair_a",
        }),
        now: NOW,
      }),
    ).resolves.toEqual({ status: "reconciled", commandState: "reconciled_accepted" });
    expect(reconciliationLocks).toEqual([
      { bindingId: "binding_1", operation: "reconcile_outbound" },
    ]);

    const beforeReversePair = repository.referenceState();
    await expect(
      repository.reconcileOutbound({
        commandId: commandB.commandId,
        attemptId: attemptA.attemptId,
        receipt: reconciliationReceipt({
          commandId: commandB.commandId,
          attemptId: attemptA.attemptId,
          outcome: "confirmed_not_sent",
          receiptId: "receipt_cross_pair_b",
          bindingId: "binding_2",
          correlationId: "correlation_out_2",
        }),
        now: NOW,
      }),
    ).resolves.toEqual({ status: "conflict", code: "reconciliation_binding_mismatch" });
    expect(repository.referenceState()).toEqual(beforeReversePair);
    expect(reconciliationLocks).toHaveLength(1);

    await expect(
      repository.reconcileOutbound({
        commandId: commandB.commandId,
        attemptId: attemptB.attemptId,
        receipt: reconciliationReceipt({
          commandId: commandB.commandId,
          attemptId: attemptB.attemptId,
          outcome: "confirmed_not_sent",
          receiptId: "receipt_cross_pair_b",
          bindingId: "binding_2",
          correlationId: "correlation_out_2",
        }),
        now: NOW,
      }),
    ).resolves.toEqual({ status: "reconciled", commandState: "confirmed_not_sent" });
    expect(reconciliationLocks).toEqual([
      { bindingId: "binding_1", operation: "reconcile_outbound" },
      { bindingId: "binding_2", operation: "reconcile_outbound" },
    ]);
  });
});
