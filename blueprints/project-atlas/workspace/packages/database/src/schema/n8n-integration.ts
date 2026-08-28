import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const n8nIntegrationConfigurations = pgTable("n8n_integration_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  environment: text("environment").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  instanceConnectionEnabled: boolean("instance_connection_enabled").notNull().default(false),
  workflowActivationEnabled: boolean("workflow_activation_enabled").notNull().default(false),
  executionDispatchEnabled: boolean("execution_dispatch_enabled").notNull().default(false),
  webhookAcceptanceEnabled: boolean("webhook_acceptance_enabled").notNull().default(false),
  credentialInjectionEnabled: boolean("credential_injection_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nInstanceProfiles = pgTable("n8n_instance_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("disabled"),
  credentialsConfigured: boolean("credentials_configured").notNull().default(false),
  connectionTested: boolean("connection_tested").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nWorkflowReferences = pgTable("n8n_workflow_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  instanceProfileCode: text("instance_profile_code").notNull(),
  activityCode: text("activity_code").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  canonicalStateAuthority: boolean("canonical_state_authority").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nWorkflowVersionReferences = pgTable("n8n_workflow_version_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowCode: text("workflow_code").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"),
  immutableAfterApproval: boolean("immutable_after_approval").notNull().default(true),
  verifiedAgainstInstance: boolean("verified_against_instance").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nActivityBindings = pgTable("n8n_activity_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  workflowCode: text("workflow_code").notNull(),
  workflowVersion: text("workflow_version").notNull(),
  domainActivityCode: text("domain_activity_code").notNull(),
  status: text("status").notNull().default("draft"),
  externalWriteAllowed: boolean("external_write_allowed").notNull().default(false),
  canonicalTransitionAllowed: boolean("canonical_transition_allowed").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nExecutionRequests = pgTable("n8n_execution_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestCode: text("request_code").notNull().unique(),
  workflowCode: text("workflow_code").notNull(),
  workflowVersion: text("workflow_version").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  inputContractCode: text("input_contract_code").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  dispatched: boolean("dispatched").notNull().default(false),
  externalExecutionReference: text("external_execution_reference"),
  canonicalStateMutated: boolean("canonical_state_mutated").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const n8nWebhookCandidates = pgTable("n8n_webhook_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventReference: text("event_reference").notNull().unique(),
  workflowCode: text("workflow_code").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  accepted: boolean("accepted").notNull().default(false),
  callbackDelivered: boolean("callback_delivered").notNull().default(false),
  canonicalStateMutated: boolean("canonical_state_mutated").notNull().default(false),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
