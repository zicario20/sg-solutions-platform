import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const approvalInboxConfigurations = pgTable("approval_inbox_configurations", {
  id: uuid("id").defaultRandom().primaryKey(), environment: text("environment").notNull(), runtimeEnabled: boolean("runtime_enabled").notNull().default(false), policyActivationEnabled: boolean("policy_activation_enabled").notNull().default(false), notificationDeliveryEnabled: boolean("notification_delivery_enabled").notNull().default(false), decisionAuthorityEnabled: boolean("decision_authority_enabled").notNull().default(false), workflowConsumptionEnabled: boolean("workflow_consumption_enabled").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalPolicies = pgTable("approval_policies", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), displayName: text("display_name").notNull(), ownerModule: text("owner_module").notNull(), riskClass: text("risk_class").notNull(), status: text("status").notNull().default("draft"), active: boolean("active").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalPolicyVersions = pgTable("approval_policy_versions", {
  id: uuid("id").defaultRandom().primaryKey(), policyCode: text("policy_code").notNull(), version: text("version").notNull(), status: text("status").notNull().default("draft"), immutableAfterApproval: boolean("immutable_after_approval").notNull().default(true), activationEnabled: boolean("activation_enabled").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalScopes = pgTable("approval_scopes", {
  id: uuid("id").defaultRandom().primaryKey(), scopeCode: text("scope_code").notNull().unique(), ownerModule: text("owner_module").notNull(), operationCode: text("operation_code").notNull(), resourceReference: text("resource_reference").notNull(), purpose: text("purpose").notNull(), singleUse: boolean("single_use").notNull().default(true), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalContextSnapshots = pgTable("approval_context_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(), snapshotCode: text("snapshot_code").notNull().unique(), materialInputsHash: text("material_inputs_hash").notNull(), resourceVersion: text("resource_version").notNull(), evidenceReferences: jsonb("evidence_references").notNull().default([]), containsRawSecret: boolean("contains_raw_secret").notNull().default(false), containsBroadPii: boolean("contains_broad_pii").notNull().default(false), containsPrivateReasoning: boolean("contains_private_reasoning").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull().unique(), policyCode: text("policy_code").notNull(), policyVersion: text("policy_version").notNull(), scopeCode: text("scope_code").notNull(), contextSnapshotCode: text("context_snapshot_code").notNull(), requesterActorId: text("requester_actor_id").notNull(), status: text("status").notNull().default("created"), actionExecuted: boolean("action_executed").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalWorkItems = pgTable("approval_work_items", {
  id: uuid("id").defaultRandom().primaryKey(), workItemCode: text("work_item_code").notNull().unique(), requestCode: text("request_code").notNull(), assignedToReference: text("assigned_to_reference"), status: text("status").notNull().default("unassigned"), notificationSent: boolean("notification_sent").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalEligibilityResults = pgTable("approval_eligibility_results", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull(), approverActorId: text("approver_actor_id").notNull(), status: text("status").notNull(), eligible: boolean("eligible").notNull().default(false), separationOfDutiesPassed: boolean("separation_of_duties_passed").notNull().default(false), revalidationRequired: boolean("revalidation_required").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalDecisions = pgTable("approval_decisions", {
  id: uuid("id").defaultRandom().primaryKey(), decisionCode: text("decision_code").notNull().unique(), requestCode: text("request_code").notNull(), workItemCode: text("work_item_code").notNull(), outcome: text("outcome").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), validForExecution: boolean("valid_for_execution").notNull().default(false), actionExecuted: boolean("action_executed").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalConsumptionRecords = pgTable("approval_consumption_records", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull(), decisionCode: text("decision_code").notNull(), operationIdentity: text("operation_identity").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), consumed: boolean("consumed").notNull().default(false), actionSucceeded: boolean("action_succeeded").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const approvalRevocations = pgTable("approval_revocations", {
  id: uuid("id").defaultRandom().primaryKey(), revocationCode: text("revocation_code").notNull().unique(), decisionCode: text("decision_code").notNull(), reasonCode: text("reason_code").notNull(), status: text("status").notNull().default("draft"), reversesExecutedAction: boolean("reverses_executed_action").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
