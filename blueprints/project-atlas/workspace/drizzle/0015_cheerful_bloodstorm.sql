CREATE TABLE "communication_provider_status_verifications" (
	"receipt_id" text PRIMARY KEY NOT NULL,
	"command_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"external_message_reference_digest" char(64) NOT NULL,
	"provider_event_id" text NOT NULL,
	"status" varchar(24) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"body_digest" char(64) NOT NULL,
	"correlation_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "communication_provider_status_verifications_connection_event_unique" UNIQUE("connection_id","provider_event_id"),
	CONSTRAINT "communication_provider_status_verifications_status_valid" CHECK ("communication_provider_status_verifications"."status" in ('sent', 'delivered', 'read', 'failed')),
	CONSTRAINT "communication_provider_status_verifications_digest_valid" CHECK ("communication_provider_status_verifications"."external_message_reference_digest" ~ '^[0-9a-f]{64}$' and "communication_provider_status_verifications"."body_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "communication_provider_status_verifications_identity_valid" CHECK ("communication_provider_status_verifications"."receipt_id" ~ '^provider_status_[0-9a-f]{32}$' and "communication_provider_status_verifications"."provider_event_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$' and "communication_provider_status_verifications"."correlation_id" ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'),
	CONSTRAINT "communication_provider_status_verifications_time_valid" CHECK ("communication_provider_status_verifications"."verified_at" >= "communication_provider_status_verifications"."occurred_at")
);
--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "communication_provider_status_verifications" FROM PUBLIC;--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "communication_provider_status_verifications" TO "atlas_communications_gateway";--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" ADD CONSTRAINT "communication_provider_status_verifications_command_connection_fk" FOREIGN KEY ("command_id","connection_id") REFERENCES "public"."communication_outbound_commands"("id","connection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" ADD CONSTRAINT "communication_provider_status_verifications_attempt_command_fk" FOREIGN KEY ("attempt_id","command_id") REFERENCES "public"."communication_dispatch_attempts"("id","command_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "communication_provider_status_verifications_read_scope" ON "communication_provider_status_verifications" AS PERMISSIVE FOR SELECT TO "atlas_communications_gateway" USING (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
  ));--> statement-breakpoint
CREATE POLICY "communication_provider_status_verifications_append_scope" ON "communication_provider_status_verifications" AS PERMISSIVE FOR INSERT TO "atlas_communications_gateway" WITH CHECK (exists (
    select 1 from communication_outbound_commands command
    where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
  ));
