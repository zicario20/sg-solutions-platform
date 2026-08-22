DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'atlas_client_services_reader') THEN
    CREATE ROLE atlas_client_services_reader NOLOGIN NOBYPASSRLS;
  END IF;
END $$;
ALTER ROLE atlas_client_services_reader NOBYPASSRLS;

CREATE TABLE public.service_definition_versions (
  id text PRIMARY KEY,
  service_definition_id text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  definition_epoch bigint NOT NULL CHECK (definition_epoch >= 0),
  public_display_es jsonb NOT NULL,
  public_display_en jsonb NOT NULL,
  public_milestones_es jsonb NOT NULL,
  public_milestones_en jsonb NOT NULL,
  accepted_at timestamptz NOT NULL,
  retired_at timestamptz,
  UNIQUE (service_definition_id, version)
);

CREATE TABLE public.service_orders (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  context_opaque_ref varchar(96) NOT NULL,
  context_type varchar(16) NOT NULL CHECK (context_type IN ('personal', 'organization')),
  accepted_definition_version_id text NOT NULL REFERENCES public.service_definition_versions(id) ON DELETE RESTRICT,
  public_reference varchar(48) NOT NULL,
  commercial_state varchar(24) NOT NULL CHECK (commercial_state IN ('preliminary', 'active', 'cancelled')),
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  tombstoned_at timestamptz,
  updated_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  UNIQUE (id, account_id, context_opaque_ref)
);

CREATE TABLE public.service_order_financial_facts (
  service_order_id text PRIMARY KEY REFERENCES public.service_orders(id) ON DELETE CASCADE,
  financial_state varchar(24) NOT NULL CHECK (financial_state IN ('unpaid','processing','paid','partially_refunded','refunded','disputed','cancelled','unavailable')),
  source_version text NOT NULL,
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  observed_at timestamptz NOT NULL
);
CREATE TABLE public.service_order_activation_facts (
  service_order_id text PRIMARY KEY REFERENCES public.service_orders(id) ON DELETE CASCADE,
  activation_state varchar(24) NOT NULL CHECK (activation_state IN ('pending_review','approved','declined','not_required','unavailable')),
  source_version text NOT NULL,
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  observed_at timestamptz NOT NULL
);
CREATE TABLE public.service_order_fulfillment_facts (
  service_order_id text PRIMARY KEY REFERENCES public.service_orders(id) ON DELETE CASCADE,
  fulfillment_state varchar(24) NOT NULL CHECK (fulfillment_state IN ('not_started','in_progress','waiting_client','waiting_external','completed','cancelled','unavailable')),
  current_milestone_index integer,
  completed_milestones integer NOT NULL CHECK (completed_milestones >= 0),
  source_version text NOT NULL,
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  observed_at timestamptz NOT NULL
);

-- Rebuildable lookup/version index only. ServiceOrder and owner facts remain authoritative.
CREATE TABLE public.client_service_read_models (
  service_order_id text PRIMARY KEY REFERENCES public.service_orders(id) ON DELETE CASCADE,
  opaque_ref char(37) NOT NULL UNIQUE CHECK (opaque_ref ~ '^csr1_[A-Za-z0-9_-]{32}$'),
  definition_epoch bigint NOT NULL,
  financial_source_version text NOT NULL,
  activation_source_version text NOT NULL,
  fulfillment_source_version text NOT NULL,
  tasks_source_status varchar(16) NOT NULL CHECK (tasks_source_status IN ('fresh','empty','unavailable')),
  documents_source_status varchar(16) NOT NULL CHECK (documents_source_status IN ('fresh','empty','unavailable')),
  payments_source_status varchar(16) NOT NULL CHECK (payments_source_status IN ('fresh','empty','unavailable')),
  generated_at timestamptz NOT NULL
);
CREATE TABLE public.client_service_child_resource_fences (
  service_order_id text NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  internal_resource_id text NOT NULL,
  source_version text NOT NULL,
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  PRIMARY KEY (service_order_id, internal_resource_id)
);
CREATE TABLE public.client_service_access_grants (
  service_order_id text NOT NULL,
  account_id text NOT NULL,
  context_opaque_ref varchar(96) NOT NULL,
  permission varchar(48) NOT NULL CHECK (permission = 'client.service.read'),
  grant_state varchar(16) NOT NULL CHECK (grant_state IN ('active', 'revoked')),
  authorization_epoch bigint NOT NULL CHECK (authorization_epoch >= 0),
  policy_epoch bigint NOT NULL CHECK (policy_epoch >= 0),
  resource_epoch bigint NOT NULL CHECK (resource_epoch >= 0),
  expires_at timestamptz,
  PRIMARY KEY (service_order_id, account_id, context_opaque_ref, permission),
  FOREIGN KEY (service_order_id, account_id, context_opaque_ref)
    REFERENCES public.service_orders(id, account_id, context_opaque_ref) ON DELETE CASCADE
);

ALTER TABLE public.service_definition_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.service_definition_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE public.service_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_financial_facts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.service_order_financial_facts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_activation_facts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.service_order_activation_facts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_fulfillment_facts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.service_order_fulfillment_facts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.client_service_read_models ENABLE ROW LEVEL SECURITY; ALTER TABLE public.client_service_read_models FORCE ROW LEVEL SECURITY;
ALTER TABLE public.client_service_child_resource_fences ENABLE ROW LEVEL SECURITY; ALTER TABLE public.client_service_child_resource_fences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.client_service_access_grants ENABLE ROW LEVEL SECURITY; ALTER TABLE public.client_service_access_grants FORCE ROW LEVEL SECURITY;

CREATE POLICY client_service_grant_scope ON public.client_service_access_grants FOR SELECT TO atlas_client_services_reader USING (
  account_id = current_setting('atlas.account_id', true)
  AND context_opaque_ref = current_setting('atlas.context_opaque_ref', true)
  AND grant_state = 'active' AND permission = 'client.service.read'
  AND (expires_at IS NULL OR expires_at > transaction_timestamp())
  AND authorization_epoch = current_setting('atlas.authorization_epoch', true)::bigint
  AND policy_epoch = current_setting('atlas.policy_epoch', true)::bigint
);
CREATE POLICY client_service_order_scope ON public.service_orders FOR SELECT TO atlas_client_services_reader USING (
  tombstoned_at IS NULL AND EXISTS (SELECT 1 FROM public.client_service_access_grants g WHERE g.service_order_id = service_orders.id AND service_orders.account_id = g.account_id AND service_orders.context_opaque_ref = g.context_opaque_ref AND g.resource_epoch = service_orders.resource_epoch)
);
-- Equivalent aliases used by repository defense in depth: p.account_id = g.account_id; p.context_opaque_ref = g.context_opaque_ref.
CREATE POLICY client_service_definition_scope ON public.service_definition_versions FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.accepted_definition_version_id = service_definition_versions.id));
CREATE POLICY client_service_financial_scope ON public.service_order_financial_facts FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.id = service_order_financial_facts.service_order_id));
CREATE POLICY client_service_activation_scope ON public.service_order_activation_facts FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.id = service_order_activation_facts.service_order_id));
CREATE POLICY client_service_fulfillment_scope ON public.service_order_fulfillment_facts FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.id = service_order_fulfillment_facts.service_order_id));
CREATE POLICY client_service_read_model_scope ON public.client_service_read_models FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.id = client_service_read_models.service_order_id));
CREATE POLICY client_service_child_fence_scope ON public.client_service_child_resource_fences FOR SELECT TO atlas_client_services_reader USING (EXISTS (SELECT 1 FROM public.service_orders p WHERE p.id = client_service_child_resource_fences.service_order_id));

REVOKE ALL ON public.service_definition_versions, public.service_orders, public.service_order_financial_facts, public.service_order_activation_facts, public.service_order_fulfillment_facts, public.client_service_read_models, public.client_service_child_resource_fences, public.client_service_access_grants FROM PUBLIC;
GRANT SELECT ON public.service_definition_versions, public.service_orders, public.service_order_financial_facts, public.service_order_activation_facts, public.service_order_fulfillment_facts, public.client_service_read_models, public.client_service_child_resource_fences, public.client_service_access_grants TO atlas_client_services_reader;
