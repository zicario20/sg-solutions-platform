CREATE TABLE "business_funding_agent_configurations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "status" text NOT NULL,
  "provider_calls_enabled" boolean DEFAULT false NOT NULL,
  "application_submission_enabled" boolean DEFAULT false NOT NULL,
  "configuration" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "business_funding_agent_sessions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "public_reference" text NOT NULL UNIQUE,
  "client_reference" text NOT NULL,
  "organization_reference" text NOT NULL,
  "case_reference" text,
  "identity_assurance" text NOT NULL,
  "authorization_status" text NOT NULL,
  "business_authority_authorized" boolean DEFAULT false NOT NULL,
  "purpose_authorized" boolean DEFAULT false NOT NULL,
  "service_entitled" boolean DEFAULT false NOT NULL,
  "personal_guarantor_in_scope" boolean DEFAULT false NOT NULL,
  "personal_guarantor_authorization_status" text NOT NULL,
  "personal_credit_in_scope" boolean DEFAULT false NOT NULL,
  "personal_credit_authorization_status" text NOT NULL,
  "personal_credit_purpose_authorized" boolean DEFAULT false NOT NULL,
  "locale" text NOT NULL,
  "status" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_sessions_client_idx"
  ON "business_funding_agent_sessions" USING btree ("client_reference");
CREATE INDEX "funding_agent_sessions_organization_idx"
  ON "business_funding_agent_sessions" USING btree ("organization_reference");
CREATE INDEX "funding_agent_sessions_case_idx"
  ON "business_funding_agent_sessions" USING btree ("case_reference");

CREATE TABLE "business_funding_agent_source_references" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "source_reference" text NOT NULL,
  "source_kind" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "storage_mode" text DEFAULT 'reference_only' NOT NULL,
  "raw_document_stored" boolean DEFAULT false NOT NULL,
  "normalized_funding_data_stored" boolean DEFAULT false NOT NULL,
  "provider_import_performed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_sources_session_idx"
  ON "business_funding_agent_source_references" USING btree ("session_id");
CREATE INDEX "funding_agent_sources_case_idx"
  ON "business_funding_agent_source_references" USING btree ("case_reference");

CREATE TABLE "business_funding_agent_readiness_candidates" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "source_reference_id" uuid NOT NULL,
  "candidate_type" text NOT NULL,
  "evidence_references" jsonb NOT NULL,
  "provider_requirement_references" jsonb NOT NULL,
  "status" text DEFAULT 'candidate' NOT NULL,
  "eligibility_confirmed" boolean DEFAULT false NOT NULL,
  "underwriting_decision_made" boolean DEFAULT false NOT NULL,
  "prequalification_confirmed" boolean DEFAULT false NOT NULL,
  "application_prepared" boolean DEFAULT false NOT NULL,
  "application_submission_permitted" boolean DEFAULT false NOT NULL,
  "external_dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_candidates_session_idx"
  ON "business_funding_agent_readiness_candidates" USING btree ("session_id");
CREATE INDEX "funding_agent_candidates_case_idx"
  ON "business_funding_agent_readiness_candidates" USING btree ("case_reference");

CREATE TABLE "business_funding_agent_application_readiness_assessments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "candidate_id" uuid NOT NULL,
  "status" text NOT NULL,
  "reason_codes" jsonb NOT NULL,
  "application_submission_permitted" boolean DEFAULT false NOT NULL,
  "external_dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_readiness_candidate_idx"
  ON "business_funding_agent_application_readiness_assessments" USING btree ("candidate_id");

CREATE TABLE "business_funding_agent_handoffs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "route" text NOT NULL,
  "reason" text NOT NULL,
  "dispatch_permitted" boolean DEFAULT false NOT NULL,
  "external_action_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_handoffs_session_idx"
  ON "business_funding_agent_handoffs" USING btree ("session_id");

CREATE TABLE "business_funding_agent_runtime_executions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid,
  "runtime_status" text DEFAULT 'disabled' NOT NULL,
  "capability" text NOT NULL,
  "outcome" text DEFAULT 'disabled' NOT NULL,
  "correlation_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_runtime_correlation_idx"
  ON "business_funding_agent_runtime_executions" USING btree ("correlation_id");

CREATE TABLE "business_funding_agent_audit_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid,
  "event_type" text NOT NULL,
  "actor_reference" text NOT NULL,
  "correlation_id" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "funding_agent_audit_session_idx"
  ON "business_funding_agent_audit_events" USING btree ("session_id");
CREATE INDEX "funding_agent_audit_correlation_idx"
  ON "business_funding_agent_audit_events" USING btree ("correlation_id");
