export const BACKUP_RECOVERY_MODULE = "M098" as const;

export const BACKUP_RECOVERY_PERMISSIONS = [
  "backup.system.configure",
  "backup.policy.create",
  "backup.repository.register",
  "backup.execution.request",
  "backup.restore.request",
  "backup.recovery_group.manage",
  "backup.runtime.activate",
] as const;

export type BackupRecoveryPermission = (typeof BACKUP_RECOVERY_PERMISSIONS)[number];

export const BACKUP_RECOVERY_RUNTIME = {
  scheduling: false,
  sourceConnections: false,
  artifactWrites: false,
  encryptionOperations: false,
  integrityVerification: false,
  offsiteReplication: false,
  restoreExecution: false,
  pointInTimeRecovery: false,
  promotion: false,
  telemetry: false,
} as const;

export type BackupMethod =
  | "full"
  | "incremental"
  | "differential"
  | "snapshot"
  | "logical_export"
  | "physical_copy"
  | "object_version_copy"
  | "configuration_export"
  | "artifact_copy";

export type BackupRepositoryClass =
  | "local_primary"
  | "local_secondary"
  | "offsite"
  | "offline_optional"
  | "immutable"
  | "provider_managed"
  | "test_restore_target";

export type BackupConsistencyClass =
  | "crash_consistent"
  | "application_consistent"
  | "transaction_consistent"
  | "point_in_time_capable"
  | "best_effort"
  | "unknown";

export interface BackupRecoverySystem {
  readonly module: typeof BACKUP_RECOVERY_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly backupRuntimeEnabled: false;
  readonly restoreRuntimeEnabled: false;
  readonly productionPromotionEnabled: false;
}

export interface BackupPolicyDefinition {
  readonly code: string;
  readonly systemCode: string;
  readonly workloadReference: string;
  readonly method: BackupMethod;
  readonly consistencyClass: BackupConsistencyClass;
  readonly rpoTargetMinutes: number;
  readonly rtoTargetMinutes: number;
  readonly status: "draft";
  readonly active: false;
  readonly rpoIsGuarantee: false;
  readonly rtoIsGuarantee: false;
}

export interface BackupRepositoryRegistration {
  readonly code: string;
  readonly systemCode: string;
  readonly repositoryClass: BackupRepositoryClass;
  readonly status: "draft";
  readonly reachable: false;
  readonly encryptionConfigured: false;
  readonly immutabilityVerified: false;
  readonly offsiteSeparationVerified: false;
}

export interface RecoveryPointDefinition {
  readonly code: string;
  readonly policyCode: string;
  readonly repositoryCode: string;
  readonly consistencyClass: BackupConsistencyClass;
  readonly verificationStatus: "unverified";
  readonly recoverable: false;
  readonly artifactWritten: false;
  readonly rawSecretStored: false;
}

export interface BackupExecutionRequest {
  readonly code: string;
  readonly policyCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly jobStarted: false;
  readonly artifactCreated: false;
  readonly catalogMutated: false;
  readonly sourceDataRead: false;
}

export interface RestoreRequest {
  readonly code: string;
  readonly recoveryPointCode: string;
  readonly targetReference: string;
  readonly status: "review_required";
  readonly authorizationVerified: false;
  readonly restoreStarted: false;
  readonly targetWritten: false;
  readonly productionPromoted: false;
}

export interface RecoveryGroupDefinition {
  readonly code: string;
  readonly workloadReferences: readonly string[];
  readonly hardDependencyReferences: readonly string[];
  readonly status: "draft";
  readonly executionStarted: false;
  readonly promotionAllowed: false;
}

export interface BackupRecoveryReadinessResult {
  readonly systemCode: string;
  readonly ready: false;
  readonly status: "not_ready";
  readonly reasons: readonly string[];
}

function requireIdentifier(value: string, field: string): void {
  if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) {
    throw new Error(`${field} must be a stable safe identifier.`);
  }
}

function requirePermission(permission: BackupRecoveryPermission): void {
  if (!BACKUP_RECOVERY_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported backup recovery permission: ${permission}.`);
  }
}

function rejectRestrictedMaterial(value: string | undefined, field: string): void {
  if (
    value !== undefined &&
    /(secret|password|token|api[_-]?key|authorization:|bearer\s|-----begin|eyj[a-z0-9_-]{10,})/iu.test(value)
  ) {
    throw new Error(`${field} cannot contain raw credential material.`);
  }
}

function requirePositiveInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${field} must be a positive integer.`);
}

export function createBackupRecoverySystem(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
}): BackupRecoverySystem {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Backup recovery system code");

  return {
    module: BACKUP_RECOVERY_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    backupRuntimeEnabled: false,
    restoreRuntimeEnabled: false,
    productionPromotionEnabled: false,
  };
}

export function createBackupPolicyDefinition(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly system: BackupRecoverySystem;
  readonly workloadReference: string;
  readonly method: BackupMethod;
  readonly consistencyClass: BackupConsistencyClass;
  readonly rpoTargetMinutes: number;
  readonly rtoTargetMinutes: number;
}): BackupPolicyDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Backup policy code");
  requireIdentifier(input.workloadReference, "Backup workload reference");
  requirePositiveInteger(input.rpoTargetMinutes, "RPO target minutes");
  requirePositiveInteger(input.rtoTargetMinutes, "RTO target minutes");

  return {
    code: input.code,
    systemCode: input.system.code,
    workloadReference: input.workloadReference,
    method: input.method,
    consistencyClass: input.consistencyClass,
    rpoTargetMinutes: input.rpoTargetMinutes,
    rtoTargetMinutes: input.rtoTargetMinutes,
    status: "draft",
    active: false,
    rpoIsGuarantee: false,
    rtoIsGuarantee: false,
  };
}

export function registerBackupRepository(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly system: BackupRecoverySystem;
  readonly repositoryClass: BackupRepositoryClass;
  readonly endpointOrCredentialMaterial?: string;
}): BackupRepositoryRegistration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Backup repository code");
  rejectRestrictedMaterial(input.endpointOrCredentialMaterial, "Backup repository registration");

  return {
    code: input.code,
    systemCode: input.system.code,
    repositoryClass: input.repositoryClass,
    status: "draft",
    reachable: false,
    encryptionConfigured: false,
    immutabilityVerified: false,
    offsiteSeparationVerified: false,
  };
}

export function createRecoveryPointDefinition(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly policy: BackupPolicyDefinition;
  readonly repository: BackupRepositoryRegistration;
  readonly checksumOrSecretMaterial?: string;
}): RecoveryPointDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Recovery point code");
  rejectRestrictedMaterial(input.checksumOrSecretMaterial, "Recovery point definition");

  return {
    code: input.code,
    policyCode: input.policy.code,
    repositoryCode: input.repository.code,
    consistencyClass: input.policy.consistencyClass,
    verificationStatus: "unverified",
    recoverable: false,
    artifactWritten: false,
    rawSecretStored: false,
  };
}

export function requestBackupExecution(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly policy: BackupPolicyDefinition;
}): BackupExecutionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Backup execution request code");

  return {
    code: input.code,
    policyCode: input.policy.code,
    status: "blocked_runtime_disabled",
    jobStarted: false,
    artifactCreated: false,
    catalogMutated: false,
    sourceDataRead: false,
  };
}

export function requestRestore(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly recoveryPoint: RecoveryPointDefinition;
  readonly targetReference: string;
}): RestoreRequest {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Restore request code");
  requireIdentifier(input.targetReference, "Restore target reference");

  return {
    code: input.code,
    recoveryPointCode: input.recoveryPoint.code,
    targetReference: input.targetReference,
    status: "review_required",
    authorizationVerified: false,
    restoreStarted: false,
    targetWritten: false,
    productionPromoted: false,
  };
}

export function createRecoveryGroupDefinition(input: {
  readonly permission: BackupRecoveryPermission;
  readonly code: string;
  readonly workloadReferences: readonly string[];
  readonly hardDependencyReferences?: readonly string[];
}): RecoveryGroupDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Recovery group code");
  if (input.workloadReferences.length === 0) throw new Error("Recovery groups require workloads.");
  for (const reference of input.workloadReferences) requireIdentifier(reference, "Recovery workload reference");
  for (const reference of input.hardDependencyReferences ?? []) {
    requireIdentifier(reference, "Recovery hard dependency reference");
  }

  return {
    code: input.code,
    workloadReferences: [...new Set(input.workloadReferences)],
    hardDependencyReferences: [...new Set(input.hardDependencyReferences ?? [])],
    status: "draft",
    executionStarted: false,
    promotionAllowed: false,
  };
}

export function evaluateBackupRecoveryReadiness(input: {
  readonly system: BackupRecoverySystem;
  readonly policy: BackupPolicyDefinition;
  readonly repository: BackupRepositoryRegistration;
  readonly recoveryPoint: RecoveryPointDefinition;
}): BackupRecoveryReadinessResult {
  const reasons = [
    "backup_runtime_disabled",
    "repository_not_verified",
    "encryption_not_configured",
    "recovery_point_unverified",
    "restore_test_not_completed",
  ];
  if (input.system.code !== input.policy.systemCode || input.system.code !== input.repository.systemCode) {
    reasons.push("system_reference_mismatch");
  }
  if (input.policy.code !== input.recoveryPoint.policyCode || input.repository.code !== input.recoveryPoint.repositoryCode) {
    reasons.push("recovery_point_reference_mismatch");
  }

  return {
    systemCode: input.system.code,
    ready: false,
    status: "not_ready",
    reasons,
  };
}
