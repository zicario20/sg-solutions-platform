import { describe, expect, it } from "vitest";

async function loadEntitlements() {
  return import("@atlas/service-entitlements");
}

describe("M045 entitlement lifecycle and enforcement", () => {
  it("enforces usage atomically, expires temporary access, and invalidates cached decisions", async () => {
    const {
      EntitlementDecisionCache,
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      consumeEntitlementUsage,
      createTemporaryEntitlementGrant,
      expireEntitlementGrant,
    } = await loadEntitlements();
    const repository = new InMemoryEntitlementRepository();
    const cache = new EntitlementDecisionCache();
    const engine = new ServiceEntitlementEngine(repository, { cache });
    const grant = createTemporaryEntitlementGrant({
      id: "grant-usage",
      entitlementDefinitionId: "definition-usage",
      subject: {
        subjectType: "client",
        subjectId: "client-001",
        tenantId: "sg-solutions",
        clientId: "client-001",
      },
      resource: {
        resourceType: "service_order",
        resourceId: "order-001",
        tenantId: "sg-solutions",
        ownerSubjectId: "client-001",
        serviceOrderId: "order-001",
      },
      scopeType: "service_order_specific",
      effectiveFrom: "2026-08-26T11:00:00.000Z",
      expiresAt: "2026-08-26T13:00:00.000Z",
      reason: "approved one-use consultation",
      approvedBy: "staff-001",
      usageLimit: 1,
    });
    const firstUse = consumeEntitlementUsage(repository, grant, {
      idempotencyKey: "usage-1",
      amount: 1,
      occurredAt: "2026-08-26T12:00:00.000Z",
    });
    const duplicateUse = consumeEntitlementUsage(repository, grant, {
      idempotencyKey: "usage-1",
      amount: 1,
      occurredAt: "2026-08-26T12:00:00.000Z",
    });
    const exhaustedUse = consumeEntitlementUsage(repository, firstUse.grant, {
      idempotencyKey: "usage-2",
      amount: 1,
      occurredAt: "2026-08-26T12:01:00.000Z",
    });
    cache.set({
      tenantId: "sg-solutions",
      subjectId: "client-001",
      entitlementKey: "service.tax.schedule_consultation",
      resourceId: "order-001",
      policyVersion: 1,
      contextVersion: "ctx-v1",
      decisionId: "decision-1",
      expiresAt: "2026-08-26T12:30:00.000Z",
    });

    expect(firstUse.accepted).toBe(true);
    expect(duplicateUse.accepted).toBe(true);
    expect(duplicateUse.grant.usageUsed).toBe(1);
    expect(exhaustedUse.accepted).toBe(false);
    expect(expireEntitlementGrant(grant, "2026-08-26T14:00:00.000Z").status).toBe("expired");
    engine.invalidate({
      tenantId: "sg-solutions",
      subjectId: "client-001",
      reason: "payment_changed",
    });
    expect(
      cache.get({
        tenantId: "sg-solutions",
        subjectId: "client-001",
        entitlementKey: "service.tax.schedule_consultation",
        resourceId: "order-001",
        policyVersion: 1,
        contextVersion: "ctx-v1",
        now: "2026-08-26T12:01:00.000Z",
      }),
    ).toBeUndefined();
  });

  it("blocks AI actors and keeps provider and workflow handoffs disabled", async () => {
    const {
      DisabledEntitlementRuntimeAdapter,
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      assertEntitlementActorAllowed,
    } = await loadEntitlements();
    const adapter = new DisabledEntitlementRuntimeAdapter();
    const engine = new ServiceEntitlementEngine(new InMemoryEntitlementRepository());

    expect(() => assertEntitlementActorAllowed({ actorType: "ai", actorId: "model-001" })).toThrow(
      /cannot grant, deny, approve, revoke, or consume/i,
    );
    expect(adapter.acceptM044PaymentGate()).toEqual({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(adapter.dispatchWorkflowAuthorization()).toEqual({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(engine.runtimeControls().workflowHandoffEnabled).toBe(false);
  });
});
