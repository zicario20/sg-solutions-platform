/**
 * M073 is a policy and safety control plane. It evaluates no live health and
 * cannot dispatch a target, weaken a hard gate, or alter canonical state.
 */
export const FALLBACK_SYSTEM_MODULE = "M073" as const;

export const FALLBACK_SYSTEM_PERMISSIONS = {
  POLICY_CREATE: "fallback.policy.create",
  POLICY_VERSION_CREATE: "fallback.policy.version.create",
  TARGET_MANAGE: "fallback.target.manage",
  CAPABILITY_MANAGE: "fallback.capability.manage",
  EVALUATION_CREATE: "fallback.evaluation.create",
  DECISION_CREATE: "fallback.decision.create",
  PLAN_CREATE: "fallback.plan.create",
  RECONCILIATION_MANAGE: "fallback.reconciliation.manage",
  DEGRADED_MODE_MANAGE: "fallback.degraded_mode.manage",
} as const;

export type FallbackSystemPermission = (typeof FALLBACK_SYSTEM_PERMISSIONS)[keyof typeof FALLBACK_SYSTEM_PERMISSIONS];

export interface FallbackActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly FallbackSystemPermission[];
}

export interface FallbackRuntimePolicy {
  healthProbes: false;
  targetSwitching: false;
  fallbackDispatch: false;
  circuitBreakerActuation: false;
  failback: false;
  notificationDelivery: false;
}

export const FALLBACK_RUNTIME_POLICY: FallbackRuntimePolicy = Object.freeze({
  healthProbes: false,
  targetSwitching: false,
  fallbackDispatch: false,
  circuitBreakerActuation: false,
  failback: false,
  notificationDelivery: false,
});

export interface FallbackPolicy {
  code: string;
  displayName: string;
  ownerModule: string;
  status: "draft";
  active: false;
  createdBy: string;
}

export interface FallbackPolicyVersion {
  policyCode: string;
  version: string;
  status: "draft";
  immutableAfterApproval: true;
  executable: false;
  createdBy: string;
}

export interface FallbackCapabilityContract {
  code: string;
  ownerModule: string;
  sideEffectClass: "read_only" | "side_effecting";
  status: "draft";
  createdBy: string;
}

export interface FallbackTarget {
  code: string;
  capabilityCode: string;
  targetType: "provider" | "api_adapter" | "n8n_workflow" | "browser_recipe" | "job_queue" | "ai_model" | "manual";
  status: "disabled";
  connectionConfigured: false;
  eligibleForSelection: false;
  createdBy: string;
}

export interface FallbackPrimaryAttemptState {
  operationReference: string;
  targetCode: string;
  outcomeState: "not_started" | "started_no_side_effect" | "side_effect_possible" | "confirmed_failure" | "outcome_unknown" | "blocked";
  reconciliationRequired: boolean;
  createdBy: string;
}

export interface FallbackCandidate {
  code: string;
  targetCode: string;
  operationReference: string;
  hardGatesSatisfied: false;
  selected: false;
  createdBy: string;
}

export interface FallbackDecision {
  decisionCode: string;
  operationReference: string;
  policyVersion: string;
  status: "blocked_runtime_disabled";
  selectedTargetCode: null;
  executionAuthorized: false;
  canonicalStateMutated: false;
  createdBy: string;
}

export interface FallbackPlan {
  planCode: string;
  decisionCode: string;
  executionMode: "manual_only" | "deferred";
  status: "blocked_runtime_disabled";
  dispatched: false;
  createdBy: string;
}

export interface FallbackRuntimeEvaluation {
  evaluationCode: string;
  operationReference: string;
  policyVersion: string;
  status: "blocked_runtime_disabled";
  healthTrusted: false;
  targetSelected: false;
  createdBy: string;
}

export interface FallbackUnknownOutcome {
  operationReference: string;
  status: "reconciliation_required";
  alternateSideEffectBlocked: true;
  createdBy: string;
}

export interface FallbackDegradedMode {
  code: string;
  capabilityCode: string;
  proposedMode: "read_only" | "manual_only" | "defer" | "queue_for_later" | "no_external_writes" | "service_unavailable";
  status: "draft";
  enforced: false;
  createdBy: string;
}

export interface FallbackRuntimeStatus {
  module: typeof FALLBACK_SYSTEM_MODULE;
  state: "provider_disabled";
  policy: FallbackRuntimePolicy;
  workflowAuthority: "M068";
  jobAuthority: "M072";
  approvalAuthority: "M074";
}

export function getFallbackRuntimeStatus(): FallbackRuntimeStatus {
  return { module: FALLBACK_SYSTEM_MODULE, state: "provider_disabled", policy: FALLBACK_RUNTIME_POLICY, workflowAuthority: "M068", jobAuthority: "M072", approvalAuthority: "M074" };
}

export function createFallbackPolicy(actor: FallbackActorContext, input: { code: string; displayName: string; ownerModule: string }): FallbackPolicy {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.POLICY_CREATE);
  assertStableCode(input.code, "fallback policy");
  return { ...input, displayName: requireText(input.displayName, "displayName"), ownerModule: requireText(input.ownerModule, "ownerModule"), status: "draft", active: false, createdBy: actor.actorId };
}

export function createFallbackPolicyVersion(actor: FallbackActorContext, input: { policyCode: string; version: string }): FallbackPolicyVersion {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.POLICY_VERSION_CREATE);
  assertStableCode(input.policyCode, "fallback policy");
  return { ...input, version: requireText(input.version, "version"), status: "draft", immutableAfterApproval: true, executable: false, createdBy: actor.actorId };
}

export function createFallbackCapabilityContract(actor: FallbackActorContext, input: { code: string; ownerModule: string; sideEffectClass: FallbackCapabilityContract["sideEffectClass"] }): FallbackCapabilityContract {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.CAPABILITY_MANAGE);
  assertStableCode(input.code, "fallback capability");
  return { ...input, ownerModule: requireText(input.ownerModule, "ownerModule"), status: "draft", createdBy: actor.actorId };
}

export function createFallbackTarget(actor: FallbackActorContext, input: { code: string; capabilityCode: string; targetType: FallbackTarget["targetType"] }): FallbackTarget {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.TARGET_MANAGE);
  assertStableCode(input.code, "fallback target");
  assertStableCode(input.capabilityCode, "fallback capability");
  return { ...input, status: "disabled", connectionConfigured: false, eligibleForSelection: false, createdBy: actor.actorId };
}

export function recordFallbackPrimaryAttempt(actor: FallbackActorContext, input: Omit<FallbackPrimaryAttemptState, "createdBy">): FallbackPrimaryAttemptState {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.EVALUATION_CREATE);
  assertStableCode(input.targetCode, "fallback target");
  return { ...input, operationReference: requireText(input.operationReference, "operationReference"), createdBy: actor.actorId };
}

export function createFallbackCandidate(actor: FallbackActorContext, input: { code: string; targetCode: string; operationReference: string }): FallbackCandidate {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.EVALUATION_CREATE);
  assertStableCode(input.code, "fallback candidate");
  assertStableCode(input.targetCode, "fallback target");
  return { ...input, operationReference: requireText(input.operationReference, "operationReference"), hardGatesSatisfied: false, selected: false, createdBy: actor.actorId };
}

export function evaluateFallback(actor: FallbackActorContext, input: { evaluationCode: string; operationReference: string; policyVersion: string }): FallbackRuntimeEvaluation {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.EVALUATION_CREATE);
  assertStableCode(input.evaluationCode, "fallback evaluation");
  return { ...input, operationReference: requireText(input.operationReference, "operationReference"), policyVersion: requireText(input.policyVersion, "policyVersion"), status: "blocked_runtime_disabled", healthTrusted: false, targetSelected: false, createdBy: actor.actorId };
}

export function createFallbackDecision(actor: FallbackActorContext, input: { decisionCode: string; operationReference: string; policyVersion: string }): FallbackDecision {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.DECISION_CREATE);
  assertStableCode(input.decisionCode, "fallback decision");
  return { ...input, operationReference: requireText(input.operationReference, "operationReference"), policyVersion: requireText(input.policyVersion, "policyVersion"), status: "blocked_runtime_disabled", selectedTargetCode: null, executionAuthorized: false, canonicalStateMutated: false, createdBy: actor.actorId };
}

export function createFallbackPlan(actor: FallbackActorContext, input: { planCode: string; decisionCode: string; executionMode: FallbackPlan["executionMode"] }): FallbackPlan {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.PLAN_CREATE);
  assertStableCode(input.planCode, "fallback plan");
  assertStableCode(input.decisionCode, "fallback decision");
  return { ...input, status: "blocked_runtime_disabled", dispatched: false, createdBy: actor.actorId };
}

export function recordFallbackUnknownOutcome(actor: FallbackActorContext, input: { operationReference: string }): FallbackUnknownOutcome {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.RECONCILIATION_MANAGE);
  return { operationReference: requireText(input.operationReference, "operationReference"), status: "reconciliation_required", alternateSideEffectBlocked: true, createdBy: actor.actorId };
}

export function createFallbackDegradedMode(actor: FallbackActorContext, input: { code: string; capabilityCode: string; proposedMode: FallbackDegradedMode["proposedMode"] }): FallbackDegradedMode {
  assertPermission(actor, FALLBACK_SYSTEM_PERMISSIONS.DEGRADED_MODE_MANAGE);
  assertStableCode(input.code, "degraded mode");
  assertStableCode(input.capabilityCode, "fallback capability");
  return { ...input, status: "draft", enforced: false, createdBy: actor.actorId };
}

function assertPermission(actor: FallbackActorContext, permission: FallbackSystemPermission): void {
  if (!actor.permissions.includes(permission)) throw new Error(`Missing permission: ${permission}`);
}
function assertStableCode(value: string, label: string): void { if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) throw new Error(`${label} must use a stable uppercase code`); }
function requireText(value: string, label: string): string { if (!value.trim()) throw new Error(`${label} is required`); return value.trim(); }
