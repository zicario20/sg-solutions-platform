import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m077AuditConfigurations = pgTable("m077_audit_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  durableAppendEnabled: boolean("durable_append_enabled").notNull().default(false),
  externalIngestionEnabled: boolean("external_ingestion_enabled").notNull().default(false),
  searchIndexEnabled: boolean("search_index_enabled").notNull().default(false),
  exportDeliveryEnabled: boolean("export_delivery_enabled").notNull().default(false),
  chainVerificationEnabled: boolean("chain_verification_enabled").notNull().default(false),
  retentionExecutionEnabled: boolean("retention_execution_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m077AuditEventCandidates = pgTable("m077_audit_event_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  eventType: text("event_type").notNull(),
  eventVersion: text("event_version").notNull(),
  actorType: text("actor_type").notNull(),
  actorReference: text("actor_reference").notNull(),
  resourceReferences: jsonb("resource_references").notNull().default([]),
  outcome: text("outcome").notNull().default("requested"),
  correlationId: text("correlation_id"),
  causationId: text("causation_id"),
  persistenceState: text("persistence_state").notNull().default("blocked_runtime_disabled"),
  appended: boolean("appended").notNull().default(false),
  businessTruthAsserted: boolean("business_truth_asserted").notNull().default(false),
  containsRawSecrets: boolean("contains_raw_secrets").notNull().default(false),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  containsPrivateReasoning: boolean("contains_private_reasoning").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m077AuditEventCorrections = pgTable("m077_audit_event_corrections", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  originalEventCandidateId: uuid("original_event_candidate_id").notNull(),
  status: text("status").notNull().default("draft"),
  appendsNewEventWhenActivated: boolean("appends_new_event_when_activated").notNull().default(true),
  originalMutated: boolean("original_mutated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m077AuditIntegrityChecks = pgTable("m077_audit_integrity_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("not_run"),
  chainVerified: boolean("chain_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m077AuditExportRequests = pgTable("m077_audit_export_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  delivered: boolean("delivered").notNull().default(false),
  authorizationEvaluated: boolean("authorization_evaluated").notNull().default(false),
  filters: jsonb("filters").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
