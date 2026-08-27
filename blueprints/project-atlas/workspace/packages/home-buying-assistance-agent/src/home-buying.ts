import type {
  HomeBuyingApplicationPreparation,
  HomeBuyingApplicationPreparationInput,
  HomeBuyingApplicationReadiness,
  HomeBuyingApplicationReadinessInput,
  HomeBuyingHandoff,
  HomeBuyingHandoffInput,
  HomeBuyingReadinessCandidate,
  HomeBuyingReadinessCandidateInput,
  HomeBuyingSession,
  HomeBuyingSessionInput,
  HomeBuyingSourceReference,
  HomeBuyingSourceReferenceInput,
} from "./contracts.ts";
import { assertHomeBuyingAccess } from "./policy.ts";

export function createHomeBuyingSession(input: HomeBuyingSessionInput): HomeBuyingSession {
  assertHomeBuyingAccess(input);

  return {
    ...input,
    status: "authorized",
    dataMode: "reference_only",
    programRuleAccess: "disabled",
    providerAccess: "disabled",
    affordabilityDecisionAccess: "disabled",
    applicationPreparationAccess: "disabled",
    providerHandoffAccess: "disabled",
    mortgageSubmissionAccess: "disabled",
  };
}

export function registerHomeBuyingSourceReference(
  input: HomeBuyingSourceReferenceInput,
): HomeBuyingSourceReference {
  if (
    input.rawDocumentIncluded ||
    input.rawFinancialDataIncluded ||
    input.rawCreditDataIncluded ||
    input.rawHouseholdDataIncluded
  ) {
    throw new Error(
      "Raw home-buying documents, financial, credit, and household data are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawDocumentStored: false,
    rawFinancialDataStored: false,
    rawCreditDataStored: false,
    rawHouseholdDataStored: false,
    providerLookupPerformed: false,
  };
}

export function createHomeBuyingReadinessCandidate(
  input: HomeBuyingReadinessCandidateInput,
): HomeBuyingReadinessCandidate {
  return {
    ...input,
    status: "candidate",
    mortgageEligibilityDetermined: false,
    programEligibilityConfirmed: false,
    lenderUnderwritingApproved: false,
    prequalificationConfirmed: false,
    preapprovalConfirmed: false,
    finalApprovalConfirmed: false,
    clearToCloseConfirmed: false,
    closingCompletedConfirmed: false,
  };
}

export function assessHomeBuyingApplicationReadiness(
  input: HomeBuyingApplicationReadinessInput,
): HomeBuyingApplicationReadiness {
  const reasonCodes: string[] = [];

  if (!input.homeBuyingDataAuthorizationCurrent) {
    reasonCodes.push("current_home_buying_data_authorization_required");
  }
  if (!input.coApplicantAuthorizationCurrent) {
    reasonCodes.push("current_co_applicant_authorization_required_when_in_scope");
  }
  if (!input.clientConsentCurrent) {
    reasonCodes.push("current_client_consent_required");
  }
  if (!input.evidenceSufficient) {
    reasonCodes.push("supporting_evidence_required");
  }
  if (!input.versionedProgramOrProviderSourcePresent) {
    reasonCodes.push("current_versioned_program_or_provider_source_required");
  }
  if (!input.humanHomeBuyingSpecialistApproval) {
    reasonCodes.push("human_home_buying_specialist_approval_required");
  }
  if (!input.complianceApproval) {
    reasonCodes.push("compliance_approval_required");
  }
  if (!input.requiredSignaturePresent) {
    reasonCodes.push("required_signature_required");
  }
  if (!input.providerSharingAuthorizationCurrent) {
    reasonCodes.push("current_provider_sharing_authorization_required");
  }

  if (reasonCodes.length > 0) {
    return {
      candidateId: input.candidateId,
      status: "blocked",
      reasonCodes,
      providerHandoffPermitted: false,
      mortgageApplicationSubmissionPermitted: false,
      lenderDecisionInferred: false,
    };
  }

  return {
    candidateId: input.candidateId,
    status: "review_required",
    reasonCodes: [
      "provider_operations_disabled",
      "mortgage_submission_disabled",
      "manual_controlled_workflow_required",
    ],
    providerHandoffPermitted: false,
    mortgageApplicationSubmissionPermitted: false,
    lenderDecisionInferred: false,
  };
}

export function createHomeBuyingApplicationPreparation(
  input: HomeBuyingApplicationPreparationInput,
): HomeBuyingApplicationPreparation {
  if (input.rawApplicationPayloadIncluded) {
    throw new Error(
      "Raw mortgage-application payloads are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    status: "reference_only",
    applicationPrepared: false,
    borrowerDataVerified: false,
    signatureCollected: false,
    providerSubmissionPermitted: false,
    providerResponseReceived: false,
  };
}

export function createHomeBuyingHandoff(input: HomeBuyingHandoffInput): HomeBuyingHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Home-buying handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_home_buying_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
