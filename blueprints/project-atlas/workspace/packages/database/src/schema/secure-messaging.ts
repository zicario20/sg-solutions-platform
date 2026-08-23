import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { documentRecords } from "./documents.ts";

export const secureMessagingGatewayRole = pgRole("atlas_secure_messaging_gateway").existing();
const serverOnly = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: secureMessagingGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const secureMessageConversations = pgTable(
  "secure_message_conversations",
  {
    id: text("id").primaryKey(),
    ownerAccountId: text("owner_account_id").notNull(),
    contextRef: text("context_ref").notNull(),
    authorizationEpoch: integer("authorization_epoch").notNull(),
    policyEpoch: integer("policy_epoch").notNull(),
    clientVisible: boolean("client_visible").notNull().default(true),
    subject: varchar("subject", { length: 160 }).notNull(),
    reason: varchar("reason", { length: 32 }).notNull(),
    state: varchar("state", { length: 32 }).notNull(),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("secure_message_conversations_owner_context_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.updatedAt,
    ),
    check(
      "secure_message_conversations_reason_valid",
      sql`${table.reason} in ('general_question', 'service_status', 'document_question', 'payment_question', 'appointment_question', 'technical_support', 'complaint', 'security_issue', 'other')`,
    ),
    check(
      "secure_message_conversations_state_valid",
      sql`${table.state} in ('new', 'waiting_for_client', 'waiting_for_staff', 'waiting_for_human', 'human_active', 'resolved', 'closed', 'archived', 'blocked')`,
    ),
    check("secure_message_conversations_version_positive", sql`${table.version} > 0`),
    serverOnly("secure_message_conversations"),
  ],
).enableRLS();

export const secureMessageEntries = pgTable(
  "secure_message_entries",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => secureMessageConversations.id, { onDelete: "restrict" }),
    ordinal: integer("ordinal").notNull(),
    audience: varchar("audience", { length: 16 }).notNull(),
    sender: varchar("sender", { length: 16 }).notNull(),
    bodyCiphertext: text("body_ciphertext").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("secure_message_entries_conversation_ordinal_unique").on(
      table.conversationId,
      table.ordinal,
    ),
    index("secure_message_entries_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    check(
      "secure_message_entries_audience_valid",
      sql`${table.audience} in ('client', 'internal')`,
    ),
    check("secure_message_entries_sender_valid", sql`${table.sender} in ('client', 'staff')`),
    serverOnly("secure_message_entries"),
  ],
).enableRLS();

export const secureMessageDocumentReferences = pgTable(
  "secure_message_document_references",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => secureMessageConversations.id, { onDelete: "restrict" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documentRecords.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("secure_message_document_references_unique").on(table.conversationId, table.documentId),
    index("secure_message_document_references_conversation_idx").on(table.conversationId),
    serverOnly("secure_message_document_references"),
  ],
).enableRLS();

export const secureMessageAuditEvents = pgTable(
  "secure_message_audit_events",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => secureMessageConversations.id, { onDelete: "restrict" }),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    actorAccountId: text("actor_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("secure_message_audit_events_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    serverOnly("secure_message_audit_events"),
  ],
).enableRLS();
