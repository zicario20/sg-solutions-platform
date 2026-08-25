import type {
  MarketplaceAvailability,
  MarketplaceCategory,
  MarketplaceEligibilityContext,
  MarketplaceListing,
  MarketplaceListingVersion,
  MarketplaceMatch,
  MarketplacePotentialFit,
  MarketplaceProviderProfile,
  MarketplaceSourceReference,
} from "./contracts.ts";

export class MarketplaceDomainError extends Error {
  public constructor(
    public readonly code:
      | "INVALID_SOURCE"
      | "INVALID_VERSION"
      | "PROVIDER_DISABLED"
      | "LISTING_UNAVAILABLE"
      | "CONSENT_REQUIRED"
      | "UNSAFE_PERSONALIZATION"
      | "INVALID_COMPARISON",
    message: string,
  ) {
    super(message);
    this.name = "MarketplaceDomainError";
  }
}

const sourcesCurrent = (sources: readonly MarketplaceSourceReference[]) =>
  sources.length > 0 &&
  sources.every(
    (source) =>
      source.freshness === "current" &&
      (source.verification === "reviewed" ||
        source.verification === "provider_verified" ||
        source.verification === "official_verified"),
  );

export const createMarketplaceProviderProfile = (
  input: MarketplaceProviderProfile,
): MarketplaceProviderProfile => {
  if (input.status === "enabled") {
    throw new MarketplaceDomainError(
      "PROVIDER_DISABLED",
      "Marketplace providers cannot be enabled without a separately authorized activation.",
    );
  }
  if (!sourcesCurrent(input.sources)) {
    throw new MarketplaceDomainError(
      "INVALID_SOURCE",
      "A provider profile needs current reviewed sources.",
    );
  }
  return input;
};

export const publishMarketplaceListing = (
  listing: MarketplaceListing,
  version: MarketplaceListingVersion,
  provider: MarketplaceProviderProfile,
  now: string,
): MarketplaceListing => {
  if (
    listing.id !== version.listingId ||
    listing.providerId !== provider.id ||
    version.status !== "published" ||
    version.reviewedAt === null ||
    version.reviewedAt > now ||
    !sourcesCurrent(version.sourceSnapshot) ||
    provider.status !== "approved_not_enabled"
  ) {
    throw new MarketplaceDomainError(
      "LISTING_UNAVAILABLE",
      "Only reviewed listings from approved providers may be published.",
    );
  }
  return {
    ...listing,
    status: "limited",
    currentVersionId: version.id,
    updatedAt: now,
  };
};

export const evaluateMarketplaceAvailability = (
  input: Readonly<{
    listingVersion: MarketplaceListingVersion;
    provider: MarketplaceProviderProfile;
    state: string | null;
    audience: string | null;
    now: string;
  }>,
): MarketplaceAvailability => {
  const unavailable =
    input.listingVersion.status !== "published" ||
    !sourcesCurrent(input.listingVersion.sourceSnapshot) ||
    input.listingVersion.effectiveFrom > input.now ||
    (input.listingVersion.effectiveTo !== null && input.listingVersion.effectiveTo <= input.now);
  const status = unavailable ? "stale" : "provider_disabled";
  return {
    listingVersionId: input.listingVersion.id,
    status,
    states: input.state === null ? [] : [input.state],
    audiences: input.audience === null ? [] : [input.audience],
    availableFrom: input.listingVersion.effectiveFrom,
    availableTo: input.listingVersion.effectiveTo,
    sourceSnapshot: input.listingVersion.sourceSnapshot,
    evaluatedAt: input.now,
  };
};

export const createMarketplaceEligibilityContext = (
  input: MarketplaceEligibilityContext,
  personalizationConsentActive: boolean,
): MarketplaceEligibilityContext => {
  if (
    input.purpose === "personalization" &&
    (input.clientId === null || input.consentId === null || !personalizationConsentActive)
  ) {
    throw new MarketplaceDomainError(
      "CONSENT_REQUIRED",
      "Personalization needs current, scoped client consent.",
    );
  }
  if (input.purpose !== "anonymous_browse" && input.sources.length === 0) {
    throw new MarketplaceDomainError(
      "INVALID_SOURCE",
      "Authenticated marketplace context needs source lineage.",
    );
  }
  return input;
};

export const createMarketplaceMatch = (
  input: Readonly<{
    id: string;
    listingVersionId: string;
    context: MarketplaceEligibilityContext;
    availability: MarketplaceAvailability;
    reasons: readonly string[];
    unknownFactors: readonly string[];
    rankingVersion: string;
    protectedOrSensitiveFactors: readonly string[];
    expiresAt: string | null;
  }>,
): MarketplaceMatch => {
  if (input.protectedOrSensitiveFactors.length > 0) {
    throw new MarketplaceDomainError(
      "UNSAFE_PERSONALIZATION",
      "Marketplace matching cannot use protected or sensitive factors.",
    );
  }
  const potentialFit: MarketplacePotentialFit =
    input.availability.status !== "available" && input.availability.status !== "limited"
      ? "not_available"
      : input.unknownFactors.length > 0
        ? "needs_information"
        : input.reasons.length === 0
          ? "manual_review"
          : "potential_fit";
  return {
    id: input.id,
    listingVersionId: input.listingVersionId,
    contextId: input.context.id,
    potentialFit,
    reasons: input.reasons,
    unknownFactors: input.unknownFactors,
    rankingVersion: input.rankingVersion,
    personalizationUsed: input.context.purpose === "personalization",
    explanation:
      "This is an informational potential-fit result. The provider determines availability, eligibility, terms and decisions.",
    expiresAt: input.expiresAt,
  };
};

export const createMarketplaceCategory = (input: MarketplaceCategory): MarketplaceCategory => {
  if (
    input.code.length === 0 ||
    input.translations.en.name.length === 0 ||
    input.translations.es.name.length === 0
  ) {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "Marketplace categories need stable codes and English and Spanish labels.",
    );
  }
  return input;
};

export const validateMarketplaceComparison = (
  listingVersionIds: readonly string[],
): readonly string[] => {
  if (
    listingVersionIds.length < 2 ||
    new Set(listingVersionIds).size !== listingVersionIds.length
  ) {
    throw new MarketplaceDomainError(
      "INVALID_COMPARISON",
      "Comparisons require at least two distinct listing versions.",
    );
  }
  return listingVersionIds;
};
