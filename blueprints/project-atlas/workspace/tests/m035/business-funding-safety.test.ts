import {
  createApplicationPackage,
  createFundingApplicationDraft,
  createFundingOffer,
  createFundingProviderRecord,
  createGroundedFundingAiSuggestion,
  type FundingApplication,
  type FundingApplicationPackage,
  type FundingConsent,
  FundingDomainError,
  type FundingOffer,
  recordClientOfferSelection,
  submitFundingApplication,
  transitionFundingCase,
} from "@atlas/business-funding";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const consent: FundingConsent = {
  id: "consent-35",
  fundingCaseId: "case-35",
  providerId: "provider-35",
  partnerId: null,
  purpose: "application_package",
  dataCategories: ["business_identity"],
  disclosureVersionIds: ["disclosure-1"],
  status: "accepted",
  acceptedAt: now,
  expiresAt: null,
  withdrawnAt: null,
};
const packageRecord: FundingApplicationPackage = {
  id: "pkg-35",
  fundingCaseId: "case-35",
  providerId: "provider-35",
  productVersionId: "product-v-35",
  financialPackageId: null,
  consentId: "consent-35",
  documentIds: ["doc-1"],
  permittedDataCategories: ["business_identity"],
  profileVersion: 1,
  status: "approved_for_referral",
  createdAt: now,
};
const application: FundingApplication = {
  id: "app-35",
  fundingCaseId: "case-35",
  providerId: "provider-35",
  productVersionId: "product-v-35",
  applicationPackageId: "pkg-35",
  externalApplicationId: null,
  applicationChannel: "secure_referral_link",
  status: "draft",
  idempotencyKey: "application:app-35",
  submittedAt: null,
  decisionAt: null,
  createdAt: now,
  updatedAt: now,
};
const offer: FundingOffer = {
  id: "offer-35",
  applicationId: "app-35",
  providerId: "provider-35",
  productVersionId: "product-v-35",
  offerAmount: { amountCents: 100_000, currency: "USD" },
  upfrontFees: { amountCents: 2_000, currency: "USD" },
  otherKnownDeductions: { amountCents: 0, currency: "USD" },
  paymentAmount: null,
  paymentFrequency: null,
  termMonths: null,
  rateType: "unknown",
  rate: null,
  aprWhenProvided: null,
  factorRateWhenApplicable: null,
  collateralRequirement: "unknown",
  personalGuaranteeRequirement: "unknown",
  prepaymentTerms: null,
  offerExpiration: "2026-09-01T00:00:00.000Z",
  sourceDocumentId: "doc-offer",
  verifiedAt: now,
  status: "active",
};

describe("M035 safety gates", () => {
  it("requires specific consent and human review before application drafting", () => {
    expect(createApplicationPackage(packageRecord, consent, now).id).toBe("pkg-35");
    expect(createFundingApplicationDraft(application, packageRecord).status).toBe("draft");
  });
  it("fails closed for providers, AI approvals and submission", () => {
    expect(() =>
      createFundingProviderRecord({
        id: "provider-35",
        organizationId: "partner-org",
        providerType: "lender",
        status: "enabled",
        capabilities: {
          productDiscovery: false,
          preliminaryScreening: false,
          applicationSubmission: false,
          statusLookup: false,
          documentUpload: false,
          additionalInformation: false,
          decisionRetrieval: false,
          offerRetrieval: false,
          fundingConfirmation: false,
          webhooks: false,
          secureLink: false,
          manualPortal: false,
        },
        health: "unknown",
        approvedAt: null,
        enabledAt: null,
        sourceReferences: [],
      }),
    ).toThrow(FundingDomainError);
    expect(() =>
      createGroundedFundingAiSuggestion({
        id: "ai-35",
        fundingCaseId: "case-35",
        purpose: "explain_product",
        sourceReferences: [],
        output: "approval",
        status: "draft",
        createdAt: now,
      }),
    ).toThrow(FundingDomainError);
    expect(() =>
      submitFundingApplication({
        application,
        providerEnabled: false,
        providerSupportsSubmission: false,
        humanApproved: false,
        consent,
        now,
      }),
    ).toThrow("disabled");
  });
  it("records a client selection but never accepts an external offer", () => {
    expect(createFundingOffer(offer).id).toBe("offer-35");
    expect(
      recordClientOfferSelection(
        {
          id: "selection-35",
          fundingCaseId: "case-35",
          selectedOfferId: "offer-35",
          decision: "selected",
          acknowledgmentVersion: "v1",
          selectedAt: now,
        },
        offer,
        now,
      ).decision,
    ).toBe("selected");
    expect(() =>
      transitionFundingCase({
        fundingCase: {
          id: "case-35",
          caseNumber: "FND-35",
          engagementId: "eng-35",
          clientId: "client-35",
          organizationId: "org-35",
          fundingProfileId: null,
          requestedAmount: null,
          fundingPurpose: null,
          status: "offers_available",
          priority: "normal",
          assignedTo: null,
          reviewerId: null,
          version: 1,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        },
        trigger: "provider_funding_verified",
        actorHasApproval: true,
        providerEvidenceReference: null,
        now,
      }),
    ).toThrow("provider evidence");
  });
});
