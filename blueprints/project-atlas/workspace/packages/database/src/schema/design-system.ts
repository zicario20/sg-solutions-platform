import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m087DesignSystemConfigurations = pgTable("m087_design_system_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  tokenSource: text("token_source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m087DesignTokenSets = pgTable("m087_design_token_sets", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  artifactReference: text("artifact_reference"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m087DesignComponents = pgTable("m087_design_components", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  accessibilityContractReference: text("accessibility_contract_reference").notNull(),
  implementationRegistered: boolean("implementation_registered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m087DesignPatterns = pgTable("m087_design_patterns", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  surface: text("surface").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m087DesignReleaseRequests = pgTable("m087_design_release_requests", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  packageActivated: boolean("package_activated").notNull().default(false),
  tokenBundleDistributed: boolean("token_bundle_distributed").notNull().default(false),
  visualReviewCompleted: boolean("visual_review_completed").notNull().default(false),
  accessibilityReviewCompleted: boolean("accessibility_review_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
