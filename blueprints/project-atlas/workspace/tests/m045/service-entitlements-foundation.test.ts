import { describe, expect, it } from "vitest";

async function loadEntitlements() {
  return import("@atlas/service-entitlements");
}

const subject = (overrides: Record<string, unknown> = {}) => ({
  subjectType: "client",
  subjectId: "client-001",
  tenantId: "sg-solutions",
  identityId: "account-001",
  clientId: "client-001",
  ...overrides,
});

const resource = (overrides: Record<string, unknown> = {}) => ({
  resourceType: "service_order",
  resourceId: "order-001",
  tenantId: "sg-solutions",
  serviceOrderId: "order-001",
  ownerSubjectId: "client-001",
  ...overrides,
});

const context = (overrides: Record<string, unknown> = {}) => ({
  ownership: "owned",
  paymentGate: "satisfied",
  humanAuthorization: "authorized",
  documentReadiness: "ready",
  intakeStatus: "complete",
  consentStatus: "granted",
  identityStatus: "verified",
  jurisdictionStatus: "allowed",
  serviceOrderStatus: "active",
  sourceVersions: {
    payment: "m044.v1",
    approval: "m074.v1",
    documents: "m011.v1",
    consent: "m078.v1",
  },
  ...overrides,
});

describe("M045 service entitlement decisions", () => {
  it("allows a scoped capability only after every active condition is satisfied", async () => {
    const {
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      createActiveEntitlementPolicy,
      createEntitlementDefinition,
    } = await loadEntitlements();
    const definition = createEntitlementDefinition({
      id: "definition-status",
      entitlementKey: "service.formation.view_status",
      entitlementType: "capability_access",
      ownerDomain: "business_formation",
      resourceType: "service_order",
    });
    const policy = createActiveEntitlementPolicy({
      id: "policy-status-v1",
      policyCode: "FORMATION_STATUS_V1",
      version: 1,
      entitlementDefinitionId: definition.id,
      requiredConditions: [
        "payment_gate",
        "human_authorization",
        "document_readiness",
        "consent_status",
      ],
    });
    const engine = new ServiceEntitlementEngine(new InMemoryEntitlementRepository());

    const result = engine.evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource(),
      context: context(),
      grants: [],
      denies: [],
      requestedAction: "view_service_status",
      correlationId: "corr-allow",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.decision.status).toBe("allow");
    expect(result.decision.policyVersion).toBe(1);
    expect(result.decision.snapshot.contentHash).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("keeps payment verification separate from human authorization and workflow execution", async () => {
    const {
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      createActiveEntitlementPolicy,
      createEntitlementDefinition,
    } = await loadEntitlements();
    const definition = createEntitlementDefinition({
      id: "definition-start",
      entitlementKey: "service.formation.start_intake",
      entitlementType: "workflow_action",
      ownerDomain: "business_formation",
      resourceType: "service_order",
    });
    const policy = createActiveEntitlementPolicy({
      id: "policy-start-v1",
      policyCode: "FORMATION_START_V1",
      version: 1,
      entitlementDefinitionId: definition.id,
      requiredConditions: ["payment_gate", "human_authorization"],
    });
    const engine = new ServiceEntitlementEngine(new InMemoryEntitlementRepository());

    const result = engine.evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource(),
      context: context({ humanAuthorization: "missing" }),
      grants: [],
      denies: [],
      requestedAction: "start_intake",
      correlationId: "corr-approval-missing",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.decision.status).toBe("action_required");
    expect(result.decision.nextActions).toContain("wait_for_review");
    expect(result.workflowHandoff.status).toBe("blocked");
  });

  it("fails closed for cross-client resources, explicit denies, and unknown blocking payment evidence", async () => {
    const {
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      createActiveEntitlementPolicy,
      createEntitlementDefinition,
      createEntitlementDeny,
      createTemporaryEntitlementGrant,
    } = await loadEntitlements();
    const definition = createEntitlementDefinition({
      id: "definition-documents",
      entitlementKey: "service.tax.upload_documents",
      entitlementType: "document_access",
      ownerDomain: "tax",
      resourceType: "document_collection",
    });
    const policy = createActiveEntitlementPolicy({
      id: "policy-documents-v1",
      policyCode: "TAX_DOCUMENTS_V1",
      version: 1,
      entitlementDefinitionId: definition.id,
      requiredConditions: ["payment_gate"],
    });
    const engine = new ServiceEntitlementEngine(new InMemoryEntitlementRepository());
    const crossClient = engine.evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource({ resourceType: "document_collection", ownerSubjectId: "client-002" }),
      context: context(),
      grants: [],
      denies: [],
      requestedAction: "upload_document",
      correlationId: "corr-cross-client",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });
    const temporaryGrant = createTemporaryEntitlementGrant({
      id: "grant-temporary",
      entitlementDefinitionId: definition.id,
      subject: subject(),
      resource: resource({ resourceType: "document_collection" }),
      scopeType: "resource_specific",
      effectiveFrom: "2026-08-26T11:00:00.000Z",
      expiresAt: "2026-08-26T13:00:00.000Z",
      reason: "approved support window",
      approvedBy: "staff-001",
    });
    const deny = createEntitlementDeny({
      id: "deny-security",
      entitlementDefinitionId: definition.id,
      subject: subject(),
      resource: resource({ resourceType: "document_collection" }),
      scopeType: "resource_specific",
      reason: "security hold",
      authorityReference: "approval-security-001",
      effectiveFrom: "2026-08-26T11:00:00.000Z",
    });
    const denied = engine.evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource({ resourceType: "document_collection" }),
      context: context(),
      grants: [temporaryGrant],
      denies: [deny],
      requestedAction: "upload_document",
      correlationId: "corr-explicit-deny",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });
    const unknownPayment = engine.evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource({ resourceType: "document_collection" }),
      context: context({ paymentGate: "unknown" }),
      grants: [],
      denies: [],
      requestedAction: "upload_document",
      correlationId: "corr-payment-unknown",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(crossClient.decision.status).toBe("deny");
    expect(crossClient.finding?.type).toBe("cross_client_access_attempt");
    expect(denied.decision.status).toBe("deny");
    expect(denied.decision.denyIds).toEqual(["deny-security"]);
    expect(denied.decision.grantIds).toEqual([]);
    expect(unknownPayment.decision.status).toBe("deny");
  });

  it("fails closed when a required condition has no source-version evidence", async () => {
    const {
      InMemoryEntitlementRepository,
      ServiceEntitlementEngine,
      createActiveEntitlementPolicy,
      createEntitlementDefinition,
    } = await loadEntitlements();
    const definition = createEntitlementDefinition({
      id: "definition-source-evidence",
      entitlementKey: "service.tax.view_status",
      entitlementType: "capability_access",
      ownerDomain: "tax",
      resourceType: "service_order",
    });
    const policy = createActiveEntitlementPolicy({
      id: "policy-source-evidence-v1",
      policyCode: "TAX_STATUS_SOURCE_EVIDENCE_V1",
      version: 1,
      entitlementDefinitionId: definition.id,
      requiredConditions: ["payment_gate"],
    });

    const result = new ServiceEntitlementEngine(new InMemoryEntitlementRepository()).evaluate({
      definition,
      policy,
      subject: subject(),
      resource: resource(),
      context: context({ sourceVersions: {} }),
      grants: [],
      denies: [],
      requestedAction: "view_service_status",
      correlationId: "corr-source-evidence-missing",
      evaluatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.decision.status).toBe("deny");
    expect(result.finding?.type).toBe("unknown_blocking_condition");
  });
});
