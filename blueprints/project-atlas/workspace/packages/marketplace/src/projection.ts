import type {
  MarketplaceClientProjection,
  MarketplaceJourney,
  MarketplaceListing,
  MarketplaceListingVersion,
  MarketplaceProviderProfile,
} from "./contracts.ts";

const journeyLabel = (
  status: MarketplaceJourney["status"],
  locale: "en" | "es",
): Readonly<{ status: string; nextStep: string }> => {
  const labels = {
    en: {
      provider_disabled: [
        "Provider connection is not available",
        "Contact SG Solutions for assistance.",
      ],
      consent_pending: ["Consent is needed", "Review the provider disclosure before continuing."],
      unknown_external_outcome: [
        "Status unavailable",
        "Contact the provider for the latest status.",
      ],
      default: ["Marketplace activity recorded", "Review your referral details."],
    },
    es: {
      provider_disabled: [
        "La conexión con el proveedor no está disponible",
        "Contacta a SG Solutions para recibir ayuda.",
      ],
      consent_pending: [
        "Se necesita tu consentimiento",
        "Revisa la divulgación del proveedor antes de continuar.",
      ],
      unknown_external_outcome: [
        "Estado no disponible",
        "Contacta al proveedor para conocer el estado más reciente.",
      ],
      default: ["Actividad del marketplace registrada", "Revisa los detalles de tu referral."],
    },
  } as const;
  const value =
    status === "provider_disabled"
      ? labels[locale].provider_disabled
      : status === "consent_pending"
        ? labels[locale].consent_pending
        : status === "unknown_external_outcome"
          ? labels[locale].unknown_external_outcome
          : labels[locale].default;
  return { status: value[0], nextStep: value[1] };
};

export const createMarketplaceClientProjection = (
  input: Readonly<{
    locale: "en" | "es";
    listings: readonly Readonly<{
      listing: MarketplaceListing;
      version: MarketplaceListingVersion;
      provider: MarketplaceProviderProfile;
    }>[];
    journeys: readonly MarketplaceJourney[];
  }>,
): MarketplaceClientProjection => ({
  locale: input.locale,
  listings: input.listings.map(({ listing, version, provider }) => ({
    code: listing.code,
    name: version.translations[input.locale].name,
    providerName: provider.publicName,
    availability: "provider_disabled",
    ctaEnabled: false,
    notice:
      input.locale === "es"
        ? "Esta oferta está en revisión y no está disponible para referrals."
        : "This offer is under review and is not available for referrals.",
  })),
  journeys: input.journeys.map((journey) => {
    const label = journeyLabel(journey.status, input.locale);
    return {
      reference: journey.id,
      providerName: journey.providerId,
      status: label.status,
      nextStep: label.nextStep,
    };
  }),
});
