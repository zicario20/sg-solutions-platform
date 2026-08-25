import type {
  RecommendationAiExplanation,
  RecommendationClientDecision,
  RecommendationExperiment,
  RecommendationFairnessReview,
  RecommendationOutput,
  RecommendationPreferenceProfile,
  RecommendationSpecialistReview,
} from "./contracts.ts";
import { RecommendationDomainError } from "./engine.ts";

const unsafeFeature = (feature: string) =>
  /(commission|compensation|race|ethnicity|religion|gender|sex|disability|age|nationality|ssn|bank|account|tax_return)/iu.test(
    feature,
  );

export const createRecommendationPreferenceProfile = (
  input: RecommendationPreferenceProfile,
  consentActive: boolean,
): RecommendationPreferenceProfile => {
  if (
    input.status !== "active" ||
    !consentActive ||
    input.consentId.length === 0 ||
    Object.keys(input.derivedPreferences).some(unsafeFeature) ||
    Object.keys(input.explicitPreferences).some(unsafeFeature)
  ) {
    throw new RecommendationDomainError(
      "PERSONALIZATION_CONSENT_REQUIRED",
      "Personalization needs active consent and cannot contain sensitive or compensation preferences.",
    );
  }
  return input;
};

export const withdrawRecommendationPersonalization = (
  profile: RecommendationPreferenceProfile,
  now: string,
): RecommendationPreferenceProfile => ({
  ...profile,
  status: "withdrawn",
  derivedPreferences: {},
  withdrawnAt: now,
});

export const createRecommendationExperiment = (
  input: RecommendationExperiment,
): RecommendationExperiment => {
  if (
    input.status !== "draft" ||
    input.guardrails.length === 0 ||
    input.guardrails.some(
      (guardrail) => guardrail.metric.length === 0 || !Number.isFinite(guardrail.maximum),
    )
  ) {
    throw new RecommendationDomainError(
      "INVALID_POLICY",
      "Experiments need draft status and explicit numerical guardrails.",
    );
  }
  return input;
};

export const startRecommendationExperiment = (
  experiment: RecommendationExperiment,
  now: string,
): RecommendationExperiment => {
  if (
    experiment.status !== "approved" ||
    experiment.approvedBy === null ||
    experiment.approvedAt === null ||
    experiment.approvedAt > now
  ) {
    throw new RecommendationDomainError(
      "INVALID_POLICY",
      "Only a human-approved experiment may start.",
    );
  }
  return { ...experiment, status: "running" };
};

export const evaluateRecommendationFairness = (
  input: RecommendationFairnessReview,
): RecommendationFairnessReview => ({
  ...input,
  status:
    input.protectedOrProxyFeaturesDetected.length > 0
      ? "finding_created"
      : input.status === "pending"
        ? "passed"
        : input.status,
  notes:
    input.protectedOrProxyFeaturesDetected.length > 0
      ? "Human compliance review is required; this is not an automated legal conclusion."
      : input.notes,
});

export const createRecommendationClientDecision = (
  input: RecommendationClientDecision,
  output: RecommendationOutput,
): RecommendationClientDecision => {
  if (
    input.outputId !== output.id ||
    (input.candidateId !== null &&
      !output.rankedCandidates.some((candidate) => candidate.candidateId === input.candidateId))
  ) {
    throw new RecommendationDomainError(
      "INVALID_OVERRIDE",
      "A client decision may reference only candidates from the original output.",
    );
  }
  return input;
};

export const applyRecommendationSpecialistReview = (
  input: RecommendationSpecialistReview,
  output: RecommendationOutput,
): RecommendationSpecialistReview => {
  const known = new Set(output.rankedCandidates.map((candidate) => candidate.candidateId));
  if (
    input.outputId !== output.id ||
    input.reason.length === 0 ||
    input.candidateOrder.some((candidateId) => !known.has(candidateId))
  ) {
    throw new RecommendationDomainError(
      "INVALID_OVERRIDE",
      "Specialist review preserves the original candidate set and cannot override eligibility.",
    );
  }
  return input;
};

export const createGroundedRecommendationAiExplanation = (
  input: RecommendationAiExplanation,
  output: RecommendationOutput,
  allowedSourceIds: readonly string[],
): RecommendationAiExplanation => {
  if (
    input.outputId !== output.id ||
    input.status === "approved" ||
    input.sourceIds.length === 0 ||
    input.claims.length === 0 ||
    input.sourceIds.some((sourceId) => !allowedSourceIds.includes(sourceId)) ||
    input.claims.some(
      (claim) =>
        claim.text.length === 0 ||
        !input.sourceIds.includes(claim.sourceId) ||
        !allowedSourceIds.includes(claim.sourceId),
    )
  ) {
    throw new RecommendationDomainError(
      "INVALID_SOURCE",
      "AI explanations must cite approved run sources and cannot self-approve.",
    );
  }
  return { ...input, status: "requires_review" };
};
