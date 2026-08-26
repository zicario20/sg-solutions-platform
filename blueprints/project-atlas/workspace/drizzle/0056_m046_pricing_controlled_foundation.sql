-- M046 Pricing, Discounts and Promotions controlled foundation.
-- Authored only. Do not apply without Product Owner authorization, backup
-- evidence, approved RLS policies, migration runbook, and security review.

CREATE TABLE currency_definitions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  currency_code varchar(3) NOT NULL,
  minor_unit_digits integer NOT NULL,
  display_symbol varchar(16) NOT NULL,
  display_name varchar(120) NOT NULL,
  rounding_context varchar(64) NOT NULL,
  status varchar(32) NOT NULL,
  source_reference text NOT NULL,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, currency_code)
);

CREATE TABLE pricing_definitions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  pricing_code varchar(64) NOT NULL,
  name varchar(200) NOT NULL,
  description text NOT NULL,
  owner_domain varchar(120) NOT NULL,
  pricing_type varchar(64) NOT NULL,
  lifecycle_status varchar(32) NOT NULL,
  current_profile_version_id uuid,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, pricing_code)
);

CREATE TABLE pricing_profiles (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  pricing_definition_id uuid NOT NULL,
  profile_code varchar(64) NOT NULL,
  version integer NOT NULL,
  pricing_model varchar(64) NOT NULL,
  currency varchar(3) NOT NULL,
  base_amount_minor integer,
  minimum_amount_minor integer,
  maximum_amount_minor integer,
  internal_cost_minor integer,
  components jsonb NOT NULL,
  deposit_policy jsonb,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, profile_code, version)
);

CREATE TABLE price_books (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  price_book_code varchar(64) NOT NULL,
  name varchar(200) NOT NULL,
  currency varchar(3) NOT NULL,
  market_context varchar(120) NOT NULL,
  jurisdiction_context varchar(120),
  audience_context varchar(120),
  channel_context varchar(120),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, price_book_code, version)
);

CREATE TABLE price_book_entries (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  price_book_id uuid NOT NULL,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL,
  pricing_profile_id uuid NOT NULL,
  pricing_profile_version integer NOT NULL,
  currency varchar(3) NOT NULL,
  display_mode varchar(64) NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE pricing_rules (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  rule_code varchar(64) NOT NULL,
  version integer NOT NULL,
  priority integer NOT NULL,
  action_type varchar(64) NOT NULL,
  conditions jsonb NOT NULL,
  action_configuration jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, rule_code, version)
);

CREATE TABLE discount_definitions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  discount_code varchar(64) NOT NULL,
  version integer NOT NULL,
  configuration jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, discount_code, version)
);

CREATE TABLE promotion_definitions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  promotion_code varchar(64) NOT NULL,
  name varchar(200) NOT NULL,
  promotion_type varchar(64) NOT NULL,
  configuration jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  version integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, promotion_code, version)
);

CREATE TABLE promotion_codes (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  promotion_definition_id uuid NOT NULL,
  code_hash varchar(128) NOT NULL,
  display_code varchar(64),
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  maximum_uses integer,
  maximum_uses_per_client integer,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, code_hash)
);

CREATE TABLE promotion_redemptions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  promotion_code_id uuid NOT NULL,
  operation_id varchar(160) NOT NULL,
  client_id uuid,
  organization_id uuid,
  status varchar(32) NOT NULL,
  reserved_at timestamptz NOT NULL,
  expires_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, promotion_code_id, operation_id)
);

CREATE TABLE payment_schedule_policies (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  policy_code varchar(64) NOT NULL,
  version integer NOT NULL,
  configuration jsonb NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, policy_code, version)
);

CREATE TABLE commercial_pricing_snapshots (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL,
  pricing_definition_id uuid NOT NULL,
  pricing_profile_id uuid NOT NULL,
  pricing_profile_version integer NOT NULL,
  price_book_id uuid NOT NULL,
  price_book_version integer NOT NULL,
  currency varchar(3) NOT NULL,
  display_mode varchar(64) NOT NULL,
  line_items jsonb NOT NULL,
  total_amount_minor integer NOT NULL,
  discount_total_minor integer NOT NULL,
  promotion_total_minor integer NOT NULL,
  deposit_amount_minor integer NOT NULL,
  amount_due_now_minor integer NOT NULL,
  remaining_amount_minor integer NOT NULL,
  rule_versions jsonb NOT NULL,
  accepted_at timestamptz NOT NULL,
  content_hash varchar(128) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, content_hash)
);

CREATE TABLE service_quotes (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  quote_number varchar(160) NOT NULL,
  client_id uuid,
  organization_id uuid,
  service_definition_id uuid NOT NULL,
  service_version_id uuid NOT NULL,
  current_quote_version_id uuid,
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, quote_number)
);

CREATE TABLE service_quote_versions (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  quote_id uuid NOT NULL,
  version integer NOT NULL,
  pricing_snapshot_id uuid NOT NULL,
  terms_references jsonb NOT NULL,
  disclosure_references jsonb NOT NULL,
  valid_from timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status varchar(32) NOT NULL,
  accepted_by uuid,
  accepted_at timestamptz,
  content_hash varchar(128) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (quote_id, version)
);

CREATE TABLE pricing_audit_events (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  action varchar(120) NOT NULL,
  resource_type varchar(120) NOT NULL,
  resource_id varchar(160) NOT NULL,
  actor_type varchar(64) NOT NULL,
  actor_id varchar(160) NOT NULL,
  correlation_id varchar(160) NOT NULL,
  payload_hash varchar(128) NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE pricing_outbox (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  event_type varchar(120) NOT NULL,
  aggregate_type varchar(120) NOT NULL,
  aggregate_id varchar(160) NOT NULL,
  payload jsonb NOT NULL,
  dispatch_state varchar(32) NOT NULL,
  idempotency_key varchar(200) NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE pricing_data_quality_findings (
  id uuid PRIMARY KEY,
  tenant_id varchar(160) NOT NULL,
  finding_type varchar(120) NOT NULL,
  severity varchar(32) NOT NULL,
  pricing_resource_type varchar(120) NOT NULL,
  pricing_resource_id varchar(160) NOT NULL,
  blocking boolean NOT NULL,
  status varchar(32) NOT NULL,
  description text NOT NULL,
  source_references jsonb NOT NULL,
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

DO $$
DECLARE
  pricing_table text;
BEGIN
  FOREACH pricing_table IN ARRAY ARRAY[
    'currency_definitions', 'pricing_definitions', 'pricing_profiles', 'price_books',
    'price_book_entries', 'pricing_rules', 'discount_definitions', 'promotion_definitions',
    'promotion_codes', 'promotion_redemptions', 'payment_schedule_policies',
    'commercial_pricing_snapshots', 'service_quotes', 'service_quote_versions',
    'pricing_audit_events', 'pricing_outbox', 'pricing_data_quality_findings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', pricing_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
      pricing_table || '_deny_all',
      pricing_table
    );
  END LOOP;
END $$;
