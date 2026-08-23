import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
export const appointmentGatewayRole = pgRole("atlas_appointment_gateway").existing();
const serverOnly = (name: string) =>
  pgPolicy(`${name}_server_gateway_only`, {
    as: "permissive",
    for: "all",
    to: appointmentGatewayRole,
    using: sql`true`,
    withCheck: sql`true`,
  });
export const appointmentTypes = pgTable(
  "appointment_types",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 64 }).notNull().unique(),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull(),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull(),
    minimumNoticeMinutes: integer("minimum_notice_minutes").notNull(),
    maximumAdvanceDays: integer("maximum_advance_days").notNull(),
    requiresAuthentication: boolean("requires_authentication").notNull(),
    active: boolean("active").notNull(),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    check(
      "appointment_types_positive",
      sql`${t.durationMinutes}>0 and ${t.bufferBeforeMinutes}>=0 and ${t.bufferAfterMinutes}>=0 and ${t.minimumNoticeMinutes}>=0 and ${t.maximumAdvanceDays}>0 and ${t.version}>0`,
    ),
    serverOnly("appointment_types"),
  ],
).enableRLS();
export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    typeId: text("type_id")
      .notNull()
      .references(() => appointmentTypes.id, { onDelete: "restrict" }),
    ownerAccountId: text("owner_account_id").notNull(),
    contextRef: text("context_ref").notNull(),
    authorizationEpoch: integer("authorization_epoch").notNull(),
    policyEpoch: integer("policy_epoch").notNull(),
    assigneeRef: text("assignee_ref").notNull(),
    startAtUtc: timestamp("start_at_utc", { withTimezone: true, mode: "date" }).notNull(),
    endAtUtc: timestamp("end_at_utc", { withTimezone: true, mode: "date" }).notNull(),
    clientTimeZone: varchar("client_time_zone", { length: 64 }).notNull(),
    staffTimeZone: varchar("staff_time_zone", { length: 64 }).notNull(),
    modality: varchar("modality", { length: 24 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("appointments_owner_context_start_idx").on(t.ownerAccountId, t.contextRef, t.startAtUtc),
    index("appointments_assignee_start_idx").on(t.assigneeRef, t.startAtUtc),
    check("appointments_interval_valid", sql`${t.endAtUtc}>${t.startAtUtc}`),
    check(
      "appointments_status_valid",
      sql`${t.status} in ('requested','pending_confirmation','confirmed','cancelled_by_client','cancelled_by_staff','concluded')`,
    ),
    serverOnly("appointments"),
  ],
).enableRLS();
export const appointmentHolds = pgTable(
  "appointment_holds",
  {
    id: text("id").primaryKey(),
    typeId: text("type_id")
      .notNull()
      .references(() => appointmentTypes.id, { onDelete: "restrict" }),
    ownerAccountId: text("owner_account_id").notNull(),
    contextRef: text("context_ref").notNull(),
    assigneeRef: text("assignee_ref").notNull(),
    startAtUtc: timestamp("start_at_utc", { withTimezone: true, mode: "date" }).notNull(),
    endAtUtc: timestamp("end_at_utc", { withTimezone: true, mode: "date" }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    state: varchar("state", { length: 16 }).notNull(),
    inputDigest: varchar("input_digest", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("appointment_holds_assignee_expiry_idx").on(t.assigneeRef, t.expiresAt),
    check(
      "appointment_holds_interval_valid",
      sql`${t.endAtUtc}>${t.startAtUtc} and ${t.expiresAt}>${t.createdAt}`,
    ),
    check(
      "appointment_holds_state_valid",
      sql`${t.state} in ('active','consumed','released','expired')`,
    ),
    serverOnly("appointment_holds"),
  ],
).enableRLS();
export const appointmentAuditEvents = pgTable(
  "appointment_audit_events",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "restrict" }),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    actorAccountId: text("actor_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [
    index("appointment_audit_events_appointment_created_idx").on(t.appointmentId, t.createdAt),
    serverOnly("appointment_audit_events"),
  ],
).enableRLS();
