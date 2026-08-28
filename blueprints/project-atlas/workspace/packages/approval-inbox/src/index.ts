/**
 * M074 is the canonical record of explicit human approval decisions. Approval
 * remains a scoped condition; M068 and the owner module must revalidate before execution.
 */
export const APPROVAL_INBOX_MODULE = "M074" as const;

export const APPROVAL_INBOX_PERMISSIONS = {
  POLICY_CREATE: "approval.policy.create",
  POLICY_VERSION_CREATE: "approval.policy.version.create",
  REQUEST_CREATE: "approval.request.create",
  WORK_ITEM_CREATE: "approval.work_item.create",
  ELIGIBILITY_EVALUATE: "approval.eligibility.evaluate",
  DECISION_SUBMIT: "approval.decision.submit",
  CONSUMPTION_REQUEST: "approval.consumption.request",
  REVOCATION_CREATE: "approval.revocation.create",
} as const;

export type ApprovalInboxPermission = (typeof APPROVAL_INBOX_PERMISSIONS)[keyof typeof APPROVAL_INBOX_PERMISSIONS];

export interface ApprovalActorContext {
  actorId: string;
  tenantId: string;
  actorKind: "human" | "service" | "ai";
  permissions: readonly ApprovalInboxPermission[];
}

export interface ApprovalInboxRuntimePolicy {
  policyActivation: false;
  notificationDelivery: false;
  decisionAuthority: false;
  workflowConsumption: false;
  bulkApproval: false;
}

export const APPROVAL_INBOX_RUNTIME_POLICY: ApprovalInboxRuntimePolicy = Object.freeze({
  policyActivation: false,
  notificationDelivery: false,
  decisionAuthority: false,
  workflowConsumption: false,
  bulkApproval: false,
});

export interface ApprovalPolicy {
  code: string;
  displayName: string;
  ownerModule: string;
  riskClass: "low" | "medium" | "high" | "critical";
  status: "draft";
  active: false;
  createdBy: string;
}

export interface ApprovalPolicyVersion {
  policyCode: string;
  version: string;
  status: "draft";
  immutableAfterApproval: true;
  activationEnabled: false;
  createdBy: string;
}

export interface ApprovalScope {
  scopeCode: string;
  ownerModule: string;
  operationCode: string;
  resourceReference: string;
  purpose: string;
  singleUse: true;
  createdBy: string;
}

export interface ApprovalContextSnapshot {
  snapshotCode: string;
  materialInputsHash: string;
  resourceVersion: string;
  evidenceReferences: readonly string[];
  containsRawSecret: false;
  containsBroadPii: false;
  containsPrivateReasoning: false;
  createdBy: string;
}

export interface ApprovalRequest {
  requestCode: string;
  policyCode: string;
  policyVersion: string;
  scopeCode: string;
  contextSnapshotCode: string;
  requesterActorId: string;
  status: "created";
  actionExecuted: false;
  createdBy: string;
}

export interface ApprovalWorkItem {
  workItemCode: string;
  requestCode: string;
  assignedToReference: null;
  status: "unassigned";
  notificationSent: false;
  createdBy: string;
}

export interface ApproverEligibilityResult {
  requestCode: string;
  approverActorId: string;
  status: "not_eligible" | "indeterminate";
  eligible: false;
  separationOfDutiesPassed: false;
  revalidationRequired: true;
}

export interface ApprovalDecision {
  decisionCode: string;
  requestCode: string;
  workItemCode: string;
  outcome: "approved" | "rejected" | "changes_requested" | "abstained" | "unable_to_decide";
  status: "blocked_runtime_disabled";
  validForExecution: false;
  actionExecuted: false;
  createdBy: string;
}

export interface ApprovalConsumptionRecord {
  requestCode: string;
  decisionCode: string;
  operationIdentity: string;
  status: "blocked_runtime_disabled";
  consumed: false;
  actionSucceeded: false;
  createdBy: string;
}

export interface ApprovalRevocation {
  revocationCode: string;
  decisionCode: string;
  reasonCode: string;
  status: "draft";
  reversesExecutedAction: false;
  createdBy: string;
}

export interface ApprovalInboxRuntimeStatus {
  module: typeof APPROVAL_INBOX_MODULE;
  state: "provider_disabled";
  policy: ApprovalInboxRuntimePolicy;
  workflowAuthority: "M068";
  fallbackAuthority: "M073";
}

export function getApprovalInboxRuntimeStatus(): ApprovalInboxRuntimeStatus {
  return { module: APPROVAL_INBOX_MODULE, state: "provider_disabled", policy: APPROVAL_INBOX_RUNTIME_POLICY, workflowAuthority: "M068", fallbackAuthority: "M073" };
}

export function createApprovalPolicy(actor: ApprovalActorContext, input: Omit<ApprovalPolicy, "status" | "active" | "createdBy">): ApprovalPolicy {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.POLICY_CREATE);
  assertHumanOrService(actor);
  assertStableCode(input.code, "approval policy");
  return { ...input, displayName: requireText(input.displayName, "displayName"), ownerModule: requireText(input.ownerModule, "ownerModule"), status: "draft", active: false, createdBy: actor.actorId };
}

export function createApprovalPolicyVersion(actor: ApprovalActorContext, input: { policyCode: string; version: string }): ApprovalPolicyVersion {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.POLICY_VERSION_CREATE);
  assertHumanOrService(actor);
  assertStableCode(input.policyCode, "approval policy");
  return { ...input, version: requireText(input.version, "version"), status: "draft", immutableAfterApproval: true, activationEnabled: false, createdBy: actor.actorId };
}

export function createApprovalScope(actor: ApprovalActorContext, input: Omit<ApprovalScope, "singleUse" | "createdBy">): ApprovalScope {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.REQUEST_CREATE);
  assertStableCode(input.scopeCode, "approval scope");
  assertStableCode(input.operationCode, "approval operation");
  return { ...input, ownerModule: requireText(input.ownerModule, "ownerModule"), resourceReference: requireText(input.resourceReference, "resourceReference"), purpose: requireText(input.purpose, "purpose"), singleUse: true, createdBy: actor.actorId };
}

export function createApprovalContextSnapshot(actor: ApprovalActorContext, input: { snapshotCode: string; materialInputsHash: string; resourceVersion: string; evidenceReferences: readonly string[]; containsRawSecret?: boolean; containsBroadPii?: boolean; containsPrivateReasoning?: boolean }): ApprovalContextSnapshot {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.REQUEST_CREATE);
  assertStableCode(input.snapshotCode, "approval context snapshot");
  if (input.containsRawSecret || input.containsBroadPii || input.containsPrivateReasoning) throw new Error("Approval context must be minimum-necessary and may not contain secrets, broad PII, or private reasoning");
  return { snapshotCode: input.snapshotCode, materialInputsHash: requireText(input.materialInputsHash, "materialInputsHash"), resourceVersion: requireText(input.resourceVersion, "resourceVersion"), evidenceReferences: input.evidenceReferences.map((reference) => requireText(reference, "evidenceReference")), containsRawSecret: false, containsBroadPii: false, containsPrivateReasoning: false, createdBy: actor.actorId };
}

export function createApprovalRequest(actor: ApprovalActorContext, input: Omit<ApprovalRequest, "status" | "actionExecuted" | "createdBy">): ApprovalRequest {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.REQUEST_CREATE);
  assertStableCode(input.requestCode, "approval request");
  assertStableCode(input.policyCode, "approval policy");
  assertStableCode(input.scopeCode, "approval scope");
  assertStableCode(input.contextSnapshotCode, "approval context snapshot");
  return { ...input, policyVersion: requireText(input.policyVersion, "policyVersion"), requesterActorId: requireText(input.requesterActorId, "requesterActorId"), status: "created", actionExecuted: false, createdBy: actor.actorId };
}

export function createApprovalWorkItem(actor: ApprovalActorContext, input: { workItemCode: string; requestCode: string }): ApprovalWorkItem {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.WORK_ITEM_CREATE);
  assertStableCode(input.workItemCode, "approval work item");
  assertStableCode(input.requestCode, "approval request");
  return { ...input, assignedToReference: null, status: "unassigned", notificationSent: false, createdBy: actor.actorId };
}

export function evaluateApproverEligibility(actor: ApprovalActorContext, request: ApprovalRequest, approverActorId: string): ApproverEligibilityResult {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.ELIGIBILITY_EVALUATE);
  const isRequester = request.requesterActorId === approverActorId;
  return { requestCode: request.requestCode, approverActorId: requireText(approverActorId, "approverActorId"), status: isRequester ? "not_eligible" : "indeterminate", eligible: false, separationOfDutiesPassed: false, revalidationRequired: true };
}

export function submitApprovalDecision(actor: ApprovalActorContext, input: { decisionCode: string; requestCode: string; workItemCode: string; outcome: ApprovalDecision["outcome"] }): ApprovalDecision {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.DECISION_SUBMIT);
  if (actor.actorKind !== "human") throw new Error("Only an authenticated human can submit an approval decision");
  assertStableCode(input.decisionCode, "approval decision");
  assertStableCode(input.requestCode, "approval request");
  assertStableCode(input.workItemCode, "approval work item");
  return { ...input, status: "blocked_runtime_disabled", validForExecution: false, actionExecuted: false, createdBy: actor.actorId };
}

export function requestApprovalConsumption(actor: ApprovalActorContext, input: { requestCode: string; decisionCode: string; operationIdentity: string }): ApprovalConsumptionRecord {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.CONSUMPTION_REQUEST);
  assertStableCode(input.requestCode, "approval request");
  assertStableCode(input.decisionCode, "approval decision");
  return { ...input, operationIdentity: requireText(input.operationIdentity, "operationIdentity"), status: "blocked_runtime_disabled", consumed: false, actionSucceeded: false, createdBy: actor.actorId };
}

export function createApprovalRevocation(actor: ApprovalActorContext, input: { revocationCode: string; decisionCode: string; reasonCode: string }): ApprovalRevocation {
  assertPermission(actor, APPROVAL_INBOX_PERMISSIONS.REVOCATION_CREATE);
  assertHumanOrService(actor);
  assertStableCode(input.revocationCode, "approval revocation");
  assertStableCode(input.decisionCode, "approval decision");
  assertStableCode(input.reasonCode, "revocation reason");
  return { ...input, status: "draft", reversesExecutedAction: false, createdBy: actor.actorId };
}

function assertPermission(actor: ApprovalActorContext, permission: ApprovalInboxPermission): void { if (!actor.permissions.includes(permission)) throw new Error(`Missing permission: ${permission}`); }
function assertHumanOrService(actor: ApprovalActorContext): void { if (actor.actorKind === "ai") throw new Error("AI may not create, activate, revoke, or decide approvals"); }
function assertStableCode(value: string, label: string): void { if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) throw new Error(`${label} must use a stable uppercase code`); }
function requireText(value: string, label: string): string { if (!value.trim()) throw new Error(`${label} is required`); return value.trim(); }
