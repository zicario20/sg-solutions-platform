import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const businessFormationAgentConfigurations = pgTable(
  "business_formation_agent_configurations",
  {
    id: uuid("id").primaryKey().notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull(),
    providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
    filingSubmissionEnabled: boolean("filing_submission_enabled").notNull().default(false),
    configuration: jsonb("configuration"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
);

export const businessFormationAgentSessions = pgTable(
  "business_formation_agent_sessions",
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
    requestedJurisdictionReference: text("requested_jurisdiction_reference").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("formation_agent_sessions_client_idx").on(table.clientReference),
    index("formation_agent_sessions_case_idx").on(table.caseReference),
  ],
);

export const businessFormationAgentSourceReferences = pgTable(
  "business_formation_agent_source_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawDocumentStored: boolean("raw_document_stored").notNull().default(false),
    normalizedFormationDataStored: boolean("normalized_formation_data_stored")
      .notNull()
      .default(false),
    providerSearchPerformed: boolean("provider_search_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("formation_agent_sources_session_idx").on(table.sessionId),
    index("formation_agent_sources_case_idx").on(table.caseReference),
  ],
);

export const businessFormationAgentCandidates = pgTable(
  "business_formation_agent_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReferenceId: uuid("source_reference_id").notNull(),
    candidateType: text("candidate_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    ruleSourceReferences: jsonb("rule_source_references").notNull(),
    status: text("status").notNull().default("candidate"),
    legalConclusionConfirmed: boolean("legal_conclusion_confirmed").notNull().default(false),
    nameAvailabilityConfirmed: boolean("name_availability_confirmed").notNull().default(false),
    filingPackagePrepared: boolean("filing_package_prepared").notNull().default(false),
    filingPermitted: boolean("filing_permitted").notNull().default(false),
    einRequestPermitted: boolean("ein_request_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("formation_agent_candidates_session_idx").on(table.sessionId),
    index("formation_agent_candidates_case_idx").on(table.caseReference),
  ],
);

export const businessFormationAgentFilingReadinessAssessments = pgTable(
  "business_formation_agent_filing_readiness_assessments",
  {
    id: uuid("id").primaryKey().notNull(),
    candidateId: uuid("candidate_id").notNull(),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    filingPermitted: boolean("filing_permitted").notNull().default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("formation_agent_readiness_candidate_idx").on(table.candidateId)],
);

export const businessFormationAgentHandoffs = pgTable(
  "business_formation_agent_handoffs",
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
  (table) => [index("formation_agent_handoffs_session_idx").on(table.sessionId)],
);

export const businessFormationAgentRuntimeExecutions = pgTable(
  "business_formation_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("formation_agent_runtime_correlation_idx").on(table.correlationId)],
);

export const businessFormationAgentAuditEvents = pgTable(
  "business_formation_agent_audit_events",
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
    index("formation_agent_audit_session_idx").on(table.sessionId),
    index("formation_agent_audit_correlation_idx").on(table.correlationId),
  ],
);
