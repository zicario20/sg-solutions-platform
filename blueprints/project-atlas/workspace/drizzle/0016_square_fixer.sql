CREATE ROLE "atlas_voice_operations";--> statement-breakpoint
CREATE TABLE "voice_artifacts" (
	"id" text NOT NULL,
	"call_id" text NOT NULL,
	"artifact_kind" varchar(16) NOT NULL,
	"state" varchar(24) NOT NULL,
	"reference_digest" char(64),
	"retention_class" varchar(24) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_artifacts_pk" PRIMARY KEY("call_id","id"),
	CONSTRAINT "voice_artifacts_kind_valid" CHECK ("voice_artifacts"."artifact_kind" in ('recording', 'transcript')),
	CONSTRAINT "voice_artifacts_state_valid" CHECK ("voice_artifacts"."state" in ('disabled', 'deletion_requested', 'deleted')),
	CONSTRAINT "voice_artifacts_reference_valid" CHECK ("voice_artifacts"."reference_digest" is null or "voice_artifacts"."reference_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "voice_artifacts_retention_valid" CHECK ("voice_artifacts"."retention_class" = 'disabled')
);
--> statement-breakpoint
ALTER TABLE "voice_artifacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_callback_requests" (
	"id" text NOT NULL,
	"call_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"state" varchar(16) NOT NULL,
	"owner_receipt_id" text,
	"correlation_id" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_callback_requests_pk" PRIMARY KEY("call_id","id"),
	CONSTRAINT "voice_callback_requests_call_idempotency_unique" UNIQUE("call_id","idempotency_key"),
	CONSTRAINT "voice_callback_requests_state_valid" CHECK ("voice_callback_requests"."state" in ('requested', 'queued', 'completed', 'cancelled', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "voice_callback_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"correlation_id" text NOT NULL,
	"provider_mode" varchar(16) NOT NULL,
	"provider_connection_id" text NOT NULL,
	"provider_call_reference_digest" char(64) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"lifecycle" varchar(24) NOT NULL,
	"verification_status" varchar(16) NOT NULL,
	"transfer_status" varchar(16) NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_calls_correlation_id_unique" UNIQUE("correlation_id"),
	CONSTRAINT "voice_calls_id_valid" CHECK ("voice_calls"."id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "voice_calls_correlation_valid" CHECK ("voice_calls"."correlation_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'),
	CONSTRAINT "voice_calls_provider_mode_valid" CHECK ("voice_calls"."provider_mode" = 'mock'),
	CONSTRAINT "voice_calls_provider_digest_valid" CHECK ("voice_calls"."provider_call_reference_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "voice_calls_locale_valid" CHECK ("voice_calls"."locale" in ('es', 'en')),
	CONSTRAINT "voice_calls_lifecycle_valid" CHECK ("voice_calls"."lifecycle" in ('received', 'greeting', 'language_selected', 'routing', 'active', 'handoff', 'voicemail', 'callback_pending', 'completed', 'failed')),
	CONSTRAINT "voice_calls_verification_valid" CHECK ("voice_calls"."verification_status" in ('unverified', 'pending', 'verified', 'failed', 'expired', 'locked')),
	CONSTRAINT "voice_calls_transfer_valid" CHECK ("voice_calls"."transfer_status" in ('none', 'requested', 'queued', 'connected', 'unavailable', 'completed')),
	CONSTRAINT "voice_calls_version_positive" CHECK ("voice_calls"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "voice_calls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_command_receipts" (
	"receipt_id" text PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"command_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" varchar(48) NOT NULL,
	"state" varchar(16) NOT NULL,
	"result_kind" varchar(32),
	"result_code" varchar(48),
	"issued_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_command_receipts_call_command_unique" UNIQUE("call_id","command_id"),
	CONSTRAINT "voice_command_receipts_call_idempotency_unique" UNIQUE("call_id","idempotency_key"),
	CONSTRAINT "voice_command_receipts_state_valid" CHECK ("voice_command_receipts"."state" in ('reserved', 'completed', 'failed')),
	CONSTRAINT "voice_command_receipts_result_valid" CHECK (("voice_command_receipts"."state" = 'reserved' and "voice_command_receipts"."result_kind" is null and "voice_command_receipts"."completed_at" is null) or ("voice_command_receipts"."state" in ('completed', 'failed') and "voice_command_receipts"."result_kind" is not null and "voice_command_receipts"."completed_at" >= "voice_command_receipts"."issued_at"))
);
--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_escalations" (
	"id" text NOT NULL,
	"call_id" text NOT NULL,
	"kind" varchar(16) NOT NULL,
	"state" varchar(16) NOT NULL,
	"reason_code" varchar(40) NOT NULL,
	"owner_receipt_id" text,
	"correlation_id" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_escalations_pk" PRIMARY KEY("call_id","id"),
	CONSTRAINT "voice_escalations_kind_valid" CHECK ("voice_escalations"."kind" in ('transfer', 'voicemail', 'message', 'callback')),
	CONSTRAINT "voice_escalations_state_valid" CHECK ("voice_escalations"."state" in ('requested', 'queued', 'completed', 'unavailable', 'failed')),
	CONSTRAINT "voice_escalations_completion_valid" CHECK ("voice_escalations"."completed_at" is null or "voice_escalations"."completed_at" >= "voice_escalations"."requested_at")
);
--> statement-breakpoint
ALTER TABLE "voice_escalations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_interactions" (
	"id" text NOT NULL,
	"call_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"operation" varchar(48) NOT NULL,
	"outcome" varchar(32) NOT NULL,
	"locale" varchar(2) NOT NULL,
	"correlation_id" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_interactions_pk" PRIMARY KEY("call_id","id"),
	CONSTRAINT "voice_interactions_call_ordinal_unique" UNIQUE("call_id","ordinal"),
	CONSTRAINT "voice_interactions_ordinal_positive" CHECK ("voice_interactions"."ordinal" > 0),
	CONSTRAINT "voice_interactions_locale_valid" CHECK ("voice_interactions"."locale" in ('es', 'en')),
	CONSTRAINT "voice_interactions_outcome_valid" CHECK ("voice_interactions"."outcome" in ('allowed', 'denied', 'verification_required', 'confirmation_required', 'handoff', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "voice_interactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "voice_verification_attempts" (
	"id" text NOT NULL,
	"call_id" text NOT NULL,
	"status" varchar(16) NOT NULL,
	"method" varchar(24) NOT NULL,
	"receipt_digest" char(64),
	"failure_class" varchar(32),
	"attempted_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "voice_verification_attempts_pk" PRIMARY KEY("call_id","id"),
	CONSTRAINT "voice_verification_attempts_status_valid" CHECK ("voice_verification_attempts"."status" in ('pending', 'verified', 'failed', 'expired', 'locked')),
	CONSTRAINT "voice_verification_attempts_method_valid" CHECK ("voice_verification_attempts"."method" in ('platform_record', 'one_time_challenge')),
	CONSTRAINT "voice_verification_attempts_digest_valid" CHECK ("voice_verification_attempts"."receipt_digest" is null or "voice_verification_attempts"."receipt_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "voice_verification_attempts_window_valid" CHECK ("voice_verification_attempts"."expires_at" is null or "voice_verification_attempts"."expires_at" > "voice_verification_attempts"."attempted_at")
);
--> statement-breakpoint
ALTER TABLE "voice_verification_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_artifacts" ADD CONSTRAINT "voice_artifacts_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_callback_requests" ADD CONSTRAINT "voice_callback_requests_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_command_receipts" ADD CONSTRAINT "voice_command_receipts_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_escalations" ADD CONSTRAINT "voice_escalations_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_interactions" ADD CONSTRAINT "voice_interactions_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_verification_attempts" ADD CONSTRAINT "voice_verification_attempts_call_id_voice_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."voice_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voice_calls_lifecycle_idx" ON "voice_calls" USING btree ("lifecycle","updated_at");--> statement-breakpoint
CREATE INDEX "voice_escalations_state_idx" ON "voice_escalations" USING btree ("state","updated_at");--> statement-breakpoint
CREATE POLICY "voice_artifacts_voice_operations_only" ON "voice_artifacts" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_callback_requests_voice_operations_only" ON "voice_callback_requests" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_calls_voice_operations_only" ON "voice_calls" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_command_receipts_voice_operations_only" ON "voice_command_receipts" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_escalations_voice_operations_only" ON "voice_escalations" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_interactions_voice_operations_only" ON "voice_interactions" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "voice_verification_attempts_voice_operations_only" ON "voice_verification_attempts" AS PERMISSIVE FOR ALL TO "atlas_voice_operations" USING (true) WITH CHECK (true);