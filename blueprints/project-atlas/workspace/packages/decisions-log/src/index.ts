export const DECISIONS_LOG_MODULE = "M105" as const;
export const DECISIONS_LOG_PERMISSIONS = ["decisions-log.system.configure", "decisions-log.record.create", "decisions-log.evidence.link", "decisions-log.review.request", "decisions-log.action.request", "decisions-log.runtime.activate"] as const;
export type DecisionsLogPermission = (typeof DECISIONS_LOG_PERMISSIONS)[number];
export const DECISIONS_LOG_RUNTIME = { registryWrites: false, evidenceFetch: false, reviewAutomation: false, canonicalDocumentWrites: false, externalWrites: false, notifications: false, events: false, providerConnections: false, automation: false } as const;

export type DecisionRecordStatus = "draft" | "review_required" | "deferred" | "archived" | "superseded";
export interface DecisionsLogSystem { readonly module: typeof DECISIONS_LOG_MODULE; readonly code: string; readonly status: "draft"; readonly active: false; readonly runtimeEnabled: false; readonly canOverrideAuthority: false; }
export interface DecisionRecord { readonly code: string; readonly systemCode: string; readonly version: 1; readonly domain: string; readonly title: string; readonly summary: string; readonly ownerReference: string; readonly sourceReferences: readonly string[]; readonly controlReferences: readonly string[]; readonly status: "review_required"; readonly sourceAuthorityChanged: false; readonly changeApplied: false; readonly activated: false; }
export interface DecisionEvidence { readonly code: string; readonly recordCode: string; readonly reference: string; readonly kind: "research" | "technical" | "operational" | "security" | "privacy" | "compliance" | "financial" | "unknown"; readonly verificationStatus: "unverified"; readonly fetchExecuted: false; readonly acceptedAsFact: false; }
export interface DecisionReviewRequest { readonly code: string; readonly recordCode: string; readonly reviewerReference: string; readonly reviewKind: "product_owner" | "architecture" | "security" | "privacy" | "compliance" | "operations" | "domain"; readonly status: "review_required"; readonly assigned: false; readonly completed: false; }
export interface DecisionActionRequest { readonly code: string; readonly recordCode: string; readonly action: "outcome_or_implementation"; readonly destinationReference: string; readonly preconditionReferences: readonly string[]; readonly status: "review_required"; readonly executed: false; readonly outcomeKnown: false; }
export interface DecisionReadinessResult { readonly recordCode: string; readonly ready: false; readonly status: "not_ready"; readonly reasons: readonly string[]; }

function permit(value: DecisionsLogPermission): void { if (!DECISIONS_LOG_PERMISSIONS.includes(value)) throw new Error("Unsupported decisions-log permission."); }
function code(value: string, field: string): void { if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(field + " must be a stable safe identifier."); }
function ref(value: string, field: string): void { if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(field + " must be a safe reference."); }
function refs(values: readonly string[], field: string, required = false): readonly string[] { if (required && values.length === 0) throw new Error(field + " requires at least one reference."); for (const value of values) ref(value, field); return [...new Set(values)]; }
function safeText(value: string, field: string): void { if (!value.trim() || /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|chain[\s-]?of[\s-]?thought)/iu.test(value)) throw new Error(field + " cannot be empty or contain credentials/private reasoning."); }

export function createDecisionsLogSystem(input: { permission: DecisionsLogPermission; code: string }): DecisionsLogSystem {
  permit(input.permission); code(input.code, "decision proposal system code");
  return { module: DECISIONS_LOG_MODULE, code: input.code, status: "draft", active: false, runtimeEnabled: false, canOverrideAuthority: false };
}
export function createDecisionRecord(input: { permission: DecisionsLogPermission; code: string; system: DecisionsLogSystem; domain: string; title: string; summary: string; ownerReference: string; sourceReferences: readonly string[]; controlReferences?: readonly string[] }): DecisionRecord {
  permit(input.permission); code(input.code, "decision proposal code"); safeText(input.domain, "decision proposal domain"); safeText(input.title, "decision proposal title"); safeText(input.summary, "decision proposal summary"); ref(input.ownerReference, "decision proposal owner reference");
  return { code: input.code, systemCode: input.system.code, version: 1, domain: input.domain, title: input.title, summary: input.summary, ownerReference: input.ownerReference, sourceReferences: refs(input.sourceReferences, "decision proposal source references", true), controlReferences: refs(input.controlReferences ?? [], "decision proposal control references"), status: "review_required", sourceAuthorityChanged: false, changeApplied: false, activated: false };
}
export function linkDecisionEvidence(input: { permission: DecisionsLogPermission; code: string; record: DecisionRecord; reference: string; kind: DecisionEvidence["kind"] }): DecisionEvidence {
  permit(input.permission); code(input.code, "decision proposal evidence code"); ref(input.reference, "decision proposal evidence reference");
  return { code: input.code, recordCode: input.record.code, reference: input.reference, kind: input.kind, verificationStatus: "unverified", fetchExecuted: false, acceptedAsFact: false };
}
export function requestDecisionReview(input: { permission: DecisionsLogPermission; code: string; record: DecisionRecord; reviewerReference: string; reviewKind: DecisionReviewRequest["reviewKind"] }): DecisionReviewRequest {
  permit(input.permission); code(input.code, "decision proposal review code"); ref(input.reviewerReference, "decision proposal reviewer reference");
  return { code: input.code, recordCode: input.record.code, reviewerReference: input.reviewerReference, reviewKind: input.reviewKind, status: "review_required", assigned: false, completed: false };
}
export function requestDecisionAction(input: { permission: DecisionsLogPermission; code: string; record: DecisionRecord; destinationReference: string; preconditionReferences: readonly string[] }): DecisionActionRequest {
  permit(input.permission); code(input.code, "decision proposal action code"); ref(input.destinationReference, "decision proposal action destination reference");
  return { code: input.code, recordCode: input.record.code, action: "outcome_or_implementation", destinationReference: input.destinationReference, preconditionReferences: refs(input.preconditionReferences, "decision proposal action precondition references", true), status: "review_required", executed: false, outcomeKnown: false };
}
export function evaluateDecisionReadiness(input: { record: DecisionRecord }): DecisionReadinessResult {
  return { recordCode: input.record.code, ready: false, status: "not_ready", reasons: ["decisions-log_runtime_disabled", "human_review_and_authority_required", "evidence_unverified", "canonical_source_not_updated", "no_external_action_authorized", "activation_and_rollback_evidence_required"] };
}
