import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
export const partners = pgTable(
  "partners",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    code: varchar("code", { length: 96 }).notNull(),
    legalName: varchar("legal_name", { length: 256 }).notNull(),
    displayName: varchar("display_name", { length: 256 }).notNull(),
    partnerType: varchar("partner_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    verificationStatus: varchar("verification_status", { length: 32 }).notNull(),
    riskTier: varchar("risk_tier", { length: 16 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("partners_code_unique").on(table.code),
    uniqueIndex("partners_organization_unique").on(table.organizationId),
  ],
);
export const partnerRelationships = pgTable("partner_relationships", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  relationshipType: varchar("relationship_type", { length: 48 }).notNull(),
  ownerId: text("owner_id").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ...timestamps,
});
export const partnerOnboardings = pgTable("partner_onboardings", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  ownerId: text("owner_id").notNull(),
  blockingFindingIds: jsonb("blocking_finding_ids").notNull(),
  ...timestamps,
});
export const partnerDueDiligence = pgTable("partner_due_diligence", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  ...timestamps,
});
export const partnerContacts = pgTable("partner_contacts", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  personReference: text("person_reference").notNull(),
  role: varchar("role", { length: 48 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  primaryFor: jsonb("primary_for").notNull(),
  ...timestamps,
});
export const partnerCapabilities = pgTable(
  "partner_capabilities",
  {
    id: text("id").primaryKey(),
    partnerId: text("partner_id").notNull(),
    code: varchar("code", { length: 96 }).notNull(),
    domain: varchar("domain", { length: 48 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    conditions: jsonb("conditions").notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("partner_capabilities_partner_status_idx").on(table.partnerId, table.status)],
);
export const partnerJurisdictions = pgTable("partner_jurisdictions", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  state: varchar("state", { length: 64 }),
  county: varchar("county", { length: 128 }),
  scopeType: varchar("scope_type", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
export const partnerAgreements = pgTable(
  "partner_agreements",
  {
    id: text("id").primaryKey(),
    partnerId: text("partner_id").notNull(),
    type: varchar("type", { length: 48 }).notNull(),
    code: varchar("code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    commercialTermsReference: text("commercial_terms_reference"),
    ...timestamps,
  },
  (table) => [uniqueIndex("partner_agreements_code_version_unique").on(table.code, table.version)],
);
export const partnerAuthorizations = pgTable("partner_authorizations", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  capabilityId: text("capability_id"),
  jurisdictionId: text("jurisdiction_id"),
  agreementId: text("agreement_id"),
  status: varchar("status", { length: 24 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  approvedBy: text("approved_by"),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  ...timestamps,
});
export const partnerDocuments = pgTable("partner_documents", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  documentType: varchar("document_type", { length: 48 }).notNull(),
  documentReference: text("document_reference").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
export const partnerAssignments = pgTable(
  "partner_assignments",
  {
    id: text("id").primaryKey(),
    partnerId: text("partner_id").notNull(),
    sourceModule: varchar("source_module", { length: 8 }).notNull(),
    sourceResourceId: text("source_resource_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("partner_assignments_idempotency_unique").on(table.idempotencyKey)],
);
export const partnerEconomics = pgTable("partner_economics", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  agreementId: text("agreement_id").notNull(),
  qualifyingEventReference: text("qualifying_event_reference").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  amountCents: integer("amount_cents"),
  currency: varchar("currency", { length: 3 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
export const partnerFindings = pgTable("partner_findings", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  blocking: boolean("blocking").notNull().default(false),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
