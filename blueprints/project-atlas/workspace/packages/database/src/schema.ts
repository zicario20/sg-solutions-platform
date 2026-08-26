import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
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
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export * from "./schema/appointments.ts";
export * from "./schema/bookkeeping.ts";
export * from "./schema/business-compliance.ts";
export * from "./schema/business-formation.ts";
export * from "./schema/business-funding.ts";
export * from "./schema/documents.ts";
export * from "./schema/ein-business-documents.ts";
export * from "./schema/home-buying-assistance.ts";
export * from "./schema/marketplace.ts";
export * from "./schema/recommendation-engine.ts";
export * from "./schema/secure-messaging.ts";
export * from "./schema/stripe-payments.ts";

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

const publicChatGatewayRole = pgRole("atlas_public_chat_gateway").existing();
export const communicationsGatewayRole = pgRole("atlas_communications_gateway").existing();

const communicationsOnly = (name: string) =>
  pgPolicy(`${name}_communications_scope`, {
    as: "permissive",
    for: "all",
    to: communicationsGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });

const publicSessionId = sql`nullif(current_setting('atlas.public_chat_session_id', true), '')`;

const publicConversationScope = (conversationId: unknown, channelKind: unknown) =>
  sql`${channelKind} = 'public_web' and exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = ${conversationId}
      and pcs.session_id = ${publicSessionId}
  )`;

const communicationsConversationScope = (channelKind: unknown) => sql`${channelKind} = 'whatsapp'`;

const communicationsCommandScope = (commandId: unknown) =>
  sql`exists (
    select 1 from communication_outbound_commands command
    where command.id = ${commandId} and command.channel_kind = 'whatsapp'
  )`;

const publicChildConversationScope = (conversationId: unknown) =>
  sql`exists (
    select 1
    from public_chat_conversation_sessions pcs
    where pcs.conversation_id = ${conversationId}
      and pcs.session_id = ${publicSessionId}
  )`;

const publicCitationScope = (messageId: unknown) =>
  sql`exists (
    select 1
    from communication_messages message
    join public_chat_conversation_sessions pcs on pcs.conversation_id = message.conversation_id
    where message.id = ${messageId}
      and message.channel_kind = 'public_web'
      and pcs.session_id = ${publicSessionId}
  )`;

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
    for: "all",
    to: communicationsGatewayRole,
    using: communicationsConversationScope(channelKind),
    withCheck: communicationsConversationScope(channelKind),
  }),
];

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

const supersededPublicChatConversations = pgTable(
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
    startIdempotencyKey: varchar("start_idempotency_key", { length: 128 }).notNull(),
    startFingerprint: char("start_fingerprint", { length: 64 }).notNull(),
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
    unique("public_chat_conversations_session_start_key_unique").on(
      table.sessionId,
      table.startIdempotencyKey,
    ),
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

const supersededPublicChatMessages = pgTable(
  "public_chat_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
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
      .references(() => communicationMessages.id, { onDelete: "restrict" }),
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
    pgPolicy("public_chat_citations_server_gateway_only", {
      as: "permissive",
      for: "all",
      to: publicChatGatewayRole,
      using: publicCitationScope(table.messageId),
      withCheck: publicCitationScope(table.messageId),
    }),
  ],
).enableRLS();

const supersededPublicChatHandoffs = pgTable(
  "public_chat_handoffs",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
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
      .references(() => communicationConversations.id, { onDelete: "restrict" }),
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
      "public_chat_idempotency_command_kind_valid",
      sql`${table.commandKind} in ('message', 'handoff', 'locale', 'close')`,
    ),
    check(
      "public_chat_idempotency_completion_valid",
      sql`(${table.state} = 'completed' and ${table.result} is not null and ${table.completedAt} is not null) or (${table.state} = 'in_progress' and ${table.completedAt} is null)`,
    ),
    pgPolicy("public_chat_idempotency_server_gateway_only", {
      as: "permissive",
      for: "all",
      to: publicChatGatewayRole,
      using: publicChildConversationScope(table.conversationId),
      withCheck: publicChildConversationScope(table.conversationId),
    }),
  ],
).enableRLS();

const supersededPublicChatAuditEvents = pgTable(
  "public_chat_audit_events",
  {
    id: text("id").primaryKey(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => supersededPublicChatConversations.id, { onDelete: "cascade" }),
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

export const communicationChannelConnections = pgTable(
  "communication_channel_connections",
  {
    id: text("id").primaryKey(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    adapterKey: varchar("adapter_key", { length: 32 }).notNull(),
    readinessState: varchar("readiness_state", { length: 32 }).notNull(),
    policyVersion: varchar("policy_version", { length: 80 }).notNull(),
    version: integer("version").notNull(),
    configuredAt: timestamp("configured_at", { withTimezone: true, mode: "date" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("communication_channel_connections_id_channel_unique").on(table.id, table.channelKind),
    check(
      "communication_channel_connections_channel_valid",
      sql`${table.channelKind} = 'whatsapp'`,
    ),
    check(
      "communication_channel_connections_adapter_valid",
      sql`${table.adapterKey} = 'meta_cloud'`,
    ),
    check(
      "communication_channel_connections_readiness_valid",
      sql`${table.readinessState} in ('disabled', 'configured', 'sandbox_verified', 'production_verified', 'active', 'suspended', 'retired')`,
    ),
    check("communication_channel_connections_version_positive", sql`${table.version} > 0`),
    index("communication_channel_connections_readiness_idx").on(
      table.readinessState,
      table.updatedAt,
    ),
    communicationsOnly("communication_channel_connections"),
  ],
).enableRLS();

export const communicationContactBindings = pgTable(
  "communication_contact_bindings",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    endpointDigest: char("endpoint_digest", { length: 64 }).notNull(),
    endpointDigestKeyVersion: varchar("endpoint_digest_key_version", { length: 80 }).notNull(),
    trustState: varchar("trust_state", { length: 32 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    contactPolicyVersion: integer("contact_policy_version").notNull(),
    version: integer("version").notNull(),
    verificationReceiptId: text("verification_receipt_id"),
    endpointVerifiedAt: timestamp("endpoint_verified_at", { withTimezone: true, mode: "date" }),
    verificationExpiresAt: timestamp("verification_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    wrongPersonReportedAt: timestamp("wrong_person_reported_at", {
      withTimezone: true,
      mode: "date",
    }),
    reassignmentRiskAt: timestamp("reassignment_risk_at", {
      withTimezone: true,
      mode: "date",
    }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "communication_contact_bindings_connection_channel_fk",
      columns: [table.connectionId, table.channelKind],
      foreignColumns: [
        communicationChannelConnections.id,
        communicationChannelConnections.channelKind,
      ],
    }).onDelete("restrict"),
    unique("communication_contact_bindings_id_connection_channel_unique").on(
      table.id,
      table.connectionId,
      table.channelKind,
    ),
    unique("communication_contact_bindings_id_channel_unique").on(table.id, table.channelKind),
    unique("communication_contact_bindings_endpoint_unique").on(
      table.connectionId,
      table.endpointDigestKeyVersion,
      table.endpointDigest,
    ),
    check("communication_contact_bindings_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
    check(
      "communication_contact_bindings_trust_valid",
      sql`${table.trustState} in ('unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked')`,
    ),
    check("communication_contact_bindings_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "communication_contact_bindings_endpoint_digest_valid",
      sql`${table.endpointDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_contact_bindings_policy_version_positive",
      sql`${table.contactPolicyVersion} > 0`,
    ),
    check("communication_contact_bindings_version_positive", sql`${table.version} > 0`),
    check(
      "communication_contact_bindings_verification_window_valid",
      sql`${table.verificationExpiresAt} is null or (${table.endpointVerifiedAt} is not null and ${table.verificationExpiresAt} > ${table.endpointVerifiedAt})`,
    ),
    index("communication_contact_bindings_trust_idx").on(table.trustState, table.updatedAt),
    communicationsOnly("communication_contact_bindings"),
  ],
).enableRLS();

export const communicationContactEvidenceEvents = pgTable(
  "communication_contact_evidence_events",
  {
    id: text("id").primaryKey(),
    bindingId: text("binding_id")
      .notNull()
      .references(() => communicationContactBindings.id, { onDelete: "cascade" }),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    eventKind: varchar("event_kind", { length: 40 }).notNull(),
    purpose: varchar("purpose", { length: 24 }),
    consentState: varchar("consent_state", { length: 24 }),
    fenceState: varchar("fence_state", { length: 24 }),
    bindingTrustState: varchar("binding_trust_state", { length: 32 }),
    reviewResolution: varchar("review_resolution", { length: 16 }),
    evidenceReceiptId: text("evidence_receipt_id"),
    receiptKind: varchar("receipt_kind", { length: 40 }),
    owningDomain: varchar("owning_domain", { length: 80 }),
    authorityRole: varchar("authority_role", { length: 32 }),
    authorityVersion: integer("authority_version"),
    contactEvidenceEventId: text("contact_evidence_event_id"),
    contactEvidenceEventKind: varchar("contact_evidence_event_kind", { length: 40 })
      .notNull()
      .default("contact_withdrawal_recorded"),
    triggeringEventId: text("triggering_event_id"),
    policyVersion: varchar("policy_version", { length: 80 }),
    correlationId: text("correlation_id"),
    receiptIssuedAt: timestamp("receipt_issued_at", { withTimezone: true, mode: "date" }),
    receiptValidUntil: timestamp("receipt_valid_until", { withTimezone: true, mode: "date" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("communication_contact_evidence_events_binding_sequence_unique").on(
      table.bindingId,
      table.sequence,
    ),
    unique("communication_contact_evidence_events_receipt_unique").on(table.evidenceReceiptId),
    unique("communication_contact_evidence_events_id_binding_kind_unique").on(
      table.id,
      table.bindingId,
      table.eventKind,
    ),
    foreignKey({
      name: "communication_contact_evidence_events_typed_contact_binding_fk",
      columns: [table.contactEvidenceEventId, table.bindingId, table.contactEvidenceEventKind],
      foreignColumns: [table.id, table.bindingId, table.eventKind],
    }).onDelete("restrict"),
    check(
      "communication_contact_evidence_events_kind_valid",
      sql`${table.eventKind} in ('consent_granted', 'consent_withdrawn', 'consent_regranted', 'contact_withdrawal_recorded', 'ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn', 'binding_suspended', 'binding_revalidated')`,
    ),
    check(
      "communication_contact_evidence_events_authority_valid",
      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.eventKind} = 'contact_withdrawal_recorded' and ((${table.owningDomain} = 'M078' and ${table.authorityRole} = 'consent') or (${table.owningDomain} = 'M004' and ${table.authorityRole} = 'channel_policy_detection'))) or (${table.eventKind} = 'consent_withdrawn' and ${table.owningDomain} is null and ${table.authorityRole} is null) or (${table.eventKind} in ('ambiguous_opt_out_detected', 'ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.owningDomain} = 'M078' and ${table.authorityRole} = 'contact_review') or (${table.eventKind} in ('binding_suspended', 'binding_revalidated') and ${table.authorityRole} = 'binding_verification')`,
    ),
    check(
      "communication_contact_evidence_events_receipt_valid",
      sql`(${table.eventKind} in ('consent_granted', 'consent_regranted') and ${table.receiptKind} = 'consent_evidence') or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.receiptKind} = 'contact_withdrawal') or (${table.eventKind} = 'consent_withdrawn' and ${table.receiptKind} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.receiptKind} = 'ambiguous_opt_out_detection') or (${table.eventKind} in ('ambiguous_opt_out_cleared', 'ambiguous_opt_out_withdrawn') and ${table.receiptKind} = 'ambiguous_opt_out_resolution') or (${table.eventKind} = 'binding_suspended' and ${table.receiptKind} = 'binding_suspension') or (${table.eventKind} = 'binding_revalidated' and ${table.receiptKind} = 'binding_revalidation')`,
    ),
    check(
      "communication_contact_evidence_events_state_shape_valid",
      sql`(${table.eventKind} = 'consent_granted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_regranted' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'contact_withdrawal_recorded' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.authorityVersion} is null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ((${table.owningDomain} = 'M078' and ${table.triggeringEventId} is null) or (${table.owningDomain} = 'M004' and ${table.triggeringEventId} is not null)) and ${table.policyVersion} is null) or (${table.eventKind} = 'consent_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is null and ${table.bindingTrustState} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'ambiguous_opt_out_detected' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'opt_out_pending' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.reviewResolution} is null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_cleared' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'granted' and ${table.fenceState} is not null and ${table.fenceState} = 'normal_after_review' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'clear' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'ambiguous_opt_out_withdrawn' and ${table.purpose} is not null and ${table.consentState} is not null and ${table.consentState} = 'withdrawn' and ${table.fenceState} is not null and ${table.fenceState} = 'withdrawn' and ${table.authorityVersion} is not null and ${table.authorityVersion} > 0 and ${table.reviewResolution} is not null and ${table.reviewResolution} = 'withdraw' and ${table.triggeringEventId} is not null and ${table.policyVersion} is not null and ${table.bindingTrustState} is null) or (${table.eventKind} = 'binding_suspended' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'suspended' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null) or (${table.eventKind} = 'binding_revalidated' and ${table.bindingTrustState} is not null and ${table.bindingTrustState} = 'reverified' and ${table.purpose} is null and ${table.consentState} is null and ${table.fenceState} is null and ${table.reviewResolution} is null and ${table.authorityVersion} is null and ${table.triggeringEventId} is null and ${table.policyVersion} is null)`,
    ),
    check(
      "communication_contact_evidence_events_contact_link_valid",
      sql`(${table.eventKind} = 'consent_withdrawn' and ${table.contactEvidenceEventId} is not null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.contactEvidenceEventId} is null)`,
    ),
    check(
      "communication_contact_evidence_events_contact_kind_valid",
      sql`${table.contactEvidenceEventKind} = 'contact_withdrawal_recorded'`,
    ),
    check(
      "communication_contact_evidence_events_receipt_owner_valid",
      sql`(${table.eventKind} = 'consent_withdrawn' and ${table.evidenceReceiptId} is null and ${table.receiptKind} is null and ${table.owningDomain} is null and ${table.authorityRole} is null and ${table.correlationId} is null and ${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.eventKind} <> 'consent_withdrawn' and ${table.evidenceReceiptId} is not null and ${table.receiptKind} is not null and ${table.owningDomain} is not null and ${table.authorityRole} is not null and ${table.correlationId} is not null)`,
    ),
    check("communication_contact_evidence_events_sequence_positive", sql`${table.sequence} > 0`),
    check(
      "communication_contact_evidence_events_receipt_window_valid",
      sql`(${table.receiptIssuedAt} is null and ${table.receiptValidUntil} is null) or (${table.receiptIssuedAt} is not null and ${table.receiptValidUntil} is not null and ${table.receiptValidUntil} > ${table.receiptIssuedAt})`,
    ),
    index("communication_contact_evidence_events_binding_idx").on(table.bindingId, table.sequence),
    pgPolicy("communication_contact_evidence_events_communications_select", {
      as: "permissive",
      for: "select",
      to: communicationsGatewayRole,
      using: sql`true`,
    }),
    pgPolicy("communication_contact_evidence_events_communications_insert", {
      as: "permissive",
      for: "insert",
      to: communicationsGatewayRole,
      withCheck: sql`true`,
    }),
  ],
).enableRLS();

export const communicationContactPolicies = pgTable(
  "communication_contact_policies",
  {
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
    fence: integer("fence").notNull().default(0),
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
      sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
    ),
    check(
      "communication_contact_policies_consent_valid",
      sql`${table.consentState} in ('not_requested', 'granted', 'withdrawn', 'expired', 'superseded')`,
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
    check("communication_contact_policies_fence_nonnegative", sql`${table.fence} >= 0`),
    index("communication_contact_policies_fence_idx").on(table.fenceState, table.updatedAt),
    communicationsOnly("communication_contact_policies"),
  ],
).enableRLS();

export const communicationConversations = pgTable(
  "communication_conversations",
  {
    id: text("id").primaryKey(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    correlationId: text("correlation_id").notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    reconciliationRequired: boolean("reconciliation_required").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("communication_conversations_id_channel_unique").on(table.id, table.channelKind),
    check(
      "communication_conversations_channel_valid",
      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
    ),
    check("communication_conversations_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "communication_conversations_status_valid",
      sql`${table.status} in ('new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'expired', 'restricted')`,
    ),
    check("communication_conversations_version_positive", sql`${table.version} > 0`),
    check(
      "communication_conversations_expiry_valid",
      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "communication_conversations_public_expiry_required",
      sql`${table.channelKind} <> 'public_web' or ${table.expiresAt} is not null`,
    ),
    index("communication_conversations_activity_idx").on(table.channelKind, table.lastActivityAt),
    index("communication_conversations_reconciliation_idx").on(
      table.reconciliationRequired,
      table.updatedAt,
    ),
    ...sharedPolicies("communication_conversations", table.id, table.channelKind),
  ],
).enableRLS();

export const communicationParticipants = pgTable(
  "communication_participants",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    channelBindingId: text("channel_binding_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }).notNull(),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "communication_participants_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_participants_binding_channel_fk",
      columns: [table.channelBindingId, table.channelKind],
      foreignColumns: [communicationContactBindings.id, communicationContactBindings.channelKind],
    }).onDelete("restrict"),
    unique("communication_participants_id_conversation_unique").on(table.id, table.conversationId),
    unique("communication_participants_id_conversation_channel_unique").on(
      table.id,
      table.conversationId,
      table.channelKind,
    ),
    check(
      "communication_participants_channel_valid",
      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
    ),
    check(
      "communication_participants_kind_valid",
      sql`${table.kind} in ('external', 'automated', 'human', 'system')`,
    ),
    check(
      "communication_participants_membership_window_valid",
      sql`${table.leftAt} is null or ${table.leftAt} >= ${table.joinedAt}`,
    ),
    index("communication_participants_conversation_idx").on(table.conversationId, table.joinedAt),
    ...sharedPolicies("communication_participants", table.conversationId, table.channelKind),
  ],
).enableRLS();

export const publicChatConversationSessions = pgTable(
  "public_chat_conversation_sessions",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("public_web"),
    sessionId: text("session_id")
      .notNull()
      .references(() => publicChatSessions.id, { onDelete: "cascade" }),
    participantId: text("participant_id").notNull(),
    noticeVersion: varchar("notice_version", { length: 80 }).notNull(),
    startIdempotencyKey: varchar("start_idempotency_key", { length: 128 }).notNull(),
    startFingerprint: char("start_fingerprint", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "public_chat_conversation_sessions_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("cascade"),
    foreignKey({
      name: "public_chat_conversation_sessions_participant_conversation_channel_fk",
      columns: [table.participantId, table.conversationId, table.channelKind],
      foreignColumns: [
        communicationParticipants.id,
        communicationParticipants.conversationId,
        communicationParticipants.channelKind,
      ],
    }).onDelete("cascade"),
    unique("public_chat_conversation_sessions_conversation_unique").on(table.conversationId),
    unique("public_chat_conversation_sessions_session_start_key_unique").on(
      table.sessionId,
      table.startIdempotencyKey,
    ),
    check(
      "public_chat_conversation_sessions_start_fingerprint_valid",
      sql`${table.startFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "public_chat_conversation_sessions_channel_valid",
      sql`${table.channelKind} = 'public_web'`,
    ),
    index("public_chat_conversation_sessions_session_idx").on(table.sessionId, table.createdAt),
    pgPolicy("public_chat_conversation_sessions_public_chat_scope", {
      as: "permissive",
      for: "all",
      to: publicChatGatewayRole,
      using: sql`${table.sessionId} = ${publicSessionId}`,
      withCheck: sql`${table.sessionId} = ${publicSessionId}`,
    }),
  ],
).enableRLS();

export const communicationMessages = pgTable(
  "communication_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    ordinal: integer("ordinal").notNull(),
    direction: varchar("direction", { length: 16 }).notNull(),
    senderParticipantId: text("sender_participant_id").notNull(),
    recipientParticipantId: text("recipient_participant_id"),
    locale: varchar("locale", { length: 2 }).notNull(),
    kind: varchar("kind", { length: 24 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    body: text("body"),
    bodyStored: boolean("body_stored").notNull().default(false),
    bodyRetentionPolicy: varchar("body_retention_policy", { length: 24 })
      .notNull()
      .default("metadata_only"),
    actions: jsonb("actions").notNull().default(sql`'[]'::jsonb`),
    rejectionReason: varchar("rejection_reason", { length: 48 }),
    externalMessageReference: text("external_message_reference"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "communication_messages_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_messages_sender_conversation_fk",
      columns: [table.senderParticipantId, table.conversationId],
      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "communication_messages_recipient_conversation_fk",
      columns: [table.recipientParticipantId, table.conversationId],
      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
    }).onDelete("restrict"),
    unique("communication_messages_id_conversation_unique").on(table.id, table.conversationId),
    unique("communication_messages_conversation_ordinal_unique").on(
      table.conversationId,
      table.ordinal,
    ),
    check(
      "communication_messages_channel_valid",
      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
    ),
    check("communication_messages_ordinal_positive", sql`${table.ordinal} > 0`),
    check(
      "communication_messages_direction_valid",
      sql`${table.direction} in ('inbound', 'outbound', 'system')`,
    ),
    check("communication_messages_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "communication_messages_kind_valid",
      sql`${table.kind} in ('text', 'interactive', 'structured_marker', 'media_reference', 'system')`,
    ),
    check(
      "communication_messages_state_valid",
      sql`${table.state} in ('accepted', 'answered', 'failed', 'handoff_required')`,
    ),
    check(
      "communication_messages_body_retention_valid",
      sql`(${table.bodyRetentionPolicy} = 'metadata_only' and ${table.bodyStored} = false and ${table.body} is null) or (${table.bodyRetentionPolicy} in ('synthetic_local_text', 'approved') and ${table.bodyStored} = true and ${table.body} is not null)`,
    ),
    index("communication_messages_conversation_idx").on(table.conversationId, table.ordinal),
    index("communication_messages_external_reference_idx").on(table.externalMessageReference),
    ...sharedPolicies("communication_messages", table.conversationId, table.channelKind),
  ],
).enableRLS();

export const communicationProviderEventReceipts = pgTable(
  "communication_provider_event_receipts",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("whatsapp"),
    externalEventReference: text("external_event_reference").notNull(),
    bodyDigest: char("body_digest", { length: 64 }).notNull(),
    eventKind: varchar("event_kind", { length: 32 }).notNull(),
    state: varchar("state", { length: 32 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
    signatureVerified: boolean("signature_verified").notNull(),
    correlationId: text("correlation_id").notNull(),
    outcomeReason: varchar("outcome_reason", { length: 48 }),
    processingVersion: integer("processing_version").notNull(),
    leaseOwnerId: text("lease_owner_id"),
    leaseTokenHash: char("lease_token_hash", { length: 64 }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull(),
    persistedAt: timestamp("persisted_at", { withTimezone: true, mode: "date" }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "communication_provider_event_receipts_connection_channel_fk",
      columns: [table.connectionId, table.channelKind],
      foreignColumns: [
        communicationChannelConnections.id,
        communicationChannelConnections.channelKind,
      ],
    }).onDelete("restrict"),
    unique("communication_provider_event_receipts_id_connection_unique").on(
      table.id,
      table.connectionId,
    ),
    unique("communication_provider_event_receipts_identity_unique").on(
      table.connectionId,
      table.externalEventReference,
    ),
    check(
      "communication_provider_event_receipts_kind_valid",
      sql`${table.eventKind} in ('text_message', 'interactive_reply', 'message_status', 'control', 'media_reference', 'template_projection', 'unsupported_verified')`,
    ),
    check(
      "communication_provider_event_receipts_state_valid",
      sql`${table.state} in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter')`,
    ),
    check(
      "communication_provider_event_receipts_signature_valid",
      sql`${table.signatureVerified} = true`,
    ),
    check(
      "communication_provider_event_receipts_channel_valid",
      sql`${table.channelKind} = 'whatsapp'`,
    ),
    check(
      "communication_provider_event_receipts_schema_version_valid",
      sql`${table.schemaVersion} = 'meta-envelope.v1'`,
    ),
    check(
      "communication_provider_event_receipts_external_event_reference_valid",
      sql`${table.externalEventReference} ~ '^meta_evt_[0-9a-f]{32,64}$'`,
    ),
    check(
      "communication_provider_event_receipts_body_digest_valid",
      sql`${table.bodyDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_provider_event_receipts_lease_token_hash_valid",
      sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_provider_event_receipts_processing_version_nonnegative",
      sql`${table.processingVersion} >= 0`,
    ),
    check(
      "communication_provider_event_receipts_lease_valid",
      sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
    ),
    index("communication_provider_event_receipts_work_idx").on(
      table.state,
      table.leaseExpiresAt,
      table.receivedAt,
    ),
    communicationsOnly("communication_provider_event_receipts"),
  ],
).enableRLS();

export const communicationEventEnvelopes = pgTable(
  "communication_event_envelopes",
  {
    id: text("id").primaryKey(),
    receiptId: text("receipt_id").notNull().unique(),
    connectionId: text("connection_id").notNull(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull().default("whatsapp"),
    eventKind: varchar("event_kind", { length: 32 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
    conversationId: text("conversation_id"),
    participantId: text("participant_id"),
    bindingId: text("binding_id"),
    messageId: text("message_id"),
    messageReference: text("message_reference"),
    externalMessageReference: text("external_message_reference"),
    canonicalText: text("canonical_text"),
    deliveryState: varchar("delivery_state", { length: 24 }),
    interactiveKind: varchar("interactive_kind", { length: 16 }),
    interactiveId: varchar("interactive_id", { length: 240 }),
    interactiveTitle: varchar("interactive_title", { length: 240 }),
    mediaExternalReference: text("media_external_reference"),
    mediaDeclaredKind: varchar("media_declared_kind", { length: 16 }),
    mediaMimeType: varchar("media_mime_type", { length: 160 }),
    mediaChecksum: char("media_checksum", { length: 64 }),
    templateId: text("template_id"),
    templateAuthorityState: varchar("template_authority_state", { length: 32 }),
    templateAuthorityVersion: integer("template_authority_version"),
    templateAuthorityUpdatedAt: timestamp("template_authority_updated_at", {
      withTimezone: true,
      mode: "date",
    }),
    templateProviderReference: text("template_provider_reference"),
    templateKey: varchar("template_key", { length: 120 }),
    templateLocale: varchar("template_locale", { length: 2 }),
    templateCategory: varchar("template_category", { length: 24 }),
    templateProviderState: varchar("template_provider_state", { length: 32 }),
    templateProviderVersion: varchar("template_provider_version", { length: 80 }),
    templateProviderTimestamp: timestamp("template_provider_timestamp", {
      withTimezone: true,
      mode: "date",
    }),
    templateComponents: jsonb("template_components"),
    unsupportedReason: varchar("unsupported_reason", { length: 48 }),
    bodyRetentionPolicy: varchar("body_retention_policy", { length: 24 })
      .notNull()
      .default("metadata_only"),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "communication_event_envelopes_receipt_connection_fk",
      columns: [table.receiptId, table.connectionId],
      foreignColumns: [
        communicationProviderEventReceipts.id,
        communicationProviderEventReceipts.connectionId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_event_envelopes_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("restrict"),
    foreignKey({
      name: "communication_event_envelopes_participant_conversation_channel_fk",
      columns: [table.participantId, table.conversationId, table.channelKind],
      foreignColumns: [
        communicationParticipants.id,
        communicationParticipants.conversationId,
        communicationParticipants.channelKind,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "communication_event_envelopes_message_conversation_fk",
      columns: [table.messageId, table.conversationId],
      foreignColumns: [communicationMessages.id, communicationMessages.conversationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "communication_event_envelopes_binding_connection_channel_fk",
      columns: [table.bindingId, table.connectionId, table.channelKind],
      foreignColumns: [
        communicationContactBindings.id,
        communicationContactBindings.connectionId,
        communicationContactBindings.channelKind,
      ],
    }).onDelete("restrict"),
    check(
      "communication_event_envelopes_kind_valid",
      sql`${table.eventKind} in ('text_message', 'interactive_reply', 'message_status', 'media_reference', 'template_projection', 'unsupported_verified')`,
    ),
    check("communication_event_envelopes_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
    check(
      "communication_event_envelopes_schema_version_valid",
      sql`${table.schemaVersion} = 'meta-envelope.v1'`,
    ),
    check(
      "communication_event_envelopes_retention_valid",
      sql`${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null`,
    ),
    check(
      "communication_event_envelopes_typed_shape_valid",
      sql`(${table.eventKind} = 'text_message' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.bodyRetentionPolicy} = 'metadata_only' and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.deliveryState} is null and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'interactive_reply' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.interactiveKind} is not null and ${table.interactiveKind} in ('button', 'list') and ${table.interactiveId} is not null and ${table.interactiveTitle} is not null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'message_status' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is not null and ${table.deliveryState} is not null and ${table.deliveryState} in ('sent', 'delivered', 'read', 'failed') and ${table.interactiveKind} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'media_reference' and ${table.bindingId} is not null and ${table.messageReference} is not null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.mediaExternalReference} is not null and ${table.mediaDeclaredKind} is not null and ${table.mediaDeclaredKind} in ('image', 'document', 'audio', 'sticker', 'video') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.templateProviderReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'template_projection' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.templateId} is not null and ${table.templateAuthorityState} is not null and ${table.templateAuthorityState} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded') and ${table.templateAuthorityVersion} is not null and ${table.templateAuthorityVersion} > 0 and ${table.templateAuthorityUpdatedAt} is not null and ${table.templateProviderReference} is not null and ${table.templateKey} is not null and ${table.templateLocale} is not null and ${table.templateLocale} in ('es', 'en') and ${table.templateCategory} is not null and ${table.templateCategory} in ('authentication', 'marketing', 'utility') and ${table.templateProviderState} is not null and ${table.templateProviderState} in ('submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled') and ${table.templateProviderVersion} is not null and ${table.templateProviderTimestamp} is not null and ${table.templateComponents} is not null and jsonb_typeof(${table.templateComponents}) = 'array' and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.unsupportedReason} is null) or (${table.eventKind} = 'unsupported_verified' and ${table.bindingId} is null and ${table.messageReference} is null and ${table.canonicalText} is null and ${table.externalMessageReference} is null and ${table.unsupportedReason} is not null and ${table.unsupportedReason} in ('ambiguous_payload', 'connection_mismatch', 'malformed_payload', 'payload_too_large', 'template_manual_review', 'unsupported_event', 'unverified_context') and ${table.interactiveKind} is null and ${table.deliveryState} is null and ${table.mediaExternalReference} is null and ${table.templateProviderReference} is null)`,
    ),
    check(
      "communication_event_envelopes_field_ownership_valid",
      sql`(${table.bindingId} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.messageReference} is null or ${table.eventKind} in ('text_message', 'interactive_reply', 'media_reference')) and (${table.externalMessageReference} is null or ${table.eventKind} = 'message_status') and (${table.canonicalText} is null or ${table.eventKind} = 'text_message') and (${table.deliveryState} is null or ${table.eventKind} = 'message_status') and (${table.interactiveKind} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveId} is null or ${table.eventKind} = 'interactive_reply') and (${table.interactiveTitle} is null or ${table.eventKind} = 'interactive_reply') and (${table.mediaExternalReference} is null or ${table.eventKind} = 'media_reference') and (${table.mediaDeclaredKind} is null or ${table.eventKind} = 'media_reference') and (${table.mediaMimeType} is null or ${table.eventKind} = 'media_reference') and (${table.mediaChecksum} is null or ${table.eventKind} = 'media_reference') and (${table.templateId} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityState} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateAuthorityUpdatedAt} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderReference} is null or ${table.eventKind} = 'template_projection') and (${table.templateKey} is null or ${table.eventKind} = 'template_projection') and (${table.templateLocale} is null or ${table.eventKind} = 'template_projection') and (${table.templateCategory} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderState} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderVersion} is null or ${table.eventKind} = 'template_projection') and (${table.templateProviderTimestamp} is null or ${table.eventKind} = 'template_projection') and (${table.templateComponents} is null or ${table.eventKind} = 'template_projection') and (${table.unsupportedReason} is null or ${table.eventKind} = 'unsupported_verified')`,
    ),
    check(
      "communication_event_envelopes_reference_shape_valid",
      sql`(${table.participantId} is null or ${table.conversationId} is not null) and (${table.messageId} is null or ${table.conversationId} is not null) and (${table.messageReference} is null or (char_length(${table.messageReference}) <= 128 and ${table.messageReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.externalMessageReference} is null or (char_length(${table.externalMessageReference}) <= 128 and ${table.externalMessageReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.mediaExternalReference} is null or (char_length(${table.mediaExternalReference}) <= 128 and ${table.mediaExternalReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$')) and (${table.templateProviderReference} is null or (char_length(${table.templateProviderReference}) <= 128 and ${table.templateProviderReference} ~ '^[A-Za-z0-9][A-Za-z0-9._]{0,127}$'))`,
    ),
    check(
      "communication_event_envelopes_media_checksum_valid",
      sql`${table.mediaChecksum} is null or ${table.mediaChecksum} ~ '^[0-9a-f]{64}$'`,
    ),
    index("communication_event_envelopes_conversation_idx").on(
      table.conversationId,
      table.occurredAt,
    ),
    communicationsOnly("communication_event_envelopes"),
  ],
).enableRLS();

export const communicationMessageTemplates = pgTable(
  "communication_message_templates",
  {
    id: text("id").primaryKey(),
    templateKey: varchar("template_key", { length: 120 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    purpose: varchar("purpose", { length: 24 }).notNull(),
    definitionSource: varchar("definition_source", { length: 32 }).notNull(),
    definitionVersion: integer("definition_version").notNull(),
    variableKeys: jsonb("variable_keys").notNull().default(sql`'[]'::jsonb`),
    state: varchar("state", { length: 32 }).notNull(),
    internallyApproved: boolean("internally_approved").notNull().default(false),
    approvalReceiptId: text("approval_receipt_id"),
    approvalReceiptIssuedAt: timestamp("approval_receipt_issued_at", {
      withTimezone: true,
      mode: "date",
    }),
    approvalReceiptValidUntil: timestamp("approval_receipt_valid_until", {
      withTimezone: true,
      mode: "date",
    }),
    externalReference: text("external_reference"),
    projectionVersion: integer("projection_version"),
    providerReceiptId: text("provider_receipt_id"),
    providerCorrelationId: text("provider_correlation_id"),
    providerReceiptIssuedAt: timestamp("provider_receipt_issued_at", {
      withTimezone: true,
      mode: "date",
    }),
    providerReceiptValidUntil: timestamp("provider_receipt_valid_until", {
      withTimezone: true,
      mode: "date",
    }),
    category: varchar("category", { length: 48 }),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("communication_message_templates_definition_unique").on(
      table.templateKey,
      table.locale,
      table.definitionVersion,
    ),
    check("communication_message_templates_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "communication_message_templates_purpose_valid",
      sql`${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
    ),
    check(
      "communication_message_templates_source_valid",
      sql`${table.definitionSource} in ('synthetic_test_fixture', 'approved_policy')`,
    ),
    check(
      "communication_message_templates_state_valid",
      sql`${table.state} in ('draft', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded')`,
    ),
    check(
      "communication_message_templates_variables_valid",
      sql`jsonb_typeof(${table.variableKeys}) = 'array'`,
    ),
    check(
      "communication_message_templates_definition_version_positive",
      sql`${table.definitionVersion} > 0`,
    ),
    check(
      "communication_message_templates_projection_version_positive",
      sql`${table.projectionVersion} is null or ${table.projectionVersion} > 0`,
    ),
    check(
      "communication_message_templates_approval_valid",
      sql`(${table.internallyApproved} = false and ${table.approvalReceiptId} is null and ${table.approvalReceiptIssuedAt} is null and ${table.approvalReceiptValidUntil} is null) or (${table.internallyApproved} = true and ${table.approvalReceiptId} is not null and ${table.approvalReceiptIssuedAt} is not null and ${table.approvalReceiptValidUntil} > ${table.approvalReceiptIssuedAt})`,
    ),
    check(
      "communication_message_templates_provider_receipt_valid",
      sql`(${table.providerReceiptId} is null and ${table.providerCorrelationId} is null and ${table.providerReceiptIssuedAt} is null and ${table.providerReceiptValidUntil} is null) or (${table.providerReceiptId} is not null and ${table.providerCorrelationId} is not null and ${table.providerReceiptIssuedAt} is not null and ${table.providerReceiptValidUntil} > ${table.providerReceiptIssuedAt})`,
    ),
    index("communication_message_templates_projection_idx").on(table.state, table.observedAt),
    communicationsOnly("communication_message_templates"),
  ],
).enableRLS();

export const communicationOutboundCommands = pgTable(
  "communication_outbound_commands",
  {
    id: text("id").primaryKey(),
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
    messageBodyDigest: char("message_body_digest", { length: 64 }).notNull(),
    owningReceiptId: text("owning_receipt_id"),
    owningDomain: varchar("owning_domain", { length: 80 }),
    owningOperation: varchar("owning_operation", { length: 80 }),
    owningReference: text("owning_reference"),
    owningBindingId: text("owning_binding_id"),
    owningDestinationKey: varchar("owning_destination_key", { length: 120 }),
    owningReceiptIssuedAt: timestamp("owning_receipt_issued_at", {
      withTimezone: true,
      mode: "date",
    }),
    owningReceiptValidUntil: timestamp("owning_receipt_valid_until", {
      withTimezone: true,
      mode: "date",
    }),
    expectedPolicyVersion: integer("expected_policy_version"),
    requiredFence: integer("required_fence"),
    endpointDigests: jsonb("endpoint_digests").notNull().default(sql`'[]'::jsonb`),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    fingerprint: char("fingerprint", { length: 64 }),
    correlationId: text("correlation_id").notNull(),
    state: varchar("state", { length: 32 }).notNull(),
    failureCode: varchar("failure_code", { length: 64 }),
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
      name: "communication_outbound_commands_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("restrict"),
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
    unique("communication_outbound_commands_id_binding_unique").on(table.id, table.bindingId),
    unique("communication_outbound_commands_binding_key_unique").on(
      table.bindingId,
      table.idempotencyKey,
    ),
    check("communication_outbound_commands_channel_valid", sql`${table.channelKind} = 'whatsapp'`),
    check(
      "communication_outbound_commands_fingerprint_valid",
      sql`${table.fingerprint} is null or ${table.fingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_outbound_commands_message_body_digest_valid",
      sql`${table.messageBodyDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_outbound_commands_lease_token_hash_valid",
      sql`${table.leaseTokenHash} is null or ${table.leaseTokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_outbound_commands_lease_owner_hash_valid",
      sql`${table.leaseOwnerId} is null or ${table.leaseOwnerId} ~ '^[0-9a-f]{64}$'`,
    ),
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
      sql`${table.expectedPolicyVersion} is null or ${table.expectedPolicyVersion} > 0`,
    ),
    check(
      "communication_outbound_commands_required_fence_valid",
      sql`${table.requiredFence} is null or ${table.requiredFence} >= 0`,
    ),
    check(
      "communication_outbound_commands_endpoint_digests_valid",
      sql`jsonb_typeof(${table.endpointDigests}) = 'array'`,
    ),
    check("communication_outbound_commands_version_nonnegative", sql`${table.version} >= 0`),
    check(
      "communication_outbound_commands_owning_receipt_window_valid",
      sql`(${table.owningReceiptId} is null and ${table.owningDomain} is null and ${table.owningOperation} is null and ${table.owningReference} is null and ${table.owningBindingId} is null and ${table.owningDestinationKey} is null and ${table.owningReceiptIssuedAt} is null and ${table.owningReceiptValidUntil} is null) or (${table.owningReceiptId} is not null and ${table.owningDomain} = 'communications' and ${table.owningOperation} = 'outbound_dispatch' and ${table.owningReference} is not null and ${table.owningBindingId} = ${table.bindingId} and ${table.owningDestinationKey} = ${table.destinationKey} and ${table.owningReceiptIssuedAt} is not null and ${table.owningReceiptValidUntil} > ${table.owningReceiptIssuedAt})`,
    ),
    check(
      "communication_outbound_commands_finalization_valid",
      sql`${table.state} = 'draft' or (${table.fingerprint} is not null and ${table.expectedPolicyVersion} is not null and ${table.requiredFence} is not null and ${table.owningReceiptId} is not null and ${table.destinationKey} is not null)`,
    ),
    check(
      "communication_outbound_commands_destination_reference_opaque",
      sql`${table.destinationKey} is null or ${table.destinationKey} ~ '^endpoint_ref:[0-9a-f]{64}$'`,
    ),
    check(
      "communication_outbound_commands_owning_destination_valid",
      sql`${table.owningDestinationKey} is null or ${table.owningDestinationKey} ~ '^endpoint_ref:[0-9a-f]{64}$'`,
    ),
    check(
      "communication_outbound_commands_owning_reference_valid",
      sql`${table.owningReference} is null or ${table.owningReference} ~ '^outbound_command:[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'`,
    ),
    check(
      "communication_outbound_commands_lease_valid",
      sql`(${table.leaseOwnerId} is null and ${table.leaseTokenHash} is null and ${table.leaseExpiresAt} is null) or (${table.leaseOwnerId} is not null and ${table.leaseTokenHash} is not null and ${table.leaseExpiresAt} is not null)`,
    ),
    check(
      "communication_outbound_commands_expiry_valid",
      sql`${table.expiresAt} is null or ${table.expiresAt} > ${table.createdAt}`,
    ),
    index("communication_outbound_commands_work_idx").on(
      table.state,
      table.leaseExpiresAt,
      table.scheduledAt,
    ),
    communicationsOnly("communication_outbound_commands"),
  ],
).enableRLS();

export const communicationDispatchAttempts = pgTable(
  "communication_dispatch_attempts",
  {
    id: text("id").primaryKey(),
    commandId: text("command_id").notNull(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => communicationChannelConnections.id, { onDelete: "restrict" }),
    attemptOrdinal: integer("attempt_ordinal").notNull(),
    requestIdempotency: boolean("request_idempotency").notNull(),
    stableReferenceCapability: boolean("stable_reference_capability").notNull(),
    messageLookupCapability: boolean("message_lookup_capability").notNull(),
    statusReconciliationCapability: boolean("status_reconciliation_capability").notNull(),
    mediaReferencesCapability: boolean("media_references_capability").notNull(),
    templateProjectionCapability: boolean("template_projection_capability").notNull(),
    capabilityObservedAt: timestamp("capability_observed_at", {
      withTimezone: true,
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
    leaseOwnerHash: char("lease_owner_hash", { length: 64 }).notNull(),
    leaseVersion: integer("lease_version").notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    providerReferenceDigest: char("provider_reference_digest", { length: 64 }),
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
    unique("communication_dispatch_attempts_id_command_unique").on(table.id, table.commandId),
    unique("communication_dispatch_attempts_external_reference_unique").on(
      table.connectionId,
      table.externalMessageReference,
    ),
    check("communication_dispatch_attempts_ordinal_positive", sql`${table.attemptOrdinal} > 0`),
    check(
      "communication_dispatch_attempts_request_digest_valid",
      sql`${table.requestDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_dispatch_attempts_lease_owner_hash_valid",
      sql`${table.leaseOwnerHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check("communication_dispatch_attempts_lease_version_positive", sql`${table.leaseVersion} > 0`),
    check(
      "communication_dispatch_attempts_lease_window_valid",
      sql`${table.leaseExpiresAt} > ${table.startedAt}`,
    ),
    check(
      "communication_dispatch_attempts_provider_reference_digest_valid",
      sql`${table.providerReferenceDigest} is null or ${table.providerReferenceDigest} ~ '^[0-9a-f]{64}$'`,
    ),
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
      sql`${table.resultCode} is null or ${table.resultCode} in ('accepted', 'confirmed_not_sent', 'dispatch_unknown', 'reconciled', 'manual_review', 'failed')`,
    ),
    check(
      "communication_dispatch_attempts_completion_valid",
      sql`${table.completedAt} is null or ${table.completedAt} >= ${table.startedAt}`,
    ),
    check(
      "communication_dispatch_attempts_provider_io_capability_valid",
      sql`(${table.providerIoCapabilityHash} is null and ${table.providerIoStartedAt} is null) or (${table.providerIoCapabilityHash} ~ '^[0-9a-f]{64}$' and ${table.providerIoStartedAt} is not null and ${table.providerIoStartedAt} >= ${table.startedAt})`,
    ),
    index("communication_dispatch_attempts_recovery_idx").on(table.state, table.completedAt),
    communicationsOnly("communication_dispatch_attempts"),
  ],
).enableRLS();

export const communicationProviderStatusReceipts = pgTable(
  "communication_provider_status_receipts",
  {
    commandId: text("command_id")
      .notNull()
      .references(() => communicationOutboundCommands.id, { onDelete: "cascade" }),
    providerEventId: text("provider_event_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "communication_provider_status_receipts_command_event_pk",
      columns: [table.commandId, table.providerEventId],
    }),
    check(
      "communication_provider_status_receipts_status_valid",
      sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
    ),
    pgPolicy("communication_provider_status_receipts_communications_scope", {
      as: "permissive",
      for: "all",
      to: communicationsGatewayRole,
      using: communicationsCommandScope(table.commandId),
      withCheck: communicationsCommandScope(table.commandId),
    }),
  ],
).enableRLS();

export const communicationProviderStatusVerifications = pgTable(
  "communication_provider_status_verifications",
  {
    receiptId: text("receipt_id").primaryKey(),
    commandId: text("command_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    connectionId: text("connection_id").notNull(),
    externalMessageReferenceDigest: char("external_message_reference_digest", {
      length: 64,
    }).notNull(),
    providerEventId: text("provider_event_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }).notNull(),
    bodyDigest: char("body_digest", { length: 64 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "communication_provider_status_verifications_command_connection_fk",
      columns: [table.commandId, table.connectionId],
      foreignColumns: [
        communicationOutboundCommands.id,
        communicationOutboundCommands.connectionId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_provider_status_verifications_attempt_command_fk",
      columns: [table.attemptId, table.commandId],
      foreignColumns: [communicationDispatchAttempts.id, communicationDispatchAttempts.commandId],
    }).onDelete("cascade"),
    unique("communication_provider_status_verifications_connection_event_unique").on(
      table.connectionId,
      table.providerEventId,
    ),
    check(
      "communication_provider_status_verifications_status_valid",
      sql`${table.status} in ('sent', 'delivered', 'read', 'failed')`,
    ),
    check(
      "communication_provider_status_verifications_digest_valid",
      sql`${table.externalMessageReferenceDigest} ~ '^[0-9a-f]{64}$' and ${table.bodyDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_provider_status_verifications_identity_valid",
      sql`${table.receiptId} ~ '^provider_status_[0-9a-f]{32}$' and ${table.providerEventId} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$' and ${table.correlationId} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$'`,
    ),
    check(
      "communication_provider_status_verifications_time_valid",
      sql`${table.verifiedAt} >= ${table.occurredAt}`,
    ),
    pgPolicy("communication_provider_status_verifications_read_scope", {
      as: "permissive",
      for: "select",
      to: communicationsGatewayRole,
      using: communicationsCommandScope(table.commandId),
    }),
    pgPolicy("communication_provider_status_verifications_append_scope", {
      as: "permissive",
      for: "insert",
      to: communicationsGatewayRole,
      withCheck: communicationsCommandScope(table.commandId),
    }),
  ],
).enableRLS();

export const communicationDispatchReconciliationReceipts = pgTable(
  "communication_dispatch_reconciliation_receipts",
  {
    receiptId: text("receipt_id").primaryKey(),
    receiptDigest: char("receipt_digest", { length: 64 }).notNull(),
    commandId: text("command_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    bindingId: text("binding_id").notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    outcome: varchar("outcome", { length: 32 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "communication_dispatch_reconciliation_receipts_attempt_command_fk",
      columns: [table.attemptId, table.commandId],
      foreignColumns: [communicationDispatchAttempts.id, communicationDispatchAttempts.commandId],
    }).onDelete("restrict"),
    foreignKey({
      name: "communication_dispatch_reconciliation_receipts_command_binding_fk",
      columns: [table.commandId, table.bindingId],
      foreignColumns: [communicationOutboundCommands.id, communicationOutboundCommands.bindingId],
    }).onDelete("restrict"),
    check(
      "communication_dispatch_reconciliation_receipts_digest_valid",
      sql`${table.receiptDigest} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "communication_dispatch_reconciliation_receipts_source_valid",
      sql`${table.source} in ('provider_lookup', 'manual_authority')`,
    ),
    check(
      "communication_dispatch_reconciliation_receipts_outcome_valid",
      sql`${table.outcome} in ('reconciled_accepted', 'confirmed_not_sent', 'terminal_failure')`,
    ),
    check(
      "communication_dispatch_reconciliation_receipts_window_valid",
      sql`${table.expiresAt} > ${table.issuedAt} and ${table.createdAt} >= ${table.issuedAt} and ${table.createdAt} < ${table.expiresAt}`,
    ),
    pgPolicy("communication_dispatch_reconciliation_receipts_communications_scope", {
      as: "permissive",
      for: "all",
      to: communicationsGatewayRole,
      using: communicationsCommandScope(table.commandId),
      withCheck: communicationsCommandScope(table.commandId),
    }),
  ],
).enableRLS();

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
    assignedParticipantId: text("assigned_participant_id"),
    requestedAt: timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull(),
    queuedAt: timestamp("queued_at", { withTimezone: true, mode: "date" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "date" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "communication_handoffs_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("cascade"),
    foreignKey({
      name: "communication_handoffs_assignee_conversation_fk",
      columns: [table.assignedParticipantId, table.conversationId],
      foreignColumns: [communicationParticipants.id, communicationParticipants.conversationId],
    }).onDelete("set null"),
    check(
      "communication_handoffs_channel_valid",
      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
    ),
    check(
      "communication_handoffs_state_valid",
      sql`${table.state} in ('requested', 'queued', 'accepted', 'closed', 'unavailable')`,
    ),
    check(
      "communication_handoffs_reason_valid",
      sql`${table.reasonCode} in ('visitor_requested', 'complaint', 'safety', 'policy_required', 'assistant_unavailable', 'unknown')`,
    ),
    index("communication_handoffs_state_idx").on(table.state, table.updatedAt),
    ...sharedPolicies("communication_handoffs", table.conversationId, table.channelKind),
  ],
).enableRLS();

export const communicationAuditEvents = pgTable(
  "communication_audit_events",
  {
    id: text("id").primaryKey(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    conversationId: text("conversation_id").notNull(),
    channelKind: varchar("channel_kind", { length: 16 }).notNull(),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 24 }).notNull(),
    aggregateId: text("aggregate_id").notNull(),
    resultCode: varchar("result_code", { length: 32 }).notNull(),
    reasonCode: varchar("reason_code", { length: 48 }),
    version: integer("version").notNull(),
    locale: varchar("locale", { length: 2 }),
    purpose: varchar("purpose", { length: 24 }),
    policyVersion: integer("policy_version"),
    correlationId: text("correlation_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "communication_audit_events_conversation_channel_fk",
      columns: [table.conversationId, table.channelKind],
      foreignColumns: [communicationConversations.id, communicationConversations.channelKind],
    }).onDelete("cascade"),
    unique("communication_audit_events_conversation_sequence_unique").on(
      table.conversationId,
      table.sequence,
    ),
    check(
      "communication_audit_events_channel_valid",
      sql`${table.channelKind} in ('public_web', 'whatsapp')`,
    ),
    check("communication_audit_events_sequence_positive", sql`${table.sequence} > 0`),
    check(
      "communication_audit_events_locale_valid",
      sql`${table.locale} is null or ${table.locale} in ('es', 'en')`,
    ),
    check(
      "communication_audit_events_purpose_valid",
      sql`${table.purpose} is null or ${table.purpose} in ('conversational', 'transactional', 'service', 'marketing')`,
    ),
    check(
      "communication_audit_events_aggregate_valid",
      sql`${table.aggregateType} in ('event', 'conversation', 'message', 'outbound_command', 'binding', 'template', 'handoff')`,
    ),
    check(
      "communication_audit_events_result_valid",
      sql`${table.resultCode} in ('received', 'signature_verified', 'bounded_normalization', 'persisted', 'applied', 'ignored_duplicate', 'manual_review', 'rejected_invalid', 'quarantined', 'dead_letter', 'draft', 'policy_checked', 'queued', 'dispatching', 'provider_accepted', 'dispatch_unknown', 'reconciliation_required', 'reconciled_accepted', 'confirmed_not_sent', 'sent', 'delivered', 'read', 'failed', 'expired', 'cancelled', 'normal', 'opt_out_pending', 'withdrawn', 'normal_after_review', 'internally_approved', 'submitted', 'provider_approved', 'provider_rejected', 'paused', 'disabled', 'superseded', 'unlinked', 'candidate_match', 'linked_contact', 'verification_due', 'reverified', 'reassignment_suspected', 'suspended', 'revoked', 'new', 'ai_active', 'human_requested', 'waiting_for_human', 'human_active', 'returned_to_ai', 'closed', 'restricted', 'accepted', 'rejected', 'unavailable', 'duplicate', 'linked', 'requested')`,
    ),
    check("communication_audit_events_version_positive", sql`${table.version} > 0`),
    check(
      "communication_audit_events_policy_version_positive",
      sql`${table.policyVersion} is null or ${table.policyVersion} > 0`,
    ),
    index("communication_audit_events_aggregate_idx").on(
      table.aggregateType,
      table.aggregateId,
      table.occurredAt,
    ),
    ...sharedPolicies("communication_audit_events", table.conversationId, table.channelKind),
  ],
).enableRLS();

export const getPublicChatTableConfig = getTableConfig;

export * from "./schema/creditcardbroker.ts";
export * from "./schema/index.ts";

export * from "./schema/partner-management.ts";
export * from "./schema/payment-verification.ts";
export * from "./schema/provider-abstraction.ts";
export * from "./schema/service-catalog.ts";
export * from "./schema/service-catalog-completion.ts";
export * from "./schema/service-entitlements.ts";
export * from "./schema/pricing.ts";
export * from "./schema/ai-control-plane.ts";
export * from "./schema/supervisor-agent.ts";
