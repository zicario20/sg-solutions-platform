import { describe, expect, it } from "vitest";
import * as communicationsModule from "../../packages/domain/src/communications/index.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const LATER = new Date("2026-08-20T12:05:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

type RuntimeApi = {
  MemoryCommunicationsRepository: new (options?: Record<string, unknown>) => any;
  CommunicationsService: new (dependencies: Record<string, unknown>) => any;
  CanonicalMessageTemplateService: new (dependencies: Record<string, unknown>) => any;
};

function runtimeApi(): RuntimeApi {
  expect(communicationsModule).toHaveProperty("MemoryCommunicationsRepository");
  expect(communicationsModule).toHaveProperty("CommunicationsService");
  expect(communicationsModule).toHaveProperty("CanonicalMessageTemplateService");
  return communicationsModule as unknown as RuntimeApi;
}

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    event: {
      eventId: "event_1",
      channel: "whatsapp",
      locale: "en",
      connectionState: "active",
      bindingId: "binding_1",
      conversationId: "conversation_1",
      messageId: "message_in_1",
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
      id: "message_in_1",
      conversationId: "conversation_1",
      channel: "whatsapp",
      direction: "inbound",
      senderParticipantId: "participant_1",
      locale: "en",
      kind: "text",
      body: "Synthetic public question",
      createdAt: NOW,
    },
    ...overrides,
  };
}

function validConsentReceipt(operation: "consent_grant" | "reconsent" = "consent_grant") {
  return {
    receiptId: `receipt_${operation}_1`,
    owner: "consent",
    operation,
    bindingId: "binding_1",
    issuedAt: NOW,
    expiresAt: TOMORROW,
  };
}

function validBindingReceipt() {
  return {
    receiptId: "receipt_binding_1",
    owner: "identity",
    operation: "binding_revalidation",
    bindingId: "binding_1",
    issuedAt: NOW,
    expiresAt: TOMORROW,
  };
}

function validTemplateReceipt(templateId = "template_1") {
  return {
    receiptId: "receipt_template_1",
    owner: "communications",
    operation: "template_internal_approval",
    resourceId: templateId,
    locale: "en",
    definitionVersion: 1,
    issuedAt: NOW,
    expiresAt: TOMORROW,
  };
}

function validProviderTemplateReceipt(
  providerVersion: number,
  providerState: "provider_approved" | "provider_rejected" | "paused" | "disabled",
) {
  return {
    receiptId: `receipt_template_provider_${providerVersion}`,
    owner: "communications",
    operation: "template_provider_reconciliation",
    templateId: "template_1",
    locale: "en",
    definitionVersion: 1,
    providerVersion,
    providerState,
    issuedAt: NOW,
    expiresAt: TOMORROW,
    correlationId: `template_correlation_${providerVersion}`,
  };
}

function validWithdrawalReceipt(issuedAt = NOW) {
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

function createRepository(overrides: Record<string, unknown> = {}) {
  const { MemoryCommunicationsRepository } = runtimeApi();
  return new MemoryCommunicationsRepository({
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
  });
}

function createService(options: Record<string, unknown> = {}) {
  const { CommunicationsService } = runtimeApi();
  const repository = (options.repository as any) ?? createRepository();
  const digestCalls: Array<{ key: string; payload: string }> = [];
  let id = 0;
  const dependencies = {
    repository,
    clock: { now: () => NOW },
    ids: { next: (kind: string) => `${kind}_${++id}` },
    endpointDigestKeys: {
      resolve: async () => ({
        status: "available",
        active: {
          purpose: "communications_endpoint_digest",
          version: "v2",
          key: "SERVER_KEY_V2",
        },
        prior: [
          {
            purpose: "communications_endpoint_digest",
            version: "v1",
            key: "SERVER_KEY_V1",
          },
        ],
      }),
    },
    keyedDigest: {
      digest: async ({ key, payload }: { key: string; payload: string }) => {
        digestCalls.push({ key, payload });
        return key.endsWith("V2") ? "endpoint_digest_v2" : "endpoint_digest_v1";
      },
    },
    destinationResolver: {
      resolve: async () => ({ status: "resolved", endpoint: "raw:endpoint:synthetic" }),
    },
    boundedExecutor: {
      run: async (_operation: string, _timeoutMs: number, action: () => Promise<unknown>) =>
        action(),
    },
    provider: {
      dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
    },
    publicKnowledge: {
      answer: async () => ({
        status: "available",
        text: "Synthetic public answer",
        sourceReceipt: "knowledge_receipt_1",
      }),
    },
    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
    handoff: {
      request: async () => ({
        status: "queued",
        receipt: {
          receiptId: "handoff_receipt_1",
          owner: "communications",
          operation: "handoff",
          resourceId: "conversation_1",
          idempotencyKey: "handoff_key_1",
          issuedAt: NOW,
          expiresAt: TOMORROW,
        },
      }),
    },
    providerTimeoutMs: 2_000,
    knowledgeTimeoutMs: 500,
    handoffTimeoutMs: 500,
    ...options,
    repository,
  };
  return {
    repository,
    service: new CommunicationsService(dependencies),
    digestCalls,
  };
}

async function acceptInbound(service: any, overrides: Record<string, unknown> = {}) {
  return service.acceptInbound({
    connectionId: "connection_1",
    providerEventId: "provider_event_1",
    providerBodyDigest: "provider_body_digest_1",
    endpoint: "raw:endpoint:synthetic",
    envelope: envelope(),
    optOutSignal: "none",
    ...overrides,
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
      destinationKey: "endpoint_digest_v2",
      issuedAt: NOW,
      expiresAt: TOMORROW,
    },
    correlationId: "correlation_out_1",
    ...overrides,
  });
}

describe("canonical inbound and application behavior", () => {
  it("persists one replayable canonical envelope and fails closed on mismatched replay", async () => {
    const { repository, service } = createService();

    const accepted = await acceptInbound(service);
    const duplicate = await acceptInbound(service);
    const mismatch = await acceptInbound(service, { providerBodyDigest: "different_digest" });

    expect(accepted).toMatchObject({ status: "accepted", eventId: "event_1" });
    expect(duplicate).toMatchObject({ status: "duplicate", eventId: "event_1" });
    expect(mismatch).toEqual({ status: "replay_mismatch", code: "provider_replay_mismatch" });
    expect(repository.referenceState().inbound).toHaveLength(1);
    expect(repository.referenceState().inbound[0]?.envelope).toEqual(envelope());
  });

  it("establishes opt_out_pending atomically and prioritizes it before knowledge", async () => {
    let knowledgeCalls = 0;
    const fixture = createService({
      publicKnowledge: {
        answer: async () => {
          knowledgeCalls += 1;
          return { status: "available", text: "must not be used", sourceReceipt: "receipt" };
        },
      },
    });
    await acceptInbound(fixture.service, { optOutSignal: "pending" });

    const result = await fixture.service.processInbound({
      eventId: "event_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      requiredPolicyVersion: 8,
      action: "public_knowledge",
      prompt: "Synthetic question",
    });

    expect(result).toEqual({ status: "opt_out_pending", eventId: "event_1" });
    expect(knowledgeCalls).toBe(0);
    expect(fixture.repository.referenceState().policies[0]).toMatchObject({
      state: "opt_out_pending",
      version: 8,
      fence: 43,
    });
  });

  it("rejects processing against a stale policy version", async () => {
    const fixture = createService();
    await acceptInbound(fixture.service);

    await expect(
      fixture.service.processInbound({
        eventId: "event_1",
        leaseOwner: "worker_1",
        leaseExpiresAt: LATER,
        requiredPolicyVersion: 6,
        action: "public_knowledge",
        prompt: "Synthetic question",
      }),
    ).resolves.toEqual({ status: "conflict", code: "policy_version_mismatch" });
  });

  it("maps disabled knowledge and absent handoff receipts to honest manual outcomes", async () => {
    const disabled = createService({
      publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
    });
    await acceptInbound(disabled.service);
    expect(
      await disabled.service.processInbound({
        eventId: "event_1",
        leaseOwner: "worker_1",
        leaseExpiresAt: LATER,
        requiredPolicyVersion: 7,
        action: "public_knowledge",
        prompt: "Synthetic question",
      }),
    ).toEqual({ status: "manual", code: "knowledge_unavailable" });

    const noReceipt = createService({
      handoff: { request: async () => ({ status: "queued" }) },
    });
    await acceptInbound(noReceipt.service);
    expect(
      await noReceipt.service.processInbound({
        eventId: "event_1",
        leaseOwner: "worker_2",
        leaseExpiresAt: LATER,
        requiredPolicyVersion: 7,
        action: "handoff",
        idempotencyKey: "handoff_key_1",
      }),
    ).toEqual({ status: "manual", code: "handoff_receipt_missing" });
  });

  it("rejects prohibited generated copy without persisting an outbound command", async () => {
    const fixture = createService({
      publicKnowledge: {
        answer: async () => ({
          status: "available",
          text: "Send private identity and payment details here",
          sourceReceipt: "knowledge_receipt_1",
        }),
      },
      contentPolicy: { evaluate: () => ({ allowed: false, code: "protected_content" }) },
    });
    await acceptInbound(fixture.service);

    const result = await fixture.service.processInbound({
      eventId: "event_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
      requiredPolicyVersion: 7,
      action: "public_knowledge",
      prompt: "Synthetic question",
    });

    expect(result).toEqual({ status: "manual", code: "prohibited_content" });
    expect(fixture.repository.referenceState().outbound).toEqual([]);
  });
});

describe("receipt-gated consent, binding and template behavior", () => {
  it("requires receipts for consent grant and re-consent after withdrawal", async () => {
    const repository = createRepository({ consents: [] });

    expect(
      await repository.grantConsentFromReceipt({
        bindingId: "binding_1",
        purpose: "transactional",
        operation: "consent_grant",
        now: NOW,
      }),
    ).toEqual({ status: "denied", code: "authority_receipt_missing" });
    expect(
      await repository.grantConsentFromReceipt({
        bindingId: "binding_1",
        purpose: "transactional",
        operation: "consent_grant",
        receipt: validConsentReceipt(),
        now: NOW,
      }),
    ).toMatchObject({ status: "changed", state: "granted", version: 1 });
    await repository.withdrawContact({
      bindingId: "binding_1",
      evidence: validWithdrawalReceipt(LATER),
      now: LATER,
    });
    expect(
      await repository.grantConsentFromReceipt({
        bindingId: "binding_1",
        purpose: "transactional",
        operation: "consent_grant",
        receipt: validConsentReceipt(),
        now: LATER,
      }),
    ).toEqual({ status: "denied", code: "reconsent_receipt_required" });
    expect(
      await repository.grantConsentFromReceipt({
        bindingId: "binding_1",
        purpose: "transactional",
        operation: "reconsent",
        receipt: { ...validConsentReceipt("reconsent"), issuedAt: LATER },
        now: LATER,
      }),
    ).toMatchObject({ status: "changed", state: "granted", version: 3 });
    expect(repository.referenceState().consentHistory).toHaveLength(3);
  });

  it("suspends expired or reassigned bindings and clears suspension only from identity receipt", async () => {
    const repository = createRepository();

    expect(
      await repository.suspendBinding({
        bindingId: "binding_1",
        reason: "reassigned",
        now: LATER,
      }),
    ).toMatchObject({ status: "changed", trustState: "suspended" });
    expect(
      await repository.revalidateBindingFromReceipt({
        bindingId: "binding_1",
        freshUntil: TOMORROW,
        now: LATER,
      }),
    ).toEqual({ status: "denied", code: "authority_receipt_missing" });
    expect(
      await repository.revalidateBindingFromReceipt({
        bindingId: "binding_1",
        freshUntil: TOMORROW,
        receipt: { ...validBindingReceipt(), issuedAt: LATER },
        now: LATER,
      }),
    ).toMatchObject({ status: "changed", trustState: "reverified" });
  });

  it("requires an approval receipt and keeps provider template projections monotonic", async () => {
    const { CanonicalMessageTemplateService } = runtimeApi();
    const repository = createRepository({ templates: [] });
    const templates = new CanonicalMessageTemplateService({
      repository,
      clock: { now: () => NOW },
      allowSyntheticDefinitions: true,
    });

    expect(
      await templates.registerInternalDefinition({
        templateId: "template_1",
        locale: "en",
        definitionVersion: 1,
        synthetic: true,
      }),
    ).toMatchObject({ status: "registered", internallyApproved: false });
    expect(
      await templates.recordInternalApproval({
        templateId: "template_1",
        locale: "en",
        definitionVersion: 1,
      }),
    ).toEqual({ status: "denied", code: "approval_receipt_missing" });
    expect(
      await templates.applyProviderProjection({
        templateId: "template_1",
        locale: "en",
        providerState: "provider_approved",
        providerVersion: 2,
        correlationId: "template_correlation_2",
        receipt: validProviderTemplateReceipt(2, "provider_approved"),
        now: NOW,
      }),
    ).toMatchObject({ status: "applied", internallyApproved: false });
    expect(
      await templates.evaluateEligibility({ templateId: "template_1", locale: "en" }),
    ).toEqual({ eligible: false, code: "internal_approval_required" });
    expect(
      await templates.recordInternalApproval({
        templateId: "template_1",
        locale: "en",
        definitionVersion: 1,
        receipt: validTemplateReceipt(),
      }),
    ).toMatchObject({ status: "approved", internallyApproved: true });
    expect(
      await templates.applyProviderProjection({
        templateId: "template_1",
        locale: "en",
        providerState: "paused",
        providerVersion: 3,
        correlationId: "template_correlation_3",
        receipt: validProviderTemplateReceipt(3, "paused"),
        now: LATER,
      }),
    ).toMatchObject({ status: "applied", providerState: "paused", providerVersion: 3 });
    expect(
      await templates.applyProviderProjection({
        templateId: "template_1",
        locale: "en",
        providerState: "provider_approved",
        providerVersion: 2,
        correlationId: "template_correlation_2",
        receipt: validProviderTemplateReceipt(2, "provider_approved"),
        now: LATER,
      }),
    ).toMatchObject({ status: "regressive", providerState: "paused", providerVersion: 3 });
  });

  it("keeps runtime template registration closed when policy/copy gates are unresolved", async () => {
    const { CanonicalMessageTemplateService } = runtimeApi();
    const templates = new CanonicalMessageTemplateService({
      repository: createRepository({ templates: [] }),
      clock: { now: () => NOW },
    });

    await expect(
      templates.registerInternalDefinition({
        templateId: "runtime_template",
        locale: "en",
        definitionVersion: 1,
        synthetic: false,
      }),
    ).resolves.toEqual({ status: "unavailable", code: "runtime_registration_disabled" });
  });

  it("binds internal approval and provider projection receipts to the exact template revision", async () => {
    const { CanonicalMessageTemplateService } = runtimeApi();
    const repository = createRepository({ templates: [] });
    const templates = new CanonicalMessageTemplateService({
      repository,
      clock: { now: () => NOW },
      allowSyntheticDefinitions: true,
    });
    await templates.registerInternalDefinition({
      templateId: "template_1",
      locale: "en",
      definitionVersion: 1,
      synthetic: true,
    });

    expect(
      await templates.recordInternalApproval({
        templateId: "template_1",
        locale: "en",
        definitionVersion: 1,
        receipt: { ...validTemplateReceipt(), locale: "es" },
      }),
    ).toEqual({ status: "denied", code: "approval_receipt_invalid" });
    expect(
      await templates.applyProviderProjection({
        templateId: "template_1",
        locale: "en",
        providerState: "provider_approved",
        providerVersion: 2,
        correlationId: "template_correlation_2",
        now: NOW,
      }),
    ).toEqual({ status: "denied", code: "provider_receipt_missing" });
    expect(
      await templates.applyProviderProjection({
        templateId: "template_1",
        locale: "en",
        providerState: "provider_approved",
        providerVersion: 2,
        correlationId: "wrong_correlation",
        receipt: validProviderTemplateReceipt(2, "provider_approved"),
        now: NOW,
      }),
    ).toEqual({ status: "denied", code: "provider_receipt_invalid" });
  });

  it("rejects withdrawal without owning evidence and preserves that evidence in history", async () => {
    const repository = createRepository();

    expect(await repository.withdrawContact({ bindingId: "binding_1", now: NOW })).toEqual({
      status: "denied",
      code: "withdrawal_evidence_missing",
    });
    expect(
      await repository.withdrawContact({
        bindingId: "binding_1",
        evidence: validWithdrawalReceipt(),
        now: NOW,
      }),
    ).toMatchObject({ status: "changed", state: "withdrawn" });
    expect(repository.referenceState().withdrawalHistory).toEqual([
      expect.objectContaining({
        bindingId: "binding_1",
        source: "authority",
        receiptId: "receipt_withdrawal_1",
        correlationId: "withdrawal_correlation_1",
      }),
    ]);
  });

  it("binds inbound withdrawal evidence to the referenced event correlation", async () => {
    const fixture = createService();
    await acceptInbound(fixture.service);
    const receipt = {
      receiptId: "receipt_inbound_withdrawal_1",
      owner: "communications",
      operation: "inbound_opt_out",
      bindingId: "binding_1",
      eventId: "event_1",
      issuedAt: NOW,
      expiresAt: TOMORROW,
      correlationId: "wrong_correlation",
    };

    expect(
      await fixture.repository.withdrawContact({
        bindingId: "binding_1",
        evidence: { source: "inbound_event", receipt },
        now: NOW,
      }),
    ).toEqual({ status: "denied", code: "withdrawal_evidence_invalid" });
    expect(
      await fixture.repository.withdrawContact({
        bindingId: "binding_1",
        evidence: {
          source: "inbound_event",
          receipt: { ...receipt, correlationId: "correlation_1" },
        },
        now: NOW,
      }),
    ).toMatchObject({ status: "changed", state: "withdrawn" });
  });

  it("keeps consent withdrawn after ambiguous opt-out review until separate re-consent", async () => {
    const repository = createRepository();
    await repository.withdrawContact({
      bindingId: "binding_1",
      evidence: validWithdrawalReceipt(),
      now: NOW,
    });
    const consentHistoryBeforeReview = repository.referenceState().consentHistory;

    const result = await repository.resolveAmbiguousOptOutFromReceipt({
      bindingId: "binding_1",
      receipt: {
        receiptId: "receipt_opt_out_review_1",
        owner: "consent",
        operation: "ambiguous_opt_out_resolution",
        bindingId: "binding_1",
        issuedAt: NOW,
        expiresAt: TOMORROW,
      },
      now: NOW,
    });

    expect(result).toEqual({
      status: "changed",
      policyState: "normal_after_review",
      policyVersion: 9,
    });
    expect(result).not.toHaveProperty("state");
    expect(result).not.toHaveProperty("version");
    expect(repository.referenceState().consentHistory).toEqual(consentHistoryBeforeReview);
    expect(repository.referenceState().policies[0]).toMatchObject({
      state: "normal_after_review",
    });
  });
});

describe("endpoint digest isolation and fail-closed dependencies", () => {
  it("uses active and bounded prior endpoint keys with communications-only domain separation", async () => {
    const fixture = createService();

    const result = await acceptInbound(fixture.service);

    expect(result).toMatchObject({
      status: "accepted",
      endpointDigestVersion: "v2",
      endpointDigest: "endpoint_digest_v2",
    });
    expect(fixture.digestCalls).toHaveLength(2);
    expect(fixture.digestCalls.map((call) => call.payload)).toEqual([
      "communications:endpoint-digest:v1\u0000raw:endpoint:synthetic",
      "communications:endpoint-digest:v1\u0000raw:endpoint:synthetic",
    ]);
    const serialized = JSON.stringify({ result, state: fixture.repository.referenceState() });
    expect(serialized).not.toContain("SERVER_KEY");
    expect(serialized).not.toContain("raw:endpoint:synthetic");
  });

  it.each([
    [{ status: "unavailable" }, "endpoint_digest_key_unavailable"],
    [
      {
        status: "available",
        active: { purpose: "webhook_signature", version: "v2", key: "wrong" },
        prior: [],
      },
      "endpoint_digest_key_invalid",
    ],
    [
      {
        status: "available",
        active: {
          purpose: "communications_endpoint_digest",
          version: "v2",
          key: "active",
        },
        prior: [
          {
            purpose: "communications_endpoint_digest",
            version: "v2",
            key: "duplicate_version",
          },
        ],
      },
      "endpoint_digest_key_invalid",
    ],
  ] as const)("fails closed for unavailable or invalid digest key rings", async (resolved, code) => {
    const fixture = createService({ endpointDigestKeys: { resolve: async () => resolved } });

    expect(await acceptInbound(fixture.service)).toEqual({ status: "unavailable", code });
    expect(fixture.repository.referenceState().inbound).toEqual([]);
  });

  it("fails closed when destination resolution is disabled", async () => {
    const fixture = createService({
      destinationResolver: { resolve: async () => ({ status: "unavailable" }) },
    });

    expect(await queueOutbound(fixture.service)).toEqual({
      status: "unavailable",
      code: "destination_unavailable",
      commandId: "outbound_command_1",
    });
    expect(fixture.repository.referenceState().outbound).toEqual([
      expect.objectContaining({
        commandId: "outbound_command_1",
        state: "failed",
        failureCode: "destination_unavailable",
        fingerprint: undefined,
        endpointDigests: undefined,
      }),
    ]);
    expect(await queueOutbound(fixture.service)).toEqual({
      status: "unavailable",
      code: "destination_unavailable",
      commandId: "outbound_command_1",
    });
  });

  it("reports an unresolved duplicate draft without re-running destination resolution", async () => {
    let resolverCalls = 0;
    let enterResolver!: () => void;
    let releaseResolver!: () => void;
    const resolverEntered = new Promise<void>((resolve) => {
      enterResolver = resolve;
    });
    const resolverReleased = new Promise<void>((resolve) => {
      releaseResolver = resolve;
    });
    const fixture = createService({
      destinationResolver: {
        resolve: async () => {
          resolverCalls += 1;
          enterResolver();
          await resolverReleased;
          return { status: "resolved", endpoint: "raw:endpoint:synthetic" };
        },
      },
    });

    const first = queueOutbound(fixture.service);
    await resolverEntered;
    await expect(queueOutbound(fixture.service)).resolves.toEqual({
      status: "in_progress",
      code: "outbound_draft_unresolved",
      commandId: "outbound_command_1",
    });
    expect(resolverCalls).toBe(1);
    releaseResolver();
    await expect(first).resolves.toMatchObject({ status: "created", commandId: "outbound_command_1" });
  });

  it("accepts a duplicate only when the stored outbound command is queued", async () => {
    const fixture = createService();
    const first = await queueOutbound(fixture.service);

    await expect(queueOutbound(fixture.service)).resolves.toEqual({
      status: "duplicate",
      commandId: first.commandId,
      messageId: first.messageId,
    });
  });
});
