export type KnowledgeSensitivity = "public" | "internal" | "restricted";
export type KnowledgeAudience = "public" | "client" | "internal" | "ai_scoped";
export type KnowledgeSourceFreshness = "current" | "stale" | "unknown";
export interface KnowledgeCurationActorContext {
  actorId: string;
  identityAssurance: "verified" | "unverified";
  curationAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface KnowledgeCurationSessionInput {
  correlationId: string;
  actor: KnowledgeCurationActorContext;
  ownerModule: string;
  purpose: "curation" | "review" | "localization" | "retirement";
}
export interface KnowledgeCurationSession extends KnowledgeCurationSessionInput {
  id: string;
  status: "opened";
  runtimeMode: "provider_disabled";
}
export interface KnowledgeItemInput {
  code: string;
  ownerModule: string;
  knowledgeType: "service" | "policy" | "procedure" | "faq" | "resource" | "disclosure";
  sensitivity: KnowledgeSensitivity;
  supportedLocales: readonly ("es" | "en")[];
}
export interface KnowledgeItem extends KnowledgeItemInput {
  id: string;
  status: "draft";
  currentPublishedVersionId: null;
}
export interface KnowledgeSourceReference {
  sourceId: string;
  sourceVersionId: string;
  sourceAuthority: string;
  freshness: KnowledgeSourceFreshness;
  sourceSnapshotReference: string;
}
export interface KnowledgeVersionInput {
  item: KnowledgeItem;
  version: string;
  locale: "es" | "en";
  contentReference: string;
  contentDigest: string;
  sourceReferences: readonly KnowledgeSourceReference[];
  applicabilityReferences: readonly string[];
}
export interface KnowledgeVersion extends KnowledgeVersionInput {
  id: string;
  status: "draft";
  published: false;
  immutableWhenPublished: true;
}
export interface KnowledgeAccessProjectionInput {
  version: KnowledgeVersion;
  audience: KnowledgeAudience;
  projectionReference: string;
}
export interface KnowledgeAccessProjection extends KnowledgeAccessProjectionInput {
  id: string;
  deliveryEnabled: false;
}

export const knowledgeBaseRuntimePolicy = {
  sourceIngestionEnabled: false,
  sourceSyncEnabled: false,
  publicationEnabled: false,
  projectionDeliveryEnabled: false,
  retrievalEnabled: false,
  reindexRequestEnabled: false,
  aiDraftEnabled: false,
  exportEnabled: false
} as const;
export const knowledgeBaseProhibitedActions = [
  "auto_publish_imported_or_ai_content",
  "treat_raw_source_as_canonical_knowledge",
  "leak_restricted_knowledge_to_public_projection",
  "make_unverified_claim_canonical",
  "perform_retrieval_or_ranking",
  "write_or_export_private_reasoning"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isKnowledgeBaseRuntimeEnabled = (): false => false;
export function assertKnowledgeCurationActor(actor: KnowledgeCurationActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("KNOWLEDGE_BASE_VERIFIED_IDENTITY_REQUIRED");
  if (actor.curationAuthorization !== "valid") throw new Error("KNOWLEDGE_BASE_CURATION_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("KNOWLEDGE_BASE_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function assertKnowledgeCode(code: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,}$/.test(code)) throw new Error("KNOWLEDGE_BASE_INVALID_STABLE_CODE");
}
export function sourceFreshnessOf(sources: readonly KnowledgeSourceReference[]): KnowledgeSourceFreshness {
  if (sources.some((source) => source.freshness === "stale")) return "stale";
  if (sources.some((source) => source.freshness === "unknown")) return "unknown";
  return sources.length === 0 ? "unknown" : "current";
}
export function createKnowledgeCurationSession(input: KnowledgeCurationSessionInput): KnowledgeCurationSession {
  assertKnowledgeCurationActor(input.actor);
  return { ...input, id: ref("knowledge-curation", input.correlationId), status: "opened", runtimeMode: "provider_disabled" };
}
export function createKnowledgeItem(input: KnowledgeItemInput): KnowledgeItem {
  assertKnowledgeCode(input.code);
  return { ...input, id: ref("knowledge-item", input.code), status: "draft", currentPublishedVersionId: null };
}
export function createDraftKnowledgeVersion(input: KnowledgeVersionInput): KnowledgeVersion {
  return { ...input, id: ref("knowledge-version", input.item.code + ":" + input.version + ":" + input.locale), status: "draft", published: false, immutableWhenPublished: true };
}
export function createKnowledgeAccessProjection(input: KnowledgeAccessProjectionInput): KnowledgeAccessProjection {
  if (input.audience === "public" && input.version.item.sensitivity !== "public") throw new Error("KNOWLEDGE_BASE_RESTRICTED_PUBLIC_PROJECTION");
  return { ...input, id: ref("knowledge-projection", input.version.id + ":" + input.audience), deliveryEnabled: false };
}
export function assessKnowledgePublicationReadiness(version: KnowledgeVersion, requiredHumanApprovals: readonly string[]) {
  return { version, requiredHumanApprovals, sourceFreshness: sourceFreshnessOf(version.sourceReferences), status: "review_required" as const, publicationAuthorized: false as const, reindexRequested: false as const };
}
export function getKnowledgeBaseRuntimeStatus() {
  return { enabled: false as const, policy: knowledgeBaseRuntimePolicy, activationRequires: ["M063_retrieval_boundary", "M064_source_authority_and_freshness", "editorial_and_compliance_approval", "Product Owner authorization"] as const };
}
