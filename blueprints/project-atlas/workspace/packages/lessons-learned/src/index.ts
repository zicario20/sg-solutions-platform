export const LESSONS_LEARNED_MODULE = "M108" as const;
export const LESSONS_LEARNED_PERMISSIONS = ["lessons-learned.system.configure", "lessons-learned.record.create", "lessons-learned.evidence.link", "lessons-learned.review.request", "lessons-learned.action.request", "lessons-learned.runtime.activate"] as const;
export type LessonsLearnedPermission = (typeof LESSONS_LEARNED_PERMISSIONS)[number];
export const LESSONS_LEARNED_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type LessonRecordStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface LessonsLearnedSystem { readonly module: typeof LESSONS_LEARNED_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface LessonRecord { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface LessonEvidence { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface LessonReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface LessonActionRequest { readonly code: string; readonly recordCode: string; readonly action: "practice_or_documentation_change"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface LessonReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: LessonsLearnedPermission): void { if (!LESSONS_LEARNED_PERMISSIONS.includes(value)) throw new Error("Unsupported lessons-learned permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createLessonsLearnedSystem(input: { permission: LessonsLearnedPermission; code: string }): LessonsLearnedSystem {
  permit(input.permission); code(input.code, "lesson candidate system code");
  return { module: LESSONS_LEARNED_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createLessonRecord(input: { permission: LessonsLearnedPermission; code: string; system: LessonsLearnedSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): LessonRecord {
  permit(input.permission); code(input.code, "lesson candidate code"); safeText(input.domain, "lesson candidate domain"); safeText(input.title, "lesson candidate title"); safeText(input.summary, "lesson candidate summary"); ref(input.ownerReference, "lesson candidate owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "lesson candidate source references", true), controlReferences: refs(input.controlReferences ?? [], "lesson candidate control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkLessonEvidence(input: { permission: LessonsLearnedPermission; code: string; record: LessonRecord; reference: string; kind: LessonEvidence["kind"] }): LessonEvidence {
  permit(input.permission); code(input.code, "lesson candidate evidence code"); ref(input.reference, "lesson candidate evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestLessonReview(input: { permission: LessonsLearnedPermission; code: string; record: LessonRecord; reviewerReference: string; reviewKind: LessonReviewRequest["reviewKind"] }): LessonReviewRequest {
  permit(input.permission); code(input.code, "lesson candidate review code"); ref(input.reviewerReference, "lesson candidate reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestLessonAction(input: { permission: LessonsLearnedPermission; code: string; record: LessonRecord; destinationReference: string; preconditionReferences: readonly string[] }): LessonActionRequest {
  permit(input.permission); code(input.code, "lesson candidate action code"); ref(input.destinationReference, "lesson candidate action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "practice_or_documentation_change", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "lesson candidate action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateLessonReadiness(input: { record: LessonRecord }): LessonReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["lessons-learned_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
