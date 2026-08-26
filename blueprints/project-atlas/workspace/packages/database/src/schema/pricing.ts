import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
};

export const currencyDefinitions = pgTable(
  "currency_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    minorUnitDigits: integer("minor_unit_digits").notNull(),
    displaySymbol: varchar("display_symbol", { length: 16 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    roundingContext: varchar("rounding_context", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    sourceReference: text("source_reference").notNull(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("currency_definitions_tenant_currency_unique").on(
      table.tenantId,
      table.currencyCode,
    ),
  ],
).enableRLS();

export const pricingDefinitions = pgTable(
  "pricing_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    pricingCode: varchar("pricing_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description").notNull(),
    ownerDomain: varchar("owner_domain", { length: 120 }).notNull(),
    pricingType: varchar("pricing_type", { length: 64 }).notNull(),
    lifecycleStatus: varchar("lifecycle_status", { length: 32 }).notNull(),
    currentProfileVersionId: uuid("current_profile_version_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pricing_definitions_tenant_code_unique").on(table.tenantId, table.pricingCode),
    index("pricing_definitions_tenant_status_index").on(table.tenantId, table.lifecycleStatus),
  ],
).enableRLS();

export const pricingProfiles = pgTable(
  "pricing_profiles",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    pricingDefinitionId: uuid("pricing_definition_id").notNull(),
    profileCode: varchar("profile_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    pricingModel: varchar("pricing_model", { length: 64 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    baseAmountMinor: integer("base_amount_minor"),
    minimumAmountMinor: integer("minimum_amount_minor"),
    maximumAmountMinor: integer("maximum_amount_minor"),
    internalCostMinor: integer("internal_cost_minor"),
    components: jsonb("components").notNull(),
    depositPolicy: jsonb("deposit_policy"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pricing_profiles_tenant_code_version_unique").on(
      table.tenantId,
      table.profileCode,
      table.version,
    ),
    index("pricing_profiles_definition_status_index").on(table.pricingDefinitionId, table.status),
  ],
).enableRLS();

export const priceBooks = pgTable(
  "price_books",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    priceBookCode: varchar("price_book_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    marketContext: varchar("market_context", { length: 120 }).notNull(),
    jurisdictionContext: varchar("jurisdiction_context", { length: 120 }),
    audienceContext: varchar("audience_context", { length: 120 }),
    channelContext: varchar("channel_context", { length: 120 }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("price_books_tenant_code_version_unique").on(
      table.tenantId,
      table.priceBookCode,
      table.version,
    ),
  ],
).enableRLS();

export const priceBookEntries = pgTable(
  "price_book_entries",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    priceBookId: uuid("price_book_id").notNull(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    pricingProfileId: uuid("pricing_profile_id").notNull(),
    pricingProfileVersion: integer("pricing_profile_version").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    displayMode: varchar("display_mode", { length: 64 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("price_book_entries_book_service_index").on(
      table.priceBookId,
      table.serviceDefinitionId,
      table.serviceVersionId,
    ),
  ],
).enableRLS();

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    ruleCode: varchar("rule_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    priority: integer("priority").notNull(),
    actionType: varchar("action_type", { length: 64 }).notNull(),
    conditions: jsonb("conditions").notNull(),
    actionConfiguration: jsonb("action_configuration").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pricing_rules_tenant_code_version_unique").on(
      table.tenantId,
      table.ruleCode,
      table.version,
    ),
  ],
).enableRLS();

export const discountDefinitions = pgTable(
  "discount_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    discountCode: varchar("discount_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("discount_definitions_tenant_code_version_unique").on(
      table.tenantId,
      table.discountCode,
      table.version,
    ),
  ],
).enableRLS();

export const promotionDefinitions = pgTable(
  "promotion_definitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    promotionCode: varchar("promotion_code", { length: 64 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    promotionType: varchar("promotion_type", { length: 64 }).notNull(),
    configuration: jsonb("configuration").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotion_definitions_tenant_code_version_unique").on(
      table.tenantId,
      table.promotionCode,
      table.version,
    ),
  ],
).enableRLS();

export const promotionCodes = pgTable(
  "promotion_codes",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    promotionDefinitionId: uuid("promotion_definition_id").notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    displayCode: varchar("display_code", { length: 64 }),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    maximumUses: integer("maximum_uses"),
    maximumUsesPerClient: integer("maximum_uses_per_client"),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("promotion_codes_tenant_hash_unique").on(table.tenantId, table.codeHash)],
).enableRLS();

export const promotionRedemptions = pgTable(
  "promotion_redemptions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    promotionCodeId: uuid("promotion_code_id").notNull(),
    operationId: varchar("operation_id", { length: 160 }).notNull(),
    clientId: uuid("client_id"),
    organizationId: uuid("organization_id"),
    status: varchar("status", { length: 32 }).notNull(),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotion_redemptions_tenant_operation_unique").on(
      table.tenantId,
      table.promotionCodeId,
      table.operationId,
    ),
  ],
).enableRLS();

export const paymentSchedulePolicies = pgTable(
  "payment_schedule_policies",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    policyCode: varchar("policy_code", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    configuration: jsonb("configuration").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payment_schedule_policies_tenant_code_version_unique").on(
      table.tenantId,
      table.policyCode,
      table.version,
    ),
  ],
).enableRLS();

export const commercialPricingSnapshots = pgTable(
  "commercial_pricing_snapshots",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    pricingDefinitionId: uuid("pricing_definition_id").notNull(),
    pricingProfileId: uuid("pricing_profile_id").notNull(),
    pricingProfileVersion: integer("pricing_profile_version").notNull(),
    priceBookId: uuid("price_book_id").notNull(),
    priceBookVersion: integer("price_book_version").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    displayMode: varchar("display_mode", { length: 64 }).notNull(),
    lineItems: jsonb("line_items").notNull(),
    totalAmountMinor: integer("total_amount_minor").notNull(),
    discountTotalMinor: integer("discount_total_minor").notNull(),
    promotionTotalMinor: integer("promotion_total_minor").notNull(),
    depositAmountMinor: integer("deposit_amount_minor").notNull(),
    amountDueNowMinor: integer("amount_due_now_minor").notNull(),
    remainingAmountMinor: integer("remaining_amount_minor").notNull(),
    ruleVersions: jsonb("rule_versions").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull(),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("commercial_pricing_snapshots_tenant_hash_unique").on(
      table.tenantId,
      table.contentHash,
    ),
    index("commercial_pricing_snapshots_service_version_index").on(
      table.serviceDefinitionId,
      table.serviceVersionId,
    ),
  ],
).enableRLS();

export const serviceQuotes = pgTable(
  "service_quotes",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    quoteNumber: varchar("quote_number", { length: 160 }).notNull(),
    clientId: uuid("client_id"),
    organizationId: uuid("organization_id"),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    currentQuoteVersionId: uuid("current_quote_version_id"),
    status: varchar("status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("service_quotes_tenant_number_unique").on(table.tenantId, table.quoteNumber),
  ],
).enableRLS();

export const serviceQuoteVersions = pgTable(
  "service_quote_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    quoteId: uuid("quote_id").notNull(),
    version: integer("version").notNull(),
    pricingSnapshotId: uuid("pricing_snapshot_id").notNull(),
    termsReferences: jsonb("terms_references").notNull(),
    disclosureReferences: jsonb("disclosure_references").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    acceptedBy: uuid("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("service_quote_versions_quote_version_unique").on(table.quoteId, table.version),
  ],
).enableRLS();

export const pricingAuditEvents = pgTable(
  "pricing_audit_events",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    action: varchar("action", { length: 120 }).notNull(),
    resourceType: varchar("resource_type", { length: 120 }).notNull(),
    resourceId: varchar("resource_id", { length: 160 }).notNull(),
    actorType: varchar("actor_type", { length: 64 }).notNull(),
    actorId: varchar("actor_id", { length: 160 }).notNull(),
    correlationId: varchar("correlation_id", { length: 160 }).notNull(),
    payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("pricing_audit_events_tenant_resource_index").on(
      table.tenantId,
      table.resourceType,
      table.resourceId,
    ),
  ],
).enableRLS();

export const pricingOutbox = pgTable(
  "pricing_outbox",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    eventType: varchar("event_type", { length: 120 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 120 }).notNull(),
    aggregateId: varchar("aggregate_id", { length: 160 }).notNull(),
    payload: jsonb("payload").notNull(),
    dispatchState: varchar("dispatch_state", { length: 32 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pricing_outbox_tenant_idempotency_unique").on(
      table.tenantId,
      table.idempotencyKey,
    ),
  ],
).enableRLS();

export const pricingDataQualityFindings = pgTable(
  "pricing_data_quality_findings",
  {
    id: uuid("id").primaryKey(),
    tenantId: varchar("tenant_id", { length: 160 }).notNull(),
    findingType: varchar("finding_type", { length: 120 }).notNull(),
    severity: varchar("severity", { length: 32 }).notNull(),
    pricingResourceType: varchar("pricing_resource_type", { length: 120 }).notNull(),
    pricingResourceId: varchar("pricing_resource_id", { length: 160 }).notNull(),
    blocking: boolean("blocking").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    description: text("description").notNull(),
    sourceReferences: jsonb("source_references").notNull(),
    assignedTo: uuid("assigned_to"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("pricing_data_quality_findings_tenant_status_index").on(table.tenantId, table.status),
  ],
).enableRLS();
