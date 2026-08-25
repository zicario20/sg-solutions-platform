import {
  createFundingRecommendation,
  createPostFundingPlan,
  type FundingApplication,
  type FundingConsent,
  presentFundingDisclosure,
  recordFundingConfirmation,
  withdrawFundingConsent,
} from "@atlas/business-funding";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source = {
  sourceType: "provider" as const,
  sourceId: "provider-evidence-35",
  observedAt: now,
  verificationStatus: "system_verified" as const,
  freshnessStatus: "current" as const,
};
const consent: FundingConsent = {
  id: "consent-life-35",
  fundingCaseId: "case-35",
  providerId: "provider-35",
  partnerId: null,
  purpose: "application_package",
  dataCategories: ["business_identity"],
  disclosureVersionIds: ["disc-35"],
  status: "accepted",
  acceptedAt: now,
  expiresAt: null,
  withdrawnAt: null,
};
const application: FundingApplication = {
  id: "app-life-35",
  fundingCaseId: "case-35",
  providerId: "provider-35",
  productVersionId: "version-35",
  applicationPackageId: "pkg-life-35",
  externalApplicationId: null,
  applicationChannel: "secure_referral_link",
  status: "submitted",
  idempotencyKey: "app-life-35",
  submittedAt: now,
  decisionAt: null,
  createdAt: now,
  updatedAt: now,
};

describe("M035 lifecycle controls", () => {
  it("presents current disclosures and allows consent withdrawal", () => {
    expect(
      presentFundingDisclosure(
        {
          id: "presentation-35",
          fundingCaseId: "case-35",
          disclosureId: "disc-35",
          disclosureVersion: "v1",
          presentedTo: "client-35",
          presentedAt: now,
          channel: "portal",
          acknowledgmentRequired: true,
          acknowledgedAt: null,
        },
        {
          id: "disc-35",
          code: "NOT_LENDER",
          disclosureType: "not_a_lender",
          version: "v1",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          status: "active",
        },
        now,
      ).id,
    ).toBe("presentation-35");
    expect(withdrawFundingConsent(consent, now).status).toBe("withdrawn");
  });
  it("requires explanations and verified provider evidence for lifecycle records", () => {
    expect(
      createFundingRecommendation({
        id: "rec-35",
        fundingCaseId: "case-35",
        recommendationType: "specialist_recommended",
        recommendedOfferIds: ["offer-35"],
        rankingCriteria: ["known cost"],
        reasoningSummary: "Based on verified offer terms.",
        riskFlags: [],
        sourceReferences: [source],
        createdBy: "staff",
        createdAt: now,
      }).id,
    ).toBe("rec-35");
    const confirmation = recordFundingConfirmation(
      {
        id: "confirmation-35",
        fundingCaseId: "case-35",
        applicationId: "app-life-35",
        providerId: "provider-35",
        fundedAmount: { amountCents: 75_000, currency: "USD" },
        fundedAt: now,
        providerReference: "provider-confirmed",
        verifiedAt: now,
      },
      application,
    );
    expect(
      createPostFundingPlan(
        {
          id: "plan-35",
          fundingCaseId: "case-35",
          fundingConfirmationId: "confirmation-35",
          paymentStartDate: null,
          expectedMaturityDate: null,
          reportingTasks: [],
          financialMonitoringTasks: [],
          renewalEligibilityDate: null,
          refinanceReviewDate: null,
          status: "draft",
          createdAt: now,
        },
        confirmation,
      ).id,
    ).toBe("plan-35");
  });
});
