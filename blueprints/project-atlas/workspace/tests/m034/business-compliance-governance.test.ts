import { describe, expect, it } from "vitest";

import {
  createComplianceAiSuggestion,
  createSafeComplianceAuditEvent,
  evaluateComplianceAutomation,
  evaluateOwnershipReporting,
} from "../../packages/business-compliance/src/index.ts";
import { now, profile, requirement } from "./fixtures.ts";

describe("M034 governance", () => {
  it("prohibits autonomous filing and keeps AI grounded and review-only", () => {
    expect(evaluateComplianceAutomation("submit_filing")).toEqual({
      allowed: false,
      reason: "HUMAN_GATE_REQUIRED",
    });
    expect(
      createComplianceAiSuggestion({
        requirementRefs: [requirement.requirementId],
        sourceReferences: [requirement.source.reference],
      }).canDeclareCompliance,
    ).toBe(false);
    expect(evaluateOwnershipReporting({ requirement, profile, at: now }).status).toBe(
      "professional_review_required",
    );
  });

  it("rejects sensitive audit payloads", () => {
    expect(() =>
      createSafeComplianceAuditEvent({
        eventType: "export",
        actorRef: "staff-34",
        resourceRef: "org-34",
        purpose: "support",
        correlationId: "corr-34",
        candidatePayload: { fullEin: "should-never-log" },
      }),
    ).toThrow("COMPLIANCE_AUDIT_SENSITIVE_PAYLOAD_PROHIBITED");
  });
});
