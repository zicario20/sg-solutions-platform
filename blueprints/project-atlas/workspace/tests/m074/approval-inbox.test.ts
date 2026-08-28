import { describe, expect, it } from "vitest";
import { APPROVAL_INBOX_PERMISSIONS, createApprovalContextSnapshot, createApprovalPolicy, createApprovalRequest, createApprovalScope, evaluateApproverEligibility, submitApprovalDecision } from "../../packages/approval-inbox/src/index";

const human = { actorId: "staff-1", tenantId: "tenant-1", actorKind: "human", permissions: Object.values(APPROVAL_INBOX_PERMISSIONS) } as const;
const ai = { actorId: "agent-1", tenantId: "tenant-1", actorKind: "ai", permissions: [APPROVAL_INBOX_PERMISSIONS.DECISION_SUBMIT] } as const;

describe("M074 approval inbox foundation", () => {
  it("records a scoped request without executing an action", () => {
    const policy = createApprovalPolicy(human, { code: "REFUND_APPROVAL", displayName: "Refund approval", ownerModule: "M043", riskClass: "high" });
    const scope = createApprovalScope(human, { scopeCode: "REFUND_SCOPE", ownerModule: "M043", operationCode: "REFUND_REQUEST", resourceReference: "payment-order-1", purpose: "Review requested refund" });
    const context = createApprovalContextSnapshot(human, { snapshotCode: "REFUND_CONTEXT", materialInputsHash: "hash-1", resourceVersion: "1", evidenceReferences: ["payment-summary-1"] });
    const request = createApprovalRequest(human, { requestCode: "REFUND_REQUEST_001", policyCode: policy.code, policyVersion: "1.0.0", scopeCode: scope.scopeCode, contextSnapshotCode: context.snapshotCode, requesterActorId: human.actorId });
    expect(request.actionExecuted).toBe(false);
  });
  it("does not treat the requester as an eligible approver", () => {
    const request = { requestCode: "REFUND_REQUEST_001", requesterActorId: human.actorId } as Parameters<typeof evaluateApproverEligibility>[1];
    const result = evaluateApproverEligibility(human, request, human.actorId);
    expect(result.status).toBe("not_eligible");
    expect(result.eligible).toBe(false);
  });
  it("prevents AI from submitting an approval decision", () => {
    expect(() => submitApprovalDecision(ai, { decisionCode: "REFUND_DECISION_001", requestCode: "REFUND_REQUEST_001", workItemCode: "REFUND_WORK_001", outcome: "approved" })).toThrow("Only an authenticated human");
  });
});
