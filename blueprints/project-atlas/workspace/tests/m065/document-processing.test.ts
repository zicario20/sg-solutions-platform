import { describe, expect, it } from "vitest";
import {
  createDerivativeArtifact,
  createFileArtifact,
  createProcessingRequest,
  createTechnicalCandidate,
  isDocumentProcessingRuntimeEnabled,
  validateFileArtifact
} from "../../packages/document-processing/src/index.ts";

const artifact = () => createFileArtifact({
  artifactCode: "UPLOAD_001",
  tenantReference: "tenant:one",
  originalReference: "document:opaque",
  reportedMime: "application/pdf",
  detectedMime: "application/pdf",
  checksum: "sha256:example",
  byteLength: 123,
  classification: "restricted"
});

describe("M065 Document Processing", () => {
  it("keeps originals immutable and derivatives separate", () => {
    const derivative = createDerivativeArtifact(artifact(), "render", "recipe:render-v1");
    expect(artifact().originalImmutable).toBe(true);
    expect(derivative.replacesOriginal).toBe(false);
  });
  it("quarantines a MIME mismatch", () => {
    const mismatch = createFileArtifact({ ...artifact(), reportedMime: "image/png", detectedMime: "application/pdf" });
    expect(validateFileArtifact(mismatch, false).status).toBe("quarantined");
  });
  it("never promotes technical output into a fact or dispatches work", () => {
    expect(createTechnicalCandidate(artifact(), "ocr_text", 0.7, "provenance:ref").canonicalFact).toBe(false);
    expect(createProcessingRequest(artifact(), "ocr", "recipe:ocr-v1").dispatched).toBe(false);
    expect(isDocumentProcessingRuntimeEnabled()).toBe(false);
  });
});
