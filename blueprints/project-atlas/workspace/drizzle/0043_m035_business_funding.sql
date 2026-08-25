-- M035 Business Funding controlled foundation. Author only; do not execute without approved migration, backup and RLS validation evidence.
CREATE ROLE atlas_funding_gateway NOLOGIN NOBYPASSRLS;

CREATE TABLE funding_engagements (
  id text PRIMARY KEY, client_id text NOT NULL, organization_id text NOT NULL, service_order_id text NOT NULL,
  service_type text NOT NULL, delivery_model text NOT NULL, status text NOT NULL,
  assigned_specialist_id text, assigned_reviewer_id text, opened_at timestamptz NOT NULL,
  completed_at timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE funding_cases (
  id text PRIMARY KEY, case_number text NOT NULL UNIQUE, engagement_id text NOT NULL, client_id text NOT NULL,
  organization_id text NOT NULL, funding_profile_id text, requested_amount_cents integer, currency text,
  purpose_code text, status text NOT NULL, priority text NOT NULL, assigned_to text, reviewer_id text,
  version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, completed_at timestamptz
);
CREATE TABLE funding_profiles (
  id text PRIMARY KEY, funding_case_id text NOT NULL, organization_id text NOT NULL, profile_version integer NOT NULL,
  verification_status text NOT NULL, profile jsonb NOT NULL, source_references jsonb NOT NULL,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, UNIQUE (funding_case_id, profile_version)
);
CREATE TABLE funding_financial_profiles (
  id text PRIMARY KEY, funding_case_id text NOT NULL, organization_id text NOT NULL, profile_version integer NOT NULL,
  period_start timestamptz NOT NULL, period_end timestamptz NOT NULL, verification_status text NOT NULL,
  financial_profile jsonb NOT NULL, source_references jsonb NOT NULL, created_at timestamptz NOT NULL,
  UNIQUE (funding_case_id, profile_version)
);
CREATE TABLE funding_products (
  id text PRIMARY KEY, code text NOT NULL UNIQUE, provider_id text, partner_id text, family text NOT NULL,
  delivery_model text NOT NULL, status text NOT NULL, current_version_id text, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE funding_product_versions (
  id text PRIMARY KEY, product_id text NOT NULL, version integer NOT NULL, status text NOT NULL, availability text NOT NULL,
  configuration jsonb NOT NULL, source_references jsonb NOT NULL, verified_at timestamptz, next_review_at timestamptz,
  created_at timestamptz NOT NULL, UNIQUE (product_id, version)
);
CREATE TABLE funding_screenings (
  id text PRIMARY KEY, funding_case_id text NOT NULL, product_version_id text NOT NULL, profile_version integer NOT NULL,
  financial_profile_version integer, status text NOT NULL, result jsonb NOT NULL, evaluated_at timestamptz NOT NULL
);
CREATE TABLE funding_matching_runs (
  id text PRIMARY KEY, funding_case_id text NOT NULL, profile_version integer NOT NULL, financial_profile_version integer,
  status text NOT NULL, candidates jsonb NOT NULL, created_at timestamptz NOT NULL
);
CREATE TABLE funding_consents (
  id text PRIMARY KEY, funding_case_id text NOT NULL, provider_id text, partner_id text, purpose text NOT NULL,
  status text NOT NULL, data_categories jsonb NOT NULL, disclosure_version_ids jsonb NOT NULL,
  accepted_at timestamptz, expires_at timestamptz, withdrawn_at timestamptz
);
CREATE TABLE funding_applications (
  id text PRIMARY KEY, funding_case_id text NOT NULL, provider_id text NOT NULL, product_version_id text NOT NULL,
  application_package_id text NOT NULL, external_application_id text, application_channel text NOT NULL, status text NOT NULL,
  idempotency_key text NOT NULL UNIQUE, submitted_at timestamptz, decision_at timestamptz,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE funding_offers (
  id text PRIMARY KEY, application_id text NOT NULL, provider_id text NOT NULL, product_version_id text NOT NULL,
  offer_amount_cents integer NOT NULL CHECK (offer_amount_cents >= 0), currency text NOT NULL, status text NOT NULL,
  terms jsonb NOT NULL, source_document_id text, verified_at timestamptz NOT NULL, created_at timestamptz NOT NULL
);
CREATE TABLE funding_audit_events (
  id text PRIMARY KEY, funding_case_id text, action text NOT NULL, actor_type text NOT NULL, actor_id text,
  correlation_id text NOT NULL, safe_metadata jsonb NOT NULL, occurred_at timestamptz NOT NULL
);

CREATE INDEX funding_cases_organization_status_idx ON funding_cases (organization_id, status);
CREATE INDEX funding_screenings_case_idx ON funding_screenings (funding_case_id);
CREATE INDEX funding_matching_runs_case_idx ON funding_matching_runs (funding_case_id);
CREATE INDEX funding_consents_case_idx ON funding_consents (funding_case_id);
CREATE INDEX funding_applications_case_idx ON funding_applications (funding_case_id);
CREATE INDEX funding_offers_application_idx ON funding_offers (application_id);
CREATE INDEX funding_audit_events_case_idx ON funding_audit_events (funding_case_id);

ALTER TABLE funding_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_matching_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_engagements FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_financial_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_products FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_product_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_screenings FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_matching_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_consents FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_offers FORCE ROW LEVEL SECURITY;
ALTER TABLE funding_audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY funding_engagements_gateway_only ON funding_engagements TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_cases_gateway_only ON funding_cases TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_profiles_gateway_only ON funding_profiles TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_financial_profiles_gateway_only ON funding_financial_profiles TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_products_gateway_only ON funding_products TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_product_versions_gateway_only ON funding_product_versions TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_screenings_gateway_only ON funding_screenings TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_matching_runs_gateway_only ON funding_matching_runs TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_consents_gateway_only ON funding_consents TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_applications_gateway_only ON funding_applications TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_offers_gateway_only ON funding_offers TO atlas_funding_gateway USING (false) WITH CHECK (false);
CREATE POLICY funding_audit_events_gateway_only ON funding_audit_events TO atlas_funding_gateway USING (false) WITH CHECK (false);
