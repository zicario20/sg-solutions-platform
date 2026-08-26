-- M043 Stripe Payments controlled foundation.
-- Authored only: do not apply until Product Owner activation, backup evidence,
-- schema review, RLS review, credential provisioning, Stripe account review,
-- and independent security review are complete.
-- This migration creates no Stripe objects, processes no payment, and stores
-- credential references only. It intentionally starts deny-by-default.

CREATE TABLE stripe_api_version_policies (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL UNIQUE,
  pinned_api_version varchar(32) NOT NULL,
  status varchar(24) NOT NULL,
  approved_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_api_version_policies_status_valid
    CHECK (status IN ('draft','approved','retired'))
);

CREATE TABLE stripe_credential_profiles (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL UNIQUE,
  environment varchar(8) NOT NULL,
  secret_key_reference text NOT NULL,
  webhook_secret_reference text NOT NULL,
  rotated_webhook_secret_reference text,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_credential_profiles_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_credential_profiles_status_valid
    CHECK (status IN ('draft','approved','disabled')),
  CONSTRAINT stripe_credential_profiles_reference_only
    CHECK (
      secret_key_reference !~ '^(sk_|rk_)'
      AND webhook_secret_reference !~ '^whsec_'
      AND (
        rotated_webhook_secret_reference IS NULL
        OR rotated_webhook_secret_reference !~ '^whsec_'
      )
    )
);

CREATE TABLE stripe_account_profiles (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL UNIQUE,
  environment varchar(8) NOT NULL,
  display_name varchar(160) NOT NULL,
  account_reference text NOT NULL,
  api_version_policy_id text NOT NULL REFERENCES stripe_api_version_policies(id) ON DELETE RESTRICT,
  credential_profile_id text NOT NULL REFERENCES stripe_credential_profiles(id) ON DELETE RESTRICT,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_account_profiles_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_account_profiles_status_valid
    CHECK (status IN ('draft','approved','disabled')),
  CONSTRAINT stripe_account_profiles_environment_account_unique
    UNIQUE (environment, account_reference)
);

CREATE TABLE stripe_customer_mappings (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  account_profile_id text NOT NULL REFERENCES stripe_account_profiles(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_customer_ref text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_customer_mappings_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_customer_mappings_client_environment_unique
    UNIQUE (client_id, environment),
  CONSTRAINT stripe_customer_mappings_provider_customer_unique
    UNIQUE (environment, provider_customer_ref)
);

CREATE TABLE stripe_payment_transaction_contexts (
  transaction_id text PRIMARY KEY REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  account_profile_id text NOT NULL REFERENCES stripe_account_profiles(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  client_id text NOT NULL,
  commercial_order_id text NOT NULL,
  catalog_snapshot jsonb NOT NULL,
  pricing_snapshot jsonb NOT NULL,
  state varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  correlation_id varchar(256) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_payment_transaction_contexts_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_payment_transaction_contexts_state_valid
    CHECK (
      state IN (
        'draft','checkout_requested','provider_processing',
        'provider_succeeded_pending_verification','provider_failed',
        'refund_requested','refund_processing',
        'refund_provider_confirmed_pending_verification','dispute_open','closed'
      )
    )
);

CREATE TABLE stripe_checkout_sessions (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  customer_mapping_id text REFERENCES stripe_customer_mappings(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  checkout_profile_code varchar(96) NOT NULL,
  provider_checkout_ref text,
  expected_amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  status varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_checkout_sessions_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_checkout_sessions_status_valid
    CHECK (
      status IN (
        'draft','provider_creation_pending','provider_created','expired',
        'cancelled','provider_succeeded_pending_verification'
      )
    ),
  CONSTRAINT stripe_checkout_sessions_money_valid
    CHECK (expected_amount_minor >= 0 AND currency = 'USD'),
  CONSTRAINT stripe_checkout_sessions_provider_ref_unique
    UNIQUE (environment, provider_checkout_ref)
);

CREATE TABLE stripe_payment_intents (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_intent_ref text,
  expected_amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  capture_method varchar(16) NOT NULL,
  status varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_payment_intents_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_payment_intents_capture_method_valid
    CHECK (capture_method IN ('automatic','manual')),
  CONSTRAINT stripe_payment_intents_status_valid
    CHECK (
      status IN (
        'not_requested','provider_created','provider_processing',
        'provider_succeeded_pending_verification','provider_failed','cancelled'
      )
    ),
  CONSTRAINT stripe_payment_intents_money_valid
    CHECK (expected_amount_minor >= 0 AND currency = 'USD'),
  CONSTRAINT stripe_payment_intents_provider_ref_unique
    UNIQUE (environment, provider_intent_ref)
);

CREATE TABLE stripe_setup_intents (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  environment varchar(8) NOT NULL,
  provider_setup_intent_ref text,
  consent_reference text NOT NULL,
  status varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_setup_intents_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_setup_intents_status_valid
    CHECK (
      status IN (
        'not_requested','provider_created',
        'provider_succeeded_pending_verification','provider_failed','cancelled'
      )
    ),
  CONSTRAINT stripe_setup_intents_provider_ref_unique
    UNIQUE (environment, provider_setup_intent_ref)
);

CREATE TABLE stripe_payment_method_references (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  environment varchar(8) NOT NULL,
  provider_payment_method_ref text NOT NULL,
  consent_reference text NOT NULL,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_payment_method_references_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_payment_method_references_status_valid
    CHECK (status IN ('active','detached','expired','revoked')),
  CONSTRAINT stripe_payment_method_references_provider_unique
    UNIQUE (environment, provider_payment_method_ref)
);

CREATE TABLE stripe_invoices (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_invoice_ref text,
  invoice_number varchar(128),
  status varchar(48) NOT NULL,
  amount_due_minor bigint NOT NULL,
  amount_paid_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  receipt_reference text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_invoices_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_invoices_status_valid
    CHECK (
      status IN ('draft','provider_created','open','paid_pending_verification','void','uncollectible')
    ),
  CONSTRAINT stripe_invoices_money_valid
    CHECK (
      amount_due_minor >= 0
      AND amount_paid_minor >= 0
      AND amount_paid_minor <= amount_due_minor
      AND currency = 'USD'
    ),
  CONSTRAINT stripe_invoices_provider_ref_unique
    UNIQUE (environment, provider_invoice_ref)
);

CREATE TABLE stripe_invoice_line_snapshots (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES stripe_invoices(id) ON DELETE CASCADE,
  line_type varchar(32) NOT NULL,
  description text NOT NULL,
  amount_minor bigint NOT NULL,
  quantity integer NOT NULL,
  catalog_snapshot jsonb,
  display_order integer NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT stripe_invoice_line_snapshots_type_valid
    CHECK (line_type IN ('service_fee','external_fee','addon','discount','tax','adjustment')),
  CONSTRAINT stripe_invoice_line_snapshots_value_valid
    CHECK (quantity > 0 AND amount_minor >= 0 AND display_order >= 0),
  CONSTRAINT stripe_invoice_line_snapshots_invoice_order_unique
    UNIQUE (invoice_id, display_order)
);

CREATE TABLE stripe_refund_requests (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  payment_order_id text NOT NULL,
  requested_amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  reason_code varchar(64) NOT NULL,
  approval_request_id text NOT NULL,
  requested_by text NOT NULL,
  status varchar(64) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  requested_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_refund_requests_status_valid
    CHECK (
      status IN (
        'requested','awaiting_approval','approved_for_provider_submission',
        'provider_submission_pending','provider_confirmed_pending_verification',
        'declined','cancelled'
      )
    ),
  CONSTRAINT stripe_refund_requests_money_valid
    CHECK (requested_amount_minor > 0 AND currency = 'USD')
);

CREATE TABLE stripe_refunds (
  id text PRIMARY KEY,
  refund_request_id text NOT NULL REFERENCES stripe_refund_requests(id) ON DELETE RESTRICT,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_refund_ref text,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  status varchar(48) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_refunds_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_refunds_status_valid
    CHECK (
      status IN (
        'not_submitted','provider_pending',
        'provider_succeeded_pending_verification','provider_failed','cancelled'
      )
    ),
  CONSTRAINT stripe_refunds_money_valid
    CHECK (amount_minor > 0 AND currency = 'USD'),
  CONSTRAINT stripe_refunds_provider_ref_unique
    UNIQUE (environment, provider_refund_ref)
);

CREATE TABLE stripe_disputes (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_dispute_ref text NOT NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  status varchar(32) NOT NULL,
  evidence_package_reference text,
  opened_at timestamptz NOT NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_disputes_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_disputes_status_valid
    CHECK (status IN ('open','needs_response','under_review','won','lost','closed')),
  CONSTRAINT stripe_disputes_money_valid
    CHECK (amount_minor > 0 AND currency = 'USD'),
  CONSTRAINT stripe_disputes_provider_ref_unique
    UNIQUE (environment, provider_dispute_ref)
);

CREATE TABLE stripe_invoice_payments (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES stripe_invoices(id) ON DELETE RESTRICT,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  provider_payment_reference text,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  status varchar(48) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_invoice_payments_status_valid
    CHECK (
      status IN (
        'planned','provider_pending','provider_succeeded_pending_verification',
        'provider_failed','reconciled'
      )
    ),
  CONSTRAINT stripe_invoice_payments_money_valid
    CHECK (amount_minor > 0 AND currency = 'USD'),
  CONSTRAINT stripe_invoice_payments_provider_ref_unique
    UNIQUE (provider_payment_reference)
);

CREATE TABLE stripe_installment_schedules (
  id text PRIMARY KEY,
  transaction_id text NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  installment_number integer NOT NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL,
  due_at timestamptz NOT NULL,
  status varchar(48) NOT NULL,
  pricing_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT stripe_installment_schedules_status_valid
    CHECK (status IN ('planned','due','paid_pending_verification','overdue','cancelled')),
  CONSTRAINT stripe_installment_schedules_value_valid
    CHECK (installment_number > 0 AND amount_minor > 0 AND currency = 'USD'),
  CONSTRAINT stripe_installment_schedules_transaction_number_unique
    UNIQUE (transaction_id, installment_number)
);

CREATE TABLE stripe_subscriptions (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  account_profile_id text NOT NULL REFERENCES stripe_account_profiles(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  provider_subscription_ref text,
  catalog_snapshot jsonb NOT NULL,
  pricing_snapshot jsonb NOT NULL,
  consent_reference text NOT NULL,
  status varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_subscriptions_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_subscriptions_status_valid
    CHECK (
      status IN (
        'not_enabled','provider_creation_pending','provider_created',
        'active_pending_verification','past_due_pending_verification',
        'cancel_pending_verification','cancelled'
      )
    ),
  CONSTRAINT stripe_subscriptions_provider_ref_unique
    UNIQUE (environment, provider_subscription_ref)
);

CREATE TABLE stripe_billing_portal_sessions (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  account_profile_id text NOT NULL REFERENCES stripe_account_profiles(id) ON DELETE RESTRICT,
  environment varchar(8) NOT NULL,
  return_path text NOT NULL,
  provider_session_ref text,
  status varchar(48) NOT NULL,
  idempotency_key varchar(256) NOT NULL UNIQUE,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_billing_portal_sessions_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_billing_portal_sessions_status_valid
    CHECK (status IN ('not_enabled','provider_creation_pending','provider_created','expired')),
  CONSTRAINT stripe_billing_portal_sessions_return_path_valid
    CHECK (
      return_path LIKE '/%'
      AND return_path NOT LIKE '//%'
      AND position('://' in return_path) = 0
    ),
  CONSTRAINT stripe_billing_portal_sessions_provider_ref_unique
    UNIQUE (environment, provider_session_ref)
);

CREATE TABLE stripe_event_inbox (
  id text PRIMARY KEY,
  environment varchar(8) NOT NULL,
  account_profile_id text NOT NULL REFERENCES stripe_account_profiles(id) ON DELETE RESTRICT,
  provider_event_id text NOT NULL,
  event_type varchar(128) NOT NULL,
  payload_hash char(64) NOT NULL,
  raw_payload_quarantine_reference text,
  signature_version varchar(16) NOT NULL,
  status varchar(32) NOT NULL,
  attempt_count integer NOT NULL,
  correlation_id varchar(256) NOT NULL,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  processed_at timestamptz,
  failure_code varchar(64),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_event_inbox_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_event_inbox_status_valid
    CHECK (
      status IN (
        'received','signature_verified','normalized','candidate_created',
        'ignored','failed','dead_lettered'
      )
    ),
  CONSTRAINT stripe_event_inbox_hash_valid
    CHECK (payload_hash ~ '^[0-9a-f]{64}$' AND attempt_count > 0),
  CONSTRAINT stripe_event_inbox_environment_event_unique
    UNIQUE (environment, provider_event_id)
);

CREATE TABLE stripe_payment_verification_candidates (
  id text PRIMARY KEY,
  event_inbox_id text NOT NULL UNIQUE REFERENCES stripe_event_inbox(id) ON DELETE RESTRICT,
  transaction_id text REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  candidate_type varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  expected_amount_minor bigint,
  observed_amount_minor bigint,
  currency varchar(3),
  evidence_snapshot jsonb NOT NULL,
  correlation_id varchar(256) NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT stripe_payment_verification_candidates_type_valid
    CHECK (
      candidate_type IN (
        'payment_succeeded','payment_failed','refund_succeeded',
        'dispute_opened','invoice_paid'
      )
    ),
  CONSTRAINT stripe_payment_verification_candidates_status_valid
    CHECK (status IN ('candidate_created','sent_to_m044','rejected_by_m044')),
  CONSTRAINT stripe_payment_verification_candidates_money_valid
    CHECK (
      (expected_amount_minor IS NULL OR expected_amount_minor >= 0)
      AND (observed_amount_minor IS NULL OR observed_amount_minor >= 0)
      AND (currency IS NULL OR currency = 'USD')
    )
);

CREATE TABLE stripe_event_dead_letters (
  id text PRIMARY KEY,
  event_inbox_id text NOT NULL UNIQUE REFERENCES stripe_event_inbox(id) ON DELETE RESTRICT,
  failure_code varchar(64) NOT NULL,
  failure_summary text NOT NULL,
  attempt_count integer NOT NULL,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_event_dead_letters_attempt_count_valid CHECK (attempt_count > 0),
  CONSTRAINT stripe_event_dead_letters_status_valid
    CHECK (status IN ('open','replaying','resolved','discarded'))
);

CREATE TABLE stripe_reconciliation_runs (
  id text PRIMARY KEY,
  environment varchar(8) NOT NULL,
  status varchar(24) NOT NULL,
  initiated_by varchar(24) NOT NULL,
  correlation_id varchar(256) NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL,
  CONSTRAINT stripe_reconciliation_runs_environment_valid
    CHECK (environment IN ('test','live')),
  CONSTRAINT stripe_reconciliation_runs_status_valid
    CHECK (status IN ('queued','running','completed','failed')),
  CONSTRAINT stripe_reconciliation_runs_initiator_valid
    CHECK (initiated_by IN ('scheduled_job','staff'))
);

CREATE TABLE stripe_reconciliation_findings (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES stripe_reconciliation_runs(id) ON DELETE RESTRICT,
  transaction_id text REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  provider_reference text,
  severity varchar(16) NOT NULL,
  category varchar(48) NOT NULL,
  status varchar(24) NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT stripe_reconciliation_findings_severity_valid
    CHECK (severity IN ('information','warning','critical')),
  CONSTRAINT stripe_reconciliation_findings_category_valid
    CHECK (
      category IN (
        'missing_provider_event','amount_mismatch','currency_mismatch',
        'missing_candidate','unknown_provider_object','duplicate_event','stale_transaction'
      )
    ),
  CONSTRAINT stripe_reconciliation_findings_status_valid
    CHECK (status IN ('open','investigating','resolved','accepted_risk'))
);

CREATE TABLE stripe_payment_audit_events (
  id text PRIMARY KEY,
  action varchar(64) NOT NULL,
  actor_type varchar(24) NOT NULL,
  actor_id text,
  resource_type varchar(64) NOT NULL,
  resource_id text NOT NULL,
  correlation_id varchar(256) NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT stripe_payment_audit_events_action_valid
    CHECK (
      action IN (
        'checkout_prepared','invoice_prepared','webhook_received',
        'webhook_duplicate_ignored','verification_candidate_created',
        'refund_requested','reconciliation_finding_created','provider_operation_blocked'
      )
    ),
  CONSTRAINT stripe_payment_audit_events_actor_type_valid
    CHECK (actor_type IN ('client','staff','system','service_account'))
);

CREATE INDEX stripe_checkout_sessions_transaction_idx
  ON stripe_checkout_sessions (transaction_id);
CREATE INDEX stripe_event_inbox_processing_idx
  ON stripe_event_inbox (status, received_at);
CREATE INDEX stripe_reconciliation_findings_open_idx
  ON stripe_reconciliation_findings (status, severity);
CREATE INDEX stripe_payment_audit_events_resource_idx
  ON stripe_payment_audit_events (resource_type, resource_id, occurred_at);

ALTER TABLE stripe_api_version_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_credential_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_account_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customer_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_transaction_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_setup_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_method_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoice_line_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_installment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_billing_portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_event_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_verification_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_event_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_reconciliation_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY stripe_payments_deny_all ON stripe_api_version_policies AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_credential_profiles AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_account_profiles AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_customer_mappings AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_payment_transaction_contexts AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_checkout_sessions AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_payment_intents AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_setup_intents AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_payment_method_references AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_invoices AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_invoice_line_snapshots AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_invoice_payments AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_installment_schedules AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_subscriptions AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_billing_portal_sessions AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_refund_requests AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_refunds AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_disputes AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_event_inbox AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_payment_verification_candidates AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_event_dead_letters AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_reconciliation_runs AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_reconciliation_findings AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY stripe_payments_deny_all ON stripe_payment_audit_events AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
