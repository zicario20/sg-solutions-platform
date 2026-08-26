import type {
  CommercialPricingSnapshot,
  M043PricingSnapshotReference,
  PriceComponentDefinition,
  PricingCalculationInput,
  PricingCalculationResult,
  PricingFinding,
  PricingLineItem,
  PricingRule,
  PromotionDefinition,
} from "./contracts.ts";
import {
  assertPricingCalculationRequest,
  deepFreeze,
  hashPricingValue,
  normalizePromotionCode,
} from "./policy.ts";

function active(status: string): boolean {
  return ["active", "limited", "scheduled"].includes(status);
}

function effective(from: string, to: string | null, at: string): boolean {
  const time = Date.parse(at);
  return Date.parse(from) <= time && (to === null || time <= Date.parse(to));
}

function line(component: PriceComponentDefinition, quantity: number): PricingLineItem {
  return {
    lineCode: component.componentCode,
    componentCode: component.componentCode,
    description: component.name,
    quantity,
    unitAmountMinor: component.amountMinor,
    lineAmountMinor: component.amountMinor * quantity,
    currency: "USD",
    clientVisible: component.clientVisible,
    sortOrder: component.sortOrder,
  };
}

function matches(rule: PricingRule, input: PricingCalculationInput): boolean {
  if (
    !active(rule.status) ||
    !effective(rule.effectiveFrom, rule.effectiveTo, input.request.calculationDate)
  )
    return false;
  if (
    rule.conditions.jurisdictions &&
    !rule.conditions.jurisdictions.includes(input.request.jurisdiction)
  )
    return false;
  if (rule.conditions.channels && !rule.conditions.channels.includes(input.request.channel))
    return false;
  if (rule.conditions.audiences && !rule.conditions.audiences.includes(input.request.audience))
    return false;
  return true;
}

function stateResult(
  input: PricingCalculationInput,
  status: PricingCalculationResult["status"],
  displayMode: PricingCalculationResult["displayMode"],
  findings: readonly PricingFinding[] = [],
): PricingCalculationResult {
  return deepFreeze({
    id: `pricing-result-${input.request.id}`,
    requestId: input.request.id,
    status,
    pricingDefinitionId: input.pricingDefinition.id,
    pricingProfileId: input.pricingProfile.id,
    pricingProfileVersion: input.pricingProfile.version,
    priceBookId: input.priceBook.id,
    priceBookVersion: input.priceBook.version,
    serviceDefinitionId: input.request.serviceDefinitionId,
    serviceVersionId: input.request.serviceVersionId,
    currency: "USD" as const,
    displayMode,
    lineItems: [],
    baseAmountMinor: null,
    discountTotalMinor: 0,
    promotionTotalMinor: 0,
    depositAmountMinor: null,
    amountDueNowMinor: null,
    remainingAmountMinor: null,
    totalAmountMinor: null,
    ruleVersions: [],
    findings,
    warnings: [],
    createdAt: input.request.calculationDate,
  });
}

function resolvePromotion(
  promotions: readonly PromotionDefinition[],
  code: string | undefined,
  at: string,
): PromotionDefinition | undefined {
  if (code === undefined) return undefined;
  const normalized = normalizePromotionCode(code);
  return promotions.find(
    (promotion) =>
      promotion.promotionCode === normalized &&
      active(promotion.status) &&
      effective(promotion.effectiveFrom, promotion.effectiveTo, at),
  );
}

function deposit(
  total: number,
  base: number,
  policy: PricingCalculationInput["pricingProfile"]["depositPolicy"],
): number {
  if (
    policy === null ||
    policy.depositType === "none" ||
    policy.depositType === "pending_definition"
  )
    return 0;
  if (policy.depositType === "full_payment") return total;
  if (policy.depositType === "fixed_amount") return Math.min(total, policy.fixedAmountMinor ?? 0);
  if (policy.depositType === "minimum_amount")
    return Math.min(total, policy.minimumAmountMinor ?? 0);
  if (policy.depositType === "percentage") {
    const basis = policy.basis === "base_subtotal" ? base : total;
    return Math.min(total, Math.floor((basis * (policy.percentageBasisPoints ?? 0)) / 10_000));
  }
  return 0;
}

export function calculateAuthoritativePricing(
  input: PricingCalculationInput,
): PricingCalculationResult {
  const request = assertPricingCalculationRequest(input.request);
  if (
    input.priceBook.id !== input.priceBookEntry.priceBookId ||
    input.priceBookEntry.pricingProfileId !== input.pricingProfile.id ||
    input.priceBookEntry.pricingProfileVersion !== input.pricingProfile.version ||
    input.pricingProfile.pricingDefinitionId !== input.pricingDefinition.id ||
    input.priceBookEntry.serviceDefinitionId !== request.serviceDefinitionId ||
    input.priceBookEntry.serviceVersionId !== request.serviceVersionId
  )
    return stateResult(input, "blocked", "not_public", [
      {
        type: "profile_binding_mismatch",
        severity: "blocking",
        message: "Pricing profile binding mismatch.",
      },
    ]);
  if (!active(input.priceBook.status))
    return stateResult(input, "blocked", "not_public", [
      { type: "inactive_price_book", severity: "blocking", message: "Price book is not active." },
    ]);
  if (!active(input.pricingProfile.status))
    return stateResult(input, "blocked", "not_public", [
      {
        type: "inactive_pricing_profile",
        severity: "blocking",
        message: "Pricing profile is not active.",
      },
    ]);
  if (
    !effective(
      input.priceBook.effectiveFrom,
      input.priceBook.effectiveTo,
      request.calculationDate,
    ) ||
    !effective(
      input.priceBookEntry.effectiveFrom,
      input.priceBookEntry.effectiveTo,
      request.calculationDate,
    ) ||
    !effective(
      input.pricingProfile.effectiveFrom,
      input.pricingProfile.effectiveTo,
      request.calculationDate,
    )
  )
    return stateResult(input, "blocked", "not_public", [
      {
        type: "pricing_not_effective",
        severity: "blocking",
        message: "Pricing configuration is not effective.",
      },
    ]);
  if (input.pricingProfile.pricingModel === "pending_definition")
    return stateResult(input, "pending_definition", "price_pending");
  if (input.pricingProfile.pricingModel === "unknown")
    return stateResult(input, "unknown", "contact_for_pricing");
  if (["quote_required", "custom_review"].includes(input.pricingProfile.pricingModel))
    return stateResult(input, "quote_required", "quote_required");
  if (["usage_based_future", "subscription_future"].includes(input.pricingProfile.pricingModel))
    return stateResult(input, "manual_review_required", "contact_for_pricing", [
      {
        type: "manual_review_required",
        severity: "blocking",
        message: "Future pricing model requires approved activation.",
      },
    ]);
  const rules = (input.pricingRules ?? []).filter((rule) => matches(rule, input));
  if (rules.some((rule) => rule.actionType === "block_pricing"))
    return stateResult(input, "blocked", "not_public", [
      {
        type: "rule_blocked",
        severity: "blocking",
        message: "A pricing rule blocked this calculation.",
      },
    ]);
  if (rules.some((rule) => rule.actionType === "manual_review_required"))
    return stateResult(input, "manual_review_required", "contact_for_pricing", [
      {
        type: "manual_review_required",
        severity: "blocking",
        message: "A pricing rule requires manual review.",
      },
    ]);
  const components = input.pricingProfile.components.map((item) => line(item, request.quantity));
  if (components.length === 0 && input.pricingProfile.baseAmountMinor !== null)
    components.push({
      lineCode: "BASE_PRICE",
      componentCode: "BASE_PRICE",
      description: "Service price",
      quantity: request.quantity,
      unitAmountMinor: input.pricingProfile.baseAmountMinor,
      lineAmountMinor: input.pricingProfile.baseAmountMinor * request.quantity,
      currency: "USD",
      clientVisible: true,
      sortOrder: 0,
    });
  const baseAmountMinor = components.reduce((sum, item) => sum + item.lineAmountMinor, 0);
  const eligible = input.pricingProfile.components
    .filter((item) => item.discountEligible)
    .reduce((sum, item) => sum + item.amountMinor * request.quantity, 0);
  const promotion = resolvePromotion(
    input.promotions,
    input.promotionCode,
    request.calculationDate,
  );
  if (input.promotionCode !== undefined && promotion === undefined)
    return stateResult(input, "blocked", "not_public", [
      {
        type: "promotion_not_eligible",
        severity: "blocking",
        message: "Promotion is not eligible.",
      },
    ]);
  let promotionTotalMinor = 0;
  if (promotion !== undefined) {
    if (promotion.discount.discountType === "percentage")
      promotionTotalMinor = Math.floor(
        (eligible * (promotion.discount.percentageBasisPoints ?? 0)) / 10_000,
      );
    if (promotion.discount.discountType === "fixed")
      promotionTotalMinor = Math.min(eligible, promotion.discount.amountMinor ?? 0);
    if (promotion.discount.discountType === "component_waiver") promotionTotalMinor = eligible;
    components.push({
      lineCode: `PROMOTION_${promotion.promotionCode}`,
      componentCode: "promotion",
      description: promotion.name,
      quantity: 1,
      unitAmountMinor: -promotionTotalMinor,
      lineAmountMinor: -promotionTotalMinor,
      currency: "USD",
      clientVisible: true,
      sortOrder: 9000,
    });
  }
  const totalAmountMinor = baseAmountMinor - promotionTotalMinor;
  if (
    input.minimumClientPriceMinor !== undefined &&
    input.minimumClientPriceMinor !== null &&
    totalAmountMinor < input.minimumClientPriceMinor
  )
    return stateResult(input, "blocked", "not_public", [
      {
        type: "discount_exceeds_floor",
        severity: "blocking",
        message: "Pricing floor requires approval.",
      },
    ]);
  const depositAmountMinor = deposit(
    totalAmountMinor,
    baseAmountMinor,
    input.pricingProfile.depositPolicy,
  );
  const amountDueNowMinor = depositAmountMinor === 0 ? totalAmountMinor : depositAmountMinor;
  return deepFreeze({
    id: `pricing-result-${request.id}`,
    requestId: request.id,
    status: "authoritative" as const,
    pricingDefinitionId: input.pricingDefinition.id,
    pricingProfileId: input.pricingProfile.id,
    pricingProfileVersion: input.pricingProfile.version,
    priceBookId: input.priceBook.id,
    priceBookVersion: input.priceBook.version,
    serviceDefinitionId: request.serviceDefinitionId,
    serviceVersionId: request.serviceVersionId,
    currency: "USD" as const,
    displayMode: input.priceBookEntry.displayMode,
    lineItems: components.sort((left, right) => left.sortOrder - right.sortOrder),
    baseAmountMinor,
    discountTotalMinor: promotionTotalMinor,
    promotionTotalMinor,
    depositAmountMinor,
    amountDueNowMinor,
    remainingAmountMinor: totalAmountMinor - amountDueNowMinor,
    totalAmountMinor,
    ruleVersions: rules.map((rule) => `${rule.ruleCode}@${rule.version}`),
    findings: [],
    warnings: [],
    createdAt: request.calculationDate,
  });
}

export function createCommercialPricingSnapshot(
  input: Readonly<{ id: string; result: PricingCalculationResult; acceptedAt: string }>,
): CommercialPricingSnapshot {
  if (input.result.status !== "authoritative" || input.result.totalAmountMinor === null)
    throw new TypeError("authoritative pricing result required");
  const base = {
    id: input.id,
    serviceDefinitionId: input.result.serviceDefinitionId,
    serviceVersionId: input.result.serviceVersionId,
    pricingDefinitionId: input.result.pricingDefinitionId,
    pricingProfileId: input.result.pricingProfileId,
    pricingProfileVersion: input.result.pricingProfileVersion,
    priceBookId: input.result.priceBookId,
    priceBookVersion: input.result.priceBookVersion,
    currency: "USD" as const,
    displayMode: input.result.displayMode,
    lineItems: input.result.lineItems,
    totalAmountMinor: input.result.totalAmountMinor,
    discountTotalMinor: input.result.discountTotalMinor,
    promotionTotalMinor: input.result.promotionTotalMinor,
    depositAmountMinor: input.result.depositAmountMinor ?? 0,
    amountDueNowMinor: input.result.amountDueNowMinor ?? input.result.totalAmountMinor,
    remainingAmountMinor: input.result.remainingAmountMinor ?? 0,
    ruleVersions: input.result.ruleVersions,
    acceptedAt: input.acceptedAt,
    createdAt: input.result.createdAt,
  };
  return deepFreeze({ ...base, contentHash: hashPricingValue(base) });
}

export function toM043PricingSnapshotReference(
  snapshot: CommercialPricingSnapshot,
  quoteId: string,
): M043PricingSnapshotReference {
  return deepFreeze({
    sourceModule: "m046",
    quoteId,
    pricingVersion: `${snapshot.pricingProfileVersion}`,
    currency: "USD",
    totalAmountMinor: snapshot.totalAmountMinor,
    depositAmountMinor: snapshot.depositAmountMinor,
    balanceAmountMinor: snapshot.remainingAmountMinor,
    checksum: snapshot.contentHash,
    calculatedAt: snapshot.createdAt,
  });
}

export function calculateLegacyCatalogPrice(
  input: unknown,
  snapshot: Readonly<{
    version: string;
    currency: "USD";
    serviceFeeMinor: number;
    externalFeesMinor: number;
    addons: readonly Readonly<{ code: string; amountMinor: number; requiresServiceCode: string }>[];
    promotion?: Readonly<{ code: string; percentageBasisPoints: number; stackable: boolean }>;
  }>,
) {
  if (input === null || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("price input invalid");
  const source = input as Record<string, unknown>;
  for (const key of Object.keys(source))
    if (!["serviceCode", "addonCodes", "promotionCode"].includes(key))
      throw new TypeError(`${key} is not allowed`);
  const addons = source.addonCodes === undefined ? [] : source.addonCodes;
  if (
    !Array.isArray(addons) ||
    addons.some((code) => typeof code !== "string") ||
    new Set(addons).size !== addons.length
  )
    throw new TypeError("addonCodes invalid");
  const selected = snapshot.addons.filter((addon) => addons.includes(addon.code));
  if (
    selected.length !== addons.length ||
    selected.some((addon) => addon.requiresServiceCode !== source.serviceCode)
  )
    throw new TypeError("addon dependency invalid");
  const money = (value: number, label: string) => {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} invalid`);
    return value;
  };
  const serviceFeeMinor = money(snapshot.serviceFeeMinor, "serviceFeeMinor");
  const externalFeesMinor = money(snapshot.externalFeesMinor, "externalFeesMinor");
  const addonMinor = selected.reduce(
    (sum, addon) => sum + money(addon.amountMinor, "addon.amountMinor"),
    0,
  );
  let discountMinor = 0;
  if (source.promotionCode !== undefined) {
    if (
      typeof source.promotionCode !== "string" ||
      snapshot.promotion?.code !== source.promotionCode
    )
      throw new TypeError("promotionCode invalid");
    discountMinor = Math.floor(
      ((serviceFeeMinor + addonMinor) * snapshot.promotion.percentageBasisPoints) / 10_000,
    );
  }
  return deepFreeze({
    currency: "USD" as const,
    serviceFeeMinor,
    externalFeesMinor,
    addonMinor,
    discountMinor,
    totalMinor: serviceFeeMinor + externalFeesMinor + addonMinor - discountMinor,
    pricingVersion: snapshot.version,
  });
}
