-- M007 Cyber Neo remediation: account-state gates, action-bound rates, rotation invariants, and CRM collision denial.
CREATE OR REPLACE FUNCTION atlas_auth_admit_risk_keys(p_action text, p_keys text[], p_threshold integer, p_window_seconds integer, p_now timestamptz) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE risk_key text; bucket_count integer; distinct_count integer; allowed boolean := true;
BEGIN
  IF p_action !~ '^[a-z_]{3,64}$' OR cardinality(p_keys)<1 OR cardinality(p_keys)>5 OR p_threshold<1 OR p_window_seconds<1 THEN RAISE EXCEPTION 'auth_rate_input_denied'; END IF;
  SELECT count(DISTINCT value) INTO distinct_count FROM unnest(p_keys) AS supplied(value);
  IF distinct_count<>cardinality(p_keys) THEN RAISE EXCEPTION 'auth_rate_key_denied'; END IF;
  FOREACH risk_key IN ARRAY p_keys LOOP
    IF risk_key IS NULL OR length(risk_key)<16 THEN RAISE EXCEPTION 'auth_rate_key_denied'; END IF;
    bucket_count := NULL;
    INSERT INTO public.auth_rate_buckets(bucket_digest,purpose,count,window_started_at,expires_at,updated_at)
    VALUES(risk_key,p_action,1,p_now,p_now+make_interval(secs=>p_window_seconds),p_now)
    ON CONFLICT(bucket_digest) DO UPDATE SET
      count=CASE WHEN auth_rate_buckets.expires_at<=excluded.window_started_at THEN 1 ELSE auth_rate_buckets.count+1 END,
      window_started_at=CASE WHEN auth_rate_buckets.expires_at<=excluded.window_started_at THEN excluded.window_started_at ELSE auth_rate_buckets.window_started_at END,
      expires_at=CASE WHEN auth_rate_buckets.expires_at<=excluded.window_started_at THEN excluded.expires_at ELSE auth_rate_buckets.expires_at END,
      updated_at=excluded.updated_at
    WHERE auth_rate_buckets.purpose=excluded.purpose
    RETURNING count INTO bucket_count;
    IF bucket_count IS NULL THEN RAISE EXCEPTION 'auth_rate_key_action_mismatch'; END IF;
    IF bucket_count>p_threshold THEN allowed := false; END IF;
  END LOOP;
  RETURN allowed;
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION atlas_auth_admit_risk_keys(text,text[],integer,integer,timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_auth_admit_risk_keys(text,text[],integer,integer,timestamptz) TO atlas_auth_preauth,atlas_auth_gateway;--> statement-breakpoint

ALTER TABLE auth_sessions DROP CONSTRAINT auth_sessions_state_valid;--> statement-breakpoint
ALTER TABLE auth_sessions ADD CONSTRAINT auth_sessions_state_valid CHECK (state IN ('active','rotating','rotated','revoked','expired','risk_blocked'));--> statement-breakpoint

CREATE OR REPLACE FUNCTION atlas_auth_create_session(p_id text,p_account text,p_handle text,p_family text,p_assurance text,p_idle timestamptz,p_absolute timestamptz,p_now timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.auth_accounts WHERE id=p_account FOR UPDATE;
  IF length(p_handle)<32 OR p_assurance NOT IN ('aal1','aal2') OR p_idle<=p_now OR p_absolute<=p_idle OR v_status IS NULL OR v_status NOT IN ('active','pending_verification') THEN
    IF v_status IS NOT NULL AND v_status NOT IN ('active','pending_verification') THEN
      UPDATE public.auth_accounts SET authentication_epoch=authentication_epoch+1,version=version+1,updated_at=p_now WHERE id=p_account;
      UPDATE public.auth_sessions SET state='revoked',revoked_at=p_now,version=version+1,updated_at=p_now WHERE account_id=p_account AND state IN ('active','rotating');
    END IF;
    RAISE EXCEPTION 'auth_session_input_denied';
  END IF;
  INSERT INTO public.auth_sessions(id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) VALUES(p_id,p_account,p_handle,p_family,1,p_assurance,'active',p_idle,p_absolute,1,p_now,p_now);
END $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION atlas_auth_authenticate_identity(p_evidence text,p_crm text,p_issuer text,p_audience text,p_new_account text,p_external text,p_party_link text,p_conflict text,p_session text,p_handle text,p_family text,p_assurance text,p_idle timestamptz,p_absolute timestamptz,p_now timestamptz) RETURNS TABLE(kind text,account_id text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE v_subject text; v_resolution text; v_receipt text; v_account text; v_account_status text; v_external text; v_external_account text; v_party_account text; v_party_state text;
BEGIN
  IF length(p_handle)<32 OR p_assurance<>'aal1' OR p_idle<=p_now OR p_absolute<=p_idle THEN RAISE EXCEPTION 'auth_session_input_denied'; END IF;
  SELECT provider_subject INTO v_subject FROM public.auth_supabase_identity_evidence WHERE id=p_evidence AND provider='google' AND issuer=p_issuer AND audience=p_audience AND email_verified=true AND verified_at<=p_now AND expires_at>p_now;
  IF v_subject IS NULL THEN RETURN QUERY SELECT 'denied'::text,NULL::text; RETURN; END IF;
  SELECT resolution,relationship_receipt INTO v_resolution,v_receipt FROM public.auth_crm_party_evidence WHERE id=p_crm AND supabase_evidence_id=p_evidence AND verified_at<=p_now AND expires_at>p_now;
  IF v_resolution IS NULL THEN RETURN QUERY SELECT 'denied'::text,NULL::text; RETURN; END IF;
  SELECT id,status INTO v_account,v_account_status FROM public.auth_accounts WHERE supabase_subject=v_subject FOR UPDATE;
  IF v_account IS NOT NULL AND v_account_status NOT IN ('active','pending_verification') THEN
    UPDATE public.auth_accounts SET authentication_epoch=authentication_epoch+1,version=version+1,updated_at=p_now WHERE id=v_account;
    UPDATE public.auth_sessions SET state='revoked',revoked_at=p_now,version=version+1,updated_at=p_now WHERE account_id=v_account AND state IN ('active','rotating');
    RETURN QUERY SELECT 'denied'::text,v_account; RETURN;
  END IF;
  IF v_account IS NULL THEN
    INSERT INTO public.auth_accounts(id,supabase_subject,status,authentication_epoch,access_epoch,policy_epoch,version,created_at,updated_at) VALUES(p_new_account,v_subject,CASE WHEN v_resolution='linked' THEN 'active' ELSE 'pending_verification' END,1,1,1,1,p_now,p_now) RETURNING id,status INTO v_account,v_account_status;
  END IF;
  INSERT INTO public.auth_external_identities(id,account_id,provider,provider_subject,state,linked_at,version,created_at,updated_at) VALUES(p_external,v_account,'google',v_subject,'active',p_now,1,p_now,p_now) ON CONFLICT(provider,provider_subject) DO UPDATE SET updated_at=excluded.updated_at RETURNING id,auth_external_identities.account_id INTO v_external,v_external_account;
  IF v_resolution<>'linked' OR v_receipt IS NULL OR v_external_account<>v_account THEN
    INSERT INTO public.auth_identity_conflicts(id,account_id,external_identity_id,supabase_evidence_id,crm_evidence_id,reason,state,created_at,updated_at) VALUES(p_conflict,v_account,v_external,p_evidence,p_crm,coalesce(v_resolution,'external_identity_conflict'),'manual_review',p_now,p_now) ON CONFLICT(id) DO NOTHING;
    RETURN QUERY SELECT 'manual_review'::text,v_account; RETURN;
  END IF;
  INSERT INTO public.auth_party_links(id,account_id,relationship_receipt,state,access_version,created_at,updated_at) VALUES(p_party_link,v_account,v_receipt,'active',1,p_now,p_now) ON CONFLICT(relationship_receipt) DO NOTHING;
  SELECT account_id,state INTO v_party_account,v_party_state FROM public.auth_party_links WHERE relationship_receipt=v_receipt FOR UPDATE;
  IF v_party_account IS NULL OR v_party_account<>v_account OR v_party_state<>'active' THEN
    INSERT INTO public.auth_identity_conflicts(id,account_id,external_identity_id,supabase_evidence_id,crm_evidence_id,reason,state,created_at,updated_at) VALUES(p_conflict,v_account,v_external,p_evidence,p_crm,'relationship_receipt_conflict','manual_review',p_now,p_now) ON CONFLICT(id) DO NOTHING;
    RETURN QUERY SELECT 'manual_review'::text,v_account; RETURN;
  END IF;
  INSERT INTO public.auth_sessions(id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) VALUES(p_session,v_account,p_handle,p_family,1,p_assurance,'active',p_idle,p_absolute,1,p_now,p_now);
  RETURN QUERY SELECT 'authenticated'::text,v_account;
END $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION atlas_auth_establish_email_session(p_account text,p_external text,p_session text,p_family text,p_subject text,p_handle text,p_token_ciphertext text,p_idle timestamptz,p_absolute timestamptz,p_now timestamptz) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE account_id text; account_status text; external_account text;
BEGIN
  IF length(p_subject)<1 OR length(p_handle)<32 OR length(p_token_ciphertext)<32 OR p_idle<=p_now OR p_absolute<=p_idle THEN RAISE EXCEPTION 'auth_email_session_denied'; END IF;
  SELECT id,status INTO account_id,account_status FROM public.auth_accounts WHERE supabase_subject=p_subject FOR UPDATE;
  IF account_id IS NOT NULL AND account_status NOT IN ('active','pending_verification') THEN
    UPDATE public.auth_accounts SET authentication_epoch=authentication_epoch+1,version=version+1,updated_at=p_now WHERE id=account_id;
    UPDATE public.auth_sessions SET state='revoked',revoked_at=p_now,version=version+1,updated_at=p_now WHERE account_id=account_id AND state IN ('active','rotating');
    RETURN NULL;
  END IF;
  IF account_id IS NULL THEN
    INSERT INTO public.auth_accounts(id,supabase_subject,status,authentication_epoch,access_epoch,policy_epoch,version,created_at,updated_at) VALUES(p_account,p_subject,'active',1,1,1,1,p_now,p_now) RETURNING id,status INTO account_id,account_status;
  END IF;
  INSERT INTO public.auth_external_identities(id,account_id,provider,provider_subject,state,linked_at,version,created_at,updated_at) VALUES(p_external,account_id,'email_password',p_subject,'active',p_now,1,p_now,p_now) ON CONFLICT(provider,provider_subject) DO UPDATE SET updated_at=excluded.updated_at RETURNING auth_external_identities.account_id INTO external_account;
  IF external_account<>account_id THEN RETURN NULL; END IF;
  INSERT INTO public.auth_sessions(id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) VALUES(p_session,account_id,p_handle,p_family,1,'aal1','active',p_idle,p_absolute,1,p_now,p_now);
  INSERT INTO public.auth_provider_vault(id,session_id,ciphertext,key_reference,purpose,version,created_at,updated_at) VALUES(p_session,p_session,p_token_ciphertext,'AUTH_PROVIDER_TOKEN_KEY','email_provider_session',1,p_now,p_now);
  RETURN account_id;
END $$;--> statement-breakpoint

REVOKE ALL ON FUNCTION atlas_auth_rotate_session(text,text,text,timestamptz,timestamptz,timestamptz) FROM atlas_auth_gateway,PUBLIC;--> statement-breakpoint
DROP FUNCTION atlas_auth_rotate_session(text,text,text,timestamptz,timestamptz,timestamptz);--> statement-breakpoint
CREATE FUNCTION atlas_auth_rotate_session(p_handle text,p_next_id text,p_next_handle text,p_idle timestamptz,p_now timestamptz) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE current_row public.auth_sessions%ROWTYPE; v_account_status text; v_idle timestamptz;
BEGIN
  IF length(p_handle)<32 OR length(p_next_id)<16 OR length(p_next_handle)<32 OR p_idle<=p_now THEN RAISE EXCEPTION 'auth_session_input_denied'; END IF;
  SELECT * INTO current_row FROM public.auth_sessions WHERE handle_digest=p_handle FOR UPDATE;
  IF current_row.id IS NOT NULL THEN SELECT status INTO v_account_status FROM public.auth_accounts WHERE id=current_row.account_id FOR UPDATE; END IF;
  IF current_row.id IS NULL OR current_row.state<>'active' OR current_row.idle_expires_at<=p_now OR current_row.absolute_expires_at<=p_now OR v_account_status NOT IN ('active','pending_verification') THEN
    IF current_row.id IS NOT NULL THEN UPDATE public.auth_sessions SET state='revoked',revoked_at=p_now,updated_at=p_now,version=version+1 WHERE family_id=current_row.family_id AND state IN ('active','rotating'); END IF;
    RETURN 'family_revoked';
  END IF;
  v_idle := LEAST(p_idle,current_row.absolute_expires_at-interval '1 millisecond');
  IF v_idle<=p_now THEN UPDATE public.auth_sessions SET state='revoked',revoked_at=p_now,updated_at=p_now,version=version+1 WHERE family_id=current_row.family_id AND state IN ('active','rotating'); RETURN 'family_revoked'; END IF;
  UPDATE public.auth_sessions SET state='rotated',revoked_at=p_now,updated_at=p_now,version=version+1 WHERE id=current_row.id AND state='active';
  INSERT INTO public.auth_sessions(id,account_id,handle_digest,family_id,generation,assurance,state,idle_expires_at,absolute_expires_at,version,created_at,updated_at) VALUES(p_next_id,current_row.account_id,p_next_handle,current_row.family_id,current_row.generation+1,current_row.assurance,'active',v_idle,current_row.absolute_expires_at,1,p_now,p_now);
  RETURN 'rotated';
END $$;--> statement-breakpoint
REVOKE ALL ON FUNCTION atlas_auth_rotate_session(text,text,text,timestamptz,timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_auth_rotate_session(text,text,text,timestamptz,timestamptz) TO atlas_auth_gateway;--> statement-breakpoint

REVOKE ALL ON FUNCTION atlas_auth_create_session(text,text,text,text,text,timestamptz,timestamptz,timestamptz),atlas_auth_authenticate_identity(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz),atlas_auth_establish_email_session(text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_auth_create_session(text,text,text,text,text,timestamptz,timestamptz,timestamptz) TO atlas_auth_gateway;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_auth_authenticate_identity(text,text,text,text,text,text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz),atlas_auth_establish_email_session(text,text,text,text,text,text,text,timestamptz,timestamptz,timestamptz) TO atlas_auth_preauth,atlas_auth_gateway;
