import { evaluateFormationServiceReadiness } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation service readiness", () => {
  it("blocks publication when a critical operational dependency is incomplete", () => {
    expect(
      evaluateFormationServiceReadiness({
        requirementsConfigured: true,
        intakeConfigured: true,
        documentsConfigured: true,
        approvalConfigured: false,
        paymentConfigured: true,
        filingMethodConfigured: true,
        providerDisabled: true,
      }),
    ).toEqual({ ready: false, missing: ["approval"] });
  });

  it("allows a controlled provider-disabled service configuration to be ready for internal review", () => {
    expect(
      evaluateFormationServiceReadiness({
        requirementsConfigured: true,
        intakeConfigured: true,
        documentsConfigured: true,
        approvalConfigured: true,
        paymentConfigured: true,
        filingMethodConfigured: true,
        providerDisabled: true,
      }),
    ).toEqual({ ready: true, missing: [] });
  });
});
