export const CHANGELOG_MODULE = "M109" as const;
export const CHANGELOG_PERMISSIONS = ["changelog.system.configure", "changelog.record.create", "changelog.evidence.link", "changelog.review.request", "changelog.action.request", "changelog.runtime.activate"] as const;
export type ChangelogPermission = (typeof CHANGELOG_PERMISSIONS)[number];
export const CHANGELOG_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type ChangelogEntryStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface ChangelogSystem { readonly module: typeof CHANGELOG_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface ChangelogEntry { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface ChangelogVerificationReference { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface ChangelogReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface ChangelogActionRequest { readonly code: string; readonly recordCode: string; readonly action: "publication_correction_or_retraction"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface ChangelogReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: ChangelogPermission): void { if (!CHANGELOG_PERMISSIONS.includes(value)) throw new Error("Unsupported changelog permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createChangelogSystem(input: { permission: ChangelogPermission; code: string }): ChangelogSystem {
  permit(input.permission); code(input.code, "changelog entry draft system code");
  return { module: CHANGELOG_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createChangelogEntry(input: { permission: ChangelogPermission; code: string; system: ChangelogSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): ChangelogEntry {
  permit(input.permission); code(input.code, "changelog entry draft code"); safeText(input.domain, "changelog entry draft domain"); safeText(input.title, "changelog entry draft title"); safeText(input.summary, "changelog entry draft summary"); ref(input.ownerReference, "changelog entry draft owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "changelog entry draft source references", true), controlReferences: refs(input.controlReferences ?? [], "changelog entry draft control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkChangelogVerification(input: { permission: ChangelogPermission; code: string; record: ChangelogEntry; reference: string; kind: ChangelogVerificationReference["kind"] }): ChangelogVerificationReference {
  permit(input.permission); code(input.code, "changelog entry draft evidence code"); ref(input.reference, "changelog entry draft evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestChangelogReview(input: { permission: ChangelogPermission; code: string; record: ChangelogEntry; reviewerReference: string; reviewKind: ChangelogReviewRequest["reviewKind"] }): ChangelogReviewRequest {
  permit(input.permission); code(input.code, "changelog entry draft review code"); ref(input.reviewerReference, "changelog entry draft reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestChangelogAction(input: { permission: ChangelogPermission; code: string; record: ChangelogEntry; destinationReference: string; preconditionReferences: readonly string[] }): ChangelogActionRequest {
  permit(input.permission); code(input.code, "changelog entry draft action code"); ref(input.destinationReference, "changelog entry draft action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "publication_correction_or_retraction", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "changelog entry draft action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateChangelogReadiness(input: { record: ChangelogEntry }): ChangelogReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["changelog_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
