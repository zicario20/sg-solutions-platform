import type {
  AIReleaseFinding,
  AIReleaseGate,
  AIReleaseGateDecision,
  ContextSession,
  DatasetVersion,
  GroundedAnswer,
  KnowledgeBinding,
  MemoryWrite,
  RetrievalRequest,
} from "./contracts.ts";
import {
  assertExactVersionReference,
  assertIso,
  assertNoPrivateReasoning,
  assertPositiveInteger,
  assertText,
  deepFreeze,
} from "./foundation.ts";

export function createKnowledgeBinding(value: KnowledgeBinding): KnowledgeBinding {
  assertText(value.id, "knowledge binding id", 160);
  assertText(value.agentVersionId, "knowledge agent version", 160);
  assertExactVersionReference(value.collectionReference, "knowledge collection reference");
  assertExactVersionReference(value.freshnessPolicyReference, "knowledge freshness policy");
  if (value.surface === "public" && value.accessScope !== "public")
    throw new TypeError("public surface cannot bind non-public knowledge");
  if (value.surface === "client" && value.accessScope === "internal")
    throw new TypeError("client surface cannot bind internal knowledge");
  return deepFreeze(value);
}

export function createRetrievalRequest(value: RetrievalRequest): RetrievalRequest {
  assertText(value.id, "retrieval request id", 160);
  assertText(value.tenantId, "retrieval tenant", 160);
  assertText(value.agentVersionId, "retrieval agent version", 160);
  assertText(value.purpose, "retrieval purpose", 160);
  if (value.allowedCollectionReferences.length === 0)
    throw new TypeError("retrieval collections required");
  value.allowedCollectionReferences.forEach((reference) => {
    assertExactVersionReference(reference, "retrieval collection reference");
  });
  if (value.jurisdiction !== null) assertText(value.jurisdiction, "retrieval jurisdiction", 32);
  assertIso(value.createdAt, "retrieval createdAt");
  return deepFreeze(value);
}

export function createGroundedAnswer(value: GroundedAnswer): GroundedAnswer {
  assertText(value.content, "grounded answer content", 10_000);
  if (value.status === "grounded" && value.citationReferences.length === 0)
    throw new TypeError("grounded answer citation required");
  if (value.status === "unsupported" && value.unsupportedClaims.length === 0)
    throw new TypeError("unsupported answer reason required");
  value.citationReferences.forEach((reference) => {
    assertText(reference, "citation reference", 240);
  });
  return deepFreeze(value);
}

export function createContextSession(value: ContextSession): ContextSession {
  assertText(value.id, "context session id", 160);
  assertText(value.tenantId, "context tenant", 160);
  assertText(value.agentVersionId, "context agent version", 160);
  assertText(value.purpose, "context purpose", 160);
  if (value.sourceReferences.length === 0) throw new TypeError("context provenance required");
  value.contextFields.forEach((field) => {
    assertNoPrivateReasoning(field, "context field");
  });
  assertIso(value.expiresAt, "context expiresAt");
  return deepFreeze(value);
}

export function validateMemoryWrite(value: MemoryWrite): MemoryWrite {
  assertExactVersionReference(value.policyReference, "memory policy reference");
  if (value.automatic && ["confidential", "restricted"].includes(value.sensitivity))
    throw new TypeError("sensitive memory requires human-directed policy");
  if (value.automatic && value.memoryType === "personal")
    throw new TypeError("personal memory cannot be automatically written");
  return deepFreeze(value);
}

export function createDatasetVersion(value: DatasetVersion): DatasetVersion {
  assertText(value.id, "dataset version id", 160);
  assertText(value.datasetDefinitionId, "dataset definition reference", 160);
  assertPositiveInteger(value.version, "dataset version");
  if (value.provenanceReferences.length === 0) throw new TypeError("dataset provenance required");
  value.provenanceReferences.forEach((reference) => {
    assertText(reference, "dataset provenance", 240);
  });
  return deepFreeze(value);
}

export function createAIReleaseGate(value: AIReleaseGate): AIReleaseGate {
  assertText(value.id, "release gate id", 160);
  assertText(value.agentVersionId, "release gate agent version", 160);
  if (value.evaluationSuiteReferences.length === 0 || value.safetyTestReferences.length === 0)
    throw new TypeError("release gate evidence required");
  if (value.requiredHumanApprovals.length === 0)
    throw new TypeError("release gate human approval required");
  value.evaluationSuiteReferences.forEach((reference) => {
    assertExactVersionReference(reference, "evaluation suite reference");
  });
  value.safetyTestReferences.forEach((reference) => {
    assertExactVersionReference(reference, "safety test reference");
  });
  return deepFreeze(value);
}

export function evaluateAIReleaseGate(
  _gate: AIReleaseGate,
  findings: readonly AIReleaseFinding[],
): AIReleaseGateDecision {
  const blockingFindingIds = findings
    .filter((finding) => finding.blocking && finding.status === "open")
    .map((finding) => finding.id);
  return deepFreeze({
    status: blockingFindingIds.length > 0 ? "blocked" : "requires_human_approval",
    blockingFindingIds,
  });
}
