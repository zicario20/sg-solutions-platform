import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m075HumanTaskConfigurations = pgTable("m075_human_task_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskActivationEnabled: boolean("task_activation_enabled").notNull().default(false),
  assignmentDispatchEnabled: boolean("assignment_dispatch_enabled").notNull().default(false),
  ownerResultConsumptionEnabled: boolean("owner_result_consumption_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskDefinitions = pgTable("m075_human_task_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskDefinitionVersions = pgTable("m075_human_task_definition_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  definitionId: uuid("definition_id").notNull(),
  versionNumber: text("version_number").notNull(),
  configurationSnapshot: jsonb("configuration_snapshot").notNull().default({}),
  status: text("status").notNull().default("draft"),
  immutable: boolean("immutable").notNull().default(true),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskScopes = pgTable("m075_human_task_scopes", {
  id: uuid("id").defaultRandom().primaryKey(),
  definitionVersionId: uuid("definition_version_id").notNull(),
  allowedActions: jsonb("allowed_actions").notNull().default([]),
  prohibitedActions: jsonb("prohibited_actions").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskContextSnapshots = pgTable("m075_human_task_context_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotReference: text("snapshot_reference").notNull(),
  resourceReferences: jsonb("resource_references").notNull().default([]),
  minimized: boolean("minimized").notNull().default(true),
  containsRawSecrets: boolean("contains_raw_secrets").notNull().default(false),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  containsPrivateReasoning: boolean("contains_private_reasoning").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskRequests = pgTable("m075_human_task_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  definitionVersionId: uuid("definition_version_id").notNull(),
  scopeId: uuid("scope_id").notNull(),
  contextSnapshotId: uuid("context_snapshot_id").notNull(),
  status: text("status").notNull().default("created"),
  approvalGranted: boolean("approval_granted").notNull().default(false),
  workflowCompleted: boolean("workflow_completed").notNull().default(false),
  canonicalMutationApplied: boolean("canonical_mutation_applied").notNull().default(false),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanWorkItems = pgTable("m075_human_work_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull(),
  status: text("status").notNull().default("unassigned"),
  assignedReviewerId: uuid("assigned_reviewer_id"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskEligibilityResults = pgTable("m075_human_task_eligibility_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull(),
  reviewerReference: text("reviewer_reference").notNull(),
  status: text("status").notNull().default("indeterminate"),
  eligible: boolean("eligible").notNull().default(false),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m075HumanTaskResults = pgTable("m075_human_task_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull(),
  submittedByReference: text("submitted_by_reference").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  disposition: text("disposition").notNull().default("requires_owner_validation"),
  canonicalMutationApplied: boolean("canonical_mutation_applied").notNull().default(false),
  approvalGranted: boolean("approval_granted").notNull().default(false),
  workflowCompleted: boolean("workflow_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
