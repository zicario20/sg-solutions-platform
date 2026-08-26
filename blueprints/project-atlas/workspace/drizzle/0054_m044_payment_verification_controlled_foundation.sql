-- M044 Payment Verification controlled foundation.
-- Authored only. Do not apply until the Product Owner approves payment policy, M043/M046/M045/M068
-- integration, backup evidence, independent review and RLS validation.
-- This migration stores reference-only verification evidence. It does not call a provider, mark an
-- order paid, grant an entitlement, start a service or enable a payment runtime.

CREATE TABLE payment_verification_policies (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL,
  version integer NOT NULL,
  status varchar(24) NOT NULL,
  configuration jsonb NOT NULL,
  approved_by text,
  approved_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_policies_code_version_unique UNIQUE (code, version),
  CONSTRAINT payment_verification_policies_version_positive CHECK (version > 0),
  CONSTRAINT payment_verification_policies_status_valid CHECK (status IN ('draft','approved','active','retired'))
);

CREATE TABLE payment_obligations (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  service_order_id text,
  quote_id text,
  invoice_id text,
  obligation_type varchar(32) NOT NULL,
  amount_due_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  due_stage varchar(96) NOT NULL,
  pricing_snapshot_id text NOT NULL,
  status varchar(32) NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT payment_obligations_type_valid CHECK (obligation_type IN ('full_payment','deposit','installment','invoice','adjustment')),
  CONSTRAINT payment_obligations_money_valid CHECK (amount_due_minor >= 0 AND currency = 'USD'),
  CONSTRAINT payment_obligations_version_positive CHECK (version > 0),
  CONSTRAINT payment_obligations_status_valid CHECK (status IN ('draft','active','partially_satisfied','satisfied','overpaid','cancelled','superseded','written_off_future','unknown'))
);

CREATE TABLE payment_verification_cases (
  id text PRIMARY KEY,
  payment_obligation_id text NOT NULL UNIQUE REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  payment_transaction_ids jsonb NOT NULL,
  verification_policy_id text NOT NULL REFERENCES payment_verification_policies(id) ON DELETE RESTRICT,
  status varchar(32) NOT NULL,
  current_verification_decision_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_cases_status_valid CHECK (status IN ('open','verification_pending','manual_review','verified','attention_required','closed'))
);

CREATE TABLE payment_verification_candidates (
  id text PRIMARY KEY,
  payment_obligation_id text REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  source_module varchar(32) NOT NULL,
  provider varchar(64) NOT NULL,
  provider_environment varchar(16) NOT NULL,
  candidate_type varchar(48) NOT NULL,
  provider_state_version varchar(256) NOT NULL,
  summary_snapshot jsonb NOT NULL,
  candidate_hash char(64) NOT NULL,
  correlation_id varchar(256) NOT NULL,
  received_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_candidates_source_valid CHECK (source_module IN ('m043','provider_adapter','reconciliation','manual_external')),
  CONSTRAINT payment_verification_candidates_environment_valid CHECK (provider_environment IN ('test','live','unknown')),
  CONSTRAINT payment_verification_candidates_type_valid CHECK (candidate_type IN ('payment_success_candidate','payment_failure_candidate','payment_processing_candidate','payment_requires_action_candidate','deposit_satisfied_candidate','invoice_paid_candidate','partial_payment_candidate','refund_adjustment_candidate','dispute_adjustment_candidate','reversal_candidate','unknown_outcome_candidate','manual_external_evidence_candidate')),
  CONSTRAINT payment_verification_candidates_hash_valid CHECK (candidate_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE payment_verification_evidence (
  id text PRIMARY KEY,
  verification_case_id text NOT NULL REFERENCES payment_verification_cases(id) ON DELETE RESTRICT,
  candidate_id text NOT NULL REFERENCES payment_verification_candidates(id) ON DELETE RESTRICT,
  source varchar(32) NOT NULL,
  source_version varchar(64) NOT NULL,
  provider varchar(64) NOT NULL,
  provider_environment varchar(16) NOT NULL,
  evidence_type varchar(48) NOT NULL,
  provider_object_reference text,
  provider_event_reference text,
  status varchar(32) NOT NULL,
  freshness varchar(16) NOT NULL,
  trust_tier integer NOT NULL,
  integrity_hash char(64) NOT NULL,
  relationship_snapshot jsonb NOT NULL,
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_evidence_source_valid CHECK (source IN ('m043','provider_adapter','reconciliation','manual_external')),
  CONSTRAINT payment_verification_evidence_environment_valid CHECK (provider_environment IN ('test','live','unknown')),
  CONSTRAINT payment_verification_evidence_status_valid CHECK (status IN ('unverified','verified','verified_with_limitations','stale','conflicting','rejected','unavailable','unknown')),
  CONSTRAINT payment_verification_evidence_freshness_valid CHECK (freshness IN ('current','stale','unknown')),
  CONSTRAINT payment_verification_evidence_trust_tier_valid CHECK (trust_tier BETWEEN 1 AND 6),
  CONSTRAINT payment_verification_evidence_hash_valid CHECK (integrity_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE payment_verification_runs (
  id text PRIMARY KEY,
  verification_case_id text NOT NULL REFERENCES payment_verification_cases(id) ON DELETE RESTRICT,
  payment_obligation_id text NOT NULL REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  policy_id text NOT NULL REFERENCES payment_verification_policies(id) ON DELETE RESTRICT,
  policy_version integer NOT NULL,
  candidate_id text NOT NULL REFERENCES payment_verification_candidates(id) ON DELETE RESTRICT,
  evidence_hash char(64) NOT NULL,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  status varchar(32) NOT NULL,
  initiated_by_type varchar(24) NOT NULL,
  initiated_by_reference text,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_runs_policy_version_positive CHECK (policy_version > 0),
  CONSTRAINT payment_verification_runs_status_valid CHECK (status IN ('queued','evaluating','decided','manual_review_required','failed','cancelled')),
  CONSTRAINT payment_verification_runs_actor_valid CHECK (initiated_by_type IN ('system','staff','service_account')),
  CONSTRAINT payment_verification_runs_hash_valid CHECK (evidence_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE payment_verification_decisions (
  id text PRIMARY KEY,
  verification_case_id text NOT NULL REFERENCES payment_verification_cases(id) ON DELETE RESTRICT,
  payment_obligation_id text NOT NULL REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  verification_run_id text NOT NULL REFERENCES payment_verification_runs(id) ON DELETE RESTRICT,
  policy_id text NOT NULL REFERENCES payment_verification_policies(id) ON DELETE RESTRICT,
  policy_version integer NOT NULL,
  status varchar(40) NOT NULL,
  verified_amount_minor bigint NOT NULL,
  adjustment_amount_minor bigint NOT NULL,
  unapplied_amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  evidence_hash char(64) NOT NULL,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  reason_codes jsonb NOT NULL,
  supersedes_decision_id text REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  decision_hash char(64) NOT NULL UNIQUE,
  decided_by_type varchar(24) NOT NULL,
  decided_by_reference text,
  decided_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_decisions_policy_version_positive CHECK (policy_version > 0),
  CONSTRAINT payment_verification_decisions_status_valid CHECK (status IN ('not_verified','verification_pending','processing','requires_client_action','verified_partial','verified_paid','verified_overpaid','verified_failed','verified_cancelled','verified_refunded_partial','verified_refunded_full','verified_disputed','verified_reversed','conflicting','insufficient_evidence','unknown')),
  CONSTRAINT payment_verification_decisions_money_valid CHECK (verified_amount_minor >= 0 AND adjustment_amount_minor >= 0 AND unapplied_amount_minor >= 0 AND currency = 'USD'),
  CONSTRAINT payment_verification_decisions_actor_valid CHECK (decided_by_type IN ('system','staff','service_account')),
  CONSTRAINT payment_verification_decisions_evidence_hash_valid CHECK (evidence_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT payment_verification_decisions_hash_valid CHECK (decision_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE payment_verification_rule_evaluations (
  id text PRIMARY KEY,
  decision_id text NOT NULL REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  rule_type varchar(48) NOT NULL,
  outcome varchar(16) NOT NULL,
  reason_code varchar(96) NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_rule_evaluations_outcome_valid CHECK (outcome IN ('passed','failed','unknown'))
);

CREATE TABLE payment_sufficiency_assessments (
  id text PRIMARY KEY,
  payment_obligation_id text NOT NULL REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  decision_id text NOT NULL UNIQUE REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  status varchar(32) NOT NULL,
  amount_due_minor bigint NOT NULL,
  verified_amount_minor bigint NOT NULL,
  outstanding_amount_minor bigint NOT NULL,
  unapplied_amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  assessed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_sufficiency_assessments_status_valid CHECK (status IN ('not_satisfied','partially_satisfied','satisfied','overpaid','indeterminate','not_applicable')),
  CONSTRAINT payment_sufficiency_assessments_money_valid CHECK (amount_due_minor >= 0 AND verified_amount_minor >= 0 AND outstanding_amount_minor >= 0 AND unapplied_amount_minor >= 0 AND currency = 'USD')
);

CREATE TABLE service_order_payment_summaries (
  service_order_id text PRIMARY KEY,
  payment_obligation_ids jsonb NOT NULL,
  latest_decision_ids jsonb NOT NULL,
  sufficiency_status varchar(32) NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT service_order_payment_summaries_status_valid CHECK (sufficiency_status IN ('not_satisfied','partially_satisfied','satisfied','overpaid','indeterminate','not_applicable'))
);

CREATE TABLE payment_start_gates (
  id text PRIMARY KEY,
  payment_obligation_id text NOT NULL REFERENCES payment_obligations(id) ON DELETE RESTRICT,
  service_order_id text,
  decision_id text NOT NULL UNIQUE REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  sufficiency_assessment_id text NOT NULL REFERENCES payment_sufficiency_assessments(id) ON DELETE RESTRICT,
  status varchar(48) NOT NULL,
  reason_codes jsonb NOT NULL,
  evaluated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_start_gates_status_valid CHECK (status IN ('not_evaluated','payment_not_satisfied','payment_satisfied_pending_human_approval','blocked_by_refund_or_dispute','unavailable'))
);

CREATE TABLE payment_verification_manual_reviews (
  id text PRIMARY KEY,
  verification_case_id text NOT NULL REFERENCES payment_verification_cases(id) ON DELETE RESTRICT,
  decision_id text NOT NULL REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  queue varchar(48) NOT NULL,
  status varchar(24) NOT NULL,
  reason_codes jsonb NOT NULL,
  requires_four_eyes boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz,
  CONSTRAINT payment_verification_manual_reviews_queue_valid CHECK (queue IN ('verification_pending','evidence_refresh','unknown_outcome','manual_external_payment','amount_currency_mismatch','ownership_security_review','duplicate_payment','overpayment','refund_reverification','dispute_reverification','override_review','gate_handoff_failure','policy_review','security_incident')),
  CONSTRAINT payment_verification_manual_reviews_status_valid CHECK (status IN ('open','assigned','in_review','resolved','cancelled'))
);

CREATE TABLE payment_verification_overrides (
  id text PRIMARY KEY,
  verification_case_id text NOT NULL REFERENCES payment_verification_cases(id) ON DELETE RESTRICT,
  decision_id text NOT NULL REFERENCES payment_verification_decisions(id) ON DELETE RESTRICT,
  requested_by_type varchar(24) NOT NULL,
  requested_by_reference text,
  approval_reference text NOT NULL,
  reason_code varchar(96) NOT NULL,
  status varchar(24) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_overrides_actor_valid CHECK (requested_by_type = 'staff'),
  CONSTRAINT payment_verification_overrides_status_valid CHECK (status IN ('requested','approved','rejected','expired'))
);

CREATE TABLE payment_verification_inbox (
  id text PRIMARY KEY,
  candidate_id text NOT NULL UNIQUE REFERENCES payment_verification_candidates(id) ON DELETE RESTRICT,
  status varchar(32) NOT NULL,
  attempt_count integer NOT NULL,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  received_at timestamptz NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_inbox_status_valid CHECK (status IN ('received','processing','processed','failed','dead_lettered')),
  CONSTRAINT payment_verification_inbox_attempt_positive CHECK (attempt_count > 0)
);

CREATE TABLE payment_verification_outbox (
  id text PRIMARY KEY,
  event_type varchar(64) NOT NULL,
  aggregate_id text NOT NULL,
  correlation_id varchar(256) NOT NULL,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  dispatch_state varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  dispatched_at timestamptz,
  CONSTRAINT payment_verification_outbox_event_valid CHECK (event_type IN ('payment_verification_decided','payment_start_gate_evaluated','payment_verification_manual_review_requested')),
  CONSTRAINT payment_verification_outbox_state_valid CHECK (dispatch_state IN ('blocked','pending','dispatched','dead_lettered'))
);

CREATE TABLE payment_verification_dead_letters (
  id text PRIMARY KEY,
  inbox_id text NOT NULL UNIQUE REFERENCES payment_verification_inbox(id) ON DELETE RESTRICT,
  failure_code varchar(96) NOT NULL,
  failure_summary text NOT NULL,
  attempt_count integer NOT NULL,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz,
  CONSTRAINT payment_verification_dead_letters_attempt_positive CHECK (attempt_count > 0),
  CONSTRAINT payment_verification_dead_letters_status_valid CHECK (status IN ('open','replaying','resolved','discarded'))
);

CREATE TABLE payment_verification_audit_events (
  id text PRIMARY KEY,
  action varchar(64) NOT NULL,
  actor_type varchar(24) NOT NULL,
  actor_reference text,
  resource_type varchar(48) NOT NULL,
  resource_id text NOT NULL,
  result varchar(24) NOT NULL,
  correlation_id varchar(256) NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT payment_verification_audit_events_action_valid CHECK (action IN ('candidate_admitted','verification_evaluated','manual_review_requested','override_requested','gate_evaluated','runtime_operation_blocked')),
  CONSTRAINT payment_verification_audit_events_actor_valid CHECK (actor_type IN ('system','staff','service_account')),
  CONSTRAINT payment_verification_audit_events_result_valid CHECK (result IN ('accepted','rejected','manual_review','blocked'))
);

CREATE INDEX payment_obligations_client_status_idx ON payment_obligations (client_id, status);
CREATE INDEX payment_obligations_service_order_idx ON payment_obligations (service_order_id);
CREATE INDEX payment_verification_cases_status_idx ON payment_verification_cases (status, updated_at);
CREATE INDEX payment_verification_candidates_obligation_idx ON payment_verification_candidates (payment_obligation_id, received_at);
CREATE INDEX payment_verification_evidence_case_idx ON payment_verification_evidence (verification_case_id, received_at);
CREATE INDEX payment_verification_runs_case_idx ON payment_verification_runs (verification_case_id, started_at);
CREATE INDEX payment_verification_decisions_case_idx ON payment_verification_decisions (verification_case_id, decided_at);
CREATE INDEX payment_verification_decisions_obligation_idx ON payment_verification_decisions (payment_obligation_id, decided_at);
CREATE INDEX payment_verification_rule_evaluations_decision_idx ON payment_verification_rule_evaluations (decision_id);
CREATE INDEX payment_sufficiency_assessments_obligation_idx ON payment_sufficiency_assessments (payment_obligation_id, assessed_at);
CREATE INDEX payment_start_gates_service_order_idx ON payment_start_gates (service_order_id, evaluated_at);
CREATE INDEX payment_verification_manual_reviews_queue_idx ON payment_verification_manual_reviews (queue, status);
CREATE INDEX payment_verification_inbox_processing_idx ON payment_verification_inbox (status, received_at);
CREATE INDEX payment_verification_outbox_dispatch_idx ON payment_verification_outbox (dispatch_state, created_at);
CREATE INDEX payment_verification_audit_events_resource_idx ON payment_verification_audit_events (resource_type, resource_id, occurred_at);

ALTER TABLE payment_verification_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_rule_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sufficiency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_payment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_start_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_manual_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verification_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_verification_deny_all ON payment_verification_policies AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_obligations AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_cases AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_candidates AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_evidence AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_runs AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_decisions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_rule_evaluations AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_sufficiency_assessments AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON service_order_payment_summaries AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_start_gates AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_manual_reviews AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_overrides AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_inbox AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_outbox AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_dead_letters AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY payment_verification_deny_all ON payment_verification_audit_events AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
