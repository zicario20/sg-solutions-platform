export type ComplianceReviewKind = "action_gate" | "claim_review" | "disclosure_review" | "exception_review" | "release_review";
export type ComplianceSourceFreshness = "current" | "stale" | "unknown";

export interface ComplianceActorContext {
  actorId: string;
  actorType: "staff" | "service";
  identityAssurance: "verified" | "unverified";
  complianceAuthorization: "valid" | "missing" | "expired";
  purposeAuthorization: "valid" | "missing" | "expired";
}
export interface ComplianceSourceReference {
  sourceId: string;
  sourceVersionId: string;
  policyReference: string;
  freshness: ComplianceSourceFreshness;
  classification: "public" | "internal" | "restricted";
}
export interface ComplianceReviewSessionInput {
  correlationId: string;
  reviewKind: ComplianceReviewKind;
  subjectType: "service_order" | "case" | "claim" | "disclosure" | "release";
  subjectId: string;
  actor: ComplianceActorContext;
  sourceReferences: readonly ComplianceSourceReference[];
}
export interface ComplianceReviewSession extends ComplianceReviewSessionInput {
  id: string;
  status: "opened";
  runtimeMode: "provider_disabled";
  createdAt: string;
}
export interface ComplianceControlAssessmentInput {
  session: ComplianceReviewSession;
  controlCode: string;
  deterministicProhibition: boolean;
  requiresHumanDecision: boolean;
  evidenceReferences: readonly string[];
}
export interface ComplianceControlAssessment {
  id: string;
  controlCode: string;
  status: "blocked" | "review_required";
  reasonCode: "EXPLICIT_CURRENT_POLICY_BLOCK" | "HUMAN_DECISION_REQUIRED" | "SOURCE_STALE_OR_UNKNOWN" | "NO_DEFINITIVE_AUTOMATION";
  legalConclusion: false;
  policyDecision: false;
  sourceFreshness: ComplianceSourceFreshness;
  externalActionAuthorized: false;
}
export interface ComplianceFindingCandidate {
  id: string;
  sessionId: string;
  signalType: "control_gap" | "information_missing" | "policy_conflict" | "potential_risk";
  evidenceReferences: readonly string[];
  status: "candidate";
  confirmedViolation: false;
  requiresHumanReview: true;
}

export const complianceReviewerRuntimePolicy = {
  sourceLookupEnabled: false,
  policyEvaluationExecutionEnabled: false,
  semanticReviewEnabled: false,
  holdDispatchEnabled: false,
  exceptionApprovalEnabled: false,
  releaseActionEnabled: false,
  externalNotificationEnabled: false,
  aiExecutionEnabled: false
} as const;
export const complianceReviewerProhibitedActions = [
  "create_or_modify_canonical_policy",
  "make_legal_conclusion",
  "confirm_fraud_or_criminality",
  "self_approve_exception",
  "authorize_release",
  "bypass_human_or_external_controls",
  "dispatch_external_action"
] as const;

const ref = (kind: string, value: string) => kind + ":" + value;
export const isComplianceReviewerRuntimeEnabled = (): false => false;
export function assertComplianceReviewActor(actor: ComplianceActorContext): void {
  if (actor.identityAssurance !== "verified") throw new Error("COMPLIANCE_REVIEWER_VERIFIED_IDENTITY_REQUIRED");
  if (actor.complianceAuthorization !== "valid") throw new Error("COMPLIANCE_REVIEWER_AUTHORIZATION_REQUIRED");
  if (actor.purposeAuthorization !== "valid") throw new Error("COMPLIANCE_REVIEWER_PURPOSE_AUTHORIZATION_REQUIRED");
}
export function sourceFreshnessOf(sources: readonly ComplianceSourceReference[]): ComplianceSourceFreshness {
  if (sources.some((source) => source.freshness === "stale")) return "stale";
  if (sources.some((source) => source.freshness === "unknown")) return "unknown";
  return sources.length === 0 ? "unknown" : "current";
}
export function createComplianceReviewSession(input: ComplianceReviewSessionInput): ComplianceReviewSession {
  assertComplianceReviewActor(input.actor);
  return { ...input, id: ref("compliance-review", input.correlationId), status: "opened", runtimeMode: "provider_disabled", createdAt: new Date().toISOString() };
}
export function assessComplianceControl(input: ComplianceControlAssessmentInput): ComplianceControlAssessment {
  const freshness = sourceFreshnessOf(input.session.sourceReferences);
  const block = input.deterministicProhibition && freshness === "current";
  return {
    id: ref("control-assessment", input.session.id + ":" + input.controlCode),
    controlCode: input.controlCode,
    status: block ? "blocked" : "review_required",
    reasonCode: block ? "EXPLICIT_CURRENT_POLICY_BLOCK" : input.requiresHumanDecision ? "HUMAN_DECISION_REQUIRED" : freshness === "current" ? "NO_DEFINITIVE_AUTOMATION" : "SOURCE_STALE_OR_UNKNOWN",
    legalConclusion: false,
    policyDecision: false,
    sourceFreshness: freshness,
    externalActionAuthorized: false
  };
}
export function createComplianceFindingCandidate(
  session: ComplianceReviewSession,
  signalType: ComplianceFindingCandidate["signalType"],
  evidenceReferences: readonly string[]
): ComplianceFindingCandidate {
  return { id: ref("finding-candidate", session.id + ":" + signalType), sessionId: session.id, signalType, evidenceReferences, status: "candidate", confirmedViolation: false, requiresHumanReview: true };
}
export function requestComplianceExceptionReview(session: ComplianceReviewSession, exceptionCode: string) {
  return { id: ref("exception-review", session.id + ":" + exceptionCode), status: "review_required" as const, exceptionGranted: false as const, releaseAuthorized: false as const, requiredApprovals: ["human_compliance_reviewer"] as const };
}
export function getComplianceReviewerRuntimeStatus() {
  return { enabled: false as const, policy: complianceReviewerRuntimePolicy, activationRequires: ["canonical_policy_and_source_boundaries", "human_approval_policy", "immutable_audit_and_retention_controls", "Product Owner authorization"] as const };
}
