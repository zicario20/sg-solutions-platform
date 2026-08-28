import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m086InformationArchitectureConfigurations = pgTable("m086_information_architecture_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  routeRegistryActivationEnabled: boolean("route_registry_activation_enabled").notNull().default(false),
  navigationCompositionEnabled: boolean("navigation_composition_enabled").notNull().default(false),
  permissionAwareResolutionEnabled: boolean("permission_aware_resolution_enabled").notNull().default(false),
  aliasRedirectsEnabled: boolean("alias_redirects_enabled").notNull().default(false),
  localeLabelsEnabled: boolean("locale_labels_enabled").notNull().default(false),
  telemetryEnabled: boolean("telemetry_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086InformationSurfaces = pgTable("m086_information_surfaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  surfaceType: text("surface_type").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086RouteNamespaces = pgTable("m086_route_namespaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  surfaceId: uuid("surface_id").notNull(),
  code: text("code").notNull().unique(),
  pathPrefix: text("path_prefix").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086CanonicalRoutes = pgTable("m086_canonical_routes", {
  id: uuid("id").defaultRandom().primaryKey(),
  namespaceId: uuid("namespace_id").notNull(),
  code: text("code").notNull().unique(),
  pathTemplate: text("path_template").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  authorizationEnforced: boolean("authorization_enforced").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086NavigationTrees = pgTable("m086_navigation_trees", {
  id: uuid("id").defaultRandom().primaryKey(),
  surfaceId: uuid("surface_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086NavigationItems = pgTable("m086_navigation_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  treeId: uuid("tree_id").notNull(),
  routeId: uuid("route_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  visible: boolean("visible").notNull().default(false),
  configuration: jsonb("configuration").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086InformationTaxonomies = pgTable("m086_information_taxonomies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086RouteAliases = pgTable("m086_route_aliases", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  sourcePath: text("source_path").notNull(),
  targetRouteId: uuid("target_route_id").notNull(),
  status: text("status").notNull().default("draft"),
  redirectEnabled: boolean("redirect_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m086RouteResolutionResults = pgTable("m086_route_resolution_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestedPath: text("requested_path").notNull(),
  status: text("status").notNull().default("review_required"),
  routeResolved: boolean("route_resolved").notNull().default(false),
  navigationExposed: boolean("navigation_exposed").notNull().default(false),
  redirectPerformed: boolean("redirect_performed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
