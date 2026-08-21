CREATE TABLE "form_consent_revocations" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"consent_type" varchar(64) NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"session_binding_digest" char(64) NOT NULL,
	"idempotency_digest" char(64) NOT NULL,
	"command_digest" char(64) NOT NULL,
	"evidence_reference" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_consent_revocations_idempotency_digest_unique" UNIQUE("idempotency_digest"),
	CONSTRAINT "form_consent_revocations_digests_valid" CHECK ("form_consent_revocations"."scope_digest" ~ '^[0-9a-f]{64}$' and "form_consent_revocations"."session_binding_digest" ~ '^[0-9a-f]{64}$' and "form_consent_revocations"."idempotency_digest" ~ '^[0-9a-f]{64}$' and "form_consent_revocations"."command_digest" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "form_consent_revocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_consent_revocations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_outbox" DROP CONSTRAINT "form_outbox_state_valid";--> statement-breakpoint
ALTER TABLE "form_outbox" DROP CONSTRAINT "form_outbox_attempt_valid";--> statement-breakpoint
ALTER TABLE "form_outbox" ADD COLUMN "max_attempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "form_outbox" ADD COLUMN "owner_receipt" jsonb;--> statement-breakpoint
ALTER TABLE "form_consent_revocations" ADD CONSTRAINT "form_consent_revocations_grant_fk" FOREIGN KEY ("submission_id","consent_type","consent_version") REFERENCES "public"."form_consent_evidence"("submission_id","consent_type","consent_version") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_outbox" ADD CONSTRAINT "form_outbox_state_valid" CHECK ("form_outbox"."state" in ('pending', 'dispatching', 'completed', 'unavailable', 'unknown', 'manual_review'));--> statement-breakpoint
ALTER TABLE "form_outbox" ADD CONSTRAINT "form_outbox_attempt_valid" CHECK ("form_outbox"."attempt_count" >= 0 and "form_outbox"."max_attempts" between 1 and 12 and "form_outbox"."attempt_count" <= "form_outbox"."max_attempts" and "form_outbox"."lease_version" >= 0);--> statement-breakpoint
ALTER POLICY "form_attribution_staff_select" ON "form_attribution" RENAME TO "form_attribution_review_select";--> statement-breakpoint
DROP POLICY "form_audit_events_staff_select" ON "form_audit_events" CASCADE;--> statement-breakpoint
DROP POLICY "form_consent_evidence_staff_select" ON "form_consent_evidence" CASCADE;--> statement-breakpoint
DROP POLICY "form_definition_versions_staff_preview_select" ON "form_definition_versions" CASCADE;--> statement-breakpoint
DROP POLICY "form_definitions_staff_preview_select" ON "form_definitions" CASCADE;--> statement-breakpoint
DROP POLICY "form_field_definitions_staff_preview_select" ON "form_field_definitions" CASCADE;--> statement-breakpoint
DROP POLICY "form_outbox_staff_select" ON "form_outbox" CASCADE;--> statement-breakpoint
DROP POLICY "form_responses_staff_select" ON "form_responses" CASCADE;--> statement-breakpoint
DROP POLICY "form_submission_receipts_staff_select" ON "form_submission_receipts" CASCADE;--> statement-breakpoint
DROP POLICY "form_submissions_staff_select" ON "form_submissions" CASCADE;--> statement-breakpoint
CREATE POLICY "form_attribution_export_select" ON "form_attribution" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_audit_events_review_select" ON "form_audit_events" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_evidence_gateway_session_revoke_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_consent_evidence"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_evidence_outbox_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_outbox" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_evidence_review_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_evidence_export_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_definition_versions_preview_select" ON "form_definition_versions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_preview" USING (true);--> statement-breakpoint
CREATE POLICY "form_definition_versions_review_select" ON "form_definition_versions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_definition_versions_export_select" ON "form_definition_versions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_definitions_preview_select" ON "form_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_preview" USING (true);--> statement-breakpoint
CREATE POLICY "form_definitions_review_select" ON "form_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_definitions_export_select" ON "form_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_field_definitions_preview_select" ON "form_field_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_preview" USING (true);--> statement-breakpoint
CREATE POLICY "form_field_definitions_review_select" ON "form_field_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_field_definitions_export_select" ON "form_field_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_outbox_worker_select" ON "form_outbox" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_outbox" USING (true);--> statement-breakpoint
CREATE POLICY "form_outbox_worker_update" ON "form_outbox" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_outbox" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "form_outbox_review_select" ON "form_outbox" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_responses_review_select" ON "form_responses" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_responses_export_select" ON "form_responses" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_submission_receipts_gateway_session_revoke_select" ON "form_submission_receipts" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING (exists (select 1 from form_submissions submission where submission.id = "form_submission_receipts"."submission_id" and submission.session_binding_digest = nullif(current_setting('atlas.public_forms_session_digest', true), '')));--> statement-breakpoint
CREATE POLICY "form_submission_receipts_review_select" ON "form_submission_receipts" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_submissions_gateway_session_revoke_select" ON "form_submissions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_submissions"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submissions_review_select" ON "form_submissions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_submissions_export_select" ON "form_submissions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_revocations_gateway_session_select" ON "form_consent_revocations" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_consent_revocations"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_revocations_gateway_session_insert" ON "form_consent_revocations" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_consent_revocations"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_revocations_review_select" ON "form_consent_revocations" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_review" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_revocations_export_select" ON "form_consent_revocations" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_export" USING (true);--> statement-breakpoint
CREATE POLICY "form_consent_revocations_outbox_select" ON "form_consent_revocations" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_outbox" USING (true);
