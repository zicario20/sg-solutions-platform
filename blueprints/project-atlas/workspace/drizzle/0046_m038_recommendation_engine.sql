-- M038 Recommendation Engine. Authored migration only; it has not been executed.
-- This engine orders source-filtered candidates and never determines eligibility or provider outcomes.

CREATE ROLE atlas_recommendation_gateway NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
ALTER ROLE atlas_recommendation_gateway NOBYPASSRLS;
CREATE TABLE public.recommendation_context_snapshots (
  id text PRIMARY KEY, domain varchar(48) NOT NULL, purpose varchar(32) NOT NULL, fact_snapshot jsonb NOT NULL,
  source_snapshot jsonb NOT NULL, consent_id text, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_candidate_sets (
  id text PRIMARY KEY, domain varchar(48) NOT NULL, version integer NOT NULL CHECK (version > 0),
  candidate_snapshot jsonb NOT NULL, source_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_policy_versions (
  id text PRIMARY KEY, policy_id text NOT NULL, domain varchar(48) NOT NULL, version integer NOT NULL CHECK (version > 0),
  feature_weights jsonb NOT NULL, allowed_feature_codes jsonb NOT NULL, tie_break_order jsonb NOT NULL,
  status varchar(24) NOT NULL CHECK (status IN ('draft','published','paused','retired')), source_snapshot jsonb NOT NULL,
  approved_by text, approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  UNIQUE(policy_id, version)
);
CREATE TABLE public.recommendation_constraint_sets (
  id text PRIMARY KEY, domain varchar(48) NOT NULL, version integer NOT NULL CHECK (version > 0),
  constraints jsonb NOT NULL, status varchar(24) NOT NULL CHECK (status IN ('draft','published','retired')),
  source_snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_requests (
  id text PRIMARY KEY, client_id text, domain varchar(48) NOT NULL, goal_code varchar(96) NOT NULL,
  status varchar(24) NOT NULL, context_snapshot_id text NOT NULL, candidate_set_id text NOT NULL, constraint_set_id text NOT NULL,
  policy_version_id text NOT NULL, personalization_consent_id text, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_runs (
  id text PRIMARY KEY, request_id text NOT NULL REFERENCES public.recommendation_requests(id) ON DELETE RESTRICT,
  domain varchar(48) NOT NULL, policy_version_id text NOT NULL REFERENCES public.recommendation_policy_versions(id) ON DELETE RESTRICT,
  candidate_set_snapshot jsonb NOT NULL, context_snapshot jsonb NOT NULL, constraint_set_snapshot jsonb NOT NULL,
  status varchar(24) NOT NULL CHECK (status IN ('draft','completed','blocked','failed','invalidated')),
  completed_at timestamptz, invalidated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_outputs (
  id text PRIMARY KEY, run_id text NOT NULL REFERENCES public.recommendation_runs(id) ON DELETE RESTRICT,
  status varchar(40) NOT NULL, ranked_candidates jsonb NOT NULL, primary_candidate_id text, warnings jsonb NOT NULL,
  expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_preference_profiles (
  id text PRIMARY KEY, client_id text NOT NULL, consent_id text NOT NULL,
  status varchar(24) NOT NULL CHECK (status IN ('active','withdrawn','expired')),
  explicit_preferences jsonb NOT NULL, derived_preferences jsonb NOT NULL, expires_at timestamptz, withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_feedback (
  id text PRIMARY KEY, output_id text NOT NULL REFERENCES public.recommendation_outputs(id) ON DELETE RESTRICT,
  client_id text, feedback_type varchar(24) NOT NULL, detail text,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_fairness_reviews (
  id text PRIMARY KEY, run_id text REFERENCES public.recommendation_runs(id) ON DELETE RESTRICT,
  policy_version_id text NOT NULL REFERENCES public.recommendation_policy_versions(id) ON DELETE RESTRICT,
  status varchar(32) NOT NULL, detected_features jsonb NOT NULL, reviewer_id text, reviewed_at timestamptz, notes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_human_reviews (
  id text PRIMARY KEY, output_id text NOT NULL REFERENCES public.recommendation_outputs(id) ON DELETE RESTRICT,
  reviewer_id text NOT NULL, decision varchar(40) NOT NULL, candidate_order jsonb NOT NULL, reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_ai_explanations (
  id text PRIMARY KEY, output_id text NOT NULL REFERENCES public.recommendation_outputs(id) ON DELETE RESTRICT,
  source_ids jsonb NOT NULL, claims jsonb NOT NULL, content text NOT NULL, status varchar(24) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE public.recommendation_experiment_exposures (
  id text PRIMARY KEY, experiment_id text NOT NULL, request_id text NOT NULL REFERENCES public.recommendation_requests(id) ON DELETE RESTRICT,
  variant varchar(64) NOT NULL, stopped_by_guardrail boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT transaction_timestamp(), updated_at timestamptz NOT NULL DEFAULT transaction_timestamp(),
  UNIQUE(experiment_id, request_id)
);
CREATE INDEX recommendation_requests_domain_status_idx ON public.recommendation_requests(domain, status);
CREATE INDEX recommendation_runs_request_status_idx ON public.recommendation_runs(request_id, status);
CREATE INDEX recommendation_outputs_run_status_idx ON public.recommendation_outputs(run_id, status);
CREATE INDEX recommendation_preferences_client_status_idx ON public.recommendation_preference_profiles(client_id, status);
CREATE INDEX recommendation_fairness_policy_status_idx ON public.recommendation_fairness_reviews(policy_version_id, status);
ALTER TABLE public.recommendation_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_candidate_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_constraint_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_preference_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_fairness_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_human_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_experiment_exposures ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_gateway_deny_direct_requests ON public.recommendation_requests AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY recommendation_gateway_deny_direct_runs ON public.recommendation_runs AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY recommendation_gateway_deny_direct_outputs ON public.recommendation_outputs AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY recommendation_gateway_deny_direct_preferences ON public.recommendation_preference_profiles AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
CREATE POLICY recommendation_gateway_deny_direct_reviews ON public.recommendation_human_reviews AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false);
