import type {
  ProviderPortalAccess,
  TradelineProductSnapshot,
  TradelineReferralDecision,
} from "./contracts.ts";
export function evaluateTradelineReferral(
  product: TradelineProductSnapshot,
): TradelineReferralDecision {
  if (product.status !== "published")
    return { state: "staff_review_required", reason: "The product is not published for referral." };
  if (!product.noGuaranteeDisclosure || !product.disclosureAccepted)
    return {
      state: "education_required",
      reason: "A no-guarantee disclosure must be reviewed before referral.",
    };
  if (!product.consentAccepted)
    return { state: "consent_required", reason: "Specific partner consent is required." };
  if (!product.providerEnabled)
    return { state: "provider_disabled", reason: "The provider integration is disabled." };
  return {
    state: "staff_review_required",
    reason: "Tradeline referrals require staff review; no result is guaranteed.",
  };
}
export function authorizeProviderPortalAccess(access: ProviderPortalAccess): boolean {
  return access.providerStatus === "active" && access.providerTenantId === access.requestedTenantId;
}
