import type {
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
import type postgres from "postgres";
import type {
  PublicChatTransactionalStore,
  TranscriptPersistence,
} from "./public-chat-repository.ts";

type TransactionSql = postgres.TransactionSql<Record<string, never>>;

type ConversationRow = {
  id: string;
  version: number;
  locale: ChatLocale;
  status: ConversationStatus;
  session_hash: string;
  notice_version: string;
  correlation_id: string;
  created_at: Date;
  updated_at: Date;
  last_activity_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  closed_at: Date | null;
  handoff_receipt_id: string | null;
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
  result: ChatCommandResult | null;
  lease_active: boolean;
};

function commandId(conversationId: string, idempotencyKey: string): string {
  return `command:${conversationId}:${idempotencyKey}`;
}

function persistedResult(
  result: ChatCommandResult,
  transcriptPersistence: TranscriptPersistence,
): ChatCommandResult {
  if (transcriptPersistence === "approved" || !result.projection) return result;
  return {
    ...result,
    projection: {
      ...result.projection,
      messages: result.projection.messages.map((message) => ({ ...message, body: "" })),
    },
  };
}

async function loadConversation(
  sql: postgres.Sql<Record<string, never>>,
  conversationId: string,
  sessionHash: string,
): Promise<PublicChatConversation | null> {
  const rows = await sql<ConversationRow[]>`
    select
      c.id,
      c.version,
      c.locale,
      c.status,
      s.session_hash,
      c.notice_version,
      c.correlation_id,
      c.created_at,
      c.updated_at,
      c.last_activity_at,
      c.expires_at,
      s.revoked_at,
      c.closed_at,
      c.handoff_receipt_id
    from public_chat_conversations c
    inner join public_chat_sessions s on s.id = c.session_id
    where c.id = ${conversationId} and s.session_hash = ${sessionHash}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;

  const messageRows = await sql<MessageRow[]>`
    select id, actor, body, body_stored, state, actions, created_at
    from public_chat_messages
    where conversation_id = ${conversationId}
    order by ordinal asc
  `;
  const retainedMessages = messageRows.filter((message) => message.body_stored && message.body);
  const messageIds = retainedMessages.map((message) => message.id);
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.closed_at ? { closedAt: row.closed_at } : {}),
    ...(row.handoff_receipt_id ? { handoffReceiptId: row.handoff_receipt_id } : {}),
    messages: retainedMessages.map((message) => ({
      id: message.id,
      actor: message.actor,
      body: message.body ?? "",
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
    update public_chat_conversations
    set
      version = ${conversation.version},
      locale = ${conversation.locale},
      status = ${conversation.status},
      notice_version = ${conversation.noticeVersion},
      correlation_id = ${conversation.correlationId},
      updated_at = ${conversation.updatedAt},
      last_activity_at = ${conversation.lastActivityAt},
      expires_at = ${conversation.expiresAt},
      closed_at = ${conversation.closedAt ?? null},
      handoff_receipt_id = ${conversation.handoffReceiptId ?? null}
    where id = ${conversation.id}
  `;
  await tx`
    update public_chat_sessions
    set expires_at = greatest(expires_at, ${conversation.expiresAt}), updated_at = ${conversation.updatedAt}
    where id = (select session_id from public_chat_conversations where id = ${conversation.id})
  `;
  await tx`
    delete from public_chat_citations
    where message_id in (
      select id from public_chat_messages where conversation_id = ${conversation.id}
    )
  `;
  await tx`delete from public_chat_messages where conversation_id = ${conversation.id}`;
  await tx`delete from public_chat_handoffs where conversation_id = ${conversation.id}`;

  for (const [ordinal, message] of conversation.messages.entries()) {
    const bodyStored = transcriptPersistence === "approved";
    await tx`
      insert into public_chat_messages (
        id, conversation_id, ordinal, actor, state, body, body_stored, actions, created_at
      ) values (
        ${message.id},
        ${conversation.id},
        ${ordinal},
        ${message.actor},
        ${message.state},
        ${bodyStored ? message.body : null},
        ${bodyStored},
        ${tx.json(message.actions)},
        ${message.createdAt}
      )
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
      `;
    }
  }

  if (conversation.status === "human_requested" || conversation.status === "waiting_for_human") {
    await tx`
      insert into public_chat_handoffs (
        id, conversation_id, status, reason, receipt_id, requested_at, queued_at, updated_at
      ) values (
        ${`handoff:${conversation.id}`},
        ${conversation.id},
        ${conversation.status},
        'visitor_requested',
        ${conversation.handoffReceiptId ?? null},
        ${conversation.updatedAt},
        ${conversation.handoffReceiptId ? conversation.updatedAt : null},
        ${conversation.updatedAt}
      )
    `;
  }
}

async function appendAuditEvent(
  tx: TransactionSql,
  conversation: PublicChatConversation,
  eventName:
    | "chat_conversation_started"
    | "chat_message_accepted"
    | "chat_message_rejected"
    | "chat_response_failed"
    | "chat_handoff_requested"
    | "chat_handoff_queued"
    | "chat_conversation_closed",
  reason?: ChatReasonCode,
): Promise<void> {
  const sequenceRows = await tx<{ sequence: number }[]>`
    select coalesce(max(sequence), 0)::integer + 1 as sequence
    from public_chat_audit_events
    where conversation_id = ${conversation.id}
  `;
  const sequence = sequenceRows[0]?.sequence ?? 1;
  await tx`
    insert into public_chat_audit_events (
      id, sequence, conversation_id, event_name, reason, version, locale, correlation_id, created_at
    ) values (
      ${`audit:${conversation.id}:${sequence}`}, ${sequence}, ${conversation.id}, ${eventName},
      ${reason ?? null}, ${conversation.version}, ${conversation.locale},
      ${conversation.correlationId}, ${conversation.updatedAt}
    )
  `;
}

function completionAuditEvent(command: CommandCompletion): {
  eventName:
    | "chat_message_accepted"
    | "chat_message_rejected"
    | "chat_response_failed"
    | "chat_handoff_queued"
    | "chat_conversation_closed";
  reason?: ChatReasonCode;
} {
  if (command.conversation.status === "waiting_for_human") {
    return { eventName: "chat_handoff_queued" };
  }
  if (command.conversation.status === "closed") {
    return { eventName: "chat_conversation_closed" };
  }
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
  return { eventName: "chat_message_accepted" };
}

function validVersion(
  currentVersion: number,
  command: ClaimedCommandAdvance | CommandCompletion,
): boolean {
  return (
    currentVersion === command.expectedVersion &&
    (command.conversation.version === command.expectedVersion ||
      command.conversation.version === command.expectedVersion + 1)
  );
}

export function createPostgresPublicChatStore(
  sql: postgres.Sql<Record<string, never>>,
  options: { transcriptPersistence: TranscriptPersistence },
): PublicChatTransactionalStore {
  return {
    async createConversation(conversation) {
      await sql.begin(async (tx) => {
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
        await tx`
          insert into public_chat_conversations (
            id, session_id, version, locale, status, notice_version, correlation_id,
            last_activity_at, expires_at, closed_at, handoff_receipt_id,
            reconciliation_required, created_at, updated_at
          ) values (
            ${conversation.id}, ${session.id}, ${conversation.version}, ${conversation.locale},
            ${conversation.status}, ${conversation.noticeVersion}, ${conversation.correlationId},
            ${conversation.lastActivityAt}, ${conversation.expiresAt},
            ${conversation.closedAt ?? null}, ${conversation.handoffReceiptId ?? null}, false,
            ${conversation.createdAt}, ${conversation.updatedAt}
          )
        `;
        await appendAuditEvent(tx, conversation, "chat_conversation_started");
      });
    },

    findOwnedConversation: (conversationId, sessionHash) =>
      loadConversation(sql, conversationId, sessionHash),

    async findCommandResult(conversationId, idempotencyKey) {
      const rows = await sql<Array<Pick<CommandRow, "state" | "result">>>`
        select state, result
        from public_chat_idempotency
        where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
        limit 1
      `;
      return rows[0]?.state === "completed" ? rows[0].result : null;
    },

    async claimCommand(command, _leaseToken, leaseTokenHash) {
      return sql.begin(async (tx) => {
        const existingRows = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result,
                 lease_expires_at > current_timestamp as lease_active
          from public_chat_idempotency
          where conversation_id = ${command.conversationId}
            and idempotency_key = ${command.idempotencyKey}
          limit 1
          for update
        `;
        const existing = existingRows[0];
        if (existing?.state === "completed" && existing.result) {
          return { status: "completed" as const, result: existing.result };
        }

        const versions = await tx<{ version: number }[]>`
          select version
          from public_chat_conversations
          where id = ${command.conversationId}
          limit 1
          for update
        `;
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
              id, conversation_id, idempotency_key, state, expected_version,
              lease_token_hash, lease_expires_at, result, completed_at, created_at, updated_at
            ) values (
              ${commandId(command.conversationId, command.idempotencyKey)},
              ${command.conversationId}, ${command.idempotencyKey}, 'in_progress',
              ${command.expectedVersion}, ${leaseTokenHash}, ${command.leaseExpiresAt},
              null, null, current_timestamp, current_timestamp
            )
          `;
        }
        return { status: "claimed" as const };
      });
    },

    async waitForCommandResult(conversationId, idempotencyKey, waitUntil) {
      while (Date.now() < waitUntil.getTime()) {
        const rows = await sql<Array<Pick<CommandRow, "state" | "result">>>`
          select state, result
          from public_chat_idempotency
          where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
          limit 1
        `;
        if (rows[0]?.state === "completed") return rows[0].result;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
    },

    async advanceCommand(command, leaseTokenHash, transcriptPersistence) {
      return sql.begin(async (tx) => {
        const claims = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result,
                 lease_expires_at > current_timestamp as lease_active
          from public_chat_idempotency
          where conversation_id = ${command.conversation.id}
            and idempotency_key = ${command.idempotencyKey}
          limit 1
          for update
        `;
        const versions = await tx<{ version: number }[]>`
          select version from public_chat_conversations
          where id = ${command.conversation.id}
          limit 1 for update
        `;
        const claim = claims[0];
        const currentVersion = versions[0]?.version;
        if (
          claim?.state !== "in_progress" ||
          claim.lease_token_hash !== leaseTokenHash ||
          !claim.lease_active ||
          currentVersion === undefined ||
          !validVersion(currentVersion, command)
        ) {
          return "conflict" as const;
        }
        await persistConversation(tx, command.conversation, transcriptPersistence);
        await appendAuditEvent(tx, command.conversation, "chat_handoff_requested");
        return "advanced" as const;
      });
    },

    async completeCommand(command, leaseTokenHash, transcriptPersistence) {
      return sql.begin(async (tx) => {
        const claims = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result,
                 lease_expires_at > current_timestamp as lease_active
          from public_chat_idempotency
          where conversation_id = ${command.conversation.id}
            and idempotency_key = ${command.idempotencyKey}
          limit 1
          for update
        `;
        const versions = await tx<{ version: number }[]>`
          select version from public_chat_conversations
          where id = ${command.conversation.id}
          limit 1 for update
        `;
        const claim = claims[0];
        const currentVersion = versions[0]?.version;
        const continuingAdvancedCommand = currentVersion === command.expectedVersion;
        if (
          claim?.state !== "in_progress" ||
          claim.lease_token_hash !== leaseTokenHash ||
          !claim.lease_active ||
          currentVersion === undefined ||
          (!validVersion(currentVersion, command) && !continuingAdvancedCommand)
        ) {
          return "conflict" as const;
        }
        await persistConversation(tx, command.conversation, transcriptPersistence);
        const audit = completionAuditEvent(command);
        await appendAuditEvent(tx, command.conversation, audit.eventName, audit.reason);
        await tx`
          update public_chat_idempotency
          set state = 'completed',
              result = ${tx.json(persistedResult(command.result, options.transcriptPersistence))},
              completed_at = current_timestamp,
              updated_at = current_timestamp
          where conversation_id = ${command.conversation.id}
            and idempotency_key = ${command.idempotencyKey}
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
    expiresAt: Date;
    now: Date;
  },
): Promise<void> {
  await sql`
    insert into public_chat_sessions (
      id, session_hash, csrf_hash, expires_at, revoked_at, created_at, updated_at
    ) values (
      ${session.id}, ${session.sessionHash}, ${session.csrfHash}, ${session.expiresAt},
      null, ${session.now}, ${session.now}
    )
    on conflict (session_hash) do nothing
  `;
}
