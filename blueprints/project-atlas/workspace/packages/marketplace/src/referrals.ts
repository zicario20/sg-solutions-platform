import type {
  MarketplaceProductSnapshot,
  MarketplaceReferralDraft,
  ReferralRequest,
} from "./contracts.ts";

function referenceFor(input: ReferralRequest, product: MarketplaceProductSnapshot): string {
  const raw = `${input.clientReference}:${product.productCode}:${product.productVersion}:${input.sourceChannel}`;
  let hash = 2166136261;
  for (const character of raw) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `MR-${(hash >>> 0).toString(36).toUpperCase()}`;
}
export function createMarketplaceReferralDraft(
  input: ReferralRequest,
  product: MarketplaceProductSnapshot,
): MarketplaceReferralDraft {
  if (product.partnerStatus !== "active" && product.partnerStatus !== "limited")
    throw new Error("The partner is not available for new referrals.");
  if (!product.publicVisible) throw new Error("The marketplace product is not available.");
  if (product.disclosureRequired && !input.disclosureAccepted)
    throw new Error("Partner disclosure acceptance is required.");
  if (product.consentRequired && !input.consentAccepted)
    throw new Error("Partner consent is required.");
  return {
    publicReference: referenceFor(input, product),
    productCode: product.productCode,
    productVersion: product.productVersion,
    partnerCode: product.partnerCode,
    status: "provider_disabled",
    dataSharingMode: product.dataSharingMode,
    providerStatus: "unknown",
  };
}
export function validatePartnerRedirect(candidate: string, allowedHosts: readonly string[]): URL {
  const url = new URL(candidate);
  if (url.protocol !== "https:") throw new Error("Only HTTPS partner redirects are allowed.");
  if (!allowedHosts.some((host) => url.hostname === host.toLowerCase()))
    throw new Error("The partner redirect host is not allowlisted.");
  if (url.username || url.password)
    throw new Error("Partner redirects must not contain credentials.");
  return url;
}
