export type FormationEntityType =
  | "limited_liability_company"
  | "corporation"
  | "nonprofit_corporation"
  | "professional_entity"
  | "partnership_registration"
  | "foreign_qualification"
  | "series_llc"
  | "other_supported_entity";

export type FormationCaseStatus =
  | "draft"
  | "intake_pending"
  | "intake_in_progress"
  | "eligibility_review"
  | "name_review"
  | "formation_data_pending"
  | "document_preparation"
  | "internal_review"
  | "client_review"
  | "signature_pending"
  | "payment_pending"
  | "ready_to_file"
  | "filing_in_progress"
  | "state_processing"
  | "state_action_required"
  | "approved"
  | "rejected"
  | "post_formation"
  | "completed"
  | "cancelled"
  | "archived";

export type FormationDeliveryModel =
  | "sg_service"
  | "sg_managed_with_partner"
  | "marketplace_referral"
  | "education_only"
  | "future_or_conditional";

export type FormationPartyRole =
  | "member"
  | "manager"
  | "shareholder"
  | "director"
  | "officer"
  | "organizer"
  | "incorporator"
  | "authorized_person"
  | "beneficial_owner_reference";

export interface FormationCase {
  caseId: string;
  caseNumber: string;
  clientRef: string;
  organizationRef?: string;
  serviceOrderRef: string;
  productCode: string;
  entityType: FormationEntityType;
  formationJurisdiction: string;
  deliveryModel: FormationDeliveryModel;
  status: FormationCaseStatus;
  version: number;
  filingAllowed: false;
  createdAt?: string;
}

export interface FormationParty {
  partyRef: string;
  role: FormationPartyRole;
  ownershipPercent?: number;
  votingPercent?: number;
  managementRole?: "member_managed" | "manager_managed" | "director" | "officer";
}

export interface OwnershipEvaluation {
  valid: true;
  totalOwnershipPercent: number;
  parties: readonly FormationParty[];
}

export interface JurisdictionRequirement {
  requirementId: string;
  jurisdiction: string;
  entityType: FormationEntityType;
  ruleKey: string;
  ruleValue: Readonly<Record<string, unknown>>;
  verificationStatus: "draft" | "under_review" | "verified" | "stale" | "retired";
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
}

export interface RequirementSnapshot {
  formationCaseRef: string;
  capturedAt: string;
  requirementIds: readonly string[];
  snapshotHash: string;
}

export interface FormationReadinessInput {
  identityComplete?: boolean;
  entitySelected: boolean;
  jurisdictionSelected: boolean;
  nameReady: boolean;
  ownershipComplete: boolean;
  managementComplete: boolean;
  registeredAgentComplete: boolean;
  addressesComplete: boolean;
  requiredDocumentsAvailable: boolean;
}

export interface FormationReadiness {
  score: number;
  complete: boolean;
  missing: readonly string[];
}

export interface ClientFilingAuthorization {
  documentHash: string;
  acceptedAt: string;
  authorizationRef?: string;
}

export interface FormationPackage {
  packageId: string;
  formationCaseRef: string;
  templateVersion: string;
  requirementSnapshotHash: string;
  documentHash: string;
  generatedAt: string;
  state: "prepared" | "invalidated" | "authorized";
}

export interface FormationProviderConfiguration {
  providerCode: string;
  status: "disabled" | "sandbox_pending" | "enabled" | "paused" | "degraded";
  supportsSubmission: boolean;
  killSwitchEnabled: boolean;
}

export type FormationTransitionReason =
  | "READINESS_INCOMPLETE"
  | "INTERNAL_REVIEW_REQUIRED"
  | "CLIENT_AUTHORIZATION_REQUIRED"
  | "REQUIREMENT_SNAPSHOT_STALE"
  | "PAYMENT_NOT_READY"
  | "FILING_CHANNEL_UNAVAILABLE"
  | "INVALID_TRANSITION";

export interface FormationTransitionEvaluation {
  allowed: boolean;
  reason?: FormationTransitionReason;
}

export interface FilingAttempt {
  attemptId: string;
  formationCaseRef: string;
  packageHash: string;
  idempotencyKey: string;
  providerCode: string;
  status: "prepared" | "submitted" | "state_processing" | "rejected" | "approved" | "blocked";
  immutable: true;
}

export type FilingPreparationResult =
  | Readonly<{
      kind: "blocked";
      reason:
        | "PROVIDER_DISABLED"
        | "FILING_CHANNEL_UNAVAILABLE"
        | "NOT_READY_TO_FILE"
        | "PACKAGE_MISMATCH"
        | "AUTHORIZATION_MISMATCH"
        | "REQUIREMENT_SNAPSHOT_STALE"
        | "PAYMENT_NOT_READY";
    }>
  | Readonly<{ kind: "prepared"; attempt: FilingAttempt }>;

export interface FilingOutcome {
  attemptId: string;
  kind: "rejected" | "approved" | "state_processing";
  occurredAt: string;
  officialReference: string;
  reason?: string;
  officialDocumentRefs?: readonly string[];
}

export interface FilingOutcomeRecord extends FilingOutcome {
  nextCaseStatus: FormationCaseStatus;
  immutable: true;
}

export type FormationHandoffDestination =
  | "ein"
  | "compliance"
  | "bookkeeping"
  | "tax"
  | "funding"
  | "banking";

export interface FormationHandoffPlan {
  formationCaseRef: string;
  destination: FormationHandoffDestination;
  approvalReference: string;
  idempotencyKey: string;
  status: "pending";
  canExecuteExternally: false;
}

export interface FormationFeeBreakdown {
  currency: "USD";
  sgServiceFeeMinor: number;
  governmentFeeMinor: number;
  partnerFeeMinor: number;
  totalMinor: number;
}

export interface FormationAiSuggestion {
  state: "requires_human_review";
  canSelectEntity: false;
  canSubmitFiling: false;
  canIssueLegalOpinion: false;
  requirementSnapshotHash: string;
}

export interface FormationAuditEvent {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  correlationId: string;
  sensitivePayloadIncluded: false;
}
