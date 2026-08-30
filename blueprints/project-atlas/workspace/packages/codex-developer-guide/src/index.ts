export const CODEX_DEVELOPER_GUIDE_MODULE = "M110" as const;
export const CODEX_DEVELOPER_GUIDE_PERMISSIONS = ["codex-developer-guide.system.configure", "codex-developer-guide.record.create", "codex-developer-guide.evidence.link", "codex-developer-guide.review.request", "codex-developer-guide.action.request", "codex-developer-guide.runtime.activate"] as const;
export type CodexDeveloperGuidePermission = (typeof CODEX_DEVELOPER_GUIDE_PERMISSIONS)[number];
export const CODEX_DEVELOPER_GUIDE_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type DeveloperGuideSectionStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface CodexDeveloperGuideSystem { readonly module: typeof CODEX_DEVELOPER_GUIDE_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface DeveloperGuideSection { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface DeveloperGuideReference { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface DeveloperGuideReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface DeveloperGuideActionRequest { readonly code: string; readonly recordCode: string; readonly action: "guide_publication_or_tooling_change"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface DeveloperGuideReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: CodexDeveloperGuidePermission): void { if (!CODEX_DEVELOPER_GUIDE_PERMISSIONS.includes(value)) throw new Error("Unsupported codex-developer-guide permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createCodexDeveloperGuideSystem(input: { permission: CodexDeveloperGuidePermission; code: string }): CodexDeveloperGuideSystem {
  permit(input.permission); code(input.code, "developer-guide section system code");
  return { module: CODEX_DEVELOPER_GUIDE_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createDeveloperGuideSection(input: { permission: CodexDeveloperGuidePermission; code: string; system: CodexDeveloperGuideSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): DeveloperGuideSection {
  permit(input.permission); code(input.code, "developer-guide section code"); safeText(input.domain, "developer-guide section domain"); safeText(input.title, "developer-guide section title"); safeText(input.summary, "developer-guide section summary"); ref(input.ownerReference, "developer-guide section owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "developer-guide section source references", true), controlReferences: refs(input.controlReferences ?? [], "developer-guide section control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkDeveloperGuideReference(input: { permission: CodexDeveloperGuidePermission; code: string; record: DeveloperGuideSection; reference: string; kind: DeveloperGuideReference["kind"] }): DeveloperGuideReference {
  permit(input.permission); code(input.code, "developer-guide section evidence code"); ref(input.reference, "developer-guide section evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestDeveloperGuideReview(input: { permission: CodexDeveloperGuidePermission; code: string; record: DeveloperGuideSection; reviewerReference: string; reviewKind: DeveloperGuideReviewRequest["reviewKind"] }): DeveloperGuideReviewRequest {
  permit(input.permission); code(input.code, "developer-guide section review code"); ref(input.reviewerReference, "developer-guide section reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestDeveloperGuideAction(input: { permission: CodexDeveloperGuidePermission; code: string; record: DeveloperGuideSection; destinationReference: string; preconditionReferences: readonly string[] }): DeveloperGuideActionRequest {
  permit(input.permission); code(input.code, "developer-guide section action code"); ref(input.destinationReference, "developer-guide section action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "guide_publication_or_tooling_change", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "developer-guide section action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateDeveloperGuideReadiness(input: { record: DeveloperGuideSection }): DeveloperGuideReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["codex-developer-guide_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
