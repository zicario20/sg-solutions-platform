CREATE TABLE IF NOT EXISTS "scheduler_agent_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_definition_reference" text NOT NULL,
  "agent_version_reference" text NOT NULL,
  "appointment_registry_version_reference" text NOT NULL,
  "availability_policy_version_reference" text NOT NULL,
  "tool_policy_version_reference" text NOT NULL,
  "status" text DEFAULT 'disabled' NOT NULL,
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scheduler_agent_configurations_agent_version_uq" ON "scheduler_agent_configurations" USING btree ("agent_version_reference");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduler_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_handoff_reference" text,
  "surface" text NOT NULL,
  "channel" text NOT NULL,
  "locale" text NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "appointment_type_reference" text,
  "subject_reference" text,
  "time_zone_context" jsonb NOT NULL,
  "authoritative_appointment_reference" text,
  "expires_at" timestamp with time zone NOT NULL,
  "last_activity_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_sessions_subject_status_idx" ON "scheduler_sessions" USING btree ("subject_reference","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_sessions_source_handoff_idx" ON "scheduler_sessions" USING btree ("source_handoff_reference");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduler_booking_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scheduler_session_id" uuid NOT NULL REFERENCES "scheduler_sessions"("id"),
  "appointment_type_reference" text NOT NULL,
  "selected_slot_token_reference" text NOT NULL,
  "subject_reference" text NOT NULL,
  "time_zone" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "status" text DEFAULT 'prepared' NOT NULL,
  "execution_permitted" boolean DEFAULT false NOT NULL,
  "authoritative_appointment_reference" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scheduler_booking_requests_session_idempotency_uq" ON "scheduler_booking_requests" USING btree ("scheduler_session_id","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_booking_requests_status_idx" ON "scheduler_booking_requests" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduler_human_handoffs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scheduler_session_id" uuid NOT NULL REFERENCES "scheduler_sessions"("id"),
  "target" text NOT NULL,
  "reason" text NOT NULL,
  "appointment_type_reference" text,
  "time_zone" text,
  "locale" text NOT NULL,
  "client_safe_summary" text NOT NULL,
  "source_references" jsonb NOT NULL,
  "status" text DEFAULT 'prepared' NOT NULL,
  "dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_human_handoffs_session_idx" ON "scheduler_human_handoffs" USING btree ("scheduler_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduler_runtime_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scheduler_session_id" uuid NOT NULL REFERENCES "scheduler_sessions"("id"),
  "requested_action" text NOT NULL,
  "status" text DEFAULT 'disabled' NOT NULL,
  "execution_permitted" boolean DEFAULT false NOT NULL,
  "correlation_id" text NOT NULL,
  "context_snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_runtime_executions_session_idx" ON "scheduler_runtime_executions" USING btree ("scheduler_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduler_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scheduler_session_id" uuid REFERENCES "scheduler_sessions"("id"),
  "action" text NOT NULL,
  "actor_reference" text,
  "purpose_reference" text,
  "scope_references" jsonb NOT NULL,
  "policy_version_vector" jsonb NOT NULL,
  "result" text NOT NULL,
  "correlation_id" text NOT NULL,
  "content_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_audit_events_session_idx" ON "scheduler_audit_events" USING btree ("scheduler_session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scheduler_audit_events_correlation_idx" ON "scheduler_audit_events" USING btree ("correlation_id");
