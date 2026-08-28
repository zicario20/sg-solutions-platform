import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const browserAutomationConfigurations = pgTable("browser_automation_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  environment: text("environment").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  browserLaunchEnabled: boolean("browser_launch_enabled").notNull().default(false),
  navigationEnabled: boolean("navigation_enabled").notNull().default(false),
  credentialInjectionEnabled: boolean("credential_injection_enabled").notNull().default(false),
  fileTransferEnabled: boolean("file_transfer_enabled").notNull().default(false),
  actionExecutionEnabled: boolean("action_execution_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserWorkerProfiles = pgTable("browser_worker_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  status: text("status").notNull().default("disabled"),
  isolatedRuntimeConfigured: boolean("isolated_runtime_configured").notNull().default(false),
  browserInstalled: boolean("browser_installed").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserProfiles = pgTable("browser_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  workerCode: text("worker_code").notNull(),
  status: text("status").notNull().default("draft"),
  authenticatedIdentityBound: boolean("authenticated_identity_bound").notNull().default(false),
  cookiesPersisted: boolean("cookies_persisted").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserNetworkPolicies = pgTable("browser_network_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  allowedOrigins: jsonb("allowed_origins").notNull().default([]),
  status: text("status").notNull().default("draft"),
  egressActive: boolean("egress_active").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserSessions = pgTable("browser_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  profileCode: text("profile_code").notNull(),
  workerCode: text("worker_code").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  browserLaunched: boolean("browser_launched").notNull().default(false),
  cookiesLoaded: boolean("cookies_loaded").notNull().default(false),
  credentialsInjected: boolean("credentials_injected").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserNavigationRequests = pgTable("browser_navigation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestCode: text("request_code").notNull().unique(),
  profileCode: text("profile_code").notNull(),
  networkPolicyCode: text("network_policy_code").notNull(),
  destinationOrigin: text("destination_origin").notNull(),
  destinationPathRecorded: boolean("destination_path_recorded").notNull().default(false),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  navigationAttempted: boolean("navigation_attempted").notNull().default(false),
  pageTrusted: boolean("page_trusted").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserActionContracts = pgTable("browser_action_contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  workflowInstanceReference: text("workflow_instance_reference").notNull(),
  actionType: text("action_type").notNull(),
  purpose: text("purpose").notNull(),
  authorizedByWorkflow: boolean("authorized_by_workflow").notNull().default(false),
  executionAllowed: boolean("execution_allowed").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserActionPlans = pgTable("browser_action_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  planCode: text("plan_code").notNull().unique(),
  actionContractCode: text("action_contract_code").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  externalActionAttempted: boolean("external_action_attempted").notNull().default(false),
  requiresReconciliationBeforeRetry: boolean("requires_reconciliation_before_retry").notNull().default(true),
  result: text("result").notNull().default("not_started"),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const browserEvidenceRecords = pgTable("browser_evidence_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceCode: text("evidence_code").notNull().unique(),
  actionContractCode: text("action_contract_code").notNull(),
  artifactReference: text("artifact_reference").notNull(),
  trustLevel: text("trust_level").notNull().default("untrusted"),
  canonicalFact: boolean("canonical_fact").notNull().default(false),
  screenshotStored: boolean("screenshot_stored").notNull().default(false),
  metadata: jsonb("metadata").notNull().default({}),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
