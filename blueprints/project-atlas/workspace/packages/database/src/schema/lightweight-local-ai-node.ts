import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m094LightweightAiNodes = pgTable("m094_lightweight_ai_nodes", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  homelabNodeReference: text("homelab_node_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  ready: boolean("ready").notNull().default(false),
  runtimeConnected: boolean("runtime_connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LocalAiRuntimes = pgTable("m094_local_ai_runtimes", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  engineReference: text("engine_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  endpointExposed: boolean("endpoint_exposed").notNull().default(false),
  modelLoaded: boolean("model_loaded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LightweightModelProfiles = pgTable("m094_lightweight_model_profiles", {
  id: uuid("id").primaryKey(),
  runtimeId: uuid("runtime_id").notNull(),
  code: text("code").notNull().unique(),
  capabilityTier: text("capability_tier").notNull(),
  artifactChecksumReference: text("artifact_checksum_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  taskCertified: boolean("task_certified").notNull().default(false),
  toolAuthorityGranted: boolean("tool_authority_granted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LightweightInferenceGateways = pgTable("m094_lightweight_inference_gateways", {
  id: uuid("id").primaryKey(),
  nodeId: uuid("node_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  endpointActive: boolean("endpoint_active").notNull().default(false),
  authorizationEnforced: boolean("authorization_enforced").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LightweightContextPackages = pgTable("m094_lightweight_context_packages", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  minimized: boolean("minimized").notNull().default(true),
  rawClientDataStored: boolean("raw_client_data_stored").notNull().default(false),
  privateChainOfThoughtStored: boolean("private_chain_of_thought_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LightweightInferenceRequests = pgTable("m094_lightweight_inference_requests", {
  id: uuid("id").primaryKey(),
  gatewayId: uuid("gateway_id").notNull(),
  modelProfileId: uuid("model_profile_id").notNull(),
  contextPackageId: uuid("context_package_id").notNull(),
  code: text("code").notNull().unique(),
  taskClass: text("task_class").notNull(),
  status: text("status").notNull(),
  dispatched: boolean("dispatched").notNull().default(false),
  modelCalled: boolean("model_called").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m094LightweightToolRequests = pgTable("m094_lightweight_tool_requests", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  requestedToolReference: text("requested_tool_reference").notNull(),
  status: text("status").notNull(),
  toolExecutionRequested: boolean("tool_execution_requested").notNull().default(false),
  modelTextTrustedForExecution: boolean("model_text_trusted_for_execution").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
