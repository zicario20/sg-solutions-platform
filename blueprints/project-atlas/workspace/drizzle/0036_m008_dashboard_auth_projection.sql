-- M008 server-only authorization projection, context preference, and durable admission.
CREATE TABLE IF NOT EXISTS public.auth_dashboard_context_preferences (
  account_id pg_catalog.text PRIMARY KEY REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
  organization_id pg_catalog.text REFERENCES public.auth_organizations(id) ON DELETE CASCADE,
  version pg_catalog.integer NOT NULL DEFAULT 1,
  created_at pg_catalog.timestamptz NOT NULL,
  updated_at pg_catalog.timestamptz NOT NULL,
  CONSTRAINT auth_dashboard_context_preferences_version_positive CHECK (version > 0)
);--> statement-breakpoint
ALTER TABLE public.auth_dashboard_context_preferences ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.auth_dashboard_context_preferences FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY auth_dashboard_context_preferences_gateway_only ON public.auth_dashboard_context_preferences AS PERMISSIVE FOR ALL TO atlas_auth_gateway USING (pg_catalog.current_setting('atlas.auth_context_verified', true) = '1') WITH CHECK (pg_catalog.current_setting('atlas.auth_context_verified', true) = '1');--> statement-breakpoint
REVOKE ALL ON TABLE public.auth_dashboard_context_preferences FROM PUBLIC;--> statement-breakpoint

CREATE FUNCTION public.atlas_m008_dashboard_auth_projection(p_lookup pg_catalog.text,p_by_session_id pg_catalog.boolean,p_now pg_catalog.timestamptz) RETURNS TABLE(session_id pg_catalog.text,account_id pg_catalog.text,family_id pg_catalog.text,session_state pg_catalog.text,account_status pg_catalog.text,assurance pg_catalog.text,idle_expires_at pg_catalog.timestamptz,absolute_expires_at pg_catalog.timestamptz,authentication_epoch pg_catalog.integer,authorization_epoch pg_catalog.integer,policy_epoch pg_catalog.integer,party_link_state pg_catalog.text,party_link_version pg_catalog.integer,organization_contexts pg_catalog.jsonb,preferred_organization_id pg_catalog.text) LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog SET row_security=off AS $$
  SELECT s.id,a.id,s.family_id,s.state,a.status,s.assurance,s.idle_expires_at,s.absolute_expires_at,a.authentication_epoch,a.access_epoch,a.policy_epoch,pl.state,pl.access_version,
    pg_catalog.coalesce((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('organizationId',o.id,'membershipVersion',ra.access_version,'entitlementVersion',pg_catalog.greatest(ra.access_version,o.access_version)) ORDER BY o.id) FROM public.auth_role_assignments ra JOIN public.auth_organizations o ON o.id=ra.organization_id AND o.state='active' WHERE ra.account_id=a.id AND ra.state='active' AND EXISTS (SELECT 1 FROM public.auth_role_permissions rp WHERE rp.role_id=ra.role_id AND rp.permission='client.dashboard.view')),'[]'::pg_catalog.jsonb),
    pref.organization_id
  FROM public.auth_sessions s JOIN public.auth_accounts a ON a.id=s.account_id JOIN LATERAL (SELECT state,access_version FROM public.auth_party_links WHERE account_id=a.id AND state='active' ORDER BY access_version DESC LIMIT 1) pl ON true LEFT JOIN public.auth_dashboard_context_preferences pref ON pref.account_id=a.id
  WHERE p_now IS NOT NULL AND pg_catalog.length(p_lookup) BETWEEN 16 AND 256 AND p_lookup ~ '^[A-Za-z0-9_-]+$' AND ((p_by_session_id AND s.id=p_lookup) OR (NOT p_by_session_id AND s.handle_digest=p_lookup)) AND s.state='active' AND s.idle_expires_at>p_now AND s.absolute_expires_at>p_now AND a.status='active' AND a.authentication_epoch>0 AND a.access_epoch>0 AND a.policy_epoch>0 AND pl.access_version>0 LIMIT 1
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_auth_projection(pg_catalog.text,pg_catalog.boolean,pg_catalog.timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.atlas_m008_dashboard_auth_projection(pg_catalog.text,pg_catalog.boolean,pg_catalog.timestamptz) TO atlas_auth_gateway;--> statement-breakpoint

CREATE FUNCTION public.atlas_m008_dashboard_select_context(p_session pg_catalog.text,p_account pg_catalog.text,p_organization pg_catalog.text,p_authentication_epoch pg_catalog.integer,p_authorization_epoch pg_catalog.integer,p_policy_epoch pg_catalog.integer,p_now pg_catalog.timestamptz) RETURNS pg_catalog.boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET row_security=off AS $$
BEGIN
  IF p_now IS NULL OR pg_catalog.length(p_session) NOT BETWEEN 16 AND 256 OR p_session !~ '^[A-Za-z0-9_-]+$' OR pg_catalog.length(p_account) NOT BETWEEN 16 AND 256 OR p_account !~ '^[A-Za-z0-9_-]+$' OR (p_organization IS NOT NULL AND (pg_catalog.length(p_organization) NOT BETWEEN 16 AND 256 OR p_organization !~ '^[A-Za-z0-9_-]+$')) OR p_authentication_epoch<1 OR p_authorization_epoch<1 OR p_policy_epoch<1 THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.auth_sessions s JOIN public.auth_accounts a ON a.id=s.account_id JOIN public.auth_party_links pl ON pl.account_id=a.id AND pl.state='active' WHERE s.id=p_session AND s.account_id=p_account AND s.state='active' AND s.idle_expires_at>p_now AND s.absolute_expires_at>p_now AND a.status='active' AND a.authentication_epoch=p_authentication_epoch AND a.access_epoch=p_authorization_epoch AND a.policy_epoch=p_policy_epoch AND pl.access_version>0) THEN RETURN false; END IF;
  IF p_organization IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.auth_role_assignments ra JOIN public.auth_organizations o ON o.id=ra.organization_id AND o.state='active' WHERE ra.account_id=p_account AND ra.organization_id=p_organization AND ra.state='active' AND ra.access_version>0 AND o.access_version>0 AND EXISTS (SELECT 1 FROM public.auth_role_permissions rp WHERE rp.role_id=ra.role_id AND rp.permission='client.dashboard.view')) THEN RETURN false; END IF;
  INSERT INTO public.auth_dashboard_context_preferences(account_id,organization_id,version,created_at,updated_at) VALUES(p_account,p_organization,1,p_now,p_now) ON CONFLICT(account_id) DO UPDATE SET organization_id=excluded.organization_id,version=auth_dashboard_context_preferences.version+1,updated_at=excluded.updated_at;
  RETURN true;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_select_context(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.integer,pg_catalog.integer,pg_catalog.integer,pg_catalog.timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.atlas_m008_dashboard_select_context(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.integer,pg_catalog.integer,pg_catalog.integer,pg_catalog.timestamptz) TO atlas_auth_gateway;--> statement-breakpoint

CREATE FUNCTION public.atlas_m008_dashboard_admit(p_action pg_catalog.text,p_keys pg_catalog.text[],p_now pg_catalog.timestamptz) RETURNS pg_catalog.boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET row_security=off AS $$
DECLARE v_threshold pg_catalog.integer; v_window_seconds pg_catalog.integer;
BEGIN
  IF p_now IS NULL OR p_action NOT IN ('dashboard_get','dashboard_context','dashboard_analytics','dashboard_ssr') OR pg_catalog.cardinality(p_keys)<>1 OR pg_catalog.array_position(p_keys,NULL) IS NOT NULL OR EXISTS (SELECT 1 FROM pg_catalog.unnest(p_keys) AS supplied(value) WHERE pg_catalog.length(value)<>43 OR value !~ '^[A-Za-z0-9_-]{43}$') THEN RETURN false; END IF;
  SELECT CASE p_action WHEN 'dashboard_get' THEN 60 WHEN 'dashboard_context' THEN 10 WHEN 'dashboard_ssr' THEN 60 ELSE 120 END,60 INTO v_threshold,v_window_seconds;
  RETURN public.atlas_auth_admit_risk_keys(p_action,p_keys,v_threshold,v_window_seconds,p_now);
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION public.atlas_m008_dashboard_admit(pg_catalog.text,pg_catalog.text[],pg_catalog.timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.atlas_m008_dashboard_admit(pg_catalog.text,pg_catalog.text[],pg_catalog.timestamptz) TO atlas_auth_gateway;
