export const ELECTRONIC_SIGNATURE_MODULE = "M067";

export type SignatureProviderCode = "docuseal" | "internal_test_provider" | "future_provider";

export interface ElectronicSignatureActorContext {
  actorId: string;
  tenantId: string;
  permissions: readonly string[];
  purpose?: string;
}

export interface ElectronicSignatureRuntimePolicy {
  providerSubmission: false;
  signingLinkCreation: false;
  providerWebhookAcceptance: false;
  reminderDelivery: false;
  signedArtifactDownload: false;
  backgroundJobs: false;
}

export const ELECTRONIC_SIGNATURE_RUNTIME_POLICY: ElectronicSignatureRuntimePolicy = {
  providerSubmission: false,
  signingLinkCreation: false,
  providerWebhookAcceptance: false,
  reminderDelivery: false,
  signedArtifactDownload: false,
  backgroundJobs: false,
};

export interface SignatureProviderProfileInput {
  id: string;
  providerCode: SignatureProviderCode;
  displayName: string;
  capabilityCodes: readonly string[];
}

export interface SignatureProviderProfile extends SignatureProviderProfileInput {
  status: "disabled";
  credentialsConfigured: false;
  providerConnectionTested: false;
}

export interface SignatureRequestInput {
  id: string;
  requestCode: string;
  signatureReadyArtifactId: string;
  frozenArtifactHash: string;
  providerProfileId: string;
  signerRoleCodes: readonly string[];
}

export interface SignatureRequest extends SignatureRequestInput {
  status: "draft";
  providerSubmissionStatus: "blocked_provider_disabled";
  providerEnvelopeReference: null;
  artifactFrozen: true;
  legallyValid: "not_determined";
}

export interface SignatureEnvelope {
  id: string;
  signatureRequestId: string;
  artifactHash: string;
  signerReferences: readonly string[];
  status: "draft";
  providerEnvelopeReference: null;
  immutableArtifactBinding: true;
}

export interface SignatureSignerResolution {
  id: string;
  signatureRequestId: string;
  signerRoleCode: string;
  subjectReference?: string;
  authorizationEvidenceReferences: readonly string[];
  authorizationRequired: boolean;
  status: "pending_manual_review" | "blocked_missing_authorization";
  identityVerified: false;
}

export interface SignatureEvidenceRecord {
  id: string;
  signatureRequestId: string;
  signerReference?: string;
  evidenceType: "consent" | "intent" | "provider_event" | "authentication" | "certificate";
  artifactHash: string;
  evidenceReference: string;
  verificationStatus: "unverified";
  legalConclusion: "not_determined";
}

export interface SignatureProviderSubmissionPlan {
  signatureRequestId: string;
  providerProfileId: string;
  status: "blocked_provider_disabled";
  externalWriteAttempted: false;
  signingUrl: null;
}

function assertPermission(actor: ElectronicSignatureActorContext, permission: string): void {
  if (!actor.actorId || !actor.tenantId || !actor.permissions.includes(permission)) {
    throw new Error("Electronic signature action is not authorized.");
  }
}

function assertStableCode(value: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,127}$/.test(value)) {
    throw new Error("requestCode must be a stable uppercase code.");
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

export function isElectronicSignatureRuntimeEnabled(): false {
  return false;
}

export function createSignatureProviderProfile(
  actor: ElectronicSignatureActorContext,
  input: SignatureProviderProfileInput,
): SignatureProviderProfile {
  assertPermission(actor, "signature_provider.manage");
  return {
    ...input,
    capabilityCodes: unique(input.capabilityCodes),
    status: "disabled",
    credentialsConfigured: false,
    providerConnectionTested: false,
  };
}

export function createSignatureRequest(
  actor: ElectronicSignatureActorContext,
  input: SignatureRequestInput,
): SignatureRequest {
  assertPermission(actor, "signature.create");
  assertStableCode(input.requestCode);
  if (!input.frozenArtifactHash) throw new Error("A signature request requires a frozen artifact hash.");
  return {
    ...input,
    signerRoleCodes: unique(input.signerRoleCodes),
    status: "draft",
    providerSubmissionStatus: "blocked_provider_disabled",
    providerEnvelopeReference: null,
    artifactFrozen: true,
    legallyValid: "not_determined",
  };
}

export function verifySignatureRequestArtifact(
  request: Pick<SignatureRequest, "frozenArtifactHash">,
  observedArtifactHash: string,
): "matched" | "mismatch" {
  return request.frozenArtifactHash === observedArtifactHash ? "matched" : "mismatch";
}

export function createSignatureEnvelope(
  actor: ElectronicSignatureActorContext,
  input: Omit<SignatureEnvelope, "status" | "providerEnvelopeReference" | "immutableArtifactBinding">,
): SignatureEnvelope {
  assertPermission(actor, "signature_envelope.create");
  if (!input.artifactHash) throw new Error("Signature envelope requires an artifact hash.");
  return {
    ...input,
    signerReferences: unique(input.signerReferences),
    status: "draft",
    providerEnvelopeReference: null,
    immutableArtifactBinding: true,
  };
}

export function resolveSignatureSigner(
  actor: ElectronicSignatureActorContext,
  input: Omit<SignatureSignerResolution, "status" | "identityVerified">,
): SignatureSignerResolution {
  assertPermission(actor, "signature_signer.resolve");
  const authorized = !input.authorizationRequired || input.authorizationEvidenceReferences.length > 0;
  return {
    ...input,
    authorizationEvidenceReferences: unique(input.authorizationEvidenceReferences),
    status: authorized ? "pending_manual_review" : "blocked_missing_authorization",
    identityVerified: false,
  };
}

export function createSignatureEvidenceRecord(
  actor: ElectronicSignatureActorContext,
  input: Omit<SignatureEvidenceRecord, "verificationStatus" | "legalConclusion">,
): SignatureEvidenceRecord {
  assertPermission(actor, "signature_evidence.create");
  return { ...input, verificationStatus: "unverified", legalConclusion: "not_determined" };
}

export function createSignatureProviderSubmissionPlan(
  actor: ElectronicSignatureActorContext,
  request: Pick<SignatureRequest, "id" | "providerProfileId">,
): SignatureProviderSubmissionPlan {
  assertPermission(actor, "signature.submit");
  return {
    signatureRequestId: request.id,
    providerProfileId: request.providerProfileId,
    status: "blocked_provider_disabled",
    externalWriteAttempted: false,
    signingUrl: null,
  };
}

export function getElectronicSignatureRuntimeStatus(): {
  module: typeof ELECTRONIC_SIGNATURE_MODULE;
  enabled: false;
  policy: ElectronicSignatureRuntimePolicy;
} {
  return { module: ELECTRONIC_SIGNATURE_MODULE, enabled: false, policy: ELECTRONIC_SIGNATURE_RUNTIME_POLICY };
}
