export const HUMAN_IN_THE_LOOP_MODULE = "M075" as const;

export const HUMAN_TASK_PERMISSIONS = [
  "human_task.definition.create",
  "human_task.version.create",
  "human_task.request.create",
  "human_task.work_item.create",
  "human_task.eligibility.evaluate",
  "human_task.result.submit",
  "human_task.handback.request",
] as const;

export type HumanTaskPermission = (typeof HUMAN_TASK_PERMISSIONS)[number];

export const HUMAN_IN_THE_LOOP_RUNTIME = {
  taskActivation: false,
  assignmentDispatch: false,
  humanCompletionAuthority: false,
  notificationDelivery: false,
  ownerResultConsumption: false,
  browserHandoff: false,
} as const;

export type HumanTaskActorKind = "human" | "ai" | "service" | "system" | "unknown";
export type HumanTaskAllowedAction = "review" | "propose_correction" | "classify" | "complete_checklist";
export type HumanTaskStatus = "draft" | "created" | "unassigned" | "blocked_runtime_disabled";

export interface HumanTaskDefinition {
  readonly module: typeof HUMAN_IN_THE_LOOP_MODULE;
  readonly code: string;
  readonly name: string;
  readonly status: "draft";
  readonly active: false;
}

export interface HumanTaskDefinitionVersion {
  readonly definitionCode: string;
  readonly version: number;
  readonly status: "draft";
  readonly immutable: true;
  readonly runtimeEnabled: false;
}

export interface HumanTaskScope {
  readonly allowedActions: readonly HumanTaskAllowedAction[];
  readonly prohibitedActions: readonly [
    "approve",
    "submit_external",
    "change_canonical_state",
    "grant_entitlement",
  ];
}

export interface HumanTaskContextSnapshot {
  readonly snapshotReference: string;
  readonly allowedResourceReferences: readonly string[];
  readonly minimized: true;
  readonly containsRawSecrets: false;
  readonly containsBroadPii: false;
  readonly containsPrivateReasoning: false;
}

export interface HumanTaskRequest {
  readonly requestId: string;
  readonly definitionVersion: HumanTaskDefinitionVersion;
  readonly scope: HumanTaskScope;
  readonly contextSnapshot: HumanTaskContextSnapshot;
  readonly status: "created";
  readonly approvalGranted: false;
  readonly workflowCompleted: false;
  readonly canonicalMutationApplied: false;
  readonly runtimeEnabled: false;
}

export interface HumanWorkItem {
  readonly workItemId: string;
  readonly requestId: string;
  readonly status: "unassigned";
  readonly assignedReviewerId: null;
  readonly notificationSent: false;
  readonly runtimeEnabled: false;
}

export interface ReviewerEligibilityResult {
  readonly reviewerId: string;
  readonly status: "not_eligible" | "indeterminate";
  readonly eligible: false;
  readonly reason: "ai_cannot_act_as_human_reviewer" | "runtime_policy_not_evaluated";
}

export interface HumanTaskResult {
  readonly requestId: string;
  readonly submittedBy: string;
  readonly status: "blocked_runtime_disabled";
  readonly disposition: "requires_owner_validation";
  readonly canonicalMutationApplied: false;
  readonly approvalGranted: false;
  readonly workflowCompleted: false;
}

export interface HumanTaskHandback {
  readonly requestId: string;
  readonly status: "blocked_runtime_disabled";
  readonly ownerValidationRequired: true;
  readonly externalActionExecuted: false;
}

export interface HumanTaskContextSnapshotInput {
  readonly snapshotReference: string;
  readonly allowedResourceReferences: readonly string[];
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
  readonly includesPrivateReasoning?: boolean;
}

export interface HumanTaskActor {
  readonly id: string;
  readonly kind: HumanTaskActorKind;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: HumanTaskPermission): void {
  if (!HUMAN_TASK_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported human-task permission: ${permission}.`);
  }
}

export function createHumanTaskDefinition(input: {
  readonly permission: HumanTaskPermission;
  readonly code: string;
  readonly name: string;
}): HumanTaskDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Human task definition code");
  requireIdentifier(input.name, "Human task definition name");

  return {
    module: HUMAN_IN_THE_LOOP_MODULE,
    code: input.code,
    name: input.name,
    status: "draft",
    active: false,
  };
}

export function createHumanTaskDefinitionVersion(input: {
  readonly permission: HumanTaskPermission;
  readonly definition: HumanTaskDefinition;
  readonly version: number;
}): HumanTaskDefinitionVersion {
  requirePermission(input.permission);
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new Error("Human task definition version must be a positive integer.");
  }

  return {
    definitionCode: input.definition.code,
    version: input.version,
    status: "draft",
    immutable: true,
    runtimeEnabled: false,
  };
}

export function createHumanTaskScope(
  allowedActions: readonly HumanTaskAllowedAction[],
): HumanTaskScope {
  if (allowedActions.length === 0) {
    throw new Error("A human task scope requires at least one bounded action.");
  }

  return {
    allowedActions: [...new Set(allowedActions)],
    prohibitedActions: ["approve", "submit_external", "change_canonical_state", "grant_entitlement"],
  };
}

export function createHumanTaskContextSnapshot(
  input: HumanTaskContextSnapshotInput,
): HumanTaskContextSnapshot {
  requireIdentifier(input.snapshotReference, "Context snapshot reference");
  if (input.allowedResourceReferences.length === 0) {
    throw new Error("A human task context must contain minimized resource references.");
  }
  if (input.includesRawSecret || input.includesBroadPii || input.includesPrivateReasoning) {
    throw new Error("Human task context cannot include raw secrets, broad PII, or private reasoning.");
  }

  return {
    snapshotReference: input.snapshotReference,
    allowedResourceReferences: [...input.allowedResourceReferences],
    minimized: true,
    containsRawSecrets: false,
    containsBroadPii: false,
    containsPrivateReasoning: false,
  };
}

export function createHumanTaskRequest(input: {
  readonly permission: HumanTaskPermission;
  readonly requestId: string;
  readonly definitionVersion: HumanTaskDefinitionVersion;
  readonly scope: HumanTaskScope;
  readonly contextSnapshot: HumanTaskContextSnapshot;
}): HumanTaskRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Human task request ID");

  return {
    requestId: input.requestId,
    definitionVersion: input.definitionVersion,
    scope: input.scope,
    contextSnapshot: input.contextSnapshot,
    status: "created",
    approvalGranted: false,
    workflowCompleted: false,
    canonicalMutationApplied: false,
    runtimeEnabled: false,
  };
}

export function createHumanWorkItem(input: {
  readonly permission: HumanTaskPermission;
  readonly workItemId: string;
  readonly request: HumanTaskRequest;
}): HumanWorkItem {
  requirePermission(input.permission);
  requireIdentifier(input.workItemId, "Human work item ID");

  return {
    workItemId: input.workItemId,
    requestId: input.request.requestId,
    status: "unassigned",
    assignedReviewerId: null,
    notificationSent: false,
    runtimeEnabled: false,
  };
}

export function evaluateReviewerEligibility(input: {
  readonly permission: HumanTaskPermission;
  readonly reviewer: HumanTaskActor;
}): ReviewerEligibilityResult {
  requirePermission(input.permission);
  requireIdentifier(input.reviewer.id, "Reviewer ID");

  if (input.reviewer.kind === "ai") {
    return {
      reviewerId: input.reviewer.id,
      status: "not_eligible",
      eligible: false,
      reason: "ai_cannot_act_as_human_reviewer",
    };
  }

  return {
    reviewerId: input.reviewer.id,
    status: "indeterminate",
    eligible: false,
    reason: "runtime_policy_not_evaluated",
  };
}

export function submitHumanTaskResult(input: {
  readonly permission: HumanTaskPermission;
  readonly request: HumanTaskRequest;
  readonly actor: HumanTaskActor;
}): HumanTaskResult {
  requirePermission(input.permission);
  if (input.actor.kind !== "human") {
    throw new Error("Only an authenticated human may submit a human-task result.");
  }

  return {
    requestId: input.request.requestId,
    submittedBy: input.actor.id,
    status: "blocked_runtime_disabled",
    disposition: "requires_owner_validation",
    canonicalMutationApplied: false,
    approvalGranted: false,
    workflowCompleted: false,
  };
}

export function requestHumanTaskHandback(input: {
  readonly permission: HumanTaskPermission;
  readonly request: HumanTaskRequest;
}): HumanTaskHandback {
  requirePermission(input.permission);

  return {
    requestId: input.request.requestId,
    status: "blocked_runtime_disabled",
    ownerValidationRequired: true,
    externalActionExecuted: false,
  };
}
