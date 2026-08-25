import { sql } from "drizzle-orm";
import {
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

export const formationGatewayRole = pgRole("atlas_formation_gateway").existing();

const ownership = {
  ownerAccountId: text("owner_account_id").notNull(),
  contextRef: text("context_ref").notNull(),
  authorizationEpoch: integer("authorization_epoch").notNull(),
  policyEpoch: integer("policy_epoch").notNull(),
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

const gatewayOnly = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: formationGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });

export const formationCases = pgTable(
  "formation_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: varchar("case_number", { length: 64 }).notNull(),
    ...ownership,
    clientRef: text("client_ref").notNull(),
    organizationRef: text("organization_ref"),
    serviceOrderRef: text("service_order_ref").notNull(),
    productCode: varchar("product_code", { length: 96 }).notNull(),
    entityType: varchar("entity_type", { length: 48 }).notNull(),
    formationJurisdiction: varchar("formation_jurisdiction", { length: 24 }).notNull(),
    deliveryModel: varchar("delivery_model", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    assignedSpecialistRef: text("assigned_specialist_ref"),
    assignedReviewerRef: text("assigned_reviewer_ref"),
    partnerRef: text("partner_ref"),
    version: integer("version").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("formation_cases_case_number_unique").on(table.caseNumber),
    index("formation_cases_owner_context_status_idx").on(
      table.ownerAccountId,
      table.contextRef,
      table.status,
    ),
    check("formation_cases_version_positive", sql`${table.version} > 0`),
    gatewayOnly("formation_cases"),
  ],
).enableRLS();

export const formationRequirementVersions = pgTable(
  "formation_requirement_versions",
  {
    id: text("id").primaryKey(),
    jurisdiction: varchar("jurisdiction", { length: 24 }).notNull(),
    entityType: varchar("entity_type", { length: 48 }).notNull(),
    ruleCategory: varchar("rule_category", { length: 48 }).notNull(),
    ruleKey: varchar("rule_key", { length: 96 }).notNull(),
    ruleValue: jsonb("rule_value").notNull(),
    verificationStatus: varchar("verification_status", { length: 24 }).notNull(),
    sourceReference: text("source_reference").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true, mode: "date" }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true, mode: "date" }),
    version: integer("version").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
    verifiedBy: text("verified_by"),
    ...timestamps,
  },
  (table) => [
    unique("formation_requirement_versions_identity_unique").on(
      table.jurisdiction,
      table.entityType,
      table.ruleKey,
      table.version,
    ),
    index("formation_requirement_versions_current_idx").on(
      table.jurisdiction,
      table.entityType,
      table.ruleKey,
      table.effectiveFrom,
    ),
    check("formation_requirement_versions_version_positive", sql`${table.version} > 0`),
    check(
      "formation_requirement_versions_effective_window_valid",
      sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`,
    ),
    gatewayOnly("formation_requirement_versions"),
  ],
).enableRLS();

export const formationRequirementSnapshots = pgTable(
  "formation_requirement_snapshots",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    snapshotHash: varchar("snapshot_hash", { length: 64 }).notNull(),
    requirementIds: jsonb("requirement_ids").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true, mode: "date" }).notNull(),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true, mode: "date" }),
    invalidationReason: varchar("invalidation_reason", { length: 80 }),
    ...timestamps,
  },
  (table) => [
    unique("formation_requirement_snapshots_case_hash_unique").on(
      table.formationCaseId,
      table.snapshotHash,
    ),
    index("formation_requirement_snapshots_case_captured_idx").on(
      table.formationCaseId,
      table.capturedAt,
    ),
    gatewayOnly("formation_requirement_snapshots"),
  ],
).enableRLS();

export const formationParties = pgTable(
  "formation_parties",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    partyRef: text("party_ref").notNull(),
    partyRole: varchar("party_role", { length: 40 }).notNull(),
    ownershipBasisPoints: integer("ownership_basis_points"),
    votingBasisPoints: integer("voting_basis_points"),
    managementRole: varchar("management_role", { length: 40 }),
    status: varchar("status", { length: 24 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("formation_parties_case_party_role_unique").on(
      table.formationCaseId,
      table.partyRef,
      table.partyRole,
    ),
    check(
      "formation_parties_ownership_basis_points_valid",
      sql`${table.ownershipBasisPoints} is null or ${table.ownershipBasisPoints} between 1 and 10000`,
    ),
    gatewayOnly("formation_parties"),
  ],
).enableRLS();

export const formationNameCandidates = pgTable(
  "formation_name_candidates",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    candidateName: text("candidate_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    rank: integer("rank").notNull(),
    source: varchar("source", { length: 24 }).notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    conflictReason: text("conflict_reason"),
    evidenceReference: text("evidence_reference"),
    ...timestamps,
  },
  (table) => [
    unique("formation_name_candidates_case_rank_unique").on(table.formationCaseId, table.rank),
    index("formation_name_candidates_case_status_idx").on(table.formationCaseId, table.status),
    gatewayOnly("formation_name_candidates"),
  ],
).enableRLS();

export const formationPackages = pgTable(
  "formation_packages",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    requirementSnapshotId: text("requirement_snapshot_id")
      .notNull()
      .references(() => formationRequirementSnapshots.id, { onDelete: "restrict" }),
    templateVersion: varchar("template_version", { length: 96 }).notNull(),
    documentHash: varchar("document_hash", { length: 64 }).notNull(),
    documentRefs: jsonb("document_refs").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true, mode: "date" }).notNull(),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("formation_packages_case_document_hash_unique").on(
      table.formationCaseId,
      table.documentHash,
    ),
    index("formation_packages_case_state_idx").on(table.formationCaseId, table.state),
    gatewayOnly("formation_packages"),
  ],
).enableRLS();

export const formationAuthorizations = pgTable(
  "formation_authorizations",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    formationPackageId: text("formation_package_id")
      .notNull()
      .references(() => formationPackages.id, { onDelete: "restrict" }),
    documentHash: varchar("document_hash", { length: 64 }).notNull(),
    authorizationType: varchar("authorization_type", { length: 48 }).notNull(),
    signerRef: text("signer_ref").notNull(),
    signatureEvidenceRef: text("signature_evidence_ref"),
    status: varchar("status", { length: 24 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("formation_authorizations_package_signer_type_unique").on(
      table.formationPackageId,
      table.signerRef,
      table.authorizationType,
    ),
    gatewayOnly("formation_authorizations"),
  ],
).enableRLS();

export const formationFilingAttempts = pgTable(
  "formation_filing_attempts",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    formationPackageId: text("formation_package_id")
      .notNull()
      .references(() => formationPackages.id, { onDelete: "restrict" }),
    providerCode: varchar("provider_code", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    packageHash: varchar("package_hash", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    governmentFeeMinor: integer("government_fee_minor").notNull(),
    sgServiceFeeMinor: integer("sg_service_fee_minor").notNull(),
    partnerFeeMinor: integer("partner_fee_minor").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("formation_filing_attempts_case_idempotency_unique").on(
      table.formationCaseId,
      table.idempotencyKey,
    ),
    index("formation_filing_attempts_case_status_idx").on(table.formationCaseId, table.status),
    check(
      "formation_filing_attempts_government_fee_nonnegative",
      sql`${table.governmentFeeMinor} >= 0`,
    ),
    check("formation_filing_attempts_sg_fee_nonnegative", sql`${table.sgServiceFeeMinor} >= 0`),
    check("formation_filing_attempts_partner_fee_nonnegative", sql`${table.partnerFeeMinor} >= 0`),
    gatewayOnly("formation_filing_attempts"),
  ],
).enableRLS();

export const formationFilingOutcomes = pgTable(
  "formation_filing_outcomes",
  {
    id: text("id").primaryKey(),
    filingAttemptId: text("filing_attempt_id")
      .notNull()
      .references(() => formationFilingAttempts.id, { onDelete: "restrict" }),
    outcomeKind: varchar("outcome_kind", { length: 32 }).notNull(),
    officialReference: text("official_reference").notNull(),
    reason: text("reason"),
    officialDocumentRefs: jsonb("official_document_refs").notNull(),
    rawStatusReference: text("raw_status_reference"),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("formation_filing_outcomes_attempt_occurred_idx").on(
      table.filingAttemptId,
      table.occurredAt,
    ),
    gatewayOnly("formation_filing_outcomes"),
  ],
).enableRLS();

export const formationHandoffs = pgTable(
  "formation_handoffs",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    destination: varchar("destination", { length: 24 }).notNull(),
    approvalReference: text("approval_reference").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    unique("formation_handoffs_case_destination_approval_unique").on(
      table.formationCaseId,
      table.destination,
      table.approvalReference,
    ),
    unique("formation_handoffs_idempotency_unique").on(table.idempotencyKey),
    gatewayOnly("formation_handoffs"),
  ],
).enableRLS();

export const formationAuditEvents = pgTable(
  "formation_audit_events",
  {
    id: text("id").primaryKey(),
    formationCaseId: text("formation_case_id")
      .notNull()
      .references(() => formationCases.id, { onDelete: "restrict" }),
    ...ownership,
    eventType: varchar("event_type", { length: 96 }).notNull(),
    actorRef: text("actor_ref").notNull(),
    resourceRef: text("resource_ref").notNull(),
    correlationId: varchar("correlation_id", { length: 128 }).notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    index("formation_audit_events_case_created_idx").on(table.formationCaseId, table.createdAt),
    gatewayOnly("formation_audit_events"),
  ],
).enableRLS();
