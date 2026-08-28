import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const jobQueueConfigurations = pgTable("job_queue_configurations", {
  id: uuid("id").defaultRandom().primaryKey(), environment: text("environment").notNull(), runtimeEnabled: boolean("runtime_enabled").notNull().default(false), backendConnectionEnabled: boolean("backend_connection_enabled").notNull().default(false), workerExecutionEnabled: boolean("worker_execution_enabled").notNull().default(false), schedulingEnabled: boolean("scheduling_enabled").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobDefinitions = pgTable("job_definitions", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), displayName: text("display_name").notNull(), ownerModule: text("owner_module").notNull(), riskClass: text("risk_class").notNull(), handlerType: text("handler_type").notNull(), status: text("status").notNull().default("draft"), executable: boolean("executable").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobDefinitionVersions = pgTable("job_definition_versions", {
  id: uuid("id").defaultRandom().primaryKey(), jobCode: text("job_code").notNull(), version: text("version").notNull(), inputContractCode: text("input_contract_code").notNull(), outputContractCode: text("output_contract_code").notNull(), status: text("status").notNull().default("draft"), immutableAfterApproval: boolean("immutable_after_approval").notNull().default(true), handlerExecutable: boolean("handler_executable").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobPayloadContracts = pgTable("job_payload_contracts", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), referenceKeys: jsonb("reference_keys").notNull().default([]), containsRawSecret: boolean("contains_raw_secret").notNull().default(false), containsRawBinary: boolean("contains_raw_binary").notNull().default(false), containsPrivateReasoning: boolean("contains_private_reasoning").notNull().default(false), status: text("status").notNull().default("draft"), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobQueues = pgTable("job_queues", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), queueClass: text("queue_class").notNull(), status: text("status").notNull().default("disabled"), physicalBackendBound: boolean("physical_backend_bound").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobWorkerProfiles = pgTable("job_worker_profiles", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull().unique(), allowedJobCodes: jsonb("allowed_job_codes").notNull().default([]), status: text("status").notNull().default("disabled"), workerRuntimeConnected: boolean("worker_runtime_connected").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobRequests = pgTable("job_requests", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull().unique(), tenantId: text("tenant_id").notNull(), jobCode: text("job_code").notNull(), jobVersion: text("job_version").notNull(), payloadContractCode: text("payload_contract_code").notNull(), idempotencyKey: text("idempotency_key").notNull(), status: text("status").notNull().default("blocked_runtime_disabled"), dispatched: boolean("dispatched").notNull().default(false), businessOutcomeAsserted: boolean("business_outcome_asserted").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobAttempts = pgTable("job_attempts", {
  id: uuid("id").defaultRandom().primaryKey(), attemptCode: text("attempt_code").notNull().unique(), requestCode: text("request_code").notNull(), status: text("status").notNull().default("not_started"), leaseAcquired: boolean("lease_acquired").notNull().default(false), sideEffectBoundaryReached: boolean("side_effect_boundary_reached").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobUnknownOutcomes = pgTable("job_unknown_outcomes", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull(), operationReference: text("operation_reference").notNull(), status: text("status").notNull().default("reconciliation_required"), safeToRequeue: boolean("safe_to_requeue").notNull().default(false), externalEffectState: text("external_effect_state").notNull().default("unknown"), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobReconciliationRecords = pgTable("job_reconciliation_records", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull(), status: text("status").notNull().default("not_started"), outcome: text("outcome").notNull().default("unknown"), requeueAllowed: boolean("requeue_allowed").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const jobDeadLetterRecords = pgTable("job_dead_letter_records", {
  id: uuid("id").defaultRandom().primaryKey(), requestCode: text("request_code").notNull(), reasonCode: text("reason_code").notNull(), status: text("status").notNull().default("draft"), businessOutcomeAsserted: boolean("business_outcome_asserted").notNull().default(false), createdByActorId: text("created_by_actor_id").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
