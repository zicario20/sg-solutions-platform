import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const complianceProfiles = pgTable(
  "compliance_profiles",
  {
    id: text("id").primaryKey(),
    organizationRef: text("organization_ref").notNull(),
    entityType: text("entity_type").notNull(),
    formationJurisdiction: text("formation_jurisdiction").notNull(),
    formationDate: timestamp("formation_date", { withTimezone: true }).notNull(),
    profileHash: text("profile_hash").notNull(),
    verificationStatus: text("verification_status").notNull(),
    version: integer("version").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("compliance_profiles_org_version_unique").on(table.organizationRef, table.version),
    index("compliance_profiles_org_idx").on(table.organizationRef),
  ],
);

export const complianceRequirements = pgTable(
  "compliance_requirements",
  {
    id: text("id").primaryKey(),
    requirementCode: text("requirement_code").notNull(),
    requirementType: text("requirement_type").notNull(),
    jurisdictionCode: text("jurisdiction_code").notNull(),
    status: text("status").notNull(),
    freshness: text("freshness").notNull(),
    version: integer("version").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    sourceReference: text("source_reference").notNull(),
    configuration: jsonb("configuration").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("compliance_requirements_code_version_unique").on(
      table.requirementCode,
      table.version,
    ),
    index("compliance_requirements_scope_idx").on(table.jurisdictionCode, table.status),
  ],
);

export const complianceObligations = pgTable(
  "compliance_obligations",
  {
    id: text("id").primaryKey(),
    organizationRef: text("organization_ref").notNull(),
    requirementRef: text("requirement_ref").notNull(),
    requirementCode: text("requirement_code").notNull(),
    jurisdictionCode: text("jurisdiction_code").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    dueDateConfidence: text("due_date_confidence").notNull(),
    status: text("status").notNull(),
    responsibility: text("responsibility").notNull(),
    serviceScope: text("service_scope").notNull(),
    sourceReference: text("source_reference").notNull(),
    uniquenessKey: text("uniqueness_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("compliance_obligations_uniqueness_unique").on(table.uniquenessKey),
    index("compliance_obligations_due_idx").on(table.organizationRef, table.dueDate),
  ],
);

export const complianceDeadlineCalculations = pgTable(
  "compliance_deadline_calculations",
  {
    id: text("id").primaryKey(),
    obligationRef: text("obligation_ref").notNull(),
    ruleVersion: text("rule_version").notNull(),
    inputDates: jsonb("input_dates").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    trace: text("trace").notNull(),
    confidence: text("confidence").notNull(),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("compliance_deadlines_obligation_idx").on(table.obligationRef)],
);

export const complianceReminders = pgTable(
  "compliance_reminders",
  {
    id: text("id").primaryKey(),
    obligationRef: text("obligation_ref").notNull(),
    policyCode: text("policy_code").notNull(),
    channel: text("channel").notNull(),
    recipientRef: text("recipient_ref").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("compliance_reminders_idempotency_unique").on(table.idempotencyKey)],
);

export const complianceFilingPackages = pgTable(
  "compliance_filing_packages",
  {
    id: text("id").primaryKey(),
    obligationRef: text("obligation_ref").notNull(),
    requirementRef: text("requirement_ref").notNull(),
    reportHash: text("report_hash").notNull(),
    authorizationRef: text("authorization_ref").notNull(),
    packageHash: text("package_hash").notNull(),
    state: text("state").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("compliance_filing_packages_hash_unique").on(table.packageHash)],
);

export const complianceCompletions = pgTable(
  "compliance_completions",
  {
    id: text("id").primaryKey(),
    obligationRef: text("obligation_ref").notNull(),
    completionType: text("completion_type").notNull(),
    evidenceDocumentRefs: jsonb("evidence_document_refs").notNull(),
    externalReference: text("external_reference"),
    verifiedBy: text("verified_by").notNull(),
    verificationStatus: text("verification_status").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("compliance_completions_obligation_idx").on(table.obligationRef)],
);

export const complianceNotices = pgTable(
  "compliance_notices",
  {
    id: text("id").primaryKey(),
    organizationRef: text("organization_ref").notNull(),
    sourceDocumentRef: text("source_document_ref").notNull(),
    sourceReference: text("source_reference").notNull(),
    status: text("status").notNull(),
    severity: text("severity").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    dueDateConfidence: text("due_date_confidence").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("compliance_notices_org_idx").on(table.organizationRef)],
);

export const complianceHandoffs = pgTable(
  "compliance_handoffs",
  {
    id: text("id").primaryKey(),
    sourceObligationRef: text("source_obligation_ref").notNull(),
    organizationRef: text("organization_ref").notNull(),
    destination: text("destination").notNull(),
    payloadVersion: text("payload_version").notNull(),
    payloadHash: text("payload_hash").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("compliance_handoffs_idempotency_unique").on(table.idempotencyKey)],
);

export const complianceAuditEvents = pgTable(
  "compliance_audit_events",
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
  (table) => [index("compliance_audit_resource_idx").on(table.resourceRef)],
);
