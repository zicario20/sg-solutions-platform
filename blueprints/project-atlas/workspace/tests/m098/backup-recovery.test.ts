import { describe, expect, it } from "vitest";

import {
  createBackupPolicyDefinition,
  createBackupRecoverySystem,
  createRecoveryGroupDefinition,
  createRecoveryPointDefinition,
  registerBackupRepository,
  requestBackupExecution,
  requestRestore,
} from "../../packages/backup-recovery/src/index";

describe("M098 backup and recovery controlled foundation", () => {
  it("does not start backups or claim an unverified point is recoverable", () => {
    const system = createBackupRecoverySystem({
      permission: "backup.system.configure",
      code: "BACKUP_RECOVERY_PRIMARY",
    });
    const policy = createBackupPolicyDefinition({
      permission: "backup.policy.create",
      code: "POSTGRES_POLICY",
      system,
      workloadReference: "POSTGRES_PRIMARY",
      method: "logical_export",
      consistencyClass: "transaction_consistent",
      rpoTargetMinutes: 60,
      rtoTargetMinutes: 240,
    });
    const repository = registerBackupRepository({
      permission: "backup.repository.register",
      code: "OFFSITE_REPOSITORY",
      system,
      repositoryClass: "offsite",
    });
    const recoveryPoint = createRecoveryPointDefinition({
      permission: "backup.policy.create",
      code: "POSTGRES_RECOVERY_POINT",
      policy,
      repository,
    });
    const request = requestBackupExecution({
      permission: "backup.execution.request",
      code: "BACKUP_EXECUTION_001",
      policy,
    });

    expect(recoveryPoint.verificationStatus).toBe("unverified");
    expect(recoveryPoint.recoverable).toBe(false);
    expect(request.status).toBe("blocked_runtime_disabled");
    expect(request.artifactCreated).toBe(false);
  });

  it("rejects credential material and keeps restores behind review", () => {
    const system = createBackupRecoverySystem({
      permission: "backup.system.configure",
      code: "BACKUP_RECOVERY_RESTORE",
    });
    const policy = createBackupPolicyDefinition({
      permission: "backup.policy.create",
      code: "CONFIG_POLICY",
      system,
      workloadReference: "CONFIGURATION_SERVICE",
      method: "configuration_export",
      consistencyClass: "application_consistent",
      rpoTargetMinutes: 1440,
      rtoTargetMinutes: 480,
    });
    expect(() =>
      registerBackupRepository({
        permission: "backup.repository.register",
        code: "UNSAFE_REPOSITORY",
        system,
        repositoryClass: "offsite",
        endpointOrCredentialMaterial: "api_key=unsafe",
      }),
    ).toThrow("cannot contain raw credential material");

    const repository = registerBackupRepository({
      permission: "backup.repository.register",
      code: "RESTORE_REPOSITORY",
      system,
      repositoryClass: "test_restore_target",
    });
    const recoveryPoint = createRecoveryPointDefinition({
      permission: "backup.policy.create",
      code: "CONFIG_RECOVERY_POINT",
      policy,
      repository,
    });
    const restore = requestRestore({
      permission: "backup.restore.request",
      code: "RESTORE_REQUEST_001",
      recoveryPoint,
      targetReference: "ISOLATED_RESTORE_TARGET",
    });

    expect(restore.status).toBe("review_required");
    expect(restore.targetWritten).toBe(false);
    expect(restore.productionPromoted).toBe(false);
  });

  it("does not start or promote recovery groups", () => {
    const group = createRecoveryGroupDefinition({
      permission: "backup.recovery_group.manage",
      code: "CORE_RECOVERY_GROUP",
      workloadReferences: ["M093_INFRASTRUCTURE", "POSTGRES_PRIMARY", "APPLICATION_RUNTIME"],
      hardDependencyReferences: ["M083_SECRETS", "M081_AUTHORIZATION"],
    });

    expect(group.status).toBe("draft");
    expect(group.executionStarted).toBe(false);
    expect(group.promotionAllowed).toBe(false);
  });
});
