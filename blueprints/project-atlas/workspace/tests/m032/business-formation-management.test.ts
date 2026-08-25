import { evaluateFormationManagement } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation management validation", () => {
  it("requires at least one responsible party for the selected management model", () => {
    expect(() =>
      evaluateFormationManagement({
        model: "manager_managed",
        parties: [{ partyRef: "owner-1", role: "member", ownershipPercent: 100 }],
      }),
    ).toThrow("FORMATION_MANAGEMENT_PARTY_REQUIRED");

    expect(
      evaluateFormationManagement({
        model: "manager_managed",
        parties: [
          { partyRef: "owner-1", role: "member", ownershipPercent: 100 },
          { partyRef: "manager-1", role: "manager", managementRole: "manager_managed" },
        ],
      }),
    ).toEqual({ valid: true, model: "manager_managed" });
  });
});
