import { describe, expect, it } from "vitest";

import {
  createDisabledReceptionRuntime,
  createReceptionHandoffPackage,
  createReceptionSupervisorTask,
  validateReceptionToolRequest,
} from "../../packages/reception-agent/src/index.ts";

const CREATED_AT = "2026-08-26T16:00:00.000Z";

describe("M049 Reception Agent routing and runtime", () => {
  it("prepares a minimized M050 intake handoff but never dispatches it", async () => {
    const handoff = createReceptionHandoffPackage({
      id: "handoff-001",
      sessionReference: "reception-session:001",
      target: "intake_agent",
      intent: "business_formation_information",
      locale: "es",
      factReferences: ["service-interest:llc-formation@1"],
      sourceReferences: ["catalog:business-formation@1"],
      expiresAt: "2026-08-26T16:30:00.000Z",
      createdAt: CREATED_AT,
    });
    expect(handoff.status).toBe("prepared");
    expect(handoff.executionPermitted).toBe(false);

    const runtime = createDisabledReceptionRuntime({
      receptionEnabled: false,
      providerCallsEnabled: false,
      leadWritesEnabled: false,
      secureLinkIssuanceEnabled: false,
      handoffDispatchEnabled: false,
      followUpEnabled: false,
    });
    await expect(
      runtime.dispatchHandoff({ handoffReference: "reception-handoff:001@1" }),
    ).resolves.toEqual({
      status: "blocked",
      reason: "reception_runtime_disabled",
    });
  });

  it("maps only a minimized request into the M048 supervisor envelope", () => {
    const task = createReceptionSupervisorTask({
      id: "supervisor-task-001",
      idempotencyKey: "reception-session:001:supervisor@1",
      sessionReference: "reception-session:001",
      tenantReference: "tenant:sg-solutions",
      locale: "en",
      intent: "unknown",
      reasonCodes: ["clarification_required"],
      createdAt: CREATED_AT,
    });

    expect(task.surface).toBe("public_indirect");
    expect(task.classification.dataSensitivity).toBe("public");
    expect(task.classification.requestedOutcomes).toEqual(["human_review"]);
    expect(JSON.stringify(task)).not.toContain("visitor message");
  });

  it("allows preparation-only tools and rejects execution or prohibited tools", () => {
    const preparation = validateReceptionToolRequest({
      tool: "prepare_intake_handoff",
      executionRequested: false,
      authenticated: false,
    });
    expect(preparation.status).toBe("prepared");
    expect(preparation.executionPermitted).toBe(false);

    expect(() =>
      validateReceptionToolRequest({
        tool: "issue_payment_link",
        executionRequested: true,
        authenticated: false,
      }),
    ).toThrow(/not allowed|prohibited/i);
  });
});
