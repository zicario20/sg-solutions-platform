import { describe, expect, it } from "vitest";

import { evaluateComplianceApplicability } from "../../packages/business-compliance/src/index.ts";
import { now, profile, requirement, snapshot } from "./fixtures.ts";

describe("M034 requirement registry and applicability", () => {
  it("creates an applicable result only from a current sourced requirement and verified profile", () => {
    const result = evaluateComplianceApplicability({ profile, snapshot, requirement, at: now });
    expect(result.status).toBe("applicable");
    expect(result.confidence).toBe("verified");
  });

  it("keeps stale requirements in professional review instead of producing a legal conclusion", () => {
    const result = evaluateComplianceApplicability({
      profile,
      snapshot,
      requirement: { ...requirement, freshness: "stale" },
      at: now,
    });
    expect(result).toMatchObject({
      status: "professional_review_required",
      reasonCode: "REQUIREMENT_NOT_CURRENT",
    });
  });
});
