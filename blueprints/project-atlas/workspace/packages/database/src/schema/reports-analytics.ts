import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m092ReportsAnalyticsConfigurations = pgTable("m092_reports_analytics_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  domainTruthOwnedByDomainModules: boolean("domain_truth_owned_by_domain_modules").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092AnalyticalDatasets = pgTable("m092_analytical_datasets", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  grain: text("grain").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  rawPiiProjection: boolean("raw_pii_projection").notNull().default(false),
  dataRefreshEnabled: boolean("data_refresh_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092Metrics = pgTable("m092_metrics", {
  id: uuid("id").primaryKey(),
  datasetId: uuid("dataset_id").notNull(),
  code: text("code").notNull().unique(),
  formulaReference: text("formula_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  arbitrarySqlAccepted: boolean("arbitrary_sql_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092Reports = pgTable("m092_reports", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  datasetId: uuid("dataset_id").notNull(),
  code: text("code").notNull().unique(),
  surface: text("surface").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092AnalyticsProviders = pgTable("m092_analytics_providers", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  connected: boolean("connected").notNull().default(false),
  credentialsLoaded: boolean("credentials_loaded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092ReportExecutionRequests = pgTable("m092_report_execution_requests", {
  id: uuid("id").primaryKey(),
  reportId: uuid("report_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  queryPlanned: boolean("query_planned").notNull().default(false),
  executed: boolean("executed").notNull().default(false),
  resultMaterialized: boolean("result_materialized").notNull().default(false),
  canonicalDataMutated: boolean("canonical_data_mutated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m092AnalyticsExportRequests = pgTable("m092_analytics_export_requests", {
  id: uuid("id").primaryKey(),
  reportId: uuid("report_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  approvalVerified: boolean("approval_verified").notNull().default(false),
  artifactGenerated: boolean("artifact_generated").notNull().default(false),
  delivered: boolean("delivered").notNull().default(false),
  rawRowsStored: boolean("raw_rows_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
