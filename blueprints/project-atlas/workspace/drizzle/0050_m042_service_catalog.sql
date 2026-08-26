-- M042 Service Catalog controlled foundation.
-- No provider, payment, workflow or publication action is activated by this migration.

CREATE TABLE service_catalog_categories (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  parent_category_id uuid,
  internal_name text NOT NULL,
  status text NOT NULL,
  public_visible boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_definitions (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  category_id uuid NOT NULL,
  service_type text NOT NULL,
  lifecycle_status text NOT NULL,
  primary_domain text NOT NULL,
  fulfillment_mode text NOT NULL,
  public_visible boolean NOT NULL DEFAULT false,
  current_version_id uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_versions (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  version text NOT NULL,
  publication_status text NOT NULL,
  configuration_snapshot jsonb NOT NULL,
  configuration_hash text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_versions_definition_version_key UNIQUE (service_definition_id, version)
);

CREATE TABLE service_catalog_translations (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL,
  locale text NOT NULL,
  status text NOT NULL,
  content jsonb NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_translations_version_locale_key UNIQUE (service_version_id, locale)
);

CREATE TABLE service_catalog_availability_rules (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  status text NOT NULL,
  jurisdictions jsonb NOT NULL,
  excluded_jurisdictions jsonb NOT NULL,
  capacity_reference text,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_commercial_profiles (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  billing_mode text NOT NULL,
  pricing_reference text,
  deposit_policy_reference text,
  payment_schedule_reference text,
  cancellation_policy_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_document_requirement_sets (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  version text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_document_sets_code_version_key UNIQUE (code, version)
);

CREATE TABLE service_catalog_document_requirements (
  id uuid PRIMARY KEY,
  requirement_set_id uuid NOT NULL,
  code text NOT NULL,
  requirement_level text NOT NULL,
  required_stage text NOT NULL,
  condition_rule jsonb,
  data_classification text NOT NULL,
  alternative_group text,
  instructions text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_document_requirements_set_code_key UNIQUE (requirement_set_id, code)
);

CREATE TABLE service_catalog_duration_profiles (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  duration_type text NOT NULL,
  duration_unit text NOT NULL,
  minimum integer,
  maximum integer,
  confidence text NOT NULL,
  source_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_disclosure_sets (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  version text NOT NULL,
  items jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_disclosure_sets_code_version_key UNIQUE (code, version)
);

CREATE TABLE service_catalog_intake_definitions (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  definition_reference text NOT NULL,
  version text NOT NULL,
  intake_mode text NOT NULL,
  requires_authentication boolean NOT NULL,
  data_classes jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_workflow_bindings (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL UNIQUE,
  workflow_code text NOT NULL,
  start_trigger text NOT NULL,
  requires_payment_confirmation boolean NOT NULL,
  requires_human_authorization boolean NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_publications (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  scheduled_for timestamptz,
  published_at timestamptz,
  unpublished_at timestamptz,
  approved_by_reference text,
  rollback_version_id uuid,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_discovery_documents (
  id uuid PRIMARY KEY,
  service_version_id uuid NOT NULL,
  locale text NOT NULL,
  canonical_path text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  availability_status text NOT NULL,
  indexed_at timestamptz NOT NULL,
  invalidated_at timestamptz,
  CONSTRAINT service_catalog_discovery_documents_path_locale_key UNIQUE (canonical_path, locale)
);

CREATE TABLE service_catalog_relationships (
  id uuid PRIMARY KEY,
  source_service_definition_id uuid NOT NULL,
  target_service_definition_id uuid NOT NULL,
  relationship_type text NOT NULL,
  rule_reference text,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT service_catalog_relationships_unique_key UNIQUE (
    source_service_definition_id, target_service_definition_id, relationship_type
  )
);

CREATE TABLE service_catalog_bundles (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL UNIQUE,
  bundle_type text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_bundle_components (
  id uuid PRIMARY KEY,
  bundle_id uuid NOT NULL,
  component_service_definition_id uuid NOT NULL,
  component_version_id uuid,
  required boolean NOT NULL,
  removable boolean NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_change_requests (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  from_version_id uuid,
  proposed_version_id uuid NOT NULL,
  classification text NOT NULL,
  status text NOT NULL,
  requested_by_reference text NOT NULL,
  approved_by_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_governance_records (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  action text NOT NULL,
  actor_type text NOT NULL,
  reason text NOT NULL,
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE service_catalog_data_quality_findings (
  id uuid PRIMARY KEY,
  service_definition_id uuid NOT NULL,
  version_id uuid,
  finding_type text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  evidence_reference text NOT NULL,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz
);

CREATE TABLE service_catalog_migration_records (
  id uuid PRIMARY KEY,
  source_type text NOT NULL,
  source_reference text NOT NULL,
  status text NOT NULL,
  checksum text NOT NULL,
  approved_by_reference text,
  created_at timestamptz NOT NULL,
  completed_at timestamptz,
  CONSTRAINT service_catalog_migration_records_source_key UNIQUE (source_type, source_reference)
);

CREATE INDEX service_catalog_definitions_category_idx ON service_catalog_definitions (category_id);
CREATE INDEX service_catalog_versions_definition_idx ON service_catalog_versions (service_definition_id);
CREATE INDEX service_catalog_availability_definition_idx ON service_catalog_availability_rules (service_definition_id);
CREATE INDEX service_catalog_publications_version_idx ON service_catalog_publications (service_version_id);
CREATE INDEX service_catalog_discovery_documents_version_idx ON service_catalog_discovery_documents (service_version_id);
CREATE INDEX service_catalog_change_requests_definition_idx ON service_catalog_change_requests (service_definition_id);
CREATE INDEX service_catalog_governance_records_definition_idx ON service_catalog_governance_records (service_definition_id);
CREATE INDEX service_catalog_data_quality_findings_definition_idx ON service_catalog_data_quality_findings (service_definition_id);

ALTER TABLE service_catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_commercial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_document_requirement_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_duration_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_disclosure_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_intake_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_workflow_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_discovery_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_bundle_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_governance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_data_quality_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog_migration_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_catalog_deny_all ON service_catalog_categories AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_definitions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_versions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_translations AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_availability_rules AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_commercial_profiles AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_document_requirement_sets AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_document_requirements AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_duration_profiles AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_disclosure_sets AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_intake_definitions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_workflow_bindings AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_publications AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_discovery_documents AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_relationships AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_bundles AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_bundle_components AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_change_requests AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_governance_records AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_data_quality_findings AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_catalog_deny_all ON service_catalog_migration_records AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
