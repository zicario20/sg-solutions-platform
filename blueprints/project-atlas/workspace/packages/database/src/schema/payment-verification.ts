import { sql } from "drizzle-orm";
import {
  bigint,
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

export const paymentVerificationGatewayRole = pgRole(
  "atlas_payment_verification_gateway",
).existing();

const only = (name: string) =>
  pgPolicy(`${name}_payment_verification_gateway_only`, {
    as: "permissive",
    for: "all",
    to: paymentVerificationGatewayRole,
    using: sql.raw("true"),
    withCheck: sql.raw("true"),
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

const money = (name: string) => bigint(name, { mode: "number" }).notNull();

export const paymentVerificationPolicies = pgTable(
  "payment_verification_policies",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    configuration: jsonb("configuration").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    retiredAt: timestamp("retired_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("payment_verification_policies_code_version_unique").on(table.code, table.version),
    check("payment_verification_policies_version_positive", sql.raw("version > 0")),
    check(
      "payment_verification_policies_status_valid",
      sql.raw("status in ('draft','approved','active','retired')"),
    ),
    only("payment_verification_policies"),
  ],
).enableRLS();

export const paymentObligations = pgTable(
  "payment_obligations",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    serviceOrderId: text("service_order_id"),
    quoteId: text("quote_id"),
    invoiceId: text("invoice_id"),
    obligationType: varchar("obligation_type", { length: 32 }).notNull(),
    amountDueMinor: money("amount_due_minor"),
    currency: varchar("currency", { length: 3 }).notNull(),
    dueStage: varchar("due_stage", { length: 96 }).notNull(),
    pricingSnapshotId: text("pricing_snapshot_id").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    check(
      "payment_obligations_type_valid",
      sql.raw("obligation_type in ('full_payment','deposit','installment','invoice','adjustment')"),
    ),
    check("payment_obligations_money_valid", sql.raw("amount_due_minor >= 0 and currency = 'USD'")),
    check("payment_obligations_version_positive", sql.raw("version > 0")),
    check(
      "payment_obligations_status_valid",
      sql.raw(
        "status in ('draft','active','partially_satisfied','satisfied','overpaid','cancelled','superseded','written_off_future','unknown')",
      ),
    ),
    index("payment_obligations_client_status_idx").on(table.clientId, table.status),
    index("payment_obligations_service_order_idx").on(table.serviceOrderId),
    only("payment_obligations"),
  ],
).enableRLS();

export const paymentVerificationCases = pgTable(
  "payment_verification_cases",
  {
    id: text("id").primaryKey(),
    paymentObligationId: text("payment_obligation_id")
      .notNull()
      .references(() => paymentObligations.id, { onDelete: "restrict" })
      .unique(),
    paymentTransactionIds: jsonb("payment_transaction_ids").notNull(),
    verificationPolicyId: text("verification_policy_id")
      .notNull()
      .references(() => paymentVerificationPolicies.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 32 }).notNull(),
    currentVerificationDecisionId: text("current_verification_decision_id"),
    ...timestamps,
  },
  (table) => [
    check(
      "payment_verification_cases_status_valid",
      sql.raw(
        "status in ('open','verification_pending','manual_review','verified','attention_required','closed')",
      ),
    ),
    index("payment_verification_cases_status_idx").on(table.status, table.updatedAt),
    only("payment_verification_cases"),
  ],
).enableRLS();

export const paymentVerificationCandidates = pgTable(
  "payment_verification_candidates",
  {
    id: text("id").primaryKey(),
    paymentObligationId: text("payment_obligation_id").references(() => paymentObligations.id, {
      onDelete: "restrict",
    }),
    sourceModule: varchar("source_module", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerEnvironment: varchar("provider_environment", { length: 16 }).notNull(),
    candidateType: varchar("candidate_type", { length: 48 }).notNull(),
    providerStateVersion: varchar("provider_state_version", { length: 256 }).notNull(),
    summarySnapshot: jsonb("summary_snapshot").notNull(),
    candidateHash: char("candidate_hash", { length: 64 }).notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_verification_candidates_source_valid",
      sql.raw("source_module in ('m043','provider_adapter','reconciliation','manual_external')"),
    ),
    check(
      "payment_verification_candidates_environment_valid",
      sql.raw("provider_environment in ('test','live','unknown')"),
    ),
    check(
      "payment_verification_candidates_type_valid",
      sql.raw(
        "candidate_type in ('payment_success_candidate','payment_failure_candidate','payment_processing_candidate','payment_requires_action_candidate','deposit_satisfied_candidate','invoice_paid_candidate','partial_payment_candidate','refund_adjustment_candidate','dispute_adjustment_candidate','reversal_candidate','unknown_outcome_candidate','manual_external_evidence_candidate')",
      ),
    ),
    check(
      "payment_verification_candidates_hash_valid",
      sql.raw("candidate_hash ~ '^[0-9a-f]{64}$'"),
    ),
    index("payment_verification_candidates_obligation_idx").on(
      table.paymentObligationId,
      table.receivedAt,
    ),
    only("payment_verification_candidates"),
  ],
).enableRLS();

export const paymentVerificationEvidence = pgTable(
  "payment_verification_evidence",
  {
    id: text("id").primaryKey(),
    verificationCaseId: text("verification_case_id")
      .notNull()
      .references(() => paymentVerificationCases.id, { onDelete: "restrict" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => paymentVerificationCandidates.id, { onDelete: "restrict" }),
    source: varchar("source", { length: 32 }).notNull(),
    sourceVersion: varchar("source_version", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerEnvironment: varchar("provider_environment", { length: 16 }).notNull(),
    evidenceType: varchar("evidence_type", { length: 48 }).notNull(),
    providerObjectReference: text("provider_object_reference"),
    providerEventReference: text("provider_event_reference"),
    status: varchar("status", { length: 32 }).notNull(),
    freshness: varchar("freshness", { length: 16 }).notNull(),
    trustTier: integer("trust_tier").notNull(),
    integrityHash: char("integrity_hash", { length: 64 }).notNull(),
    relationshipSnapshot: jsonb("relationship_snapshot").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "date" }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_verification_evidence_source_valid",
      sql.raw("source in ('m043','provider_adapter','reconciliation','manual_external')"),
    ),
    check(
      "payment_verification_evidence_environment_valid",
      sql.raw("provider_environment in ('test','live','unknown')"),
    ),
    check(
      "payment_verification_evidence_status_valid",
      sql.raw(
        "status in ('unverified','verified','verified_with_limitations','stale','conflicting','rejected','unavailable','unknown')",
      ),
    ),
    check(
      "payment_verification_evidence_freshness_valid",
      sql.raw("freshness in ('current','stale','unknown')"),
    ),
    check("payment_verification_evidence_trust_tier_valid", sql.raw("trust_tier between 1 and 6")),
    check("payment_verification_evidence_hash_valid", sql.raw("integrity_hash ~ '^[0-9a-f]{64}$'")),
    index("payment_verification_evidence_case_idx").on(table.verificationCaseId, table.receivedAt),
    only("payment_verification_evidence"),
  ],
).enableRLS();

export const paymentVerificationRuns = pgTable(
  "payment_verification_runs",
  {
    id: text("id").primaryKey(),
    verificationCaseId: text("verification_case_id")
      .notNull()
      .references(() => paymentVerificationCases.id, { onDelete: "restrict" }),
    paymentObligationId: text("payment_obligation_id")
      .notNull()
      .references(() => paymentObligations.id, { onDelete: "restrict" }),
    policyId: text("policy_id")
      .notNull()
      .references(() => paymentVerificationPolicies.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => paymentVerificationCandidates.id, { onDelete: "restrict" }),
    evidenceHash: char("evidence_hash", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    status: varchar("status", { length: 32 }).notNull(),
    initiatedByType: varchar("initiated_by_type", { length: 24 }).notNull(),
    initiatedByReference: text("initiated_by_reference"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check("payment_verification_runs_policy_version_positive", sql.raw("policy_version > 0")),
    check(
      "payment_verification_runs_status_valid",
      sql.raw(
        "status in ('queued','evaluating','decided','manual_review_required','failed','cancelled')",
      ),
    ),
    check(
      "payment_verification_runs_actor_valid",
      sql.raw("initiated_by_type in ('system','staff','service_account')"),
    ),
    check("payment_verification_runs_hash_valid", sql.raw("evidence_hash ~ '^[0-9a-f]{64}$'")),
    index("payment_verification_runs_case_idx").on(table.verificationCaseId, table.startedAt),
    only("payment_verification_runs"),
  ],
).enableRLS();

export const paymentVerificationDecisions = pgTable(
  "payment_verification_decisions",
  {
    id: text("id").primaryKey(),
    verificationCaseId: text("verification_case_id")
      .notNull()
      .references(() => paymentVerificationCases.id, { onDelete: "restrict" }),
    paymentObligationId: text("payment_obligation_id")
      .notNull()
      .references(() => paymentObligations.id, { onDelete: "restrict" }),
    verificationRunId: text("verification_run_id")
      .notNull()
      .references(() => paymentVerificationRuns.id, { onDelete: "restrict" }),
    policyId: text("policy_id")
      .notNull()
      .references(() => paymentVerificationPolicies.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    verifiedAmountMinor: money("verified_amount_minor"),
    adjustmentAmountMinor: money("adjustment_amount_minor"),
    unappliedAmountMinor: money("unapplied_amount_minor"),
    currency: varchar("currency", { length: 3 }).notNull(),
    evidenceHash: char("evidence_hash", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    reasonCodes: jsonb("reason_codes").notNull(),
    supersedesDecisionId: text("supersedes_decision_id"),
    decisionHash: char("decision_hash", { length: 64 }).notNull().unique(),
    decidedByType: varchar("decided_by_type", { length: 24 }).notNull(),
    decidedByReference: text("decided_by_reference"),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check("payment_verification_decisions_policy_version_positive", sql.raw("policy_version > 0")),
    check(
      "payment_verification_decisions_status_valid",
      sql.raw(
        "status in ('not_verified','verification_pending','processing','requires_client_action','verified_partial','verified_paid','verified_overpaid','verified_failed','verified_cancelled','verified_refunded_partial','verified_refunded_full','verified_disputed','verified_reversed','conflicting','insufficient_evidence','unknown')",
      ),
    ),
    check(
      "payment_verification_decisions_money_valid",
      sql.raw(
        "verified_amount_minor >= 0 and adjustment_amount_minor >= 0 and unapplied_amount_minor >= 0 and currency = 'USD'",
      ),
    ),
    check(
      "payment_verification_decisions_actor_valid",
      sql.raw("decided_by_type in ('system','staff','service_account')"),
    ),
    check(
      "payment_verification_decisions_evidence_hash_valid",
      sql.raw("evidence_hash ~ '^[0-9a-f]{64}$'"),
    ),
    check("payment_verification_decisions_hash_valid", sql.raw("decision_hash ~ '^[0-9a-f]{64}$'")),
    index("payment_verification_decisions_case_idx").on(table.verificationCaseId, table.decidedAt),
    index("payment_verification_decisions_obligation_idx").on(
      table.paymentObligationId,
      table.decidedAt,
    ),
    only("payment_verification_decisions"),
  ],
).enableRLS();

export const paymentVerificationRuleEvaluations = pgTable(
  "payment_verification_rule_evaluations",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id")
      .notNull()
      .references(() => paymentVerificationDecisions.id, { onDelete: "restrict" }),
    ruleType: varchar("rule_type", { length: 48 }).notNull(),
    outcome: varchar("outcome", { length: 16 }).notNull(),
    reasonCode: varchar("reason_code", { length: 96 }).notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_verification_rule_evaluations_outcome_valid",
      sql.raw("outcome in ('passed','failed','unknown')"),
    ),
    index("payment_verification_rule_evaluations_decision_idx").on(table.decisionId),
    only("payment_verification_rule_evaluations"),
  ],
).enableRLS();

export const paymentSufficiencyAssessments = pgTable(
  "payment_sufficiency_assessments",
  {
    id: text("id").primaryKey(),
    paymentObligationId: text("payment_obligation_id")
      .notNull()
      .references(() => paymentObligations.id, { onDelete: "restrict" }),
    decisionId: text("decision_id")
      .notNull()
      .references(() => paymentVerificationDecisions.id, { onDelete: "restrict" })
      .unique(),
    status: varchar("status", { length: 32 }).notNull(),
    amountDueMinor: money("amount_due_minor"),
    verifiedAmountMinor: money("verified_amount_minor"),
    outstandingAmountMinor: money("outstanding_amount_minor"),
    unappliedAmountMinor: money("unapplied_amount_minor"),
    currency: varchar("currency", { length: 3 }).notNull(),
    assessedAt: timestamp("assessed_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_sufficiency_assessments_status_valid",
      sql.raw(
        "status in ('not_satisfied','partially_satisfied','satisfied','overpaid','indeterminate','not_applicable')",
      ),
    ),
    check(
      "payment_sufficiency_assessments_money_valid",
      sql.raw(
        "amount_due_minor >= 0 and verified_amount_minor >= 0 and outstanding_amount_minor >= 0 and unapplied_amount_minor >= 0 and currency = 'USD'",
      ),
    ),
    index("payment_sufficiency_assessments_obligation_idx").on(
      table.paymentObligationId,
      table.assessedAt,
    ),
    only("payment_sufficiency_assessments"),
  ],
).enableRLS();

export const serviceOrderPaymentSummaries = pgTable(
  "service_order_payment_summaries",
  {
    serviceOrderId: text("service_order_id").primaryKey(),
    paymentObligationIds: jsonb("payment_obligation_ids").notNull(),
    latestDecisionIds: jsonb("latest_decision_ids").notNull(),
    sufficiencyStatus: varchar("sufficiency_status", { length: 32 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (_table) => [
    check(
      "service_order_payment_summaries_status_valid",
      sql.raw(
        "sufficiency_status in ('not_satisfied','partially_satisfied','satisfied','overpaid','indeterminate','not_applicable')",
      ),
    ),
    only("service_order_payment_summaries"),
  ],
).enableRLS();

export const paymentStartGates = pgTable(
  "payment_start_gates",
  {
    id: text("id").primaryKey(),
    paymentObligationId: text("payment_obligation_id")
      .notNull()
      .references(() => paymentObligations.id, { onDelete: "restrict" }),
    serviceOrderId: text("service_order_id"),
    decisionId: text("decision_id")
      .notNull()
      .references(() => paymentVerificationDecisions.id, { onDelete: "restrict" })
      .unique(),
    sufficiencyAssessmentId: text("sufficiency_assessment_id")
      .notNull()
      .references(() => paymentSufficiencyAssessments.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 48 }).notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_start_gates_status_valid",
      sql.raw(
        "status in ('not_evaluated','payment_not_satisfied','payment_satisfied_pending_human_approval','blocked_by_refund_or_dispute','unavailable')",
      ),
    ),
    index("payment_start_gates_service_order_idx").on(table.serviceOrderId, table.evaluatedAt),
    only("payment_start_gates"),
  ],
).enableRLS();

export const paymentVerificationManualReviews = pgTable(
  "payment_verification_manual_reviews",
  {
    id: text("id").primaryKey(),
    verificationCaseId: text("verification_case_id")
      .notNull()
      .references(() => paymentVerificationCases.id, { onDelete: "restrict" }),
    decisionId: text("decision_id")
      .notNull()
      .references(() => paymentVerificationDecisions.id, { onDelete: "restrict" }),
    queue: varchar("queue", { length: 48 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    reasonCodes: jsonb("reason_codes").notNull(),
    requiresFourEyes: boolean("requires_four_eyes").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    check(
      "payment_verification_manual_reviews_queue_valid",
      sql.raw(
        "queue in ('verification_pending','evidence_refresh','unknown_outcome','manual_external_payment','amount_currency_mismatch','ownership_security_review','duplicate_payment','overpayment','refund_reverification','dispute_reverification','override_review','gate_handoff_failure','policy_review','security_incident')",
      ),
    ),
    check(
      "payment_verification_manual_reviews_status_valid",
      sql.raw("status in ('open','assigned','in_review','resolved','cancelled')"),
    ),
    index("payment_verification_manual_reviews_queue_idx").on(table.queue, table.status),
    only("payment_verification_manual_reviews"),
  ],
).enableRLS();

export const paymentVerificationOverrides = pgTable(
  "payment_verification_overrides",
  {
    id: text("id").primaryKey(),
    verificationCaseId: text("verification_case_id")
      .notNull()
      .references(() => paymentVerificationCases.id, { onDelete: "restrict" }),
    decisionId: text("decision_id")
      .notNull()
      .references(() => paymentVerificationDecisions.id, { onDelete: "restrict" }),
    requestedByType: varchar("requested_by_type", { length: 24 }).notNull(),
    requestedByReference: text("requested_by_reference"),
    approvalReference: text("approval_reference").notNull(),
    reasonCode: varchar("reason_code", { length: 96 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (_table) => [
    check("payment_verification_overrides_actor_valid", sql.raw("requested_by_type = 'staff'")),
    check(
      "payment_verification_overrides_status_valid",
      sql.raw("status in ('requested','approved','rejected','expired')"),
    ),
    only("payment_verification_overrides"),
  ],
).enableRLS();

export const paymentVerificationInbox = pgTable(
  "payment_verification_inbox",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => paymentVerificationCandidates.id, { onDelete: "restrict" })
      .unique(),
    status: varchar("status", { length: 32 }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_verification_inbox_status_valid",
      sql.raw("status in ('received','processing','processed','failed','dead_lettered')"),
    ),
    check("payment_verification_inbox_attempt_positive", sql.raw("attempt_count > 0")),
    index("payment_verification_inbox_processing_idx").on(table.status, table.receivedAt),
    only("payment_verification_inbox"),
  ],
).enableRLS();

export const paymentVerificationOutbox = pgTable(
  "payment_verification_outbox",
  {
    id: text("id").primaryKey(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    aggregateId: text("aggregate_id").notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 512 }).notNull().unique(),
    dispatchState: varchar("dispatch_state", { length: 24 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    check(
      "payment_verification_outbox_event_valid",
      sql.raw(
        "event_type in ('payment_verification_decided','payment_start_gate_evaluated','payment_verification_manual_review_requested')",
      ),
    ),
    check(
      "payment_verification_outbox_state_valid",
      sql.raw("dispatch_state in ('blocked','pending','dispatched','dead_lettered')"),
    ),
    index("payment_verification_outbox_dispatch_idx").on(table.dispatchState, table.createdAt),
    only("payment_verification_outbox"),
  ],
).enableRLS();

export const paymentVerificationDeadLetters = pgTable(
  "payment_verification_dead_letters",
  {
    id: text("id").primaryKey(),
    inboxId: text("inbox_id")
      .notNull()
      .references(() => paymentVerificationInbox.id, { onDelete: "restrict" })
      .unique(),
    failureCode: varchar("failure_code", { length: 96 }).notNull(),
    failureSummary: text("failure_summary").notNull(),
    attemptCount: integer("attempt_count").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  },
  (_table) => [
    check("payment_verification_dead_letters_attempt_positive", sql.raw("attempt_count > 0")),
    check(
      "payment_verification_dead_letters_status_valid",
      sql.raw("status in ('open','replaying','resolved','discarded')"),
    ),
    only("payment_verification_dead_letters"),
  ],
).enableRLS();

export const paymentVerificationAuditEvents = pgTable(
  "payment_verification_audit_events",
  {
    id: text("id").primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    actorType: varchar("actor_type", { length: 24 }).notNull(),
    actorReference: text("actor_reference"),
    resourceType: varchar("resource_type", { length: 48 }).notNull(),
    resourceId: text("resource_id").notNull(),
    result: varchar("result", { length: 24 }).notNull(),
    correlationId: varchar("correlation_id", { length: 256 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check(
      "payment_verification_audit_events_action_valid",
      sql.raw(
        "action in ('candidate_admitted','verification_evaluated','manual_review_requested','override_requested','gate_evaluated','runtime_operation_blocked')",
      ),
    ),
    check(
      "payment_verification_audit_events_actor_valid",
      sql.raw("actor_type in ('system','staff','service_account')"),
    ),
    check(
      "payment_verification_audit_events_result_valid",
      sql.raw("result in ('accepted','rejected','manual_review','blocked')"),
    ),
    index("payment_verification_audit_events_resource_idx").on(
      table.resourceType,
      table.resourceId,
      table.occurredAt,
    ),
    only("payment_verification_audit_events"),
  ],
).enableRLS();
