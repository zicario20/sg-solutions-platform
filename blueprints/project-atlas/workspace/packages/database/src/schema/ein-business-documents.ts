import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
};

export const einCases = pgTable(
  "ein_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: text("case_number").notNull(),
    clientRef: text("client_ref").notNull(),
    organizationRef: text("organization_ref").notNull(),
    serviceOrderRef: text("service_order_ref").notNull(),
    formationCaseRef: text("formation_case_ref"),
    deliveryModel: text("delivery_model").notNull(),
    status: text("status").notNull(),
    version: integer("version").notNull(),
    externalSubmissionAllowed: boolean("external_submission_allowed").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ein_cases_case_number_unique").on(table.caseNumber),
    index("ein_cases_organization_idx").on(table.organizationRef),
  ],
);

export const einApplicationDrafts = pgTable(
  "ein_application_drafts",
  {
    id: text("id").primaryKey(),
    einCaseRef: text("ein_case_ref").notNull(),
    formVersion: text("form_version").notNull(),
    organizationSnapshotHash: text("organization_snapshot_hash").notNull(),
    requirementSnapshotHash: text("requirement_snapshot_hash").notNull(),
    responsiblePartyRef: text("responsible_party_ref").notNull(),
    applicationHash: text("application_hash").notNull(),
    state: text("state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("ein_application_drafts_hash_unique").on(table.einCaseRef, table.applicationHash),
  ],
);

export const einAuthorizations = pgTable("ein_authorizations", {
  id: text("id").primaryKey(),
  einCaseRef: text("ein_case_ref").notNull(),
  applicationHash: text("application_hash").notNull(),
  signerRef: text("signer_ref").notNull(),
  status: text("status").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const einSubmissionAttempts = pgTable(
  "ein_submission_attempts",
  {
    id: text("id").primaryKey(),
    einCaseRef: text("ein_case_ref").notNull(),
    applicationHash: text("application_hash").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    providerCode: text("provider_code").notNull(),
    status: text("status").notNull(),
    externalReference: text("external_reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("ein_submission_attempts_idempotency_unique").on(table.idempotencyKey),
    index("ein_submission_attempts_case_idx").on(table.einCaseRef),
  ],
);

export const einIssuanceRecords = pgTable(
  "ein_issuance_records",
  {
    id: text("id").primaryKey(),
    einCaseRef: text("ein_case_ref").notNull(),
    evidenceDocumentRef: text("evidence_document_ref").notNull(),
    fullEinSecureRef: text("full_ein_secure_ref").notNull(),
    verificationStatus: text("verification_status").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("ein_issuance_records_case_unique").on(table.einCaseRef)],
);

export const einDocumentIndex = pgTable(
  "ein_document_index",
  {
    id: text("id").primaryKey(),
    einCaseRef: text("ein_case_ref").notNull(),
    documentRef: text("document_ref").notNull(),
    documentType: text("document_type").notNull(),
    sensitivity: text("sensitivity").notNull(),
    contentHash: text("content_hash").notNull(),
    verificationStatus: text("verification_status").notNull(),
    immutable: boolean("immutable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("ein_document_index_document_unique").on(table.documentRef)],
);

export const einHandoffs = pgTable(
  "ein_handoffs",
  {
    id: text("id").primaryKey(),
    sourceCaseRef: text("source_case_ref").notNull(),
    destination: text("destination").notNull(),
    organizationRef: text("organization_ref").notNull(),
    issuanceRef: text("issuance_ref").notNull(),
    payloadVersion: text("payload_version").notNull(),
    payloadHash: text("payload_hash").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("ein_handoffs_idempotency_unique").on(table.idempotencyKey)],
);

export const einAuditEvents = pgTable(
  "ein_audit_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    actorRef: text("actor_ref").notNull(),
    resourceRef: text("resource_ref").notNull(),
    purpose: text("purpose").notNull(),
    correlationId: text("correlation_id").notNull(),
    metadata: jsonb("metadata").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("ein_audit_events_resource_idx").on(table.resourceRef)],
);
