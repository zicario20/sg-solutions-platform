import type {
  BusinessFormationHandoff,
  BusinessFormationHandoffInput,
  BusinessFormationSession,
  BusinessFormationSessionInput,
  FormationAnalysisSummary,
  FormationAnalysisSummaryInput,
  FormationCandidate,
  FormationCandidateInput,
  FormationFilingReadiness,
  FormationFilingReadinessInput,
  FormationSourceReference,
  FormationSourceReferenceInput,
} from "./contracts.ts";
import { assertBusinessFormationAccess } from "./policy.ts";

export function createBusinessFormationSession(
  input: BusinessFormationSessionInput,
): BusinessFormationSession {
  assertBusinessFormationAccess(input);

  return {
    ...input,
    status: "authorized",
    formationDataMode: "reference_only",
    providerAccess: "disabled",
    nameSearchAccess: "disabled",
    filingPackageAccess: "disabled",
    filingSubmissionAccess: "disabled",
    einActionAccess: "disabled",
  };
}

export function registerFormationSourceReference(
  input: FormationSourceReferenceInput,
): FormationSourceReference {
  if (input.rawDocumentIncluded || input.rawFormationDataIncluded) {
    throw new Error(
      "Raw formation documents and raw formation data are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawDocumentStored: false,
    normalizedFormationDataStored: false,
    providerSearchPerformed: false,
  };
}

export function createFormationCandidate(input: FormationCandidateInput): FormationCandidate {
  return {
    ...input,
    status: "candidate",
    legalConclusionConfirmed: false,
    nameAvailabilityConfirmed: false,
    filingPackagePrepared: false,
    filingPermitted: false,
    einRequestPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function assessFormationFilingReadiness(
  input: FormationFilingReadinessInput,
): FormationFilingReadiness {
  const reasonCodes: string[] = [];

  if (!input.formationDataAuthorizationCurrent) {
    reasonCodes.push("current_formation_data_authorization_required");
  }

  if (!input.clientConsentCurrent) {
    reasonCodes.push("current_client_consent_required");
  }

  if (!input.evidenceSufficient) {
    reasonCodes.push("supporting_evidence_required");
  }

  if (!input.versionedJurisdictionRulePresent) {
    reasonCodes.push("versioned_jurisdiction_rule_required");
  }

  if (!input.humanFormationSpecialistApproval) {
    reasonCodes.push("human_formation_specialist_approval_required");
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
      "state_provider_disabled",
      "external_dispatch_disabled",
      "manual_controlled_workflow_required",
    ],
    filingPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function createFormationAnalysisSummary(
  input: FormationAnalysisSummaryInput,
): FormationAnalysisSummary {
  return {
    ...input,
    status: "reference_only",
    legalAdviceProvided: false,
    nameAvailabilityConfirmed: false,
    stateFeeConfirmed: false,
    filingPackagePrepared: false,
    filingSubmissionPermitted: false,
    einRequestPermitted: false,
    stateAcceptanceGuaranteed: false,
  };
}

export function createBusinessFormationHandoff(
  input: BusinessFormationHandoffInput,
): BusinessFormationHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Business formation handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_business_formation_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
