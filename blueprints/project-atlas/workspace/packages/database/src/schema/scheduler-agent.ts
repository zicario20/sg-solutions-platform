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

export const schedulerAgentConfigurations = pgTable(
  "scheduler_agent_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentDefinitionReference: text("agent_definition_reference").notNull(),
    agentVersionReference: text("agent_version_reference").notNull(),
    appointmentRegistryVersionReference: text("appointment_registry_version_reference").notNull(),
    availabilityPolicyVersionReference: text("availability_policy_version_reference").notNull(),
    toolPolicyVersionReference: text("tool_policy_version_reference").notNull(),
    status: text("status").notNull().default("disabled"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("scheduler_agent_configurations_agent_version_uq").on(table.agentVersionReference),
  ],
);

export const schedulerSessions = pgTable(
  "scheduler_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceHandoffReference: text("source_handoff_reference"),
    surface: text("surface").notNull(),
    channel: text("channel").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull().default("created"),
    appointmentTypeReference: text("appointment_type_reference"),
    subjectReference: text("subject_reference"),
    timeZoneContext: jsonb("time_zone_context").notNull(),
    authoritativeAppointmentReference: text("authoritative_appointment_reference"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("scheduler_sessions_subject_status_idx").on(table.subjectReference, table.status),
    index("scheduler_sessions_source_handoff_idx").on(table.sourceHandoffReference),
  ],
);

export const schedulerBookingRequests = pgTable(
  "scheduler_booking_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schedulerSessionId: uuid("scheduler_session_id")
      .notNull()
      .references(() => schedulerSessions.id),
    appointmentTypeReference: text("appointment_type_reference").notNull(),
    selectedSlotTokenReference: text("selected_slot_token_reference").notNull(),
    subjectReference: text("subject_reference").notNull(),
    timeZone: text("time_zone").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("prepared"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
    authoritativeAppointmentReference: text("authoritative_appointment_reference"),
    createdAt,
  },
  (table) => [
    uniqueIndex("scheduler_booking_requests_session_idempotency_uq").on(
      table.schedulerSessionId,
      table.idempotencyKey,
    ),
    index("scheduler_booking_requests_status_idx").on(table.status),
  ],
);

export const schedulerHumanHandoffs = pgTable(
  "scheduler_human_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schedulerSessionId: uuid("scheduler_session_id")
      .notNull()
      .references(() => schedulerSessions.id),
    target: text("target").notNull(),
    reason: text("reason").notNull(),
    appointmentTypeReference: text("appointment_type_reference"),
    timeZone: text("time_zone"),
    locale: text("locale").notNull(),
    clientSafeSummary: text("client_safe_summary").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    status: text("status").notNull().default("prepared"),
    dispatchPermitted: boolean("dispatch_permitted").notNull().default(false),
    createdAt,
  },
  (table) => [index("scheduler_human_handoffs_session_idx").on(table.schedulerSessionId)],
);

export const schedulerRuntimeExecutions = pgTable(
  "scheduler_runtime_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schedulerSessionId: uuid("scheduler_session_id")
      .notNull()
      .references(() => schedulerSessions.id),
    requestedAction: text("requested_action").notNull(),
    status: text("status").notNull().default("disabled"),
    executionPermitted: boolean("execution_permitted").notNull().default(false),
    correlationId: text("correlation_id").notNull(),
    contextSnapshot: jsonb("context_snapshot").notNull(),
    createdAt,
  },
  (table) => [index("scheduler_runtime_executions_session_idx").on(table.schedulerSessionId)],
);

export const schedulerAuditEvents = pgTable(
  "scheduler_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schedulerSessionId: uuid("scheduler_session_id").references(() => schedulerSessions.id),
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
    index("scheduler_audit_events_session_idx").on(table.schedulerSessionId),
    index("scheduler_audit_events_correlation_idx").on(table.correlationId),
  ],
);
