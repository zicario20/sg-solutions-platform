import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const complianceReviewerConfig = pgTable("compliance_reviewer_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceLookupEnabled: boolean("source_lookup_enabled").notNull().default(false),
  policyEvaluationExecutionEnabled: boolean("policy_evaluation_execution_enabled").notNull().default(false),
  semanticReviewEnabled: boolean("semantic_review_enabled").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const complianceReviewSessions = pgTable("compliance_review_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  correlationId: text("correlation_id").notNull(),
  reviewKind: text("review_kind").notNull(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  actorReference: text("actor_reference").notNull(),
  sourceReferences: jsonb("source_references").notNull(),
  status: text("status").notNull().default("opened"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});
export const complianceControlAssessments = pgTable("compliance_control_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  controlCode: text("control_code").notNull(),
  status: text("status").notNull(),
  reasonCode: text("reason_code").notNull(),
  sourceFreshness: text("source_freshness").notNull(),
  externalActionAuthorized: boolean("external_action_authorized").notNull().default(false),
  createdAt: createdAt()
});
export const complianceReviewerAuditEvents = pgTable("compliance_reviewer_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id"),
  eventType: text("event_type").notNull(),
  correlationId: text("correlation_id").notNull(),
  payloadReference: text("payload_reference").notNull(),
  createdAt: createdAt()
});
