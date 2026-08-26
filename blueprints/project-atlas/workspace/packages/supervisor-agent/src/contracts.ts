import type { AgentManifest } from "@atlas/ai-control-plane";

export const SUPERVISOR_PROHIBITED_OUTCOMES = [
  "approve_service_start",
  "change_price",
  "grant_entitlement",
  "issue_refund",
  "publish_service",
  "send_credit_dispute",
  "submit_filing",
  "submit_partner_application",
  "submit_tax_return",
] as const;

export type SupervisorSurface = "backend" | "admin" | "client_indirect" | "public_indirect";
export type SupervisorInvocationSource =
  | "admin_request"
  | "client_portal"
  | "public_intake"
  | "secure_message"
  | "system_event"
  | "workflow_event";
export type SupervisorRisk = "low" | "moderate" | "high" | "critical";
export type SupervisorDataSensitivity = "public" | "internal" | "confidential" | "restricted";
export type SupervisorUrgency = "low" | "normal" | "high" | "urgent";
export type SupervisorComplexity = "simple" | "standard" | "complex";
export type SupervisorAmbiguity = "clear" | "clarification_required" | "conflicting";
export type SpecialistOperationalAvailability =
  | "available"
  | "disabled"
  | "limited"
  | "unavailable";
export type SpecialistRegistrationStatus =
  | "approved_disabled"
  | "draft"
  | "paused"
  | "released_disabled"
  | "retired";

export interface SupervisorTaskClassification {
  readonly intents: readonly string[];
  readonly domains: readonly string[];
  readonly requestedOutcomes: readonly string[];
  readonly risk: SupervisorRisk;
  readonly dataSensitivity: SupervisorDataSensitivity;
  readonly urgency: SupervisorUrgency;
  readonly complexity: SupervisorComplexity;
  readonly ambiguity: SupervisorAmbiguity;
}

export interface SupervisorTaskAuthorization {
  readonly authenticated: boolean;
  readonly resourceOwnershipVerified: boolean;
  readonly consentReferences: readonly string[];
  readonly entitlementReferences: readonly string[];
}

export interface SupervisorTaskEnvelope {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly source: SupervisorInvocationSource;
  readonly surface: SupervisorSurface;
  readonly tenantReference: string;
  readonly resourceReferences: readonly string[];
  readonly locale: "en" | "es";
  readonly classification: SupervisorTaskClassification;
  readonly authorization: SupervisorTaskAuthorization;
  readonly createdAt: string;
}

export interface SupervisorM47ManifestBinding {
  readonly manifestReference: string;
  readonly manifest?: AgentManifest;
}

export interface SpecialistRegistration {
  readonly code: string;
  readonly manifestReference: string;
  readonly status: SpecialistRegistrationStatus;
  readonly supportedSurfaces: readonly SupervisorSurface[];
  readonly supportedIntents: readonly string[];
  readonly supportedDomains: readonly string[];
  readonly supportedOutcomes: readonly string[];
  readonly maximumRisk: SupervisorRisk;
  readonly maximumDataSensitivity: SupervisorDataSensitivity;
  readonly locales: readonly ("en" | "es")[];
  readonly jurisdictions: readonly string[];
  readonly requiresAuthentication: boolean;
  readonly requiresVerifiedOwnership: boolean;
  readonly requiresConsent: boolean;
  readonly requiresEntitlement: boolean;
  readonly operationalAvailability: SpecialistOperationalAvailability;
  readonly priority: number;
  readonly createdAt: string;
}

export interface SpecialistCandidate {
  readonly registration: SpecialistRegistration;
  readonly score: number;
  readonly executionEligible: boolean;
  readonly exclusionReasons: readonly SupervisorCandidateExclusionReason[];
}

export type SupervisorCandidateExclusionReason =
  | "authentication_required"
  | "consent_required"
  | "data_sensitivity_exceeded"
  | "domain_not_supported"
  | "entitlement_required"
  | "intent_not_supported"
  | "jurisdiction_not_supported"
  | "locale_not_supported"
  | "outcome_not_supported"
  | "prohibited_outcome"
  | "registration_not_approved"
  | "resource_ownership_not_verified"
  | "risk_exceeded"
  | "specialist_runtime_disabled"
  | "surface_not_supported";

export interface SpecialistCandidateExclusion {
  readonly registrationCode: string;
  readonly reasons: readonly SupervisorCandidateExclusionReason[];
}

export interface SpecialistCandidateEvaluation {
  readonly taskId: string;
  readonly candidates: readonly SpecialistCandidate[];
  readonly exclusions: readonly SpecialistCandidateExclusion[];
  readonly evaluatedAt: string;
}

export type SupervisorDefaultRoute =
  | "clarification_required"
  | "human_escalation"
  | "safe_refusal"
  | "no_action";

export interface SupervisorRoutingPolicy {
  readonly code: string;
  readonly defaultRoute: SupervisorDefaultRoute;
  readonly allowSequentialPlanning: boolean;
  readonly allowParallelPlanning: boolean;
  readonly allowSelfHandling: boolean;
  readonly maxDelegationDepth: number;
  readonly runtimeExecutionEnabled?: boolean;
}

export type SupervisorRoutingDecisionStatus =
  | "clarification_required"
  | "human_escalation"
  | "no_action"
  | "routed"
  | "safe_refusal";

export interface SupervisorRoutingDecision {
  readonly taskId: string;
  readonly policyCode: string;
  readonly status: SupervisorRoutingDecisionStatus;
  readonly selectedSpecialistCode: string | null;
  readonly candidateCodes: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly executionPermitted: boolean;
  readonly createdAt: string;
}

const RISK_RANK: Readonly<Record<SupervisorRisk, number>> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const SENSITIVITY_RANK: Readonly<Record<SupervisorDataSensitivity, number>> = {
  public: 1,
  internal: 2,
  confidential: 3,
  restricted: 4,
};

const PRIVATE_REASONING_PATTERN =
  /chain[-\s]?of[-\s]?thought|hidden reasoning|internal reasoning|private reasoning/i;
const VERSION_REFERENCE_PATTERN = /^[a-z][a-z0-9_-]*:[a-zA-Z0-9._/-]+@\d+$/;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((nestedValue) => {
      deepFreeze(nestedValue);
    });
    Object.freeze(value);
  }
  return value;
}

export function assertSupervisorText(value: string, label: string, maximumLength = 240): void {
  if (value.trim().length === 0 || value.length > maximumLength)
    throw new TypeError(`${label} must be between 1 and ${maximumLength} characters`);
}

export function assertExactVersionReference(value: string, label: string): void {
  assertSupervisorText(value, label, 240);
  if (!VERSION_REFERENCE_PATTERN.test(value))
    throw new TypeError(`${label} must be an exact version reference`);
}

export function assertNoPrivateReasoning(value: string, label: string): void {
  assertSupervisorText(value, label, 2_000);
  if (PRIVATE_REASONING_PATTERN.test(value))
    throw new TypeError(`${label} must not contain private reasoning`);
}

export function isRiskWithinMaximum(value: SupervisorRisk, maximum: SupervisorRisk): boolean {
  return RISK_RANK[value] <= RISK_RANK[maximum];
}

export function isSensitivityWithinMaximum(
  value: SupervisorDataSensitivity,
  maximum: SupervisorDataSensitivity,
): boolean {
  return SENSITIVITY_RANK[value] <= SENSITIVITY_RANK[maximum];
}

function assertIsoDate(value: string, label: string): void {
  assertSupervisorText(value, label, 64);
  if (Number.isNaN(Date.parse(value)))
    throw new TypeError(`${label} must be an ISO-compatible date`);
}

function assertNonEmptyCollection(values: readonly string[], label: string): void {
  if (values.length === 0) throw new TypeError(`${label} must not be empty`);
  values.forEach((value) => {
    assertSupervisorText(value, label);
  });
}

export function createSupervisorTaskEnvelope(
  value: SupervisorTaskEnvelope,
): SupervisorTaskEnvelope {
  assertSupervisorText(value.id, "task id", 160);
  assertSupervisorText(value.idempotencyKey, "task idempotency key", 240);
  assertSupervisorText(value.tenantReference, "task tenant reference", 240);
  assertNonEmptyCollection(value.resourceReferences, "task resource reference");
  assertNonEmptyCollection(value.classification.intents, "task intent");
  assertNonEmptyCollection(value.classification.domains, "task domain");
  assertNonEmptyCollection(value.classification.requestedOutcomes, "task requested outcome");
  value.classification.intents.forEach((intent) => {
    assertNoPrivateReasoning(intent, "task intent");
  });
  value.classification.domains.forEach((domain) => {
    assertNoPrivateReasoning(domain, "task domain");
  });
  value.classification.requestedOutcomes.forEach((outcome) => {
    assertNoPrivateReasoning(outcome, "task requested outcome");
  });
  value.authorization.consentReferences.forEach((reference) => {
    assertExactVersionReference(reference, "task consent reference");
  });
  value.authorization.entitlementReferences.forEach((reference) => {
    assertExactVersionReference(reference, "task entitlement reference");
  });
  assertIsoDate(value.createdAt, "task createdAt");
  return deepFreeze(value);
}

export function createSpecialistRegistration(
  value: SpecialistRegistration,
): SpecialistRegistration {
  assertSupervisorText(value.code, "specialist code", 96);
  assertExactVersionReference(value.manifestReference, "specialist manifest reference");
  assertNonEmptyCollection(value.supportedIntents, "specialist intent");
  assertNonEmptyCollection(value.supportedDomains, "specialist domain");
  assertNonEmptyCollection(value.supportedOutcomes, "specialist outcome");
  assertNonEmptyCollection(value.jurisdictions, "specialist jurisdiction");
  if (!Number.isInteger(value.priority) || value.priority < 0)
    throw new TypeError("specialist priority must be a non-negative integer");
  assertIsoDate(value.createdAt, "specialist createdAt");
  return deepFreeze(value);
}
