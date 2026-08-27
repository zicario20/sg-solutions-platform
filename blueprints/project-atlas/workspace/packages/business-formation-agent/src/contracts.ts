export const BUSINESS_FORMATION_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type BusinessFormationIdentityAssurance =
  (typeof BUSINESS_FORMATION_IDENTITY_ASSURANCE_LEVELS)[number];

export const FORMATION_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type FormationDataAuthorizationStatus =
  (typeof FORMATION_DATA_AUTHORIZATION_STATUSES)[number];

export type BusinessFormationSessionInput = {
  id: string;
  clientReference: string;
  identityAssurance: BusinessFormationIdentityAssurance;
  formationDataAuthorization: FormationDataAuthorizationStatus;
  ownershipAuthorized: boolean;
  purposeAuthorized: boolean;
  serviceEntitled: boolean;
  requestedJurisdictionReference: string;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type BusinessFormationSession = BusinessFormationSessionInput & {
  status: "authorized";
  formationDataMode: "reference_only";
  providerAccess: "disabled";
  nameSearchAccess: "disabled";
  filingPackageAccess: "disabled";
  filingSubmissionAccess: "disabled";
  einActionAccess: "disabled";
};

export type FormationSourceReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReference: string;
  sourceKind:
    | "authorized_document_reference"
    | "organization_profile_reference"
    | "jurisdiction_rule_reference"
    | "manual_case_reference";
  observedAt: string;
  rawDocumentIncluded: boolean;
  rawFormationDataIncluded: boolean;
};

export type FormationSourceReference = FormationSourceReferenceInput & {
  storageMode: "reference_only";
  rawDocumentStored: false;
  normalizedFormationDataStored: false;
  providerSearchPerformed: false;
};

export type FormationCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  sourceReferenceId: string;
  candidateType:
    | "jurisdiction"
    | "entity_type"
    | "business_name"
    | "ownership_structure"
    | "management_structure"
    | "registered_agent"
    | "business_purpose"
    | "other_review_required";
  evidenceReferences: string[];
  ruleSourceReferences: string[];
  createdAt: string;
};

export type FormationCandidate = FormationCandidateInput & {
  status: "candidate";
  legalConclusionConfirmed: false;
  nameAvailabilityConfirmed: false;
  filingPackagePrepared: false;
  filingPermitted: false;
  einRequestPermitted: false;
  externalDispatchPermitted: false;
};

export type FormationFilingReadinessInput = {
  candidateId: string;
  formationDataAuthorizationCurrent: boolean;
  clientConsentCurrent: boolean;
  evidenceSufficient: boolean;
  versionedJurisdictionRulePresent: boolean;
  humanFormationSpecialistApproval: boolean;
  complianceApproval: boolean;
  requiredSignaturePresent: boolean;
};

export type FormationFilingReadiness = {
  candidateId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  filingPermitted: false;
  externalDispatchPermitted: false;
};

export type FormationAnalysisSummaryInput = {
  sessionId: string;
  sourceReferenceIds: string[];
  candidateIds: string[];
};

export type FormationAnalysisSummary = FormationAnalysisSummaryInput & {
  status: "reference_only";
  legalAdviceProvided: false;
  nameAvailabilityConfirmed: false;
  stateFeeConfirmed: false;
  filingPackagePrepared: false;
  filingSubmissionPermitted: false;
  einRequestPermitted: false;
  stateAcceptanceGuaranteed: false;
};

export type BusinessFormationHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type BusinessFormationHandoff = BusinessFormationHandoffInput & {
  route: "human_business_formation_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type BusinessFormationRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  nameSearchEnabled: false;
  filingPackageAssemblyEnabled: false;
  filingSubmissionEnabled: false;
  einActionsEnabled: false;
  aiExecutionEnabled: false;
};
