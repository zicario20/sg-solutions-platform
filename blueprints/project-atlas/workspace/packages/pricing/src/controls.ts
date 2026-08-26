import type { PricingRuntimeControls } from "./contracts.ts";

export function getPricingRuntimeControls(): PricingRuntimeControls {
  return Object.freeze({
    pricingEnabled: false,
    m043CheckoutHandoffEnabled: false,
    quoteOrderConversionEnabled: false,
    automaticPromotionRedemptionEnabled: false,
    automationEnabled: false,
    aiAssistanceEnabled: false,
    refundExecutionEnabled: false,
  });
}

export class DisabledPricingRuntimeAdapter {
  createM043CheckoutHandoff() {
    return Object.freeze({
      status: "blocked" as const,
      reason: "activation_not_authorized" as const,
    });
  }

  convertQuoteToOrder() {
    return Object.freeze({
      status: "blocked" as const,
      reason: "activation_not_authorized" as const,
    });
  }

  executeRefund() {
    return Object.freeze({
      status: "blocked" as const,
      reason: "activation_not_authorized" as const,
    });
  }
}
