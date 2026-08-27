import type {
  MarketplaceCandidateSet,
  MarketplaceCandidateSetInput,
  MarketplaceListingReference,
  MarketplaceListingReferenceInput,
  MarketplaceNeutralityAssessment,
  MarketplaceNeutralityAssessmentInput,
  MarketplaceReferralIntent,
  MarketplaceReferralIntentInput,
  MarketplaceSession,
  MarketplaceSessionInput,
  MarketplaceSpecialistHandoff,
  MarketplaceSpecialistHandoffInput,
} from "./contracts.ts";
import { assertMarketplaceAccess } from "./policy.ts";

export function createMarketplaceSession(input: MarketplaceSessionInput): MarketplaceSession {
  assertMarketplaceAccess(input);

  return {
    ...input,
    status: "authorized",
    personalizationMode:
      input.surface === "public" ? "public_generic" : "reference_only_authorized",
    providerAccess: "disabled",
    recommendationExecutionAccess: "disabled",
    referralAccess: "disabled",
    redirectAccess: "disabled",
    applicationAccess: "disabled",
    commissionAccess: "disabled",
  };
}

export function registerMarketplaceListingReference(
  input: MarketplaceListingReferenceInput,
): MarketplaceListingReference {
  if (input.rawClientContextIncluded || input.providerCredentialIncluded) {
    throw new Error(
      "Raw client context and provider credentials are not accepted by the controlled marketplace foundation.",
    );
  }

  return {
    ...input,
    storageMode: "reference_only",
    rawClientContextStored: false,
    providerCredentialStored: false,
    providerLookupPerformed: false,
  };
}

export function createMarketplaceCandidateSet(
  input: MarketplaceCandidateSetInput,
): MarketplaceCandidateSet {
  if (input.rawSensitiveContextIncluded) {
    throw new Error("Marketplace candidate sets cannot accept raw sensitive context.");
  }
  if (input.compensationInfluencedCoreFitScore) {
    throw new Error("Partner compensation cannot influence a marketplace core-fit score.");
  }
  if (
    input.sponsoredListingReferenceIds.length > 0 &&
    !input.sponsorshipDisclosureLabelsPresent
  ) {
    throw new Error("Sponsored marketplace listings require visible disclosure labels.");
  }

  return {
    ...input,
    status: "candidate_only",
    recommendationIssued: false,
    eligibilityDetermined: false,
    providerApprovalInferred: false,
    compensationInfluencedCoreFitScore: false,
    clientFitScoreCalculated: false,
  };
}

export function assessMarketplaceNeutrality(
  input: MarketplaceNeutralityAssessmentInput,
): MarketplaceNeutralityAssessment {
  const reasonCodes: string[] = [];

  if (
    input.sponsoredListingReferenceIds.length > 0 &&
    !input.sponsorshipDisclosureLabelsPresent
  ) {
    reasonCodes.push("sponsorship_disclosure_required");
  }
  if (!input.materiallyRelevantAlternativeCoveragePresent) {
    reasonCodes.push("materially_relevant_alternative_coverage_required");
  }

  if (reasonCodes.length > 0) {
    return {
      candidateSetId: input.candidateSetId,
      status: "blocked",
      reasonCodes,
      sponsoredPlacementPermitted: false,
      recommendationPermitted: false,
    };
  }

  return {
    candidateSetId: input.candidateSetId,
    status: "review_required",
    reasonCodes: [
      "marketplace_recommendation_execution_disabled",
      "human_specialist_review_required",
    ],
    sponsoredPlacementPermitted: false,
    recommendationPermitted: false,
  };
}

export function createMarketplaceReferralIntent(
  input: MarketplaceReferralIntentInput,
): MarketplaceReferralIntent {
  const reasonCodes: string[] = [];

  if (!input.disclosureAccepted) {
    reasonCodes.push("marketplace_disclosure_acceptance_required");
  }
  if (!input.consentCurrent) {
    reasonCodes.push("current_marketplace_consent_required");
  }
  if (input.specialistReviewRequired) {
    reasonCodes.push("human_marketplace_specialist_review_required");
  }

  if (reasonCodes.length > 0) {
    return {
      ...input,
      status: "blocked",
      reasonCodes,
      redirectGenerated: false,
      referralCreated: false,
      applicationStarted: false,
      providerStatusInferred: false,
    };
  }

  return {
    ...input,
    status: "review_required",
    reasonCodes: [
      "provider_redirect_disabled",
      "provider_referral_creation_disabled",
      "manual_controlled_workflow_required",
    ],
    redirectGenerated: false,
    referralCreated: false,
    applicationStarted: false,
    providerStatusInferred: false,
  };
}

export function createMarketplaceSpecialistHandoff(
  input: MarketplaceSpecialistHandoffInput,
): MarketplaceSpecialistHandoff {
  if (input.reason.trim().length === 0) {
    throw new Error("Marketplace specialist handoff requires a review reason.");
  }

  return {
    ...input,
    route: "human_marketplace_specialist_review",
    dispatchPermitted: false,
    externalActionPermitted: false,
  };
}
