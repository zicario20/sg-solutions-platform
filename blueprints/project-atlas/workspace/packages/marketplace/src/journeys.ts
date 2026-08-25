import { MarketplaceDomainError } from "./catalog.ts";
import type {
  MarketplaceCommission,
  MarketplaceCommissionAdjustment,
  MarketplaceConsent,
  MarketplaceConversion,
  MarketplaceJourney,
  MarketplacePartnerAction,
  MarketplaceProviderProfile,
} from "./contracts.ts";

export const createMarketplaceJourney = (
  input: MarketplaceJourney,
  existingJourneys: readonly MarketplaceJourney[],
): MarketplaceJourney => {
  if (existingJourneys.some((journey) => journey.idempotencyKey === input.idempotencyKey)) {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "A marketplace journey with this idempotency key already exists.",
    );
  }
  return input;
};

export const assessMarketplaceHandoff = (
  _input: Readonly<{
    journey: MarketplaceJourney;
    provider: MarketplaceProviderProfile;
    consent: MarketplaceConsent | null;
    now: string;
  }>,
): Readonly<{ ready: boolean; status: MarketplaceJourney["status"]; reason: string }> => {
  return { ready: false, status: "provider_disabled", reason: "provider_disabled" };
};

export const submitMarketplaceReferral = (
  journey: MarketplaceJourney,
  provider: MarketplaceProviderProfile,
  consent: MarketplaceConsent,
  now: string,
): MarketplaceJourney => {
  const readiness = assessMarketplaceHandoff({ journey, provider, consent, now });
  if (!readiness.ready) {
    throw new MarketplaceDomainError(
      readiness.status === "provider_disabled" ? "PROVIDER_DISABLED" : "CONSENT_REQUIRED",
      "Marketplace referral handoff is not authorized.",
    );
  }
  throw new MarketplaceDomainError(
    "PROVIDER_DISABLED",
    "External marketplace referral submission remains disabled until an approved adapter is activated.",
  );
};

export const createSafeMarketplaceRedirect = (
  _input: Readonly<{
    journey: MarketplaceJourney;
    provider: MarketplaceProviderProfile;
    consent: MarketplaceConsent;
    url: string;
    now: string;
  }>,
): never => {
  throw new MarketplaceDomainError(
    "PROVIDER_DISABLED",
    "External redirects are disabled in the controlled marketplace foundation.",
  );
};

export const recordMarketplaceConversion = (
  input: MarketplaceConversion,
  existing: readonly MarketplaceConversion[],
): MarketplaceConversion => {
  if (
    input.eventReference.length === 0 ||
    existing.some(
      (conversion) =>
        conversion.providerId === input.providerId &&
        conversion.eventReference === input.eventReference,
    )
  ) {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "Provider conversion events must have a unique external reference.",
    );
  }
  return input;
};

export const createMarketplaceCommission = (
  input: MarketplaceCommission,
  conversion: MarketplaceConversion,
): MarketplaceCommission => {
  if (
    conversion.id !== input.conversionId ||
    !conversion.verified ||
    input.contractReference.length === 0 ||
    input.calculationRuleVersion.length === 0 ||
    input.status !== "candidate"
  ) {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "A commission candidate requires a verified conversion and contract rule version.",
    );
  }
  return input;
};

export const earnMarketplaceCommission = (
  commission: MarketplaceCommission,
  amountCents: number,
  now: string,
): MarketplaceCommission => {
  if (!Number.isInteger(amountCents) || amountCents < 0 || commission.status !== "candidate") {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "Only a valid commission candidate can be earned.",
    );
  }
  return { ...commission, amountCents, status: "earned", earnedAt: now };
};

export const reverseMarketplaceCommission = (
  commission: MarketplaceCommission,
  adjustment: MarketplaceCommissionAdjustment,
  now: string,
): MarketplaceCommission => {
  if (
    commission.id !== adjustment.commissionId ||
    !["earned", "paid"].includes(commission.status)
  ) {
    throw new MarketplaceDomainError(
      "INVALID_VERSION",
      "Only recognized commissions may be reversed with an adjustment record.",
    );
  }
  return { ...commission, status: "reversed", reversedAt: now };
};

export const applyMarketplacePartnerAction = (
  journey: MarketplaceJourney,
  action: MarketplacePartnerAction,
): MarketplaceJourney => {
  if (action.providerId !== journey.providerId || action.actorProviderId !== journey.providerId) {
    throw new MarketplaceDomainError(
      "PROVIDER_DISABLED",
      "Partners can act only on referrals addressed to their own provider.",
    );
  }
  const status =
    action.action === "accept"
      ? "provider_processing"
      : action.action === "decline"
        ? "unknown_external_outcome"
        : journey.status;
  return {
    ...journey,
    status,
    externalReference: action.externalReference,
    updatedAt: action.occurredAt,
  };
};
