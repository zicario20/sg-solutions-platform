import { selectFormationRequirement } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 scoped requirement selection", () => {
  it("selects only the verified requirement for the requested entity and jurisdiction", () => {
    const selected = selectFormationRequirement({
      jurisdiction: "IL",
      entityType: "limited_liability_company",
      at: "2026-08-25T00:00:00.000Z",
      requirements: [
        {
          requirementId: "corp",
          jurisdiction: "IL",
          entityType: "corporation",
          ruleKey: "name",
          ruleValue: {},
          verificationStatus: "verified",
          sourceReference: "source",
          effectiveFrom: "2026-01-01T00:00:00.000Z",
          version: 1,
        },
        {
          requirementId: "llc",
          jurisdiction: "IL",
          entityType: "limited_liability_company",
          ruleKey: "name",
          ruleValue: {},
          verificationStatus: "verified",
          sourceReference: "source",
          effectiveFrom: "2026-01-01T00:00:00.000Z",
          version: 1,
        },
      ],
    });
    expect(selected.requirementId).toBe("llc");
  });
});
