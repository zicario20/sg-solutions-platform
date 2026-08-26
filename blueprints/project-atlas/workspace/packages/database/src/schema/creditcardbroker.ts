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
export const ccbRuleSnapshots = pgTable(
  "ccb_rule_snapshots",
  {
    id: text("id").primaryKey(),
    sourceUrl: text("source_url").notNull(),
    sourceType: varchar("source_type", { length: 48 }).notNull(),
    ruleVersion: varchar("rule_version", { length: 128 }).notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ccb_rule_snapshots_source_version_unique").on(table.sourceUrl, table.ruleVersion),
  ],
);
export const ccbIntegrationModes = pgTable("ccb_integration_modes", {
  id: text("id").primaryKey(),
  ruleSnapshotId: text("rule_snapshot_id").notNull(),
  mode: varchar("mode", { length: 48 }).notNull(),
  authorizationStatus: varchar("authorization_status", { length: 32 }).notNull(),
  approvedDomains: jsonb("approved_domains").notNull(),
  approvedSurfaces: jsonb("approved_surfaces").notNull(),
  capabilities: jsonb("capabilities").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  ...timestamps,
});
export const ccbApprovedSurfaces = pgTable("ccb_approved_surfaces", {
  id: text("id").primaryKey(),
  ruleSnapshotId: text("rule_snapshot_id").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  pathPattern: text("path_pattern"),
  surfaceType: varchar("surface_type", { length: 48 }).notNull(),
  approvalStatus: varchar("approval_status", { length: 24 }).notNull(),
  disclosureSetId: text("disclosure_set_id").notNull(),
  ...timestamps,
});
export const ccbPartnerAccounts = pgTable(
  "ccb_partner_accounts",
  {
    id: text("id").primaryKey(),
    marketplaceProviderId: text("marketplace_provider_id").notNull(),
    externalAccountReference: text("external_account_reference").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    taxDocumentStatus: varchar("tax_document_status", { length: 24 }).notNull(),
    taxDocumentReference: text("tax_document_reference"),
    integrationModeIds: jsonb("integration_mode_ids").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("ccb_partner_accounts_provider_unique").on(table.marketplaceProviderId)],
);
export const ccbAdvertisers = pgTable("ccb_advertisers", {
  id: text("id").primaryKey(),
  networkProviderId: text("network_provider_id").notNull(),
  externalAdvertiserId: text("external_advertiser_id"),
  legalName: varchar("legal_name", { length: 256 }).notNull(),
  displayName: varchar("display_name", { length: 256 }).notNull(),
  providerType: varchar("provider_type", { length: 48 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
export const ccbOfferSources = pgTable(
  "ccb_offer_sources",
  {
    id: text("id").primaryKey(),
    externalOfferId: text("external_offer_id").notNull(),
    advertiserId: text("advertiser_id").notNull(),
    sourceMethod: varchar("source_method", { length: 48 }).notNull(),
    sourcePayloadReference: text("source_payload_reference").notNull(),
    rawPayloadHash: varchar("raw_payload_hash", { length: 128 }).notNull(),
    sourceVersion: varchar("source_version", { length: 128 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ccb_offer_sources_offer_version_unique").on(
      table.externalOfferId,
      table.sourceVersion,
    ),
  ],
);
export const ccbOffers = pgTable(
  "ccb_offers",
  {
    id: text("id").primaryKey(),
    externalOfferId: text("external_offer_id").notNull(),
    advertiserId: text("advertiser_id").notNull(),
    sourceId: text("source_id").notNull(),
    productFamily: varchar("product_family", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    freshnessStatus: varchar("freshness_status", { length: 16 }).notNull(),
    currentVersionId: text("current_version_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ccb_offers_external_offer_unique").on(table.externalOfferId),
    index("ccb_offers_status_freshness_idx").on(table.status, table.freshnessStatus),
  ],
);
export const ccbOfferVersions = pgTable(
  "ccb_offer_versions",
  {
    id: text("id").primaryKey(),
    offerId: text("offer_id").notNull(),
    version: integer("version").notNull(),
    contentSnapshot: jsonb("content_snapshot").notNull(),
    termsSnapshot: jsonb("terms_snapshot").notNull(),
    disclosureSnapshot: jsonb("disclosure_snapshot").notNull(),
    sourceSnapshot: jsonb("source_snapshot").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ccb_offer_versions_offer_version_unique").on(table.offerId, table.version),
  ],
);
export const ccbAffiliateLinks = pgTable("ccb_affiliate_links", {
  id: text("id").primaryKey(),
  offerId: text("offer_id").notNull(),
  externalTrackingUrl: text("external_tracking_url").notNull(),
  destinationHost: varchar("destination_host", { length: 255 }).notNull(),
  trackingParameterNames: jsonb("tracking_parameter_names").notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  ...timestamps,
});
export const ccbJourneys = pgTable(
  "ccb_journeys",
  {
    id: text("id").primaryKey(),
    marketplaceJourneyId: text("marketplace_journey_id").notNull(),
    offerId: text("offer_id").notNull(),
    displayId: text("display_id").notNull(),
    clientReference: text("client_reference"),
    consentId: text("consent_id"),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ccb_journeys_marketplace_journey_unique").on(table.marketplaceJourneyId),
  ],
);
export const ccbConversions = pgTable(
  "ccb_conversions",
  {
    id: text("id").primaryKey(),
    journeyId: text("journey_id").notNull(),
    definitionId: text("definition_id").notNull(),
    externalEventReference: varchar("external_event_reference", { length: 160 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    evidenceType: varchar("evidence_type", { length: 32 }),
    evidenceReference: text("evidence_reference"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("ccb_conversions_event_unique").on(table.externalEventReference)],
);
export const ccbCommissionRules = pgTable("ccb_commission_rules", {
  id: text("id").primaryKey(),
  partnerAccountId: text("partner_account_id").notNull(),
  conversionDefinitionId: text("conversion_definition_id").notNull(),
  version: integer("version").notNull(),
  calculationType: varchar("calculation_type", { length: 32 }).notNull(),
  amountCents: integer("amount_cents"),
  basisPoints: integer("basis_points"),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull(),
  ...timestamps,
});
export const ccbCommissions = pgTable("ccb_commissions", {
  id: text("id").primaryKey(),
  conversionId: text("conversion_id").notNull(),
  ruleId: text("rule_id").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  amountCents: integer("amount_cents"),
  qualifyingEvidenceReference: text("qualifying_evidence_reference"),
  currency: varchar("currency", { length: 3 }).notNull(),
  ...timestamps,
});
export const ccbFindings = pgTable("ccb_findings", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 48 }).notNull(),
  resourceType: varchar("resource_type", { length: 64 }).notNull(),
  resourceId: text("resource_id").notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  status: varchar("status", { length: 48 }).notNull(),
  blocking: boolean("blocking").notNull().default(false),
  ...timestamps,
});
