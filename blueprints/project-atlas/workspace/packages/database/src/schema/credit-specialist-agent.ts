import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const creditSpecialistAgentConfigurations = pgTable(
  "credit_specialist_agent_configurations",
  {
    id: uuid("id").primaryKey().notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull(),
    providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
    disputeSubmissionEnabled: boolean("dispute_submission_enabled").notNull().default(false),
    configuration: jsonb("configuration"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
);

export const creditSpecialistAgentSessions = pgTable(
  "credit_specialist_agent_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference").notNull(),
    caseReference: text("case_reference"),
    identityAssurance: text("identity_assurance").notNull(),
    authorizationStatus: text("authorization_status").notNull(),
    ownershipAuthorized: boolean("ownership_authorized").notNull().default(false),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("credit_specialist_sessions_client_idx").on(table.clientReference),
    index("credit_specialist_sessions_case_idx").on(table.caseReference),
  ],
);

export const creditReportSnapshotReferences = pgTable(
  "credit_report_snapshot_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawReportStored: boolean("raw_report_stored").notNull().default(false),
    providerRetrievalPerformed: boolean("provider_retrieval_performed").notNull().default(false),
    analysisExecutionPerformed: boolean("analysis_execution_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("credit_report_snapshot_references_session_idx").on(table.sessionId),
    index("credit_report_snapshot_references_case_idx").on(table.caseReference),
  ],
);

export const creditIssueCandidates = pgTable(
  "credit_issue_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    reportSnapshotReferenceId: uuid("report_snapshot_reference_id").notNull(),
    issueType: text("issue_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    factualBasisReferences: jsonb("factual_basis_references").notNull(),
    status: text("status").notNull().default("candidate"),
    disputeSubmissionPermitted: boolean("dispute_submission_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("credit_issue_candidates_session_idx").on(table.sessionId),
    index("credit_issue_candidates_case_idx").on(table.caseReference),
  ],
);

export const creditDisputeReadinessAssessments = pgTable(
  "credit_dispute_readiness_assessments",
  {
    id: uuid("id").primaryKey().notNull(),
    candidateId: uuid("candidate_id").notNull(),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    disputeSubmissionPermitted: boolean("dispute_submission_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("credit_dispute_readiness_candidate_idx").on(table.candidateId)],
);

export const creditSpecialistAgentHandoffs = pgTable(
  "credit_specialist_agent_handoffs",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    route: text("route").notNull(),
    reason: text("reason").notNull(),
    dispatchPermitted: boolean("dispatch_permitted").notNull().default(false),
    externalActionPermitted: boolean("external_action_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("credit_specialist_handoffs_session_idx").on(table.sessionId)],
);

export const creditSpecialistAgentRuntimeExecutions = pgTable(
  "credit_specialist_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("credit_specialist_runtime_correlation_idx").on(table.correlationId)],
);

export const creditSpecialistAgentAuditEvents = pgTable(
  "credit_specialist_agent_audit_events",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    eventType: text("event_type").notNull(),
    actorReference: text("actor_reference").notNull(),
    correlationId: text("correlation_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("credit_specialist_audit_session_idx").on(table.sessionId),
    index("credit_specialist_audit_correlation_idx").on(table.correlationId),
  ],
);
