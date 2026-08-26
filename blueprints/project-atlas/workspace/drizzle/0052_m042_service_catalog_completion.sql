-- M042 Service Catalog completion contracts.
-- Authored only. This migration does not publish services, execute workflows, process payments,
-- activate providers, create client records, or expose catalog administration.

CREATE TABLE service_catalog_order_snapshots (
  id uuid PRIMARY KEY,
  service_order_reference text NOT NULL,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL,
  configuration_hash text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_order_snapshots_order_version_key UNIQUE (
    service_order_reference, service_version_id
  )
);

CREATE TABLE service_catalog_deprecations (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  deprecated_version_id uuid NOT NULL,
  replacement_service_definition_id uuid,
  replacement_version_id uuid,
  new_order_behavior text NOT NULL,
  active_order_behavior text NOT NULL,
  status text NOT NULL,
  effective_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_ai_outputs (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  service_version_id uuid,
  output_type text NOT NULL,
  status text NOT NULL,
  content_reference text NOT NULL,
  source_references jsonb NOT NULL,
  findings jsonb NOT NULL,
  reviewed_by_reference text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_break_glass_requests (
  id uuid PRIMARY KEY,
  action text NOT NULL,
  scope_references jsonb NOT NULL,
  reason text NOT NULL,
  requested_by_reference text NOT NULL,
  status text NOT NULL,
  expires_at timestamptz NOT NULL,
  approved_by_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_drift_findings (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL,
  finding_type text NOT NULL,
  severity text NOT NULL,
  expected_hash text NOT NULL,
  observed_hash text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);

CREATE TABLE service_catalog_recovery_verifications (
  id uuid PRIMARY KEY,
  status text NOT NULL,
  verification_snapshot jsonb NOT NULL,
  verified_by_reference text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_metric_definitions (
  id uuid PRIMARY KEY,
  metric_name text NOT NULL,
  version text NOT NULL,
  definition jsonb NOT NULL,
  status text NOT NULL,
  last_validated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_metric_definitions_name_version_key UNIQUE (metric_name, version)
);

CREATE TABLE service_catalog_work_queue_items (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  service_version_id uuid,
  queue_type text NOT NULL,
  status text NOT NULL,
  assignee_reference text,
  due_at timestamptz,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);

CREATE TABLE service_catalog_security_incidents (
  id uuid PRIMARY KEY,
  service_definition_id uuid,
  service_version_id uuid,
  incident_type text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  evidence_reference text NOT NULL,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);

CREATE INDEX service_catalog_order_snapshots_definition_idx
  ON service_catalog_order_snapshots (service_definition_id);
CREATE INDEX service_catalog_deprecations_definition_idx
  ON service_catalog_deprecations (service_definition_id);
CREATE INDEX service_catalog_ai_outputs_definition_idx
  ON service_catalog_ai_outputs (service_definition_id);
CREATE INDEX service_catalog_break_glass_status_idx
  ON service_catalog_break_glass_requests (status);
CREATE INDEX service_catalog_drift_findings_version_idx
  ON service_catalog_drift_findings (service_version_id);
CREATE INDEX service_catalog_recovery_verifications_status_idx
  ON service_catalog_recovery_verifications (status);
CREATE INDEX service_catalog_work_queue_definition_idx
  ON service_catalog_work_queue_items (service_definition_id);
CREATE INDEX service_catalog_work_queue_status_idx
  ON service_catalog_work_queue_items (status);
CREATE INDEX service_catalog_security_incidents_status_idx
  ON service_catalog_security_incidents (status);

ALTER TABLE service_catalog_order_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_deprecations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_break_glass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_drift_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_recovery_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_work_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_catalog_deny_all ON service_catalog_order_snapshots AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_deprecations AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_ai_outputs AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_break_glass_requests AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_drift_findings AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_recovery_verifications AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_metric_definitions AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_work_queue_items AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_security_incidents AS RESTRICTIVE
  FOR ALL USING (false) WITH CHECK (false);
