import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const sourceManagementConfig = pgTable("source_management_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalAcquisitionEnabled: boolean("external_acquisition_enabled").notNull().default(false),
  connectorExecutionEnabled: boolean("connector_execution_enabled").notNull().default(false),
  snapshotPromotionEnabled: boolean("snapshot_promotion_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const sourceRecords = pgTable("source_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceCode: text("source_code").notNull(),
  displayName: text("display_name").notNull(),
  sourceType: text("source_type").notNull(),
  authorityClass: text("authority_class").notNull(),
  canonicalLocation: text("canonical_location").notNull(),
  accessClassification: text("access_classification").notNull(),
  jurisdictions: jsonb("jurisdictions").notNull(),
  status: text("status").notNull().default("draft"),
  trustStatus: text("trust_status").notNull().default("review_required"),
  approvedForUse: boolean("approved_for_use").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const sourceVersions = pgTable("source_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceRecordId: uuid("source_record_id").notNull(),
  versionCode: text("version_code").notNull(),
  publisherReference: text("publisher_reference").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  applicabilityReference: text("applicability_reference").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const sourceSnapshots = pgTable("source_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceVersionId: uuid("source_version_id").notNull(),
  checksum: text("checksum").notNull(),
  payloadReference: text("payload_reference").notNull(),
  integrityStatus: text("integrity_status").notNull(),
  status: text("status").notNull().default("captured_unverified"),
  immutable: boolean("immutable").notNull().default(true),
  promotedCurrent: boolean("promoted_current").notNull().default(false),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
  createdAt: createdAt()
});
export const sourceCitationSupport = pgTable("source_citation_support", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceSnapshotId: uuid("source_snapshot_id").notNull(),
  claimReference: text("claim_reference").notNull(),
  status: text("status").notNull().default("candidate"),
  supportsCanonicalFact: boolean("supports_canonical_fact").notNull().default(false),
  createdAt: createdAt()
});
