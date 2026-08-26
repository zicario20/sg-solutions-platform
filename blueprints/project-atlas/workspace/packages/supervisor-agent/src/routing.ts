import {
  isRiskWithinMaximum,
  isSensitivityWithinMaximum,
  type SpecialistCandidate,
  type SpecialistCandidateEvaluation,
  type SpecialistCandidateExclusion,
  type SpecialistRegistration,
  SUPERVISOR_PROHIBITED_OUTCOMES,
  type SupervisorCandidateExclusionReason,
  type SupervisorRoutingDecision,
  type SupervisorRoutingDecisionStatus,
  type SupervisorRoutingPolicy,
  type SupervisorTaskEnvelope,
} from "./contracts.js";

const HARD_EXCLUSION_REASONS = new Set<SupervisorCandidateExclusionReason>([
  "authentication_required",
  "consent_required",
  "data_sensitivity_exceeded",
  "domain_not_supported",
  "entitlement_required",
  "intent_not_supported",
  "jurisdiction_not_supported",
  "locale_not_supported",
  "outcome_not_supported",
  "prohibited_outcome",
  "registration_not_approved",
  "resource_ownership_not_verified",
  "risk_exceeded",
  "surface_not_supported",
]);

function containsAll(values: readonly string[], expected: readonly string[]): boolean {
  return expected.every((value) => values.includes(value));
}

function collectExclusionReasons(
  task: SupervisorTaskEnvelope,
  registration: SpecialistRegistration,
  jurisdiction: string,
): SupervisorCandidateExclusionReason[] {
  const reasons: SupervisorCandidateExclusionReason[] = [];
  const prohibitedOutcome = task.classification.requestedOutcomes.some((outcome) =>
    (SUPERVISOR_PROHIBITED_OUTCOMES as readonly string[]).includes(outcome),
  );

  if (prohibitedOutcome) reasons.push("prohibited_outcome");
  if (!registration.supportedSurfaces.includes(task.surface)) reasons.push("surface_not_supported");
  if (!containsAll(registration.supportedIntents, task.classification.intents))
    reasons.push("intent_not_supported");
  if (!containsAll(registration.supportedDomains, task.classification.domains))
    reasons.push("domain_not_supported");
  if (!containsAll(registration.supportedOutcomes, task.classification.requestedOutcomes))
    reasons.push("outcome_not_supported");
  if (!isRiskWithinMaximum(task.classification.risk, registration.maximumRisk))
    reasons.push("risk_exceeded");
  if (
    !isSensitivityWithinMaximum(
      task.classification.dataSensitivity,
      registration.maximumDataSensitivity,
    )
  )
    reasons.push("data_sensitivity_exceeded");
  if (!registration.locales.includes(task.locale)) reasons.push("locale_not_supported");
  if (!registration.jurisdictions.includes(jurisdiction))
    reasons.push("jurisdiction_not_supported");
  if (registration.requiresAuthentication && !task.authorization.authenticated)
    reasons.push("authentication_required");
  if (registration.requiresVerifiedOwnership && !task.authorization.resourceOwnershipVerified)
    reasons.push("resource_ownership_not_verified");
  if (registration.requiresConsent && task.authorization.consentReferences.length === 0)
    reasons.push("consent_required");
  if (registration.requiresEntitlement && task.authorization.entitlementReferences.length === 0)
    reasons.push("entitlement_required");
  if (!registration.status.startsWith("approved") && !registration.status.startsWith("released"))
    reasons.push("registration_not_approved");
  if (registration.operationalAvailability !== "available")
    reasons.push("specialist_runtime_disabled");
  return reasons;
}

function candidateScore(
  task: SupervisorTaskEnvelope,
  registration: SpecialistRegistration,
): number {
  const domainScore = task.classification.domains.filter((domain) =>
    registration.supportedDomains.includes(domain),
  ).length;
  const intentScore = task.classification.intents.filter((intent) =>
    registration.supportedIntents.includes(intent),
  ).length;
  return registration.priority * 1_000 + domainScore * 100 + intentScore * 10;
}

export function evaluateSpecialistCandidates(input: {
  readonly task: SupervisorTaskEnvelope;
  readonly specialists: readonly SpecialistRegistration[];
  readonly jurisdiction: string;
  readonly evaluatedAt?: string;
}): SpecialistCandidateEvaluation {
  const candidates: SpecialistCandidate[] = [];
  const exclusions: SpecialistCandidateExclusion[] = [];

  input.specialists.forEach((registration) => {
    const reasons = collectExclusionReasons(input.task, registration, input.jurisdiction);
    const hardExcluded = reasons.some((reason) => HARD_EXCLUSION_REASONS.has(reason));
    if (hardExcluded) {
      exclusions.push({ registrationCode: registration.code, reasons });
      return;
    }

    candidates.push({
      registration,
      score: candidateScore(input.task, registration),
      executionEligible: reasons.length === 0,
      exclusionReasons: reasons,
    });
  });

  candidates.sort(
    (left, right) =>
      right.score - left.score || left.registration.code.localeCompare(right.registration.code),
  );
  return {
    taskId: input.task.id,
    candidates,
    exclusions,
    evaluatedAt: input.evaluatedAt ?? new Date().toISOString(),
  };
}

function determineFallbackStatus(
  task: SupervisorTaskEnvelope,
  policy: SupervisorRoutingPolicy,
): SupervisorRoutingDecisionStatus {
  if (
    task.classification.requestedOutcomes.some((outcome) =>
      (SUPERVISOR_PROHIBITED_OUTCOMES as readonly string[]).includes(outcome),
    )
  )
    return "safe_refusal";
  if (task.classification.ambiguity !== "clear") return "clarification_required";
  return policy.defaultRoute;
}

export function createRoutingDecision(input: {
  readonly task: SupervisorTaskEnvelope;
  readonly candidateEvaluation: SpecialistCandidateEvaluation;
  readonly policy: SupervisorRoutingPolicy;
  readonly createdAt: string;
}): SupervisorRoutingDecision {
  const executionCandidate = input.candidateEvaluation.candidates.find(
    (candidate) => candidate.executionEligible,
  );
  const executionPermitted =
    input.policy.runtimeExecutionEnabled === true && executionCandidate !== undefined;
  const status = executionPermitted ? "routed" : determineFallbackStatus(input.task, input.policy);
  const reasonCodes = executionPermitted
    ? ["deterministic_candidate_selected"]
    : [
        input.candidateEvaluation.candidates.length === 0
          ? "no_eligible_specialist"
          : "supervisor_runtime_disabled",
      ];

  return {
    taskId: input.task.id,
    policyCode: input.policy.code,
    status,
    selectedSpecialistCode: executionPermitted
      ? (executionCandidate?.registration.code ?? null)
      : null,
    candidateCodes: input.candidateEvaluation.candidates.map(
      (candidate) => candidate.registration.code,
    ),
    reasonCodes,
    executionPermitted,
    createdAt: input.createdAt,
  };
}
