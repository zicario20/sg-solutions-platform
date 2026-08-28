import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m081AuthorizationConfigurations = pgTable("m081_authorization_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  policyActivationEnabled: boolean("policy_activation_enabled").notNull().default(false),
  grantActivationEnabled: boolean("grant_activation_enabled").notNull().default(false),
  decisionEvaluationEnabled: boolean("decision_evaluation_enabled").notNull().default(false),
  enforcementEnabled: boolean("enforcement_enabled").notNull().default(false),
  delegationEnabled: boolean("delegation_enabled").notNull().default(false),
  breakGlassEnabled: boolean("break_glass_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationSubjects = pgTable("m081_authorization_subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull().unique(),
  subjectType: text("subject_type").notNull(),
  identityAuthenticated: boolean("identity_authenticated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationResources = pgTable("m081_authorization_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  resourceReference: text("resource_reference").notNull().unique(),
  resourceType: text("resource_type").notNull(),
  tenantReference: text("tenant_reference"),
  sensitiveClassificationReference: text("sensitive_classification_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationActions = pgTable("m081_authorization_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  actionClass: text("action_class").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081PermissionDefinitions = pgTable("m081_permission_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  actionId: uuid("action_id").notNull(),
  resourceType: text("resource_type").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationRoles = pgTable("m081_authorization_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationRoleVersions = pgTable("m081_authorization_role_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id").notNull(),
  versionNumber: text("version_number").notNull(),
  permissionReferences: jsonb("permission_references").notNull().default([]),
  scopeConfiguration: jsonb("scope_configuration").notNull().default({}),
  status: text("status").notNull().default("draft"),
  immutable: boolean("immutable").notNull().default(true),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081RoleAssignmentRequests = pgTable("m081_role_assignment_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectId: uuid("subject_id").notNull(),
  roleId: uuid("role_id").notNull(),
  status: text("status").notNull().default("draft"),
  effective: boolean("effective").notNull().default(false),
  selfElevationPrevented: boolean("self_elevation_prevented").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081DirectAccessGrantRequests = pgTable("m081_direct_access_grant_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectId: uuid("subject_id").notNull(),
  permissionDefinitionId: uuid("permission_definition_id").notNull(),
  status: text("status").notNull().default("draft"),
  effective: boolean("effective").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081ExplicitDenyDefinitions = pgTable("m081_explicit_deny_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectId: uuid("subject_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationDecisionRequests = pgTable("m081_authorization_decision_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectId: uuid("subject_id").notNull(),
  resourceId: uuid("resource_id").notNull(),
  actionId: uuid("action_id").notNull(),
  purposeReference: text("purpose_reference"),
  contextMinimized: boolean("context_minimized").notNull().default(true),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  containsPrivateReasoning: boolean("contains_private_reasoning").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m081AuthorizationDecisions = pgTable("m081_authorization_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  decisionRequestId: uuid("decision_request_id").notNull(),
  status: text("status").notNull().default("deny"),
  allowed: boolean("allowed").notNull().default(false),
  policyEvaluated: boolean("policy_evaluated").notNull().default(false),
  enforcementApplied: boolean("enforcement_applied").notNull().default(false),
  reason: text("reason").notNull().default("runtime_evaluation_disabled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
