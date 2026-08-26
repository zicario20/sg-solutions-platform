-- M045 Service Entitlements controlled foundation.
-- Authoring this migration does not authorize its application, provider ingress,
-- automatic grant materialization, workflow handoff, or production activation.

CREATE ROLE atlas_service_entitlements_gateway NOLOGIN;

CREATE TABLE entitlement_definitions (
  id text PRIMARY KEY,
  entitlement_key varchar(192) NOT NULL UNIQUE,
  name varchar(192) NOT NULL,
  description text NOT NULL,
  entitlement_type varchar(48) NOT NULL,
  owner_domain varchar(96) NOT NULL,
  resource_type varchar(64) NOT NULL,
  default_decision varchar(16) NOT NULL DEFAULT 'deny',
  status varchar(24) NOT NULL,
  current_version integer NOT NULL,
  configuration_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT entitlement_definitions_default_deny CHECK (default_decision = 'deny'),
  CONSTRAINT entitlement_definitions_version_positive CHECK (current_version > 0),
  CONSTRAINT entitlement_definitions_status_valid CHECK (status IN ('draft','active','paused','retired','archived')),
  CONSTRAINT entitlement_definitions_hash_valid CHECK (configuration_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE service_capability_definitions (
  id text PRIMARY KEY,
  capability_code varchar(192) NOT NULL UNIQUE,
  service_domain varchar(96) NOT NULL,
  description text NOT NULL,
  surface varchar(24) NOT NULL,
  risk_level varchar(24) NOT NULL,
  resource_type varchar(64) NOT NULL,
  status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT service_capability_definitions_surface_valid CHECK (surface IN ('public','client','admin','backend')),
  CONSTRAINT service_capability_definitions_risk_valid CHECK (risk_level IN ('low','moderate','high','critical')),
  CONSTRAINT service_capability_definitions_status_valid CHECK (status IN ('draft','active','paused','retired'))
);

CREATE TABLE service_entitlement_profiles (
  id text PRIMARY KEY,
  service_version_reference text NOT NULL,
  version integer NOT NULL,
  status varchar(24) NOT NULL,
  entitlement_definition_ids jsonb NOT NULL,
  activation_policy_ids jsonb NOT NULL,
  suspension_policy_ids jsonb NOT NULL,
  revocation_policy_ids jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  configuration_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT service_entitlement_profiles_reference_version_unique UNIQUE (service_version_reference, version),
  CONSTRAINT service_entitlement_profiles_version_positive CHECK (version > 0),
  CONSTRAINT service_entitlement_profiles_status_valid CHECK (status IN ('draft','active','paused','retired')),
  CONSTRAINT service_entitlement_profiles_effective_range_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT service_entitlement_profiles_hash_valid CHECK (configuration_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE entitlement_policies (
  id text PRIMARY KEY,
  policy_code varchar(192) NOT NULL,
  version integer NOT NULL,
  entitlement_definition_id text NOT NULL REFERENCES entitlement_definitions(id) ON DELETE RESTRICT,
  status varchar(24) NOT NULL,
  required_conditions jsonb NOT NULL,
  subject_types jsonb NOT NULL,
  resource_types jsonb NOT NULL,
  unknown_behavior jsonb NOT NULL,
  grant_mode varchar(32) NOT NULL,
  precedence_version integer NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  approved_by text,
  approved_at timestamptz,
  configuration_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT entitlement_policies_code_version_unique UNIQUE (policy_code, version),
  CONSTRAINT entitlement_policies_version_positive CHECK (version > 0),
  CONSTRAINT entitlement_policies_precedence_positive CHECK (precedence_version > 0),
  CONSTRAINT entitlement_policies_status_valid CHECK (status IN ('draft','testing','review','approved','active','limited','paused','deprecated','retired')),
  CONSTRAINT entitlement_policies_grant_mode_valid CHECK (grant_mode IN ('decision_only','materialize_derived')),
  CONSTRAINT entitlement_policies_effective_range_valid CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT entitlement_policies_hash_valid CHECK (configuration_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE entitlement_grants (
  id text PRIMARY KEY,
  entitlement_definition_id text NOT NULL REFERENCES entitlement_definitions(id) ON DELETE RESTRICT,
  tenant_id text NOT NULL,
  subject_type varchar(48) NOT NULL,
  subject_id text NOT NULL,
  resource_type varchar(64) NOT NULL,
  resource_id text NOT NULL,
  scope_type varchar(48) NOT NULL,
  source_type varchar(48) NOT NULL,
  source_reference text NOT NULL,
  policy_version integer NOT NULL,
  status varchar(24) NOT NULL,
  effective_from timestamptz NOT NULL,
  expires_at timestamptz,
  temporary boolean NOT NULL DEFAULT false,
  reason text,
  approved_by text,
  revalidation_required boolean NOT NULL DEFAULT true,
  usage_limit integer,
  usage_used integer NOT NULL DEFAULT 0,
  read_only_when_suspended boolean NOT NULL DEFAULT false,
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT entitlement_grants_policy_version_positive CHECK (policy_version > 0),
  CONSTRAINT entitlement_grants_version_positive CHECK (version > 0),
  CONSTRAINT entitlement_grants_usage_valid CHECK (usage_limit IS NULL OR (usage_limit > 0 AND usage_used BETWEEN 0 AND usage_limit)),
  CONSTRAINT entitlement_grants_status_valid CHECK (status IN ('pending','active','limited','suspended','revoked','expired','cancelled','superseded','unknown')),
  CONSTRAINT entitlement_grants_temporary_expiry_valid CHECK (temporary = false OR expires_at IS NOT NULL),
  CONSTRAINT entitlement_grants_effective_range_valid CHECK (expires_at IS NULL OR expires_at > effective_from)
);

CREATE TABLE entitlement_denies (
  id text PRIMARY KEY,
  entitlement_definition_id text NOT NULL REFERENCES entitlement_definitions(id) ON DELETE RESTRICT,
  tenant_id text NOT NULL,
  subject_type varchar(48) NOT NULL,
  subject_id text NOT NULL,
  resource_type varchar(64) NOT NULL,
  resource_id text NOT NULL,
  scope_type varchar(48) NOT NULL,
  reason text NOT NULL,
  authority_reference text NOT NULL,
  source varchar(96) NOT NULL,
  status varchar(24) NOT NULL,
  effective_from timestamptz NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT entitlement_denies_status_valid CHECK (status IN ('active','revoked','expired','superseded')),
  CONSTRAINT entitlement_denies_effective_range_valid CHECK (expires_at IS NULL OR expires_at > effective_from)
);

CREATE TABLE entitlement_decisions (
  id text PRIMARY KEY,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  evaluation_request_id varchar(256) NOT NULL,
  entitlement_definition_id text NOT NULL REFERENCES entitlement_definitions(id) ON DELETE RESTRICT,
  entitlement_key varchar(192) NOT NULL,
  tenant_id text NOT NULL,
  subject_snapshot jsonb NOT NULL,
  resource_snapshot jsonb NOT NULL,
  scope_type varchar(48) NOT NULL,
  policy_id text NOT NULL REFERENCES entitlement_policies(id) ON DELETE RESTRICT,
  policy_version integer NOT NULL,
  status varchar(32) NOT NULL,
  condition_results jsonb NOT NULL,
  grant_ids jsonb NOT NULL,
  deny_ids jsonb NOT NULL,
  next_actions jsonb NOT NULL,
  limits jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  expires_at timestamptz,
  snapshot_hash char(64) NOT NULL,
  supersedes_decision_id text,
  decided_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT entitlement_decisions_policy_version_positive CHECK (policy_version > 0),
  CONSTRAINT entitlement_decisions_status_valid CHECK (status IN ('allow','allow_with_limits','allow_read_only','deny','suspended','action_required','manual_review_required','not_applicable','unknown')),
  CONSTRAINT entitlement_decisions_hash_valid CHECK (snapshot_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE entitlement_usage_counters (
  entitlement_grant_id text PRIMARY KEY REFERENCES entitlement_grants(id) ON DELETE RESTRICT,
  usage_limit integer,
  usage_used integer NOT NULL DEFAULT 0,
  version integer NOT NULL,
  last_consumed_at timestamptz,
  updated_at timestamptz NOT NULL,
  CONSTRAINT entitlement_usage_counters_version_positive CHECK (version > 0),
  CONSTRAINT entitlement_usage_counters_values_valid CHECK (usage_used >= 0 AND (usage_limit IS NULL OR usage_limit > 0 AND usage_used <= usage_limit))
);

CREATE TABLE entitlement_usage_events (
  id text PRIMARY KEY,
  entitlement_grant_id text NOT NULL REFERENCES entitlement_grants(id) ON DELETE RESTRICT,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  amount integer NOT NULL,
  previous_usage integer NOT NULL,
  resulting_usage integer NOT NULL,
  actor_type varchar(24) NOT NULL,
  actor_reference text,
  correlation_id varchar(256) NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT entitlement_usage_events_amount_positive CHECK (amount > 0),
  CONSTRAINT entitlement_usage_events_usage_valid CHECK (previous_usage >= 0 AND resulting_usage >= previous_usage),
  CONSTRAINT entitlement_usage_events_actor_valid CHECK (actor_type IN ('staff','owner','service_account','system'))
);

CREATE TABLE entitlement_audit_events (
  id text PRIMARY KEY,
  action varchar(64) NOT NULL,
  actor_type varchar(24) NOT NULL,
  actor_reference text,
  entitlement_key varchar(192),
  subject_id text,
  resource_id text,
  decision_id text REFERENCES entitlement_decisions(id) ON DELETE RESTRICT,
  result varchar(24) NOT NULL,
  correlation_id varchar(256) NOT NULL,
  previous_event_hash char(64),
  event_hash char(64) NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT entitlement_audit_events_action_valid CHECK (action IN ('evaluation_requested','decision_created','decision_enforced','access_denied','grant_created','grant_suspended','grant_revoked','usage_consumed','cache_invalidated','simulation_executed','runtime_operation_blocked')),
  CONSTRAINT entitlement_audit_events_actor_valid CHECK (actor_type IN ('staff','owner','service_account','system')),
  CONSTRAINT entitlement_audit_events_result_valid CHECK (result IN ('accepted','denied','blocked','manual_review')),
  CONSTRAINT entitlement_audit_events_hash_valid CHECK (event_hash ~ '^[0-9a-f]{64}$')
);

CREATE TABLE entitlement_outbox (
  id text PRIMARY KEY,
  event_type varchar(96) NOT NULL,
  aggregate_id text NOT NULL,
  correlation_id varchar(256) NOT NULL,
  idempotency_key varchar(512) NOT NULL UNIQUE,
  dispatch_state varchar(24) NOT NULL DEFAULT 'blocked',
  payload_reference text,
  created_at timestamptz NOT NULL,
  dispatched_at timestamptz,
  CONSTRAINT entitlement_outbox_event_valid CHECK (event_type IN ('entitlement_decision_created','entitlement_access_denied','entitlement_cache_invalidated')),
  CONSTRAINT entitlement_outbox_state_valid CHECK (dispatch_state IN ('blocked','pending','dispatched','dead_lettered'))
);

CREATE TABLE entitlement_operational_findings (
  id text PRIMARY KEY,
  finding_type varchar(96) NOT NULL,
  severity varchar(16) NOT NULL,
  blocking boolean NOT NULL,
  subject_id text,
  resource_id text,
  decision_id text REFERENCES entitlement_decisions(id) ON DELETE RESTRICT,
  status varchar(24) NOT NULL,
  remediation_reference text,
  created_at timestamptz NOT NULL,
  resolved_at timestamptz,
  CONSTRAINT entitlement_operational_findings_type_valid CHECK (finding_type IN ('missing_policy','profile_version_mismatch','subject_resolution_failure','resource_ownership_mismatch','unknown_blocking_condition','stale_condition_source','grant_deny_conflict','cache_invalidation_failure','enforcement_bypass_attempt','usage_counter_conflict','temporary_access_without_expiry','cross_client_access_attempt','cross_tenant_access_attempt','workflow_action_without_entitlement','ai_scope_violation')),
  CONSTRAINT entitlement_operational_findings_severity_valid CHECK (severity IN ('low','medium','high','critical')),
  CONSTRAINT entitlement_operational_findings_status_valid CHECK (status IN ('open','acknowledged','resolved','accepted_risk'))
);

CREATE INDEX service_entitlement_profiles_active_idx ON service_entitlement_profiles (service_version_reference, status);
CREATE INDEX entitlement_policies_definition_status_idx ON entitlement_policies (entitlement_definition_id, status);
CREATE INDEX entitlement_grants_subject_resource_idx ON entitlement_grants (tenant_id, subject_id, resource_id, status);
CREATE INDEX entitlement_denies_subject_resource_idx ON entitlement_denies (tenant_id, subject_id, resource_id, status);
CREATE INDEX entitlement_decisions_subject_idx ON entitlement_decisions (tenant_id, entitlement_key, decided_at);
CREATE INDEX entitlement_decisions_definition_idx ON entitlement_decisions (entitlement_definition_id, decided_at);
CREATE INDEX entitlement_usage_events_grant_idx ON entitlement_usage_events (entitlement_grant_id, occurred_at);
CREATE INDEX entitlement_audit_events_resource_idx ON entitlement_audit_events (resource_id, occurred_at);
CREATE INDEX entitlement_outbox_dispatch_idx ON entitlement_outbox (dispatch_state, created_at);
CREATE INDEX entitlement_operational_findings_open_idx ON entitlement_operational_findings (status, severity, created_at);

ALTER TABLE entitlement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_capability_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_entitlement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_denies ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_operational_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_entitlements_deny_all ON entitlement_definitions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON service_capability_definitions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON service_entitlement_profiles AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_policies AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_grants AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_denies AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_decisions AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_usage_counters AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_usage_events AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_audit_events AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_outbox AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY service_entitlements_deny_all ON entitlement_operational_findings AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
