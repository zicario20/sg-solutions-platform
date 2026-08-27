export const TAX_SPECIALIST_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type TaxSpecialistIdentityAssurance =
  (typeof TAX_SPECIALIST_IDENTITY_ASSURANCE_LEVELS)[number];

export const TAX_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type TaxDataAuthorizationStatus = (typeof TAX_DATA_AUTHORIZATION_STATUSES)[number];

export type TaxSpecialistSessionInput = {
  id: string;
  clientReference: string;
  identityAssurance: TaxSpecialistIdentityAssurance;
  taxDataAuthorization: TaxDataAuthorizationStatus;
  ownershipAuthorized: boolean;
  purposeAuthorized: boolean;
  serviceEntitled: boolean;
  taxYear: string;
  jurisdictionReference: string;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type TaxSpecialistSession = TaxSpecialistSessionInput & {
  status: "authorized";
  taxDataMode: "reference_only";
  providerAccess: "disabled";
  calculationAccess: "disabled";
  returnAssemblyAccess: "disabled";
  returnSubmissionAccess: "disabled";
};

export type TaxSourceReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReference: string;
  sourceKind:
    | "authorized_document_reference"
    | "bookkeeping_snapshot_reference"
    | "prior_return_reference"
    | "manual_case_reference";
  observedAt: string;
  rawDocumentIncluded: boolean;
  rawTaxDataIncluded: boolean;
};

export type TaxSourceReference = TaxSourceReferenceInput & {
  storageMode: "reference_only";
  rawDocumentStored: false;
  normalizedTaxDataStored: false;
  providerImportPerformed: false;
};

export type TaxIssueCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReferenceId: string;
  issueType:
    | "missing_information"
    | "potential_conflict"
    | "filing_status_review"
    | "deduction_review"
    | "credit_review"
    | "other_review_required";
  evidenceReferences: string[];
  ruleSourceReferences: string[];
  createdAt: string;
};

export type TaxIssueCandidate = TaxIssueCandidateInput & {
  status: "candidate";
  taxPositionConfirmed: false;
  returnLinePrepared: false;
  filingPermitted: false;
  externalDispatchPermitted: false;
};

export type TaxFilingReadinessInput = {
  candidateId: string;
  taxDataAuthorizationCurrent: boolean;
  clientConsentCurrent: boolean;
  evidenceSufficient: boolean;
  versionedRuleReferencePresent: boolean;
  humanTaxSpecialistApproval: boolean;
  complianceApproval: boolean;
  requiredSignaturePresent: boolean;
};

export type TaxFilingReadiness = {
  candidateId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  filingPermitted: false;
  externalDispatchPermitted: false;
};

export type TaxAnalysisSummaryInput = {
  sessionId: string;
  sourceReferenceIds: string[];
  candidateIds: string[];
};

export type TaxAnalysisSummary = TaxAnalysisSummaryInput & {
  status: "reference_only";
  taxFactsVerified: false;
  filingStatusConfirmed: false;
  calculationPerformed: false;
  returnPrepared: false;
  returnSubmissionPermitted: false;
  refundGuaranteed: false;
};

export type TaxSpecialistHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type TaxSpecialistHandoff = TaxSpecialistHandoffInput & {
  route: "human_tax_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type TaxSpecialistRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  taxDocumentIngestionEnabled: false;
  taxRuleEvaluationEnabled: false;
  calculationEnabled: false;
  returnAssemblyEnabled: false;
  eFileEnabled: false;
  paymentActionsEnabled: false;
  refundActionsEnabled: false;
  aiExecutionEnabled: false;
};
