import {
  applyRecommendationSpecialistReview,
  createGroundedRecommendationAiExplanation,
  createRecommendationCandidateSet,
  createRecommendationPreferenceProfile,
  evaluateCandidateConstraints,
  evaluateCandidateGate,
  evaluateRecommendationFairness,
  generateRecommendationOutput,
  publishRecommendationPolicy,
  type RecommendationCandidateSet,
  type RecommendationConstraintSet,
  type RecommendationContextSnapshot,
  RecommendationDomainError,
  type RecommendationPolicyVersion,
  type RecommendationRun,
  type RecommendationSource,
  withdrawRecommendationPersonalization,
} from "@atlas/recommendation-engine";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source: RecommendationSource = {
  sourceId: "domain-source-38",
  sourceType: "domain",
  observedAt: now,
  verification: "domain_verified",
  freshness: "current",
};

function policy(): RecommendationPolicyVersion {
  return publishRecommendationPolicy({
    id: "policy-version-38",
    policyId: "policy-38",
    domain: "business_funding",
    version: 1,
    featureWeights: { provider_quality: 0.6, availability_quality: 0.4 },
    allowedFeatureCodes: ["provider_quality", "availability_quality"],
    tieBreakOrder: ["availability", "source_quality", "candidate_id"],
    status: "published",
    sources: [source],
    approvedBy: "reviewer-38",
    approvedAt: now,
  });
}

function context(): RecommendationContextSnapshot {
  return {
    id: "context-38",
    domain: "business_funding",
    purpose: "recommendation",
    facts: { state: "IL" },
    sources: [source],
    consentId: null,
    createdAt: now,
    expiresAt: null,
  };
}

function candidateSet(): RecommendationCandidateSet {
  return createRecommendationCandidateSet({
    id: "candidate-set-38",
    domain: "business_funding",
    version: 1,
    candidates: [
      {
        id: "candidate-a",
        sourceReference: "funding-source-a",
        domain: "business_funding",
        eligibilityStatus: "potentially_eligible",
        availabilityStatus: "available",
        providerStatus: "not_applicable",
        disclosureAvailable: true,
        features: { state: "IL", provider_quality: 90, availability_quality: 80 },
        sources: [source],
      },
      {
        id: "candidate-unavailable",
        sourceReference: "funding-source-b",
        domain: "business_funding",
        eligibilityStatus: "eligible",
        availabilityStatus: "unavailable",
        providerStatus: "not_applicable",
        disclosureAvailable: true,
        features: { state: "IL", provider_quality: 100, availability_quality: 100 },
        sources: [source],
      },
      {
        id: "candidate-unknown-hard",
        sourceReference: "funding-source-c",
        domain: "business_funding",
        eligibilityStatus: "eligible",
        availabilityStatus: "available",
        providerStatus: "not_applicable",
        disclosureAvailable: true,
        features: { provider_quality: 75, availability_quality: 75 },
        sources: [source],
      },
    ],
    sourceSnapshot: [source],
    createdAt: now,
  });
}

function constraints(): RecommendationConstraintSet {
  return {
    id: "constraints-38",
    domain: "business_funding",
    version: 1,
    constraints: [
      {
        id: "hard-state",
        code: "STATE_IL",
        type: "hard",
        featureCode: "state",
        operator: "equals",
        expectedValue: "IL",
        explanation: "Only candidates valid for the selected state are included.",
      },
      {
        id: "soft-quality",
        code: "QUALITY_GOAL",
        type: "soft",
        featureCode: "provider_quality",
        operator: "greater_than_or_equal",
        expectedValue: 85,
        explanation: "Provider quality information is below the preferred threshold.",
      },
    ],
    status: "published",
    sources: [source],
  };
}

function run(): RecommendationRun {
  return {
    id: "run-38",
    requestId: "request-38",
    domain: "business_funding",
    policyVersionId: "policy-version-38",
    candidateSetSnapshot: candidateSet(),
    contextSnapshot: context(),
    constraintSetSnapshot: constraints(),
    status: "draft",
    createdAt: now,
    completedAt: null,
    invalidatedAt: null,
  };
}

describe("M038 Recommendation Engine", () => {
  it("uses source eligibility gates and fails closed on unknown hard constraints", () => {
    const set = candidateSet();

    expect(evaluateCandidateGate(set.candidates[1])).toMatchObject({
      allowed: false,
      reason: "candidate_not_available",
    });
    expect(evaluateCandidateConstraints(set.candidates[2], constraints()).hardStatus).toBe(
      "unknown",
    );
    expect(evaluateCandidateConstraints(set.candidates[0], constraints()).hardStatus).toBe(
      "passed",
    );
  });

  it("produces a reproducible ranking without treating it as an approval", () => {
    const output = generateRecommendationOutput({
      id: "output-38",
      run: run(),
      policy: policy(),
      now,
      expiresAt: "2026-08-26T00:00:00.000Z",
    });

    expect(output.primaryCandidateId).toBe("candidate-a");
    expect(output.rankedCandidates).toHaveLength(1);
    expect(output.explanation).toContain("not represent an approval");
  });

  it("rejects compensation and sensitive attributes as scoring features", () => {
    expect(() =>
      publishRecommendationPolicy({
        ...policy(),
        id: "unsafe-policy-38",
        featureWeights: { compensation_amount: 1 },
        allowedFeatureCodes: ["compensation_amount"],
      }),
    ).toThrow("sensitive or compensation");
  });

  it("withdraws personalization and preserves human and AI governance boundaries", () => {
    const profile = createRecommendationPreferenceProfile(
      {
        id: "preference-38",
        clientId: "client-38",
        consentId: "consent-38",
        status: "active",
        explicitPreferences: { speed: "important" },
        derivedPreferences: { provider_quality: "preferred" },
        createdAt: now,
        expiresAt: null,
        withdrawnAt: null,
      },
      true,
    );
    const output = generateRecommendationOutput({
      id: "output-38",
      run: run(),
      policy: policy(),
      now,
      expiresAt: null,
    });

    expect(withdrawRecommendationPersonalization(profile, now)).toMatchObject({
      status: "withdrawn",
      derivedPreferences: {},
    });
    expect(() =>
      applyRecommendationSpecialistReview(
        {
          id: "review-38",
          outputId: output.id,
          reviewerId: "reviewer-38",
          decision: "reorder_existing_candidates",
          candidateOrder: ["invented-candidate"],
          reason: "unsupported",
          createdAt: now,
        },
        output,
      ),
    ).toThrow(RecommendationDomainError);
    expect(
      createGroundedRecommendationAiExplanation(
        {
          id: "ai-38",
          outputId: output.id,
          sourceIds: [source.sourceId],
          claims: [{ text: "policy-grounded explanation", sourceId: source.sourceId }],
          content: "Draft explanation",
          status: "draft",
          createdAt: now,
        },
        output,
        [source.sourceId],
      ).status,
    ).toBe("requires_review");
    expect(
      evaluateRecommendationFairness({
        id: "fairness-38",
        runId: output.runId,
        policyVersionId: "policy-version-38",
        status: "pending",
        protectedOrProxyFeaturesDetected: ["suspected_proxy"],
        reviewerId: null,
        reviewedAt: null,
        notes: "",
      }).status,
    ).toBe("finding_created");
  });
});
