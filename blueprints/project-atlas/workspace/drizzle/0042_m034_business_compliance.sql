CREATE ROLE atlas_compliance_gateway NOLOGIN NOBYPASSRLS;

CREATE TABLE compliance_profiles (id text PRIMARY KEY, organization_ref text NOT NULL, entity_type text NOT NULL, formation_jurisdiction text NOT NULL, formation_date timestamptz NOT NULL, profile_hash text NOT NULL, verification_status text NOT NULL, version integer NOT NULL, source_references jsonb NOT NULL, captured_at timestamptz NOT NULL, created_at timestamptz NOT NULL, UNIQUE (organization_ref, version));
CREATE TABLE compliance_requirements (id text PRIMARY KEY, requirement_code text NOT NULL, requirement_type text NOT NULL, jurisdiction_code text NOT NULL, status text NOT NULL, freshness text NOT NULL, version integer NOT NULL, effective_from timestamptz NOT NULL, effective_to timestamptz, source_reference text NOT NULL, configuration jsonb NOT NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, UNIQUE (requirement_code, version));
CREATE TABLE compliance_obligations (id text PRIMARY KEY, organization_ref text NOT NULL, requirement_ref text NOT NULL, requirement_code text NOT NULL, jurisdiction_code text NOT NULL, period_start timestamptz NOT NULL, period_end timestamptz NOT NULL, due_date timestamptz NOT NULL, due_date_confidence text NOT NULL, status text NOT NULL, responsibility text NOT NULL, service_scope text NOT NULL, source_reference text NOT NULL, uniqueness_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL, completed_at timestamptz);
CREATE TABLE compliance_deadline_calculations (id text PRIMARY KEY, obligation_ref text NOT NULL REFERENCES compliance_obligations(id), rule_version text NOT NULL, input_dates jsonb NOT NULL, due_date timestamptz NOT NULL, timezone text NOT NULL, trace text NOT NULL, confidence text NOT NULL, calculated_at timestamptz NOT NULL);
CREATE TABLE compliance_reminders (id text PRIMARY KEY, obligation_ref text NOT NULL REFERENCES compliance_obligations(id), policy_code text NOT NULL, channel text NOT NULL, recipient_ref text NOT NULL, scheduled_at timestamptz NOT NULL, idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL);
CREATE TABLE compliance_filing_packages (id text PRIMARY KEY, obligation_ref text NOT NULL REFERENCES compliance_obligations(id), requirement_ref text NOT NULL, report_hash text NOT NULL, authorization_ref text NOT NULL, package_hash text NOT NULL UNIQUE, state text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE compliance_completions (id text PRIMARY KEY, obligation_ref text NOT NULL REFERENCES compliance_obligations(id), completion_type text NOT NULL, evidence_document_refs jsonb NOT NULL, external_reference text, verified_by text NOT NULL, verification_status text NOT NULL, completed_at timestamptz NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE compliance_notices (id text PRIMARY KEY, organization_ref text NOT NULL, source_document_ref text NOT NULL, source_reference text NOT NULL, status text NOT NULL, severity text NOT NULL, due_date timestamptz, due_date_confidence text NOT NULL, received_at timestamptz NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE compliance_handoffs (id text PRIMARY KEY, source_obligation_ref text NOT NULL REFERENCES compliance_obligations(id), organization_ref text NOT NULL, destination text NOT NULL, payload_version text NOT NULL, payload_hash text NOT NULL, idempotency_key text NOT NULL UNIQUE, status text NOT NULL, created_at timestamptz NOT NULL);
CREATE TABLE compliance_audit_events (id text PRIMARY KEY, event_type text NOT NULL, actor_ref text NOT NULL, resource_ref text NOT NULL, purpose text NOT NULL, correlation_id text NOT NULL, metadata jsonb NOT NULL, created_at timestamptz NOT NULL);

ALTER TABLE compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_deadline_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_filing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE compliance_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_deadline_calculations FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_reminders FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_filing_packages FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_completions FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_notices FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_handoffs FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY compliance_profiles_gateway ON compliance_profiles TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_requirements_gateway ON compliance_requirements TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_obligations_gateway ON compliance_obligations TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_deadlines_gateway ON compliance_deadline_calculations TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_reminders_gateway ON compliance_reminders TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_filing_packages_gateway ON compliance_filing_packages TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_completions_gateway ON compliance_completions TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_notices_gateway ON compliance_notices TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_handoffs_gateway ON compliance_handoffs TO atlas_compliance_gateway USING (true) WITH CHECK (true);
CREATE POLICY compliance_audit_events_gateway ON compliance_audit_events TO atlas_compliance_gateway USING (true) WITH CHECK (true);
