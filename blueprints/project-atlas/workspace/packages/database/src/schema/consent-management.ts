import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m078ConsentConfigurations = pgTable("m078_consent_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  presentationDeliveryEnabled: boolean("presentation_delivery_enabled").notNull().default(false),
  decisionCaptureEnabled: boolean("decision_capture_enabled").notNull().default(false),
  grantActivationEnabled: boolean("grant_activation_enabled").notNull().default(false),
  withdrawalPropagationEnabled: boolean("withdrawal_propagation_enabled").notNull().default(false),
  preActionGatingEnabled: boolean("pre_action_gating_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentDefinitions = pgTable("m078_consent_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  consentType: text("consent_type").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentDefinitionVersions = pgTable("m078_consent_definition_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  definitionId: uuid("definition_id").notNull(),
  versionNumber: text("version_number").notNull(),
  presentationReference: text("presentation_reference").notNull(),
  status: text("status").notNull().default("draft"),
  immutable: boolean("immutable").notNull().default(true),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentScopes = pgTable("m078_consent_scopes", {
  id: uuid("id").defaultRandom().primaryKey(),
  definitionVersionId: uuid("definition_version_id").notNull(),
  purposes: jsonb("purposes").notNull().default([]),
  dataCategoryReferences: jsonb("data_category_references").notNull().default([]),
  recipientReferences: jsonb("recipient_references").notNull().default([]),
  channelReferences: jsonb("channel_references").notNull().default([]),
  effectiveForDataSharing: boolean("effective_for_data_sharing").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentSubjects = pgTable("m078_consent_subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull(),
  subjectType: text("subject_type").notNull(),
  identityBindingVerified: boolean("identity_binding_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentPresentations = pgTable("m078_consent_presentations", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  definitionVersionId: uuid("definition_version_id").notNull(),
  subjectId: uuid("subject_id").notNull(),
  status: text("status").notNull().default("not_presented_runtime_disabled"),
  presented: boolean("presented").notNull().default(false),
  evidenceCaptured: boolean("evidence_captured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentDecisionCandidates = pgTable("m078_consent_decision_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectId: uuid("subject_id").notNull(),
  decisionType: text("decision_type").notNull(),
  actorKind: text("actor_kind").notNull(),
  status: text("status").notNull().default("recording_blocked_runtime_disabled"),
  effective: boolean("effective").notNull().default(false),
  validConsentEstablished: boolean("valid_consent_established").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentGrants = pgTable("m078_consent_grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  decisionCandidateId: uuid("decision_candidate_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("not_effective_runtime_disabled"),
  effective: boolean("effective").notNull().default(false),
  allowsDataSharing: boolean("allows_data_sharing").notNull().default(false),
  allowsPreAction: boolean("allows_pre_action").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentWithdrawals = pgTable("m078_consent_withdrawals", {
  id: uuid("id").defaultRandom().primaryKey(),
  decisionCandidateId: uuid("decision_candidate_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  propagationCompleted: boolean("propagation_completed").notNull().default(false),
  downstreamActionsStopped: boolean("downstream_actions_stopped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m078ConsentCheckResults = pgTable("m078_consent_check_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull(),
  purposeReference: text("purpose_reference").notNull(),
  status: text("status").notNull().default("unknown"),
  allowed: boolean("allowed").notNull().default(false),
  reason: text("reason").notNull().default("runtime_evaluation_disabled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
