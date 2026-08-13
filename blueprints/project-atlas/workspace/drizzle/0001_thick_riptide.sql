ALTER TABLE "public_chat_messages" ADD COLUMN "actions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "public_chat_audit_events" ADD CONSTRAINT "public_chat_audit_locale_valid" CHECK ("public_chat_audit_events"."locale" in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_locale_valid" CHECK ("public_chat_citations"."locale" in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_source_kind_valid" CHECK ("public_chat_citations"."source_kind" is null or "public_chat_citations"."source_kind" = 'provider');--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_locale_valid" CHECK ("public_chat_conversations"."locale" in ('es', 'en'));--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_status_valid" CHECK ("public_chat_conversations"."status" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted'));--> statement-breakpoint
ALTER TABLE "public_chat_conversations" ADD CONSTRAINT "public_chat_conversations_expiry_valid" CHECK ("public_chat_conversations"."expires_at" > "public_chat_conversations"."created_at");--> statement-breakpoint
ALTER TABLE "public_chat_handoffs" ADD CONSTRAINT "public_chat_handoffs_status_valid" CHECK ("public_chat_handoffs"."status" in ('human_requested', 'waiting_for_human'));--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_state_valid" CHECK ("public_chat_idempotency"."state" in ('in_progress', 'completed'));--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_completion_valid" CHECK (("public_chat_idempotency"."state" = 'completed' and "public_chat_idempotency"."result" is not null and "public_chat_idempotency"."completed_at" is not null) or ("public_chat_idempotency"."state" = 'in_progress' and "public_chat_idempotency"."completed_at" is null));--> statement-breakpoint
ALTER TABLE "public_chat_messages" ADD CONSTRAINT "public_chat_messages_actor_valid" CHECK ("public_chat_messages"."actor" in ('visitor', 'assistant', 'human', 'system'));--> statement-breakpoint
ALTER TABLE "public_chat_messages" ADD CONSTRAINT "public_chat_messages_state_valid" CHECK ("public_chat_messages"."state" in ('accepted', 'answered', 'failed', 'handoff_required'));--> statement-breakpoint
ALTER TABLE "public_chat_messages" ADD CONSTRAINT "public_chat_messages_body_retention_valid" CHECK (("public_chat_messages"."body_stored" = true and "public_chat_messages"."body" is not null) or ("public_chat_messages"."body_stored" = false and "public_chat_messages"."body" is null));--> statement-breakpoint
ALTER TABLE "public_chat_sessions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_conversations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_messages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_citations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_handoffs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_chat_audit_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_sessions" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_conversations" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_messages" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_citations" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_handoffs" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_idempotency" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "public_chat_audit_events" FROM PUBLIC, anon, authenticated;
