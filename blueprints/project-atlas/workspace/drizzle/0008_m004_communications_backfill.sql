-- Drizzle custom migration generated with:
-- drizzle-kit generate --custom --name m004_communications_backfill
--
-- Preparatory forward-only copy. M003 tables, foreign keys and read/write paths remain intact.

LOCK TABLE
  public_chat_conversations,
  public_chat_messages,
  public_chat_handoffs,
  public_chat_audit_events
IN SHARE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM communication_conversations LIMIT 1)
    OR EXISTS (SELECT 1 FROM communication_participants LIMIT 1)
    OR EXISTS (SELECT 1 FROM public_chat_conversation_sessions LIMIT 1)
    OR EXISTS (SELECT 1 FROM communication_messages LIMIT 1)
    OR EXISTS (SELECT 1 FROM communication_handoffs LIMIT 1)
    OR EXISTS (SELECT 1 FROM communication_audit_events LIMIT 1)
  THEN
    RAISE EXCEPTION 'M004_BACKFILL_TARGET_NOT_EMPTY';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public_chat_audit_events
    WHERE event_name NOT IN (
      'chat_conversation_started', 'chat_message_accepted', 'chat_message_rejected',
      'chat_response_failed', 'chat_handoff_requested', 'chat_handoff_queued',
      'chat_locale_changed', 'chat_conversation_closed'
    )
  ) THEN
    RAISE EXCEPTION 'M004_BACKFILL_INCOMPATIBLE_AUDIT_EVENT';
  END IF;
END
$$;
--> statement-breakpoint
INSERT INTO communication_conversations (
  id, channel_kind, locale, status, version, correlation_id, last_activity_at, expires_at,
  closed_at, reconciliation_required, created_at, updated_at
)
SELECT id, 'public_web', locale, status, version, correlation_id, last_activity_at, expires_at,
  closed_at, reconciliation_required, created_at, updated_at
FROM public_chat_conversations;
--> statement-breakpoint
WITH expected_participants AS (
  SELECT c.id AS conversation_id, 'external'::varchar(16) AS participant_kind,
    c.created_at AS joined_at, c.updated_at
  FROM public_chat_conversations c
  UNION
  SELECT m.conversation_id,
    CASE m.actor
      WHEN 'visitor' THEN 'external'::varchar(16)
      WHEN 'assistant' THEN 'automated'::varchar(16)
      WHEN 'human' THEN 'human'::varchar(16)
      WHEN 'system' THEN 'system'::varchar(16)
    END,
    min(m.created_at), max(c.updated_at)
  FROM public_chat_messages m
  JOIN public_chat_conversations c ON c.id = m.conversation_id
  GROUP BY m.conversation_id, m.actor
)
INSERT INTO communication_participants (
  id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
  created_at, updated_at
)
SELECT 'participant_' || md5(conversation_id || ':' || participant_kind), conversation_id,
  'public_web', participant_kind, NULL, min(joined_at), NULL, min(joined_at), max(updated_at)
FROM expected_participants
GROUP BY conversation_id, participant_kind;
--> statement-breakpoint
INSERT INTO public_chat_conversation_sessions (
  id, conversation_id, channel_kind, session_id, participant_id, notice_version,
  start_idempotency_key, start_fingerprint, created_at, updated_at
)
SELECT 'session_link_' || md5(c.id), c.id, 'public_web', c.session_id,
  'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
  c.start_fingerprint, c.created_at, c.updated_at
FROM public_chat_conversations c;
--> statement-breakpoint
INSERT INTO communication_messages (
  id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
  recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
  actions, rejection_reason, external_message_reference, created_at
)
SELECT m.id, m.conversation_id, 'public_web', m.ordinal + 1,
  CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
    WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
  'participant_' || md5(m.conversation_id || ':' || CASE m.actor
    WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
    WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
  NULL, c.locale,
  CASE WHEN m.actor = 'system' THEN 'system'
    WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
  m.state, m.body, m.body_stored,
  CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
  m.actions, m.rejection_reason, NULL, m.created_at
FROM public_chat_messages m
JOIN public_chat_conversations c ON c.id = m.conversation_id;
--> statement-breakpoint
INSERT INTO communication_handoffs (
  id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
  assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
)
SELECT h.id, h.conversation_id, 'public_web',
  CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
  h.reason, h.receipt_id, c.correlation_id, NULL, h.requested_at, h.queued_at, NULL, NULL,
  h.updated_at
FROM public_chat_handoffs h
JOIN public_chat_conversations c ON c.id = h.conversation_id;
--> statement-breakpoint
INSERT INTO communication_audit_events (
  id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
  result_code, reason_code, version, locale, purpose, policy_version, correlation_id,
  occurred_at, created_at
)
SELECT a.id, a.sequence, a.conversation_id, 'public_web', a.event_name,
  CASE a.event_name
    WHEN 'chat_message_accepted' THEN 'message' WHEN 'chat_message_rejected' THEN 'message'
    WHEN 'chat_response_failed' THEN 'message' WHEN 'chat_handoff_requested' THEN 'handoff'
    WHEN 'chat_handoff_queued' THEN 'handoff' ELSE 'conversation' END,
  CASE
    WHEN a.event_name IN ('chat_message_accepted', 'chat_message_rejected', 'chat_response_failed')
      THEN COALESCE((SELECT m.id FROM public_chat_messages m
        WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
        ORDER BY m.ordinal LIMIT 1), a.conversation_id)
    WHEN a.event_name IN ('chat_handoff_requested', 'chat_handoff_queued')
      THEN COALESCE((SELECT h.id FROM public_chat_handoffs h
        WHERE h.conversation_id = a.conversation_id ORDER BY h.requested_at LIMIT 1), a.conversation_id)
    ELSE a.conversation_id
  END,
  CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
    WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
    WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
    WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
    WHEN 'chat_conversation_closed' THEN 'closed' END,
  a.reason, a.version, a.locale, NULL, NULL, a.correlation_id, a.created_at, a.created_at
FROM public_chat_audit_events a;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    (SELECT id, 'public_web'::varchar(16), locale, status, version, correlation_id,
      last_activity_at, expires_at, closed_at, reconciliation_required, created_at, updated_at
     FROM public_chat_conversations)
    EXCEPT
    (SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
      expires_at, closed_at, reconciliation_required, created_at, updated_at
     FROM communication_conversations WHERE channel_kind = 'public_web')
  ) OR EXISTS (
    (SELECT id, channel_kind, locale, status, version, correlation_id, last_activity_at,
      expires_at, closed_at, reconciliation_required, created_at, updated_at
     FROM communication_conversations WHERE channel_kind = 'public_web')
    EXCEPT
    (SELECT id, 'public_web'::varchar(16), locale, status, version, correlation_id,
      last_activity_at, expires_at, closed_at, reconciliation_required, created_at, updated_at
     FROM public_chat_conversations)
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: conversations'; END IF;

  IF EXISTS (
    (SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id,
      'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
      c.start_fingerprint, c.created_at, c.updated_at FROM public_chat_conversations c)
    EXCEPT
    (SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
      start_idempotency_key, start_fingerprint, created_at, updated_at
     FROM public_chat_conversation_sessions)
  ) OR EXISTS (
    (SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version,
      start_idempotency_key, start_fingerprint, created_at, updated_at
     FROM public_chat_conversation_sessions)
    EXCEPT
    (SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id,
      'participant_' || md5(c.id || ':external'), c.notice_version, c.start_idempotency_key,
      c.start_fingerprint, c.created_at, c.updated_at FROM public_chat_conversations c)
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: public session ownership'; END IF;

  IF EXISTS (
    WITH candidates AS (
      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
        c.created_at AS joined_at, c.updated_at FROM public_chat_conversations c
      UNION
      SELECT m.conversation_id,
        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
        m.created_at, c.updated_at
      FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id
    ), expected AS (
      SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
        'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
        min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
        max(updated_at) AS updated_at
      FROM candidates GROUP BY conversation_id, kind
    )
    SELECT * FROM expected
    EXCEPT
    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
      created_at, updated_at FROM communication_participants WHERE channel_kind = 'public_web'
  ) OR EXISTS (
    WITH candidates AS (
      SELECT c.id AS conversation_id, 'external'::varchar(16) AS kind,
        c.created_at AS joined_at, c.updated_at FROM public_chat_conversations c
      UNION
      SELECT m.conversation_id,
        CASE m.actor WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
          WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END::varchar(16),
        m.created_at, c.updated_at
      FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id
    ), expected AS (
      SELECT 'participant_' || md5(conversation_id || ':' || kind) AS id, conversation_id,
        'public_web'::varchar(16) AS channel_kind, kind, NULL::text AS channel_binding_id,
        min(joined_at) AS joined_at, NULL::timestamptz AS left_at, min(joined_at) AS created_at,
        max(updated_at) AS updated_at
      FROM candidates GROUP BY conversation_id, kind
    )
    SELECT id, conversation_id, channel_kind, kind, channel_binding_id, joined_at, left_at,
      created_at, updated_at FROM communication_participants WHERE channel_kind = 'public_web'
    EXCEPT
    SELECT * FROM expected
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: participants'; END IF;

  IF EXISTS (
    (SELECT m.id, m.conversation_id, m.ordinal + 1,
      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
      NULL::text, c.locale, CASE WHEN m.actor = 'system' THEN 'system'
        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
      m.state, m.body, m.body_stored,
      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
      m.actions, m.rejection_reason, NULL::text, m.created_at
     FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id)
    EXCEPT
    (SELECT id, conversation_id, ordinal, direction, sender_participant_id,
      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
      actions, rejection_reason, external_message_reference, created_at
     FROM communication_messages WHERE channel_kind = 'public_web')
  ) OR EXISTS (
    (SELECT id, conversation_id, ordinal, direction, sender_participant_id,
      recipient_participant_id, locale, kind, state, body, body_stored, body_retention_policy,
      actions, rejection_reason, external_message_reference, created_at
     FROM communication_messages WHERE channel_kind = 'public_web')
    EXCEPT
    (SELECT m.id, m.conversation_id, m.ordinal + 1,
      CASE m.actor WHEN 'visitor' THEN 'inbound' WHEN 'assistant' THEN 'outbound'
        WHEN 'human' THEN 'outbound' WHEN 'system' THEN 'system' END,
      'participant_' || md5(m.conversation_id || ':' || CASE m.actor
        WHEN 'visitor' THEN 'external' WHEN 'assistant' THEN 'automated'
        WHEN 'human' THEN 'human' WHEN 'system' THEN 'system' END),
      NULL::text, c.locale, CASE WHEN m.actor = 'system' THEN 'system'
        WHEN jsonb_array_length(m.actions) > 0 THEN 'interactive' ELSE 'text' END,
      m.state, m.body, m.body_stored,
      CASE WHEN m.body_stored THEN 'approved' ELSE 'metadata_only' END,
      m.actions, m.rejection_reason, NULL::text, m.created_at
     FROM public_chat_messages m JOIN public_chat_conversations c ON c.id = m.conversation_id)
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: messages'; END IF;

  IF EXISTS (
    (SELECT h.id, h.conversation_id,
      CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
      h.reason, h.receipt_id, c.correlation_id, NULL::text, h.requested_at, h.queued_at,
      NULL::timestamptz, NULL::timestamptz, h.updated_at
     FROM public_chat_handoffs h JOIN public_chat_conversations c ON c.id = h.conversation_id)
    EXCEPT
    (SELECT id, conversation_id, state, reason_code, receipt_id, correlation_id,
      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
     FROM communication_handoffs WHERE channel_kind = 'public_web')
  ) OR EXISTS (
    (SELECT id, conversation_id, state, reason_code, receipt_id, correlation_id,
      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
     FROM communication_handoffs WHERE channel_kind = 'public_web')
    EXCEPT
    (SELECT h.id, h.conversation_id,
      CASE h.status WHEN 'human_requested' THEN 'requested' WHEN 'waiting_for_human' THEN 'queued' END,
      h.reason, h.receipt_id, c.correlation_id, NULL::text, h.requested_at, h.queued_at,
      NULL::timestamptz, NULL::timestamptz, h.updated_at
     FROM public_chat_handoffs h JOIN public_chat_conversations c ON c.id = h.conversation_id)
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: handoffs'; END IF;

  IF EXISTS (
    (SELECT a.id, a.sequence, a.conversation_id, a.event_name,
      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
        WHEN 'chat_handoff_requested' THEN 'handoff' WHEN 'chat_handoff_queued' THEN 'handoff'
        ELSE 'conversation' END,
      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
        THEN COALESCE((SELECT m.id FROM public_chat_messages m
          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
        THEN COALESCE((SELECT h.id FROM public_chat_handoffs h WHERE h.conversation_id = a.conversation_id
          ORDER BY h.requested_at LIMIT 1), a.conversation_id) ELSE a.conversation_id END,
      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
        WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
        WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
        WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
        WHEN 'chat_conversation_closed' THEN 'closed' END,
      a.reason, a.version, a.locale, NULL::varchar(24), NULL::integer,
      a.correlation_id, a.created_at, a.created_at
     FROM public_chat_audit_events a)
    EXCEPT
    (SELECT id, sequence, conversation_id, event_name, aggregate_type, aggregate_id, result_code,
      reason_code, version, locale, purpose, policy_version, correlation_id, occurred_at, created_at
     FROM communication_audit_events WHERE channel_kind = 'public_web')
  ) OR EXISTS (
    (SELECT id, sequence, conversation_id, event_name, aggregate_type, aggregate_id, result_code,
      reason_code, version, locale, purpose, policy_version, correlation_id, occurred_at, created_at
     FROM communication_audit_events WHERE channel_kind = 'public_web')
    EXCEPT
    (SELECT a.id, a.sequence, a.conversation_id, a.event_name,
      CASE a.event_name WHEN 'chat_message_accepted' THEN 'message'
        WHEN 'chat_message_rejected' THEN 'message' WHEN 'chat_response_failed' THEN 'message'
        WHEN 'chat_handoff_requested' THEN 'handoff' WHEN 'chat_handoff_queued' THEN 'handoff'
        ELSE 'conversation' END,
      CASE WHEN a.event_name IN ('chat_message_accepted','chat_message_rejected','chat_response_failed')
        THEN COALESCE((SELECT m.id FROM public_chat_messages m
          WHERE m.conversation_id = a.conversation_id AND m.created_at = a.created_at
          ORDER BY m.ordinal LIMIT 1), a.conversation_id)
        WHEN a.event_name IN ('chat_handoff_requested','chat_handoff_queued')
        THEN COALESCE((SELECT h.id FROM public_chat_handoffs h WHERE h.conversation_id = a.conversation_id
          ORDER BY h.requested_at LIMIT 1), a.conversation_id) ELSE a.conversation_id END,
      CASE a.event_name WHEN 'chat_conversation_started' THEN 'new'
        WHEN 'chat_message_accepted' THEN 'accepted' WHEN 'chat_message_rejected' THEN 'rejected'
        WHEN 'chat_response_failed' THEN 'failed' WHEN 'chat_handoff_requested' THEN 'requested'
        WHEN 'chat_handoff_queued' THEN 'queued' WHEN 'chat_locale_changed' THEN 'accepted'
        WHEN 'chat_conversation_closed' THEN 'closed' END,
      a.reason, a.version, a.locale, NULL::varchar(24), NULL::integer,
      a.correlation_id, a.created_at, a.created_at
     FROM public_chat_audit_events a)
  ) THEN RAISE EXCEPTION 'M004_BACKFILL_PARITY_FAILED: audit'; END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = current_user AND (rolsuper OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS';
  END IF;
END
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION atlas_bootstrap_public_chat_conversation(
  public_chat_session_id text,
  conversation_id text,
  participant_id text,
  session_link_id text,
  locale varchar(2),
  correlation_id text,
  notice_version varchar(80),
  start_idempotency_key varchar(128),
  start_fingerprint char(64),
  occurred_at timestamptz,
  expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  scoped_session_id text := nullif(current_setting('atlas.public_chat_session_id', true), '');
BEGIN
  IF scoped_session_id IS NULL OR scoped_session_id <> public_chat_session_id THEN
    RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_SESSION_MISMATCH';
  END IF;
  IF conversation_id = '' OR participant_id = '' OR session_link_id = ''
    OR start_fingerprint !~ '^[0-9a-f]{64}$' OR expires_at <= occurred_at
  THEN RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_INPUT_INVALID'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.public_chat_sessions s
    WHERE s.id = scoped_session_id AND s.revoked_at IS NULL AND s.expires_at > occurred_at
  ) THEN RAISE EXCEPTION 'PUBLIC_CHAT_BOOTSTRAP_SESSION_INVALID'; END IF;

  INSERT INTO public.communication_conversations (
    id, channel_kind, locale, status, version, correlation_id, last_activity_at, expires_at,
    reconciliation_required, created_at, updated_at
  ) VALUES (
    conversation_id, 'public_web', locale, 'new', 1, correlation_id, occurred_at, expires_at,
    false, occurred_at, occurred_at
  );
  INSERT INTO public.communication_participants (
    id, conversation_id, channel_kind, kind, joined_at, created_at, updated_at
  ) VALUES (
    participant_id, conversation_id, 'public_web', 'external', occurred_at, occurred_at, occurred_at
  );
  INSERT INTO public.public_chat_conversation_sessions (
    id, conversation_id, channel_kind, session_id, participant_id, notice_version,
    start_idempotency_key, start_fingerprint, created_at, updated_at
  ) VALUES (
    session_link_id, conversation_id, 'public_web', scoped_session_id, participant_id,
    notice_version, start_idempotency_key, start_fingerprint, occurred_at, occurred_at
  );
  INSERT INTO public.communication_audit_events (
    id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
    result_code, version, locale, correlation_id, occurred_at, created_at
  ) VALUES (
    'audit_' || md5(conversation_id || ':bootstrap'), 1, conversation_id, 'public_web',
    'chat_conversation_started', 'conversation', conversation_id, 'new', 1, locale,
    correlation_id, occurred_at, occurred_at
  );
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION atlas_bootstrap_public_chat_conversation(
  text, text, text, text, varchar, text, varchar, varchar, char, timestamptz, timestamptz
) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION atlas_bootstrap_public_chat_conversation(
  text, text, text, text, varchar, text, varchar, varchar, char, timestamptz, timestamptz
) TO atlas_public_chat_gateway;
--> statement-breakpoint
ALTER TABLE "communication_channel_connections" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_contact_bindings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_contact_evidence_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_contact_policies" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_conversations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_participants" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public_chat_conversation_sessions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_messages" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_provider_event_receipts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_event_envelopes" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_message_templates" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_outbound_commands" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_dispatch_attempts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_handoffs" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "communication_audit_events" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE
  "communication_channel_connections", "communication_contact_bindings",
  "communication_contact_evidence_events", "communication_contact_policies",
  "communication_conversations", "communication_participants",
  "public_chat_conversation_sessions", "communication_messages",
  "communication_provider_event_receipts", "communication_event_envelopes",
  "communication_message_templates", "communication_outbound_commands",
  "communication_dispatch_attempts", "communication_handoffs", "communication_audit_events"
FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE browser_role text; communication_table text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
      FOREACH communication_table IN ARRAY ARRAY[
        'communication_channel_connections', 'communication_contact_bindings',
        'communication_contact_evidence_events', 'communication_contact_policies',
        'communication_conversations', 'communication_participants',
        'public_chat_conversation_sessions', 'communication_messages',
        'communication_provider_event_receipts', 'communication_event_envelopes',
        'communication_message_templates', 'communication_outbound_commands',
        'communication_dispatch_attempts', 'communication_handoffs', 'communication_audit_events'
      ] LOOP
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', communication_table, browser_role);
      END LOOP;
    END IF;
  END LOOP;
END
$$;
--> statement-breakpoint
REVOKE ALL ON TABLE
  "communication_channel_connections", "communication_contact_bindings",
  "communication_contact_evidence_events", "communication_contact_policies",
  "communication_conversations", "communication_participants",
  "public_chat_conversation_sessions", "communication_messages",
  "communication_provider_event_receipts", "communication_event_envelopes",
  "communication_message_templates", "communication_outbound_commands",
  "communication_dispatch_attempts", "communication_handoffs", "communication_audit_events"
FROM atlas_public_chat_gateway, atlas_communications_gateway;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO atlas_public_chat_gateway, atlas_communications_gateway;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE
  "communication_conversations", "communication_participants", "communication_messages",
  "communication_handoffs"
TO atlas_public_chat_gateway, atlas_communications_gateway;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "communication_audit_events"
TO atlas_public_chat_gateway, atlas_communications_gateway;
--> statement-breakpoint
GRANT SELECT ON TABLE "public_chat_conversation_sessions"
TO atlas_public_chat_gateway;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE
  "communication_channel_connections", "communication_contact_bindings",
  "communication_contact_policies", "communication_provider_event_receipts",
  "communication_message_templates", "communication_outbound_commands",
  "communication_dispatch_attempts"
TO atlas_communications_gateway;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE
  "communication_contact_evidence_events", "communication_event_envelopes"
TO atlas_communications_gateway;
