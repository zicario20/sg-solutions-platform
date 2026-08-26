import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const supervisorAuditColumns = () => ({
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supervisorConfigurations = pgTable(
  "supervisor_configurations",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    m47ControlPlaneReference: text("m47_control_plane_reference").notNull(),
    status: text("status").notNull().default("disabled"),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [index("supervisor_configurations_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const supervisorTaskEnvelopes = pgTable(
  "supervisor_task_envelopes",
  {
    ...supervisorAuditColumns(),
    idempotencyKey: text("idempotency_key").notNull(),
    source: text("source").notNull(),
    surface: text("surface").notNull(),
    locale: text("locale").notNull(),
    classification: jsonb("classification").$type<Record<string, unknown>>().notNull(),
    authorizationSnapshot: jsonb("authorization_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    resourceReferences: jsonb("resource_references").$type<string[]>().notNull(),
    status: text("status").notNull().default("received"),
  },
  (table) => [
    index("supervisor_task_envelopes_tenant_idempotency_idx").on(
      table.tenantId,
      table.idempotencyKey,
    ),
  ],
).enableRLS();

export const supervisorTaskSegments = pgTable(
  "supervisor_task_segments",
  {
    ...supervisorAuditColumns(),
    taskEnvelopeReference: text("task_envelope_reference").notNull(),
    sequence: text("sequence").notNull(),
    classification: jsonb("classification").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("prepared"),
  },
  (table) => [
    index("supervisor_task_segments_tenant_task_idx").on(
      table.tenantId,
      table.taskEnvelopeReference,
    ),
  ],
).enableRLS();

export const supervisorSpecialistRegistry = pgTable(
  "supervisor_specialist_registry",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    manifestReference: text("manifest_reference").notNull(),
    status: text("status").notNull().default("approved_disabled"),
    capability: jsonb("capability").$type<Record<string, unknown>>().notNull(),
    operationalAvailability: text("operational_availability").notNull().default("disabled"),
  },
  (table) => [
    index("supervisor_specialist_registry_tenant_code_idx").on(table.tenantId, table.code),
  ],
).enableRLS();

export const supervisorRoutingPolicies = pgTable(
  "supervisor_routing_policies",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    version: text("version").notNull(),
    status: text("status").notNull().default("draft"),
    policy: jsonb("policy").$type<Record<string, unknown>>().notNull(),
    approvedByReference: text("approved_by_reference"),
  },
  (table) => [index("supervisor_routing_policies_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const supervisorRoutingDecisions = pgTable(
  "supervisor_routing_decisions",
  {
    ...supervisorAuditColumns(),
    taskEnvelopeReference: text("task_envelope_reference").notNull(),
    routingPolicyReference: text("routing_policy_reference").notNull(),
    decisionStatus: text("decision_status").notNull(),
    selectedSpecialistCode: text("selected_specialist_code"),
    reasonCodes: jsonb("reason_codes").$type<string[]>().notNull(),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
  },
  (table) => [
    index("supervisor_routing_decisions_tenant_task_idx").on(
      table.tenantId,
      table.taskEnvelopeReference,
    ),
  ],
).enableRLS();

export const supervisorOrchestrationPlans = pgTable(
  "supervisor_orchestration_plans",
  {
    ...supervisorAuditColumns(),
    taskEnvelopeReference: text("task_envelope_reference").notNull(),
    routingDecisionReference: text("routing_decision_reference").notNull(),
    strategy: text("strategy").notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
    configurationSnapshot: jsonb("configuration_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
  },
  (table) => [
    index("supervisor_orchestration_plans_tenant_task_idx").on(
      table.tenantId,
      table.taskEnvelopeReference,
    ),
  ],
).enableRLS();

export const supervisorWorkUnits = pgTable(
  "supervisor_work_units",
  {
    ...supervisorAuditColumns(),
    orchestrationPlanReference: text("orchestration_plan_reference").notNull(),
    code: text("code").notNull(),
    specialistCode: text("specialist_code").notNull(),
    dependencyReferences: jsonb("dependency_references").$type<string[]>().notNull(),
    contextScope: jsonb("context_scope").$type<string[]>().notNull(),
    status: text("status").notNull().default("prepared"),
  },
  (table) => [
    index("supervisor_work_units_tenant_plan_idx").on(
      table.tenantId,
      table.orchestrationPlanReference,
    ),
  ],
).enableRLS();

export const supervisorHandoffs = pgTable(
  "supervisor_handoffs",
  {
    ...supervisorAuditColumns(),
    taskEnvelopeReference: text("task_envelope_reference").notNull(),
    workUnitReference: text("work_unit_reference").notNull(),
    recipientSpecialistCode: text("recipient_specialist_code").notNull(),
    contextReference: text("context_reference").notNull(),
    status: text("status").notNull().default("blocked"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("supervisor_handoffs_tenant_task_idx").on(table.tenantId, table.taskEnvelopeReference),
  ],
).enableRLS();

export const supervisorRuntimeRecords = pgTable(
  "supervisor_runtime_records",
  {
    ...supervisorAuditColumns(),
    planReference: text("plan_reference").notNull(),
    status: text("status").notNull().default("blocked"),
    runtimeSnapshot: jsonb("runtime_snapshot").$type<Record<string, unknown>>().notNull(),
    fallbackReason: text("fallback_reason"),
  },
  (table) => [
    index("supervisor_runtime_records_tenant_plan_idx").on(table.tenantId, table.planReference),
  ],
).enableRLS();

export const supervisorBudgetProfiles = pgTable(
  "supervisor_budget_profiles",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    status: text("status").notNull().default("draft"),
    limits: jsonb("limits").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [index("supervisor_budget_profiles_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const supervisorSlaProfiles = pgTable(
  "supervisor_sla_profiles",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    status: text("status").notNull().default("draft"),
    deadlines: jsonb("deadlines").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [index("supervisor_sla_profiles_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const supervisorFallbackPolicies = pgTable(
  "supervisor_fallback_policies",
  {
    ...supervisorAuditColumns(),
    code: text("code").notNull(),
    status: text("status").notNull().default("draft"),
    policy: jsonb("policy").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [index("supervisor_fallback_policies_tenant_code_idx").on(table.tenantId, table.code)],
).enableRLS();

export const supervisorGovernanceRecords = pgTable(
  "supervisor_governance_records",
  {
    ...supervisorAuditColumns(),
    governanceType: text("governance_type").notNull(),
    policyReference: text("policy_reference").notNull(),
    approvalReference: text("approval_reference"),
    status: text("status").notNull().default("pending_review"),
  },
  (table) => [
    index("supervisor_governance_records_tenant_policy_idx").on(
      table.tenantId,
      table.policyReference,
    ),
  ],
).enableRLS();

export const supervisorChangeRequests = pgTable(
  "supervisor_change_requests",
  {
    ...supervisorAuditColumns(),
    changeType: text("change_type").notNull(),
    changeReference: text("change_reference").notNull(),
    actorReference: text("actor_reference").notNull(),
    approvalReference: text("approval_reference"),
    status: text("status").notNull().default("pending_review"),
  },
  (table) => [
    index("supervisor_change_requests_tenant_status_idx").on(table.tenantId, table.status),
  ],
).enableRLS();

export const supervisorAuditEvents = pgTable(
  "supervisor_audit_events",
  {
    ...supervisorAuditColumns(),
    eventType: text("event_type").notNull(),
    resourceReference: text("resource_reference").notNull(),
    previousHash: text("previous_hash"),
    eventHash: text("event_hash").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("supervisor_audit_events_tenant_occurred_idx").on(table.tenantId, table.occurredAt),
  ],
).enableRLS();

export const supervisorFindings = pgTable(
  "supervisor_findings",
  {
    ...supervisorAuditColumns(),
    findingType: text("finding_type").notNull(),
    severity: text("severity").notNull(),
    resourceReference: text("resource_reference").notNull(),
    status: text("status").notNull().default("open"),
  },
  (table) => [index("supervisor_findings_tenant_status_idx").on(table.tenantId, table.status)],
).enableRLS();

export const supervisorIncidents = pgTable(
  "supervisor_incidents",
  {
    ...supervisorAuditColumns(),
    incidentType: text("incident_type").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull().default("open"),
    impactReference: text("impact_reference").notNull(),
  },
  (table) => [index("supervisor_incidents_tenant_status_idx").on(table.tenantId, table.status)],
).enableRLS();

export const supervisorMigrationRecords = pgTable(
  "supervisor_migration_records",
  {
    ...supervisorAuditColumns(),
    migrationReference: text("migration_reference").notNull(),
    sourceReference: text("source_reference").notNull(),
    status: text("status").notNull().default("planned"),
    verification: jsonb("verification").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [
    index("supervisor_migration_records_tenant_migration_idx").on(
      table.tenantId,
      table.migrationReference,
    ),
  ],
).enableRLS();
