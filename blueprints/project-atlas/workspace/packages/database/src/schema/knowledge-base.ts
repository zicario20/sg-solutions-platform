import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const knowledgeBaseConfig = pgTable("knowledge_base_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceIngestionEnabled: boolean("source_ingestion_enabled").notNull().default(false),
  publicationEnabled: boolean("publication_enabled").notNull().default(false),
  projectionDeliveryEnabled: boolean("projection_delivery_enabled").notNull().default(false),
  retrievalEnabled: boolean("retrieval_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const knowledgeCurationSessions = pgTable("knowledge_curation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  correlationId: text("correlation_id").notNull(),
  ownerModule: text("owner_module").notNull(),
  purpose: text("purpose").notNull(),
  actorReference: text("actor_reference").notNull(),
  status: text("status").notNull().default("opened"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  ownerModule: text("owner_module").notNull(),
  knowledgeType: text("knowledge_type").notNull(),
  sensitivity: text("sensitivity").notNull(),
  supportedLocales: jsonb("supported_locales").notNull(),
  status: text("status").notNull().default("draft"),
  currentPublishedVersionId: uuid("current_published_version_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const knowledgeVersions = pgTable("knowledge_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeItemId: uuid("knowledge_item_id").notNull(),
  version: text("version").notNull(),
  locale: text("locale").notNull(),
  contentReference: text("content_reference").notNull(),
  contentDigest: text("content_digest").notNull(),
  sourceReferences: jsonb("source_references").notNull(),
  applicabilityReferences: jsonb("applicability_references").notNull(),
  status: text("status").notNull().default("draft"),
  published: boolean("published").notNull().default(false),
  immutableWhenPublished: boolean("immutable_when_published").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const knowledgeAccessProjections = pgTable("knowledge_access_projections", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeVersionId: uuid("knowledge_version_id").notNull(),
  audience: text("audience").notNull(),
  projectionReference: text("projection_reference").notNull(),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const knowledgePublicationReviews = pgTable("knowledge_publication_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeVersionId: uuid("knowledge_version_id").notNull(),
  sourceFreshness: text("source_freshness").notNull(),
  requiredHumanApprovals: jsonb("required_human_approvals").notNull(),
  status: text("status").notNull().default("review_required"),
  publicationAuthorized: boolean("publication_authorized").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
