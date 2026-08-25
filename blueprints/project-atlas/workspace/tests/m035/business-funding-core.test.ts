import {
  calculateDscr,
  checkBalanceSheetEquation,
  createFundingCase,
  createFundingEngagement,
  createFundingProfile,
  type FundingCase,
  type FundingEngagement,
  type FundingProfile,
} from "@atlas/business-funding";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source = {
  sourceType: "document" as const,
  sourceId: "doc-1",
  observedAt: now,
  verificationStatus: "document_verified" as const,
  freshnessStatus: "current" as const,
};
const engagement: FundingEngagement = {
  id: "eng-35",
  clientId: "client-35",
  organizationId: "org-35",
  serviceOrderId: "order-35",
  serviceType: "funding_readiness_assessment",
  deliveryModel: "sg_advisory_preparation",
  assignedFundingSpecialistId: null,
  assignedReviewerId: null,
  status: "active",
  openedAt: now,
  completedAt: null,
  createdAt: now,
  updatedAt: now,
};
const fundingCase: FundingCase = {
  id: "case-35",
  caseNumber: "FND-35",
  engagementId: "eng-35",
  clientId: "client-35",
  organizationId: "org-35",
  fundingProfileId: null,
  requestedAmount: { amountCents: 10_000_00, currency: "USD" },
  fundingPurpose: "equipment",
  status: "draft",
  priority: "normal",
  assignedTo: null,
  reviewerId: null,
  version: 1,
  createdAt: now,
  updatedAt: now,
  completedAt: null,
};
const profile: FundingProfile = {
  id: "profile-35",
  fundingCaseId: "case-35",
  organizationId: "org-35",
  profileVersion: 1,
  businessIdentity: "complete",
  ownershipSummary: "complete",
  businessAge: { basisDate: "2024-08-25", asOfDate: now, monthsInBusiness: 24 },
  industry: {
    category: "retail",
    activity: "retail sales",
    naicsCode: null,
    riskContext: "product_dependent",
  },
  businessLocations: ["IL"],
  fundingNeed: {
    requestedAmount: { amountCents: 10_000_00, currency: "USD" },
    minimumUsefulAmount: null,
    idealAmount: null,
    maximumDesiredAmount: null,
    timingNeed: "within_90_days",
    urgency: "normal",
    primaryPurpose: {
      purposeCode: "equipment",
      description: "Equipment",
      amount: { amountCents: 10_000_00, currency: "USD" },
      timing: "within_90_days",
      vendorOrAssetReference: null,
      supportingDocumentIds: [],
      clientConfirmed: true,
    },
    secondaryPurposes: [],
  },
  bankingSummary: "documented",
  creditContext: "not_requested",
  complianceSummary: "needs_review",
  sourceReferences: [source],
  verificationStatus: "document_verified",
  createdAt: now,
  updatedAt: now,
};

describe("M035 funding core", () => {
  it("creates a source-backed case and reconciled funding profile", () => {
    expect(createFundingCase(fundingCase, createFundingEngagement(engagement)).id).toBe("case-35");
    expect(createFundingProfile(profile, null).profileVersion).toBe(1);
  });
  it("calculates analytical financial values without producing a lender decision", () => {
    expect(
      calculateDscr({
        id: "dscr-35",
        fundingCaseId: "case-35",
        methodologyCode: "internal_standard",
        periodStart: "2026-01-01",
        periodEnd: "2026-06-30",
        cashFlowAvailable: { amountCents: 150_000, currency: "USD" },
        debtService: { amountCents: 100_000, currency: "USD" },
        dataQuality: "sufficient",
        sourceReferences: [source],
        calculationVersion: 1,
        reviewStatus: "requires_review",
        createdAt: now,
      }).dscr,
    ).toBe(1.5);
    expect(
      checkBalanceSheetEquation({
        totalAssets: { amountCents: 400, currency: "USD" },
        totalLiabilities: { amountCents: 300, currency: "USD" },
        equity: { amountCents: 100, currency: "USD" },
      }).balanced,
    ).toBe(true);
  });
});
