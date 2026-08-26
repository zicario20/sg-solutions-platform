import { describe, expect, it } from "vitest";

import {
  createDisabledSupervisorRuntime,
  createSupervisorAuditEvent,
  evaluateLoopGuard,
  validateSupervisorChangeRequest,
} from "../../packages/supervisor-agent/src/index.ts";

describe("M048 runtime and governance", () => {
  it("blocks runtime work while the module and delegation switches remain disabled", async () => {
    const runtime = createDisabledSupervisorRuntime({
      supervisorEnabled: false,
      delegationEnabled: false,
      providerCallsEnabled: false,
    });

    await expect(runtime.start({ planReference: "plan:credit@1" })).resolves.toEqual({
      status: "blocked",
      reason: "supervisor_runtime_disabled",
    });
    await expect(
      runtime.dispatchHandoff({ handoffReference: "handoff:credit@1" }),
    ).resolves.toEqual({
      status: "blocked",
      reason: "supervisor_runtime_disabled",
    });
  });

  it("detects no-progress loops and creates a tamper-evident audit chain", () => {
    const loop = evaluateLoopGuard({
      routingHistory: ["CREDIT", "DOCUMENTS", "CREDIT", "DOCUMENTS"],
      maximumRepeatedRoutePairs: 1,
      noProgressEvents: 3,
      maximumNoProgressEvents: 2,
    });
    expect(loop.action).toBe("human_escalation");

    const first = createSupervisorAuditEvent({
      id: "audit-1",
      eventType: "routing_decision_created",
      resourceReference: "routing-decision:credit@1",
      occurredAt: "2026-08-26T12:00:00.000Z",
      previousHash: null,
    });
    const second = createSupervisorAuditEvent({
      id: "audit-2",
      eventType: "routing_escalated",
      resourceReference: "routing-decision:credit@1",
      occurredAt: "2026-08-26T12:01:00.000Z",
      previousHash: first.hash,
    });

    expect(first.hash).not.toEqual(second.hash);
    expect(second.previousHash).toBe(first.hash);
  });

  it("rejects self-modification and changes without an authorized human approval", () => {
    expect(() =>
      validateSupervisorChangeRequest({
        type: "self_modify",
        actorType: "agent",
        humanApprovalReference: null,
        changeReference: "routing-policy:credit@2",
      }),
    ).toThrow(/self-modification/i);

    expect(() =>
      validateSupervisorChangeRequest({
        type: "routing_policy_change",
        actorType: "staff",
        humanApprovalReference: null,
        changeReference: "routing-policy:credit@2",
      }),
    ).toThrow(/approval/i);
  });
});
