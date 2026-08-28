import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m076ComplianceConfigurations = pgTable("m076_compliance_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceRefreshEnabled: boolean("source_refresh_enabled").notNull().default(false),
  applicabilityResolutionEnabled: boolean("applicability_resolution_enabled").notNull().default(false),
  assessmentExecutionEnabled: boolean("assessment_execution_enabled").notNull().default(false),
  findingClosureEnabled: boolean("finding_closure_enabled").notNull().default(false),
  exceptionApprovalEnabled: boolean("exception_approval_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceRequirements = pgTable("m076_compliance_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  versionNumber: text("version_number").notNull(),
  sourceReferences: jsonb("source_references").notNull().default([]),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076CompliancePolicies = pgTable("m076_compliance_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  versionNumber: text("version_number").notNull(),
  configurationSnapshot: jsonb("configuration_snapshot").notNull().default({}),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceControls = pgTable("m076_compliance_controls", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  configurationSnapshot: jsonb("configuration_snapshot").notNull().default({}),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceSubjectContexts = pgTable("m076_compliance_subject_contexts", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectReference: text("subject_reference").notNull(),
  jurisdictionReference: text("jurisdiction_reference"),
  asOfDate: timestamp("as_of_date", { withTimezone: true }).notNull(),
  minimized: boolean("minimized").notNull().default(true),
  containsRawPii: boolean("contains_raw_pii").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceApplicabilityResults = pgTable("m076_compliance_applicability_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requirementId: uuid("requirement_id").notNull(),
  subjectContextId: uuid("subject_context_id").notNull(),
  status: text("status").notNull().default("unknown"),
  ruleApplied: boolean("rule_applied").notNull().default(false),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceAssessments = pgTable("m076_compliance_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  subjectContextId: uuid("subject_context_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  overallStatus: text("overall_status").notNull().default("unknown"),
  legalConclusionProvided: boolean("legal_conclusion_provided").notNull().default(false),
  workflowGateUpdated: boolean("workflow_gate_updated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceEvidence = pgTable("m076_compliance_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull(),
  evidenceReference: text("evidence_reference").notNull(),
  checksumReference: text("checksum_reference"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  containsRawSecrets: boolean("contains_raw_secrets").notNull().default(false),
  containsBroadPii: boolean("contains_broad_pii").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceFindings = pgTable("m076_compliance_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  closed: boolean("closed").notNull().default(false),
  automaticallyRemediated: boolean("automatically_remediated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m076ComplianceExceptionRequests = pgTable("m076_compliance_exception_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requirementId: uuid("requirement_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  approved: boolean("approved").notNull().default(false),
  changesRequirement: boolean("changes_requirement").notNull().default(false),
  establishesCompliance: boolean("establishes_compliance").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
