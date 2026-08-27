import type {
  TaxAnalysisSummary,
  TaxAnalysisSummaryInput,
  TaxFilingReadiness,
  TaxFilingReadinessInput,
  TaxIssueCandidate,
  TaxIssueCandidateInput,
  TaxSourceReference,
  TaxSourceReferenceInput,
  TaxSpecialistHandoff,
  TaxSpecialistHandoffInput,
  TaxSpecialistSession,
  TaxSpecialistSessionInput,
} from "./contracts.ts";
import { assertTaxSpecialistAccess } from "./policy.ts";

export function createTaxSpecialistSession(input: TaxSpecialistSessionInput): TaxSpecialistSession {
  assertTaxSpecialistAccess(input);

  return {
    ...input,
    status: "authorized",
    taxDataMode: "reference_only",
    providerAccess: "disabled",
    calculationAccess: "disabled",
    returnAssemblyAccess: "disabled",
    returnSubmissionAccess: "disabled",
  };
}

export function registerTaxSourceReference(input: TaxSourceReferenceInput): TaxSourceReference {
  if (input.rawDocumentIncluded || input.rawTaxDataIncluded) {
    throw new Error(
      "Raw tax documents and raw tax data are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawDocumentStored: false,
    normalizedTaxDataStored: false,
    providerImportPerformed: false,
  };
}

export function createTaxIssueCandidate(input: TaxIssueCandidateInput): TaxIssueCandidate {
  return {
    ...input,
    status: "candidate",
    taxPositionConfirmed: false,
    returnLinePrepared: false,
    filingPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function assessTaxFilingReadiness(input: TaxFilingReadinessInput): TaxFilingReadiness {
  const reasonCodes: string[] = [];

  if (!input.taxDataAuthorizationCurrent) {
    reasonCodes.push("current_tax_data_authorization_required");
  }

  if (!input.clientConsentCurrent) {
    reasonCodes.push("current_client_consent_required");
  }

  if (!input.evidenceSufficient) {
    reasonCodes.push("supporting_evidence_required");
  }

  if (!input.versionedRuleReferencePresent) {
    reasonCodes.push("versioned_rule_reference_required");
  }

  if (!input.humanTaxSpecialistApproval) {
    reasonCodes.push("human_tax_specialist_approval_required");
  }

  if (!input.complianceApproval) {
    reasonCodes.push("compliance_approval_required");
  }

  if (!input.requiredSignaturePresent) {
    reasonCodes.push("required_signature_required");
  }

  if (reasonCodes.length > 0) {
    return {
      candidateId: input.candidateId,
      status: "blocked",
      reasonCodes,
      filingPermitted: false,
      externalDispatchPermitted: false,
    };
  }

  return {
    candidateId: input.candidateId,
    status: "review_required",
    reasonCodes: [
      "efile_provider_disabled",
      "external_dispatch_disabled",
      "manual_controlled_workflow_required",
    ],
    filingPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function createTaxAnalysisSummary(input: TaxAnalysisSummaryInput): TaxAnalysisSummary {
  return {
    ...input,
    status: "reference_only",
    taxFactsVerified: false,
    filingStatusConfirmed: false,
    calculationPerformed: false,
    returnPrepared: false,
    returnSubmissionPermitted: false,
    refundGuaranteed: false,
  };
}

export function createTaxSpecialistHandoff(input: TaxSpecialistHandoffInput): TaxSpecialistHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Tax specialist handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_tax_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
