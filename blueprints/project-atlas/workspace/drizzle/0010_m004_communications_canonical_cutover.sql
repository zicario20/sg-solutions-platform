CREATE TABLE "communication_dispatch_reconciliation_receipts" (
	"receipt_id" text PRIMARY KEY NOT NULL,
	"receipt_digest" char(64) NOT NULL,
	"command_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"binding_id" text NOT NULL,
	"source" varchar(32) NOT NULL,
	"outcome" varchar(32) NOT NULL,
	"correlation_id" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_dispatch_reconciliation_receipts_digest_valid" CHECK ("communication_dispatch_reconciliation_receipts"."receipt_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_dispatch_reconciliation_receipts_source_valid" CHECK ("communication_dispatch_reconciliation_receipts"."source" in ('provider_lookup', 'manual_authority')),
	CONSTRAINT "communication_dispatch_reconciliation_receipts_outcome_valid" CHECK ("communication_dispatch_reconciliation_receipts"."outcome" in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')),
	CONSTRAINT "communication_dispatch_reconciliation_receipts_window_valid" CHECK ("communication_dispatch_reconciliation_receipts"."expires_at" > "communication_dispatch_reconciliation_receipts"."issued_at" and "communication_dispatch_reconciliation_receipts"."created_at" >= "communication_dispatch_reconciliation_receipts"."issued_at" and "communication_dispatch_reconciliation_receipts"."created_at" < "communication_dispatch_reconciliation_receipts"."expires_at")
);
--> statement-breakpoint
ALTER TABLE "communication_dispatch_reconciliation_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "communication_provider_status_receipts" (
	"command_id" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"status" varchar(24) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_provider_status_receipts_command_event_pk" PRIMARY KEY("command_id","provider_event_id"),
	CONSTRAINT "communication_provider_status_receipts_status_valid" CHECK ("communication_provider_status_receipts"."status" in ('sent', 'delivered', 'read', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "communication_provider_status_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "public_chat_audit_events_server_gateway_only" ON "public_chat_audit_events" CASCADE;--> statement-breakpoint
DROP TABLE "public_chat_audit_events" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_conversations_server_gateway_only" ON "public_chat_conversations" CASCADE;--> statement-breakpoint
DROP TABLE "public_chat_conversations" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_handoffs_server_gateway_only" ON "public_chat_handoffs" CASCADE;--> statement-breakpoint
DROP TABLE "public_chat_handoffs" CASCADE;--> statement-breakpoint
DROP POLICY "public_chat_messages_server_gateway_only" ON "public_chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "public_chat_messages" CASCADE;--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_authority_valid";--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_state_shape_valid";--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_version_positive";--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_fingerprint_valid";--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_policy_version_positive";--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid";--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_destination_reference_opaque";--> statement-breakpoint
ALTER TABLE "public_chat_citations" DROP CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" DROP CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_domain" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_reference" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_issued_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_valid_until" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "expected_policy_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ALTER COLUMN "fingerprint" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_contact_policies" ADD COLUMN "fence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_owner_hash" char(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_version" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "provider_reference_digest" char(64);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "message_body_digest" char(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_operation" varchar(80);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_binding_id" text;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_destination_key" varchar(120);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "required_fence" integer;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "endpoint_digests" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD COLUMN "failure_code" varchar(64);--> statement-breakpoint
ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_attempt_command_fk" FOREIGN KEY ("attempt_id","command_id") REFERENCES "public"."communication_dispatch_attempts"("id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_command_binding_fk" FOREIGN KEY ("command_id","binding_id") REFERENCES "public"."communication_outbound_commands"("id","binding_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_provider_status_receipts" ADD CONSTRAINT "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."communication_outbound_commands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_message_id_communication_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."communication_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_conversation_id_communication_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."communication_conversations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" DROP COLUMN "owning_receipt_correlation_id";--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_id_command_unique" UNIQUE("id","command_id");--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_id_binding_unique" UNIQUE("id","binding_id");--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_authority_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."authority_role" = 'channel_policy_detection'))) or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'contact_review') or ("communication_contact_evidence_events"."event_kind" in ('binding_suspended', 'binding_revalidated') and "communication_contact_evidence_events"."authority_role" = 'binding_verification'));--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_state_shape_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_granted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_regranted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."triggering_event_id" is null) or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."triggering_event_id" is not null)) and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'opt_out_pending' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_cleared' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'clear' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'withdraw' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'suspended' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'reverified' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null));--> statement-breakpoint
ALTER TABLE "communication_contact_policies" ADD CONSTRAINT "communication_contact_policies_fence_nonnegative" CHECK ("communication_contact_policies"."fence" >= 0);--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_owner_hash_valid" CHECK ("communication_dispatch_attempts"."lease_owner_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_version_positive" CHECK ("communication_dispatch_attempts"."lease_version" > 0);--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_window_valid" CHECK ("communication_dispatch_attempts"."lease_expires_at" > "communication_dispatch_attempts"."started_at");--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_provider_reference_digest_valid" CHECK ("communication_dispatch_attempts"."provider_reference_digest" is null or "communication_dispatch_attempts"."provider_reference_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_message_body_digest_valid" CHECK ("communication_outbound_commands"."message_body_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_lease_owner_hash_valid" CHECK ("communication_outbound_commands"."lease_owner_id" is null or "communication_outbound_commands"."lease_owner_id" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_required_fence_valid" CHECK ("communication_outbound_commands"."required_fence" is null or "communication_outbound_commands"."required_fence" >= 0);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_endpoint_digests_valid" CHECK (jsonb_typeof("communication_outbound_commands"."endpoint_digests") = 'array');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_version_nonnegative" CHECK ("communication_outbound_commands"."version" >= 0);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_finalization_valid" CHECK ("communication_outbound_commands"."state" = 'draft' or ("communication_outbound_commands"."fingerprint" is not null and "communication_outbound_commands"."expected_policy_version" is not null and "communication_outbound_commands"."required_fence" is not null and "communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."destination_key" is not null));--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_destination_valid" CHECK ("communication_outbound_commands"."owning_destination_key" is null or "communication_outbound_commands"."owning_destination_key" ~ '^endpoint_ref:[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_reference_valid" CHECK ("communication_outbound_commands"."owning_reference" is null or "communication_outbound_commands"."owning_reference" ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_fingerprint_valid" CHECK ("communication_outbound_commands"."fingerprint" is null or "communication_outbound_commands"."fingerprint" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_policy_version_positive" CHECK ("communication_outbound_commands"."expected_policy_version" is null or "communication_outbound_commands"."expected_policy_version" > 0);--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK (("communication_outbound_commands"."owning_receipt_id" is null and "communication_outbound_commands"."owning_domain" is null and "communication_outbound_commands"."owning_operation" is null and "communication_outbound_commands"."owning_reference" is null and "communication_outbound_commands"."owning_binding_id" is null and "communication_outbound_commands"."owning_destination_key" is null and "communication_outbound_commands"."owning_receipt_issued_at" is null and "communication_outbound_commands"."owning_receipt_valid_until" is null) or ("communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."owning_domain" = 'communications' and "communication_outbound_commands"."owning_operation" = 'outbound_dispatch' and "communication_outbound_commands"."owning_reference" is not null and "communication_outbound_commands"."owning_binding_id" = "communication_outbound_commands"."binding_id" and "communication_outbound_commands"."owning_destination_key" = "communication_outbound_commands"."destination_key" and "communication_outbound_commands"."owning_receipt_issued_at" is not null and "communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at"));--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_destination_reference_opaque" CHECK ("communication_outbound_commands"."destination_key" is null or "communication_outbound_commands"."destination_key" ~ '^endpoint_ref:[0-9a-f]{64}$');--> statement-breakpoint
CREATE POLICY "communication_dispatch_reconciliation_receipts_communications_scope" ON "communication_dispatch_reconciliation_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_dispatch_reconciliation_receipts"."command_id" and command.channel_kind = 'whatsapp'
  )) WITH CHECK (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_dispatch_reconciliation_receipts"."command_id" and command.channel_kind = 'whatsapp'
  ));--> statement-breakpoint
CREATE POLICY "communication_provider_status_receipts_communications_scope" ON "communication_provider_status_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_provider_status_receipts"."command_id" and command.channel_kind = 'whatsapp'
  )) WITH CHECK (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_provider_status_receipts"."command_id" and command.channel_kind = 'whatsapp'
  ));--> statement-breakpoint
ALTER POLICY "public_chat_citations_server_gateway_only" ON "public_chat_citations" TO atlas_public_chat_gateway USING (exists (
    select 1
    from communication_messages message
    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
    where message.id = "public_chat_citations"."message_id"
      and message.channel_kind = 'public_web'
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK (exists (
    select 1
    from communication_messages message
    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
    where message.id = "public_chat_citations"."message_id"
      and message.channel_kind = 'public_web'
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));--> statement-breakpoint
ALTER POLICY "public_chat_idempotency_server_gateway_only" ON "public_chat_idempotency" TO atlas_public_chat_gateway USING (exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "public_chat_idempotency"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  )) WITH CHECK (exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = "public_chat_idempotency"."conversation_id"
      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
  ));