import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const documentProcessingConfig = pgTable("document_processing_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileBytesReadEnabled: boolean("file_bytes_read_enabled").notNull().default(false),
  nativeParsingEnabled: boolean("native_parsing_enabled").notNull().default(false),
  ocrEnabled: boolean("ocr_enabled").notNull().default(false),
  jobDispatchEnabled: boolean("job_dispatch_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const fileArtifacts = pgTable("file_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactCode: text("artifact_code").notNull(),
  tenantReference: text("tenant_reference").notNull(),
  originalReference: text("original_reference").notNull(),
  reportedMime: text("reported_mime").notNull(),
  detectedMime: text("detected_mime").notNull(),
  checksum: text("checksum").notNull(),
  byteLength: text("byte_length").notNull(),
  classification: text("classification").notNull(),
  status: text("status").notNull().default("received"),
  originalImmutable: boolean("original_immutable").notNull().default(true),
  safeForConsumption: boolean("safe_for_consumption").notNull().default(false),
  createdAt: createdAt()
});
export const logicalDocuments = pgTable("logical_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileArtifactId: uuid("file_artifact_id").notNull(),
  semanticType: text("semantic_type").notNull().default("unknown"),
  status: text("status").notNull().default("technical_boundary_only"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const derivativeArtifacts = pgTable("derivative_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalArtifactId: uuid("original_artifact_id").notNull(),
  derivativeType: text("derivative_type").notNull(),
  recipeReference: text("recipe_reference").notNull(),
  lineage: jsonb("lineage").notNull(),
  status: text("status").notNull().default("candidate"),
  replacesOriginal: boolean("replaces_original").notNull().default(false),
  safeForDelivery: boolean("safe_for_delivery").notNull().default(false),
  createdAt: createdAt()
});
export const processingRequests = pgTable("processing_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileArtifactId: uuid("file_artifact_id").notNull(),
  purpose: text("purpose").notNull(),
  recipeReference: text("recipe_reference").notNull(),
  status: text("status").notNull().default("queued_disabled"),
  dispatched: boolean("dispatched").notNull().default(false),
  createdAt: createdAt()
});
