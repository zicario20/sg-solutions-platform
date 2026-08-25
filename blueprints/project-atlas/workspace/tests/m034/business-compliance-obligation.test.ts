import { describe, expect, it } from "vitest";

import {
  calculateComplianceDeadline,
  createComplianceObligation,
  createComplianceReminder,
  evaluateComplianceApplicability,
} from "../../packages/business-compliance/src/index.ts";
import { now, profile, requirement, snapshot } from "./fixtures.ts";

describe("M034 obligations and deadlines", () => {
  it("builds a reproducible obligation with a deterministic uniqueness key and reminder", () => {
    const applicability = evaluateComplianceApplicability({
      profile,
      snapshot,
      requirement,
      at: now,
    });
    const deadline = calculateComplianceDeadline({
      obligationRef: "future-34",
      rule: requirement.deadlineRule,
      ruleVersion: "IL_ANNUAL_REPORT:v1",
      inputDates: { formationDate: profile.formationDate },
      calculatedAt: now,
    });
    const obligation = createComplianceObligation({
      profile,
      requirement,
      applicability,
      periodStart: "2026-06-10",
      periodEnd: "2026-06-10",
      deadline,
      responsibility: "monitoring_only",
      createdAt: now,
    });
    const reminder = createComplianceReminder({
      obligation,
      policyCode: "30_days",
      offsetDays: 30,
      channel: "in_app",
      recipientRef: "client-34",
    });
    expect(obligation.sourceReference).toBe("official-source-34");
    expect(reminder.idempotencyKey).toContain(obligation.obligationId);
    expect(reminder.sensitiveDetailsIncluded).toBe(false);
  });
});
