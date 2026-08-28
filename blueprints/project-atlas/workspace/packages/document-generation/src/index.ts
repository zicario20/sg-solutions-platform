export const DOCUMENT_GENERATION_MODULE = "M066";

export type DocumentRenderPurpose = "preview" | "final" | "signature_ready";

export interface DocumentGenerationActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly string[];
  purpose?: string;
}

export interface DocumentGenerationRuntimePolicy {
  templatePublication: false;
  rendererExecution: false;
  remoteAssetLoading: false;
  sourceContentRefresh: false;
  aiDrafting: false;
  backgroundJobs: false;
  signatureHandoff: false;
}

export const DOCUMENT_GENERATION_RUNTIME_POLICY: DocumentGenerationRuntimePolicy = {
  templatePublication: false,
  rendererExecution: false,
  remoteAssetLoading: false,
  sourceContentRefresh: false,
  aiDrafting: false,
  backgroundJobs: false,
  signatureHandoff: false,
};

export interface DocumentTemplateInput {
  id: string;
  templateCode: string;
  displayName: string;
  templateType: string;
  ownerReference: string;
  localeCodes: readonly string[];
}

export interface DocumentTemplate extends DocumentTemplateInput {
  status: "draft";
  approvedForUse: false;
  immutableAfterApproval: true;
  createdBy: string;
}

export interface DocumentTemplateVersionInput {
  id: string;
  templateId: string;
  version: string;
  contentFormat: "structured_json_template" | "html_template" | "markdown_template" | "docx_template";
  contentHash: string;
  componentVersionReferences: readonly string[];
  variableCodes: readonly string[];
}

export interface DocumentTemplateVersion extends DocumentTemplateVersionInput {
  status: "draft";
  approvedForUse: false;
  immutable: true;
  createdBy: string;
}

export interface DocumentVariableState {
  variableCode: string;
  status: "known" | "unknown" | "missing" | "unverified";
  sourceReference?: string;
  verificationReference?: string;
}

export interface DocumentBindingSnapshotInput {
  id: string;
  templateVersionId: string;
  subjectReferences: readonly string[];
  variableStates: readonly DocumentVariableState[];
}

export interface DocumentBindingSnapshot extends DocumentBindingSnapshotInput {
  status: "captured_unverified";
  immutable: true;
  missingRequiredVariableCodes: readonly string[];
  containsRawValues: false;
}

export interface DocumentRenderEligibility {
  templateApproved: boolean;
  templateApplicable: boolean;
  requiredVariablesKnown: boolean;
  requiredBindingsVerified: boolean;
  requiredApprovalsPresent: boolean;
}

export interface DocumentRenderRequestInput {
  id: string;
  templateVersionId: string;
  bindingSnapshotId: string;
  purpose: DocumentRenderPurpose;
  eligibility: DocumentRenderEligibility;
}

export interface DocumentRenderRequest extends DocumentRenderRequestInput {
  status: "blocked" | "queued_disabled";
  blockingReasons: readonly string[];
  dispatched: false;
}

export interface GeneratedDocumentArtifactPlan {
  id: string;
  renderRequestId: string;
  templateVersionId: string;
  bindingSnapshotId: string;
  requestedFormat: "pdf" | "docx" | "html";
  status: "not_generated";
  artifactHash: null;
  immutableWhenFinal: true;
  signatureReady: false;
}

function assertPermission(actor: DocumentGenerationActorContext, permission: string): void {
  if (!actor.actorId || !actor.tenantId || !actor.permissions.includes(permission)) {
    throw new Error("Document generation action is not authorized.");
  }
}

function assertStableCode(value: string, label: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error(label + " must be a stable uppercase code.");
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

export function isDocumentGenerationRuntimeEnabled(): false {
  return false;
}

export function createDocumentTemplate(
  actor: DocumentGenerationActorContext,
  input: DocumentTemplateInput,
): DocumentTemplate {
  assertPermission(actor, "document_generation.template.create");
  assertStableCode(input.templateCode, "templateCode");
  return {
    ...input,
    localeCodes: unique(input.localeCodes),
    status: "draft",
    approvedForUse: false,
    immutableAfterApproval: true,
    createdBy: actor.actorId,
  };
}

export function createDocumentTemplateVersion(
  actor: DocumentGenerationActorContext,
  input: DocumentTemplateVersionInput,
): DocumentTemplateVersion {
  assertPermission(actor, "document_generation.template.version.create");
  if (!input.contentHash) throw new Error("Template version requires a content hash.");
  return {
    ...input,
    componentVersionReferences: unique(input.componentVersionReferences),
    variableCodes: unique(input.variableCodes),
    status: "draft",
    approvedForUse: false,
    immutable: true,
    createdBy: actor.actorId,
  };
}

export function captureDocumentBindingSnapshot(
  actor: DocumentGenerationActorContext,
  input: DocumentBindingSnapshotInput,
): DocumentBindingSnapshot {
  assertPermission(actor, "document_generation.binding.capture");
  const missingRequiredVariableCodes = input.variableStates
    .filter((item) => item.status === "missing" || item.status === "unknown")
    .map((item) => item.variableCode);
  return {
    ...input,
    subjectReferences: unique(input.subjectReferences),
    variableStates: input.variableStates.map((item) => ({ ...item })),
    status: "captured_unverified",
    immutable: true,
    missingRequiredVariableCodes: unique(missingRequiredVariableCodes),
    containsRawValues: false,
  };
}

export function createDocumentRenderRequest(
  actor: DocumentGenerationActorContext,
  input: DocumentRenderRequestInput,
): DocumentRenderRequest {
  assertPermission(actor, "document_generation.render.request");
  const blockingReasons = [
    !input.eligibility.templateApproved && "template_not_approved",
    !input.eligibility.templateApplicable && "template_not_applicable",
    !input.eligibility.requiredVariablesKnown && "required_variables_unknown",
    !input.eligibility.requiredBindingsVerified && "required_bindings_unverified",
    !input.eligibility.requiredApprovalsPresent && "required_approvals_missing",
  ].filter(Boolean) as string[];
  return {
    ...input,
    status: blockingReasons.length ? "blocked" : "queued_disabled",
    blockingReasons,
    dispatched: false,
  };
}

export function createGeneratedDocumentArtifactPlan(
  actor: DocumentGenerationActorContext,
  input: Omit<GeneratedDocumentArtifactPlan, "status" | "artifactHash" | "immutableWhenFinal" | "signatureReady">,
): GeneratedDocumentArtifactPlan {
  assertPermission(actor, "document_generation.artifact.create");
  return {
    ...input,
    status: "not_generated",
    artifactHash: null,
    immutableWhenFinal: true,
    signatureReady: false,
  };
}

export function getDocumentGenerationRuntimeStatus(): {
  module: typeof DOCUMENT_GENERATION_MODULE;
  enabled: false;
  policy: DocumentGenerationRuntimePolicy;
} {
  return { module: DOCUMENT_GENERATION_MODULE, enabled: false, policy: DOCUMENT_GENERATION_RUNTIME_POLICY };
}
