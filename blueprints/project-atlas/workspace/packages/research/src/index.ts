export const RESEARCH_MODULE = "M106" as const;
export const RESEARCH_PERMISSIONS = ["research.system.configure", "research.record.create", "research.evidence.link", "research.review.request", "research.action.request", "research.runtime.activate"] as const;
export type ResearchPermission = (typeof RESEARCH_PERMISSIONS)[number];
export const RESEARCH_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type ResearchRecordStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface ResearchSystem { readonly module: typeof RESEARCH_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface ResearchRecord { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface ResearchEvidence { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface ResearchReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface ResearchActionRequest { readonly code: string; readonly recordCode: string; readonly action: "synthesis_or_publication"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface ResearchReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: ResearchPermission): void { if (!RESEARCH_PERMISSIONS.includes(value)) throw new Error("Unsupported research permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createResearchSystem(input: { permission: ResearchPermission; code: string }): ResearchSystem {
  permit(input.permission); code(input.code, "research record system code");
  return { module: RESEARCH_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createResearchRecord(input: { permission: ResearchPermission; code: string; system: ResearchSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): ResearchRecord {
  permit(input.permission); code(input.code, "research record code"); safeText(input.domain, "research record domain"); safeText(input.title, "research record title"); safeText(input.summary, "research record summary"); ref(input.ownerReference, "research record owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "research record source references", true), controlReferences: refs(input.controlReferences ?? [], "research record control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkResearchEvidence(input: { permission: ResearchPermission; code: string; record: ResearchRecord; reference: string; kind: ResearchEvidence["kind"] }): ResearchEvidence {
  permit(input.permission); code(input.code, "research record evidence code"); ref(input.reference, "research record evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestResearchReview(input: { permission: ResearchPermission; code: string; record: ResearchRecord; reviewerReference: string; reviewKind: ResearchReviewRequest["reviewKind"] }): ResearchReviewRequest {
  permit(input.permission); code(input.code, "research record review code"); ref(input.reviewerReference, "research record reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestResearchAction(input: { permission: ResearchPermission; code: string; record: ResearchRecord; destinationReference: string; preconditionReferences: readonly string[] }): ResearchActionRequest {
  permit(input.permission); code(input.code, "research record action code"); ref(input.destinationReference, "research record action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "synthesis_or_publication", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "research record action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateResearchReadiness(input: { record: ResearchRecord }): ResearchReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["research_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
