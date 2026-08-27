import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const taxSpecialistAgentConfigurations = pgTable("tax_specialist_agent_configurations", {
  id: uuid("id").primaryKey().notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
  eFileEnabled: boolean("efile_enabled").notNull().default(false),
  configuration: jsonb("configuration"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const taxSpecialistAgentSessions = pgTable(
  "tax_specialist_agent_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference").notNull(),
    caseReference: text("case_reference"),
    identityAssurance: text("identity_assurance").notNull(),
    authorizationStatus: text("authorization_status").notNull(),
    ownershipAuthorized: boolean("ownership_authorized").notNull().default(false),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    serviceEntitled: boolean("service_entitled").notNull().default(false),
    taxYear: text("tax_year").notNull(),
    jurisdictionReference: text("jurisdiction_reference").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("tax_specialist_sessions_client_idx").on(table.clientReference),
    index("tax_specialist_sessions_case_idx").on(table.caseReference),
  ],
);

export const taxSpecialistSourceReferences = pgTable(
  "tax_specialist_source_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawDocumentStored: boolean("raw_document_stored").notNull().default(false),
    normalizedTaxDataStored: boolean("normalized_tax_data_stored").notNull().default(false),
    providerImportPerformed: boolean("provider_import_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("tax_specialist_sources_session_idx").on(table.sessionId),
    index("tax_specialist_sources_case_idx").on(table.caseReference),
  ],
);

export const taxSpecialistIssueCandidates = pgTable(
  "tax_specialist_issue_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReferenceId: uuid("source_reference_id").notNull(),
    issueType: text("issue_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    ruleSourceReferences: jsonb("rule_source_references").notNull(),
    status: text("status").notNull().default("candidate"),
    taxPositionConfirmed: boolean("tax_position_confirmed").notNull().default(false),
    returnLinePrepared: boolean("return_line_prepared").notNull().default(false),
    filingPermitted: boolean("filing_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("tax_specialist_candidates_session_idx").on(table.sessionId),
    index("tax_specialist_candidates_case_idx").on(table.caseReference),
  ],
);

export const taxSpecialistFilingReadinessAssessments = pgTable(
  "tax_specialist_filing_readiness_assessments",
  {
    id: uuid("id").primaryKey().notNull(),
    candidateId: uuid("candidate_id").notNull(),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    filingPermitted: boolean("filing_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("tax_specialist_filing_readiness_candidate_idx").on(table.candidateId)],
);

export const taxSpecialistAgentHandoffs = pgTable(
  "tax_specialist_agent_handoffs",
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
  (table) => [index("tax_specialist_handoffs_session_idx").on(table.sessionId)],
);

export const taxSpecialistAgentRuntimeExecutions = pgTable(
  "tax_specialist_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("tax_specialist_runtime_correlation_idx").on(table.correlationId)],
);

export const taxSpecialistAgentAuditEvents = pgTable(
  "tax_specialist_agent_audit_events",
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
    index("tax_specialist_audit_session_idx").on(table.sessionId),
    index("tax_specialist_audit_correlation_idx").on(table.correlationId),
  ],
);
