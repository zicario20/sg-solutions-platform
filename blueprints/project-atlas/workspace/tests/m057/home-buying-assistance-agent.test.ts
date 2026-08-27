import { describe, expect, it } from "vitest";

import {
  assessHomeBuyingApplicationReadiness,
  createHomeBuyingApplicationPreparation,
  createHomeBuyingHandoff,
  createHomeBuyingReadinessCandidate,
  createHomeBuyingRuntime,
  createHomeBuyingSession,
  M057_HOME_BUYING_ASSISTANCE_AGENT_FLAGS,
  registerHomeBuyingSourceReference,
} from "../../packages/home-buying-assistance-agent/src/index.ts";

const authorizedSessionInput = {
  id: "home-buying-session-001",
  clientReference: "client-ref-001",
  caseReference: "home-buying-case-ref-001",
  identityAssurance: "step_up_verified" as const,
  homeBuyingDataAuthorization: "valid" as const,
  primaryApplicantAuthorized: true,
  coApplicantContextRequested: false,
  coApplicantDataAuthorization: "not_provided" as const,
  purposeAuthorized: true,
  serviceEntitled: true,
  requestedPurchaseJurisdictionReference: "US-IL",
  locale: "en" as const,
  createdAt: "2026-08-27T18:00:00.000Z",
  expiresAt: "2026-08-27T19:00:00.000Z",
};

describe("M057 home-buying assistance controlled foundation", () => {
  it("keeps lender, program, application, and AI execution flags disabled", () => {
    expect(
      Object.values(M057_HOME_BUYING_ASSISTANCE_AGENT_FLAGS).every((enabled) => !enabled),
    ).toBe(true);
  });

  it("requires verified identity, authorization, applicant authority, purpose, and entitlement", () => {
    expect(() =>
      createHomeBuyingSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Home-buying access requires verified identity");

    expect(() =>
      createHomeBuyingSession({
        ...authorizedSessionInput,
        coApplicantContextRequested: true,
      }),
    ).toThrow("Co-applicant context requires separate current authorization");

    expect(() =>
      createHomeBuyingSession({
        ...authorizedSessionInput,
        serviceEntitled: false,
      }),
    ).toThrow("Home-buying access requires an active service entitlement");
  });

  it("creates a reference-only session without lender or mortgage-submission access", () => {
    expect(createHomeBuyingSession(authorizedSessionInput)).toMatchObject({
      status: "authorized",
      dataMode: "reference_only",
      programRuleAccess: "disabled",
      providerAccess: "disabled",
      mortgageSubmissionAccess: "disabled",
    });
  });

  it("rejects raw home-buying data while preserving only source references", () => {
    const source = registerHomeBuyingSourceReference({
      id: "home-buying-source-001",
      sessionId: "home-buying-session-001",
      caseReference: "home-buying-case-ref-001",
      sourceReference: "document-ref-001",
      sourceKind: "authorized_document_reference",
      observedAt: "2026-08-27T18:10:00.000Z",
      rawDocumentIncluded: false,
      rawFinancialDataIncluded: false,
      rawCreditDataIncluded: false,
      rawHouseholdDataIncluded: false,
    });

    expect(source).toMatchObject({
      storageMode: "reference_only",
      rawFinancialDataStored: false,
      rawCreditDataStored: false,
      providerLookupPerformed: false,
    });

    expect(() =>
      registerHomeBuyingSourceReference({
        ...source,
        id: "home-buying-source-raw",
        rawFinancialDataIncluded: true,
      }),
    ).toThrow("Raw home-buying documents, financial, credit, and household data");
  });

  it("keeps readiness and affordability as non-conclusive candidates", () => {
    expect(
      createHomeBuyingReadinessCandidate({
        id: "home-buying-candidate-001",
        sessionId: "home-buying-session-001",
        caseReference: "home-buying-case-ref-001",
        candidateType: "affordability",
        evidenceReferences: ["document-ref-001"],
        versionedSourceReferences: ["program-source-ref-001"],
        createdAt: "2026-08-27T18:20:00.000Z",
      }),
    ).toMatchObject({
      status: "candidate",
      mortgageEligibilityDetermined: false,
      lenderUnderwritingApproved: false,
      preapprovalConfirmed: false,
      closingCompletedConfirmed: false,
    });
  });

  it("requires all controls yet never permits a lender handoff or submission", () => {
    const blocked = assessHomeBuyingApplicationReadiness({
      candidateId: "home-buying-candidate-001",
      homeBuyingDataAuthorizationCurrent: true,
      coApplicantAuthorizationCurrent: true,
      clientConsentCurrent: false,
      evidenceSufficient: false,
      versionedProgramOrProviderSourcePresent: false,
      humanHomeBuyingSpecialistApproval: false,
      complianceApproval: false,
      requiredSignaturePresent: false,
      providerSharingAuthorizationCurrent: false,
    });
    expect(blocked.status).toBe("blocked");
    expect(blocked.reasonCodes).toContain("current_client_consent_required");

    expect(
      assessHomeBuyingApplicationReadiness({
        candidateId: "home-buying-candidate-001",
        homeBuyingDataAuthorizationCurrent: true,
        coApplicantAuthorizationCurrent: true,
        clientConsentCurrent: true,
        evidenceSufficient: true,
        versionedProgramOrProviderSourcePresent: true,
        humanHomeBuyingSpecialistApproval: true,
        complianceApproval: true,
        requiredSignaturePresent: true,
        providerSharingAuthorizationCurrent: true,
      }),
    ).toMatchObject({
      status: "review_required",
      providerHandoffPermitted: false,
      mortgageApplicationSubmissionPermitted: false,
    });
  });

  it("does not prepare mortgage payloads, dispatch handoffs, or enable runtime", () => {
    expect(() =>
      createHomeBuyingApplicationPreparation({
        id: "home-buying-prep-raw",
        sessionId: "home-buying-session-001",
        caseReference: "home-buying-case-ref-001",
        sourceReferenceIds: [],
        applicationFieldReferenceIds: [],
        rawApplicationPayloadIncluded: true,
        createdAt: "2026-08-27T18:25:00.000Z",
      }),
    ).toThrow("Raw mortgage-application payloads");

    expect(
      createHomeBuyingApplicationPreparation({
        id: "home-buying-prep-001",
        sessionId: "home-buying-session-001",
        caseReference: "home-buying-case-ref-001",
        sourceReferenceIds: ["home-buying-source-001"],
        applicationFieldReferenceIds: ["field-ref-001"],
        rawApplicationPayloadIncluded: false,
        createdAt: "2026-08-27T18:25:00.000Z",
      }),
    ).toMatchObject({
      applicationPrepared: false,
      providerSubmissionPermitted: false,
    });

    expect(
      createHomeBuyingHandoff({
        id: "home-buying-handoff-001",
        sessionId: "home-buying-session-001",
        caseReference: "home-buying-case-ref-001",
        reason: "Current provider source and applicant evidence need controlled review.",
        createdAt: "2026-08-27T18:30:00.000Z",
      }),
    ).toMatchObject({
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createHomeBuyingRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      mortgageSubmissionEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
