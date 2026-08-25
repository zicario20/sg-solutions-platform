import {
  assessRisk,
  decideRetentionDisposition,
  evaluatePolicyEffectiveness,
} from "@atlas/governance-risk";
import { describe, expect, it } from "vitest";

describe("M027 governance foundation", () => {
  it("blocks disposition under legal hold", () => {
    expect(
      decideRetentionDisposition({ legalHoldActive: true, retentionPeriodElapsed: true }),
    ).toMatchObject({ action: "preserve" });
  });
  it("keeps risk assessment subject to human review", () => {
    expect(
      assessRisk({
        code: "PROVIDER_RISK",
        category: "provider",
        likelihood: 4,
        impact: 4,
        controlEffectiveness: "partial",
      }),
    ).toMatchObject({ requiresHumanReview: true });
  });
  it("requires a bilingual approved policy", () => {
    expect(
      evaluatePolicyEffectiveness({
        code: "DATA_RETENTION",
        version: "1.0.0",
        status: "approved",
        titleEs: "Retención",
        titleEn: "Retention",
      }),
    ).toContain("approver_required");
  });
});
