import { describe, expect, it } from "vitest";
import {
  assessKnowledgePublicationReadiness,
  createDraftKnowledgeVersion,
  createKnowledgeAccessProjection,
  createKnowledgeItem,
  isKnowledgeBaseRuntimeEnabled
} from "../../packages/knowledge-base/src/index.ts";

const item = (sensitivity: "public" | "internal" | "restricted" = "public") => createKnowledgeItem({
  code: "CREDIT_GUIDANCE",
  ownerModule: "m001",
  knowledgeType: "service",
  sensitivity,
  supportedLocales: ["es", "en"]
});
const version = (sensitivity: "public" | "internal" | "restricted" = "public") => createDraftKnowledgeVersion({
  item: item(sensitivity),
  version: "1.0.0",
  locale: "es",
  contentReference: "content:credit-guidance",
  contentDigest: "sha256:ref",
  sourceReferences: [{
    sourceId: "source-ref",
    sourceVersionId: "v1",
    sourceAuthority: "owner-module",
    freshness: "current",
    sourceSnapshotReference: "snapshot:ref"
  }],
  applicabilityReferences: ["jurisdiction:general"]
});

describe("M062 Knowledge Base", () => {
  it("keeps runtime and new versions disabled", () => {
    expect(isKnowledgeBaseRuntimeEnabled()).toBe(false);
    expect(version().published).toBe(false);
  });
  it("blocks public projections of restricted knowledge", () => {
    expect(() => createKnowledgeAccessProjection({
      version: version("restricted"),
      audience: "public",
      projectionReference: "projection:public"
    })).toThrow("KNOWLEDGE_BASE_RESTRICTED_PUBLIC_PROJECTION");
  });
  it("requires human review before publication", () => {
    expect(assessKnowledgePublicationReadiness(version(), ["editorial"]).publicationAuthorized).toBe(false);
  });
});
