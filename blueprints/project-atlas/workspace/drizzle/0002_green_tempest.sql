DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_public_chat_gateway') THEN
    CREATE ROLE atlas_public_chat_gateway
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint
CREATE TABLE "public_chat_rate_limits" (
	"bucket_hash" char(64) PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_rate_limits_count_positive" CHECK ("public_chat_rate_limits"."count" > 0),
	CONSTRAINT "public_chat_rate_limits_window_valid" CHECK ("public_chat_rate_limits"."expires_at" > "public_chat_rate_limits"."window_started_at")
);
--> statement-breakpoint
ALTER TABLE "public_chat_rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD COLUMN "handoff_reason" varchar(48);--> statement-breakpoint
ALTER TABLE "public_chat_sessions" ADD COLUMN "correlation_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "public_chat_rate_limits_expiry_idx" ON "public_chat_rate_limits" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_handoff_reason_valid" CHECK ("public_chat_conversations"."handoff_reason" is null or "public_chat_conversations"."handoff_reason" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable'));--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_handoff_state_valid" CHECK (("public_chat_conversations"."status" in ('human_requested', 'waiting_for_human') and "public_chat_conversations"."handoff_reason" is not null) or ("public_chat_conversations"."status" not in ('human_requested', 'waiting_for_human')));--> statement-breakpoint
DROP POLICY "public_chat_audit_events_server_gateway_only" ON "public_chat_audit_events" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_citations_server_gateway_only" ON "public_chat_citations" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_conversations_server_gateway_only" ON "public_chat_conversations" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_handoffs_server_gateway_only" ON "public_chat_handoffs" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_idempotency_server_gateway_only" ON "public_chat_idempotency" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_messages_server_gateway_only" ON "public_chat_messages" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_sessions_server_gateway_only" ON "public_chat_sessions" CASCADE;--> statement-breakpoint
CREATE POLICY "public_chat_audit_events_server_gateway_only" ON "public_chat_audit_events" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_citations_server_gateway_only" ON "public_chat_citations" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_conversations_server_gateway_only" ON "public_chat_conversations" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_handoffs_server_gateway_only" ON "public_chat_handoffs" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_idempotency_server_gateway_only" ON "public_chat_idempotency" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_messages_server_gateway_only" ON "public_chat_messages" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_sessions_server_gateway_only" ON "public_chat_sessions" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "public_chat_rate_limits_server_gateway_only" ON "public_chat_rate_limits" AS PERMISSIVE FOR ALL TO "atlas_public_chat_gateway" USING (true) WITH CHECK (true);
--> statement-breakpoint
ALTER TABLE "public_chat_rate_limits" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_rate_limits" FROM PUBLIC;--> statement-breakpoint
DO $$
DECLARE
  browser_role text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE public_chat_rate_limits FROM %I', browser_role);
    END IF;
  END LOOP;
END
$$;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO atlas_public_chat_gateway;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "public_chat_sessions",
  "public_chat_conversations",
  "public_chat_messages",
  "public_chat_citations",
  "public_chat_handoffs",
  "public_chat_idempotency",
  "public_chat_audit_events",
  "public_chat_rate_limits"
TO atlas_public_chat_gateway;
