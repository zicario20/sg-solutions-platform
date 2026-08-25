import { evaluateProviderUse } from "@atlas/provider-control";
import { describe, expect, it } from "vitest";

describe("M026 provider control foundation", () => {
  it("fails closed for a disabled provider", () => {
    expect(
      evaluateProviderUse(
        {
          code: "stripe",
          category: "payments",
          status: "disabled",
          capabilities: ["checkout"],
          secretReferenceConfigured: false,
          sandboxValidated: false,
          ownerApproved: false,
          killSwitchEnabled: true,
        },
        "checkout",
      ),
    ).toMatchObject({ allowed: false });
  });
  it("requires approval, readiness and a kill switch before activation", () => {
    expect(
      evaluateProviderUse(
        {
          code: "calendar",
          category: "calendar",
          status: "enabled",
          capabilities: ["read"],
          secretReferenceConfigured: true,
          sandboxValidated: true,
          ownerApproved: true,
          killSwitchEnabled: false,
        },
        "read",
      ),
    ).toMatchObject({ allowed: false });
  });
});
