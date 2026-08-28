import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const jurisdictionAutomationConfigurations = pgTable("jurisdiction_automation_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  environment: text("environment").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  rulePublicationEnabled: boolean("rule_publication_enabled").notNull().default(false),
  resolutionEnabled: boolean("resolution_enabled").notNull().default(false),
  sourceRefreshEnabled: boolean("source_refresh_enabled").notNull().default(false),
  portalSelectionEnabled: boolean("portal_selection_enabled").notNull().default(false),
  browserBindingDispatchEnabled: boolean("browser_binding_dispatch_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictions = pgTable("jurisdictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  level: text("level").notNull(),
  status: text("status").notNull().default("draft"),
  activeForResolution: boolean("active_for_resolution").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionSourceBundles = pgTable("jurisdiction_source_bundles", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  sourceSnapshotReferences: jsonb("source_snapshot_references").notNull().default([]),
  freshnessStatus: text("freshness_status").notNull().default("unknown"),
  approvedForAutomation: boolean("approved_for_automation").notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionRulePacks = pgTable("jurisdiction_rule_packs", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  sourceBundleCode: text("source_bundle_code").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"),
  sourceGrounded: boolean("source_grounded").notNull().default(false),
  approvedForUse: boolean("approved_for_use").notNull().default(false),
  immutableAfterApproval: boolean("immutable_after_approval").notNull().default(true),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionResolutionRequests = pgTable("jurisdiction_resolution_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestCode: text("request_code").notNull().unique(),
  serviceCode: text("service_code").notNull(),
  asOfDate: text("as_of_date").notNull(),
  subjectReferences: jsonb("subject_references").notNull().default([]),
  factStates: jsonb("fact_states").notNull().default([]),
  containsPreciseLocation: boolean("contains_precise_location").notNull().default(false),
  status: text("status").notNull().default("captured"),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionResolutions = pgTable("jurisdiction_resolutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestCode: text("request_code").notNull(),
  rulePackCode: text("rule_pack_code").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  applicability: text("applicability").notNull().default("unknown"),
  legalAdviceProvided: boolean("legal_advice_provided").notNull().default(false),
  finalLegalDetermination: boolean("final_legal_determination").notNull().default(false),
  portalSubmissionAuthorized: boolean("portal_submission_authorized").notNull().default(false),
  sourceFreshness: text("source_freshness").notNull().default("unknown"),
  missingFactCodes: jsonb("missing_fact_codes").notNull().default([]),
  needsHumanReview: boolean("needs_human_review").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionConflicts = pgTable("jurisdiction_conflicts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  requestCode: text("request_code").notNull(),
  conflictingSourceReferences: jsonb("conflicting_source_references").notNull().default([]),
  status: text("status").notNull().default("review_required"),
  resolvedHeuristically: boolean("resolved_heuristically").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jurisdictionPortalBindings = pgTable("jurisdiction_portal_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  rulePackCode: text("rule_pack_code").notNull(),
  status: text("status").notNull().default("draft"),
  portalSelected: boolean("portal_selected").notNull().default(false),
  browserDispatchAuthorized: boolean("browser_dispatch_authorized").notNull().default(false),
  submissionAuthorized: boolean("submission_authorized").notNull().default(false),
  createdByActorId: text("created_by_actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
