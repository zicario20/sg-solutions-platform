import type {
  CreditAnalysisSummary,
  CreditAnalysisSummaryInput,
  CreditDisputeReadiness,
  CreditDisputeReadinessInput,
  CreditIssueCandidate,
  CreditIssueCandidateInput,
  CreditReportSnapshotReference,
  CreditReportSnapshotReferenceInput,
  CreditSpecialistHandoff,
  CreditSpecialistHandoffInput,
  CreditSpecialistSession,
  CreditSpecialistSessionInput,
} from "./contracts.ts";
import { assertCreditSpecialistAccess } from "./policy.ts";

export function createCreditSpecialistSession(
  input: CreditSpecialistSessionInput,
): CreditSpecialistSession {
  assertCreditSpecialistAccess(input);

  return {
    ...input,
    status: "authorized",
    creditReportDataMode: "reference_only",
    providerAccess: "disabled",
    disputeSubmissionAccess: "disabled",
    monitoringAccess: "disabled",
    tradelineActionAccess: "disabled",
  };
}

export function registerCreditReportSnapshotReference(
  input: CreditReportSnapshotReferenceInput,
): CreditReportSnapshotReference {
  if (input.reportBytesIncluded || input.reportContentIncluded) {
    throw new Error("Raw credit report content is not accepted by the controlled foundation.");
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawReportStored: false,
    providerRetrievalPerformed: false,
    analysisExecutionPerformed: false,
  };
}

export function createCreditIssueCandidate(input: CreditIssueCandidateInput): CreditIssueCandidate {
  return {
    ...input,
    evidenceStatus:
      input.evidenceReferences.length > 0 ? "references_supplied" : "references_missing",
    factualBasisStatus:
      input.factualBasisReferences.length > 0 ? "references_supplied" : "references_missing",
    status: "candidate",
    disputeSubmissionPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function assessCreditDisputeReadiness(
  input: CreditDisputeReadinessInput,
): CreditDisputeReadiness {
  const reasonCodes: string[] = [];

  if (!input.creditDataAuthorizationCurrent) {
    reasonCodes.push("current_credit_data_authorization_required");
  }

  if (!input.clientConsentCurrent) {
    reasonCodes.push("current_client_consent_required");
  }

  if (!input.evidenceSufficient) {
    reasonCodes.push("supporting_evidence_required");
  }

  if (!input.factualBasisSufficient) {
    reasonCodes.push("factual_basis_required");
  }

  if (!input.humanSpecialistApproval) {
    reasonCodes.push("human_specialist_approval_required");
  }

  if (!input.complianceApproval) {
    reasonCodes.push("compliance_approval_required");
  }

  if (reasonCodes.length > 0) {
    return {
      candidateId: input.candidateId,
      status: "blocked",
      reasonCodes,
      disputeSubmissionPermitted: false,
      externalDispatchPermitted: false,
    };
  }

  return {
    candidateId: input.candidateId,
    status: "review_required",
    reasonCodes: [
      "provider_disabled",
      "external_dispatch_disabled",
      "manual_controlled_workflow_required",
    ],
    disputeSubmissionPermitted: false,
    externalDispatchPermitted: false,
  };
}

export function createCreditAnalysisSummary(
  input: CreditAnalysisSummaryInput,
): CreditAnalysisSummary {
  return {
    ...input,
    status: "reference_only",
    reportFactsVerified: false,
    scoreChangeGuaranteed: false,
    financingApprovalInferred: false,
    disputeOutcomeGuaranteed: false,
  };
}

export function createCreditSpecialistHandoff(
  input: CreditSpecialistHandoffInput,
): CreditSpecialistHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Credit specialist handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_credit_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
