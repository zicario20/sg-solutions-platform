import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m082PiiProtectionConfigurations = pgTable("m082_pii_protection_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  policyActivationEnabled: boolean("policy_activation_enabled").notNull().default(false),
  fieldFilteringEnabled: boolean("field_filtering_enabled").notNull().default(false),
  maskingEnabled: boolean("masking_enabled").notNull().default(false),
  tokenizationEnabled: boolean("tokenization_enabled").notNull().default(false),
  redactionExecutionEnabled: boolean("redaction_execution_enabled").notNull().default(false),
  exportDeliveryEnabled: boolean("export_delivery_enabled").notNull().default(false),
  sharingExecutionEnabled: boolean("sharing_execution_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082DataClassifications = pgTable("m082_data_classifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  classificationLevel: text("classification_level").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082DataCategories = pgTable("m082_data_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  classificationId: uuid("classification_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082SensitiveFieldPolicies = pgTable("m082_sensitive_field_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  categoryId: uuid("category_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  maskingConfigured: boolean("masking_configured").notNull().default(false),
  tokenizationConfigured: boolean("tokenization_configured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082SensitiveFieldRegistry = pgTable("m082_sensitive_field_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldReference: text("field_reference").notNull().unique(),
  policyId: uuid("policy_id").notNull(),
  status: text("status").notNull().default("draft"),
  rawValueStored: boolean("raw_value_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082DataPurposes = pgTable("m082_data_purposes", {
  id: uuid("id").defaultRandom().primaryKey(),
  purposeReference: text("purpose_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082PiiAccessCheckResults = pgTable("m082_pii_access_check_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull(),
  fieldReference: text("field_reference").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull().default("review_required"),
  allowed: boolean("allowed").notNull().default(false),
  fieldValueReleased: boolean("field_value_released").notNull().default(false),
  reason: text("reason").notNull().default("classification_or_policy_runtime_disabled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082PiiExportRequests = pgTable("m082_pii_export_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectReference: text("subject_reference").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  delivered: boolean("delivered").notNull().default(false),
  rawDataIncluded: boolean("raw_data_included").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082PiiSharingRequests = pgTable("m082_pii_sharing_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  recipientReference: text("recipient_reference").notNull(),
  purposeReference: text("purpose_reference").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  executed: boolean("executed").notNull().default(false),
  consentVerified: boolean("consent_verified").notNull().default(false),
  dataCategoryReferences: jsonb("data_category_references").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m082PiiRedactionPlans = pgTable("m082_pii_redaction_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  artifactReference: text("artifact_reference").notNull(),
  status: text("status").notNull().default("draft"),
  redactionExecuted: boolean("redaction_executed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
