import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m098BackupRecoverySystems = pgTable("m098_backup_recovery_systems", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  backupRuntimeEnabled: boolean("backup_runtime_enabled").notNull().default(false),
  restoreRuntimeEnabled: boolean("restore_runtime_enabled").notNull().default(false),
  productionPromotionEnabled: boolean("production_promotion_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m098BackupPolicies = pgTable("m098_backup_policies", {
  id: uuid("id").primaryKey(),
  backupRecoverySystemId: uuid("backup_recovery_system_id").notNull(),
  code: text("code").notNull().unique(),
  workloadReference: text("workload_reference").notNull(),
  method: text("method").notNull(),
  consistencyClass: text("consistency_class").notNull(),
  rpoTargetMinutes: integer("rpo_target_minutes").notNull(),
  rtoTargetMinutes: integer("rto_target_minutes").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  rpoIsGuarantee: boolean("rpo_is_guarantee").notNull().default(false),
  rtoIsGuarantee: boolean("rto_is_guarantee").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m098BackupRepositories = pgTable("m098_backup_repositories", {
  id: uuid("id").primaryKey(),
  backupRecoverySystemId: uuid("backup_recovery_system_id").notNull(),
  code: text("code").notNull().unique(),
  repositoryClass: text("repository_class").notNull(),
  status: text("status").notNull(),
  reachable: boolean("reachable").notNull().default(false),
  encryptionConfigured: boolean("encryption_configured").notNull().default(false),
  immutabilityVerified: boolean("immutability_verified").notNull().default(false),
  offsiteSeparationVerified: boolean("offsite_separation_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m098RecoveryPoints = pgTable("m098_recovery_points", {
  id: uuid("id").primaryKey(),
  backupPolicyId: uuid("backup_policy_id").notNull(),
  backupRepositoryId: uuid("backup_repository_id").notNull(),
  code: text("code").notNull().unique(),
  consistencyClass: text("consistency_class").notNull(),
  verificationStatus: text("verification_status").notNull(),
  recoverable: boolean("recoverable").notNull().default(false),
  artifactWritten: boolean("artifact_written").notNull().default(false),
  rawSecretStored: boolean("raw_secret_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m098BackupExecutionRequests = pgTable("m098_backup_execution_requests", {
  id: uuid("id").primaryKey(),
  backupPolicyId: uuid("backup_policy_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  jobStarted: boolean("job_started").notNull().default(false),
  artifactCreated: boolean("artifact_created").notNull().default(false),
  catalogMutated: boolean("catalog_mutated").notNull().default(false),
  sourceDataRead: boolean("source_data_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m098RestoreRequests = pgTable("m098_restore_requests", {
  id: uuid("id").primaryKey(),
  recoveryPointId: uuid("recovery_point_id").notNull(),
  code: text("code").notNull().unique(),
  targetReference: text("target_reference").notNull(),
  status: text("status").notNull(),
  authorizationVerified: boolean("authorization_verified").notNull().default(false),
  restoreStarted: boolean("restore_started").notNull().default(false),
  targetWritten: boolean("target_written").notNull().default(false),
  productionPromoted: boolean("production_promoted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
