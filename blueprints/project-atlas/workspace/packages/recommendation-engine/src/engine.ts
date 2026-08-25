import type {
  CandidateAvailabilityStatus,
  FeatureValue,
  RankedRecommendation,
  RecommendationCandidate,
  RecommendationCandidateSet,
  RecommendationConstraint,
  RecommendationConstraintSet,
  RecommendationOutput,
  RecommendationPolicyVersion,
  RecommendationRequest,
  RecommendationRun,
  RecommendationScore,
  RecommendationSource,
} from "./contracts.ts";

export class RecommendationDomainError extends Error {
  public constructor(
    public readonly code:
      | "INVALID_SOURCE"
      | "INVALID_POLICY"
      | "INVALID_CANDIDATE_SET"
      | "CONSTRAINT_UNKNOWN"
      | "PERSONALIZATION_CONSENT_REQUIRED"
      | "UNSAFE_FEATURE"
      | "INVALID_OVERRIDE"
      | "RUN_NOT_REPRODUCIBLE",
    message: string,
  ) {
    super(message);
    this.name = "RecommendationDomainError";
  }
}

const currentSources = (sources: readonly RecommendationSource[]) =>
  sources.length > 0 &&
  sources.every(
    (source) =>
      source.freshness === "current" &&
      ["domain_verified", "provider_verified", "official_verified"].includes(source.verification),
  );
const unsafeFeature = (featureCode: string) =>
  /(commission|compensation|race|ethnicity|religion|gender|sex|disability|age|nationality|ssn|bank|account|tax_return)/iu.test(
    featureCode,
  );
const isAvailable = (status: CandidateAvailabilityStatus) =>
  status === "available" || status === "limited";
const comparable = (value: FeatureValue, constraint: RecommendationConstraint): boolean | null => {
  if (value === null) return null;
  if (constraint.operator === "equals") return value === constraint.expectedValue;
  if (constraint.operator === "not_equals") return value !== constraint.expectedValue;
  if (constraint.operator === "exists") return value !== null;
  if (constraint.operator === "in")
    return Array.isArray(constraint.expectedValue) && typeof value === "string"
      ? constraint.expectedValue.includes(value)
      : false;
  if (constraint.operator === "not_in")
    return Array.isArray(constraint.expectedValue) && typeof value === "string"
      ? !constraint.expectedValue.includes(value)
      : false;
  if (constraint.operator === "greater_than_or_equal")
    return typeof value === "number" && typeof constraint.expectedValue === "number"
      ? value >= constraint.expectedValue
      : false;
  if (constraint.operator === "less_than_or_equal")
    return typeof value === "number" && typeof constraint.expectedValue === "number"
      ? value <= constraint.expectedValue
      : false;
  return false;
};

export const createRecommendationRequest = (
  input: RecommendationRequest,
): RecommendationRequest => {
  if (
    input.goalCode.length === 0 ||
    input.contextSnapshotId.length === 0 ||
    input.candidateSetId.length === 0
  ) {
    throw new RecommendationDomainError(
      "RUN_NOT_REPRODUCIBLE",
      "A recommendation request needs immutable context and candidate references.",
    );
  }
  return input;
};

export const createRecommendationCandidateSet = (
  input: RecommendationCandidateSet,
): RecommendationCandidateSet => {
  if (
    input.candidates.length === 0 ||
    new Set(input.candidates.map((candidate) => candidate.id)).size !== input.candidates.length ||
    !currentSources(input.sourceSnapshot) ||
    input.candidates.some((candidate) => candidate.domain !== input.domain)
  ) {
    throw new RecommendationDomainError(
      "INVALID_CANDIDATE_SET",
      "Candidate sets need unique candidates and current source lineage.",
    );
  }
  return input;
};

export const publishRecommendationPolicy = (
  input: RecommendationPolicyVersion,
): RecommendationPolicyVersion => {
  if (
    input.status !== "published" ||
    input.approvedBy === null ||
    input.approvedAt === null ||
    !currentSources(input.sources) ||
    input.allowedFeatureCodes.length === 0
  ) {
    throw new RecommendationDomainError(
      "INVALID_POLICY",
      "A published recommendation policy requires approval, sources and allowed features.",
    );
  }
  if (input.allowedFeatureCodes.some(unsafeFeature)) {
    throw new RecommendationDomainError(
      "UNSAFE_FEATURE",
      "Policies cannot use sensitive or compensation features.",
    );
  }
  for (const [featureCode, weight] of Object.entries(input.featureWeights)) {
    if (
      unsafeFeature(featureCode) ||
      !input.allowedFeatureCodes.includes(featureCode) ||
      !Number.isFinite(weight) ||
      weight < 0 ||
      weight > 1
    ) {
      throw new RecommendationDomainError(
        "UNSAFE_FEATURE",
        "Policies cannot use sensitive or compensation features and weights must be bounded.",
      );
    }
  }
  return input;
};

export const publishRecommendationConstraintSet = (
  input: RecommendationConstraintSet,
): RecommendationConstraintSet => {
  if (
    input.status !== "published" ||
    !currentSources(input.sources) ||
    input.constraints.length === 0 ||
    input.constraints.some(
      (constraint) => constraint.explanation.length === 0 || unsafeFeature(constraint.featureCode),
    )
  ) {
    throw new RecommendationDomainError(
      "INVALID_POLICY",
      "Published constraint sets need reviewed sources and non-sensitive constraints.",
    );
  }
  return input;
};

export const createRecommendationRun = (input: RecommendationRun): RecommendationRun => {
  if (
    input.status !== "draft" ||
    input.candidateSetSnapshot.domain !== input.domain ||
    input.contextSnapshot.domain !== input.domain ||
    input.constraintSetSnapshot.domain !== input.domain
  ) {
    throw new RecommendationDomainError(
      "RUN_NOT_REPRODUCIBLE",
      "Recommendation run snapshots must share the request domain and draft state.",
    );
  }
  createRecommendationCandidateSet(input.candidateSetSnapshot);
  publishRecommendationConstraintSet(input.constraintSetSnapshot);
  return input;
};

export const evaluateCandidateGate = (
  candidate: RecommendationCandidate,
): Readonly<{ allowed: boolean; reason: string }> => {
  if (
    !["eligible", "potentially_eligible", "requires_manual_review"].includes(
      candidate.eligibilityStatus,
    )
  ) {
    return { allowed: false, reason: "candidate_not_eligible_under_source_rules" };
  }
  if (!isAvailable(candidate.availabilityStatus)) {
    return { allowed: false, reason: "candidate_not_available" };
  }
  if (["disabled", "suspended"].includes(candidate.providerStatus)) {
    return { allowed: false, reason: "provider_not_active" };
  }
  if (!candidate.disclosureAvailable || !currentSources(candidate.sources)) {
    return { allowed: false, reason: "candidate_disclosure_or_source_unavailable" };
  }
  return { allowed: true, reason: "candidate_gate_passed" };
};

export const evaluateCandidateConstraints = (
  candidate: RecommendationCandidate,
  constraintSet: RecommendationConstraintSet,
): Readonly<{
  hardStatus: "passed" | "failed" | "unknown";
  softReasons: readonly string[];
}> => {
  const softReasons: string[] = [];
  let unknownHard = false;
  for (const constraint of constraintSet.constraints) {
    const result = comparable(candidate.features[constraint.featureCode] ?? null, constraint);
    if (constraint.type === "hard") {
      if (result === null) unknownHard = true;
      else if (!result) return { hardStatus: "failed", softReasons };
    } else if (result !== true) {
      softReasons.push(constraint.explanation);
    }
  }
  return { hardStatus: unknownHard ? "unknown" : "passed", softReasons };
};

const normalize = (value: FeatureValue): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(100, Math.max(0, value));
  if (typeof value === "boolean") return value ? 100 : 0;
  return null;
};

const scoreCandidate = (
  candidate: RecommendationCandidate,
  policy: RecommendationPolicyVersion,
  hardStatus: RecommendationScore["hardConstraintStatus"],
  softReasons: readonly string[],
): RecommendationScore => {
  const featureContributions: {
    featureCode: string;
    normalizedValue: number;
    weightedValue: number;
  }[] = [];
  for (const featureCode of policy.allowedFeatureCodes) {
    const normalizedValue = normalize(candidate.features[featureCode] ?? null);
    const weight = policy.featureWeights[featureCode] ?? 0;
    if (normalizedValue !== null && weight > 0) {
      featureContributions.push({
        featureCode,
        normalizedValue,
        weightedValue: normalizedValue * weight,
      });
    }
  }
  const score =
    featureContributions.length === 0
      ? 0
      : Math.round(
          featureContributions.reduce(
            (total, contribution) => total + contribution.weightedValue,
            0,
          ) * 100,
        ) / 100;
  return {
    candidateId: candidate.id,
    score,
    featureContributions,
    hardConstraintStatus: hardStatus,
    softConstraintReasons: softReasons,
    warnings: [
      ...(candidate.eligibilityStatus === "requires_manual_review"
        ? ["manual_review_required"]
        : []),
      ...(candidate.availabilityStatus === "limited" ? ["limited_availability"] : []),
    ],
  };
};

const rankBand = (score: RecommendationScore): RankedRecommendation["band"] =>
  score.hardConstraintStatus !== "passed" || score.warnings.includes("manual_review_required")
    ? "manual_review"
    : score.score >= 75
      ? "strong"
      : score.score >= 45
        ? "viable"
        : "limited";

export const generateRecommendationOutput = (
  input: Readonly<{
    id: string;
    run: RecommendationRun;
    policy: RecommendationPolicyVersion;
    now: string;
    expiresAt: string | null;
  }>,
): RecommendationOutput => {
  if (
    input.run.status !== "draft" ||
    input.run.policyVersionId !== input.policy.id ||
    input.run.candidateSetSnapshot.domain !== input.policy.domain ||
    input.run.contextSnapshot.domain !== input.policy.domain ||
    input.run.constraintSetSnapshot.domain !== input.policy.domain
  ) {
    throw new RecommendationDomainError(
      "RUN_NOT_REPRODUCIBLE",
      "The run must contain immutable snapshots that match the published policy.",
    );
  }
  const run = createRecommendationRun(input.run);
  publishRecommendationPolicy(input.policy);
  const rankable = run.candidateSetSnapshot.candidates
    .filter((candidate) => evaluateCandidateGate(candidate).allowed)
    .map((candidate) => {
      const constraints = evaluateCandidateConstraints(candidate, run.constraintSetSnapshot);
      return { candidate, constraints };
    })
    .filter((entry) => entry.constraints.hardStatus === "passed")
    .map((entry) => ({
      candidate: entry.candidate,
      score: scoreCandidate(
        entry.candidate,
        input.policy,
        entry.constraints.hardStatus,
        entry.constraints.softReasons,
      ),
    }))
    .sort(
      (left, right) =>
        right.score.score - left.score.score || left.candidate.id.localeCompare(right.candidate.id),
    );
  if (rankable.length === 0) {
    return {
      id: input.id,
      runId: input.run.id,
      status: "no_suitable_candidate",
      rankedCandidates: [],
      primaryCandidateId: null,
      warnings: ["no_candidate_passed_current_gate_and_constraints"],
      explanation:
        "No candidate is being recommended. This does not change eligibility or create a provider decision.",
      createdAt: input.now,
      expiresAt: input.expiresAt,
    };
  }
  const rankedCandidates: RankedRecommendation[] = rankable.map((entry, index) => ({
    candidateId: entry.candidate.id,
    rank: index + 1,
    score: entry.score,
    band: rankBand(entry.score),
    shortExplanation: "Ranked from the policy's permitted, source-backed inputs.",
    detailedExplanation:
      "This ranking is decision support only. Eligibility, provider terms and external approvals remain with their authoritative source.",
    confidence:
      entry.score.featureContributions.length === input.policy.allowedFeatureCodes.length
        ? "high"
        : entry.score.featureContributions.length > 0
          ? "medium"
          : "low",
    alternatives: rankable
      .filter((alternative) => alternative.candidate.id !== entry.candidate.id)
      .slice(0, 3)
      .map((alternative) => alternative.candidate.id),
  }));
  const first = rankedCandidates[0];
  if (first === undefined) {
    throw new RecommendationDomainError(
      "RUN_NOT_REPRODUCIBLE",
      "A non-empty ranking must contain a first candidate.",
    );
  }
  const second = rankedCandidates[1];
  const multipleGood =
    second !== undefined && Math.abs(first.score.score - second.score.score) <= 5;
  return {
    id: input.id,
    runId: input.run.id,
    status: multipleGood
      ? "multiple_good_options"
      : first.band === "manual_review"
        ? "manual_review_required"
        : "recommendations_available",
    rankedCandidates,
    primaryCandidateId: multipleGood || first.band === "manual_review" ? null : first.candidateId,
    warnings: rankedCandidates.flatMap((candidate) => candidate.score.warnings),
    explanation:
      "Recommendations are based on reviewed policy inputs and do not represent an approval, underwriting, provider decision or required client choice.",
    createdAt: input.now,
    expiresAt: input.expiresAt,
  };
};
