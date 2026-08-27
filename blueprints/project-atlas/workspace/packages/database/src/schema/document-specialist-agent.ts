import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const createdAtColumn = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAtColumn = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const documentSpecialistAgentConfigurations = pgTable(
  "document_specialist_agent_configurations",
  {
    id: uuid("id").primaryKey().notNull(),
    code: text("code").notNull().unique(),
    status: text("status").notNull(),
    ocrEnabled: boolean("ocr_enabled").notNull().default(false),
    documentGenerationEnabled: boolean("document_generation_enabled").notNull().default(false),
    configuration: jsonb("configuration"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
);

export const documentSpecialistAgentSessions = pgTable(
  "document_specialist_agent_sessions",
  {
    id: uuid("id").primaryKey().notNull(),
    publicReference: text("public_reference").notNull().unique(),
    clientReference: text("client_reference").notNull(),
    caseReference: text("case_reference").notNull(),
    identityAssurance: text("identity_assurance").notNull(),
    authorizationStatus: text("authorization_status").notNull(),
    documentAccessAuthorized: boolean("document_access_authorized").notNull().default(false),
    purposeAuthorized: boolean("purpose_authorized").notNull().default(false),
    serviceEntitled: boolean("service_entitled").notNull().default(false),
    documentScope: text("document_scope").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index("document_specialist_sessions_client_idx").on(table.clientReference),
    index("document_specialist_sessions_case_idx").on(table.caseReference),
  ],
);

export const documentSpecialistAgentReferences = pgTable(
  "document_specialist_agent_references",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    documentReference: text("document_reference").notNull(),
    sourceKind: text("source_kind").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    storageMode: text("storage_mode").notNull().default("reference_only"),
    originalDocumentStored: boolean("original_document_stored").notNull().default(false),
    rawExtractionStored: boolean("raw_extraction_stored").notNull().default(false),
    processingPerformed: boolean("processing_performed").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("document_specialist_references_session_idx").on(table.sessionId),
    index("document_specialist_references_case_idx").on(table.caseReference),
  ],
);

export const documentSpecialistAgentClassificationCandidates = pgTable(
  "document_specialist_agent_classification_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    documentReferenceId: uuid("document_reference_id").notNull(),
    candidateDocumentType: text("candidate_document_type").notNull(),
    evidenceReferences: jsonb("evidence_references").notNull(),
    schemaReference: text("schema_reference").notNull(),
    status: text("status").notNull().default("candidate"),
    documentTypeConfirmed: boolean("document_type_confirmed").notNull().default(false),
    documentTrusted: boolean("document_trusted").notNull().default(false),
    canonicalFactCreated: boolean("canonical_fact_created").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("document_specialist_classification_session_idx").on(table.sessionId)],
);

export const documentSpecialistAgentExtractionCandidates = pgTable(
  "document_specialist_agent_extraction_candidates",
  {
    id: uuid("id").primaryKey().notNull(),
    classificationCandidateId: uuid("classification_candidate_id").notNull(),
    fieldCode: text("field_code").notNull(),
    sourceReferenceId: uuid("source_reference_id").notNull(),
    extractionMethodReference: text("extraction_method_reference").notNull(),
    status: text("status").notNull().default("candidate"),
    extractedValueStored: boolean("extracted_value_stored").notNull().default(false),
    valueVerified: boolean("value_verified").notNull().default(false),
    canonicalFactCreated: boolean("canonical_fact_created").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index("document_specialist_extraction_classification_idx").on(table.classificationCandidateId),
  ],
);

export const documentSpecialistAgentDomainPacks = pgTable(
  "document_specialist_agent_domain_packs",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id").notNull(),
    caseReference: text("case_reference").notNull(),
    domain: text("domain").notNull(),
    documentReferenceIds: jsonb("document_reference_ids").notNull(),
    extractionCandidateIds: jsonb("extraction_candidate_ids").notNull(),
    status: text("status").notNull().default("reference_only"),
    processingDispatched: boolean("processing_dispatched").notNull().default(false),
    documentGenerated: boolean("document_generated").notNull().default(false),
    signatureRequested: boolean("signature_requested").notNull().default(false),
    downstreamDomainApproval: boolean("downstream_domain_approval").notNull().default(false),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [index("document_specialist_packs_session_idx").on(table.sessionId)],
);

export const documentSpecialistAgentHandoffs = pgTable(
  "document_specialist_agent_handoffs",
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
  (table) => [index("document_specialist_handoffs_session_idx").on(table.sessionId)],
);

export const documentSpecialistAgentRuntimeExecutions = pgTable(
  "document_specialist_agent_runtime_executions",
  {
    id: uuid("id").primaryKey().notNull(),
    sessionId: uuid("session_id"),
    runtimeStatus: text("runtime_status").notNull().default("disabled"),
    capability: text("capability").notNull(),
    outcome: text("outcome").notNull().default("disabled"),
    correlationId: text("correlation_id").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("document_specialist_runtime_correlation_idx").on(table.correlationId)],
);

export const documentSpecialistAgentAuditEvents = pgTable(
  "document_specialist_agent_audit_events",
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
    index("document_specialist_audit_session_idx").on(table.sessionId),
    index("document_specialist_audit_correlation_idx").on(table.correlationId),
  ],
);
