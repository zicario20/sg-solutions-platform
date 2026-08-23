import { sql } from "drizzle-orm";
import {
  boolean,
  char,
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

export const documentGatewayRole = pgRole("atlas_document_gateway").existing();

const serverOnly = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: documentGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const documentRecords = pgTable(
  "document_records",
  {
    id: text("id").primaryKey(),
    ownerAccountId: text("owner_account_id").notNull(),
    contextRef: text("context_ref").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    clientVisible: boolean("client_visible").notNull().default(false),
    inheritanceBlocked: boolean("inheritance_blocked").notNull().default(false),
    minimumAssurance: varchar("minimum_assurance", { length: 8 }).notNull().default("aal1"),
    authorizationEpoch: integer("authorization_epoch").notNull().default(0),
    policyEpoch: integer("policy_epoch").notNull().default(0),
    requestState: varchar("request_state", { length: 32 }).notNull(),
    legalHold: boolean("legal_hold").notNull().default(false),
    lifecycle: varchar("lifecycle", { length: 32 }).notNull().default("active"),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("document_records_owner_context_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.updatedAt,
    ),
    check("document_records_assurance_valid", sql`${table.minimumAssurance} in ('aal1', 'aal2')`),
    check(
      "document_records_category_valid",
      sql`${table.category} in ('identity', 'address', 'financial', 'tax', 'credit', 'business', 'other')`,
    ),
    check(
      "document_records_lifecycle_valid",
      sql`${table.lifecycle} in ('active', 'archived', 'deletion_scheduled', 'tombstoned')`,
    ),
    check("document_records_version_positive", sql`${table.version} > 0`),
    serverOnly("document_records"),
  ],
).enableRLS();

export const documentVersions = pgTable(
  "document_versions",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentRecords.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    contentType: varchar("content_type", { length: 32 }),
    byteSize: integer("byte_size"),
    checksum: char("checksum", { length: 64 }),
    quarantineKey: text("quarantine_key").notNull(),
    acceptedKey: text("accepted_key"),
    safetyVerdict: varchar("safety_verdict", { length: 24 }).notNull().default("pending"),
    promotionState: varchar("promotion_state", { length: 32 }).notNull().default("quarantine_only"),
    reviewState: varchar("review_state", { length: 32 }).notNull().default("received"),
    createdByAccountId: text("created_by_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("document_versions_document_number_unique").on(table.documentId, table.versionNumber),
    index("document_versions_document_created_idx").on(table.documentId, table.createdAt),
    check(
      "document_versions_size_valid",
      sql`${table.byteSize} is null or (${table.byteSize} > 0 and ${table.byteSize} <= 26214400)`,
    ),
    check(
      "document_versions_content_type_valid",
      sql`${table.contentType} is null or ${table.contentType} in ('application/pdf', 'image/jpeg', 'image/png')`,
    ),
    check(
      "document_versions_checksum_valid",
      sql`${table.checksum} is null or ${table.checksum} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "document_versions_safety_valid",
      sql`${table.safetyVerdict} in ('pending', 'clean', 'malicious', 'unsupported', 'encrypted', 'corrupt', 'scan_failed', 'timed_out')`,
    ),
    check(
      "document_versions_promotion_valid",
      sql`${table.promotionState} in ('quarantine_only', 'promoted', 'promotion_failed', 'promotion_uncertain')`,
    ),
    check(
      "document_versions_clean_promotion",
      sql`(${table.promotionState} <> 'promoted') or (${table.safetyVerdict} = 'clean' and ${table.acceptedKey} is not null and ${table.checksum} is not null)`,
    ),
    serverOnly("document_versions"),
  ],
).enableRLS();

export const documentRequests = pgTable(
  "document_requests",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentRecords.id, { onDelete: "restrict" }),
    state: varchar("state", { length: 32 }).notNull(),
    instructions: varchar("instructions", { length: 1000 }),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
    createdByAccountId: text("created_by_account_id").notNull(),
    ...timestamps,
  },
  (table) => [
    index("document_requests_document_state_idx").on(table.documentId, table.state),
    check(
      "document_requests_state_valid",
      sql`${table.state} in ('requested', 'upload_pending', 'received', 'under_review', 'satisfied', 'needs_correction', 'waived', 'expired', 'cancelled')`,
    ),
    serverOnly("document_requests"),
  ],
).enableRLS();

export const documentUploadIntents = pgTable(
  "document_upload_intents",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentRecords.id, { onDelete: "restrict" }),
    requestId: text("request_id").references(() => documentRequests.id, { onDelete: "restrict" }),
    objectKey: text("object_key").notNull().unique(),
    declaredBytes: integer("declared_bytes").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("document_upload_intents_expiry_idx").on(table.expiresAt),
    check(
      "document_upload_intents_size_valid",
      sql`${table.declaredBytes} > 0 and ${table.declaredBytes} <= 26214400`,
    ),
    serverOnly("document_upload_intents"),
  ],
).enableRLS();

export const documentAuditEvents = pgTable(
  "document_audit_events",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentRecords.id, { onDelete: "restrict" }),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    actorAccountId: text("actor_account_id").notNull(),
    correlationId: varchar("correlation_id", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("document_audit_events_document_created_idx").on(table.documentId, table.createdAt),
    serverOnly("document_audit_events"),
  ],
).enableRLS();
