CREATE TABLE "tax_specialist_agent_configurations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "code" text NOT NULL UNIQUE,
  "status" text NOT NULL,
  "provider_calls_enabled" boolean DEFAULT false NOT NULL,
  "efile_enabled" boolean DEFAULT false NOT NULL,
  "configuration" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tax_specialist_agent_sessions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "public_reference" text NOT NULL UNIQUE,
  "client_reference" text NOT NULL,
  "case_reference" text,
  "identity_assurance" text NOT NULL,
  "authorization_status" text NOT NULL,
  "ownership_authorized" boolean DEFAULT false NOT NULL,
  "purpose_authorized" boolean DEFAULT false NOT NULL,
  "service_entitled" boolean DEFAULT false NOT NULL,
  "tax_year" text NOT NULL,
  "jurisdiction_reference" text NOT NULL,
  "locale" text NOT NULL,
  "status" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_sessions_client_idx"
  ON "tax_specialist_agent_sessions" USING btree ("client_reference");
CREATE INDEX "tax_specialist_sessions_case_idx"
  ON "tax_specialist_agent_sessions" USING btree ("case_reference");

CREATE TABLE "tax_specialist_source_references" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "source_reference" text NOT NULL,
  "source_kind" text NOT NULL,
  "observed_at" timestamp with time zone NOT NULL,
  "storage_mode" text DEFAULT 'reference_only' NOT NULL,
  "raw_document_stored" boolean DEFAULT false NOT NULL,
  "normalized_tax_data_stored" boolean DEFAULT false NOT NULL,
  "provider_import_performed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_sources_session_idx"
  ON "tax_specialist_source_references" USING btree ("session_id");
CREATE INDEX "tax_specialist_sources_case_idx"
  ON "tax_specialist_source_references" USING btree ("case_reference");

CREATE TABLE "tax_specialist_issue_candidates" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "source_reference_id" uuid NOT NULL,
  "issue_type" text NOT NULL,
  "evidence_references" jsonb NOT NULL,
  "rule_source_references" jsonb NOT NULL,
  "status" text DEFAULT 'candidate' NOT NULL,
  "tax_position_confirmed" boolean DEFAULT false NOT NULL,
  "return_line_prepared" boolean DEFAULT false NOT NULL,
  "filing_permitted" boolean DEFAULT false NOT NULL,
  "external_dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_candidates_session_idx"
  ON "tax_specialist_issue_candidates" USING btree ("session_id");
CREATE INDEX "tax_specialist_candidates_case_idx"
  ON "tax_specialist_issue_candidates" USING btree ("case_reference");

CREATE TABLE "tax_specialist_filing_readiness_assessments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "candidate_id" uuid NOT NULL,
  "status" text NOT NULL,
  "reason_codes" jsonb NOT NULL,
  "filing_permitted" boolean DEFAULT false NOT NULL,
  "external_dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_filing_readiness_candidate_idx"
  ON "tax_specialist_filing_readiness_assessments" USING btree ("candidate_id");

CREATE TABLE "tax_specialist_agent_handoffs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL,
  "case_reference" text NOT NULL,
  "route" text NOT NULL,
  "reason" text NOT NULL,
  "dispatch_permitted" boolean DEFAULT false NOT NULL,
  "external_action_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_handoffs_session_idx"
  ON "tax_specialist_agent_handoffs" USING btree ("session_id");

CREATE TABLE "tax_specialist_agent_runtime_executions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid,
  "runtime_status" text DEFAULT 'disabled' NOT NULL,
  "capability" text NOT NULL,
  "outcome" text DEFAULT 'disabled' NOT NULL,
  "correlation_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_runtime_correlation_idx"
  ON "tax_specialist_agent_runtime_executions" USING btree ("correlation_id");

CREATE TABLE "tax_specialist_agent_audit_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid,
  "event_type" text NOT NULL,
  "actor_reference" text NOT NULL,
  "correlation_id" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "tax_specialist_audit_session_idx"
  ON "tax_specialist_agent_audit_events" USING btree ("session_id");
CREATE INDEX "tax_specialist_audit_correlation_idx"
  ON "tax_specialist_agent_audit_events" USING btree ("correlation_id");
