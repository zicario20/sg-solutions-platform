export const EXPERIMENTS_MODULE = "M107" as const;
export const EXPERIMENTS_PERMISSIONS = ["experiments.system.configure", "experiments.record.create", "experiments.evidence.link", "experiments.review.request", "experiments.action.request", "experiments.runtime.activate"] as const;
export type ExperimentsPermission = (typeof EXPERIMENTS_PERMISSIONS)[number];
export const EXPERIMENTS_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type ExperimentRecordStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface ExperimentsSystem { readonly module: typeof EXPERIMENTS_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface ExperimentRecord { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface ExperimentEvidence { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface ExperimentReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface ExperimentActionRequest { readonly code: string; readonly recordCode: string; readonly action: "start_pause_close_or_rollback"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface ExperimentReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: ExperimentsPermission): void { if (!EXPERIMENTS_PERMISSIONS.includes(value)) throw new Error("Unsupported experiments permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createExperimentsSystem(input: { permission: ExperimentsPermission; code: string }): ExperimentsSystem {
  permit(input.permission); code(input.code, "experiment proposal system code");
  return { module: EXPERIMENTS_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createExperimentRecord(input: { permission: ExperimentsPermission; code: string; system: ExperimentsSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): ExperimentRecord {
  permit(input.permission); code(input.code, "experiment proposal code"); safeText(input.domain, "experiment proposal domain"); safeText(input.title, "experiment proposal title"); safeText(input.summary, "experiment proposal summary"); ref(input.ownerReference, "experiment proposal owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "experiment proposal source references", true), controlReferences: refs(input.controlReferences ?? [], "experiment proposal control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkExperimentEvidence(input: { permission: ExperimentsPermission; code: string; record: ExperimentRecord; reference: string; kind: ExperimentEvidence["kind"] }): ExperimentEvidence {
  permit(input.permission); code(input.code, "experiment proposal evidence code"); ref(input.reference, "experiment proposal evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestExperimentReview(input: { permission: ExperimentsPermission; code: string; record: ExperimentRecord; reviewerReference: string; reviewKind: ExperimentReviewRequest["reviewKind"] }): ExperimentReviewRequest {
  permit(input.permission); code(input.code, "experiment proposal review code"); ref(input.reviewerReference, "experiment proposal reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestExperimentAction(input: { permission: ExperimentsPermission; code: string; record: ExperimentRecord; destinationReference: string; preconditionReferences: readonly string[] }): ExperimentActionRequest {
  permit(input.permission); code(input.code, "experiment proposal action code"); ref(input.destinationReference, "experiment proposal action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "start_pause_close_or_rollback", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "experiment proposal action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateExperimentReadiness(input: { record: ExperimentRecord }): ExperimentReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["experiments_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
