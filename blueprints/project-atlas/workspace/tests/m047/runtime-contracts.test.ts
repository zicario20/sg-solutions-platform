import {
  createAgentHandoffRequest,
  createAIAgentRun,
  createExecutionPlan,
  createHumanApprovalRequest,
  DisabledAIHubRuntimeAdapter,
  transitionAgentRunStep,
} from "@atlas/ai-control-plane";
import { describe, expect, it } from "vitest";

describe("M047 runtime contracts", () => {
  const run = createAIAgentRun({
    id: "run-047",
    tenantId: "tenant-047",
    agentVersionId: "agent-version-047",
    invocationType: "interactive",
    invocationAuthorizationReference: "authorization@1",
    inputSnapshotReference: "input-snapshot@1",
    contextSnapshotReference: "context-snapshot@1",
    status: "draft",
    createdAt: "2026-08-26T12:00:00.000Z",
  });

  it("creates immutable run plans without expanding tool authority", () => {
    expect(() =>
      createExecutionPlan({
        id: "plan-invalid",
        runId: run.id,
        allowedToolCodes: ["GET_CASE_SUMMARY"],
        requestedToolCodes: ["ISSUE_REFUND"],
        actionScopeHash: "action-scope@1",
      }),
    ).toThrow("not allowed");
    const step = transitionAgentRunStep(
      {
        id: "step-047",
        runId: run.id,
        ordinal: 1,
        stepType: "reasoning_boundary",
        status: "queued",
        version: 1,
      },
      "running",
      1,
    );
    expect(step.status).toBe("running");
  });

  it("minimizes handoffs and binds human approval to exact parameters", () => {
    expect(() =>
      createAgentHandoffRequest({
        id: "handoff-invalid",
        sourceRunId: run.id,
        targetAgentVersionId: "agent-version-target",
        purpose: "summary",
        factReferences: [],
        sourceReferences: [],
        status: "requested",
      }),
    ).toThrow("minimized facts");
    const approval = createHumanApprovalRequest({
      id: "approval-047",
      runId: run.id,
      actionType: "tool_execution",
      parameterHash: "parameters@1",
      requiredApproverRoles: ["ai.approver"],
      expiresAt: "2026-08-27T12:00:00.000Z",
      status: "pending",
    });
    expect(approval.parameterHash).toBe("parameters@1");
  });

  it("keeps runtime execution disabled", () => {
    const adapter = new DisabledAIHubRuntimeAdapter();
    expect(adapter.startRun()).toMatchObject({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(adapter.dispatchTool()).toMatchObject({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(adapter.dispatchJob()).toMatchObject({
      status: "blocked",
      reason: "activation_not_authorized",
    });
  });
});
