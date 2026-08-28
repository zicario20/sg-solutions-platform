import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documentGenerationConfiguration = pgTable("document_generation_configuration", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  runtimeEnabled: boolean("runtime_enabled").notNull(),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  templateCode: text("template_code").notNull(),
  displayName: text("display_name").notNull(),
  templateType: text("template_type").notNull(),
  ownerReference: text("owner_reference").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const documentTemplateVersions = pgTable("document_template_versions", {
  id: uuid("id").primaryKey(),
  templateId: uuid("template_id").notNull(),
  version: text("version").notNull(),
  contentFormat: text("content_format").notNull(),
  contentHash: text("content_hash").notNull(),
  componentVersionReferences: jsonb("component_version_references").notNull(),
  variableCodes: jsonb("variable_codes").notNull(),
  status: text("status").notNull(),
  immutable: boolean("immutable").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const documentBindingSnapshots = pgTable("document_binding_snapshots", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  templateVersionId: uuid("template_version_id").notNull(),
  subjectReferences: jsonb("subject_references").notNull(),
  variableStates: jsonb("variable_states").notNull(),
  missingRequiredVariableCodes: jsonb("missing_required_variable_codes").notNull(),
  status: text("status").notNull(),
  immutable: boolean("immutable").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const documentRenderRequests = pgTable("document_render_requests", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  templateVersionId: uuid("template_version_id").notNull(),
  bindingSnapshotId: uuid("binding_snapshot_id").notNull(),
  purpose: text("purpose").notNull(),
  eligibility: jsonb("eligibility").notNull(),
  status: text("status").notNull(),
  dispatched: boolean("dispatched").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const generatedDocumentArtifacts = pgTable("generated_document_artifacts", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  renderRequestId: uuid("render_request_id").notNull(),
  templateVersionId: uuid("template_version_id").notNull(),
  bindingSnapshotId: uuid("binding_snapshot_id").notNull(),
  requestedFormat: text("requested_format").notNull(),
  status: text("status").notNull(),
  artifactHash: text("artifact_hash"),
  immutableWhenFinal: boolean("immutable_when_final").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
