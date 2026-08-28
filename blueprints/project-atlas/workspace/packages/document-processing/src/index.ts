export type DocumentProcessingPurpose = "technical_validation" | "render" | "native_parse" | "ocr" | "conversion" | "redaction";
export type FileValidationStatus = "manual_review_required" | "quarantined";

export interface DocumentProcessingActorContext {
  actorId: string;
  identityAssurance: "verified" | "unverified";
  processingAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface FileArtifactInput {
  artifactCode: string;
  tenantReference: string;
  originalReference: string;
  reportedMime: string;
  detectedMime: string;
  checksum: string;
  byteLength: number;
  classification: "public" | "internal" | "restricted";
}
export interface FileArtifact extends FileArtifactInput {
  id: string;
  status: "received";
  originalImmutable: true;
  safeForConsumption: false;
}
export interface LogicalDocument {
  id: string;
  fileArtifactId: string;
  semanticType: "unknown";
  status: "technical_boundary_only";
}
export interface FileValidationResult {
  artifactId: string;
  status: FileValidationStatus;
  reportedDetectedMismatch: boolean;
  executableContentAllowed: false;
  processingAuthorized: false;
}
export interface DerivativeArtifact {
  id: string;
  originalArtifactId: string;
  derivativeType: "render" | "thumbnail" | "ocr_layer" | "normalized_pdf" | "redacted_copy";
  recipeReference: string;
  status: "candidate";
  replacesOriginal: false;
  safeForDelivery: false;
}
export interface ProcessingRequest {
  id: string;
  artifactId: string;
  purpose: DocumentProcessingPurpose;
  recipeReference: string;
  status: "queued_disabled";
  dispatched: false;
}
export interface TechnicalCandidate {
  id: string;
  artifactId: string;
  candidateType: "native_text" | "ocr_text" | "metadata" | "table" | "form_field" | "barcode";
  confidence: number;
  provenanceReference: string;
  canonicalFact: false;
}

export const documentProcessingRuntimePolicy = {
  fileBytesReadEnabled: false,
  nativeParsingEnabled: false,
  renderingEnabled: false,
  ocrEnabled: false,
  conversionEnabled: false,
  redactionEnabled: false,
  archiveExtractionEnabled: false,
  malwareScanEnabled: false,
  jobDispatchEnabled: false,
  deliveryEnabled: false,
  aiExecutionEnabled: false
} as const;
export const documentProcessingProhibitedActions = [
  "overwrite_original_file",
  "execute_macros_or_scripts",
  "allow_network_or_secret_access_from_artifact",
  "treat_ocr_as_canonical_fact",
  "treat_signature_image_as_signature_event",
  "deliver_quarantined_artifact",
  "bruteforce_password",
  "log_document_content_or_password"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isDocumentProcessingRuntimeEnabled = (): false => false;
export function assertDocumentProcessingActor(actor: DocumentProcessingActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("DOCUMENT_PROCESSING_VERIFIED_IDENTITY_REQUIRED");
  if (actor.processingAuthorization !== "valid") throw new Error("DOCUMENT_PROCESSING_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("DOCUMENT_PROCESSING_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function createFileArtifact(input: FileArtifactInput): FileArtifact {
  if (input.byteLength < 0) throw new Error("DOCUMENT_PROCESSING_INVALID_BYTE_LENGTH");
  return { ...input, id: ref("file-artifact", input.artifactCode + ":" + input.checksum), status: "received", originalImmutable: true, safeForConsumption: false };
}
export function createLogicalDocument(artifact: FileArtifact): LogicalDocument {
  return { id: ref("logical-document", artifact.id), fileArtifactId: artifact.id, semanticType: "unknown", status: "technical_boundary_only" };
}
export function validateFileArtifact(artifact: FileArtifact, suspicious: boolean): FileValidationResult {
  const mismatch = artifact.reportedMime !== artifact.detectedMime;
  return {
    artifactId: artifact.id,
    status: mismatch || suspicious ? "quarantined" : "manual_review_required",
    reportedDetectedMismatch: mismatch,
    executableContentAllowed: false,
    processingAuthorized: false
  };
}
export function createDerivativeArtifact(
  artifact: FileArtifact,
  derivativeType: DerivativeArtifact["derivativeType"],
  recipeReference: string
): DerivativeArtifact {
  return { id: ref("derivative-artifact", artifact.id + ":" + derivativeType + ":" + recipeReference), originalArtifactId: artifact.id, derivativeType, recipeReference, status: "candidate", replacesOriginal: false, safeForDelivery: false };
}
export function createProcessingRequest(artifact: FileArtifact, purpose: DocumentProcessingPurpose, recipeReference: string): ProcessingRequest {
  return { id: ref("processing-request", artifact.id + ":" + purpose + ":" + recipeReference), artifactId: artifact.id, purpose, recipeReference, status: "queued_disabled", dispatched: false };
}
export function createTechnicalCandidate(
  artifact: FileArtifact,
  candidateType: TechnicalCandidate["candidateType"],
  confidence: number,
  provenanceReference: string
): TechnicalCandidate {
  if (confidence < 0 || confidence > 1) throw new Error("DOCUMENT_PROCESSING_INVALID_CONFIDENCE");
  return { id: ref("technical-candidate", artifact.id + ":" + candidateType), artifactId: artifact.id, candidateType, confidence, provenanceReference, canonicalFact: false };
}
export function getDocumentProcessingRuntimeStatus() {
  return { enabled: false as const, policy: documentProcessingRuntimePolicy, activationRequires: ["sandbox_and_quarantine_controls", "M011_ownership_boundary", "M058_semantic_review_boundary", "M072_job_controls", "Product Owner authorization"] as const };
}
