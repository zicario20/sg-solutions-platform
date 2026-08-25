CREATE TABLE public.auth_purpose_delegations (
  id text PRIMARY KEY,
  granted_by_account_id text NOT NULL REFERENCES public.auth_accounts(id) ON DELETE RESTRICT,
  delegate_account_id text NOT NULL REFERENCES public.auth_accounts(id) ON DELETE RESTRICT,
  owner_account_id text NOT NULL REFERENCES public.auth_accounts(id) ON DELETE RESTRICT,
  purpose varchar(64) NOT NULL CHECK (purpose='bookkeeping_period_close_review'),
  resource_type varchar(32) NOT NULL CHECK (resource_type='accounting_entity'),
  resource_reference text NOT NULL,
  owner_context_ref text NOT NULL,
  owner_authorization_epoch integer NOT NULL CHECK (owner_authorization_epoch>0),
  owner_policy_epoch integer NOT NULL CHECK (owner_policy_epoch>0),
  delegate_authorization_epoch integer NOT NULL CHECK (delegate_authorization_epoch>0),
  delegate_policy_epoch integer NOT NULL CHECK (delegate_policy_epoch>0),
  state varchar(16) NOT NULL CHECK (state IN ('active','revoked','expired')),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  CHECK (expires_at>created_at),
  CHECK ((state='revoked')=(revoked_at IS NOT NULL))
);
CREATE INDEX auth_purpose_delegations_delegate_lookup_idx ON public.auth_purpose_delegations(delegate_account_id,purpose,resource_reference,state,expires_at);
ALTER TABLE public.auth_purpose_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_purpose_delegations FORCE ROW LEVEL SECURITY;
CREATE POLICY auth_purpose_delegations_auth_gateway_only ON public.auth_purpose_delegations FOR ALL TO atlas_auth_gateway USING (current_setting('atlas.auth_context_verified',true)='1') WITH CHECK (current_setting('atlas.auth_context_verified',true)='1');
REVOKE ALL ON public.auth_purpose_delegations FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_purpose_delegations TO atlas_auth_gateway;

CREATE OR REPLACE FUNCTION public.atlas_auth_verify_bookkeeping_review_delegation(
  p_delegate_account_id text,
  p_delegate_authorization_epoch integer,
  p_delegate_policy_epoch integer,
  p_owner_account_id text,
  p_owner_context_ref text,
  p_owner_authorization_epoch integer,
  p_owner_policy_epoch integer,
  p_accounting_entity_ref text,
  p_now timestamptz
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  WITH verified_context AS (
    SELECT set_config('atlas.auth_context_verified','1',true)
  )
  SELECT EXISTS (
    SELECT 1 FROM public.auth_purpose_delegations delegation
    JOIN public.auth_accounts delegate_account ON delegate_account.id=delegation.delegate_account_id
    CROSS JOIN verified_context
    WHERE delegation.delegate_account_id=p_delegate_account_id
      AND delegation.purpose='bookkeeping_period_close_review'
      AND delegation.resource_type='accounting_entity'
      AND delegation.resource_reference=p_accounting_entity_ref
      AND delegation.owner_account_id=p_owner_account_id
      AND delegation.owner_context_ref=p_owner_context_ref
      AND delegation.owner_authorization_epoch=p_owner_authorization_epoch
      AND delegation.owner_policy_epoch=p_owner_policy_epoch
      AND delegation.delegate_authorization_epoch=p_delegate_authorization_epoch
      AND delegation.delegate_policy_epoch=p_delegate_policy_epoch
      AND delegate_account.access_epoch=p_delegate_authorization_epoch
      AND delegate_account.policy_epoch=p_delegate_policy_epoch
      AND delegate_account.status='active'
      AND delegation.state='active'
      AND delegation.expires_at>p_now
  );
$$;
REVOKE ALL ON FUNCTION public.atlas_auth_verify_bookkeeping_review_delegation(text,integer,integer,text,text,integer,integer,text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atlas_auth_verify_bookkeeping_review_delegation(text,integer,integer,text,text,integer,integer,text,timestamptz) TO atlas_bookkeeping_gateway;
