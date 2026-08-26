import { sql } from "drizzle-orm";
import {
  char,
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const voiceOperationsRole = pgRole("atlas_voice_operations").existing();

const voiceScope = (callId: unknown) =>
  sql`${callId} = nullif(current_setting('atlas.voice_call_id', true), '')`;

const voiceReadAppend = (name: string, callId: unknown) => [
  pgPolicy(`${name}_voice_select`, {
    as: "permissive",
    for: "select",
    to: voiceOperationsRole,
    using: voiceScope(callId),
  }),
  pgPolicy(`${name}_voice_insert`, {
    as: "permissive",
    for: "insert",
    to: voiceOperationsRole,
    withCheck: voiceScope(callId),
  }),
];

const voiceMutable = (name: string, callId: unknown) => [
  ...voiceReadAppend(name, callId),
  pgPolicy(`${name}_voice_update`, {
    as: "permissive",
    for: "update",
    to: voiceOperationsRole,
    using: voiceScope(callId),
    withCheck: voiceScope(callId),
  }),
];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

const canonicalId = (value: unknown) => sql`${value} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'`;

export const voiceCalls = pgTable(
  "voice_calls",
  {
    id: text("id").primaryKey(),
    correlationId: text("correlation_id").notNull().unique(),
    providerMode: varchar("provider_mode", { length: 16 }).notNull(),
    providerConnectionId: text("provider_connection_id").notNull(),
    providerCallReferenceDigest: char("provider_call_reference_digest", { length: 64 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    lifecycle: varchar("lifecycle", { length: 24 }).notNull(),
    verificationStatus: varchar("verification_status", { length: 16 }).notNull(),
    transferStatus: varchar("transfer_status", { length: 16 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    check("voice_calls_id_valid", canonicalId(table.id)),
    check("voice_calls_correlation_valid", canonicalId(table.correlationId)),
    check("voice_calls_provider_mode_valid", sql`${table.providerMode} = 'mock'`),
    check(
      "voice_calls_provider_digest_valid",
      sql`${table.providerCallReferenceDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check("voice_calls_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "voice_calls_lifecycle_valid",
      sql`${table.lifecycle} in ('received', 'greeting', 'language_selected', 'routing', 'active', 'handoff', 'voicemail', 'callback_pending', 'completed', 'failed')`,
    ),
    check(
      "voice_calls_verification_valid",
      sql`${table.verificationStatus} in ('unverified', 'pending', 'verified', 'failed', 'expired', 'locked')`,
    ),
    check(
      "voice_calls_transfer_valid",
      sql`${table.transferStatus} in ('none', 'requested', 'queued', 'connected', 'unavailable', 'completed')`,
    ),
    check("voice_calls_version_positive", sql`${table.version} > 0`),
    index("voice_calls_lifecycle_idx").on(table.lifecycle, table.updatedAt),
    ...voiceMutable("voice_calls", table.id),
  ],
).enableRLS();

export const voiceInteractions = pgTable(
  "voice_interactions",
  {
    id: text("id").notNull(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    operation: varchar("operation", { length: 48 }).notNull(),
    outcome: varchar("outcome", { length: 32 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ name: "voice_interactions_pk", columns: [table.callId, table.id] }),
    unique("voice_interactions_call_ordinal_unique").on(table.callId, table.ordinal),
    check("voice_interactions_ordinal_positive", sql`${table.ordinal} > 0`),
    check("voice_interactions_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "voice_interactions_outcome_valid",
      sql`${table.outcome} in ('allowed', 'denied', 'verification_required', 'confirmation_required', 'handoff', 'failed')`,
    ),
    ...voiceReadAppend("voice_interactions", table.callId),
  ],
).enableRLS();

export const voiceVerificationAttempts = pgTable(
  "voice_verification_attempts",
  {
    id: text("id").notNull(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).notNull(),
    method: varchar("method", { length: 24 }).notNull(),
    receiptDigest: char("receipt_digest", { length: 64 }),
    failureClass: varchar("failure_class", { length: 32 }),
    attemptedAt: timestamp("attempted_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ name: "voice_verification_attempts_pk", columns: [table.callId, table.id] }),
    check(
      "voice_verification_attempts_status_valid",
      sql`${table.status} in ('pending', 'verified', 'failed', 'expired', 'locked')`,
    ),
    check(
      "voice_verification_attempts_method_valid",
      sql`${table.method} in ('platform_record', 'one_time_challenge')`,
    ),
    check(
      "voice_verification_attempts_digest_valid",
      sql`${table.receiptDigest} is null or ${table.receiptDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "voice_verification_attempts_window_valid",
      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.attemptedAt}`,
    ),
    ...voiceReadAppend("voice_verification_attempts", table.callId),
  ],
).enableRLS();

export const voiceEscalations = pgTable(
  "voice_escalations",
  {
    id: text("id").notNull(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 16 }).notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    reasonCode: varchar("reason_code", { length: 40 }).notNull(),
    ownerReceiptId: text("owner_receipt_id"),
    correlationId: text("correlation_id").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ name: "voice_escalations_pk", columns: [table.callId, table.id] }),
    check(
      "voice_escalations_kind_valid",
      sql`${table.kind} in ('transfer', 'voicemail', 'message', 'callback')`,
    ),
    check(
      "voice_escalations_state_valid",
      sql`${table.state} in ('requested', 'queued', 'completed', 'unavailable', 'failed')`,
    ),
    check(
      "voice_escalations_completion_valid",
      sql`${table.completedAt} is null or ${table.completedAt} >= ${table.requestedAt}`,
    ),
    index("voice_escalations_state_idx").on(table.state, table.updatedAt),
    ...voiceMutable("voice_escalations", table.callId),
  ],
).enableRLS();

export const voiceCallbackRequests = pgTable(
  "voice_callback_requests",
  {
    id: text("id").notNull(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    ownerReceiptId: text("owner_receipt_id"),
    correlationId: text("correlation_id").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ name: "voice_callback_requests_pk", columns: [table.callId, table.id] }),
    unique("voice_callback_requests_call_idempotency_unique").on(
      table.callId,
      table.idempotencyKey,
    ),
    check(
      "voice_callback_requests_state_valid",
      sql`${table.state} in ('requested', 'queued', 'completed', 'cancelled', 'failed')`,
    ),
    ...voiceMutable("voice_callback_requests", table.callId),
  ],
).enableRLS();

export const voiceArtifacts = pgTable(
  "voice_artifacts",
  {
    id: text("id").notNull(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "cascade" }),
    artifactKind: varchar("artifact_kind", { length: 16 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    referenceDigest: char("reference_digest", { length: 64 }),
    retentionClass: varchar("retention_class", { length: 24 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ name: "voice_artifacts_pk", columns: [table.callId, table.id] }),
    check("voice_artifacts_kind_valid", sql`${table.artifactKind} in ('recording', 'transcript')`),
    check(
      "voice_artifacts_state_valid",
      sql`${table.state} in ('disabled', 'deletion_requested', 'deleted')`,
    ),
    check(
      "voice_artifacts_reference_valid",
      sql`${table.referenceDigest} is null or ${table.referenceDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check("voice_artifacts_retention_valid", sql`${table.retentionClass} = 'disabled'`),
    ...voiceMutable("voice_artifacts", table.callId),
  ],
).enableRLS();

export const voiceCommandReceipts = pgTable(
  "voice_command_receipts",
  {
    receiptId: text("receipt_id").primaryKey(),
    callId: text("call_id")
      .notNull()
      .references(() => voiceCalls.id, { onDelete: "restrict" }),
    commandId: text("command_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    commandDigest: char("command_digest", { length: 64 }).notNull(),
    operation: varchar("operation", { length: 48 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    resultKind: varchar("result_kind", { length: 32 }),
    resultCode: varchar("result_code", { length: 48 }),
    ownerReceiptId: text("owner_receipt_id"),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" })
      .default(sql`now() + interval '30 seconds'`)
      .notNull(),
    reservationVersion: integer("reservation_version").default(1).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("voice_command_receipts_call_command_unique").on(table.callId, table.commandId),
    unique("voice_command_receipts_call_idempotency_unique").on(table.callId, table.idempotencyKey),
    check("voice_command_receipts_digest_valid", sql`${table.commandDigest} ~ '^[0-9a-f]{64}$'`),
    check(
      "voice_command_receipts_state_valid",
      sql`${table.state} in ('reserved', 'reconciliation_required', 'completed', 'failed')`,
    ),
    check("voice_command_receipts_lease_valid", sql`${table.leaseExpiresAt} > ${table.issuedAt}`),
    check("voice_command_receipts_version_positive", sql`${table.reservationVersion} > 0`),
    check(
      "voice_command_receipts_result_kind_valid",
      sql`${table.resultKind} is null or ${table.resultKind} in ('completed', 'verification_required', 'confirmation_required', 'denied', 'unavailable')`,
    ),
    check(
      "voice_command_receipts_result_code_valid",
      sql`${table.resultCode} is null or ${table.resultCode} in ('language_selected', 'contact_hint_processed', 'public_information_ready', 'availability_ready', 'lead_created', 'appointment_requested', 'callback_requested', 'message_recorded', 'transfer_requested', 'voicemail_requested', 'approved_link_requested', 'portal_required', 'safe_status_ready', 'payment_projection_ready', 'missing_documents_ready', 'next_appointment_ready', 'secure_message_recorded')`,
    ),
    check(
      "voice_command_receipts_result_valid",
      sql`(${table.state} in ('reserved', 'reconciliation_required') and ${table.resultKind} is null and ${table.resultCode} is null and ${table.ownerReceiptId} is null and ${table.completedAt} is null) or (${table.state} in ('completed', 'failed') and ${table.resultKind} is not null and ${table.completedAt} >= ${table.issuedAt} and ((${table.resultKind} = 'completed' and ${table.resultCode} is not null and ${table.ownerReceiptId} is not null) or (${table.resultKind} <> 'completed' and ${table.resultCode} is null and ${table.ownerReceiptId} is null)))`,
    ),
    ...voiceMutable("voice_command_receipts", table.callId),
  ],
).enableRLS();
