import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const homeBuyingAssistanceAgentConfigurations = pgTable(
  "home_buying_assistance_agent_configurations",
  {
    id: uuid("id").primaryKey().notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull(),
    providerCallsEnabled: boolean("provider_calls_enabled").notNull().default(false),
    mortgageSubmissionEnabled: boolean("mortgage_submission_enabled").notNull().default(false),
    configuration: jsonb("configuration"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
);

export const homeBuyingAssistanceAgentSessions = pgTable(
  "home_buying_assistance_agent_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference").notNull(),
    caseReference: text("case_reference").notNull(),
    identityAssurance: text("identity_assurance").notNull(),
    authorizationStatus: text("authorization_status").notNull(),
    primaryApplicantAuthorized: boolean("primary_applicant_authorized").notNull().default(false),
    coApplicantContextRequested: boolean("co_applicant_context_requested").notNull().default(false),
    coApplicantAuthorizationStatus: text("co_applicant_authorization_status").notNull(),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    serviceEntitled: boolean("service_entitled").notNull().default(false),
    requestedPurchaseJurisdictionReference: text("requested_purchase_jurisdiction_reference")
      .notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("home_buying_agent_sessions_client_idx").on(table.clientReference),
    index("home_buying_agent_sessions_case_idx").on(table.caseReference),
  ],
);

export const homeBuyingAssistanceAgentSourceReferences = pgTable(
  "home_buying_assistance_agent_source_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    rawDocumentStored: boolean("raw_document_stored").notNull().default(false),
    rawFinancialDataStored: boolean("raw_financial_data_stored").notNull().default(false),
    rawCreditDataStored: boolean("raw_credit_data_stored").notNull().default(false),
    rawHouseholdDataStored: boolean("raw_household_data_stored").notNull().default(false),
    providerLookupPerformed: boolean("provider_lookup_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("home_buying_agent_sources_session_idx").on(table.sessionId),
    index("home_buying_agent_sources_case_idx").on(table.caseReference),
  ],
);

export const homeBuyingAssistanceAgentReadinessCandidates = pgTable(
  "home_buying_assistance_agent_readiness_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    candidateType: text("candidate_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    versionedSourceReferences: jsonb("versioned_source_references").notNull(),
    status: text("status").notNull().default("candidate"),
    mortgageEligibilityDetermined: boolean("mortgage_eligibility_determined")
      .notNull()
      .default(false),
    lenderUnderwritingApproved: boolean("lender_underwriting_approved").notNull().default(false),
    preapprovalConfirmed: boolean("preapproval_confirmed").notNull().default(false),
    clearToCloseConfirmed: boolean("clear_to_close_confirmed").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("home_buying_agent_candidates_session_idx").on(table.sessionId),
    index("home_buying_agent_candidates_case_idx").on(table.caseReference),
  ],
);

export const homeBuyingAssistanceAgentApplicationPreparations = pgTable(
  "home_buying_assistance_agent_application_preparations",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    sourceReferenceIds: jsonb("source_reference_ids").notNull(),
    applicationFieldReferenceIds: jsonb("application_field_reference_ids").notNull(),
    status: text("status").notNull().default("reference_only"),
    applicationPrepared: boolean("application_prepared").notNull().default(false),
    borrowerDataVerified: boolean("borrower_data_verified").notNull().default(false),
    providerSubmissionPermitted: boolean("provider_submission_permitted").notNull().default(false),
    providerResponseReceived: boolean("provider_response_received").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("home_buying_agent_preparations_session_idx").on(table.sessionId)],
);

export const homeBuyingAssistanceAgentHandoffs = pgTable(
  "home_buying_assistance_agent_handoffs",
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
  (table) => [index("home_buying_agent_handoffs_session_idx").on(table.sessionId)],
);

export const homeBuyingAssistanceAgentRuntimeExecutions = pgTable(
  "home_buying_assistance_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("home_buying_agent_runtime_correlation_idx").on(table.correlationId)],
);

export const homeBuyingAssistanceAgentAuditEvents = pgTable(
  "home_buying_assistance_agent_audit_events",
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
    index("home_buying_agent_audit_session_idx").on(table.sessionId),
    index("home_buying_agent_audit_correlation_idx").on(table.correlationId),
  ],
);
