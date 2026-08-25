import {
  authorizeProviderPortalAccess,
  evaluateTradelineReferral,
} from "@atlas/tradeline-operations";
import { describe, expect, it } from "vitest";

describe("M029 tradeline foundation", () => {
  const product = {
    code: "TRADELINE_PRIMARY",
    version: "1.0.0",
    status: "published" as const,
    providerCode: "provider",
    providerEnabled: false,
    disclosureAccepted: true,
    consentAccepted: true,
    noGuaranteeDisclosure: true,
  };
  it("does not create referrals while the provider is disabled", () => {
    expect(evaluateTradelineReferral(product)).toMatchObject({ state: "provider_disabled" });
  });
  it("prevents cross-tenant provider access", () => {
    expect(
      authorizeProviderPortalAccess({
        providerCode: "provider",
        providerTenantId: "a",
        requestedTenantId: "b",
        providerStatus: "active",
      }),
    ).toBe(false);
  });
});
