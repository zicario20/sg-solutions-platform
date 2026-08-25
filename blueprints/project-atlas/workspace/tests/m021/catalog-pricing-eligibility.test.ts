import {
  calculateCatalogPrice,
  evaluateAvailability,
  evaluateEligibility,
} from "@atlas/commercial-catalog";
import { describe, expect, it } from "vitest";

describe("M021 deterministic commercial rules", () => {
  it("calculates integer price from a server snapshot and rejects client amounts", () => {
    expect(
      calculateCatalogPrice(
        {
          serviceCode: "IL_LLC_FORMATION",
          addonCodes: ["OPERATING_AGREEMENT"],
          promotionCode: "LAUNCH10",
        },
        {
          version: "1.0.0",
          currency: "USD",
          serviceFeeMinor: 29900,
          externalFeesMinor: 15000,
          addons: [
            {
              code: "OPERATING_AGREEMENT",
              amountMinor: 7500,
              requiresServiceCode: "IL_LLC_FORMATION",
            },
          ],
          promotion: { code: "LAUNCH10", percentageBasisPoints: 1000, stackable: false },
        },
      ),
    ).toMatchObject({ totalMinor: 48660, discountMinor: 3740, pricingVersion: "1.0.0" });
    expect(() =>
      calculateCatalogPrice(
        { serviceCode: "IL_LLC_FORMATION", clientTotalMinor: 1 },
        {
          version: "1.0.0",
          currency: "USD",
          serviceFeeMinor: 29900,
          externalFeesMinor: 0,
          addons: [],
        },
      ),
    ).toThrow("clientTotalMinor is not allowed");
  });

  it("returns preliminary and explainable availability and eligibility results", () => {
    expect(
      evaluateAvailability({ state: "CA" }, { supportedStates: ["IL"], excludedStates: [] }),
    ).toEqual({ kind: "not_available", reason: "state_not_supported" });
    expect(
      evaluateEligibility({ state: "IL" }, [
        {
          field: "state",
          operator: "in",
          values: ["IL"],
          result: "potentially_eligible",
          message: "A preliminary review is still required.",
        },
      ]),
    ).toEqual({ kind: "potentially_eligible", message: "A preliminary review is still required." });
  });
});
