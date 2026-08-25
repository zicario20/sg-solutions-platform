import type {
  FundingApplication,
  FundingCommission,
  FundingConfirmation,
  FundingConsent,
  FundingDisclosure,
  FundingPostFundingPlan,
  FundingSourceReference,
} from "./contracts.ts";
import { FundingDomainError } from "./service.ts";

export type FundingDisclosurePresentation = Readonly<{
  id: string;
  fundingCaseId: string;
  disclosureId: string;
  disclosureVersion: string;
  presentedTo: string;
  presentedAt: string;
  channel: "portal" | "email" | "secure_link" | "staff_assisted";
  acknowledgmentRequired: boolean;
  acknowledgedAt: string | null;
}>;

export type FundingRecommendation = Readonly<{
  id: string;
  fundingCaseId: string;
  recommendationType: "system_ranked" | "specialist_recommended" | "client_preference_sorted";
  recommendedOfferIds: readonly string[];
  rankingCriteria: readonly string[];
  reasoningSummary: string;
  riskFlags: readonly string[];
  sourceReferences: readonly FundingSourceReference[];
  createdBy: "system" | "staff" | "ai";
  createdAt: string;
}>;

export type FundingFollowUp = Readonly<{
  id: string;
  fundingCaseId: string;
  stage: "preparation" | "application" | "offer" | "post_funding" | "decline_recovery";
  nextAction: string;
  dueAt: string | null;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}>;

export const presentFundingDisclosure = (
  input: FundingDisclosurePresentation,
  disclosure: FundingDisclosure,
  now: string,
): FundingDisclosurePresentation => {
  if (
    disclosure.status !== "active" ||
    disclosure.id !== input.disclosureId ||
    disclosure.version !== input.disclosureVersion ||
    disclosure.effectiveFrom > now ||
    (disclosure.effectiveTo !== null && disclosure.effectiveTo <= now)
  ) {
    throw new FundingDomainError(
      "CONSENT_REQUIRED",
      "Only an active, effective disclosure version can be presented for acknowledgment.",
    );
  }
  return input;
};

export const withdrawFundingConsent = (consent: FundingConsent, now: string): FundingConsent => {
  if (consent.status !== "accepted") {
    throw new FundingDomainError(
      "CONSENT_INACTIVE",
      "Only accepted funding consent can be withdrawn.",
    );
  }
  return { ...consent, status: "withdrawn", withdrawnAt: now };
};

export const createFundingRecommendation = (
  input: FundingRecommendation,
): FundingRecommendation => {
  if (
    input.recommendedOfferIds.length === 0 ||
    input.sourceReferences.length === 0 ||
    input.rankingCriteria.length === 0 ||
    input.reasoningSummary.length === 0
  ) {
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Funding recommendations need candidates, explained criteria and source lineage.",
    );
  }
  if (input.createdBy === "ai") {
    throw new FundingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "AI may draft a funding recommendation but cannot publish it as a recommendation.",
    );
  }
  return input;
};

export const recordFundingConfirmation = (
  input: FundingConfirmation,
  application: FundingApplication,
): FundingConfirmation => {
  if (
    input.applicationId !== application.id ||
    input.providerId !== application.providerId ||
    input.providerReference.length === 0 ||
    input.verifiedAt.length === 0
  ) {
    throw new FundingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Funding confirmation must be verified against the specific provider application.",
    );
  }
  return input;
};

export const createPostFundingPlan = (
  input: FundingPostFundingPlan,
  confirmation: FundingConfirmation,
): FundingPostFundingPlan => {
  if (
    input.fundingCaseId !== confirmation.fundingCaseId ||
    input.fundingConfirmationId !== confirmation.id
  ) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "Post-funding plans must be tied to a verified funding confirmation.",
    );
  }
  return input;
};

export const createFundingCommission = (input: FundingCommission): FundingCommission => {
  if (input.status === "earned" || input.status === "paid") {
    throw new FundingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Commission recognition requires separate verified partner reconciliation, not a funding case update.",
    );
  }
  return input;
};
