import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const skillsSystemConfig = pgTable("skills_system_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelInvocationEnabled: boolean("model_invocation_enabled").notNull().default(false),
  toolExecutionEnabled: boolean("tool_execution_enabled").notNull().default(false),
  workflowDispatchEnabled: boolean("workflow_dispatch_enabled").notNull().default(false),
  externalWritesEnabled: boolean("external_writes_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const skillDefinitions = pgTable("skill_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ownerReference: text("owner_reference").notNull(),
  riskClass: text("risk_class").notNull(),
  executionClass: text("execution_class").notNull(),
  declaredCapabilities: jsonb("declared_capabilities").notNull(),
  status: text("status").notNull().default("registered"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const skillVersions = pgTable("skill_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  skillDefinitionId: uuid("skill_definition_id").notNull(),
  version: text("version").notNull(),
  manifestReference: text("manifest_reference").notNull(),
  manifestDigest: text("manifest_digest").notNull(),
  dependencyCodes: jsonb("dependency_codes").notNull(),
  status: text("status").notNull().default("draft"),
  immutableWhenPublished: boolean("immutable_when_published").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const skillBindings = pgTable("skill_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  skillVersionId: uuid("skill_version_id").notNull(),
  agentManifestReference: text("agent_manifest_reference").notNull(),
  allowedCapabilities: jsonb("allowed_capabilities").notNull(),
  status: text("status").notNull().default("bound_disabled"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const skillInvocationRequests = pgTable("skill_invocation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  bindingId: uuid("binding_id").notNull(),
  correlationId: text("correlation_id").notNull(),
  requestedCapability: text("requested_capability").notNull(),
  contextReferences: jsonb("context_references").notNull(),
  status: text("status").notNull(),
  dispatched: boolean("dispatched").notNull().default(false),
  createdAt: createdAt()
});
