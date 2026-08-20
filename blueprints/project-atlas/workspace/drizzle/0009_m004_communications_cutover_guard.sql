-- Drizzle custom migration generated with:
-- drizzle-kit generate --custom --name m004_communications_cutover_guard
--
-- Forward-only cutover gate. It proves complete bidirectional M003/canonical parity while all
-- sources are locked, then moves the two retained child foreign keys to canonical parents.
-- No source table or row is removed here; generated migration 0010 owns the guarded removal.

LOCK TABLE
  public_chat_conversations,
  public_chat_messages,
  public_chat_handoffs,
  public_chat_audit_events,
  public_chat_citations,
  public_chat_idempotency,
  communication_conversations,
  communication_participants,
  public_chat_conversation_sessions,
  communication_messages,
  communication_handoffs,
  communication_audit_events,
  communication_outbound_commands
IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  -- Task 8 introduces required owner-receipt provenance. Existing commands cannot be assigned
  -- truthful receipt times/correlation by inference, so contract instead of fabricating evidence.
  IF EXISTS (SELECT 1 FROM communication_outbound_commands LIMIT 1) THEN
    RAISE EXCEPTION 'M004_CUTOVER_OUTBOUND_RECEIPT_BACKFILL_REQUIRED';
  END IF;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  expected_payload jsonb;
  actual_payload jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    SELECT id, 'public_web'::varchar(16) AS channel_kind, locale, status, version,
      correlation_id, last_activity_at, expires_at, closed_at, reconciliation_required,
      created_at, updated_at
    FROM public_chat_conversations
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
      expires_at, closed_at, reconciliation_required, created_at, updated_at
    FROM communication_conversations WHERE channel_kind = 'public_web'
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: conversations';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    SELECT 'session_link_' || md5(c.id) AS id, c.id AS conversation_id,
      'public_web'::varchar(16) AS channel_kind, c.session_id,
      'participant_' || md5(c.id || ':external') AS participant_id, c.notice_version,
      c.start_idempotency_key, c.start_fingerprint, c.created_at, c.updated_at
    FROM public_chat_conversations c
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
      start_idempotency_key, start_fingerprint, created_at, updated_at
    FROM public_chat_conversation_sessions
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: public session ownership';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    WITH candidates AS (
      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
        c.created_at AS joined_at, c.updated_at
      FROM public_chat_conversations c
      UNION
      SELECT m.conversation_id,
        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
        m.created_at, c.updated_at
      FROM public_chat_messages m
      JOIN public_chat_conversations c ON c.id = m.conversation_id
    )
    SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
      'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
      min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
      max(updated_at) AS updated_at
    FROM candidates GROUP BY conversation_id, kind
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
      created_at, updated_at
    FROM communication_participants WHERE channel_kind = 'public_web'
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: participants';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    SELECT m.id, m.conversation_id, 'public_web'::varchar(16) AS channel_kind, m.ordinal + 1 AS ordinal,
      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END AS direction,
      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END) AS sender_participant_id,
      NULL::text AS recipient_participant_id, c.locale,
      CASE WHEN m.actor = 'system' THEN 'system'
        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END AS kind,
      m.state, m.body, m.body_stored,
      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END AS body_retention_policy,
      m.actions, m.rejection_reason, NULL::text AS external_message_reference, m.created_at
    FROM public_chat_messages m
    JOIN public_chat_conversations c ON c.id = m.conversation_id
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
      actions, rejection_reason, external_message_reference, created_at
    FROM communication_messages WHERE channel_kind = 'public_web'
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: messages';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    SELECT h.id, h.conversation_id, 'public_web'::varchar(16) AS channel_kind,
      CASE h.status WHEN 'human_requested' THEN 'requested'
        WHEN 'waiting_for_human' THEN 'queued' END AS state,
      h.reason AS reason_code, h.receipt_id, c.correlation_id,
      NULL::text AS assigned_participant_id, h.requested_at, h.queued_at,
      NULL::timestamptz AS accepted_at, NULL::timestamptz AS closed_at, h.updated_at
    FROM public_chat_handoffs h
    JOIN public_chat_conversations c ON c.id = h.conversation_id
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
    FROM communication_handoffs WHERE channel_kind = 'public_web'
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: handoffs';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(expected_row) ORDER BY id), '[]'::jsonb)
  INTO expected_payload
  FROM (
    SELECT a.id, a.sequence, a.conversation_id, 'public_web'::varchar(16) AS channel_kind,
      a.event_name,
      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
        WHEN 'chat_handoff_requested' THEN 'handoff'
        WHEN 'chat_handoff_queued' THEN 'handoff' ELSE 'conversation' END AS aggregate_type,
      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
        THEN coalesce((SELECT m.id FROM public_chat_messages m
          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
        THEN coalesce((SELECT h.id FROM public_chat_handoffs h
          WHERE h.conversation_id = a.conversation_id ORDER BY h.requested_at LIMIT 1),
          a.conversation_id) ELSE a.conversation_id END AS aggregate_id,
      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
        WHEN 'chat_message_accepted' THEN 'accepted'
        WHEN 'chat_message_rejected' THEN 'rejected'
        WHEN 'chat_response_failed' THEN 'failed'
        WHEN 'chat_handoff_requested' THEN 'requested'
        WHEN 'chat_handoff_queued' THEN 'queued'
        WHEN 'chat_locale_changed' THEN 'accepted'
        WHEN 'chat_conversation_closed' THEN 'closed' END AS result_code,
      a.reason AS reason_code, a.version, a.locale, NULL::varchar(24) AS purpose,
      NULL::integer AS policy_version, a.correlation_id, a.created_at AS occurred_at,
      a.created_at
    FROM public_chat_audit_events a
  ) expected_row;
  SELECT coalesce(jsonb_agg(to_jsonb(actual_row) ORDER BY id), '[]'::jsonb)
  INTO actual_payload
  FROM (
    SELECT id, sequence, conversation_id, channel_kind, event_name, aggregate_type,
      aggregate_id, result_code, reason_code, version, locale, purpose, policy_version,
      correlation_id, occurred_at, created_at
    FROM communication_audit_events WHERE channel_kind = 'public_web'
  ) actual_row;
  IF expected_payload IS DISTINCT FROM actual_payload THEN
    RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: audit';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public_chat_citations citation
    LEFT JOIN public_chat_messages legacy ON legacy.id = citation.message_id
    LEFT JOIN communication_messages canonical
      ON canonical.id = citation.message_id AND canonical.channel_kind = 'public_web'
    WHERE legacy.id IS NULL OR canonical.id IS NULL
  ) THEN RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: citation references'; END IF;

  IF EXISTS (
    SELECT 1 FROM public_chat_idempotency command
    LEFT JOIN public_chat_conversations legacy ON legacy.id = command.conversation_id
    LEFT JOIN communication_conversations canonical
      ON canonical.id = command.conversation_id AND canonical.channel_kind = 'public_web'
    WHERE legacy.id IS NULL OR canonical.id IS NULL
  ) THEN RAISE EXCEPTION 'M004_CUTOVER_PARITY_FAILED: idempotency references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_depend dependency
    JOIN pg_class legacy_table ON legacy_table.oid = dependency.refobjid
    LEFT JOIN pg_constraint dependent_constraint
      ON dependency.classid = 'pg_constraint'::regclass
      AND dependent_constraint.oid = dependency.objid
    WHERE legacy_table.relnamespace = 'public'::regnamespace
      AND legacy_table.relname IN (
        'public_chat_conversations',
        'public_chat_messages',
        'public_chat_handoffs',
        'public_chat_audit_events'
      )
      AND dependency.deptype NOT IN ('a', 'i', 'e')
      AND coalesce(dependent_constraint.conname, '') NOT IN (
        'public_chat_citations_message_id_public_chat_messages_id_fk',
        'public_chat_idempotency_conversation_id_public_chat_conversations_id_fk'
      )
  ) THEN
    RAISE EXCEPTION 'M004_CUTOVER_UNEXPECTED_DEPENDENCY';
  END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "public_chat_citations"
  DROP CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "public_chat_citations"
  ADD CONSTRAINT "public_chat_citations_message_id_public_chat_messages_id_fk"
  FOREIGN KEY ("message_id") REFERENCES "public"."communication_messages"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "public_chat_idempotency"
  DROP CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "public_chat_idempotency"
  ADD CONSTRAINT "public_chat_idempotency_conversation_id_public_chat_conversations_id_fk"
  FOREIGN KEY ("conversation_id") REFERENCES "public"."communication_conversations"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
