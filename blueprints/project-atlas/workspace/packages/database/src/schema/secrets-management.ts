import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m083SecretsConfigurations = pgTable("m083_secrets_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerBindingEnabled: boolean("provider_binding_enabled").notNull().default(false),
  secretRetrievalEnabled: boolean("secret_retrieval_enabled").notNull().default(false),
  secretInjectionEnabled: boolean("secret_injection_enabled").notNull().default(false),
  leaseIssuanceEnabled: boolean("lease_issuance_enabled").notNull().default(false),
  rotationExecutionEnabled: boolean("rotation_execution_enabled").notNull().default(false),
  revocationExecutionEnabled: boolean("revocation_execution_enabled").notNull().default(false),
  scanningEnabled: boolean("scanning_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretIdentities = pgTable("m083_secret_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  secretType: text("secret_type").notNull(),
  environment: text("environment").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretProviderReferences = pgTable("m083_secret_provider_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  providerReference: text("provider_reference").notNull(),
  status: text("status").notNull().default("draft"),
  bound: boolean("bound").notNull().default(false),
  connectionEstablished: boolean("connection_established").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretVersionReferences = pgTable("m083_secret_version_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  versionReference: text("version_reference").notNull(),
  fingerprintReference: text("fingerprint_reference"),
  status: text("status").notNull().default("draft"),
  rawSecretStored: boolean("raw_secret_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretConsumerBindings = pgTable("m083_secret_consumer_bindings", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  consumerReference: text("consumer_reference").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  valueVisibleToConsumer: boolean("value_visible_to_consumer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretRetrievalRequests = pgTable("m083_secret_retrieval_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  requesterType: text("requester_type").notNull(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  valueReturned: boolean("value_returned").notNull().default(false),
  injectionPerformed: boolean("injection_performed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretLeaseRequests = pgTable("m083_secret_lease_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("blocked_runtime_disabled"),
  leaseIssued: boolean("lease_issued").notNull().default(false),
  dynamicCredentialIssued: boolean("dynamic_credential_issued").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretRotationRequests = pgTable("m083_secret_rotation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  rotationExecuted: boolean("rotation_executed").notNull().default(false),
  oldVersionRevoked: boolean("old_version_revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretRevocationRequests = pgTable("m083_secret_revocation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  secretIdentityId: uuid("secret_identity_id").notNull(),
  publicReference: text("public_reference").notNull().unique(),
  status: text("status").notNull().default("draft"),
  revocationExecuted: boolean("revocation_executed").notNull().default(false),
  auditHistoryErased: boolean("audit_history_erased").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m083SecretScanFindings = pgTable("m083_secret_scan_findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  repositoryReference: text("repository_reference").notNull(),
  fingerprintReference: text("fingerprint_reference"),
  status: text("status").notNull().default("draft"),
  rawSecretStored: boolean("raw_secret_stored").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
