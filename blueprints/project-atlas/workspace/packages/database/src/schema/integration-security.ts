import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const m084IntegrationSecurityConfigurations = pgTable("m084_integration_security_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerConnectionsEnabled: boolean("provider_connections_enabled").notNull().default(false),
  outboundEgressEnabled: boolean("outbound_egress_enabled").notNull().default(false),
  inboundWebhookIngressEnabled: boolean("inbound_webhook_ingress_enabled").notNull().default(false),
  signatureVerificationEnabled: boolean("signature_verification_enabled").notNull().default(false),
  replayProtectionEnabled: boolean("replay_protection_enabled").notNull().default(false),
  requestSigningEnabled: boolean("request_signing_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084IntegrationIdentities = pgTable("m084_integration_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  environment: text("environment").notNull(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084ProviderIdentities = pgTable("m084_provider_identities", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrationId: uuid("integration_id").notNull(),
  providerReference: text("provider_reference").notNull(),
  status: text("status").notNull().default("draft"),
  verified: boolean("verified").notNull().default(false),
  connected: boolean("connected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084IntegrationEndpoints = pgTable("m084_integration_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrationId: uuid("integration_id").notNull(),
  endpointReference: text("endpoint_reference").notNull(),
  direction: text("direction").notNull(),
  status: text("status").notNull().default("draft"),
  allowlisted: boolean("allowlisted").notNull().default(false),
  requestDispatchEnabled: boolean("request_dispatch_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084IntegrationTrustProfiles = pgTable("m084_integration_trust_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrationId: uuid("integration_id").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  active: boolean("active").notNull().default(false),
  providerCapabilitiesVerified: boolean("provider_capabilities_verified").notNull().default(false),
  configuration: jsonb("configuration").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084OutboundIntegrationRequests = pgTable("m084_outbound_integration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  integrationId: uuid("integration_id").notNull(),
  endpointId: uuid("endpoint_id").notNull(),
  status: text("status").notNull().default("deny"),
  sent: boolean("sent").notNull().default(false),
  policyEvaluated: boolean("policy_evaluated").notNull().default(false),
  payloadReleased: boolean("payload_released").notNull().default(false),
  externalOutcomeTrusted: boolean("external_outcome_trusted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084InboundWebhookVerificationResults = pgTable("m084_inbound_webhook_verification_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  integrationId: uuid("integration_id").notNull(),
  status: text("status").notNull().default("rejected"),
  sourceVerified: boolean("source_verified").notNull().default(false),
  signatureVerified: boolean("signature_verified").notNull().default(false),
  replayChecked: boolean("replay_checked").notNull().default(false),
  schemaValidated: boolean("schema_validated").notNull().default(false),
  businessActionDispatched: boolean("business_action_dispatched").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const m084IntegrationSecurityIncidents = pgTable("m084_integration_security_incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicReference: text("public_reference").notNull().unique(),
  integrationId: uuid("integration_id").notNull(),
  status: text("status").notNull().default("draft"),
  containmentExecuted: boolean("containment_executed").notNull().default(false),
  providerDisabled: boolean("provider_disabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
