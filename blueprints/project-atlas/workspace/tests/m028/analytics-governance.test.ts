import { calculateAggregateMetric, validateMetricDefinition } from "@atlas/analytics-governance";
import { describe, expect, it } from "vitest";

describe("M028 analytics foundation", () => {
  const metric = {
    code: "FORM_COMPLETION_RATE",
    version: "1.0.0",
    status: "approved" as const,
    titleEs: "Finalización",
    titleEn: "Completion",
    classification: "internal_aggregate" as const,
    aggregation: "rate" as const,
    minimumCohortSize: 5,
    owner: "operations",
  };
  it("does not expose undersized cohorts", () => {
    expect(
      calculateAggregateMetric(metric, {
        metricCode: metric.code,
        numerator: 1,
        denominator: 2,
        cohortSize: 2,
      }),
    ).toMatchObject({ available: false });
  });
  it("requires approved non-restricted definitions", () => {
    expect(validateMetricDefinition({ ...metric, classification: "restricted" })).toContain(
      "restricted_metrics_require_separate_access_boundary",
    );
  });
});
