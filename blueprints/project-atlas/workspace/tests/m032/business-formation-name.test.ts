import { evaluateFormationNameCandidate } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation name workflow", () => {
  it("normalizes a candidate without claiming official availability", () => {
    expect(
      evaluateFormationNameCandidate({
        candidate: "  Acme  Solutions, LLC  ",
        maxLength: 80,
      }),
    ).toEqual({
      normalizedCandidate: "Acme Solutions, LLC",
      formatValid: true,
      requiresOfficialConfirmation: true,
    });
  });

  it("rejects empty or control-character candidates", () => {
    expect(() => evaluateFormationNameCandidate({ candidate: "\u0000", maxLength: 80 })).toThrow(
      "FORMATION_NAME_CANDIDATE_INVALID",
    );
  });
});
