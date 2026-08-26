import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const catalogTimestamp = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

/**
 * M042 continuation tables. These preserve catalog evidence and review state only.
 * The service catalog remains the single bounded context; no external module is activated here.
 */
export const serviceCatalogOrderSnapshots = pgTable(
  "service_catalog_order_snapshots",
  {
    id: uuid("id").primaryKey(),
    serviceOrderReference: text("service_order_reference").notNull(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    configurationHash: text("configuration_hash").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_order_snapshots_order_version_key").on(
      table.serviceOrderReference,
      table.serviceVersionId,
    ),
    index("service_catalog_order_snapshots_definition_idx").on(table.serviceDefinitionId),
  ],
);

export const serviceCatalogDeprecations = pgTable(
  "service_catalog_deprecations",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    deprecatedVersionId: uuid("deprecated_version_id").notNull(),
    replacementServiceDefinitionId: uuid("replacement_service_definition_id"),
    replacementVersionId: uuid("replacement_version_id"),
    newOrderBehavior: text("new_order_behavior").notNull(),
    activeOrderBehavior: text("active_order_behavior").notNull(),
    status: text("status").notNull(),
    effectiveAt: catalogTimestamp("effective_at").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_deprecations_definition_idx").on(table.serviceDefinitionId)],
);

export const serviceCatalogAiOutputs = pgTable(
  "service_catalog_ai_outputs",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id"),
    outputType: text("output_type").notNull(),
    status: text("status").notNull(),
    contentReference: text("content_reference").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    findings: jsonb("findings").notNull(),
    reviewedByReference: text("reviewed_by_reference"),
    reviewedAt: catalogTimestamp("reviewed_at"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_ai_outputs_definition_idx").on(table.serviceDefinitionId)],
);

export const serviceCatalogBreakGlassRequests = pgTable(
  "service_catalog_break_glass_requests",
  {
    id: uuid("id").primaryKey(),
    action: text("action").notNull(),
    scopeReferences: jsonb("scope_references").notNull(),
    reason: text("reason").notNull(),
    requestedByReference: text("requested_by_reference").notNull(),
    status: text("status").notNull(),
    expiresAt: catalogTimestamp("expires_at").notNull(),
    approvedByReference: text("approved_by_reference"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_break_glass_status_idx").on(table.status)],
);

export const serviceCatalogDriftFindings = pgTable(
  "service_catalog_drift_findings",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    findingType: text("finding_type").notNull(),
    severity: text("severity").notNull(),
    expectedHash: text("expected_hash").notNull(),
    observedHash: text("observed_hash").notNull(),
    status: text("status").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
    resolvedAt: catalogTimestamp("resolved_at"),
  },
  (table) => [index("service_catalog_drift_findings_version_idx").on(table.serviceVersionId)],
);

export const serviceCatalogRecoveryVerifications = pgTable(
  "service_catalog_recovery_verifications",
  {
    id: uuid("id").primaryKey(),
    status: text("status").notNull(),
    verificationSnapshot: jsonb("verification_snapshot").notNull(),
    verifiedByReference: text("verified_by_reference").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_recovery_verifications_status_idx").on(table.status)],
);

export const serviceCatalogMetricDefinitions = pgTable(
  "service_catalog_metric_definitions",
  {
    id: uuid("id").primaryKey(),
    metricName: text("metric_name").notNull(),
    version: text("version").notNull(),
    definition: jsonb("definition").notNull(),
    status: text("status").notNull(),
    lastValidatedAt: catalogTimestamp("last_validated_at").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_metric_definitions_name_version_key").on(
      table.metricName,
      table.version,
    ),
  ],
);

export const serviceCatalogWorkQueueItems = pgTable(
  "service_catalog_work_queue_items",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id"),
    queueType: text("queue_type").notNull(),
    status: text("status").notNull(),
    assigneeReference: text("assignee_reference"),
    dueAt: catalogTimestamp("due_at"),
    createdAt: catalogTimestamp("created_at").notNull(),
    resolvedAt: catalogTimestamp("resolved_at"),
  },
  (table) => [
    index("service_catalog_work_queue_definition_idx").on(table.serviceDefinitionId),
    index("service_catalog_work_queue_status_idx").on(table.status),
  ],
);

export const serviceCatalogSecurityIncidents = pgTable(
  "service_catalog_security_incidents",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id"),
    serviceVersionId: uuid("service_version_id"),
    incidentType: text("incident_type").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull(),
    evidenceReference: text("evidence_reference").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
    resolvedAt: catalogTimestamp("resolved_at"),
  },
  (table) => [index("service_catalog_security_incidents_status_idx").on(table.status)],
);
