import {
  assessWireFraudControl,
  buildHomebuyerMatch,
  calculateDti,
  createAffordabilityScenario,
  createHomebuyerCase,
  createHomebuyerEngagement,
  createHomebuyerProfile,
  createHomebuyingPartner,
  createLenderReferralDraft,
  evaluateProgramScreening,
  type HomebuyerCase,
  type HomebuyerEngagement,
  HomebuyingDomainError,
  type HousingProgramVersion,
  publishHousingProgram,
  recordClosing,
  type SourceReference,
  submitLenderReferral,
  transitionHomebuyerCase,
} from "@atlas/home-buying-assistance";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source: SourceReference = {
  sourceType: "official_program_source",
  sourceId: "hud-fha-36",
  observedAt: now,
  verificationStatus: "professional_reviewed",
  freshnessStatus: "current",
};

function engagement(): HomebuyerEngagement {
  return createHomebuyerEngagement({
    id: "engagement-36",
    clientId: "client-36",
    serviceOrderId: "order-36",
    serviceType: "homebuyer_readiness_assessment",
    deliveryModel: "sg_education_preparation",
    assignedSpecialistId: null,
    reviewerId: null,
    status: "active",
    openedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

function homebuyerCase(value: HomebuyerEngagement): HomebuyerCase {
  return createHomebuyerCase(
    {
      id: "case-36",
      caseNumber: "HB-36",
      engagementId: value.id,
      clientId: value.clientId,
      homebuyerProfileId: null,
      status: "intake_pending",
      priority: "normal",
      assignedTo: null,
      reviewerId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    value,
  );
}

function programVersion(): HousingProgramVersion {
  return {
    id: "program-version-36",
    programId: "program-36",
    version: 1,
    publicName: "FHA preparation overview",
    availability: "available",
    sources: [source],
    verifiedAt: now,
    nextReviewAt: "2026-09-25T00:00:00.000Z",
    requiredDisclosures: ["program-terms-change"],
    status: "published",
  };
}

describe("M036 home buying assistance", () => {
  it("creates a controlled case and non-decisional readiness information", () => {
    const value = engagement();
    const caseRecord = homebuyerCase(value);
    const profile = createHomebuyerProfile(
      {
        id: "profile-36",
        homebuyerCaseId: caseRecord.id,
        profileVersion: 1,
        household: [],
        currentHousingStatus: "renting",
        currentHousingExpense: null,
        homeownershipHistory: "first_time_context_pending",
        purchaseGoal: {
          purchasePurpose: "primary_residence",
          occupancyIntent: "owner_occupied",
          targetStates: ["IL"],
          targetCounties: [],
          propertyTypes: ["single_family"],
          units: 1,
          priceRange: { minimum: null, maximum: null },
          timeline: "within_6_months",
        },
        sources: [source],
        verificationStatus: "professional_reviewed",
        createdAt: now,
        updatedAt: now,
      },
      null,
    );
    const dti = calculateDti({
      id: "dti-36",
      homebuyerCaseId: caseRecord.id,
      methodologyCode: "internal_education",
      grossMonthlyIncome: { amountCents: 400000, currency: "USD" },
      monthlyDebt: { amountCents: 125000, currency: "USD" },
      estimatedHousingPayment: { amountCents: 100000, currency: "USD" },
      dataQuality: "sufficient",
      sources: [source],
      createdAt: now,
    });
    const scenario = createAffordabilityScenario({
      id: "scenario-36",
      homebuyerCaseId: caseRecord.id,
      scenarioVersion: 1,
      purchasePrice: { amountCents: 30000000, currency: "USD" },
      downPayment: { amountCents: 3000000, currency: "USD" },
      estimatedRate: null,
      rateSource: null,
      loanTermMonths: null,
      estimatedPrincipalInterest: null,
      estimatedTaxes: null,
      estimatedInsurance: null,
      estimatedHoa: null,
      estimatedMortgageInsurance: null,
      totalEstimatedHousingPayment: null,
      status: "needs_current_quote",
      createdAt: now,
    });

    expect(value.status).toBe("active");
    expect(caseRecord.status).toBe("intake_pending");
    expect(profile.profileVersion).toBe(1);
    expect(dti.backEndDti).toBe(0.5625);
    expect(scenario.status).toBe("needs_current_quote");
  });

  it("screens only source-backed published program versions as preliminary fits", () => {
    const version = programVersion();
    const program = publishHousingProgram(
      {
        id: "program-36",
        code: "FHA_PREPARATION",
        family: "fha",
        jurisdiction: "national",
        status: "under_review",
        currentVersionId: null,
        createdAt: now,
        updatedAt: now,
      },
      version,
      now,
    );
    const screening = evaluateProgramScreening({
      id: "screening-36",
      homebuyerCaseId: "case-36",
      programVersion: version,
      profileVersion: 1,
      financialProfileVersion: null,
      rules: [],
      facts: {},
      evaluatedAt: now,
    });
    const match = buildHomebuyerMatch(screening, ["current reviewed program information"], []);

    expect(program.status).toBe("published");
    expect(screening.status).toBe("potential_fit");
    expect(match.matchBand).toBe("potential");
    expect(match.explanation).toContain("make final decisions");
  });

  it("fails closed for lenders and protects externally verified milestones", () => {
    const caseRecord = homebuyerCase(engagement());
    const partner = createHomebuyingPartner({
      id: "lender-36",
      organizationId: "organization-36",
      type: "lender",
      status: "approved_not_enabled",
      capabilities: {
        referral: false,
        program_lookup: false,
        preapproval_status: false,
        document_sharing: false,
        property_status: false,
        closing_status: false,
        webhooks: false,
      },
      health: "unknown",
      sources: [source],
    });
    const consent = {
      id: "consent-36",
      homebuyerCaseId: caseRecord.id,
      partnerId: partner.id,
      purpose: "lender_referral" as const,
      dataCategories: ["basic_contact"],
      disclosureVersionIds: ["disclosure-36"],
      status: "accepted" as const,
      acceptedAt: now,
      expiresAt: null,
      withdrawnAt: null,
    };
    const referral = createLenderReferralDraft(
      {
        id: "referral-36",
        homebuyerCaseId: caseRecord.id,
        lenderId: partner.id,
        programVersionId: null,
        consentId: consent.id,
        trackingReference: "safe-reference-36",
        status: "ready",
        createdAt: now,
      },
      consent,
      now,
    );

    expect(referral.status).toBe("draft");
    expect(() => submitLenderReferral()).toThrow(HomebuyingDomainError);
    expect(() =>
      transitionHomebuyerCase({
        homebuyerCase: { ...caseRecord, status: "property_search" },
        trigger: "contract_verified",
        humanApproved: false,
        externalEvidenceReference: null,
        now,
      }),
    ).toThrow("verified external evidence");
    expect(() =>
      recordClosing({
        id: "closing-36",
        homebuyerCaseId: caseRecord.id,
        propertyCandidateId: "property-36",
        closingStatus: "completed",
        closingDate: null,
        finalCashToClose: null,
        sourceDocumentId: null,
        verifiedAt: null,
      }),
    ).toThrow("verified external evidence");
    expect(
      assessWireFraudControl({
        sourceVerifiedOutOfBand: false,
        clientAcknowledged: false,
        changedInstructions: true,
      }).allowed,
    ).toBe(false);
  });
});
