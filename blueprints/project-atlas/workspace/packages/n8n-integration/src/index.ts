/**
 * M069: n8n is an optional integration adapter. It is never the canonical
 * workflow engine or business-state store.
 */
export const N8N_INTEGRATION_MODULE = "M069" as const;

export const N8N_PERMISSIONS = {
  INSTANCE_MANAGE: "n8n.instance.manage",
  WORKFLOW_CREATE: "n8n.workflow.create",
  WORKFLOW_VERSION_CREATE: "n8n.workflow.version.create",
  BINDING_MANAGE: "n8n.binding.manage",
  EXECUTION_REQUEST: "n8n.execution.request",
  WEBHOOK_RECEIVE: "n8n.webhook.receive",
  CREDENTIAL_REFERENCE_MANAGE: "n8n.credential_reference.manage",
} as const;

export type N8nPermission = (typeof N8N_PERMISSIONS)[keyof typeof N8N_PERMISSIONS];

export interface N8nActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly N8nPermission[];
}

export interface N8nRuntimePolicy {
  instanceConnection: false;
  workflowActivation: false;
  executionDispatch: false;
  webhookAcceptance: false;
  callbackDelivery: false;
  credentialInjection: false;
  backgroundJobs: false;
}

export const N8N_RUNTIME_POLICY: N8nRuntimePolicy = Object.freeze({
  instanceConnection: false,
  workflowActivation: false,
  executionDispatch: false,
  webhookAcceptance: false,
  callbackDelivery: false,
  credentialInjection: false,
  backgroundJobs: false,
});

export interface N8nInstanceProfile {
  code: string;
  displayName: string;
  status: "disabled";
  credentialsConfigured: false;
  connectionTested: false;
  createdBy: string;
}

export interface N8nWorkflowReference {
  code: string;
  instanceProfileCode: string;
  activityCode: string;
  status: "draft";
  active: false;
  canonicalStateAuthority: false;
  createdBy: string;
}

export interface N8nWorkflowVersionReference {
  workflowCode: string;
  version: string;
  status: "draft";
  immutableAfterApproval: true;
  verifiedAgainstInstance: false;
  createdBy: string;
}

export interface N8nActivityBinding {
  code: string;
  workflowCode: string;
  workflowVersion: string;
  domainActivityCode: string;
  status: "draft";
  externalWriteAllowed: false;
  canonicalTransitionAllowed: false;
  createdBy: string;
}

export interface N8nCredentialReference {
  code: string;
  purpose: string;
  secretReferenceName: string;
  status: "reference_only";
  secretValueStored: false;
  secretInjected: false;
  createdBy: string;
}

export interface N8nExecutionRequest {
  requestCode: string;
  workflowCode: string;
  workflowVersion: string;
  idempotencyKey: string;
  inputContractCode: string;
  status: "blocked_runtime_disabled";
  dispatched: false;
  externalExecutionReference: null;
  canonicalStateMutated: false;
  createdBy: string;
}

export interface N8nWebhookCandidate {
  eventReference: string;
  workflowCode: string;
  idempotencyKey: string;
  verificationStatus: "unverified";
  accepted: false;
  callbackDelivered: false;
  canonicalStateMutated: false;
}

export interface N8nRuntimeStatus {
  module: typeof N8N_INTEGRATION_MODULE;
  state: "provider_disabled";
  policy: N8nRuntimePolicy;
  canonicalWorkflowAuthority: "M068";
  businessStateAuthority: "domain services and PostgreSQL";
}

export function getN8nRuntimeStatus(): N8nRuntimeStatus {
  return {
    module: N8N_INTEGRATION_MODULE,
    state: "provider_disabled",
    policy: N8N_RUNTIME_POLICY,
    canonicalWorkflowAuthority: "M068",
    businessStateAuthority: "domain services and PostgreSQL",
  };
}

export function createN8nInstanceProfile(
  actor: N8nActorContext,
  input: { code: string; displayName: string },
): N8nInstanceProfile {
  assertPermission(actor, N8N_PERMISSIONS.INSTANCE_MANAGE);
  assertStableCode(input.code, "n8n instance profile");

  return {
    code: input.code,
    displayName: requireText(input.displayName, "displayName"),
    status: "disabled",
    credentialsConfigured: false,
    connectionTested: false,
    createdBy: actor.actorId,
  };
}

export function createN8nWorkflowReference(
  actor: N8nActorContext,
  input: { code: string; instanceProfileCode: string; activityCode: string },
): N8nWorkflowReference {
  assertPermission(actor, N8N_PERMISSIONS.WORKFLOW_CREATE);
  assertStableCode(input.code, "n8n workflow");
  assertStableCode(input.instanceProfileCode, "instance profile");
  assertStableCode(input.activityCode, "domain activity");

  return {
    code: input.code,
    instanceProfileCode: input.instanceProfileCode,
    activityCode: input.activityCode,
    status: "draft",
    active: false,
    canonicalStateAuthority: false,
    createdBy: actor.actorId,
  };
}

export function createN8nWorkflowVersionReference(
  actor: N8nActorContext,
  input: { workflowCode: string; version: string },
): N8nWorkflowVersionReference {
  assertPermission(actor, N8N_PERMISSIONS.WORKFLOW_VERSION_CREATE);
  assertStableCode(input.workflowCode, "n8n workflow");

  return {
    workflowCode: input.workflowCode,
    version: requireText(input.version, "version"),
    status: "draft",
    immutableAfterApproval: true,
    verifiedAgainstInstance: false,
    createdBy: actor.actorId,
  };
}

export function createN8nActivityBinding(
  actor: N8nActorContext,
  input: { code: string; workflowCode: string; workflowVersion: string; domainActivityCode: string },
): N8nActivityBinding {
  assertPermission(actor, N8N_PERMISSIONS.BINDING_MANAGE);
  assertStableCode(input.code, "n8n activity binding");
  assertStableCode(input.workflowCode, "n8n workflow");
  assertStableCode(input.domainActivityCode, "domain activity");

  return {
    code: input.code,
    workflowCode: input.workflowCode,
    workflowVersion: requireText(input.workflowVersion, "workflowVersion"),
    domainActivityCode: input.domainActivityCode,
    status: "draft",
    externalWriteAllowed: false,
    canonicalTransitionAllowed: false,
    createdBy: actor.actorId,
  };
}

export function createN8nCredentialReference(
  actor: N8nActorContext,
  input: { code: string; purpose: string; secretReferenceName: string },
): N8nCredentialReference {
  assertPermission(actor, N8N_PERMISSIONS.CREDENTIAL_REFERENCE_MANAGE);
  assertStableCode(input.code, "n8n credential reference");

  return {
    code: input.code,
    purpose: requireText(input.purpose, "purpose"),
    secretReferenceName: requireText(input.secretReferenceName, "secretReferenceName"),
    status: "reference_only",
    secretValueStored: false,
    secretInjected: false,
    createdBy: actor.actorId,
  };
}

export function requestN8nExecution(
  actor: N8nActorContext,
  input: {
    requestCode: string;
    workflowCode: string;
    workflowVersion: string;
    idempotencyKey: string;
    inputContractCode: string;
  },
): N8nExecutionRequest {
  assertPermission(actor, N8N_PERMISSIONS.EXECUTION_REQUEST);
  assertStableCode(input.requestCode, "n8n execution request");
  assertStableCode(input.workflowCode, "n8n workflow");
  assertStableCode(input.inputContractCode, "n8n input contract");

  return {
    requestCode: input.requestCode,
    workflowCode: input.workflowCode,
    workflowVersion: requireText(input.workflowVersion, "workflowVersion"),
    idempotencyKey: requireText(input.idempotencyKey, "idempotencyKey"),
    inputContractCode: input.inputContractCode,
    status: "blocked_runtime_disabled",
    dispatched: false,
    externalExecutionReference: null,
    canonicalStateMutated: false,
    createdBy: actor.actorId,
  };
}

export function recordUnverifiedN8nWebhookCandidate(
  input: { eventReference: string; workflowCode: string; idempotencyKey: string },
): N8nWebhookCandidate {
  assertStableCode(input.workflowCode, "n8n workflow");

  return {
    eventReference: requireText(input.eventReference, "eventReference"),
    workflowCode: input.workflowCode,
    idempotencyKey: requireText(input.idempotencyKey, "idempotencyKey"),
    verificationStatus: "unverified",
    accepted: false,
    callbackDelivered: false,
    canonicalStateMutated: false,
  };
}

function assertPermission(actor: N8nActorContext, permission: N8nPermission): void {
  if (!actor.permissions.includes(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}

function assertStableCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error(`${label} must use a stable uppercase code`);
  }
}

function requireText(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}
