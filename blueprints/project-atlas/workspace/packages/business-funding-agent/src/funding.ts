import type {
  BusinessFundingHandoff,
  BusinessFundingHandoffInput,
  BusinessFundingSession,
  BusinessFundingSessionInput,
  FundingAnalysisSummary,
  FundingAnalysisSummaryInput,
  FundingApplicationReadiness,
  FundingApplicationReadinessInput,
  FundingReadinessCandidate,
  FundingReadinessCandidateInput,
  FundingSourceReference,
  FundingSourceReferenceInput,
} from "./contracts.ts";
import { assertBusinessFundingAccess } from "./policy.ts";

export function createBusinessFundingSession(
  input: BusinessFundingSessionInput,
): BusinessFundingSession {
  assertBusinessFundingAccess(input);

  return {
    ...input,
    status: "authorized",
    fundingDataMode: "reference_only",
    providerAccess: "disabled",
    underwritingAccess: "disabled",
    applicationPreparationAccess: "disabled",
    applicationSubmissionAccess: "disabled",
    offerDecisionAccess: "disabled",
  };
}

export function registerFundingSourceReference(
  input: FundingSourceReferenceInput,
): FundingSourceReference {
  if (input.rawDocumentIncluded || input.rawFinancialDataIncluded) {
    throw new Error(
      "Raw financial documents and raw financial data are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawDocumentStored: false,
    normalizedFundingDataStored: false,
    providerImportPerformed: false,
  };
}

export function createFundingReadinessCandidate(
  input: FundingReadinessCandidateInput,
): FundingReadinessCandidate {
  return {
    ...input,
    status: "candidate",
    eligibilityConfirmed: false,
    underwritingDecisionMade: false,
    prequalificationConfirmed: false,
    applicationPrepared: false,
    applicationSubmissionPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function assessFundingApplicationReadiness(
  input: FundingApplicationReadinessInput,
): FundingApplicationReadiness {
  const reasonCodes: string[] = [];

  if (!input.fundingDataAuthorizationCurrent) {
    reasonCodes.push("current_funding_data_authorization_required");
  }

  if (!input.businessAuthorityCurrent) {
    reasonCodes.push("current_business_authority_required");
  }

  if (!input.clientConsentCurrent) {
    reasonCodes.push("current_client_consent_required");
  }

  if (!input.evidenceSufficient) {
    reasonCodes.push("supporting_evidence_required");
  }

  if (!input.versionedProviderRequirementPresent) {
    reasonCodes.push("versioned_provider_requirement_required");
  }

  if (!input.humanFundingSpecialistApproval) {
    reasonCodes.push("human_funding_specialist_approval_required");
  }

  if (!input.complianceApproval) {
    reasonCodes.push("compliance_approval_required");
  }

  if (!input.requiredSignaturePresent) {
    reasonCodes.push("required_signature_required");
  }

  if (!input.providerShareAuthorizationCurrent) {
    reasonCodes.push("provider_share_authorization_required");
  }

  if (reasonCodes.length > 0) {
    return {
      candidateId: input.candidateId,
      status: "blocked",
      reasonCodes,
      applicationSubmissionPermitted: false,
      externalDispatchPermitted: false,
    };
  }

  return {
    candidateId: input.candidateId,
    status: "review_required",
    reasonCodes: [
      "funding_provider_disabled",
      "external_dispatch_disabled",
      "manual_controlled_workflow_required",
    ],
    applicationSubmissionPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function createFundingAnalysisSummary(
  input: FundingAnalysisSummaryInput,
): FundingAnalysisSummary {
  return {
    ...input,
    status: "reference_only",
    underwritingDecisionMade: false,
    eligibilityConfirmed: false,
    prequalificationConfirmed: false,
    offerRecommended: false,
    applicationPrepared: false,
    applicationSubmissionPermitted: false,
    fundingGuaranteed: false,
  };
}

export function createBusinessFundingHandoff(
  input: BusinessFundingHandoffInput,
): BusinessFundingHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Business funding handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_business_funding_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
