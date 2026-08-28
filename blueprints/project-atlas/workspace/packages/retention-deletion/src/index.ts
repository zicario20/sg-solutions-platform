export const RETENTION_DELETION_MODULE = "M085" as const;

export const RETENTION_DELETION_PERMISSIONS = [
  "retention.class.create",
  "retention.policy.create",
  "retention.record.register",
  "retention.hold.request",
  "retention.eligibility.evaluate",
  "retention.archive.request",
  "retention.deletion.request",
  "retention.purge.request",
  "retention.provider_deletion.request",
] as const;

export type RetentionDeletionPermission = (typeof RETENTION_DELETION_PERMISSIONS)[number];

export const RETENTION_DELETION_RUNTIME = {
  policyActivation: false,
  eligibilityEvaluation: false,
  archiveExecution: false,
  deletionExecution: false,
  purgeExecution: false,
  providerDeletionExecution: false,
  backupReconciliation: false,
  eventDispatch: false,
} as const;

export interface RetentionClass {
  readonly module: typeof RETENTION_DELETION_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
}

export interface RetentionPolicy {
  readonly code: string;
  readonly retentionClassCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly durationHardcoded: false;
}

export interface RetentionRecord {
  readonly recordReference: string;
  readonly retentionClassCode: string;
  readonly status: "unresolved";
  readonly deletionEligible: false;
  readonly deleted: false;
}

export interface RetentionHoldRequest {
  readonly holdId: string;
  readonly recordReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly deletionBlocked: false;
}

export interface DeletionEligibilityResult {
  readonly recordReference: string;
  readonly status: "review_required";
  readonly eligible: false;
  readonly holdVerified: false;
  readonly providerStateVerified: false;
  readonly backupStateVerified: false;
}

export interface ArchiveRequest {
  readonly requestId: string;
  readonly recordReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly archiveExecuted: false;
}

export interface DeletionRequest {
  readonly requestId: string;
  readonly recordReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly deletionExecuted: false;
  readonly tombstoneWritten: false;
}

export interface PurgeRequest {
  readonly requestId: string;
  readonly recordReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly purgeExecuted: false;
  readonly backupReconciled: false;
}

export interface ProviderDeletionRequest {
  readonly requestId: string;
  readonly providerReference: string;
  readonly recordReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly requestSent: false;
  readonly providerDeletionConfirmed: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: RetentionDeletionPermission): void {
  if (!RETENTION_DELETION_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported retention/deletion permission: ${permission}.`);
  }
}

export function createRetentionClass(input: {
  readonly permission: RetentionDeletionPermission;
  readonly code: string;
}): RetentionClass {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Retention class code");

  return { module: RETENTION_DELETION_MODULE, code: input.code, status: "draft", active: false };
}

export function createRetentionPolicy(input: {
  readonly permission: RetentionDeletionPermission;
  readonly code: string;
  readonly retentionClass: RetentionClass;
  readonly includesHardcodedDuration?: boolean;
}): RetentionPolicy {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Retention policy code");
  if (input.includesHardcodedDuration) {
    throw new Error("Retention durations require approved versioned policy sources, not hardcoded values.");
  }

  return {
    code: input.code,
    retentionClassCode: input.retentionClass.code,
    status: "draft",
    active: false,
    durationHardcoded: false,
  };
}

export function registerRetentionRecord(input: {
  readonly permission: RetentionDeletionPermission;
  readonly recordReference: string;
  readonly retentionClass: RetentionClass;
  readonly includesRawData?: boolean;
}): RetentionRecord {
  requirePermission(input.permission);
  requireIdentifier(input.recordReference, "Retention record reference");
  if (input.includesRawData) {
    throw new Error("Retention records store canonical references and state, not raw data payloads.");
  }

  return {
    recordReference: input.recordReference,
    retentionClassCode: input.retentionClass.code,
    status: "unresolved",
    deletionEligible: false,
    deleted: false,
  };
}

export function requestRetentionHold(input: {
  readonly permission: RetentionDeletionPermission;
  readonly holdId: string;
  readonly record: RetentionRecord;
}): RetentionHoldRequest {
  requirePermission(input.permission);
  requireIdentifier(input.holdId, "Retention hold ID");

  return {
    holdId: input.holdId,
    recordReference: input.record.recordReference,
    status: "draft",
    active: false,
    deletionBlocked: false,
  };
}

export function evaluateDeletionEligibility(input: {
  readonly permission: RetentionDeletionPermission;
  readonly record: RetentionRecord;
}): DeletionEligibilityResult {
  requirePermission(input.permission);

  return {
    recordReference: input.record.recordReference,
    status: "review_required",
    eligible: false,
    holdVerified: false,
    providerStateVerified: false,
    backupStateVerified: false,
  };
}

export function requestArchive(input: {
  readonly permission: RetentionDeletionPermission;
  readonly requestId: string;
  readonly record: RetentionRecord;
}): ArchiveRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Archive request ID");

  return { requestId: input.requestId, recordReference: input.record.recordReference, status: "blocked_runtime_disabled", archiveExecuted: false };
}

export function requestDeletion(input: {
  readonly permission: RetentionDeletionPermission;
  readonly requestId: string;
  readonly record: RetentionRecord;
}): DeletionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Deletion request ID");

  return {
    requestId: input.requestId,
    recordReference: input.record.recordReference,
    status: "blocked_runtime_disabled",
    deletionExecuted: false,
    tombstoneWritten: false,
  };
}

export function requestPurge(input: {
  readonly permission: RetentionDeletionPermission;
  readonly requestId: string;
  readonly record: RetentionRecord;
}): PurgeRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Purge request ID");

  return {
    requestId: input.requestId,
    recordReference: input.record.recordReference,
    status: "blocked_runtime_disabled",
    purgeExecuted: false,
    backupReconciled: false,
  };
}

export function requestProviderDeletion(input: {
  readonly permission: RetentionDeletionPermission;
  readonly requestId: string;
  readonly providerReference: string;
  readonly record: RetentionRecord;
}): ProviderDeletionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Provider deletion request ID");
  requireIdentifier(input.providerReference, "Provider reference");

  return {
    requestId: input.requestId,
    providerReference: input.providerReference,
    recordReference: input.record.recordReference,
    status: "blocked_runtime_disabled",
    requestSent: false,
    providerDeletionConfirmed: false,
  };
}
