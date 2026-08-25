export type ComplianceDeliveryModel =
  | "sg_service"
  | "sg_managed_with_partner"
  | "marketplace_referral"
  | "client_self_service_assisted"
  | "education_only"
  | "future_or_conditional";

export type ComplianceServiceType =
  | "annual_compliance_monitoring"
  | "annual_report_filing"
  | "biennial_report_filing"
  | "registered_agent_renewal_coordination"
  | "business_license_monitoring"
  | "business_license_renewal"
  | "state_amendment_support"
  | "foreign_qualification_support"
  | "entity_information_update"
  | "compliance_cleanup"
  | "notice_response_support"
  | "custom_compliance_service";

export type ComplianceCaseStatus =
  | "draft"
  | "monitoring"
  | "upcoming"
  | "action_required"
  | "client_action_required"
  | "preparing"
  | "review_pending"
  | "ready_to_file"
  | "submitted"
  | "processing"
  | "completed"
  | "overdue"
  | "blocked"
  | "cancelled"
  | "archived";

export interface ComplianceEngagement {
  engagementId: string;
  clientRef: string;
  organizationRef: string;
  serviceOrderRef: string;
  serviceType: ComplianceServiceType;
  deliveryModel: ComplianceDeliveryModel;
  monitoringFrequency: "monthly" | "quarterly" | "annual" | "event_driven";
  status: "active" | "paused" | "closed";
  openedAt: string;
}

export interface ComplianceCase {
  caseId: string;
  caseNumber: string;
  organizationRef: string;
  engagementRef: string;
  requirementRef?: string;
  obligationRef?: string;
  jurisdictionCode: string;
  status: ComplianceCaseStatus;
  priority: "critical" | "high" | "normal" | "low";
  version: number;
  externalFilingAllowed: false;
  createdAt: string;
}

export type ComplianceProfileSource =
  | "business_formation"
  | "ein_module"
  | "tax_module"
  | "bookkeeping"
  | "client_confirmation"
  | "official_filing"
  | "license_record"
  | "partner_record"
  | "staff_verification";

export interface ComplianceProfile {
  organizationRef: string;
  entityType: "limited_liability_company" | "corporation" | "other_supported_entity";
  formationJurisdiction: string;
  formationDate: string;
  activityCodes: readonly string[];
  businessLocationJurisdictions: readonly string[];
  employeeStates: readonly string[];
  taxJurisdictions: readonly string[];
  registeredAgentRef?: string;
  principalAddressRef?: string;
  verificationStatus: "verified" | "partial" | "stale" | "unknown";
  sourceReferences: readonly string[];
  version: number;
  capturedAt: string;
  profileHash: string;
}

export interface ComplianceSnapshot {
  snapshotId: string;
  organizationRef: string;
  profileVersion: number;
  requirementSetVersion: string;
  sourceReferences: readonly string[];
  snapshotHash: string;
  evaluatedAt: string;
}

export type ComplianceRequirementType =
  | "annual_report"
  | "biennial_report"
  | "periodic_report"
  | "franchise_related_filing"
  | "registered_agent_requirement"
  | "license"
  | "permit"
  | "renewal"
  | "ownership_reporting"
  | "foreign_qualification"
  | "entity_amendment"
  | "address_update"
  | "officer_manager_update"
  | "tax_registration_related"
  | "employer_registration_related"
  | "other";

export interface ComplianceRequirementSource {
  sourceType:
    | "official_government"
    | "official_regulatory"
    | "approved_provider"
    | "professional_guidance"
    | "secondary";
  authority: string;
  reference: string;
  retrievedAt: string;
  verifiedAt: string;
  verifiedBy: string;
}

export interface ComplianceDeadlineRule {
  ruleType:
    | "fixed_date"
    | "anniversary"
    | "days_after_event"
    | "months_after_event"
    | "periodic_interval"
    | "manual_verified";
  month?: number;
  day?: number;
  intervalMonths?: number;
  offsetDays?: number;
  weekendHolidayAdjustment: "none" | "require_verified_calendar";
  timezone: string;
}

export interface ComplianceRequirement {
  requirementId: string;
  requirementCode: string;
  requirementType: ComplianceRequirementType;
  jurisdictionCode: string;
  entityTypes: readonly ComplianceProfile["entityType"][];
  activityCodes?: readonly string[];
  source: ComplianceRequirementSource;
  freshness: "current_verified" | "current_with_caveat" | "verification_due" | "stale" | "unknown";
  status:
    | "draft"
    | "under_review"
    | "active"
    | "superseded"
    | "temporarily_suspended"
    | "retired"
    | "unknown";
  effectiveFrom: string;
  effectiveTo?: string;
  version: number;
  deadlineRule: ComplianceDeadlineRule;
  requiresProfessionalReview: boolean;
  serviceScopeDefault:
    | "included"
    | "optional_add_on"
    | "not_included"
    | "partner_service"
    | "client_self_file"
    | "monitor_only";
}

export type ComplianceApplicabilityStatus =
  | "applicable"
  | "possibly_applicable"
  | "not_applicable"
  | "insufficient_information"
  | "professional_review_required";

export interface ComplianceApplicabilityRecord {
  applicabilityId: string;
  organizationRef: string;
  requirementRef: string;
  snapshotRef: string;
  status: ComplianceApplicabilityStatus;
  reasonCode:
    | "MATCHED"
    | "JURISDICTION_MISMATCH"
    | "ENTITY_MISMATCH"
    | "ACTIVITY_INFORMATION_MISSING"
    | "PROFILE_NOT_VERIFIED"
    | "REQUIREMENT_NOT_CURRENT"
    | "PROFESSIONAL_REVIEW_REQUIRED";
  confidence: "verified" | "review_required" | "unknown";
  evaluatedAt: string;
}

export type ComplianceObligationStatus =
  | "scheduled"
  | "upcoming"
  | "action_required"
  | "client_action_required"
  | "preparing"
  | "review_pending"
  | "ready_to_file"
  | "submitted"
  | "processing"
  | "completed"
  | "overdue"
  | "waived"
  | "not_applicable"
  | "superseded";

export interface DeadlineCalculationRecord {
  calculationId: string;
  obligationRef: string;
  ruleVersion: string;
  inputDates: Readonly<Record<string, string>>;
  dueDate: string;
  timezone: string;
  trace: string;
  confidence: "verified" | "high" | "review_required" | "unknown";
  calculatedAt: string;
}

export interface ComplianceObligation {
  obligationId: string;
  organizationRef: string;
  requirementRef: string;
  requirementCode: string;
  requirementType: ComplianceRequirementType;
  jurisdictionCode: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  dueDateConfidence: DeadlineCalculationRecord["confidence"];
  status: ComplianceObligationStatus;
  responsibility:
    | "sg_responsible"
    | "client_responsible"
    | "partner_responsible"
    | "shared"
    | "monitoring_only";
  serviceScope: ComplianceRequirement["serviceScopeDefault"];
  sourceReference: string;
  uniquenessKey: string;
  createdAt: string;
}

export interface ComplianceReminder {
  reminderId: string;
  obligationRef: string;
  policyCode: string;
  channel:
    | "in_app"
    | "email"
    | "sms_when_consented"
    | "staff_task"
    | "dashboard_alert"
    | "partner_notification";
  recipientRef: string;
  scheduledAt: string;
  idempotencyKey: string;
  sensitiveDetailsIncluded: false;
}

export interface ComplianceReportPreparation {
  preparationId: string;
  obligationRef: string;
  requirementVersion: string;
  reportDataHash: string;
  formVersion: string;
  state:
    | "draft"
    | "client_input_required"
    | "internal_review"
    | "correction_required"
    | "ready_to_file"
    | "submitted"
    | "accepted"
    | "rejected"
    | "superseded";
  createdAt: string;
}

export interface ComplianceAuthorization {
  authorizationRef: string;
  obligationRef: string;
  reportHash: string;
  acceptedAt: string;
  status: "valid" | "superseded" | "revoked" | "expired";
}

export interface ComplianceFilingPackage {
  packageId: string;
  obligationRef: string;
  requirementRef: string;
  reportHash: string;
  authorizationRef: string;
  packageHash: string;
  state: "prepared" | "invalidated" | "authorized";
  immutable: true;
}

export interface ComplianceProviderConfiguration {
  providerCode: string;
  status: "disabled" | "sandbox_pending" | "enabled" | "paused" | "degraded";
  supportsSubmission: boolean;
  supportsStatusLookup: boolean;
  killSwitchEnabled: boolean;
}

export interface ComplianceFilingAttempt {
  attemptId: string;
  obligationRef: string;
  packageHash: string;
  providerCode: string;
  idempotencyKey: string;
  status:
    | "prepared"
    | "submitted"
    | "processing"
    | "unknown_outcome"
    | "rejected"
    | "accepted"
    | "blocked";
  immutable: true;
}

export interface ComplianceCompletionRecord {
  completionId: string;
  obligationRef: string;
  completionType:
    | "official_receipt"
    | "accepted_filing"
    | "certificate"
    | "license"
    | "renewal_confirmation"
    | "provider_verified_confirmation"
    | "manual_verified_official_record"
    | "other";
  evidenceDocumentRefs: readonly string[];
  externalReference?: string;
  verifiedBy: string;
  verificationStatus: "verified" | "review_required";
  completedAt: string;
  nextRecurrencePlanned: boolean;
}

export interface ComplianceChangeRequest {
  requestId: string;
  organizationRef: string;
  changeType:
    | "registered_agent"
    | "address"
    | "management"
    | "ownership"
    | "legal_name"
    | "dba"
    | "foreign_qualification"
    | "license";
  requestedValueHash: string;
  state:
    | "requested"
    | "review_required"
    | "approved_for_preparation"
    | "completed"
    | "rejected"
    | "cancelled";
  requestedAt: string;
}

export interface OfficialComplianceUpdate {
  updateId: string;
  organizationRef: string;
  changeRequestRef: string;
  sourceDocumentRef: string;
  officialValueHash: string;
  verificationStatus: "verified";
  appliedAt: string;
}

export interface ComplianceNotice {
  noticeId: string;
  organizationRef: string;
  sourceDocumentRef: string;
  sourceReference: string;
  status: "received" | "verified" | "action_required" | "resolved" | "archived";
  severity: "informational" | "low" | "medium" | "high" | "critical";
  dueDate?: string;
  dueDateConfidence: "verified" | "review_required" | "unknown";
  receivedAt: string;
}

export interface OwnershipReportingEvaluation {
  status:
    | "not_evaluated"
    | "professional_review_required"
    | "possibly_applicable"
    | "not_applicable";
  reason:
    | "REQUIREMENT_NOT_CURRENT"
    | "SOURCE_INSUFFICIENT"
    | "REVIEW_REQUIRED"
    | "NO_ACTIVE_REQUIREMENT";
  canCreateFiling: false;
}

export type ComplianceHandoffDestination =
  | "tax"
  | "bookkeeping"
  | "ein"
  | "funding"
  | "banking"
  | "business_formation";

export interface ComplianceHandoffPlan {
  handoffId: string;
  sourceObligationRef: string;
  organizationRef: string;
  destination: ComplianceHandoffDestination;
  payloadVersion: "v1";
  payloadHash: string;
  idempotencyKey: string;
  status: "ready";
  containsSensitiveFields: false;
  canExecuteExternally: false;
}

export type ComplianceAutomationAction =
  | "create_task"
  | "schedule_reminder"
  | "refresh_read_model"
  | "submit_filing"
  | "mark_completed"
  | "override_blocker"
  | "share_partner_data";

export interface ComplianceAiSuggestion {
  state: "requires_human_review";
  requirementRefs: readonly string[];
  sourceReferences: readonly string[];
  canDeclareCompliance: false;
  canSubmitFiling: false;
  canOverrideBlocker: false;
}

export interface ComplianceAuditEvent {
  eventType: string;
  actorRef: string;
  resourceRef: string;
  purpose: string;
  correlationId: string;
  sensitivePayloadIncluded: false;
}
