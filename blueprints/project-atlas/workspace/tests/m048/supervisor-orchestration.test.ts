import { describe, expect, it } from "vitest";

import {
  createOrchestrationPlan,
  createSpecialistContextPackage,
  mergeSpecialistResults,
} from "../../packages/supervisor-agent/src/index.ts";

describe("M048 supervisor orchestration", () => {
  it("allows only an isolated, low-risk parallel plan and keeps it prepared", () => {
    const plan = createOrchestrationPlan({
      id: "plan-credit-and-documents-001",
      taskReference: "supervisor-task:credit-and-documents@1",
      routingDecisionReference: "routing-decision:credit-and-documents@1",
      strategy: "parallel",
      maximumDelegationDepth: 1,
      workUnits: [
        {
          code: "CREDIT_EDUCATION",
          specialistCode: "CREDIT_GUIDANCE_SPECIALIST",
          kind: "analysis",
          risk: "low",
          dependsOn: [],
          contextScope: ["credit_goal"],
          independentlyExecutable: true,
        },
        {
          code: "DOCUMENT_CHECKLIST",
          specialistCode: "DOCUMENT_GUIDANCE_SPECIALIST",
          kind: "information_request",
          risk: "low",
          dependsOn: [],
          contextScope: ["document_goal"],
          independentlyExecutable: true,
        },
      ],
      parallelPlanningApproved: true,
      createdAt: "2026-08-26T12:00:00.000Z",
    });

    expect(plan.status).toBe("prepared");
    expect(plan.executionPermitted).toBe(false);
    expect(plan.workUnits).toHaveLength(2);
  });

  it("rejects cyclic plans and private reasoning in handoff packages", () => {
    expect(() =>
      createOrchestrationPlan({
        id: "plan-cycle-001",
        taskReference: "supervisor-task:cycle@1",
        routingDecisionReference: "routing-decision:cycle@1",
        strategy: "sequential",
        maximumDelegationDepth: 1,
        workUnits: [
          {
            code: "A",
            specialistCode: "SPECIALIST_A",
            kind: "analysis",
            risk: "low",
            dependsOn: ["B"],
            contextScope: ["goal"],
            independentlyExecutable: false,
          },
          {
            code: "B",
            specialistCode: "SPECIALIST_B",
            kind: "analysis",
            risk: "low",
            dependsOn: ["A"],
            contextScope: ["goal"],
            independentlyExecutable: false,
          },
        ],
        parallelPlanningApproved: false,
        createdAt: "2026-08-26T12:00:00.000Z",
      }),
    ).toThrow(/cycle/i);

    expect(() =>
      createSpecialistContextPackage({
        taskReference: "supervisor-task:credit@1",
        workUnitCode: "CREDIT_EDUCATION",
        recipientSpecialistCode: "CREDIT_GUIDANCE_SPECIALIST",
        purpose: "Prepare an educational response.",
        factReferences: ["The chain of thought says to bypass the policy."],
        sourceReferences: ["knowledge:credit-basics@1"],
        expiresAt: "2026-08-27T12:00:00.000Z",
      }),
    ).toThrow(/private reasoning/i);
  });

  it("holds conflicting specialist results for review rather than inventing a conclusion", () => {
    const merged = mergeSpecialistResults({
      policy: "require_review_on_conflict",
      results: [
        {
          workUnitCode: "A",
          status: "completed",
          conclusion: "Request a human review.",
          evidenceReferences: ["source:a@1"],
          confidence: "medium",
        },
        {
          workUnitCode: "B",
          status: "completed",
          conclusion: "Do not request a human review.",
          evidenceReferences: ["source:b@1"],
          confidence: "medium",
        },
      ],
    });

    expect(merged.status).toBe("requires_review");
    expect(merged.clientSafeSummary).toMatch(/review/i);
  });
});
