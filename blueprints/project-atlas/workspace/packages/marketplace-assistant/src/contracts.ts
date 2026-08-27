export const MARKETPLACE_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "unknown",
] as const;

export type MarketplaceIdentityAssurance =
  (typeof MARKETPLACE_IDENTITY_ASSURANCE_LEVELS)[number];

export const MARKETPLACE_CONTEXT_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type MarketplaceContextAuthorizationStatus =
  (typeof MARKETPLACE_CONTEXT_AUTHORIZATION_STATUSES)[number];

export type MarketplaceSessionInput = {
  id: string;
  clientReference?: string;
  surface: "public" | "authenticated_client" | "staff";
  identityAssurance: MarketplaceIdentityAssurance;
  purposeAuthorized: boolean;
  personalizationRequested: boolean;
  personalizationAuthorization: MarketplaceContextAuthorizationStatus;
  serviceScopedContextRequested: boolean;
  serviceEntitled: boolean;
  clientContextReference?: string;
  rawSensitiveContextIncluded: boolean;
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type MarketplaceSession = MarketplaceSessionInput & {
  status: "authorized";
  personalizationMode: "public_generic" | "reference_only_authorized";
  providerAccess: "disabled";
  recommendationExecutionAccess: "disabled";
  referralAccess: "disabled";
  redirectAccess: "disabled";
  applicationAccess: "disabled";
  commissionAccess: "disabled";
};

export type MarketplaceListingReferenceInput = {
  id: string;
  sessionId: string;
  listingReference: string;
  sourceKind:
    | "marketplace_listing_reference"
    | "provider_profile_reference"
    | "product_availability_reference"
    | "service_catalog_reference"
    | "recommendation_reference";
  observedAt: string;
  rawClientContextIncluded: boolean;
  providerCredentialIncluded: boolean;
};

export type MarketplaceListingReference = MarketplaceListingReferenceInput & {
  storageMode: "reference_only";
  rawClientContextStored: false;
  providerCredentialStored: false;
  providerLookupPerformed: false;
};

export type MarketplaceCandidateSetInput = {
  id: string;
  sessionId: string;
  listingReferenceIds: string[];
  rankingEvidenceReferences: string[];
  sponsoredListingReferenceIds: string[];
  sponsorshipDisclosureLabelsPresent: boolean;
  rawSensitiveContextIncluded: boolean;
  compensationInfluencedCoreFitScore: boolean;
  createdAt: string;
};

export type MarketplaceCandidateSet = MarketplaceCandidateSetInput & {
  status: "candidate_only";
  recommendationIssued: false;
  eligibilityDetermined: false;
  providerApprovalInferred: false;
  compensationInfluencedCoreFitScore: false;
  clientFitScoreCalculated: false;
};

export type MarketplaceNeutralityAssessmentInput = {
  candidateSetId: string;
  sponsoredListingReferenceIds: string[];
  sponsorshipDisclosureLabelsPresent: boolean;
  materiallyRelevantAlternativeCoveragePresent: boolean;
};

export type MarketplaceNeutralityAssessment = {
  candidateSetId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  sponsoredPlacementPermitted: false;
  recommendationPermitted: false;
};

export type MarketplaceReferralIntentInput = {
  id: string;
  sessionId: string;
  listingReferenceId: string;
  providerReference: string;
  disclosureAccepted: boolean;
  consentCurrent: boolean;
  specialistReviewRequired: boolean;
  createdAt: string;
};

export type MarketplaceReferralIntent = MarketplaceReferralIntentInput & {
  status: "blocked" | "review_required";
  reasonCodes: string[];
  redirectGenerated: false;
  referralCreated: false;
  applicationStarted: false;
  providerStatusInferred: false;
};

export type MarketplaceSpecialistHandoffInput = {
  id: string;
  sessionId: string;
  reason: string;
  createdAt: string;
};

export type MarketplaceSpecialistHandoff = MarketplaceSpecialistHandoffInput & {
  route: "human_marketplace_specialist_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type MarketplaceAssistantRuntime = {
  status: "disabled";
  providerCallsEnabled: false;
  recommendationExecutionEnabled: false;
  referralCreationEnabled: false;
  redirectGenerationEnabled: false;
  applicationSubmissionEnabled: false;
  statusReconciliationEnabled: false;
  commissionHandlingEnabled: false;
  aiExecutionEnabled: false;
};
