export const CREDIT_SPECIALIST_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type CreditSpecialistIdentityAssurance =
  (typeof CREDIT_SPECIALIST_IDENTITY_ASSURANCE_LEVELS)[number];

export const CREDIT_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type CreditDataAuthorizationStatus = (typeof CREDIT_DATA_AUTHORIZATION_STATUSES)[number];

export type CreditSpecialistSessionInput = {
  id: string;
  clientReference: string;
  identityAssurance: CreditSpecialistIdentityAssurance;
  creditDataAuthorization: CreditDataAuthorizationStatus;
  ownershipAuthorized: boolean;
  purposeAuthorized: boolean;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type CreditSpecialistSession = CreditSpecialistSessionInput & {
  status: "authorized";
  creditReportDataMode: "reference_only";
  providerAccess: "disabled";
  disputeSubmissionAccess: "disabled";
  monitoringAccess: "disabled";
  tradelineActionAccess: "disabled";
};

export type CreditReportSnapshotReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReference: string;
  observedAt: string;
  sourceKind:
    | "client_provided_reference"
    | "authorized_document_reference"
    | "manual_case_reference";
  reportBytesIncluded: boolean;
  reportContentIncluded: boolean;
};

export type CreditReportSnapshotReference = CreditReportSnapshotReferenceInput & {
  storageMode: "reference_only";
  rawReportStored: false;
  providerRetrievalPerformed: false;
  analysisExecutionPerformed: false;
};

export type CreditIssueCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reportSnapshotReferenceId: string;
  issueType:
    | "potential_inaccuracy"
    | "identity_mismatch"
    | "duplicate_reference"
    | "missing_information"
    | "other_review_required";
  evidenceReferences: string[];
  factualBasisReferences: string[];
  createdAt: string;
};

export type CreditIssueCandidate = CreditIssueCandidateInput & {
  status: "candidate";
  evidenceStatus: "references_supplied" | "references_missing";
  factualBasisStatus: "references_supplied" | "references_missing";
  disputeSubmissionPermitted: false;
  externalDispatchPermitted: false;
};

export type CreditDisputeReadinessInput = {
  candidateId: string;
  creditDataAuthorizationCurrent: boolean;
  clientConsentCurrent: boolean;
  evidenceSufficient: boolean;
  factualBasisSufficient: boolean;
  humanSpecialistApproval: boolean;
  complianceApproval: boolean;
};

export type CreditDisputeReadiness = {
  candidateId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  disputeSubmissionPermitted: false;
  externalDispatchPermitted: false;
};

export type CreditAnalysisSummaryInput = {
  sessionId: string;
  reportSnapshotReferenceIds: string[];
  candidateIds: string[];
};

export type CreditAnalysisSummary = CreditAnalysisSummaryInput & {
  status: "reference_only";
  reportFactsVerified: false;
  scoreChangeGuaranteed: false;
  financingApprovalInferred: false;
  disputeOutcomeGuaranteed: false;
};

export type CreditSpecialistHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type CreditSpecialistHandoff = CreditSpecialistHandoffInput & {
  route: "human_credit_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type CreditSpecialistRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  creditReportIngestionEnabled: false;
  analysisExecutionEnabled: false;
  disputeSubmissionEnabled: false;
  monitoringEnabled: false;
  tradelineActionsEnabled: false;
  specialistHandoffDispatchEnabled: false;
  aiExecutionEnabled: false;
};
