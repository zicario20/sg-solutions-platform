import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const recommendationRequests = pgTable(
  "recommendation_requests",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id"),
    domain: varchar("domain", { length: 48 }).notNull(),
    goalCode: varchar("goal_code", { length: 96 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    contextSnapshotId: text("context_snapshot_id").notNull(),
    candidateSetId: text("candidate_set_id").notNull(),
    constraintSetId: text("constraint_set_id").notNull(),
    policyVersionId: text("policy_version_id").notNull(),
    personalizationConsentId: text("personalization_consent_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("recommendation_requests_domain_status_idx").on(table.domain, table.status)],
);

export const recommendationContextSnapshots = pgTable(
  "recommendation_context_snapshots",
  {
    id: text("id").primaryKey(),
    domain: varchar("domain", { length: 48 }).notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    factSnapshot: jsonb("fact_snapshot").notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    consentId: text("consent_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("recommendation_context_domain_idx").on(table.domain)],
);

export const recommendationCandidateSets = pgTable(
  "recommendation_candidate_sets",
  {
    id: text("id").primaryKey(),
    domain: varchar("domain", { length: 48 }).notNull(),
    version: integer("version").notNull(),
    candidateSnapshot: jsonb("candidate_snapshot").notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendation_candidate_sets_version_unique").on(table.id, table.version),
  ],
);

export const recommendationPolicyVersions = pgTable(
  "recommendation_policy_versions",
  {
    id: text("id").primaryKey(),
    policyId: text("policy_id").notNull(),
    domain: varchar("domain", { length: 48 }).notNull(),
    version: integer("version").notNull(),
    featureWeights: jsonb("feature_weights").notNull(),
    allowedFeatureCodes: jsonb("allowed_feature_codes").notNull(),
    tieBreakOrder: jsonb("tie_break_order").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendation_policy_versions_unique").on(table.policyId, table.version),
    index("recommendation_policy_domain_status_idx").on(table.domain, table.status),
  ],
);

export const recommendationConstraintSets = pgTable(
  "recommendation_constraint_sets",
  {
    id: text("id").primaryKey(),
    domain: varchar("domain", { length: 48 }).notNull(),
    version: integer("version").notNull(),
    constraints: jsonb("constraints").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendation_constraint_sets_version_unique").on(table.id, table.version),
  ],
);

export const recommendationRuns = pgTable(
  "recommendation_runs",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id").notNull(),
    domain: varchar("domain", { length: 48 }).notNull(),
    policyVersionId: text("policy_version_id").notNull(),
    candidateSetSnapshot: jsonb("candidate_set_snapshot").notNull(),
    contextSnapshot: jsonb("context_snapshot").notNull(),
    constraintSetSnapshot: jsonb("constraint_set_snapshot").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("recommendation_runs_request_status_idx").on(table.requestId, table.status)],
);

export const recommendationOutputs = pgTable(
  "recommendation_outputs",
  {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    rankedCandidates: jsonb("ranked_candidates").notNull(),
    primaryCandidateId: text("primary_candidate_id"),
    warnings: jsonb("warnings").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("recommendation_outputs_run_status_idx").on(table.runId, table.status)],
);

export const recommendationPreferenceProfiles = pgTable(
  "recommendation_preference_profiles",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    consentId: text("consent_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    explicitPreferences: jsonb("explicit_preferences").notNull(),
    derivedPreferences: jsonb("derived_preferences").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("recommendation_preferences_client_status_idx").on(table.clientId, table.status),
  ],
);

export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: text("id").primaryKey(),
    outputId: text("output_id").notNull(),
    clientId: text("client_id"),
    feedbackType: varchar("feedback_type", { length: 24 }).notNull(),
    detail: text("detail"),
    ...timestamps,
  },
  (table) => [index("recommendation_feedback_output_idx").on(table.outputId)],
);

export const recommendationFairnessReviews = pgTable(
  "recommendation_fairness_reviews",
  {
    id: text("id").primaryKey(),
    runId: text("run_id"),
    policyVersionId: text("policy_version_id").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    detectedFeatures: jsonb("detected_features").notNull(),
    reviewerId: text("reviewer_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    notes: text("notes").notNull(),
    ...timestamps,
  },
  (table) => [
    index("recommendation_fairness_policy_status_idx").on(table.policyVersionId, table.status),
  ],
);

export const recommendationHumanReviews = pgTable(
  "recommendation_human_reviews",
  {
    id: text("id").primaryKey(),
    outputId: text("output_id").notNull(),
    reviewerId: text("reviewer_id").notNull(),
    decision: varchar("decision", { length: 40 }).notNull(),
    candidateOrder: jsonb("candidate_order").notNull(),
    reason: text("reason").notNull(),
    ...timestamps,
  },
  (table) => [index("recommendation_human_reviews_output_idx").on(table.outputId)],
);

export const recommendationAiExplanations = pgTable(
  "recommendation_ai_explanations",
  {
    id: text("id").primaryKey(),
    outputId: text("output_id").notNull(),
    sourceIds: jsonb("source_ids").notNull(),
    claims: jsonb("claims").notNull(),
    content: text("content").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [index("recommendation_ai_explanations_output_idx").on(table.outputId)],
);

export const recommendationExperimentExposures = pgTable(
  "recommendation_experiment_exposures",
  {
    id: text("id").primaryKey(),
    experimentId: text("experiment_id").notNull(),
    requestId: text("request_id").notNull(),
    variant: varchar("variant", { length: 64 }).notNull(),
    stoppedByGuardrail: boolean("stopped_by_guardrail").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendation_experiment_request_unique").on(table.experimentId, table.requestId),
  ],
);
