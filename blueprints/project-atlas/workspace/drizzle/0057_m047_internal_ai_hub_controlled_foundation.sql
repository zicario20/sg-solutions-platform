-- M047 controlled Internal AI Hub foundation.
-- Authored only. Do not apply without Product Owner approval, a real authorization
-- model, backup/rollback evidence, independent security review, and activation plan.

CREATE TABLE IF NOT EXISTS "ai_hub_workspaces" (
  "id" uuid PRIMARY KEY,
  "tenant_id" varchar(160) NOT NULL,
  "workspace_code" varchar(96) NOT NULL,
  "environment" varchar(32) NOT NULL,
  "production_data_access" boolean NOT NULL DEFAULT false,
  "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "workspace_code")
);

CREATE TABLE IF NOT EXISTS "ai_asset_definitions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "workspace_id" uuid NOT NULL,
  "asset_type" varchar(64) NOT NULL, "asset_code" varchar(96) NOT NULL,
  "owner_reference" varchar(160) NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("workspace_id", "asset_code")
);

CREATE TABLE IF NOT EXISTS "ai_agent_definitions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "workspace_id" uuid NOT NULL,
  "agent_code" varchar(96) NOT NULL, "display_name" varchar(180) NOT NULL,
  "agent_type" varchar(64) NOT NULL, "lifecycle_status" varchar(32) NOT NULL,
  "deployment_status" varchar(32) NOT NULL, "owner_reference" varchar(160) NOT NULL,
  "risk_tier" varchar(32) NOT NULL, "purpose" text NOT NULL, "scope_boundary" text NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("workspace_id", "agent_code")
);

CREATE TABLE IF NOT EXISTS "ai_agent_versions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_definition_id" uuid NOT NULL,
  "version" integer NOT NULL, "status" varchar(32) NOT NULL, "capabilities" jsonb NOT NULL,
  "configuration_hash" varchar(128) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("agent_definition_id", "version")
);

CREATE TABLE IF NOT EXISTS "ai_agent_manifests" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "references" jsonb NOT NULL, "configuration_hash" varchar(128) NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("agent_version_id", "configuration_hash")
);

CREATE TABLE IF NOT EXISTS "ai_agent_surface_bindings" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "surface" varchar(32) NOT NULL, "capability_codes" jsonb NOT NULL,
  "required_permissions" jsonb NOT NULL, "required_entitlements" jsonb NOT NULL,
  "ownership_required" boolean NOT NULL DEFAULT false, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_model_provider_profiles" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "workspace_id" uuid NOT NULL,
  "provider_code" varchar(96) NOT NULL, "provider_kind" varchar(64) NOT NULL,
  "environment" varchar(32) NOT NULL, "endpoint_reference" text NOT NULL,
  "secret_reference" varchar(240), "status" varchar(32) NOT NULL,
  "health" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("workspace_id", "provider_code", "environment")
);

CREATE TABLE IF NOT EXISTS "ai_model_definitions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "provider_profile_id" uuid NOT NULL,
  "model_code" varchar(96) NOT NULL, "lifecycle_status" varchar(32) NOT NULL,
  "data_classifications" jsonb NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("provider_profile_id", "model_code")
);

CREATE TABLE IF NOT EXISTS "ai_model_versions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "model_definition_id" uuid NOT NULL,
  "exact_model_id" varchar(240) NOT NULL, "version" integer NOT NULL,
  "context_window" integer NOT NULL, "maximum_output_tokens" integer NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("model_definition_id", "version")
);

CREATE TABLE IF NOT EXISTS "ai_model_policies" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "policy_code" varchar(96) NOT NULL,
  "version" integer NOT NULL, "configuration" jsonb NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "policy_code", "version")
);

CREATE TABLE IF NOT EXISTS "ai_prompt_versions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "prompt_definition_id" uuid NOT NULL,
  "version" integer NOT NULL, "template_reference" varchar(240) NOT NULL,
  "variable_names" jsonb NOT NULL, "locale" varchar(8) NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("prompt_definition_id", "version")
);

CREATE TABLE IF NOT EXISTS "ai_tool_definitions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "tool_code" varchar(96) NOT NULL,
  "version" integer NOT NULL, "side_effect_class" varchar(32) NOT NULL,
  "required_permissions" jsonb NOT NULL, "required_approvals" jsonb NOT NULL,
  "network_policy" varchar(32) NOT NULL, "idempotency_required" boolean NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("tenant_id", "tool_code", "version")
);

CREATE TABLE IF NOT EXISTS "ai_tool_permission_policies" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "policy_code" varchar(96) NOT NULL,
  "version" integer NOT NULL, "configuration" jsonb NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "policy_code", "version")
);

CREATE TABLE IF NOT EXISTS "ai_knowledge_bindings" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "collection_reference" varchar(240) NOT NULL, "access_scope" varchar(32) NOT NULL,
  "surface" varchar(32) NOT NULL, "freshness_policy_reference" varchar(240) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_context_sessions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "purpose" varchar(160) NOT NULL, "source_references" jsonb NOT NULL,
  "context_fields" jsonb NOT NULL, "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_dataset_versions" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "dataset_definition_id" uuid NOT NULL,
  "version" integer NOT NULL, "provenance_references" jsonb NOT NULL,
  "data_classification" varchar(32) NOT NULL, "split" varchar(32) NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("dataset_definition_id", "version")
);

CREATE TABLE IF NOT EXISTS "ai_evaluation_suites" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "suite_code" varchar(96) NOT NULL,
  "version" integer NOT NULL, "dimensions" jsonb NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "suite_code", "version")
);

CREATE TABLE IF NOT EXISTS "ai_safety_test_results" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "evaluation_suite_id" uuid, "scenario_type" varchar(96) NOT NULL,
  "severity" varchar(32) NOT NULL, "blocking" boolean NOT NULL, "status" varchar(32) NOT NULL,
  "evidence_reference" varchar(240) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_release_gates" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "evaluation_suite_references" jsonb NOT NULL, "safety_test_references" jsonb NOT NULL,
  "required_human_approvals" jsonb NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_agent_runs" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "agent_version_id" uuid NOT NULL,
  "invocation_type" varchar(32) NOT NULL, "invocation_authorization_reference" varchar(240) NOT NULL,
  "input_snapshot_reference" varchar(240) NOT NULL, "context_snapshot_reference" varchar(240) NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_agent_run_steps" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "run_id" uuid NOT NULL,
  "ordinal" integer NOT NULL, "step_type" varchar(64) NOT NULL, "status" varchar(32) NOT NULL,
  "version" integer NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL, UNIQUE ("run_id", "ordinal")
);

CREATE TABLE IF NOT EXISTS "ai_agent_handoffs" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "source_run_id" uuid NOT NULL,
  "target_agent_version_id" uuid NOT NULL, "purpose" varchar(240) NOT NULL,
  "fact_references" jsonb NOT NULL, "source_references" jsonb NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_human_approvals" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "run_id" uuid NOT NULL,
  "action_type" varchar(120) NOT NULL, "parameter_hash" varchar(240) NOT NULL,
  "required_approver_roles" jsonb NOT NULL, "expires_at" timestamptz NOT NULL,
  "status" varchar(32) NOT NULL, "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_tool_execution_records" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "run_id" uuid NOT NULL,
  "tool_definition_id" uuid NOT NULL, "idempotency_key" varchar(240) NOT NULL,
  "status" varchar(32) NOT NULL, "outcome_reference" varchar(240),
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "idempotency_key")
);

CREATE TABLE IF NOT EXISTS "ai_runtime_incidents" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL,
  "incident_type" varchar(96) NOT NULL, "severity" varchar(32) NOT NULL,
  "status" varchar(32) NOT NULL, "resource_reference" varchar(240) NOT NULL,
  "mitigation_reference" varchar(240), "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_audit_events" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL,
  "aggregate_type" varchar(96) NOT NULL, "aggregate_id" uuid NOT NULL,
  "event_type" varchar(120) NOT NULL, "correlation_id" varchar(160) NOT NULL,
  "evidence_reference" varchar(240) NOT NULL, "occurred_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_outbox" (
  "id" uuid PRIMARY KEY, "tenant_id" varchar(160) NOT NULL, "event_type" varchar(120) NOT NULL,
  "aggregate_reference" varchar(240) NOT NULL, "idempotency_key" varchar(240) NOT NULL,
  "payload_reference" varchar(240) NOT NULL, "status" varchar(32) NOT NULL,
  "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL,
  UNIQUE ("tenant_id", "idempotency_key")
);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_hub_workspaces', 'ai_asset_definitions', 'ai_agent_definitions', 'ai_agent_versions',
    'ai_agent_manifests', 'ai_agent_surface_bindings', 'ai_model_provider_profiles',
    'ai_model_definitions', 'ai_model_versions', 'ai_model_policies', 'ai_prompt_versions',
    'ai_tool_definitions', 'ai_tool_permission_policies', 'ai_knowledge_bindings',
    'ai_context_sessions', 'ai_dataset_versions', 'ai_evaluation_suites', 'ai_safety_test_results',
    'ai_release_gates', 'ai_agent_runs', 'ai_agent_run_steps', 'ai_agent_handoffs',
    'ai_human_approvals', 'ai_tool_execution_records', 'ai_runtime_incidents', 'ai_audit_events',
    'ai_outbox'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_deny_all', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false)',
      table_name || '_deny_all',
      table_name
    );
  END LOOP;
END $$;
