export type RagAudience = "public" | "client" | "internal" | "ai_scoped";
export type RagFreshness = "current" | "stale" | "unknown";

export interface RagActorContext {
  actorId: string;
  identityAssurance: "verified" | "unverified";
  retrievalAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface RagConsumerBinding {
  consumerReference: string;
  agentManifestReference: string;
  allowedAudiences: readonly RagAudience[];
  allowedCorpusCodes: readonly string[];
  sourceDirectRetrievalAllowed: false;
  enabled: false;
}
export interface RagRetrievalPolicy {
  code: string;
  maximumCandidates: number;
  tokenBudget: number;
  blockStaleMaterialEvidence: true;
  preserveConflicts: true;
  status: "draft";
}
export interface RagRequestInput {
  correlationId: string;
  actor: RagActorContext;
  binding: RagConsumerBinding;
  tenantReference: string;
  audience: RagAudience;
  corpusCode: string;
  queryReference: string;
  policy: RagRetrievalPolicy;
}
export interface RagSession extends RagRequestInput {
  id: string;
  status: "blocked_runtime_disabled";
  retrievalDispatched: false;
}
export interface RagCandidate {
  id: string;
  tenantReference: string;
  audience: RagAudience;
  corpusCode: string;
  knowledgeVersionReference: string;
  sourceSnapshotReference: string;
  freshness: RagFreshness;
  active: boolean;
  conflictReference: string | null;
}
export interface RagCandidateDecision {
  candidateId: string;
  eligible: false;
  rankingAllowed: false;
  reasonCode: "TENANT_FILTERED" | "AUDIENCE_FILTERED" | "CORPUS_FILTERED" | "STALE_OR_UNKNOWN" | "INACTIVE_RESOURCE" | "RUNTIME_DISABLED";
}
export interface RagCitationPackage {
  id: string;
  sessionId: string;
  citations: readonly string[];
  claimSupportStatus: "not_answerable";
  contextDelivered: false;
}

export const ragRuntimePolicy = {
  queryUnderstandingEnabled: false,
  queryRewriteEnabled: false,
  embeddingEnabled: false,
  vectorRetrievalEnabled: false,
  lexicalRetrievalEnabled: false,
  rerankingEnabled: false,
  contextDeliveryEnabled: false,
  indexBuildEnabled: false,
  cacheEnabled: false,
  jobDispatchEnabled: false,
  aiExecutionEnabled: false
} as const;
export const ragProhibitedActions = [
  "bypass_hard_filters",
  "rank_before_access_filter",
  "use_embeddings_as_authority",
  "substitute_model_memory_for_governed_evidence",
  "detach_citation_from_immutable_lineage",
  "create_persistent_client_memory",
  "deliver_restricted_or_stale_evidence"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isRagRuntimeEnabled = (): false => false;
export function assertRagActor(actor: RagActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("RAG_VERIFIED_IDENTITY_REQUIRED");
  if (actor.retrievalAuthorization !== "valid") throw new Error("RAG_RETRIEVAL_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("RAG_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function createRagConsumerBinding(
  consumerReference: string,
  agentManifestReference: string,
  allowedAudiences: readonly RagAudience[],
  allowedCorpusCodes: readonly string[]
): RagConsumerBinding {
  return { consumerReference, agentManifestReference, allowedAudiences, allowedCorpusCodes, sourceDirectRetrievalAllowed: false, enabled: false };
}
export function createDraftRagPolicy(code: string, maximumCandidates: number, tokenBudget: number): RagRetrievalPolicy {
  if (!/^[A-Z][A-Z0-9_]{2,}$/.test(code) || maximumCandidates < 1 || tokenBudget < 1) throw new Error("RAG_INVALID_POLICY");
  return { code, maximumCandidates, tokenBudget, blockStaleMaterialEvidence: true, preserveConflicts: true, status: "draft" };
}
export function createRagSession(input: RagRequestInput): RagSession {
  assertRagActor(input.actor);
  if (!input.binding.allowedAudiences.includes(input.audience)) throw new Error("RAG_AUDIENCE_BINDING_DENIED");
  if (!input.binding.allowedCorpusCodes.includes(input.corpusCode)) throw new Error("RAG_CORPUS_BINDING_DENIED");
  return { ...input, id: ref("rag-session", input.correlationId), status: "blocked_runtime_disabled", retrievalDispatched: false };
}
export function evaluateRagCandidate(session: RagSession, candidate: RagCandidate): RagCandidateDecision {
  const reasonCode = candidate.tenantReference !== session.tenantReference ? "TENANT_FILTERED"
    : candidate.audience !== session.audience ? "AUDIENCE_FILTERED"
    : candidate.corpusCode !== session.corpusCode ? "CORPUS_FILTERED"
    : candidate.freshness !== "current" ? "STALE_OR_UNKNOWN"
    : !candidate.active ? "INACTIVE_RESOURCE"
    : "RUNTIME_DISABLED";
  return { candidateId: candidate.id, eligible: false, rankingAllowed: false, reasonCode };
}
export function createRagCitationPackage(session: RagSession, candidates: readonly RagCandidate[]): RagCitationPackage {
  return {
    id: ref("rag-citations", session.id),
    sessionId: session.id,
    citations: candidates.map((candidate) => candidate.knowledgeVersionReference + "|" + candidate.sourceSnapshotReference),
    claimSupportStatus: "not_answerable",
    contextDelivered: false
  };
}
export function getRagRuntimeStatus() {
  return { enabled: false as const, policy: ragRuntimePolicy, activationRequires: ["M062_governed_projections", "M064_source_freshness", "tenant_and_projection_isolation", "M072_job_controls", "Product Owner authorization"] as const };
}
