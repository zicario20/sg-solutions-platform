import { describe, expect, it } from "vitest";

async function loadPricing() {
  return import("@atlas/pricing");
}

const at = "2026-08-26T12:00:00.000Z";

function acceptedSnapshot() {
  return {
    id: "pricing-snapshot-quote-001",
    serviceDefinitionId: "service-001",
    serviceVersionId: "service-v1",
    pricingDefinitionId: "pricing-definition-001",
    pricingProfileId: "pricing-profile-001",
    pricingProfileVersion: 1,
    priceBookId: "price-book-001",
    priceBookVersion: 1,
    currency: "USD",
    displayMode: "exact_price",
    lineItems: [
      {
        lineCode: "BASE_SERVICE",
        componentCode: "BASE_SERVICE",
        description: "Service fee",
        quantity: 1,
        unitAmountMinor: 10_001,
        lineAmountMinor: 10_001,
        currency: "USD",
        clientVisible: true,
        sortOrder: 10,
      },
    ],
    totalAmountMinor: 10_001,
    discountTotalMinor: 0,
    promotionTotalMinor: 0,
    depositAmountMinor: 0,
    amountDueNowMinor: 10_001,
    remainingAmountMinor: 0,
    ruleVersions: [],
    acceptedAt: at,
    createdAt: at,
    contentHash: "0".repeat(64),
  };
}

describe("M046 pricing lifecycle controls", () => {
  it("reserves and consumes promotion codes exactly once across retries and competing clients", async () => {
    const pricing = await loadPricing();
    const repository = new pricing.MemoryPricingRepository();
    const promotionCode = pricing.createPromotionCode({
      id: "promotion-code-001",
      code: "WELCOME-2026",
      promotionId: "promotion-001",
      status: "active",
      effectiveFrom: at,
      effectiveTo: "2026-09-01T00:00:00.000Z",
      maximumUses: 1,
      maximumUsesPerClient: 1,
    });

    const first = pricing.reservePromotionRedemption(repository, {
      promotionCode,
      operationId: "order-001",
      clientId: "client-001",
      organizationId: null,
      reservedAt: at,
      expiresAt: "2026-08-26T13:00:00.000Z",
    });
    const replay = pricing.reservePromotionRedemption(repository, {
      promotionCode,
      operationId: "order-001",
      clientId: "client-001",
      organizationId: null,
      reservedAt: at,
      expiresAt: "2026-08-26T13:00:00.000Z",
    });
    const competingClient = pricing.reservePromotionRedemption(repository, {
      promotionCode,
      operationId: "order-002",
      clientId: "client-002",
      organizationId: null,
      reservedAt: at,
      expiresAt: "2026-08-26T13:00:00.000Z",
    });
    const consumed = pricing.consumePromotionRedemption(repository, first.redemption.id, at);

    expect(first.idempotent).toBe(false);
    expect(replay.idempotent).toBe(true);
    expect(replay.redemption.id).toBe(first.redemption.id);
    expect(competingClient.status).toBe("blocked");
    expect(consumed.status).toBe("consumed");
  });

  it("versions quotes immutably, separates acceptance from payment, and distributes installment rounding", async () => {
    const pricing = await loadPricing();
    const snapshot = acceptedSnapshot();
    const quote = pricing.createServiceQuote({
      id: "quote-001",
      quoteNumber: "SG-2026-0001",
      clientId: "client-001",
      organizationId: null,
      serviceDefinitionId: snapshot.serviceDefinitionId,
      serviceVersionId: snapshot.serviceVersionId,
      createdAt: at,
    });
    const version = pricing.createServiceQuoteVersion({
      id: "quote-version-001",
      quoteId: quote.id,
      version: 1,
      snapshot,
      validFrom: at,
      expiresAt: "2026-08-27T12:00:00.000Z",
      termsReferences: ["pricing-terms-v1"],
      disclosureReferences: ["pricing-disclosure-v1"],
      createdAt: at,
    });
    const presented = pricing.presentServiceQuoteVersion(version, at);
    const accepted = pricing.acceptServiceQuoteVersion(presented, {
      acceptedBy: "client-001",
      acceptedAt: "2026-08-26T12:05:00.000Z",
      acceptanceMethod: "client_portal",
      acknowledgedTerms: ["pricing-terms-v1"],
      acknowledgedDisclosures: ["pricing-disclosure-v1"],
    });
    const schedule = pricing.createInstallmentSchedule({
      policy: {
        id: "schedule-001",
        version: 1,
        scheduleType: "installment_schedule",
        installmentCount: 3,
        allocationMethod: "equal",
        dueDateRule: "relative_to_order_date",
        status: "active",
      },
      totalAmountMinor: 10_001,
      currency: "USD",
      acceptedAt: at,
    });

    expect(Object.isFrozen(version)).toBe(true);
    expect(accepted.status).toBe("accepted");
    expect(accepted.paymentState).toBe("not_paid");
    expect(accepted.workflowState).toBe("not_started");
    expect(schedule.installments.map((item: { amountMinor: number }) => item.amountMinor)).toEqual([
      3335, 3333, 3333,
    ]);
    expect(
      schedule.installments.reduce(
        (sum: number, item: { amountMinor: number }) => sum + item.amountMinor,
        0,
      ),
    ).toBe(10_001);
  });

  it("blocks M043, refunds, order conversion, and AI automation while the controlled runtime is disabled", async () => {
    const pricing = await loadPricing();
    const runtime = new pricing.DisabledPricingRuntimeAdapter();

    expect(pricing.getPricingRuntimeControls()).toEqual({
      pricingEnabled: false,
      m043CheckoutHandoffEnabled: false,
      quoteOrderConversionEnabled: false,
      automaticPromotionRedemptionEnabled: false,
      automationEnabled: false,
      aiAssistanceEnabled: false,
      refundExecutionEnabled: false,
    });
    expect(runtime.createM043CheckoutHandoff()).toEqual({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(runtime.convertQuoteToOrder()).toEqual({
      status: "blocked",
      reason: "activation_not_authorized",
    });
    expect(runtime.executeRefund()).toEqual({
      status: "blocked",
      reason: "activation_not_authorized",
    });
  });
});
