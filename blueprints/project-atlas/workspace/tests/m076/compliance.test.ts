import { describe, expect, it } from "vitest";

import {
  createComplianceAssessment,
  createComplianceRequirement,
  createComplianceSubjectContext,
  requestComplianceException,
} from "../../packages/compliance/src/index";

describe("M076 compliance controlled foundation", () => {
  it("keeps new requirements in draft and inactive", () => {
    const requirement = createComplianceRequirement({
      permission: "compliance.requirement.create",
      code: "CREDIT_DISCLOSURE_REVIEW",
      version: 1,
      sourceReferences: ["source:ftc-credit-practice"],
    });

    expect(requirement.status).toBe("draft");
    expect(requirement.active).toBe(false);
  });

  it("does not provide a legal conclusion or update a workflow gate", () => {
    const assessment = createComplianceAssessment({
      permission: "compliance.assessment.create",
      assessmentId: "assessment-1",
      subject: createComplianceSubjectContext({
        subjectReference: "service-order:order-1",
        jurisdictionReference: "jurisdiction:IL",
        asOfDate: "2026-08-28T00:00:00.000Z",
      }),
    });

    expect(assessment.overallStatus).toBe("unknown");
    expect(assessment.legalConclusionProvided).toBe(false);
    expect(assessment.workflowGateUpdated).toBe(false);
  });

  it("does not turn an exception request into compliance", () => {
    const requirement = createComplianceRequirement({
      permission: "compliance.requirement.create",
      code: "TAX_DOCUMENT_REVIEW",
      version: 1,
      sourceReferences: ["source:irs-guidance"],
    });
    const exceptionRequest = requestComplianceException({
      permission: "compliance.exception.request",
      exceptionId: "exception-1",
      requirement,
    });

    expect(exceptionRequest.approved).toBe(false);
    expect(exceptionRequest.establishesCompliance).toBe(false);
  });
});
