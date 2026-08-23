import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const profileGatewayRole = pgRole("atlas_profile_gateway").existing();
const profileOnly = (name: string) =>
  pgPolicy(`${name}_profile_gateway_only`, {
    as: "permissive",
    for: "all",
    to: profileGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
};

export const profileSelfServiceRoots = pgTable(
  "profile_self_service_roots",
  {
    id: text("id").primaryKey(),
    ownerAccountId: text("owner_account_id").notNull(),
    contextRef: text("context_ref").notNull(),
    authorizationEpoch: varchar("authorization_epoch", { length: 80 }).notNull(),
    policyEpoch: varchar("policy_epoch", { length: 80 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    revision: integer("revision").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("profile_self_service_roots_owner_context_unique").on(
      table.ownerAccountId,
      table.contextRef,
    ),
    check("profile_self_service_roots_locale", sql`${table.locale} in ('es', 'en')`),
    check("profile_self_service_roots_revision", sql`${table.revision} > 0`),
    profileOnly("profile_self_service_roots"),
  ],
).enableRLS();

export const profileSelfServiceGoals = pgTable(
  "profile_self_service_goals",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profileSelfServiceRoots.id, { onDelete: "cascade" }),
    goalCode: varchar("goal_code", { length: 48 }).notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    noticeVersion: varchar("notice_version", { length: 80 }).notNull(),
    assertedAt: timestamp("asserted_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("profile_self_service_goals_profile_idx").on(table.profileId, table.createdAt),
    unique("profile_self_service_goals_profile_code_unique").on(table.profileId, table.goalCode),
    check(
      "profile_self_service_goals_code",
      sql`${table.goalCode} in ('credit_organization','tax_preparation','business_planning','home_buying_preparation','general_support')`,
    ),
    check(
      "profile_self_service_goals_state",
      sql`${table.state} in ('submitted','under_review','accepted','rejected')`,
    ),
    profileOnly("profile_self_service_goals"),
  ],
).enableRLS();

export const profileSelfServiceCorrections = pgTable(
  "profile_self_service_corrections",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => profileSelfServiceRoots.id, { onDelete: "cascade" }),
    submittedBy: text("submitted_by").notNull(),
    expectedRevision: integer("expected_revision").notNull(),
    state: varchar("state", { length: 24 }).notNull(),
    requestedGoalId: text("requested_goal_id").references(() => profileSelfServiceGoals.id, {
      onDelete: "restrict",
    }),
    requestedGoalCode: varchar("requested_goal_code", { length: 48 }),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("profile_self_service_corrections_profile_idx").on(table.profileId, table.createdAt),
    check("profile_self_service_corrections_revision", sql`${table.expectedRevision} > 0`),
    check(
      "profile_self_service_corrections_state",
      sql`${table.state} in ('submitted','under_review','accepted','rejected','partially_accepted')`,
    ),
    check(
      "profile_self_service_corrections_goal_code",
      sql`${table.requestedGoalCode} is null or ${table.requestedGoalCode} in ('credit_organization','tax_preparation','business_planning','home_buying_preparation','general_support')`,
    ),
    profileOnly("profile_self_service_corrections"),
  ],
).enableRLS();
