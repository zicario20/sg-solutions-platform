import {
  bigint,
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

export const marketplaceProviders = pgTable(
  "marketplace_providers",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    code: varchar("code", { length: 96 }).notNull(),
    publicName: varchar("public_name", { length: 256 }).notNull(),
    providerType: varchar("provider_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    allowedRedirectHosts: jsonb("allowed_redirect_hosts").notNull(),
    capabilities: jsonb("capabilities").notNull(),
    agreementReference: text("agreement_reference"),
    verificationDueAt: timestamp("verification_due_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("marketplace_providers_code_unique").on(table.code)],
);

export const marketplaceCategories = pgTable(
  "marketplace_categories",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull(),
    parentCategoryId: text("parent_category_id"),
    translations: jsonb("translations").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("marketplace_categories_code_unique").on(table.code)],
);

export const marketplaceListings = pgTable(
  "marketplace_listings",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull(),
    providerId: text("provider_id").notNull(),
    categoryId: text("category_id").notNull(),
    itemType: varchar("item_type", { length: 48 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    publicVisibility: varchar("public_visibility", { length: 32 }).notNull(),
    currentVersionId: text("current_version_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("marketplace_listings_code_unique").on(table.code),
    index("marketplace_listings_provider_status_idx").on(table.providerId, table.status),
  ],
);

export const marketplaceListingVersions = pgTable(
  "marketplace_listing_versions",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id").notNull(),
    version: integer("version").notNull(),
    translations: jsonb("translations").notNull(),
    disclosures: jsonb("disclosures").notNull(),
    pricingStatus: varchar("pricing_status", { length: 32 }).notNull(),
    availabilityStatus: varchar("availability_status", { length: 32 }).notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("marketplace_listing_versions_listing_version_unique").on(
      table.listingId,
      table.version,
    ),
    index("marketplace_listing_versions_listing_status_idx").on(table.listingId, table.status),
  ],
);

export const marketplaceConsents = pgTable(
  "marketplace_consents",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull(),
    providerId: text("provider_id").notNull(),
    listingVersionId: text("listing_version_id").notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    dataCategories: jsonb("data_categories").notNull(),
    disclosureVersionIds: jsonb("disclosure_version_ids").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("marketplace_consents_client_provider_idx").on(table.clientId, table.providerId),
  ],
);

export const marketplaceJourneys = pgTable(
  "marketplace_journeys",
  {
    id: text("id").primaryKey(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    clientId: text("client_id").notNull(),
    providerId: text("provider_id").notNull(),
    listingVersionId: text("listing_version_id").notNull(),
    sourceChannel: varchar("source_channel", { length: 32 }).notNull(),
    status: varchar("status", { length: 40 }).notNull(),
    consentId: text("consent_id"),
    attribution: jsonb("attribution").notNull(),
    externalReference: text("external_reference"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("marketplace_journeys_idempotency_unique").on(table.idempotencyKey),
    index("marketplace_journeys_client_status_idx").on(table.clientId, table.status),
  ],
);

export const marketplaceConversions = pgTable(
  "marketplace_conversions",
  {
    id: text("id").primaryKey(),
    journeyId: text("journey_id").notNull(),
    providerId: text("provider_id").notNull(),
    eventReference: varchar("event_reference", { length: 160 }).notNull(),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    verified: boolean("verified").notNull().default(false),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("marketplace_conversions_provider_event_unique").on(
      table.providerId,
      table.eventReference,
    ),
    index("marketplace_conversions_journey_idx").on(table.journeyId),
  ],
);

export const marketplaceCommissions = pgTable(
  "marketplace_commissions",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull(),
    journeyId: text("journey_id").notNull(),
    conversionId: text("conversion_id").notNull(),
    contractReference: text("contract_reference").notNull(),
    calculationRuleVersion: varchar("calculation_rule_version", { length: 64 }).notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("marketplace_commissions_provider_status_idx").on(table.providerId, table.status),
  ],
);
