import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const deploymentSystems = pgTable("m099_deployment_systems", {
  id: uuid("id").primaryKey(), code: text("code").notNull().unique(), status: text("status").notNull(), active: boolean("active").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(), updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentEnvironments = pgTable("m099_deployment_environments", {
  id: uuid("id").primaryKey(), systemId: uuid("system_id").notNull().references(() => deploymentSystems.id), code: text("code").notNull().unique(), environmentType: text("environment_type").notNull(), infrastructureReference: text("infrastructure_reference").notNull(), configScopeReference: text("config_scope_reference").notNull(), secretScopeReference: text("secret_scope_reference").notNull(), status: text("status").notNull(), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentArtifacts = pgTable("m099_deployment_artifacts", {
  id: uuid("id").primaryKey(), systemId: uuid("system_id").notNull().references(() => deploymentSystems.id), code: text("code").notNull().unique(), artifactType: text("artifact_type").notNull(), buildReference: text("build_reference").notNull(), sourceRevisionReference: text("source_revision_reference").notNull(), checksum: text("checksum").notNull(), status: text("status").notNull(), integrityVerified: boolean("integrity_verified").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentConfigBindings = pgTable("m099_deployment_config_bindings", {
  id: uuid("id").primaryKey(), environmentId: uuid("environment_id").notNull().references(() => deploymentEnvironments.id), code: text("code").notNull().unique(), workloadReference: text("workload_reference").notNull(), configVersionReference: text("config_version_reference").notNull(), status: text("status").notNull(), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentSecretBindings = pgTable("m099_deployment_secret_bindings", {
  id: uuid("id").primaryKey(), environmentId: uuid("environment_id").notNull().references(() => deploymentEnvironments.id), code: text("code").notNull().unique(), workloadReference: text("workload_reference").notNull(), secretReference: text("secret_reference").notNull(), injectionMode: text("injection_mode").notNull(), status: text("status").notNull(), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentMigrationPlans = pgTable("m099_deployment_migration_plans", {
  id: uuid("id").primaryKey(), environmentId: uuid("environment_id").notNull().references(() => deploymentEnvironments.id), code: text("code").notNull().unique(), migrationReferences: text("migration_references").array().notNull(), strategy: text("strategy").notNull(), irreversible: boolean("irreversible").notNull().default(false), status: text("status").notNull(), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentReleaseCandidates = pgTable("m099_deployment_release_candidates", {
  id: uuid("id").primaryKey(), systemId: uuid("system_id").notNull().references(() => deploymentSystems.id), code: text("code").notNull().unique(), artifactCodes: text("artifact_codes").array().notNull(), configBindingCodes: text("config_binding_codes").array().notNull(), secretBindingCodes: text("secret_binding_codes").array().notNull(), migrationPlanCodes: text("migration_plan_codes").array().notNull(), compatibilityReference: text("compatibility_reference").notNull(), status: text("status").notNull(), approved: boolean("approved").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
export const deploymentPlans = pgTable("m099_deployment_plans", {
  id: uuid("id").primaryKey(), releaseCandidateId: uuid("release_candidate_id").notNull().references(() => deploymentReleaseCandidates.id), environmentId: uuid("environment_id").notNull().references(() => deploymentEnvironments.id), code: text("code").notNull().unique(), targetReferences: text("target_references").array().notNull(), strategy: text("strategy").notNull(), healthGateReferences: text("health_gate_references").array().notNull(), rollbackTargetReference: text("rollback_target_reference").notNull(), status: text("status").notNull(), createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});