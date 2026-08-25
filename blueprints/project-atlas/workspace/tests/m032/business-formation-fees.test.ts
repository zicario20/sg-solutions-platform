import { validateFormationExternalFee } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 external fee validation", () => {
  it("requires source, validity, and whole minor units for an external fee", () => {
    expect(() =>
      validateFormationExternalFee({
        code: "IL_FILING",
        amountMinor: 15000,
        sourceReference: "",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow("FORMATION_EXTERNAL_FEE_INVALID");

    expect(
      validateFormationExternalFee({
        code: "IL_FILING",
        amountMinor: 15000,
        sourceReference: "official-source",
        effectiveFrom: "2026-01-01T00:00:00.000Z",
      }),
    ).toEqual({ valid: true });
  });
});
