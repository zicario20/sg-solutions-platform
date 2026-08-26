export const ENTITLEMENT_TYPES = [
  "service_access",
  "portal_section_access",
  "capability_access",
  "document_access",
  "intake_access",
  "workflow_action",
  "appointment_access",
  "messaging_access",
  "ai_assistance_access",
  "marketplace_action",
  "download_access",
  "partner_handoff_access",
  "administrative_service_action",
  "other",
] as const;

export const ENTITLEMENT_DECISION_STATUSES = [
  "allow",
  "allow_with_limits",
  "allow_read_only",
  "deny",
  "suspended",
  "action_required",
  "manual_review_required",
  "not_applicable",
  "unknown",
] as const;

export const ENTITLEMENT_CONDITION_TYPES = [
  "service_order_exists",
  "service_order_status",
  "payment_gate",
  "payment_verification",
  "human_authorization",
  "intake_status",
  "document_readiness",
  "consent_status",
  "identity_verification",
  "jurisdiction",
  "client_relationship",
  "service_stage",
  "partner_availability",
  "provider_capability",
  "cancellation",
  "refund",
  "dispute",
  "time_window",
  "manual_review",
  "custom",
] as const;

export type EntitlementType = (typeof ENTITLEMENT_TYPES)[number];
export type EntitlementDecisionStatus = (typeof ENTITLEMENT_DECISION_STATUSES)[number];
export type EntitlementConditionType = (typeof ENTITLEMENT_CONDITION_TYPES)[number];

export type EntitlementSubjectType =
  | "client"
  | "organization"
  | "household"
  | "authorized_representative"
  | "partner_user_future"
  | "internal_user_for_service_context"
  | "system_actor";

export type EntitlementResourceType =
  | "service_definition"
  | "service_version"
  | "service_order"
  | "case_file"
  | "portal_section"
  | "document_collection"
  | "document"
  | "intake"
  | "workflow_action"
  | "message_thread"
  | "appointment_type"
  | "ai_agent_capability"
  | "marketplace_action"
  | "partner_referral"
  | "report_or_export"
  | "other";

export type EntitlementScopeType =
  | "resource_specific"
  | "service_order_specific"
  | "case_specific"
  | "service_version_specific"
  | "service_family"
  | "subject_wide"
  | "organization_specific"
  | "time_limited"
  | "stage_limited"
  | "custom";

export type EntitlementSubject = Readonly<{
  subjectType: EntitlementSubjectType;
  subjectId: string;
  tenantId: string;
  identityId?: string;
  clientId?: string;
  organizationId?: string;
  householdId?: string;
}>;

export type EntitlementResource = Readonly<{
  resourceType: EntitlementResourceType;
  resourceId: string;
  tenantId: string;
  ownerSubjectId?: string;
  serviceDefinitionId?: string;
  serviceVersionId?: string;
  serviceOrderId?: string;
  caseFileId?: string;
}>;

export type EntitlementDefinition = Readonly<{
  id: string;
  entitlementKey: string;
  name: string;
  description: string;
  entitlementType: EntitlementType;
  ownerDomain: string;
  resourceType: EntitlementResourceType;
  defaultDecision: "deny";
  lifecycleStatus: "draft" | "active" | "paused" | "retired" | "archived";
  createdAt: string;
  updatedAt: string;
}>;

export type ServiceCapabilityDefinition = Readonly<{
  id: string;
  capabilityCode: string;
  serviceDomain: string;
  description: string;
  surface: "public" | "client" | "admin" | "backend";
  riskLevel: "low" | "moderate" | "high" | "critical";
  resourceType: EntitlementResourceType;
  status: "draft" | "active" | "paused" | "retired";
}>;

export type ServiceEntitlementProfile = Readonly<{
  id: string;
  serviceVersionId: string;
  version: number;
  entitlementDefinitionIds: readonly string[];
  activationPolicyIds: readonly string[];
  suspensionPolicyIds: readonly string[];
  revocationPolicyIds: readonly string[];
  status: "draft" | "active" | "paused" | "retired";
  effectiveFrom: string;
  effectiveTo?: string;
}>;

export type EntitlementUnknownBehavior =
  | "deny"
  | "action_required"
  | "manual_review_required"
  | "use_last_verified_with_expiry"
  | "not_applicable";

export type EntitlementPolicy = Readonly<{
  id: string;
  policyCode: string;
  version: number;
  entitlementDefinitionId: string;
  status:
    | "draft"
    | "testing"
    | "review"
    | "approved"
    | "active"
    | "limited"
    | "paused"
    | "deprecated"
    | "retired";
  requiredConditions: readonly EntitlementConditionType[];
  subjectTypes?: readonly EntitlementSubjectType[];
  resourceTypes?: readonly EntitlementResourceType[];
  unknownBehavior: Readonly<Partial<Record<EntitlementConditionType, EntitlementUnknownBehavior>>>;
  grantMode: "decision_only" | "materialize_derived";
  precedenceVersion: number;
  effectiveFrom: string;
  effectiveTo?: string;
}>;

export type EntitlementConditionResult = Readonly<{
  conditionType: EntitlementConditionType;
  status:
    | "satisfied"
    | "unsatisfied"
    | "unknown"
    | "stale"
    | "manual_review_required"
    | "not_applicable";
  blocking: boolean;
  source: string;
  sourceVersion: string;
  observedAt: string;
  nextAction?: string;
}>;

export type EntitlementContext = Readonly<{
  ownership: "owned" | "unresolved" | "cross_subject" | "security_blocked";
  paymentGate:
    | "satisfied"
    | "satisfied_with_conditions"
    | "not_satisfied"
    | "conflict"
    | "manual_review_required"
    | "unknown";
  humanAuthorization: "authorized" | "missing" | "denied" | "unknown";
  documentReadiness: "ready" | "missing" | "rejected" | "unknown";
  intakeStatus: "complete" | "incomplete" | "unknown";
  consentStatus: "granted" | "withdrawn" | "missing" | "unknown";
  identityStatus: "verified" | "unverified" | "blocked" | "unknown";
  jurisdictionStatus: "allowed" | "not_allowed" | "review_required" | "unknown";
  serviceOrderStatus:
    | "draft"
    | "awaiting_payment"
    | "awaiting_authorization"
    | "active"
    | "waiting_on_client"
    | "waiting_on_external_party"
    | "completed"
    | "cancelled"
    | "refunded_or_adjusted_context"
    | "closed"
    | "unknown";
  partnerAvailability?: "available" | "unavailable" | "unknown";
  providerCapability?: "available" | "unavailable" | "unknown";
  conditionFreshness?: Readonly<
    Partial<
      Record<EntitlementConditionType, "current" | "aging" | "stale" | "unknown" | "not_applicable">
    >
  >;
  sourceVersions: Readonly<Record<string, string>>;
}>;

export type EntitlementGrantStatus =
  | "pending"
  | "active"
  | "limited"
  | "suspended"
  | "revoked"
  | "expired"
  | "cancelled"
  | "superseded"
  | "unknown";

export type EntitlementGrant = Readonly<{
  id: string;
  entitlementDefinitionId: string;
  subject: EntitlementSubject;
  resource: EntitlementResource;
  scopeType: EntitlementScopeType;
  sourceType:
    | "derived_from_policy"
    | "service_order"
    | "approved_bundle"
    | "human_approved_exception"
    | "migration_import"
    | "administrative_correction"
    | "system_bootstrap";
  sourceReference: string;
  policyVersion: number;
  status: EntitlementGrantStatus;
  effectiveFrom: string;
  expiresAt?: string;
  temporary: boolean;
  reason?: string;
  approvedBy?: string;
  revalidationRequired: boolean;
  usageLimit?: number;
  usageUsed: number;
  readOnlyWhenSuspended: boolean;
}>;

export type EntitlementDeny = Readonly<{
  id: string;
  entitlementDefinitionId: string;
  subject: EntitlementSubject;
  resource: EntitlementResource;
  scopeType: EntitlementScopeType;
  reason: string;
  authorityReference: string;
  source: string;
  status: "active" | "revoked" | "expired" | "superseded";
  effectiveFrom: string;
  expiresAt?: string;
}>;

export type EntitlementDecisionSnapshot = Readonly<{
  id: string;
  subject: EntitlementSubject;
  resource: EntitlementResource;
  policyVersion: number;
  conditionSourceVersions: Readonly<Record<string, string>>;
  grantIds: readonly string[];
  denyIds: readonly string[];
  decision: EntitlementDecisionStatus;
  contentHash: string;
  createdAt: string;
}>;

export type EntitlementDecision = Readonly<{
  id: string;
  idempotencyKey: string;
  evaluationRequestId: string;
  entitlementDefinitionId: string;
  entitlementKey: string;
  subject: EntitlementSubject;
  resource: EntitlementResource;
  scopeType: EntitlementScopeType;
  policyId: string;
  policyVersion: number;
  status: EntitlementDecisionStatus;
  conditionResults: readonly EntitlementConditionResult[];
  grantIds: readonly string[];
  denyIds: readonly string[];
  nextActions: readonly string[];
  limits: Readonly<{ usageLimit?: number; usageRemaining?: number }>;
  effectiveFrom: string;
  expiresAt?: string;
  decidedAt: string;
  snapshot: EntitlementDecisionSnapshot;
  supersedesDecisionId?: string;
}>;

export type EntitlementDecisionExplanation = Readonly<{
  decisionId: string;
  summary: string;
  passedConditions: readonly EntitlementConditionType[];
  failedConditions: readonly EntitlementConditionType[];
  unknownConditions: readonly EntitlementConditionType[];
  grantReferences: readonly string[];
  denyReferences: readonly string[];
  nextActions: readonly string[];
  clientSafeMessageKey: string;
}>;

export type EntitlementOperationalFinding = Readonly<{
  id: string;
  type:
    | "missing_policy"
    | "profile_version_mismatch"
    | "subject_resolution_failure"
    | "resource_ownership_mismatch"
    | "unknown_blocking_condition"
    | "stale_condition_source"
    | "grant_deny_conflict"
    | "cache_invalidation_failure"
    | "enforcement_bypass_attempt"
    | "usage_counter_conflict"
    | "temporary_access_without_expiry"
    | "cross_client_access_attempt"
    | "cross_tenant_access_attempt"
    | "workflow_action_without_entitlement"
    | "ai_scope_violation";
  severity: "low" | "medium" | "high" | "critical";
  blocking: boolean;
  subjectId?: string;
  resourceId?: string;
  decisionId?: string;
  createdAt: string;
}>;

export type EntitlementActor = Readonly<{
  actorType: "staff" | "owner" | "service_account" | "system" | "ai";
  actorId: string;
  assurance?: "aal1" | "aal2";
  permissions?: readonly string[];
}>;

export type EntitlementEvaluationCommand = Readonly<{
  definition: EntitlementDefinition;
  policy: EntitlementPolicy;
  subject: EntitlementSubject;
  resource: EntitlementResource;
  context: EntitlementContext;
  grants: readonly EntitlementGrant[];
  denies: readonly EntitlementDeny[];
  requestedAction: string;
  correlationId: string;
  evaluatedAt: string;
  actor?: EntitlementActor;
}>;

export type EntitlementWorkflowHandoff = Readonly<{
  status: "blocked";
  reason: "activation_not_authorized";
}>;

export type EntitlementAuditEvent = Readonly<{
  id: string;
  action:
    | "evaluation_requested"
    | "decision_created"
    | "decision_enforced"
    | "access_denied"
    | "grant_created"
    | "grant_suspended"
    | "grant_revoked"
    | "usage_consumed"
    | "cache_invalidated"
    | "simulation_executed"
    | "runtime_operation_blocked";
  actor: EntitlementActor;
  entitlementKey?: string;
  subjectId?: string;
  resourceId?: string;
  decisionId?: string;
  result: "accepted" | "denied" | "blocked" | "manual_review";
  correlationId: string;
  createdAt: string;
}>;

export type EntitlementOutboxEvent = Readonly<{
  id: string;
  eventType:
    | "entitlement_decision_created"
    | "entitlement_access_denied"
    | "entitlement_cache_invalidated";
  aggregateId: string;
  correlationId: string;
  idempotencyKey: string;
  dispatchState: "blocked";
  createdAt: string;
}>;

export type EntitlementEvaluationResult = Readonly<{
  decision: EntitlementDecision;
  explanation: EntitlementDecisionExplanation;
  workflowHandoff: EntitlementWorkflowHandoff;
  finding?: EntitlementOperationalFinding;
  cacheHit: boolean;
}>;

export type EntitlementUsageInput = Readonly<{
  idempotencyKey: string;
  amount: number;
  occurredAt: string;
}>;

export type EntitlementUsageResult = Readonly<{
  accepted: boolean;
  grant: EntitlementGrant;
  reason?: string;
}>;

export type EntitlementCacheEntry = Readonly<{
  tenantId: string;
  subjectId: string;
  entitlementKey: string;
  resourceId: string;
  policyVersion: number;
  contextVersion: string;
  decisionId: string;
  expiresAt: string;
}>;

export type EntitlementCacheLookup = Readonly<{
  tenantId: string;
  subjectId: string;
  entitlementKey: string;
  resourceId: string;
  policyVersion: number;
  contextVersion: string;
  now: string;
}>;

export type EntitlementRuntimeControls = Readonly<{
  m044PaymentGateIngressEnabled: false;
  automaticGrantMaterializationEnabled: false;
  workflowHandoffEnabled: false;
  providerPartnerActionEnabled: false;
  aiEntitlementDecisionEnabled: false;
}>;

export type ClientEntitlementView = Readonly<{
  entitlementKey: string;
  displayName: string;
  serviceOrderReference?: string;
  availabilityStatus:
    | "available"
    | "available_with_limits"
    | "read_only"
    | "action_required"
    | "temporarily_unavailable"
    | "unavailable"
    | "under_review";
  allowedActions: readonly string[];
  limits: Readonly<{ usageRemaining?: number }>;
  expiresAt?: string;
  nextActions: readonly string[];
  clientSafeReason: string;
  lastEvaluatedAt: string;
}>;

export type EntitlementActivationState =
  | "not_eligible"
  | "pending_conditions"
  | "ready_for_evaluation"
  | "active"
  | "active_with_limits"
  | "read_only"
  | "suspended"
  | "revoked"
  | "expired"
  | "manual_review"
  | "unknown";
