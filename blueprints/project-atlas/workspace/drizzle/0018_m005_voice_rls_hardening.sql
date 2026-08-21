ALTER TABLE "voice_command_receipts" DROP CONSTRAINT "voice_command_receipts_state_valid";--> statement-breakpoint
ALTER TABLE "voice_command_receipts" DROP CONSTRAINT "voice_command_receipts_result_valid";--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ALTER COLUMN "state" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD COLUMN "lease_expires_at" timestamp with time zone DEFAULT now() + interval '30 seconds' NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD COLUMN "reservation_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_lease_valid" CHECK ("voice_command_receipts"."lease_expires_at" > "voice_command_receipts"."issued_at");--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_version_positive" CHECK ("voice_command_receipts"."reservation_version" > 0);--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_state_valid" CHECK ("voice_command_receipts"."state" in ('reserved', 'reconciliation_required', 'completed', 'failed'));--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_result_valid" CHECK (("voice_command_receipts"."state" in ('reserved', 'reconciliation_required') and "voice_command_receipts"."result_kind" is null and "voice_command_receipts"."result_code" is null and "voice_command_receipts"."owner_receipt_id" is null and "voice_command_receipts"."completed_at" is null) or ("voice_command_receipts"."state" in ('completed', 'failed') and "voice_command_receipts"."result_kind" is not null and "voice_command_receipts"."completed_at" >= "voice_command_receipts"."issued_at" and (("voice_command_receipts"."result_kind" = 'completed' and "voice_command_receipts"."result_code" is not null and "voice_command_receipts"."owner_receipt_id" is not null) or ("voice_command_receipts"."result_kind" <> 'completed' and "voice_command_receipts"."result_code" is null and "voice_command_receipts"."owner_receipt_id" is null))));--> statement-breakpoint
DROP POLICY "voice_artifacts_voice_operations_only" ON "voice_artifacts" CASCADE;--> statement-breakpoint
DROP POLICY "voice_callback_requests_voice_operations_only" ON "voice_callback_requests" CASCADE;--> statement-breakpoint
DROP POLICY "voice_calls_voice_operations_only" ON "voice_calls" CASCADE;--> statement-breakpoint
DROP POLICY "voice_command_receipts_voice_operations_only" ON "voice_command_receipts" CASCADE;--> statement-breakpoint
DROP POLICY "voice_escalations_voice_operations_only" ON "voice_escalations" CASCADE;--> statement-breakpoint
DROP POLICY "voice_interactions_voice_operations_only" ON "voice_interactions" CASCADE;--> statement-breakpoint
DROP POLICY "voice_verification_attempts_voice_operations_only" ON "voice_verification_attempts" CASCADE;--> statement-breakpoint
CREATE POLICY "voice_artifacts_voice_select" ON "voice_artifacts" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_artifacts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_artifacts_voice_insert" ON "voice_artifacts" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_artifacts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_artifacts_voice_update" ON "voice_artifacts" AS PERMISSIVE FOR UPDATE TO "atlas_voice_operations" USING ("voice_artifacts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), '')) WITH CHECK ("voice_artifacts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_callback_requests_voice_select" ON "voice_callback_requests" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_callback_requests"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_callback_requests_voice_insert" ON "voice_callback_requests" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_callback_requests"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_callback_requests_voice_update" ON "voice_callback_requests" AS PERMISSIVE FOR UPDATE TO "atlas_voice_operations" USING ("voice_callback_requests"."call_id" = nullif(current_setting('atlas.voice_call_id', true), '')) WITH CHECK ("voice_callback_requests"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_calls_voice_select" ON "voice_calls" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_calls"."id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_calls_voice_insert" ON "voice_calls" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_calls"."id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_calls_voice_update" ON "voice_calls" AS PERMISSIVE FOR UPDATE TO "atlas_voice_operations" USING ("voice_calls"."id" = nullif(current_setting('atlas.voice_call_id', true), '')) WITH CHECK ("voice_calls"."id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_command_receipts_voice_select" ON "voice_command_receipts" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_command_receipts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_command_receipts_voice_insert" ON "voice_command_receipts" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_command_receipts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_command_receipts_voice_update" ON "voice_command_receipts" AS PERMISSIVE FOR UPDATE TO "atlas_voice_operations" USING ("voice_command_receipts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), '')) WITH CHECK ("voice_command_receipts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_escalations_voice_select" ON "voice_escalations" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_escalations"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_escalations_voice_insert" ON "voice_escalations" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_escalations"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_escalations_voice_update" ON "voice_escalations" AS PERMISSIVE FOR UPDATE TO "atlas_voice_operations" USING ("voice_escalations"."call_id" = nullif(current_setting('atlas.voice_call_id', true), '')) WITH CHECK ("voice_escalations"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_interactions_voice_select" ON "voice_interactions" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_interactions"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_interactions_voice_insert" ON "voice_interactions" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_interactions"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_verification_attempts_voice_select" ON "voice_verification_attempts" AS PERMISSIVE FOR SELECT TO "atlas_voice_operations" USING ("voice_verification_attempts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
CREATE POLICY "voice_verification_attempts_voice_insert" ON "voice_verification_attempts" AS PERMISSIVE FOR INSERT TO "atlas_voice_operations" WITH CHECK ("voice_verification_attempts"."call_id" = nullif(current_setting('atlas.voice_call_id', true), ''));--> statement-breakpoint
ALTER ROLE "atlas_voice_operations" NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_voice_operations_runtime') THEN
    ALTER ROLE "atlas_voice_operations_runtime" NOINHERIT NOSUPERUSER NOBYPASSRLS;
    GRANT "atlas_voice_operations" TO "atlas_voice_operations_runtime";
  END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "voice_calls" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_interactions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_verification_attempts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_escalations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_callback_requests" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_artifacts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
FROM PUBLIC;--> statement-breakpoint
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
$$;--> statement-breakpoint
REVOKE ALL ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
FROM "atlas_voice_operations";--> statement-breakpoint
GRANT SELECT ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_artifacts",
  "voice_command_receipts"
TO "atlas_voice_operations";--> statement-breakpoint
GRANT INSERT ON TABLE
  "voice_calls",
  "voice_interactions",
  "voice_verification_attempts",
  "voice_escalations",
  "voice_callback_requests",
  "voice_command_receipts"
TO "atlas_voice_operations";--> statement-breakpoint
GRANT UPDATE ON TABLE
  "voice_calls",
  "voice_escalations",
  "voice_callback_requests",
  "voice_command_receipts"
TO "atlas_voice_operations";
