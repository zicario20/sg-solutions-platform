import { evaluateFormationDelivery } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 delivery model controls", () => {
  it("fails closed when a partner-managed formation provider is disabled", () => {
    expect(
      evaluateFormationDelivery({
        deliveryModel: "sg_managed_with_partner",
        provider: { status: "disabled", supportsSubmission: false, killSwitchEnabled: false },
      }),
    ).toEqual({ available: false, mode: "unavailable" });
  });

  it("keeps marketplace referrals informational until a separate consent flow is available", () => {
    expect(
      evaluateFormationDelivery({
        deliveryModel: "marketplace_referral",
      }),
    ).toEqual({ available: true, mode: "referral_only" });
  });
});
