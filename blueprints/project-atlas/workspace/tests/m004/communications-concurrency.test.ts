import { describe, expect, it } from "vitest";
import * as communicationsModule from "../../packages/domain/src/communications/index.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const LATER = new Date("2026-08-20T12:05:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

type RuntimeApi = {
  MemoryCommunicationsRepository: new (options?: Record<string, unknown>) => any;
  CommunicationsService: new (dependencies: Record<string, unknown>) => any;
};

function runtimeApi(): RuntimeApi {
  expect(communicationsModule).toHaveProperty("MemoryCommunicationsRepository");
  expect(communicationsModule).toHaveProperty("CommunicationsService");
  return communicationsModule as unknown as RuntimeApi;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
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
  const { MemoryCommunicationsRepository } = runtimeApi();
  return new MemoryCommunicationsRepository(repositoryOptions(overrides));
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

async function queueOutbound(service: any) {
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
      destinationKey: "endpoint_digest_v1",
      issuedAt: NOW,
      expiresAt: TOMORROW,
    },
    correlationId: "correlation_out_1",
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

    const withdrawal = repository.withdrawContact({ bindingId: "binding_1", now: NOW });
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
});

describe("monotonic exactly-once provider statuses", () => {
  it("ignores duplicate and delayed regressive statuses without moving backward", async () => {
    const repository = createRepository();
    const service = createService(repository, {
      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
    });
    const queued = await queueOutbound(service);
    await service.dispatchOutbound({
      commandId: queued.commandId,
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });

    expect(
      await repository.applyProviderStatus({
        commandId: queued.commandId,
        providerEventId: "status_event_2",
        status: "delivered",
        occurredAt: LATER,
      }),
    ).toMatchObject({ status: "applied", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus({
        commandId: queued.commandId,
        providerEventId: "status_event_2",
        status: "delivered",
        occurredAt: LATER,
      }),
    ).toMatchObject({ status: "duplicate", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus({
        commandId: queued.commandId,
        providerEventId: "status_event_1",
        status: "sent",
        occurredAt: NOW,
      }),
    ).toMatchObject({ status: "regressive", commandState: "delivered" });
    expect(
      await repository.applyProviderStatus({
        commandId: queued.commandId,
        providerEventId: "status_event_3",
        status: "read",
        occurredAt: TOMORROW,
      }),
    ).toMatchObject({ status: "applied", commandState: "read" });
    expect(repository.referenceState().providerStatuses).toHaveLength(3);
  });
});
