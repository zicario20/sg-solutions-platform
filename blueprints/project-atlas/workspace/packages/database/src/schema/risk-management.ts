import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m079RiskConfigurations = pgTable("m079_risk_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentExecutionEnabled: boolean("assessment_execution_enabled").notNull().default(false),
  scoreCalculationEnabled: boolean("score_calculation_enabled").notNull().default(false),
  appetiteEvaluationEnabled: boolean("appetite_evaluation_enabled").notNull().default(false),
  acceptanceApprovalEnabled: boolean("acceptance_approval_enabled").notNull().default(false),
  treatmentExecutionEnabled: boolean("treatment_execution_enabled").notNull().default(false),
  workflowGatingEnabled: boolean("workflow_gating_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskTaxonomies = pgTable("m079_risk_taxonomies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskRegisters = pgTable("m079_risk_registers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  taxonomyId: uuid("taxonomy_id").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskItems = pgTable("m079_risk_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  registerId: uuid("register_id").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("draft"),
  ownerAssigned: boolean("owner_assigned").notNull().default(false),
  operationalBlockApplied: boolean("operational_block_applied").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskContexts = pgTable("m079_risk_contexts", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull(),
  evidenceReferences: jsonb("evidence_references").notNull().default([]),
  minimized: boolean("minimized").notNull().default(true),
  containsRawSecrets: boolean("contains_raw_secrets").notNull().default(false),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskEvidence = pgTable("m079_risk_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceReference: text("evidence_reference").notNull(),
  checksumReference: text("checksum_reference"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  containsRawSecrets: boolean("contains_raw_secrets").notNull().default(false),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskAssessments = pgTable("m079_risk_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  riskItemId: uuid("risk_item_id").notNull(),
  contextId: uuid("context_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  inherentRisk: text("inherent_risk").notNull().default("unknown"),
  residualRisk: text("residual_risk").notNull().default("unknown"),
  score: text("score"),
  workflowGateUpdated: boolean("workflow_gate_updated").notNull().default(false),
  authorizationDecisionMade: boolean("authorization_decision_made").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskTreatmentPlans = pgTable("m079_risk_treatment_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  riskItemId: uuid("risk_item_id").notNull(),
  strategy: text("strategy").notNull(),
  status: text("status").notNull().default("draft"),
  actionsExecuted: boolean("actions_executed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m079RiskAcceptanceRequests = pgTable("m079_risk_acceptance_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  riskItemId: uuid("risk_item_id").notNull(),
  status: text("status").notNull().default("draft"),
  accepted: boolean("accepted").notNull().default(false),
  approvalGranted: boolean("approval_granted").notNull().default(false),
  authorizationDecisionMade: boolean("authorization_decision_made").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
