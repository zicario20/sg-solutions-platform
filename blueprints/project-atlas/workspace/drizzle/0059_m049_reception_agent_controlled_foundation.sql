-- M049 Reception Agent controlled foundation.
-- References and digests only. No raw public conversation, provider call, lead write,
-- secure-link issuance, handoff dispatch, or follow-up is activated by this migration.

CREATE TABLE IF NOT EXISTS reception_agent_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  manifest_reference text NOT NULL, policy_reference text NOT NULL, status text NOT NULL DEFAULT 'disabled',
  configuration jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  public_session_reference text NOT NULL, channel text NOT NULL, locale text NOT NULL,
  authentication text NOT NULL, consent_reference text, current_stage text NOT NULL DEFAULT 'greeting',
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_interaction_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, stage text NOT NULL, input_digest text NOT NULL,
  intent_reference text NOT NULL, source_references jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_intent_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, intent text NOT NULL, risk text NOT NULL, disposition text NOT NULL,
  reason_codes jsonb NOT NULL, requires_authentication boolean NOT NULL DEFAULT false,
  requires_human_review boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_lead_capture_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, idempotency_key text NOT NULL, purpose text NOT NULL,
  contact_field_references jsonb NOT NULL, consent_reference text NOT NULL,
  status text NOT NULL DEFAULT 'prepared', execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS reception_secure_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, idempotency_key text NOT NULL, link_type text NOT NULL,
  requester_authenticated boolean NOT NULL DEFAULT false, purpose text NOT NULL,
  destination_owner text NOT NULL, expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'prepared', execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS reception_handoff_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, target text NOT NULL, intent text NOT NULL, locale text NOT NULL,
  fact_references jsonb NOT NULL, source_references jsonb NOT NULL, expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'prepared', execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_follow_up_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, contact_consent_reference text NOT NULL, purpose text NOT NULL,
  status text NOT NULL DEFAULT 'prepared', execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_human_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  session_reference text NOT NULL, reason_codes jsonb NOT NULL, summary_reference text NOT NULL,
  status text NOT NULL DEFAULT 'prepared', execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL,
  change_type text NOT NULL, change_reference text NOT NULL, actor_reference text NOT NULL,
  approval_reference text, status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, event_type text NOT NULL,
  resource_reference text NOT NULL, previous_hash text, event_hash text NOT NULL,
  occurred_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, event_type text NOT NULL,
  aggregate_reference text NOT NULL, idempotency_key text NOT NULL, payload_reference text NOT NULL,
  status text NOT NULL DEFAULT 'prepared', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, idempotency_key)
);
CREATE TABLE IF NOT EXISTS reception_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, finding_type text NOT NULL,
  severity text NOT NULL, resource_reference text NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reception_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, incident_type text NOT NULL,
  severity text NOT NULL, impact_reference text NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE reception_table text;
BEGIN
  FOREACH reception_table IN ARRAY ARRAY[
    'reception_agent_configurations', 'reception_sessions', 'reception_interaction_records',
    'reception_intent_classifications', 'reception_lead_capture_requests',
    'reception_secure_link_requests', 'reception_handoff_packages', 'reception_follow_up_requests',
    'reception_human_transfers', 'reception_change_requests', 'reception_audit_events',
    'reception_outbox', 'reception_findings', 'reception_incidents'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', reception_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', reception_table);
    EXECUTE format('DROP POLICY IF EXISTS reception_deny_default ON %I', reception_table);
    EXECUTE format(
      'CREATE POLICY reception_deny_default ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
      reception_table
    );
  END LOOP;
END $$;
