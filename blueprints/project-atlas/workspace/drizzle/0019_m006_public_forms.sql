CREATE TABLE "form_attribution" (
	"submission_id" text PRIMARY KEY NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"referrer" text,
	"landing_page" text,
	"utm_source" varchar(80),
	"utm_medium" varchar(80),
	"utm_campaign" varchar(100),
	"utm_term" varchar(100),
	"utm_content" varchar(100),
	"partner_code" varchar(64),
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_attribution_scope_valid" CHECK ("form_attribution"."scope_digest" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "form_attribution" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"event_name" varchar(48) NOT NULL,
	"result_code" varchar(32) NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"correlation_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_audit_events_scope_valid" CHECK ("form_audit_events"."scope_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_audit_events_locale_valid" CHECK ("form_audit_events"."locale" in ('es', 'en')),
	CONSTRAINT "form_audit_events_event_valid" CHECK ("form_audit_events"."event_name" in ('submission_accepted', 'submission_replayed', 'submission_review', 'submission_expired', 'consent_revoked'))
);
--> statement-breakpoint
ALTER TABLE "form_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_consent_evidence" (
	"id" text NOT NULL,
	"submission_id" text NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"consent_type" varchar(64) NOT NULL,
	"consent_version" varchar(32) NOT NULL,
	"disclosure_reference" text NOT NULL,
	"granted" boolean NOT NULL,
	"source" varchar(24) NOT NULL,
	"session_binding_digest" char(64) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_consent_evidence_pk" PRIMARY KEY("submission_id","consent_type","consent_version"),
	CONSTRAINT "form_consent_evidence_scope_valid" CHECK ("form_consent_evidence"."scope_digest" ~ '^[0-9a-f]{64}$' and "form_consent_evidence"."session_binding_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_consent_evidence_source_valid" CHECK ("form_consent_evidence"."source" = 'public_form'),
	CONSTRAINT "form_consent_evidence_revocation_valid" CHECK ("form_consent_evidence"."revoked_at" is null or ("form_consent_evidence"."granted" = true and "form_consent_evidence"."revoked_at" >= "form_consent_evidence"."occurred_at"))
);
--> statement-breakpoint
ALTER TABLE "form_consent_evidence" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_definition_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"definition_id" text NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"version" varchar(32) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"status" varchar(16) NOT NULL,
	"audience" varchar(24) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"service_code" varchar(64),
	"retention_class" varchar(32) NOT NULL,
	"schema_hash" char(64) NOT NULL,
	"ui_hash" char(64) NOT NULL,
	"disclosure_references" jsonb NOT NULL,
	"approved_actions" jsonb NOT NULL,
	"consent_requirements" jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_definition_versions_code_version_locale_unique" UNIQUE("form_code","version","locale"),
	CONSTRAINT "form_definition_versions_id_code_version_locale_unique" UNIQUE("id","form_code","version","locale"),
	CONSTRAINT "form_definition_versions_id_valid" CHECK ("form_definition_versions"."id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "form_definition_versions_locale_valid" CHECK ("form_definition_versions"."locale" in ('es', 'en')),
	CONSTRAINT "form_definition_versions_status_valid" CHECK ("form_definition_versions"."status" in ('draft', 'published', 'disabled', 'archived')),
	CONSTRAINT "form_definition_versions_audience_valid" CHECK ("form_definition_versions"."audience" in ('public', 'staff_preview')),
	CONSTRAINT "form_definition_versions_hashes_valid" CHECK ("form_definition_versions"."schema_hash" ~ '^[0-9a-f]{64}$' and "form_definition_versions"."ui_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_definition_versions_publication_valid" CHECK (("form_definition_versions"."status" = 'published' and "form_definition_versions"."published_at" is not null and "form_definition_versions"."audience" = 'public') or "form_definition_versions"."status" <> 'published')
);
--> statement-breakpoint
ALTER TABLE "form_definition_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"lifecycle" varchar(16) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_definitions_form_code_unique" UNIQUE("form_code"),
	CONSTRAINT "form_definitions_id_valid" CHECK ("form_definitions"."id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "form_definitions_code_valid" CHECK ("form_definitions"."form_code" ~ '^[a-z][a-z0-9_]{1,63}$'),
	CONSTRAINT "form_definitions_lifecycle_valid" CHECK ("form_definitions"."lifecycle" in ('draft', 'active', 'disabled', 'archived'))
);
--> statement-breakpoint
ALTER TABLE "form_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"session_binding_digest" char(64) NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"form_version" varchar(32) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"ciphertext" text NOT NULL,
	"key_reference" text NOT NULL,
	"state" varchar(16) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_drafts_scope_digest_unique" UNIQUE("scope_digest"),
	CONSTRAINT "form_drafts_scope_valid" CHECK ("form_drafts"."scope_digest" ~ '^[0-9a-f]{64}$' and "form_drafts"."session_binding_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_drafts_locale_valid" CHECK ("form_drafts"."locale" in ('es', 'en')),
	CONSTRAINT "form_drafts_state_valid" CHECK ("form_drafts"."state" in ('active', 'expired', 'deleted')),
	CONSTRAINT "form_drafts_expiry_valid" CHECK ("form_drafts"."expires_at" > "form_drafts"."created_at")
);
--> statement-breakpoint
ALTER TABLE "form_drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_field_definitions" (
	"id" text NOT NULL,
	"definition_version_id" text NOT NULL,
	"field_code" varchar(64) NOT NULL,
	"field_type" varchar(24) NOT NULL,
	"step" integer NOT NULL,
	"required" boolean NOT NULL,
	"sensitivity" varchar(24) NOT NULL,
	"label_id" text NOT NULL,
	"help_text_id" text,
	"option_codes" jsonb,
	"validation_rules" jsonb NOT NULL,
	"conditional_rules" jsonb,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_field_definitions_pk" PRIMARY KEY("definition_version_id","field_code"),
	CONSTRAINT "form_field_definitions_version_order_unique" UNIQUE("definition_version_id","sort_order"),
	CONSTRAINT "form_field_definitions_code_valid" CHECK ("form_field_definitions"."field_code" ~ '^[a-z][a-z0-9_]{1,63}$'),
	CONSTRAINT "form_field_definitions_step_valid" CHECK ("form_field_definitions"."step" between 1 and 12),
	CONSTRAINT "form_field_definitions_order_valid" CHECK ("form_field_definitions"."sort_order" > 0),
	CONSTRAINT "form_field_definitions_sensitivity_valid" CHECK ("form_field_definitions"."sensitivity" in ('public', 'basic_personal', 'financial'))
);
--> statement-breakpoint
ALTER TABLE "form_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_outbox" (
	"command_id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"owner" varchar(24) NOT NULL,
	"operation" varchar(64) NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"service_code" varchar(64),
	"consent_type" varchar(64),
	"channel" varchar(16),
	"idempotency_key" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"lease_owner" text,
	"lease_version" integer DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"available_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"result_code" varchar(32),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_outbox_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "form_outbox_scope_valid" CHECK ("form_outbox"."scope_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_outbox_owner_valid" CHECK ("form_outbox"."owner" in ('lead', 'consent', 'appointment', 'payment', 'channel', 'analytics', 'notification')),
	CONSTRAINT "form_outbox_state_valid" CHECK ("form_outbox"."state" in ('pending', 'dispatching', 'completed', 'unavailable', 'manual_review')),
	CONSTRAINT "form_outbox_attempt_valid" CHECK ("form_outbox"."attempt_count" >= 0 and "form_outbox"."attempt_count" <= 12 and "form_outbox"."lease_version" >= 0),
	CONSTRAINT "form_outbox_lease_valid" CHECK (("form_outbox"."state" = 'dispatching' and "form_outbox"."lease_owner" is not null and "form_outbox"."lease_expires_at" is not null) or ("form_outbox"."state" <> 'dispatching' and "form_outbox"."lease_owner" is null and "form_outbox"."lease_expires_at" is null))
);
--> statement-breakpoint
ALTER TABLE "form_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_responses" (
	"submission_id" text NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"field_code" varchar(64) NOT NULL,
	"value_type" varchar(16) NOT NULL,
	"sensitivity" varchar(24) NOT NULL,
	"ciphertext" text NOT NULL,
	"key_reference" text NOT NULL,
	"match_digest" char(64),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_responses_pk" PRIMARY KEY("submission_id","field_code"),
	CONSTRAINT "form_responses_scope_valid" CHECK ("form_responses"."scope_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_responses_match_valid" CHECK ("form_responses"."match_digest" is null or "form_responses"."match_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_responses_value_type_valid" CHECK ("form_responses"."value_type" in ('string', 'number', 'boolean')),
	CONSTRAINT "form_responses_sensitivity_valid" CHECK ("form_responses"."sensitivity" in ('public', 'basic_personal', 'financial'))
);
--> statement-breakpoint
ALTER TABLE "form_responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_submission_receipts" (
	"receipt_id" text PRIMARY KEY NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"command_digest" char(64) NOT NULL,
	"reservation_id" text NOT NULL,
	"state" varchar(24) NOT NULL,
	"submission_id" text,
	"issued_at" timestamp with time zone NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_submission_receipts_scope_digest_unique" UNIQUE("scope_digest"),
	CONSTRAINT "form_submission_receipts_id_valid" CHECK ("form_submission_receipts"."receipt_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "form_submission_receipts_reservation_valid" CHECK ("form_submission_receipts"."reservation_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "form_submission_receipts_digests_valid" CHECK ("form_submission_receipts"."scope_digest" ~ '^[0-9a-f]{64}$' and "form_submission_receipts"."command_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_submission_receipts_state_valid" CHECK ("form_submission_receipts"."state" in ('reserved', 'accepted', 'reconciliation_required')),
	CONSTRAINT "form_submission_receipts_lease_valid" CHECK ("form_submission_receipts"."lease_expires_at" > "form_submission_receipts"."issued_at"),
	CONSTRAINT "form_submission_receipts_completion_valid" CHECK (("form_submission_receipts"."state" = 'accepted' and "form_submission_receipts"."submission_id" is not null and "form_submission_receipts"."accepted_at" is not null) or ("form_submission_receipts"."state" <> 'accepted' and "form_submission_receipts"."submission_id" is null and "form_submission_receipts"."accepted_at" is null))
);
--> statement-breakpoint
ALTER TABLE "form_submission_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_code" varchar(64) NOT NULL,
	"form_version" varchar(32) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"scope_digest" char(64) NOT NULL,
	"session_binding_digest" char(64) NOT NULL,
	"nonce_digest" char(64) NOT NULL,
	"command_digest" char(64) NOT NULL,
	"status" varchar(24) NOT NULL,
	"accepted_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"deletion_state" varchar(24) NOT NULL,
	"legal_hold" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "form_submissions_scope_digest_unique" UNIQUE("scope_digest"),
	CONSTRAINT "form_submissions_nonce_digest_unique" UNIQUE("nonce_digest"),
	CONSTRAINT "form_submissions_id_scope_unique" UNIQUE("id","scope_digest"),
	CONSTRAINT "form_submissions_id_valid" CHECK ("form_submissions"."id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "form_submissions_digests_valid" CHECK ("form_submissions"."scope_digest" ~ '^[0-9a-f]{64}$' and "form_submissions"."session_binding_digest" ~ '^[0-9a-f]{64}$' and "form_submissions"."nonce_digest" ~ '^[0-9a-f]{64}$' and "form_submissions"."command_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "form_submissions_status_valid" CHECK ("form_submissions"."status" in ('accepted', 'converted_to_lead', 'appointment_pending', 'expired', 'deleted')),
	CONSTRAINT "form_submissions_deletion_valid" CHECK ("form_submissions"."deletion_state" in ('retained', 'deletion_due', 'deleted', 'legal_hold')),
	CONSTRAINT "form_submissions_expiry_valid" CHECK ("form_submissions"."expires_at" > "form_submissions"."accepted_at")
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_attribution" ADD CONSTRAINT "form_attribution_submission_scope_fk" FOREIGN KEY ("submission_id","scope_digest") REFERENCES "public"."form_submissions"("id","scope_digest") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_audit_events" ADD CONSTRAINT "form_audit_events_submission_scope_fk" FOREIGN KEY ("submission_id","scope_digest") REFERENCES "public"."form_submissions"("id","scope_digest") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_consent_evidence" ADD CONSTRAINT "form_consent_evidence_submission_scope_fk" FOREIGN KEY ("submission_id","scope_digest") REFERENCES "public"."form_submissions"("id","scope_digest") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_definition_versions" ADD CONSTRAINT "form_definition_versions_definition_id_form_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."form_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_field_definitions" ADD CONSTRAINT "form_field_definitions_definition_version_id_form_definition_versions_id_fk" FOREIGN KEY ("definition_version_id") REFERENCES "public"."form_definition_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_outbox" ADD CONSTRAINT "form_outbox_submission_scope_fk" FOREIGN KEY ("submission_id","scope_digest") REFERENCES "public"."form_submissions"("id","scope_digest") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_submission_scope_fk" FOREIGN KEY ("submission_id","scope_digest") REFERENCES "public"."form_submissions"("id","scope_digest") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_receipts" ADD CONSTRAINT "form_submission_receipts_submission_id_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_definition_version_fk" FOREIGN KEY ("form_code","form_version","locale") REFERENCES "public"."form_definition_versions"("form_code","version","locale") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_drafts_expiry_idx" ON "form_drafts" USING btree ("state","expires_at");--> statement-breakpoint
CREATE INDEX "form_outbox_dispatch_idx" ON "form_outbox" USING btree ("state","available_at");--> statement-breakpoint
CREATE INDEX "form_submission_receipts_lease_idx" ON "form_submission_receipts" USING btree ("state","lease_expires_at");--> statement-breakpoint
CREATE INDEX "form_submissions_expiry_idx" ON "form_submissions" USING btree ("deletion_state","expires_at");--> statement-breakpoint
CREATE POLICY "form_attribution_gateway_select" ON "form_attribution" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_attribution"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_attribution_gateway_insert" ON "form_attribution" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_attribution"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_attribution_gateway_update" ON "form_attribution" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_attribution"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_attribution"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_attribution_staff_select" ON "form_attribution" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_audit_events_gateway_select" ON "form_audit_events" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_audit_events"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_audit_events_gateway_insert" ON "form_audit_events" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_audit_events"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_audit_events_gateway_update" ON "form_audit_events" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_audit_events"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_audit_events"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_audit_events_staff_select" ON "form_audit_events" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_consent_evidence_gateway_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_consent_evidence"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_evidence_gateway_insert" ON "form_consent_evidence" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_consent_evidence"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_evidence_gateway_update" ON "form_consent_evidence" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_consent_evidence"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_consent_evidence"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_consent_evidence_staff_select" ON "form_consent_evidence" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_definition_versions_gateway_published_select" ON "form_definition_versions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_definition_versions"."status" = 'published' and "form_definition_versions"."audience" = 'public');--> statement-breakpoint
CREATE POLICY "form_definition_versions_staff_preview_select" ON "form_definition_versions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_definitions_gateway_published_select" ON "form_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_definitions"."lifecycle" = 'active');--> statement-breakpoint
CREATE POLICY "form_definitions_staff_preview_select" ON "form_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_drafts_gateway_session_select" ON "form_drafts" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_drafts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '') and "form_drafts"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_drafts_gateway_session_insert" ON "form_drafts" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_drafts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '') and "form_drafts"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_drafts_gateway_session_update" ON "form_drafts" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_drafts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '') and "form_drafts"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), '')) WITH CHECK ("form_drafts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '') and "form_drafts"."session_binding_digest" = nullif(current_setting('atlas.public_forms_session_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_drafts_retention_delete" ON "form_drafts" AS PERMISSIVE FOR DELETE TO "atlas_public_forms_retention" USING ("form_drafts"."expires_at" <= statement_timestamp() and "form_drafts"."state" in ('active', 'expired'));--> statement-breakpoint
CREATE POLICY "form_field_definitions_gateway_published_select" ON "form_field_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING (exists (select 1 from form_definition_versions version where version.id = "form_field_definitions"."definition_version_id" and version.status = 'published' and version.audience = 'public'));--> statement-breakpoint
CREATE POLICY "form_field_definitions_staff_preview_select" ON "form_field_definitions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_outbox_gateway_select" ON "form_outbox" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_outbox"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_outbox_gateway_insert" ON "form_outbox" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_outbox"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_outbox_gateway_update" ON "form_outbox" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_outbox"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_outbox"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_outbox_staff_select" ON "form_outbox" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_responses_gateway_select" ON "form_responses" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_responses"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_responses_gateway_insert" ON "form_responses" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_responses"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_responses_gateway_update" ON "form_responses" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_responses"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_responses"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_responses_staff_select" ON "form_responses" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_submission_receipts_gateway_select" ON "form_submission_receipts" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_submission_receipts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submission_receipts_gateway_insert" ON "form_submission_receipts" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_submission_receipts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submission_receipts_gateway_update" ON "form_submission_receipts" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_submission_receipts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_submission_receipts"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submission_receipts_staff_select" ON "form_submission_receipts" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));--> statement-breakpoint
CREATE POLICY "form_submissions_gateway_select" ON "form_submissions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_gateway" USING ("form_submissions"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submissions_gateway_insert" ON "form_submissions" AS PERMISSIVE FOR INSERT TO "atlas_public_forms_gateway" WITH CHECK ("form_submissions"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submissions_gateway_update" ON "form_submissions" AS PERMISSIVE FOR UPDATE TO "atlas_public_forms_gateway" USING ("form_submissions"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), '')) WITH CHECK ("form_submissions"."scope_digest" = nullif(current_setting('atlas.public_forms_scope_digest', true), ''));--> statement-breakpoint
CREATE POLICY "form_submissions_staff_select" ON "form_submissions" AS PERMISSIVE FOR SELECT TO "atlas_public_forms_staff" USING (current_setting('atlas.staff_permission', true) in ('forms.review', 'forms.export', 'forms.definition_preview'));
ALTER TABLE "form_definitions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_definition_versions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_field_definitions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_submissions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_responses" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_consent_evidence" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_attribution" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_submission_receipts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_drafts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_outbox" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_audit_events" FORCE ROW LEVEL SECURITY;
