export type EinCaseStatus =
  | "intake_pending"
  | "intake_in_progress"
  | "internal_review"
  | "client_review"
  | "authorization_pending"
  | "ready_to_submit"
  | "submission_prepared"
  | "submitted"
  | "provider_processing"
  | "outcome_review"
  | "additional_information_required"
  | "correction_required"
  | "issued"
  | "issuance_verification"
  | "completed"
  | "cancelled"
  | "archived";

export type EinDeliveryModel =
  | "sg_service"
  | "provider_managed"
  | "education_only"
  | "future_or_conditional";

export interface EinCase {
  caseId: string;
  caseNumber: string;
  clientRef: string;
  organizationRef: string;
  serviceOrderRef: string;
  formationCaseRef?: string;
  deliveryModel: EinDeliveryModel;
  status: EinCaseStatus;
  version: number;
  externalSubmissionAllowed: false;
  createdAt: string;
}

export interface OrganizationIdentitySnapshot {
  organizationRef: string;
  legalName: string;
  entityType: "limited_liability_company" | "corporation" | "other_supported_entity";
  formationJurisdiction: string;
  formationDate?: string;
  sourceRefs: readonly string[];
  capturedAt: string;
  snapshotHash: string;
}

export interface ResponsiblePartyRecord {
  responsiblePartyRef: string;
  personRef: string;
  role: "individual" | "principal_officer" | "owner" | "member" | "manager" | "trustee";
  identifierSecureRef: string;
  verificationStatus: "unverified" | "verified" | "conflict" | "expired";
  verifiedAt?: string;
}

export interface EinRequirement {
  requirementId: string;
  ruleKey: string;
  ruleValue: Readonly<Record<string, unknown>>;
  verificationStatus: "draft" | "verified" | "stale" | "retired";
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
}

export interface EinRequirementSnapshot {
  einCaseRef: string;
  requirementIds: readonly string[];
  capturedAt: string;
  snapshotHash: string;
}

export type ExistingEinStatus = "none" | "suspected" | "reported" | "verified";

export type ExistingEinGate =
  | Readonly<{ kind: "clear" }>
  | Readonly<{ kind: "manual_review_required"; reason: "EXISTING_EIN_SUSPECTED" | "EIN_REPORTED" }>
  | Readonly<{ kind: "blocked"; reason: "EXISTING_EIN_VERIFIED" }>;

export interface EinApplicationDraft {
  applicationId: string;
  einCaseRef: string;
  formVersion: string;
  organizationSnapshotHash: string;
  requirementSnapshotHash: string;
  responsiblePartyRef: string;
  applicationHash: string;
  state: "draft" | "review_ready" | "invalidated" | "authorized";
  createdAt: string;
}

export interface EinReviewFinding {
  code:
    | "MISSING_DATA"
    | "IDENTITY_CONFLICT"
    | "FORMATION_MISMATCH"
    | "EXISTING_EIN_RISK"
    | "STALE_REQUIREMENT"
    | "UNSUPPORTED_ENTITY";
  severity: "blocking" | "warning";
  clientVisibleMessage: string;
}

export interface EinClientAuthorization {
  authorizationRef: string;
  applicationHash: string;
  acceptedAt: string;
  signerRef: string;
  status: "valid" | "superseded" | "revoked" | "expired";
}

export interface EinProviderConfiguration {
  providerCode: string;
  status: "disabled" | "sandbox_pending" | "enabled" | "paused" | "degraded";
  supportsSubmission: boolean;
  supportsStatusLookup: boolean;
  killSwitchEnabled: boolean;
}

export interface EinReadyToSubmitEvaluation {
  allowed: boolean;
  reason?:
    | "INVALID_STATE"
    | "EXISTING_EIN_BLOCK"
    | "RESPONSIBLE_PARTY_UNVERIFIED"
    | "REQUIREMENT_SNAPSHOT_STALE"
    | "APPLICATION_REVIEW_REQUIRED"
    | "CLIENT_AUTHORIZATION_REQUIRED"
    | "OPERATIONAL_APPROVAL_REQUIRED"
    | "PROVIDER_UNAVAILABLE";
}

export interface EinSubmissionAttempt {
  attemptId: string;
  einCaseRef: string;
  applicationHash: string;
  idempotencyKey: string;
  providerCode: string;
  status:
    | "prepared"
    | "submitted"
    | "provider_processing"
    | "unknown_outcome"
    | "rejected"
    | "issued"
    | "blocked";
  immutable: true;
}

export type EinSubmissionPreparation =
  | Readonly<{
      kind: "blocked";
      reason:
        | "NOT_READY_TO_SUBMIT"
        | "PROVIDER_DISABLED"
        | "SUBMISSION_CHANNEL_UNAVAILABLE"
        | "APPLICATION_HASH_MISMATCH"
        | "AUTHORIZATION_MISMATCH"
        | "UNKNOWN_OUTCOME_REQUIRES_REVIEW";
    }>
  | Readonly<{ kind: "prepared"; attempt: EinSubmissionAttempt }>;

export interface EinSubmissionOutcome {
  attemptId: string;
  kind: "submitted" | "provider_processing" | "unknown_outcome" | "rejected" | "issued";
  occurredAt: string;
  officialReference?: string;
  evidenceDocumentRef?: string;
  reason?: string;
}

export interface EinIssuanceRecord {
  issuanceId: string;
  einCaseRef: string;
  issuanceEvidenceDocumentRef: string;
  fullEinSecureRef: string;
  verificationStatus: "reported" | "verified" | "discrepancy";
  issuedAt: string;
  immutable: true;
}

export interface EinDocumentIndexEntry {
  documentRef: string;
  einCaseRef: string;
  documentType:
    | "official_confirmation"
    | "application_copy"
    | "authorization"
    | "supporting_evidence";
  sensitivity: "restricted" | "highly_sensitive";
  contentHash: string;
  verificationStatus: "received" | "verified" | "rejected";
  immutable: boolean;
}

export type EinHandoffDestination =
  | "banking"
  | "bookkeeping"
  | "tax"
  | "compliance"
  | "payroll"
  | "funding"
  | "marketplace";

export interface EinHandoffPlan {
  handoffId: string;
  sourceCaseRef: string;
  destination: EinHandoffDestination;
  organizationRef: string;
  issuanceRef: string;
  payloadVersion: "v1";
  payloadHash: string;
  idempotencyKey: string;
  status: "ready";
  containsFullEin: false;
  canExecuteExternally: false;
}

export interface EinRevealAuthorization {
  kind: "authorized";
  issuanceRef: string;
  fullEinSecureRef: string;
  expiresAt: string;
  auditRequired: true;
}

export interface EinAuditEvent {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  purpose: string;
  correlationId: string;
  sensitivePayloadIncluded: false;
}
