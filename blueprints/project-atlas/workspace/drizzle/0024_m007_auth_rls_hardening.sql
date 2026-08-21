ALTER TABLE "auth_accounts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_external_identities" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_sessions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_provider_vault" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_transactions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_proofs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_invitations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_party_links" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_organizations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_roles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_role_permissions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_role_assignments" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_mfa_factors" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_service_accounts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_rate_buckets" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_security_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_outbox" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "auth_accounts", "auth_external_identities", "auth_sessions", "auth_provider_vault", "auth_transactions", "auth_proofs", "auth_invitations", "auth_party_links", "auth_organizations", "auth_roles", "auth_role_permissions", "auth_role_assignments", "auth_mfa_factors", "auth_service_accounts", "auth_rate_buckets", "auth_security_events", "auth_outbox" FROM PUBLIC;--> statement-breakpoint
DO $$
DECLARE
  auth_table text;
  browser_role text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      FOREACH auth_table IN ARRAY ARRAY['auth_accounts', 'auth_external_identities', 'auth_sessions', 'auth_provider_vault', 'auth_transactions', 'auth_proofs', 'auth_invitations', 'auth_party_links', 'auth_organizations', 'auth_roles', 'auth_role_permissions', 'auth_role_assignments', 'auth_mfa_factors', 'auth_service_accounts', 'auth_rate_buckets', 'auth_security_events', 'auth_outbox'] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', auth_table, browser_role);
      END LOOP;
    END IF;
  END LOOP;
END
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION atlas_auth_initialize_session_context(active_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF active_session_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.auth_sessions
    WHERE id = active_session_id AND state = 'active'
      AND idle_expires_at > now() AND absolute_expires_at > now()
  ) THEN
    RAISE EXCEPTION 'auth_session_context_denied';
  END IF;
  PERFORM set_config('atlas.auth_session_id', active_session_id, true);
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION atlas_auth_initialize_session_context(text) FROM PUBLIC;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_auth_gateway') THEN
    GRANT EXECUTE ON FUNCTION atlas_auth_initialize_session_context(text) TO atlas_auth_gateway;
  END IF;
END
$$;
