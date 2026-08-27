import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const receptionAuditColumns = () => ({
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receptionAgentConfigurations = pgTable(
  "reception_agent_configurations",
  {
    ...receptionAuditColumns(),
    code: text("code").notNull(),
    manifestReference: text("manifest_reference").notNull(),
    policyReference: text("policy_reference").notNull(),
    status: text("status").notNull().default("disabled"),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [index("reception_agent_configurations_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const receptionSessions = pgTable(
  "reception_sessions",
  {
    ...receptionAuditColumns(),
    publicSessionReference: text("public_session_reference").notNull(),
    channel: text("channel").notNull(),
    locale: text("locale").notNull(),
    authentication: text("authentication").notNull(),
    consentReference: text("consent_reference"),
    currentStage: text("current_stage").notNull().default("greeting"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("reception_sessions_tenant_public_session_idx").on(
      table.tenantId,
      table.publicSessionReference,
    ),
  ],
).enableRLS();

export const receptionInteractionRecords = pgTable(
  "reception_interaction_records",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    stage: text("stage").notNull(),
    inputDigest: text("input_digest").notNull(),
    intentReference: text("intent_reference").notNull(),
    sourceReferences: jsonb("source_references").$type<string[]>().notNull(),
  },
  (table) => [
    index("reception_interaction_records_tenant_session_idx").on(
      table.tenantId,
      table.sessionReference,
    ),
  ],
).enableRLS();

export const receptionIntentClassifications = pgTable(
  "reception_intent_classifications",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    intent: text("intent").notNull(),
    risk: text("risk").notNull(),
    disposition: text("disposition").notNull(),
    reasonCodes: jsonb("reason_codes").$type<string[]>().notNull(),
    requiresAuthentication: boolean("requires_authentication").notNull().default(false),
    requiresHumanReview: boolean("requires_human_review").notNull().default(false),
  },
  (table) => [
    index("reception_intent_classifications_tenant_session_idx").on(
      table.tenantId,
      table.sessionReference,
    ),
  ],
).enableRLS();

export const receptionLeadCaptureRequests = pgTable(
  "reception_lead_capture_requests",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    purpose: text("purpose").notNull(),
    contactFieldReferences: jsonb("contact_field_references").$type<string[]>().notNull(),
    consentReference: text("consent_reference").notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("reception_lead_capture_requests_tenant_idempotency_idx").on(
      table.tenantId,
      table.idempotencyKey,
    ),
  ],
).enableRLS();

export const receptionSecureLinkRequests = pgTable(
  "reception_secure_link_requests",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    linkType: text("link_type").notNull(),
    requesterAuthenticated: boolean("requester_authenticated").notNull().default(false),
    purpose: text("purpose").notNull(),
    destinationOwner: text("destination_owner").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("reception_secure_link_requests_tenant_idempotency_idx").on(
      table.tenantId,
      table.idempotencyKey,
    ),
  ],
).enableRLS();

export const receptionHandoffPackages = pgTable(
  "reception_handoff_packages",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    target: text("target").notNull(),
    intent: text("intent").notNull(),
    locale: text("locale").notNull(),
    factReferences: jsonb("fact_references").$type<string[]>().notNull(),
    sourceReferences: jsonb("source_references").$type<string[]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("reception_handoff_packages_tenant_session_idx").on(
      table.tenantId,
      table.sessionReference,
    ),
  ],
).enableRLS();

export const receptionFollowUpRequests = pgTable(
  "reception_follow_up_requests",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    contactConsentReference: text("contact_consent_reference").notNull(),
    purpose: text("purpose").notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("reception_follow_up_requests_tenant_session_idx").on(
      table.tenantId,
      table.sessionReference,
    ),
  ],
).enableRLS();

export const receptionHumanTransfers = pgTable(
  "reception_human_transfers",
  {
    ...receptionAuditColumns(),
    sessionReference: text("session_reference").notNull(),
    reasonCodes: jsonb("reason_codes").$type<string[]>().notNull(),
    summaryReference: text("summary_reference").notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("reception_human_transfers_tenant_session_idx").on(table.tenantId, table.sessionReference),
  ],
).enableRLS();

export const receptionChangeRequests = pgTable(
  "reception_change_requests",
  {
    ...receptionAuditColumns(),
    changeType: text("change_type").notNull(),
    changeReference: text("change_reference").notNull(),
    actorReference: text("actor_reference").notNull(),
    approvalReference: text("approval_reference"),
    status: text("status").notNull().default("pending_review"),
  },
  (table) => [
    index("reception_change_requests_tenant_status_idx").on(table.tenantId, table.status),
  ],
).enableRLS();

export const receptionAuditEvents = pgTable(
  "reception_audit_events",
  {
    ...receptionAuditColumns(),
    eventType: text("event_type").notNull(),
    resourceReference: text("resource_reference").notNull(),
    previousHash: text("previous_hash"),
    eventHash: text("event_hash").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("reception_audit_events_tenant_occurred_idx").on(table.tenantId, table.occurredAt),
  ],
).enableRLS();

export const receptionOutbox = pgTable(
  "reception_outbox",
  {
    ...receptionAuditColumns(),
    eventType: text("event_type").notNull(),
    aggregateReference: text("aggregate_reference").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    payloadReference: text("payload_reference").notNull(),
    status: text("status").notNull().default("prepared"),
  },
  (table) => [
    index("reception_outbox_tenant_idempotency_idx").on(table.tenantId, table.idempotencyKey),
  ],
).enableRLS();

export const receptionFindings = pgTable(
  "reception_findings",
  {
    ...receptionAuditColumns(),
    findingType: text("finding_type").notNull(),
    severity: text("severity").notNull(),
    resourceReference: text("resource_reference").notNull(),
    status: text("status").notNull().default("open"),
  },
  (table) => [index("reception_findings_tenant_status_idx").on(table.tenantId, table.status)],
).enableRLS();

export const receptionIncidents = pgTable(
  "reception_incidents",
  {
    ...receptionAuditColumns(),
    incidentType: text("incident_type").notNull(),
    severity: text("severity").notNull(),
    impactReference: text("impact_reference").notNull(),
    status: text("status").notNull().default("open"),
  },
  (table) => [index("reception_incidents_tenant_status_idx").on(table.tenantId, table.status)],
).enableRLS();
