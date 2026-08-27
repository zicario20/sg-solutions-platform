import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const businessFundingAgentConfigurations = pgTable("business_funding_agent_configurations", {
  id: uuid("id").primaryKey().notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
  applicationSubmissionEnabled: boolean("application_submission_enabled").notNull().default(false),
  configuration: jsonb("configuration"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const businessFundingAgentSessions = pgTable(
  "business_funding_agent_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference").notNull(),
    organizationReference: text("organization_reference").notNull(),
    caseReference: text("case_reference"),
    identityAssurance: text("identity_assurance").notNull(),
    authorizationStatus: text("authorization_status").notNull(),
    businessAuthorityAuthorized: boolean("business_authority_authorized").notNull().default(false),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    serviceEntitled: boolean("service_entitled").notNull().default(false),
    personalGuarantorInScope: boolean("personal_guarantor_in_scope").notNull().default(false),
    personalGuarantorAuthorizationStatus: text("personal_guarantor_authorization_status").notNull(),
    personalCreditInScope: boolean("personal_credit_in_scope").notNull().default(false),
    personalCreditAuthorizationStatus: text("personal_credit_authorization_status").notNull(),
    personalCreditPurposeAuthorized: boolean("personal_credit_purpose_authorized")
      .notNull()
      .default(false),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("funding_agent_sessions_client_idx").on(table.clientReference),
    index("funding_agent_sessions_organization_idx").on(table.organizationReference),
    index("funding_agent_sessions_case_idx").on(table.caseReference),
  ],
);

export const businessFundingAgentSourceReferences = pgTable(
  "business_funding_agent_source_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawDocumentStored: boolean("raw_document_stored").notNull().default(false),
    normalizedFundingDataStored: boolean("normalized_funding_data_stored").notNull().default(false),
    providerImportPerformed: boolean("provider_import_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("funding_agent_sources_session_idx").on(table.sessionId),
    index("funding_agent_sources_case_idx").on(table.caseReference),
  ],
);

export const businessFundingAgentReadinessCandidates = pgTable(
  "business_funding_agent_readiness_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReferenceId: uuid("source_reference_id").notNull(),
    candidateType: text("candidate_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    providerRequirementReferences: jsonb("provider_requirement_references").notNull(),
    status: text("status").notNull().default("candidate"),
    eligibilityConfirmed: boolean("eligibility_confirmed").notNull().default(false),
    underwritingDecisionMade: boolean("underwriting_decision_made").notNull().default(false),
    prequalificationConfirmed: boolean("prequalification_confirmed").notNull().default(false),
    applicationPrepared: boolean("application_prepared").notNull().default(false),
    applicationSubmissionPermitted: boolean("application_submission_permitted")
      .notNull()
      .default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("funding_agent_candidates_session_idx").on(table.sessionId),
    index("funding_agent_candidates_case_idx").on(table.caseReference),
  ],
);

export const businessFundingAgentApplicationReadinessAssessments = pgTable(
  "business_funding_agent_application_readiness_assessments",
  {
    id: uuid("id").primaryKey().notNull(),
    candidateId: uuid("candidate_id").notNull(),
    status: text("status").notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    applicationSubmissionPermitted: boolean("application_submission_permitted")
      .notNull()
      .default(false),
    externalDispatchPermitted: boolean("external_dispatch_permitted").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [index("funding_agent_readiness_candidate_idx").on(table.candidateId)],
);

export const businessFundingAgentHandoffs = pgTable(
  "business_funding_agent_handoffs",
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
  (table) => [index("funding_agent_handoffs_session_idx").on(table.sessionId)],
);

export const businessFundingAgentRuntimeExecutions = pgTable(
  "business_funding_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("funding_agent_runtime_correlation_idx").on(table.correlationId)],
);

export const businessFundingAgentAuditEvents = pgTable(
  "business_funding_agent_audit_events",
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
    index("funding_agent_audit_session_idx").on(table.sessionId),
    index("funding_agent_audit_correlation_idx").on(table.correlationId),
  ],
);
