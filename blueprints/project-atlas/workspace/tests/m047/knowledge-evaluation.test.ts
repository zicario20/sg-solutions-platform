import {
  createAIReleaseGate,
  createContextSession,
  createDatasetVersion,
  createGroundedAnswer,
  createKnowledgeBinding,
  createRetrievalRequest,
  evaluateAIReleaseGate,
  validateMemoryWrite,
} from "@atlas/ai-control-plane";
import { describe, expect, it } from "vitest";

describe("M047 knowledge, memory, and evaluation control plane", () => {
  it("preserves knowledge scopes, citations, and unsupported-answer handling", () => {
    expect(() =>
      createKnowledgeBinding({
        id: "knowledge-public-invalid",
        agentVersionId: "agent-version-047",
        collectionReference: "internal-operations@1",
        accessScope: "internal",
        surface: "public",
        freshnessPolicyReference: "freshness@1",
      }),
    ).toThrow("public surface");

    const request = createRetrievalRequest({
      id: "retrieval-047",
      tenantId: "tenant-047",
      agentVersionId: "agent-version-047",
      purpose: "case_summary",
      dataClassification: "internal",
      jurisdiction: "IL",
      allowedCollectionReferences: ["approved-knowledge@1"],
      createdAt: "2026-08-26T12:00:00.000Z",
    });
    expect(request.allowedCollectionReferences).toEqual(["approved-knowledge@1"]);
    expect(() =>
      createGroundedAnswer({
        status: "grounded",
        content: "A factual answer",
        citationReferences: [],
        unsupportedClaims: [],
      }),
    ).toThrow("citation");
    expect(
      createGroundedAnswer({
        status: "unsupported",
        content: "I do not have enough approved information to answer that.",
        citationReferences: [],
        unsupportedClaims: ["answer_unavailable"],
      }),
    ).toMatchObject({ status: "unsupported" });
  });

  it("minimizes context and prevents sensitive automatic memory", () => {
    expect(() =>
      createContextSession({
        id: "context-invalid",
        tenantId: "tenant-047",
        agentVersionId: "agent-version-047",
        purpose: "internal_summary",
        sourceReferences: ["case-summary-047"],
        contextFields: ["chain_of_thought"],
        expiresAt: "2026-08-27T12:00:00.000Z",
      }),
    ).toThrow("chain-of-thought");
    expect(() =>
      validateMemoryWrite({
        memoryType: "personal",
        sensitivity: "restricted",
        automatic: true,
        policyReference: "memory@1",
      }),
    ).toThrow("sensitive memory");
  });

  it("requires provenance and blocking safety findings before a release can progress", () => {
    expect(() =>
      createDatasetVersion({
        id: "dataset-version-invalid",
        datasetDefinitionId: "dataset-047",
        version: 1,
        provenanceReferences: [],
        dataClassification: "internal",
        split: "holdout",
        status: "approved",
      }),
    ).toThrow("provenance");
    const gate = createAIReleaseGate({
      id: "release-gate-047",
      agentVersionId: "agent-version-047",
      evaluationSuiteReferences: ["eval-suite@1"],
      safetyTestReferences: ["safety-test@1"],
      requiredHumanApprovals: ["ai.release.approve"],
    });
    expect(
      evaluateAIReleaseGate(gate, [
        { id: "finding-047", severity: "high", blocking: true, status: "open" },
      ]),
    ).toMatchObject({ status: "blocked" });
  });
});
