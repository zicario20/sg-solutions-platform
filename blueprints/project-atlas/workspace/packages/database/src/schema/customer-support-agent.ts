import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const customerSupportAgentConfigurations = pgTable(
  "customer_support_agent_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentDefinitionReference: text("agent_definition_reference").notNull(),
    agentVersionReference: text("agent_version_reference").notNull(),
    issueTaxonomyVersionReference: text("issue_taxonomy_version_reference").notNull(),
    toolPolicyVersionReference: text("tool_policy_version_reference").notNull(),
    clientSafeContextPolicyReference: text("client_safe_context_policy_reference").notNull(),
    status: text("status").notNull().default("disabled"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("customer_support_agent_configurations_agent_version_uq").on(
      table.agentVersionReference,
    ),
  ],
);

export const customerSupportSessions = pgTable(
  "customer_support_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientReference: text("client_reference").notNull(),
    identityAssurance: text("identity_assurance").notNull(),
    locale: text("locale").notNull(),
    correlationId: text("correlation_id").notNull(),
    status: text("status").notNull().default("created"),
    privateReadPermitted: boolean("private_read_permitted").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("customer_support_sessions_client_status_idx").on(table.clientReference, table.status),
    uniqueIndex("customer_support_sessions_correlation_uq").on(table.correlationId),
  ],
);

export const customerSupportCaseDrafts = pgTable(
  "customer_support_case_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supportSessionId: uuid("support_session_id")
      .notNull()
      .references(() => customerSupportSessions.id),
    clientReference: text("client_reference").notNull(),
    issueDomain: text("issue_domain").notNull(),
    issueType: text("issue_type").notNull(),
    status: text("status").notNull().default("draft"),
    persistencePermitted: boolean("persistence_permitted").notNull().default(false),
    authoritativeCaseFileCreated: boolean("authoritative_case_file_created")
      .notNull()
      .default(false),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => [index("customer_support_case_drafts_session_idx").on(table.supportSessionId)],
);

export const customerSupportHandoffs = pgTable(
  "customer_support_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supportSessionId: uuid("support_session_id")
      .notNull()
      .references(() => customerSupportSessions.id),
    clientReference: text("client_reference").notNull(),
    target: text("target").notNull(),
    issueType: text("issue_type").notNull(),
    locale: text("locale").notNull(),
    summary: text("summary").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    status: text("status").notNull().default("prepared"),
    dispatchPermitted: boolean("dispatch_permitted").notNull().default(false),
    createdAt,
  },
  (table) => [index("customer_support_handoffs_session_idx").on(table.supportSessionId)],
);

export const customerSupportRuntimeExecutions = pgTable(
  "customer_support_runtime_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supportSessionId: uuid("support_session_id")
      .notNull()
      .references(() => customerSupportSessions.id),
    requestedAction: text("requested_action").notNull(),
    status: text("status").notNull().default("disabled"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
    correlationId: text("correlation_id").notNull(),
    contextSnapshot: jsonb("context_snapshot").notNull(),
    createdAt,
  },
  (table) => [index("customer_support_runtime_executions_session_idx").on(table.supportSessionId)],
);

export const customerSupportAuditEvents = pgTable(
  "customer_support_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supportSessionId: uuid("support_session_id").references(() => customerSupportSessions.id),
    clientReference: text("client_reference").notNull(),
    action: text("action").notNull(),
    actorReference: text("actor_reference"),
    purposeReference: text("purpose_reference"),
    scopeReferences: jsonb("scope_references").notNull(),
    policyVersionVector: jsonb("policy_version_vector").notNull(),
    result: text("result").notNull(),
    correlationId: text("correlation_id").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt,
  },
  (table) => [
    index("customer_support_audit_events_session_idx").on(table.supportSessionId),
    index("customer_support_audit_events_correlation_idx").on(table.correlationId),
  ],
);
