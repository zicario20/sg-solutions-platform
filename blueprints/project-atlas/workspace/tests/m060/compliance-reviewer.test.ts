import { describe, expect, it } from "vitest";
import {
  assessComplianceControl,
  createComplianceFindingCandidate,
  createComplianceReviewSession,
  isComplianceReviewerRuntimeEnabled
} from "../../packages/compliance-reviewer/src/index.ts";

const session = () => createComplianceReviewSession({
  correlationId: "m060-test",
  reviewKind: "action_gate",
  subjectType: "service_order",
  subjectId: "order-ref",
  actor: {
    actorId: "staff-ref",
    actorType: "staff",
    identityAssurance: "verified",
    complianceAuthorization: "valid",
    purposeAuthorization: "valid"
  },
  sourceReferences: [{
    sourceId: "source-ref",
    sourceVersionId: "v1",
    policyReference: "policy-ref",
    freshness: "current",
    classification: "internal"
  }]
});

describe("M060 Compliance Reviewer", () => {
  it("keeps runtime disabled and findings non-conclusive", () => {
    expect(isComplianceReviewerRuntimeEnabled()).toBe(false);
    expect(createComplianceFindingCandidate(session(), "potential_risk", ["evidence-ref"]).confirmedViolation).toBe(false);
  });
  it("blocks only an explicit current-policy prohibition", () => {
    expect(assessComplianceControl({
      session: session(),
      controlCode: "NO_EXTERNAL_SUBMISSION",
      deterministicProhibition: true,
      requiresHumanDecision: false,
      evidenceReferences: []
    }).status).toBe("blocked");
  });
  it("uses review required when policy sources are stale", () => {
    const current = session();
    const stale = { ...current, sourceReferences: current.sourceReferences.map((source) => ({ ...source, freshness: "stale" as const })) };
    expect(assessComplianceControl({
      session: stale,
      controlCode: "STALE_POLICY",
      deterministicProhibition: true,
      requiresHumanDecision: false,
      evidenceReferences: []
    }).status).toBe("review_required");
  });
});
