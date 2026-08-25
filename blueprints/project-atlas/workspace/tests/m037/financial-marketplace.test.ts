import {
  assessMarketplaceHandoff,
  createMarketplaceCommission,
  createMarketplaceEligibilityContext,
  createMarketplaceJourney,
  createMarketplaceProviderProfile,
  earnMarketplaceCommission,
  evaluateMarketplaceAvailability,
  MarketplaceDomainError,
  type MarketplaceListing,
  type MarketplaceListingVersion,
  type MarketplaceProviderProfile,
  type MarketplaceSourceReference,
  publishMarketplaceListing,
  recordMarketplaceConversion,
  reverseMarketplaceCommission,
  submitMarketplaceReferral,
} from "@atlas/marketplace";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source: MarketplaceSourceReference = {
  sourceType: "partner_agreement",
  sourceId: "agreement-37",
  observedAt: now,
  freshness: "current",
  verification: "reviewed",
};

function provider(): MarketplaceProviderProfile {
  return createMarketplaceProviderProfile({
    id: "provider-37",
    organizationId: "organization-37",
    code: "EXAMPLE_PROVIDER",
    publicName: "Example Provider",
    providerType: "credit_monitoring_provider",
    status: "approved_not_enabled",
    publicSupportUrl: "https://provider.example/support",
    allowedRedirectHosts: ["provider.example"],
    capabilities: {
      supportsCatalogSync: false,
      supportsReferralCreation: false,
      supportsLeadSubmission: false,
      supportsStatusTracking: false,
      supportsCommissionTracking: false,
      supportsWebhooks: false,
      supportsDocuments: false,
    },
    agreementReference: "agreement-37",
    verificationDueAt: null,
    verifiedAt: now,
    sources: [source],
    createdAt: now,
    updatedAt: now,
  });
}

function listing(): MarketplaceListing {
  return {
    id: "listing-37",
    code: "MONITORING_EXAMPLE",
    providerId: "provider-37",
    categoryId: "credit-monitoring",
    itemType: "referral_offer",
    status: "draft",
    publicVisibility: "public",
    currentVersionId: null,
    createdAt: now,
    updatedAt: now,
  };
}

function version(): MarketplaceListingVersion {
  return {
    id: "listing-version-37",
    listingId: "listing-37",
    version: 1,
    translations: {
      en: {
        name: "Credit monitoring information",
        summary: "Provider information subject to verification.",
        eligibilitySummary: "The provider determines eligibility.",
        pricingSummary: "Provider quote required.",
        disclosureSummary: "Partner terms and privacy policy apply.",
        primaryCta: "Review provider information",
      },
      es: {
        name: "Información sobre monitoreo de crédito",
        summary: "Información del proveedor sujeta a verificación.",
        eligibilitySummary: "El proveedor determina la elegibilidad.",
        pricingSummary: "Se requiere cotización del proveedor.",
        disclosureSummary: "Aplican los términos y la política de privacidad del partner.",
        primaryCta: "Revisar información del proveedor",
      },
    },
    disclosures: ["provider-identity", "partner-compensation"],
    pricingStatus: "provider_quote_required",
    availabilityStatus: "available",
    sourceSnapshot: [source],
    reviewedAt: now,
    effectiveFrom: now,
    effectiveTo: null,
    status: "published",
  };
}

describe("M037 Financial Marketplace", () => {
  it("publishes reviewed provider information without enabling the provider", () => {
    const profile = provider();
    const published = publishMarketplaceListing(listing(), version(), profile, now);
    const availability = evaluateMarketplaceAvailability({
      listingVersion: version(),
      provider: profile,
      state: "IL",
      audience: "active_clients",
      now,
    });

    expect(published.status).toBe("limited");
    expect(availability.status).toBe("provider_disabled");
    expect(() => createMarketplaceProviderProfile({ ...profile, status: "enabled" })).toThrow(
      "cannot be enabled",
    );
  });

  it("requires consent for personalization and preserves explainable boundaries", () => {
    expect(() =>
      createMarketplaceEligibilityContext(
        {
          id: "context-37",
          clientId: "client-37",
          purpose: "personalization",
          facts: { goal: "credit_monitoring" },
          sources: [source],
          consentId: null,
          createdAt: now,
          expiresAt: null,
        },
        false,
      ),
    ).toThrow(MarketplaceDomainError);

    expect(
      createMarketplaceEligibilityContext(
        {
          id: "anonymous-context-37",
          clientId: null,
          purpose: "anonymous_browse",
          facts: {},
          sources: [],
          consentId: null,
          createdAt: now,
          expiresAt: null,
        },
        false,
      ).purpose,
    ).toBe("anonymous_browse");
  });

  it("keeps referrals idempotent and blocks disabled provider handoff", () => {
    const journey = {
      id: "journey-37",
      idempotencyKey: "client-37:list-version-37:referral",
      clientId: "client-37",
      providerId: "provider-37",
      listingVersionId: "listing-version-37",
      sourceChannel: "client_portal" as const,
      status: "interest_created" as const,
      consentId: "consent-37",
      attribution: { source: "marketplace", campaign: null, advisorId: null },
      externalReference: null,
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
    };
    const consent = {
      id: "consent-37",
      clientId: journey.clientId,
      providerId: journey.providerId,
      listingVersionId: journey.listingVersionId,
      purpose: "referral" as const,
      dataCategories: ["basic_contact"],
      disclosureVersionIds: ["provider-identity"],
      status: "accepted" as const,
      acceptedAt: now,
      expiresAt: null,
      withdrawnAt: null,
    };
    const created = createMarketplaceJourney(journey, []);
    const readiness = assessMarketplaceHandoff({
      journey: created,
      provider: provider(),
      consent,
      now,
    });

    expect(readiness).toMatchObject({ ready: false, status: "provider_disabled" });
    expect(() => createMarketplaceJourney(journey, [created])).toThrow("idempotency");
    expect(() => submitMarketplaceReferral(created, provider(), consent, now)).toThrow(
      "not authorized",
    );
  });

  it("recognizes commission only from a verified external conversion and preserves reversals", () => {
    const conversion = recordMarketplaceConversion(
      {
        id: "conversion-37",
        journeyId: "journey-37",
        providerId: "provider-37",
        eventReference: "provider-event-37",
        eventType: "converted",
        verified: true,
        occurredAt: now,
        receivedAt: now,
      },
      [],
    );
    const candidate = createMarketplaceCommission(
      {
        id: "commission-37",
        providerId: conversion.providerId,
        journeyId: conversion.journeyId,
        conversionId: conversion.id,
        contractReference: "agreement-37",
        calculationRuleVersion: "v1",
        amountCents: null,
        currency: "USD",
        status: "candidate",
        createdAt: now,
        earnedAt: null,
        reversedAt: null,
      },
      conversion,
    );
    const earned = earnMarketplaceCommission(candidate, 2500, now);
    const reversed = reverseMarketplaceCommission(
      earned,
      {
        id: "adjustment-37",
        commissionId: earned.id,
        reason: "provider reversal",
        amountDeltaCents: -2500,
        createdAt: now,
      },
      now,
    );

    expect(earned.status).toBe("earned");
    expect(reversed.status).toBe("reversed");
    expect(reversed.amountCents).toBe(2500);
  });
});
