export const DOCUMENT_SPECIALIST_IDENTITY_ASSURANCE_LEVELS = [
  "anonymous",
  "authenticated_account",
  "step_up_verified",
  "staff_verified",
  "authorized_representative_verified",
  "unknown",
] as const;

export type DocumentSpecialistIdentityAssurance =
  (typeof DOCUMENT_SPECIALIST_IDENTITY_ASSURANCE_LEVELS)[number];

export const DOCUMENT_DATA_AUTHORIZATION_STATUSES = [
  "not_provided",
  "pending",
  "valid",
  "expired",
  "revoked",
  "unknown",
] as const;

export type DocumentDataAuthorizationStatus =
  (typeof DOCUMENT_DATA_AUTHORIZATION_STATUSES)[number];

export type DocumentSpecialistSessionInput = {
  id: string;
  clientReference: string;
  caseReference: string;
  identityAssurance: DocumentSpecialistIdentityAssurance;
  documentDataAuthorization: DocumentDataAuthorizationStatus;
  documentAccessAuthorized: boolean;
  purposeAuthorized: boolean;
  serviceEntitled: boolean;
  documentScope:
    | "credit"
    | "tax"
    | "business_formation"
    | "business_funding"
    | "home_buying"
    | "compliance"
    | "general";
  locale: "en" | "es";
  createdAt: string;
  expiresAt: string;
};

export type DocumentSpecialistSession = DocumentSpecialistSessionInput & {
  status: "authorized";
  documentReferenceMode: "reference_only";
  documentProcessingAccess: "disabled";
  ocrAccess: "disabled";
  parserAccess: "disabled";
  extractionAccess: "disabled";
  generationAccess: "disabled";
  signatureAccess: "disabled";
};

export type DocumentReferenceInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  documentReference: string;
  sourceKind:
    | "client_document_reference"
    | "document_requirement_reference"
    | "processing_result_reference"
    | "domain_case_reference"
    | "manual_case_reference";
  observedAt: string;
  rawDocumentIncluded: boolean;
  rawExtractedTextIncluded: boolean;
  rawDocumentContentIncluded: boolean;
};

export type DocumentReference = DocumentReferenceInput & {
  storageMode: "reference_only";
  originalDocumentStored: false;
  rawExtractionStored: false;
  processingPerformed: false;
};

export type DocumentClassificationCandidateInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  documentReferenceId: string;
  candidateDocumentType:
    | "identity"
    | "income"
    | "tax"
    | "financial"
    | "formation"
    | "property"
    | "agreement"
    | "unknown";
  evidenceReferences: string[];
  schemaReference: string;
  createdAt: string;
};

export type DocumentClassificationCandidate = DocumentClassificationCandidateInput & {
  status: "candidate";
  documentTypeConfirmed: false;
  documentTrusted: false;
  canonicalFactCreated: false;
};

export type DocumentExtractionCandidateInput = {
  id: string;
  classificationCandidateId: string;
  fieldCode: string;
  sourceReferenceId: string;
  extractionMethodReference: string;
  rawExtractedValueIncluded: boolean;
  createdAt: string;
};

export type DocumentExtractionCandidate = DocumentExtractionCandidateInput & {
  status: "candidate";
  extractedValueStored: false;
  valueVerified: false;
  canonicalFactCreated: false;
};

export type DocumentQualityAssessmentInput = {
  documentReferenceId: string;
  classificationReviewed: boolean;
  extractionReviewed: boolean;
  versionKnown: boolean;
  quarantineCleared: boolean;
  humanDocumentSpecialistApproval: boolean;
  complianceApproval: boolean;
};

export type DocumentQualityAssessment = {
  documentReferenceId: string;
  status: "blocked" | "review_required";
  reasonCodes: string[];
  documentAcceptedForProcessing: false;
  downstreamDomainApproval: false;
};

export type DomainDocumentPackInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  domain:
    | "credit"
    | "tax"
    | "business_formation"
    | "business_funding"
    | "home_buying"
    | "compliance";
  documentReferenceIds: string[];
  extractionCandidateIds: string[];
  rawDocumentIncluded: boolean;
  createdAt: string;
};

export type DomainDocumentPack = DomainDocumentPackInput & {
  status: "reference_only";
  processingDispatched: false;
  documentGenerated: false;
  signatureRequested: false;
  downstreamDomainApproval: false;
};

export type DocumentSpecialistHandoffInput = {
  id: string;
  sessionId: string;
  caseReference: string;
  reason: string;
  createdAt: string;
};

export type DocumentSpecialistHandoff = DocumentSpecialistHandoffInput & {
  route: "human_document_processing_owner_review";
  dispatchPermitted: false;
  externalActionPermitted: false;
};

export type DocumentSpecialistRuntime = {
  status: "disabled";
  documentDownloadEnabled: false;
  ocrEnabled: false;
  parserEnabled: false;
  classificationExecutionEnabled: false;
  extractionExecutionEnabled: false;
  documentGenerationEnabled: false;
  signatureActionsEnabled: false;
  secureDeliveryEnabled: false;
  aiExecutionEnabled: false;
};
