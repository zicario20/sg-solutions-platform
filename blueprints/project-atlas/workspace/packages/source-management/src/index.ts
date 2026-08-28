export type SourceAuthorityClass = "official" | "government" | "regulator" | "provider_contractual" | "partner" | "internal_approved" | "unverified";
export type SourceTrustStatus = "trusted" | "review_required" | "quarantined" | "revoked";
export type SourceFreshnessStatus = "current" | "stale" | "unknown";

export interface SourceActorContext {
  actorId: string;
  identityAssurance: "verified" | "unverified";
  sourceManagementAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface SourceRecordInput {
  sourceCode: string;
  displayName: string;
  sourceType: "government" | "regulation" | "provider" | "program" | "partner" | "internal";
  authorityClass: SourceAuthorityClass;
  canonicalLocation: string;
  accessClassification: "public" | "internal" | "restricted";
  jurisdictions: readonly string[];
}
export interface SourceRecord extends SourceRecordInput {
  id: string;
  status: "draft";
  trustStatus: "review_required";
  approvedForUse: false;
}
export interface SourceVersionInput {
  record: SourceRecord;
  versionCode: string;
  publisherReference: string;
  publishedAt: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  applicabilityReference: string;
}
export interface SourceVersion extends SourceVersionInput {
  id: string;
  status: "draft";
}
export interface SourceSnapshotInput {
  version: SourceVersion;
  checksum: string;
  retrievedAt: string;
  payloadReference: string;
  integrityStatus: "verified" | "unknown" | "quarantined";
}
export interface SourceSnapshot extends SourceSnapshotInput {
  id: string;
  status: "captured_unverified";
  immutable: true;
  promotedCurrent: false;
}
export interface SourceFreshnessAssessment {
  snapshotId: string;
  status: SourceFreshnessStatus;
  materialUseAllowed: false;
  reasonCode: "FRESHNESS_REQUIRES_REVIEW" | "STALE_OR_UNKNOWN_SOURCE";
}
export interface SourceCitationSupport {
  id: string;
  sourceSnapshotId: string;
  claimReference: string;
  status: "candidate";
  supportsCanonicalFact: false;
}

export const sourceManagementRuntimePolicy = {
  discoveryEnabled: false,
  externalAcquisitionEnabled: false,
  connectorExecutionEnabled: false,
  parsingDispatchEnabled: false,
  snapshotPromotionEnabled: false,
  refreshJobDispatchEnabled: false,
  sourceDirectRetrievalEnabled: false,
  aiExecutionEnabled: false
} as const;
export const sourceManagementProhibitedActions = [
  "treat_external_content_as_trusted",
  "mutate_source_snapshots",
  "use_latest_fetched_as_current_effective",
  "invent_source_precedence",
  "perform_unapproved_url_fetch",
  "substitute_model_memory_for_source",
  "promote_source_without_review"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isSourceManagementRuntimeEnabled = (): false => false;
export function assertSourceActor(actor: SourceActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("SOURCE_MANAGEMENT_VERIFIED_IDENTITY_REQUIRED");
  if (actor.sourceManagementAuthorization !== "valid") throw new Error("SOURCE_MANAGEMENT_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("SOURCE_MANAGEMENT_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function assertSourceCode(sourceCode: string): void {
  if (!/^[A-Z][A-Z0-9_]{2,}$/.test(sourceCode)) throw new Error("SOURCE_MANAGEMENT_INVALID_STABLE_CODE");
}
export function assertCanonicalLocation(location: string): void {
  let url: URL;
  try { url = new URL(location); } catch { throw new Error("SOURCE_MANAGEMENT_INVALID_CANONICAL_LOCATION"); }
  if (url.protocol !== "https:" || !url.hostname) throw new Error("SOURCE_MANAGEMENT_UNSAFE_CANONICAL_LOCATION");
}
export function createSourceRecord(input: SourceRecordInput): SourceRecord {
  assertSourceCode(input.sourceCode);
  assertCanonicalLocation(input.canonicalLocation);
  return { ...input, id: ref("source-record", input.sourceCode), status: "draft", trustStatus: "review_required", approvedForUse: false };
}
export function createSourceVersion(input: SourceVersionInput): SourceVersion {
  return { ...input, id: ref("source-version", input.record.id + ":" + input.versionCode), status: "draft" };
}
export function captureSourceSnapshot(input: SourceSnapshotInput): SourceSnapshot {
  return { ...input, id: ref("source-snapshot", input.version.id + ":" + input.checksum), status: "captured_unverified", immutable: true, promotedCurrent: false };
}
export function assessSourceFreshness(snapshot: SourceSnapshot, status: SourceFreshnessStatus): SourceFreshnessAssessment {
  return {
    snapshotId: snapshot.id,
    status,
    materialUseAllowed: false,
    reasonCode: status === "current" ? "FRESHNESS_REQUIRES_REVIEW" : "STALE_OR_UNKNOWN_SOURCE"
  };
}
export function createSourceCitationSupport(snapshot: SourceSnapshot, claimReference: string): SourceCitationSupport {
  return { id: ref("source-citation", snapshot.id + ":" + claimReference), sourceSnapshotId: snapshot.id, claimReference, status: "candidate", supportsCanonicalFact: false };
}
export function createSourceRefreshRequest(record: SourceRecord, reasonCode: string) {
  return { id: ref("source-refresh", record.id + ":" + reasonCode), sourceRecordId: record.id, status: "queued_disabled" as const, dispatched: false as const };
}
export function getSourceManagementRuntimeStatus() {
  return { enabled: false as const, policy: sourceManagementRuntimePolicy, activationRequires: ["approved_source_registry", "connector_security_review", "M065_parsing_boundary", "M072_job_controls", "Product Owner authorization"] as const };
}
