import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const workflowEngineConfiguration = pgTable("workflow_engine_configuration", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull(),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const workflowDefinitions = pgTable("workflow_definitions", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  workflowCode: text("workflow_code").notNull(),
  displayName: text("display_name").notNull(),
  purpose: text("purpose").notNull(),
  domainScope: text("domain_scope").notNull(),
  triggerTypes: jsonb("trigger_types").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const workflowDefinitionVersions = pgTable("workflow_definition_versions", {
  id: uuid("id").primaryKey(),
  workflowDefinitionId: uuid("workflow_definition_id").notNull(),
  version: text("version").notNull(),
  contentHash: text("content_hash").notNull(),
  steps: jsonb("steps").notNull(),
  transitions: jsonb("transitions").notNull(),
  status: text("status").notNull(),
  immutable: boolean("immutable").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const workflowInstances = pgTable("workflow_instances", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  definitionVersionId: uuid("definition_version_id").notNull(),
  workflowCode: text("workflow_code").notNull(),
  subjectReferences: jsonb("subject_references").notNull(),
  inputSnapshotReference: text("input_snapshot_reference").notNull(),
  status: text("status").notNull(),
  stateVersion: text("state_version").notNull(),
  correlationId: text("correlation_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const workflowStepExecutions = pgTable("workflow_step_executions", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  workflowInstanceId: uuid("workflow_instance_id").notNull(),
  stepCode: text("step_code").notNull(),
  attempt: text("attempt").notNull(),
  status: text("status").notNull(),
  inputSnapshotReference: text("input_snapshot_reference"),
  outputReference: text("output_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const workflowWaitStates = pgTable("workflow_wait_states", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  workflowInstanceId: uuid("workflow_instance_id").notNull(),
  stepExecutionId: uuid("step_execution_id").notNull(),
  waitType: text("wait_type").notNull(),
  waitKey: text("wait_key").notNull(),
  expectedSignalTypes: jsonb("expected_signal_types").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const workflowSignals = pgTable("workflow_signals", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  workflowInstanceId: uuid("workflow_instance_id"),
  signalType: text("signal_type").notNull(),
  correlationStatus: text("correlation_status").notNull(),
  verificationStatus: text("verification_status").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  status: text("status").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
});

export const workflowOutboxEvents = pgTable("workflow_outbox_events", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  workflowInstanceId: uuid("workflow_instance_id").notNull(),
  eventType: text("event_type").notNull(),
  correlationId: text("correlation_id").notNull(),
  status: text("status").notNull(),
  published: boolean("published").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
