import type {
  AuditEvent,
  ChatCommandResult,
  ChatLocale,
  ChatReasonCode,
  ClaimedCommandAdvance,
  CommandCompletion,
  ConversationStatus,
  PublicChatAction,
  PublicChatConversation,
  PublicChatMessage,
  PublicCitation,
} from "@atlas/domain";
import postgres from "postgres";
import { z } from "zod";
import type {
  PublicChatTransactionalStore,
  TranscriptPersistence,
} from "./public-chat-repository.ts";

type TransactionSql = postgres.TransactionSql<Record<string, never>>;
export type PublicChatSql = postgres.Sql<Record<string, never>>;

export function createPublicChatSql(databaseUrl: string): PublicChatSql {
  return postgres(databaseUrl, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

async function withGatewayTransaction<T>(
  sql: postgres.Sql<Record<string, never>>,
  work: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    const principals = await tx<
      Array<{ is_member: boolean; rolbypassrls: boolean; rolsuper: boolean }>
    >`
      select
        pg_has_role(session_user, 'atlas_public_chat_gateway', 'member') as is_member,
        roles.rolbypassrls,
        roles.rolsuper
      from pg_roles roles
      where roles.rolname = session_user
      limit 1
    `;
    const principal = principals[0];
    if (!principal?.is_member || principal.rolbypassrls || principal.rolsuper) {
      throw new Error("PUBLIC_CHAT_DATABASE_PRINCIPAL_UNSAFE");
    }
    await tx.unsafe("set local role atlas_public_chat_gateway");
    return work(tx);
  }) as Promise<T>;
}

async function setPublicChatScope(tx: TransactionSql, sessionId: string): Promise<void> {
  await tx`select set_config('atlas.public_chat_session_id', ${sessionId}, true)`;
}

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
  created_at: Date;
  updated_at: Date;
  last_activity_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  closed_at: Date | null;
  handoff_receipt_id: string | null;
  handoff_reason: PublicChatConversation["handoffReason"] | null;
  handoff_queued_at: Date | null;
};

type MessageRow = {
  id: string;
  actor: PublicChatMessage["actor"];
  body: string | null;
  body_stored: boolean;
  state: PublicChatMessage["state"];
  actions: PublicChatAction[];
  created_at: Date;
};

type CitationRow = {
  message_id: string;
  source_id: string;
  title: string;
  path: string;
  locale: ChatLocale;
  summary: string;
  disclosure: string;
  source_kind: "provider" | null;
};

type CommandRow = {
  state: "in_progress" | "completed";
  lease_token_hash: string;
  lease_expires_at: Date;
  result: unknown;
  lease_active: boolean;
  expected_version: number;
  command_kind: "message" | "handoff" | "locale" | "close";
  command_fingerprint: string;
};

function commandId(conversationId: string, idempotencyKey: string): string {
  return `command:${conversationId}:${idempotencyKey}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const actionSchema = z
  .object({
    key: z.enum(["help_center", "human_support"]),
    path: z.string().startsWith("/").max(240),
  })
  .strict();
const citationSchema = z
  .object({
    sourceId: z.string().min(1).max(240),
    title: z.string().min(1).max(500),
    path: z.string().startsWith("/").max(240),
    locale: z.enum(["es", "en"]),
    summary: z.string().max(2_000),
    disclosure: z.string().max(2_000),
    sourceKind: z.literal("provider").nullable(),
  })
  .strict();
const messageSchema = z
  .object({
    id: z.string().min(1).max(240),
    actor: z.enum(["visitor", "assistant", "human", "system"]),
    body: z.string().max(4_000).nullable(),
    state: z.enum(["accepted", "answered", "failed", "handoff_required"]),
    citations: z.array(citationSchema).max(10),
    actions: z.array(actionSchema).max(4),
    createdAt: z.iso.datetime().transform((value) => new Date(value)),
  })
  .strict();
const projectionSchema = z
  .object({
    id: z.string().min(1).max(240),
    version: z.number().int().positive().max(2_147_483_647),
    locale: z.enum(["es", "en"]),
    status: z.enum([
      "new",
      "ai_active",
      "human_requested",
      "waiting_for_human",
      "human_active",
      "returned_to_ai",
      "closed",
      "expired",
      "restricted",
    ]),
    messages: z.array(messageSchema).max(200),
    expiresAt: z.iso.datetime().transform((value) => new Date(value)),
  })
  .strict();
const reasonSchema = z.enum([
  "ambiguous",
  "government_identifier",
  "payment_card",
  "bank_account",
  "credential",
  "markup",
  "abuse",
  "safety",
  "policy_required",
  "visitor_requested",
  "complaint",
  "assistant_unavailable",
  "disabled",
  "timeout",
  "provider_error",
  "response_invalid",
  "response_rejected",
  "unknown",
]);
const commandResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), projection: projectionSchema, replayed: z.boolean() }).strict(),
  z
    .object({
      ok: z.literal(false),
      code: z.enum([
        "not_found",
        "expired",
        "revoked",
        "conflict",
        "command_in_progress",
        "conversation_limit_reached",
        "invalid_transition",
        "human_active",
        "content_rejected",
        "moderation_unavailable",
        "knowledge_unavailable",
        "assistant_unavailable",
        "clarification_required",
        "handoff_required",
        "handoff_unavailable",
      ]),
      reason: reasonSchema.optional(),
      projection: projectionSchema.optional(),
    })
    .strict(),
]);
const persistedCommandResultSchema = z
  .object({ schemaVersion: z.literal(1), result: commandResultSchema })
  .strict();

export function serializePublicChatCommandResult(
  result: ChatCommandResult,
  transcriptPersistence: TranscriptPersistence,
): { schemaVersion: 1; result: ChatCommandResult } {
  const durable =
    transcriptPersistence === "approved" || !result.projection
      ? result
      : {
          ...result,
          projection: {
            ...result.projection,
            messages: result.projection.messages.map((message) => ({ ...message, body: null })),
          },
        };
  return { schemaVersion: 1, result: durable };
}

export function deserializePublicChatCommandResult(value: unknown): ChatCommandResult {
  const parsed = persistedCommandResultSchema.safeParse(value);
  if (!parsed.success) throw new Error("PUBLIC_CHAT_COMMAND_RESULT_INVALID");
  return parsed.data.result;
}

async function loadConversation(
  sql: TransactionSql,
  conversationId: string,
  sessionHash: string,
): Promise<PublicChatConversation | null> {
  const sessions = await sql<Array<{ id: string }>>`
    select id
    from public_chat_sessions
    where session_hash = ${sessionHash}
      and revoked_at is null
      and expires_at > current_timestamp
    limit 1
  `;
  const session = sessions[0];
  if (!session) return null;
  await setPublicChatScope(sql, session.id);
  const rows = await sql<ConversationRow[]>`
    select
      c.id,
      c.version,
      c.locale,
      c.status,
      s.session_hash,
      ownership.notice_version,
      c.correlation_id,
      ownership.start_idempotency_key,
      ownership.start_fingerprint,
      c.created_at,
      c.updated_at,
      c.last_activity_at,
      c.expires_at,
      s.revoked_at,
      c.closed_at,
      handoff.receipt_id as handoff_receipt_id,
      handoff.reason_code as handoff_reason,
      (
        select latest_handoff.queued_at
        from communication_handoffs latest_handoff
        where latest_handoff.conversation_id = c.id
        order by latest_handoff.updated_at desc
        limit 1
      ) as handoff_queued_at
    from communication_conversations c
    inner join public_chat_conversation_sessions ownership on ownership.conversation_id = c.id
    inner join public_chat_sessions s on s.id = ownership.session_id
    left join lateral (
      select receipt_id, reason_code
      from communication_handoffs
      where conversation_id = c.id
      order by updated_at desc
      limit 1
    ) handoff on true
    where c.id = ${conversationId} and c.channel_kind = 'public_web'
      and ownership.session_id = ${session.id} and s.session_hash = ${sessionHash}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;

  const messageRows = await sql<MessageRow[]>`
    select message.id,
      case sender.kind
        when 'external' then 'visitor'
        when 'automated' then 'assistant'
        when 'human' then 'human'
        else 'system'
      end as actor,
      message.body, message.body_stored, message.state, message.actions, message.created_at
    from communication_messages message
    join communication_participants sender
      on sender.id = message.sender_participant_id
      and sender.conversation_id = message.conversation_id
    where message.conversation_id = ${conversationId} and message.channel_kind = 'public_web'
    order by message.ordinal asc
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
        `;

  const citationsByMessage = new Map<string, PublicCitation[]>();
  for (const citation of citationRows) {
    const existing = citationsByMessage.get(citation.message_id) ?? [];
    existing.push({
      sourceId: citation.source_id,
      title: citation.title,
      path: citation.path,
      locale: citation.locale,
      summary: citation.summary,
      disclosure: citation.disclosure,
      sourceKind: citation.source_kind,
    });
    citationsByMessage.set(citation.message_id, existing);
  }

  return {
    id: row.id,
    version: row.version,
    locale: row.locale,
    status: row.status,
    sessionHash: row.session_hash,
    noticeVersion: row.notice_version,
    correlationId: row.correlation_id,
    startIdempotencyKey: row.start_idempotency_key,
    startFingerprint: row.start_fingerprint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.closed_at ? { closedAt: row.closed_at } : {}),
    ...(row.handoff_receipt_id ? { handoffReceiptId: row.handoff_receipt_id } : {}),
    ...(row.handoff_reason ? { handoffReason: row.handoff_reason } : {}),
    ...(row.handoff_queued_at ? { handoffQueuedAt: row.handoff_queued_at } : {}),
    messages: messageRows.map((message) => ({
      id: message.id,
      actor: message.actor,
      body: message.body_stored ? message.body : null,
      state: message.state,
      citations: citationsByMessage.get(message.id) ?? [],
      actions: Array.isArray(message.actions) ? message.actions : [],
      createdAt: message.created_at,
    })),
  };
}

async function persistConversation(
  tx: TransactionSql,
  conversation: PublicChatConversation,
  transcriptPersistence: TranscriptPersistence,
): Promise<void> {
  await tx`
    update communication_conversations
    set
      version = ${conversation.version},
      locale = ${conversation.locale},
      status = ${conversation.status},
      correlation_id = ${conversation.correlationId},
      updated_at = ${conversation.updatedAt},
      last_activity_at = ${conversation.lastActivityAt},
      expires_at = ${conversation.expiresAt},
      closed_at = ${conversation.closedAt ?? null}
    where id = ${conversation.id} and channel_kind = 'public_web'
  `;
  await tx`
    update public_chat_conversation_sessions
    set notice_version = ${conversation.noticeVersion}, updated_at = ${conversation.updatedAt}
    where conversation_id = ${conversation.id}
  `;
  await tx`
    update public_chat_sessions
    set expires_at = greatest(expires_at, ${conversation.expiresAt}),
        revoked_at = coalesce(revoked_at, ${conversation.revokedAt ?? null}),
        updated_at = ${conversation.updatedAt}
    where id = (
      select session_id from public_chat_conversation_sessions
      where conversation_id = ${conversation.id}
    )
  `;

  for (const [ordinal, message] of conversation.messages.entries()) {
    const bodyStored = transcriptPersistence === "approved";
    const senderKind =
      message.actor === "visitor"
        ? "external"
        : message.actor === "assistant"
          ? "automated"
          : message.actor;
    const senderId =
      message.actor === "visitor"
        ? (
            await tx<Array<{ participant_id: string }>>`
              select participant_id from public_chat_conversation_sessions
              where conversation_id = ${conversation.id}
            `
          )[0]?.participant_id
        : `participant:${conversation.id}:${senderKind}`;
    if (!senderId) throw new Error("PUBLIC_CHAT_PARTICIPANT_SCOPE_MISSING");
    await tx`
      insert into communication_participants (
        id, conversation_id, channel_kind, kind, channel_binding_id,
        joined_at, left_at, created_at, updated_at
      ) values (
        ${senderId}, ${conversation.id}, 'public_web', ${senderKind}, null,
        ${message.createdAt}, null, ${message.createdAt}, ${conversation.updatedAt}
      ) on conflict (id) do update
      set kind = excluded.kind, left_at = null, updated_at = excluded.updated_at
    `;
    await tx`
      insert into communication_messages (
        id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
        recipient_participant_id, locale, kind, state, body, body_stored,
        body_retention_policy, actions, rejection_reason, external_message_reference, created_at
      ) values (
        ${message.id},
        ${conversation.id},
        'public_web',
        ${ordinal + 1},
        ${message.actor === "visitor" ? "inbound" : message.actor === "system" ? "system" : "outbound"},
        ${senderId},
        null,
        ${conversation.locale},
        ${message.actor === "system" ? "system" : "text"},
        ${message.state},
        ${bodyStored ? message.body : null},
        ${bodyStored},
        ${bodyStored ? "approved" : "metadata_only"},
        ${tx.json(message.actions)},
        ${message.state === "failed" ? "response_rejected" : null},
        null,
        ${message.createdAt}
      )
      on conflict (id) do update
      set ordinal = excluded.ordinal,
          direction = excluded.direction,
          sender_participant_id = excluded.sender_participant_id,
          locale = excluded.locale,
          kind = excluded.kind,
          state = excluded.state,
          body = excluded.body,
          body_stored = excluded.body_stored,
          body_retention_policy = excluded.body_retention_policy,
          rejection_reason = excluded.rejection_reason,
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
          ${citation.title},
          ${citation.path},
          ${citation.locale},
          ${citation.summary},
          ${citation.disclosure},
          ${citation.sourceKind},
          ${message.createdAt}
        )
        on conflict (id) do update
        set title = excluded.title,
            path = excluded.path,
            locale = excluded.locale,
            summary = excluded.summary,
            disclosure = excluded.disclosure,
            source_kind = excluded.source_kind
      `;
    }
  }

  if (conversation.status === "human_requested" || conversation.status === "waiting_for_human") {
    await tx`
      insert into communication_handoffs (
        id, conversation_id, channel_kind, state, reason_code, receipt_id, correlation_id,
        assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at
      ) values (
        ${`handoff:${conversation.id}`},
        ${conversation.id},
        'public_web',
        ${conversation.status === "human_requested" ? "requested" : "queued"},
        ${conversation.handoffReason ?? "policy_required"},
        ${conversation.handoffReceiptId ?? null},
        ${conversation.correlationId},
        null,
        ${conversation.updatedAt},
        ${conversation.handoffQueuedAt ?? null},
        null,
        null,
        ${conversation.updatedAt}
      )
      on conflict (id) do update
      set state = excluded.state,
          reason_code = excluded.reason_code,
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
  await tx`select pg_advisory_xact_lock(hashtextextended(${`public-chat:audit:${conversation.id}`}, 0))`;
  const sequenceRows = await tx<{ sequence: number }[]>`
    select coalesce(max(sequence), 0)::integer + 1 as sequence
    from communication_audit_events
    where conversation_id = ${conversation.id}
  `;
  const sequence = sequenceRows[0]?.sequence ?? 1;
  const aggregateType =
    eventName.includes("message") || eventName.includes("response")
      ? "message"
      : eventName.includes("handoff")
        ? "handoff"
        : "conversation";
  const aggregateId =
    aggregateType === "message"
      ? (conversation.messages.at(-1)?.id ?? conversation.id)
      : aggregateType === "handoff"
        ? `handoff:${conversation.id}`
        : conversation.id;
  const resultCode =
    eventName === "chat_conversation_started"
      ? "new"
      : eventName === "chat_handoff_requested"
        ? "requested"
        : eventName === "chat_handoff_queued"
          ? "queued"
          : eventName === "chat_conversation_closed"
            ? "closed"
            : eventName === "chat_message_rejected"
              ? "rejected"
              : eventName === "chat_response_failed"
                ? "failed"
                : "accepted";
  await tx`
    insert into communication_audit_events (
      id, sequence, conversation_id, channel_kind, event_name, aggregate_type, aggregate_id,
      result_code, reason_code, version, locale, purpose, policy_version,
      correlation_id, occurred_at, created_at
    ) values (
      ${`audit:${conversation.id}:${sequence}`}, ${sequence}, ${conversation.id}, 'public_web',
      ${eventName}, ${aggregateType}, ${aggregateId}, ${resultCode}, ${reason ?? null},
      ${conversation.version}, ${conversation.locale}, null, null,
      ${conversation.correlationId}, ${conversation.updatedAt}, ${conversation.updatedAt}
    )
  `;
}

export function resolvePublicChatCompletionAuditEvent(command: CommandCompletion): {
  eventName: AuditEvent["name"];
  reason?: ChatReasonCode;
} | null {
  if (!command.result.ok) {
    if (command.result.code === "content_rejected") {
      return {
        eventName: "chat_message_rejected",
        ...(command.result.reason ? { reason: command.result.reason } : {}),
      };
    }
    return {
      eventName: "chat_response_failed",
      ...(command.result.reason ? { reason: command.result.reason } : {}),
    };
  }
  if (command.kind === "handoff" && command.conversation.status === "waiting_for_human") {
    return {
      eventName: "chat_handoff_queued",
      ...(command.conversation.handoffReason ? { reason: command.conversation.handoffReason } : {}),
    };
  }
  if (command.kind === "close" && command.conversation.status === "closed") {
    return { eventName: "chat_conversation_closed" };
  }
  if (command.kind === "locale") {
    return command.conversation.version === command.expectedVersion + 1
      ? { eventName: "chat_locale_changed" }
      : null;
  }
  return { eventName: "chat_message_accepted" };
}

export function isValidPublicChatCompletionVersion(
  currentVersion: number,
  command: ClaimedCommandAdvance | CommandCompletion,
): boolean {
  return (
    currentVersion === command.expectedVersion &&
    (command.conversation.version === command.expectedVersion ||
      command.conversation.version === command.expectedVersion + 1)
  );
}

export function isValidPublicChatAdvanceVersion(
  currentVersion: number,
  command: ClaimedCommandAdvance,
): boolean {
  return (
    currentVersion === command.expectedVersion &&
    command.conversation.version === command.expectedVersion + 1
  );
}

export function createPostgresPublicChatStore(
  sql: postgres.Sql<Record<string, never>>,
): PublicChatTransactionalStore {
  const ownershipScopes = new Map<string, { sessionId: string; sessionHash: string }>();
  const rememberScope = (
    conversationId: string,
    scope: { sessionId: string; sessionHash: string },
  ): void => {
    ownershipScopes.delete(conversationId);
    ownershipScopes.set(conversationId, scope);
    while (ownershipScopes.size > 1_024) {
      const oldest = ownershipScopes.keys().next().value;
      if (typeof oldest !== "string") break;
      ownershipScopes.delete(oldest);
    }
  };
  const proveScope = async (
    tx: TransactionSql,
    conversationId: string,
    scope: { sessionId: string; sessionHash: string },
  ): Promise<boolean> => {
    await setPublicChatScope(tx, scope.sessionId);
    const rows = await tx<Array<{ valid: boolean }>>`
      select true as valid
      from public_chat_sessions session
      join public_chat_conversation_sessions ownership on ownership.session_id = session.id
      where session.id = ${scope.sessionId}
        and session.session_hash = ${scope.sessionHash}
        and session.revoked_at is null
        and session.expires_at > current_timestamp
        and ownership.conversation_id = ${conversationId}
      limit 1
    `;
    if (rows[0]?.valid === true) return true;
    ownershipScopes.delete(conversationId);
    return false;
  };

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
        await setPublicChatScope(tx, session.id);
        await tx`select pg_advisory_xact_lock(hashtextextended(${`${session.id}:${conversation.startIdempotencyKey}`}, 0))`;
        const existing = await tx<Array<{ id: string; start_fingerprint: string }>>`
          select conversation_id as id, start_fingerprint
          from public_chat_conversation_sessions
          where session_id = ${session.id} and start_idempotency_key = ${conversation.startIdempotencyKey}
          limit 1
          for update
        `;
        const row = existing[0];
        if (row) {
          if (row.start_fingerprint !== conversation.startFingerprint) return "conflict" as const;
          rememberScope(row.id, {
            sessionId: session.id,
            sessionHash: conversation.sessionHash,
          });
          const replayed = await loadConversation(tx, row.id, conversation.sessionHash);
          if (!replayed) throw new Error("PUBLIC_CHAT_START_REPLAY_UNAVAILABLE");
          return { replayed } as const;
        }
        if (
          conversation.version !== 1 ||
          conversation.status !== "new" ||
          conversation.createdAt.valueOf() !== conversation.updatedAt.valueOf()
        ) {
          return "conflict" as const;
        }
        const participantId = `participant_${(await sha256(`${conversation.id}:external`)).slice(0, 24)}`;
        const sessionLinkId = `session_link_${(await sha256(`${conversation.id}:${session.id}`)).slice(0, 24)}`;
        await tx`
          select atlas_bootstrap_public_chat_conversation(
            ${session.id}, ${conversation.id}, ${participantId}, ${sessionLinkId},
            ${conversation.locale}, ${conversation.correlationId}, ${conversation.noticeVersion},
            ${conversation.startIdempotencyKey}, ${conversation.startFingerprint},
            ${conversation.createdAt}, ${conversation.expiresAt}
          )
        `;
        rememberScope(conversation.id, {
          sessionId: session.id,
          sessionHash: conversation.sessionHash,
        });
        return "created" as const;
      });
    },

    async findOwnedConversation(conversationId, sessionHash) {
      const conversation = await withGatewayTransaction(sql, (tx) =>
        loadConversation(tx, conversationId, sessionHash),
      );
      if (conversation) {
        const sessions = await withGatewayTransaction(sql, async (tx) => {
          const rows = await tx<Array<{ id: string }>>`
            select id from public_chat_sessions
            where session_hash = ${sessionHash}
              and revoked_at is null
              and expires_at > current_timestamp
            limit 1
          `;
          return rows;
        });
        if (sessions[0]) rememberScope(conversationId, { sessionId: sessions[0].id, sessionHash });
      } else {
        ownershipScopes.delete(conversationId);
      }
      return conversation;
    },

    async findCommandResult(conversationId, idempotencyKey, kind, fingerprint) {
      const scope = ownershipScopes.get(conversationId);
      if (!scope) return null;
      return withGatewayTransaction(sql, async (tx) => {
        if (!(await proveScope(tx, conversationId, scope))) return null;
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
      const scope = ownershipScopes.get(command.conversationId);
      if (!scope) return { status: "conflict" as const };
      return withGatewayTransaction(sql, async (tx) => {
        if (!(await proveScope(tx, command.conversationId, scope))) {
          return { status: "conflict" as const };
        }
        const versions = await tx<{ version: number }[]>`
          select version
          from communication_conversations
          where id = ${command.conversationId} and channel_kind = 'public_web'
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
          limit 1
          for update
        `;
        const existing = existingRows[0];
        if (
          existing &&
          (existing.command_kind !== command.kind ||
            existing.command_fingerprint !== command.fingerprint)
        ) {
          return { status: "conflict" as const };
        }
        if (existing?.state === "completed" && existing.result) {
          return {
            status: "completed" as const,
            result: deserializePublicChatCommandResult(existing.result),
          };
        }
        if (versions[0]?.version !== command.expectedVersion) {
          return { status: "conflict" as const };
        }
        if (existing?.lease_active) {
          return { status: "in_progress" as const };
        }
        if (existing) {
          await tx`
            update public_chat_idempotency
            set lease_token_hash = ${leaseTokenHash}, lease_expires_at = ${command.leaseExpiresAt},
                expected_version = ${command.expectedVersion}, updated_at = current_timestamp
            where conversation_id = ${command.conversationId}
              and idempotency_key = ${command.idempotencyKey}
          `;
        } else {
          await tx`
            insert into public_chat_idempotency (
              id, conversation_id, idempotency_key, command_kind, command_fingerprint, state, expected_version,
              lease_token_hash, lease_expires_at, result, completed_at, created_at, updated_at
            ) values (
              ${commandId(command.conversationId, command.idempotencyKey)},
              ${command.conversationId}, ${command.idempotencyKey}, ${command.kind},
              ${command.fingerprint}, 'in_progress',
              ${command.expectedVersion}, ${leaseTokenHash}, ${command.leaseExpiresAt},
              null, null, current_timestamp, current_timestamp
            )
          `;
        }
        return { status: "claimed" as const };
      });
    },

    async waitForCommandResult(conversationId, idempotencyKey, kind, fingerprint, waitUntil) {
      const scope = ownershipScopes.get(conversationId);
      if (!scope) return null;
      while (Date.now() < waitUntil.getTime()) {
        const completed = await withGatewayTransaction(sql, async (tx) => {
          if (!(await proveScope(tx, conversationId, scope))) return null;
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
            return null;
          }
          return row?.state === "completed" ? deserializePublicChatCommandResult(row.result) : null;
        });
        if (completed) return completed;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
    },

    async advanceCommand(command, leaseTokenHash, transcriptPersistence) {
      const scope = ownershipScopes.get(command.conversation.id);
      if (!scope) return "conflict" as const;
      return withGatewayTransaction(sql, async (tx) => {
        if (!(await proveScope(tx, command.conversation.id, scope))) return "conflict" as const;
        const versions = await tx<{ version: number }[]>`
          select version from communication_conversations
          where id = ${command.conversation.id} and channel_kind = 'public_web'
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
          for update
        `;
        const claim = claims[0];
        const currentVersion = versions[0]?.version;
        if (
          claim?.state !== "in_progress" ||
          claim.command_kind !== command.kind ||
          claim.lease_token_hash !== leaseTokenHash ||
          !claim.lease_active ||
          claim.expected_version !== command.expectedVersion ||
          currentVersion === undefined ||
          !isValidPublicChatAdvanceVersion(currentVersion, command)
        ) {
          return "conflict" as const;
        }
        await persistConversation(tx, command.conversation, transcriptPersistence);
        await tx`
          update public_chat_idempotency
          set expected_version = ${command.conversation.version}, updated_at = current_timestamp
          where conversation_id = ${command.conversation.id}
            and idempotency_key = ${command.idempotencyKey}
            and command_kind = ${command.kind}
        `;
        await appendAuditEvent(
          tx,
          command.conversation,
          "chat_handoff_requested",
          command.conversation.handoffReason,
        );
        return "advanced" as const;
      });
    },

    async completeCommand(command, leaseTokenHash, transcriptPersistence) {
      const scope = ownershipScopes.get(command.conversation.id);
      if (!scope) return "conflict" as const;
      return withGatewayTransaction(sql, async (tx) => {
        if (!(await proveScope(tx, command.conversation.id, scope))) return "conflict" as const;
        const versions = await tx<{ version: number }[]>`
          select version from communication_conversations
          where id = ${command.conversation.id} and channel_kind = 'public_web'
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
          for update
        `;
        const claim = claims[0];
        const currentVersion = versions[0]?.version;
        if (
          claim?.state !== "in_progress" ||
          claim.command_kind !== command.kind ||
          claim.lease_token_hash !== leaseTokenHash ||
          !claim.lease_active ||
          claim.expected_version !== command.expectedVersion ||
          currentVersion === undefined ||
          !isValidPublicChatCompletionVersion(currentVersion, command)
        ) {
          return "conflict" as const;
        }
        await persistConversation(tx, command.conversation, transcriptPersistence);
        const audit = resolvePublicChatCompletionAuditEvent(command);
        if (audit) {
          await appendAuditEvent(tx, command.conversation, audit.eventName, audit.reason);
        }
        await tx`
          update public_chat_idempotency
          set state = 'completed',
              result = ${tx.json(
                serializePublicChatCommandResult(command.result, transcriptPersistence),
              )},
              completed_at = current_timestamp,
              updated_at = current_timestamp
          where conversation_id = ${command.conversation.id}
            and idempotency_key = ${command.idempotencyKey}
            and command_kind = ${command.kind}
        `;
        return "completed" as const;
      });
    },
  };
}

export async function registerPublicChatSession(
  sql: postgres.Sql<Record<string, never>>,
  session: {
    id: string;
    sessionHash: string;
    csrfHash: string;
    correlationId: string;
    expiresAt: Date;
    now: Date;
  },
): Promise<void> {
  await withGatewayTransaction(sql, async (tx) => {
    await tx`
      insert into public_chat_sessions (
        id, session_hash, csrf_hash, correlation_id, expires_at, revoked_at, created_at, updated_at
      ) values (
        ${session.id}, ${session.sessionHash}, ${session.csrfHash}, ${session.correlationId}, ${session.expiresAt},
        null, ${session.now}, ${session.now}
      )
      on conflict (session_hash) do nothing
    `;
  });
}

export async function findPublicChatSessionByHash(
  sql: postgres.Sql<Record<string, never>>,
  sessionHash: string,
): Promise<{
  id: string;
  sessionHash: string;
  csrfHash: string;
  correlationId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
} | null> {
  return withGatewayTransaction(sql, async (tx) => {
    const rows = await tx<
      Array<{
        id: string;
        session_hash: string;
        csrf_hash: string;
        correlation_id: string;
        expires_at: Date;
        revoked_at: Date | null;
        created_at: Date;
      }>
    >`
      select id, session_hash, csrf_hash, correlation_id, expires_at, revoked_at, created_at
      from public_chat_sessions
      where session_hash = ${sessionHash}
      limit 1
    `;
    const row = rows[0];
    return row
      ? {
          id: row.id,
          sessionHash: row.session_hash,
          csrfHash: row.csrf_hash,
          correlationId: row.correlation_id,
          expiresAt: row.expires_at,
          revokedAt: row.revoked_at,
          createdAt: row.created_at,
        }
      : null;
  });
}

export async function rotatePublicChatSessionSecrets(
  sql: PublicChatSql,
  input: {
    currentSessionHash: string;
    sessionHash: string;
    csrfHash: string;
    expiresAt: Date;
    updatedAt: Date;
  },
): Promise<{
  id: string;
  sessionHash: string;
  csrfHash: string;
  correlationId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
} | null> {
  return withGatewayTransaction(sql, async (tx) => {
    const rows = await tx<
      Array<{
        id: string;
        session_hash: string;
        csrf_hash: string;
        correlation_id: string;
        expires_at: Date;
        revoked_at: Date | null;
        created_at: Date;
      }>
    >`
      update public_chat_sessions
      set session_hash = ${input.sessionHash},
          csrf_hash = ${input.csrfHash},
          expires_at = ${input.expiresAt},
          updated_at = ${input.updatedAt}
      where session_hash = ${input.currentSessionHash}
        and revoked_at is null
        and expires_at > current_timestamp
      returning id, session_hash, csrf_hash, correlation_id, expires_at, revoked_at, created_at
    `;
    const row = rows[0];
    return row
      ? {
          id: row.id,
          sessionHash: row.session_hash,
          csrfHash: row.csrf_hash,
          correlationId: row.correlation_id,
          expiresAt: row.expires_at,
          revokedAt: row.revoked_at,
          createdAt: row.created_at,
        }
      : null;
  });
}

export async function extendPublicChatSession(
  sql: PublicChatSql,
  sessionHash: string,
  expiresAt: Date,
  updatedAt: Date,
): Promise<boolean> {
  return withGatewayTransaction(sql, async (tx) => {
    const rows = await tx<{ id: string }[]>`
      update public_chat_sessions
      set expires_at = ${expiresAt}, updated_at = ${updatedAt}
      where session_hash = ${sessionHash}
        and revoked_at is null
        and expires_at > current_timestamp
      returning id
    `;
    return rows.length === 1;
  });
}

export async function revokePublicChatSession(
  sql: PublicChatSql,
  sessionHash: string,
  revokedAt: Date,
): Promise<boolean> {
  return withGatewayTransaction(sql, async (tx) => {
    const rows = await tx<{ id: string }[]>`
      update public_chat_sessions
      set revoked_at = ${revokedAt}, updated_at = ${revokedAt}
      where session_hash = ${sessionHash}
        and revoked_at is null
      returning id
    `;
    return rows.length === 1;
  });
}

export function createPostgresPublicChatRateLimiter(
  sql: postgres.Sql<Record<string, never>>,
  input: { limit: number; windowSeconds: number },
): {
  consume(key: string): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }>;
} {
  return {
    async consume(key) {
      const bucketHash = await sha256(key);
      return withGatewayTransaction(sql, async (tx) => {
        await tx`
          delete from public_chat_rate_limits
          where ctid in (
            select ctid
            from public_chat_rate_limits
            where expires_at <= current_timestamp
            order by expires_at asc
            limit 100
          )
        `;
        const rows = await tx<{ count: number; retry_after_seconds: number }[]>`
          insert into public_chat_rate_limits (
            bucket_hash, count, window_started_at, expires_at, updated_at
          ) values (
            ${bucketHash}, 1, current_timestamp,
            current_timestamp + (${input.windowSeconds} * interval '1 second'), current_timestamp
          )
          on conflict (bucket_hash) do update
          set
            count = case
              when public_chat_rate_limits.expires_at <= current_timestamp then 1
              else public_chat_rate_limits.count + 1
            end,
            window_started_at = case
              when public_chat_rate_limits.expires_at <= current_timestamp then current_timestamp
              else public_chat_rate_limits.window_started_at
            end,
            expires_at = case
              when public_chat_rate_limits.expires_at <= current_timestamp
                then current_timestamp + (${input.windowSeconds} * interval '1 second')
              else public_chat_rate_limits.expires_at
            end,
            updated_at = current_timestamp
          returning count,
            greatest(1, ceil(extract(epoch from (expires_at - current_timestamp))))::integer
              as retry_after_seconds
        `;
        const row = rows[0];
        if (!row || row.count <= input.limit) return { allowed: true };
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.min(input.windowSeconds, row.retry_after_seconds)),
        };
      });
    },
  };
}
