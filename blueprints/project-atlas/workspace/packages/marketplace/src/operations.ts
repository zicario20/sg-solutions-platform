import { MarketplaceDomainError } from "./catalog.ts";
import type {
  MarketplaceConsent,
  MarketplaceJourney,
  MarketplaceProviderProfile,
  MarketplaceSourceReference,
} from "./contracts.ts";

export type MarketplaceAiSuggestion = Readonly<{
  id: string;
  purpose:
    | "explain_listing"
    | "explain_disclosure"
    | "identify_missing_information"
    | "draft_support_response";
  listingVersionId: string;
  sources: readonly MarketplaceSourceReference[];
  output: string;
  status: "draft" | "requires_review" | "approved" | "rejected";
  createdAt: string;
}>;

export const MARKETPLACE_WORK_QUEUES = [
  "provider_verification",
  "listing_review",
  "consent_review",
  "referral_exception",
  "commission_review",
  "provider_status_reconciliation",
] as const;

export const canShareMarketplaceData = (
  input: Readonly<{
    provider: MarketplaceProviderProfile;
    consent: MarketplaceConsent;
    requestedCategories: readonly string[];
    now: string;
  }>,
) =>
  ({
    allowed: false,
    reason:
      input.provider.status !== "enabled"
        ? "provider_disabled"
        : input.consent.status !== "accepted" ||
            input.consent.acceptedAt === null ||
            (input.consent.expiresAt !== null && input.consent.expiresAt <= input.now)
          ? "consent_inactive"
          : input.requestedCategories.some(
                (category) => !input.consent.dataCategories.includes(category),
              )
            ? "outside_consent_scope"
            : "external_data_sharing_not_activated",
  }) as const;

export const createGroundedMarketplaceAiSuggestion = (
  input: MarketplaceAiSuggestion,
): MarketplaceAiSuggestion => {
  if (input.sources.length === 0 || input.status === "approved") {
    throw new MarketplaceDomainError(
      "INVALID_SOURCE",
      "Marketplace AI output needs sources and human review and cannot self-approve.",
    );
  }
  return { ...input, status: "requires_review" };
};

export const assertMarketplaceRankingSafe = (
  input: Readonly<{
    rankingCriteria: readonly string[];
    protectedOrSensitiveCriteria: readonly string[];
    compensationInfluenced: boolean;
    sponsoredClearlyLabeled: boolean;
  }>,
) => {
  if (input.protectedOrSensitiveCriteria.length > 0 || input.rankingCriteria.length === 0) {
    throw new MarketplaceDomainError(
      "UNSAFE_PERSONALIZATION",
      "Marketplace ranking requires explainable non-sensitive criteria.",
    );
  }
  if (input.compensationInfluenced && !input.sponsoredClearlyLabeled) {
    throw new MarketplaceDomainError(
      "UNSAFE_PERSONALIZATION",
      "Compensation-influenced placement must be clearly disclosed.",
    );
  }
  return { allowed: true as const };
};

export const expireMarketplaceJourney = (
  journey: MarketplaceJourney,
  now: string,
): MarketplaceJourney =>
  journey.expiresAt !== null && journey.expiresAt <= now
    ? { ...journey, status: "expired", updatedAt: now }
    : journey;
