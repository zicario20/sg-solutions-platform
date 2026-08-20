# Task 8 fix round 1

## Commits
6e9016f fix(database): harden communications repository parity

## Stat
 .../0010_m004_communications_canonical_cutover.sql |   39 +-
 .../0011_m004_receipt_security_hardening.sql       |   44 +
 .../workspace/drizzle/meta/0010_snapshot.json      |   66 +-
 .../workspace/drizzle/meta/0011_snapshot.json      | 4253 ++++++++++++++++++++
 .../workspace/drizzle/meta/_journal.json           |    9 +-
 .../database/src/postgres-communications-store.ts  |  467 ++-
 .../workspace/packages/database/src/schema.ts      |   44 +-
 .../domain/src/communications/channel-policy.ts    |    4 +
 .../domain/src/communications/memory-repository.ts |   68 +-
 .../tests/m004/communications-concurrency.test.ts  |   14 +-
 .../communications-postgres.integration.test.ts    |   15 +-
 .../tests/m004/communications-repository.test.ts   |   49 +
 .../tests/m004/communications-schema.test.ts       |   10 +-
 .../tests/m004/communications-service.test.ts      |    2 +-
 .../communications-repository-conformance.ts       |  291 +-
 15 files changed, 5150 insertions(+), 225 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql b/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
index 7257254..24dda86 100644
--- a/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
+++ b/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
@@ -4,22 +4,22 @@ CREATE TABLE "communication_dispatch_reconciliation_receipts" (
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
-	CONSTRAINT "communication_dispatch_reconciliation_receipts_source_valid" CHECK ("communication_dispatch_reconciliation_receipts"."source" in ('provider_lookup', 'provider_status', 'manual_attestation')),
-	CONSTRAINT "communication_dispatch_reconciliation_receipts_outcome_valid" CHECK ("communication_dispatch_reconciliation_receipts"."outcome" in ('accepted', 'confirmed_not_sent', 'failed')),
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_source_valid" CHECK ("communication_dispatch_reconciliation_receipts"."source" in ('provider_lookup', 'manual_authority')),
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_outcome_valid" CHECK ("communication_dispatch_reconciliation_receipts"."outcome" in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')),
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
@@ -29,66 +29,91 @@ CREATE TABLE "communication_provider_status_receipts" (
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
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_authority_valid";--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" DROP CONSTRAINT "communication_contact_evidence_events_state_shape_valid";--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_version_positive";--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_fingerprint_valid";--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_policy_version_positive";--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid";--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_destination_reference_opaque";--> statement-breakpoint
 ALTER TABLE "public_chat_citations" DROP CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk";
 --> statement-breakpoint
 ALTER TABLE "public_chat_idempotency" DROP CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk";
 --> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_id" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_domain" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_reference" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_issued_at" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_valid_until" DROP NOT NULL;--> statement-breakpoint
-ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_correlation_id" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "expected_policy_version" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ALTER COLUMN "fingerprint" DROP NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_contact_policies" ADD COLUMN "fence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_owner_hash" char(64) NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_version" integer NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "provider_reference_digest" char(64);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "message_body_digest" char(64) NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_operation" varchar(80);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_binding_id" text;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "owning_destination_key" varchar(120);--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD COLUMN "required_fence" integer;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD COLUMN "endpoint_digests" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD COLUMN "failure_code" varchar(64);--> statement-breakpoint
 ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_attempt_command_fk" FOREIGN KEY ("attempt_id","command_id") REFERENCES "public"."communication_dispatch_attempts"("id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
 ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_command_binding_fk" FOREIGN KEY ("command_id","binding_id") REFERENCES "public"."communication_outbound_commands"("id","binding_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
 ALTER TABLE "communication_provider_status_receipts" ADD CONSTRAINT "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."communication_outbound_commands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
 ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_message_id_communication_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."communication_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
 ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_conversation_id_communication_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."communication_conversations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP COLUMN "owning_receipt_correlation_id";--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_id_command_unique" UNIQUE("id","command_id");--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_id_binding_unique" UNIQUE("id","binding_id");--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_authority_valid" CHECK (("communication_contact_evidence_events"."event_kind" in ('consent_granted', 'consent_regranted') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'consent') or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."authority_role" = 'channel_policy_detection'))) or ("communication_contact_evidence_events"."event_kind" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and "communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."authority_role" = 'contact_review') or ("communication_contact_evidence_events"."event_kind" in ('binding_suspended', 'binding_revalidated') and "communication_contact_evidence_events"."authority_role" = 'binding_verification'));--> statement-breakpoint
+ALTER TABLE "communication_contact_evidence_events" ADD CONSTRAINT "communication_contact_evidence_events_state_shape_valid" CHECK (("communication_contact_evidence_events"."event_kind" = 'consent_granted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_regranted' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'consent_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null and (("communication_contact_evidence_events"."owning_domain" = 'M078' and "communication_contact_evidence_events"."triggering_event_id" is null) or ("communication_contact_evidence_events"."owning_domain" = 'M004' and "communication_contact_evidence_events"."triggering_event_id" is not null)) and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_detected' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'opt_out_pending' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_cleared' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'granted' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'normal_after_review' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'clear' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'ambiguous_opt_out_withdrawn' and "communication_contact_evidence_events"."purpose" is not null and "communication_contact_evidence_events"."consent_state" is not null and "communication_contact_evidence_events"."consent_state" = 'withdrawn' and "communication_contact_evidence_events"."fence_state" is not null and "communication_contact_evidence_events"."fence_state" = 'withdrawn' and "communication_contact_evidence_events"."authority_version" is not null and "communication_contact_evidence_events"."authority_version" > 0 and "communication_contact_evidence_events"."review_resolution" is not null and "communication_contact_evidence_events"."review_resolution" = 'withdraw' and "communication_contact_evidence_events"."triggering_event_id" is not null and "communication_contact_evidence_events"."policy_version" is not null and "communication_contact_evidence_events"."binding_trust_state" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_suspended' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'suspended' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null) or ("communication_contact_evidence_events"."event_kind" = 'binding_revalidated' and "communication_contact_evidence_events"."binding_trust_state" is not null and "communication_contact_evidence_events"."binding_trust_state" = 'reverified' and "communication_contact_evidence_events"."purpose" is null and "communication_contact_evidence_events"."consent_state" is null and "communication_contact_evidence_events"."fence_state" is null and "communication_contact_evidence_events"."review_resolution" is null and "communication_contact_evidence_events"."authority_version" is null and "communication_contact_evidence_events"."triggering_event_id" is null and "communication_contact_evidence_events"."policy_version" is null));--> statement-breakpoint
 ALTER TABLE "communication_contact_policies" ADD CONSTRAINT "communication_contact_policies_fence_nonnegative" CHECK ("communication_contact_policies"."fence" >= 0);--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_owner_hash_valid" CHECK ("communication_dispatch_attempts"."lease_owner_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_version_positive" CHECK ("communication_dispatch_attempts"."lease_version" > 0);--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_window_valid" CHECK ("communication_dispatch_attempts"."lease_expires_at" > "communication_dispatch_attempts"."started_at");--> statement-breakpoint
 ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_provider_reference_digest_valid" CHECK ("communication_dispatch_attempts"."provider_reference_digest" is null or "communication_dispatch_attempts"."provider_reference_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_message_body_digest_valid" CHECK ("communication_outbound_commands"."message_body_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_lease_owner_hash_valid" CHECK ("communication_outbound_commands"."lease_owner_id" is null or "communication_outbound_commands"."lease_owner_id" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_required_fence_valid" CHECK ("communication_outbound_commands"."required_fence" is null or "communication_outbound_commands"."required_fence" >= 0);--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_endpoint_digests_valid" CHECK (jsonb_typeof("communication_outbound_commands"."endpoint_digests") = 'array');--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_version_nonnegative" CHECK ("communication_outbound_commands"."version" >= 0);--> statement-breakpoint
-ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_finalization_valid" CHECK ("communication_outbound_commands"."state" = 'draft' or ("communication_outbound_commands"."fingerprint" is not null and "communication_outbound_commands"."expected_policy_version" is not null and "communication_outbound_commands"."required_fence" is not null and "communication_outbound_commands"."owning_receipt_id" is not null));--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_finalization_valid" CHECK ("communication_outbound_commands"."state" = 'draft' or ("communication_outbound_commands"."fingerprint" is not null and "communication_outbound_commands"."expected_policy_version" is not null and "communication_outbound_commands"."required_fence" is not null and "communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."destination_key" is not null));--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_destination_valid" CHECK ("communication_outbound_commands"."owning_destination_key" is null or "communication_outbound_commands"."owning_destination_key" ~ '^endpoint_ref:[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_reference_valid" CHECK ("communication_outbound_commands"."owning_reference" is null or "communication_outbound_commands"."owning_reference" ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$');--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_fingerprint_valid" CHECK ("communication_outbound_commands"."fingerprint" is null or "communication_outbound_commands"."fingerprint" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
 ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_policy_version_positive" CHECK ("communication_outbound_commands"."expected_policy_version" is null or "communication_outbound_commands"."expected_policy_version" > 0);--> statement-breakpoint
-ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK (("communication_outbound_commands"."owning_receipt_id" is null and "communication_outbound_commands"."owning_domain" is null and "communication_outbound_commands"."owning_reference" is null and "communication_outbound_commands"."owning_receipt_issued_at" is null and "communication_outbound_commands"."owning_receipt_valid_until" is null and "communication_outbound_commands"."owning_receipt_correlation_id" is null) or ("communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."owning_domain" is not null and "communication_outbound_commands"."owning_reference" is not null and "communication_outbound_commands"."owning_receipt_issued_at" is not null and "communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at" and "communication_outbound_commands"."owning_receipt_correlation_id" is not null));--> statement-breakpoint
-CREATE POLICY "communication_dispatch_reconciliation_receipts_communications_scope" ON "communication_dispatch_reconciliation_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
-CREATE POLICY "communication_provider_status_receipts_communications_scope" ON "communication_provider_status_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK (("communication_outbound_commands"."owning_receipt_id" is null and "communication_outbound_commands"."owning_domain" is null and "communication_outbound_commands"."owning_operation" is null and "communication_outbound_commands"."owning_reference" is null and "communication_outbound_commands"."owning_binding_id" is null and "communication_outbound_commands"."owning_destination_key" is null and "communication_outbound_commands"."owning_receipt_issued_at" is null and "communication_outbound_commands"."owning_receipt_valid_until" is null) or ("communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."owning_domain" = 'communications' and "communication_outbound_commands"."owning_operation" = 'outbound_dispatch' and "communication_outbound_commands"."owning_reference" is not null and "communication_outbound_commands"."owning_binding_id" = "communication_outbound_commands"."binding_id" and "communication_outbound_commands"."owning_destination_key" = "communication_outbound_commands"."destination_key" and "communication_outbound_commands"."owning_receipt_issued_at" is not null and "communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at"));--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_destination_reference_opaque" CHECK ("communication_outbound_commands"."destination_key" is null or "communication_outbound_commands"."destination_key" ~ '^endpoint_ref:[0-9a-f]{64}$');--> statement-breakpoint
+CREATE POLICY "communication_dispatch_reconciliation_receipts_communications_scope" ON "communication_dispatch_reconciliation_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
+    select 1 from communication_outbound_commands command
+    where command.id = "communication_dispatch_reconciliation_receipts"."command_id" and command.channel_kind = 'whatsapp'
+  )) WITH CHECK (exists (
+    select 1 from communication_outbound_commands command
+    where command.id = "communication_dispatch_reconciliation_receipts"."command_id" and command.channel_kind = 'whatsapp'
+  ));--> statement-breakpoint
+CREATE POLICY "communication_provider_status_receipts_communications_scope" ON "communication_provider_status_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (exists (
+    select 1 from communication_outbound_commands command
+    where command.id = "communication_provider_status_receipts"."command_id" and command.channel_kind = 'whatsapp'
+  )) WITH CHECK (exists (
+    select 1 from communication_outbound_commands command
+    where command.id = "communication_provider_status_receipts"."command_id" and command.channel_kind = 'whatsapp'
+  ));--> statement-breakpoint
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
diff --git a/blueprints/project-atlas/workspace/drizzle/0011_m004_receipt_security_hardening.sql b/blueprints/project-atlas/workspace/drizzle/0011_m004_receipt_security_hardening.sql
new file mode 100644
index 0000000..25b9bc7
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0011_m004_receipt_security_hardening.sql
@@ -0,0 +1,44 @@
+-- Custom SQL migration file, put your code below! --
+-- Drizzle custom migration generated with:
+-- drizzle-kit generate --custom --name m004_receipt_security_hardening
+--
+-- The structural migration owns tables and policies. This forward-only security migration
+-- matches the 0008 FORCE-RLS and least-privilege grant boundary for both new receipt tables.
+
+ALTER TABLE "communication_provider_status_receipts" ENABLE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_provider_status_receipts" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_dispatch_reconciliation_receipts" ENABLE ROW LEVEL SECURITY;
+--> statement-breakpoint
+ALTER TABLE "communication_dispatch_reconciliation_receipts" FORCE ROW LEVEL SECURITY;
+--> statement-breakpoint
+REVOKE ALL ON TABLE "communication_provider_status_receipts" FROM PUBLIC;
+--> statement-breakpoint
+REVOKE ALL ON TABLE "communication_dispatch_reconciliation_receipts" FROM PUBLIC;
+--> statement-breakpoint
+DO $$
+DECLARE runtime_role text; receipt_table text;
+BEGIN
+  FOREACH runtime_role IN ARRAY ARRAY['anon', 'authenticated', 'atlas_migration_runtime'] LOOP
+    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = runtime_role) THEN
+      FOREACH receipt_table IN ARRAY ARRAY[
+        'communication_provider_status_receipts',
+        'communication_dispatch_reconciliation_receipts'
+      ] LOOP
+        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', receipt_table, runtime_role);
+      END LOOP;
+    END IF;
+  END LOOP;
+END
+$$;
+--> statement-breakpoint
+REVOKE ALL ON TABLE
+  "communication_provider_status_receipts",
+  "communication_dispatch_reconciliation_receipts"
+FROM atlas_public_chat_gateway, atlas_communications_gateway;
+--> statement-breakpoint
+GRANT SELECT, INSERT ON TABLE
+  "communication_provider_status_receipts",
+  "communication_dispatch_reconciliation_receipts"
+TO atlas_communications_gateway;
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
index 308d94b..b0bdef5 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
@@ -1,12 +1,12 @@
 {
-  "id": "c25cd908-8421-4dcb-8a56-cc878dba93ca",
+  "id": "f3059842-cf8e-4f86-8c02-aba75131830b",
   "prevId": "98d57ab8-2fc0-47a1-a3c7-9d142c00c120",
   "version": "7",
   "dialect": "postgresql",
   "tables": {
     "public.communication_audit_events": {
       "name": "communication_audit_events",
       "schema": "",
       "columns": {
         "id": {
           "name": "id",
@@ -798,29 +798,29 @@
           "withCheck": "true"
         }
       },
       "checkConstraints": {
         "communication_contact_evidence_events_kind_valid": {
           "name": "communication_contact_evidence_events_kind_valid",
           "value": "\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')"
         },
         "communication_contact_evidence_events_authority_valid": {
           "name": "communication_contact_evidence_events_authority_valid",
-          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"authority_role\" = 'channel_policy_detection'))) or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
         },
         "communication_contact_evidence_events_receipt_valid": {
           "name": "communication_contact_evidence_events_receipt_valid",
           "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
         },
         "communication_contact_evidence_events_state_shape_valid": {
           "name": "communication_contact_evidence_events_state_shape_valid",
-          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"triggering_event_id\" is null) or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null)) and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
         },
         "communication_contact_evidence_events_sequence_positive": {
           "name": "communication_contact_evidence_events_sequence_positive",
           "value": "\"communication_contact_evidence_events\".\"sequence\" > 0"
         },
         "communication_contact_evidence_events_receipt_window_valid": {
           "name": "communication_contact_evidence_events_receipt_window_valid",
           "value": "(\"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"receipt_issued_at\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" > \"communication_contact_evidence_events\".\"receipt_issued_at\")"
         }
       },
@@ -1591,36 +1591,36 @@
       "compositePrimaryKeys": {},
       "uniqueConstraints": {},
       "policies": {
         "communication_dispatch_reconciliation_receipts_communications_scope": {
           "name": "communication_dispatch_reconciliation_receipts_communications_scope",
           "as": "PERMISSIVE",
           "for": "ALL",
           "to": [
             "atlas_communications_gateway"
           ],
-          "using": "true",
-          "withCheck": "true"
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
         }
       },
       "checkConstraints": {
         "communication_dispatch_reconciliation_receipts_digest_valid": {
           "name": "communication_dispatch_reconciliation_receipts_digest_valid",
           "value": "\"communication_dispatch_reconciliation_receipts\".\"receipt_digest\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_dispatch_reconciliation_receipts_source_valid": {
           "name": "communication_dispatch_reconciliation_receipts_source_valid",
-          "value": "\"communication_dispatch_reconciliation_receipts\".\"source\" in ('provider_lookup', 'provider_status', 'manual_attestation')"
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"source\" in ('provider_lookup', 'manual_authority')"
         },
         "communication_dispatch_reconciliation_receipts_outcome_valid": {
           "name": "communication_dispatch_reconciliation_receipts_outcome_valid",
-          "value": "\"communication_dispatch_reconciliation_receipts\".\"outcome\" in ('accepted', 'confirmed_not_sent', 'failed')"
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"outcome\" in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')"
         },
         "communication_dispatch_reconciliation_receipts_window_valid": {
           "name": "communication_dispatch_reconciliation_receipts_window_valid",
           "value": "\"communication_dispatch_reconciliation_receipts\".\"expires_at\" > \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" >= \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" < \"communication_dispatch_reconciliation_receipts\".\"expires_at\""
         }
       },
       "isRLSEnabled": true
     },
     "public.communication_event_envelopes": {
       "name": "communication_event_envelopes",
@@ -2755,56 +2755,74 @@
           "type": "varchar(80)",
           "primaryKey": false,
           "notNull": false
         },
         "destination_key": {
           "name": "destination_key",
           "type": "varchar(120)",
           "primaryKey": false,
           "notNull": false
         },
+        "message_body_digest": {
+          "name": "message_body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
         "owning_receipt_id": {
           "name": "owning_receipt_id",
           "type": "text",
           "primaryKey": false,
           "notNull": false
         },
         "owning_domain": {
           "name": "owning_domain",
           "type": "varchar(80)",
           "primaryKey": false,
           "notNull": false
         },
+        "owning_operation": {
+          "name": "owning_operation",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
         "owning_reference": {
           "name": "owning_reference",
           "type": "text",
           "primaryKey": false,
           "notNull": false
         },
+        "owning_binding_id": {
+          "name": "owning_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_destination_key": {
+          "name": "owning_destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
         "owning_receipt_issued_at": {
           "name": "owning_receipt_issued_at",
           "type": "timestamp with time zone",
           "primaryKey": false,
           "notNull": false
         },
         "owning_receipt_valid_until": {
           "name": "owning_receipt_valid_until",
           "type": "timestamp with time zone",
           "primaryKey": false,
           "notNull": false
         },
-        "owning_receipt_correlation_id": {
-          "name": "owning_receipt_correlation_id",
-          "type": "text",
-          "primaryKey": false,
-          "notNull": false
-        },
         "expected_policy_version": {
           "name": "expected_policy_version",
           "type": "integer",
           "primaryKey": false,
           "notNull": false
         },
         "required_fence": {
           "name": "required_fence",
           "type": "integer",
           "primaryKey": false,
@@ -3000,20 +3018,24 @@
       },
       "checkConstraints": {
         "communication_outbound_commands_channel_valid": {
           "name": "communication_outbound_commands_channel_valid",
           "value": "\"communication_outbound_commands\".\"channel_kind\" = 'whatsapp'"
         },
         "communication_outbound_commands_fingerprint_valid": {
           "name": "communication_outbound_commands_fingerprint_valid",
           "value": "\"communication_outbound_commands\".\"fingerprint\" is null or \"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
         },
+        "communication_outbound_commands_message_body_digest_valid": {
+          "name": "communication_outbound_commands_message_body_digest_valid",
+          "value": "\"communication_outbound_commands\".\"message_body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
         "communication_outbound_commands_lease_token_hash_valid": {
           "name": "communication_outbound_commands_lease_token_hash_valid",
           "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_outbound_commands_lease_owner_hash_valid": {
           "name": "communication_outbound_commands_lease_owner_hash_valid",
           "value": "\"communication_outbound_commands\".\"lease_owner_id\" is null or \"communication_outbound_commands\".\"lease_owner_id\" ~ '^[0-9a-f]{64}$'"
         },
         "communication_outbound_commands_locale_valid": {
           "name": "communication_outbound_commands_locale_valid",
@@ -3038,29 +3060,37 @@
         "communication_outbound_commands_endpoint_digests_valid": {
           "name": "communication_outbound_commands_endpoint_digests_valid",
           "value": "jsonb_typeof(\"communication_outbound_commands\".\"endpoint_digests\") = 'array'"
         },
         "communication_outbound_commands_version_nonnegative": {
           "name": "communication_outbound_commands_version_nonnegative",
           "value": "\"communication_outbound_commands\".\"version\" >= 0"
         },
         "communication_outbound_commands_owning_receipt_window_valid": {
           "name": "communication_outbound_commands_owning_receipt_window_valid",
-          "value": "(\"communication_outbound_commands\".\"owning_receipt_id\" is null and \"communication_outbound_commands\".\"owning_domain\" is null and \"communication_outbound_commands\".\"owning_reference\" is null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" is null and \"communication_outbound_commands\".\"owning_receipt_correlation_id\" is null) or (\"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"owning_domain\" is not null and \"communication_outbound_commands\".\"owning_reference\" is not null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is not null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\" and \"communication_outbound_commands\".\"owning_receipt_correlation_id\" is not null)"
+          "value": "(\"communication_outbound_commands\".\"owning_receipt_id\" is null and \"communication_outbound_commands\".\"owning_domain\" is null and \"communication_outbound_commands\".\"owning_operation\" is null and \"communication_outbound_commands\".\"owning_reference\" is null and \"communication_outbound_commands\".\"owning_binding_id\" is null and \"communication_outbound_commands\".\"owning_destination_key\" is null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" is null) or (\"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"owning_domain\" = 'communications' and \"communication_outbound_commands\".\"owning_operation\" = 'outbound_dispatch' and \"communication_outbound_commands\".\"owning_reference\" is not null and \"communication_outbound_commands\".\"owning_binding_id\" = \"communication_outbound_commands\".\"binding_id\" and \"communication_outbound_commands\".\"owning_destination_key\" = \"communication_outbound_commands\".\"destination_key\" and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is not null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\")"
         },
         "communication_outbound_commands_finalization_valid": {
           "name": "communication_outbound_commands_finalization_valid",
-          "value": "\"communication_outbound_commands\".\"state\" = 'draft' or (\"communication_outbound_commands\".\"fingerprint\" is not null and \"communication_outbound_commands\".\"expected_policy_version\" is not null and \"communication_outbound_commands\".\"required_fence\" is not null and \"communication_outbound_commands\".\"owning_receipt_id\" is not null)"
+          "value": "\"communication_outbound_commands\".\"state\" = 'draft' or (\"communication_outbound_commands\".\"fingerprint\" is not null and \"communication_outbound_commands\".\"expected_policy_version\" is not null and \"communication_outbound_commands\".\"required_fence\" is not null and \"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"destination_key\" is not null)"
         },
         "communication_outbound_commands_destination_reference_opaque": {
           "name": "communication_outbound_commands_destination_reference_opaque",
-          "value": "\"communication_outbound_commands\".\"destination_key\" is null or (char_length(\"communication_outbound_commands\".\"destination_key\") <= 120 and \"communication_outbound_commands\".\"destination_key\" ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')"
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or \"communication_outbound_commands\".\"destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_destination_valid": {
+          "name": "communication_outbound_commands_owning_destination_valid",
+          "value": "\"communication_outbound_commands\".\"owning_destination_key\" is null or \"communication_outbound_commands\".\"owning_destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_reference_valid": {
+          "name": "communication_outbound_commands_owning_reference_valid",
+          "value": "\"communication_outbound_commands\".\"owning_reference\" is null or \"communication_outbound_commands\".\"owning_reference\" ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'"
         },
         "communication_outbound_commands_lease_valid": {
           "name": "communication_outbound_commands_lease_valid",
           "value": "(\"communication_outbound_commands\".\"lease_owner_id\" is null and \"communication_outbound_commands\".\"lease_token_hash\" is null and \"communication_outbound_commands\".\"lease_expires_at\" is null) or (\"communication_outbound_commands\".\"lease_owner_id\" is not null and \"communication_outbound_commands\".\"lease_token_hash\" is not null and \"communication_outbound_commands\".\"lease_expires_at\" is not null)"
         },
         "communication_outbound_commands_expiry_valid": {
           "name": "communication_outbound_commands_expiry_valid",
           "value": "\"communication_outbound_commands\".\"expires_at\" is null or \"communication_outbound_commands\".\"expires_at\" > \"communication_outbound_commands\".\"created_at\""
         }
       },
@@ -3560,22 +3590,22 @@
       },
       "uniqueConstraints": {},
       "policies": {
         "communication_provider_status_receipts_communications_scope": {
           "name": "communication_provider_status_receipts_communications_scope",
           "as": "PERMISSIVE",
           "for": "ALL",
           "to": [
             "atlas_communications_gateway"
           ],
-          "using": "true",
-          "withCheck": "true"
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
         }
       },
       "checkConstraints": {
         "communication_provider_status_receipts_status_valid": {
           "name": "communication_provider_status_receipts_status_valid",
           "value": "\"communication_provider_status_receipts\".\"status\" in ('sent', 'delivered', 'read', 'failed')"
         }
       },
       "isRLSEnabled": true
     },
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0011_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0011_snapshot.json
new file mode 100644
index 0000000..60eebba
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0011_snapshot.json
@@ -0,0 +1,4253 @@
+{
+  "id": "5beca9d4-9d6f-4d1c-9b1e-cd24552e7761",
+  "prevId": "f3059842-cf8e-4f86-8c02-aba75131830b",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.communication_audit_events": {
+      "name": "communication_audit_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_type": {
+          "name": "aggregate_type",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "aggregate_id": {
+          "name": "aggregate_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_audit_events_aggregate_idx": {
+          "name": "communication_audit_events_aggregate_idx",
+          "columns": [
+            {
+              "expression": "aggregate_type",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "aggregate_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_audit_events_conversation_channel_fk": {
+          "name": "communication_audit_events_conversation_channel_fk",
+          "tableFrom": "communication_audit_events",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_audit_events_conversation_sequence_unique": {
+          "name": "communication_audit_events_conversation_sequence_unique",
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_audit_events_public_chat_scope": {
+          "name": "communication_audit_events_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_audit_events\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_audit_events_communications_scope": {
+          "name": "communication_audit_events_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_audit_events\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_audit_events_channel_valid": {
+          "name": "communication_audit_events_channel_valid",
+          "value": "\"communication_audit_events\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_audit_events_sequence_positive": {
+          "name": "communication_audit_events_sequence_positive",
+          "value": "\"communication_audit_events\".\"sequence\" > 0"
+        },
+        "communication_audit_events_locale_valid": {
+          "name": "communication_audit_events_locale_valid",
+          "value": "\"communication_audit_events\".\"locale\" is null or \"communication_audit_events\".\"locale\" in ('es', 'en')"
+        },
+        "communication_audit_events_purpose_valid": {
+          "name": "communication_audit_events_purpose_valid",
+          "value": "\"communication_audit_events\".\"purpose\" is null or \"communication_audit_events\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_audit_events_aggregate_valid": {
+          "name": "communication_audit_events_aggregate_valid",
+          "value": "\"communication_audit_events\".\"aggregate_type\" in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')"
+        },
+        "communication_audit_events_result_valid": {
+          "name": "communication_audit_events_result_valid",
+          "value": "\"communication_audit_events\".\"result_code\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')"
+        },
+        "communication_audit_events_version_positive": {
+          "name": "communication_audit_events_version_positive",
+          "value": "\"communication_audit_events\".\"version\" > 0"
+        },
+        "communication_audit_events_policy_version_positive": {
+          "name": "communication_audit_events_policy_version_positive",
+          "value": "\"communication_audit_events\".\"policy_version\" is null or \"communication_audit_events\".\"policy_version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_channel_connections": {
+      "name": "communication_channel_connections",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "adapter_key": {
+          "name": "adapter_key",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "readiness_state": {
+          "name": "readiness_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "configured_at": {
+          "name": "configured_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verified_at": {
+          "name": "verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_channel_connections_readiness_idx": {
+          "name": "communication_channel_connections_readiness_idx",
+          "columns": [
+            {
+              "expression": "readiness_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_channel_connections_id_channel_unique": {
+          "name": "communication_channel_connections_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_channel_connections_communications_scope": {
+          "name": "communication_channel_connections_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_channel_connections_channel_valid": {
+          "name": "communication_channel_connections_channel_valid",
+          "value": "\"communication_channel_connections\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_channel_connections_adapter_valid": {
+          "name": "communication_channel_connections_adapter_valid",
+          "value": "\"communication_channel_connections\".\"adapter_key\" = 'meta_cloud'"
+        },
+        "communication_channel_connections_readiness_valid": {
+          "name": "communication_channel_connections_readiness_valid",
+          "value": "\"communication_channel_connections\".\"readiness_state\" in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')"
+        },
+        "communication_channel_connections_version_positive": {
+          "name": "communication_channel_connections_version_positive",
+          "value": "\"communication_channel_connections\".\"version\" > 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_bindings": {
+      "name": "communication_contact_bindings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest": {
+          "name": "endpoint_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "endpoint_digest_key_version": {
+          "name": "endpoint_digest_key_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "trust_state": {
+          "name": "trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "contact_policy_version": {
+          "name": "contact_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "verification_receipt_id": {
+          "name": "verification_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_verified_at": {
+          "name": "endpoint_verified_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "verification_expires_at": {
+          "name": "verification_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "wrong_person_reported_at": {
+          "name": "wrong_person_reported_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reassignment_risk_at": {
+          "name": "reassignment_risk_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "suspended_at": {
+          "name": "suspended_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_bindings_trust_idx": {
+          "name": "communication_contact_bindings_trust_idx",
+          "columns": [
+            {
+              "expression": "trust_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_bindings_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_contact_bindings_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_contact_bindings",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_contact_bindings_connection_channel_fk": {
+          "name": "communication_contact_bindings_connection_channel_fk",
+          "tableFrom": "communication_contact_bindings",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_bindings_id_connection_channel_unique": {
+          "name": "communication_contact_bindings_id_connection_channel_unique",
+          "columns": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_bindings_id_channel_unique": {
+          "name": "communication_contact_bindings_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_bindings_endpoint_unique": {
+          "name": "communication_contact_bindings_endpoint_unique",
+          "columns": [
+            "connection_id",
+            "endpoint_digest_key_version",
+            "endpoint_digest"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_bindings_communications_scope": {
+          "name": "communication_contact_bindings_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_bindings_channel_valid": {
+          "name": "communication_contact_bindings_channel_valid",
+          "value": "\"communication_contact_bindings\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_contact_bindings_trust_valid": {
+          "name": "communication_contact_bindings_trust_valid",
+          "value": "\"communication_contact_bindings\".\"trust_state\" in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')"
+        },
+        "communication_contact_bindings_locale_valid": {
+          "name": "communication_contact_bindings_locale_valid",
+          "value": "\"communication_contact_bindings\".\"locale\" in ('es', 'en')"
+        },
+        "communication_contact_bindings_endpoint_digest_valid": {
+          "name": "communication_contact_bindings_endpoint_digest_valid",
+          "value": "\"communication_contact_bindings\".\"endpoint_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_contact_bindings_policy_version_positive": {
+          "name": "communication_contact_bindings_policy_version_positive",
+          "value": "\"communication_contact_bindings\".\"contact_policy_version\" > 0"
+        },
+        "communication_contact_bindings_version_positive": {
+          "name": "communication_contact_bindings_version_positive",
+          "value": "\"communication_contact_bindings\".\"version\" > 0"
+        },
+        "communication_contact_bindings_verification_window_valid": {
+          "name": "communication_contact_bindings_verification_window_valid",
+          "value": "\"communication_contact_bindings\".\"verification_expires_at\" is null or (\"communication_contact_bindings\".\"endpoint_verified_at\" is not null and \"communication_contact_bindings\".\"verification_expires_at\" > \"communication_contact_bindings\".\"endpoint_verified_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_evidence_events": {
+      "name": "communication_contact_evidence_events",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sequence": {
+          "name": "sequence",
+          "type": "bigint",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_trust_state": {
+          "name": "binding_trust_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "review_resolution": {
+          "name": "review_resolution",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_kind": {
+          "name": "receipt_kind",
+          "type": "varchar(40)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_role": {
+          "name": "authority_role",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "authority_version": {
+          "name": "authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "triggering_event_id": {
+          "name": "triggering_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "policy_version": {
+          "name": "policy_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_issued_at": {
+          "name": "receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "receipt_valid_until": {
+          "name": "receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_evidence_events_binding_idx": {
+          "name": "communication_contact_evidence_events_binding_idx",
+          "columns": [
+            {
+              "expression": "binding_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "sequence",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_evidence_events_binding_sequence_unique": {
+          "name": "communication_contact_evidence_events_binding_sequence_unique",
+          "columns": [
+            "binding_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_contact_evidence_events_receipt_unique": {
+          "name": "communication_contact_evidence_events_receipt_unique",
+          "columns": [
+            "evidence_receipt_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_evidence_events_communications_select": {
+          "name": "communication_contact_evidence_events_communications_select",
+          "as": "PERMISSIVE",
+          "for": "SELECT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true"
+        },
+        "communication_contact_evidence_events_communications_insert": {
+          "name": "communication_contact_evidence_events_communications_insert",
+          "as": "PERMISSIVE",
+          "for": "INSERT",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_evidence_events_kind_valid": {
+          "name": "communication_contact_evidence_events_kind_valid",
+          "value": "\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')"
+        },
+        "communication_contact_evidence_events_authority_valid": {
+          "name": "communication_contact_evidence_events_authority_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"authority_role\" = 'channel_policy_detection'))) or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and ((\"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"triggering_event_id\" is null) or (\"communication_contact_evidence_events\".\"owning_domain\" = 'M004' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null)) and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
+        },
+        "communication_contact_evidence_events_sequence_positive": {
+          "name": "communication_contact_evidence_events_sequence_positive",
+          "value": "\"communication_contact_evidence_events\".\"sequence\" > 0"
+        },
+        "communication_contact_evidence_events_receipt_window_valid": {
+          "name": "communication_contact_evidence_events_receipt_window_valid",
+          "value": "(\"communication_contact_evidence_events\".\"receipt_issued_at\" is null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is null) or (\"communication_contact_evidence_events\".\"receipt_issued_at\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" is not null and \"communication_contact_evidence_events\".\"receipt_valid_until\" > \"communication_contact_evidence_events\".\"receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_contact_policies": {
+      "name": "communication_contact_policies",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "consent_state": {
+          "name": "consent_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence_state": {
+          "name": "fence_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "decision_code": {
+          "name": "decision_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "evidence_receipt_id": {
+          "name": "evidence_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fence": {
+          "name": "fence",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "evaluated_at": {
+          "name": "evaluated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_contact_policies_fence_idx": {
+          "name": "communication_contact_policies_fence_idx",
+          "columns": [
+            {
+              "expression": "fence_state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_policies_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_policies_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_policies",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_policies_binding_purpose_unique": {
+          "name": "communication_contact_policies_binding_purpose_unique",
+          "columns": [
+            "binding_id",
+            "purpose"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_contact_policies_communications_scope": {
+          "name": "communication_contact_policies_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_contact_policies_purpose_valid": {
+          "name": "communication_contact_policies_purpose_valid",
+          "value": "\"communication_contact_policies\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_contact_policies_consent_valid": {
+          "name": "communication_contact_policies_consent_valid",
+          "value": "\"communication_contact_policies\".\"consent_state\" in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')"
+        },
+        "communication_contact_policies_fence_valid": {
+          "name": "communication_contact_policies_fence_valid",
+          "value": "\"communication_contact_policies\".\"fence_state\" in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')"
+        },
+        "communication_contact_policies_decision_valid": {
+          "name": "communication_contact_policies_decision_valid",
+          "value": "\"communication_contact_policies\".\"decision_code\" is null or \"communication_contact_policies\".\"decision_code\" in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')"
+        },
+        "communication_contact_policies_version_positive": {
+          "name": "communication_contact_policies_version_positive",
+          "value": "\"communication_contact_policies\".\"version\" > 0"
+        },
+        "communication_contact_policies_fence_nonnegative": {
+          "name": "communication_contact_policies_fence_nonnegative",
+          "value": "\"communication_contact_policies\".\"fence\" >= 0"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_conversations": {
+      "name": "communication_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "last_activity_at": {
+          "name": "last_activity_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reconciliation_required": {
+          "name": "reconciliation_required",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_conversations_activity_idx": {
+          "name": "communication_conversations_activity_idx",
+          "columns": [
+            {
+              "expression": "channel_kind",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "last_activity_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "communication_conversations_reconciliation_idx": {
+          "name": "communication_conversations_reconciliation_idx",
+          "columns": [
+            {
+              "expression": "reconciliation_required",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_conversations_id_channel_unique": {
+          "name": "communication_conversations_id_channel_unique",
+          "columns": [
+            "id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_conversations_public_chat_scope": {
+          "name": "communication_conversations_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_conversations\".\"id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_conversations_communications_scope": {
+          "name": "communication_conversations_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_conversations\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_conversations_channel_valid": {
+          "name": "communication_conversations_channel_valid",
+          "value": "\"communication_conversations\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_conversations_locale_valid": {
+          "name": "communication_conversations_locale_valid",
+          "value": "\"communication_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "communication_conversations_status_valid": {
+          "name": "communication_conversations_status_valid",
+          "value": "\"communication_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "communication_conversations_version_positive": {
+          "name": "communication_conversations_version_positive",
+          "value": "\"communication_conversations\".\"version\" > 0"
+        },
+        "communication_conversations_expiry_valid": {
+          "name": "communication_conversations_expiry_valid",
+          "value": "\"communication_conversations\".\"expires_at\" is null or \"communication_conversations\".\"expires_at\" > \"communication_conversations\".\"created_at\""
+        },
+        "communication_conversations_public_expiry_required": {
+          "name": "communication_conversations_public_expiry_required",
+          "value": "\"communication_conversations\".\"channel_kind\" <> 'public_web' or \"communication_conversations\".\"expires_at\" is not null"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_attempts": {
+      "name": "communication_dispatch_attempts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_ordinal": {
+          "name": "attempt_ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_idempotency": {
+          "name": "request_idempotency",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference_capability": {
+          "name": "stable_reference_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_lookup_capability": {
+          "name": "message_lookup_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status_reconciliation_capability": {
+          "name": "status_reconciliation_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "media_references_capability": {
+          "name": "media_references_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "template_projection_capability": {
+          "name": "template_projection_capability",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "capability_observed_at": {
+          "name": "capability_observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_digest": {
+          "name": "request_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "stable_reference": {
+          "name": "stable_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result_code": {
+          "name": "result_code",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_capability_hash": {
+          "name": "provider_io_capability_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_io_started_at": {
+          "name": "provider_io_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_owner_hash": {
+          "name": "lease_owner_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_version": {
+          "name": "lease_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_reference_digest": {
+          "name": "provider_reference_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_dispatch_attempts_recovery_idx": {
+          "name": "communication_dispatch_attempts_recovery_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "completed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_dispatch_attempts_command_connection_fk": {
+          "name": "communication_dispatch_attempts_command_connection_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "command_id",
+            "connection_id"
+          ],
+          "tableTo": "communication_outbound_commands",
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_dispatch_attempts_command_ordinal_unique": {
+          "name": "communication_dispatch_attempts_command_ordinal_unique",
+          "columns": [
+            "command_id",
+            "attempt_ordinal"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_dispatch_attempts_id_command_unique": {
+          "name": "communication_dispatch_attempts_id_command_unique",
+          "columns": [
+            "id",
+            "command_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_dispatch_attempts_external_reference_unique": {
+          "name": "communication_dispatch_attempts_external_reference_unique",
+          "columns": [
+            "connection_id",
+            "external_message_reference"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_dispatch_attempts_communications_scope": {
+          "name": "communication_dispatch_attempts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_attempts_ordinal_positive": {
+          "name": "communication_dispatch_attempts_ordinal_positive",
+          "value": "\"communication_dispatch_attempts\".\"attempt_ordinal\" > 0"
+        },
+        "communication_dispatch_attempts_request_digest_valid": {
+          "name": "communication_dispatch_attempts_request_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"request_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_lease_owner_hash_valid": {
+          "name": "communication_dispatch_attempts_lease_owner_hash_valid",
+          "value": "\"communication_dispatch_attempts\".\"lease_owner_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_lease_version_positive": {
+          "name": "communication_dispatch_attempts_lease_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"lease_version\" > 0"
+        },
+        "communication_dispatch_attempts_lease_window_valid": {
+          "name": "communication_dispatch_attempts_lease_window_valid",
+          "value": "\"communication_dispatch_attempts\".\"lease_expires_at\" > \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_reference_digest_valid": {
+          "name": "communication_dispatch_attempts_provider_reference_digest_valid",
+          "value": "\"communication_dispatch_attempts\".\"provider_reference_digest\" is null or \"communication_dispatch_attempts\".\"provider_reference_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_attempts_policy_version_positive": {
+          "name": "communication_dispatch_attempts_policy_version_positive",
+          "value": "\"communication_dispatch_attempts\".\"expected_policy_version\" > 0"
+        },
+        "communication_dispatch_attempts_state_valid": {
+          "name": "communication_dispatch_attempts_state_valid",
+          "value": "\"communication_dispatch_attempts\".\"state\" in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_dispatch_attempts_result_valid": {
+          "name": "communication_dispatch_attempts_result_valid",
+          "value": "\"communication_dispatch_attempts\".\"result_code\" is null or \"communication_dispatch_attempts\".\"result_code\" in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')"
+        },
+        "communication_dispatch_attempts_completion_valid": {
+          "name": "communication_dispatch_attempts_completion_valid",
+          "value": "\"communication_dispatch_attempts\".\"completed_at\" is null or \"communication_dispatch_attempts\".\"completed_at\" >= \"communication_dispatch_attempts\".\"started_at\""
+        },
+        "communication_dispatch_attempts_provider_io_capability_valid": {
+          "name": "communication_dispatch_attempts_provider_io_capability_valid",
+          "value": "(\"communication_dispatch_attempts\".\"provider_io_capability_hash\" is null and \"communication_dispatch_attempts\".\"provider_io_started_at\" is null) or (\"communication_dispatch_attempts\".\"provider_io_capability_hash\" ~ '^[0-9a-f]{64}$' and \"communication_dispatch_attempts\".\"provider_io_started_at\" is not null and \"communication_dispatch_attempts\".\"provider_io_started_at\" >= \"communication_dispatch_attempts\".\"started_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_dispatch_reconciliation_receipts": {
+      "name": "communication_dispatch_reconciliation_receipts",
+      "schema": "",
+      "columns": {
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_digest": {
+          "name": "receipt_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "attempt_id": {
+          "name": "attempt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source": {
+          "name": "source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome": {
+          "name": "outcome",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "issued_at": {
+          "name": "issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "communication_dispatch_reconciliation_receipts_attempt_command_fk": {
+          "name": "communication_dispatch_reconciliation_receipts_attempt_command_fk",
+          "tableFrom": "communication_dispatch_reconciliation_receipts",
+          "columnsFrom": [
+            "attempt_id",
+            "command_id"
+          ],
+          "tableTo": "communication_dispatch_attempts",
+          "columnsTo": [
+            "id",
+            "command_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_dispatch_reconciliation_receipts_command_binding_fk": {
+          "name": "communication_dispatch_reconciliation_receipts_command_binding_fk",
+          "tableFrom": "communication_dispatch_reconciliation_receipts",
+          "columnsFrom": [
+            "command_id",
+            "binding_id"
+          ],
+          "tableTo": "communication_outbound_commands",
+          "columnsTo": [
+            "id",
+            "binding_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_dispatch_reconciliation_receipts_communications_scope": {
+          "name": "communication_dispatch_reconciliation_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_dispatch_reconciliation_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_reconciliation_receipts_digest_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_digest_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"receipt_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_reconciliation_receipts_source_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_source_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"source\" in ('provider_lookup', 'manual_authority')"
+        },
+        "communication_dispatch_reconciliation_receipts_outcome_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_outcome_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"outcome\" in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')"
+        },
+        "communication_dispatch_reconciliation_receipts_window_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_window_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"expires_at\" > \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" >= \"communication_dispatch_reconciliation_receipts\".\"issued_at\" and \"communication_dispatch_reconciliation_receipts\".\"created_at\" < \"communication_dispatch_reconciliation_receipts\".\"expires_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_event_envelopes": {
+      "name": "communication_event_envelopes",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_text": {
+          "name": "canonical_text",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "delivery_state": {
+          "name": "delivery_state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_kind": {
+          "name": "interactive_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_id": {
+          "name": "interactive_id",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "interactive_title": {
+          "name": "interactive_title",
+          "type": "varchar(240)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_external_reference": {
+          "name": "media_external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_declared_kind": {
+          "name": "media_declared_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_mime_type": {
+          "name": "media_mime_type",
+          "type": "varchar(160)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "media_checksum": {
+          "name": "media_checksum",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_id": {
+          "name": "template_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_state": {
+          "name": "template_authority_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_version": {
+          "name": "template_authority_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_authority_updated_at": {
+          "name": "template_authority_updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_reference": {
+          "name": "template_provider_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_locale": {
+          "name": "template_locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_category": {
+          "name": "template_category",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_state": {
+          "name": "template_provider_state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_version": {
+          "name": "template_provider_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_provider_timestamp": {
+          "name": "template_provider_timestamp",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_components": {
+          "name": "template_components",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "unsupported_reason": {
+          "name": "unsupported_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_event_envelopes_conversation_idx": {
+          "name": "communication_event_envelopes_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "occurred_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_event_envelopes_receipt_connection_fk": {
+          "name": "communication_event_envelopes_receipt_connection_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "receipt_id",
+            "connection_id"
+          ],
+          "tableTo": "communication_provider_event_receipts",
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_event_envelopes_conversation_channel_fk": {
+          "name": "communication_event_envelopes_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_participant_conversation_channel_fk": {
+          "name": "communication_event_envelopes_participant_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_message_conversation_fk": {
+          "name": "communication_event_envelopes_message_conversation_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "message_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_messages",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_event_envelopes_binding_connection_channel_fk": {
+          "name": "communication_event_envelopes_binding_connection_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_event_envelopes_receipt_id_unique": {
+          "name": "communication_event_envelopes_receipt_id_unique",
+          "columns": [
+            "receipt_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_event_envelopes_communications_scope": {
+          "name": "communication_event_envelopes_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_event_envelopes_kind_valid": {
+          "name": "communication_event_envelopes_kind_valid",
+          "value": "\"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_event_envelopes_channel_valid": {
+          "name": "communication_event_envelopes_channel_valid",
+          "value": "\"communication_event_envelopes\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_event_envelopes_schema_version_valid": {
+          "name": "communication_event_envelopes_schema_version_valid",
+          "value": "\"communication_event_envelopes\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_event_envelopes_retention_valid": {
+          "name": "communication_event_envelopes_retention_valid",
+          "value": "\"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null"
+        },
+        "communication_event_envelopes_typed_shape_valid": {
+          "name": "communication_event_envelopes_typed_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"event_kind\" = 'text_message' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"body_retention_policy\" = 'metadata_only' and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'interactive_reply' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"interactive_kind\" is not null and \"communication_event_envelopes\".\"interactive_kind\" in ('button', 'list') and \"communication_event_envelopes\".\"interactive_id\" is not null and \"communication_event_envelopes\".\"interactive_title\" is not null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'message_status' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is not null and \"communication_event_envelopes\".\"delivery_state\" is not null and \"communication_event_envelopes\".\"delivery_state\" in ('sent', 'delivered', 'read', 'failed') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'media_reference' and \"communication_event_envelopes\".\"binding_id\" is not null and \"communication_event_envelopes\".\"message_reference\" is not null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"media_external_reference\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" is not null and \"communication_event_envelopes\".\"media_declared_kind\" in ('image', 'document', 'audio', 'sticker', 'video') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'template_projection' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"template_id\" is not null and \"communication_event_envelopes\".\"template_authority_state\" is not null and \"communication_event_envelopes\".\"template_authority_state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and \"communication_event_envelopes\".\"template_authority_version\" is not null and \"communication_event_envelopes\".\"template_authority_version\" > 0 and \"communication_event_envelopes\".\"template_authority_updated_at\" is not null and \"communication_event_envelopes\".\"template_provider_reference\" is not null and \"communication_event_envelopes\".\"template_key\" is not null and \"communication_event_envelopes\".\"template_locale\" is not null and \"communication_event_envelopes\".\"template_locale\" in ('es', 'en') and \"communication_event_envelopes\".\"template_category\" is not null and \"communication_event_envelopes\".\"template_category\" in ('authentication', 'marketing', 'utility') and \"communication_event_envelopes\".\"template_provider_state\" is not null and \"communication_event_envelopes\".\"template_provider_state\" in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and \"communication_event_envelopes\".\"template_provider_version\" is not null and \"communication_event_envelopes\".\"template_provider_timestamp\" is not null and \"communication_event_envelopes\".\"template_components\" is not null and jsonb_typeof(\"communication_event_envelopes\".\"template_components\") = 'array' and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is null) or (\"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified' and \"communication_event_envelopes\".\"binding_id\" is null and \"communication_event_envelopes\".\"message_reference\" is null and \"communication_event_envelopes\".\"canonical_text\" is null and \"communication_event_envelopes\".\"external_message_reference\" is null and \"communication_event_envelopes\".\"unsupported_reason\" is not null and \"communication_event_envelopes\".\"unsupported_reason\" in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and \"communication_event_envelopes\".\"interactive_kind\" is null and \"communication_event_envelopes\".\"delivery_state\" is null and \"communication_event_envelopes\".\"media_external_reference\" is null and \"communication_event_envelopes\".\"template_provider_reference\" is null)"
+        },
+        "communication_event_envelopes_field_ownership_valid": {
+          "name": "communication_event_envelopes_field_ownership_valid",
+          "value": "(\"communication_event_envelopes\".\"binding_id\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" in ('text_message', 'interactive_reply', 'media_reference')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"canonical_text\" is null or \"communication_event_envelopes\".\"event_kind\" = 'text_message') and (\"communication_event_envelopes\".\"delivery_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'message_status') and (\"communication_event_envelopes\".\"interactive_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"interactive_title\" is null or \"communication_event_envelopes\".\"event_kind\" = 'interactive_reply') and (\"communication_event_envelopes\".\"media_external_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_declared_kind\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_mime_type\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"event_kind\" = 'media_reference') and (\"communication_event_envelopes\".\"template_id\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_authority_updated_at\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_reference\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_key\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_locale\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_category\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_state\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_version\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_provider_timestamp\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"template_components\" is null or \"communication_event_envelopes\".\"event_kind\" = 'template_projection') and (\"communication_event_envelopes\".\"unsupported_reason\" is null or \"communication_event_envelopes\".\"event_kind\" = 'unsupported_verified')"
+        },
+        "communication_event_envelopes_reference_shape_valid": {
+          "name": "communication_event_envelopes_reference_shape_valid",
+          "value": "(\"communication_event_envelopes\".\"participant_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_id\" is null or \"communication_event_envelopes\".\"conversation_id\" is not null) and (\"communication_event_envelopes\".\"message_reference\" is null or (char_length(\"communication_event_envelopes\".\"message_reference\") <= 128 and \"communication_event_envelopes\".\"message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"external_message_reference\" is null or (char_length(\"communication_event_envelopes\".\"external_message_reference\") <= 128 and \"communication_event_envelopes\".\"external_message_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"media_external_reference\" is null or (char_length(\"communication_event_envelopes\".\"media_external_reference\") <= 128 and \"communication_event_envelopes\".\"media_external_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (\"communication_event_envelopes\".\"template_provider_reference\" is null or (char_length(\"communication_event_envelopes\".\"template_provider_reference\") <= 128 and \"communication_event_envelopes\".\"template_provider_reference\" ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))"
+        },
+        "communication_event_envelopes_media_checksum_valid": {
+          "name": "communication_event_envelopes_media_checksum_valid",
+          "value": "\"communication_event_envelopes\".\"media_checksum\" is null or \"communication_event_envelopes\".\"media_checksum\" ~ '^[0-9a-f]{64}$'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_handoffs": {
+      "name": "communication_handoffs",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason_code": {
+          "name": "reason_code",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "receipt_id": {
+          "name": "receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "assigned_participant_id": {
+          "name": "assigned_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "requested_at": {
+          "name": "requested_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "queued_at": {
+          "name": "queued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "accepted_at": {
+          "name": "accepted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_handoffs_state_idx": {
+          "name": "communication_handoffs_state_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "updated_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_handoffs_conversation_channel_fk": {
+          "name": "communication_handoffs_conversation_channel_fk",
+          "tableFrom": "communication_handoffs",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_handoffs_assignee_conversation_fk": {
+          "name": "communication_handoffs_assignee_conversation_fk",
+          "tableFrom": "communication_handoffs",
+          "columnsFrom": [
+            "assigned_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "set null"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_handoffs_public_chat_scope": {
+          "name": "communication_handoffs_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_handoffs\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_handoffs_communications_scope": {
+          "name": "communication_handoffs_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_handoffs\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_handoffs_channel_valid": {
+          "name": "communication_handoffs_channel_valid",
+          "value": "\"communication_handoffs\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_handoffs_state_valid": {
+          "name": "communication_handoffs_state_valid",
+          "value": "\"communication_handoffs\".\"state\" in ('requested', 'queued', 'accepted', 'closed', 'unavailable')"
+        },
+        "communication_handoffs_reason_valid": {
+          "name": "communication_handoffs_reason_valid",
+          "value": "\"communication_handoffs\".\"reason_code\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_message_templates": {
+      "name": "communication_message_templates",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_source": {
+          "name": "definition_source",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "definition_version": {
+          "name": "definition_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "variable_keys": {
+          "name": "variable_keys",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "internally_approved": {
+          "name": "internally_approved",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "approval_receipt_id": {
+          "name": "approval_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_issued_at": {
+          "name": "approval_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "approval_receipt_valid_until": {
+          "name": "approval_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_reference": {
+          "name": "external_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "projection_version": {
+          "name": "projection_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_id": {
+          "name": "provider_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_correlation_id": {
+          "name": "provider_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_issued_at": {
+          "name": "provider_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_receipt_valid_until": {
+          "name": "provider_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "category": {
+          "name": "category",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "observed_at": {
+          "name": "observed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_message_templates_projection_idx": {
+          "name": "communication_message_templates_projection_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "observed_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_message_templates_definition_unique": {
+          "name": "communication_message_templates_definition_unique",
+          "columns": [
+            "template_key",
+            "locale",
+            "definition_version"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_message_templates_communications_scope": {
+          "name": "communication_message_templates_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_message_templates_locale_valid": {
+          "name": "communication_message_templates_locale_valid",
+          "value": "\"communication_message_templates\".\"locale\" in ('es', 'en')"
+        },
+        "communication_message_templates_purpose_valid": {
+          "name": "communication_message_templates_purpose_valid",
+          "value": "\"communication_message_templates\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_message_templates_source_valid": {
+          "name": "communication_message_templates_source_valid",
+          "value": "\"communication_message_templates\".\"definition_source\" in ('synthetic_test_fixture', 'approved_policy')"
+        },
+        "communication_message_templates_state_valid": {
+          "name": "communication_message_templates_state_valid",
+          "value": "\"communication_message_templates\".\"state\" in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')"
+        },
+        "communication_message_templates_variables_valid": {
+          "name": "communication_message_templates_variables_valid",
+          "value": "jsonb_typeof(\"communication_message_templates\".\"variable_keys\") = 'array'"
+        },
+        "communication_message_templates_definition_version_positive": {
+          "name": "communication_message_templates_definition_version_positive",
+          "value": "\"communication_message_templates\".\"definition_version\" > 0"
+        },
+        "communication_message_templates_projection_version_positive": {
+          "name": "communication_message_templates_projection_version_positive",
+          "value": "\"communication_message_templates\".\"projection_version\" is null or \"communication_message_templates\".\"projection_version\" > 0"
+        },
+        "communication_message_templates_approval_valid": {
+          "name": "communication_message_templates_approval_valid",
+          "value": "(\"communication_message_templates\".\"internally_approved\" = false and \"communication_message_templates\".\"approval_receipt_id\" is null and \"communication_message_templates\".\"approval_receipt_issued_at\" is null and \"communication_message_templates\".\"approval_receipt_valid_until\" is null) or (\"communication_message_templates\".\"internally_approved\" = true and \"communication_message_templates\".\"approval_receipt_id\" is not null and \"communication_message_templates\".\"approval_receipt_issued_at\" is not null and \"communication_message_templates\".\"approval_receipt_valid_until\" > \"communication_message_templates\".\"approval_receipt_issued_at\")"
+        },
+        "communication_message_templates_provider_receipt_valid": {
+          "name": "communication_message_templates_provider_receipt_valid",
+          "value": "(\"communication_message_templates\".\"provider_receipt_id\" is null and \"communication_message_templates\".\"provider_correlation_id\" is null and \"communication_message_templates\".\"provider_receipt_issued_at\" is null and \"communication_message_templates\".\"provider_receipt_valid_until\" is null) or (\"communication_message_templates\".\"provider_receipt_id\" is not null and \"communication_message_templates\".\"provider_correlation_id\" is not null and \"communication_message_templates\".\"provider_receipt_issued_at\" is not null and \"communication_message_templates\".\"provider_receipt_valid_until\" > \"communication_message_templates\".\"provider_receipt_issued_at\")"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_messages": {
+      "name": "communication_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "direction": {
+          "name": "direction",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "sender_participant_id": {
+          "name": "sender_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "recipient_participant_id": {
+          "name": "recipient_participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body": {
+          "name": "body",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "body_stored": {
+          "name": "body_stored",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "body_retention_policy": {
+          "name": "body_retention_policy",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'metadata_only'"
+        },
+        "actions": {
+          "name": "actions",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "rejection_reason": {
+          "name": "rejection_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "external_message_reference": {
+          "name": "external_message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_messages_conversation_idx": {
+          "name": "communication_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "ordinal",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        },
+        "communication_messages_external_reference_idx": {
+          "name": "communication_messages_external_reference_idx",
+          "columns": [
+            {
+              "expression": "external_message_reference",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_messages_conversation_channel_fk": {
+          "name": "communication_messages_conversation_channel_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_messages_sender_conversation_fk": {
+          "name": "communication_messages_sender_conversation_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "sender_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_messages_recipient_conversation_fk": {
+          "name": "communication_messages_recipient_conversation_fk",
+          "tableFrom": "communication_messages",
+          "columnsFrom": [
+            "recipient_participant_id",
+            "conversation_id"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_messages_id_conversation_unique": {
+          "name": "communication_messages_id_conversation_unique",
+          "columns": [
+            "id",
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_messages_conversation_ordinal_unique": {
+          "name": "communication_messages_conversation_ordinal_unique",
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_messages_public_chat_scope": {
+          "name": "communication_messages_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_messages\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_messages_communications_scope": {
+          "name": "communication_messages_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_messages\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_messages\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_messages_channel_valid": {
+          "name": "communication_messages_channel_valid",
+          "value": "\"communication_messages\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_messages_ordinal_positive": {
+          "name": "communication_messages_ordinal_positive",
+          "value": "\"communication_messages\".\"ordinal\" > 0"
+        },
+        "communication_messages_direction_valid": {
+          "name": "communication_messages_direction_valid",
+          "value": "\"communication_messages\".\"direction\" in ('inbound', 'outbound', 'system')"
+        },
+        "communication_messages_locale_valid": {
+          "name": "communication_messages_locale_valid",
+          "value": "\"communication_messages\".\"locale\" in ('es', 'en')"
+        },
+        "communication_messages_kind_valid": {
+          "name": "communication_messages_kind_valid",
+          "value": "\"communication_messages\".\"kind\" in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')"
+        },
+        "communication_messages_state_valid": {
+          "name": "communication_messages_state_valid",
+          "value": "\"communication_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "communication_messages_body_retention_valid": {
+          "name": "communication_messages_body_retention_valid",
+          "value": "(\"communication_messages\".\"body_retention_policy\" = 'metadata_only' and \"communication_messages\".\"body_stored\" = false and \"communication_messages\".\"body\" is null) or (\"communication_messages\".\"body_retention_policy\" in ('synthetic_local_text', 'approved') and \"communication_messages\".\"body_stored\" = true and \"communication_messages\".\"body\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_outbound_commands": {
+      "name": "communication_outbound_commands",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "binding_id": {
+          "name": "binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "purpose": {
+          "name": "purpose",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message_reference": {
+          "name": "message_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_key": {
+          "name": "template_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "template_definition_version": {
+          "name": "template_definition_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "destination_key": {
+          "name": "destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "message_body_digest": {
+          "name": "message_body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_id": {
+          "name": "owning_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_operation": {
+          "name": "owning_operation",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_binding_id": {
+          "name": "owning_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_destination_key": {
+          "name": "owning_destination_key",
+          "type": "varchar(120)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_issued_at": {
+          "name": "owning_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "owning_receipt_valid_until": {
+          "name": "owning_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "required_fence": {
+          "name": "required_fence",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "endpoint_digests": {
+          "name": "endpoint_digests",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'[]'::jsonb"
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fingerprint": {
+          "name": "fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "failure_code": {
+          "name": "failure_code",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "version": {
+          "name": "version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scheduled_at": {
+          "name": "scheduled_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_outbound_commands_work_idx": {
+          "name": "communication_outbound_commands_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "scheduled_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_outbound_commands_conversation_channel_fk": {
+          "name": "communication_outbound_commands_conversation_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_outbound_commands_binding_connection_channel_fk": {
+          "name": "communication_outbound_commands_binding_connection_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_outbound_commands_id_connection_unique": {
+          "name": "communication_outbound_commands_id_connection_unique",
+          "columns": [
+            "id",
+            "connection_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_outbound_commands_id_binding_unique": {
+          "name": "communication_outbound_commands_id_binding_unique",
+          "columns": [
+            "id",
+            "binding_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_outbound_commands_binding_key_unique": {
+          "name": "communication_outbound_commands_binding_key_unique",
+          "columns": [
+            "binding_id",
+            "idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_outbound_commands_communications_scope": {
+          "name": "communication_outbound_commands_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_outbound_commands_channel_valid": {
+          "name": "communication_outbound_commands_channel_valid",
+          "value": "\"communication_outbound_commands\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_outbound_commands_fingerprint_valid": {
+          "name": "communication_outbound_commands_fingerprint_valid",
+          "value": "\"communication_outbound_commands\".\"fingerprint\" is null or \"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_message_body_digest_valid": {
+          "name": "communication_outbound_commands_message_body_digest_valid",
+          "value": "\"communication_outbound_commands\".\"message_body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_token_hash_valid": {
+          "name": "communication_outbound_commands_lease_token_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_owner_hash_valid": {
+          "name": "communication_outbound_commands_lease_owner_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_owner_id\" is null or \"communication_outbound_commands\".\"lease_owner_id\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_locale_valid": {
+          "name": "communication_outbound_commands_locale_valid",
+          "value": "\"communication_outbound_commands\".\"locale\" in ('es', 'en')"
+        },
+        "communication_outbound_commands_purpose_valid": {
+          "name": "communication_outbound_commands_purpose_valid",
+          "value": "\"communication_outbound_commands\".\"purpose\" in ('conversational', 'transactional', 'service', 'marketing')"
+        },
+        "communication_outbound_commands_state_valid": {
+          "name": "communication_outbound_commands_state_valid",
+          "value": "\"communication_outbound_commands\".\"state\" in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')"
+        },
+        "communication_outbound_commands_policy_version_positive": {
+          "name": "communication_outbound_commands_policy_version_positive",
+          "value": "\"communication_outbound_commands\".\"expected_policy_version\" is null or \"communication_outbound_commands\".\"expected_policy_version\" > 0"
+        },
+        "communication_outbound_commands_required_fence_valid": {
+          "name": "communication_outbound_commands_required_fence_valid",
+          "value": "\"communication_outbound_commands\".\"required_fence\" is null or \"communication_outbound_commands\".\"required_fence\" >= 0"
+        },
+        "communication_outbound_commands_endpoint_digests_valid": {
+          "name": "communication_outbound_commands_endpoint_digests_valid",
+          "value": "jsonb_typeof(\"communication_outbound_commands\".\"endpoint_digests\") = 'array'"
+        },
+        "communication_outbound_commands_version_nonnegative": {
+          "name": "communication_outbound_commands_version_nonnegative",
+          "value": "\"communication_outbound_commands\".\"version\" >= 0"
+        },
+        "communication_outbound_commands_owning_receipt_window_valid": {
+          "name": "communication_outbound_commands_owning_receipt_window_valid",
+          "value": "(\"communication_outbound_commands\".\"owning_receipt_id\" is null and \"communication_outbound_commands\".\"owning_domain\" is null and \"communication_outbound_commands\".\"owning_operation\" is null and \"communication_outbound_commands\".\"owning_reference\" is null and \"communication_outbound_commands\".\"owning_binding_id\" is null and \"communication_outbound_commands\".\"owning_destination_key\" is null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" is null) or (\"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"owning_domain\" = 'communications' and \"communication_outbound_commands\".\"owning_operation\" = 'outbound_dispatch' and \"communication_outbound_commands\".\"owning_reference\" is not null and \"communication_outbound_commands\".\"owning_binding_id\" = \"communication_outbound_commands\".\"binding_id\" and \"communication_outbound_commands\".\"owning_destination_key\" = \"communication_outbound_commands\".\"destination_key\" and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is not null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\")"
+        },
+        "communication_outbound_commands_finalization_valid": {
+          "name": "communication_outbound_commands_finalization_valid",
+          "value": "\"communication_outbound_commands\".\"state\" = 'draft' or (\"communication_outbound_commands\".\"fingerprint\" is not null and \"communication_outbound_commands\".\"expected_policy_version\" is not null and \"communication_outbound_commands\".\"required_fence\" is not null and \"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"destination_key\" is not null)"
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or \"communication_outbound_commands\".\"destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_destination_valid": {
+          "name": "communication_outbound_commands_owning_destination_valid",
+          "value": "\"communication_outbound_commands\".\"owning_destination_key\" is null or \"communication_outbound_commands\".\"owning_destination_key\" ~ '^endpoint_ref:[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_owning_reference_valid": {
+          "name": "communication_outbound_commands_owning_reference_valid",
+          "value": "\"communication_outbound_commands\".\"owning_reference\" is null or \"communication_outbound_commands\".\"owning_reference\" ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'"
+        },
+        "communication_outbound_commands_lease_valid": {
+          "name": "communication_outbound_commands_lease_valid",
+          "value": "(\"communication_outbound_commands\".\"lease_owner_id\" is null and \"communication_outbound_commands\".\"lease_token_hash\" is null and \"communication_outbound_commands\".\"lease_expires_at\" is null) or (\"communication_outbound_commands\".\"lease_owner_id\" is not null and \"communication_outbound_commands\".\"lease_token_hash\" is not null and \"communication_outbound_commands\".\"lease_expires_at\" is not null)"
+        },
+        "communication_outbound_commands_expiry_valid": {
+          "name": "communication_outbound_commands_expiry_valid",
+          "value": "\"communication_outbound_commands\".\"expires_at\" is null or \"communication_outbound_commands\".\"expires_at\" > \"communication_outbound_commands\".\"created_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_participants": {
+      "name": "communication_participants",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "kind": {
+          "name": "kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_binding_id": {
+          "name": "channel_binding_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "joined_at": {
+          "name": "joined_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "left_at": {
+          "name": "left_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_participants_conversation_idx": {
+          "name": "communication_participants_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "joined_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_participants_conversation_channel_fk": {
+          "name": "communication_participants_conversation_channel_fk",
+          "tableFrom": "communication_participants",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "communication_participants_binding_channel_fk": {
+          "name": "communication_participants_binding_channel_fk",
+          "tableFrom": "communication_participants",
+          "columnsFrom": [
+            "channel_binding_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_contact_bindings",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_participants_id_conversation_unique": {
+          "name": "communication_participants_id_conversation_unique",
+          "columns": [
+            "id",
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_participants_id_conversation_channel_unique": {
+          "name": "communication_participants_id_conversation_channel_unique",
+          "columns": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_participants_public_chat_scope": {
+          "name": "communication_participants_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'public_web' and exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"communication_participants\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        },
+        "communication_participants_communications_scope": {
+          "name": "communication_participants_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "\"communication_participants\".\"channel_kind\" = 'whatsapp'",
+          "withCheck": "\"communication_participants\".\"channel_kind\" = 'whatsapp'"
+        }
+      },
+      "checkConstraints": {
+        "communication_participants_channel_valid": {
+          "name": "communication_participants_channel_valid",
+          "value": "\"communication_participants\".\"channel_kind\" in ('public_web', 'whatsapp')"
+        },
+        "communication_participants_kind_valid": {
+          "name": "communication_participants_kind_valid",
+          "value": "\"communication_participants\".\"kind\" in ('external', 'automated', 'human', 'system')"
+        },
+        "communication_participants_membership_window_valid": {
+          "name": "communication_participants_membership_window_valid",
+          "value": "\"communication_participants\".\"left_at\" is null or \"communication_participants\".\"left_at\" >= \"communication_participants\".\"joined_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_event_receipts": {
+      "name": "communication_provider_event_receipts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "connection_id": {
+          "name": "connection_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'whatsapp'"
+        },
+        "external_event_reference": {
+          "name": "external_event_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "body_digest": {
+          "name": "body_digest",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "event_kind": {
+          "name": "event_kind",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "schema_version": {
+          "name": "schema_version",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "signature_verified": {
+          "name": "signature_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "outcome_reason": {
+          "name": "outcome_reason",
+          "type": "varchar(48)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "processing_version": {
+          "name": "processing_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_owner_id": {
+          "name": "lease_owner_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "received_at": {
+          "name": "received_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "persisted_at": {
+          "name": "persisted_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "processed_at": {
+          "name": "processed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "communication_provider_event_receipts_work_idx": {
+          "name": "communication_provider_event_receipts_work_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "received_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        },
+        "communication_provider_event_receipts_connection_channel_fk": {
+          "name": "communication_provider_event_receipts_connection_channel_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_channel_connections",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_provider_event_receipts_id_connection_unique": {
+          "name": "communication_provider_event_receipts_id_connection_unique",
+          "columns": [
+            "id",
+            "connection_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "communication_provider_event_receipts_identity_unique": {
+          "name": "communication_provider_event_receipts_identity_unique",
+          "columns": [
+            "connection_id",
+            "external_event_reference"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "communication_provider_event_receipts_communications_scope": {
+          "name": "communication_provider_event_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_event_receipts_kind_valid": {
+          "name": "communication_provider_event_receipts_kind_valid",
+          "value": "\"communication_provider_event_receipts\".\"event_kind\" in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')"
+        },
+        "communication_provider_event_receipts_state_valid": {
+          "name": "communication_provider_event_receipts_state_valid",
+          "value": "\"communication_provider_event_receipts\".\"state\" in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')"
+        },
+        "communication_provider_event_receipts_signature_valid": {
+          "name": "communication_provider_event_receipts_signature_valid",
+          "value": "\"communication_provider_event_receipts\".\"signature_verified\" = true"
+        },
+        "communication_provider_event_receipts_channel_valid": {
+          "name": "communication_provider_event_receipts_channel_valid",
+          "value": "\"communication_provider_event_receipts\".\"channel_kind\" = 'whatsapp'"
+        },
+        "communication_provider_event_receipts_schema_version_valid": {
+          "name": "communication_provider_event_receipts_schema_version_valid",
+          "value": "\"communication_provider_event_receipts\".\"schema_version\" = 'meta-envelope.v1'"
+        },
+        "communication_provider_event_receipts_external_event_reference_valid": {
+          "name": "communication_provider_event_receipts_external_event_reference_valid",
+          "value": "\"communication_provider_event_receipts\".\"external_event_reference\" ~ '^meta_evt_[0-9a-f]{32,64}$'"
+        },
+        "communication_provider_event_receipts_body_digest_valid": {
+          "name": "communication_provider_event_receipts_body_digest_valid",
+          "value": "\"communication_provider_event_receipts\".\"body_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_lease_token_hash_valid": {
+          "name": "communication_provider_event_receipts_lease_token_hash_valid",
+          "value": "\"communication_provider_event_receipts\".\"lease_token_hash\" is null or \"communication_provider_event_receipts\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_provider_event_receipts_version_positive": {
+          "name": "communication_provider_event_receipts_version_positive",
+          "value": "\"communication_provider_event_receipts\".\"processing_version\" > 0"
+        },
+        "communication_provider_event_receipts_lease_valid": {
+          "name": "communication_provider_event_receipts_lease_valid",
+          "value": "(\"communication_provider_event_receipts\".\"lease_owner_id\" is null and \"communication_provider_event_receipts\".\"lease_token_hash\" is null and \"communication_provider_event_receipts\".\"lease_expires_at\" is null) or (\"communication_provider_event_receipts\".\"lease_owner_id\" is not null and \"communication_provider_event_receipts\".\"lease_token_hash\" is not null and \"communication_provider_event_receipts\".\"lease_expires_at\" is not null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.communication_provider_status_receipts": {
+      "name": "communication_provider_status_receipts",
+      "schema": "",
+      "columns": {
+        "command_id": {
+          "name": "command_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_event_id": {
+          "name": "provider_event_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "occurred_at": {
+          "name": "occurred_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk": {
+          "name": "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk",
+          "tableFrom": "communication_provider_status_receipts",
+          "columnsFrom": [
+            "command_id"
+          ],
+          "tableTo": "communication_outbound_commands",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {
+        "communication_provider_status_receipts_command_event_pk": {
+          "name": "communication_provider_status_receipts_command_event_pk",
+          "columns": [
+            "command_id",
+            "provider_event_id"
+          ]
+        }
+      },
+      "uniqueConstraints": {},
+      "policies": {
+        "communication_provider_status_receipts_communications_scope": {
+          "name": "communication_provider_status_receipts_communications_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_communications_gateway"
+          ],
+          "using": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )",
+          "withCheck": "exists (\n    select 1 from communication_outbound_commands command\n    where command.id = \"communication_provider_status_receipts\".\"command_id\" and command.channel_kind = 'whatsapp'\n  )"
+        }
+      },
+      "checkConstraints": {
+        "communication_provider_status_receipts_status_valid": {
+          "name": "communication_provider_status_receipts_status_valid",
+          "value": "\"communication_provider_status_receipts\".\"status\" in ('sent', 'delivered', 'read', 'failed')"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_citations": {
+      "name": "public_chat_citations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "message_id": {
+          "name": "message_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_id": {
+          "name": "source_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "title": {
+          "name": "title",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "path": {
+          "name": "path",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "locale": {
+          "name": "locale",
+          "type": "varchar(2)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "summary": {
+          "name": "summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "disclosure": {
+          "name": "disclosure",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source_kind": {
+          "name": "source_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "public_chat_citations_message_id_communication_messages_id_fk": {
+          "name": "public_chat_citations_message_id_communication_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "tableTo": "communication_messages",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "columns": [
+            "message_id",
+            "source_id"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_citations_server_gateway_only": {
+          "name": "public_chat_citations_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "exists (\n    select 1\n    from communication_messages message\n    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id\n    where message.id = \"public_chat_citations\".\"message_id\"\n      and message.channel_kind = 'public_web'\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "exists (\n    select 1\n    from communication_messages message\n    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id\n    where message.id = \"public_chat_citations\".\"message_id\"\n      and message.channel_kind = 'public_web'\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_citations_locale_valid": {
+          "name": "public_chat_citations_locale_valid",
+          "value": "\"public_chat_citations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_citations_source_kind_valid": {
+          "name": "public_chat_citations_source_kind_valid",
+          "value": "\"public_chat_citations\".\"source_kind\" is null or \"public_chat_citations\".\"source_kind\" = 'provider'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_conversation_sessions": {
+      "name": "public_chat_conversation_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "channel_kind": {
+          "name": "channel_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'public_web'"
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "participant_id": {
+          "name": "participant_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_idempotency_key": {
+          "name": "start_idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "start_fingerprint": {
+          "name": "start_fingerprint",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_conversation_sessions_session_idx": {
+          "name": "public_chat_conversation_sessions_session_idx",
+          "columns": [
+            {
+              "expression": "session_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "tableTo": "public_chat_sessions",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "public_chat_conversation_sessions_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        },
+        "public_chat_conversation_sessions_participant_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_participant_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "tableTo": "communication_participants",
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversation_sessions_conversation_unique": {
+          "name": "public_chat_conversation_sessions_conversation_unique",
+          "columns": [
+            "conversation_id"
+          ],
+          "nullsNotDistinct": false
+        },
+        "public_chat_conversation_sessions_session_start_key_unique": {
+          "name": "public_chat_conversation_sessions_session_start_key_unique",
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_conversation_sessions_public_chat_scope": {
+          "name": "public_chat_conversation_sessions_public_chat_scope",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')",
+          "withCheck": "\"public_chat_conversation_sessions\".\"session_id\" = nullif(current_setting('atlas.public_chat_session_id', true), '')"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_conversation_sessions_start_fingerprint_valid": {
+          "name": "public_chat_conversation_sessions_start_fingerprint_valid",
+          "value": "\"public_chat_conversation_sessions\".\"start_fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "public_chat_conversation_sessions_channel_valid": {
+          "name": "public_chat_conversation_sessions_channel_valid",
+          "value": "\"public_chat_conversation_sessions\".\"channel_kind\" = 'public_web'"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_idempotency": {
+      "name": "public_chat_idempotency",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "conversation_id": {
+          "name": "conversation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "idempotency_key": {
+          "name": "idempotency_key",
+          "type": "varchar(128)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_kind": {
+          "name": "command_kind",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "command_fingerprint": {
+          "name": "command_fingerprint",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "state": {
+          "name": "state",
+          "type": "varchar(16)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_version": {
+          "name": "expected_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_token_hash": {
+          "name": "lease_token_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "lease_expires_at": {
+          "name": "lease_expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "result": {
+          "name": "result",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "completed_at": {
+          "name": "completed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_idempotency_lease_idx": {
+          "name": "public_chat_idempotency_lease_idx",
+          "columns": [
+            {
+              "expression": "state",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "lease_expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_communication_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_communication_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "communication_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "restrict"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_idempotency_server_gateway_only": {
+          "name": "public_chat_idempotency_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"public_chat_idempotency\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )",
+          "withCheck": "exists (\n    select 1\n    from public_chat_conversation_sessions pcs\n    where pcs.conversation_id = \"public_chat_idempotency\".\"conversation_id\"\n      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')\n  )"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_idempotency_state_valid": {
+          "name": "public_chat_idempotency_state_valid",
+          "value": "\"public_chat_idempotency\".\"state\" in ('in_progress', 'completed')"
+        },
+        "public_chat_idempotency_command_kind_valid": {
+          "name": "public_chat_idempotency_command_kind_valid",
+          "value": "\"public_chat_idempotency\".\"command_kind\" in ('message', 'handoff', 'locale', 'close')"
+        },
+        "public_chat_idempotency_completion_valid": {
+          "name": "public_chat_idempotency_completion_valid",
+          "value": "(\"public_chat_idempotency\".\"state\" = 'completed' and \"public_chat_idempotency\".\"result\" is not null and \"public_chat_idempotency\".\"completed_at\" is not null) or (\"public_chat_idempotency\".\"state\" = 'in_progress' and \"public_chat_idempotency\".\"completed_at\" is null)"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_rate_limits": {
+      "name": "public_chat_rate_limits",
+      "schema": "",
+      "columns": {
+        "bucket_hash": {
+          "name": "bucket_hash",
+          "type": "char(64)",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "count": {
+          "name": "count",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "window_started_at": {
+          "name": "window_started_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_rate_limits_expiry_idx": {
+          "name": "public_chat_rate_limits_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_rate_limits_server_gateway_only": {
+          "name": "public_chat_rate_limits_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "public_chat_rate_limits_count_positive": {
+          "name": "public_chat_rate_limits_count_positive",
+          "value": "\"public_chat_rate_limits\".\"count\" > 0"
+        },
+        "public_chat_rate_limits_window_valid": {
+          "name": "public_chat_rate_limits_window_valid",
+          "value": "\"public_chat_rate_limits\".\"expires_at\" > \"public_chat_rate_limits\".\"window_started_at\""
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_sessions": {
+      "name": "public_chat_sessions",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_hash": {
+          "name": "session_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "csrf_hash": {
+          "name": "csrf_hash",
+          "type": "char(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revoked_at": {
+          "name": "revoked_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_sessions_expiry_idx": {
+          "name": "public_chat_sessions_expiry_idx",
+          "columns": [
+            {
+              "expression": "expires_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "with": {},
+          "method": "btree",
+          "concurrently": false
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "columns": [
+            "session_hash"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_sessions_server_gateway_only": {
+          "name": "public_chat_sessions_server_gateway_only",
+          "as": "PERMISSIVE",
+          "for": "ALL",
+          "to": [
+            "atlas_public_chat_gateway"
+          ],
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {},
+      "isRLSEnabled": true
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "views": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index 31b4267..31a2dcb 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -68,16 +68,23 @@
     {
       "idx": 9,
       "version": "7",
       "when": 1787251995592,
       "tag": "0009_m004_communications_cutover_guard",
       "breakpoints": true
     },
     {
       "idx": 10,
       "version": "7",
-      "when": 1787252190200,
+      "when": 1787254194838,
       "tag": "0010_m004_communications_canonical_cutover",
       "breakpoints": true
+    },
+    {
+      "idx": 11,
+      "version": "7",
+      "when": 1787254199495,
+      "tag": "0011_m004_receipt_security_hardening",
+      "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
index 341ea20..14866cd 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -1,36 +1,39 @@
 import { createHash } from "node:crypto";
 import {
   type AcceptInboundCommand,
   type AcceptInboundResult,
   type AmbiguousOptOutResolutionResult,
   type ApplyProviderStatusCommand,
   type ApproveTemplateDefinition,
   type BindingChangeResult,
   type ClaimInboundCommand,
   type ClaimOutboundCommand,
+  canonicalEndpointReference,
   type CommunicationsReferenceState,
   type CommunicationsRepository,
   type CompleteInboundCommand,
   type ConsentChangeResult,
   type ConsentRecord,
   type CreateOutboundCommand,
   type CreateOutboundResult,
+  type DispatchReconciliationOutcome,
   type EvaluateTemplateEligibility,
   evaluateAuthorityChange,
   evaluateOutboundPolicy,
   type FailOutboundDraftCommand,
   type FinalizeOutboundCommand,
   type GrantConsentCommand,
   type InboundClaimResult,
   type MarkDispatchOutcomeCommand,
   type OutboundClaimResult,
+  type OutboundAuthorizationReceipt,
   type OutboundCommandState,
   type ProviderStatusResult,
   type RecoveryCandidate,
   type RecoveryQuery,
   type ReconcileOutboundCommand,
   type ReconcileOutboundResult,
   type ReconcileTemplateCommand,
   type RegisterTemplateDefinition,
   type ResolveOptOutCommand,
   type RevalidateBindingCommand,
@@ -175,20 +178,28 @@ async function withCommunicationsTransaction<T>(
       localRole.current_role_name !== "atlas_communications_gateway"
     ) {
       throw new Error("COMMUNICATIONS_DATABASE_LOCAL_ROLE_UNPROVEN");
     }
     return work(tx);
   }) as Promise<T>;
 }
 
 const MAX_LEASE_MILLISECONDS = 15 * 60_000;
 const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
+const DISPATCH_OUTCOME_PERSISTENCE = {
+  accepted: { state: "provider_accepted", resultCode: "accepted" },
+  known_failure: { state: "failed", resultCode: "failed" },
+  unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" },
+} as const satisfies Record<
+  MarkDispatchOutcomeCommand["outcome"],
+  { state: OutboundCommandState; resultCode: "accepted" | "failed" | "dispatch_unknown" }
+>;
 const finiteDate = (value: unknown): value is Date =>
   value instanceof Date && Number.isFinite(value.getTime());
 const validLease = (now: Date, expiresAt: Date) =>
   finiteDate(now) &&
   finiteDate(expiresAt) &&
   expiresAt > now &&
   expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS;
 const currentReceipt = (receipt: { issuedAt: Date; expiresAt: Date }, now: Date) =>
   finiteDate(receipt.issuedAt) &&
   finiteDate(receipt.expiresAt) &&
@@ -201,21 +212,28 @@ type CommandRow = {
   conversation_id: string;
   binding_id: string;
   connection_id: string;
   locale: "es" | "en";
   purpose: "conversational" | "transactional" | "service" | "marketing";
   message_reference: string;
   template_key: string;
   expected_policy_version: number;
   required_fence: number;
   endpoint_digests: Array<{ version: string; digest: string }>;
+  destination_key: string | null;
+  message_body_digest: string;
   owning_receipt_id: string | null;
+  owning_domain: OutboundAuthorizationReceipt["owner"] | null;
+  owning_operation: OutboundAuthorizationReceipt["operation"] | null;
+  owning_reference: string | null;
+  owning_binding_id: string | null;
+  owning_destination_key: string | null;
   owning_receipt_issued_at: Date | null;
   owning_receipt_valid_until: Date | null;
   idempotency_key: string;
   fingerprint: string | null;
   correlation_id: string;
   state: OutboundCommandState;
   version: number;
   lease_owner_id: string | null;
   lease_expires_at: Date | null;
   created_at: Date;
@@ -247,88 +265,141 @@ type InboundRow = {
   message_created_at: Date;
 };
 
 export class PostgresCommunicationsRepository implements CommunicationsRepository {
   constructor(private readonly sql: CommunicationsSql) {}
 
   async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
     const activeDigest = input.endpointDigests[0];
     if (!activeDigest) return { status: "replay_mismatch", code: "provider_replay_mismatch" };
     return withCommunicationsTransaction(this.sql, async (tx) => {
+      const binding = (
+        await query<{
+          id: string;
+          endpoint_digest: string;
+          endpoint_digest_key_version: string;
+        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.envelope.event.bindingId])
+      )[0];
+      if (
+        !binding ||
+        !input.endpointDigests.some(
+          (digest) =>
+            digest.version === binding.endpoint_digest_key_version &&
+            digest.digest === binding.endpoint_digest,
+        )
+      ) {
+        return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
+      }
       const existing = (
         await query<{
           id: string;
           body_digest: string;
+          binding_id: string;
           endpoint_digest: string;
           endpoint_digest_key_version: string;
         }>(
           tx,
-          `select receipt.id, receipt.body_digest, binding.endpoint_digest,
+          `select receipt.id, receipt.body_digest, envelope.binding_id, binding.endpoint_digest,
              binding.endpoint_digest_key_version
            from communication_provider_event_receipts receipt
            join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
            join communication_contact_bindings binding on binding.id = envelope.binding_id
            where receipt.connection_id = $1 and receipt.external_event_reference = $2
            limit 1 for update`,
           [input.connectionId, input.providerEventId],
         )
       )[0];
       if (existing) {
-        if (existing.body_digest !== input.providerBodyDigest) {
+        if (
+          existing.body_digest !== input.providerBodyDigest ||
+          existing.binding_id !== input.envelope.event.bindingId
+        ) {
           return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
         }
         return {
           status: "duplicate",
           eventId: existing.id,
           endpointDigestVersion: existing.endpoint_digest_key_version,
           endpointDigest: existing.endpoint_digest,
         } as const;
       }
-
-      const binding = (
-        await query<{
-          id: string;
-          endpoint_digest: string;
-          endpoint_digest_key_version: string;
-        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.envelope.event.bindingId])
-      )[0];
-      if (
-        !binding ||
-        !input.endpointDigests.some(
-          (digest) =>
-            digest.version === binding.endpoint_digest_key_version &&
-            digest.digest === binding.endpoint_digest,
+      const policy = (
+        await query<{ version: number; fence_state: string }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
+          [binding.id, "transactional"],
         )
-      ) {
-        return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
-      }
-      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [binding.id, "transactional"]);
+      )[0];
+      if (!policy) return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
       const envelope = input.envelope;
+      const reserved = await query<{ id: string }>(
+        tx,
+        `insert into communication_provider_event_receipts (
+          id, connection_id, channel_kind, external_event_reference, body_digest,
+          event_kind, state, schema_version, signature_verified, correlation_id,
+          outcome_reason, processing_version, lease_owner_id, lease_token_hash,
+          lease_expires_at, received_at, persisted_at, processed_at, created_at, updated_at
+        ) values ($1, $2, 'whatsapp', $3, $4, 'text_message', 'persisted',
+          'meta-envelope.v1', true, $5, null, 1, null, null, null, $6, $6, null, $6, $6)
+        on conflict (connection_id, external_event_reference) do nothing returning id`,
+        [envelope.event.eventId, input.connectionId, input.providerEventId,
+          input.providerBodyDigest, envelope.event.correlationId, envelope.event.receivedAt],
+      );
+      if (!reserved[0]) {
+        const raced = (
+          await query<{ id: string; body_digest: string; binding_id: string;
+            endpoint_digest: string; endpoint_digest_key_version: string }>(tx,
+            `select receipt.id, receipt.body_digest, envelope.binding_id, binding.endpoint_digest,
+               binding.endpoint_digest_key_version
+             from communication_provider_event_receipts receipt
+             join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
+             join communication_contact_bindings binding on binding.id = envelope.binding_id
+             where receipt.connection_id = $1 and receipt.external_event_reference = $2
+             limit 1 for update of receipt`,
+            [input.connectionId, input.providerEventId])
+        )[0];
+        if (!raced || raced.body_digest !== input.providerBodyDigest ||
+          raced.binding_id !== input.envelope.event.bindingId) {
+          return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
+        }
+        return { status: "duplicate", eventId: raced.id,
+          endpointDigestVersion: raced.endpoint_digest_key_version,
+          endpointDigest: raced.endpoint_digest } as const;
+      }
       await query(
         tx,
         `insert into communication_conversations (
           id, channel_kind, locale, status, version, correlation_id, last_activity_at,
           expires_at, closed_at, reconciliation_required, created_at, updated_at
         ) values ($1, 'whatsapp', $2, $3, $4, $5, $6, null, $7, false, $8, $9)
         on conflict (id) do nothing`,
         [
           envelope.conversation.id,
           envelope.conversation.locale,
           envelope.conversation.status,
           envelope.conversation.version,
           envelope.event.correlationId,
           envelope.conversation.lastActivityAt,
           envelope.conversation.closedAt ?? null,
           envelope.conversation.createdAt,
           envelope.conversation.updatedAt,
         ],
       );
+      await query(tx, `select id from communication_conversations where id = $1 for update`, [
+        envelope.conversation.id,
+      ]);
+      const ordinal = (
+        await query<{ ordinal: number }>(tx,
+          `select coalesce(max(ordinal), 0)::integer + 1 as ordinal
+           from communication_messages where conversation_id = $1`,
+          [envelope.conversation.id])
+      )[0]?.ordinal ?? 1;
       const participantKind =
         envelope.participant.role === "external_contact"
           ? "external"
           : envelope.participant.role === "assistant"
             ? "automated"
             : envelope.participant.role;
       await query(
         tx,
         `insert into communication_participants (
           id, conversation_id, channel_kind, kind, channel_binding_id,
@@ -342,83 +413,66 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
           envelope.participant.bindingId,
           envelope.participant.createdAt,
         ],
       );
       await query(
         tx,
         `insert into communication_messages (
           id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
           recipient_participant_id, locale, kind, state, body, body_stored,
           body_retention_policy, actions, rejection_reason, external_message_reference, created_at
-        ) values ($1, $2, 'whatsapp', 1, $3, $4, $5, $6, $7, 'accepted', null, false,
-          'metadata_only', '[]'::jsonb, null, null, $8)
+        ) values ($1, $2, 'whatsapp', $3, $4, $5, $6, $7, $8, 'accepted', null, false,
+          'metadata_only', '[]'::jsonb, null, null, $9)
         on conflict (id) do nothing`,
         [
           envelope.message.id,
           envelope.message.conversationId,
+          ordinal,
           envelope.message.direction,
           envelope.message.senderParticipantId,
           envelope.message.recipientParticipantId ?? null,
           envelope.message.locale,
           envelope.message.kind,
           envelope.message.createdAt,
         ],
       );
-      await query(
-        tx,
-        `insert into communication_provider_event_receipts (
-          id, connection_id, channel_kind, external_event_reference, body_digest,
-          event_kind, state, schema_version, signature_verified, correlation_id,
-          outcome_reason, processing_version, lease_owner_id, lease_token_hash,
-          lease_expires_at, received_at, persisted_at, processed_at, created_at, updated_at
-        ) values ($1, $2, 'whatsapp', $3, $4, 'text_message', 'persisted',
-          'meta-envelope.v1', true, $5, null, 0, null, null, null, $6, $6, null, $6, $6)`,
-        [
-          envelope.event.eventId,
-          input.connectionId,
-          input.providerEventId,
-          input.providerBodyDigest,
-          envelope.event.correlationId,
-          envelope.event.receivedAt,
-        ],
-      );
       await query(
         tx,
         `insert into communication_event_envelopes (
           id, receipt_id, connection_id, channel_kind, event_kind, schema_version,
           conversation_id, participant_id, binding_id, message_id, message_reference,
           canonical_text, body_retention_policy, occurred_at, created_at, updated_at
         ) values ($1, $1, $2, 'whatsapp', 'text_message', 'meta-envelope.v1',
           $3, $4, $5, $6, $6, null, 'metadata_only', $7, $7, $7)`,
         [
           envelope.event.eventId,
           input.connectionId,
           envelope.conversation.id,
           envelope.participant.participantId,
           envelope.event.bindingId,
           envelope.message.id,
           envelope.event.receivedAt,
         ],
       );
-      if (input.optOutSignal === "pending") {
-        await query(
+      let resultingPolicyVersion = policy.version;
+      if (input.optOutSignal === "pending" && policy.fence_state !== "withdrawn") {
+        const updatedPolicy = await query<{ version: number }>(
           tx,
           `update communication_contact_policies
-           set fence_state = case when fence_state = 'withdrawn' then fence_state else 'opt_out_pending' end,
-             version = case when fence_state = 'withdrawn' then version else version + 1 end,
-             fence = case when fence_state = 'withdrawn' then fence else fence + 1 end,
+           set fence_state = 'opt_out_pending', version = version + 1, fence = fence + 1,
              evaluated_at = $2, updated_at = $2
-           where binding_id = $1 and purpose = 'transactional'`,
+           where binding_id = $1 and purpose = 'transactional' returning version`,
           [envelope.event.bindingId, envelope.event.receivedAt],
         );
+        resultingPolicyVersion = updatedPolicy[0]?.version ?? policy.version;
       }
-      await this.appendAudit(tx, envelope, input.optOutSignal === "pending" ? 8 : 7);
+      await this.appendAudit(tx, envelope, resultingPolicyVersion);
       return {
         status: "accepted",
         eventId: envelope.event.eventId,
         endpointDigestVersion: binding.endpoint_digest_key_version,
         endpointDigest: binding.endpoint_digest,
       } as const;
     });
   }
 
   async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
@@ -523,54 +577,101 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
            and processing_version = $3 and lease_expires_at > $4
          returning id`,
         [input.eventId, sha256(input.leaseOwner), input.leaseVersion, input.now, input.outcome],
       );
       return rows.length === 1 ? "completed" : "conflict";
     });
   }
 
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
+      const binding = (
+        await query<{ connection_id: string }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
+          [input.command.bindingId],
+        )
+      )[0];
+      if (!binding) return { status: "conflict", code: "idempotency_mismatch" } as const;
+      const messageBodyDigest = sha256(JSON.stringify(input.message.body));
       const existing = (
         await query<CommandRow>(
           tx,
-          `select * from communication_outbound_commands where idempotency_key = $1 limit 1 for update`,
-          [input.command.idempotencyKey],
+          `select * from communication_outbound_commands
+           where binding_id = $1 and idempotency_key = $2 limit 1 for update`,
+          [input.command.bindingId, input.command.idempotencyKey],
         )
       )[0];
       if (existing) {
         if (
-          existing.binding_id !== input.command.bindingId ||
           existing.conversation_id !== input.command.conversationId ||
-          existing.message_reference !== input.message.id ||
+          existing.message_body_digest !== messageBodyDigest ||
           existing.purpose !== input.purpose ||
           existing.template_key !== input.templateId
         ) {
           return { status: "conflict", code: "idempotency_mismatch" } as const;
         }
         const reason = this.duplicateReason(existing);
         return {
           status: "duplicate",
           commandId: existing.id,
           messageId: existing.message_reference,
           commandState: existing.state,
           ...(reason ? { reason } : {}),
         } as const;
       }
-      const binding = (
-        await query<{ connection_id: string }>(
-          tx,
-          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
-          [input.command.bindingId],
-        )
-      )[0];
-      if (!binding) return { status: "conflict", code: "idempotency_mismatch" } as const;
+      const inserted = await query<{ id: string }>(
+        tx,
+        `insert into communication_outbound_commands (
+          id, conversation_id, binding_id, connection_id, channel_kind, locale, purpose,
+          message_reference, template_key, template_definition_version, destination_key,
+          message_body_digest, owning_receipt_id, owning_domain, owning_operation,
+          owning_reference, owning_binding_id, owning_destination_key,
+          owning_receipt_issued_at, owning_receipt_valid_until, expected_policy_version,
+          required_fence, endpoint_digests, idempotency_key, fingerprint, correlation_id,
+          state, failure_code, version, lease_owner_id, lease_token_hash, lease_expires_at,
+          scheduled_at, expires_at, created_at, updated_at
+        ) values ($1, $2, $3, $4, 'whatsapp', $5, $6, $7, $8, null, null, $9,
+          null, null, null, null, null, null, null, null, null, null, '[]'::jsonb,
+          $10, null, $11, 'draft', null, 0, null, null, null, null, null, $12, $12)
+        on conflict (binding_id, idempotency_key) do nothing returning id`,
+        [
+          input.command.commandId,
+          input.command.conversationId,
+          input.command.bindingId,
+          binding.connection_id,
+          input.command.locale,
+          input.purpose,
+          input.message.id,
+          input.templateId,
+          messageBodyDigest,
+          input.command.idempotencyKey,
+          input.command.correlationId,
+          input.command.createdAt,
+        ],
+      );
+      if (!inserted[0]) {
+        const raced = (
+          await query<CommandRow>(tx,
+            `select * from communication_outbound_commands
+             where binding_id = $1 and idempotency_key = $2 limit 1 for update`,
+            [input.command.bindingId, input.command.idempotencyKey])
+        )[0];
+        if (!raced || raced.conversation_id !== input.command.conversationId ||
+          raced.message_body_digest !== messageBodyDigest || raced.purpose !== input.purpose ||
+          raced.template_key !== input.templateId) {
+          return { status: "conflict", code: "idempotency_mismatch" } as const;
+        }
+        const reason = this.duplicateReason(raced);
+        return { status: "duplicate", commandId: raced.id, messageId: raced.message_reference,
+          commandState: raced.state, ...(reason ? { reason } : {}) } as const;
+      }
       await query(
         tx,
         `insert into communication_participants (
           id, conversation_id, channel_kind, kind, channel_binding_id,
           joined_at, left_at, created_at, updated_at
         ) values ($1, $2, 'whatsapp', 'system', null, $3, null, $3, $3)
         on conflict (id) do nothing`,
         [input.message.senderParticipantId, input.message.conversationId, input.message.createdAt],
       );
       const ordinal = (
@@ -593,82 +694,76 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
           input.message.id,
           input.message.conversationId,
           ordinal,
           input.message.senderParticipantId,
           input.message.recipientParticipantId ?? null,
           input.message.locale,
           input.message.kind,
           input.message.createdAt,
         ],
       );
-      await query(
-        tx,
-        `insert into communication_outbound_commands (
-          id, conversation_id, binding_id, connection_id, channel_kind, locale, purpose,
-          message_reference, template_key, template_definition_version, destination_key,
-          owning_receipt_id, owning_domain, owning_reference, owning_receipt_issued_at,
-          owning_receipt_valid_until, owning_receipt_correlation_id, expected_policy_version,
-          required_fence, endpoint_digests, idempotency_key, fingerprint, correlation_id,
-          state, failure_code, version, lease_owner_id, lease_token_hash, lease_expires_at,
-          scheduled_at, expires_at, created_at, updated_at
-        ) values ($1, $2, $3, $4, 'whatsapp', $5, $6, $7, $8, null, null,
-          null, null, null, null, null, null, null, null, '[]'::jsonb,
-          $9, null, $10, 'draft', null, 0, null, null, null, null, null, $11, $11)`,
-        [
-          input.command.commandId,
-          input.command.conversationId,
-          input.command.bindingId,
-          binding.connection_id,
-          input.command.locale,
-          input.purpose,
-          input.message.id,
-          input.templateId,
-          input.command.idempotencyKey,
-          input.command.correlationId,
-          input.command.createdAt,
-        ],
-      );
       return {
         status: "created",
         commandId: input.command.commandId,
         messageId: input.message.id,
       } as const;
     });
   }
 
   async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
     const activeDigest = input.endpointDigests[0];
-    if (!activeDigest) return { status: "conflict", code: "idempotency_mismatch" };
+    const receipt = input.authorizationReceipt;
+    if (!activeDigest || !receipt) return { status: "conflict", code: "idempotency_mismatch" };
+    const destinationReference = canonicalEndpointReference(activeDigest.digest);
     return withCommunicationsTransaction(this.sql, async (tx) => {
-      const receipt = input.authorizationReceipt;
+      const command = (
+        await query<CommandRow>(tx,
+          `select * from communication_outbound_commands where id = $1 and state = 'draft' for update`,
+          [input.commandId])
+      )[0];
+      if (!command) return { status: "conflict", code: "idempotency_mismatch" } as const;
+      const context = await this.loadOutboundPolicyContext(tx, command);
+      if (!context) return { status: "conflict", code: "idempotency_mismatch" } as const;
+      const decision = evaluateOutboundPolicy({
+        ...context,
+        requiredPolicyVersion: input.requiredPolicyVersion,
+        requiredFence: input.requiredFence,
+        authorizationReceipt: receipt,
+        destinationKey: destinationReference,
+        now: input.now,
+      });
+      if (!decision.allowed) return { status: "conflict", code: "idempotency_mismatch" } as const;
       const rows = await query<{ id: string; message_reference: string }>(
         tx,
         `update communication_outbound_commands
          set fingerprint = $2, expected_policy_version = $3, required_fence = $4,
-           endpoint_digests = $5::jsonb, destination_key = $6,
-           owning_receipt_id = $7, owning_domain = $8, owning_reference = $9,
-           owning_receipt_issued_at = $10, owning_receipt_valid_until = $11,
-           owning_receipt_correlation_id = correlation_id, state = 'queued',
-           version = version + 1, updated_at = $12
+            endpoint_digests = $5::jsonb, destination_key = $6,
+            owning_receipt_id = $7, owning_domain = $8, owning_operation = $9,
+            owning_reference = $10, owning_binding_id = $11, owning_destination_key = $12,
+            owning_receipt_issued_at = $13, owning_receipt_valid_until = $14,
+            state = 'queued', version = version + 1, updated_at = $15
          where id = $1 and state = 'draft' returning id, message_reference`,
         [
           input.commandId,
           input.fingerprint,
           input.requiredPolicyVersion,
           input.requiredFence,
           JSON.stringify(input.endpointDigests),
-          activeDigest.digest,
-          receipt?.receiptId ?? null,
-          receipt?.owner ?? null,
-          receipt?.destinationKey ?? null,
-          receipt?.issuedAt ?? null,
-          receipt?.expiresAt ?? null,
+          destinationReference,
+          receipt.receiptId,
+          receipt.owner,
+          receipt.operation,
+          `outbound_command:${input.commandId}`,
+          receipt.bindingId,
+          receipt.destinationKey,
+          receipt.issuedAt,
+          receipt.expiresAt,
           input.now,
         ],
       );
       return rows[0]
         ? { status: "created", commandId: rows[0].id, messageId: rows[0].message_reference }
         : { status: "conflict", code: "idempotency_mismatch" };
     });
   }
 
   async failOutboundDraft(input: FailOutboundDraftCommand): Promise<"completed" | "conflict"> {
@@ -739,20 +834,24 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       const template = (
         await query<{ internally_approved: boolean; state: string }>(
           tx,
           `select internally_approved, state from communication_message_templates
            where template_key = $1 and locale = $2 limit 1`,
           [command.template_key, command.locale],
         )
       )[0];
       const activeDigest = command.endpoint_digests?.[0];
       if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" } as const;
+      const destinationReference = canonicalEndpointReference(activeDigest.digest);
+      if (command.destination_key !== destinationReference) {
+        return { status: "not_claimed", code: "destination_mismatch" } as const;
+      }
       const decision = evaluateOutboundPolicy({
         purpose: command.purpose,
         binding: {
           bindingId: binding.id,
           trustState: binding.trust_state as import("@atlas/domain").BindingTrustState,
           freshUntil: binding.verification_expires_at ?? new Date(Number.NaN),
         },
         contactPolicy: {
           state: policy.fence_state,
           version: policy.version,
@@ -770,33 +869,37 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
             issuedAt: consent.receipt_issued_at,
             expiresAt: consent.receipt_valid_until,
           },
         },
         connectionState: connection?.readiness_state ?? "disabled",
         template: {
           eligible: Boolean(template?.internally_approved && template.state === "provider_approved"),
         },
         authorizationReceipt:
           command.owning_receipt_id &&
+          command.owning_domain &&
+          command.owning_operation &&
+          command.owning_binding_id &&
+          command.owning_destination_key &&
           command.owning_receipt_issued_at &&
           command.owning_receipt_valid_until
             ? {
                 receiptId: command.owning_receipt_id,
-                owner: "communications",
-                operation: "outbound_dispatch",
-                bindingId: binding.id,
-                destinationKey: activeDigest.digest,
+                owner: command.owning_domain,
+                operation: command.owning_operation,
+                bindingId: command.owning_binding_id,
+                destinationKey: command.owning_destination_key,
                 issuedAt: command.owning_receipt_issued_at,
                 expiresAt: command.owning_receipt_valid_until,
               }
             : undefined,
-        destinationKey: activeDigest.digest,
+        destinationKey: destinationReference,
         now: input.now,
       });
       if (!decision.allowed) return { status: "not_claimed", code: decision.code };
 
       const duplicateAttempt = await query<{ id: string }>(
         tx,
         `select id from communication_dispatch_attempts where id = $1 limit 1`,
         [input.attemptId],
       );
       if (duplicateAttempt[0]) return { status: "not_claimed", code: "lease_conflict" };
@@ -943,34 +1046,30 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
           ? "completed"
           : "conflict";
       }
       if (
         command.state !== "dispatching" ||
         command.lease_owner_id !== ownerHash ||
         command.version !== input.leaseVersion
       ) {
         return "conflict";
       }
-      const state: OutboundCommandState =
-        input.outcome === "accepted"
-          ? "provider_accepted"
-          : input.outcome === "unknown"
-            ? "dispatch_unknown"
-            : "failed";
+      const persistence = DISPATCH_OUTCOME_PERSISTENCE[input.outcome];
+      const state = persistence.state;
       await query(
         tx,
         `update communication_dispatch_attempts set state = $2, result_code = $3,
            provider_reference_digest = $4, completed_at = $5, updated_at = $5 where id = $1`,
         [
           input.attemptId,
           state,
-          input.outcome,
+          persistence.resultCode,
           input.providerReference ? sha256(input.providerReference) : null,
           input.now,
         ],
       );
       await query(
         tx,
         `update communication_outbound_commands set state = $2, lease_owner_id = null,
            lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
         [input.commandId, state, input.now],
       );
@@ -1047,80 +1146,95 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
     return withCommunicationsTransaction(this.sql, async (tx) => {
       await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
       const policy = (
         await query<{ consent_state: ConsentRecord["state"]; version: number }>(
           tx,
           COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
           [input.bindingId, input.purpose],
         )
       )[0];
       if (!policy) return { status: "denied", code: "policy_state_invalid" } as const;
+      if (policy.consent_state === "withdrawn" && input.operation !== "reconsent") {
+        return { status: "denied", code: "reconsent_receipt_required" } as const;
+      }
       if (input.operation === "reconsent" && policy.consent_state !== "withdrawn") {
         return { status: "denied", code: "reconsent_receipt_required" } as const;
       }
-      if (policy.consent_state === "granted") {
-        return { status: "unchanged", state: "granted", version: policy.version } as const;
+      const latest = (
+        await query<{ evidence_receipt_id: string; authority_version: number }>(tx,
+          `select evidence_receipt_id, authority_version
+           from communication_contact_evidence_events
+           where binding_id = $1 and purpose = $2
+             and event_kind in ('consent_granted', 'consent_regranted')
+           order by sequence desc limit 1 for update`,
+          [input.bindingId, input.purpose])
+      )[0];
+      if (policy.consent_state === "granted" && latest?.evidence_receipt_id === input.receipt!.receiptId) {
+        return { status: "duplicate", state: "granted", version: latest.authority_version } as const;
       }
-      const nextVersion = policy.version + 1;
+      const nextAuthorityVersion = (latest?.authority_version ?? 0) + 1;
+      const nextPolicyVersion = policy.version + 1;
       await this.appendEvidence(tx, {
         bindingId: input.bindingId,
         eventKind: input.operation === "reconsent" ? "consent_regranted" : "consent_granted",
         purpose: input.purpose,
         consentState: "granted",
         fenceState: input.operation === "reconsent" ? "normal_after_review" : "normal",
         receiptId: input.receipt!.receiptId,
         receiptKind: "consent_evidence",
         owningDomain: "M078",
         authorityRole: "consent",
-        authorityVersion: nextVersion,
+        authorityVersion: nextAuthorityVersion,
         correlationId: input.receipt!.receiptId,
         issuedAt: input.receipt!.issuedAt,
         expiresAt: input.receipt!.expiresAt,
         occurredAt: input.now,
       });
       await query(
         tx,
         `update communication_contact_policies set consent_state = 'granted',
            fence_state = $3, evidence_receipt_id = $4, version = $2, fence = fence + 1,
            evaluated_at = $5, updated_at = $5 where binding_id = $1 and purpose = $6`,
         [
           input.bindingId,
-          nextVersion,
+          nextPolicyVersion,
           input.operation === "reconsent" ? "normal_after_review" : "normal",
           input.receipt!.receiptId,
           input.now,
           input.purpose,
         ],
       );
-      return { status: "changed", state: "granted", version: nextVersion } as const;
+      return { status: "changed", state: "granted", version: nextAuthorityVersion } as const;
     });
   }
 
   async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
     const evidence = input.evidence;
     if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
     const receipt = evidence.receipt;
     if (
       receipt.bindingId !== input.bindingId ||
       !receipt.receiptId ||
       !receipt.correlationId ||
       !currentReceipt(receipt, input.now) ||
+      (evidence.source === "inbound_event" &&
+        (receipt.owner !== "communications" || receipt.operation !== "inbound_opt_out")) ||
       (evidence.source === "authority" &&
         (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal"))
     ) {
       return { status: "denied", code: "withdrawal_evidence_invalid" };
     }
     return withCommunicationsTransaction(this.sql, async (tx) => {
       await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
-      const policies = await query<{ fence_state: string; version: number; fence: number }>(
+      const policies = await query<{ purpose: string; fence_state: string; version: number; fence: number }>(
         tx,
-        `select fence_state, version, fence from communication_contact_policies
+        `select purpose, fence_state, version, fence from communication_contact_policies
          where binding_id = $1 for update`,
         [input.bindingId],
       );
       if (evidence.source === "inbound_event") {
         const source = await query<{ valid: boolean }>(
           tx,
           `select true as valid from communication_event_envelopes envelope
            join communication_provider_event_receipts receipt on receipt.id = envelope.receipt_id
            where receipt.id = $1 and envelope.binding_id = $2 and receipt.correlation_id = $3`,
           [evidence.receipt.eventId, input.bindingId, receipt.correlationId],
@@ -1129,20 +1243,39 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       }
       if (policies.length > 0 && policies.every((policy) => policy.fence_state === "withdrawn")) {
         return {
           status: "duplicate",
           state: "withdrawn",
           policyVersion: policies[0]!.version,
           fence: policies[0]!.fence,
           cancelledCommandIds: [],
         } as const;
       }
+      const evidencePolicy = policies[0];
+      if (!evidencePolicy) return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
+      await this.appendEvidence(tx, {
+        bindingId: input.bindingId,
+        eventKind: "consent_withdrawn",
+        purpose: evidencePolicy.purpose,
+        consentState: "withdrawn",
+        fenceState: "withdrawn",
+        receiptId: receipt.receiptId,
+        receiptKind: "contact_withdrawal",
+        owningDomain: evidence.source === "inbound_event" ? "M004" : "M078",
+        authorityRole: evidence.source === "inbound_event" ? "channel_policy_detection" : "consent",
+        authorityVersion: evidencePolicy.version + 1,
+        correlationId: receipt.correlationId,
+        issuedAt: receipt.issuedAt,
+        expiresAt: receipt.expiresAt,
+        occurredAt: input.now,
+        triggeringEventId: evidence.source === "inbound_event" ? evidence.receipt.eventId : undefined,
+      });
       const cancelled = await query<{ id: string }>(
         tx,
         `update communication_outbound_commands set state = 'cancelled',
            failure_code = 'contact_policy_denied', version = version + 1, updated_at = $2
          where binding_id = $1 and state = 'queued' returning id`,
         [input.bindingId, input.now],
       );
       await query(
         tx,
         `update communication_contact_policies set consent_state = 'withdrawn',
@@ -1370,20 +1503,23 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const row = (
         await query<{ definition_version: number; internally_approved: boolean; state: TemplateLifecycleState; projection_version: number; updated_at: Date }>(
           tx,
           `select definition_version, internally_approved, state, projection_version, updated_at
            from communication_message_templates where template_key = $1 and locale = $2 for update`,
           [input.templateId, input.locale],
         )
       )[0];
       if (!row) return { status: "not_found", code: "template_not_found" } as const;
+      if (receipt.definitionVersion !== row.definition_version) {
+        return { status: "denied", code: "provider_receipt_invalid" } as const;
+      }
       const status =
         input.providerVersion < row.projection_version
           ? "regressive"
           : input.providerVersion === row.projection_version
             ? "duplicate"
             : "applied";
       if (status === "applied") {
         await query(
           tx,
           `update communication_message_templates set state = $3, projection_version = $4,
@@ -1417,41 +1553,43 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
   }
 
   async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
     const receipt = input.receipt;
     if (!receipt) return { status: "denied", code: "reconciliation_receipt_missing" };
     if (
       receipt.owner !== "communications" ||
       receipt.operation !== "dispatch_reconciliation" ||
       receipt.commandId !== input.commandId ||
       receipt.attemptId !== input.attemptId ||
+      !["provider_lookup", "manual_authority"].includes(receipt.source) ||
+      !["reconciled_accepted", "confirmed_not_sent", "terminal_failure"].includes(receipt.outcome) ||
       !receipt.receiptId ||
       !currentReceipt(receipt, input.now)
     ) {
       return { status: "denied", code: "reconciliation_receipt_invalid" };
     }
     const digest = sha256(
       JSON.stringify([
         receipt.receiptId,
         receipt.source,
         receipt.bindingId,
         receipt.commandId,
         receipt.attemptId,
         receipt.outcome,
         receipt.issuedAt.toISOString(),
         receipt.expiresAt.toISOString(),
         receipt.correlationId,
       ]),
     );
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const prior = (
-        await query<{ receipt_digest: string; outcome: string }>(
+        await query<{ receipt_digest: string; outcome: DispatchReconciliationOutcome }>(
           tx,
           `select receipt_digest, outcome from communication_dispatch_reconciliation_receipts
            where receipt_id = $1 for update`,
           [receipt.receiptId],
         )
       )[0];
       if (prior) {
         if (prior.receipt_digest !== digest) {
           return { status: "conflict", code: "reconciliation_receipt_mismatch" } as const;
         }
@@ -1585,29 +1723,29 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
           ? { kind: row.kind, eventId: row.event_id! }
           : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
       );
     });
   }
 
   async referenceState(): Promise<CommunicationsReferenceState> {
     return withCommunicationsTransaction(this.sql, async (tx) => {
       const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
         await Promise.all([
-          query<Record<string, unknown>>(tx, `select id as "eventId", state, processing_version as "leaseVersion" from communication_provider_event_receipts order by id`),
+          query<Record<string, unknown>>(tx, `select receipt.id as "eventId", receipt.state, receipt.processing_version as "leaseVersion", message.ordinal from communication_provider_event_receipts receipt join communication_event_envelopes envelope on envelope.receipt_id = receipt.id join communication_messages message on message.id = envelope.message_id order by receipt.id`),
           query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
-          query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, result_code as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
+          query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, case result_code when 'failed' then 'known_failure' when 'dispatch_unknown' then 'unknown' else result_code end as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
           query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
           query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
           query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, evidence_receipt_id as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
           query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
           query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
-          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", receipt_kind as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'consent_withdrawn' order by binding_id, sequence`),
+          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'consent_withdrawn' order by binding_id, sequence`),
         ]);
       return {
         inbound,
         outbound,
         attempts,
         policies: policies as unknown as CommunicationsReferenceState["policies"],
         bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
         consentHistory: consentHistory as unknown as CommunicationsReferenceState["consentHistory"],
         templates: templates as unknown as CommunicationsReferenceState["templates"],
         providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
@@ -1699,21 +1837,98 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       return "outbound_reconciliation_required";
     }
     if (row.state === "failed") {
       return (row.failure_code as Extract<CreateOutboundResult, { status: "duplicate" }>["reason"]) ?? "outbound_command_failed";
     }
     if (row.state === "cancelled") return "outbound_command_cancelled";
     if (row.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
     return "outbound_command_completed";
   }
 
-  private reconciledState(outcome: string): "reconciled_accepted" | "confirmed_not_sent" | "failed" {
+  private async loadOutboundPolicyContext(tx: TransactionSql, command: CommandRow) {
+    const binding = (
+      await query<{
+        id: string;
+        trust_state: import("@atlas/domain").BindingTrustState;
+        verification_expires_at: Date | null;
+      }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [command.binding_id])
+    )[0];
+    if (!binding) return undefined;
+    const policy = (
+      await query<{
+        consent_state: ConsentRecord["state"];
+        fence_state: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
+        version: number;
+        fence: number;
+      }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [command.binding_id, command.purpose])
+    )[0];
+    if (!policy) return undefined;
+    const consent = (
+      await query<{ evidence_receipt_id: string; receipt_issued_at: Date; receipt_valid_until: Date }>(
+        tx,
+        `select evidence_receipt_id, receipt_issued_at, receipt_valid_until
+         from communication_contact_evidence_events
+         where binding_id = $1 and purpose = $2
+           and event_kind in ('consent_granted', 'consent_regranted')
+         order by sequence desc limit 1`,
+        [command.binding_id, command.purpose],
+      )
+    )[0];
+    if (!consent) return undefined;
+    const connection = (
+      await query<{ readiness_state: import("@atlas/domain").ChannelConnectionState }>(
+        tx,
+        `select readiness_state from communication_channel_connections where id = $1`,
+        [command.connection_id],
+      )
+    )[0];
+    const template = (
+      await query<{ internally_approved: boolean; state: string }>(
+        tx,
+        `select internally_approved, state from communication_message_templates
+         where template_key = $1 and locale = $2 limit 1`,
+        [command.template_key, command.locale],
+      )
+    )[0];
+    return {
+      purpose: command.purpose,
+      binding: {
+        bindingId: binding.id,
+        trustState: binding.trust_state,
+        freshUntil: binding.verification_expires_at ?? new Date(Number.NaN),
+      },
+      contactPolicy: {
+        state: policy.fence_state,
+        version: policy.version,
+        fence: policy.fence,
+      },
+      consent: {
+        state: policy.consent_state,
+        receipt: {
+          receiptId: consent.evidence_receipt_id,
+          owner: "consent" as const,
+          operation: "consent_confirmation" as const,
+          bindingId: binding.id,
+          issuedAt: consent.receipt_issued_at,
+          expiresAt: consent.receipt_valid_until,
+        },
+      },
+      connectionState: connection?.readiness_state ?? ("disabled" as const),
+      template: {
+        eligible: Boolean(template?.internally_approved && template.state === "provider_approved"),
+      },
+    };
+  }
+
+  private reconciledState(
+    outcome: DispatchReconciliationOutcome,
+  ): "reconciled_accepted" | "confirmed_not_sent" | "failed" {
     return outcome === "reconciled_accepted"
       ? "reconciled_accepted"
       : outcome === "confirmed_not_sent"
         ? "confirmed_not_sent"
         : "failed";
   }
 
   private async appendAudit(
     tx: TransactionSql,
     envelope: AcceptInboundCommand["envelope"],
@@ -1758,20 +1973,21 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
       bindingId: string;
       eventKind: string;
       purpose: string;
       consentState: string;
       fenceState: string;
       receiptId: string;
       receiptKind: string;
       owningDomain: string;
       authorityRole: string;
       authorityVersion: number;
+      triggeringEventId?: string;
       correlationId: string;
       issuedAt: Date;
       expiresAt: Date;
       occurredAt: Date;
     },
   ): Promise<void> {
     const sequence = (
       await query<{ sequence: number }>(
         tx,
         `select coalesce(max(sequence), 0)::integer + 1 as sequence
@@ -1781,32 +1997,33 @@ export class PostgresCommunicationsRepository implements CommunicationsRepositor
     )[0]?.sequence ?? 1;
     await query(
       tx,
       `insert into communication_contact_evidence_events (
         id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
         binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
         owning_domain, authority_role, authority_version, triggering_event_id,
         policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
         occurred_at, created_at
       ) values ($1, $2, $3, $4, $5, $6, $7, null, null, $8, $9, $10, $11,
-        $12, null, null, $13, $14, $15, $16, $16)`,
+        $12, $13, null, $14, $15, $16, $17, $17)`,
       [
         `evidence_${sha256(`${input.bindingId}:${sequence}`).slice(0, 24)}`,
         input.bindingId,
         sequence,
         input.eventKind,
         input.purpose,
         input.consentState,
         input.fenceState,
         input.receiptId,
         input.receiptKind,
         input.owningDomain,
         input.authorityRole,
         input.authorityVersion,
+        input.triggeringEventId ?? null,
         input.correlationId,
         input.issuedAt,
         input.expiresAt,
         input.occurredAt,
       ],
     );
   }
 }
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index 4eb6090..3e1f850 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -50,20 +50,26 @@ const publicSessionId = sql`nullif(current_setting('atlas.public_chat_session_id
 const publicConversationScope = (conversationId: unknown, channelKind: unknown) =>
   sql`${channelKind} = 'public_web' and exists (
     select 1
     from public_chat_conversation_sessions pcs
     where pcs.conversation_id = ${conversationId}
       and pcs.session_id = ${publicSessionId}
   )`;
 
 const communicationsConversationScope = (channelKind: unknown) => sql`${channelKind} = 'whatsapp'`;
 
+const communicationsCommandScope = (commandId: unknown) =>
+  sql`exists (
+    select 1 from communication_outbound_commands command
+    where command.id = ${commandId} and command.channel_kind = 'whatsapp'
+  )`;
+
 const publicChildConversationScope = (conversationId: unknown) =>
   sql`exists (
     select 1
     from public_chat_conversation_sessions pcs
     where pcs.conversation_id = ${conversationId}
       and pcs.session_id = ${publicSessionId}
   )`;
 
 const publicCitationScope = (messageId: unknown) =>
   sql`exists (
@@ -487,29 +493,29 @@ export const communicationContactEvidenceEvents = pgTable(
       table.bindingId,
       table.sequence,
     ),
     unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId),
     check(
       "communication_contact_evidence_events_kind_valid",
       sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
     ),
     check(
       "communication_contact_evidence_events_authority_valid",
-      sql`(${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
+      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} = 'consent_withdrawn' and ((${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.owningDomain} = 'M004' and ${table.authorityRole} = 'channel_policy_detection'))) or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
     ),
     check(
       "communication_contact_evidence_events_receipt_valid",
       sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
     ),
     check(
       "communication_contact_evidence_events_state_shape_valid",
-      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
+      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ((${table.owningDomain} = 'M078' and ${table.triggeringEventId} is null) or (${table.owningDomain} = 'M004' and ${table.triggeringEventId} is not null)) and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
     ),
     check("communication_contact_evidence_events_sequence_positive", sql`${table.sequence} > 0`),
     check(
       "communication_contact_evidence_events_receipt_window_valid",
       sql`(${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.receiptIssuedAt} is not null and ${table.receiptValidUntil} is not null and ${table.receiptValidUntil} > ${table.receiptIssuedAt})`,
     ),
     index("communication_contact_evidence_events_binding_idx").on(table.bindingId, table.sequence),
     pgPolicy("communication_contact_evidence_events_communications_select", {
       as: "permissive",
       for: "select",
@@ -1070,26 +1076,29 @@ export const communicationOutboundCommands = pgTable(
     conversationId: text("conversation_id").notNull(),
     bindingId: text("binding_id").notNull(),
     connectionId: text("connection_id").notNull(),
     channelKind: varchar("channel_kind", { length: 16 }).notNull(),
     locale: varchar("locale", { length: 2 }).notNull(),
     purpose: varchar("purpose", { length: 24 }).notNull(),
     messageReference: text("message_reference"),
     templateKey: varchar("template_key", { length: 120 }),
     templateDefinitionVersion: varchar("template_definition_version", { length: 80 }),
     destinationKey: varchar("destination_key", { length: 120 }),
+    messageBodyDigest: char("message_body_digest", { length: 64 }).notNull(),
     owningReceiptId: text("owning_receipt_id"),
     owningDomain: varchar("owning_domain", { length: 80 }),
+    owningOperation: varchar("owning_operation", { length: 80 }),
     owningReference: text("owning_reference"),
+    owningBindingId: text("owning_binding_id"),
+    owningDestinationKey: varchar("owning_destination_key", { length: 120 }),
     owningReceiptIssuedAt: timestamp("owning_receipt_issued_at", { withTimezone: true, mode: "date" }),
     owningReceiptValidUntil: timestamp("owning_receipt_valid_until", { withTimezone: true, mode: "date" }),
-    owningReceiptCorrelationId: text("owning_receipt_correlation_id"),
     expectedPolicyVersion: integer("expected_policy_version"),
     requiredFence: integer("required_fence"),
     endpointDigests: jsonb("endpoint_digests").notNull().default(sql`'[]'::jsonb`),
     idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
     fingerprint: char("fingerprint", { length: 64 }),
     correlationId: text("correlation_id").notNull(),
     state: varchar("state", { length: 32 }).notNull(),
     failureCode: varchar("failure_code", { length: 64 }),
     version: integer("version").notNull(),
     leaseOwnerId: text("lease_owner_id"),
@@ -1118,20 +1127,21 @@ export const communicationOutboundCommands = pgTable(
     unique("communication_outbound_commands_id_binding_unique").on(table.id, table.bindingId),
     unique("communication_outbound_commands_binding_key_unique").on(
       table.bindingId,
       table.idempotencyKey,
     ),
     check("communication_outbound_commands_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
     check(
       "communication_outbound_commands_fingerprint_valid",
       sql`${table.fingerprint} is null or ${table.fingerprint} ~ '^[0-9a-f]{64}$'`,
     ),
+    check("communication_outbound_commands_message_body_digest_valid", sql`${table.messageBodyDigest} ~ '^[0-9a-f]{64}$'`),
     check(
       "communication_outbound_commands_lease_token_hash_valid",
       sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_outbound_commands_lease_owner_hash_valid",
       sql`${table.leaseOwnerId} is null or ${table.leaseOwnerId} ~ '^[0-9a-f]{64}$'`,
     ),
     check("communication_outbound_commands_locale_valid", sql`${table.locale} in ('es', 'en')`),
     check(
@@ -1144,30 +1154,32 @@ export const communicationOutboundCommands = pgTable(
     ),
     check(
       "communication_outbound_commands_policy_version_positive",
       sql`${table.expectedPolicyVersion} is null or ${table.expectedPolicyVersion} > 0`,
     ),
     check("communication_outbound_commands_required_fence_valid", sql`${table.requiredFence} is null or ${table.requiredFence} >= 0`),
     check("communication_outbound_commands_endpoint_digests_valid", sql`jsonb_typeof(${table.endpointDigests}) = 'array'`),
     check("communication_outbound_commands_version_nonnegative", sql`${table.version} >= 0`),
     check(
       "communication_outbound_commands_owning_receipt_window_valid",
-      sql`(${table.owningReceiptId} is null and ${table.owningDomain} is null and ${table.owningReference} is null and ${table.owningReceiptIssuedAt} is null and ${table.owningReceiptValidUntil} is null and ${table.owningReceiptCorrelationId} is null) or (${table.owningReceiptId} is not null and ${table.owningDomain} is not null and ${table.owningReference} is not null and ${table.owningReceiptIssuedAt} is not null and ${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt} and ${table.owningReceiptCorrelationId} is not null)`,
+      sql`(${table.owningReceiptId} is null and ${table.owningDomain} is null and ${table.owningOperation} is null and ${table.owningReference} is null and ${table.owningBindingId} is null and ${table.owningDestinationKey} is null and ${table.owningReceiptIssuedAt} is null and ${table.owningReceiptValidUntil} is null) or (${table.owningReceiptId} is not null and ${table.owningDomain} = 'communications' and ${table.owningOperation} = 'outbound_dispatch' and ${table.owningReference} is not null and ${table.owningBindingId} = ${table.bindingId} and ${table.owningDestinationKey} = ${table.destinationKey} and ${table.owningReceiptIssuedAt} is not null and ${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt})`,
     ),
     check(
       "communication_outbound_commands_finalization_valid",
-      sql`${table.state} = 'draft' or (${table.fingerprint} is not null and ${table.expectedPolicyVersion} is not null and ${table.requiredFence} is not null and ${table.owningReceiptId} is not null)`,
+      sql`${table.state} = 'draft' or (${table.fingerprint} is not null and ${table.expectedPolicyVersion} is not null and ${table.requiredFence} is not null and ${table.owningReceiptId} is not null and ${table.destinationKey} is not null)`,
     ),
     check(
       "communication_outbound_commands_destination_reference_opaque",
-      sql`${table.destinationKey} is null or (char_length(${table.destinationKey}) <= 120 and ${table.destinationKey} ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')`,
+      sql`${table.destinationKey} is null or ${table.destinationKey} ~ '^endpoint_ref:[0-9a-f]{64}$'`,
     ),
+    check("communication_outbound_commands_owning_destination_valid", sql`${table.owningDestinationKey} is null or ${table.owningDestinationKey} ~ '^endpoint_ref:[0-9a-f]{64}$'`),
+    check("communication_outbound_commands_owning_reference_valid", sql`${table.owningReference} is null or ${table.owningReference} ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'`),
     check(
       "communication_outbound_commands_lease_valid",
       sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
     ),
     check(
       "communication_outbound_commands_expiry_valid",
       sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}`,
     ),
     index("communication_outbound_commands_work_idx").on(
       table.state,
@@ -1278,21 +1290,27 @@ export const communicationProviderStatusReceipts = pgTable(
   },
   (table) => [
     primaryKey({
       name: "communication_provider_status_receipts_command_event_pk",
       columns: [table.commandId, table.providerEventId],
     }),
     check(
       "communication_provider_status_receipts_status_valid",
       sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
     ),
-    communicationsOnly("communication_provider_status_receipts"),
+    pgPolicy("communication_provider_status_receipts_communications_scope", {
+      as: "permissive",
+      for: "all",
+      to: communicationsGatewayRole,
+      using: communicationsCommandScope(table.commandId),
+      withCheck: communicationsCommandScope(table.commandId),
+    }),
   ],
 ).enableRLS();
 
 export const communicationDispatchReconciliationReceipts = pgTable(
   "communication_dispatch_reconciliation_receipts",
   {
     receiptId: text("receipt_id").primaryKey(),
     receiptDigest: char("receipt_digest", { length: 64 }).notNull(),
     commandId: text("command_id").notNull(),
     attemptId: text("attempt_id").notNull(),
@@ -1314,31 +1332,37 @@ export const communicationDispatchReconciliationReceipts = pgTable(
       name: "communication_dispatch_reconciliation_receipts_command_binding_fk",
       columns: [table.commandId, table.bindingId],
       foreignColumns: [communicationOutboundCommands.id, communicationOutboundCommands.bindingId],
     }).onDelete("restrict"),
     check(
       "communication_dispatch_reconciliation_receipts_digest_valid",
       sql`${table.receiptDigest} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_source_valid",
-      sql`${table.source} in ('provider_lookup', 'provider_status', 'manual_attestation')`,
+      sql`${table.source} in ('provider_lookup', 'manual_authority')`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_outcome_valid",
-      sql`${table.outcome} in ('accepted', 'confirmed_not_sent', 'failed')`,
+      sql`${table.outcome} in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')`,
     ),
     check(
       "communication_dispatch_reconciliation_receipts_window_valid",
       sql`${table.expiresAt} > ${table.issuedAt} and ${table.createdAt} >= ${table.issuedAt} and ${table.createdAt} < ${table.expiresAt}`,
     ),
-    communicationsOnly("communication_dispatch_reconciliation_receipts"),
+    pgPolicy("communication_dispatch_reconciliation_receipts_communications_scope", {
+      as: "permissive",
+      for: "all",
+      to: communicationsGatewayRole,
+      using: communicationsCommandScope(table.commandId),
+      withCheck: communicationsCommandScope(table.commandId),
+    }),
   ],
 ).enableRLS();
 
 export const communicationHandoffs = pgTable(
   "communication_handoffs",
   {
     id: text("id").primaryKey(),
     conversationId: text("conversation_id").notNull(),
     channelKind: varchar("channel_kind", { length: 16 }).notNull(),
     state: varchar("state", { length: 24 }).notNull(),
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
index 0eba50f..c56dc3a 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
@@ -30,20 +30,24 @@ export type ConsentReceipt = {
 export type OutboundAuthorizationReceipt = {
   receiptId: string;
   owner: "communications";
   operation: "outbound_dispatch";
   bindingId: string;
   destinationKey: string;
   issuedAt: Date;
   expiresAt: Date;
 };
 
+export function canonicalEndpointReference(digest: string): string {
+  return `endpoint_ref:${digest}`;
+}
+
 export type OutboundPolicyInput = {
   purpose: ContactPurpose;
   binding: { bindingId: string; trustState: BindingTrustState; freshUntil: Date };
   contactPolicy: { state: ContactPolicyState; version: number; fence: number };
   requiredPolicyVersion: number;
   requiredFence: number;
   consent: { state: ContactConsentState; receipt?: ConsentReceipt };
   connectionState: ChannelConnectionState;
   template: { eligible: boolean };
   authorizationReceipt?: OutboundAuthorizationReceipt;
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index 3d1a833..4ae6ac2 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -1,11 +1,15 @@
-import { evaluateAuthorityChange, evaluateOutboundPolicy } from "./channel-policy.ts";
+import {
+  canonicalEndpointReference,
+  evaluateAuthorityChange,
+  evaluateOutboundPolicy,
+} from "./channel-policy.ts";
 import type {
   AcceptInboundCommand,
   AcceptInboundResult,
   ApplyProviderStatusCommand,
   BindingChangeResult,
   ClaimInboundCommand,
   ClaimOutboundCommand,
   CommunicationsReferenceState,
   CommunicationsRepository,
   CommunicationsSeed,
@@ -47,20 +51,21 @@ import type {
   ContactChannelBinding,
   OutboundCommandState,
   OutboundDispatchAttempt,
 } from "./contracts.ts";
 
 type InboundRecord = {
   replayKey: string;
   providerBodyDigest: string;
   endpointDigests: AcceptInboundCommand["endpointDigests"];
   envelope: AcceptInboundCommand["envelope"];
+  ordinal: number;
   state: "persisted" | "applied" | "manual_review" | "dead_letter";
   leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
 };
 
 type OutboundRecord = CreateOutboundCommand & {
   messageBodyDigest: string;
   fingerprint?: string;
   requiredPolicyVersion?: number;
@@ -69,20 +74,21 @@ type OutboundRecord = CreateOutboundCommand & {
   authorizationReceipt?: FinalizeOutboundCommand["authorizationReceipt"];
   failureCode?: FailOutboundDraftCommand["code"];
   state: OutboundCommandState;
   leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
   blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
 };
 
 type AttemptRecord = OutboundDispatchAttempt & {
+  resultCode?: MarkDispatchOutcomeCommand["outcome"];
   leaseOwnerHash: string;
   leaseVersion: number;
   leaseExpiresAt: Date;
 };
 
 type ReconciledCommandState = Extract<
   ReconcileOutboundResult,
   { commandState: unknown }
 >["commandState"];
 
@@ -206,21 +212,24 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     for (const template of options.templates ?? []) {
       this.templates.set(this.templateKey(template.templateId, template.locale), clone(template));
     }
   }
 
   async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
     return this.withBindingLock(input.envelope.event.bindingId, "accept_inbound", async () => {
       const replayKey = `${input.connectionId}\u0000${input.providerEventId}`;
       const existing = this.inboundByReplay.get(replayKey);
       if (existing) {
-        if (existing.providerBodyDigest !== input.providerBodyDigest) {
+        if (
+          existing.providerBodyDigest !== input.providerBodyDigest ||
+          existing.envelope.event.bindingId !== input.envelope.event.bindingId
+        ) {
           return { status: "replay_mismatch", code: "provider_replay_mismatch" };
         }
         const activeDigest = existing.endpointDigests[0];
         if (!activeDigest) {
           return { status: "replay_mismatch", code: "provider_replay_mismatch" };
         }
         return {
           status: "duplicate",
           eventId: existing.envelope.event.eventId,
           endpointDigestVersion: activeDigest.version,
@@ -239,22 +248,26 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
           policy.version += 1;
           policy.fence += 1;
           policy.updatedAt = input.envelope.event.receivedAt;
         }
       }
       const record: InboundRecord = {
         replayKey,
         providerBodyDigest: input.providerBodyDigest,
         endpointDigests: clone(input.endpointDigests),
         envelope: metadataOnlyEnvelope(input.envelope),
+        ordinal:
+          [...this.inboundById.values()].filter(
+            (candidate) => candidate.envelope.event.conversationId === input.envelope.event.conversationId,
+          ).length + 1,
         state: "persisted",
-        leaseVersion: 0,
+        leaseVersion: 1,
       };
       this.inboundByReplay.set(replayKey, record);
       this.inboundById.set(input.envelope.event.eventId, record);
       return {
         status: "accepted",
         eventId: input.envelope.event.eventId,
         endpointDigestVersion: activeDigest.version,
         endpointDigest: activeDigest.digest,
       };
     });
@@ -302,21 +315,25 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       return "conflict";
     }
     record.state = input.outcome;
     record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
     return "completed";
   }
 
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
     const messageBodyDigest = await sha256(JSON.stringify(input.message.body));
-    const existing = this.outboundByIdempotency.get(input.command.idempotencyKey);
+    const idempotencyScope = this.outboundIdempotencyKey(
+      input.command.bindingId,
+      input.command.idempotencyKey,
+    );
+    const existing = this.outboundByIdempotency.get(idempotencyScope);
     if (existing) {
       if (!this.sameOutboundDraft(existing, input, messageBodyDigest)) {
         return { status: "conflict", code: "idempotency_mismatch" };
       }
       const reason = this.outboundDuplicateReason(existing);
       return {
         status: "duplicate",
         commandId: existing.command.commandId,
         messageId: existing.message.id,
         commandState: existing.state,
@@ -325,33 +342,64 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     }
     const record: OutboundRecord = {
       ...clone(input),
       message: metadataOnlyMessage(input.message),
       messageBodyDigest,
       state: "draft",
       leaseVersion: 0,
     };
     record.command.state = "draft";
     this.outboundById.set(record.command.commandId, record);
-    this.outboundByIdempotency.set(record.command.idempotencyKey, record);
+    this.outboundByIdempotency.set(idempotencyScope, record);
     return {
       status: "created",
       commandId: record.command.commandId,
       messageId: record.message.id,
     };
   }
 
   async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
     const record = this.outboundById.get(input.commandId);
-    if (!record || record.state !== "draft" || !input.endpointDigests[0]) {
+    const activeDigest = input.endpointDigests[0];
+    if (!record || record.state !== "draft" || !activeDigest) {
+      return { status: "conflict", code: "idempotency_mismatch" };
+    }
+    const binding = this.bindings.get(record.command.bindingId);
+    const policy = this.policies.get(record.command.bindingId);
+    const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
+    const connection = this.connections.get(record.command.channel);
+    const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
+    if (!binding || !policy || !consent) {
       return { status: "conflict", code: "idempotency_mismatch" };
     }
+    const decision = evaluateOutboundPolicy({
+      purpose: record.purpose,
+      binding: {
+        bindingId: binding.bindingId,
+        trustState: binding.trustState,
+        freshUntil: binding.freshUntil,
+      },
+      contactPolicy: { state: policy.state, version: policy.version, fence: policy.fence },
+      requiredPolicyVersion: input.requiredPolicyVersion,
+      requiredFence: input.requiredFence,
+      consent: { state: consent.state, receipt: consent.receipt },
+      connectionState: connection?.state ?? "disabled",
+      template: {
+        eligible: Boolean(
+          template?.internallyApproved && template.providerState === "provider_approved",
+        ),
+      },
+      authorizationReceipt: input.authorizationReceipt,
+      destinationKey: canonicalEndpointReference(activeDigest.digest),
+      now: input.now,
+    });
+    if (!decision.allowed) return { status: "conflict", code: "idempotency_mismatch" };
     record.fingerprint = input.fingerprint;
     record.requiredPolicyVersion = input.requiredPolicyVersion;
     record.requiredFence = input.requiredFence;
     record.endpointDigests = clone(input.endpointDigests);
     record.authorizationReceipt = clone(input.authorizationReceipt);
     record.state = "queued";
     record.command.state = "queued";
     return {
       status: "created",
       commandId: record.command.commandId,
@@ -416,21 +464,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         requiredPolicyVersion: record.requiredPolicyVersion!,
         requiredFence: record.requiredFence!,
         consent: { state: consent.state, receipt: consent.receipt },
         connectionState: connection?.state ?? "disabled",
         template: {
           eligible: Boolean(
             template?.internallyApproved && template.providerState === "provider_approved",
           ),
         },
         authorizationReceipt: record.authorizationReceipt,
-        destinationKey: activeDigest.digest,
+        destinationKey: canonicalEndpointReference(activeDigest.digest),
         now: input.now,
       });
       if (!decision.allowed) return { status: "not_claimed", code: decision.code };
 
       record.state = "dispatching";
       record.command.state = "dispatching";
       const leaseOwnerHash = await sha256(input.leaseOwner);
       record.leaseOwnerHash = leaseOwnerHash;
       record.leaseVersion += 1;
       record.leaseExpiresAt = input.leaseExpiresAt;
@@ -493,20 +541,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         input.outcome === "accepted"
           ? "provider_accepted"
           : input.outcome === "unknown"
             ? "dispatch_unknown"
             : "failed";
       record.state = state;
       record.command.state = state;
       record.leaseOwnerHash = undefined;
       record.leaseExpiresAt = undefined;
       attempt.state = state;
+      attempt.resultCode = input.outcome;
       attempt.completedAt = input.now;
       return "completed";
     });
   }
 
   async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
     const found = this.outboundById.get(input.commandId);
     if (!found) return { status: "not_found" };
     return this.withBindingLock(found.command.bindingId, "apply_provider_status", async () => {
       const record = this.outboundById.get(input.commandId)!;
@@ -905,20 +954,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     }
     return candidates.slice(0, Math.max(0, Math.min(input.limit, 100)));
   }
 
   referenceState(): CommunicationsReferenceState {
     return clone({
       inbound: [...this.inboundById.values()].map((record) => ({
         eventId: record.envelope.event.eventId,
         endpointDigests: record.endpointDigests,
         envelope: record.envelope,
+        ordinal: record.ordinal,
         state: record.state,
         leaseVersion: record.leaseVersion,
       })),
       outbound: [...this.outboundById.values()].map((record) => ({
         ...record.command,
         message: record.message,
         purpose: record.purpose,
         templateId: record.templateId,
         fingerprint: record.fingerprint,
         requiredPolicyVersion: record.requiredPolicyVersion,
@@ -935,20 +985,24 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       templates: [...this.templates.values()],
       providerStatuses: [...this.providerStatuses.values()],
       withdrawalHistory: this.withdrawalHistory,
     });
   }
 
   private consentKey(bindingId: string, purpose: string): string {
     return `${bindingId}\u0000${purpose}`;
   }
 
+  private outboundIdempotencyKey(bindingId: string, idempotencyKey: string): string {
+    return `${bindingId}\u0000${idempotencyKey}`;
+  }
+
   private templateKey(templateId: string, locale: string): string {
     return `${templateId}\u0000${locale}`;
   }
 
   private requirePolicy(
     bindingId: string,
     now: Date,
   ): ChannelContactPolicy & { fence: number } {
     const existing = this.policies.get(bindingId);
     if (existing) return existing;
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
index 887c891..e271ff7 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
@@ -170,21 +170,21 @@ async function queueOutbound(service: any, overrides: Record<string, unknown> =
     templateId: "template_1",
     idempotencyKey: "outbound_key_1",
     fingerprint: "outbound_fingerprint_1",
     requiredPolicyVersion: 7,
     requiredFence: 42,
     authorizationReceipt: {
       receiptId: "dispatch_receipt_1",
       owner: "communications",
       operation: "outbound_dispatch",
       bindingId: "binding_1",
-      destinationKey: "endpoint_digest_v1",
+      destinationKey: "endpoint_ref:endpoint_digest_v1",
       issuedAt: NOW,
       expiresAt: TOMORROW,
     },
     correlationId: "correlation_out_1",
     ...overrides,
   });
 }
 
 describe("atomic opt-out and dispatch fencing", () => {
   it("uses a controlled binding lock so withdrawal wins before a queued dispatch claim", async () => {
@@ -394,27 +394,27 @@ describe("durable leases, attempts and recovery", () => {
       optOutSignal: "none",
     });
     expect(accepted).toMatchObject({ status: "accepted" });
     const claim = await repository.claimInbound({
       eventId: "event_1",
       leaseOwner: "worker_1",
       leaseExpiresAt: LATER,
       now: NOW,
       requiredPolicyVersion: 7,
     });
-    expect(claim).toMatchObject({ status: "claimed", leaseVersion: 1 });
+    expect(claim).toMatchObject({ status: "claimed", leaseVersion: 2 });
 
     expect(
       await repository.completeInbound({
         eventId: "event_1",
         leaseOwner: "worker_2",
-        leaseVersion: 1,
+        leaseVersion: 2,
         outcome: "applied",
         now: LATER,
       }),
     ).toBe("conflict");
     expect(repository.referenceState().inbound[0]).toMatchObject({ state: "persisted" });
   });
 
   it("rejects expired or non-finite lease completion for the owning worker", async () => {
     const repository = createRepository();
     await repository.acceptInbound({
@@ -467,35 +467,35 @@ describe("durable leases, attempts and recovery", () => {
       },
       optOutSignal: "none",
     });
     const inboundClaim = await repository.claimInbound({
       eventId: "event_expiry",
       leaseOwner: "worker_1",
       leaseExpiresAt: LATER,
       now: NOW,
       requiredPolicyVersion: 7,
     });
-    expect(inboundClaim).toMatchObject({ status: "claimed", leaseVersion: 1 });
+    expect(inboundClaim).toMatchObject({ status: "claimed", leaseVersion: 2 });
     expect(
       await repository.completeInbound({
         eventId: "event_expiry",
         leaseOwner: "worker_1",
-        leaseVersion: 1,
+        leaseVersion: 2,
         outcome: "applied",
         now: TOMORROW,
       }),
     ).toBe("conflict");
     expect(
       await repository.completeInbound({
         eventId: "event_expiry",
         leaseOwner: "worker_1",
-        leaseVersion: 1,
+        leaseVersion: 2,
         outcome: "applied",
         now: new Date("invalid"),
       }),
     ).toBe("conflict");
 
     const service = createService(repository, {
       dispatch: async () => ({ status: "accepted", providerReference: "provider_ref_1" }),
     });
     const queued = await queueOutbound(service);
     const outboundClaim = await repository.claimOutbound({
@@ -1117,21 +1117,21 @@ describe("controlled inbound opt-out and reconciliation races", () => {
     const commandA = await queueOutbound(service);
     const commandB = await queueOutbound(service, {
       bindingId: "binding_2",
       idempotencyKey: "outbound_key_2",
       correlationId: "correlation_out_2",
       authorizationReceipt: {
         receiptId: "dispatch_receipt_2",
         owner: "communications",
         operation: "outbound_dispatch",
         bindingId: "binding_2",
-        destinationKey: "endpoint_digest_v1",
+        destinationKey: "endpoint_ref:endpoint_digest_v1",
         issuedAt: NOW,
         expiresAt: TOMORROW,
       },
     });
     const attemptA = await service.dispatchOutbound({
       commandId: commandA.commandId,
       leaseOwner: "worker_a",
       leaseExpiresAt: LATER,
     });
     const attemptB = await service.dispatchOutbound({
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
index 670c313..c8b7cf1 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
@@ -15,39 +15,41 @@ const integrationUrl = process.env.M004_POSTGRES_INTEGRATION_URL;
 const sql = integrationUrl ? createCommunicationsSql(integrationUrl) : null;
 
 afterAll(async () => {
   if (sql) await sql.end({ timeout: 5 });
 });
 
 async function seedScenario(scenario: string): Promise<void> {
   if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
   const ids = communicationsConformanceIds(scenario);
   const seed = communicationsConformanceSeed(scenario);
-  const binding = seed.bindings![0]!;
-  const policy = seed.policies![0]!;
-  const consent = seed.consents![0]!;
+  const primaryBinding = seed.bindings![0]!;
   const template = seed.templates![0]!;
   await sql.begin(async (tx) => {
     const principalRows = await tx.unsafe<
       Array<Parameters<typeof assertRestrictedCommunicationsPrincipal>[0]>
     >(COMMUNICATIONS_TRANSACTION_SQL.attestPrincipal);
     assertRestrictedCommunicationsPrincipal(principalRows[0]);
     await tx.unsafe(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole);
     await tx`
       insert into communication_channel_connections (
         id, channel_kind, adapter_key, readiness_state, policy_version, version,
         configured_at, verified_at, suspended_at, created_at, updated_at
       ) values (
         ${ids.connectionId}, 'whatsapp', 'meta_cloud', 'active', 'synthetic.v1', 1,
-        ${binding.createdAt}, ${binding.createdAt}, null, ${binding.createdAt}, ${binding.updatedAt}
+        ${primaryBinding.createdAt}, ${primaryBinding.createdAt}, null,
+        ${primaryBinding.createdAt}, ${primaryBinding.updatedAt}
       ) on conflict (id) do nothing
     `;
+    for (const [index, binding] of seed.bindings!.entries()) {
+      const policy = seed.policies![index]!;
+      const consent = seed.consents![index]!;
     await tx`
       insert into communication_contact_bindings (
         id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
         trust_state, locale, contact_policy_version, version, verification_receipt_id,
         endpoint_verified_at, verification_expires_at, wrong_person_reported_at,
         reassignment_risk_at, suspended_at, created_at, updated_at
       ) values (
         ${binding.bindingId}, ${ids.connectionId}, 'whatsapp', ${"b".repeat(64)},
         'endpoint.v1', ${binding.trustState}, 'en', ${policy.version}, 1,
         ${`verification_${ids.bindingId}`}, ${binding.createdAt}, ${binding.freshUntil},
@@ -72,36 +74,37 @@ async function seedScenario(scenario: string): Promise<void> {
         policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
         occurred_at, created_at
       ) values (
         ${`evidence_${ids.bindingId}`}, ${binding.bindingId}, 1, 'consent_granted',
         'transactional', 'granted', 'normal', null, null, ${consent.receipt!.receiptId},
         'consent_evidence', 'M078', 'consent', ${consent.version}, null, null,
         ${`consent_correlation_${ids.bindingId}`}, ${consent.receipt!.issuedAt},
         ${consent.receipt!.expiresAt}, ${consent.changedAt}, ${consent.changedAt}
       ) on conflict (evidence_receipt_id) do nothing
     `;
+    }
     await tx`
       insert into communication_message_templates (
         id, template_key, locale, purpose, definition_source, definition_version,
         variable_keys, state, internally_approved, approval_receipt_id,
         approval_receipt_issued_at, approval_receipt_valid_until, external_reference,
         projection_version, provider_receipt_id, provider_correlation_id,
         provider_receipt_issued_at, provider_receipt_valid_until, category,
         observed_at, created_at, updated_at
       ) values (
         ${template.templateId}, ${template.templateId}, ${template.locale}, 'transactional',
         'synthetic_test_fixture', ${template.definitionVersion}, '[]'::jsonb,
         ${template.providerState}, true, ${`approval_${template.templateId}`},
-        ${template.updatedAt}, ${binding.freshUntil}, ${`provider_${template.templateId}`},
+        ${template.updatedAt}, ${primaryBinding.freshUntil}, ${`provider_${template.templateId}`},
         ${template.providerVersion}, ${`provider_receipt_${template.templateId}`},
         ${`provider_correlation_${template.templateId}`}, ${template.updatedAt},
-        ${binding.freshUntil}, 'utility', ${template.updatedAt}, ${template.updatedAt},
+        ${primaryBinding.freshUntil}, 'utility', ${template.updatedAt}, ${template.updatedAt},
         ${template.updatedAt}
       ) on conflict (template_key, locale) do nothing
     `;
   });
 }
 
 runCommunicationsRepositoryConformance(
   "postgres",
   async (scenario) => {
     if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
index eddbd90..5add1ba 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
@@ -1,30 +1,40 @@
 import { MemoryCommunicationsRepository } from "@atlas/domain";
+import { readFileSync } from "node:fs";
+import { fileURLToPath } from "node:url";
 import {
   assertRestrictedCommunicationsPrincipal,
   COMMUNICATIONS_TRANSACTION_SQL,
 } from "../../packages/database/src/postgres-communications-store.ts";
 import { describe, expect, it } from "vitest";
 import {
   communicationsConformanceSeed,
   runCommunicationsRepositoryConformance,
 } from "../support/communications-repository-conformance.ts";
 
 runCommunicationsRepositoryConformance("memory", async (scenario) => {
   const repository = new MemoryCommunicationsRepository(communicationsConformanceSeed(scenario));
   return {
     repository,
     inspectState: () => repository.referenceState(),
   };
 });
 
 describe("Postgres communications transaction contract", () => {
+  const storeSource = readFileSync(
+    fileURLToPath(new URL("../../packages/database/src/postgres-communications-store.ts", import.meta.url)),
+    "utf8",
+  );
+  const schemaSource = readFileSync(
+    fileURLToPath(new URL("../../packages/database/src/schema.ts", import.meta.url)),
+    "utf8",
+  );
   const safePrincipal = {
     principal_name: "atlas_communications_runtime",
     is_member: true,
     closure_count: 1,
     admin_path: false,
     gateway_closure_count: 0,
     rolbypassrls: false,
     rolinherit: false,
     rolsuper: false,
   };
@@ -53,11 +63,50 @@ describe("Postgres communications transaction contract", () => {
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.claimInbound).toContain(
       "for update of receipt skip locked",
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.claimOutbound).toContain(
       "for update skip locked",
     );
     expect(COMMUNICATIONS_TRANSACTION_SQL.lockBinding).toContain("for update");
     expect(COMMUNICATIONS_TRANSACTION_SQL.lockPolicy).toContain("for update");
   });
+
+  it("keeps deterministic SQL compatible with positive versions, lock ordering, and canonical references", () => {
+    expect(storeSource).toMatch(/processing_version[^;]+null, 1, null/su);
+    expect(storeSource).toContain("select id from communication_conversations where id = $1 for update");
+    expect(storeSource).toContain("coalesce(max(ordinal), 0)::integer + 1 as ordinal");
+    expect(storeSource).toContain("canonicalEndpointReference(");
+    expect(storeSource).toContain("then 'inbound_event' else 'authority' end as source");
+    expect(storeSource.indexOf("COMMUNICATIONS_TRANSACTION_SQL.lockBinding")).toBeLessThan(
+      storeSource.indexOf("where binding_id = $1 and idempotency_key = $2"),
+    );
+    expect(schemaSource).toContain('messageBodyDigest: char("message_body_digest", { length: 64 })');
+  });
+
+  it("uses exhaustive domain-to-database outcome and reconciliation vocabularies", () => {
+    expect(storeSource).toContain('known_failure: { state: "failed", resultCode: "failed" }');
+    expect(storeSource).toContain('unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" }');
+    expect(schemaSource).toContain("('provider_lookup', 'manual_authority')");
+    expect(schemaSource).toContain("('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')");
+    expect(storeSource.match(/evaluateOutboundPolicy\(/gu)).toHaveLength(2);
+  });
+
+  it("hardens both receipt tables with scoped policy, FORCE RLS, revokes, and least privilege", () => {
+    expect(schemaSource).toContain("communicationsCommandScope(table.commandId)");
+    const securityMigration = readFileSync(
+      fileURLToPath(new URL("../../drizzle/0011_m004_receipt_security_hardening.sql", import.meta.url)),
+      "utf8",
+    );
+    for (const table of [
+      "communication_provider_status_receipts",
+      "communication_dispatch_reconciliation_receipts",
+    ]) {
+      expect(securityMigration).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
+      expect(securityMigration).toContain(`"${table}" FROM PUBLIC`);
+    }
+    expect(securityMigration).toContain("'anon', 'authenticated', 'atlas_migration_runtime'");
+    expect(securityMigration).toContain("GRANT SELECT, INSERT ON TABLE");
+    expect(securityMigration).not.toContain("GRANT UPDATE");
+    expect(securityMigration).not.toContain("GRANT DELETE");
+  });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 3f2871b..30e224e 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -556,28 +556,29 @@ describe("M004 canonical communications Drizzle schema", () => {
   });
 });
 
 describe("M004 generated migration authority and canonical cutover", () => {
   it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
     const migrations = currentM004Migrations();
     const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
     const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
       entries: Array<{ idx: number; tag: string }>;
     };
-    expect(journal.entries.slice(-5).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
+    expect(journal.entries.slice(-6).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
       { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
       { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
       { idx: 8, tag: "0008_m004_communications_backfill" },
       { idx: 9, tag: "0009_m004_communications_cutover_guard" },
       { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
+      { idx: 11, tag: "0011_m004_receipt_security_hardening" },
     ]);
-    for (const index of ["0006", "0007", "0008", "0009", "0010"]) {
+    for (const index of ["0006", "0007", "0008", "0009", "0010", "0011"]) {
       expect(
         existsSync(
           fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
         ),
       ).toBe(true);
     }
   });
 
   it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
     const { bootstrap, structural, backfill } = currentM004Migrations();
@@ -1243,23 +1244,26 @@ describe("Task 7 recovered current-contract schema guards", () => {
     );
     expect(evidenceColumns).toEqual(
       expect.arrayContaining(["receipt_issued_at", "receipt_valid_until"]),
     );
 
     const outboundColumns = tableConfig("communicationOutboundCommands").columns.map(
       (column) => column.name,
     );
     expect(outboundColumns).toEqual(
       expect.arrayContaining([
+        "message_body_digest",
+        "owning_operation",
+        "owning_binding_id",
+        "owning_destination_key",
         "owning_receipt_issued_at",
         "owning_receipt_valid_until",
-        "owning_receipt_correlation_id",
       ]),
     );
 
     const attemptColumns = tableConfig("communicationDispatchAttempts").columns.map(
       (column) => column.name,
     );
     expect(attemptColumns).toEqual(
       expect.arrayContaining(["provider_io_capability_hash", "provider_io_started_at"]),
     );
 
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
index ddc5f25..a08c877 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
@@ -290,21 +290,21 @@ async function queueOutbound(service: any, overrides: Record<string, unknown> =
     templateId: "template_1",
     idempotencyKey: "outbound_key_1",
     fingerprint: "outbound_fingerprint_1",
     requiredPolicyVersion: 7,
     requiredFence: 42,
     authorizationReceipt: {
       receiptId: "dispatch_receipt_1",
       owner: "communications",
       operation: "outbound_dispatch",
       bindingId: "binding_1",
-      destinationKey: "endpoint_digest_v2",
+      destinationKey: "endpoint_ref:endpoint_digest_v2",
       issuedAt: NOW,
       expiresAt: TOMORROW,
     },
     correlationId: "correlation_out_1",
     ...overrides,
   });
 }
 
 describe("canonical inbound and application behavior", () => {
   it("persists one replayable canonical envelope and fails closed on mismatched replay", async () => {
diff --git a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
index d71c17b..a3878a4 100644
--- a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
+++ b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
@@ -21,71 +21,70 @@ export const CONFORMANCE_LEASE_END = new Date(CONFORMANCE_NOW.getTime() + 60_000
 export const CONFORMANCE_TOMORROW = new Date("2026-08-21T12:00:00.000Z");
 
 function suffix(scenario: string): string {
   return createHash("sha256").update(scenario).digest("hex").slice(0, 16);
 }
 
 export function communicationsConformanceIds(scenario: string) {
   const id = suffix(scenario);
   return {
     bindingId: `binding_${id}`,
+    secondaryBindingId: `binding_secondary_${id}`,
     commandId: `command_${id}`,
     connectionId: `connection_${id}`,
     conversationId: `conversation_${id}`,
     eventId: `event_${id}`,
     messageId: `message_${id}`,
     outboundMessageId: `outbound_message_${id}`,
     participantId: `participant_${id}`,
     providerEventId: `meta_evt_${id}${id}`,
   };
 }
 
 export function communicationsConformanceSeed(scenario: string): CommunicationsSeed {
   const value = communicationsConformanceIds(scenario);
+  const binding = (bindingId: string) => ({
+    bindingId,
+    channel: "whatsapp" as const,
+    trustState: "reverified" as const,
+    freshUntil: CONFORMANCE_TOMORROW,
+    createdAt: CONFORMANCE_NOW,
+    updatedAt: CONFORMANCE_NOW,
+  });
+  const policy = (bindingId: string, discriminator: string) => ({
+    policyId: `policy_${discriminator}_${suffix(scenario)}`,
+    bindingId,
+    state: "normal" as const,
+    version: 7,
+    fence: 42,
+    updatedAt: CONFORMANCE_NOW,
+  });
+  const consent = (bindingId: string, discriminator: string) => ({
+    bindingId,
+    purpose: "transactional" as const,
+    state: "granted" as const,
+    version: 1,
+    receipt: {
+      receiptId: `consent_${discriminator}_${suffix(scenario)}`,
+      owner: "consent" as const,
+      operation: "consent_confirmation" as const,
+      bindingId,
+      issuedAt: CONFORMANCE_NOW,
+      expiresAt: CONFORMANCE_TOMORROW,
+    },
+    authorityReceiptId: `consent_${discriminator}_${suffix(scenario)}`,
+    changedAt: CONFORMANCE_NOW,
+  });
   return {
-    bindings: [
-      {
-        bindingId: value.bindingId,
-        channel: "whatsapp",
-        trustState: "reverified",
-        freshUntil: CONFORMANCE_TOMORROW,
-        createdAt: CONFORMANCE_NOW,
-        updatedAt: CONFORMANCE_NOW,
-      },
-    ],
-    policies: [
-      {
-        policyId: `policy_${suffix(scenario)}`,
-        bindingId: value.bindingId,
-        state: "normal",
-        version: 7,
-        fence: 42,
-        updatedAt: CONFORMANCE_NOW,
-      },
-    ],
-    consents: [
-      {
-        bindingId: value.bindingId,
-        purpose: "transactional",
-        state: "granted",
-        version: 1,
-        receipt: {
-          receiptId: `consent_${suffix(scenario)}`,
-          owner: "consent",
-          operation: "consent_confirmation",
-          bindingId: value.bindingId,
-          issuedAt: CONFORMANCE_NOW,
-          expiresAt: CONFORMANCE_TOMORROW,
-        },
-        changedAt: CONFORMANCE_NOW,
-      },
-    ],
+    bindings: [binding(value.bindingId), binding(value.secondaryBindingId)],
+    policies: [policy(value.bindingId, "primary"), policy(value.secondaryBindingId, "secondary")],
+    consents: [consent(value.bindingId, "primary"), consent(value.secondaryBindingId, "secondary")],
     connections: [{ channel: "whatsapp", state: "active" }],
     templates: [
       {
         templateId: `template_${suffix(scenario)}`,
         locale: "en",
         definitionVersion: 1,
         internallyApproved: true,
         providerState: "provider_approved",
         providerVersion: 1,
         updatedAt: CONFORMANCE_NOW,
@@ -158,21 +157,21 @@ async function withHarness<T>(
     return await work(harness);
   } finally {
     await harness.close?.();
   }
 }
 
 async function queueOutbound(repository: CommunicationsRepository, scenario: string) {
   const value = communicationsConformanceIds(scenario);
   const templateId = `template_${suffix(scenario)}`;
   await repository.acceptInbound(inbound(scenario));
-  const created = await repository.createOutbound({
+  const draft = {
     command: {
       commandId: value.commandId,
       channel: "whatsapp",
       locale: "en",
       conversationId: value.conversationId,
       bindingId: value.bindingId,
       messageId: value.outboundMessageId,
       idempotencyKey: `idempotency_${suffix(scenario)}`,
       state: "draft",
       createdAt: CONFORMANCE_NOW,
@@ -185,39 +184,40 @@ async function queueOutbound(repository: CommunicationsRepository, scenario: str
       direction: "outbound",
       senderParticipantId: `participant_system_${suffix(scenario)}`,
       recipientParticipantId: value.participantId,
       locale: "en",
       kind: "text",
       body: "SYNTHETIC-OUTBOUND-PLAINTEXT-MUST-NOT-PERSIST",
       createdAt: CONFORMANCE_NOW,
     },
     purpose: "transactional",
     templateId,
-  });
+  } as const;
+  const created = await repository.createOutbound(draft);
   expect(created).toEqual({
     status: "created",
     commandId: value.commandId,
     messageId: value.outboundMessageId,
   });
   await expect(
     repository.finalizeOutbound({
       commandId: value.commandId,
       fingerprint: "c".repeat(64),
       requiredPolicyVersion: 7,
       requiredFence: 42,
       endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
       authorizationReceipt: {
         receiptId: `dispatch_${suffix(scenario)}`,
         owner: "communications",
         operation: "outbound_dispatch",
         bindingId: value.bindingId,
-        destinationKey: "b".repeat(64),
+        destinationKey: `endpoint_ref:${"b".repeat(64)}`,
         issuedAt: CONFORMANCE_NOW,
         expiresAt: CONFORMANCE_TOMORROW,
       },
       now: CONFORMANCE_NOW,
     }),
   ).resolves.toMatchObject({ status: "created", commandId: value.commandId });
   return value;
 }
 
 export function runCommunicationsRepositoryConformance(
@@ -476,12 +476,223 @@ export function runCommunicationsRepositoryConformance(
         await expect(
           repository.reconcileOutbound({
             commandId: value.commandId,
             attemptId,
             receipt: { ...receipt, outcome: "terminal_failure" },
             now: CONFORMANCE_NOW,
           }),
         ).resolves.toEqual({ status: "conflict", code: "reconciliation_receipt_mismatch" });
       });
     });
+
+    it("allocates distinct inbound ordinals and rejects cross-binding provider replay", async () => {
+      await withHarness(factory, `${label}-inbound-order`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-inbound-order`;
+        const first = inbound(scenario);
+        const second = structuredClone(first);
+        second.providerEventId = `meta_evt_${suffix(`${scenario}-second`).repeat(2)}`;
+        second.providerBodyDigest = "d".repeat(64);
+        second.envelope.event.eventId = `event_${suffix(`${scenario}-second`)}`;
+        second.envelope.event.messageId = `message_${suffix(`${scenario}-second`)}`;
+        second.envelope.message.id = second.envelope.event.messageId;
+        await expect(Promise.all([repository.acceptInbound(first), repository.acceptInbound(second)]))
+          .resolves.toEqual([
+            expect.objectContaining({ status: "accepted" }),
+            expect.objectContaining({ status: "accepted" }),
+          ]);
+        const crossBinding = structuredClone(first);
+        crossBinding.envelope.event.bindingId = communicationsConformanceIds(scenario).secondaryBindingId;
+        crossBinding.envelope.participant.bindingId = crossBinding.envelope.event.bindingId;
+        await expect(repository.acceptInbound(crossBinding)).resolves.toEqual({
+          status: "replay_mismatch",
+          code: "provider_replay_mismatch",
+        });
+        if (inspectState) {
+          const state = await inspectState();
+          expect(state.inbound.map((row) => row.ordinal).sort()).toEqual([1, 2]);
+        }
+      });
+    });
+
+    it("uses body identity for honest outbound duplicate states and binding-scoped keys", async () => {
+      await withHarness(factory, `${label}-outbound-identity`, async ({ repository }) => {
+        const scenario = `${label}-outbound-identity`;
+        const value = communicationsConformanceIds(scenario);
+        await repository.acceptInbound(inbound(scenario));
+        const draft = {
+          command: {
+            commandId: value.commandId,
+            channel: "whatsapp" as const,
+            locale: "en" as const,
+            conversationId: value.conversationId,
+            bindingId: value.bindingId,
+            messageId: value.outboundMessageId,
+            idempotencyKey: `shared_${suffix(scenario)}`,
+            state: "draft" as const,
+            createdAt: CONFORMANCE_NOW,
+            correlationId: `correlation_out_${suffix(scenario)}`,
+          },
+          message: {
+            id: value.outboundMessageId,
+            conversationId: value.conversationId,
+            channel: "whatsapp" as const,
+            direction: "outbound" as const,
+            senderParticipantId: `participant_system_${suffix(scenario)}`,
+            recipientParticipantId: value.participantId,
+            locale: "en" as const,
+            kind: "text" as const,
+            body: "ORIGINAL-BODY",
+            createdAt: CONFORMANCE_NOW,
+          },
+          purpose: "transactional" as const,
+          templateId: `template_${suffix(scenario)}`,
+        };
+        await expect(repository.createOutbound(draft)).resolves.toMatchObject({ status: "created" });
+        await expect(repository.createOutbound(draft)).resolves.toMatchObject({
+          status: "duplicate",
+          reason: "outbound_draft_unresolved",
+        });
+        await expect(
+          repository.createOutbound({ ...draft, message: { ...draft.message, body: "ALTERED-BODY" } }),
+        ).resolves.toEqual({ status: "conflict", code: "idempotency_mismatch" });
+        await expect(repository.finalizeOutbound({
+          commandId: value.commandId,
+          fingerprint: "c".repeat(64),
+          requiredPolicyVersion: 7,
+          requiredFence: 42,
+          endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
+          authorizationReceipt: {
+            receiptId: `dispatch_${suffix(scenario)}`,
+            owner: "communications",
+            operation: "outbound_dispatch",
+            bindingId: value.bindingId,
+            destinationKey: `endpoint_ref:${"b".repeat(64)}`,
+            issuedAt: CONFORMANCE_NOW,
+            expiresAt: CONFORMANCE_TOMORROW,
+          },
+          now: CONFORMANCE_NOW,
+        })).resolves.toMatchObject({ status: "created" });
+        await expect(repository.createOutbound(draft)).resolves.toEqual({
+          status: "duplicate",
+          commandId: value.commandId,
+          messageId: value.outboundMessageId,
+          commandState: "queued",
+        });
+        const secondary = {
+          ...draft,
+          command: {
+            ...draft.command,
+            commandId: `command_secondary_${suffix(scenario)}`,
+            bindingId: value.secondaryBindingId,
+          },
+          message: {
+            ...draft.message,
+            id: `message_secondary_${suffix(scenario)}`,
+          },
+        };
+        await expect(repository.createOutbound(secondary)).resolves.toMatchObject({ status: "created" });
+      });
+    });
+
+    it("round-trips failure and unknown outcomes and applies provider statuses idempotently", async () => {
+      for (const outcome of ["known_failure", "unknown"] as const) {
+        await withHarness(factory, `${label}-outcome-${outcome}`, async ({ repository, inspectState }) => {
+          const scenario = `${label}-outcome-${outcome}`;
+          const value = await queueOutbound(repository, scenario);
+          const attemptId = `attempt_${suffix(scenario)}`;
+          const claimed = await repository.claimOutbound({
+            commandId: value.commandId,
+            attemptId,
+            leaseOwner: "outcome-owner",
+            leaseExpiresAt: CONFORMANCE_LEASE_END,
+            now: CONFORMANCE_NOW,
+          });
+          if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
+          await expect(repository.markDispatchOutcome({
+            commandId: value.commandId,
+            attemptId,
+            leaseOwner: "outcome-owner",
+            leaseVersion: claimed.attempt.leaseVersion,
+            outcome,
+            now: CONFORMANCE_NOW,
+          })).resolves.toBe("completed");
+          if (inspectState) {
+            const attempt = (await inspectState()).attempts.find((row) => row.attemptId === attemptId);
+            expect(attempt?.resultCode).toBe(outcome);
+          }
+        });
+      }
+      await withHarness(factory, `${label}-provider-status`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-provider-status`;
+        const value = await queueOutbound(repository, scenario);
+        const attemptId = `attempt_${suffix(scenario)}`;
+        const claimed = await repository.claimOutbound({ commandId: value.commandId, attemptId,
+          leaseOwner: "status-owner", leaseExpiresAt: CONFORMANCE_LEASE_END, now: CONFORMANCE_NOW });
+        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
+        await repository.markDispatchOutcome({ commandId: value.commandId, attemptId,
+          leaseOwner: "status-owner", leaseVersion: claimed.attempt.leaseVersion,
+          outcome: "accepted", now: CONFORMANCE_NOW });
+        const status = { commandId: value.commandId, providerEventId: `status_${suffix(scenario)}`,
+          status: "delivered" as const, occurredAt: CONFORMANCE_NOW };
+        await expect(repository.applyProviderStatus(status)).resolves.toMatchObject({ status: "applied" });
+        await expect(repository.applyProviderStatus(status)).resolves.toMatchObject({ status: "duplicate" });
+        if (inspectState) expect((await inspectState()).providerStatuses).toContainEqual(status);
+      });
+    });
+
+    it("advances consent provenance, persists withdrawal history, and binds template definitions", async () => {
+      await withHarness(factory, `${label}-authority-history`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-authority-history`;
+        const value = communicationsConformanceIds(scenario);
+        const nextReceipt = {
+          receiptId: `consent_next_${suffix(scenario)}`,
+          owner: "consent" as const,
+          operation: "consent_grant" as const,
+          bindingId: value.bindingId,
+          issuedAt: CONFORMANCE_NOW,
+          expiresAt: CONFORMANCE_TOMORROW,
+        };
+        await expect(repository.grantConsentFromReceipt({ bindingId: value.bindingId,
+          purpose: "transactional", operation: "consent_grant", receipt: nextReceipt,
+          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "changed", version: 2 });
+        await expect(repository.grantConsentFromReceipt({ bindingId: value.bindingId,
+          purpose: "transactional", operation: "consent_grant", receipt: nextReceipt,
+          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "duplicate", version: 2 });
+        const accepted = inbound(scenario);
+        await repository.acceptInbound(accepted);
+        const inboundReceipt = { receiptId: `withdraw_${suffix(scenario)}`,
+          owner: "communications" as const, operation: "inbound_opt_out" as const,
+          bindingId: value.bindingId, eventId: accepted.envelope.event.eventId,
+          issuedAt: CONFORMANCE_NOW, expiresAt: CONFORMANCE_TOMORROW,
+          correlationId: accepted.envelope.event.correlationId };
+        await expect(repository.withdrawContact({ bindingId: value.bindingId,
+          evidence: { source: "inbound_event", receipt: { ...inboundReceipt, owner: "consent" as never } },
+          now: CONFORMANCE_NOW })).resolves.toMatchObject({ status: "denied" });
+        await expect(repository.withdrawContact({ bindingId: value.bindingId,
+          evidence: { source: "inbound_event", receipt: inboundReceipt }, now: CONFORMANCE_NOW }))
+          .resolves.toMatchObject({ status: "changed" });
+        const templateId = `template_${suffix(scenario)}`;
+        await expect(repository.reconcileTemplate({ templateId, locale: "en",
+          providerState: "provider_approved", providerVersion: 2,
+          correlationId: `template_${suffix(scenario)}`,
+          receipt: { receiptId: `template_receipt_${suffix(scenario)}`,
+            owner: "communications", operation: "template_provider_reconciliation",
+            templateId, locale: "en", definitionVersion: 99, providerVersion: 2,
+            providerState: "provider_approved", issuedAt: CONFORMANCE_NOW,
+            expiresAt: CONFORMANCE_TOMORROW, correlationId: `template_${suffix(scenario)}` },
+          now: CONFORMANCE_NOW })).resolves.toEqual({ status: "denied", code: "provider_receipt_invalid" });
+        if (inspectState) {
+          const state = await inspectState();
+          expect(state.consentHistory.some(
+            (record) => record.authorityReceiptId === nextReceipt.receiptId && record.version === 2,
+          )).toBe(true);
+          expect(state.withdrawalHistory.at(-1)).toMatchObject({
+            bindingId: value.bindingId,
+            source: "inbound_event",
+            receiptId: inboundReceipt.receiptId,
+            eventId: inboundReceipt.eventId,
+          });
+        }
+      });
+    });
   });
 }
```
