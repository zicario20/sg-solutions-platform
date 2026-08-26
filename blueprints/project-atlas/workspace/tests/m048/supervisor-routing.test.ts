import { describe, expect, it } from "vitest";

import {
  createRoutingDecision,
  createSpecialistRegistration,
  createSupervisorTaskEnvelope,
  evaluateSpecialistCandidates,
} from "../../packages/supervisor-agent/src/index.ts";

const task = createSupervisorTaskEnvelope({
  id: "supervisor-task-credit-001",
  idempotencyKey: "message:credit-001:v1",
  source: "secure_message",
  surface: "client_indirect",
  tenantReference: "tenant:acme",
  resourceReferences: ["case:credit-001"],
  locale: "es",
  classification: {
    intents: ["credit_guidance"],
    domains: ["credit"],
    requestedOutcomes: ["education"],
    risk: "low",
    dataSensitivity: "confidential",
    urgency: "normal",
    complexity: "standard",
    ambiguity: "clear",
  },
  authorization: {
    authenticated: true,
    resourceOwnershipVerified: true,
    consentReferences: ["consent:service@1"],
    entitlementReferences: ["entitlement:credit-guidance@1"],
  },
  createdAt: "2026-08-26T12:00:00.000Z",
});

const creditSpecialist = createSpecialistRegistration({
  code: "CREDIT_GUIDANCE_SPECIALIST",
  manifestReference: "agent-manifest:credit-guidance@1",
  status: "approved_disabled",
  supportedSurfaces: ["client_indirect", "backend"],
  supportedIntents: ["credit_guidance"],
  supportedDomains: ["credit"],
  supportedOutcomes: ["education"],
  maximumRisk: "moderate",
  maximumDataSensitivity: "restricted",
  locales: ["es", "en"],
  jurisdictions: ["US"],
  requiresAuthentication: true,
  requiresVerifiedOwnership: true,
  requiresConsent: true,
  requiresEntitlement: true,
  operationalAvailability: "disabled",
  priority: 10,
  createdAt: "2026-08-26T12:00:00.000Z",
});

describe("M048 supervisor routing", () => {
  it("creates a deterministic candidate decision without dispatching a specialist", () => {
    const evaluation = evaluateSpecialistCandidates({
      task,
      specialists: [creditSpecialist],
      jurisdiction: "US",
    });

    expect(evaluation.candidates).toHaveLength(1);
    expect(evaluation.candidates[0]?.registration.code).toBe("CREDIT_GUIDANCE_SPECIALIST");
    expect(evaluation.candidates[0]?.executionEligible).toBe(false);
    expect(evaluation.candidates[0]?.exclusionReasons).toContain("specialist_runtime_disabled");

    const decision = createRoutingDecision({
      task,
      candidateEvaluation: evaluation,
      policy: {
        code: "CREDIT_GUIDANCE_ROUTING@1",
        defaultRoute: "human_escalation",
        allowSequentialPlanning: true,
        allowParallelPlanning: false,
        allowSelfHandling: false,
        maxDelegationDepth: 1,
      },
      createdAt: "2026-08-26T12:01:00.000Z",
    });

    expect(decision.status).toBe("human_escalation");
    expect(decision.selectedSpecialistCode).toBeNull();
    expect(decision.executionPermitted).toBe(false);
  });

  it("fails closed for prohibited outcomes and cross-tenant ownership", () => {
    const unsafeTask = createSupervisorTaskEnvelope({
      ...task,
      id: "supervisor-task-unsafe-001",
      idempotencyKey: "message:unsafe-001:v1",
      classification: {
        ...task.classification,
        requestedOutcomes: ["grant_entitlement"],
      },
      authorization: {
        ...task.authorization,
        resourceOwnershipVerified: false,
      },
    });

    const evaluation = evaluateSpecialistCandidates({
      task: unsafeTask,
      specialists: [creditSpecialist],
      jurisdiction: "US",
    });

    expect(evaluation.candidates).toHaveLength(0);
    expect(evaluation.exclusions.flatMap((item) => item.reasons)).toEqual(
      expect.arrayContaining(["prohibited_outcome", "resource_ownership_not_verified"]),
    );
  });
});
