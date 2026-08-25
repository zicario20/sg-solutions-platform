import { createMarketplaceReferralDraft, validatePartnerRedirect } from "@atlas/marketplace";
import { describe, expect, it } from "vitest";

describe("M021B marketplace referral foundation", () => {
  const product = {
    productCode: "MONITORING",
    productVersion: "1.0.0",
    partnerCode: "PARTNER",
    partnerStatus: "active" as const,
    publicVisible: true,
    disclosureRequired: true,
    consentRequired: true,
    dataSharingMode: "client_redirect_only" as const,
    allowedRedirectHosts: ["partner.example"],
  };
  it("requires disclosure and consent before a referral is ready", () => {
    expect(() =>
      createMarketplaceReferralDraft(
        {
          clientReference: "client-1",
          sourceChannel: "website",
          disclosureAccepted: true,
          consentAccepted: false,
        },
        product,
      ),
    ).toThrow("consent");
    expect(
      createMarketplaceReferralDraft(
        {
          clientReference: "client-1",
          sourceChannel: "website",
          disclosureAccepted: true,
          consentAccepted: true,
        },
        product,
      ),
    ).toMatchObject({ status: "provider_disabled", providerStatus: "unknown" });
  });
  it("allows only configured HTTPS partner redirects", () => {
    expect(
      validatePartnerRedirect("https://partner.example/apply", product.allowedRedirectHosts)
        .hostname,
    ).toBe("partner.example");
    expect(() =>
      validatePartnerRedirect(
        "https://attacker.example/?next=partner.example",
        product.allowedRedirectHosts,
      ),
    ).toThrow("allowlisted");
  });
});
