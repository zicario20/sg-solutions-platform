export type MetricStatus = "draft" | "approved" | "deprecated";
export type MetricClassification = "public_aggregate" | "internal_aggregate" | "restricted";
export interface MetricDefinition {
  code: string;
  version: string;
  status: MetricStatus;
  titleEs: string;
  titleEn: string;
  classification: MetricClassification;
  aggregation: "count" | "sum" | "average" | "rate";
  minimumCohortSize: number;
  owner: string;
}
export interface AggregateMetricInput {
  metricCode: string;
  numerator: number;
  denominator?: number;
  cohortSize: number;
}
export interface AggregateMetricResult {
  available: boolean;
  value?: number;
  reason?: string;
}
