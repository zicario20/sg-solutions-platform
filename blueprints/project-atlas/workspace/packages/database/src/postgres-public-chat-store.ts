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
  handoff_reason: PublicChatConversation["handoffReason"] | null;
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
      c.handoff_receipt_id,
      c.handoff_reason
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
    ...(row.closed_at ? { closedAt: row.closed_at } : {}),
    ...(row.handoff_receipt_id ? { handoffReceiptId: row.handoff_receipt_id } : {}),
    ...(row.handoff_reason ? { handoffReason: row.handoff_reason } : {}),
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
      handoff_receipt_id = ${conversation.handoffReceiptId ?? null},
      handoff_reason = ${conversation.handoffReason ?? null}
    where id = ${conversation.id}
  `;
  await tx`
    update public_chat_sessions
    set expires_at = greatest(expires_at, ${conversation.expiresAt}),
        revoked_at = coalesce(revoked_at, ${conversation.revokedAt ?? null}),
        updated_at = ${conversation.updatedAt}
    where id = (select session_id from public_chat_conversations where id = ${conversation.id})
  `;

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
      on conflict (id) do update
      set ordinal = excluded.ordinal,
          actor = excluded.actor,
          state = excluded.state,
          body = excluded.body,
          body_stored = excluded.body_stored,
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
      insert into public_chat_handoffs (
        id, conversation_id, status, reason, receipt_id, requested_at, queued_at, updated_at
      ) values (
        ${`handoff:${conversation.id}`},
        ${conversation.id},
        ${conversation.status},
        ${conversation.handoffReason ?? "policy_required"},
        ${conversation.handoffReceiptId ?? null},
        ${conversation.updatedAt},
        ${conversation.handoffReceiptId ? conversation.updatedAt : null},
        ${conversation.updatedAt}
      )
      on conflict (id) do update
      set status = excluded.status,
          reason = excluded.reason,
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
  return {
    async createConversation(conversation) {
      await withGatewayTransaction(sql, async (tx) => {
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
            last_activity_at, expires_at, closed_at, handoff_receipt_id, handoff_reason,
            reconciliation_required, created_at, updated_at
          ) values (
            ${conversation.id}, ${session.id}, ${conversation.version}, ${conversation.locale},
            ${conversation.status}, ${conversation.noticeVersion}, ${conversation.correlationId},
            ${conversation.lastActivityAt}, ${conversation.expiresAt},
            ${conversation.closedAt ?? null}, ${conversation.handoffReceiptId ?? null},
            ${conversation.handoffReason ?? null}, false,
            ${conversation.createdAt}, ${conversation.updatedAt}
          )
        `;
        await appendAuditEvent(tx, conversation, "chat_conversation_started");
      });
    },

    findOwnedConversation: (conversationId, sessionHash) =>
      withGatewayTransaction(sql, (tx) => loadConversation(tx, conversationId, sessionHash)),

    async findCommandResult(conversationId, idempotencyKey) {
      return withGatewayTransaction(sql, async (tx) => {
        const rows = await tx<Array<Pick<CommandRow, "state" | "result">>>`
          select state, result
          from public_chat_idempotency
          where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
          limit 1
        `;
        return rows[0]?.state === "completed"
          ? deserializePublicChatCommandResult(rows[0].result)
          : null;
      });
    },

    async claimCommand(command, _leaseToken, leaseTokenHash) {
      return withGatewayTransaction(sql, async (tx) => {
        const versions = await tx<{ version: number }[]>`
          select version
          from public_chat_conversations
          where id = ${command.conversationId}
          limit 1
          for update
        `;
        const existingRows = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result, expected_version,
                 lease_expires_at > current_timestamp as lease_active
          from public_chat_idempotency
          where conversation_id = ${command.conversationId}
            and idempotency_key = ${command.idempotencyKey}
          limit 1
          for update
        `;
        const existing = existingRows[0];
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
        const completed = await withGatewayTransaction(sql, async (tx) => {
          const rows = await tx<Array<Pick<CommandRow, "state" | "result">>>`
            select state, result
            from public_chat_idempotency
            where conversation_id = ${conversationId} and idempotency_key = ${idempotencyKey}
            limit 1
          `;
          return rows[0]?.state === "completed"
            ? deserializePublicChatCommandResult(rows[0].result)
            : null;
        });
        if (completed) return completed;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return null;
    },

    async advanceCommand(command, leaseTokenHash, transcriptPersistence) {
      return withGatewayTransaction(sql, async (tx) => {
        const versions = await tx<{ version: number }[]>`
          select version from public_chat_conversations
          where id = ${command.conversation.id}
          limit 1 for update
        `;
        const claims = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result, expected_version,
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
      return withGatewayTransaction(sql, async (tx) => {
        const versions = await tx<{ version: number }[]>`
          select version from public_chat_conversations
          where id = ${command.conversation.id}
          limit 1 for update
        `;
        const claims = await tx<CommandRow[]>`
          select state, lease_token_hash, lease_expires_at, result, expected_version,
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
