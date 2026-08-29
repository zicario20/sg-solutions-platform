import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m089GlobalSearchConfigurations = pgTable("m089_global_search_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  providerConnected: boolean("provider_connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchSurfaces = pgTable("m089_search_surfaces", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  scope: text("scope").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  authorizationBoundaryRequired: boolean("authorization_boundary_required").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchIndexSets = pgTable("m089_search_index_sets", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  surfaceId: uuid("surface_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  providerConnected: boolean("provider_connected").notNull().default(false),
  rawPiiIndexed: boolean("raw_pii_indexed").notNull().default(false),
  semanticSearchEnabled: boolean("semantic_search_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchableResources = pgTable("m089_searchable_resources", {
  id: uuid("id").primaryKey(),
  indexSetId: uuid("index_set_id").notNull(),
  code: text("code").notNull().unique(),
  projectionReference: text("projection_reference").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  authorizationProjectionRequired: boolean("authorization_projection_required").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchProviders = pgTable("m089_search_providers", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  connected: boolean("connected").notNull().default(false),
  credentialsLoaded: boolean("credentials_loaded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchQueryCandidates = pgTable("m089_search_query_candidates", {
  id: uuid("id").primaryKey(),
  surfaceId: uuid("surface_id").notNull(),
  queryReference: text("query_reference").notNull().unique(),
  status: text("status").notNull(),
  rawQueryStored: boolean("raw_query_stored").notNull().default(false),
  containsSensitiveData: boolean("contains_sensitive_data").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m089SearchIndexRequests = pgTable("m089_search_index_requests", {
  id: uuid("id").primaryKey(),
  indexSetId: uuid("index_set_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  dispatched: boolean("dispatched").notNull().default(false),
  documentsIndexed: text("documents_indexed").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
