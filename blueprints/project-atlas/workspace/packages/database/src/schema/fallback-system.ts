import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const fallbackSystemConfigurations = pgTable("fallback_system_configurations", {
  id: uuid("id").defaultRandom().primaryKey(), environment: text("environment").notNull(), runtimeEnabled: boolean("runtime_enabled").notNull().default(false), healthProbesEnabled: boolean("health_probes_enabled").notNull().default(false), targetSwitchingEnabled: boolean("target_switching_enabled").notNull().default(false), fallbackDispatchEnabled: boolean("fallback_dispatch_enabled").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackPolicies = pgTable("fallback_policies", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), displayName: text("display_name").notNull(), ownerModule: text("owner_module").notNull(), status: text("status").notNull().default("draft"), active: boolean("active").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackPolicyVersions = pgTable("fallback_policy_versions", {
  id: uuid("id").defaultRandom().primaryKey(), policyCode: text("policy_code").notNull(), version: text("version").notNull(), status: text("status").notNull().default("draft"), immutableAfterApproval: boolean("immutable_after_approval").notNull().default(true), executable: boolean("executable").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackCapabilityContracts = pgTable("fallback_capability_contracts", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), ownerModule: text("owner_module").notNull(), sideEffectClass: text("side_effect_class").notNull(), status: text("status").notNull().default("draft"), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackTargets = pgTable("fallback_targets", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), capabilityCode: text("capability_code").notNull(), targetType: text("target_type").notNull(), status: text("status").notNull().default("disabled"), connectionConfigured: boolean("connection_configured").notNull().default(false), eligibleForSelection: boolean("eligible_for_selection").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackRuntimeEvaluations = pgTable("fallback_runtime_evaluations", {
  id: uuid("id").defaultRandom().primaryKey(), evaluationCode: text("evaluation_code").notNull().unique(), operationReference: text("operation_reference").notNull(), policyVersion: text("policy_version").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), healthTrusted: boolean("health_trusted").notNull().default(false), targetSelected: boolean("target_selected").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackDecisions = pgTable("fallback_decisions", {
  id: uuid("id").defaultRandom().primaryKey(), decisionCode: text("decision_code").notNull().unique(), operationReference: text("operation_reference").notNull(), policyVersion: text("policy_version").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), selectedTargetCode: text("selected_target_code"), executionAuthorized: boolean("execution_authorized").notNull().default(false), canonicalStateMutated: boolean("canonical_state_mutated").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackPlans = pgTable("fallback_plans", {
  id: uuid("id").defaultRandom().primaryKey(), planCode: text("plan_code").notNull().unique(), decisionCode: text("decision_code").notNull(), executionMode: text("execution_mode").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), dispatched: boolean("dispatched").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackUnknownOutcomes = pgTable("fallback_unknown_outcomes", {
  id: uuid("id").defaultRandom().primaryKey(), operationReference: text("operation_reference").notNull(), status: text("status").notNull().default("reconciliation_required"), alternateSideEffectBlocked: boolean("alternate_side_effect_blocked").notNull().default(true), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const fallbackDegradedModes = pgTable("fallback_degraded_modes", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), capabilityCode: text("capability_code").notNull(), proposedMode: text("proposed_mode").notNull(), status: text("status").notNull().default("draft"), enforced: boolean("enforced").notNull().default(false), metadata: jsonb("metadata").notNull().default({}), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
