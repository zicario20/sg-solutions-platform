-- M037 Financial Marketplace. Authored migration only; it has not been executed.
-- Marketplace providers are provider-disabled until independently approved and activated.

CREATE ROLE atlas_marketplace_gateway NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
ALTER ROLE atlas_marketplace_gateway NOBYPASSRLS;

CREATE TABLE public.marketplace_providers (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  code varchar(96) NOT NULL UNIQUE,
  public_name varchar(256) NOT NULL,
  provider_type varchar(64) NOT NULL,
  status varchar(32) NOT NULL CHECK (status IN ('draft','under_review','approved_not_enabled','enabled','paused','suspended','retired','archived')),
  allowed_redirect_hosts jsonb NOT NULL,
  capabilities jsonb NOT NULL,
  agreement_reference text,
  verification_due_at timestamptz,
  verified_at timestamptz,
  source_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  CHECK (status <> 'enabled')
);
CREATE TABLE public.marketplace_categories (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL UNIQUE,
  parent_category_id text,
  translations jsonb NOT NULL,
  status varchar(24) NOT NULL CHECK (status IN ('active','inactive','archived')),
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.marketplace_listings (
  id text PRIMARY KEY,
  code varchar(96) NOT NULL UNIQUE,
  provider_id text NOT NULL REFERENCES public.marketplace_providers(id) ON DELETE RESTRICT,
  category_id text NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
  item_type varchar(48) NOT NULL,
  status varchar(32) NOT NULL CHECK (status IN ('draft','under_review','published','limited','paused','retired','archived')),
  public_visibility varchar(32) NOT NULL,
  current_version_id text,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.marketplace_listing_versions (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  translations jsonb NOT NULL,
  disclosures jsonb NOT NULL,
  pricing_status varchar(32) NOT NULL,
  availability_status varchar(32) NOT NULL,
  source_snapshot jsonb NOT NULL,
  reviewed_at timestamptz,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz,
  status varchar(24) NOT NULL CHECK (status IN ('draft','approved','published','retired')),
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  UNIQUE(listing_id, version),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_current_version_fk FOREIGN KEY (current_version_id) REFERENCES public.marketplace_listing_versions(id) ON DELETE RESTRICT;
CREATE TABLE public.marketplace_consents (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  provider_id text NOT NULL REFERENCES public.marketplace_providers(id) ON DELETE RESTRICT,
  listing_version_id text NOT NULL REFERENCES public.marketplace_listing_versions(id) ON DELETE RESTRICT,
  purpose varchar(32) NOT NULL CHECK (purpose IN ('personalization','referral','redirect','data_sharing')),
  data_categories jsonb NOT NULL,
  disclosure_version_ids jsonb NOT NULL,
  status varchar(24) NOT NULL CHECK (status IN ('pending','accepted','withdrawn','expired','superseded')),
  accepted_at timestamptz,
  expires_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.marketplace_journeys (
  id text PRIMARY KEY,
  idempotency_key varchar(160) NOT NULL UNIQUE,
  client_id text NOT NULL,
  provider_id text NOT NULL REFERENCES public.marketplace_providers(id) ON DELETE RESTRICT,
  listing_version_id text NOT NULL REFERENCES public.marketplace_listing_versions(id) ON DELETE RESTRICT,
  source_channel varchar(32) NOT NULL,
  status varchar(40) NOT NULL,
  consent_id text REFERENCES public.marketplace_consents(id) ON DELETE RESTRICT,
  attribution jsonb NOT NULL,
  external_reference text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.marketplace_conversions (
  id text PRIMARY KEY,
  journey_id text NOT NULL REFERENCES public.marketplace_journeys(id) ON DELETE RESTRICT,
  provider_id text NOT NULL REFERENCES public.marketplace_providers(id) ON DELETE RESTRICT,
  event_reference varchar(160) NOT NULL,
  event_type varchar(40) NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  UNIQUE(provider_id, event_reference)
);
CREATE TABLE public.marketplace_commissions (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES public.marketplace_providers(id) ON DELETE RESTRICT,
  journey_id text NOT NULL REFERENCES public.marketplace_journeys(id) ON DELETE RESTRICT,
  conversion_id text NOT NULL REFERENCES public.marketplace_conversions(id) ON DELETE RESTRICT,
  contract_reference text NOT NULL,
  calculation_rule_version varchar(64) NOT NULL,
  amount_cents bigint,
  currency varchar(3) NOT NULL,
  status varchar(32) NOT NULL CHECK (status IN ('candidate','pending_verification','earned','paid','reversed','disputed','cancelled')),
  earned_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE INDEX marketplace_listings_provider_status_idx ON public.marketplace_listings(provider_id, status);
CREATE INDEX marketplace_listing_versions_listing_status_idx ON public.marketplace_listing_versions(listing_id, status);
CREATE INDEX marketplace_consents_client_provider_idx ON public.marketplace_consents(client_id, provider_id);
CREATE INDEX marketplace_journeys_client_status_idx ON public.marketplace_journeys(client_id, status);
CREATE INDEX marketplace_conversions_journey_idx ON public.marketplace_conversions(journey_id);
CREATE INDEX marketplace_commissions_provider_status_idx ON public.marketplace_commissions(provider_id, status);
ALTER TABLE public.marketplace_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketplace_gateway_deny_direct_provider ON public.marketplace_providers AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY marketplace_gateway_deny_direct_listing ON public.marketplace_listings AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY marketplace_gateway_deny_direct_consent ON public.marketplace_consents AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY marketplace_gateway_deny_direct_journey ON public.marketplace_journeys AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY marketplace_gateway_deny_direct_conversion ON public.marketplace_conversions AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY marketplace_gateway_deny_direct_commission ON public.marketplace_commissions AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
