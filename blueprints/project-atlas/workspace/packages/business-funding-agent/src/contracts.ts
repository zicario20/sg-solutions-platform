export const BUSINESS_FUNDING_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type BusinessFundingIdentityAssurance =
  (typeof BUSINESS_FUNDING_IDENTITY_ASSURANCE_LEVELS)[number];

export const FUNDING_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type FundingDataAuthorizationStatus = (typeof FUNDING_DATA_AUTHORIZATION_STATUSES)[number];

export const PERSONAL_SCOPE_AUTHORIZATION_STATUSES = [
  "not_required",
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type PersonalScopeAuthorizationStatus =
  (typeof PERSONAL_SCOPE_AUTHORIZATION_STATUSES)[number];

export type BusinessFundingSessionInput = {
  id: string;
  clientReference: string;
  organizationReference: string;
  identityAssurance: BusinessFundingIdentityAssurance;
  fundingDataAuthorization: FundingDataAuthorizationStatus;
  businessAuthorityAuthorized: boolean;
  purposeAuthorized: boolean;
  serviceEntitled: boolean;
  personalGuarantorInScope: boolean;
  personalGuarantorAuthorization: PersonalScopeAuthorizationStatus;
  personalCreditInScope: boolean;
  personalCreditAuthorization: PersonalScopeAuthorizationStatus;
  personalCreditPurposeAuthorized: boolean;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type BusinessFundingSession = BusinessFundingSessionInput & {
  status: "authorized";
  fundingDataMode: "reference_only";
  providerAccess: "disabled";
  underwritingAccess: "disabled";
  applicationPreparationAccess: "disabled";
  applicationSubmissionAccess: "disabled";
  offerDecisionAccess: "disabled";
};

export type FundingSourceReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReference: string;
  sourceKind:
    | "authorized_document_reference"
    | "bookkeeping_snapshot_reference"
    | "tax_context_reference"
    | "credit_context_reference"
    | "manual_case_reference";
  observedAt: string;
  rawDocumentIncluded: boolean;
  rawFinancialDataIncluded: boolean;
};

export type FundingSourceReference = FundingSourceReferenceInput & {
  storageMode: "reference_only";
  rawDocumentStored: false;
  normalizedFundingDataStored: false;
  providerImportPerformed: false;
};

export type FundingReadinessCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReferenceId: string;
  candidateType:
    | "readiness_gap"
    | "evidence_gap"
    | "provider_requirement_review"
    | "cash_flow_review"
    | "guarantor_review"
    | "other_review_required";
  evidenceReferences: string[];
  providerRequirementReferences: string[];
  createdAt: string;
};

export type FundingReadinessCandidate = FundingReadinessCandidateInput & {
  status: "candidate";
  eligibilityConfirmed: false;
  underwritingDecisionMade: false;
  prequalificationConfirmed: false;
  applicationPrepared: false;
  applicationSubmissionPermitted: false;
  externalDispatchPermitted: false;
};

export type FundingApplicationReadinessInput = {
  candidateId: string;
  fundingDataAuthorizationCurrent: boolean;
  businessAuthorityCurrent: boolean;
  clientConsentCurrent: boolean;
  evidenceSufficient: boolean;
  versionedProviderRequirementPresent: boolean;
  humanFundingSpecialistApproval: boolean;
  complianceApproval: boolean;
  requiredSignaturePresent: boolean;
  providerShareAuthorizationCurrent: boolean;
};

export type FundingApplicationReadiness = {
  candidateId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  applicationSubmissionPermitted: false;
  externalDispatchPermitted: false;
};

export type FundingAnalysisSummaryInput = {
  sessionId: string;
  sourceReferenceIds: string[];
  candidateIds: string[];
};

export type FundingAnalysisSummary = FundingAnalysisSummaryInput & {
  status: "reference_only";
  underwritingDecisionMade: false;
  eligibilityConfirmed: false;
  prequalificationConfirmed: false;
  offerRecommended: false;
  applicationPrepared: false;
  applicationSubmissionPermitted: false;
  fundingGuaranteed: false;
};

export type BusinessFundingHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type BusinessFundingHandoff = BusinessFundingHandoffInput & {
  route: "human_business_funding_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type BusinessFundingRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  underwritingEnabled: false;
  applicationPreparationEnabled: false;
  applicationSubmissionEnabled: false;
  fundsActionsEnabled: false;
  aiExecutionEnabled: false;
};
