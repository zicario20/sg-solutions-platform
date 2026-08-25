import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const authGatewayRole = pgRole("atlas_auth_gateway").existing();

const authGatewayOnly = (name: string) =>
  pgPolicy(`${name}_auth_gateway_only`, {
    as: "permissive",
    for: "all",
    to: authGatewayRole,
    using: sql`current_setting('atlas.auth_context_verified', true) = '1'`,
    withCheck: sql`current_setting('atlas.auth_context_verified', true) = '1'`,
  });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    supabaseSubject: text("supabase_subject").notNull().unique(),
    status: varchar("status", { length: 32 }).notNull(),
    authenticationEpoch: integer("authentication_epoch").notNull().default(1),
    accessEpoch: integer("access_epoch").notNull().default(1),
    policyEpoch: integer("policy_epoch").notNull().default(1),
    version: integer("version").notNull().default(1),
    suspendedAt: timestamp("suspended_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    check("auth_accounts_status_valid", sql`${table.status} in ('pending_verification', 'limited', 'active', 'suspended', 'closed')`),
    check("auth_accounts_epoch_positive", sql`${table.authenticationEpoch} > 0 and ${table.accessEpoch} > 0 and ${table.policyEpoch} > 0`),
    check("auth_accounts_version_positive", sql`${table.version} > 0`),
    authGatewayOnly("auth_accounts"),
  ],
).enableRLS();

export const authExternalIdentities = pgTable(
  "auth_external_identities",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    linkedAt: timestamp("linked_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    unique("auth_external_identities_provider_subject_unique").on(table.provider, table.providerSubject),
    check("auth_external_identities_provider_valid", sql`${table.provider} in ('email_password', 'google')`),
    check("auth_external_identities_state_valid", sql`${table.state} in ('pending', 'active', 'reconciling', 'revoked')`),
    authGatewayOnly("auth_external_identities"),
  ],
).enableRLS();

export const authSupabaseIdentityEvidence = pgTable(
  "auth_supabase_identity_evidence",
  {
    id: text("id").primaryKey(),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    issuer: text("issuer").notNull(),
    audience: text("audience").notNull(),
    emailVerified: boolean("email_verified").notNull(),
    providerTransactionId: text("provider_transaction_id").notNull().unique(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("auth_supabase_identity_evidence_subject_idx").on(table.provider, table.providerSubject),
    check("auth_supabase_identity_evidence_provider_valid", sql`${table.provider} = 'google'`),
    check("auth_supabase_identity_evidence_expiry_valid", sql`${table.expiresAt} > ${table.verifiedAt}`),
    authGatewayOnly("auth_supabase_identity_evidence"),
  ],
).enableRLS();

export const authCrmPartyEvidence = pgTable(
  "auth_crm_party_evidence",
  {
    id: text("id").primaryKey(),
    supabaseEvidenceId: text("supabase_evidence_id").notNull().references(() => authSupabaseIdentityEvidence.id, { onDelete: "restrict" }),
    partyId: text("party_id"),
    resolution: varchar("resolution", { length: 24 }).notNull(),
    relationshipReceipt: text("relationship_receipt"),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("auth_crm_party_evidence_identity_idx").on(table.supabaseEvidenceId, table.verifiedAt),
    check("auth_crm_party_evidence_resolution_valid", sql`${table.resolution} in ('linked', 'possible_match', 'conflict', 'unavailable')`),
    check("auth_crm_party_evidence_link_receipt", sql`${table.resolution} <> 'linked' or ${table.relationshipReceipt} is not null`),
    check("auth_crm_party_evidence_expiry_valid", sql`${table.expiresAt} > ${table.verifiedAt}`),
    authGatewayOnly("auth_crm_party_evidence"),
  ],
).enableRLS();

export const authIdentityConflicts = pgTable(
  "auth_identity_conflicts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    externalIdentityId: text("external_identity_id").notNull().references(() => authExternalIdentities.id, { onDelete: "cascade" }),
    supabaseEvidenceId: text("supabase_evidence_id").notNull().references(() => authSupabaseIdentityEvidence.id, { onDelete: "restrict" }),
    crmEvidenceId: text("crm_evidence_id").notNull().references(() => authCrmPartyEvidence.id, { onDelete: "restrict" }),
    reason: varchar("reason", { length: 32 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("auth_identity_conflicts_account_state_idx").on(table.accountId, table.state),
    check("auth_identity_conflicts_state_valid", sql`${table.state} in ('manual_review', 'resolved')`),
    authGatewayOnly("auth_identity_conflicts"),
  ],
).enableRLS();

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    handleDigest: text("handle_digest").notNull().unique(),
    familyId: text("family_id").notNull(),
    generation: integer("generation").notNull(),
    assurance: varchar("assurance", { length: 8 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    unique("auth_sessions_family_generation_unique").on(table.familyId, table.generation),
    index("auth_sessions_account_state_idx").on(table.accountId, table.state, table.updatedAt),
    check("auth_sessions_generation_positive", sql`${table.generation} > 0`),
    check("auth_sessions_assurance_valid", sql`${table.assurance} in ('aal1', 'aal2')`),
    check("auth_sessions_state_valid", sql`${table.state} in ('active', 'rotating', 'rotated', 'revoked', 'expired', 'risk_blocked')`),
    check("auth_sessions_expiry_valid", sql`${table.absoluteExpiresAt} > ${table.idleExpiresAt}`),
    authGatewayOnly("auth_sessions"),
  ],
).enableRLS();

export const authProviderVault = pgTable(
  "auth_provider_vault",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull().references(() => authSessions.id, { onDelete: "cascade" }).unique(),
    ciphertext: text("ciphertext").notNull(),
    keyReference: text("key_reference").notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    check("auth_provider_vault_version_positive", sql`${table.version} > 0`),
    authGatewayOnly("auth_provider_vault"),
  ],
).enableRLS();

export const authTransactions = pgTable(
  "auth_transactions",
  {
    id: text("id").primaryKey(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 32 }),
    stateDigest: text("state_digest").unique(),
    nonceDigest: text("nonce_digest"),
    pkceVerifierDigest: text("pkce_verifier_digest"),
    browserBindingDigest: text("browser_binding_digest").notNull(),
    returnIntent: varchar("return_intent", { length: 256 }).notNull(),
    callbackUrl: text("callback_url").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    check("auth_transactions_state_valid", sql`${table.state} in ('pending', 'consumed', 'expired', 'reconciling')`),
    check("auth_transactions_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    authGatewayOnly("auth_transactions"),
  ],
).enableRLS();

export const authProofs = pgTable(
  "auth_proofs",
  {
    id: text("id").primaryKey(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    proofDigest: text("proof_digest").notNull().unique(),
    accountId: text("account_id").references(() => authAccounts.id, { onDelete: "cascade" }),
    browserBindingDigest: text("browser_binding_digest"),
    state: varchar("state", { length: 24 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("auth_proofs_expiry_idx").on(table.expiresAt),
    check("auth_proofs_state_valid", sql`${table.state} in ('issued', 'consumed', 'revoked', 'expired')`),
    authGatewayOnly("auth_proofs"),
  ],
).enableRLS();

export const authInvitations = pgTable(
  "auth_invitations",
  {
    id: text("id").primaryKey(),
    intendedMembershipReceipt: text("intended_membership_receipt").notNull(),
    proofId: text("proof_id").notNull().references(() => authProofs.id, { onDelete: "restrict" }).unique(),
    state: varchar("state", { length: 24 }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    check("auth_invitations_state_valid", sql`${table.state} in ('issued', 'accepted', 'revoked', 'expired')`),
    authGatewayOnly("auth_invitations"),
  ],
).enableRLS();

export const authPartyLinks = pgTable(
  "auth_party_links",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    relationshipReceipt: text("relationship_receipt").notNull().unique(),
    state: varchar("state", { length: 24 }).notNull(),
    accessVersion: integer("access_version").notNull(),
    ...timestamps,
  },
  (table) => [
    check("auth_party_links_state_valid", sql`${table.state} in ('active', 'manual_review', 'conflict', 'revoked')`),
    check("auth_party_links_version_positive", sql`${table.accessVersion} > 0`),
    authGatewayOnly("auth_party_links"),
  ],
).enableRLS();

export const authOrganizations = pgTable(
  "auth_organizations",
  {
    id: text("id").primaryKey(),
    relationshipReceipt: text("relationship_receipt").notNull().unique(),
    state: varchar("state", { length: 24 }).notNull(),
    accessVersion: integer("access_version").notNull(),
    ...timestamps,
  },
  (table) => [
    check("auth_organizations_state_valid", sql`${table.state} in ('active', 'suspended', 'closed')`),
    check("auth_organizations_version_positive", sql`${table.accessVersion} > 0`),
    authGatewayOnly("auth_organizations"),
  ],
).enableRLS();

export const authRoles = pgTable(
  "auth_roles",
  { id: text("id").primaryKey(), code: varchar("code", { length: 64 }).notNull().unique(), ...timestamps },
  () => [authGatewayOnly("auth_roles")],
).enableRLS();

export const authRolePermissions = pgTable(
  "auth_role_permissions",
  {
    roleId: text("role_id").notNull().references(() => authRoles.id, { onDelete: "cascade" }),
    permission: varchar("permission", { length: 128 }).notNull(),
    ...timestamps,
  },
  (table) => [unique("auth_role_permissions_role_permission_unique").on(table.roleId, table.permission), authGatewayOnly("auth_role_permissions")],
).enableRLS();

export const authRoleAssignments = pgTable(
  "auth_role_assignments",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    roleId: text("role_id").notNull().references(() => authRoles.id, { onDelete: "restrict" }),
    organizationId: text("organization_id").references(() => authOrganizations.id, { onDelete: "cascade" }),
    state: varchar("state", { length: 24 }).notNull(),
    accessVersion: integer("access_version").notNull(),
    ...timestamps,
  },
  (table) => [
    index("auth_role_assignments_account_idx").on(table.accountId, table.state),
    check("auth_role_assignments_state_valid", sql`${table.state} in ('active', 'revoked')`),
    authGatewayOnly("auth_role_assignments"),
  ],
).enableRLS();

/** M007-owned, resource-specific delegation; it never replaces a role assignment. */
export const authPurposeDelegations = pgTable(
  "auth_purpose_delegations",
  {
    id: text("id").primaryKey(),
    grantedByAccountId: text("granted_by_account_id")
      .notNull()
      .references(() => authAccounts.id, { onDelete: "restrict" }),
    delegateAccountId: text("delegate_account_id")
      .notNull()
      .references(() => authAccounts.id, { onDelete: "restrict" }),
    ownerAccountId: text("owner_account_id")
      .notNull()
      .references(() => authAccounts.id, { onDelete: "restrict" }),
    purpose: varchar("purpose", { length: 64 }).notNull(),
    resourceType: varchar("resource_type", { length: 32 }).notNull(),
    resourceReference: text("resource_reference").notNull(),
    ownerContextRef: text("owner_context_ref").notNull(),
    ownerAuthorizationEpoch: integer("owner_authorization_epoch").notNull(),
    ownerPolicyEpoch: integer("owner_policy_epoch").notNull(),
    delegateAuthorizationEpoch: integer("delegate_authorization_epoch").notNull(),
    delegatePolicyEpoch: integer("delegate_policy_epoch").notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index("auth_purpose_delegations_delegate_lookup_idx").on(
      table.delegateAccountId,
      table.purpose,
      table.resourceReference,
      table.state,
      table.expiresAt,
    ),
    check(
      "auth_purpose_delegations_purpose_valid",
      sql`${table.purpose} = 'bookkeeping_period_close_review'`,
    ),
    check(
      "auth_purpose_delegations_resource_type_valid",
      sql`${table.resourceType} = 'accounting_entity'`,
    ),
    check(
      "auth_purpose_delegations_state_valid",
      sql`${table.state} in ('active', 'revoked', 'expired')`,
    ),
    check(
      "auth_purpose_delegations_epoch_positive",
      sql`${table.ownerAuthorizationEpoch} > 0 and ${table.ownerPolicyEpoch} > 0 and ${table.delegateAuthorizationEpoch} > 0 and ${table.delegatePolicyEpoch} > 0`,
    ),
    check("auth_purpose_delegations_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "auth_purpose_delegations_revocation_valid",
      sql`(${table.state} = 'revoked') = (${table.revokedAt} is not null)`,
    ),
    authGatewayOnly("auth_purpose_delegations"),
  ],
).enableRLS();

export const authMfaFactors = pgTable(
  "auth_mfa_factors",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => authAccounts.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 16 }).notNull(),
    providerFactorReference: text("provider_factor_reference"),
    state: varchar("state", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    check("auth_mfa_factors_provider_valid", sql`${table.provider} in ('totp', 'passkey')`),
    check("auth_mfa_factors_state_valid", sql`${table.state} in ('pending', 'active', 'removed')`),
    authGatewayOnly("auth_mfa_factors"),
  ],
).enableRLS();

export const authServiceAccounts = pgTable(
  "auth_service_accounts",
  {
    id: text("id").primaryKey(),
    subject: varchar("subject", { length: 128 }).notNull().unique(),
    audience: varchar("audience", { length: 128 }).notNull(),
    scopes: jsonb("scopes").$type<readonly string[]>().notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    accessVersion: integer("access_version").notNull(),
    ...timestamps,
  },
  (table) => [
    check("auth_service_accounts_state_valid", sql`${table.state} in ('active', 'revoked')`),
    authGatewayOnly("auth_service_accounts"),
  ],
).enableRLS();

export const authRateBuckets = pgTable(
  "auth_rate_buckets",
  {
    bucketDigest: text("bucket_digest").primaryKey(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    count: integer("count").notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    check("auth_rate_buckets_count_positive", sql`${table.count} > 0`),
    check("auth_rate_buckets_expiry_valid", sql`${table.expiresAt} > ${table.windowStartedAt}`),
    authGatewayOnly("auth_rate_buckets"),
  ],
).enableRLS();

export const authSecurityEvents = pgTable(
  "auth_security_events",
  {
    id: text("id").primaryKey(),
    eventKey: text("event_key").notNull().unique(),
    accountId: text("account_id").references(() => authAccounts.id, { onDelete: "set null" }),
    sequence: bigint("sequence", { mode: "number" }).notNull().default(sql`nextval('auth_security_event_sequence')`),
    eventName: varchar("event_name", { length: 80 }).notNull(),
    outcome: varchar("outcome", { length: 32 }).notNull(),
    correlationId: text("correlation_id").notNull(),
    policyVersion: integer("policy_version").notNull(),
    metadata: jsonb("metadata").$type<Readonly<Record<string, string | number | boolean>>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    unique("auth_security_events_account_sequence_unique").on(table.accountId, table.sequence),
    index("auth_security_events_account_occurred_idx").on(table.accountId, table.occurredAt),
    authGatewayOnly("auth_security_events"),
  ],
).enableRLS();

export const authOutbox = pgTable(
  "auth_outbox",
  {
    commandId: text("command_id").primaryKey(),
    accountId: text("account_id").references(() => authAccounts.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    channel: varchar("channel", { length: 24 }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull().unique(),
    state: varchar("state", { length: 24 }).notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    leaseOwner: text("lease_owner"),
    leasePurpose: varchar("lease_purpose", { length: 16 }),
    leaseVersion: integer("lease_version").notNull().default(0),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true, mode: "date" }),
    availableAt: timestamp("available_at", { withTimezone: true, mode: "date" }).notNull(),
    payload: jsonb("payload").notNull(),
    resultCode: varchar("result_code", { length: 64 }),
    providerOutcome: varchar("provider_outcome", { length: 16 }),
    providerMessageId: text("provider_message_id"),
    reconcileAfter: timestamp("reconcile_after", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    index("auth_outbox_dispatch_idx").on(table.state, table.availableAt, table.leaseExpiresAt),
    check("auth_outbox_state_valid", sql`${table.state} in ('pending', 'leased', 'reconciling', 'completed', 'manual_review')`),
    check("auth_outbox_channel_valid", sql`${table.channel} is null or ${table.channel} in ('email', 'otp', 'security_alert', 'invitation')`),
    check("auth_outbox_lease_purpose_valid", sql`${table.leasePurpose} is null or ${table.leasePurpose} in ('dispatch', 'reconcile')`),
    check("auth_outbox_provider_outcome_valid", sql`${table.providerOutcome} is null or ${table.providerOutcome} in ('sent', 'failed', 'unknown')`),
    authGatewayOnly("auth_outbox"),
  ],
).enableRLS();

export const authTables = [
  "auth_accounts", "auth_external_identities", "auth_supabase_identity_evidence", "auth_crm_party_evidence", "auth_identity_conflicts", "auth_sessions", "auth_provider_vault",
  "auth_transactions", "auth_proofs", "auth_invitations", "auth_party_links", "auth_organizations",
  "auth_roles", "auth_role_permissions", "auth_role_assignments", "auth_mfa_factors",
  "auth_service_accounts", "auth_rate_buckets", "auth_security_events", "auth_outbox",
] as const;

export const authRlsHardeningSql = `
ALTER TABLE ${authTables.map((table) => `"${table}"`).join(", ")} FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ${authTables.map((table) => `"${table}"`).join(", ")} FROM PUBLIC;
`;
