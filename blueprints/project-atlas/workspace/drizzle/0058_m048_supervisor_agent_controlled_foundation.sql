-- M048 Supervisor Agent controlled foundation.
-- The module is intentionally deny-by-default and has no executable provider integration.

CREATE TABLE IF NOT EXISTS supervisor_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  m47_control_plane_reference text NOT NULL, status text NOT NULL DEFAULT 'disabled',
  configuration jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_task_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, idempotency_key text NOT NULL,
  source text NOT NULL, surface text NOT NULL, locale text NOT NULL, classification jsonb NOT NULL,
  authorization_snapshot jsonb NOT NULL, resource_references jsonb NOT NULL, status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_task_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, task_envelope_reference text NOT NULL,
  sequence text NOT NULL, classification jsonb NOT NULL, status text NOT NULL DEFAULT 'prepared',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_specialist_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  manifest_reference text NOT NULL, status text NOT NULL DEFAULT 'approved_disabled', capability jsonb NOT NULL,
  operational_availability text NOT NULL DEFAULT 'disabled', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_routing_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL, version text NOT NULL,
  status text NOT NULL DEFAULT 'draft', policy jsonb NOT NULL, approved_by_reference text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_routing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, task_envelope_reference text NOT NULL,
  routing_policy_reference text NOT NULL, decision_status text NOT NULL, selected_specialist_code text,
  reason_codes jsonb NOT NULL, execution_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_orchestration_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, task_envelope_reference text NOT NULL,
  routing_decision_reference text NOT NULL, strategy text NOT NULL, status text NOT NULL DEFAULT 'prepared',
  execution_permitted boolean NOT NULL DEFAULT false, configuration_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_work_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, orchestration_plan_reference text NOT NULL,
  code text NOT NULL, specialist_code text NOT NULL, dependency_references jsonb NOT NULL, context_scope jsonb NOT NULL,
  status text NOT NULL DEFAULT 'prepared', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, task_envelope_reference text NOT NULL,
  work_unit_reference text NOT NULL, recipient_specialist_code text NOT NULL, context_reference text NOT NULL,
  status text NOT NULL DEFAULT 'blocked', expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_runtime_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, plan_reference text NOT NULL,
  status text NOT NULL DEFAULT 'blocked', runtime_snapshot jsonb NOT NULL, fallback_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_budget_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  status text NOT NULL DEFAULT 'draft', limits jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_sla_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  status text NOT NULL DEFAULT 'draft', deadlines jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_fallback_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, code text NOT NULL,
  status text NOT NULL DEFAULT 'draft', policy jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_governance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, governance_type text NOT NULL,
  policy_reference text NOT NULL, approval_reference text, status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, change_type text NOT NULL,
  change_reference text NOT NULL, actor_reference text NOT NULL, approval_reference text,
  status text NOT NULL DEFAULT 'pending_review', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, event_type text NOT NULL,
  resource_reference text NOT NULL, previous_hash text, event_hash text NOT NULL, occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, finding_type text NOT NULL,
  severity text NOT NULL, resource_reference text NOT NULL, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, incident_type text NOT NULL,
  severity text NOT NULL, status text NOT NULL DEFAULT 'open', impact_reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS supervisor_migration_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id text NOT NULL, migration_reference text NOT NULL,
  source_reference text NOT NULL, status text NOT NULL DEFAULT 'planned', verification jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE supervisor_table text;
BEGIN
  FOREACH supervisor_table IN ARRAY ARRAY[
    'supervisor_configurations', 'supervisor_task_envelopes', 'supervisor_task_segments',
    'supervisor_specialist_registry', 'supervisor_routing_policies', 'supervisor_routing_decisions',
    'supervisor_orchestration_plans', 'supervisor_work_units', 'supervisor_handoffs',
    'supervisor_runtime_records', 'supervisor_budget_profiles', 'supervisor_sla_profiles',
    'supervisor_fallback_policies', 'supervisor_governance_records', 'supervisor_change_requests',
    'supervisor_audit_events', 'supervisor_findings', 'supervisor_incidents', 'supervisor_migration_records'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', supervisor_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', supervisor_table);
    EXECUTE format('DROP POLICY IF EXISTS supervisor_deny_default ON %I', supervisor_table);
    EXECUTE format('CREATE POLICY supervisor_deny_default ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)', supervisor_table);
  END LOOP;
END $$;
