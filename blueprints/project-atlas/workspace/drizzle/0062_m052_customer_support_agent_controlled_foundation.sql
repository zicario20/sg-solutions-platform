CREATE TABLE IF NOT EXISTS "customer_support_agent_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agent_definition_reference" text NOT NULL,
  "agent_version_reference" text NOT NULL,
  "issue_taxonomy_version_reference" text NOT NULL,
  "tool_policy_version_reference" text NOT NULL,
  "client_safe_context_policy_reference" text NOT NULL,
  "status" text DEFAULT 'disabled' NOT NULL,
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_support_agent_configurations_agent_version_uq" ON "customer_support_agent_configurations" USING btree ("agent_version_reference");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_support_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_reference" text NOT NULL,
  "identity_assurance" text NOT NULL,
  "locale" text NOT NULL,
  "correlation_id" text NOT NULL,
  "status" text DEFAULT 'created' NOT NULL,
  "private_read_permitted" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "last_activity_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_support_sessions_client_status_idx" ON "customer_support_sessions" USING btree ("client_reference","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "customer_support_sessions_correlation_uq" ON "customer_support_sessions" USING btree ("correlation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_support_case_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "support_session_id" uuid NOT NULL REFERENCES "customer_support_sessions"("id"),
  "client_reference" text NOT NULL,
  "issue_domain" text NOT NULL,
  "issue_type" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "persistence_permitted" boolean DEFAULT false NOT NULL,
  "authoritative_case_file_created" boolean DEFAULT false NOT NULL,
  "opened_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_support_case_drafts_session_idx" ON "customer_support_case_drafts" USING btree ("support_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_support_handoffs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "support_session_id" uuid NOT NULL REFERENCES "customer_support_sessions"("id"),
  "client_reference" text NOT NULL,
  "target" text NOT NULL,
  "issue_type" text NOT NULL,
  "locale" text NOT NULL,
  "summary" text NOT NULL,
  "source_references" jsonb NOT NULL,
  "status" text DEFAULT 'prepared' NOT NULL,
  "dispatch_permitted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_support_handoffs_session_idx" ON "customer_support_handoffs" USING btree ("support_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_support_runtime_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "support_session_id" uuid NOT NULL REFERENCES "customer_support_sessions"("id"),
  "requested_action" text NOT NULL,
  "status" text DEFAULT 'disabled' NOT NULL,
  "execution_permitted" boolean DEFAULT false NOT NULL,
  "correlation_id" text NOT NULL,
  "context_snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_support_runtime_executions_session_idx" ON "customer_support_runtime_executions" USING btree ("support_session_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_support_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "support_session_id" uuid REFERENCES "customer_support_sessions"("id"),
  "client_reference" text NOT NULL,
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
CREATE INDEX IF NOT EXISTS "customer_support_audit_events_session_idx" ON "customer_support_audit_events" USING btree ("support_session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_support_audit_events_correlation_idx" ON "customer_support_audit_events" USING btree ("correlation_id");
