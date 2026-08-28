import { describe, expect, it } from "vitest";
import {
  createDraftRagPolicy,
  createRagConsumerBinding,
  createRagSession,
  evaluateRagCandidate,
  isRagRuntimeEnabled
} from "../../packages/rag/src/index.ts";

const session = () => createRagSession({
  correlationId: "m063-test",
  actor: {
    actorId: "staff:one",
    identityAssurance: "verified",
    retrievalAuthorization: "valid",
    purposeAuthorization: "valid"
  },
  binding: createRagConsumerBinding("consumer:test", "manifest:test", ["internal"], ["INTERNAL_KNOWLEDGE"]),
  tenantReference: "tenant:one",
  audience: "internal",
  corpusCode: "INTERNAL_KNOWLEDGE",
  queryReference: "query:opaque",
  policy: createDraftRagPolicy("INTERNAL_POLICY", 10, 1000)
});

describe("M063 RAG", () => {
  it("creates a non-dispatched provider-disabled session", () => {
    expect(session().status).toBe("blocked_runtime_disabled");
    expect(isRagRuntimeEnabled()).toBe(false);
  });
  it("filters a cross-tenant candidate before any ranking", () => {
    const decision = evaluateRagCandidate(session(), {
      id: "candidate:other",
      tenantReference: "tenant:other",
      audience: "internal",
      corpusCode: "INTERNAL_KNOWLEDGE",
      knowledgeVersionReference: "knowledge:v1",
      sourceSnapshotReference: "source:s1",
      freshness: "current",
      active: true,
      conflictReference: null
    });
    expect(decision.reasonCode).toBe("TENANT_FILTERED");
    expect(decision.rankingAllowed).toBe(false);
  });
  it("does not allow stale evidence into retrieval", () => {
    const decision = evaluateRagCandidate(session(), {
      id: "candidate:stale",
      tenantReference: "tenant:one",
      audience: "internal",
      corpusCode: "INTERNAL_KNOWLEDGE",
      knowledgeVersionReference: "knowledge:v1",
      sourceSnapshotReference: "source:s1",
      freshness: "stale",
      active: true,
      conflictReference: null
    });
    expect(decision.reasonCode).toBe("STALE_OR_UNKNOWN");
  });
});
