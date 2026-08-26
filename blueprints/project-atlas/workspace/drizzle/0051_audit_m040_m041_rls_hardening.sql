-- Audit remediation: M040/M041 tables were authored without an RLS declaration.
-- This forward-only migration keeps provider-disabled tables inaccessible until a
-- separately approved gateway policy replaces the restrictive deny-all policy.

ALTER TABLE public.partner_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_due_diligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.provider_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_capability_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_adapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY m040_partner_relationships_deny_all ON public.partner_relationships AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m040_partner_onboardings_deny_all ON public.partner_onboardings AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m040_partner_due_diligence_deny_all ON public.partner_due_diligence AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m040_partner_contacts_deny_all ON public.partner_contacts AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m040_partner_documents_deny_all ON public.partner_documents AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);

CREATE POLICY m041_provider_interfaces_deny_all ON public.provider_interfaces AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_capability_definitions_deny_all ON public.provider_capability_definitions AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_capabilities_deny_all ON public.provider_capabilities AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_schemas_deny_all ON public.provider_schemas AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_adapters_deny_all ON public.provider_adapters AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_endpoints_deny_all ON public.provider_endpoints AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_health_deny_all ON public.provider_health AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY m041_provider_routes_deny_all ON public.provider_routes AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
