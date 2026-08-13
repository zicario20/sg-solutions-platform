CREATE TABLE "public_chat_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"sequence" bigint NOT NULL,
	"conversation_id" text NOT NULL,
	"event_name" varchar(64) NOT NULL,
	"reason" varchar(48),
	"version" integer NOT NULL,
	"locale" varchar(2) NOT NULL,
	"correlation_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_audit_sequence_unique" UNIQUE("conversation_id","sequence")
);
--> statement-breakpoint
ALTER TABLE "public_chat_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_citations" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"path" text NOT NULL,
	"locale" varchar(2) NOT NULL,
	"summary" text NOT NULL,
	"disclosure" text NOT NULL,
	"source_kind" varchar(16),
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_citations_message_source_unique" UNIQUE("message_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "public_chat_citations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"version" integer NOT NULL,
	"locale" varchar(2) NOT NULL,
	"status" varchar(32) NOT NULL,
	"notice_version" varchar(80) NOT NULL,
	"correlation_id" text NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	"handoff_receipt_id" text,
	"reconciliation_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_conversations_version_positive" CHECK ("public_chat_conversations"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_handoffs" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"status" varchar(24) NOT NULL,
	"reason" varchar(48) NOT NULL,
	"receipt_id" text,
	"requested_at" timestamp with time zone NOT NULL,
	"queued_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_chat_handoffs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_idempotency" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"state" varchar(16) NOT NULL,
	"expected_version" integer NOT NULL,
	"lease_token_hash" char(64) NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"result" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_idempotency_conversation_key_unique" UNIQUE("conversation_id","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"actor" varchar(16) NOT NULL,
	"state" varchar(24) NOT NULL,
	"body" text,
	"body_stored" boolean DEFAULT false NOT NULL,
	"rejection_reason" varchar(48),
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_messages_conversation_ordinal_unique" UNIQUE("conversation_id","ordinal")
);
--> statement-breakpoint
ALTER TABLE "public_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "public_chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_hash" char(64) NOT NULL,
	"csrf_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "public_chat_sessions_session_hash_unique" UNIQUE("session_hash")
);
--> statement-breakpoint
ALTER TABLE "public_chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_audit_events" ADD CONSTRAINT "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."public_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."public_chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_session_id_public_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."public_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_handoffs" ADD CONSTRAINT "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."public_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."public_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_messages" ADD CONSTRAINT "public_chat_messages_conversation_id_public_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."public_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_chat_conversations_expiry_idx" ON "public_chat_conversations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "public_chat_conversations_reconciliation_idx" ON "public_chat_conversations" USING btree ("reconciliation_required","updated_at");--> statement-breakpoint
CREATE INDEX "public_chat_handoffs_status_idx" ON "public_chat_handoffs" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "public_chat_idempotency_lease_idx" ON "public_chat_idempotency" USING btree ("state","lease_expires_at");--> statement-breakpoint
CREATE INDEX "public_chat_messages_conversation_idx" ON "public_chat_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "public_chat_sessions_expiry_idx" ON "public_chat_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE POLICY "public_chat_audit_events_server_gateway_only" ON "public_chat_audit_events" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_citations_server_gateway_only" ON "public_chat_citations" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_conversations_server_gateway_only" ON "public_chat_conversations" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_handoffs_server_gateway_only" ON "public_chat_handoffs" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_idempotency_server_gateway_only" ON "public_chat_idempotency" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_messages_server_gateway_only" ON "public_chat_messages" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);--> statement-breakpoint
CREATE POLICY "public_chat_sessions_server_gateway_only" ON "public_chat_sessions" AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false);