import { decideApproval, validateExecutionAuthorization } from "@atlas/approvals";
import { describe, expect, it } from "vitest";

describe("M024 approval foundation", () => {
  const request = {
    requestId: "approval-1",
    action: "service_start" as const,
    state: "pending" as const,
    risk: "high" as const,
    requesterId: "staff-a",
    payloadHash: "a".repeat(64),
    approvedByIds: [],
    policy: {
      code: "START",
      version: "1.0.0",
      action: "service_start" as const,
      minimumApprovers: 1,
      requireSeparationOfDuties: true,
      expiresAfterMinutes: 30,
    },
    expiresAt: "2030-01-01T00:00:00.000Z",
  };
  it("does not allow self-approval", () => {
    expect(decideApproval(request, "staff-a", "approve", new Date("2026-08-25")).accepted).toBe(
      false,
    );
  });
  it("binds approval to the reviewed payload before execution", () => {
    const decision = decideApproval(request, "staff-b", "approve", new Date("2026-08-25"));
    const authorization = decision.executionAuthorization;
    if (!authorization) throw new Error("Expected an execution authorization.");
    expect(
      validateExecutionAuthorization(
        { ...request, state: "approved" },
        authorization,
        request.payloadHash,
        new Date("2026-08-25"),
      ),
    ).toBe(true);
    expect(
      validateExecutionAuthorization(
        { ...request, state: "approved" },
        authorization,
        "b".repeat(64),
        new Date("2026-08-25"),
      ),
    ).toBe(false);
  });
});
