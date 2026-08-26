import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * M045 is deny-by-default at the database boundary. A future gateway adapter
 * may be granted a narrowly scoped policy only after a separate activation and
 * independent security review; this migration intentionally installs none.
 */
export const serviceEntitlementsGatewayRole = pgRole(
  "atlas_service_entitlements_gateway",
).existing();

const only = (name: string) =>
  pgPolicy(`${name}_service_entitlements_gateway_only`, {
    as: "permissive",
    for: "all",
    to: serviceEntitlementsGatewayRole,
    using: sql.raw("true"),
    withCheck: sql.raw("true"),
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const entitlementDefinitions = pgTable(
  "entitlement_definitions",
  {
    id: text("id").primaryKey(),
    entitlementKey: varchar("entitlement_key", { length: 192 }).notNull(),
    name: varchar("name", { length: 192 }).notNull(),
    description: text("description").notNull(),
    entitlementType: varchar("entitlement_type", { length: 48 }).notNull(),
    ownerDomain: varchar("owner_domain", { length: 96 }).notNull(),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    defaultDecision: varchar("default_decision", { length: 16 }).notNull().default("deny"),
    status: varchar("status", { length: 24 }).notNull(),
    currentVersion: integer("current_version").notNull(),
    configurationHash: char("configuration_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("entitlement_definitions_key_unique").on(table.entitlementKey),
    check("entitlement_definitions_default_deny", sql.raw("default_decision = 'deny'")),
    check("entitlement_definitions_version_positive", sql.raw("current_version > 0")),
    check(
      "entitlement_definitions_status_valid",
      sql.raw("status in ('draft','active','paused','retired','archived')"),
    ),
    check("entitlement_definitions_hash_valid", sql.raw("configuration_hash ~ '^[0-9a-f]{64}$'")),
    only("entitlement_definitions"),
  ],
).enableRLS();

export const serviceCapabilityDefinitions = pgTable(
  "service_capability_definitions",
  {
    id: text("id").primaryKey(),
    capabilityCode: varchar("capability_code", { length: 192 }).notNull(),
    serviceDomain: varchar("service_domain", { length: 96 }).notNull(),
    description: text("description").notNull(),
    surface: varchar("surface", { length: 24 }).notNull(),
    riskLevel: varchar("risk_level", { length: 24 }).notNull(),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("service_capability_definitions_code_unique").on(table.capabilityCode),
    check(
      "service_capability_definitions_surface_valid",
      sql.raw("surface in ('public','client','admin','backend')"),
    ),
    check(
      "service_capability_definitions_risk_valid",
      sql.raw("risk_level in ('low','moderate','high','critical')"),
    ),
    check(
      "service_capability_definitions_status_valid",
      sql.raw("status in ('draft','active','paused','retired')"),
    ),
    only("service_capability_definitions"),
  ],
).enableRLS();

export const serviceEntitlementProfiles = pgTable(
  "service_entitlement_profiles",
  {
    id: text("id").primaryKey(),
    serviceVersionReference: text("service_version_reference").notNull(),
    version: integer("version").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    entitlementDefinitionIds: jsonb("entitlement_definition_ids").notNull(),
    activationPolicyIds: jsonb("activation_policy_ids").notNull(),
    suspensionPolicyIds: jsonb("suspension_policy_ids").notNull(),
    revocationPolicyIds: jsonb("revocation_policy_ids").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true, mode: "date" }),
    configurationHash: char("configuration_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("service_entitlement_profiles_reference_version_unique").on(
      table.serviceVersionReference,
      table.version,
    ),
    check("service_entitlement_profiles_version_positive", sql.raw("version > 0")),
    check(
      "service_entitlement_profiles_status_valid",
      sql.raw("status in ('draft','active','paused','retired')"),
    ),
    check(
      "service_entitlement_profiles_effective_range_valid",
      sql.raw("effective_to is null or effective_to > effective_from"),
    ),
    check(
      "service_entitlement_profiles_hash_valid",
      sql.raw("configuration_hash ~ '^[0-9a-f]{64}$'"),
    ),
    index("service_entitlement_profiles_active_idx").on(
      table.serviceVersionReference,
      table.status,
    ),
    only("service_entitlement_profiles"),
  ],
).enableRLS();

export const entitlementPolicies = pgTable(
  "entitlement_policies",
  {
    id: text("id").primaryKey(),
    policyCode: varchar("policy_code", { length: 192 }).notNull(),
    version: integer("version").notNull(),
    entitlementDefinitionId: text("entitlement_definition_id")
      .notNull()
      .references(() => entitlementDefinitions.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 24 }).notNull(),
    requiredConditions: jsonb("required_conditions").notNull(),
    subjectTypes: jsonb("subject_types").notNull(),
    resourceTypes: jsonb("resource_types").notNull(),
    unknownBehavior: jsonb("unknown_behavior").notNull(),
    grantMode: varchar("grant_mode", { length: 32 }).notNull(),
    precedenceVersion: integer("precedence_version").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true, mode: "date" }),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    configurationHash: char("configuration_hash", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("entitlement_policies_code_version_unique").on(table.policyCode, table.version),
    check("entitlement_policies_version_positive", sql.raw("version > 0")),
    check("entitlement_policies_precedence_positive", sql.raw("precedence_version > 0")),
    check(
      "entitlement_policies_status_valid",
      sql.raw(
        "status in ('draft','testing','review','approved','active','limited','paused','deprecated','retired')",
      ),
    ),
    check(
      "entitlement_policies_grant_mode_valid",
      sql.raw("grant_mode in ('decision_only','materialize_derived')"),
    ),
    check(
      "entitlement_policies_effective_range_valid",
      sql.raw("effective_to is null or effective_to > effective_from"),
    ),
    check("entitlement_policies_hash_valid", sql.raw("configuration_hash ~ '^[0-9a-f]{64}$'")),
    index("entitlement_policies_definition_status_idx").on(
      table.entitlementDefinitionId,
      table.status,
    ),
    only("entitlement_policies"),
  ],
).enableRLS();

export const entitlementGrants = pgTable(
  "entitlement_grants",
  {
    id: text("id").primaryKey(),
    entitlementDefinitionId: text("entitlement_definition_id")
      .notNull()
      .references(() => entitlementDefinitions.id, { onDelete: "restrict" }),
    tenantId: text("tenant_id").notNull(),
    subjectType: varchar("subject_type", { length: 48 }).notNull(),
    subjectId: text("subject_id").notNull(),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    resourceId: text("resource_id").notNull(),
    scopeType: varchar("scope_type", { length: 48 }).notNull(),
    sourceType: varchar("source_type", { length: 48 }).notNull(),
    sourceReference: text("source_reference").notNull(),
    policyVersion: integer("policy_version").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    temporary: boolean("temporary").notNull().default(false),
    reason: text("reason"),
    approvedBy: text("approved_by"),
    revalidationRequired: boolean("revalidation_required").notNull().default(true),
    usageLimit: integer("usage_limit"),
    usageUsed: integer("usage_used").notNull().default(0),
    readOnlyWhenSuspended: boolean("read_only_when_suspended").notNull().default(false),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    check("entitlement_grants_policy_version_positive", sql.raw("policy_version > 0")),
    check("entitlement_grants_version_positive", sql.raw("version > 0")),
    check(
      "entitlement_grants_usage_valid",
      sql.raw("usage_limit is null or (usage_limit > 0 and usage_used between 0 and usage_limit)"),
    ),
    check(
      "entitlement_grants_status_valid",
      sql.raw(
        "status in ('pending','active','limited','suspended','revoked','expired','cancelled','superseded','unknown')",
      ),
    ),
    check(
      "entitlement_grants_temporary_expiry_valid",
      sql.raw("temporary = false or expires_at is not null"),
    ),
    check(
      "entitlement_grants_effective_range_valid",
      sql.raw("expires_at is null or expires_at > effective_from"),
    ),
    index("entitlement_grants_subject_resource_idx").on(
      table.tenantId,
      table.subjectId,
      table.resourceId,
      table.status,
    ),
    only("entitlement_grants"),
  ],
).enableRLS();

export const entitlementDenies = pgTable(
  "entitlement_denies",
  {
    id: text("id").primaryKey(),
    entitlementDefinitionId: text("entitlement_definition_id")
      .notNull()
      .references(() => entitlementDefinitions.id, { onDelete: "restrict" }),
    tenantId: text("tenant_id").notNull(),
    subjectType: varchar("subject_type", { length: 48 }).notNull(),
    subjectId: text("subject_id").notNull(),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    resourceId: text("resource_id").notNull(),
    scopeType: varchar("scope_type", { length: 48 }).notNull(),
    reason: text("reason").notNull(),
    authorityReference: text("authority_reference").notNull(),
    source: varchar("source", { length: 96 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    check(
      "entitlement_denies_status_valid",
      sql.raw("status in ('active','revoked','expired','superseded')"),
    ),
    check(
      "entitlement_denies_effective_range_valid",
      sql.raw("expires_at is null or expires_at > effective_from"),
    ),
    index("entitlement_denies_subject_resource_idx").on(
      table.tenantId,
      table.subjectId,
      table.resourceId,
      table.status,
    ),
    only("entitlement_denies"),
  ],
).enableRLS();

export const entitlementDecisions = pgTable(
  "entitlement_decisions",
  {
    id: text("id").primaryKey(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    evaluationRequestId: varchar("evaluation_request_id", { length: 256 }).notNull(),
    entitlementDefinitionId: text("entitlement_definition_id")
      .notNull()
      .references(() => entitlementDefinitions.id, { onDelete: "restrict" }),
    entitlementKey: varchar("entitlement_key", { length: 192 }).notNull(),
    tenantId: text("tenant_id").notNull(),
    subjectSnapshot: jsonb("subject_snapshot").notNull(),
    resourceSnapshot: jsonb("resource_snapshot").notNull(),
    scopeType: varchar("scope_type", { length: 48 }).notNull(),
    policyId: text("policy_id")
      .notNull()
      .references(() => entitlementPolicies.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    conditionResults: jsonb("condition_results").notNull(),
    grantIds: jsonb("grant_ids").notNull(),
    denyIds: jsonb("deny_ids").notNull(),
    nextActions: jsonb("next_actions").notNull(),
    limits: jsonb("limits").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    snapshotHash: char("snapshot_hash", { length: 64 }).notNull(),
    supersedesDecisionId: text("supersedes_decision_id"),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check("entitlement_decisions_policy_version_positive", sql.raw("policy_version > 0")),
    check(
      "entitlement_decisions_status_valid",
      sql.raw(
        "status in ('allow','allow_with_limits','allow_read_only','deny','suspended','action_required','manual_review_required','not_applicable','unknown')",
      ),
    ),
    check("entitlement_decisions_hash_valid", sql.raw("snapshot_hash ~ '^[0-9a-f]{64}$'")),
    index("entitlement_decisions_subject_idx").on(
      table.tenantId,
      table.entitlementKey,
      table.decidedAt,
    ),
    index("entitlement_decisions_definition_idx").on(
      table.entitlementDefinitionId,
      table.decidedAt,
    ),
    only("entitlement_decisions"),
  ],
).enableRLS();

export const entitlementUsageCounters = pgTable(
  "entitlement_usage_counters",
  {
    entitlementGrantId: text("entitlement_grant_id")
      .primaryKey()
      .references(() => entitlementGrants.id, { onDelete: "restrict" }),
    usageLimit: integer("usage_limit"),
    usageUsed: integer("usage_used").notNull().default(0),
    version: integer("version").notNull(),
    lastConsumedAt: timestamp("last_consumed_at", { withTimezone: true, mode: "date" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (_table) => [
    check("entitlement_usage_counters_version_positive", sql.raw("version > 0")),
    check(
      "entitlement_usage_counters_values_valid",
      sql.raw(
        "usage_used >= 0 and (usage_limit is null or usage_limit > 0 and usage_used <= usage_limit)",
      ),
    ),
    only("entitlement_usage_counters"),
  ],
).enableRLS();

export const entitlementUsageEvents = pgTable(
  "entitlement_usage_events",
  {
    id: text("id").primaryKey(),
    entitlementGrantId: text("entitlement_grant_id")
      .notNull()
      .references(() => entitlementGrants.id, { onDelete: "restrict" }),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    amount: integer("amount").notNull(),
    previousUsage: integer("previous_usage").notNull(),
    resultingUsage: integer("resulting_usage").notNull(),
    actorType: varchar("actor_type", { length: 24 }).notNull(),
    actorReference: text("actor_reference"),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check("entitlement_usage_events_amount_positive", sql.raw("amount > 0")),
    check(
      "entitlement_usage_events_usage_valid",
      sql.raw("previous_usage >= 0 and resulting_usage >= previous_usage"),
    ),
    check(
      "entitlement_usage_events_actor_valid",
      sql.raw("actor_type in ('staff','owner','service_account','system')"),
    ),
    index("entitlement_usage_events_grant_idx").on(table.entitlementGrantId, table.occurredAt),
    only("entitlement_usage_events"),
  ],
).enableRLS();

export const entitlementAuditEvents = pgTable(
  "entitlement_audit_events",
  {
    id: text("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    actorType: varchar("actor_type", { length: 24 }).notNull(),
    actorReference: text("actor_reference"),
    entitlementKey: varchar("entitlement_key", { length: 192 }),
    subjectId: text("subject_id"),
    resourceId: text("resource_id"),
    decisionId: text("decision_id").references(() => entitlementDecisions.id, {
      onDelete: "restrict",
    }),
    result: varchar("result", { length: 24 }).notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    previousEventHash: char("previous_event_hash", { length: 64 }),
    eventHash: char("event_hash", { length: 64 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "entitlement_audit_events_action_valid",
      sql.raw(
        "action in ('evaluation_requested','decision_created','decision_enforced','access_denied','grant_created','grant_suspended','grant_revoked','usage_consumed','cache_invalidated','simulation_executed','runtime_operation_blocked')",
      ),
    ),
    check(
      "entitlement_audit_events_actor_valid",
      sql.raw("actor_type in ('staff','owner','service_account','system')"),
    ),
    check(
      "entitlement_audit_events_result_valid",
      sql.raw("result in ('accepted','denied','blocked','manual_review')"),
    ),
    check("entitlement_audit_events_hash_valid", sql.raw("event_hash ~ '^[0-9a-f]{64}$'")),
    index("entitlement_audit_events_resource_idx").on(table.resourceId, table.occurredAt),
    only("entitlement_audit_events"),
  ],
).enableRLS();

export const entitlementOutbox = pgTable(
  "entitlement_outbox",
  {
    id: text("id").primaryKey(),
    eventType: varchar("event_type", { length: 96 }).notNull(),
    aggregateId: text("aggregate_id").notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    dispatchState: varchar("dispatch_state", { length: 24 }).notNull().default("blocked"),
    payloadReference: text("payload_reference"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    check(
      "entitlement_outbox_event_valid",
      sql.raw(
        "event_type in ('entitlement_decision_created','entitlement_access_denied','entitlement_cache_invalidated')",
      ),
    ),
    check(
      "entitlement_outbox_state_valid",
      sql.raw("dispatch_state in ('blocked','pending','dispatched','dead_lettered')"),
    ),
    index("entitlement_outbox_dispatch_idx").on(table.dispatchState, table.createdAt),
    only("entitlement_outbox"),
  ],
).enableRLS();

export const entitlementOperationalFindings = pgTable(
  "entitlement_operational_findings",
  {
    id: text("id").primaryKey(),
    findingType: varchar("finding_type", { length: 96 }).notNull(),
    severity: varchar("severity", { length: 16 }).notNull(),
    blocking: boolean("blocking").notNull(),
    subjectId: text("subject_id"),
    resourceId: text("resource_id"),
    decisionId: text("decision_id").references(() => entitlementDecisions.id, {
      onDelete: "restrict",
    }),
    status: varchar("status", { length: 24 }).notNull(),
    remediationReference: text("remediation_reference"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    check(
      "entitlement_operational_findings_type_valid",
      sql.raw(
        "finding_type in ('missing_policy','profile_version_mismatch','subject_resolution_failure','resource_ownership_mismatch','unknown_blocking_condition','stale_condition_source','grant_deny_conflict','cache_invalidation_failure','enforcement_bypass_attempt','usage_counter_conflict','temporary_access_without_expiry','cross_client_access_attempt','cross_tenant_access_attempt','workflow_action_without_entitlement','ai_scope_violation')",
      ),
    ),
    check(
      "entitlement_operational_findings_severity_valid",
      sql.raw("severity in ('low','medium','high','critical')"),
    ),
    check(
      "entitlement_operational_findings_status_valid",
      sql.raw("status in ('open','acknowledged','resolved','accepted_risk')"),
    ),
    index("entitlement_operational_findings_open_idx").on(
      table.status,
      table.severity,
      table.createdAt,
    ),
    only("entitlement_operational_findings"),
  ],
).enableRLS();
