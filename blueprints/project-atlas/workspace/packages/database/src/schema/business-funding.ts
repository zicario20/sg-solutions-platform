import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** M035 persistence contracts. The migration is authored only; it is not executed by this module. */
export const fundingEngagements = pgTable(
  "funding_engagements",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    organizationId: text("organization_id").notNull(),
    serviceOrderId: text("service_order_id").notNull(),
    serviceType: text("service_type").notNull(),
    deliveryModel: text("delivery_model").notNull(),
    status: text("status").notNull(),
    assignedSpecialistId: text("assigned_specialist_id"),
    assignedReviewerId: text("assigned_reviewer_id"),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("funding_engagements_organization_idx").on(table.organizationId),
    index("funding_engagements_client_idx").on(table.clientId),
  ],
);

export const fundingCases = pgTable(
  "funding_cases",
  {
    id: text("id").primaryKey(),
    caseNumber: text("case_number").notNull(),
    engagementId: text("engagement_id").notNull(),
    clientId: text("client_id").notNull(),
    organizationId: text("organization_id").notNull(),
    fundingProfileId: text("funding_profile_id"),
    requestedAmountCents: integer("requested_amount_cents"),
    currency: text("currency"),
    purposeCode: text("purpose_code"),
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
    uniqueIndex("funding_cases_number_uq").on(table.caseNumber),
    index("funding_cases_organization_status_idx").on(table.organizationId, table.status),
  ],
);

export const fundingProfiles = pgTable(
  "funding_profiles",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    organizationId: text("organization_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    verificationStatus: text("verification_status").notNull(),
    profile: jsonb("profile").$type<Record<string, unknown>>().notNull(),
    sourceReferences: jsonb("source_references")
      .$type<readonly Record<string, unknown>[]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("funding_profiles_case_version_uq").on(table.fundingCaseId, table.profileVersion),
  ],
);

export const fundingFinancialProfiles = pgTable(
  "funding_financial_profiles",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    organizationId: text("organization_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    verificationStatus: text("verification_status").notNull(),
    financialProfile: jsonb("financial_profile").$type<Record<string, unknown>>().notNull(),
    sourceReferences: jsonb("source_references")
      .$type<readonly Record<string, unknown>[]>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("funding_financial_profiles_case_version_uq").on(
      table.fundingCaseId,
      table.profileVersion,
    ),
  ],
);

export const fundingProducts = pgTable(
  "funding_products",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    providerId: text("provider_id"),
    partnerId: text("partner_id"),
    family: text("family").notNull(),
    deliveryModel: text("delivery_model").notNull(),
    status: text("status").notNull(),
    currentVersionId: text("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("funding_products_code_uq").on(table.code)],
);

export const fundingProductVersions = pgTable(
  "funding_product_versions",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    version: integer("version").notNull(),
    status: text("status").notNull(),
    availability: text("availability").notNull(),
    configuration: jsonb("configuration").$type<Record<string, unknown>>().notNull(),
    sourceReferences: jsonb("source_references")
      .$type<readonly Record<string, unknown>[]>()
      .notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("funding_product_versions_product_version_uq").on(table.productId, table.version),
  ],
);

export const fundingScreenings = pgTable(
  "funding_screenings",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    productVersionId: text("product_version_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    financialProfileVersion: integer("financial_profile_version"),
    status: text("status").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("funding_screenings_case_idx").on(table.fundingCaseId)],
);

export const fundingMatchingRuns = pgTable(
  "funding_matching_runs",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    profileVersion: integer("profile_version").notNull(),
    financialProfileVersion: integer("financial_profile_version"),
    status: text("status").notNull(),
    candidates: jsonb("candidates").$type<readonly Record<string, unknown>[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("funding_matching_runs_case_idx").on(table.fundingCaseId)],
);

export const fundingConsents = pgTable(
  "funding_consents",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    providerId: text("provider_id"),
    partnerId: text("partner_id"),
    purpose: text("purpose").notNull(),
    status: text("status").notNull(),
    dataCategories: jsonb("data_categories").$type<readonly string[]>().notNull(),
    disclosureVersionIds: jsonb("disclosure_version_ids").$type<readonly string[]>().notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [index("funding_consents_case_idx").on(table.fundingCaseId)],
);

export const fundingApplications = pgTable(
  "funding_applications",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id").notNull(),
    providerId: text("provider_id").notNull(),
    productVersionId: text("product_version_id").notNull(),
    applicationPackageId: text("application_package_id").notNull(),
    externalApplicationId: text("external_application_id"),
    applicationChannel: text("application_channel").notNull(),
    status: text("status").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decisionAt: timestamp("decision_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("funding_applications_idempotency_uq").on(table.idempotencyKey),
    index("funding_applications_case_idx").on(table.fundingCaseId),
  ],
);

export const fundingOffers = pgTable(
  "funding_offers",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id").notNull(),
    providerId: text("provider_id").notNull(),
    productVersionId: text("product_version_id").notNull(),
    offerAmountCents: integer("offer_amount_cents").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(),
    terms: jsonb("terms").$type<Record<string, unknown>>().notNull(),
    sourceDocumentId: text("source_document_id"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("funding_offers_application_idx").on(table.applicationId)],
);

export const fundingAuditEvents = pgTable(
  "funding_audit_events",
  {
    id: text("id").primaryKey(),
    fundingCaseId: text("funding_case_id"),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    correlationId: text("correlation_id").notNull(),
    safeMetadata: jsonb("safe_metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("funding_audit_events_case_idx").on(table.fundingCaseId),
    index("funding_audit_events_correlation_idx").on(table.correlationId),
  ],
);
