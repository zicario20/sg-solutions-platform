import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m088UxPrinciplesConfigurations = pgTable("m088_ux_principles_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  visualSystemReference: text("visual_system_reference").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m088UxPrinciples = pgTable("m088_ux_principles", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m088UserJourneys = pgTable("m088_user_journeys", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  stage: text("stage").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m088ExperienceStates = pgTable("m088_experience_states", {
  id: uuid("id").primaryKey(),
  journeyId: uuid("journey_id").notNull(),
  code: text("code").notNull().unique(),
  kind: text("kind").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  stateRendered: boolean("state_rendered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m088InteractionContracts = pgTable("m088_interaction_contracts", {
  id: uuid("id").primaryKey(),
  journeyId: uuid("journey_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  confirmationIsApproval: boolean("confirmation_is_approval").notNull().default(false),
  canonicalAuthorizationDelegated: boolean("canonical_authorization_delegated").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m088UxReviewRequests = pgTable("m088_ux_review_requests", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  researchExecuted: boolean("research_executed").notNull().default(false),
  accessibilityReviewCompleted: boolean("accessibility_review_completed").notNull().default(false),
  productReviewCompleted: boolean("product_review_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
