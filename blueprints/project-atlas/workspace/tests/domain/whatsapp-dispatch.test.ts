import { describe, expect, it } from "vitest";
import {
  canonicalEndpointReference,
  CommunicationsService,
  dispatchOutboundMessage,
  MemoryCommunicationsRepository,
} from "@atlas/domain";
import { dispatchOutboundMessage as dispatchAppOutboundMessage } from "../../apps/app/src/lib/whatsapp/jobs.ts";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const LATER = new Date("2026-08-20T12:05:00.000Z");
const TOMORROW = new Date("2026-08-21T12:00:00.000Z");

function fixture(provider: { dispatch(): Promise<{ status: "accepted" }>; calls: number } | { dispatch(): Promise<never>; calls: number }) {
  const repository = new MemoryCommunicationsRepository({
    bindings: [{ bindingId: "binding_1", channel: "whatsapp", trustState: "reverified", freshUntil: TOMORROW, createdAt: NOW, updatedAt: NOW }],
    policies: [{ policyId: "policy_1", bindingId: "binding_1", state: "normal", version: 7, fence: 42, updatedAt: NOW }],
    consents: [{ bindingId: "binding_1", purpose: "transactional", state: "granted", version: 1, receipt: { receiptId: "consent_receipt_1", owner: "consent", operation: "consent_confirmation", bindingId: "binding_1", issuedAt: NOW, expiresAt: TOMORROW }, changedAt: NOW }],
    connections: [{ channel: "whatsapp", state: "active" }],
    templates: [{ templateId: "template_1", locale: "en", definitionVersion: 1, internallyApproved: true, providerState: "provider_approved", providerVersion: 1, updatedAt: NOW }],
  });
  let id = 0;
  const service = new CommunicationsService({
    repository,
    clock: { now: () => NOW },
    ids: { next: (kind) => `${kind}_${++id}` },
    endpointDigestKeys: { resolve: async () => ({ status: "available", active: { purpose: "communications_endpoint_digest", version: "v1", key: "key" }, prior: [] }) },
    keyedDigest: { digest: async () => "endpoint_digest" },
    destinationResolver: { resolve: async () => ({ status: "resolved", endpoint: "+15555550123" }) },
    boundedExecutor: { run: async (_operation, _timeout, action) => action() },
    provider,
    publicKnowledge: { answer: async () => ({ status: "unavailable" }) },
    contentPolicy: { evaluate: () => ({ allowed: true, code: "allowed" }) },
    handoff: { request: async () => ({ status: "unavailable" }) },
    providerTimeoutMs: 2_000,
    knowledgeTimeoutMs: 500,
    handoffTimeoutMs: 500,
  });
  return { repository, service };
}

async function queue(service: CommunicationsService) {
  return service.queueOutbound({
    channel: "whatsapp",
    locale: "en",
    conversationId: "conversation_1",
    bindingId: "binding_1",
    body: "Synthetic outbound",
    purpose: "transactional",
    templateId: "template_1",
    idempotencyKey: "outbound_key_1",
    fingerprint: "fingerprint_1",
    requiredPolicyVersion: 7,
    requiredFence: 42,
    authorizationReceipt: { receiptId: "dispatch_receipt_1", owner: "communications", operation: "outbound_dispatch", bindingId: "binding_1", destinationKey: canonicalEndpointReference("endpoint_digest"), issuedAt: NOW, expiresAt: TOMORROW },
    correlationId: "correlation_1",
  });
}

describe("WhatsApp dispatch job", () => {
  it("records ambiguous timeout as dispatch_unknown and never blindly retries", async () => {
    const provider = {
      calls: 0,
      async dispatch(): Promise<never> {
        this.calls += 1;
        throw new Error("synthetic response loss");
      },
    };
    const { repository, service } = fixture(provider);
    const queued = await queue(service);
    const commandId = String(queued.commandId);

    expect(await dispatchOutboundMessage({ service, commandId, leaseOwner: "worker_1", leaseExpiresAt: LATER })).toMatchObject({ status: "dispatch_unknown" });
    expect(await dispatchOutboundMessage({ service, commandId, leaseOwner: "worker_2", leaseExpiresAt: LATER })).toEqual({ status: "not_dispatched", code: "dispatch_unknown_non_retryable" });
    expect(provider.calls).toBe(1);
    expect(repository.referenceState().attempts).toEqual([expect.objectContaining({ state: "dispatch_unknown" })]);
  });

  it("blocks provider traffic in the app boundary before the service can run", async () => {
    let calls = 0;
    const result = await dispatchAppOutboundMessage({
      providerTrafficAllowed: false,
      service: { dispatchOutbound: async () => { calls += 1; return { status: "accepted" }; } },
      commandId: "command_1",
      leaseOwner: "worker_1",
      leaseExpiresAt: LATER,
    });
    expect(result).toEqual({ status: "unavailable", code: "provider_disabled" });
    expect(calls).toBe(0);
  });

  it("rechecks policy under the binding lock and cancels a withdrawn send before dispatch", async () => {
    const provider = { calls: 0, async dispatch() { this.calls += 1; return { status: "accepted" as const }; } };
    const { repository, service } = fixture(provider);
    const queued = await queue(service);
    await repository.withdrawContact({
      bindingId: "binding_1",
      evidence: { source: "authority", receipt: { receiptId: "receipt_withdraw_1", owner: "consent", operation: "contact_withdrawal", bindingId: "binding_1", issuedAt: NOW, expiresAt: TOMORROW, correlationId: "correlation_withdraw_1" } },
      now: NOW,
    });
    expect(await dispatchOutboundMessage({ service, commandId: String(queued.commandId), leaseOwner: "worker_1", leaseExpiresAt: LATER })).toEqual({ status: "not_dispatched", code: "contact_policy_denied" });
    expect(provider.calls).toBe(0);
  });
});
