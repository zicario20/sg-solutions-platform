import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  getTableConfig,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const gatewayAccess = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: "atlas_public_chat_gateway",
    using: sql`true`,
    withCheck: sql`true`,
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const publicChatSessions = pgTable(
  "public_chat_sessions",
  {
    id: text("id").primaryKey(),
    sessionHash: char("session_hash", { length: 64 }).notNull().unique(),
    csrfHash: char("csrf_hash", { length: 64 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("public_chat_sessions_expiry_idx").on(table.expiresAt),
    gatewayAccess("public_chat_sessions"),
  ],
).enableRLS();

export const publicChatRateLimits = pgTable(
  "public_chat_rate_limits",
  {
    bucketHash: char("bucket_hash", { length: 64 }).primaryKey(),
    count: integer("count").notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("public_chat_rate_limits_expiry_idx").on(table.expiresAt),
    check("public_chat_rate_limits_count_positive", sql`${table.count} > 0`),
    check(
      "public_chat_rate_limits_window_valid",
      sql`${table.expiresAt} > ${table.windowStartedAt}`,
    ),
    gatewayAccess("public_chat_rate_limits"),
  ],
).enableRLS();

export const publicChatConversations = pgTable(
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
    correlationId: text("correlation_id").notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    handoffReceiptId: text("handoff_receipt_id"),
    handoffReason: varchar("handoff_reason", { length: 48 }),
    reconciliationRequired: boolean("reconciliation_required").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    check("public_chat_conversations_version_positive", sql`${table.version} > 0`),
    check("public_chat_conversations_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "public_chat_conversations_status_valid",
      sql`${table.status} in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')`,
    ),
    check("public_chat_conversations_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "public_chat_conversations_handoff_reason_valid",
      sql`${table.handoffReason} is null or ${table.handoffReason} in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable')`,
    ),
    check(
      "public_chat_conversations_handoff_state_valid",
      sql`(${table.status} in ('human_requested', 'waiting_for_human') and ${table.handoffReason} is not null) or (${table.status} not in ('human_requested', 'waiting_for_human'))`,
    ),
    index("public_chat_conversations_expiry_idx").on(table.expiresAt),
    index("public_chat_conversations_reconciliation_idx").on(
      table.reconciliationRequired,
      table.updatedAt,
    ),
    gatewayAccess("public_chat_conversations"),
  ],
).enableRLS();

export const publicChatMessages = pgTable(
  "public_chat_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
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
    unique("public_chat_messages_conversation_ordinal_unique").on(
      table.conversationId,
      table.ordinal,
    ),
    index("public_chat_messages_conversation_idx").on(table.conversationId, table.createdAt),
    check(
      "public_chat_messages_actor_valid",
      sql`${table.actor} in ('visitor', 'assistant', 'human', 'system')`,
    ),
    check(
      "public_chat_messages_state_valid",
      sql`${table.state} in ('accepted', 'answered', 'failed', 'handoff_required')`,
    ),
    check(
      "public_chat_messages_body_retention_valid",
      sql`(${table.bodyStored} = true and ${table.body} is not null) or (${table.bodyStored} = false and ${table.body} is null)`,
    ),
    gatewayAccess("public_chat_messages"),
  ],
).enableRLS();

export const publicChatCitations = pgTable(
  "public_chat_citations",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => publicChatMessages.id, { onDelete: "cascade" }),
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
    gatewayAccess("public_chat_citations"),
  ],
).enableRLS();

export const publicChatHandoffs = pgTable(
  "public_chat_handoffs",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
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
      "public_chat_handoffs_status_valid",
      sql`${table.status} in ('human_requested', 'waiting_for_human')`,
    ),
    gatewayAccess("public_chat_handoffs"),
  ],
).enableRLS();

export const publicChatIdempotency = pgTable(
  "public_chat_idempotency",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    expectedVersion: integer("expected_version").notNull(),
    leaseTokenHash: char("lease_token_hash", { length: 64 }).notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    result: jsonb("result"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("public_chat_idempotency_conversation_key_unique").on(
      table.conversationId,
      table.idempotencyKey,
    ),
    index("public_chat_idempotency_lease_idx").on(table.state, table.leaseExpiresAt),
    check(
      "public_chat_idempotency_state_valid",
      sql`${table.state} in ('in_progress', 'completed')`,
    ),
    check(
      "public_chat_idempotency_completion_valid",
      sql`(${table.state} = 'completed' and ${table.result} is not null and ${table.completedAt} is not null) or (${table.state} = 'in_progress' and ${table.completedAt} is null)`,
    ),
    gatewayAccess("public_chat_idempotency"),
  ],
).enableRLS();

export const publicChatAuditEvents = pgTable(
  "public_chat_audit_events",
  {
    id: text("id").primaryKey(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => publicChatConversations.id, { onDelete: "cascade" }),
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
    gatewayAccess("public_chat_audit_events"),
  ],
).enableRLS();

export const getPublicChatTableConfig = getTableConfig;
