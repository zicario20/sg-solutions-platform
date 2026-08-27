export const HOME_BUYING_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type HomeBuyingIdentityAssurance =
  (typeof HOME_BUYING_IDENTITY_ASSURANCE_LEVELS)[number];

export const HOME_BUYING_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type HomeBuyingDataAuthorizationStatus =
  (typeof HOME_BUYING_DATA_AUTHORIZATION_STATUSES)[number];

export type HomeBuyingSessionInput = {
  id: string;
  clientReference: string;
  caseReference: string;
  identityAssurance: HomeBuyingIdentityAssurance;
  homeBuyingDataAuthorization: HomeBuyingDataAuthorizationStatus;
  primaryApplicantAuthorized: boolean;
  coApplicantContextRequested: boolean;
  coApplicantDataAuthorization: HomeBuyingDataAuthorizationStatus;
  purposeAuthorized: boolean;
  serviceEntitled: boolean;
  requestedPurchaseJurisdictionReference: string;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type HomeBuyingSession = HomeBuyingSessionInput & {
  status: "authorized";
  dataMode: "reference_only";
  programRuleAccess: "disabled";
  providerAccess: "disabled";
  affordabilityDecisionAccess: "disabled";
  applicationPreparationAccess: "disabled";
  providerHandoffAccess: "disabled";
  mortgageSubmissionAccess: "disabled";
};

export type HomeBuyingSourceReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReference: string;
  sourceKind:
    | "authorized_document_reference"
    | "profile_projection_reference"
    | "program_rule_reference"
    | "provider_requirement_reference"
    | "manual_case_reference";
  observedAt: string;
  rawDocumentIncluded: boolean;
  rawFinancialDataIncluded: boolean;
  rawCreditDataIncluded: boolean;
  rawHouseholdDataIncluded: boolean;
};

export type HomeBuyingSourceReference = HomeBuyingSourceReferenceInput & {
  storageMode: "reference_only";
  rawDocumentStored: false;
  rawFinancialDataStored: false;
  rawCreditDataStored: false;
  rawHouseholdDataStored: false;
  providerLookupPerformed: false;
};

export type HomeBuyingReadinessCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  candidateType:
    | "readiness"
    | "affordability"
    | "program"
    | "provider"
    | "property"
    | "assistance"
    | "strategy"
    | "other_review_required";
  evidenceReferences: string[];
  versionedSourceReferences: string[];
  createdAt: string;
};

export type HomeBuyingReadinessCandidate = HomeBuyingReadinessCandidateInput & {
  status: "candidate";
  mortgageEligibilityDetermined: false;
  programEligibilityConfirmed: false;
  lenderUnderwritingApproved: false;
  prequalificationConfirmed: false;
  preapprovalConfirmed: false;
  finalApprovalConfirmed: false;
  clearToCloseConfirmed: false;
  closingCompletedConfirmed: false;
};

export type HomeBuyingApplicationReadinessInput = {
  candidateId: string;
  homeBuyingDataAuthorizationCurrent: boolean;
  coApplicantAuthorizationCurrent: boolean;
  clientConsentCurrent: boolean;
  evidenceSufficient: boolean;
  versionedProgramOrProviderSourcePresent: boolean;
  humanHomeBuyingSpecialistApproval: boolean;
  complianceApproval: boolean;
  requiredSignaturePresent: boolean;
  providerSharingAuthorizationCurrent: boolean;
};

export type HomeBuyingApplicationReadiness = {
  candidateId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  providerHandoffPermitted: false;
  mortgageApplicationSubmissionPermitted: false;
  lenderDecisionInferred: false;
};

export type HomeBuyingApplicationPreparationInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReferenceIds: string[];
  applicationFieldReferenceIds: string[];
  rawApplicationPayloadIncluded: boolean;
  createdAt: string;
};

export type HomeBuyingApplicationPreparation = HomeBuyingApplicationPreparationInput & {
  status: "reference_only";
  applicationPrepared: false;
  borrowerDataVerified: false;
  signatureCollected: false;
  providerSubmissionPermitted: false;
  providerResponseReceived: false;
};

export type HomeBuyingHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type HomeBuyingHandoff = HomeBuyingHandoffInput & {
  route: "human_home_buying_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type HomeBuyingRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  programRuleLookupEnabled: false;
  propertyEligibilityLookupEnabled: false;
  automatedAffordabilityEnabled: false;
  applicationPreparationEnabled: false;
  providerHandoffEnabled: false;
  mortgageSubmissionEnabled: false;
  aiExecutionEnabled: false;
};
