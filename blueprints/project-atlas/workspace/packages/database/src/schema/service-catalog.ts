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
} from "drizzle-orm/pg-core";

const catalogTimestamp = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

export const serviceCatalogCategories = pgTable(
  "service_catalog_categories",
  {
    id: uuid("id").primaryKey(),
    code: text("code").notNull(),
    parentCategoryId: uuid("parent_category_id"),
    internalName: text("internal_name").notNull(),
    status: text("status").notNull(),
    publicVisible: boolean("public_visible").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: catalogTimestamp("created_at").notNull(),
    updatedAt: catalogTimestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_categories_code_key").on(table.code),
    index("service_catalog_categories_parent_idx").on(table.parentCategoryId),
  ],
);

export const serviceCatalogDefinitions = pgTable(
  "service_catalog_definitions",
  {
    id: uuid("id").primaryKey(),
    code: text("code").notNull(),
    categoryId: uuid("category_id").notNull(),
    serviceType: text("service_type").notNull(),
    lifecycleStatus: text("lifecycle_status").notNull(),
    primaryDomain: text("primary_domain").notNull(),
    fulfillmentMode: text("fulfillment_mode").notNull(),
    publicVisible: boolean("public_visible").notNull().default(false),
    currentVersionId: uuid("current_version_id"),
    createdAt: catalogTimestamp("created_at").notNull(),
    updatedAt: catalogTimestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_definitions_code_key").on(table.code),
    index("service_catalog_definitions_category_idx").on(table.categoryId),
    index("service_catalog_definitions_status_idx").on(table.lifecycleStatus),
  ],
);

export const serviceCatalogVersions = pgTable(
  "service_catalog_versions",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    version: text("version").notNull(),
    publicationStatus: text("publication_status").notNull(),
    configurationSnapshot: jsonb("configuration_snapshot").notNull(),
    configurationHash: text("configuration_hash").notNull(),
    effectiveFrom: catalogTimestamp("effective_from").notNull(),
    effectiveTo: catalogTimestamp("effective_to"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_versions_definition_version_key").on(
      table.serviceDefinitionId,
      table.version,
    ),
    index("service_catalog_versions_definition_idx").on(table.serviceDefinitionId),
    index("service_catalog_versions_publication_idx").on(table.publicationStatus),
  ],
);

export const serviceCatalogTranslations = pgTable(
  "service_catalog_translations",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    locale: text("locale").notNull(),
    status: text("status").notNull(),
    content: jsonb("content").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_translations_version_locale_key").on(table.serviceVersionId, table.locale),
    index("service_catalog_translations_locale_idx").on(table.locale),
  ],
);

export const serviceCatalogAvailabilityRules = pgTable(
  "service_catalog_availability_rules",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    status: text("status").notNull(),
    jurisdictions: jsonb("jurisdictions").notNull(),
    excludedJurisdictions: jsonb("excluded_jurisdictions").notNull(),
    capacityReference: text("capacity_reference"),
    effectiveFrom: catalogTimestamp("effective_from").notNull(),
    effectiveTo: catalogTimestamp("effective_to"),
    lastVerifiedAt: catalogTimestamp("last_verified_at"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_availability_definition_idx").on(table.serviceDefinitionId)],
);

export const serviceCatalogCommercialProfiles = pgTable(
  "service_catalog_commercial_profiles",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    billingMode: text("billing_mode").notNull(),
    pricingReference: text("pricing_reference"),
    depositPolicyReference: text("deposit_policy_reference"),
    paymentScheduleReference: text("payment_schedule_reference"),
    cancellationPolicyReference: text("cancellation_policy_reference"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_commercial_profiles_version_key").on(table.serviceVersionId),
    index("service_catalog_commercial_profiles_billing_idx").on(table.billingMode),
  ],
);

export const serviceCatalogDocumentRequirementSets = pgTable(
  "service_catalog_document_requirement_sets",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    code: text("code").notNull(),
    version: text("version").notNull(),
    status: text("status").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_document_sets_version_key").on(table.serviceVersionId),
    uniqueIndex("service_catalog_document_sets_code_version_key").on(table.code, table.version),
  ],
);

export const serviceCatalogDocumentRequirements = pgTable(
  "service_catalog_document_requirements",
  {
    id: uuid("id").primaryKey(),
    requirementSetId: uuid("requirement_set_id").notNull(),
    code: text("code").notNull(),
    requirementLevel: text("requirement_level").notNull(),
    requiredStage: text("required_stage").notNull(),
    conditionRule: jsonb("condition_rule"),
    dataClassification: text("data_classification").notNull(),
    alternativeGroup: text("alternative_group"),
    instructions: text("instructions").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_document_requirements_set_code_key").on(table.requirementSetId, table.code),
    index("service_catalog_document_requirements_set_idx").on(table.requirementSetId),
  ],
);

export const serviceCatalogDurationProfiles = pgTable(
  "service_catalog_duration_profiles",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    durationType: text("duration_type").notNull(),
    durationUnit: text("duration_unit").notNull(),
    minimum: integer("minimum"),
    maximum: integer("maximum"),
    confidence: text("confidence").notNull(),
    sourceReference: text("source_reference"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [uniqueIndex("service_catalog_duration_profiles_version_key").on(table.serviceVersionId)],
);

export const serviceCatalogDisclosureSets = pgTable(
  "service_catalog_disclosure_sets",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    code: text("code").notNull(),
    version: text("version").notNull(),
    items: jsonb("items").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_disclosure_sets_version_key").on(table.serviceVersionId),
    uniqueIndex("service_catalog_disclosure_sets_code_version_key").on(table.code, table.version),
  ],
);

export const serviceCatalogIntakeDefinitions = pgTable(
  "service_catalog_intake_definitions",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    definitionReference: text("definition_reference").notNull(),
    version: text("version").notNull(),
    intakeMode: text("intake_mode").notNull(),
    requiresAuthentication: boolean("requires_authentication").notNull(),
    dataClasses: jsonb("data_classes").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [uniqueIndex("service_catalog_intake_definitions_version_key").on(table.serviceVersionId)],
);

export const serviceCatalogWorkflowBindings = pgTable(
  "service_catalog_workflow_bindings",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    workflowCode: text("workflow_code").notNull(),
    startTrigger: text("start_trigger").notNull(),
    requiresPaymentConfirmation: boolean("requires_payment_confirmation").notNull(),
    requiresHumanAuthorization: boolean("requires_human_authorization").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [uniqueIndex("service_catalog_workflow_bindings_version_key").on(table.serviceVersionId)],
);

export const serviceCatalogPublications = pgTable(
  "service_catalog_publications",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    channel: text("channel").notNull(),
    status: text("status").notNull(),
    scheduledFor: catalogTimestamp("scheduled_for"),
    publishedAt: catalogTimestamp("published_at"),
    unpublishedAt: catalogTimestamp("unpublished_at"),
    approvedByReference: text("approved_by_reference"),
    rollbackVersionId: uuid("rollback_version_id"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    index("service_catalog_publications_version_idx").on(table.serviceVersionId),
    index("service_catalog_publications_channel_status_idx").on(table.channel, table.status),
  ],
);

export const serviceCatalogDiscoveryDocuments = pgTable(
  "service_catalog_discovery_documents",
  {
    id: uuid("id").primaryKey(),
    serviceVersionId: uuid("service_version_id").notNull(),
    locale: text("locale").notNull(),
    canonicalPath: text("canonical_path").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    availabilityStatus: text("availability_status").notNull(),
    indexedAt: catalogTimestamp("indexed_at").notNull(),
    invalidatedAt: catalogTimestamp("invalidated_at"),
  },
  (table) => [
    uniqueIndex("service_catalog_discovery_documents_path_locale_key").on(table.canonicalPath, table.locale),
    index("service_catalog_discovery_documents_version_idx").on(table.serviceVersionId),
  ],
);

export const serviceCatalogRelationships = pgTable(
  "service_catalog_relationships",
  {
    id: uuid("id").primaryKey(),
    sourceServiceDefinitionId: uuid("source_service_definition_id").notNull(),
    targetServiceDefinitionId: uuid("target_service_definition_id").notNull(),
    relationshipType: text("relationship_type").notNull(),
    ruleReference: text("rule_reference"),
    status: text("status").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_relationships_unique_key").on(
      table.sourceServiceDefinitionId,
      table.targetServiceDefinitionId,
      table.relationshipType,
    ),
    index("service_catalog_relationships_source_idx").on(table.sourceServiceDefinitionId),
  ],
);

export const serviceCatalogBundles = pgTable(
  "service_catalog_bundles",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    serviceVersionId: uuid("service_version_id").notNull(),
    bundleType: text("bundle_type").notNull(),
    status: text("status").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_bundles_version_key").on(table.serviceVersionId),
    index("service_catalog_bundles_definition_idx").on(table.serviceDefinitionId),
  ],
);

export const serviceCatalogBundleComponents = pgTable(
  "service_catalog_bundle_components",
  {
    id: uuid("id").primaryKey(),
    bundleId: uuid("bundle_id").notNull(),
    componentServiceDefinitionId: uuid("component_service_definition_id").notNull(),
    componentVersionId: uuid("component_version_id"),
    required: boolean("required").notNull(),
    removable: boolean("removable").notNull(),
    quantity: integer("quantity").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_bundle_components_bundle_idx").on(table.bundleId)],
);

export const serviceCatalogChangeRequests = pgTable(
  "service_catalog_change_requests",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    fromVersionId: uuid("from_version_id"),
    proposedVersionId: uuid("proposed_version_id").notNull(),
    classification: text("classification").notNull(),
    status: text("status").notNull(),
    requestedByReference: text("requested_by_reference").notNull(),
    approvedByReference: text("approved_by_reference"),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [
    index("service_catalog_change_requests_definition_idx").on(table.serviceDefinitionId),
    index("service_catalog_change_requests_status_idx").on(table.status),
  ],
);

export const serviceCatalogGovernanceRecords = pgTable(
  "service_catalog_governance_records",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    action: text("action").notNull(),
    actorType: text("actor_type").notNull(),
    reason: text("reason").notNull(),
    correlationId: text("correlation_id").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
  },
  (table) => [index("service_catalog_governance_records_definition_idx").on(table.serviceDefinitionId)],
);

export const serviceCatalogDataQualityFindings = pgTable(
  "service_catalog_data_quality_findings",
  {
    id: uuid("id").primaryKey(),
    serviceDefinitionId: uuid("service_definition_id").notNull(),
    versionId: uuid("version_id"),
    findingType: text("finding_type").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull(),
    evidenceReference: text("evidence_reference").notNull(),
    createdAt: catalogTimestamp("created_at").notNull(),
    resolvedAt: catalogTimestamp("resolved_at"),
  },
  (table) => [
    index("service_catalog_data_quality_findings_definition_idx").on(table.serviceDefinitionId),
    index("service_catalog_data_quality_findings_status_idx").on(table.status),
  ],
);

export const serviceCatalogMigrationRecords = pgTable(
  "service_catalog_migration_records",
  {
    id: uuid("id").primaryKey(),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference").notNull(),
    status: text("status").notNull(),
    checksum: text("checksum").notNull(),
    approvedByReference: text("approved_by_reference"),
    createdAt: catalogTimestamp("created_at").notNull(),
    completedAt: catalogTimestamp("completed_at"),
  },
  (table) => [uniqueIndex("service_catalog_migration_records_source_key").on(table.sourceType, table.sourceReference)],
);
