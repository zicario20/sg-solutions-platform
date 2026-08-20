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
  CONSTRAINT "communication_provider_status_verifications_connection_event_unique" UNIQUE("connection_id", "provider_event_id"),
  CONSTRAINT "communication_provider_status_verifications_status_valid" CHECK ("status" in ('sent', 'delivered', 'read', 'failed')),
  CONSTRAINT "communication_provider_status_verifications_digest_valid" CHECK ("external_message_reference_digest" ~ '^[0-9a-f]{64}$' and "body_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "communication_provider_status_verifications_command_fk" FOREIGN KEY ("command_id") REFERENCES "communication_outbound_commands"("id") ON DELETE cascade,
  CONSTRAINT "communication_provider_status_verifications_attempt_fk" FOREIGN KEY ("attempt_id") REFERENCES "communication_dispatch_attempts"("id") ON DELETE cascade,
  CONSTRAINT "communication_provider_status_verifications_connection_fk" FOREIGN KEY ("connection_id") REFERENCES "communication_channel_connections"("id") ON DELETE restrict
);
--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_provider_status_verifications" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "communication_provider_status_verifications" FROM PUBLIC;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "communication_provider_status_verifications" TO "atlas_communications_gateway";
--> statement-breakpoint
CREATE POLICY "communication_provider_status_verifications_communications_scope" ON "communication_provider_status_verifications" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
  select 1 from communication_outbound_commands command
  where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
)) WITH CHECK (exists (
  select 1 from communication_outbound_commands command
  where command.id = "communication_provider_status_verifications"."command_id" and command.channel_kind = 'whatsapp'
));
