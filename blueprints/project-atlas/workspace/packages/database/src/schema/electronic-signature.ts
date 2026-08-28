import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const electronicSignatureConfiguration = pgTable("electronic_signature_configuration", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull(),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const signatureProviderProfiles = pgTable("signature_provider_profiles", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  providerCode: text("provider_code").notNull(),
  displayName: text("display_name").notNull(),
  capabilityCodes: jsonb("capability_codes").notNull(),
  status: text("status").notNull(),
  credentialsConfigured: boolean("credentials_configured").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const signatureRequests = pgTable("signature_requests", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  requestCode: text("request_code").notNull(),
  signatureReadyArtifactId: uuid("signature_ready_artifact_id").notNull(),
  frozenArtifactHash: text("frozen_artifact_hash").notNull(),
  providerProfileId: uuid("provider_profile_id").notNull(),
  signerRoleCodes: jsonb("signer_role_codes").notNull(),
  status: text("status").notNull(),
  providerSubmissionStatus: text("provider_submission_status").notNull(),
  providerEnvelopeReference: text("provider_envelope_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const signatureEnvelopes = pgTable("signature_envelopes", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  signatureRequestId: uuid("signature_request_id").notNull(),
  artifactHash: text("artifact_hash").notNull(),
  signerReferences: jsonb("signer_references").notNull(),
  status: text("status").notNull(),
  providerEnvelopeReference: text("provider_envelope_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const signatureSigners = pgTable("signature_signers", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  signatureRequestId: uuid("signature_request_id").notNull(),
  signerRoleCode: text("signer_role_code").notNull(),
  subjectReference: text("subject_reference"),
  authorizationEvidenceReferences: jsonb("authorization_evidence_references").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const signatureEvidenceRecords = pgTable("signature_evidence_records", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  signatureRequestId: uuid("signature_request_id").notNull(),
  signerReference: text("signer_reference"),
  evidenceType: text("evidence_type").notNull(),
  artifactHash: text("artifact_hash").notNull(),
  evidenceReference: text("evidence_reference").notNull(),
  verificationStatus: text("verification_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
