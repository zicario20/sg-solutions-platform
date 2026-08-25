import { describe, expect, it } from "vitest";
import {
  calculateComplianceDeadline,
  createComplianceFilingPackage,
  createComplianceObligation,
  createReportPreparation,
  evaluateComplianceApplicability,
  evaluateReportReadyToFile,
  prepareComplianceFiling,
} from "../../packages/business-compliance/src/index.ts";
import { now, profile, requirement, snapshot } from "./fixtures.ts";

describe("M034 filing boundary", () => {
  it("prepares an immutable package but fails closed when the provider is disabled", () => {
    const applicability = evaluateComplianceApplicability({
      profile,
      snapshot,
      requirement,
      at: now,
    });
    const deadline = calculateComplianceDeadline({
      obligationRef: "future-34b",
      rule: requirement.deadlineRule,
      ruleVersion: "v1",
      inputDates: { formationDate: profile.formationDate },
      calculatedAt: now,
    });
    const obligation = {
      ...createComplianceObligation({
        profile,
        requirement,
        applicability,
        periodStart: "2026-06-10",
        periodEnd: "2026-06-10",
        deadline,
        responsibility: "sg_responsible",
        createdAt: now,
      }),
      status: "ready_to_file" as const,
    };
    const preparation = createReportPreparation({
      obligation,
      requirement,
      nonSensitiveReportData: { legalNameConfirmed: true },
      formVersion: "periodic-v1",
      createdAt: now,
    });
    const authorization = {
      authorizationRef: "authorization-34",
      obligationRef: obligation.obligationId,
      reportHash: preparation.reportDataHash,
      acceptedAt: now,
      status: "valid" as const,
    };
    const readiness = evaluateReportReadyToFile({
      requirementCurrent: true,
      dueDateVerified: true,
      requiredFieldsComplete: true,
      clientConfirmationsComplete: true,
      reviewApproved: true,
      authorization,
      preparation,
      feeCurrent: true,
      blockingFindings: false,
    });
    const filingPackage = createComplianceFilingPackage({
      obligation,
      preparation,
      authorization,
      readiness,
    });
    expect(
      prepareComplianceFiling({
        obligation,
        filingPackage,
        provider: {
          providerCode: "state-portal",
          status: "disabled",
          supportsSubmission: false,
          supportsStatusLookup: false,
          killSwitchEnabled: true,
        },
        idempotencyKey: "compliance-34-prepare",
        existingAttempts: [],
      }),
    ).toEqual({ kind: "blocked", reason: "PROVIDER_DISABLED" });
  });
});
