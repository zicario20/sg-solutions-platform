import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const ragConfig = pgTable("rag_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  embeddingEnabled: boolean("embedding_enabled").notNull().default(false),
  vectorRetrievalEnabled: boolean("vector_retrieval_enabled").notNull().default(false),
  lexicalRetrievalEnabled: boolean("lexical_retrieval_enabled").notNull().default(false),
  contextDeliveryEnabled: boolean("context_delivery_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const ragConsumerBindings = pgTable("rag_consumer_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  consumerReference: text("consumer_reference").notNull(),
  agentManifestReference: text("agent_manifest_reference").notNull(),
  allowedAudiences: jsonb("allowed_audiences").notNull(),
  allowedCorpusCodes: jsonb("allowed_corpus_codes").notNull(),
  sourceDirectRetrievalAllowed: boolean("source_direct_retrieval_allowed").notNull().default(false),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const ragPolicies = pgTable("rag_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  maximumCandidates: text("maximum_candidates").notNull(),
  tokenBudget: text("token_budget").notNull(),
  blockStaleMaterialEvidence: boolean("block_stale_material_evidence").notNull().default(true),
  preserveConflicts: boolean("preserve_conflicts").notNull().default(true),
  status: text("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const ragSessions = pgTable("rag_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  correlationId: text("correlation_id").notNull(),
  consumerBindingId: uuid("consumer_binding_id").notNull(),
  tenantReference: text("tenant_reference").notNull(),
  audience: text("audience").notNull(),
  corpusCode: text("corpus_code").notNull(),
  queryReference: text("query_reference").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  retrievalDispatched: boolean("retrieval_dispatched").notNull().default(false),
  createdAt: createdAt()
});
export const ragCitationPackages = pgTable("rag_citation_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ragSessionId: uuid("rag_session_id").notNull(),
  citationReferences: jsonb("citation_references").notNull(),
  claimSupportStatus: text("claim_support_status").notNull().default("not_answerable"),
  contextDelivered: boolean("context_delivered").notNull().default(false),
  createdAt: createdAt()
});
