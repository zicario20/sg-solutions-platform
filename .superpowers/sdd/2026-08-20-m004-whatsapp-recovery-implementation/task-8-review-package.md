# Review package Task 8

## Commits
099a74e feat(database): add Postgres communications repository

## Stat
 .../0009_m004_communications_cutover_guard.sql     |  259 ++
 .../0010_m004_communications_canonical_cutover.sql |  110 +
 .../workspace/drizzle/meta/0009_snapshot.json      | 4477 ++++++++++++++++++++
 .../workspace/drizzle/meta/0010_snapshot.json      | 4223 ++++++++++++++++++
 .../workspace/drizzle/meta/_journal.json           |   14 +
 .../database/src/communications-repository.ts      |   13 +
 .../workspace/packages/database/src/index.ts       |    1 +
 .../database/src/postgres-communications-store.ts  | 1812 ++++++++
 .../database/src/postgres-public-chat-store.ts     |  346 +-
 .../workspace/packages/database/src/schema.ts      |  172 +-
 .../domain/src/communications/memory-repository.ts |   83 +-
 .../m003/public-chat-postgres.integration.test.ts  |   22 +-
 .../tests/m003/public-chat-schema.test.ts          |   40 +-
 .../communications-postgres.integration.test.ts    |  113 +
 .../tests/m004/communications-repository.test.ts   |   63 +
 .../tests/m004/communications-schema.test.ts       |   10 +-
 .../tests/m004/communications-service.test.ts      |    5 +-
 .../communications-repository-conformance.ts       |  487 +++
 18 files changed, 12106 insertions(+), 144 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/drizzle/0009_m004_communications_cutover_guard.sql b/blueprints/project-atlas/workspace/drizzle/0009_m004_communications_cutover_guard.sql
new file mode 100644
index 0000000..045f245
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0009_m004_communications_cutover_guard.sql
@@ -0,0 +1,259 @@
+-- Drizzle custom migration generated with:
+-- drizzle-kit generate --custom --name m004_communications_cutover_guard
+--
+-- Forward-only cutover gate. It proves complete bidirectional M003/canonical parity while all
+-- sources are locked, then moves the two retained child foreign keys to canonical parents.
+-- No source table or row is removed here; generated migration 0010 owns the guarded removal.
+
+LOCK TABLE
+  public_chat_conversations,
+  public_chat_messages,
+  public_chat_handoffs,
+  public_chat_audit_events,
+  public_chat_citations,
+  public_chat_idempotency,
+  communication_conversations,
+  communication_participants,
+  public_chat_conversation_sessions,
+  communication_messages,
+  communication_handoffs,
+  communication_audit_events,
+  communication_outbound_commands
+IN ACCESS EXCLUSIVE MODE;
+--> statement-breakpoint
+DO $$
+BEGIN
+  -- Task 8 introduces required owner-receipt provenance. Existing commands cannot be assigned
+  -- truthful receipt times/correlation by inference, so contract instead of fabricating evidence.
+  IF EXISTS (SELECT 1 FROM communication_outbound_commands LIMIT 1) THEN
+    RAISE EXCEPTION 'M004_CUTOVER_OUTBOUND_RECEIPT_BACKFILL_REQUIRED';
+  END IF;
+END $$;
+--> statement-breakpoint
+DO $$
+DECLARE
+  expected_payload jsonb;
+  actual_payload jsonb;
+BEGIN
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    SELECT id, 'public_web'::varchar(16) AS channel_kind, locale, status, version,
+      correlation_id, last_activity_at, expires_at, closed_at, reconciliation_required,
+      created_at, updated_at
+    FROM public_chat_conversations
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+      expires_at, closed_at, reconciliation_required, created_at, updated_at
+    FROM communication_conversations WHERE channel_kind = 'public_web'
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: conversations';
+  END IF;
+
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    SELECT 'session_link_' || md5(c.id) AS id, c.id AS conversation_id,
+      'public_web'::varchar(16) AS channel_kind, c.session_id,
+      'participant_' || md5(c.id || ':external') AS participant_id, c.notice_version,
+      c.start_idempotency_key, c.start_fingerprint, c.created_at, c.updated_at
+    FROM public_chat_conversations c
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
+      start_idempotency_key, start_fingerprint, created_at, updated_at
+    FROM public_chat_conversation_sessions
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: public session ownership';
+  END IF;
+
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    WITH candidates AS (
+      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
+        c.created_at AS joined_at, c.updated_at
+      FROM public_chat_conversations c
+      UNION
+      SELECT m.conversation_id,
+        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
+        m.created_at, c.updated_at
+      FROM public_chat_messages m
+      JOIN public_chat_conversations c ON c.id = m.conversation_id
+    )
+    SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
+      'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
+      min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
+      max(updated_at) AS updated_at
+    FROM candidates GROUP BY conversation_id, kind
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
+      created_at, updated_at
+    FROM communication_participants WHERE channel_kind = 'public_web'
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: participants';
+  END IF;
+
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    SELECT m.id, m.conversation_id, 'public_web'::varchar(16) AS channel_kind, m.ordinal + 1 AS ordinal,
+      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
+        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END AS direction,
+      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
+        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
+        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END) AS sender_participant_id,
+      NULL::text AS recipient_participant_id, c.locale,
+      CASE WHEN m.actor = 'system' THEN 'system'
+        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END AS kind,
+      m.state, m.body, m.body_stored,
+      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END AS body_retention_policy,
+      m.actions, m.rejection_reason, NULL::text AS external_message_reference, m.created_at
+    FROM public_chat_messages m
+    JOIN public_chat_conversations c ON c.id = m.conversation_id
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
+      actions, rejection_reason, external_message_reference, created_at
+    FROM communication_messages WHERE channel_kind = 'public_web'
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: messages';
+  END IF;
+
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    SELECT h.id, h.conversation_id, 'public_web'::varchar(16) AS channel_kind,
+      CASE h.status WHEN 'human_requested' THEN 'requested'
+        WHEN 'waiting_for_human' THEN 'queued' END AS state,
+      h.reason AS reason_code, h.receipt_id, c.correlation_id,
+      NULL::text AS assigned_participant_id, h.requested_at, h.queued_at,
+      NULL::timestamptz AS accepted_at, NULL::timestamptz AS closed_at, h.updated_at
+    FROM public_chat_handoffs h
+    JOIN public_chat_conversations c ON c.id = h.conversation_id
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
+      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
+    FROM communication_handoffs WHERE channel_kind = 'public_web'
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: handoffs';
+  END IF;
+
+  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
+  INTO expected_payload
+  FROM (
+    SELECT a.id, a.sequence, a.conversation_id, 'public_web'::varchar(16) AS channel_kind,
+      a.event_name,
+      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
+        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
+        WHEN 'chat_handoff_requested' THEN 'handoff'
+        WHEN 'chat_handoff_queued' THEN 'handoff' ELSE 'conversation' END AS aggregate_type,
+      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
+        THEN coalesce((SELECT m.id FROM public_chat_messages m
+          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
+          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
+        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
+        THEN coalesce((SELECT h.id FROM public_chat_handoffs h
+          WHERE h.conversation_id = a.conversation_id ORDER BY h.requested_at LIMIT 1),
+          a.conversation_id) ELSE a.conversation_id END AS aggregate_id,
+      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
+        WHEN 'chat_message_accepted' THEN 'accepted'
+        WHEN 'chat_message_rejected' THEN 'rejected'
+        WHEN 'chat_response_failed' THEN 'failed'
+        WHEN 'chat_handoff_requested' THEN 'requested'
+        WHEN 'chat_handoff_queued' THEN 'queued'
+        WHEN 'chat_locale_changed' THEN 'accepted'
+        WHEN 'chat_conversation_closed' THEN 'closed' END AS result_code,
+      a.reason AS reason_code, a.version, a.locale, NULL::varchar(24) AS purpose,
+      NULL::integer AS policy_version, a.correlation_id, a.created_at AS occurred_at,
+      a.created_at
+    FROM public_chat_audit_events a
+  ) expected_row;
+  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
+  INTO actual_payload
+  FROM (
+    SELECT id, sequence, conversation_id, channel_kind, event_name, aggregate_type,
+      aggregate_id, result_code, reason_code, version, locale, purpose, policy_version,
+      correlation_id, occurred_at, created_at
+    FROM communication_audit_events WHERE channel_kind = 'public_web'
+  ) actual_row;
+  IF expected_payload IS DISTINCT FROM actual_payload THEN
+    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: audit';
+  END IF;
+
+  IF EXISTS (
+    SELECT 1 FROM public_chat_citations citation
+    LEFT JOIN public_chat_messages legacy ON legacy.id = citation.message_id
+    LEFT JOIN communication_messages canonical
+      ON canonical.id = citation.message_id AND canonical.channel_kind = 'public_web'
+    WHERE legacy.id IS NULL OR canonical.id IS NULL
+  ) THEN RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: citation references'; END IF;
+
+  IF EXISTS (
+    SELECT 1 FROM public_chat_idempotency command
+    LEFT JOIN public_chat_conversations legacy ON legacy.id = command.conversation_id
+    LEFT JOIN communication_conversations canonical
+      ON canonical.id = command.conversation_id AND canonical.channel_kind = 'public_web'
+    WHERE legacy.id IS NULL OR canonical.id IS NULL
+  ) THEN RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: idempotency references'; END IF;
+
+  IF EXISTS (
+    SELECT 1
+    FROM pg_depend dependency
+    JOIN pg_class legacy_table ON legacy_table.oid = dependency.refobjid
+    LEFT JOIN pg_constraint dependent_constraint
+      ON dependency.classid = 'pg_constraint'::regclass
+      AND dependent_constraint.oid = dependency.objid
+    WHERE legacy_table.relnamespace = 'public'::regnamespace
+      AND legacy_table.relname IN (
+        'public_chat_conversations',
+        'public_chat_messages',
+        'public_chat_handoffs',
+        'public_chat_audit_events'
+      )
+      AND dependency.deptype NOT IN ('a', 'i', 'e')
+      AND coalesce(dependent_constraint.conname, '') NOT IN (
+        'public_chat_citations_message_id_public_chat_messages_id_fk',
+        'public_chat_idempotency_conversation_id_public_chat_conversations_id_fk'
+      )
+  ) THEN
+    RAISE EXCEPTION 'M004_CUTOVER_UNEXPECTED_DEPENDENCY';
+  END IF;
+END
+$$;
+--> statement-breakpoint
+ALTER TABLE "public_chat_citations"
+  DROP CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk";
+--> statement-breakpoint
+ALTER TABLE "public_chat_citations"
+  ADD CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk"
+  FOREIGN KEY ("message_id") REFERENCES "public"."communication_messages"("id")
+  ON DELETE RESTRICT ON UPDATE NO ACTION;
+--> statement-breakpoint
+ALTER TABLE "public_chat_idempotency"
+  DROP CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk";
+--> statement-breakpoint
+ALTER TABLE "public_chat_idempotency"
+  ADD CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk"
+  FOREIGN KEY ("conversation_id") REFERENCES "public"."communication_conversations"("id")
+  ON DELETE RESTRICT ON UPDATE NO ACTION;
diff --git a/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql b/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
new file mode 100644
index 0000000..7257254
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
@@ -0,0 +1,110 @@
+CREATE TABLE "communication_dispatch_reconciliation_receipts" (
+	"receipt_id" text PRIMARY KEY NOT NULL,
+	"receipt_digest" char(64) NOT NULL,
+	"command_id" text NOT NULL,
+	"attempt_id" text NOT NULL,
+	"binding_id" text NOT NULL,
+	"source" varchar(32) NOT NULL,
+	"outcome" varchar(32) NOT NULL,
+	"correlation_id" text NOT NULL,
+	"issued_at" timestamp with time zone NOT NULL,
+	"expires_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_digest_valid" CHECK ("communication_dispatch_reconciliation_receipts"."receipt_digest" ~ '^[0-9a-f]{64}$'),
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_source_valid" CHECK ("communication_dispatch_reconciliation_receipts"."source" in ('provider_lookup', 'provider_status', 'manual_attestation')),
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_outcome_valid" CHECK ("communication_dispatch_reconciliation_receipts"."outcome" in ('accepted', 'confirmed_not_sent', 'failed')),
+	CONSTRAINT "communication_dispatch_reconciliation_receipts_window_valid" CHECK ("communication_dispatch_reconciliation_receipts"."expires_at" > "communication_dispatch_reconciliation_receipts"."issued_at" and "communication_dispatch_reconciliation_receipts"."created_at" >= "communication_dispatch_reconciliation_receipts"."issued_at" and "communication_dispatch_reconciliation_receipts"."created_at" < "communication_dispatch_reconciliation_receipts"."expires_at")
+);
+--> statement-breakpoint
+ALTER TABLE "communication_dispatch_reconciliation_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+CREATE TABLE "communication_provider_status_receipts" (
+	"command_id" text NOT NULL,
+	"provider_event_id" text NOT NULL,
+	"status" varchar(24) NOT NULL,
+	"occurred_at" timestamp with time zone NOT NULL,
+	"created_at" timestamp with time zone NOT NULL,
+	CONSTRAINT "communication_provider_status_receipts_command_event_pk" PRIMARY KEY("command_id","provider_event_id"),
+	CONSTRAINT "communication_provider_status_receipts_status_valid" CHECK ("communication_provider_status_receipts"."status" in ('sent', 'delivered', 'read', 'failed'))
+);
+--> statement-breakpoint
+ALTER TABLE "communication_provider_status_receipts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
+DROP POLICY "public_chat_audit_events_server_gateway_only" ON "public_chat_audit_events" CASCADE;--> statement-breakpoint
+DROP TABLE "public_chat_audit_events" CASCADE;--> statement-breakpoint
+DROP POLICY "public_chat_conversations_server_gateway_only" ON "public_chat_conversations" CASCADE;--> statement-breakpoint
+DROP TABLE "public_chat_conversations" CASCADE;--> statement-breakpoint
+DROP POLICY "public_chat_handoffs_server_gateway_only" ON "public_chat_handoffs" CASCADE;--> statement-breakpoint
+DROP TABLE "public_chat_handoffs" CASCADE;--> statement-breakpoint
+DROP POLICY "public_chat_messages_server_gateway_only" ON "public_chat_messages" CASCADE;--> statement-breakpoint
+DROP TABLE "public_chat_messages" CASCADE;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_version_positive";--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_fingerprint_valid";--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_policy_version_positive";--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" DROP CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid";--> statement-breakpoint
+ALTER TABLE "public_chat_citations" DROP CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk";
+--> statement-breakpoint
+ALTER TABLE "public_chat_idempotency" DROP CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk";
+--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_id" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_domain" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_reference" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_issued_at" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_valid_until" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "owning_receipt_correlation_id" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "expected_policy_version" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ALTER COLUMN "fingerprint" DROP NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_contact_policies" ADD COLUMN "fence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_owner_hash" char(64) NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_version" integer NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "lease_expires_at" timestamp with time zone NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD COLUMN "provider_reference_digest" char(64);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "required_fence" integer;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "endpoint_digests" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD COLUMN "failure_code" varchar(64);--> statement-breakpoint
+ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_attempt_command_fk" FOREIGN KEY ("attempt_id","command_id") REFERENCES "public"."communication_dispatch_attempts"("id","command_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_reconciliation_receipts" ADD CONSTRAINT "communication_dispatch_reconciliation_receipts_command_binding_fk" FOREIGN KEY ("command_id","binding_id") REFERENCES "public"."communication_outbound_commands"("id","binding_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_provider_status_receipts" ADD CONSTRAINT "communication_provider_status_receipts_command_id_communication_outbound_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."communication_outbound_commands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "public_chat_citations" ADD CONSTRAINT "public_chat_citations_message_id_communication_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."communication_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "public_chat_idempotency" ADD CONSTRAINT "public_chat_idempotency_conversation_id_communication_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."communication_conversations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_id_command_unique" UNIQUE("id","command_id");--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_id_binding_unique" UNIQUE("id","binding_id");--> statement-breakpoint
+ALTER TABLE "communication_contact_policies" ADD CONSTRAINT "communication_contact_policies_fence_nonnegative" CHECK ("communication_contact_policies"."fence" >= 0);--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_owner_hash_valid" CHECK ("communication_dispatch_attempts"."lease_owner_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_version_positive" CHECK ("communication_dispatch_attempts"."lease_version" > 0);--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_lease_window_valid" CHECK ("communication_dispatch_attempts"."lease_expires_at" > "communication_dispatch_attempts"."started_at");--> statement-breakpoint
+ALTER TABLE "communication_dispatch_attempts" ADD CONSTRAINT "communication_dispatch_attempts_provider_reference_digest_valid" CHECK ("communication_dispatch_attempts"."provider_reference_digest" is null or "communication_dispatch_attempts"."provider_reference_digest" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_lease_owner_hash_valid" CHECK ("communication_outbound_commands"."lease_owner_id" is null or "communication_outbound_commands"."lease_owner_id" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_required_fence_valid" CHECK ("communication_outbound_commands"."required_fence" is null or "communication_outbound_commands"."required_fence" >= 0);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_endpoint_digests_valid" CHECK (jsonb_typeof("communication_outbound_commands"."endpoint_digests") = 'array');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_version_nonnegative" CHECK ("communication_outbound_commands"."version" >= 0);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_finalization_valid" CHECK ("communication_outbound_commands"."state" = 'draft' or ("communication_outbound_commands"."fingerprint" is not null and "communication_outbound_commands"."expected_policy_version" is not null and "communication_outbound_commands"."required_fence" is not null and "communication_outbound_commands"."owning_receipt_id" is not null));--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_fingerprint_valid" CHECK ("communication_outbound_commands"."fingerprint" is null or "communication_outbound_commands"."fingerprint" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_policy_version_positive" CHECK ("communication_outbound_commands"."expected_policy_version" is null or "communication_outbound_commands"."expected_policy_version" > 0);--> statement-breakpoint
+ALTER TABLE "communication_outbound_commands" ADD CONSTRAINT "communication_outbound_commands_owning_receipt_window_valid" CHECK (("communication_outbound_commands"."owning_receipt_id" is null and "communication_outbound_commands"."owning_domain" is null and "communication_outbound_commands"."owning_reference" is null and "communication_outbound_commands"."owning_receipt_issued_at" is null and "communication_outbound_commands"."owning_receipt_valid_until" is null and "communication_outbound_commands"."owning_receipt_correlation_id" is null) or ("communication_outbound_commands"."owning_receipt_id" is not null and "communication_outbound_commands"."owning_domain" is not null and "communication_outbound_commands"."owning_reference" is not null and "communication_outbound_commands"."owning_receipt_issued_at" is not null and "communication_outbound_commands"."owning_receipt_valid_until" > "communication_outbound_commands"."owning_receipt_issued_at" and "communication_outbound_commands"."owning_receipt_correlation_id" is not null));--> statement-breakpoint
+CREATE POLICY "communication_dispatch_reconciliation_receipts_communications_scope" ON "communication_dispatch_reconciliation_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+CREATE POLICY "communication_provider_status_receipts_communications_scope" ON "communication_provider_status_receipts" AS PERMISSIVE FOR ALL TO "atlas_communications_gateway" USING (true) WITH CHECK (true);--> statement-breakpoint
+ALTER POLICY "public_chat_citations_server_gateway_only" ON "public_chat_citations" TO atlas_public_chat_gateway USING (exists (
+    select 1
+    from communication_messages message
+    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
+    where message.id = "public_chat_citations"."message_id"
+      and message.channel_kind = 'public_web'
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK (exists (
+    select 1
+    from communication_messages message
+    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
+    where message.id = "public_chat_citations"."message_id"
+      and message.channel_kind = 'public_web'
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));--> statement-breakpoint
+ALTER POLICY "public_chat_idempotency_server_gateway_only" ON "public_chat_idempotency" TO atlas_public_chat_gateway USING (exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "public_chat_idempotency"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  )) WITH CHECK (exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = "public_chat_idempotency"."conversation_id"
+      and pcs.session_id = nullif(current_setting('atlas.public_chat_session_id', true), '')
+  ));
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0009_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0009_snapshot.json
new file mode 100644
index 0000000..41ace2a
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0009_snapshot.json
@@ -0,0 +1,4477 @@
+{
+  "id": "98d57ab8-2fc0-47a1-a3c7-9d142c00c120",
+  "prevId": "b9c77877-d264-4438-931f-f735a86d06f8",
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
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
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
+        "owning_receipt_id": {
+          "name": "owning_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_domain": {
+          "name": "owning_domain",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_issued_at": {
+          "name": "owning_receipt_issued_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_valid_until": {
+          "name": "owning_receipt_valid_until",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "owning_receipt_correlation_id": {
+          "name": "owning_receipt_correlation_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expected_policy_version": {
+          "name": "expected_policy_version",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
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
+          "notNull": true
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
+          "value": "\"communication_outbound_commands\".\"fingerprint\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_outbound_commands_lease_token_hash_valid": {
+          "name": "communication_outbound_commands_lease_token_hash_valid",
+          "value": "\"communication_outbound_commands\".\"lease_token_hash\" is null or \"communication_outbound_commands\".\"lease_token_hash\" ~ '^[0-9a-f]{64}$'"
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
+          "value": "\"communication_outbound_commands\".\"expected_policy_version\" > 0"
+        },
+        "communication_outbound_commands_version_positive": {
+          "name": "communication_outbound_commands_version_positive",
+          "value": "\"communication_outbound_commands\".\"version\" > 0"
+        },
+        "communication_outbound_commands_owning_receipt_window_valid": {
+          "name": "communication_outbound_commands_owning_receipt_window_valid",
+          "value": "\"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\""
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or (char_length(\"communication_outbound_commands\".\"destination_key\") <= 120 and \"communication_outbound_commands\".\"destination_key\" ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')"
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
+    "public.public_chat_audit_events": {
+      "name": "public_chat_audit_events",
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
+        "event_name": {
+          "name": "event_name",
+          "type": "varchar(64)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
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
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
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
+        "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_audit_events_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_audit_events",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_audit_sequence_unique": {
+          "name": "public_chat_audit_sequence_unique",
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_audit_events_server_gateway_only": {
+          "name": "public_chat_audit_events_server_gateway_only",
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
+        "public_chat_audit_locale_valid": {
+          "name": "public_chat_audit_locale_valid",
+          "value": "\"public_chat_audit_events\".\"locale\" in ('es', 'en')"
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
+        "public_chat_citations_message_id_public_chat_messages_id_fk": {
+          "name": "public_chat_citations_message_id_public_chat_messages_id_fk",
+          "tableFrom": "public_chat_citations",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "tableTo": "public_chat_messages",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
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
+          "using": "true",
+          "withCheck": "true"
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
+    "public.public_chat_conversations": {
+      "name": "public_chat_conversations",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "session_id": {
+          "name": "session_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
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
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "varchar(32)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "notice_version": {
+          "name": "notice_version",
+          "type": "varchar(80)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "correlation_id": {
+          "name": "correlation_id",
+          "type": "text",
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
+          "notNull": true
+        },
+        "closed_at": {
+          "name": "closed_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_receipt_id": {
+          "name": "handoff_receipt_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "handoff_reason": {
+          "name": "handoff_reason",
+          "type": "varchar(48)",
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
+        "public_chat_conversations_expiry_idx": {
+          "name": "public_chat_conversations_expiry_idx",
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
+        },
+        "public_chat_conversations_reconciliation_idx": {
+          "name": "public_chat_conversations_reconciliation_idx",
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
+      "foreignKeys": {
+        "public_chat_conversations_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversations_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversations",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "tableTo": "public_chat_sessions",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversations_session_start_key_unique": {
+          "name": "public_chat_conversations_session_start_key_unique",
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_conversations_server_gateway_only": {
+          "name": "public_chat_conversations_server_gateway_only",
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
+        "public_chat_conversations_version_positive": {
+          "name": "public_chat_conversations_version_positive",
+          "value": "\"public_chat_conversations\".\"version\" > 0"
+        },
+        "public_chat_conversations_locale_valid": {
+          "name": "public_chat_conversations_locale_valid",
+          "value": "\"public_chat_conversations\".\"locale\" in ('es', 'en')"
+        },
+        "public_chat_conversations_status_valid": {
+          "name": "public_chat_conversations_status_valid",
+          "value": "\"public_chat_conversations\".\"status\" in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')"
+        },
+        "public_chat_conversations_expiry_valid": {
+          "name": "public_chat_conversations_expiry_valid",
+          "value": "\"public_chat_conversations\".\"expires_at\" > \"public_chat_conversations\".\"created_at\""
+        },
+        "public_chat_conversations_handoff_reason_valid": {
+          "name": "public_chat_conversations_handoff_reason_valid",
+          "value": "\"public_chat_conversations\".\"handoff_reason\" is null or \"public_chat_conversations\".\"handoff_reason\" in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable')"
+        },
+        "public_chat_conversations_handoff_state_valid": {
+          "name": "public_chat_conversations_handoff_state_valid",
+          "value": "(\"public_chat_conversations\".\"status\" in ('human_requested', 'waiting_for_human') and \"public_chat_conversations\".\"handoff_reason\" is not null) or (\"public_chat_conversations\".\"status\" not in ('human_requested', 'waiting_for_human'))"
+        }
+      },
+      "isRLSEnabled": true
+    },
+    "public.public_chat_handoffs": {
+      "name": "public_chat_handoffs",
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
+        "status": {
+          "name": "status",
+          "type": "varchar(24)",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
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
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_handoffs_status_idx": {
+          "name": "public_chat_handoffs_status_idx",
+          "columns": [
+            {
+              "expression": "status",
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
+        "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_handoffs_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_handoffs",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {
+        "public_chat_handoffs_server_gateway_only": {
+          "name": "public_chat_handoffs_server_gateway_only",
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
+        "public_chat_handoffs_status_valid": {
+          "name": "public_chat_handoffs_status_valid",
+          "value": "\"public_chat_handoffs\".\"status\" in ('human_requested', 'waiting_for_human')"
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
+        "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
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
+          "using": "true",
+          "withCheck": "true"
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
+    "public.public_chat_messages": {
+      "name": "public_chat_messages",
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
+        "ordinal": {
+          "name": "ordinal",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "actor": {
+          "name": "actor",
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
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp with time zone",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "public_chat_messages_conversation_idx": {
+          "name": "public_chat_messages_conversation_idx",
+          "columns": [
+            {
+              "expression": "conversation_id",
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
+        "public_chat_messages_conversation_id_public_chat_conversations_id_fk": {
+          "name": "public_chat_messages_conversation_id_public_chat_conversations_id_fk",
+          "tableFrom": "public_chat_messages",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "tableTo": "public_chat_conversations",
+          "columnsTo": [
+            "id"
+          ],
+          "onUpdate": "no action",
+          "onDelete": "cascade"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_messages_conversation_ordinal_unique": {
+          "name": "public_chat_messages_conversation_ordinal_unique",
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ],
+          "nullsNotDistinct": false
+        }
+      },
+      "policies": {
+        "public_chat_messages_server_gateway_only": {
+          "name": "public_chat_messages_server_gateway_only",
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
+        "public_chat_messages_actor_valid": {
+          "name": "public_chat_messages_actor_valid",
+          "value": "\"public_chat_messages\".\"actor\" in ('visitor', 'assistant', 'human', 'system')"
+        },
+        "public_chat_messages_state_valid": {
+          "name": "public_chat_messages_state_valid",
+          "value": "\"public_chat_messages\".\"state\" in ('accepted', 'answered', 'failed', 'handoff_required')"
+        },
+        "public_chat_messages_body_retention_valid": {
+          "name": "public_chat_messages_body_retention_valid",
+          "value": "(\"public_chat_messages\".\"body_stored\" = true and \"public_chat_messages\".\"body\" is not null) or (\"public_chat_messages\".\"body_stored\" = false and \"public_chat_messages\".\"body\" is null)"
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
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json b/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
new file mode 100644
index 0000000..308d94b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
@@ -0,0 +1,4223 @@
+{
+  "id": "c25cd908-8421-4dcb-8a56-cc878dba93ca",
+  "prevId": "98d57ab8-2fc0-47a1-a3c7-9d142c00c120",
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_audit_events_conversation_channel_fk": {
+          "name": "communication_audit_events_conversation_channel_fk",
+          "tableFrom": "communication_audit_events",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_audit_events_conversation_sequence_unique": {
+          "name": "communication_audit_events_conversation_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "sequence"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_channel_connections_id_channel_unique": {
+          "name": "communication_channel_connections_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_bindings_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_contact_bindings_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_contact_bindings_connection_channel_fk": {
+          "name": "communication_contact_bindings_connection_channel_fk",
+          "tableFrom": "communication_contact_bindings",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_bindings_id_connection_channel_unique": {
+          "name": "communication_contact_bindings_id_connection_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_id_channel_unique": {
+          "name": "communication_contact_bindings_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
+        },
+        "communication_contact_bindings_endpoint_unique": {
+          "name": "communication_contact_bindings_endpoint_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "endpoint_digest_key_version",
+            "endpoint_digest"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_evidence_events_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_evidence_events",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_evidence_events_binding_sequence_unique": {
+          "name": "communication_contact_evidence_events_binding_sequence_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "sequence"
+          ]
+        },
+        "communication_contact_evidence_events_receipt_unique": {
+          "name": "communication_contact_evidence_events_receipt_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "evidence_receipt_id"
+          ]
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
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_withdrawn', 'consent_regranted') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'consent') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"owning_domain\" = 'M078' and \"communication_contact_evidence_events\".\"authority_role\" = 'contact_review') or (\"communication_contact_evidence_events\".\"event_kind\" in ('binding_suspended', 'binding_revalidated') and \"communication_contact_evidence_events\".\"authority_role\" = 'binding_verification')"
+        },
+        "communication_contact_evidence_events_receipt_valid": {
+          "name": "communication_contact_evidence_events_receipt_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" in ('consent_granted', 'consent_regranted') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'consent_evidence') or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'contact_withdrawal') or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_detection') or (\"communication_contact_evidence_events\".\"event_kind\" in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and \"communication_contact_evidence_events\".\"receipt_kind\" = 'ambiguous_opt_out_resolution') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_suspension') or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"receipt_kind\" = 'binding_revalidation')"
+        },
+        "communication_contact_evidence_events_state_shape_valid": {
+          "name": "communication_contact_evidence_events_state_shape_valid",
+          "value": "(\"communication_contact_evidence_events\".\"event_kind\" = 'consent_granted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_regranted' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'consent_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_detected' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'opt_out_pending' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_cleared' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'granted' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'normal_after_review' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'clear' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'ambiguous_opt_out_withdrawn' and \"communication_contact_evidence_events\".\"purpose\" is not null and \"communication_contact_evidence_events\".\"consent_state\" is not null and \"communication_contact_evidence_events\".\"consent_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"fence_state\" is not null and \"communication_contact_evidence_events\".\"fence_state\" = 'withdrawn' and \"communication_contact_evidence_events\".\"authority_version\" is not null and \"communication_contact_evidence_events\".\"authority_version\" > 0 and \"communication_contact_evidence_events\".\"review_resolution\" is not null and \"communication_contact_evidence_events\".\"review_resolution\" = 'withdraw' and \"communication_contact_evidence_events\".\"triggering_event_id\" is not null and \"communication_contact_evidence_events\".\"policy_version\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_suspended' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'suspended' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null) or (\"communication_contact_evidence_events\".\"event_kind\" = 'binding_revalidated' and \"communication_contact_evidence_events\".\"binding_trust_state\" is not null and \"communication_contact_evidence_events\".\"binding_trust_state\" = 'reverified' and \"communication_contact_evidence_events\".\"purpose\" is null and \"communication_contact_evidence_events\".\"consent_state\" is null and \"communication_contact_evidence_events\".\"fence_state\" is null and \"communication_contact_evidence_events\".\"review_resolution\" is null and \"communication_contact_evidence_events\".\"authority_version\" is null and \"communication_contact_evidence_events\".\"triggering_event_id\" is null and \"communication_contact_evidence_events\".\"policy_version\" is null)"
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_contact_policies_binding_id_communication_contact_bindings_id_fk": {
+          "name": "communication_contact_policies_binding_id_communication_contact_bindings_id_fk",
+          "tableFrom": "communication_contact_policies",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_contact_policies_binding_purpose_unique": {
+          "name": "communication_contact_policies_binding_purpose_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "purpose"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_conversations_id_channel_unique": {
+          "name": "communication_conversations_id_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "channel_kind"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_dispatch_attempts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_dispatch_attempts_command_connection_fk": {
+          "name": "communication_dispatch_attempts_command_connection_fk",
+          "tableFrom": "communication_dispatch_attempts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_dispatch_attempts_command_ordinal_unique": {
+          "name": "communication_dispatch_attempts_command_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "command_id",
+            "attempt_ordinal"
+          ]
+        },
+        "communication_dispatch_attempts_id_command_unique": {
+          "name": "communication_dispatch_attempts_id_command_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "command_id"
+          ]
+        },
+        "communication_dispatch_attempts_external_reference_unique": {
+          "name": "communication_dispatch_attempts_external_reference_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_message_reference"
+          ]
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
+          "tableTo": "communication_dispatch_attempts",
+          "columnsFrom": [
+            "attempt_id",
+            "command_id"
+          ],
+          "columnsTo": [
+            "id",
+            "command_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_dispatch_reconciliation_receipts_command_binding_fk": {
+          "name": "communication_dispatch_reconciliation_receipts_command_binding_fk",
+          "tableFrom": "communication_dispatch_reconciliation_receipts",
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id",
+            "binding_id"
+          ],
+          "columnsTo": [
+            "id",
+            "binding_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
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
+          "using": "true",
+          "withCheck": "true"
+        }
+      },
+      "checkConstraints": {
+        "communication_dispatch_reconciliation_receipts_digest_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_digest_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"receipt_digest\" ~ '^[0-9a-f]{64}$'"
+        },
+        "communication_dispatch_reconciliation_receipts_source_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_source_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"source\" in ('provider_lookup', 'provider_status', 'manual_attestation')"
+        },
+        "communication_dispatch_reconciliation_receipts_outcome_valid": {
+          "name": "communication_dispatch_reconciliation_receipts_outcome_valid",
+          "value": "\"communication_dispatch_reconciliation_receipts\".\"outcome\" in ('accepted', 'confirmed_not_sent', 'failed')"
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_event_envelopes_receipt_connection_fk": {
+          "name": "communication_event_envelopes_receipt_connection_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_provider_event_receipts",
+          "columnsFrom": [
+            "receipt_id",
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_conversation_channel_fk": {
+          "name": "communication_event_envelopes_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_participant_conversation_channel_fk": {
+          "name": "communication_event_envelopes_participant_conversation_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_message_conversation_fk": {
+          "name": "communication_event_envelopes_message_conversation_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_messages",
+          "columnsFrom": [
+            "message_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_event_envelopes_binding_connection_channel_fk": {
+          "name": "communication_event_envelopes_binding_connection_channel_fk",
+          "tableFrom": "communication_event_envelopes",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_event_envelopes_receipt_id_unique": {
+          "name": "communication_event_envelopes_receipt_id_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "receipt_id"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_handoffs_conversation_channel_fk": {
+          "name": "communication_handoffs_conversation_channel_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_handoffs_assignee_conversation_fk": {
+          "name": "communication_handoffs_assignee_conversation_fk",
+          "tableFrom": "communication_handoffs",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "assigned_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_message_templates_definition_unique": {
+          "name": "communication_message_templates_definition_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "template_key",
+            "locale",
+            "definition_version"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_messages_conversation_channel_fk": {
+          "name": "communication_messages_conversation_channel_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_messages_sender_conversation_fk": {
+          "name": "communication_messages_sender_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "sender_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_messages_recipient_conversation_fk": {
+          "name": "communication_messages_recipient_conversation_fk",
+          "tableFrom": "communication_messages",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "recipient_participant_id",
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_messages_id_conversation_unique": {
+          "name": "communication_messages_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_messages_conversation_ordinal_unique": {
+          "name": "communication_messages_conversation_ordinal_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "ordinal"
+          ]
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
+        "owning_reference": {
+          "name": "owning_reference",
+          "type": "text",
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
+        "owning_receipt_correlation_id": {
+          "name": "owning_receipt_correlation_id",
+          "type": "text",
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_outbound_commands_conversation_channel_fk": {
+          "name": "communication_outbound_commands_conversation_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_outbound_commands_binding_connection_channel_fk": {
+          "name": "communication_outbound_commands_binding_connection_channel_fk",
+          "tableFrom": "communication_outbound_commands",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "binding_id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "connection_id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_outbound_commands_id_connection_unique": {
+          "name": "communication_outbound_commands_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_outbound_commands_id_binding_unique": {
+          "name": "communication_outbound_commands_id_binding_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "binding_id"
+          ]
+        },
+        "communication_outbound_commands_binding_key_unique": {
+          "name": "communication_outbound_commands_binding_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "binding_id",
+            "idempotency_key"
+          ]
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
+          "value": "(\"communication_outbound_commands\".\"owning_receipt_id\" is null and \"communication_outbound_commands\".\"owning_domain\" is null and \"communication_outbound_commands\".\"owning_reference\" is null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" is null and \"communication_outbound_commands\".\"owning_receipt_correlation_id\" is null) or (\"communication_outbound_commands\".\"owning_receipt_id\" is not null and \"communication_outbound_commands\".\"owning_domain\" is not null and \"communication_outbound_commands\".\"owning_reference\" is not null and \"communication_outbound_commands\".\"owning_receipt_issued_at\" is not null and \"communication_outbound_commands\".\"owning_receipt_valid_until\" > \"communication_outbound_commands\".\"owning_receipt_issued_at\" and \"communication_outbound_commands\".\"owning_receipt_correlation_id\" is not null)"
+        },
+        "communication_outbound_commands_finalization_valid": {
+          "name": "communication_outbound_commands_finalization_valid",
+          "value": "\"communication_outbound_commands\".\"state\" = 'draft' or (\"communication_outbound_commands\".\"fingerprint\" is not null and \"communication_outbound_commands\".\"expected_policy_version\" is not null and \"communication_outbound_commands\".\"required_fence\" is not null and \"communication_outbound_commands\".\"owning_receipt_id\" is not null)"
+        },
+        "communication_outbound_commands_destination_reference_opaque": {
+          "name": "communication_outbound_commands_destination_reference_opaque",
+          "value": "\"communication_outbound_commands\".\"destination_key\" is null or (char_length(\"communication_outbound_commands\".\"destination_key\") <= 120 and \"communication_outbound_commands\".\"destination_key\" ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')"
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_participants_conversation_channel_fk": {
+          "name": "communication_participants_conversation_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "communication_participants_binding_channel_fk": {
+          "name": "communication_participants_binding_channel_fk",
+          "tableFrom": "communication_participants",
+          "tableTo": "communication_contact_bindings",
+          "columnsFrom": [
+            "channel_binding_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_participants_id_conversation_unique": {
+          "name": "communication_participants_id_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id"
+          ]
+        },
+        "communication_participants_id_conversation_channel_unique": {
+          "name": "communication_participants_id_conversation_channel_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk": {
+          "name": "communication_provider_event_receipts_connection_id_communication_channel_connections_id_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "communication_provider_event_receipts_connection_channel_fk": {
+          "name": "communication_provider_event_receipts_connection_channel_fk",
+          "tableFrom": "communication_provider_event_receipts",
+          "tableTo": "communication_channel_connections",
+          "columnsFrom": [
+            "connection_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "communication_provider_event_receipts_id_connection_unique": {
+          "name": "communication_provider_event_receipts_id_connection_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "id",
+            "connection_id"
+          ]
+        },
+        "communication_provider_event_receipts_identity_unique": {
+          "name": "communication_provider_event_receipts_identity_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "connection_id",
+            "external_event_reference"
+          ]
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
+          "tableTo": "communication_outbound_commands",
+          "columnsFrom": [
+            "command_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
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
+          "using": "true",
+          "withCheck": "true"
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
+          "tableTo": "communication_messages",
+          "columnsFrom": [
+            "message_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_citations_message_source_unique": {
+          "name": "public_chat_citations_message_source_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "message_id",
+            "source_id"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk": {
+          "name": "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "public_chat_sessions",
+          "columnsFrom": [
+            "session_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        },
+        "public_chat_conversation_sessions_participant_conversation_channel_fk": {
+          "name": "public_chat_conversation_sessions_participant_conversation_channel_fk",
+          "tableFrom": "public_chat_conversation_sessions",
+          "tableTo": "communication_participants",
+          "columnsFrom": [
+            "participant_id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "columnsTo": [
+            "id",
+            "conversation_id",
+            "channel_kind"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_conversation_sessions_conversation_unique": {
+          "name": "public_chat_conversation_sessions_conversation_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id"
+          ]
+        },
+        "public_chat_conversation_sessions_session_start_key_unique": {
+          "name": "public_chat_conversation_sessions_session_start_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_id",
+            "start_idempotency_key"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "public_chat_idempotency_conversation_id_communication_conversations_id_fk": {
+          "name": "public_chat_idempotency_conversation_id_communication_conversations_id_fk",
+          "tableFrom": "public_chat_idempotency",
+          "tableTo": "communication_conversations",
+          "columnsFrom": [
+            "conversation_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_idempotency_conversation_key_unique": {
+          "name": "public_chat_idempotency_conversation_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "conversation_id",
+            "idempotency_key"
+          ]
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
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
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "public_chat_sessions_session_hash_unique": {
+          "name": "public_chat_sessions_session_hash_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "session_hash"
+          ]
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
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
index da6ce00..31b4267 100644
--- a/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
+++ b/blueprints/project-atlas/workspace/drizzle/meta/_journal.json
@@ -57,13 +57,27 @@
       "when": 1787249878408,
       "tag": "0007_m004_communications_schema",
       "breakpoints": true
     },
     {
       "idx": 8,
       "version": "7",
       "when": 1787249879081,
       "tag": "0008_m004_communications_backfill",
       "breakpoints": true
+    },
+    {
+      "idx": 9,
+      "version": "7",
+      "when": 1787251995592,
+      "tag": "0009_m004_communications_cutover_guard",
+      "breakpoints": true
+    },
+    {
+      "idx": 10,
+      "version": "7",
+      "when": 1787252190200,
+      "tag": "0010_m004_communications_canonical_cutover",
+      "breakpoints": true
     }
   ]
 }
\ No newline at end of file
diff --git a/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts b/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts
new file mode 100644
index 0000000..7e93e3e
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts
@@ -0,0 +1,13 @@
+import type { CommunicationsRepository } from "@atlas/domain";
+import {
+  type CommunicationsSql,
+  PostgresCommunicationsRepository,
+} from "./postgres-communications-store.ts";
+
+export function createPostgresCommunicationsRepository(
+  sql: CommunicationsSql,
+): CommunicationsRepository & Pick<PostgresCommunicationsRepository, "referenceState"> {
+  return new PostgresCommunicationsRepository(sql);
+}
+
+export * from "./postgres-communications-store.ts";
diff --git a/blueprints/project-atlas/workspace/packages/database/src/index.ts b/blueprints/project-atlas/workspace/packages/database/src/index.ts
index 0f3075f..99325ec 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/index.ts
@@ -1,7 +1,8 @@
 export const DATABASE_PACKAGE_ID = "@atlas/database";
 
 export * from "./communication-contact-evidence.ts";
 export * from "./communication-event-envelope.ts";
+export * from "./communications-repository.ts";
 export * from "./postgres-public-chat-store.ts";
 export * from "./public-chat-repository.ts";
 export * from "./schema.ts";
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
new file mode 100644
index 0000000..341ea20
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
@@ -0,0 +1,1812 @@
+import { createHash } from "node:crypto";
+import {
+  type AcceptInboundCommand,
+  type AcceptInboundResult,
+  type AmbiguousOptOutResolutionResult,
+  type ApplyProviderStatusCommand,
+  type ApproveTemplateDefinition,
+  type BindingChangeResult,
+  type ClaimInboundCommand,
+  type ClaimOutboundCommand,
+  type CommunicationsReferenceState,
+  type CommunicationsRepository,
+  type CompleteInboundCommand,
+  type ConsentChangeResult,
+  type ConsentRecord,
+  type CreateOutboundCommand,
+  type CreateOutboundResult,
+  type EvaluateTemplateEligibility,
+  evaluateAuthorityChange,
+  evaluateOutboundPolicy,
+  type FailOutboundDraftCommand,
+  type FinalizeOutboundCommand,
+  type GrantConsentCommand,
+  type InboundClaimResult,
+  type MarkDispatchOutcomeCommand,
+  type OutboundClaimResult,
+  type OutboundCommandState,
+  type ProviderStatusResult,
+  type RecoveryCandidate,
+  type RecoveryQuery,
+  type ReconcileOutboundCommand,
+  type ReconcileOutboundResult,
+  type ReconcileTemplateCommand,
+  type RegisterTemplateDefinition,
+  type ResolveOptOutCommand,
+  type RevalidateBindingCommand,
+  type SuspendBindingCommand,
+  type TemplateEligibilityResult,
+  type TemplateLifecycleState,
+  type TemplateReconciliationResult,
+  type TemplateResult,
+  type WithdrawContactCommand,
+  type WithdrawContactResult,
+} from "@atlas/domain";
+import postgres from "postgres";
+
+type TransactionSql = postgres.TransactionSql<Record<string, never>>;
+export type CommunicationsSql = postgres.Sql<Record<string, never>>;
+type SqlValue = string | number | boolean | Date | null;
+
+export const COMMUNICATIONS_TRANSACTION_SQL = {
+  attestPrincipal: `
+    with recursive runtime_closure(role_oid, admin_path, path) as (
+      select membership.roleid, membership.admin_option,
+        array[membership.member, membership.roleid]::oid[]
+      from pg_auth_members membership
+      where membership.member = (select oid from pg_roles where rolname = session_user)
+      union all
+      select membership.roleid,
+        runtime_closure.admin_path or membership.admin_option,
+        runtime_closure.path || membership.roleid
+      from runtime_closure
+      join pg_auth_members membership on membership.member = runtime_closure.role_oid
+      where not membership.roleid = any(runtime_closure.path)
+    ), gateway_closure(role_oid, path) as (
+      select membership.roleid, array[membership.member, membership.roleid]::oid[]
+      from pg_auth_members membership
+      where membership.member = (
+        select oid from pg_roles where rolname = 'atlas_communications_gateway'
+      )
+      union all
+      select membership.roleid, gateway_closure.path || membership.roleid
+      from gateway_closure
+      join pg_auth_members membership on membership.member = gateway_closure.role_oid
+      where not membership.roleid = any(gateway_closure.path)
+    )
+    select session_role.rolname as principal_name,
+      pg_has_role(session_user, 'atlas_communications_gateway', 'member') as is_member,
+      (select count(*)::integer from runtime_closure) as closure_count,
+      coalesce((select bool_or(admin_path) from runtime_closure), false) as admin_path,
+      (select count(*)::integer from gateway_closure) as gateway_closure_count,
+      session_role.rolbypassrls, session_role.rolinherit, session_role.rolsuper
+    from pg_roles session_role
+    where session_role.rolname = session_user
+    limit 1
+  `,
+  setLocalRole: "set local role atlas_communications_gateway",
+  proveLocalRole:
+    "select session_user as session_user_name, current_role as current_role_name",
+  claimInbound: `
+    select receipt.id
+    from communication_provider_event_receipts receipt
+    join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
+    where receipt.id = $1 and receipt.state = 'persisted'
+    for update of receipt skip locked
+  `,
+  claimOutbound: `
+    select * from communication_outbound_commands
+    where id = $1 and state = 'queued'
+    for update skip locked
+  `,
+  lockBinding:
+    "select * from communication_contact_bindings where id = $1 for update",
+  lockPolicy: `
+    select * from communication_contact_policies
+    where binding_id = $1 and purpose = $2
+    for update
+  `,
+} as const;
+
+export type CommunicationsPrincipalAttestation = {
+  principal_name: string;
+  is_member: boolean;
+  closure_count: number;
+  admin_path: boolean;
+  gateway_closure_count: number;
+  rolbypassrls: boolean;
+  rolinherit: boolean;
+  rolsuper: boolean;
+};
+
+export function assertRestrictedCommunicationsPrincipal(
+  principal: CommunicationsPrincipalAttestation | undefined,
+): void {
+  if (
+    principal?.principal_name !== "atlas_communications_runtime" ||
+    !principal.is_member ||
+    principal.closure_count !== 1 ||
+    principal.admin_path ||
+    principal.gateway_closure_count !== 0 ||
+    principal.rolbypassrls ||
+    principal.rolinherit ||
+    principal.rolsuper
+  ) {
+    throw new Error("COMMUNICATIONS_DATABASE_PRINCIPAL_UNSAFE");
+  }
+}
+
+export function createCommunicationsSql(databaseUrl: string): CommunicationsSql {
+  return postgres(databaseUrl, {
+    max: 4,
+    idle_timeout: 20,
+    connect_timeout: 10,
+    prepare: false,
+  });
+}
+
+async function query<Row>(
+  tx: TransactionSql,
+  statement: string,
+  parameters: readonly SqlValue[] = [],
+): Promise<Row[]> {
+  return tx.unsafe<Row[]>(statement, [...parameters]);
+}
+
+async function withCommunicationsTransaction<T>(
+  sql: CommunicationsSql,
+  work: (tx: TransactionSql) => Promise<T>,
+): Promise<T> {
+  return sql.begin(async (tx) => {
+    const principals = await query<CommunicationsPrincipalAttestation>(
+      tx,
+      COMMUNICATIONS_TRANSACTION_SQL.attestPrincipal,
+    );
+    assertRestrictedCommunicationsPrincipal(principals[0]);
+    await query(tx, COMMUNICATIONS_TRANSACTION_SQL.setLocalRole);
+    const localRole = (
+      await query<{ session_user_name: string; current_role_name: string }>(
+        tx,
+        COMMUNICATIONS_TRANSACTION_SQL.proveLocalRole,
+      )
+    )[0];
+    if (
+      localRole?.session_user_name !== "atlas_communications_runtime" ||
+      localRole.current_role_name !== "atlas_communications_gateway"
+    ) {
+      throw new Error("COMMUNICATIONS_DATABASE_LOCAL_ROLE_UNPROVEN");
+    }
+    return work(tx);
+  }) as Promise<T>;
+}
+
+const MAX_LEASE_MILLISECONDS = 15 * 60_000;
+const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
+const finiteDate = (value: unknown): value is Date =>
+  value instanceof Date && Number.isFinite(value.getTime());
+const validLease = (now: Date, expiresAt: Date) =>
+  finiteDate(now) &&
+  finiteDate(expiresAt) &&
+  expiresAt > now &&
+  expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS;
+const currentReceipt = (receipt: { issuedAt: Date; expiresAt: Date }, now: Date) =>
+  finiteDate(receipt.issuedAt) &&
+  finiteDate(receipt.expiresAt) &&
+  finiteDate(now) &&
+  receipt.issuedAt <= now &&
+  receipt.expiresAt > now;
+
+type CommandRow = {
+  id: string;
+  conversation_id: string;
+  binding_id: string;
+  connection_id: string;
+  locale: "es" | "en";
+  purpose: "conversational" | "transactional" | "service" | "marketing";
+  message_reference: string;
+  template_key: string;
+  expected_policy_version: number;
+  required_fence: number;
+  endpoint_digests: Array<{ version: string; digest: string }>;
+  owning_receipt_id: string | null;
+  owning_receipt_issued_at: Date | null;
+  owning_receipt_valid_until: Date | null;
+  idempotency_key: string;
+  fingerprint: string | null;
+  correlation_id: string;
+  state: OutboundCommandState;
+  version: number;
+  lease_owner_id: string | null;
+  lease_expires_at: Date | null;
+  created_at: Date;
+  failure_code: string | null;
+};
+
+type InboundRow = {
+  event_id: string;
+  binding_id: string;
+  conversation_id: string;
+  message_id: string;
+  participant_id: string;
+  connection_state: AcceptInboundCommand["envelope"]["event"]["connectionState"];
+  locale: "es" | "en";
+  correlation_id: string;
+  received_at: Date;
+  event_state: AcceptInboundCommand["envelope"]["event"]["state"];
+  conversation_status: AcceptInboundCommand["envelope"]["conversation"]["status"];
+  conversation_version: number;
+  conversation_created_at: Date;
+  conversation_updated_at: Date;
+  last_activity_at: Date;
+  closed_at: Date | null;
+  participant_role: string;
+  participant_created_at: Date;
+  message_direction: "inbound" | "outbound" | "system";
+  recipient_participant_id: string | null;
+  message_kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
+  message_created_at: Date;
+};
+
+export class PostgresCommunicationsRepository implements CommunicationsRepository {
+  constructor(private readonly sql: CommunicationsSql) {}
+
+  async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
+    const activeDigest = input.endpointDigests[0];
+    if (!activeDigest) return { status: "replay_mismatch", code: "provider_replay_mismatch" };
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const existing = (
+        await query<{
+          id: string;
+          body_digest: string;
+          endpoint_digest: string;
+          endpoint_digest_key_version: string;
+        }>(
+          tx,
+          `select receipt.id, receipt.body_digest, binding.endpoint_digest,
+             binding.endpoint_digest_key_version
+           from communication_provider_event_receipts receipt
+           join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
+           join communication_contact_bindings binding on binding.id = envelope.binding_id
+           where receipt.connection_id = $1 and receipt.external_event_reference = $2
+           limit 1 for update`,
+          [input.connectionId, input.providerEventId],
+        )
+      )[0];
+      if (existing) {
+        if (existing.body_digest !== input.providerBodyDigest) {
+          return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
+        }
+        return {
+          status: "duplicate",
+          eventId: existing.id,
+          endpointDigestVersion: existing.endpoint_digest_key_version,
+          endpointDigest: existing.endpoint_digest,
+        } as const;
+      }
+
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
+      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [binding.id, "transactional"]);
+      const envelope = input.envelope;
+      await query(
+        tx,
+        `insert into communication_conversations (
+          id, channel_kind, locale, status, version, correlation_id, last_activity_at,
+          expires_at, closed_at, reconciliation_required, created_at, updated_at
+        ) values ($1, 'whatsapp', $2, $3, $4, $5, $6, null, $7, false, $8, $9)
+        on conflict (id) do nothing`,
+        [
+          envelope.conversation.id,
+          envelope.conversation.locale,
+          envelope.conversation.status,
+          envelope.conversation.version,
+          envelope.event.correlationId,
+          envelope.conversation.lastActivityAt,
+          envelope.conversation.closedAt ?? null,
+          envelope.conversation.createdAt,
+          envelope.conversation.updatedAt,
+        ],
+      );
+      const participantKind =
+        envelope.participant.role === "external_contact"
+          ? "external"
+          : envelope.participant.role === "assistant"
+            ? "automated"
+            : envelope.participant.role;
+      await query(
+        tx,
+        `insert into communication_participants (
+          id, conversation_id, channel_kind, kind, channel_binding_id,
+          joined_at, left_at, created_at, updated_at
+        ) values ($1, $2, 'whatsapp', $3, $4, $5, null, $5, $5)
+        on conflict (id) do nothing`,
+        [
+          envelope.participant.participantId,
+          envelope.participant.conversationId,
+          participantKind,
+          envelope.participant.bindingId,
+          envelope.participant.createdAt,
+        ],
+      );
+      await query(
+        tx,
+        `insert into communication_messages (
+          id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+          recipient_participant_id, locale, kind, state, body, body_stored,
+          body_retention_policy, actions, rejection_reason, external_message_reference, created_at
+        ) values ($1, $2, 'whatsapp', 1, $3, $4, $5, $6, $7, 'accepted', null, false,
+          'metadata_only', '[]'::jsonb, null, null, $8)
+        on conflict (id) do nothing`,
+        [
+          envelope.message.id,
+          envelope.message.conversationId,
+          envelope.message.direction,
+          envelope.message.senderParticipantId,
+          envelope.message.recipientParticipantId ?? null,
+          envelope.message.locale,
+          envelope.message.kind,
+          envelope.message.createdAt,
+        ],
+      );
+      await query(
+        tx,
+        `insert into communication_provider_event_receipts (
+          id, connection_id, channel_kind, external_event_reference, body_digest,
+          event_kind, state, schema_version, signature_verified, correlation_id,
+          outcome_reason, processing_version, lease_owner_id, lease_token_hash,
+          lease_expires_at, received_at, persisted_at, processed_at, created_at, updated_at
+        ) values ($1, $2, 'whatsapp', $3, $4, 'text_message', 'persisted',
+          'meta-envelope.v1', true, $5, null, 0, null, null, null, $6, $6, null, $6, $6)`,
+        [
+          envelope.event.eventId,
+          input.connectionId,
+          input.providerEventId,
+          input.providerBodyDigest,
+          envelope.event.correlationId,
+          envelope.event.receivedAt,
+        ],
+      );
+      await query(
+        tx,
+        `insert into communication_event_envelopes (
+          id, receipt_id, connection_id, channel_kind, event_kind, schema_version,
+          conversation_id, participant_id, binding_id, message_id, message_reference,
+          canonical_text, body_retention_policy, occurred_at, created_at, updated_at
+        ) values ($1, $1, $2, 'whatsapp', 'text_message', 'meta-envelope.v1',
+          $3, $4, $5, $6, $6, null, 'metadata_only', $7, $7, $7)`,
+        [
+          envelope.event.eventId,
+          input.connectionId,
+          envelope.conversation.id,
+          envelope.participant.participantId,
+          envelope.event.bindingId,
+          envelope.message.id,
+          envelope.event.receivedAt,
+        ],
+      );
+      if (input.optOutSignal === "pending") {
+        await query(
+          tx,
+          `update communication_contact_policies
+           set fence_state = case when fence_state = 'withdrawn' then fence_state else 'opt_out_pending' end,
+             version = case when fence_state = 'withdrawn' then version else version + 1 end,
+             fence = case when fence_state = 'withdrawn' then fence else fence + 1 end,
+             evaluated_at = $2, updated_at = $2
+           where binding_id = $1 and purpose = 'transactional'`,
+          [envelope.event.bindingId, envelope.event.receivedAt],
+        );
+      }
+      await this.appendAudit(tx, envelope, input.optOutSignal === "pending" ? 8 : 7);
+      return {
+        status: "accepted",
+        eventId: envelope.event.eventId,
+        endpointDigestVersion: binding.endpoint_digest_key_version,
+        endpointDigest: binding.endpoint_digest,
+      } as const;
+    });
+  }
+
+  async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
+    if (!validLease(input.now, input.leaseExpiresAt)) {
+      return { status: "not_claimed", code: "lease_conflict" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const candidate = (
+        await query<{ id: string }>(tx, COMMUNICATIONS_TRANSACTION_SQL.claimInbound, [input.eventId])
+      )[0];
+      if (!candidate) return this.inboundNotClaimed(tx, input);
+      const row = await this.loadInbound(tx, input.eventId);
+      if (!row) return { status: "not_claimed", code: "not_found" } as const;
+      const policy = (
+        await query<{ version: number; fence_state: InboundClaimResult extends infer _ ? string : never }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
+          [row.binding_id, "transactional"],
+        )
+      )[0];
+      if (!policy || policy.version !== input.requiredPolicyVersion) {
+        return { status: "not_claimed", code: "policy_version_mismatch" } as const;
+      }
+      const updated = await query<{ processing_version: number }>(
+        tx,
+        `update communication_provider_event_receipts
+         set lease_owner_id = $2, lease_token_hash = $2, lease_expires_at = $3,
+           processing_version = processing_version + 1, updated_at = $4
+         where id = $1 and state = 'persisted'
+           and (lease_expires_at is null or lease_expires_at <= $4)
+         returning processing_version`,
+        [input.eventId, sha256(input.leaseOwner), input.leaseExpiresAt, input.now],
+      );
+      const leaseVersion = updated[0]?.processing_version;
+      if (!leaseVersion) return { status: "not_claimed", code: "lease_conflict" } as const;
+      return {
+        status: "claimed",
+        eventId: input.eventId,
+        leaseVersion,
+        policyState: policy.fence_state as Extract<InboundClaimResult, { status: "claimed" }>["policyState"],
+        envelope: {
+          event: {
+            eventId: row.event_id,
+            channel: "whatsapp",
+            locale: row.locale,
+            connectionState: row.connection_state,
+            bindingId: row.binding_id,
+            conversationId: row.conversation_id,
+            messageId: row.message_id,
+            receivedAt: row.received_at,
+            state: row.event_state,
+            correlationId: row.correlation_id,
+          },
+          conversation: {
+            id: row.conversation_id,
+            channel: "whatsapp",
+            locale: row.locale,
+            status: row.conversation_status,
+            participantIds: [row.participant_id],
+            version: row.conversation_version,
+            createdAt: row.conversation_created_at,
+            updatedAt: row.conversation_updated_at,
+            lastActivityAt: row.last_activity_at,
+            ...(row.closed_at ? { closedAt: row.closed_at } : {}),
+          },
+          participant: {
+            participantId: row.participant_id,
+            conversationId: row.conversation_id,
+            bindingId: row.binding_id,
+            role: row.participant_role === "external" ? "external_contact" : "system",
+            createdAt: row.participant_created_at,
+          },
+          message: {
+            id: row.message_id,
+            conversationId: row.conversation_id,
+            channel: "whatsapp",
+            direction: row.message_direction,
+            senderParticipantId: row.participant_id,
+            ...(row.recipient_participant_id
+              ? { recipientParticipantId: row.recipient_participant_id }
+              : {}),
+            locale: row.locale,
+            kind: row.message_kind,
+            body: null,
+            createdAt: row.message_created_at,
+          },
+        },
+      };
+    });
+  }
+
+  async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
+    if (!finiteDate(input.now)) return "conflict";
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const rows = await query<{ id: string }>(
+        tx,
+        `update communication_provider_event_receipts
+         set state = $5, outcome_reason = $5, processed_at = $4,
+           lease_owner_id = null, lease_token_hash = null, lease_expires_at = null,
+           updated_at = $4
+         where id = $1 and state = 'persisted' and lease_owner_id = $2
+           and processing_version = $3 and lease_expires_at > $4
+         returning id`,
+        [input.eventId, sha256(input.leaseOwner), input.leaseVersion, input.now, input.outcome],
+      );
+      return rows.length === 1 ? "completed" : "conflict";
+    });
+  }
+
+  async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const existing = (
+        await query<CommandRow>(
+          tx,
+          `select * from communication_outbound_commands where idempotency_key = $1 limit 1 for update`,
+          [input.command.idempotencyKey],
+        )
+      )[0];
+      if (existing) {
+        if (
+          existing.binding_id !== input.command.bindingId ||
+          existing.conversation_id !== input.command.conversationId ||
+          existing.message_reference !== input.message.id ||
+          existing.purpose !== input.purpose ||
+          existing.template_key !== input.templateId
+        ) {
+          return { status: "conflict", code: "idempotency_mismatch" } as const;
+        }
+        const reason = this.duplicateReason(existing);
+        return {
+          status: "duplicate",
+          commandId: existing.id,
+          messageId: existing.message_reference,
+          commandState: existing.state,
+          ...(reason ? { reason } : {}),
+        } as const;
+      }
+      const binding = (
+        await query<{ connection_id: string }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
+          [input.command.bindingId],
+        )
+      )[0];
+      if (!binding) return { status: "conflict", code: "idempotency_mismatch" } as const;
+      await query(
+        tx,
+        `insert into communication_participants (
+          id, conversation_id, channel_kind, kind, channel_binding_id,
+          joined_at, left_at, created_at, updated_at
+        ) values ($1, $2, 'whatsapp', 'system', null, $3, null, $3, $3)
+        on conflict (id) do nothing`,
+        [input.message.senderParticipantId, input.message.conversationId, input.message.createdAt],
+      );
+      const ordinal = (
+        await query<{ ordinal: number }>(
+          tx,
+          `select coalesce(max(ordinal), 0)::integer + 1 as ordinal
+           from communication_messages where conversation_id = $1`,
+          [input.message.conversationId],
+        )
+      )[0]?.ordinal ?? 1;
+      await query(
+        tx,
+        `insert into communication_messages (
+          id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+          recipient_participant_id, locale, kind, state, body, body_stored,
+          body_retention_policy, actions, rejection_reason, external_message_reference, created_at
+        ) values ($1, $2, 'whatsapp', $3, 'outbound', $4, $5, $6, $7, 'accepted',
+          null, false, 'metadata_only', '[]'::jsonb, null, null, $8)`,
+        [
+          input.message.id,
+          input.message.conversationId,
+          ordinal,
+          input.message.senderParticipantId,
+          input.message.recipientParticipantId ?? null,
+          input.message.locale,
+          input.message.kind,
+          input.message.createdAt,
+        ],
+      );
+      await query(
+        tx,
+        `insert into communication_outbound_commands (
+          id, conversation_id, binding_id, connection_id, channel_kind, locale, purpose,
+          message_reference, template_key, template_definition_version, destination_key,
+          owning_receipt_id, owning_domain, owning_reference, owning_receipt_issued_at,
+          owning_receipt_valid_until, owning_receipt_correlation_id, expected_policy_version,
+          required_fence, endpoint_digests, idempotency_key, fingerprint, correlation_id,
+          state, failure_code, version, lease_owner_id, lease_token_hash, lease_expires_at,
+          scheduled_at, expires_at, created_at, updated_at
+        ) values ($1, $2, $3, $4, 'whatsapp', $5, $6, $7, $8, null, null,
+          null, null, null, null, null, null, null, null, '[]'::jsonb,
+          $9, null, $10, 'draft', null, 0, null, null, null, null, null, $11, $11)`,
+        [
+          input.command.commandId,
+          input.command.conversationId,
+          input.command.bindingId,
+          binding.connection_id,
+          input.command.locale,
+          input.purpose,
+          input.message.id,
+          input.templateId,
+          input.command.idempotencyKey,
+          input.command.correlationId,
+          input.command.createdAt,
+        ],
+      );
+      return {
+        status: "created",
+        commandId: input.command.commandId,
+        messageId: input.message.id,
+      } as const;
+    });
+  }
+
+  async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
+    const activeDigest = input.endpointDigests[0];
+    if (!activeDigest) return { status: "conflict", code: "idempotency_mismatch" };
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const receipt = input.authorizationReceipt;
+      const rows = await query<{ id: string; message_reference: string }>(
+        tx,
+        `update communication_outbound_commands
+         set fingerprint = $2, expected_policy_version = $3, required_fence = $4,
+           endpoint_digests = $5::jsonb, destination_key = $6,
+           owning_receipt_id = $7, owning_domain = $8, owning_reference = $9,
+           owning_receipt_issued_at = $10, owning_receipt_valid_until = $11,
+           owning_receipt_correlation_id = correlation_id, state = 'queued',
+           version = version + 1, updated_at = $12
+         where id = $1 and state = 'draft' returning id, message_reference`,
+        [
+          input.commandId,
+          input.fingerprint,
+          input.requiredPolicyVersion,
+          input.requiredFence,
+          JSON.stringify(input.endpointDigests),
+          activeDigest.digest,
+          receipt?.receiptId ?? null,
+          receipt?.owner ?? null,
+          receipt?.destinationKey ?? null,
+          receipt?.issuedAt ?? null,
+          receipt?.expiresAt ?? null,
+          input.now,
+        ],
+      );
+      return rows[0]
+        ? { status: "created", commandId: rows[0].id, messageId: rows[0].message_reference }
+        : { status: "conflict", code: "idempotency_mismatch" };
+    });
+  }
+
+  async failOutboundDraft(input: FailOutboundDraftCommand): Promise<"completed" | "conflict"> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const rows = await query<{ id: string }>(
+        tx,
+        `update communication_outbound_commands set state = 'failed', failure_code = $2,
+           version = version + 1, updated_at = $3
+         where id = $1 and state = 'draft' returning id`,
+        [input.commandId, input.code, input.now],
+      );
+      return rows.length === 1 ? "completed" : "conflict";
+    });
+  }
+
+  async claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult> {
+    if (!validLease(input.now, input.leaseExpiresAt)) {
+      return { status: "not_claimed", code: "lease_conflict" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const command = (
+        await query<CommandRow>(tx, COMMUNICATIONS_TRANSACTION_SQL.claimOutbound, [input.commandId])
+      )[0];
+      if (!command) return this.outboundNotClaimed(tx, input.commandId);
+      const binding = (
+        await query<{
+          id: string;
+          trust_state: Extract<
+            Extract<OutboundClaimResult, { status: "not_claimed" }>["code"],
+            string
+          > | "reverified";
+          verification_expires_at: Date | null;
+        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [command.binding_id])
+      )[0];
+      if (!binding) return { status: "not_claimed", code: "binding_not_found" } as const;
+      const policy = (
+        await query<{
+          consent_state: ConsentRecord["state"];
+          fence_state: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
+          version: number;
+          fence: number;
+        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [command.binding_id, command.purpose])
+      )[0];
+      if (!policy) return { status: "not_claimed", code: "policy_not_found" } as const;
+      const consent = (
+        await query<{
+          evidence_receipt_id: string;
+          receipt_issued_at: Date;
+          receipt_valid_until: Date;
+        }>(
+          tx,
+          `select evidence_receipt_id, receipt_issued_at, receipt_valid_until
+           from communication_contact_evidence_events
+           where binding_id = $1 and purpose = $2
+             and event_kind in ('consent_granted', 'consent_regranted')
+           order by sequence desc limit 1`,
+          [command.binding_id, command.purpose],
+        )
+      )[0];
+      if (!consent) return { status: "not_claimed", code: "consent_not_found" } as const;
+      const connection = (
+        await query<{ readiness_state: "disabled" | "configured" | "sandbox_verified" | "production_verified" | "active" | "suspended" | "retired" }>(
+          tx,
+          `select readiness_state from communication_channel_connections where id = $1`,
+          [command.connection_id],
+        )
+      )[0];
+      const template = (
+        await query<{ internally_approved: boolean; state: string }>(
+          tx,
+          `select internally_approved, state from communication_message_templates
+           where template_key = $1 and locale = $2 limit 1`,
+          [command.template_key, command.locale],
+        )
+      )[0];
+      const activeDigest = command.endpoint_digests?.[0];
+      if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" } as const;
+      const decision = evaluateOutboundPolicy({
+        purpose: command.purpose,
+        binding: {
+          bindingId: binding.id,
+          trustState: binding.trust_state as import("@atlas/domain").BindingTrustState,
+          freshUntil: binding.verification_expires_at ?? new Date(Number.NaN),
+        },
+        contactPolicy: {
+          state: policy.fence_state,
+          version: policy.version,
+          fence: policy.fence,
+        },
+        requiredPolicyVersion: command.expected_policy_version,
+        requiredFence: command.required_fence,
+        consent: {
+          state: policy.consent_state,
+          receipt: {
+            receiptId: consent.evidence_receipt_id,
+            owner: "consent",
+            operation: "consent_confirmation",
+            bindingId: binding.id,
+            issuedAt: consent.receipt_issued_at,
+            expiresAt: consent.receipt_valid_until,
+          },
+        },
+        connectionState: connection?.readiness_state ?? "disabled",
+        template: {
+          eligible: Boolean(template?.internally_approved && template.state === "provider_approved"),
+        },
+        authorizationReceipt:
+          command.owning_receipt_id &&
+          command.owning_receipt_issued_at &&
+          command.owning_receipt_valid_until
+            ? {
+                receiptId: command.owning_receipt_id,
+                owner: "communications",
+                operation: "outbound_dispatch",
+                bindingId: binding.id,
+                destinationKey: activeDigest.digest,
+                issuedAt: command.owning_receipt_issued_at,
+                expiresAt: command.owning_receipt_valid_until,
+              }
+            : undefined,
+        destinationKey: activeDigest.digest,
+        now: input.now,
+      });
+      if (!decision.allowed) return { status: "not_claimed", code: decision.code };
+
+      const duplicateAttempt = await query<{ id: string }>(
+        tx,
+        `select id from communication_dispatch_attempts where id = $1 limit 1`,
+        [input.attemptId],
+      );
+      if (duplicateAttempt[0]) return { status: "not_claimed", code: "lease_conflict" };
+      const ordinal = (
+        await query<{ ordinal: number }>(
+          tx,
+          `select coalesce(max(attempt_ordinal), 0)::integer + 1 as ordinal
+           from communication_dispatch_attempts where command_id = $1`,
+          [command.id],
+        )
+      )[0]?.ordinal ?? 1;
+      const ownerHash = sha256(input.leaseOwner);
+      const leaseVersion = command.version + 1;
+      await query(
+        tx,
+        `insert into communication_dispatch_attempts (
+          id, command_id, connection_id, attempt_ordinal, request_idempotency,
+          stable_reference_capability, message_lookup_capability,
+          status_reconciliation_capability, media_references_capability,
+          template_projection_capability, capability_observed_at, expected_policy_version,
+          request_digest, stable_reference, external_message_reference, state, result_code,
+          provider_io_capability_hash, provider_io_started_at, lease_owner_hash,
+          lease_version, lease_expires_at, provider_reference_digest,
+          started_at, completed_at, created_at, updated_at
+        ) values ($1, $2, $3, $4, false, false, false, true, false, true, $5, $6,
+          $7, null, null, 'dispatching', null, null, null, $8, $9, $10, null,
+          $5, null, $5, $5)`,
+        [
+          input.attemptId,
+          command.id,
+          command.connection_id,
+          ordinal,
+          input.now,
+          command.expected_policy_version,
+          command.fingerprint ?? sha256(command.id),
+          ownerHash,
+          leaseVersion,
+          input.leaseExpiresAt,
+        ],
+      );
+      await query(
+        tx,
+        `update communication_outbound_commands set state = 'dispatching',
+           lease_owner_id = $2, lease_token_hash = $2, lease_expires_at = $3,
+           version = $4, updated_at = $5 where id = $1`,
+        [command.id, ownerHash, input.leaseExpiresAt, leaseVersion, input.now],
+      );
+      const message = (
+        await query<{
+          id: string;
+          conversation_id: string;
+          direction: "inbound" | "outbound" | "system";
+          sender_participant_id: string;
+          recipient_participant_id: string | null;
+          locale: "es" | "en";
+          kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
+          created_at: Date;
+        }>(tx, `select * from communication_messages where id = $1`, [command.message_reference])
+      )[0];
+      if (!message) return { status: "not_claimed", code: "not_found" } as const;
+      return {
+        status: "claimed",
+        command: {
+          commandId: command.id,
+          channel: "whatsapp",
+          locale: command.locale,
+          conversationId: command.conversation_id,
+          bindingId: command.binding_id,
+          messageId: command.message_reference,
+          idempotencyKey: command.idempotency_key,
+          state: "dispatching",
+          createdAt: command.created_at,
+          correlationId: command.correlation_id,
+        },
+        message: {
+          id: message.id,
+          conversationId: message.conversation_id,
+          channel: "whatsapp",
+          direction: message.direction,
+          senderParticipantId: message.sender_participant_id,
+          ...(message.recipient_participant_id
+            ? { recipientParticipantId: message.recipient_participant_id }
+            : {}),
+          locale: message.locale,
+          kind: message.kind,
+          body: null,
+          createdAt: message.created_at,
+        },
+        attempt: {
+          attemptId: input.attemptId,
+          commandId: command.id,
+          ordinal,
+          state: "dispatching",
+          startedAt: input.now,
+          correlationId: command.correlation_id,
+          leaseVersion,
+        },
+        destinationDigest: activeDigest,
+      };
+    });
+  }
+
+  async markDispatchOutcome(
+    input: MarkDispatchOutcomeCommand,
+  ): Promise<"completed" | "conflict"> {
+    if (!finiteDate(input.now)) return "conflict";
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const command = (
+        await query<CommandRow>(
+          tx,
+          `select * from communication_outbound_commands where id = $1 for update`,
+          [input.commandId],
+        )
+      )[0];
+      const attempt = (
+        await query<{
+          command_id: string;
+          state: OutboundCommandState;
+          lease_owner_hash: string;
+          lease_version: number;
+          lease_expires_at: Date;
+        }>(
+          tx,
+          `select command_id, state, lease_owner_hash, lease_version, lease_expires_at
+           from communication_dispatch_attempts where id = $1 for update`,
+          [input.attemptId],
+        )
+      )[0];
+      const ownerHash = sha256(input.leaseOwner);
+      if (
+        !command ||
+        !attempt ||
+        attempt.command_id !== input.commandId ||
+        attempt.lease_owner_hash !== ownerHash ||
+        attempt.lease_version !== input.leaseVersion ||
+        attempt.lease_expires_at <= input.now
+      ) {
+        return "conflict";
+      }
+      if (attempt.state !== "dispatching") {
+        return input.outcome === "accepted" &&
+          ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
+          ["provider_accepted", "sent", "delivered", "read"].includes(command.state)
+          ? "completed"
+          : "conflict";
+      }
+      if (
+        command.state !== "dispatching" ||
+        command.lease_owner_id !== ownerHash ||
+        command.version !== input.leaseVersion
+      ) {
+        return "conflict";
+      }
+      const state: OutboundCommandState =
+        input.outcome === "accepted"
+          ? "provider_accepted"
+          : input.outcome === "unknown"
+            ? "dispatch_unknown"
+            : "failed";
+      await query(
+        tx,
+        `update communication_dispatch_attempts set state = $2, result_code = $3,
+           provider_reference_digest = $4, completed_at = $5, updated_at = $5 where id = $1`,
+        [
+          input.attemptId,
+          state,
+          input.outcome,
+          input.providerReference ? sha256(input.providerReference) : null,
+          input.now,
+        ],
+      );
+      await query(
+        tx,
+        `update communication_outbound_commands set state = $2, lease_owner_id = null,
+           lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
+        [input.commandId, state, input.now],
+      );
+      return "completed";
+    });
+  }
+
+  async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const command = (
+        await query<CommandRow>(
+          tx,
+          `select * from communication_outbound_commands where id = $1 for update`,
+          [input.commandId],
+        )
+      )[0];
+      if (!command) return { status: "not_found" } as const;
+      const prior = await query<{ provider_event_id: string }>(
+        tx,
+        `select provider_event_id from communication_provider_status_receipts
+         where command_id = $1 and provider_event_id = $2`,
+        [input.commandId, input.providerEventId],
+      );
+      if (prior[0]) return { status: "duplicate", commandState: command.state };
+      await query(
+        tx,
+        `insert into communication_provider_status_receipts (
+          command_id, provider_event_id, status, occurred_at, created_at
+        ) values ($1, $2, $3, $4, $4)`,
+        [input.commandId, input.providerEventId, input.status, input.occurredAt],
+      );
+      const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
+      let status: "applied" | "regressive" = "applied";
+      let nextState: OutboundCommandState = input.status;
+      if (input.status === "failed") {
+        if (!["provider_accepted", "dispatching", "queued"].includes(command.state)) {
+          status = "regressive";
+          nextState = command.state;
+        }
+      } else if (
+        (rank[input.status] ?? 0) <= (rank[command.state] ?? 0) ||
+        ["failed", "expired", "cancelled", "manual_review"].includes(command.state)
+      ) {
+        status = "regressive";
+        nextState = command.state;
+      }
+      if (status === "applied") {
+        await query(
+          tx,
+          `update communication_outbound_commands set state = $2, lease_owner_id = null,
+             lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
+          [input.commandId, nextState, input.occurredAt],
+        );
+        await query(
+          tx,
+          `update communication_dispatch_attempts set state = $2, completed_at = $3, updated_at = $3
+           where id = (select id from communication_dispatch_attempts
+             where command_id = $1 order by attempt_ordinal desc limit 1)`,
+          [input.commandId, nextState, input.occurredAt],
+        );
+      }
+      return { status, commandState: nextState };
+    });
+  }
+
+  async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
+    const authority = evaluateAuthorityChange({
+      operation: input.operation,
+      bindingId: input.bindingId,
+      receipt: input.receipt,
+      now: input.now,
+    });
+    if (!authority.allowed) return { status: "denied", code: authority.code };
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
+      const policy = (
+        await query<{ consent_state: ConsentRecord["state"]; version: number }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
+          [input.bindingId, input.purpose],
+        )
+      )[0];
+      if (!policy) return { status: "denied", code: "policy_state_invalid" } as const;
+      if (input.operation === "reconsent" && policy.consent_state !== "withdrawn") {
+        return { status: "denied", code: "reconsent_receipt_required" } as const;
+      }
+      if (policy.consent_state === "granted") {
+        return { status: "unchanged", state: "granted", version: policy.version } as const;
+      }
+      const nextVersion = policy.version + 1;
+      await this.appendEvidence(tx, {
+        bindingId: input.bindingId,
+        eventKind: input.operation === "reconsent" ? "consent_regranted" : "consent_granted",
+        purpose: input.purpose,
+        consentState: "granted",
+        fenceState: input.operation === "reconsent" ? "normal_after_review" : "normal",
+        receiptId: input.receipt!.receiptId,
+        receiptKind: "consent_evidence",
+        owningDomain: "M078",
+        authorityRole: "consent",
+        authorityVersion: nextVersion,
+        correlationId: input.receipt!.receiptId,
+        issuedAt: input.receipt!.issuedAt,
+        expiresAt: input.receipt!.expiresAt,
+        occurredAt: input.now,
+      });
+      await query(
+        tx,
+        `update communication_contact_policies set consent_state = 'granted',
+           fence_state = $3, evidence_receipt_id = $4, version = $2, fence = fence + 1,
+           evaluated_at = $5, updated_at = $5 where binding_id = $1 and purpose = $6`,
+        [
+          input.bindingId,
+          nextVersion,
+          input.operation === "reconsent" ? "normal_after_review" : "normal",
+          input.receipt!.receiptId,
+          input.now,
+          input.purpose,
+        ],
+      );
+      return { status: "changed", state: "granted", version: nextVersion } as const;
+    });
+  }
+
+  async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
+    const evidence = input.evidence;
+    if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
+    const receipt = evidence.receipt;
+    if (
+      receipt.bindingId !== input.bindingId ||
+      !receipt.receiptId ||
+      !receipt.correlationId ||
+      !currentReceipt(receipt, input.now) ||
+      (evidence.source === "authority" &&
+        (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal"))
+    ) {
+      return { status: "denied", code: "withdrawal_evidence_invalid" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
+      const policies = await query<{ fence_state: string; version: number; fence: number }>(
+        tx,
+        `select fence_state, version, fence from communication_contact_policies
+         where binding_id = $1 for update`,
+        [input.bindingId],
+      );
+      if (evidence.source === "inbound_event") {
+        const source = await query<{ valid: boolean }>(
+          tx,
+          `select true as valid from communication_event_envelopes envelope
+           join communication_provider_event_receipts receipt on receipt.id = envelope.receipt_id
+           where receipt.id = $1 and envelope.binding_id = $2 and receipt.correlation_id = $3`,
+          [evidence.receipt.eventId, input.bindingId, receipt.correlationId],
+        );
+        if (!source[0]) return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
+      }
+      if (policies.length > 0 && policies.every((policy) => policy.fence_state === "withdrawn")) {
+        return {
+          status: "duplicate",
+          state: "withdrawn",
+          policyVersion: policies[0]!.version,
+          fence: policies[0]!.fence,
+          cancelledCommandIds: [],
+        } as const;
+      }
+      const cancelled = await query<{ id: string }>(
+        tx,
+        `update communication_outbound_commands set state = 'cancelled',
+           failure_code = 'contact_policy_denied', version = version + 1, updated_at = $2
+         where binding_id = $1 and state = 'queued' returning id`,
+        [input.bindingId, input.now],
+      );
+      await query(
+        tx,
+        `update communication_contact_policies set consent_state = 'withdrawn',
+           fence_state = 'withdrawn', version = version + 1, fence = fence + 1,
+           evidence_receipt_id = $2, evaluated_at = $3, updated_at = $3
+         where binding_id = $1`,
+        [input.bindingId, receipt.receiptId, input.now],
+      );
+      const policy = (
+        await query<{ version: number; fence: number }>(
+          tx,
+          `select version, fence from communication_contact_policies
+           where binding_id = $1 order by purpose limit 1`,
+          [input.bindingId],
+        )
+      )[0];
+      return {
+        status: "changed",
+        state: "withdrawn",
+        policyVersion: policy?.version ?? 1,
+        fence: policy?.fence ?? 1,
+        cancelledCommandIds: cancelled.map((row) => row.id),
+      } as const;
+    });
+  }
+
+  async resolveAmbiguousOptOutFromReceipt(
+    input: ResolveOptOutCommand,
+  ): Promise<AmbiguousOptOutResolutionResult> {
+    const authority = evaluateAuthorityChange({
+      operation: "ambiguous_opt_out_resolution",
+      bindingId: input.bindingId,
+      receipt: input.receipt,
+      now: input.now,
+    });
+    if (!authority.allowed) return { status: "denied", code: authority.code };
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
+      const rows = await query<{ version: number }>(
+        tx,
+        `update communication_contact_policies set fence_state = 'normal_after_review',
+           version = version + 1, fence = fence + 1, evaluated_at = $2, updated_at = $2
+         where binding_id = $1 and fence_state in ('opt_out_pending', 'withdrawn')
+         returning version`,
+        [input.bindingId, input.now],
+      );
+      return rows[0]
+        ? {
+            status: "changed",
+            policyState: "normal_after_review",
+            policyVersion: rows[0].version,
+          }
+        : { status: "denied", code: "policy_state_invalid" };
+    });
+  }
+
+  async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const binding = (
+        await query<{ trust_state: string }>(
+          tx,
+          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
+          [input.bindingId],
+        )
+      )[0];
+      if (!binding) return { status: "denied", code: "binding_not_found" } as const;
+      if (binding.trust_state === "suspended") {
+        return { status: "duplicate", trustState: "suspended" } as const;
+      }
+      await query(
+        tx,
+        `update communication_contact_bindings set trust_state = 'suspended',
+           verification_expires_at = $2, suspended_at = $2,
+           version = version + 1, updated_at = $2 where id = $1`,
+        [input.bindingId, input.now],
+      );
+      return { status: "changed", trustState: "suspended" };
+    });
+  }
+
+  async revalidateBindingFromReceipt(
+    input: RevalidateBindingCommand,
+  ): Promise<BindingChangeResult> {
+    const authority = evaluateAuthorityChange({
+      operation: "binding_revalidation",
+      bindingId: input.bindingId,
+      receipt: input.receipt,
+      now: input.now,
+    });
+    if (!authority.allowed) return { status: "denied", code: authority.code };
+    if (!finiteDate(input.freshUntil) || input.freshUntil <= input.now) {
+      return { status: "denied", code: "freshness_invalid" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const rows = await query<{ id: string }>(
+        tx,
+        `update communication_contact_bindings set trust_state = 'reverified',
+           verification_receipt_id = $2, endpoint_verified_at = $3,
+           verification_expires_at = $4, suspended_at = null,
+           version = version + 1, updated_at = $3 where id = $1 returning id`,
+        [input.bindingId, input.receipt!.receiptId, input.now, input.freshUntil],
+      );
+      return rows[0]
+        ? { status: "changed", trustState: "reverified" }
+        : { status: "denied", code: "binding_not_found" };
+    });
+  }
+
+  async registerTemplateDefinition(
+    input: RegisterTemplateDefinition & { now: Date },
+  ): Promise<TemplateResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const existing = (
+        await query<{ definition_version: number; internally_approved: boolean; state: TemplateLifecycleState; projection_version: number; updated_at: Date }>(
+          tx,
+          `select definition_version, internally_approved, state, projection_version, updated_at
+           from communication_message_templates where template_key = $1 and locale = $2`,
+          [input.templateId, input.locale],
+        )
+      )[0];
+      if (existing) {
+        if (existing.definition_version !== input.definitionVersion) {
+          return { status: "denied", code: "definition_conflict" } as const;
+        }
+        return {
+          status: "duplicate",
+          templateId: input.templateId,
+          locale: input.locale,
+          definitionVersion: existing.definition_version,
+          internallyApproved: existing.internally_approved,
+          providerState: existing.state,
+          providerVersion: existing.projection_version ?? 0,
+          updatedAt: existing.updated_at,
+        } as const;
+      }
+      await query(
+        tx,
+        `insert into communication_message_templates (
+          id, template_key, locale, purpose, definition_source, definition_version,
+          variable_keys, state, internally_approved, approval_receipt_id,
+          external_reference, projection_version, category, observed_at, created_at, updated_at
+        ) values ($1, $1, $2, 'transactional', 'synthetic_test_fixture', $3,
+          '[]'::jsonb, 'draft', false, null, null, 0, null, null, $4, $4)`,
+        [input.templateId, input.locale, input.definitionVersion, input.now],
+      );
+      return {
+        status: "registered",
+        templateId: input.templateId,
+        locale: input.locale,
+        definitionVersion: input.definitionVersion,
+        internallyApproved: false,
+        providerState: "draft",
+        providerVersion: 0,
+        updatedAt: input.now,
+      };
+    });
+  }
+
+  async approveTemplateDefinition(
+    input: ApproveTemplateDefinition & { now: Date },
+  ): Promise<TemplateResult> {
+    const receipt = input.receipt;
+    if (!receipt) return { status: "denied", code: "approval_receipt_missing" };
+    if (
+      receipt.owner !== "communications" ||
+      receipt.operation !== "template_internal_approval" ||
+      receipt.resourceId !== input.templateId ||
+      receipt.locale !== input.locale ||
+      receipt.definitionVersion !== input.definitionVersion ||
+      !currentReceipt(receipt, input.now)
+    ) {
+      return { status: "denied", code: "approval_receipt_invalid" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const rows = await query<{ projection_version: number }>(
+        tx,
+        `update communication_message_templates set internally_approved = true,
+           approval_receipt_id = $4, approval_receipt_issued_at = $5,
+           approval_receipt_valid_until = $6, updated_at = $7
+         where template_key = $1 and locale = $2 and definition_version = $3
+         returning projection_version`,
+        [
+          input.templateId,
+          input.locale,
+          input.definitionVersion,
+          receipt.receiptId,
+          receipt.issuedAt,
+          receipt.expiresAt,
+          input.now,
+        ],
+      );
+      return rows[0]
+        ? {
+            status: "approved",
+            templateId: input.templateId,
+            locale: input.locale,
+            definitionVersion: input.definitionVersion,
+            internallyApproved: true,
+            approvalReceiptId: receipt.receiptId,
+            providerState: "draft",
+            providerVersion: rows[0].projection_version ?? 0,
+            updatedAt: input.now,
+          }
+        : { status: "not_found", code: "template_not_found" };
+    });
+  }
+
+  async reconcileTemplate(
+    input: ReconcileTemplateCommand,
+  ): Promise<TemplateReconciliationResult> {
+    if (!input.receipt) return { status: "denied", code: "provider_receipt_missing" };
+    const receipt = input.receipt;
+    if (
+      receipt.owner !== "communications" ||
+      receipt.operation !== "template_provider_reconciliation" ||
+      receipt.templateId !== input.templateId ||
+      receipt.locale !== input.locale ||
+      receipt.providerVersion !== input.providerVersion ||
+      receipt.providerState !== input.providerState ||
+      receipt.correlationId !== input.correlationId ||
+      !currentReceipt(receipt, input.now)
+    ) {
+      return { status: "denied", code: "provider_receipt_invalid" };
+    }
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const row = (
+        await query<{ definition_version: number; internally_approved: boolean; state: TemplateLifecycleState; projection_version: number; updated_at: Date }>(
+          tx,
+          `select definition_version, internally_approved, state, projection_version, updated_at
+           from communication_message_templates where template_key = $1 and locale = $2 for update`,
+          [input.templateId, input.locale],
+        )
+      )[0];
+      if (!row) return { status: "not_found", code: "template_not_found" } as const;
+      const status =
+        input.providerVersion < row.projection_version
+          ? "regressive"
+          : input.providerVersion === row.projection_version
+            ? "duplicate"
+            : "applied";
+      if (status === "applied") {
+        await query(
+          tx,
+          `update communication_message_templates set state = $3, projection_version = $4,
+             provider_receipt_id = $5, provider_correlation_id = $6,
+             provider_receipt_issued_at = $7, provider_receipt_valid_until = $8,
+             observed_at = $9, updated_at = $9 where template_key = $1 and locale = $2`,
+          [
+            input.templateId,
+            input.locale,
+            input.providerState,
+            input.providerVersion,
+            receipt.receiptId,
+            input.correlationId,
+            receipt.issuedAt,
+            receipt.expiresAt,
+            input.now,
+          ],
+        );
+      }
+      return {
+        status,
+        templateId: input.templateId,
+        locale: input.locale,
+        definitionVersion: row.definition_version,
+        internallyApproved: row.internally_approved,
+        providerState: status === "applied" ? input.providerState : row.state,
+        providerVersion: status === "applied" ? input.providerVersion : row.projection_version,
+        updatedAt: status === "applied" ? input.now : row.updated_at,
+      };
+    });
+  }
+
+  async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
+    const receipt = input.receipt;
+    if (!receipt) return { status: "denied", code: "reconciliation_receipt_missing" };
+    if (
+      receipt.owner !== "communications" ||
+      receipt.operation !== "dispatch_reconciliation" ||
+      receipt.commandId !== input.commandId ||
+      receipt.attemptId !== input.attemptId ||
+      !receipt.receiptId ||
+      !currentReceipt(receipt, input.now)
+    ) {
+      return { status: "denied", code: "reconciliation_receipt_invalid" };
+    }
+    const digest = sha256(
+      JSON.stringify([
+        receipt.receiptId,
+        receipt.source,
+        receipt.bindingId,
+        receipt.commandId,
+        receipt.attemptId,
+        receipt.outcome,
+        receipt.issuedAt.toISOString(),
+        receipt.expiresAt.toISOString(),
+        receipt.correlationId,
+      ]),
+    );
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const prior = (
+        await query<{ receipt_digest: string; outcome: string }>(
+          tx,
+          `select receipt_digest, outcome from communication_dispatch_reconciliation_receipts
+           where receipt_id = $1 for update`,
+          [receipt.receiptId],
+        )
+      )[0];
+      if (prior) {
+        if (prior.receipt_digest !== digest) {
+          return { status: "conflict", code: "reconciliation_receipt_mismatch" } as const;
+        }
+        return { status: "duplicate", commandState: this.reconciledState(prior.outcome) } as const;
+      }
+      const row = (
+        await query<CommandRow & { attempt_command_id: string; attempt_lease_expires_at: Date | null }>(
+          tx,
+          `select command.*, attempt.command_id as attempt_command_id,
+             attempt.lease_expires_at as attempt_lease_expires_at
+           from communication_outbound_commands command
+           join communication_dispatch_attempts attempt on attempt.id = $2
+           where command.id = $1 for update of command, attempt`,
+          [input.commandId, input.attemptId],
+        )
+      )[0];
+      if (!row) return { status: "not_found" } as const;
+      if (
+        row.attempt_command_id !== input.commandId ||
+        row.binding_id !== receipt.bindingId ||
+        row.correlation_id !== receipt.correlationId
+      ) {
+        return { status: "conflict", code: "reconciliation_binding_mismatch" } as const;
+      }
+      if (["reconciled_accepted", "confirmed_not_sent", "failed"].includes(row.state)) {
+        return {
+          status: "conflict",
+          code: "reconciliation_already_settled",
+          commandState: row.state as "reconciled_accepted" | "confirmed_not_sent" | "failed",
+        } as const;
+      }
+      const expiredDispatch =
+        row.state === "dispatching" &&
+        row.attempt_lease_expires_at !== null &&
+        row.attempt_lease_expires_at <= input.now;
+      if (
+        row.state !== "dispatch_unknown" &&
+        row.state !== "reconciliation_required" &&
+        !expiredDispatch
+      ) {
+        return { status: "denied", code: "reconciliation_state_invalid" } as const;
+      }
+      const commandState = this.reconciledState(receipt.outcome);
+      await query(
+        tx,
+        `insert into communication_dispatch_reconciliation_receipts (
+          receipt_id, receipt_digest, command_id, attempt_id, binding_id, source,
+          outcome, correlation_id, issued_at, expires_at, created_at
+        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
+        [
+          receipt.receiptId,
+          digest,
+          input.commandId,
+          input.attemptId,
+          receipt.bindingId,
+          receipt.source,
+          receipt.outcome,
+          receipt.correlationId,
+          receipt.issuedAt,
+          receipt.expiresAt,
+          input.now,
+        ],
+      );
+      await query(
+        tx,
+        `update communication_outbound_commands set state = $2, lease_owner_id = null,
+           lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
+        [input.commandId, commandState, input.now],
+      );
+      await query(
+        tx,
+        `update communication_dispatch_attempts set state = $2, completed_at = $3,
+           updated_at = $3 where id = $1 and command_id = $4`,
+        [input.attemptId, commandState, input.now, input.commandId],
+      );
+      return { status: "reconciled", commandState };
+    });
+  }
+
+  async evaluateTemplateEligibility(
+    input: EvaluateTemplateEligibility,
+  ): Promise<TemplateEligibilityResult> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const row = (
+        await query<{ internally_approved: boolean; state: string }>(
+          tx,
+          `select internally_approved, state from communication_message_templates
+           where template_key = $1 and locale = $2`,
+          [input.templateId, input.locale],
+        )
+      )[0];
+      if (!row) return { eligible: false, code: "template_not_found" } as const;
+      if (!row.internally_approved) {
+        return { eligible: false, code: "internal_approval_required" } as const;
+      }
+      return row.state === "provider_approved"
+        ? { eligible: true, code: "eligible" }
+        : { eligible: false, code: "provider_not_approved" };
+    });
+  }
+
+  async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
+    const limit = Math.max(0, Math.min(input.limit, 100));
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const rows = await query<{
+        kind: RecoveryCandidate["kind"];
+        command_id: string | null;
+        attempt_id: string | null;
+        event_id: string | null;
+      }>(
+        tx,
+        `select * from (
+          select case when command.state = 'dispatch_unknown'
+            then 'outbound_dispatch_unknown' else 'outbound_lease_expired' end as kind,
+            command.id as command_id, attempt.id as attempt_id, null::text as event_id,
+            coalesce(attempt.completed_at, attempt.started_at) as recovery_at
+          from communication_outbound_commands command
+          join lateral (select * from communication_dispatch_attempts
+            where command_id = command.id order by attempt_ordinal desc limit 1) attempt on true
+          where command.state = 'dispatch_unknown'
+             or (command.state = 'dispatching' and command.lease_expires_at <= $1)
+          union all
+          select 'inbound_lease_expired', null, null, receipt.id, receipt.lease_expires_at
+          from communication_provider_event_receipts receipt
+          where receipt.state = 'persisted' and receipt.lease_expires_at <= $1
+        ) work order by recovery_at asc limit $2`,
+        [input.now, limit],
+      );
+      return rows.map((row) =>
+        row.kind === "inbound_lease_expired"
+          ? { kind: row.kind, eventId: row.event_id! }
+          : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
+      );
+    });
+  }
+
+  async referenceState(): Promise<CommunicationsReferenceState> {
+    return withCommunicationsTransaction(this.sql, async (tx) => {
+      const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
+        await Promise.all([
+          query<Record<string, unknown>>(tx, `select id as "eventId", state, processing_version as "leaseVersion" from communication_provider_event_receipts order by id`),
+          query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
+          query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, result_code as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
+          query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
+          query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
+          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, evidence_receipt_id as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
+          query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
+          query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
+          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", receipt_kind as source, evidence_receipt_id as "receiptId", triggering_event_id as "eventId", correlation_id as "correlationId", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'consent_withdrawn' order by binding_id, sequence`),
+        ]);
+      return {
+        inbound,
+        outbound,
+        attempts,
+        policies: policies as unknown as CommunicationsReferenceState["policies"],
+        bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
+        consentHistory: consentHistory as unknown as CommunicationsReferenceState["consentHistory"],
+        templates: templates as unknown as CommunicationsReferenceState["templates"],
+        providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
+        withdrawalHistory: withdrawals as unknown as CommunicationsReferenceState["withdrawalHistory"],
+      };
+    });
+  }
+
+  private async loadInbound(tx: TransactionSql, eventId: string): Promise<InboundRow | undefined> {
+    return (
+      await query<InboundRow>(
+        tx,
+        `select receipt.id as event_id, envelope.binding_id, envelope.conversation_id,
+          envelope.message_id, envelope.participant_id,
+          connection.readiness_state as connection_state, conversation.locale,
+          receipt.correlation_id, receipt.received_at, receipt.state as event_state,
+          conversation.status as conversation_status, conversation.version as conversation_version,
+          conversation.created_at as conversation_created_at,
+          conversation.updated_at as conversation_updated_at,
+          conversation.last_activity_at, conversation.closed_at,
+          participant.kind as participant_role, participant.created_at as participant_created_at,
+          message.direction as message_direction, message.recipient_participant_id,
+          message.kind as message_kind, message.created_at as message_created_at
+        from communication_provider_event_receipts receipt
+        join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
+        join communication_channel_connections connection on connection.id = receipt.connection_id
+        join communication_conversations conversation on conversation.id = envelope.conversation_id
+        join communication_participants participant on participant.id = envelope.participant_id
+        join communication_messages message on message.id = envelope.message_id
+        where receipt.id = $1 and conversation.channel_kind = 'whatsapp' limit 1`,
+        [eventId],
+      )
+    )[0];
+  }
+
+  private async inboundNotClaimed(
+    tx: TransactionSql,
+    input: ClaimInboundCommand,
+  ): Promise<InboundClaimResult> {
+    const row = (
+      await query<{ state: string; policy_version: number | null }>(
+        tx,
+        `select receipt.state, policy.version as policy_version
+         from communication_provider_event_receipts receipt
+         left join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
+         left join communication_contact_policies policy
+           on policy.binding_id = envelope.binding_id and policy.purpose = 'transactional'
+         where receipt.id = $1`,
+        [input.eventId],
+      )
+    )[0];
+    if (!row) return { status: "not_claimed", code: "not_found" };
+    if (row.state !== "persisted") return { status: "not_claimed", code: "already_completed" };
+    if (row.policy_version !== input.requiredPolicyVersion) {
+      return { status: "not_claimed", code: "policy_version_mismatch" };
+    }
+    return { status: "not_claimed", code: "lease_conflict" };
+  }
+
+  private async outboundNotClaimed(
+    tx: TransactionSql,
+    commandId: string,
+  ): Promise<OutboundClaimResult> {
+    const row = (
+      await query<{ state: OutboundCommandState; failure_code: string | null }>(
+        tx,
+        `select state, failure_code from communication_outbound_commands where id = $1`,
+        [commandId],
+      )
+    )[0];
+    if (!row) return { status: "not_claimed", code: "not_found" };
+    if (["dispatch_unknown", "reconciliation_required"].includes(row.state)) {
+      return { status: "not_claimed", code: "dispatch_unknown_non_retryable" };
+    }
+    if (row.state === "cancelled" && row.failure_code === "contact_policy_denied") {
+      return { status: "not_claimed", code: "contact_policy_denied" };
+    }
+    if (row.state === "dispatching") return { status: "not_claimed", code: "lease_conflict" };
+    return { status: "not_claimed", code: "already_completed" };
+  }
+
+  private duplicateReason(
+    row: CommandRow,
+  ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
+    if (row.state === "queued") return undefined;
+    if (row.state === "draft") return "outbound_draft_unresolved";
+    if (row.state === "dispatching") return "outbound_dispatch_in_progress";
+    if (["dispatch_unknown", "reconciliation_required"].includes(row.state)) {
+      return "outbound_reconciliation_required";
+    }
+    if (row.state === "failed") {
+      return (row.failure_code as Extract<CreateOutboundResult, { status: "duplicate" }>["reason"]) ?? "outbound_command_failed";
+    }
+    if (row.state === "cancelled") return "outbound_command_cancelled";
+    if (row.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
+    return "outbound_command_completed";
+  }
+
+  private reconciledState(outcome: string): "reconciled_accepted" | "confirmed_not_sent" | "failed" {
+    return outcome === "reconciled_accepted"
+      ? "reconciled_accepted"
+      : outcome === "confirmed_not_sent"
+        ? "confirmed_not_sent"
+        : "failed";
+  }
+
+  private async appendAudit(
+    tx: TransactionSql,
+    envelope: AcceptInboundCommand["envelope"],
+    policyVersion: number,
+  ): Promise<void> {
+    await query(tx, `select pg_advisory_xact_lock(hashtextextended($1, 0))`, [
+      `communications:audit:${envelope.conversation.id}`,
+    ]);
+    const sequence = (
+      await query<{ sequence: number }>(
+        tx,
+        `select coalesce(max(sequence), 0)::integer + 1 as sequence
+         from communication_audit_events where conversation_id = $1`,
+        [envelope.conversation.id],
+      )
+    )[0]?.sequence ?? 1;
+    await query(
+      tx,
+      `insert into communication_audit_events (
+        id, sequence, conversation_id, channel_kind, event_name, aggregate_type,
+        aggregate_id, result_code, reason_code, version, locale, purpose,
+        policy_version, correlation_id, occurred_at, created_at
+      ) values ($1, $2, $3, 'whatsapp', 'inbound_received', 'message', $4,
+        'persisted', null, $5, $6, 'transactional', $7, $8, $9, $9)`,
+      [
+        `audit_${sha256(`${envelope.conversation.id}:${sequence}`).slice(0, 24)}`,
+        sequence,
+        envelope.conversation.id,
+        envelope.message.id,
+        envelope.conversation.version,
+        envelope.event.locale,
+        policyVersion,
+        envelope.event.correlationId,
+        envelope.event.receivedAt,
+      ],
+    );
+  }
+
+  private async appendEvidence(
+    tx: TransactionSql,
+    input: {
+      bindingId: string;
+      eventKind: string;
+      purpose: string;
+      consentState: string;
+      fenceState: string;
+      receiptId: string;
+      receiptKind: string;
+      owningDomain: string;
+      authorityRole: string;
+      authorityVersion: number;
+      correlationId: string;
+      issuedAt: Date;
+      expiresAt: Date;
+      occurredAt: Date;
+    },
+  ): Promise<void> {
+    const sequence = (
+      await query<{ sequence: number }>(
+        tx,
+        `select coalesce(max(sequence), 0)::integer + 1 as sequence
+         from communication_contact_evidence_events where binding_id = $1`,
+        [input.bindingId],
+      )
+    )[0]?.sequence ?? 1;
+    await query(
+      tx,
+      `insert into communication_contact_evidence_events (
+        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+        owning_domain, authority_role, authority_version, triggering_event_id,
+        policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+        occurred_at, created_at
+      ) values ($1, $2, $3, $4, $5, $6, $7, null, null, $8, $9, $10, $11,
+        $12, null, null, $13, $14, $15, $16, $16)`,
+      [
+        `evidence_${sha256(`${input.bindingId}:${sequence}`).slice(0, 24)}`,
+        input.bindingId,
+        sequence,
+        input.eventKind,
+        input.purpose,
+        input.consentState,
+        input.fenceState,
+        input.receiptId,
+        input.receiptKind,
+        input.owningDomain,
+        input.authorityRole,
+        input.authorityVersion,
+        input.correlationId,
+        input.issuedAt,
+        input.expiresAt,
+        input.occurredAt,
+      ],
+    );
+  }
+}
diff --git a/blueprints/project-atlas/workspace/packages/database/src/postgres-public-chat-store.ts b/blueprints/project-atlas/workspace/packages/database/src/postgres-public-chat-store.ts
index a5e4d20..60684bc 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/postgres-public-chat-store.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/postgres-public-chat-store.ts
@@ -48,20 +48,24 @@ async function withGatewayTransaction<T>(
     `;
     const principal = principals[0];
     if (!principal?.is_member || principal.rolbypassrls || principal.rolsuper) {
       throw new Error("PUBLIC_CHAT_DATABASE_PRINCIPAL_UNSAFE");
     }
     await tx.unsafe("set local role atlas_public_chat_gateway");
     return work(tx);
   }) as Promise<T>;
 }
 
+async function setPublicChatScope(tx: TransactionSql, sessionId: string): Promise<void> {
+  await tx`select set_config('atlas.public_chat_session_id', ${sessionId}, true)`;
+}
+
 type ConversationRow = {
   id: string;
   version: number;
   locale: ChatLocale;
   status: ConversationStatus;
   session_hash: string;
   notice_version: string;
   correlation_id: string;
   start_idempotency_key: string;
   start_fingerprint: string;
@@ -237,59 +241,89 @@ export function deserializePublicChatCommandResult(value: unknown): ChatCommandR
   const parsed = persistedCommandResultSchema.safeParse(value);
   if (!parsed.success) throw new Error("PUBLIC_CHAT_COMMAND_RESULT_INVALID");
   return parsed.data.result;
 }
 
 async function loadConversation(
   sql: TransactionSql,
   conversationId: string,
   sessionHash: string,
 ): Promise<PublicChatConversation | null> {
+  const sessions = await sql<Array<{ id: string }>>`
+    select id
+    from public_chat_sessions
+    where session_hash = ${sessionHash}
+      and revoked_at is null
+      and expires_at > current_timestamp
+    limit 1
+  `;
+  const session = sessions[0];
+  if (!session) return null;
+  await setPublicChatScope(sql, session.id);
   const rows = await sql<ConversationRow[]>`
     select
       c.id,
       c.version,
       c.locale,
       c.status,
       s.session_hash,
-      c.notice_version,
+      ownership.notice_version,
       c.correlation_id,
-      c.start_idempotency_key,
-      c.start_fingerprint,
+      ownership.start_idempotency_key,
+      ownership.start_fingerprint,
       c.created_at,
       c.updated_at,
       c.last_activity_at,
       c.expires_at,
       s.revoked_at,
       c.closed_at,
-      c.handoff_receipt_id,
-      c.handoff_reason,
+      handoff.receipt_id as handoff_receipt_id,
+      handoff.reason_code as handoff_reason,
       (
-        select h.queued_at
-        from public_chat_handoffs h
-        where h.conversation_id = c.id
-        order by h.updated_at desc
+        select latest_handoff.queued_at
+        from communication_handoffs latest_handoff
+        where latest_handoff.conversation_id = c.id
+        order by latest_handoff.updated_at desc
         limit 1
       ) as handoff_queued_at
-    from public_chat_conversations c
-    inner join public_chat_sessions s on s.id = c.session_id
-    where c.id = ${conversationId} and s.session_hash = ${sessionHash}
+    from communication_conversations c
+    inner join public_chat_conversation_sessions ownership on ownership.conversation_id = c.id
+    inner join public_chat_sessions s on s.id = ownership.session_id
+    left join lateral (
+      select receipt_id, reason_code
+      from communication_handoffs
+      where conversation_id = c.id
+      order by updated_at desc
+      limit 1
+    ) handoff on true
+    where c.id = ${conversationId} and c.channel_kind = 'public_web'
+      and ownership.session_id = ${session.id} and s.session_hash = ${sessionHash}
     limit 1
   `;
   const row = rows[0];
   if (!row) return null;
 
   const messageRows = await sql<MessageRow[]>`
-    select id, actor, body, body_stored, state, actions, created_at
-    from public_chat_messages
-    where conversation_id = ${conversationId}
-    order by ordinal asc
+    select message.id,
+      case sender.kind
+        when 'external' then 'visitor'
+        when 'automated' then 'assistant'
+        when 'human' then 'human'
+        else 'system'
+      end as actor,
+      message.body, message.body_stored, message.state, message.actions, message.created_at
+    from communication_messages message
+    join communication_participants sender
+      on sender.id = message.sender_participant_id
+      and sender.conversation_id = message.conversation_id
+    where message.conversation_id = ${conversationId} and message.channel_kind = 'public_web'
+    order by message.ordinal asc
   `;
   const messageIds = messageRows.map((message) => message.id);
   const citationRows =
     messageIds.length === 0
       ? []
       : await sql<CitationRow[]>`
           select message_id, source_id, title, path, locale, summary, disclosure, source_kind
           from public_chat_citations
           where message_id in ${sql(messageIds)}
           order by created_at asc
@@ -340,65 +374,111 @@ async function loadConversation(
     })),
   };
 }
 
 async function persistConversation(
   tx: TransactionSql,
   conversation: PublicChatConversation,
   transcriptPersistence: TranscriptPersistence,
 ): Promise<void> {
   await tx`
-    update public_chat_conversations
+    update communication_conversations
     set
       version = ${conversation.version},
       locale = ${conversation.locale},
       status = ${conversation.status},
-      notice_version = ${conversation.noticeVersion},
       correlation_id = ${conversation.correlationId},
       updated_at = ${conversation.updatedAt},
       last_activity_at = ${conversation.lastActivityAt},
       expires_at = ${conversation.expiresAt},
-      closed_at = ${conversation.closedAt ?? null},
-      handoff_receipt_id = ${conversation.handoffReceiptId ?? null},
-      handoff_reason = ${conversation.handoffReason ?? null}
-    where id = ${conversation.id}
+      closed_at = ${conversation.closedAt ?? null}
+    where id = ${conversation.id} and channel_kind = 'public_web'
+  `;
+  await tx`
+    update public_chat_conversation_sessions
+    set notice_version = ${conversation.noticeVersion}, updated_at = ${conversation.updatedAt}
+    where conversation_id = ${conversation.id}
   `;
   await tx`
     update public_chat_sessions
     set expires_at = greatest(expires_at, ${conversation.expiresAt}),
         revoked_at = coalesce(revoked_at, ${conversation.revokedAt ?? null}),
         updated_at = ${conversation.updatedAt}
-    where id = (select session_id from public_chat_conversations where id = ${conversation.id})
+    where id = (
+      select session_id from public_chat_conversation_sessions
+      where conversation_id = ${conversation.id}
+    )
   `;
 
   for (const [ordinal, message] of conversation.messages.entries()) {
     const bodyStored = transcriptPersistence === "approved";
+    const senderKind =
+      message.actor === "visitor"
+        ? "external"
+        : message.actor === "assistant"
+          ? "automated"
+          : message.actor;
+    const senderId =
+      message.actor === "visitor"
+        ? (
+            await tx<Array<{ participant_id: string }>>`
+              select participant_id from public_chat_conversation_sessions
+              where conversation_id = ${conversation.id}
+            `
+          )[0]?.participant_id
+        : `participant:${conversation.id}:${senderKind}`;
+    if (!senderId) throw new Error("PUBLIC_CHAT_PARTICIPANT_SCOPE_MISSING");
     await tx`
-      insert into public_chat_messages (
-        id, conversation_id, ordinal, actor, state, body, body_stored, actions, created_at
+      insert into communication_participants (
+        id, conversation_id, channel_kind, kind, channel_binding_id,
+        joined_at, left_at, created_at, updated_at
+      ) values (
+        ${senderId}, ${conversation.id}, 'public_web', ${senderKind}, null,
+        ${message.createdAt}, null, ${message.createdAt}, ${conversation.updatedAt}
+      ) on conflict (id) do update
+      set kind = excluded.kind, left_at = null, updated_at = excluded.updated_at
+    `;
+    await tx`
+      insert into communication_messages (
+        id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
+        recipient_participant_id, locale, kind, state, body, body_stored,
+        body_retention_policy, actions, rejection_reason, external_message_reference, created_at
       ) values (
         ${message.id},
         ${conversation.id},
-        ${ordinal},
-        ${message.actor},
+        'public_web',
+        ${ordinal + 1},
+        ${message.actor === "visitor" ? "inbound" : message.actor === "system" ? "system" : "outbound"},
+        ${senderId},
+        null,
+        ${conversation.locale},
+        ${message.actor === "system" ? "system" : "text"},
         ${message.state},
         ${bodyStored ? message.body : null},
         ${bodyStored},
+        ${bodyStored ? "approved" : "metadata_only"},
         ${tx.json(message.actions)},
+        ${message.state === "failed" ? "response_rejected" : null},
+        null,
         ${message.createdAt}
       )
       on conflict (id) do update
       set ordinal = excluded.ordinal,
-          actor = excluded.actor,
+          direction = excluded.direction,
+          sender_participant_id = excluded.sender_participant_id,
+          locale = excluded.locale,
+          kind = excluded.kind,
           state = excluded.state,
           body = excluded.body,
           body_stored = excluded.body_stored,
+          body_retention_policy = excluded.body_retention_policy,
+          rejection_reason = excluded.rejection_reason,
           actions = excluded.actions
     `;
     for (const citation of message.citations) {
       await tx`
         insert into public_chat_citations (
           id, message_id, source_id, title, path, locale, summary, disclosure, source_kind, created_at
         ) values (
           ${`${message.id}:${citation.sourceId}`},
           ${message.id},
           ${citation.sourceId},
@@ -416,61 +496,97 @@ async function persistConversation(
             locale = excluded.locale,
             summary = excluded.summary,
             disclosure = excluded.disclosure,
             source_kind = excluded.source_kind
       `;
     }
   }
 
   if (conversation.status === "human_requested" || conversation.status === "waiting_for_human") {
     await tx`
-      insert into public_chat_handoffs (
-        id, conversation_id, status, reason, receipt_id, requested_at, queued_at, updated_at
+      insert into communication_handoffs (
+        id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
+        assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
       ) values (
         ${`handoff:${conversation.id}`},
         ${conversation.id},
-        ${conversation.status},
+        'public_web',
+        ${conversation.status === "human_requested" ? "requested" : "queued"},
         ${conversation.handoffReason ?? "policy_required"},
         ${conversation.handoffReceiptId ?? null},
+        ${conversation.correlationId},
+        null,
         ${conversation.updatedAt},
         ${conversation.handoffQueuedAt ?? null},
+        null,
+        null,
         ${conversation.updatedAt}
       )
       on conflict (id) do update
-      set status = excluded.status,
-          reason = excluded.reason,
+      set state = excluded.state,
+          reason_code = excluded.reason_code,
           receipt_id = excluded.receipt_id,
           queued_at = excluded.queued_at,
           updated_at = excluded.updated_at
     `;
   }
 }
 
 async function appendAuditEvent(
   tx: TransactionSql,
   conversation: PublicChatConversation,
   eventName: AuditEvent["name"],
   reason?: ChatReasonCode,
 ): Promise<void> {
+  await tx`select pg_advisory_xact_lock(hashtextextended(${`public-chat:audit:${conversation.id}`}, 0))`;
   const sequenceRows = await tx<{ sequence: number }[]>`
     select coalesce(max(sequence), 0)::integer + 1 as sequence
-    from public_chat_audit_events
+    from communication_audit_events
     where conversation_id = ${conversation.id}
   `;
   const sequence = sequenceRows[0]?.sequence ?? 1;
+  const aggregateType =
+    eventName.includes("message") || eventName.includes("response")
+      ? "message"
+      : eventName.includes("handoff")
+        ? "handoff"
+        : "conversation";
+  const aggregateId =
+    aggregateType === "message"
+      ? (conversation.messages.at(-1)?.id ?? conversation.id)
+      : aggregateType === "handoff"
+        ? `handoff:${conversation.id}`
+        : conversation.id;
+  const resultCode =
+    eventName === "chat_conversation_started"
+      ? "new"
+      : eventName === "chat_handoff_requested"
+        ? "requested"
+        : eventName === "chat_handoff_queued"
+          ? "queued"
+          : eventName === "chat_conversation_closed"
+            ? "closed"
+            : eventName === "chat_message_rejected"
+              ? "rejected"
+              : eventName === "chat_response_failed"
+                ? "failed"
+                : "accepted";
   await tx`
-    insert into public_chat_audit_events (
-      id, sequence, conversation_id, event_name, reason, version, locale, correlation_id, created_at
+    insert into communication_audit_events (
+      id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
+      result_code, reason_code, version, locale, purpose, policy_version,
+      correlation_id, occurred_at, created_at
     ) values (
-      ${`audit:${conversation.id}:${sequence}`}, ${sequence}, ${conversation.id}, ${eventName},
-      ${reason ?? null}, ${conversation.version}, ${conversation.locale},
-      ${conversation.correlationId}, ${conversation.updatedAt}
+      ${`audit:${conversation.id}:${sequence}`}, ${sequence}, ${conversation.id}, 'public_web',
+      ${eventName}, ${aggregateType}, ${aggregateId}, ${resultCode}, ${reason ?? null},
+      ${conversation.version}, ${conversation.locale}, null, null,
+      ${conversation.correlationId}, ${conversation.updatedAt}, ${conversation.updatedAt}
     )
   `;
 }
 
 export function resolvePublicChatCompletionAuditEvent(command: CommandCompletion): {
   eventName: AuditEvent["name"];
   reason?: ChatReasonCode;
 } | null {
   if (!command.result.ok) {
     if (command.result.code === "content_rejected") {
@@ -518,101 +634,168 @@ export function isValidPublicChatAdvanceVersion(
 ): boolean {
   return (
     currentVersion === command.expectedVersion &&
     command.conversation.version === command.expectedVersion + 1
   );
 }
 
 export function createPostgresPublicChatStore(
   sql: postgres.Sql<Record<string, never>>,
 ): PublicChatTransactionalStore {
+  const ownershipScopes = new Map<string, { sessionId: string; sessionHash: string }>();
+  const rememberScope = (
+    conversationId: string,
+    scope: { sessionId: string; sessionHash: string },
+  ): void => {
+    ownershipScopes.delete(conversationId);
+    ownershipScopes.set(conversationId, scope);
+    while (ownershipScopes.size > 1_024) {
+      const oldest = ownershipScopes.keys().next().value;
+      if (typeof oldest !== "string") break;
+      ownershipScopes.delete(oldest);
+    }
+  };
+  const proveScope = async (
+    tx: TransactionSql,
+    conversationId: string,
+    scope: { sessionId: string; sessionHash: string },
+  ): Promise<boolean> => {
+    await setPublicChatScope(tx, scope.sessionId);
+    const rows = await tx<Array<{ valid: boolean }>>`
+      select true as valid
+      from public_chat_sessions session
+      join public_chat_conversation_sessions ownership on ownership.session_id = session.id
+      where session.id = ${scope.sessionId}
+        and session.session_hash = ${scope.sessionHash}
+        and session.revoked_at is null
+        and session.expires_at > current_timestamp
+        and ownership.conversation_id = ${conversationId}
+      limit 1
+    `;
+    if (rows[0]?.valid === true) return true;
+    ownershipScopes.delete(conversationId);
+    return false;
+  };
+
   return {
     async createConversation(conversation) {
       return withGatewayTransaction(sql, async (tx) => {
         const sessions = await tx<{ id: string }[]>`
           select id
           from public_chat_sessions
           where session_hash = ${conversation.sessionHash}
             and revoked_at is null
             and expires_at > current_timestamp
           limit 1
           for update
         `;
         const session = sessions[0];
         if (!session) throw new Error("PUBLIC_CHAT_SESSION_NOT_FOUND");
-        const inserted = await tx<{ id: string }[]>`
-          insert into public_chat_conversations (
-            id, session_id, version, locale, status, notice_version, correlation_id,
-            start_idempotency_key, start_fingerprint,
-            last_activity_at, expires_at, closed_at, handoff_receipt_id, handoff_reason,
-            reconciliation_required, created_at, updated_at
-          ) values (
-            ${conversation.id}, ${session.id}, ${conversation.version}, ${conversation.locale},
-            ${conversation.status}, ${conversation.noticeVersion}, ${conversation.correlationId},
-            ${conversation.startIdempotencyKey}, ${conversation.startFingerprint},
-            ${conversation.lastActivityAt}, ${conversation.expiresAt},
-            ${conversation.closedAt ?? null}, ${conversation.handoffReceiptId ?? null},
-            ${conversation.handoffReason ?? null}, false,
-            ${conversation.createdAt}, ${conversation.updatedAt}
-          )
-          on conflict (session_id, start_idempotency_key) do nothing
-          returning id
-        `;
-        if (inserted[0]) {
-          await appendAuditEvent(tx, conversation, "chat_conversation_started");
-          return "created" as const;
-        }
+        await setPublicChatScope(tx, session.id);
+        await tx`select pg_advisory_xact_lock(hashtextextended(${`${session.id}:${conversation.startIdempotencyKey}`}, 0))`;
         const existing = await tx<Array<{ id: string; start_fingerprint: string }>>`
-          select id, start_fingerprint
-          from public_chat_conversations
-          where session_id = ${session.id}
-            and start_idempotency_key = ${conversation.startIdempotencyKey}
+          select conversation_id as id, start_fingerprint
+          from public_chat_conversation_sessions
+          where session_id = ${session.id} and start_idempotency_key = ${conversation.startIdempotencyKey}
           limit 1
           for update
         `;
         const row = existing[0];
-        if (!row || row.start_fingerprint !== conversation.startFingerprint) {
+        if (row) {
+          if (row.start_fingerprint !== conversation.startFingerprint) return "conflict" as const;
+          rememberScope(row.id, {
+            sessionId: session.id,
+            sessionHash: conversation.sessionHash,
+          });
+          const replayed = await loadConversation(tx, row.id, conversation.sessionHash);
+          if (!replayed) throw new Error("PUBLIC_CHAT_START_REPLAY_UNAVAILABLE");
+          return { replayed } as const;
+        }
+        if (
+          conversation.version !== 1 ||
+          conversation.status !== "new" ||
+          conversation.createdAt.valueOf() !== conversation.updatedAt.valueOf()
+        ) {
           return "conflict" as const;
         }
-        const replayed = await loadConversation(tx, row.id, conversation.sessionHash);
-        if (!replayed) throw new Error("PUBLIC_CHAT_START_REPLAY_UNAVAILABLE");
-        return { replayed } as const;
+        const participantId = `participant_${(await sha256(`${conversation.id}:external`)).slice(0, 24)}`;
+        const sessionLinkId = `session_link_${(await sha256(`${conversation.id}:${session.id}`)).slice(0, 24)}`;
+        await tx`
+          select atlas_bootstrap_public_chat_conversation(
+            ${session.id}, ${conversation.id}, ${participantId}, ${sessionLinkId},
+            ${conversation.locale}, ${conversation.correlationId}, ${conversation.noticeVersion},
+            ${conversation.startIdempotencyKey}, ${conversation.startFingerprint},
+            ${conversation.createdAt}, ${conversation.expiresAt}
+          )
+        `;
+        rememberScope(conversation.id, {
+          sessionId: session.id,
+          sessionHash: conversation.sessionHash,
+        });
+        return "created" as const;
       });
     },
 
-    findOwnedConversation: (conversationId, sessionHash) =>
-      withGatewayTransaction(sql, (tx) => loadConversation(tx, conversationId, sessionHash)),
+    async findOwnedConversation(conversationId, sessionHash) {
+      const conversation = await withGatewayTransaction(sql, (tx) =>
+        loadConversation(tx, conversationId, sessionHash),
+      );
+      if (conversation) {
+        const sessions = await withGatewayTransaction(sql, async (tx) => {
+          const rows = await tx<Array<{ id: string }>>`
+            select id from public_chat_sessions
+            where session_hash = ${sessionHash}
+              and revoked_at is null
+              and expires_at > current_timestamp
+            limit 1
+          `;
+          return rows;
+        });
+        if (sessions[0]) rememberScope(conversationId, { sessionId: sessions[0].id, sessionHash });
+      } else {
+        ownershipScopes.delete(conversationId);
+      }
+      return conversation;
+    },
 
     async findCommandResult(conversationId, idempotencyKey, kind, fingerprint) {
+      const scope = ownershipScopes.get(conversationId);
+      if (!scope) return null;
       return withGatewayTransaction(sql, async (tx) => {
+        if (!(await proveScope(tx, conversationId, scope))) return null;
         const rows = await tx<
           Array<Pick<CommandRow, "state" | "result" | "command_kind" | "command_fingerprint">>
         >`
           select state, result, command_kind, command_fingerprint
           from public_chat_idempotency
           where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
           limit 1
         `;
         const row = rows[0];
         if (row && (row.command_kind !== kind || row.command_fingerprint !== fingerprint)) {
           return "command_mismatch";
         }
         return row?.state === "completed" ? deserializePublicChatCommandResult(row.result) : null;
       });
     },
 
     async claimCommand(command, _leaseToken, leaseTokenHash) {
+      const scope = ownershipScopes.get(command.conversationId);
+      if (!scope) return { status: "conflict" as const };
       return withGatewayTransaction(sql, async (tx) => {
+        if (!(await proveScope(tx, command.conversationId, scope))) {
+          return { status: "conflict" as const };
+        }
         const versions = await tx<{ version: number }[]>`
           select version
-          from public_chat_conversations
-          where id = ${command.conversationId}
+          from communication_conversations
+          where id = ${command.conversationId} and channel_kind = 'public_web'
           limit 1
           for update
         `;
         const existingRows = await tx<CommandRow[]>`
           select state, lease_token_hash, lease_expires_at, result, expected_version, command_kind,
                  command_fingerprint,
                  lease_expires_at > current_timestamp as lease_active
           from public_chat_idempotency
           where conversation_id = ${command.conversationId}
             and idempotency_key = ${command.idempotencyKey}
@@ -659,22 +842,25 @@ export function createPostgresPublicChatStore(
               ${command.expectedVersion}, ${leaseTokenHash}, ${command.leaseExpiresAt},
               null, null, current_timestamp, current_timestamp
             )
           `;
         }
         return { status: "claimed" as const };
       });
     },
 
     async waitForCommandResult(conversationId, idempotencyKey, kind, fingerprint, waitUntil) {
+      const scope = ownershipScopes.get(conversationId);
+      if (!scope) return null;
       while (Date.now() < waitUntil.getTime()) {
         const completed = await withGatewayTransaction(sql, async (tx) => {
+          if (!(await proveScope(tx, conversationId, scope))) return null;
           const rows = await tx<
             Array<Pick<CommandRow, "state" | "result" | "command_kind" | "command_fingerprint">>
           >`
             select state, result, command_kind, command_fingerprint
             from public_chat_idempotency
             where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
             limit 1
           `;
           const row = rows[0];
           if (row && (row.command_kind !== kind || row.command_fingerprint !== fingerprint)) {
@@ -682,24 +868,27 @@ export function createPostgresPublicChatStore(
           }
           return row?.state === "completed" ? deserializePublicChatCommandResult(row.result) : null;
         });
         if (completed) return completed;
         await new Promise((resolve) => setTimeout(resolve, 50));
       }
       return null;
     },
 
     async advanceCommand(command, leaseTokenHash, transcriptPersistence) {
+      const scope = ownershipScopes.get(command.conversation.id);
+      if (!scope) return "conflict" as const;
       return withGatewayTransaction(sql, async (tx) => {
+        if (!(await proveScope(tx, command.conversation.id, scope))) return "conflict" as const;
         const versions = await tx<{ version: number }[]>`
-          select version from public_chat_conversations
-          where id = ${command.conversation.id}
+          select version from communication_conversations
+          where id = ${command.conversation.id} and channel_kind = 'public_web'
           limit 1 for update
         `;
         const claims = await tx<CommandRow[]>`
            select state, lease_token_hash, lease_expires_at, result, expected_version, command_kind,
                  command_fingerprint,
                  lease_expires_at > current_timestamp as lease_active
           from public_chat_idempotency
           where conversation_id = ${command.conversation.id}
             and idempotency_key = ${command.idempotencyKey}
           limit 1
@@ -730,24 +919,27 @@ export function createPostgresPublicChatStore(
           tx,
           command.conversation,
           "chat_handoff_requested",
           command.conversation.handoffReason,
         );
         return "advanced" as const;
       });
     },
 
     async completeCommand(command, leaseTokenHash, transcriptPersistence) {
+      const scope = ownershipScopes.get(command.conversation.id);
+      if (!scope) return "conflict" as const;
       return withGatewayTransaction(sql, async (tx) => {
+        if (!(await proveScope(tx, command.conversation.id, scope))) return "conflict" as const;
         const versions = await tx<{ version: number }[]>`
-          select version from public_chat_conversations
-          where id = ${command.conversation.id}
+          select version from communication_conversations
+          where id = ${command.conversation.id} and channel_kind = 'public_web'
           limit 1 for update
         `;
         const claims = await tx<CommandRow[]>`
           select state, lease_token_hash, lease_expires_at, result, expected_version, command_kind,
                  command_fingerprint,
                  lease_expires_at > current_timestamp as lease_active
           from public_chat_idempotency
           where conversation_id = ${command.conversation.id}
             and idempotency_key = ${command.idempotencyKey}
           limit 1
diff --git a/blueprints/project-atlas/workspace/packages/database/src/schema.ts b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
index f80f59c..4eb6090 100644
--- a/blueprints/project-atlas/workspace/packages/database/src/schema.ts
+++ b/blueprints/project-atlas/workspace/packages/database/src/schema.ts
@@ -5,20 +5,21 @@ import {
   char,
   check,
   foreignKey,
   getTableConfig,
   index,
   integer,
   jsonb,
   pgPolicy,
   pgRole,
   pgTable,
+  primaryKey,
   text,
   timestamp,
   unique,
   varchar,
 } from "drizzle-orm/pg-core";
 
 const gatewayAccess = (name: string) =>
   pgPolicy(`${name}_server_gateway_only`, {
     as: "permissive",
     for: "all",
@@ -49,20 +50,38 @@ const publicSessionId = sql`nullif(current_setting('atlas.public_chat_session_id
 const publicConversationScope = (conversationId: unknown, channelKind: unknown) =>
   sql`${channelKind} = 'public_web' and exists (
     select 1
     from public_chat_conversation_sessions pcs
     where pcs.conversation_id = ${conversationId}
       and pcs.session_id = ${publicSessionId}
   )`;
 
 const communicationsConversationScope = (channelKind: unknown) => sql`${channelKind} = 'whatsapp'`;
 
+const publicChildConversationScope = (conversationId: unknown) =>
+  sql`exists (
+    select 1
+    from public_chat_conversation_sessions pcs
+    where pcs.conversation_id = ${conversationId}
+      and pcs.session_id = ${publicSessionId}
+  )`;
+
+const publicCitationScope = (messageId: unknown) =>
+  sql`exists (
+    select 1
+    from communication_messages message
+    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
+    where message.id = ${messageId}
+      and message.channel_kind = 'public_web'
+      and pcs.session_id = ${publicSessionId}
+  )`;
+
 const sharedPolicies = (name: string, conversationId: unknown, channelKind: unknown) => [
   pgPolicy(`${name}_public_chat_scope`, {
     as: "permissive",
     for: "all",
     to: publicChatGatewayRole,
     using: publicConversationScope(conversationId, channelKind),
     withCheck: publicConversationScope(conversationId, channelKind),
   }),
   pgPolicy(`${name}_communications_scope`, {
     as: "permissive",
@@ -103,21 +122,21 @@ export const publicChatRateLimits = pgTable(
     index("public_chat_rate_limits_expiry_idx").on(table.expiresAt),
     check("public_chat_rate_limits_count_positive", sql`${table.count} > 0`),
     check(
       "public_chat_rate_limits_window_valid",
       sql`${table.expiresAt} > ${table.windowStartedAt}`,
     ),
     gatewayAccess("public_chat_rate_limits"),
   ],
 ).enableRLS();
 
-export const publicChatConversations = pgTable(
+const supersededPublicChatConversations = pgTable(
   "public_chat_conversations",
   {
     id: text("id").primaryKey(),
     sessionId: text("session_id")
       .notNull()
       .references(() => publicChatSessions.id, { onDelete: "cascade" }),
     version: integer("version").notNull(),
     locale: varchar("locale", { length: 2 }).notNull(),
     status: varchar("status", { length: 32 }).notNull(),
     noticeVersion: varchar("notice_version", { length: 80 }).notNull(),
@@ -154,27 +173,27 @@ export const publicChatConversations = pgTable(
     ),
     index("public_chat_conversations_expiry_idx").on(table.expiresAt),
     index("public_chat_conversations_reconciliation_idx").on(
       table.reconciliationRequired,
       table.updatedAt,
     ),
     gatewayAccess("public_chat_conversations"),
   ],
 ).enableRLS();
 
-export const publicChatMessages = pgTable(
+const supersededPublicChatMessages = pgTable(
   "public_chat_messages",
   {
     id: text("id").primaryKey(),
     conversationId: text("conversation_id")
       .notNull()
-      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
+      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
     ordinal: integer("ordinal").notNull(),
     actor: varchar("actor", { length: 16 }).notNull(),
     state: varchar("state", { length: 24 }).notNull(),
     body: text("body"),
     bodyStored: boolean("body_stored").notNull().default(false),
     actions: jsonb("actions").notNull().default(sql`'[]'::jsonb`),
     rejectionReason: varchar("rejection_reason", { length: 48 }),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
@@ -198,48 +217,54 @@ export const publicChatMessages = pgTable(
     gatewayAccess("public_chat_messages"),
   ],
 ).enableRLS();
 
 export const publicChatCitations = pgTable(
   "public_chat_citations",
   {
     id: text("id").primaryKey(),
     messageId: text("message_id")
       .notNull()
-      .references(() => publicChatMessages.id, { onDelete: "cascade" }),
+      .references(() => communicationMessages.id, { onDelete: "restrict" }),
     sourceId: text("source_id").notNull(),
     title: text("title").notNull(),
     path: text("path").notNull(),
     locale: varchar("locale", { length: 2 }).notNull(),
     summary: text("summary").notNull(),
     disclosure: text("disclosure").notNull(),
     sourceKind: varchar("source_kind", { length: 16 }),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     unique("public_chat_citations_message_source_unique").on(table.messageId, table.sourceId),
     check("public_chat_citations_locale_valid", sql`${table.locale} in ('es', 'en')`),
     check(
       "public_chat_citations_source_kind_valid",
       sql`${table.sourceKind} is null or ${table.sourceKind} = 'provider'`,
     ),
-    gatewayAccess("public_chat_citations"),
+    pgPolicy("public_chat_citations_server_gateway_only", {
+      as: "permissive",
+      for: "all",
+      to: publicChatGatewayRole,
+      using: publicCitationScope(table.messageId),
+      withCheck: publicCitationScope(table.messageId),
+    }),
   ],
 ).enableRLS();
 
-export const publicChatHandoffs = pgTable(
+const supersededPublicChatHandoffs = pgTable(
   "public_chat_handoffs",
   {
     id: text("id").primaryKey(),
     conversationId: text("conversation_id")
       .notNull()
-      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
+      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
     status: varchar("status", { length: 24 }).notNull(),
     reason: varchar("reason", { length: 48 }).notNull(),
     receiptId: text("receipt_id"),
     requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
     queuedAt: timestamp("queued_at", { withTimezone: true, mode: "date" }),
     updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     index("public_chat_handoffs_status_idx").on(table.status, table.updatedAt),
     check(
@@ -249,21 +274,21 @@ export const publicChatHandoffs = pgTable(
     gatewayAccess("public_chat_handoffs"),
   ],
 ).enableRLS();
 
 export const publicChatIdempotency = pgTable(
   "public_chat_idempotency",
   {
     id: text("id").primaryKey(),
     conversationId: text("conversation_id")
       .notNull()
-      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
+      .references(() => communicationConversations.id, { onDelete: "restrict" }),
     idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
     commandKind: varchar("command_kind", { length: 16 }).notNull(),
     commandFingerprint: varchar("command_fingerprint", { length: 64 }).notNull(),
     state: varchar("state", { length: 16 }).notNull(),
     expectedVersion: integer("expected_version").notNull(),
     leaseTokenHash: char("lease_token_hash", { length: 64 }).notNull(),
     leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }).notNull(),
     result: jsonb("result"),
     completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
     ...timestamps,
@@ -279,32 +304,38 @@ export const publicChatIdempotency = pgTable(
       sql`${table.state} in ('in_progress', 'completed')`,
     ),
     check(
       "public_chat_idempotency_command_kind_valid",
       sql`${table.commandKind} in ('message', 'handoff', 'locale', 'close')`,
     ),
     check(
       "public_chat_idempotency_completion_valid",
       sql`(${table.state} = 'completed' and ${table.result} is not null and ${table.completedAt} is not null) or (${table.state} = 'in_progress' and ${table.completedAt} is null)`,
     ),
-    gatewayAccess("public_chat_idempotency"),
+    pgPolicy("public_chat_idempotency_server_gateway_only", {
+      as: "permissive",
+      for: "all",
+      to: publicChatGatewayRole,
+      using: publicChildConversationScope(table.conversationId),
+      withCheck: publicChildConversationScope(table.conversationId),
+    }),
   ],
 ).enableRLS();
 
-export const publicChatAuditEvents = pgTable(
+const supersededPublicChatAuditEvents = pgTable(
   "public_chat_audit_events",
   {
     id: text("id").primaryKey(),
     sequence: bigint("sequence", { mode: "number" }).notNull(),
     conversationId: text("conversation_id")
       .notNull()
-      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
+      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
     eventName: varchar("event_name", { length: 64 }).notNull(),
     reason: varchar("reason", { length: 48 }),
     version: integer("version").notNull(),
     locale: varchar("locale", { length: 2 }).notNull(),
     correlationId: text("correlation_id").notNull(),
     createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
   },
   (table) => [
     unique("public_chat_audit_sequence_unique").on(table.conversationId, table.sequence),
     check("public_chat_audit_locale_valid", sql`${table.locale} in ('es', 'en')`),
@@ -500,20 +531,21 @@ export const communicationContactPolicies = pgTable(
     id: text("id").primaryKey(),
     bindingId: text("binding_id")
       .notNull()
       .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
     purpose: varchar("purpose", { length: 24 }).notNull(),
     consentState: varchar("consent_state", { length: 24 }).notNull(),
     fenceState: varchar("fence_state", { length: 24 }).notNull(),
     decisionCode: varchar("decision_code", { length: 32 }),
     evidenceReceiptId: text("evidence_receipt_id"),
     version: integer("version").notNull(),
+    fence: integer("fence").notNull().default(0),
     evaluatedAt: timestamp("evaluated_at", { withTimezone: true, mode: "date" }).notNull(),
     ...timestamps,
   },
   (table) => [
     unique("communication_contact_policies_binding_purpose_unique").on(
       table.bindingId,
       table.purpose,
     ),
     check(
       "communication_contact_policies_purpose_valid",
@@ -525,20 +557,21 @@ export const communicationContactPolicies = pgTable(
     ),
     check(
       "communication_contact_policies_fence_valid",
       sql`${table.fenceState} in ('normal', 'opt_out_pending', 'withdrawn', 'normal_after_review')`,
     ),
     check(
       "communication_contact_policies_decision_valid",
       sql`${table.decisionCode} is null or ${table.decisionCode} in ('allowed', 'denied_consent', 'denied_policy', 'denied_binding', 'denied_readiness', 'stale_version')`,
     ),
     check("communication_contact_policies_version_positive", sql`${table.version} > 0`),
+    check("communication_contact_policies_fence_nonnegative", sql`${table.fence} >= 0`),
     index("communication_contact_policies_fence_idx").on(table.fenceState, table.updatedAt),
     communicationsOnly("communication_contact_policies"),
   ],
 ).enableRLS();
 
 export const communicationConversations = pgTable(
   "communication_conversations",
   {
     id: text("id").primaryKey(),
     channelKind: varchar("channel_kind", { length: 16 }).notNull(),
@@ -1037,31 +1070,34 @@ export const communicationOutboundCommands = pgTable(
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
-    owningReceiptId: text("owning_receipt_id").notNull(),
-    owningDomain: varchar("owning_domain", { length: 80 }).notNull(),
-    owningReference: text("owning_reference").notNull(),
-    owningReceiptIssuedAt: timestamp("owning_receipt_issued_at", { withTimezone: true, mode: "date" }).notNull(),
-    owningReceiptValidUntil: timestamp("owning_receipt_valid_until", { withTimezone: true, mode: "date" }).notNull(),
-    owningReceiptCorrelationId: text("owning_receipt_correlation_id").notNull(),
-    expectedPolicyVersion: integer("expected_policy_version").notNull(),
+    owningReceiptId: text("owning_receipt_id"),
+    owningDomain: varchar("owning_domain", { length: 80 }),
+    owningReference: text("owning_reference"),
+    owningReceiptIssuedAt: timestamp("owning_receipt_issued_at", { withTimezone: true, mode: "date" }),
+    owningReceiptValidUntil: timestamp("owning_receipt_valid_until", { withTimezone: true, mode: "date" }),
+    owningReceiptCorrelationId: text("owning_receipt_correlation_id"),
+    expectedPolicyVersion: integer("expected_policy_version"),
+    requiredFence: integer("required_fence"),
+    endpointDigests: jsonb("endpoint_digests").notNull().default(sql`'[]'::jsonb`),
     idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
-    fingerprint: char("fingerprint", { length: 64 }).notNull(),
+    fingerprint: char("fingerprint", { length: 64 }),
     correlationId: text("correlation_id").notNull(),
     state: varchar("state", { length: 32 }).notNull(),
+    failureCode: varchar("failure_code", { length: 64 }),
     version: integer("version").notNull(),
     leaseOwnerId: text("lease_owner_id"),
     leaseTokenHash: char("lease_token_hash", { length: 64 }),
     leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
     scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: "date" }),
     expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
     ...timestamps,
   },
   (table) => [
     foreignKey({
@@ -1072,50 +1108,61 @@ export const communicationOutboundCommands = pgTable(
     foreignKey({
       name: "communication_outbound_commands_binding_connection_channel_fk",
       columns: [table.bindingId, table.connectionId, table.channelKind],
       foreignColumns: [
         communicationContactBindings.id,
         communicationContactBindings.connectionId,
         communicationContactBindings.channelKind,
       ],
     }).onDelete("restrict"),
     unique("communication_outbound_commands_id_connection_unique").on(table.id, table.connectionId),
+    unique("communication_outbound_commands_id_binding_unique").on(table.id, table.bindingId),
     unique("communication_outbound_commands_binding_key_unique").on(
       table.bindingId,
       table.idempotencyKey,
     ),
     check("communication_outbound_commands_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
     check(
       "communication_outbound_commands_fingerprint_valid",
-      sql`${table.fingerprint} ~ '^[0-9a-f]{64}$'`,
+      sql`${table.fingerprint} is null or ${table.fingerprint} ~ '^[0-9a-f]{64}$'`,
     ),
     check(
       "communication_outbound_commands_lease_token_hash_valid",
       sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
     ),
+    check(
+      "communication_outbound_commands_lease_owner_hash_valid",
+      sql`${table.leaseOwnerId} is null or ${table.leaseOwnerId} ~ '^[0-9a-f]{64}$'`,
+    ),
     check("communication_outbound_commands_locale_valid", sql`${table.locale} in ('es', 'en')`),
     check(
       "communication_outbound_commands_purpose_valid",
       sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
     ),
     check(
       "communication_outbound_commands_state_valid",
       sql`${table.state} in ('draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')`,
     ),
     check(
       "communication_outbound_commands_policy_version_positive",
-      sql`${table.expectedPolicyVersion} > 0`,
+      sql`${table.expectedPolicyVersion} is null or ${table.expectedPolicyVersion} > 0`,
     ),
-    check("communication_outbound_commands_version_positive", sql`${table.version} > 0`),
+    check("communication_outbound_commands_required_fence_valid", sql`${table.requiredFence} is null or ${table.requiredFence} >= 0`),
+    check("communication_outbound_commands_endpoint_digests_valid", sql`jsonb_typeof(${table.endpointDigests}) = 'array'`),
+    check("communication_outbound_commands_version_nonnegative", sql`${table.version} >= 0`),
     check(
       "communication_outbound_commands_owning_receipt_window_valid",
-      sql`${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt}`,
+      sql`(${table.owningReceiptId} is null and ${table.owningDomain} is null and ${table.owningReference} is null and ${table.owningReceiptIssuedAt} is null and ${table.owningReceiptValidUntil} is null and ${table.owningReceiptCorrelationId} is null) or (${table.owningReceiptId} is not null and ${table.owningDomain} is not null and ${table.owningReference} is not null and ${table.owningReceiptIssuedAt} is not null and ${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt} and ${table.owningReceiptCorrelationId} is not null)`,
+    ),
+    check(
+      "communication_outbound_commands_finalization_valid",
+      sql`${table.state} = 'draft' or (${table.fingerprint} is not null and ${table.expectedPolicyVersion} is not null and ${table.requiredFence} is not null and ${table.owningReceiptId} is not null)`,
     ),
     check(
       "communication_outbound_commands_destination_reference_opaque",
       sql`${table.destinationKey} is null or (char_length(${table.destinationKey}) <= 120 and ${table.destinationKey} ~ '^(portal\\.|vault:|endpoint_ref:)[A-Za-z0-9][A-Za-z0-9._:-]{2,119}$')`,
     ),
     check(
       "communication_outbound_commands_lease_valid",
       sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
     ),
     check(
@@ -1151,46 +1198,55 @@ export const communicationDispatchAttempts = pgTable(
       mode: "date",
     }).notNull(),
     expectedPolicyVersion: integer("expected_policy_version").notNull(),
     requestDigest: char("request_digest", { length: 64 }).notNull(),
     stableReference: text("stable_reference"),
     externalMessageReference: text("external_message_reference"),
     state: varchar("state", { length: 32 }).notNull(),
     resultCode: varchar("result_code", { length: 32 }),
     providerIoCapabilityHash: char("provider_io_capability_hash", { length: 64 }),
     providerIoStartedAt: timestamp("provider_io_started_at", { withTimezone: true, mode: "date" }),
+    leaseOwnerHash: char("lease_owner_hash", { length: 64 }).notNull(),
+    leaseVersion: integer("lease_version").notNull(),
+    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }).notNull(),
+    providerReferenceDigest: char("provider_reference_digest", { length: 64 }),
     startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
     completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
     ...timestamps,
   },
   (table) => [
     foreignKey({
       name: "communication_dispatch_attempts_command_connection_fk",
       columns: [table.commandId, table.connectionId],
       foreignColumns: [
         communicationOutboundCommands.id,
         communicationOutboundCommands.connectionId,
       ],
     }).onDelete("cascade"),
     unique("communication_dispatch_attempts_command_ordinal_unique").on(
       table.commandId,
       table.attemptOrdinal,
     ),
+    unique("communication_dispatch_attempts_id_command_unique").on(table.id, table.commandId),
     unique("communication_dispatch_attempts_external_reference_unique").on(
       table.connectionId,
       table.externalMessageReference,
     ),
     check("communication_dispatch_attempts_ordinal_positive", sql`${table.attemptOrdinal} > 0`),
     check(
       "communication_dispatch_attempts_request_digest_valid",
       sql`${table.requestDigest} ~ '^[0-9a-f]{64}$'`,
     ),
+    check("communication_dispatch_attempts_lease_owner_hash_valid", sql`${table.leaseOwnerHash} ~ '^[0-9a-f]{64}$'`),
+    check("communication_dispatch_attempts_lease_version_positive", sql`${table.leaseVersion} > 0`),
+    check("communication_dispatch_attempts_lease_window_valid", sql`${table.leaseExpiresAt} > ${table.startedAt}`),
+    check("communication_dispatch_attempts_provider_reference_digest_valid", sql`${table.providerReferenceDigest} is null or ${table.providerReferenceDigest} ~ '^[0-9a-f]{64}$'`),
     check(
       "communication_dispatch_attempts_policy_version_positive",
       sql`${table.expectedPolicyVersion} > 0`,
     ),
     check(
       "communication_dispatch_attempts_state_valid",
       sql`${table.state} in ('dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'manual_review')`,
     ),
     check(
       "communication_dispatch_attempts_result_valid",
@@ -1202,20 +1258,90 @@ export const communicationDispatchAttempts = pgTable(
     ),
     check(
       "communication_dispatch_attempts_provider_io_capability_valid",
       sql`(${table.providerIoCapabilityHash} is null and ${table.providerIoStartedAt} is null) or (${table.providerIoCapabilityHash} ~ '^[0-9a-f]{64}$' and ${table.providerIoStartedAt} is not null and ${table.providerIoStartedAt} >= ${table.startedAt})`,
     ),
     index("communication_dispatch_attempts_recovery_idx").on(table.state, table.completedAt),
     communicationsOnly("communication_dispatch_attempts"),
   ],
 ).enableRLS();
 
+export const communicationProviderStatusReceipts = pgTable(
+  "communication_provider_status_receipts",
+  {
+    commandId: text("command_id")
+      .notNull()
+      .references(() => communicationOutboundCommands.id, { onDelete: "cascade" }),
+    providerEventId: text("provider_event_id").notNull(),
+    status: varchar("status", { length: 24 }).notNull(),
+    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    primaryKey({
+      name: "communication_provider_status_receipts_command_event_pk",
+      columns: [table.commandId, table.providerEventId],
+    }),
+    check(
+      "communication_provider_status_receipts_status_valid",
+      sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
+    ),
+    communicationsOnly("communication_provider_status_receipts"),
+  ],
+).enableRLS();
+
+export const communicationDispatchReconciliationReceipts = pgTable(
+  "communication_dispatch_reconciliation_receipts",
+  {
+    receiptId: text("receipt_id").primaryKey(),
+    receiptDigest: char("receipt_digest", { length: 64 }).notNull(),
+    commandId: text("command_id").notNull(),
+    attemptId: text("attempt_id").notNull(),
+    bindingId: text("binding_id").notNull(),
+    source: varchar("source", { length: 32 }).notNull(),
+    outcome: varchar("outcome", { length: 32 }).notNull(),
+    correlationId: text("correlation_id").notNull(),
+    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
+    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
+    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
+  },
+  (table) => [
+    foreignKey({
+      name: "communication_dispatch_reconciliation_receipts_attempt_command_fk",
+      columns: [table.attemptId, table.commandId],
+      foreignColumns: [communicationDispatchAttempts.id, communicationDispatchAttempts.commandId],
+    }).onDelete("restrict"),
+    foreignKey({
+      name: "communication_dispatch_reconciliation_receipts_command_binding_fk",
+      columns: [table.commandId, table.bindingId],
+      foreignColumns: [communicationOutboundCommands.id, communicationOutboundCommands.bindingId],
+    }).onDelete("restrict"),
+    check(
+      "communication_dispatch_reconciliation_receipts_digest_valid",
+      sql`${table.receiptDigest} ~ '^[0-9a-f]{64}$'`,
+    ),
+    check(
+      "communication_dispatch_reconciliation_receipts_source_valid",
+      sql`${table.source} in ('provider_lookup', 'provider_status', 'manual_attestation')`,
+    ),
+    check(
+      "communication_dispatch_reconciliation_receipts_outcome_valid",
+      sql`${table.outcome} in ('accepted', 'confirmed_not_sent', 'failed')`,
+    ),
+    check(
+      "communication_dispatch_reconciliation_receipts_window_valid",
+      sql`${table.expiresAt} > ${table.issuedAt} and ${table.createdAt} >= ${table.issuedAt} and ${table.createdAt} < ${table.expiresAt}`,
+    ),
+    communicationsOnly("communication_dispatch_reconciliation_receipts"),
+  ],
+).enableRLS();
+
 export const communicationHandoffs = pgTable(
   "communication_handoffs",
   {
     id: text("id").primaryKey(),
     conversationId: text("conversation_id").notNull(),
     channelKind: varchar("channel_kind", { length: 16 }).notNull(),
     state: varchar("state", { length: 24 }).notNull(),
     reasonCode: varchar("reason_code", { length: 48 }).notNull(),
     receiptId: text("receipt_id"),
     correlationId: text("correlation_id").notNull(),
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
index bec9ba0..3d1a833 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
@@ -48,44 +48,44 @@ import type {
   OutboundCommandState,
   OutboundDispatchAttempt,
 } from "./contracts.ts";
 
 type InboundRecord = {
   replayKey: string;
   providerBodyDigest: string;
   endpointDigests: AcceptInboundCommand["endpointDigests"];
   envelope: AcceptInboundCommand["envelope"];
   state: "persisted" | "applied" | "manual_review" | "dead_letter";
-  leaseOwner?: string;
+  leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
 };
 
 type OutboundRecord = CreateOutboundCommand & {
+  messageBodyDigest: string;
   fingerprint?: string;
   requiredPolicyVersion?: number;
   requiredFence?: number;
   endpointDigests?: FinalizeOutboundCommand["endpointDigests"];
   authorizationReceipt?: FinalizeOutboundCommand["authorizationReceipt"];
   failureCode?: FailOutboundDraftCommand["code"];
   state: OutboundCommandState;
-  leaseOwner?: string;
+  leaseOwnerHash?: string;
   leaseVersion: number;
   leaseExpiresAt?: Date;
   blockedCode?: Extract<OutboundClaimResult, { status: "not_claimed" }>["code"];
 };
 
 type AttemptRecord = OutboundDispatchAttempt & {
-  leaseOwner: string;
+  leaseOwnerHash: string;
   leaseVersion: number;
   leaseExpiresAt: Date;
-  providerReference?: string;
 };
 
 type ReconciledCommandState = Extract<
   ReconcileOutboundResult,
   { commandState: unknown }
 >["commandState"];
 
 type StoredReconciliationResult = {
   status: "reconciled";
   commandState: ReconciledCommandState;
@@ -112,20 +112,50 @@ type LockOperation =
 export type MemoryCommunicationsRepositoryOptions = CommunicationsSeed & {
   lockBoundary?: (input: { bindingId: string; operation: LockOperation }) => Promise<void>;
 };
 
 const DELIVERY_RANK: Readonly<Record<"sent" | "delivered" | "read", number>> = {
   sent: 1,
   delivered: 2,
   read: 3,
 };
 
+const MAX_LEASE_MILLISECONDS = 15 * 60_000;
+
+async function sha256(value: string): Promise<string> {
+  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
+  return [...new Uint8Array(digest)]
+    .map((byte) => byte.toString(16).padStart(2, "0"))
+    .join("");
+}
+
+function validClaimLease(now: Date, expiresAt: Date): boolean {
+  return (
+    Number.isFinite(now.getTime()) &&
+    Number.isFinite(expiresAt.getTime()) &&
+    expiresAt > now &&
+    expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS
+  );
+}
+
+function metadataOnlyEnvelope(
+  envelope: AcceptInboundCommand["envelope"],
+): AcceptInboundCommand["envelope"] {
+  return { ...clone(envelope), message: { ...clone(envelope.message), body: null } };
+}
+
+function metadataOnlyMessage(
+  message: CreateOutboundCommand["message"],
+): CreateOutboundCommand["message"] {
+  return { ...clone(message), body: null };
+}
+
 function clone<T>(value: T): T {
   return structuredClone(value);
 }
 
 function currentReceipt(input: {
   issuedAt: Date;
   expiresAt: Date;
 }, now: Date): boolean {
   return (
     Number.isFinite(input.issuedAt.getTime()) &&
@@ -208,21 +238,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
           policy.state = "opt_out_pending";
           policy.version += 1;
           policy.fence += 1;
           policy.updatedAt = input.envelope.event.receivedAt;
         }
       }
       const record: InboundRecord = {
         replayKey,
         providerBodyDigest: input.providerBodyDigest,
         endpointDigests: clone(input.endpointDigests),
-        envelope: clone(input.envelope),
+        envelope: metadataOnlyEnvelope(input.envelope),
         state: "persisted",
         leaseVersion: 0,
       };
       this.inboundByReplay.set(replayKey, record);
       this.inboundById.set(input.envelope.event.eventId, record);
       return {
         status: "accepted",
         eventId: input.envelope.event.eventId,
         endpointDigestVersion: activeDigest.version,
         endpointDigest: activeDigest.digest,
@@ -234,70 +264,76 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     const record = this.inboundById.get(input.eventId);
     if (!record) return { status: "not_claimed", code: "not_found" };
     return this.withBindingLock(record.envelope.event.bindingId, "claim_inbound", async () => {
       if (record.state !== "persisted") {
         return { status: "not_claimed", code: "already_completed" };
       }
       const policy = this.policies.get(record.envelope.event.bindingId);
       if (!policy || policy.version !== input.requiredPolicyVersion) {
         return { status: "not_claimed", code: "policy_version_mismatch" };
       }
-      if (record.leaseOwner && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
+      if (!validClaimLease(input.now, input.leaseExpiresAt)) {
+        return { status: "not_claimed", code: "lease_conflict" };
+      }
+      if (record.leaseOwnerHash && record.leaseExpiresAt && record.leaseExpiresAt > input.now) {
         return { status: "not_claimed", code: "lease_conflict" };
       }
-      record.leaseOwner = input.leaseOwner;
+      record.leaseOwnerHash = await sha256(input.leaseOwner);
       record.leaseVersion += 1;
       record.leaseExpiresAt = input.leaseExpiresAt;
       return {
         status: "claimed",
         eventId: input.eventId,
         leaseVersion: record.leaseVersion,
         envelope: clone(record.envelope),
         policyState: policy.state,
       };
     });
   }
 
   async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
     const record = this.inboundById.get(input.eventId);
     if (
       !record ||
       record.state !== "persisted" ||
-      record.leaseOwner !== input.leaseOwner ||
+      record.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
       record.leaseVersion !== input.leaseVersion ||
       !this.validLeaseCompletion(input.now, record.leaseExpiresAt)
     ) {
       return "conflict";
     }
     record.state = input.outcome;
-    record.leaseOwner = undefined;
+    record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
     return "completed";
   }
 
   async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
+    const messageBodyDigest = await sha256(JSON.stringify(input.message.body));
     const existing = this.outboundByIdempotency.get(input.command.idempotencyKey);
     if (existing) {
-      if (!this.sameOutboundDraft(existing, input)) {
+      if (!this.sameOutboundDraft(existing, input, messageBodyDigest)) {
         return { status: "conflict", code: "idempotency_mismatch" };
       }
       const reason = this.outboundDuplicateReason(existing);
       return {
         status: "duplicate",
         commandId: existing.command.commandId,
         messageId: existing.message.id,
         commandState: existing.state,
         ...(reason ? { reason } : {}),
       };
     }
     const record: OutboundRecord = {
       ...clone(input),
+      message: metadataOnlyMessage(input.message),
+      messageBodyDigest,
       state: "draft",
       leaseVersion: 0,
     };
     record.command.state = "draft";
     this.outboundById.set(record.command.commandId, record);
     this.outboundByIdempotency.set(record.command.idempotencyKey, record);
     return {
       status: "created",
       commandId: record.command.commandId,
       messageId: record.message.id,
@@ -345,20 +381,23 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
       }
       if (record.state === "cancelled" && record.blockedCode) {
         return { status: "not_claimed", code: record.blockedCode };
       }
       if (record.state === "dispatching") {
         return { status: "not_claimed", code: "lease_conflict" };
       }
       if (record.state !== "queued") {
         return { status: "not_claimed", code: "already_completed" };
       }
+      if (!validClaimLease(input.now, input.leaseExpiresAt)) {
+        return { status: "not_claimed", code: "lease_conflict" };
+      }
       const binding = this.bindings.get(record.command.bindingId);
       if (!binding) return { status: "not_claimed", code: "binding_not_found" };
       const policy = this.policies.get(record.command.bindingId);
       if (!policy) return { status: "not_claimed", code: "policy_not_found" };
       const consent = this.consents.get(this.consentKey(record.command.bindingId, record.purpose));
       if (!consent) return { status: "not_claimed", code: "consent_not_found" };
       const connection = this.connections.get(record.command.channel);
       const template = this.templates.get(this.templateKey(record.templateId, record.command.locale));
       const activeDigest = record.endpointDigests?.[0];
       if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" };
@@ -384,33 +423,34 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
           ),
         },
         authorizationReceipt: record.authorizationReceipt,
         destinationKey: activeDigest.digest,
         now: input.now,
       });
       if (!decision.allowed) return { status: "not_claimed", code: decision.code };
 
       record.state = "dispatching";
       record.command.state = "dispatching";
-      record.leaseOwner = input.leaseOwner;
+      const leaseOwnerHash = await sha256(input.leaseOwner);
+      record.leaseOwnerHash = leaseOwnerHash;
       record.leaseVersion += 1;
       record.leaseExpiresAt = input.leaseExpiresAt;
       const attempt: AttemptRecord = {
         attemptId: input.attemptId,
         commandId: input.commandId,
         ordinal: [...this.attempts.values()].filter(
           (candidate) => candidate.commandId === input.commandId,
         ).length + 1,
         state: "dispatching",
         startedAt: input.now,
         correlationId: record.command.correlationId,
-        leaseOwner: input.leaseOwner,
+        leaseOwnerHash,
         leaseVersion: record.leaseVersion,
         leaseExpiresAt: input.leaseExpiresAt,
       };
       this.attempts.set(input.attemptId, attempt);
       return {
         status: "claimed",
         command: clone(record.command),
         message: clone(record.message),
         attempt: clone(attempt),
         destinationDigest: clone(activeDigest),
@@ -422,53 +462,52 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
     input: MarkDispatchOutcomeCommand,
   ): Promise<"completed" | "conflict"> {
     const found = this.outboundById.get(input.commandId);
     if (!found) return "conflict";
     return this.withBindingLock(found.command.bindingId, "complete_outbound", async () => {
       const record = this.outboundById.get(input.commandId);
       const attempt = this.attempts.get(input.attemptId);
       if (
         !record ||
         !attempt ||
-        attempt.leaseOwner !== input.leaseOwner ||
+        attempt.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
         attempt.leaseVersion !== input.leaseVersion ||
         !this.validLeaseCompletion(input.now, attempt.leaseExpiresAt)
       ) {
         return "conflict";
       }
       if (attempt.state !== "dispatching") {
         return input.outcome === "accepted" &&
           ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
           ["provider_accepted", "sent", "delivered", "read"].includes(record.state)
           ? "completed"
           : "conflict";
       }
       if (
         record.state !== "dispatching" ||
-        record.leaseOwner !== input.leaseOwner ||
+        record.leaseOwnerHash !== (await sha256(input.leaseOwner)) ||
         record.leaseVersion !== input.leaseVersion
       ) {
         return "conflict";
       }
       const state: OutboundCommandState =
         input.outcome === "accepted"
           ? "provider_accepted"
           : input.outcome === "unknown"
             ? "dispatch_unknown"
             : "failed";
       record.state = state;
       record.command.state = state;
-      record.leaseOwner = undefined;
+      record.leaseOwnerHash = undefined;
       record.leaseExpiresAt = undefined;
       attempt.state = state;
       attempt.completedAt = input.now;
-      attempt.providerReference = input.providerReference;
       return "completed";
     });
   }
 
   async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
     const found = this.outboundById.get(input.commandId);
     if (!found) return { status: "not_found" };
     return this.withBindingLock(found.command.bindingId, "apply_provider_status", async () => {
       const record = this.outboundById.get(input.commandId)!;
       const eventKey = `${input.commandId}\u0000${input.providerEventId}`;
@@ -799,21 +838,21 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
         return { status: "denied", code: "reconciliation_state_invalid" };
       }
       const commandState =
         input.receipt.outcome === "reconciled_accepted"
           ? "reconciled_accepted"
           : input.receipt.outcome === "confirmed_not_sent"
             ? "confirmed_not_sent"
             : "failed";
       record.state = commandState;
       record.command.state = commandState;
-      record.leaseOwner = undefined;
+      record.leaseOwnerHash = undefined;
       record.leaseExpiresAt = undefined;
       attempt.state = commandState;
       attempt.completedAt = input.now;
       const result: StoredReconciliationResult = { status: "reconciled", commandState };
       this.reconciliationReceipts.set(input.receipt.receiptId, { identity, result });
       return result;
     });
   }
 
   async evaluateTemplateEligibility(
@@ -927,47 +966,51 @@ export class MemoryCommunicationsRepository implements CommunicationsRepository
 
   private validLeaseCompletion(now: Date, leaseExpiresAt: Date | undefined): boolean {
     return Boolean(
       leaseExpiresAt &&
         Number.isFinite(now.getTime()) &&
         Number.isFinite(leaseExpiresAt.getTime()) &&
         now < leaseExpiresAt,
     );
   }
 
-  private sameOutboundDraft(existing: OutboundRecord, input: CreateOutboundCommand): boolean {
+  private sameOutboundDraft(
+    existing: OutboundRecord,
+    input: CreateOutboundCommand,
+    messageBodyDigest: string,
+  ): boolean {
     return (
       existing.command.bindingId === input.command.bindingId &&
       existing.command.conversationId === input.command.conversationId &&
       existing.command.channel === input.command.channel &&
       existing.command.locale === input.command.locale &&
-      existing.message.body === input.message.body &&
+      existing.messageBodyDigest === messageBodyDigest &&
       existing.purpose === input.purpose &&
       existing.templateId === input.templateId
     );
   }
 
   private closeActiveAttempt(
     record: OutboundRecord,
     state: "sent" | "delivered" | "read" | "failed",
     completedAt: Date,
   ): void {
     record.state = state;
     record.command.state = state;
     const attempt = [...this.attempts.values()].find(
       (candidate) => candidate.commandId === record.command.commandId && candidate.state === "dispatching",
     );
     if (attempt) {
       attempt.state = state;
       attempt.completedAt = completedAt;
     }
-    record.leaseOwner = undefined;
+    record.leaseOwnerHash = undefined;
     record.leaseExpiresAt = undefined;
   }
 
   private validateWithdrawalEvidence(input: WithdrawContactCommand):
     | { status: "allowed"; record: WithdrawalHistoryRecord }
     | { status: "denied"; code: "withdrawal_evidence_missing" | "withdrawal_evidence_invalid" } {
     const evidence = input.evidence;
     if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
     const receipt = evidence.receipt;
     if (
diff --git a/blueprints/project-atlas/workspace/tests/m003/public-chat-postgres.integration.test.ts b/blueprints/project-atlas/workspace/tests/m003/public-chat-postgres.integration.test.ts
index b7af4ea..4dfe9e9 100644
--- a/blueprints/project-atlas/workspace/tests/m003/public-chat-postgres.integration.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m003/public-chat-postgres.integration.test.ts
@@ -16,22 +16,23 @@ afterAll(async () => {
 
 describe("M003 real Postgres contract", () => {
   it.runIf(Boolean(integrationUrl))(
     "enforces the runtime role and binds idempotency keys to kind and fingerprint",
     async () => {
       if (!sql) throw new Error("M003_POSTGRES_INTEGRATION_URL_REQUIRED");
       const now = new Date();
       const expiresAt = new Date(now.getTime() + 30 * 60_000);
       const suffix = crypto.randomUUID().replaceAll("-", "");
       const sessionHash = `${"d".repeat(32)}${suffix}`;
+      const sessionId = `session_${suffix}`;
       await registerPublicChatSession(sql, {
-        id: `session_${suffix}`,
+        id: sessionId,
         sessionHash,
         csrfHash: "e".repeat(64),
         correlationId: "correlation_integration_1",
         expiresAt,
         now,
       });
       const conversation: PublicChatConversation = {
         id: `conversation_${suffix}`,
         version: 1,
         locale: "es",
@@ -74,13 +75,32 @@ describe("M003 real Postgres contract", () => {
       await expect(
         repository.claimCommand({
           kind: "message",
           fingerprint: "2".repeat(64),
           conversationId: conversation.id,
           idempotencyKey: `command_${suffix}`,
           expectedVersion: 1,
           leaseExpiresAt: new Date(now.getTime() + 60_000),
         }),
       ).resolves.toEqual({ status: "conflict" });
+
+      await sql.begin(async (tx) => {
+        await tx.unsafe("set local role atlas_public_chat_gateway");
+        await tx`
+          update public_chat_sessions set revoked_at = current_timestamp,
+            updated_at = current_timestamp
+          where id = ${sessionId}
+        `;
+      });
+      await expect(
+        repository.claimCommand({
+          kind: "message",
+          fingerprint: "3".repeat(64),
+          conversationId: conversation.id,
+          idempotencyKey: `revoked_${suffix}`,
+          expectedVersion: 1,
+          leaseExpiresAt: new Date(now.getTime() + 60_000),
+        }),
+      ).resolves.toEqual({ status: "conflict" });
     },
   );
 });
diff --git a/blueprints/project-atlas/workspace/tests/m003/public-chat-schema.test.ts b/blueprints/project-atlas/workspace/tests/m003/public-chat-schema.test.ts
index 489ccee..1f12ce4 100644
--- a/blueprints/project-atlas/workspace/tests/m003/public-chat-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m003/public-chat-schema.test.ts
@@ -1,33 +1,34 @@
 import { readFileSync } from "node:fs";
 import { fileURLToPath } from "node:url";
 import { describe, expect, it } from "vitest";
 import {
+  communicationAuditEvents,
+  communicationConversations,
+  communicationHandoffs,
+  communicationMessages,
   getPublicChatTableConfig,
-  publicChatAuditEvents,
   publicChatCitations,
-  publicChatConversations,
-  publicChatHandoffs,
+  publicChatConversationSessions,
   publicChatIdempotency,
-  publicChatMessages,
   publicChatRateLimits,
   publicChatSessions,
 } from "../../packages/database/src/schema.ts";
 
 const TABLES = [
   publicChatSessions,
-  publicChatConversations,
-  publicChatMessages,
+  communicationConversations,
+  communicationMessages,
   publicChatCitations,
-  publicChatHandoffs,
+  communicationHandoffs,
   publicChatIdempotency,
-  publicChatAuditEvents,
+  communicationAuditEvents,
 ];
 
 describe("M003 Drizzle schema contract", () => {
   it("defines every required table with RLS and an opaque primary key", () => {
     for (const table of TABLES) {
       const config = getPublicChatTableConfig(table);
       expect(config.enableRLS).toBe(true);
       expect(config.columns.find((column) => column.name === "id")?.primary).toBe(true);
     }
   });
@@ -63,57 +64,60 @@ describe("M003 Drizzle schema contract", () => {
         new URL("../../packages/database/src/postgres-public-chat-store.ts", import.meta.url),
       ),
       "utf8",
     );
     expect(store).toContain("delete from public_chat_rate_limits");
     expect(store).toContain("limit 100");
     expect(store).toContain("where expires_at <= current_timestamp");
   });
 
   it("exposes version, expiry, reconciliation, and nullable body columns", () => {
-    const conversation = getPublicChatTableConfig(publicChatConversations);
+    const conversation = getPublicChatTableConfig(communicationConversations);
     expect(conversation.columns.find((column) => column.name === "version")?.notNull).toBe(true);
     expect(conversation.indexes.map((index) => index.config.name)).toEqual(
       expect.arrayContaining([
-        "public_chat_conversations_expiry_idx",
-        "public_chat_conversations_reconciliation_idx",
+        "communication_conversations_activity_idx",
+        "communication_conversations_reconciliation_idx",
       ]),
     );
 
-    const body = getPublicChatTableConfig(publicChatMessages).columns.find(
+    const body = getPublicChatTableConfig(communicationMessages).columns.find(
       (column) => column.name === "body",
     );
     expect(body?.notNull).toBe(false);
   });
 
   it("enforces one idempotency key per conversation and bounded reason fields", () => {
     const idempotency = getPublicChatTableConfig(publicChatIdempotency);
     expect(idempotency.uniqueConstraints.map((constraint) => constraint.name)).toContain(
       "public_chat_idempotency_conversation_key_unique",
     );
     expect(idempotency.columns.find((column) => column.name === "command_kind")?.notNull).toBe(
       true,
     );
     expect(
       idempotency.columns.find((column) => column.name === "command_fingerprint")?.notNull,
     ).toBe(true);
-    const conversation = getPublicChatTableConfig(publicChatConversations);
-    expect(conversation.uniqueConstraints.map((constraint) => constraint.name)).toContain(
-      "public_chat_conversations_session_start_key_unique",
+    const ownership = getPublicChatTableConfig(publicChatConversationSessions);
+    expect(ownership.uniqueConstraints.map((constraint) => constraint.name)).toContain(
+      "public_chat_conversation_sessions_session_start_key_unique",
     );
     expect(idempotency.indexes.map((index) => index.config.name)).toContain(
       "public_chat_idempotency_lease_idx",
     );
 
-    const reasonColumns = [publicChatMessages, publicChatHandoffs, publicChatAuditEvents].flatMap(
-      (table) =>
-        getPublicChatTableConfig(table).columns.filter((column) => column.name.includes("reason")),
+    const reasonColumns = [
+      communicationMessages,
+      communicationHandoffs,
+      communicationAuditEvents,
+    ].flatMap((table) =>
+      getPublicChatTableConfig(table).columns.filter((column) => column.name.includes("reason")),
     );
     expect(reasonColumns.length).toBeGreaterThan(0);
     for (const column of reasonColumns) expect(column.dataType).toBe("string");
   });
 
   it("forces RLS and portably revokes direct browser roles in the migration", () => {
     const migration = [
       "0000_abnormal_orphan.sql",
       "0001_thick_riptide.sql",
       "0002_green_tempest.sql",
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
new file mode 100644
index 0000000..670c313
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
@@ -0,0 +1,113 @@
+import { afterAll } from "vitest";
+import {
+  assertRestrictedCommunicationsPrincipal,
+  COMMUNICATIONS_TRANSACTION_SQL,
+  createCommunicationsSql,
+  createPostgresCommunicationsRepository,
+} from "../../packages/database/src/index.ts";
+import {
+  communicationsConformanceIds,
+  communicationsConformanceSeed,
+  runCommunicationsRepositoryConformance,
+} from "../support/communications-repository-conformance.ts";
+
+const integrationUrl = process.env.M004_POSTGRES_INTEGRATION_URL;
+const sql = integrationUrl ? createCommunicationsSql(integrationUrl) : null;
+
+afterAll(async () => {
+  if (sql) await sql.end({ timeout: 5 });
+});
+
+async function seedScenario(scenario: string): Promise<void> {
+  if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
+  const ids = communicationsConformanceIds(scenario);
+  const seed = communicationsConformanceSeed(scenario);
+  const binding = seed.bindings![0]!;
+  const policy = seed.policies![0]!;
+  const consent = seed.consents![0]!;
+  const template = seed.templates![0]!;
+  await sql.begin(async (tx) => {
+    const principalRows = await tx.unsafe<
+      Array<Parameters<typeof assertRestrictedCommunicationsPrincipal>[0]>
+    >(COMMUNICATIONS_TRANSACTION_SQL.attestPrincipal);
+    assertRestrictedCommunicationsPrincipal(principalRows[0]);
+    await tx.unsafe(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole);
+    await tx`
+      insert into communication_channel_connections (
+        id, channel_kind, adapter_key, readiness_state, policy_version, version,
+        configured_at, verified_at, suspended_at, created_at, updated_at
+      ) values (
+        ${ids.connectionId}, 'whatsapp', 'meta_cloud', 'active', 'synthetic.v1', 1,
+        ${binding.createdAt}, ${binding.createdAt}, null, ${binding.createdAt}, ${binding.updatedAt}
+      ) on conflict (id) do nothing
+    `;
+    await tx`
+      insert into communication_contact_bindings (
+        id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
+        trust_state, locale, contact_policy_version, version, verification_receipt_id,
+        endpoint_verified_at, verification_expires_at, wrong_person_reported_at,
+        reassignment_risk_at, suspended_at, created_at, updated_at
+      ) values (
+        ${binding.bindingId}, ${ids.connectionId}, 'whatsapp', ${"b".repeat(64)},
+        'endpoint.v1', ${binding.trustState}, 'en', ${policy.version}, 1,
+        ${`verification_${ids.bindingId}`}, ${binding.createdAt}, ${binding.freshUntil},
+        null, null, null, ${binding.createdAt}, ${binding.updatedAt}
+      ) on conflict (id) do nothing
+    `;
+    await tx`
+      insert into communication_contact_policies (
+        id, binding_id, purpose, consent_state, fence_state, decision_code,
+        evidence_receipt_id, version, fence, evaluated_at, created_at, updated_at
+      ) values (
+        ${policy.policyId}, ${binding.bindingId}, 'transactional', ${consent.state},
+        ${policy.state}, 'allowed', ${consent.receipt!.receiptId}, ${policy.version},
+        ${policy.fence}, ${policy.updatedAt}, ${binding.createdAt}, ${policy.updatedAt}
+      ) on conflict (binding_id, purpose) do nothing
+    `;
+    await tx`
+      insert into communication_contact_evidence_events (
+        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
+        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
+        owning_domain, authority_role, authority_version, triggering_event_id,
+        policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
+        occurred_at, created_at
+      ) values (
+        ${`evidence_${ids.bindingId}`}, ${binding.bindingId}, 1, 'consent_granted',
+        'transactional', 'granted', 'normal', null, null, ${consent.receipt!.receiptId},
+        'consent_evidence', 'M078', 'consent', ${consent.version}, null, null,
+        ${`consent_correlation_${ids.bindingId}`}, ${consent.receipt!.issuedAt},
+        ${consent.receipt!.expiresAt}, ${consent.changedAt}, ${consent.changedAt}
+      ) on conflict (evidence_receipt_id) do nothing
+    `;
+    await tx`
+      insert into communication_message_templates (
+        id, template_key, locale, purpose, definition_source, definition_version,
+        variable_keys, state, internally_approved, approval_receipt_id,
+        approval_receipt_issued_at, approval_receipt_valid_until, external_reference,
+        projection_version, provider_receipt_id, provider_correlation_id,
+        provider_receipt_issued_at, provider_receipt_valid_until, category,
+        observed_at, created_at, updated_at
+      ) values (
+        ${template.templateId}, ${template.templateId}, ${template.locale}, 'transactional',
+        'synthetic_test_fixture', ${template.definitionVersion}, '[]'::jsonb,
+        ${template.providerState}, true, ${`approval_${template.templateId}`},
+        ${template.updatedAt}, ${binding.freshUntil}, ${`provider_${template.templateId}`},
+        ${template.providerVersion}, ${`provider_receipt_${template.templateId}`},
+        ${`provider_correlation_${template.templateId}`}, ${template.updatedAt},
+        ${binding.freshUntil}, 'utility', ${template.updatedAt}, ${template.updatedAt},
+        ${template.updatedAt}
+      ) on conflict (template_key, locale) do nothing
+    `;
+  });
+}
+
+runCommunicationsRepositoryConformance(
+  "postgres",
+  async (scenario) => {
+    if (!sql) throw new Error("M004_POSTGRES_INTEGRATION_URL_REQUIRED");
+    await seedScenario(scenario);
+    const repository = createPostgresCommunicationsRepository(sql);
+    return { repository, inspectState: () => repository.referenceState() };
+  },
+  Boolean(integrationUrl),
+);
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
new file mode 100644
index 0000000..eddbd90
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
@@ -0,0 +1,63 @@
+import { MemoryCommunicationsRepository } from "@atlas/domain";
+import {
+  assertRestrictedCommunicationsPrincipal,
+  COMMUNICATIONS_TRANSACTION_SQL,
+} from "../../packages/database/src/postgres-communications-store.ts";
+import { describe, expect, it } from "vitest";
+import {
+  communicationsConformanceSeed,
+  runCommunicationsRepositoryConformance,
+} from "../support/communications-repository-conformance.ts";
+
+runCommunicationsRepositoryConformance("memory", async (scenario) => {
+  const repository = new MemoryCommunicationsRepository(communicationsConformanceSeed(scenario));
+  return {
+    repository,
+    inspectState: () => repository.referenceState(),
+  };
+});
+
+describe("Postgres communications transaction contract", () => {
+  const safePrincipal = {
+    principal_name: "atlas_communications_runtime",
+    is_member: true,
+    closure_count: 1,
+    admin_path: false,
+    gateway_closure_count: 0,
+    rolbypassrls: false,
+    rolinherit: false,
+    rolsuper: false,
+  };
+
+  it("accepts only the restricted non-inheriting gateway member", () => {
+    expect(() => assertRestrictedCommunicationsPrincipal(safePrincipal)).not.toThrow();
+    for (const unsafePrincipal of [
+      { ...safePrincipal, principal_name: "postgres" },
+      { ...safePrincipal, is_member: false },
+      { ...safePrincipal, closure_count: 2 },
+      { ...safePrincipal, admin_path: true },
+      { ...safePrincipal, gateway_closure_count: 1 },
+      { ...safePrincipal, rolbypassrls: true },
+      { ...safePrincipal, rolinherit: true },
+      { ...safePrincipal, rolsuper: true },
+    ]) {
+      expect(() => assertRestrictedCommunicationsPrincipal(unsafePrincipal)).toThrowError(
+        "COMMUNICATIONS_DATABASE_PRINCIPAL_UNSAFE",
+      );
+    }
+  });
+
+  it("sets one local role and claims both queues with skip-locked row ownership", () => {
+    expect(COMMUNICATIONS_TRANSACTION_SQL.setLocalRole).toBe(
+      "set local role atlas_communications_gateway",
+    );
+    expect(COMMUNICATIONS_TRANSACTION_SQL.claimInbound).toContain(
+      "for update of receipt skip locked",
+    );
+    expect(COMMUNICATIONS_TRANSACTION_SQL.claimOutbound).toContain(
+      "for update skip locked",
+    );
+    expect(COMMUNICATIONS_TRANSACTION_SQL.lockBinding).toContain("for update");
+    expect(COMMUNICATIONS_TRANSACTION_SQL.lockPolicy).toContain("for update");
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
index 3007e72..3f2871b 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
@@ -549,33 +549,35 @@ describe("M004 canonical communications Drizzle schema", () => {
     for (const [exportName, checks] of Object.entries(expectedChecks)) {
       expect(
         tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
           (value) => value.name,
         ),
       ).toEqual(expect.arrayContaining(checks));
     }
   });
 });
 
-describe("M004 generated migration authority and preparatory backfill", () => {
-  it("records generated bootstrap, structural and backfill migrations without hand-authored metadata", () => {
+describe("M004 generated migration authority and canonical cutover", () => {
+  it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
     const migrations = currentM004Migrations();
     const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
     const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
       entries: Array<{ idx: number; tag: string }>;
     };
-    expect(journal.entries.slice(-3).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
+    expect(journal.entries.slice(-5).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
       { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
       { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
       { idx: 8, tag: "0008_m004_communications_backfill" },
+      { idx: 9, tag: "0009_m004_communications_cutover_guard" },
+      { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
     ]);
-    for (const index of ["0006", "0007", "0008"]) {
+    for (const index of ["0006", "0007", "0008", "0009", "0010"]) {
       expect(
         existsSync(
           fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
         ),
       ).toBe(true);
     }
   });
 
   it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
     const { bootstrap, structural, backfill } = currentM004Migrations();
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
index 91e943f..ddc5f25 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
@@ -311,21 +311,24 @@ describe("canonical inbound and application behavior", () => {
     const { repository, service } = createService();
 
     const accepted = await acceptInbound(service);
     const duplicate = await acceptInbound(service);
     const mismatch = await acceptInbound(service, { providerBodyDigest: "different_digest" });
 
     expect(accepted).toMatchObject({ status: "accepted", eventId: "event_1" });
     expect(duplicate).toMatchObject({ status: "duplicate", eventId: "event_1" });
     expect(mismatch).toEqual({ status: "replay_mismatch", code: "provider_replay_mismatch" });
     expect(repository.referenceState().inbound).toHaveLength(1);
-    expect(repository.referenceState().inbound[0]?.envelope).toEqual(envelope());
+    expect(repository.referenceState().inbound[0]?.envelope).toEqual({
+      ...envelope(),
+      message: { ...envelope().message, body: null },
+    });
   });
 
   it("establishes opt_out_pending atomically and prioritizes it before knowledge", async () => {
     let knowledgeCalls = 0;
     const fixture = createService({
       publicKnowledge: {
         answer: async () => {
           knowledgeCalls += 1;
           return { status: "available", text: "must not be used", sourceReceipt: "receipt" };
         },
diff --git a/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
new file mode 100644
index 0000000..d71c17b
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts
@@ -0,0 +1,487 @@
+import { createHash } from "node:crypto";
+import type {
+  CommunicationsReferenceState,
+  CommunicationsRepository,
+  CommunicationsSeed,
+} from "@atlas/domain";
+import { describe, expect, it } from "vitest";
+
+export type CommunicationsRepositoryHarness = {
+  repository: CommunicationsRepository;
+  inspectState?: () => Promise<CommunicationsReferenceState> | CommunicationsReferenceState;
+  close?: () => Promise<void>;
+};
+
+export type CommunicationsRepositoryHarnessFactory = (
+  scenario: string,
+) => Promise<CommunicationsRepositoryHarness>;
+
+export const CONFORMANCE_NOW = new Date("2026-08-20T12:00:00.000Z");
+export const CONFORMANCE_LEASE_END = new Date(CONFORMANCE_NOW.getTime() + 60_000);
+export const CONFORMANCE_TOMORROW = new Date("2026-08-21T12:00:00.000Z");
+
+function suffix(scenario: string): string {
+  return createHash("sha256").update(scenario).digest("hex").slice(0, 16);
+}
+
+export function communicationsConformanceIds(scenario: string) {
+  const id = suffix(scenario);
+  return {
+    bindingId: `binding_${id}`,
+    commandId: `command_${id}`,
+    connectionId: `connection_${id}`,
+    conversationId: `conversation_${id}`,
+    eventId: `event_${id}`,
+    messageId: `message_${id}`,
+    outboundMessageId: `outbound_message_${id}`,
+    participantId: `participant_${id}`,
+    providerEventId: `meta_evt_${id}${id}`,
+  };
+}
+
+export function communicationsConformanceSeed(scenario: string): CommunicationsSeed {
+  const value = communicationsConformanceIds(scenario);
+  return {
+    bindings: [
+      {
+        bindingId: value.bindingId,
+        channel: "whatsapp",
+        trustState: "reverified",
+        freshUntil: CONFORMANCE_TOMORROW,
+        createdAt: CONFORMANCE_NOW,
+        updatedAt: CONFORMANCE_NOW,
+      },
+    ],
+    policies: [
+      {
+        policyId: `policy_${suffix(scenario)}`,
+        bindingId: value.bindingId,
+        state: "normal",
+        version: 7,
+        fence: 42,
+        updatedAt: CONFORMANCE_NOW,
+      },
+    ],
+    consents: [
+      {
+        bindingId: value.bindingId,
+        purpose: "transactional",
+        state: "granted",
+        version: 1,
+        receipt: {
+          receiptId: `consent_${suffix(scenario)}`,
+          owner: "consent",
+          operation: "consent_confirmation",
+          bindingId: value.bindingId,
+          issuedAt: CONFORMANCE_NOW,
+          expiresAt: CONFORMANCE_TOMORROW,
+        },
+        changedAt: CONFORMANCE_NOW,
+      },
+    ],
+    connections: [{ channel: "whatsapp", state: "active" }],
+    templates: [
+      {
+        templateId: `template_${suffix(scenario)}`,
+        locale: "en",
+        definitionVersion: 1,
+        internallyApproved: true,
+        providerState: "provider_approved",
+        providerVersion: 1,
+        updatedAt: CONFORMANCE_NOW,
+      },
+    ],
+  };
+}
+
+function inbound(scenario: string, optOutSignal: "none" | "pending" = "none") {
+  const value = communicationsConformanceIds(scenario);
+  return {
+    connectionId: value.connectionId,
+    providerEventId: value.providerEventId,
+    providerBodyDigest: "a".repeat(64),
+    endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
+    optOutSignal,
+    envelope: {
+      event: {
+        eventId: value.eventId,
+        channel: "whatsapp" as const,
+        locale: "en" as const,
+        connectionState: "active" as const,
+        bindingId: value.bindingId,
+        conversationId: value.conversationId,
+        messageId: value.messageId,
+        receivedAt: CONFORMANCE_NOW,
+        state: "persisted" as const,
+        correlationId: `correlation_${suffix(scenario)}`,
+      },
+      conversation: {
+        id: value.conversationId,
+        channel: "whatsapp" as const,
+        locale: "en" as const,
+        status: "new" as const,
+        participantIds: [value.participantId],
+        version: 1,
+        createdAt: CONFORMANCE_NOW,
+        updatedAt: CONFORMANCE_NOW,
+        lastActivityAt: CONFORMANCE_NOW,
+      },
+      participant: {
+        participantId: value.participantId,
+        conversationId: value.conversationId,
+        bindingId: value.bindingId,
+        role: "external_contact" as const,
+        createdAt: CONFORMANCE_NOW,
+      },
+      message: {
+        id: value.messageId,
+        conversationId: value.conversationId,
+        channel: "whatsapp" as const,
+        direction: "inbound" as const,
+        senderParticipantId: value.participantId,
+        locale: "en" as const,
+        kind: "text" as const,
+        body: "SYNTHETIC-CONFORMANCE-PLAINTEXT-MUST-NOT-PERSIST",
+        createdAt: CONFORMANCE_NOW,
+      },
+    },
+  };
+}
+
+async function withHarness<T>(
+  factory: CommunicationsRepositoryHarnessFactory,
+  scenario: string,
+  work: (harness: CommunicationsRepositoryHarness) => Promise<T>,
+): Promise<T> {
+  const harness = await factory(scenario);
+  try {
+    return await work(harness);
+  } finally {
+    await harness.close?.();
+  }
+}
+
+async function queueOutbound(repository: CommunicationsRepository, scenario: string) {
+  const value = communicationsConformanceIds(scenario);
+  const templateId = `template_${suffix(scenario)}`;
+  await repository.acceptInbound(inbound(scenario));
+  const created = await repository.createOutbound({
+    command: {
+      commandId: value.commandId,
+      channel: "whatsapp",
+      locale: "en",
+      conversationId: value.conversationId,
+      bindingId: value.bindingId,
+      messageId: value.outboundMessageId,
+      idempotencyKey: `idempotency_${suffix(scenario)}`,
+      state: "draft",
+      createdAt: CONFORMANCE_NOW,
+      correlationId: `correlation_out_${suffix(scenario)}`,
+    },
+    message: {
+      id: value.outboundMessageId,
+      conversationId: value.conversationId,
+      channel: "whatsapp",
+      direction: "outbound",
+      senderParticipantId: `participant_system_${suffix(scenario)}`,
+      recipientParticipantId: value.participantId,
+      locale: "en",
+      kind: "text",
+      body: "SYNTHETIC-OUTBOUND-PLAINTEXT-MUST-NOT-PERSIST",
+      createdAt: CONFORMANCE_NOW,
+    },
+    purpose: "transactional",
+    templateId,
+  });
+  expect(created).toEqual({
+    status: "created",
+    commandId: value.commandId,
+    messageId: value.outboundMessageId,
+  });
+  await expect(
+    repository.finalizeOutbound({
+      commandId: value.commandId,
+      fingerprint: "c".repeat(64),
+      requiredPolicyVersion: 7,
+      requiredFence: 42,
+      endpointDigests: [{ version: "endpoint.v1", digest: "b".repeat(64) }],
+      authorizationReceipt: {
+        receiptId: `dispatch_${suffix(scenario)}`,
+        owner: "communications",
+        operation: "outbound_dispatch",
+        bindingId: value.bindingId,
+        destinationKey: "b".repeat(64),
+        issuedAt: CONFORMANCE_NOW,
+        expiresAt: CONFORMANCE_TOMORROW,
+      },
+      now: CONFORMANCE_NOW,
+    }),
+  ).resolves.toMatchObject({ status: "created", commandId: value.commandId });
+  return value;
+}
+
+export function runCommunicationsRepositoryConformance(
+  label: string,
+  factory: CommunicationsRepositoryHarnessFactory,
+  enabled = true,
+): void {
+  const suite = enabled ? describe : describe.skip;
+  suite(`${label} communications repository conformance`, () => {
+    it("atomically accepts metadata-only inbound, replays exact duplicates, and fences opt-out", async () => {
+      await withHarness(factory, `${label}-accept`, async ({ repository, inspectState }) => {
+        const command = inbound(`${label}-accept`, "pending");
+        await expect(repository.acceptInbound(command)).resolves.toMatchObject({
+          status: "accepted",
+          eventId: command.envelope.event.eventId,
+          endpointDigestVersion: "endpoint.v1",
+          endpointDigest: "b".repeat(64),
+        });
+        await expect(repository.acceptInbound(command)).resolves.toMatchObject({
+          status: "duplicate",
+          eventId: command.envelope.event.eventId,
+        });
+        await expect(
+          repository.acceptInbound({ ...command, providerBodyDigest: "d".repeat(64) }),
+        ).resolves.toEqual({
+          status: "replay_mismatch",
+          code: "provider_replay_mismatch",
+        });
+        const claim = await repository.claimInbound({
+          eventId: command.envelope.event.eventId,
+          leaseOwner: "inbound-owner-secret",
+          leaseExpiresAt: CONFORMANCE_LEASE_END,
+          now: CONFORMANCE_NOW,
+          requiredPolicyVersion: 8,
+        });
+        expect(claim).toMatchObject({ status: "claimed", policyState: "opt_out_pending" });
+        if (inspectState) {
+          const serialized = JSON.stringify(await inspectState());
+          expect(serialized).not.toContain("SYNTHETIC-CONFORMANCE-PLAINTEXT-MUST-NOT-PERSIST");
+          expect(serialized).not.toContain("inbound-owner-secret");
+        }
+      });
+    });
+
+    it("rejects non-finite, inactive, and overlong leases before claiming work", async () => {
+      for (const [caseName, leaseExpiresAt] of [
+        ["non-finite", new Date(Number.NaN)],
+        ["inactive", CONFORMANCE_NOW],
+        ["overlong", new Date(CONFORMANCE_NOW.getTime() + 15 * 60_000 + 1)],
+      ] as const) {
+        await withHarness(factory, `${label}-lease-${caseName}`, async ({ repository }) => {
+          const command = inbound(`${label}-lease-${caseName}`);
+          await repository.acceptInbound(command);
+          await expect(
+            repository.claimInbound({
+              eventId: command.envelope.event.eventId,
+              leaseOwner: "bounded-owner-secret",
+              leaseExpiresAt,
+              now: CONFORMANCE_NOW,
+              requiredPolicyVersion: 7,
+            }),
+          ).resolves.toEqual({ status: "not_claimed", code: "lease_conflict" });
+        });
+      }
+    });
+
+    it("requires the active lease owner and optimistic version for inbound completion", async () => {
+      await withHarness(factory, `${label}-completion`, async ({ repository }) => {
+        const command = inbound(`${label}-completion`);
+        await repository.acceptInbound(command);
+        const claimed = await repository.claimInbound({
+          eventId: command.envelope.event.eventId,
+          leaseOwner: "inbound-owner-secret",
+          leaseExpiresAt: CONFORMANCE_LEASE_END,
+          now: CONFORMANCE_NOW,
+          requiredPolicyVersion: 7,
+        });
+        expect(claimed.status).toBe("claimed");
+        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_INBOUND_NOT_CLAIMED");
+        await expect(
+          repository.completeInbound({
+            eventId: command.envelope.event.eventId,
+            leaseOwner: "wrong-owner-secret",
+            leaseVersion: claimed.leaseVersion,
+            outcome: "applied",
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toBe("conflict");
+        await expect(
+          repository.completeInbound({
+            eventId: command.envelope.event.eventId,
+            leaseOwner: "inbound-owner-secret",
+            leaseVersion: claimed.leaseVersion + 1,
+            outcome: "applied",
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toBe("conflict");
+        await expect(
+          repository.completeInbound({
+            eventId: command.envelope.event.eventId,
+            leaseOwner: "inbound-owner-secret",
+            leaseVersion: claimed.leaseVersion,
+            outcome: "applied",
+            now: CONFORMANCE_LEASE_END,
+          }),
+        ).resolves.toBe("conflict");
+        await expect(
+          repository.completeInbound({
+            eventId: command.envelope.event.eventId,
+            leaseOwner: "inbound-owner-secret",
+            leaseVersion: claimed.leaseVersion,
+            outcome: "applied",
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toBe("completed");
+      });
+    });
+
+    it("creates one durable attempt, stores no raw lease/provider/body values, and completes once", async () => {
+      await withHarness(factory, `${label}-dispatch`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-dispatch`;
+        const value = await queueOutbound(repository, scenario);
+        const claimed = await repository.claimOutbound({
+          commandId: value.commandId,
+          attemptId: `attempt_${suffix(scenario)}`,
+          leaseOwner: "outbound-owner-secret",
+          leaseExpiresAt: CONFORMANCE_LEASE_END,
+          now: CONFORMANCE_NOW,
+        });
+        expect(claimed).toMatchObject({ status: "claimed", attempt: { ordinal: 1, leaseVersion: 1 } });
+        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
+        await expect(
+          repository.markDispatchOutcome({
+            commandId: value.commandId,
+            attemptId: claimed.attempt.attemptId,
+            leaseOwner: "outbound-owner-secret",
+            leaseVersion: claimed.attempt.leaseVersion,
+            outcome: "accepted",
+            providerReference: "RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST",
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toBe("completed");
+        await expect(
+          repository.markDispatchOutcome({
+            commandId: value.commandId,
+            attemptId: claimed.attempt.attemptId,
+            leaseOwner: "outbound-owner-secret",
+            leaseVersion: claimed.attempt.leaseVersion,
+            outcome: "accepted",
+            providerReference: "RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST",
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toBe("completed");
+        if (inspectState) {
+          const serialized = JSON.stringify(await inspectState());
+          expect(serialized).not.toContain("SYNTHETIC-OUTBOUND-PLAINTEXT-MUST-NOT-PERSIST");
+          expect(serialized).not.toContain("outbound-owner-secret");
+          expect(serialized).not.toContain("RAW-PROVIDER-REFERENCE-MUST-NOT-PERSIST");
+        }
+      });
+    });
+
+    it("rechecks the current binding policy before creating a dispatch attempt", async () => {
+      await withHarness(factory, `${label}-policy-fence`, async ({ repository, inspectState }) => {
+        const scenario = `${label}-policy-fence`;
+        const value = await queueOutbound(repository, scenario);
+        await repository.withdrawContact({
+          bindingId: value.bindingId,
+          now: CONFORMANCE_NOW,
+          evidence: {
+            source: "authority",
+            receipt: {
+              receiptId: `withdrawal_${suffix(scenario)}`,
+              owner: "consent",
+              operation: "contact_withdrawal",
+              bindingId: value.bindingId,
+              issuedAt: CONFORMANCE_NOW,
+              expiresAt: CONFORMANCE_TOMORROW,
+              correlationId: `withdrawal_correlation_${suffix(scenario)}`,
+            },
+          },
+        });
+        await expect(
+          repository.claimOutbound({
+            commandId: value.commandId,
+            attemptId: `attempt_${suffix(scenario)}`,
+            leaseOwner: "outbound-owner-secret",
+            leaseExpiresAt: CONFORMANCE_LEASE_END,
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toEqual({ status: "not_claimed", code: "contact_policy_denied" });
+        if (inspectState) {
+          expect((await inspectState()).attempts).toHaveLength(0);
+        }
+      });
+    });
+
+    it("binds reconciliation receipts to the exact command and attempt", async () => {
+      await withHarness(factory, `${label}-reconciliation`, async ({ repository }) => {
+        const scenario = `${label}-reconciliation`;
+        const value = await queueOutbound(repository, scenario);
+        const attemptId = `attempt_${suffix(scenario)}`;
+        const claimed = await repository.claimOutbound({
+          commandId: value.commandId,
+          attemptId,
+          leaseOwner: "outbound-owner-secret",
+          leaseExpiresAt: CONFORMANCE_LEASE_END,
+          now: CONFORMANCE_NOW,
+        });
+        if (claimed.status !== "claimed") throw new Error("CONFORMANCE_OUTBOUND_NOT_CLAIMED");
+        await repository.markDispatchOutcome({
+          commandId: value.commandId,
+          attemptId,
+          leaseOwner: "outbound-owner-secret",
+          leaseVersion: claimed.attempt.leaseVersion,
+          outcome: "unknown",
+          now: CONFORMANCE_NOW,
+        });
+        const receipt = {
+          receiptId: `reconcile_${suffix(scenario)}`,
+          owner: "communications" as const,
+          operation: "dispatch_reconciliation" as const,
+          source: "provider_lookup" as const,
+          bindingId: value.bindingId,
+          commandId: value.commandId,
+          attemptId,
+          outcome: "confirmed_not_sent" as const,
+          issuedAt: CONFORMANCE_NOW,
+          expiresAt: CONFORMANCE_TOMORROW,
+          correlationId: `correlation_out_${suffix(scenario)}`,
+        };
+        await expect(
+          repository.reconcileOutbound({
+            commandId: value.commandId,
+            attemptId,
+            receipt: { ...receipt, attemptId: "attempt_wrong" },
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toMatchObject({ status: "denied", code: "reconciliation_receipt_invalid" });
+        await expect(
+          repository.reconcileOutbound({
+            commandId: value.commandId,
+            attemptId,
+            receipt,
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toEqual({ status: "reconciled", commandState: "confirmed_not_sent" });
+        await expect(
+          repository.reconcileOutbound({
+            commandId: value.commandId,
+            attemptId,
+            receipt,
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toEqual({ status: "duplicate", commandState: "confirmed_not_sent" });
+        await expect(
+          repository.reconcileOutbound({
+            commandId: value.commandId,
+            attemptId,
+            receipt: { ...receipt, outcome: "terminal_failure" },
+            now: CONFORMANCE_NOW,
+          }),
+        ).resolves.toEqual({ status: "conflict", code: "reconciliation_receipt_mismatch" });
+      });
+    });
+  });
+}
```
