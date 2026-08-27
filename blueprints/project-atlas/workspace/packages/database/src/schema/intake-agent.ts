import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const intakeAgentConfigurations = pgTable(
  "intake_agent_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentDefinitionReference: text("agent_definition_reference").notNull(),
    agentVersionReference: text("agent_version_reference").notNull(),
    intakeRegistryVersion: text("intake_registry_version").notNull(),
    policyReferences: jsonb("policy_references").notNull(),
    status: text("status").notNull().default("disabled"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("intake_agent_configurations_agent_version_uq").on(table.agentVersionReference),
  ],
);

export const intakeDefinitions = pgTable(
  "intake_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeCode: text("intake_code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    ownerDomain: text("owner_domain").notNull(),
    intakeType: text("intake_type").notNull(),
    primarySubjectType: text("primary_subject_type").notNull(),
    currentVersionReference: text("current_version_reference"),
    lifecycleStatus: text("lifecycle_status").notNull().default("draft"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("intake_definitions_intake_code_uq").on(table.intakeCode)],
);

export const intakeVersions = pgTable(
  "intake_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeDefinitionId: uuid("intake_definition_id")
      .notNull()
      .references(() => intakeDefinitions.id),
    version: text("version").notNull(),
    purposeStatement: text("purpose_statement").notNull(),
    configurationSnapshot: jsonb("configuration_snapshot").notNull(),
    validationRuleSetReference: text("validation_rule_set_reference").notNull(),
    completionPolicyReference: text("completion_policy_reference").notNull(),
    publicationStatus: text("publication_status").notNull().default("not_published"),
    immutable: boolean("immutable").notNull().default(false),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    uniqueIndex("intake_versions_definition_version_uq").on(
      table.intakeDefinitionId,
      table.version,
    ),
    index("intake_versions_publication_status_idx").on(table.publicationStatus),
  ],
);

export const intakeSessions = pgTable(
  "intake_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeDefinitionId: uuid("intake_definition_id")
      .notNull()
      .references(() => intakeDefinitions.id),
    intakeVersionReference: text("intake_version_reference").notNull(),
    serviceDefinitionReference: text("service_definition_reference"),
    serviceVersionReference: text("service_version_reference"),
    serviceOrderReference: text("service_order_reference"),
    caseFileReference: text("case_file_reference"),
    leadReference: text("lead_reference"),
    clientReference: text("client_reference"),
    organizationReference: text("organization_reference"),
    sourceHandoffReference: text("source_handoff_reference"),
    surface: text("surface").notNull(),
    mode: text("mode").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull().default("created"),
    sessionVersion: integer("session_version").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("intake_sessions_client_status_idx").on(table.clientReference, table.status),
    index("intake_sessions_source_handoff_idx").on(table.sourceHandoffReference),
  ],
);

export const intakeParticipants = pgTable(
  "intake_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    role: text("role").notNull(),
    subjectReference: text("subject_reference").notNull(),
    relationshipToPrimarySubject: text("relationship_to_primary_subject").notNull(),
    identityAssurance: text("identity_assurance").notNull().default("unknown"),
    authorizationReference: text("authorization_reference"),
    required: boolean("required").notNull().default(false),
    status: text("status").notNull().default("invited"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("intake_participants_session_subject_role_uq").on(
      table.intakeSessionId,
      table.subjectReference,
      table.role,
    ),
  ],
);

export const intakeAnswerRecords = pgTable(
  "intake_answer_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => intakeParticipants.id),
    fieldCode: text("field_code").notNull(),
    fieldVersion: text("field_version").notNull(),
    answerValueReference: text("answer_value_reference").notNull(),
    answerStatus: text("answer_status").notNull(),
    verificationStatus: text("verification_status").notNull(),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference"),
    enteredByType: text("entered_by_type").notNull(),
    enteredByReference: text("entered_by_reference"),
    dataClassification: text("data_classification").notNull(),
    supersedesAnswerReference: text("supersedes_answer_reference"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("intake_answers_session_participant_idx").on(table.intakeSessionId, table.participantId),
    index("intake_answers_field_code_idx").on(table.fieldCode),
  ],
);

export const intakeRuleEvaluationRecords = pgTable(
  "intake_rule_evaluation_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    ruleSetVersion: text("rule_set_version").notNull(),
    triggerAnswerReferences: jsonb("trigger_answer_references").notNull(),
    rulesEvaluated: jsonb("rules_evaluated").notNull(),
    rulesMatched: jsonb("rules_matched").notNull(),
    changes: jsonb("changes").notNull(),
    warnings: jsonb("warnings").notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => [index("intake_rule_evaluations_session_idx").on(table.intakeSessionId)],
);

export const intakeDraftSnapshots = pgTable(
  "intake_draft_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    sessionVersion: integer("session_version").notNull(),
    answerVersionVector: jsonb("answer_version_vector").notNull(),
    currentStepCode: text("current_step_code").notNull(),
    visibleStepCodes: jsonb("visible_step_codes").notNull(),
    pendingReferences: jsonb("pending_references").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt,
  },
  (table) => [
    uniqueIndex("intake_draft_snapshots_session_version_uq").on(
      table.intakeSessionId,
      table.sessionVersion,
    ),
  ],
);

export const intakeCompletionAssessments = pgTable(
  "intake_completion_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    intakeVersionReference: text("intake_version_reference").notNull(),
    completionPolicyReference: text("completion_policy_reference").notNull(),
    dimensionResults: jsonb("dimension_results").notNull(),
    missingItemReferences: jsonb("missing_item_references").notNull(),
    blockingItemReferences: jsonb("blocking_item_references").notNull(),
    warningItemReferences: jsonb("warning_item_references").notNull(),
    completionStatus: text("completion_status").notNull(),
    contentHash: text("content_hash").notNull(),
    assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => [index("intake_completion_assessments_session_idx").on(table.intakeSessionId)],
);

export const intakeReadinessAssessments = pgTable(
  "intake_readiness_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    readinessProfileReference: text("readiness_profile_reference").notNull(),
    destinationType: text("destination_type").notNull(),
    completionAssessmentReference: text("completion_assessment_reference").notNull(),
    checkResults: jsonb("check_results").notNull(),
    readinessStatus: text("readiness_status").notNull(),
    contentHash: text("content_hash").notNull(),
    assessedAt: timestamp("assessed_at", { withTimezone: true }).notNull(),
    createdAt,
  },
  (table) => [
    index("intake_readiness_assessments_session_destination_idx").on(
      table.intakeSessionId,
      table.destinationType,
    ),
  ],
);

export const intakeSpecialistHandoffs = pgTable(
  "intake_specialist_handoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id")
      .notNull()
      .references(() => intakeSessions.id),
    targetReference: text("target_reference").notNull(),
    scopedReferences: jsonb("scoped_references").notNull(),
    readinessSnapshotReference: text("readiness_snapshot_reference").notNull(),
    status: text("status").notNull().default("prepared"),
    dispatchPermitted: boolean("dispatch_permitted").notNull().default(false),
    contentHash: text("content_hash").notNull(),
    createdAt,
  },
  (table) => [index("intake_specialist_handoffs_session_idx").on(table.intakeSessionId)],
);

export const intakeAuditEvents = pgTable(
  "intake_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    intakeSessionId: uuid("intake_session_id").references(() => intakeSessions.id),
    participantReference: text("participant_reference"),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull(),
    actorReference: text("actor_reference"),
    purposeReference: text("purpose_reference"),
    scopeReferences: jsonb("scope_references").notNull(),
    beforeReference: text("before_reference"),
    afterReference: text("after_reference"),
    policyVersionVector: jsonb("policy_version_vector").notNull(),
    result: text("result").notNull(),
    correlationId: text("correlation_id").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt,
  },
  (table) => [
    index("intake_audit_events_session_idx").on(table.intakeSessionId),
    index("intake_audit_events_correlation_idx").on(table.correlationId),
  ],
);
