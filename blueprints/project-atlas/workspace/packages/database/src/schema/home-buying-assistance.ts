import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const homebuyerEngagements = pgTable("homebuyer_engagements", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  serviceOrderId: text("service_order_id").notNull(),
  serviceType: text("service_type").notNull(),
  deliveryModel: text("delivery_model").notNull(),
  status: text("status").notNull(),
  assignedSpecialistId: text("assigned_specialist_id"),
  reviewerId: text("reviewer_id"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
export const homebuyerCases = pgTable(
  "homebuyer_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: text("case_number").notNull(),
    engagementId: text("engagement_id").notNull(),
    clientId: text("client_id").notNull(),
    homebuyerProfileId: text("homebuyer_profile_id"),
    status: text("status").notNull(),
    priority: text("priority").notNull(),
    assignedTo: text("assigned_to"),
    reviewerId: text("reviewer_id"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("homebuyer_cases_number_uq").on(table.caseNumber),
    index("homebuyer_cases_client_status_idx").on(table.clientId, table.status),
  ],
);
export const homebuyerProfiles = pgTable(
  "homebuyer_profiles",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    verificationStatus: text("verification_status").notNull(),
    profile: jsonb("profile").$type<Record<string, unknown>>().notNull(),
    sources: jsonb("sources").$type<readonly Record<string, unknown>[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("homebuyer_profiles_case_version_uq").on(
      table.homebuyerCaseId,
      table.profileVersion,
    ),
  ],
);
export const homebuyerFinancialProfiles = pgTable(
  "homebuyer_financial_profiles",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    verificationStatus: text("verification_status").notNull(),
    financialProfile: jsonb("financial_profile").$type<Record<string, unknown>>().notNull(),
    sources: jsonb("sources").$type<readonly Record<string, unknown>[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("homebuyer_financial_profiles_case_version_uq").on(
      table.homebuyerCaseId,
      table.profileVersion,
    ),
  ],
);
export const housingPrograms = pgTable(
  "housing_programs",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    family: text("family").notNull(),
    jurisdiction: text("jurisdiction").notNull(),
    status: text("status").notNull(),
    currentVersionId: text("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("housing_programs_code_uq").on(table.code)],
);
export const housingProgramVersions = pgTable(
  "housing_program_versions",
  {
    id: text("id").primaryKey(),
    programId: text("program_id").notNull(),
    version: integer("version").notNull(),
    status: text("status").notNull(),
    availability: text("availability").notNull(),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
    sources: jsonb("sources").$type<readonly Record<string, unknown>[]>().notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("housing_program_versions_program_version_uq").on(table.programId, table.version),
  ],
);
export const homebuyerProgramScreenings = pgTable(
  "homebuyer_program_screenings",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    programVersionId: text("program_version_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    financialProfileVersion: integer("financial_profile_version"),
    status: text("status").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("homebuyer_program_screenings_case_idx").on(table.homebuyerCaseId)],
);
export const homebuyerConsents = pgTable(
  "homebuyer_consents",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    partnerId: text("partner_id"),
    purpose: text("purpose").notNull(),
    status: text("status").notNull(),
    dataCategories: jsonb("data_categories").$type<readonly string[]>().notNull(),
    disclosureVersionIds: jsonb("disclosure_version_ids").$type<readonly string[]>().notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [index("homebuyer_consents_case_idx").on(table.homebuyerCaseId)],
);
export const homebuyerReferrals = pgTable(
  "homebuyer_referrals",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    lenderId: text("lender_id").notNull(),
    programVersionId: text("program_version_id"),
    consentId: text("consent_id").notNull(),
    trackingReference: text("tracking_reference").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("homebuyer_referrals_case_idx").on(table.homebuyerCaseId)],
);
export const homebuyerPropertyCandidates = pgTable(
  "homebuyer_property_candidates",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    addressReference: text("address_reference").notNull(),
    listingReference: text("listing_reference"),
    priceCents: integer("price_cents"),
    currency: text("currency"),
    status: text("status").notNull(),
    sources: jsonb("sources").$type<readonly Record<string, unknown>[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("homebuyer_property_candidates_case_idx").on(table.homebuyerCaseId)],
);
export const homebuyerClosingRecords = pgTable(
  "homebuyer_closing_records",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id").notNull(),
    propertyCandidateId: text("property_candidate_id").notNull(),
    closingStatus: text("closing_status").notNull(),
    closingDate: timestamp("closing_date", { withTimezone: true }),
    finalCashToCloseCents: integer("final_cash_to_close_cents"),
    currency: text("currency"),
    sourceDocumentId: text("source_document_id"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [index("homebuyer_closing_records_case_idx").on(table.homebuyerCaseId)],
);
export const homebuyerAuditEvents = pgTable(
  "homebuyer_audit_events",
  {
    id: text("id").primaryKey(),
    homebuyerCaseId: text("homebuyer_case_id"),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    correlationId: text("correlation_id").notNull(),
    safeMetadata: jsonb("safe_metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("homebuyer_audit_events_case_idx").on(table.homebuyerCaseId)],
);
