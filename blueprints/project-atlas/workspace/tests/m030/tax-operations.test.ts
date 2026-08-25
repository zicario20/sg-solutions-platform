import { evaluateTaxFilingReadiness } from "@atlas/tax-operations";
import { describe, expect, it } from "vitest";

describe("M030 tax filing gate", () => {
  const ready = {
    taxCaseId: "tax-1",
    engagementAccepted: true,
    identityVerified: true,
    documentsComplete: true,
    preparerReviewed: true,
    independentReviewRequired: true,
    independentReviewCompleted: true,
    clientApproved: true,
    signaturesComplete: true,
    humanFilingReleaseGranted: true,
    eFileProviderEnabled: false,
  };
  it("never transmits when the e-file provider is disabled", () => {
    expect(evaluateTaxFilingReadiness(ready)).toMatchObject({
      state: "provider_disabled",
      readyForProviderTransmission: false,
    });
  });
  it("requires a human filing release", () => {
    expect(
      evaluateTaxFilingReadiness({ ...ready, humanFilingReleaseGranted: false }).blockers,
    ).toContain("human_filing_release_required");
  });
});
