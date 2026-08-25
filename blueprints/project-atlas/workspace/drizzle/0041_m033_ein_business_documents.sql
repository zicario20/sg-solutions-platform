CREATE ROLE atlas_ein_gateway NOLOGIN NOBYPASSRLS;

CREATE TABLE ein_cases (
  id text PRIMARY KEY,
  case_number text NOT NULL UNIQUE,
  client_ref text NOT NULL,
  organization_ref text NOT NULL,
  service_order_ref text NOT NULL,
  formation_case_ref text,
  delivery_model text NOT NULL,
  status text NOT NULL,
  version integer NOT NULL,
  external_submission_allowed boolean NOT NULL DEFAULT false CHECK (external_submission_allowed = false),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE ein_application_drafts (
  id text PRIMARY KEY,
  ein_case_ref text NOT NULL REFERENCES ein_cases(id),
  form_version text NOT NULL,
  organization_snapshot_hash text NOT NULL,
  requirement_snapshot_hash text NOT NULL,
  responsible_party_ref text NOT NULL,
  application_hash text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (ein_case_ref, application_hash)
);

CREATE TABLE ein_authorizations (
  id text PRIMARY KEY,
  ein_case_ref text NOT NULL REFERENCES ein_cases(id),
  application_hash text NOT NULL,
  signer_ref text NOT NULL,
  status text NOT NULL,
  accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE ein_submission_attempts (
  id text PRIMARY KEY,
  ein_case_ref text NOT NULL REFERENCES ein_cases(id),
  application_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  provider_code text NOT NULL,
  status text NOT NULL,
  external_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE ein_issuance_records (
  id text PRIMARY KEY,
  ein_case_ref text NOT NULL UNIQUE REFERENCES ein_cases(id),
  evidence_document_ref text NOT NULL,
  full_ein_secure_ref text NOT NULL,
  verification_status text NOT NULL,
  issued_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE ein_document_index (
  id text PRIMARY KEY,
  ein_case_ref text NOT NULL REFERENCES ein_cases(id),
  document_ref text NOT NULL UNIQUE,
  document_type text NOT NULL,
  sensitivity text NOT NULL,
  content_hash text NOT NULL,
  verification_status text NOT NULL,
  immutable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

CREATE TABLE ein_handoffs (
  id text PRIMARY KEY,
  source_case_ref text NOT NULL REFERENCES ein_cases(id),
  destination text NOT NULL,
  organization_ref text NOT NULL,
  issuance_ref text NOT NULL REFERENCES ein_issuance_records(id),
  payload_version text NOT NULL,
  payload_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE ein_audit_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  actor_ref text NOT NULL,
  resource_ref text NOT NULL,
  purpose text NOT NULL,
  correlation_id text NOT NULL,
  metadata jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

ALTER TABLE ein_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_application_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_submission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_issuance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_document_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ein_audit_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE ein_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_application_drafts FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_authorizations FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_submission_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_issuance_records FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_document_index FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_handoffs FORCE ROW LEVEL SECURITY;
ALTER TABLE ein_audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY ein_cases_gateway ON ein_cases TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_application_drafts_gateway ON ein_application_drafts TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_authorizations_gateway ON ein_authorizations TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_submission_attempts_gateway ON ein_submission_attempts TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_issuance_records_gateway ON ein_issuance_records TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_document_index_gateway ON ein_document_index TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_handoffs_gateway ON ein_handoffs TO atlas_ein_gateway USING (true) WITH CHECK (true);
CREATE POLICY ein_audit_events_gateway ON ein_audit_events TO atlas_ein_gateway USING (true) WITH CHECK (true);
