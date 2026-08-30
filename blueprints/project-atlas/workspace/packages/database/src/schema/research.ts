import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const researchRecords = pgTable("research_records", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), domain: text("domain").notNull(), title: text("title").notNull(), summary: text("summary").notNull(), ownerReference: text("owner_reference").notNull(), sourceReferences: text("source_references").notNull(), controlReferences: text("control_references").notNull(), status: text("status").notNull(), version: integer("version").notNull().default(1), sourceAuthorityChanged: boolean("source_authority_changed").notNull().default(false), changeApplied: boolean("change_applied").notNull().default(false), activated: boolean("activated").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("research_records_code_unique").on(table.code), index("research_records_status_idx").on(table.status)]);

export const researchEvidenceLinks = pgTable("research_evidence_links", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), recordCode: text("record_code").notNull(), reference: text("reference").notNull(), kind: text("kind").notNull(), verificationStatus: text("verification_status").notNull(), fetchExecuted: boolean("fetch_executed").notNull().default(false), acceptedAsFact: boolean("accepted_as_fact").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("research_evidence_links_code_unique").on(table.code), index("research_evidence_links_record_idx").on(table.recordCode)]);

export const researchReviewRequests = pgTable("research_review_requests", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), recordCode: text("record_code").notNull(), reviewerReference: text("reviewer_reference").notNull(), reviewKind: text("review_kind").notNull(), status: text("status").notNull(), assigned: boolean("assigned").notNull().default(false), completed: boolean("completed").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("research_review_requests_code_unique").on(table.code), index("research_review_requests_record_idx").on(table.recordCode)]);

export const researchActionRequests = pgTable("research_action_requests", {
  id: uuid("id").defaultRandom().primaryKey(), code: text("code").notNull(), recordCode: text("record_code").notNull(), action: text("action").notNull(), destinationReference: text("destination_reference").notNull(), preconditionReferences: text("precondition_references").notNull(), status: text("status").notNull(), executed: boolean("executed").notNull().default(false), outcomeKnown: boolean("outcome_known").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("research_action_requests_code_unique").on(table.code), index("research_action_requests_record_idx").on(table.recordCode)]);
