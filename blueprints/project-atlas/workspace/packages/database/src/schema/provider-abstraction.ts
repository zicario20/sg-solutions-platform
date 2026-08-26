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
export const providerDefinitions = pgTable(
  "provider_definitions",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull(),
    displayName: varchar("display_name", { length: 256 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    organizationId: text("organization_id"),
    partnerId: text("partner_id"),
    ownershipType: varchar("ownership_type", { length: 32 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("provider_definitions_code_unique").on(table.code)],
);
export const providerInterfaces = pgTable(
  "provider_interfaces",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 96 }).notNull(),
    version: integer("version").notNull(),
    domain: varchar("domain", { length: 64 }).notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("provider_interfaces_code_version_unique").on(table.code, table.version)],
);
export const providerCapabilityDefinitions = pgTable(
  "provider_capability_definitions",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 128 }).notNull(),
    interfaceId: text("interface_id").notNull(),
    requestSchemaId: text("request_schema_id").notNull(),
    responseSchemaId: text("response_schema_id").notNull(),
    status: varchar("status", { length: 24 }).notNull(),
    dataMinimization: jsonb("data_minimization").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("provider_capability_definitions_code_unique").on(table.code)],
);
export const providerCapabilities = pgTable(
  "provider_capabilities",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull(),
    capabilityCode: varchar("capability_code", { length: 128 }).notNull(),
    supportStatus: varchar("support_status", { length: 24 }).notNull(),
    adapterVersion: varchar("adapter_version", { length: 64 }).notNull(),
    constraints: jsonb("constraints").notNull(),
    ...timestamps,
  },
  (table) => [
    index("provider_capabilities_provider_status_idx").on(table.providerId, table.supportStatus),
  ],
);
export const providerSchemas = pgTable("provider_schemas", {
  id: text("id").primaryKey(),
  providerId: text("provider_id"),
  interfaceId: text("interface_id").notNull(),
  schemaType: varchar("schema_type", { length: 32 }).notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  contentHash: varchar("content_hash", { length: 128 }).notNull(),
  compatibility: varchar("compatibility", { length: 32 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  ...timestamps,
});
export const providerAdapters = pgTable("provider_adapters", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  interfaceId: text("interface_id").notNull(),
  adapterCode: varchar("adapter_code", { length: 128 }).notNull(),
  adapterVersion: varchar("adapter_version", { length: 64 }).notNull(),
  runtime: varchar("runtime", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  configurationProfileId: text("configuration_profile_id"),
  ...timestamps,
});
export const providerConfigurations = pgTable("provider_configurations", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  environment: varchar("environment", { length: 16 }).notNull(),
  region: varchar("region", { length: 64 }),
  configuration: jsonb("configuration").notNull(),
  secretReferences: jsonb("secret_references").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  ...timestamps,
});
export const providerEndpoints = pgTable("provider_endpoints", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  environment: varchar("environment", { length: 16 }).notNull(),
  endpointType: varchar("endpoint_type", { length: 24 }).notNull(),
  baseUrl: text("base_url").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps,
});
export const providerRequests = pgTable(
  "provider_requests",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull(),
    capabilityCode: varchar("capability_code", { length: 128 }).notNull(),
    adapterVersion: varchar("adapter_version", { length: 64 }).notNull(),
    environment: varchar("environment", { length: 16 }).notNull(),
    correlationId: varchar("correlation_id", { length: 160 }).notNull(),
    sourceModule: varchar("source_module", { length: 16 }).notNull(),
    sourceResourceId: text("source_resource_id").notNull(),
    requestHash: varchar("request_hash", { length: 128 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    canonicalStatus: varchar("canonical_status", { length: 32 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("provider_requests_idempotency_unique").on(table.idempotencyKey)],
);
export const providerResponses = pgTable("provider_responses", {
  id: text("id").primaryKey(),
  providerRequestId: text("provider_request_id").notNull(),
  providerReference: text("provider_reference"),
  rawStatus: varchar("raw_status", { length: 128 }),
  rawCode: varchar("raw_code", { length: 128 }),
  canonicalStatus: varchar("canonical_status", { length: 32 }).notNull(),
  responseSchemaVersion: varchar("response_schema_version", { length: 64 }).notNull(),
  payloadReference: text("payload_reference"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  ...timestamps,
});
export const providerHealth = pgTable("provider_health", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  capabilityCode: varchar("capability_code", { length: 128 }).notNull(),
  environment: varchar("environment", { length: 16 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  source: varchar("source", { length: 24 }).notNull(),
  ...timestamps,
});
export const providerRoutes = pgTable("provider_routes", {
  id: text("id").primaryKey(),
  capabilityCode: varchar("capability_code", { length: 128 }).notNull(),
  environment: varchar("environment", { length: 16 }).notNull(),
  providerId: text("provider_id").notNull(),
  priority: integer("priority").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  sticky: boolean("sticky").notNull().default(false),
  ...timestamps,
});
export const providerFindings = pgTable("provider_findings", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  blocking: boolean("blocking").notNull().default(false),
  status: varchar("status", { length: 24 }).notNull(),
  ...timestamps,
});
