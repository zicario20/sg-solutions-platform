CREATE OR REPLACE FUNCTION atlas_auth_initialize_session_context(active_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  active_account_id text;
BEGIN
  SELECT account_id INTO active_account_id
  FROM public.auth_sessions
  WHERE id = active_session_id AND state = 'active'
    AND idle_expires_at > now() AND absolute_expires_at > now();
  IF active_account_id IS NULL THEN
    RAISE EXCEPTION 'auth_session_context_denied';
  END IF;
  PERFORM set_config('atlas.auth_session_id', active_session_id, true);
  PERFORM set_config('atlas.auth_account_id', active_account_id, true);
  PERFORM set_config('atlas.auth_context_verified', '1', true);
END;
$$;--> statement-breakpoint
DROP POLICY IF EXISTS "auth_accounts_auth_gateway_only" ON "auth_accounts";--> statement-breakpoint
CREATE POLICY "auth_accounts_auth_gateway_only" ON "auth_accounts" FOR ALL TO "atlas_auth_gateway" USING (current_setting('atlas.auth_context_verified', true) = '1' AND id = current_setting('atlas.auth_account_id', true)) WITH CHECK (current_setting('atlas.auth_context_verified', true) = '1' AND id = current_setting('atlas.auth_account_id', true));
