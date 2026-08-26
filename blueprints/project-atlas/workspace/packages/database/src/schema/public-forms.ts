import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  foreignKey,
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

export const publicFormsGatewayRole = pgRole("atlas_public_forms_gateway").existing();
export const publicFormsPreviewRole = pgRole("atlas_public_forms_preview").existing();
export const publicFormsReviewRole = pgRole("atlas_public_forms_review").existing();
export const publicFormsExportRole = pgRole("atlas_public_forms_export").existing();
export const publicFormsOutboxRole = pgRole("atlas_public_forms_outbox").existing();
export const publicFormsRetentionRole = pgRole("atlas_public_forms_retention").existing();

const activeScope = sql`nullif(current_setting('atlas.public_forms_scope_digest', true), '')`;
const activeSession = sql`nullif(current_setting('atlas.public_forms_session_digest', true), '')`;
const exportablePrivateTables = new Set([
  "form_submissions",
  "form_responses",
  "form_consent_evidence",
  "form_attribution",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

const digestCheck = (value: unknown) => sql`${value} ~ '^[0-9a-f]{64}$'`;
const canonicalId = (value: unknown) => sql`${value} ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$'`;

const scopedGatewayPolicies = (name: string, scopeDigest: unknown) => [
  pgPolicy(`${name}_gateway_select`, {
    as: "permissive",
    for: "select",
    to: publicFormsGatewayRole,
    using: sql`${scopeDigest} = ${activeScope}`,
  }),
  pgPolicy(`${name}_gateway_insert`, {
    as: "permissive",
    for: "insert",
    to: publicFormsGatewayRole,
    withCheck: sql`${scopeDigest} = ${activeScope}`,
  }),
  pgPolicy(`${name}_gateway_update`, {
    as: "permissive",
    for: "update",
    to: publicFormsGatewayRole,
    using: sql`${scopeDigest} = ${activeScope}`,
    withCheck: sql`${scopeDigest} = ${activeScope}`,
  }),
  pgPolicy(`${name}_review_select`, {
    as: "permissive",
    for: "select",
    to: publicFormsReviewRole,
    using: sql`true`,
  }),
  ...(exportablePrivateTables.has(name)
    ? [
        pgPolicy(`${name}_export_select`, {
          as: "permissive",
          for: "select",
          to: publicFormsExportRole,
          using: sql`true`,
        }),
      ]
    : []),
];

export const formDefinitions = pgTable(
  "form_definitions",
  {
    id: text("id").primaryKey(),
    formCode: varchar("form_code", { length: 64 }).notNull().unique(),
    lifecycle: varchar("lifecycle", { length: 16 }).notNull(),
    ...timestamps,
  },
  (table) => [
    check("form_definitions_id_valid", canonicalId(table.id)),
    check("form_definitions_code_valid", sql`${table.formCode} ~ '^[a-z][a-z0-9_]{1,63}$'`),
    check(
      "form_definitions_lifecycle_valid",
      sql`${table.lifecycle} in ('draft', 'active', 'disabled', 'archived')`,
    ),
    pgPolicy("form_definitions_gateway_published_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.lifecycle} = 'active'`,
    }),
    pgPolicy("form_definitions_preview_select", {
      as: "permissive",
      for: "select",
      to: publicFormsPreviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_definitions_review_select", {
      as: "permissive",
      for: "select",
      to: publicFormsReviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_definitions_export_select", {
      as: "permissive",
      for: "select",
      to: publicFormsExportRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const formDefinitionVersions = pgTable(
  "form_definition_versions",
  {
    id: text("id").primaryKey(),
    definitionId: text("definition_id")
      .notNull()
      .references(() => formDefinitions.id, { onDelete: "restrict" }),
    formCode: varchar("form_code", { length: 64 }).notNull(),
    version: varchar("version", { length: 32 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    audience: varchar("audience", { length: 24 }).notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    serviceCode: varchar("service_code", { length: 64 }),
    retentionClass: varchar("retention_class", { length: 32 }).notNull(),
    schemaHash: char("schema_hash", { length: 64 }).notNull(),
    uiHash: char("ui_hash", { length: 64 }).notNull(),
    disclosureReferences: jsonb("disclosure_references").notNull(),
    approvedActions: jsonb("approved_actions").notNull(),
    consentRequirements: jsonb("consent_requirements").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("form_definition_versions_code_version_locale_unique").on(
      table.formCode,
      table.version,
      table.locale,
    ),
    unique("form_definition_versions_id_code_version_locale_unique").on(
      table.id,
      table.formCode,
      table.version,
      table.locale,
    ),
    check("form_definition_versions_id_valid", canonicalId(table.id)),
    check("form_definition_versions_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "form_definition_versions_status_valid",
      sql`${table.status} in ('draft', 'published', 'disabled', 'archived')`,
    ),
    check(
      "form_definition_versions_audience_valid",
      sql`${table.audience} in ('public', 'staff_preview')`,
    ),
    check(
      "form_definition_versions_hashes_valid",
      sql`${digestCheck(table.schemaHash)} and ${digestCheck(table.uiHash)}`,
    ),
    check(
      "form_definition_versions_publication_valid",
      sql`(${table.status} = 'published' and ${table.publishedAt} is not null and ${table.audience} = 'public') or ${table.status} <> 'published'`,
    ),
    pgPolicy("form_definition_versions_gateway_published_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.status} = 'published' and ${table.audience} = 'public'`,
    }),
    pgPolicy("form_definition_versions_preview_select", {
      as: "permissive",
      for: "select",
      to: publicFormsPreviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_definition_versions_review_select", {
      as: "permissive",
      for: "select",
      to: publicFormsReviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_definition_versions_export_select", {
      as: "permissive",
      for: "select",
      to: publicFormsExportRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const formFieldDefinitions = pgTable(
  "form_field_definitions",
  {
    id: text("id").notNull(),
    definitionVersionId: text("definition_version_id")
      .notNull()
      .references(() => formDefinitionVersions.id, { onDelete: "restrict" }),
    fieldCode: varchar("field_code", { length: 64 }).notNull(),
    fieldType: varchar("field_type", { length: 24 }).notNull(),
    step: integer("step").notNull(),
    required: boolean("required").notNull(),
    sensitivity: varchar("sensitivity", { length: 24 }).notNull(),
    labelId: text("label_id").notNull(),
    helpTextId: text("help_text_id"),
    optionCodes: jsonb("option_codes"),
    validationRules: jsonb("validation_rules").notNull(),
    conditionalRules: jsonb("conditional_rules"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "form_field_definitions_pk",
      columns: [table.definitionVersionId, table.fieldCode],
    }),
    unique("form_field_definitions_version_order_unique").on(
      table.definitionVersionId,
      table.sortOrder,
    ),
    check("form_field_definitions_code_valid", sql`${table.fieldCode} ~ '^[a-z][a-z0-9_]{1,63}$'`),
    check("form_field_definitions_step_valid", sql`${table.step} between 1 and 12`),
    check("form_field_definitions_order_valid", sql`${table.sortOrder} > 0`),
    check(
      "form_field_definitions_sensitivity_valid",
      sql`${table.sensitivity} in ('public', 'basic_personal', 'financial')`,
    ),
    pgPolicy("form_field_definitions_gateway_published_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`exists (select 1 from form_definition_versions version where version.id = ${table.definitionVersionId} and version.status = 'published' and version.audience = 'public')`,
    }),
    pgPolicy("form_field_definitions_preview_select", {
      as: "permissive",
      for: "select",
      to: publicFormsPreviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_field_definitions_review_select", {
      as: "permissive",
      for: "select",
      to: publicFormsReviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_field_definitions_export_select", {
      as: "permissive",
      for: "select",
      to: publicFormsExportRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: text("id").primaryKey(),
    formCode: varchar("form_code", { length: 64 }).notNull(),
    formVersion: varchar("form_version", { length: 32 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull().unique(),
    sessionBindingDigest: char("session_binding_digest", { length: 64 }).notNull(),
    nonceDigest: char("nonce_digest", { length: 64 }).notNull().unique(),
    commandDigest: char("command_digest", { length: 64 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    deletionState: varchar("deletion_state", { length: 24 }).notNull(),
    legalHold: boolean("legal_hold").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("form_submissions_id_scope_unique").on(table.id, table.scopeDigest),
    foreignKey({
      name: "form_submissions_definition_version_fk",
      columns: [table.formCode, table.formVersion, table.locale],
      foreignColumns: [
        formDefinitionVersions.formCode,
        formDefinitionVersions.version,
        formDefinitionVersions.locale,
      ],
    }).onDelete("restrict"),
    check("form_submissions_id_valid", canonicalId(table.id)),
    check(
      "form_submissions_digests_valid",
      sql`${digestCheck(table.scopeDigest)} and ${digestCheck(table.sessionBindingDigest)} and ${digestCheck(table.nonceDigest)} and ${digestCheck(table.commandDigest)}`,
    ),
    check(
      "form_submissions_status_valid",
      sql`${table.status} in ('accepted', 'converted_to_lead', 'appointment_pending', 'expired', 'deleted')`,
    ),
    check(
      "form_submissions_deletion_valid",
      sql`${table.deletionState} in ('retained', 'deletion_due', 'deleted', 'legal_hold')`,
    ),
    check("form_submissions_expiry_valid", sql`${table.expiresAt} > ${table.acceptedAt}`),
    index("form_submissions_expiry_idx").on(table.deletionState, table.expiresAt),
    pgPolicy("form_submissions_gateway_session_revoke_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.sessionBindingDigest} = ${activeSession}`,
    }),
    ...scopedGatewayPolicies("form_submissions", table.scopeDigest),
  ],
).enableRLS();

export const formSubmissionReceipts = pgTable(
  "form_submission_receipts",
  {
    receiptId: text("receipt_id").primaryKey(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull().unique(),
    commandDigest: char("command_digest", { length: 64 }).notNull(),
    reservationId: text("reservation_id").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    submissionId: text("submission_id").references(() => formSubmissions.id, {
      onDelete: "restrict",
    }),
    issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    check("form_submission_receipts_id_valid", canonicalId(table.receiptId)),
    check("form_submission_receipts_reservation_valid", canonicalId(table.reservationId)),
    check(
      "form_submission_receipts_digests_valid",
      sql`${digestCheck(table.scopeDigest)} and ${digestCheck(table.commandDigest)}`,
    ),
    check(
      "form_submission_receipts_state_valid",
      sql`${table.state} in ('reserved', 'accepted', 'reconciliation_required')`,
    ),
    check("form_submission_receipts_lease_valid", sql`${table.leaseExpiresAt} > ${table.issuedAt}`),
    check(
      "form_submission_receipts_completion_valid",
      sql`(${table.state} = 'accepted' and ${table.submissionId} is not null and ${table.acceptedAt} is not null) or (${table.state} <> 'accepted' and ${table.submissionId} is null and ${table.acceptedAt} is null)`,
    ),
    index("form_submission_receipts_lease_idx").on(table.state, table.leaseExpiresAt),
    pgPolicy("form_submission_receipts_gateway_session_revoke_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`exists (select 1 from form_submissions submission where submission.id = ${table.submissionId} and submission.session_binding_digest = ${activeSession})`,
    }),
    ...scopedGatewayPolicies("form_submission_receipts", table.scopeDigest),
  ],
).enableRLS();

export const formResponses = pgTable(
  "form_responses",
  {
    submissionId: text("submission_id").notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    fieldCode: varchar("field_code", { length: 64 }).notNull(),
    valueType: varchar("value_type", { length: 16 }).notNull(),
    sensitivity: varchar("sensitivity", { length: 24 }).notNull(),
    ciphertext: text("ciphertext").notNull(),
    keyReference: text("key_reference").notNull(),
    encryptionContextVersion: varchar("encryption_context_version", { length: 32 })
      .notNull()
      .default("m006.answer.v1"),
    matchDigest: char("match_digest", { length: 64 }),
    ...timestamps,
  },
  (table) => [
    primaryKey({ name: "form_responses_pk", columns: [table.submissionId, table.fieldCode] }),
    foreignKey({
      name: "form_responses_submission_scope_fk",
      columns: [table.submissionId, table.scopeDigest],
      foreignColumns: [formSubmissions.id, formSubmissions.scopeDigest],
    }).onDelete("cascade"),
    check("form_responses_scope_valid", digestCheck(table.scopeDigest)),
    check(
      "form_responses_match_valid",
      sql`${table.matchDigest} is null or ${digestCheck(table.matchDigest)}`,
    ),
    check(
      "form_responses_value_type_valid",
      sql`${table.valueType} in ('string', 'number', 'boolean')`,
    ),
    check(
      "form_responses_sensitivity_valid",
      sql`${table.sensitivity} in ('public', 'basic_personal', 'financial')`,
    ),
    ...scopedGatewayPolicies("form_responses", table.scopeDigest),
  ],
).enableRLS();

export const formConsentEvidence = pgTable(
  "form_consent_evidence",
  {
    id: text("id").notNull(),
    submissionId: text("submission_id").notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    consentType: varchar("consent_type", { length: 64 }).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }).notNull(),
    disclosureReference: text("disclosure_reference").notNull(),
    granted: boolean("granted").notNull(),
    source: varchar("source", { length: 24 }).notNull(),
    sessionBindingDigest: char("session_binding_digest", { length: 64 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "form_consent_evidence_pk",
      columns: [table.submissionId, table.consentType, table.consentVersion],
    }),
    foreignKey({
      name: "form_consent_evidence_submission_scope_fk",
      columns: [table.submissionId, table.scopeDigest],
      foreignColumns: [formSubmissions.id, formSubmissions.scopeDigest],
    }).onDelete("restrict"),
    check(
      "form_consent_evidence_scope_valid",
      sql`${digestCheck(table.scopeDigest)} and ${digestCheck(table.sessionBindingDigest)}`,
    ),
    check("form_consent_evidence_source_valid", sql`${table.source} = 'public_form'`),
    check(
      "form_consent_evidence_revocation_valid",
      sql`${table.revokedAt} is null or (${table.granted} = true and ${table.revokedAt} >= ${table.occurredAt})`,
    ),
    pgPolicy("form_consent_evidence_gateway_session_revoke_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_consent_evidence_outbox_select", {
      as: "permissive",
      for: "select",
      to: publicFormsOutboxRole,
      using: sql`true`,
    }),
    ...scopedGatewayPolicies("form_consent_evidence", table.scopeDigest),
  ],
).enableRLS();

export const formConsentRevocations = pgTable(
  "form_consent_revocations",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    consentType: varchar("consent_type", { length: 64 }).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }).notNull(),
    sessionBindingDigest: char("session_binding_digest", { length: 64 }).notNull(),
    idempotencyDigest: char("idempotency_digest", { length: 64 }).notNull().unique(),
    commandDigest: char("command_digest", { length: 64 }).notNull(),
    evidenceReference: text("evidence_reference").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "form_consent_revocations_grant_fk",
      columns: [table.submissionId, table.consentType, table.consentVersion],
      foreignColumns: [
        formConsentEvidence.submissionId,
        formConsentEvidence.consentType,
        formConsentEvidence.consentVersion,
      ],
    }).onDelete("restrict"),
    check(
      "form_consent_revocations_digests_valid",
      sql`${digestCheck(table.scopeDigest)} and ${digestCheck(table.sessionBindingDigest)} and ${digestCheck(table.idempotencyDigest)} and ${digestCheck(table.commandDigest)}`,
    ),
    pgPolicy("form_consent_revocations_gateway_session_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_consent_revocations_gateway_session_insert", {
      as: "permissive",
      for: "insert",
      to: publicFormsGatewayRole,
      withCheck: sql`${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_consent_revocations_review_select", {
      as: "permissive",
      for: "select",
      to: publicFormsReviewRole,
      using: sql`true`,
    }),
    pgPolicy("form_consent_revocations_export_select", {
      as: "permissive",
      for: "select",
      to: publicFormsExportRole,
      using: sql`true`,
    }),
    pgPolicy("form_consent_revocations_outbox_select", {
      as: "permissive",
      for: "select",
      to: publicFormsOutboxRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const formAttribution = pgTable(
  "form_attribution",
  {
    submissionId: text("submission_id").primaryKey(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    utmSource: varchar("utm_source", { length: 80 }),
    utmMedium: varchar("utm_medium", { length: 80 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    utmTerm: varchar("utm_term", { length: 100 }),
    utmContent: varchar("utm_content", { length: 100 }),
    partnerCode: varchar("partner_code", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "form_attribution_submission_scope_fk",
      columns: [table.submissionId, table.scopeDigest],
      foreignColumns: [formSubmissions.id, formSubmissions.scopeDigest],
    }).onDelete("cascade"),
    check("form_attribution_scope_valid", digestCheck(table.scopeDigest)),
    ...scopedGatewayPolicies("form_attribution", table.scopeDigest),
  ],
).enableRLS();

export const formDrafts = pgTable(
  "form_drafts",
  {
    id: text("id").primaryKey(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull().unique(),
    sessionBindingDigest: char("session_binding_digest", { length: 64 }).notNull(),
    formCode: varchar("form_code", { length: 64 }).notNull(),
    formVersion: varchar("form_version", { length: 32 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    ciphertext: text("ciphertext").notNull(),
    keyReference: text("key_reference").notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    check(
      "form_drafts_scope_valid",
      sql`${digestCheck(table.scopeDigest)} and ${digestCheck(table.sessionBindingDigest)}`,
    ),
    check("form_drafts_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check("form_drafts_state_valid", sql`${table.state} in ('active', 'expired', 'deleted')`),
    check("form_drafts_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    index("form_drafts_expiry_idx").on(table.state, table.expiresAt),
    pgPolicy("form_drafts_gateway_session_select", {
      as: "permissive",
      for: "select",
      to: publicFormsGatewayRole,
      using: sql`${table.scopeDigest} = ${activeScope} and ${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_drafts_gateway_session_insert", {
      as: "permissive",
      for: "insert",
      to: publicFormsGatewayRole,
      withCheck: sql`${table.scopeDigest} = ${activeScope} and ${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_drafts_gateway_session_update", {
      as: "permissive",
      for: "update",
      to: publicFormsGatewayRole,
      using: sql`${table.scopeDigest} = ${activeScope} and ${table.sessionBindingDigest} = ${activeSession}`,
      withCheck: sql`${table.scopeDigest} = ${activeScope} and ${table.sessionBindingDigest} = ${activeSession}`,
    }),
    pgPolicy("form_drafts_retention_delete", {
      as: "permissive",
      for: "delete",
      to: publicFormsRetentionRole,
      using: sql`${table.expiresAt} <= statement_timestamp() and ${table.state} in ('active', 'expired')`,
    }),
  ],
).enableRLS();

export const formOutbox = pgTable(
  "form_outbox",
  {
    commandId: text("command_id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    owner: varchar("owner", { length: 24 }).notNull(),
    operation: varchar("operation", { length: 64 }).notNull(),
    formCode: varchar("form_code", { length: 64 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    serviceCode: varchar("service_code", { length: 64 }),
    consentType: varchar("consent_type", { length: 64 }),
    channel: varchar("channel", { length: 16 }),
    revocationId: text("revocation_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    state: varchar("state", { length: 24 }).notNull(),
    leasePurpose: varchar("lease_purpose", { length: 16 }).notNull().default("dispatch"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    leaseOwner: text("lease_owner"),
    leaseVersion: integer("lease_version").notNull().default(0),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
    availableAt: timestamp("available_at", { withTimezone: true, mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    resultCode: varchar("result_code", { length: 32 }),
    ownerReceipt: jsonb("owner_receipt"),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "form_outbox_submission_scope_fk",
      columns: [table.submissionId, table.scopeDigest],
      foreignColumns: [formSubmissions.id, formSubmissions.scopeDigest],
    }).onDelete("restrict"),
    foreignKey({
      name: "form_outbox_revocation_fk",
      columns: [table.revocationId],
      foreignColumns: [formConsentRevocations.id],
    }).onDelete("restrict"),
    check("form_outbox_scope_valid", digestCheck(table.scopeDigest)),
    check(
      "form_outbox_owner_valid",
      sql`${table.owner} in ('lead', 'consent', 'appointment', 'payment', 'channel', 'analytics', 'notification')`,
    ),
    check(
      "form_outbox_state_valid",
      sql`${table.state} in ('pending', 'dispatching', 'completed', 'unavailable', 'unknown', 'manual_review')`,
    ),
    check(
      "form_outbox_lease_purpose_valid",
      sql`${table.leasePurpose} in ('dispatch', 'reconcile')`,
    ),
    check(
      "form_outbox_attempt_valid",
      sql`${table.attemptCount} >= 0 and ${table.maxAttempts} between 1 and 12 and ${table.attemptCount} <= ${table.maxAttempts} and ${table.leaseVersion} >= 0`,
    ),
    check(
      "form_outbox_lease_valid",
      sql`(${table.state} = 'dispatching' and ${table.leaseOwner} is not null and ${table.leaseExpiresAt} is not null) or (${table.state} <> 'dispatching' and ${table.leaseOwner} is null and ${table.leaseExpiresAt} is null)`,
    ),
    index("form_outbox_dispatch_idx").on(table.state, table.availableAt),
    pgPolicy("form_outbox_worker_select", {
      as: "permissive",
      for: "select",
      to: publicFormsOutboxRole,
      using: sql`true`,
    }),
    pgPolicy("form_outbox_worker_update", {
      as: "permissive",
      for: "update",
      to: publicFormsOutboxRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    ...scopedGatewayPolicies("form_outbox", table.scopeDigest),
  ],
).enableRLS();

export const formAuditEvents = pgTable(
  "form_audit_events",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    scopeDigest: char("scope_digest", { length: 64 }).notNull(),
    eventName: varchar("event_name", { length: 48 }).notNull(),
    resultCode: varchar("result_code", { length: 32 }).notNull(),
    formCode: varchar("form_code", { length: 64 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "form_audit_events_submission_scope_fk",
      columns: [table.submissionId, table.scopeDigest],
      foreignColumns: [formSubmissions.id, formSubmissions.scopeDigest],
    }).onDelete("restrict"),
    check("form_audit_events_scope_valid", digestCheck(table.scopeDigest)),
    check("form_audit_events_locale_valid", sql`${table.locale} in ('es', 'en')`),
    check(
      "form_audit_events_event_valid",
      sql`${table.eventName} in ('submission_accepted', 'submission_replayed', 'submission_review', 'submission_expired', 'consent_revoked')`,
    ),
    ...scopedGatewayPolicies("form_audit_events", table.scopeDigest),
  ],
).enableRLS();
