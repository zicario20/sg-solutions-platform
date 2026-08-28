export const WORKFLOW_ENGINE_MODULE = "M068";

export type WorkflowDefinitionStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "active"
  | "paused"
  | "deprecated"
  | "retired"
  | "blocked";

export type WorkflowTriggerType =
  | "manual"
  | "domain_event"
  | "api_request"
  | "scheduled"
  | "webhook_normalized_event"
  | "workflow_parent"
  | "admin_action";

export interface WorkflowEngineActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly string[];
  purpose?: string;
}

export interface WorkflowEngineRuntimePolicy {
  scheduler: false;
  jobDispatch: false;
  n8nDispatch: false;
  externalActivities: false;
  signalConsumption: false;
  sideEffectExecution: false;
  timerExecution: false;
}

export const WORKFLOW_ENGINE_RUNTIME_POLICY: WorkflowEngineRuntimePolicy = {
  scheduler: false,
  jobDispatch: false,
  n8nDispatch: false,
  externalActivities: false,
  signalConsumption: false,
  sideEffectExecution: false,
  timerExecution: false,
};

export interface WorkflowDefinitionInput {
  id: string;
  workflowCode: string;
  displayName: string;
  purpose: string;
  domainScope: string;
  triggerTypes: readonly WorkflowTriggerType[];
}

export interface WorkflowDefinition extends WorkflowDefinitionInput {
  status: "draft";
  activeForNewInstances: false;
  createdBy: string;
}

export interface WorkflowStepDefinition {
  stepCode: string;
  stepType:
    | "activity"
    | "decision"
    | "wait"
    | "timer"
    | "signal_wait"
    | "human_task"
    | "approval"
    | "child_workflow"
    | "parallel_gateway"
    | "join_gateway"
    | "end";
}

export interface WorkflowTransitionDefinition {
  fromStepCode: string;
  toStepCode: string;
  transitionType: "success" | "failure" | "timeout" | "cancel" | "signal" | "manual" | "compensation";
}

export interface WorkflowDefinitionVersionInput {
  id: string;
  workflowDefinitionId: string;
  version: string;
  contentHash: string;
  steps: readonly WorkflowStepDefinition[];
  transitions: readonly WorkflowTransitionDefinition[];
}

export interface WorkflowDefinitionVersion extends WorkflowDefinitionVersionInput {
  status: "draft";
  immutable: true;
  executable: false;
  createdBy: string;
}

export interface WorkflowStartRequestInput {
  id: string;
  workflowCode: string;
  definitionVersionId: string;
  definitionStatus: WorkflowDefinitionStatus;
  triggerType: WorkflowTriggerType;
  subjectReferences: readonly string[];
  inputSnapshotReference: string;
  idempotencyKey: string;
}

export interface WorkflowStartRequest extends WorkflowStartRequestInput {
  status: "blocked_runtime_disabled";
  instanceCreated: false;
  blockingReasons: readonly string[];
}

export interface WorkflowWaitState {
  id: string;
  workflowInstanceId: string;
  stepExecutionId: string;
  waitType: "timer" | "external_signal" | "domain_event" | "human_action" | "approval_result" | "child_workflow" | "provider_callback";
  waitKey: string;
  expectedSignalTypes: readonly string[];
  status: "registered_not_scheduled";
  durableExecutionActive: false;
}

export interface WorkflowSignalInput {
  id: string;
  tenantId: string;
  signalType: string;
  correlationStatus: "matched" | "ambiguous" | "unmatched";
  verificationStatus: "verified" | "unverified";
  idempotencyKey: string;
  duplicate: boolean;
}

export interface WorkflowSignalDecision {
  signalId: string;
  accepted: false;
  reason:
    | "signal_unverified"
    | "tenant_mismatch"
    | "correlation_ambiguous"
    | "correlation_unmatched"
    | "duplicate_signal"
    | "runtime_disabled";
  stateAdvanced: false;
}

export interface WorkflowSideEffectPlan {
  id: string;
  workflowInstanceId: string;
  stepExecutionId: string;
  effectType:
    | "none"
    | "internal_reversible"
    | "internal_irreversible"
    | "external_idempotent"
    | "external_reconcilable"
    | "external_irreversible"
    | "high_impact";
  targetSystem: string;
  idempotencyKey: string;
  outcome: "not_started";
  dispatchAllowed: false;
  requiresReconciliationBeforeRetry: true;
}

export interface WorkflowOutboxRecord {
  id: string;
  workflowInstanceId: string;
  eventType: string;
  correlationId: string;
  status: "pending_runtime_disabled";
  published: false;
}

function assertPermission(actor: WorkflowEngineActorContext, permission: string): void {
  if (!actor.actorId || !actor.tenantId || !actor.permissions.includes(permission)) {
    throw new Error("Workflow engine action is not authorized.");
  }
}

function assertStableCode(value: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error("workflowCode must be a stable uppercase code.");
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

export function isWorkflowEngineRuntimeEnabled(): false {
  return false;
}

export function createWorkflowDefinition(
  actor: WorkflowEngineActorContext,
  input: WorkflowDefinitionInput,
): WorkflowDefinition {
  assertPermission(actor, "workflow.definition.create");
  assertStableCode(input.workflowCode);
  return {
    ...input,
    triggerTypes: unique(input.triggerTypes) as readonly WorkflowTriggerType[],
    status: "draft",
    activeForNewInstances: false,
    createdBy: actor.actorId,
  };
}

export function createWorkflowDefinitionVersion(
  actor: WorkflowEngineActorContext,
  input: WorkflowDefinitionVersionInput,
): WorkflowDefinitionVersion {
  assertPermission(actor, "workflow.definition.version.create");
  if (!input.contentHash) throw new Error("Workflow definition version requires a content hash.");
  return {
    ...input,
    steps: input.steps.map((step) => ({ ...step })),
    transitions: input.transitions.map((transition) => ({ ...transition })),
    status: "draft",
    immutable: true,
    executable: false,
    createdBy: actor.actorId,
  };
}

export function createWorkflowStartRequest(
  actor: WorkflowEngineActorContext,
  input: WorkflowStartRequestInput,
): WorkflowStartRequest {
  assertPermission(actor, "workflow.instance.start");
  const blockingReasons = [
    input.definitionStatus !== "active" && "workflow_definition_not_active",
    !input.idempotencyKey && "idempotency_key_missing",
    !input.subjectReferences.length && "workflow_subject_missing",
    "runtime_disabled",
  ].filter(Boolean) as string[];
  return {
    ...input,
    subjectReferences: unique(input.subjectReferences),
    status: "blocked_runtime_disabled",
    instanceCreated: false,
    blockingReasons: unique(blockingReasons),
  };
}

export function createWorkflowWaitState(
  actor: WorkflowEngineActorContext,
  input: Omit<WorkflowWaitState, "status" | "durableExecutionActive">,
): WorkflowWaitState {
  assertPermission(actor, "workflow.wait.register");
  return {
    ...input,
    expectedSignalTypes: unique(input.expectedSignalTypes),
    status: "registered_not_scheduled",
    durableExecutionActive: false,
  };
}

export function evaluateWorkflowSignal(
  actor: WorkflowEngineActorContext,
  input: WorkflowSignalInput,
): WorkflowSignalDecision {
  assertPermission(actor, "workflow.signal.consume");
  let reason: WorkflowSignalDecision["reason"] = "runtime_disabled";
  if (input.verificationStatus !== "verified") reason = "signal_unverified";
  else if (input.tenantId !== actor.tenantId) reason = "tenant_mismatch";
  else if (input.correlationStatus === "ambiguous") reason = "correlation_ambiguous";
  else if (input.correlationStatus === "unmatched") reason = "correlation_unmatched";
  else if (input.duplicate) reason = "duplicate_signal";
  return { signalId: input.id, accepted: false, reason, stateAdvanced: false };
}

export function createWorkflowSideEffectPlan(
  actor: WorkflowEngineActorContext,
  input: Omit<WorkflowSideEffectPlan, "outcome" | "dispatchAllowed" | "requiresReconciliationBeforeRetry">,
): WorkflowSideEffectPlan {
  assertPermission(actor, "workflow.side_effect.plan");
  return {
    ...input,
    outcome: "not_started",
    dispatchAllowed: false,
    requiresReconciliationBeforeRetry: true,
  };
}

export function createWorkflowOutboxRecord(
  actor: WorkflowEngineActorContext,
  input: Omit<WorkflowOutboxRecord, "status" | "published">,
): WorkflowOutboxRecord {
  assertPermission(actor, "workflow.outbox.create");
  return { ...input, status: "pending_runtime_disabled", published: false };
}

export function getWorkflowEngineRuntimeStatus(): {
  module: typeof WORKFLOW_ENGINE_MODULE;
  enabled: false;
  policy: WorkflowEngineRuntimePolicy;
} {
  return { module: WORKFLOW_ENGINE_MODULE, enabled: false, policy: WORKFLOW_ENGINE_RUNTIME_POLICY };
}
