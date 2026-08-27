import { describe, expect, it } from "vitest";

import {
  assessTaxFilingReadiness,
  createTaxAnalysisSummary,
  createTaxIssueCandidate,
  createTaxSpecialistHandoff,
  createTaxSpecialistRuntime,
  createTaxSpecialistSession,
  M054_TAX_SPECIALIST_AGENT_FLAGS,
  registerTaxSourceReference,
} from "../../packages/tax-specialist-agent/src/index.ts";

const authorizedSessionInput = {
  id: "tax-session-001",
  clientReference: "client-ref-001",
  identityAssurance: "step_up_verified" as const,
  taxDataAuthorization: "valid" as const,
  ownershipAuthorized: true,
  purposeAuthorized: true,
  serviceEntitled: true,
  taxYear: "2025",
  jurisdictionReference: "US-IL",
  locale: "en" as const,
  createdAt: "2026-08-27T16:00:00.000Z",
  expiresAt: "2026-08-27T17:00:00.000Z",
};

describe("M054 tax specialist agent controlled foundation", () => {
  it("keeps provider, source-ingestion, calculation, filing, payment, and AI flags disabled", () => {
    expect(Object.values(M054_TAX_SPECIALIST_AGENT_FLAGS).every((enabled) => !enabled)).toBe(true);
  });

  it("requires verified identity, current tax authorization, ownership, purpose, and entitlement", () => {
    expect(() =>
      createTaxSpecialistSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Tax specialist access requires verified identity");

    expect(() =>
      createTaxSpecialistSession({
        ...authorizedSessionInput,
        taxDataAuthorization: "revoked",
      }),
    ).toThrow("Tax specialist access requires current authorization");

    expect(() =>
      createTaxSpecialistSession({
        ...authorizedSessionInput,
        serviceEntitled: false,
      }),
    ).toThrow("Tax specialist access requires an active service entitlement");
  });

  it("creates a reference-only session with no calculation, filing, or provider access", () => {
    expect(createTaxSpecialistSession(authorizedSessionInput)).toMatchObject({
      status: "authorized",
      taxDataMode: "reference_only",
      providerAccess: "disabled",
      calculationAccess: "disabled",
      returnAssemblyAccess: "disabled",
      returnSubmissionAccess: "disabled",
    });
  });

  it("accepts source references while rejecting raw documents and raw tax data", () => {
    const source = registerTaxSourceReference({
      id: "tax-source-001",
      sessionId: "tax-session-001",
      caseReference: "tax-case-ref-001",
      sourceReference: "document-ref-001",
      sourceKind: "authorized_document_reference",
      observedAt: "2026-08-27T16:10:00.000Z",
      rawDocumentIncluded: false,
      rawTaxDataIncluded: false,
    });

    expect(source).toMatchObject({
      storageMode: "reference_only",
      rawDocumentStored: false,
      normalizedTaxDataStored: false,
      providerImportPerformed: false,
    });

    expect(() =>
      registerTaxSourceReference({
        ...source,
        id: "tax-source-raw",
        rawDocumentIncluded: true,
      }),
    ).toThrow("Raw tax documents and raw tax data are not accepted");
  });

  it("keeps tax findings as review candidates rather than verified facts or allowed tax positions", () => {
    expect(
      createTaxIssueCandidate({
        id: "tax-candidate-001",
        sessionId: "tax-session-001",
        caseReference: "tax-case-ref-001",
        sourceReferenceId: "tax-source-001",
        issueType: "deduction_review" as const,
        evidenceReferences: ["document-ref-001"],
        ruleSourceReferences: ["tax-rule-ref-001"],
        createdAt: "2026-08-27T16:20:00.000Z",
      }),
    ).toMatchObject({
      status: "candidate",
      taxPositionConfirmed: false,
      returnLinePrepared: false,
      filingPermitted: false,
      externalDispatchPermitted: false,
    });
  });

  it("blocks incomplete filing readiness and retains review-only status even when gates are supplied", () => {
    const blocked = assessTaxFilingReadiness({
      candidateId: "tax-candidate-001",
      taxDataAuthorizationCurrent: true,
      clientConsentCurrent: false,
      evidenceSufficient: false,
      versionedRuleReferencePresent: false,
      humanTaxSpecialistApproval: false,
      complianceApproval: false,
      requiredSignaturePresent: false,
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      filingPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(blocked.reasonCodes).toContain("current_client_consent_required");
    expect(blocked.reasonCodes).toContain("versioned_rule_reference_required");

    const reviewRequired = assessTaxFilingReadiness({
      candidateId: "tax-candidate-001",
      taxDataAuthorizationCurrent: true,
      clientConsentCurrent: true,
      evidenceSufficient: true,
      versionedRuleReferencePresent: true,
      humanTaxSpecialistApproval: true,
      complianceApproval: true,
      requiredSignaturePresent: true,
    });

    expect(reviewRequired).toMatchObject({
      status: "review_required",
      filingPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(reviewRequired.reasonCodes).toContain("efile_provider_disabled");
  });

  it("does not calculate an outcome, confirm a filing status, prepare a return, or guarantee a refund", () => {
    expect(
      createTaxAnalysisSummary({
        sessionId: "tax-session-001",
        sourceReferenceIds: ["tax-source-001"],
        candidateIds: ["tax-candidate-001"],
      }),
    ).toMatchObject({
      status: "reference_only",
      taxFactsVerified: false,
      filingStatusConfirmed: false,
      calculationPerformed: false,
      returnPrepared: false,
      returnSubmissionPermitted: false,
      refundGuaranteed: false,
    });
  });

  it("creates non-dispatching human handoffs and a disabled runtime", () => {
    expect(
      createTaxSpecialistHandoff({
        id: "tax-handoff-001",
        sessionId: "tax-session-001",
        caseReference: "tax-case-ref-001",
        reason: "Tax facts and legal sources require human review.",
        createdAt: "2026-08-27T16:30:00.000Z",
      }),
    ).toMatchObject({
      route: "human_tax_specialist_review",
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createTaxSpecialistRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      calculationEnabled: false,
      eFileEnabled: false,
      paymentActionsEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
