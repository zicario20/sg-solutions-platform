import { describe, expect, it } from "vitest";

import {
  assessFormationFilingReadiness,
  createBusinessFormationHandoff,
  createBusinessFormationRuntime,
  createBusinessFormationSession,
  createFormationAnalysisSummary,
  createFormationCandidate,
  M055_BUSINESS_FORMATION_AGENT_FLAGS,
  registerFormationSourceReference,
} from "../../packages/business-formation-agent/src/index.ts";

const authorizedSessionInput = {
  id: "formation-session-001",
  clientReference: "client-ref-001",
  identityAssurance: "step_up_verified" as const,
  formationDataAuthorization: "valid" as const,
  ownershipAuthorized: true,
  purposeAuthorized: true,
  serviceEntitled: true,
  requestedJurisdictionReference: "US-IL",
  locale: "en" as const,
  createdAt: "2026-08-27T17:00:00.000Z",
  expiresAt: "2026-08-27T18:00:00.000Z",
};

describe("M055 business formation agent controlled foundation", () => {
  it("keeps state-provider, name-search, filing, EIN, and AI flags disabled", () => {
    expect(Object.values(M055_BUSINESS_FORMATION_AGENT_FLAGS).every((enabled) => !enabled)).toBe(
      true,
    );
  });

  it("requires verified identity, current formation authorization, ownership, purpose, and entitlement", () => {
    expect(() =>
      createBusinessFormationSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Business formation access requires verified identity");

    expect(() =>
      createBusinessFormationSession({
        ...authorizedSessionInput,
        formationDataAuthorization: "revoked",
      }),
    ).toThrow("Business formation access requires current authorization");

    expect(() =>
      createBusinessFormationSession({
        ...authorizedSessionInput,
        serviceEntitled: false,
      }),
    ).toThrow("Business formation access requires an active service entitlement");
  });

  it("creates a reference-only session with no search, filing, or EIN access", () => {
    expect(createBusinessFormationSession(authorizedSessionInput)).toMatchObject({
      status: "authorized",
      formationDataMode: "reference_only",
      providerAccess: "disabled",
      nameSearchAccess: "disabled",
      filingPackageAccess: "disabled",
      filingSubmissionAccess: "disabled",
      einActionAccess: "disabled",
    });
  });

  it("accepts source references while rejecting raw formation documents and sensitive data", () => {
    const source = registerFormationSourceReference({
      id: "formation-source-001",
      sessionId: "formation-session-001",
      caseReference: "formation-case-ref-001",
      sourceReference: "document-ref-001",
      sourceKind: "authorized_document_reference",
      observedAt: "2026-08-27T17:10:00.000Z",
      rawDocumentIncluded: false,
      rawFormationDataIncluded: false,
    });

    expect(source).toMatchObject({
      storageMode: "reference_only",
      rawDocumentStored: false,
      normalizedFormationDataStored: false,
      providerSearchPerformed: false,
    });

    expect(() =>
      registerFormationSourceReference({
        ...source,
        id: "formation-source-raw",
        rawFormationDataIncluded: true,
      }),
    ).toThrow("Raw formation documents and raw formation data are not accepted");
  });

  it("keeps entity, jurisdiction, and name results as candidates rather than legal conclusions or confirmations", () => {
    expect(
      createFormationCandidate({
        id: "formation-candidate-001",
        sessionId: "formation-session-001",
        caseReference: "formation-case-ref-001",
        sourceReferenceId: "formation-source-001",
        candidateType: "business_name" as const,
        evidenceReferences: ["document-ref-001"],
        ruleSourceReferences: ["state-rule-ref-001"],
        createdAt: "2026-08-27T17:20:00.000Z",
      }),
    ).toMatchObject({
      status: "candidate",
      legalConclusionConfirmed: false,
      nameAvailabilityConfirmed: false,
      filingPackagePrepared: false,
      filingPermitted: false,
      einRequestPermitted: false,
      externalDispatchPermitted: false,
    });
  });

  it("blocks incomplete filing readiness and preserves manual review even when all gates are present", () => {
    const blocked = assessFormationFilingReadiness({
      candidateId: "formation-candidate-001",
      formationDataAuthorizationCurrent: true,
      clientConsentCurrent: false,
      evidenceSufficient: false,
      versionedJurisdictionRulePresent: false,
      humanFormationSpecialistApproval: false,
      complianceApproval: false,
      requiredSignaturePresent: false,
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      filingPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(blocked.reasonCodes).toContain("current_client_consent_required");
    expect(blocked.reasonCodes).toContain("versioned_jurisdiction_rule_required");

    const reviewRequired = assessFormationFilingReadiness({
      candidateId: "formation-candidate-001",
      formationDataAuthorizationCurrent: true,
      clientConsentCurrent: true,
      evidenceSufficient: true,
      versionedJurisdictionRulePresent: true,
      humanFormationSpecialistApproval: true,
      complianceApproval: true,
      requiredSignaturePresent: true,
    });

    expect(reviewRequired).toMatchObject({
      status: "review_required",
      filingPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(reviewRequired.reasonCodes).toContain("state_provider_disabled");
  });

  it("does not give legal advice, confirm availability, prepare a filing, issue an EIN, or guarantee acceptance", () => {
    expect(
      createFormationAnalysisSummary({
        sessionId: "formation-session-001",
        sourceReferenceIds: ["formation-source-001"],
        candidateIds: ["formation-candidate-001"],
      }),
    ).toMatchObject({
      status: "reference_only",
      legalAdviceProvided: false,
      nameAvailabilityConfirmed: false,
      stateFeeConfirmed: false,
      filingPackagePrepared: false,
      filingSubmissionPermitted: false,
      einRequestPermitted: false,
      stateAcceptanceGuaranteed: false,
    });
  });

  it("creates non-dispatching human handoffs and a disabled runtime", () => {
    expect(
      createBusinessFormationHandoff({
        id: "formation-handoff-001",
        sessionId: "formation-session-001",
        caseReference: "formation-case-ref-001",
        reason: "Formation candidates and state rules require human review.",
        createdAt: "2026-08-27T17:30:00.000Z",
      }),
    ).toMatchObject({
      route: "human_business_formation_specialist_review",
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createBusinessFormationRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      nameSearchEnabled: false,
      filingSubmissionEnabled: false,
      einActionsEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
