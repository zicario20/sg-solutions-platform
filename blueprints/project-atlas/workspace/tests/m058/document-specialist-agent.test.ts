import { describe, expect, it } from "vitest";

import {
  assessDocumentQuality,
  createDocumentClassificationCandidate,
  createDocumentExtractionCandidate,
  createDocumentSpecialistHandoff,
  createDocumentSpecialistRuntime,
  createDocumentSpecialistSession,
  createDomainDocumentPack,
  M058_DOCUMENT_SPECIALIST_AGENT_FLAGS,
  registerDocumentReference,
} from "../../packages/document-specialist-agent/src/index.ts";

const authorizedSessionInput = {
  id: "document-session-001",
  clientReference: "client-ref-001",
  caseReference: "document-case-ref-001",
  identityAssurance: "step_up_verified" as const,
  documentDataAuthorization: "valid" as const,
  documentAccessAuthorized: true,
  purposeAuthorized: true,
  serviceEntitled: true,
  documentScope: "home_buying" as const,
  locale: "en" as const,
  createdAt: "2026-08-27T19:00:00.000Z",
  expiresAt: "2026-08-27T20:00:00.000Z",
};

describe("M058 document specialist controlled foundation", () => {
  it("keeps processing, OCR, generation, delivery, and AI flags disabled", () => {
    expect(
      Object.values(M058_DOCUMENT_SPECIALIST_AGENT_FLAGS).every((enabled) => !enabled),
    ).toBe(true);
  });

  it("requires verified identity, current authorization, document access, purpose, and entitlement", () => {
    expect(() =>
      createDocumentSpecialistSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Document-specialist access requires verified identity");

    expect(() =>
      createDocumentSpecialistSession({
        ...authorizedSessionInput,
        documentDataAuthorization: "revoked",
      }),
    ).toThrow("Document-specialist access requires current authorization");
  });

  it("uses only document references and rejects raw files and extraction text", () => {
    const reference = registerDocumentReference({
      id: "document-ref-001",
      sessionId: "document-session-001",
      caseReference: "document-case-ref-001",
      documentReference: "document-ref-opaque-001",
      sourceKind: "client_document_reference",
      observedAt: "2026-08-27T19:10:00.000Z",
      rawDocumentIncluded: false,
      rawExtractedTextIncluded: false,
      rawDocumentContentIncluded: false,
    });

    expect(reference).toMatchObject({
      storageMode: "reference_only",
      originalDocumentStored: false,
      processingPerformed: false,
    });

    expect(() =>
      registerDocumentReference({
        ...reference,
        id: "document-ref-raw",
        rawExtractedTextIncluded: true,
      }),
    ).toThrow("Raw documents, extracted text, and document content");
  });

  it("keeps classifications and extracted values as unverified candidates", () => {
    const classification = createDocumentClassificationCandidate({
      id: "classification-001",
      sessionId: "document-session-001",
      caseReference: "document-case-ref-001",
      documentReferenceId: "document-ref-001",
      candidateDocumentType: "income",
      evidenceReferences: ["document-ref-opaque-001"],
      schemaReference: "schema-ref-001",
      createdAt: "2026-08-27T19:20:00.000Z",
    });

    expect(classification).toMatchObject({
      documentTypeConfirmed: false,
      documentTrusted: false,
      canonicalFactCreated: false,
    });

    expect(() =>
      createDocumentExtractionCandidate({
        id: "extraction-raw-001",
        classificationCandidateId: "classification-001",
        fieldCode: "income",
        sourceReferenceId: "document-ref-001",
        extractionMethodReference: "recipe-ref-001",
        rawExtractedValueIncluded: true,
        createdAt: "2026-08-27T19:25:00.000Z",
      }),
    ).toThrow("Raw extracted values");

    expect(
      createDocumentExtractionCandidate({
        id: "extraction-001",
        classificationCandidateId: "classification-001",
        fieldCode: "income",
        sourceReferenceId: "document-ref-001",
        extractionMethodReference: "recipe-ref-001",
        rawExtractedValueIncluded: false,
        createdAt: "2026-08-27T19:25:00.000Z",
      }),
    ).toMatchObject({
      valueVerified: false,
      canonicalFactCreated: false,
    });
  });

  it("requires review controls and never turns document processing into domain approval", () => {
    expect(
      assessDocumentQuality({
        documentReferenceId: "document-ref-001",
        classificationReviewed: false,
        extractionReviewed: false,
        versionKnown: false,
        quarantineCleared: false,
        humanDocumentSpecialistApproval: false,
        complianceApproval: false,
      }),
    ).toMatchObject({
      status: "blocked",
      documentAcceptedForProcessing: false,
      downstreamDomainApproval: false,
    });

    expect(
      assessDocumentQuality({
        documentReferenceId: "document-ref-001",
        classificationReviewed: true,
        extractionReviewed: true,
        versionKnown: true,
        quarantineCleared: true,
        humanDocumentSpecialistApproval: true,
        complianceApproval: true,
      }),
    ).toMatchObject({
      status: "review_required",
      documentAcceptedForProcessing: false,
    });
  });

  it("creates reference-only domain packs and non-dispatching handoffs", () => {
    expect(
      createDomainDocumentPack({
        id: "document-pack-001",
        sessionId: "document-session-001",
        caseReference: "document-case-ref-001",
        domain: "home_buying",
        documentReferenceIds: ["document-ref-001"],
        extractionCandidateIds: ["extraction-001"],
        rawDocumentIncluded: false,
        createdAt: "2026-08-27T19:30:00.000Z",
      }),
    ).toMatchObject({
      processingDispatched: false,
      documentGenerated: false,
      signatureRequested: false,
      downstreamDomainApproval: false,
    });

    expect(
      createDocumentSpecialistHandoff({
        id: "document-handoff-001",
        sessionId: "document-session-001",
        caseReference: "document-case-ref-001",
        reason: "Document references require controlled processing-owner review.",
        createdAt: "2026-08-27T19:35:00.000Z",
      }),
    ).toMatchObject({
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createDocumentSpecialistRuntime()).toMatchObject({
      status: "disabled",
      ocrEnabled: false,
      documentGenerationEnabled: false,
      aiExecutionEnabled: false,
    });
  });
});
