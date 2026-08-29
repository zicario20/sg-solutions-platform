import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m090SystemConfigurations = pgTable("m090_system_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  runtimeResolutionEnabled: boolean("runtime_resolution_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m090ConfigurationDefinitions = pgTable("m090_configuration_definitions", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  configurationKey: text("configuration_key").notNull().unique(),
  scope: text("scope").notNull(),
  valueType: text("value_type").notNull(),
  sensitivity: text("sensitivity").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  acceptsRawSecret: boolean("accepts_raw_secret").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m090ConfigurationValueCandidates = pgTable("m090_configuration_value_candidates", {
  id: uuid("id").primaryKey(),
  definitionId: uuid("definition_id").notNull(),
  code: text("code").notNull().unique(),
  valueReference: text("value_reference").notNull(),
  status: text("status").notNull(),
  validationExecuted: boolean("validation_executed").notNull().default(false),
  runtimeResolved: boolean("runtime_resolved").notNull().default(false),
  rawSecretStored: boolean("raw_secret_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m090ConfigurationChangeSets = pgTable("m090_configuration_change_sets", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  validationCompleted: boolean("validation_completed").notNull().default(false),
  approvalVerified: boolean("approval_verified").notNull().default(false),
  activationExecuted: boolean("activation_executed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m090FeatureFlags = pgTable("m090_feature_flags", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  grantsAuthorization: boolean("grants_authorization").notNull().default(false),
  killSwitchTriggered: boolean("kill_switch_triggered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m090SourcedConfigurationFacts = pgTable("m090_sourced_configuration_facts", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  sourceReference: text("source_reference").notNull(),
  status: text("status").notNull(),
  freshnessVerified: boolean("freshness_verified").notNull().default(false),
  rawSourceDataStored: boolean("raw_source_data_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
