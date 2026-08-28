import { describe, expect, it } from "vitest";
import { FALLBACK_SYSTEM_PERMISSIONS, createFallbackCandidate, createFallbackDecision, createFallbackPolicy, createFallbackTarget, evaluateFallback, recordFallbackUnknownOutcome } from "../../packages/fallback-system/src/index";

const actor = { actorId: "staff-1", tenantId: "tenant-1", permissions: Object.values(FALLBACK_SYSTEM_PERMISSIONS) } as const;

describe("M073 fallback system foundation", () => {
  it("keeps fallback targets disconnected and ineligible for automatic selection", () => {
    const policy = createFallbackPolicy(actor, { code: "DOCUMENT_FALLBACK", displayName: "Document fallback", ownerModule: "M065" });
    const target = createFallbackTarget(actor, { code: "MANUAL_DOCUMENT_PATH", capabilityCode: "DOCUMENT_REVIEW", targetType: "manual" });
    const candidate = createFallbackCandidate(actor, { code: "DOCUMENT_CANDIDATE", targetCode: target.code, operationReference: "operation-1" });
    expect(policy.active).toBe(false);
    expect(target.connectionConfigured).toBe(false);
    expect(candidate.hardGatesSatisfied).toBe(false);
  });
  it("does not select or dispatch a fallback from a runtime evaluation", () => {
    const evaluation = evaluateFallback(actor, { evaluationCode: "FALLBACK_EVAL_001", operationReference: "operation-1", policyVersion: "1.0.0" });
    const decision = createFallbackDecision(actor, { decisionCode: "FALLBACK_DECISION_001", operationReference: "operation-1", policyVersion: "1.0.0" });
    expect(evaluation.targetSelected).toBe(false);
    expect(decision.executionAuthorized).toBe(false);
  });
  it("blocks alternate side effects while reconciliation is required", () => {
    const record = recordFallbackUnknownOutcome(actor, { operationReference: "operation-1" });
    expect(record.alternateSideEffectBlocked).toBe(true);
  });
});
