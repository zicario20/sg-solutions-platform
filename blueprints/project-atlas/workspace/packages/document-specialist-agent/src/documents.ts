import type {
  DocumentClassificationCandidate,
  DocumentClassificationCandidateInput,
  DocumentExtractionCandidate,
  DocumentExtractionCandidateInput,
  DocumentQualityAssessment,
  DocumentQualityAssessmentInput,
  DocumentReference,
  DocumentReferenceInput,
  DocumentSpecialistHandoff,
  DocumentSpecialistHandoffInput,
  DocumentSpecialistSession,
  DocumentSpecialistSessionInput,
  DomainDocumentPack,
  DomainDocumentPackInput,
} from "./contracts.ts";
import { assertDocumentSpecialistAccess } from "./policy.ts";

export function createDocumentSpecialistSession(
  input: DocumentSpecialistSessionInput,
): DocumentSpecialistSession {
  assertDocumentSpecialistAccess(input);

  return {
    ...input,
    status: "authorized",
    documentReferenceMode: "reference_only",
    documentProcessingAccess: "disabled",
    ocrAccess: "disabled",
    parserAccess: "disabled",
    extractionAccess: "disabled",
    generationAccess: "disabled",
    signatureAccess: "disabled",
  };
}

export function registerDocumentReference(input: DocumentReferenceInput): DocumentReference {
  if (
    input.rawDocumentIncluded ||
    input.rawExtractedTextIncluded ||
    input.rawDocumentContentIncluded
  ) {
    throw new Error(
      "Raw documents, extracted text, and document content are not accepted by the controlled foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    originalDocumentStored: false,
    rawExtractionStored: false,
    processingPerformed: false,
  };
}

export function createDocumentClassificationCandidate(
  input: DocumentClassificationCandidateInput,
): DocumentClassificationCandidate {
  return {
    ...input,
    status: "candidate",
    documentTypeConfirmed: false,
    documentTrusted: false,
    canonicalFactCreated: false,
  };
}

export function createDocumentExtractionCandidate(
  input: DocumentExtractionCandidateInput,
): DocumentExtractionCandidate {
  if (input.rawExtractedValueIncluded) {
    throw new Error(
      "Raw extracted values are not accepted by the controlled document-specialist foundation.",
    );
  }

  return {
    ...input,
    status: "candidate",
    extractedValueStored: false,
    valueVerified: false,
    canonicalFactCreated: false,
  };
}

export function assessDocumentQuality(
  input: DocumentQualityAssessmentInput,
): DocumentQualityAssessment {
  const reasonCodes: string[] = [];

  if (!input.classificationReviewed) {
    reasonCodes.push("classification_review_required");
  }
  if (!input.extractionReviewed) {
    reasonCodes.push("extraction_review_required");
  }
  if (!input.versionKnown) {
    reasonCodes.push("document_version_review_required");
  }
  if (!input.quarantineCleared) {
    reasonCodes.push("quarantine_clearance_required");
  }
  if (!input.humanDocumentSpecialistApproval) {
    reasonCodes.push("human_document_specialist_approval_required");
  }
  if (!input.complianceApproval) {
    reasonCodes.push("compliance_approval_required");
  }

  if (reasonCodes.length > 0) {
    return {
      documentReferenceId: input.documentReferenceId,
      status: "blocked",
      reasonCodes,
      documentAcceptedForProcessing: false,
      downstreamDomainApproval: false,
    };
  }

  return {
    documentReferenceId: input.documentReferenceId,
    status: "review_required",
    reasonCodes: [
      "document_processing_owner_disabled",
      "manual_controlled_workflow_required",
    ],
    documentAcceptedForProcessing: false,
    downstreamDomainApproval: false,
  };
}

export function createDomainDocumentPack(input: DomainDocumentPackInput): DomainDocumentPack {
  if (input.rawDocumentIncluded) {
    throw new Error("Domain document packs accept document references only.");
  }

  return {
    ...input,
    status: "reference_only",
    processingDispatched: false,
    documentGenerated: false,
    signatureRequested: false,
    downstreamDomainApproval: false,
  };
}

export function createDocumentSpecialistHandoff(
  input: DocumentSpecialistHandoffInput,
): DocumentSpecialistHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Document-specialist handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_document_processing_owner_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
