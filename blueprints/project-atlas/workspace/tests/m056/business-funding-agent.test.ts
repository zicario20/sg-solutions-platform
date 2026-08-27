import { describe, expect, it } from "vitest";

import {
  assessFundingApplicationReadiness,
  createBusinessFundingHandoff,
  createBusinessFundingRuntime,
  createBusinessFundingSession,
  createFundingAnalysisSummary,
  createFundingReadinessCandidate,
  M056_BUSINESS_FUNDING_AGENT_FLAGS,
  registerFundingSourceReference,
} from "../../packages/business-funding-agent/src/index.ts";

const authorizedSessionInput = {
  id: "funding-session-001",
  clientReference: "client-ref-001",
  organizationReference: "organization-ref-001",
  identityAssurance: "step_up_verified" as const,
  fundingDataAuthorization: "valid" as const,
  businessAuthorityAuthorized: true,
  purposeAuthorized: true,
  serviceEntitled: true,
  personalGuarantorInScope: false,
  personalGuarantorAuthorization: "not_required" as const,
  personalCreditInScope: false,
  personalCreditAuthorization: "not_required" as const,
  personalCreditPurposeAuthorized: false,
  locale: "en" as const,
  createdAt: "2026-08-27T18:00:00.000Z",
  expiresAt: "2026-08-27T19:00:00.000Z",
};

describe("M056 business funding agent controlled foundation", () => {
  it("keeps provider, underwriting, recommendation, application, funds, and AI flags disabled", () => {
    expect(Object.values(M056_BUSINESS_FUNDING_AGENT_FLAGS).every((enabled) => !enabled)).toBe(
      true,
    );
  });

  it("requires verified identity, current funding authorization, business authority, purpose, and entitlement", () => {
    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Business funding access requires verified identity");

    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        fundingDataAuthorization: "revoked",
      }),
    ).toThrow("Business funding access requires current authorization");

    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        businessAuthorityAuthorized: false,
      }),
    ).toThrow("Business funding access requires authorized business authority");

    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        serviceEntitled: false,
      }),
    ).toThrow("Business funding access requires an active service entitlement");
  });

  it("requires separate authorization and purpose when personal guarantor or credit scope applies", () => {
    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        personalGuarantorInScope: true,
        personalGuarantorAuthorization: "not_provided",
      }),
    ).toThrow("Business funding access requires separate personal-guarantor authorization");

    expect(() =>
      createBusinessFundingSession({
        ...authorizedSessionInput,
        personalCreditInScope: true,
        personalCreditAuthorization: "not_provided",
      }),
    ).toThrow("Business funding access requires separate personal-credit authorization");
  });

  it("creates a reference-only session without provider, underwriting, application, or offer access", () => {
    expect(createBusinessFundingSession(authorizedSessionInput)).toMatchObject({
      status: "authorized",
      fundingDataMode: "reference_only",
      providerAccess: "disabled",
      underwritingAccess: "disabled",
      applicationPreparationAccess: "disabled",
      applicationSubmissionAccess: "disabled",
      offerDecisionAccess: "disabled",
    });
  });

  it("accepts source references while rejecting raw financial documents and raw financial data", () => {
    const source = registerFundingSourceReference({
      id: "funding-source-001",
      sessionId: "funding-session-001",
      caseReference: "funding-case-ref-001",
      sourceReference: "document-ref-001",
      sourceKind: "authorized_document_reference",
      observedAt: "2026-08-27T18:10:00.000Z",
      rawDocumentIncluded: false,
      rawFinancialDataIncluded: false,
    });

    expect(source).toMatchObject({
      storageMode: "reference_only",
      rawDocumentStored: false,
      normalizedFundingDataStored: false,
      providerImportPerformed: false,
    });

    expect(() =>
      registerFundingSourceReference({
        ...source,
        id: "funding-source-raw",
        rawFinancialDataIncluded: true,
      }),
    ).toThrow("Raw financial documents and raw financial data are not accepted");
  });

  it("keeps funding outputs as readiness candidates rather than eligibility, underwriting, or approval decisions", () => {
    expect(
      createFundingReadinessCandidate({
        id: "funding-candidate-001",
        sessionId: "funding-session-001",
        caseReference: "funding-case-ref-001",
        sourceReferenceId: "funding-source-001",
        candidateType: "readiness_gap" as const,
        evidenceReferences: ["document-ref-001"],
        providerRequirementReferences: ["provider-rule-ref-001"],
        createdAt: "2026-08-27T18:20:00.000Z",
      }),
    ).toMatchObject({
      status: "candidate",
      eligibilityConfirmed: false,
      underwritingDecisionMade: false,
      prequalificationConfirmed: false,
      applicationPrepared: false,
      applicationSubmissionPermitted: false,
      externalDispatchPermitted: false,
    });
  });

  it("blocks incomplete application readiness and preserves manual review even when all gates are present", () => {
    const blocked = assessFundingApplicationReadiness({
      candidateId: "funding-candidate-001",
      fundingDataAuthorizationCurrent: true,
      businessAuthorityCurrent: true,
      clientConsentCurrent: false,
      evidenceSufficient: false,
      versionedProviderRequirementPresent: false,
      humanFundingSpecialistApproval: false,
      complianceApproval: false,
      requiredSignaturePresent: false,
      providerShareAuthorizationCurrent: false,
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      applicationSubmissionPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(blocked.reasonCodes).toContain("current_client_consent_required");
    expect(blocked.reasonCodes).toContain("versioned_provider_requirement_required");

    const reviewRequired = assessFundingApplicationReadiness({
      candidateId: "funding-candidate-001",
      fundingDataAuthorizationCurrent: true,
      businessAuthorityCurrent: true,
      clientConsentCurrent: true,
      evidenceSufficient: true,
      versionedProviderRequirementPresent: true,
      humanFundingSpecialistApproval: true,
      complianceApproval: true,
      requiredSignaturePresent: true,
      providerShareAuthorizationCurrent: true,
    });

    expect(reviewRequired).toMatchObject({
      status: "review_required",
      applicationSubmissionPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(reviewRequired.reasonCodes).toContain("funding_provider_disabled");
  });

  it("does not make underwriting, eligibility, offer, application, or funding conclusions", () => {
    expect(
      createFundingAnalysisSummary({
        sessionId: "funding-session-001",
        sourceReferenceIds: ["funding-source-001"],
        candidateIds: ["funding-candidate-001"],
      }),
    ).toMatchObject({
      status: "reference_only",
      underwritingDecisionMade: false,
      eligibilityConfirmed: false,
      prequalificationConfirmed: false,
      offerRecommended: false,
      applicationPrepared: false,
      applicationSubmissionPermitted: false,
      fundingGuaranteed: false,
    });
  });

  it("creates non-dispatching human handoffs and a disabled runtime", () => {
    expect(
      createBusinessFundingHandoff({
        id: "funding-handoff-001",
        sessionId: "funding-session-001",
        caseReference: "funding-case-ref-001",
        reason: "Funding evidence and provider requirements require human review.",
        createdAt: "2026-08-27T18:30:00.000Z",
      }),
    ).toMatchObject({
      route: "human_business_funding_specialist_review",
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createBusinessFundingRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      underwritingEnabled: false,
      applicationSubmissionEnabled: false,
      fundsActionsEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
