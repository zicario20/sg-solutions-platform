import type { CommercialPricingSnapshot, PricingCalculationResult } from "./contracts.ts";
import { deepFreeze } from "./policy.ts";

export function projectPublicPrice(snapshot: CommercialPricingSnapshot) {
  return deepFreeze({
    currency: snapshot.currency,
    displayMode: snapshot.displayMode,
    totalAmountMinor: snapshot.totalAmountMinor,
    depositAmountMinor: snapshot.depositAmountMinor,
    lineItems: snapshot.lineItems
      .filter((item) => item.clientVisible)
      .map((item) => ({
        componentCode: item.componentCode,
        description: item.description,
        quantity: item.quantity,
        lineAmountMinor: item.lineAmountMinor,
      })),
  });
}

export function projectClientPrice(snapshot: CommercialPricingSnapshot) {
  return deepFreeze({
    pricingSnapshotId: snapshot.id,
    currency: snapshot.currency,
    totalAmountMinor: snapshot.totalAmountMinor,
    amountDueNowMinor: snapshot.amountDueNowMinor,
    remainingAmountMinor: snapshot.remainingAmountMinor,
    discountTotalMinor: snapshot.discountTotalMinor,
    promotionTotalMinor: snapshot.promotionTotalMinor,
    acceptedAt: snapshot.acceptedAt,
    lineItems: snapshot.lineItems.filter((item) => item.clientVisible),
  });
}

export function projectPricingResultForPublic(result: PricingCalculationResult) {
  return deepFreeze({
    status: result.status,
    displayMode: result.displayMode,
    currency: result.currency,
    totalAmountMinor: result.totalAmountMinor,
    lineItems: result.lineItems
      .filter((item) => item.clientVisible)
      .map((item) => ({
        componentCode: item.componentCode,
        description: item.description,
        lineAmountMinor: item.lineAmountMinor,
      })),
  });
}
