/**
 * M072 is generic asynchronous infrastructure. It records versioned job intent
 * and recovery controls; it does not execute handlers or own business outcomes.
 */
export const JOB_QUEUE_MODULE = "M072" as const;

export const JOB_QUEUE_PERMISSIONS = {
  CONFIGURATION_MANAGE: "job_queue.configuration.manage",
  DEFINITION_CREATE: "job_queue.definition.create",
  VERSION_CREATE: "job_queue.version.create",
  PAYLOAD_CONTRACT_MANAGE: "job_queue.payload_contract.manage",
  REQUEST_CREATE: "job_queue.request.create",
  QUEUE_MANAGE: "job_queue.queue.manage",
  WORKER_MANAGE: "job_queue.worker.manage",
  RETRY_MANAGE: "job_queue.retry.manage",
  RECONCILIATION_MANAGE: "job_queue.reconciliation.manage",
  DEAD_LETTER_MANAGE: "job_queue.dead_letter.manage",
} as const;

export type JobQueuePermission = (typeof JOB_QUEUE_PERMISSIONS)[keyof typeof JOB_QUEUE_PERMISSIONS];

export interface JobQueueActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly JobQueuePermission[];
}

export interface JobQueueRuntimePolicy {
  backendConnection: false;
  jobDispatch: false;
  workerExecution: false;
  leaseAcquisition: false;
  scheduling: false;
  retryDispatch: false;
  deadLetterDispatch: false;
  resultDelivery: false;
}

export const JOB_QUEUE_RUNTIME_POLICY: JobQueueRuntimePolicy = Object.freeze({
  backendConnection: false,
  jobDispatch: false,
  workerExecution: false,
  leaseAcquisition: false,
  scheduling: false,
  retryDispatch: false,
  deadLetterDispatch: false,
  resultDelivery: false,
});

export interface JobDefinition {
  code: string;
  displayName: string;
  ownerModule: string;
  riskClass: "low" | "medium" | "high" | "critical";
  handlerType: "module_adapter" | "n8n_adapter" | "browser_adapter" | "manual";
  status: "draft";
  executable: false;
  createdBy: string;
}

export interface JobDefinitionVersion {
  jobCode: string;
  version: string;
  inputContractCode: string;
  outputContractCode: string;
  status: "draft";
  immutableAfterApproval: true;
  handlerExecutable: false;
  createdBy: string;
}

export interface JobPayloadContract {
  code: string;
  referenceKeys: readonly string[];
  containsRawSecret: false;
  containsRawBinary: false;
  containsPrivateReasoning: false;
  status: "draft";
  createdBy: string;
}

export interface JobQueueDefinition {
  code: string;
  queueClass: "critical" | "high" | "normal" | "low" | "batch";
  status: "disabled";
  physicalBackendBound: false;
  createdBy: string;
}

export interface JobWorkerProfile {
  code: string;
  allowedJobCodes: readonly string[];
  status: "disabled";
  workerRuntimeConnected: false;
  createdBy: string;
}

export interface JobRequest {
  requestCode: string;
  tenantId: string;
  jobCode: string;
  jobVersion: string;
  payloadContractCode: string;
  idempotencyKey: string;
  status: "blocked_runtime_disabled";
  dispatched: false;
  businessOutcomeAsserted: false;
  createdBy: string;
}

export interface JobAttempt {
  attemptCode: string;
  requestCode: string;
  status: "not_started";
  leaseAcquired: false;
  sideEffectBoundaryReached: false;
  createdBy: string;
}

export interface JobRetryDecision {
  requestCode: string;
  status: "not_evaluated" | "reconciliation_required";
  retryDispatched: false;
  createdBy: string;
}

export interface JobUnknownOutcome {
  requestCode: string;
  operationReference: string;
  status: "reconciliation_required";
  safeToRequeue: false;
  externalEffectState: "unknown";
  createdBy: string;
}

export interface JobReconciliationRecord {
  requestCode: string;
  status: "not_started";
  outcome: "unknown";
  requeueAllowed: false;
  createdBy: string;
}

export interface JobDeadLetterRecord {
  requestCode: string;
  reasonCode: string;
  status: "draft";
  businessOutcomeAsserted: false;
  createdBy: string;
}

export interface JobQueueRuntimeStatus {
  module: typeof JOB_QUEUE_MODULE;
  state: "provider_disabled";
  policy: JobQueueRuntimePolicy;
  workflowAuthority: "M068";
  executionAuthorities: readonly ["M069", "M070", "M071", "domain modules"];
}

export function getJobQueueRuntimeStatus(): JobQueueRuntimeStatus {
  return {
    module: JOB_QUEUE_MODULE,
    state: "provider_disabled",
    policy: JOB_QUEUE_RUNTIME_POLICY,
    workflowAuthority: "M068",
    executionAuthorities: ["M069", "M070", "M071", "domain modules"],
  };
}

export function createJobDefinition(
  actor: JobQueueActorContext,
  input: Omit<JobDefinition, "status" | "executable" | "createdBy">,
): JobDefinition {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.DEFINITION_CREATE);
  assertStableCode(input.code, "job definition");
  return { ...input, displayName: requireText(input.displayName, "displayName"), status: "draft", executable: false, createdBy: actor.actorId };
}

export function createJobDefinitionVersion(
  actor: JobQueueActorContext,
  input: Omit<JobDefinitionVersion, "status" | "immutableAfterApproval" | "handlerExecutable" | "createdBy">,
): JobDefinitionVersion {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.VERSION_CREATE);
  assertStableCode(input.jobCode, "job definition");
  assertStableCode(input.inputContractCode, "input contract");
  assertStableCode(input.outputContractCode, "output contract");
  return { ...input, version: requireText(input.version, "version"), status: "draft", immutableAfterApproval: true, handlerExecutable: false, createdBy: actor.actorId };
}

export function createJobPayloadContract(
  actor: JobQueueActorContext,
  input: { code: string; referenceKeys: readonly string[]; containsRawSecret?: boolean; containsRawBinary?: boolean; containsPrivateReasoning?: boolean },
): JobPayloadContract {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.PAYLOAD_CONTRACT_MANAGE);
  assertStableCode(input.code, "job payload contract");
  if (input.containsRawSecret || input.containsRawBinary || input.containsPrivateReasoning) {
    throw new Error("Job payload contracts may contain only minimum necessary references, never secrets, binary data, or private reasoning");
  }
  return { code: input.code, referenceKeys: input.referenceKeys.map((key) => requireText(key, "referenceKey")), containsRawSecret: false, containsRawBinary: false, containsPrivateReasoning: false, status: "draft", createdBy: actor.actorId };
}

export function createJobQueueDefinition(
  actor: JobQueueActorContext,
  input: { code: string; queueClass: JobQueueDefinition["queueClass"] },
): JobQueueDefinition {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.QUEUE_MANAGE);
  assertStableCode(input.code, "job queue");
  return { ...input, status: "disabled", physicalBackendBound: false, createdBy: actor.actorId };
}

export function createJobWorkerProfile(
  actor: JobQueueActorContext,
  input: { code: string; allowedJobCodes: readonly string[] },
): JobWorkerProfile {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.WORKER_MANAGE);
  assertStableCode(input.code, "job worker");
  return { code: input.code, allowedJobCodes: input.allowedJobCodes.map((code) => { assertStableCode(code, "allowed job"); return code; }), status: "disabled", workerRuntimeConnected: false, createdBy: actor.actorId };
}

export function createJobRequest(
  actor: JobQueueActorContext,
  input: Omit<JobRequest, "status" | "dispatched" | "businessOutcomeAsserted" | "createdBy">,
): JobRequest {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.REQUEST_CREATE);
  assertStableCode(input.requestCode, "job request");
  assertStableCode(input.jobCode, "job definition");
  assertStableCode(input.payloadContractCode, "job payload contract");
  if (input.tenantId !== actor.tenantId) throw new Error("Cross-tenant job requests are not permitted");
  return { ...input, jobVersion: requireText(input.jobVersion, "jobVersion"), idempotencyKey: requireText(input.idempotencyKey, "idempotencyKey"), status: "blocked_runtime_disabled", dispatched: false, businessOutcomeAsserted: false, createdBy: actor.actorId };
}

export function recordJobAttempt(
  actor: JobQueueActorContext,
  input: { attemptCode: string; requestCode: string },
): JobAttempt {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.REQUEST_CREATE);
  assertStableCode(input.attemptCode, "job attempt");
  assertStableCode(input.requestCode, "job request");
  return { ...input, status: "not_started", leaseAcquired: false, sideEffectBoundaryReached: false, createdBy: actor.actorId };
}

export function recordUnknownJobOutcome(
  actor: JobQueueActorContext,
  input: { requestCode: string; operationReference: string },
): JobUnknownOutcome {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.RECONCILIATION_MANAGE);
  assertStableCode(input.requestCode, "job request");
  return { ...input, operationReference: requireText(input.operationReference, "operationReference"), status: "reconciliation_required", safeToRequeue: false, externalEffectState: "unknown", createdBy: actor.actorId };
}

export function createJobReconciliationRecord(
  actor: JobQueueActorContext,
  input: { requestCode: string },
): JobReconciliationRecord {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.RECONCILIATION_MANAGE);
  assertStableCode(input.requestCode, "job request");
  return { ...input, status: "not_started", outcome: "unknown", requeueAllowed: false, createdBy: actor.actorId };
}

export function requestSafeJobRequeue(
  actor: JobQueueActorContext,
  unknownOutcome: JobUnknownOutcome,
): JobRetryDecision {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.RETRY_MANAGE);
  if (!unknownOutcome.safeToRequeue) throw new Error("Unknown external outcomes must be reconciled before a job can be requeued");
  return { requestCode: unknownOutcome.requestCode, status: "not_evaluated", retryDispatched: false, createdBy: actor.actorId };
}

export function createJobDeadLetterRecord(
  actor: JobQueueActorContext,
  input: { requestCode: string; reasonCode: string },
): JobDeadLetterRecord {
  assertPermission(actor, JOB_QUEUE_PERMISSIONS.DEAD_LETTER_MANAGE);
  assertStableCode(input.requestCode, "job request");
  assertStableCode(input.reasonCode, "dead letter reason");
  return { ...input, status: "draft", businessOutcomeAsserted: false, createdBy: actor.actorId };
}

function assertPermission(actor: JobQueueActorContext, permission: JobQueuePermission): void {
  if (!actor.permissions.includes(permission)) throw new Error(`Missing permission: ${permission}`);
}

function assertStableCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) throw new Error(`${label} must use a stable uppercase code`);
}

function requireText(value: string, label: string): string {
  if (!value.trim()) throw new Error(`${label} is required`);
  return value.trim();
}
