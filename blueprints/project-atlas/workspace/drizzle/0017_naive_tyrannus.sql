ALTER TABLE "voice_command_receipts" DROP CONSTRAINT "voice_command_receipts_result_valid";--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD COLUMN "command_digest" char(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD COLUMN "owner_receipt_id" text;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_digest_valid" CHECK ("voice_command_receipts"."command_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_result_kind_valid" CHECK ("voice_command_receipts"."result_kind" is null or "voice_command_receipts"."result_kind" in ('completed', 'verification_required', 'confirmation_required', 'denied', 'unavailable'));--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_result_code_valid" CHECK ("voice_command_receipts"."result_code" is null or "voice_command_receipts"."result_code" in ('language_selected', 'contact_hint_processed', 'public_information_ready', 'availability_ready', 'lead_created', 'appointment_requested', 'callback_requested', 'message_recorded', 'transfer_requested', 'voicemail_requested', 'approved_link_requested', 'portal_required', 'safe_status_ready', 'payment_projection_ready', 'missing_documents_ready', 'next_appointment_ready', 'secure_message_recorded'));--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_result_valid" CHECK (("voice_command_receipts"."state" = 'reserved' and "voice_command_receipts"."result_kind" is null and "voice_command_receipts"."result_code" is null and "voice_command_receipts"."owner_receipt_id" is null and "voice_command_receipts"."completed_at" is null) or ("voice_command_receipts"."state" in ('completed', 'failed') and "voice_command_receipts"."result_kind" is not null and "voice_command_receipts"."completed_at" >= "voice_command_receipts"."issued_at" and (("voice_command_receipts"."result_kind" = 'completed' and "voice_command_receipts"."result_code" is not null and "voice_command_receipts"."owner_receipt_id" is not null) or ("voice_command_receipts"."result_kind" <> 'completed' and "voice_command_receipts"."result_code" is null and "voice_command_receipts"."owner_receipt_id" is null))));
--> statement-breakpoint
ALTER ROLE "atlas_voice_operations" NOLOGIN NOSUPERUSER NOBYPASSRLS;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_voice_operations_runtime') THEN
    ALTER ROLE "atlas_voice_operations_runtime" NOSUPERUSER NOBYPASSRLS;
    GRANT "atlas_voice_operations" TO "atlas_voice_operations_runtime";
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "voice_calls" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_interactions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_verification_attempts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_escalations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_callback_requests" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_artifacts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "voice_command_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE runtime_role text;
BEGIN
  FOREACH runtime_role IN ARRAY ARRAY[
    'anon',
    'authenticated',
    'atlas_migration_runtime',
    'atlas_public_chat_gateway',
    'atlas_communications_gateway'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = runtime_role) THEN
      EXECUTE format(
        'REVOKE ALL ON TABLE voice_calls, voice_interactions, voice_verification_attempts, voice_escalations, voice_callback_requests, voice_artifacts, voice_command_receipts FROM %I',
        runtime_role
      );
    END IF;
  END LOOP;
END
$$;
--> statement-breakpoint
REVOKE ALL ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
FROM "atlas_voice_operations";
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE
  "voice_calls",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
TO "atlas_voice_operations";
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE
  "voice_interactions",
  "voice_verification_attempts"
TO "atlas_voice_operations";
