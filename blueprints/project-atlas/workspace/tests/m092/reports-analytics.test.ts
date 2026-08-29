import { describe, expect, it } from "vitest";

import {
  createAnalyticalDatasetDefinition,
  createMetricDefinition,
  createReportDefinition,
  createReportsAnalyticsConfiguration,
  requestAnalyticsExport,
  requestReportExecution,
} from "../../packages/reports-analytics/src/index";

describe("M092 reports and analytics controlled foundation", () => {
  it("does not execute a report or mutate canonical data", () => {
    const configuration = createReportsAnalyticsConfiguration({
      permission: "analytics.configuration.create",
      code: "OPERATIONS_ANALYTICS_BASELINE",
    });
    const dataset = createAnalyticalDatasetDefinition({
      permission: "analytics.dataset.create",
      datasetCode: "SAFE_SERVICE_ORDER_EVENTS",
      configuration,
      grain: "event",
    });
    const metric = createMetricDefinition({
      permission: "analytics.metric.create",
      metricCode: "SERVICE_ORDER_COUNT",
      dataset,
      formulaReference: "metric-formula:service-order-count-v1",
    });
    const report = createReportDefinition({
      permission: "analytics.report.create",
      reportCode: "OPERATIONS_OVERVIEW",
      configuration,
      dataset,
      metrics: [metric],
      surface: "admin",
    });
    const execution = requestReportExecution({
      permission: "analytics.execution.request",
      requestCode: "REPORT_EXECUTION_001",
      report,
    });

    expect(execution.status).toBe("blocked_runtime_disabled");
    expect(execution.executed).toBe(false);
    expect(execution.canonicalDataMutated).toBe(false);
  });

  it("rejects raw PII projections and arbitrary SQL formulas", () => {
    const configuration = createReportsAnalyticsConfiguration({
      permission: "analytics.configuration.create",
      code: "PRIVATE_ANALYTICS_BASELINE",
    });

    expect(() =>
      createAnalyticalDatasetDefinition({
        permission: "analytics.dataset.create",
        datasetCode: "UNSAFE_CLIENT_DATASET",
        configuration,
        grain: "client_safe",
        includesRawPii: true,
      }),
    ).toThrow("cannot define raw PII projections");

    const dataset = createAnalyticalDatasetDefinition({
      permission: "analytics.dataset.create",
      datasetCode: "SAFE_CLIENT_DATASET",
      configuration,
      grain: "client_safe",
    });
    expect(() =>
      createMetricDefinition({
        permission: "analytics.metric.create",
        metricCode: "UNSAFE_METRIC",
        dataset,
        formulaReference: "metric-formula:unsafe",
        includesArbitrarySql: true,
      }),
    ).toThrow("not arbitrary SQL or code");
  });

  it("does not generate or deliver an export before review", () => {
    const configuration = createReportsAnalyticsConfiguration({
      permission: "analytics.configuration.create",
      code: "EXPORT_ANALYTICS_BASELINE",
    });
    const dataset = createAnalyticalDatasetDefinition({
      permission: "analytics.dataset.create",
      datasetCode: "SAFE_EXPORT_DATASET",
      configuration,
      grain: "daily",
    });
    const metric = createMetricDefinition({
      permission: "analytics.metric.create",
      metricCode: "DAILY_COUNT",
      dataset,
      formulaReference: "metric-formula:daily-count-v1",
    });
    const report = createReportDefinition({
      permission: "analytics.report.create",
      reportCode: "DAILY_EXPORT_REPORT",
      configuration,
      dataset,
      metrics: [metric],
      surface: "internal",
    });
    const exportRequest = requestAnalyticsExport({
      permission: "analytics.export.request",
      requestCode: "EXPORT_REQUEST_001",
      report,
      requiresApproval: true,
    });

    expect(exportRequest.status).toBe("review_required");
    expect(exportRequest.artifactGenerated).toBe(false);
    expect(exportRequest.delivered).toBe(false);
  });
});
