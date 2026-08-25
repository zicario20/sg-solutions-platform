import type { RecommendationClientProjection, RecommendationOutput } from "./contracts.ts";

export const createRecommendationClientProjection = (
  output: RecommendationOutput,
  locale: "en" | "es",
): RecommendationClientProjection => {
  const primary =
    output.primaryCandidateId === null
      ? null
      : (output.rankedCandidates.find(
          (candidate) => candidate.candidateId === output.primaryCandidateId,
        ) ?? null);
  return {
    locale,
    status:
      locale === "es"
        ? output.status === "no_suitable_candidate"
          ? "No hay una recomendación disponible"
          : "Opciones para revisar"
        : output.status === "no_suitable_candidate"
          ? "No recommendation is available"
          : "Options to review",
    primary:
      primary === null
        ? null
        : {
            candidateId: primary.candidateId,
            explanation: primary.shortExplanation,
            confidence: primary.confidence,
          },
    alternatives: output.rankedCandidates
      .filter((candidate) => candidate.candidateId !== output.primaryCandidateId)
      .slice(0, 3)
      .map((candidate) => ({
        candidateId: candidate.candidateId,
        explanation: candidate.shortExplanation,
      })),
    notice:
      locale === "es"
        ? "Esta información es apoyo para tu decisión. La elegibilidad, los términos y las decisiones externas pertenecen a sus fuentes autorizadas."
        : "This information supports your decision. Eligibility, terms and external decisions remain with their authorized sources.",
  };
};
