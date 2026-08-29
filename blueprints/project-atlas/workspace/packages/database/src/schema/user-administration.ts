import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m091UserAdministrationConfigurations = pgTable("m091_user_administration_configurations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  iamOwner: text("iam_owner").notNull(),
  authorizationOwner: text("authorization_owner").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserAdministrationRecords = pgTable("m091_user_administration_records", {
  id: uuid("id").primaryKey(),
  configurationId: uuid("configuration_id").notNull(),
  userReference: text("user_reference").notNull().unique(),
  userType: text("user_type").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  defaultRoleAssigned: boolean("default_role_assigned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserWorkspaceMemberships = pgTable("m091_user_workspace_memberships", {
  id: uuid("id").primaryKey(),
  userRecordId: uuid("user_record_id").notNull(),
  code: text("code").notNull().unique(),
  workspaceReference: text("workspace_reference").notNull(),
  membershipType: text("membership_type").notNull(),
  status: text("status").notNull(),
  active: boolean("active").notNull().default(false),
  roleGrantApplied: boolean("role_grant_applied").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserInvitations = pgTable("m091_user_invitations", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  targetContactReference: text("target_contact_reference").notNull(),
  intendedUserType: text("intended_user_type").notNull(),
  workspaceReference: text("workspace_reference").notNull(),
  tokenReference: text("token_reference").notNull(),
  status: text("status").notNull(),
  sent: boolean("sent").notNull().default(false),
  accepted: boolean("accepted").notNull().default(false),
  accessReady: boolean("access_ready").notNull().default(false),
  rawTokenStored: boolean("raw_token_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserProvisioningRequests = pgTable("m091_user_provisioning_requests", {
  id: uuid("id").primaryKey(),
  userRecordId: uuid("user_record_id").notNull(),
  code: text("code").notNull().unique(),
  workspaceReference: text("workspace_reference").notNull(),
  status: text("status").notNull(),
  processed: boolean("processed").notNull().default(false),
  accessGranted: boolean("access_granted").notNull().default(false),
  iamOperationRequested: boolean("iam_operation_requested").notNull().default(false),
  authorizationOperationRequested: boolean("authorization_operation_requested").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserRoleAssignmentRequests = pgTable("m091_user_role_assignment_requests", {
  id: uuid("id").primaryKey(),
  userRecordId: uuid("user_record_id").notNull(),
  code: text("code").notNull().unique(),
  workspaceReference: text("workspace_reference").notNull(),
  roleTemplateReference: text("role_template_reference").notNull(),
  scopeReference: text("scope_reference").notNull(),
  status: text("status").notNull(),
  grantApplied: boolean("grant_applied").notNull().default(false),
  authorizationOwner: text("authorization_owner").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091UserSuspensionRequests = pgTable("m091_user_suspension_requests", {
  id: uuid("id").primaryKey(),
  userRecordId: uuid("user_record_id").notNull(),
  code: text("code").notNull().unique(),
  sessionHandling: text("session_handling").notNull(),
  status: text("status").notNull(),
  suspended: boolean("suspended").notNull().default(false),
  historyDeleted: boolean("history_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091MfaResetRequests = pgTable("m091_mfa_reset_requests", {
  id: uuid("id").primaryKey(),
  userRecordId: uuid("user_record_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull(),
  resetPerformed: boolean("reset_performed").notNull().default(false),
  accessGranted: boolean("access_granted").notNull().default(false),
  rawAuthenticatorMaterialStored: boolean("raw_authenticator_material_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const m091ImpersonationRequests = pgTable("m091_impersonation_requests", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),
  targetUserReference: text("target_user_reference").notNull(),
  status: text("status").notNull(),
  sessionStarted: boolean("session_started").notNull().default(false),
  unrestricted: boolean("unrestricted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
