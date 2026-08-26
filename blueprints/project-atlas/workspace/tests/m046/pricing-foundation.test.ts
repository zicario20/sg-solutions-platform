import { describe, expect, it } from "vitest";

async function loadPricing() {
  return import("@atlas/pricing");
}

const at = "2026-08-26T12:00:00.000Z";

function request(overrides: Record<string, unknown> = {}) {
  return {
    id: "pricing-request-001",
    tenantId: "sg-solutions",
    serviceDefinitionId: "service-llc-001",
    serviceVersionId: "service-llc-v1",
    clientId: "client-001",
    channel: "public_website",
    audience: "new_client",
    jurisdiction: "IL",
    quantity: 1,
    calculationDate: at,
    currencyPreference: "USD",
    correlationId: "correlation-pricing-001",
    idempotencyKey: "pricing-calc-001",
    actor: { actorType: "staff", actorId: "staff-001", purpose: "pricing_calculation" },
    ...overrides,
  };
}

describe("M046 pricing controlled foundation", () => {
  it("calculates integer-minor-unit commercial terms, snapshots them immutably, and hides costs", async () => {
    const pricing = await loadPricing();
    const definition = pricing.createPricingDefinition({
      id: "pricing-definition-llc",
      pricingCode: "IL_LLC_FORMATION_STANDARD",
      name: "Illinois LLC formation standard",
      description: "Commercial pricing definition for Illinois LLC formation.",
      ownerDomain: "business_formation",
      pricingType: "service",
      lifecycleStatus: "approved",
      createdAt: at,
      updatedAt: at,
    });
    const priceBook = pricing.createPriceBook({
      id: "price-book-public-usd",
      priceBookCode: "PUBLIC_USD_2026",
      name: "Public USD price book",
      currency: "USD",
      marketContext: "US",
      effectiveFrom: at,
      effectiveTo: null,
      status: "active",
      version: 1,
    });
    const profile = pricing.createPricingProfile({
      id: "pricing-profile-llc-v1",
      pricingDefinitionId: definition.id,
      profileCode: "IL_LLC_FORMATION_STANDARD",
      version: 1,
      pricingModel: "fixed",
      currency: "USD",
      baseAmountMinor: 30_000,
      internalCostMinor: 18_000,
      components: [
        {
          componentCode: "BASE_SERVICE",
          name: "SG Solutions service fee",
          componentType: "base_service",
          calculationMethod: "fixed",
          amountMinor: 30_000,
          required: true,
          clientVisible: true,
          discountEligible: true,
          sortOrder: 10,
        },
        {
          componentCode: "IL_FILING_FEE",
          name: "Government filing fee",
          componentType: "government_fee",
          calculationMethod: "fixed",
          amountMinor: 15_000,
          required: true,
          clientVisible: true,
          discountEligible: false,
          source: "state_source_reference",
          sourceVersion: "2026-08-26",
          verificationStatus: "verified",
          sortOrder: 20,
        },
      ],
      depositPolicy: {
        id: "deposit-policy-25-percent",
        version: 1,
        depositType: "percentage",
        percentageBasisPoints: 2500,
        basis: "discounted_subtotal",
        dueStage: "on_acceptance",
        status: "active",
      },
      effectiveFrom: at,
      effectiveTo: null,
      status: "active",
    });
    const entry = pricing.createPriceBookEntry({
      id: "price-book-entry-llc-v1",
      priceBookId: priceBook.id,
      serviceDefinitionId: "service-llc-001",
      serviceVersionId: "service-llc-v1",
      pricingProfileId: profile.id,
      pricingProfileVersion: profile.version,
      currency: "USD",
      displayMode: "exact_price",
      effectiveFrom: at,
      effectiveTo: null,
      status: "active",
    });
    const promotion = pricing.createPromotionDefinition({
      id: "promotion-launch-10",
      promotionCode: "LAUNCH_10",
      name: "Launch promotion",
      promotionType: "launch",
      discount: {
        discountType: "percentage",
        percentageBasisPoints: 1000,
        scope: "eligible_components",
      },
      effectiveFrom: at,
      effectiveTo: "2026-09-01T00:00:00.000Z",
      status: "active",
      version: 1,
    });

    const result = pricing.calculateAuthoritativePricing({
      request: request(),
      pricingDefinition: definition,
      priceBook,
      priceBookEntry: entry,
      pricingProfile: profile,
      promotions: [promotion],
      promotionCode: " launch_10 ",
    });

    expect(result.status).toBe("authoritative");
    expect(result.totalAmountMinor).toBe(42_000);
    expect(result.discountTotalMinor).toBe(3_000);
    expect(result.depositAmountMinor).toBe(10_500);
    expect(result.amountDueNowMinor).toBe(10_500);
    expect(result.remainingAmountMinor).toBe(31_500);

    const snapshot = pricing.createCommercialPricingSnapshot({
      id: "pricing-snapshot-001",
      result,
      acceptedAt: at,
    });
    const publicView = pricing.projectPublicPrice(snapshot);
    const m043Reference = pricing.toM043PricingSnapshotReference(snapshot, "quote-001");

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(snapshot.contentHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(publicView).toMatchObject({ totalAmountMinor: 42_000, currency: "USD" });
    expect(publicView).not.toHaveProperty("internalCostMinor");
    expect(
      publicView.lineItems.every(
        (item: { componentCode: string }) => item.componentCode !== "internal_cost",
      ),
    ).toBe(true);
    expect(m043Reference).toMatchObject({
      sourceModule: "m046",
      quoteId: "quote-001",
      totalAmountMinor: 42_000,
      depositAmountMinor: 10_500,
    });
  });

  it("keeps pending, unknown, quote-required, and no-charge pricing distinct from each other", async () => {
    const pricing = await loadPricing();
    const definition = pricing.createPricingDefinition({
      id: "pricing-definition-state",
      pricingCode: "PRICE_STATE_TEST",
      name: "Price state test",
      description: "Tests price state boundaries.",
      ownerDomain: "commercial",
      pricingType: "service",
      lifecycleStatus: "approved",
      createdAt: at,
      updatedAt: at,
    });
    const priceBook = pricing.createPriceBook({
      id: "price-book-state",
      priceBookCode: "STATE_TEST_USD",
      name: "State test price book",
      currency: "USD",
      marketContext: "US",
      effectiveFrom: at,
      effectiveTo: null,
      status: "active",
      version: 1,
    });
    const profiles = ["pending_definition", "unknown", "quote_required", "no_charge"].map(
      (pricingModel) =>
        pricing.createPricingProfile({
          id: `profile-${pricingModel}`,
          pricingDefinitionId: definition.id,
          profileCode: `PROFILE_${pricingModel.toUpperCase()}`,
          version: 1,
          pricingModel,
          currency: "USD",
          baseAmountMinor: pricingModel === "no_charge" ? 0 : null,
          components: [],
          depositPolicy: null,
          effectiveFrom: at,
          effectiveTo: null,
          status: "active",
        }),
    );

    const results = profiles.map((profile: { id: string; version: number }) =>
      pricing.calculateAuthoritativePricing({
        request: request({ idempotencyKey: `pricing-${profile.id}` }),
        pricingDefinition: definition,
        priceBook,
        priceBookEntry: pricing.createPriceBookEntry({
          id: `entry-${profile.id}`,
          priceBookId: priceBook.id,
          serviceDefinitionId: "service-llc-001",
          serviceVersionId: "service-llc-v1",
          pricingProfileId: profile.id,
          pricingProfileVersion: profile.version,
          currency: "USD",
          displayMode: "contact_for_pricing",
          effectiveFrom: at,
          effectiveTo: null,
          status: "active",
        }),
        pricingProfile: profile,
        promotions: [],
      }),
    );

    expect(results.map((result: { status: string }) => result.status)).toEqual([
      "pending_definition",
      "unknown",
      "quote_required",
      "authoritative",
    ]);
    expect(
      results
        .slice(0, 3)
        .every((result: { totalAmountMinor: number | null }) => result.totalAmountMinor === null),
    ).toBe(true);
    expect(results[3]?.totalAmountMinor).toBe(0);
  });

  it("rejects protected-trait inputs, browser amounts, and AI authority before a price can be produced", async () => {
    const pricing = await loadPricing();
    expect(() =>
      pricing.assertPricingActorAllowed({
        actorType: "ai",
        actorId: "assistant-001",
        purpose: "pricing_calculation",
      }),
    ).toThrow("AI actors cannot calculate");
    expect(() =>
      pricing.assertPricingContextSafe({
        jurisdiction: "IL",
        protectedTraits: { race: "untrusted" },
      }),
    ).toThrow("protected trait");
    expect(() =>
      pricing.assertPricingCalculationRequest({
        ...request(),
        requestedAmountMinor: 1,
      }),
    ).toThrow("requestedAmountMinor is not allowed");
  });
});
