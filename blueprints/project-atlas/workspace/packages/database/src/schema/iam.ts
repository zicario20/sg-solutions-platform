import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m080IamConfigurations = pgTable("m080_iam_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountProvisioningEnabled: boolean("account_provisioning_enabled").notNull().default(false),
  passwordAuthenticationEnabled: boolean("password_authentication_enabled").notNull().default(false),
  passwordlessAuthenticationEnabled: boolean("passwordless_authentication_enabled").notNull().default(false),
  mfaVerificationEnabled: boolean("mfa_verification_enabled").notNull().default(false),
  sessionIssuanceEnabled: boolean("session_issuance_enabled").notNull().default(false),
  tokenValidationEnabled: boolean("token_validation_enabled").notNull().default(false),
  serviceIdentityActivationEnabled: boolean("service_identity_activation_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080IamPrincipals = pgTable("m080_iam_principals", {
  id: uuid("id").defaultRandom().primaryKey(),
  principalReference: text("principal_reference").notNull().unique(),
  principalType: text("principal_type").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080HumanIdentities = pgTable("m080_human_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  principalId: uuid("principal_id").notNull(),
  identityReference: text("identity_reference").notNull().unique(),
  status: text("status").notNull().default("unverified"),
  identityAssurance: text("identity_assurance").notNull().default("unknown"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080UserAccounts = pgTable("m080_user_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  principalId: uuid("principal_id").notNull(),
  accountReference: text("account_reference").notNull().unique(),
  status: text("status").notNull().default("provisioning_disabled"),
  active: boolean("active").notNull().default(false),
  authorizationGranted: boolean("authorization_granted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080LoginIdentifiers = pgTable("m080_login_identifiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  identifierReference: text("identifier_reference").notNull().unique(),
  verified: boolean("verified").notNull().default(false),
  rawIdentifierStored: boolean("raw_identifier_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080Authenticators = pgTable("m080_authenticators", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  authenticatorReference: text("authenticator_reference").notNull().unique(),
  authenticatorType: text("authenticator_type").notNull(),
  status: text("status").notNull().default("not_enrolled_runtime_disabled"),
  credentialMaterialStored: boolean("credential_material_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080AuthenticationAttempts = pgTable("m080_authentication_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  accountId: uuid("account_id").notNull(),
  status: text("status").notNull().default("received_runtime_disabled"),
  secretMaterialAccepted: boolean("secret_material_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080AuthenticationResults = pgTable("m080_authentication_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  authenticated: boolean("authenticated").notNull().default(false),
  mfaSatisfied: boolean("mfa_satisfied").notNull().default(false),
  sessionIssued: boolean("session_issued").notNull().default(false),
  tokenIssued: boolean("token_issued").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080SessionCandidates = pgTable("m080_session_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull(),
  sessionReference: text("session_reference").notNull().unique(),
  status: text("status").notNull().default("not_issued_runtime_disabled"),
  active: boolean("active").notNull().default(false),
  tokenStored: boolean("token_stored").notNull().default(false),
  deviceContext: jsonb("device_context").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080ServiceIdentities = pgTable("m080_service_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  principalId: uuid("principal_id").notNull(),
  serviceIdentityReference: text("service_identity_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  credentialIssued: boolean("credential_issued").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m080DelegatedAccessRequests = pgTable("m080_delegated_access_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  delegatorReference: text("delegator_reference").notNull(),
  delegateReference: text("delegate_reference").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  impersonationEnabled: boolean("impersonation_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
