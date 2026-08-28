import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m085RetentionDeletionConfigurations = pgTable("m085_retention_deletion_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  policyActivationEnabled: boolean("policy_activation_enabled").notNull().default(false),
  eligibilityEvaluationEnabled: boolean("eligibility_evaluation_enabled").notNull().default(false),
  archiveExecutionEnabled: boolean("archive_execution_enabled").notNull().default(false),
  deletionExecutionEnabled: boolean("deletion_execution_enabled").notNull().default(false),
  purgeExecutionEnabled: boolean("purge_execution_enabled").notNull().default(false),
  providerDeletionExecutionEnabled: boolean("provider_deletion_execution_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085RetentionClasses = pgTable("m085_retention_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085RetentionPolicies = pgTable("m085_retention_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  retentionClassId: uuid("retention_class_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  durationHardcoded: boolean("duration_hardcoded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085RetentionRecords = pgTable("m085_retention_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  recordReference: text("record_reference").notNull().unique(),
  retentionClassId: uuid("retention_class_id").notNull(),
  status: text("status").notNull().default("unresolved"),
  deletionEligible: boolean("deletion_eligible").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085RetentionHoldRequests = pgTable("m085_retention_hold_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  deletionBlocked: boolean("deletion_blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085DeletionEligibilityResults = pgTable("m085_deletion_eligibility_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("review_required"),
  eligible: boolean("eligible").notNull().default(false),
  holdVerified: boolean("hold_verified").notNull().default(false),
  providerStateVerified: boolean("provider_state_verified").notNull().default(false),
  backupStateVerified: boolean("backup_state_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085ArchiveRequests = pgTable("m085_archive_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  archiveExecuted: boolean("archive_executed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085DeletionRequests = pgTable("m085_deletion_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  deletionExecuted: boolean("deletion_executed").notNull().default(false),
  tombstoneWritten: boolean("tombstone_written").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085PurgeRequests = pgTable("m085_purge_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  purgeExecuted: boolean("purge_executed").notNull().default(false),
  backupReconciled: boolean("backup_reconciled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m085ProviderDeletionRequests = pgTable("m085_provider_deletion_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  providerReference: text("provider_reference").notNull(),
  recordId: uuid("record_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  requestSent: boolean("request_sent").notNull().default(false),
  providerDeletionConfirmed: boolean("provider_deletion_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
