export type RecommendationSource = Readonly<{
  sourceId: string;
  sourceType: "domain" | "provider" | "official" | "client_preference" | "human_review" | "system";
  observedAt: string;
  verification:
    | "unverified"
    | "client_declared"
    | "domain_verified"
    | "provider_verified"
    | "official_verified"
    | "stale";
  freshness: "current" | "aging" | "stale" | "unknown";
}>;

export type RecommendationDomain =
  | "marketplace"
  | "business_funding"
  | "home_buying"
  | "business_formation"
  | "credit"
  | "tax"
  | "general";
export type RecommendationRequestStatus =
  | "draft"
  | "ready"
  | "running"
  | "completed"
  | "blocked"
  | "failed"
  | "expired";
export type CandidateEligibilityStatus =
  | "eligible"
  | "potentially_eligible"
  | "requires_manual_review"
  | "missing_information"
  | "not_eligible_under_current_rules"
  | "not_available"
  | "provider_suspended"
  | "unknown";
export type CandidateAvailabilityStatus =
  | "available"
  | "limited"
  | "waitlist"
  | "unavailable"
  | "stale"
  | "unknown";
export type FeatureValue = string | number | boolean | null;

export type RecommendationRequest = Readonly<{
  id: string;
  clientId: string | null;
  domain: RecommendationDomain;
  goalCode: string;
  status: RecommendationRequestStatus;
  contextSnapshotId: string;
  candidateSetId: string;
  constraintSetId: string;
  policyVersionId: string;
  personalizationConsentId: string | null;
  createdAt: string;
  expiresAt: string | null;
}>;

export type RecommendationContextSnapshot = Readonly<{
  id: string;
  domain: RecommendationDomain;
  purpose: "recommendation" | "personalization" | "what_if";
  facts: Readonly<Record<string, FeatureValue>>;
  sources: readonly RecommendationSource[];
  consentId: string | null;
  createdAt: string;
  expiresAt: string | null;
}>;

export type RecommendationCandidate = Readonly<{
  id: string;
  sourceReference: string;
  domain: RecommendationDomain;
  eligibilityStatus: CandidateEligibilityStatus;
  availabilityStatus: CandidateAvailabilityStatus;
  providerStatus: "active" | "limited" | "disabled" | "suspended" | "not_applicable";
  disclosureAvailable: boolean;
  features: Readonly<Record<string, FeatureValue>>;
  sources: readonly RecommendationSource[];
}>;

export type RecommendationCandidateSet = Readonly<{
  id: string;
  domain: RecommendationDomain;
  version: number;
  candidates: readonly RecommendationCandidate[];
  sourceSnapshot: readonly RecommendationSource[];
  createdAt: string;
}>;

export type RecommendationObjectiveProfile = Readonly<{
  id: string;
  domain: RecommendationDomain;
  version: number;
  goals: readonly Readonly<{ code: string; weight: number }>[];
  status: "draft" | "published" | "retired";
  sources: readonly RecommendationSource[];
}>;

export type RecommendationPreferenceProfile = Readonly<{
  id: string;
  clientId: string;
  consentId: string;
  status: "active" | "withdrawn" | "expired";
  explicitPreferences: Readonly<Record<string, FeatureValue>>;
  derivedPreferences: Readonly<Record<string, FeatureValue>>;
  createdAt: string;
  expiresAt: string | null;
  withdrawnAt: string | null;
}>;

export type RecommendationConstraint = Readonly<{
  id: string;
  code: string;
  type: "hard" | "soft";
  featureCode: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than_or_equal"
    | "less_than_or_equal"
    | "exists";
  expectedValue: string | number | boolean | readonly string[];
  explanation: string;
}>;

export type RecommendationConstraintSet = Readonly<{
  id: string;
  domain: RecommendationDomain;
  version: number;
  constraints: readonly RecommendationConstraint[];
  status: "draft" | "published" | "retired";
  sources: readonly RecommendationSource[];
}>;

export type RecommendationPolicyVersion = Readonly<{
  id: string;
  policyId: string;
  domain: RecommendationDomain;
  version: number;
  featureWeights: Readonly<Record<string, number>>;
  allowedFeatureCodes: readonly string[];
  tieBreakOrder: readonly ("availability" | "source_quality" | "candidate_id")[];
  status: "draft" | "published" | "paused" | "retired";
  sources: readonly RecommendationSource[];
  approvedBy: string | null;
  approvedAt: string | null;
}>;

export type RecommendationScore = Readonly<{
  candidateId: string;
  score: number;
  featureContributions: readonly Readonly<{
    featureCode: string;
    normalizedValue: number;
    weightedValue: number;
  }>[];
  hardConstraintStatus: "passed" | "failed" | "unknown";
  softConstraintReasons: readonly string[];
  warnings: readonly string[];
}>;

export type RecommendationRun = Readonly<{
  id: string;
  requestId: string;
  domain: RecommendationDomain;
  policyVersionId: string;
  candidateSetSnapshot: RecommendationCandidateSet;
  contextSnapshot: RecommendationContextSnapshot;
  constraintSetSnapshot: RecommendationConstraintSet;
  status: "draft" | "completed" | "blocked" | "failed" | "invalidated";
  createdAt: string;
  completedAt: string | null;
  invalidatedAt: string | null;
}>;

export type RankedRecommendation = Readonly<{
  candidateId: string;
  rank: number;
  score: RecommendationScore;
  band: "strong" | "viable" | "limited" | "manual_review";
  shortExplanation: string;
  detailedExplanation: string;
  confidence: "high" | "medium" | "low";
  alternatives: readonly string[];
}>;

export type RecommendationOutput = Readonly<{
  id: string;
  runId: string;
  status:
    | "recommendations_available"
    | "multiple_good_options"
    | "no_suitable_candidate"
    | "manual_review_required"
    | "expired";
  rankedCandidates: readonly RankedRecommendation[];
  primaryCandidateId: string | null;
  warnings: readonly string[];
  explanation: string;
  createdAt: string;
  expiresAt: string | null;
}>;

export type RecommendationClientDecision = Readonly<{
  id: string;
  outputId: string;
  clientId: string;
  decision:
    | "selected_recommended"
    | "selected_alternative"
    | "declined_all"
    | "saved_for_later"
    | "requested_human_review";
  candidateId: string | null;
  createdAt: string;
}>;

export type RecommendationSpecialistReview = Readonly<{
  id: string;
  outputId: string;
  reviewerId: string;
  decision:
    | "approved_as_presented"
    | "block_recommendation"
    | "reorder_existing_candidates"
    | "request_more_information";
  candidateOrder: readonly string[];
  reason: string;
  createdAt: string;
}>;

export type RecommendationFeedback = Readonly<{
  id: string;
  outputId: string;
  clientId: string | null;
  type: "helpful" | "not_helpful" | "irrelevant" | "selected" | "complaint";
  detail: string | null;
  createdAt: string;
}>;

export type RecommendationExperiment = Readonly<{
  id: string;
  domain: RecommendationDomain;
  policyVersionId: string;
  status: "draft" | "approved" | "running" | "paused" | "stopped" | "completed";
  guardrails: readonly Readonly<{ metric: string; maximum: number }>[];
  approvedBy: string | null;
  approvedAt: string | null;
}>;

export type RecommendationFairnessReview = Readonly<{
  id: string;
  runId: string | null;
  policyVersionId: string;
  status: "not_required" | "pending" | "passed" | "finding_created" | "blocked";
  protectedOrProxyFeaturesDetected: readonly string[];
  reviewerId: string | null;
  reviewedAt: string | null;
  notes: string;
}>;

export type RecommendationAiExplanation = Readonly<{
  id: string;
  outputId: string;
  sourceIds: readonly string[];
  claims: readonly Readonly<{ text: string; sourceId: string }>[];
  content: string;
  status: "draft" | "requires_review" | "approved" | "rejected";
  createdAt: string;
}>;

export type RecommendationClientProjection = Readonly<{
  locale: "en" | "es";
  status: string;
  primary: Readonly<{ candidateId: string; explanation: string; confidence: string }> | null;
  alternatives: readonly Readonly<{ candidateId: string; explanation: string }>[];
  notice: string;
}>;
