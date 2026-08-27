CREATE TABLE IF NOT EXISTS "intake_agent_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_definition_reference" text NOT NULL,
  "agent_version_reference" text NOT NULL,
  "intake_registry_version" text NOT NULL,
  "policy_references" jsonb NOT NULL,
  "status" text DEFAULT 'disabled' NOT NULL,
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "intake_agent_configurations_agent_version_uq" ON "intake_agent_configurations" USING btree ("agent_version_reference");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_definitions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_code" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "owner_domain" text NOT NULL,
  "intake_type" text NOT NULL,
  "primary_subject_type" text NOT NULL,
  "current_version_reference" text,
  "lifecycle_status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "intake_definitions_intake_code_uq" ON "intake_definitions" USING btree ("intake_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_definition_id" uuid NOT NULL REFERENCES "intake_definitions"("id"),
  "version" text NOT NULL,
  "purpose_statement" text NOT NULL,
  "configuration_snapshot" jsonb NOT NULL,
  "validation_rule_set_reference" text NOT NULL,
  "completion_policy_reference" text NOT NULL,
  "publication_status" text DEFAULT 'not_published' NOT NULL,
  "immutable" boolean DEFAULT false NOT NULL,
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "intake_versions_definition_version_uq" ON "intake_versions" USING btree ("intake_definition_id","version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_versions_publication_status_idx" ON "intake_versions" USING btree ("publication_status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_definition_id" uuid NOT NULL REFERENCES "intake_definitions"("id"),
  "intake_version_reference" text NOT NULL,
  "service_definition_reference" text,
  "service_version_reference" text,
  "service_order_reference" text,
  "case_file_reference" text,
  "lead_reference" text,
  "client_reference" text,
  "organization_reference" text,
  "source_handoff_reference" text,
  "surface" text NOT NULL,
  "mode" text NOT NULL,
  "locale" text NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "session_version" integer DEFAULT 1 NOT NULL,
  "expires_at" timestamp with time zone,
  "last_activity_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_sessions_client_status_idx" ON "intake_sessions" USING btree ("client_reference","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_sessions_source_handoff_idx" ON "intake_sessions" USING btree ("source_handoff_reference");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "role" text NOT NULL,
  "subject_reference" text NOT NULL,
  "relationship_to_primary_subject" text NOT NULL,
  "identity_assurance" text DEFAULT 'unknown' NOT NULL,
  "authorization_reference" text,
  "required" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'invited' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "intake_participants_session_subject_role_uq" ON "intake_participants" USING btree ("intake_session_id","subject_reference","role");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_answer_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "participant_id" uuid NOT NULL REFERENCES "intake_participants"("id"),
  "field_code" text NOT NULL,
  "field_version" text NOT NULL,
  "answer_value_reference" text NOT NULL,
  "answer_status" text NOT NULL,
  "verification_status" text NOT NULL,
  "source_type" text NOT NULL,
  "source_reference" text,
  "entered_by_type" text NOT NULL,
  "entered_by_reference" text,
  "data_classification" text NOT NULL,
  "supersedes_answer_reference" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_answers_session_participant_idx" ON "intake_answer_records" USING btree ("intake_session_id","participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_answers_field_code_idx" ON "intake_answer_records" USING btree ("field_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_rule_evaluation_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "rule_set_version" text NOT NULL,
  "trigger_answer_references" jsonb NOT NULL,
  "rules_evaluated" jsonb NOT NULL,
  "rules_matched" jsonb NOT NULL,
  "changes" jsonb NOT NULL,
  "warnings" jsonb NOT NULL,
  "evaluated_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_rule_evaluations_session_idx" ON "intake_rule_evaluation_records" USING btree ("intake_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_draft_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "session_version" integer NOT NULL,
  "answer_version_vector" jsonb NOT NULL,
  "current_step_code" text NOT NULL,
  "visible_step_codes" jsonb NOT NULL,
  "pending_references" jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "intake_draft_snapshots_session_version_uq" ON "intake_draft_snapshots" USING btree ("intake_session_id","session_version");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_completion_assessments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "intake_version_reference" text NOT NULL,
  "completion_policy_reference" text NOT NULL,
  "dimension_results" jsonb NOT NULL,
  "missing_item_references" jsonb NOT NULL,
  "blocking_item_references" jsonb NOT NULL,
  "warning_item_references" jsonb NOT NULL,
  "completion_status" text NOT NULL,
  "content_hash" text NOT NULL,
  "assessed_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_completion_assessments_session_idx" ON "intake_completion_assessments" USING btree ("intake_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_readiness_assessments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "readiness_profile_reference" text NOT NULL,
  "destination_type" text NOT NULL,
  "completion_assessment_reference" text NOT NULL,
  "check_results" jsonb NOT NULL,
  "readiness_status" text NOT NULL,
  "content_hash" text NOT NULL,
  "assessed_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_readiness_assessments_session_destination_idx" ON "intake_readiness_assessments" USING btree ("intake_session_id","destination_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_specialist_handoffs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid NOT NULL REFERENCES "intake_sessions"("id"),
  "target_reference" text NOT NULL,
  "scoped_references" jsonb NOT NULL,
  "readiness_snapshot_reference" text NOT NULL,
  "status" text DEFAULT 'prepared' NOT NULL,
  "dispatch_permitted" boolean DEFAULT false NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_specialist_handoffs_session_idx" ON "intake_specialist_handoffs" USING btree ("intake_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_session_id" uuid REFERENCES "intake_sessions"("id"),
  "participant_reference" text,
  "action" text NOT NULL,
  "actor_type" text NOT NULL,
  "actor_reference" text,
  "purpose_reference" text,
  "scope_references" jsonb NOT NULL,
  "before_reference" text,
  "after_reference" text,
  "policy_version_vector" jsonb NOT NULL,
  "result" text NOT NULL,
  "correlation_id" text NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_audit_events_session_idx" ON "intake_audit_events" USING btree ("intake_session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intake_audit_events_correlation_idx" ON "intake_audit_events" USING btree ("correlation_id");
