import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m097ObservabilitySystems = pgTable("m097_observability_systems", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  telemetryAccepted: boolean("telemetry_accepted").notNull().default(false),
  alertsActive: boolean("alerts_active").notNull().default(false),
  businessStateAuthority: boolean("business_state_authority").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m097TelemetrySources = pgTable("m097_telemetry_sources", {
  id: uuid("id").primaryKey(),
  observabilitySystemId: uuid("observability_system_id").notNull(),
  code: text("code").notNull().unique(),
  ownerModuleReference: text("owner_module_reference").notNull(),
  environment: text("environment").notNull(),
  status: text("status").notNull(),
  sourceIdentityVerified: boolean("source_identity_verified").notNull().default(false),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m097OperationalMetrics = pgTable("m097_operational_metrics", {
  id: uuid("id").primaryKey(),
  telemetrySourceId: uuid("telemetry_source_id").notNull(),
  code: text("code").notNull().unique(),
  unit: text("unit").notNull(),
  metricType: text("metric_type").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  businessTruthAuthority: boolean("business_truth_authority").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m097TelemetryPipelines = pgTable("m097_telemetry_pipelines", {
  id: uuid("id").primaryKey(),
  observabilitySystemId: uuid("observability_system_id").notNull(),
  telemetrySourceId: uuid("telemetry_source_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  redactionRequired: boolean("redaction_required").notNull().default(true),
  ingestEnabled: boolean("ingest_enabled").notNull().default(false),
  storageEnabled: boolean("storage_enabled").notNull().default(false),
  businessCommandsAccepted: boolean("business_commands_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m097AlertRules = pgTable("m097_alert_rules", {
  id: uuid("id").primaryKey(),
  metricId: uuid("metric_id").notNull(),
  code: text("code").notNull().unique(),
  severity: text("severity").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  incidentConfirmed: boolean("incident_confirmed").notNull().default(false),
  remediationAuthorized: boolean("remediation_authorized").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
