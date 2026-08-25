import type { AggregateMetricInput, AggregateMetricResult, MetricDefinition } from "./contracts.ts";

const code = /^[A-Z][A-Z0-9_]{2,63}$/u;
export function validateMetricDefinition(definition: MetricDefinition): readonly string[] {
  const blockers: string[] = [];
  if (!code.test(definition.code) || definition.version.trim().length === 0)
    blockers.push("stable_metric_identity_required");
  if (definition.status !== "approved") blockers.push("metric_approval_required");
  if (definition.titleEs.trim().length === 0 || definition.titleEn.trim().length === 0)
    blockers.push("bilingual_metric_titles_required");
  if (!Number.isInteger(definition.minimumCohortSize) || definition.minimumCohortSize < 2)
    blockers.push("safe_cohort_threshold_required");
  if (definition.classification === "restricted")
    blockers.push("restricted_metrics_require_separate_access_boundary");
  return Object.freeze(blockers);
}
export function calculateAggregateMetric(
  definition: MetricDefinition,
  input: AggregateMetricInput,
): AggregateMetricResult {
  if (input.metricCode !== definition.code || input.cohortSize < definition.minimumCohortSize)
    return {
      available: false,
      reason: "The aggregate does not meet the privacy cohort threshold.",
    };
  if (
    !Number.isFinite(input.numerator) ||
    (input.denominator !== undefined &&
      (!Number.isFinite(input.denominator) || input.denominator <= 0))
  )
    return { available: false, reason: "Metric inputs are invalid." };
  if (definition.aggregation === "rate")
    return { available: true, value: input.numerator / (input.denominator ?? 1) };
  return { available: true, value: input.numerator };
}
