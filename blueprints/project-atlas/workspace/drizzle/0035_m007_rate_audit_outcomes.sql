-- M007 final rate/audit gap: internal outcomes are finite and contain no provider payloads.
CREATE OR REPLACE FUNCTION atlas_auth_append_audit(p_event text,p_name text,p_outcome text,p_correlation text,p_account text,p_metadata jsonb,p_now timestamptz) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE v_id text;
BEGIN
  IF length(p_event)<16 OR p_name !~ '^[a-z_]{3,80}$' OR p_outcome NOT IN ('accepted','succeeded','authenticated','denied','manual_review','unavailable','rate_limited','revoked','rotated','redirected','provider_denied','provider_unavailable','provider_error','provider_exception','sent','failed','unknown') OR length(p_correlation)<8 OR jsonb_typeof(p_metadata)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_metadata) key WHERE key NOT IN ('outcome','riskClass','provider','channel','reasonCode','policyVersion')) THEN RAISE EXCEPTION 'auth_audit_input_denied'; END IF;
  INSERT INTO public.auth_security_events(id,event_key,account_id,event_name,outcome,correlation_id,policy_version,metadata,occurred_at) VALUES(p_event,p_event,p_account,p_name,p_outcome,p_correlation,1,p_metadata,p_now) ON CONFLICT(event_key) DO NOTHING RETURNING id INTO v_id;
  RETURN v_id IS NOT NULL;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION atlas_auth_append_audit(text,text,text,text,text,jsonb,timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_auth_append_audit(text,text,text,text,text,jsonb,timestamptz) TO atlas_auth_preauth,atlas_auth_gateway;
