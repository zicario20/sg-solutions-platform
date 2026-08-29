export const REPORTS_ANALYTICS_MODULE = "M092" as const;

export const REPORTS_ANALYTICS_PERMISSIONS = [
  "analytics.configuration.create",
  "analytics.dataset.create",
  "analytics.metric.create",
  "analytics.report.create",
  "analytics.provider.register",
  "analytics.execution.request",
  "analytics.export.request",
] as const;

export type ReportsAnalyticsPermission = (typeof REPORTS_ANALYTICS_PERMISSIONS)[number];

export const REPORTS_ANALYTICS_RUNTIME = {
  semanticResolution: false,
  queryPlanning: false,
  queryExecution: false,
  providerConnections: false,
  datasetRefresh: false,
  materialization: false,
  reportDelivery: false,
  exportGeneration: false,
  telemetry: false,
} as const;

export type AnalyticalGrain = "event" | "daily" | "monthly" | "case" | "service_order" | "client_safe";
export type AnalyticsSurface = "admin" | "client" | "internal";

export interface ReportsAnalyticsConfiguration {
  readonly module: typeof REPORTS_ANALYTICS_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly domainTruthOwnedByDomainModules: true;
}

export interface AnalyticalDatasetDefinition {
  readonly datasetCode: string;
  readonly configurationCode: string;
  readonly grain: AnalyticalGrain;
  readonly status: "draft";
  readonly active: false;
  readonly rawPiiProjection: false;
  readonly dataRefreshEnabled: false;
}

export interface MetricDefinition {
  readonly metricCode: string;
  readonly datasetCode: string;
  readonly formulaReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly arbitrarySqlAccepted: false;
}

export interface ReportDefinition {
  readonly reportCode: string;
  readonly configurationCode: string;
  readonly datasetCode: string;
  readonly metricCodes: readonly string[];
  readonly surface: AnalyticsSurface;
  readonly status: "draft";
  readonly active: false;
}

export interface AnalyticsProviderRegistration {
  readonly providerCode: string;
  readonly configurationCode: string;
  readonly status: "draft";
  readonly connected: false;
  readonly credentialsLoaded: false;
}

export interface ReportExecutionRequest {
  readonly requestCode: string;
  readonly reportCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly queryPlanned: false;
  readonly executed: false;
  readonly resultMaterialized: false;
  readonly canonicalDataMutated: false;
}

export interface AnalyticsExportRequest {
  readonly requestCode: string;
  readonly reportCode: string;
  readonly status: "review_required";
  readonly approvalVerified: false;
  readonly artifactGenerated: false;
  readonly delivered: false;
  readonly rawRowsStored: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: ReportsAnalyticsPermission): void {
  if (!REPORTS_ANALYTICS_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported reports-analytics permission: ${permission}.`);
  }
}

export function createReportsAnalyticsConfiguration(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly code: string;
}): ReportsAnalyticsConfiguration {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Reports analytics configuration code");

  return {
    module: REPORTS_ANALYTICS_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    domainTruthOwnedByDomainModules: true,
  };
}

export function createAnalyticalDatasetDefinition(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly datasetCode: string;
  readonly configuration: ReportsAnalyticsConfiguration;
  readonly grain: AnalyticalGrain;
  readonly includesRawPii?: boolean;
}): AnalyticalDatasetDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.datasetCode, "Analytical dataset code");
  if (input.includesRawPii) {
    throw new Error("Analytical datasets cannot define raw PII projections.");
  }

  return {
    datasetCode: input.datasetCode,
    configurationCode: input.configuration.code,
    grain: input.grain,
    status: "draft",
    active: false,
    rawPiiProjection: false,
    dataRefreshEnabled: false,
  };
}

export function createMetricDefinition(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly metricCode: string;
  readonly dataset: AnalyticalDatasetDefinition;
  readonly formulaReference: string;
  readonly includesArbitrarySql?: boolean;
}): MetricDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.metricCode, "Metric code");
  requireIdentifier(input.formulaReference, "Metric formula reference");
  if (input.includesArbitrarySql) {
    throw new Error("Metric definitions accept reviewed formula references, not arbitrary SQL or code.");
  }

  return {
    metricCode: input.metricCode,
    datasetCode: input.dataset.datasetCode,
    formulaReference: input.formulaReference,
    status: "draft",
    active: false,
    arbitrarySqlAccepted: false,
  };
}

export function createReportDefinition(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly reportCode: string;
  readonly configuration: ReportsAnalyticsConfiguration;
  readonly dataset: AnalyticalDatasetDefinition;
  readonly metrics: readonly MetricDefinition[];
  readonly surface: AnalyticsSurface;
}): ReportDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.reportCode, "Report code");
  if (input.metrics.length === 0) {
    throw new Error("Report definitions require at least one approved metric reference.");
  }

  return {
    reportCode: input.reportCode,
    configurationCode: input.configuration.code,
    datasetCode: input.dataset.datasetCode,
    metricCodes: input.metrics.map((metric) => metric.metricCode),
    surface: input.surface,
    status: "draft",
    active: false,
  };
}

export function registerAnalyticsProvider(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly providerCode: string;
  readonly configuration: ReportsAnalyticsConfiguration;
  readonly includesCredentialMaterial?: boolean;
}): AnalyticsProviderRegistration {
  requirePermission(input.permission);
  requireIdentifier(input.providerCode, "Analytics provider code");
  if (input.includesCredentialMaterial) {
    throw new Error("Analytics provider registration cannot include credential material.");
  }

  return {
    providerCode: input.providerCode,
    configurationCode: input.configuration.code,
    status: "draft",
    connected: false,
    credentialsLoaded: false,
  };
}

export function requestReportExecution(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly requestCode: string;
  readonly report: ReportDefinition;
}): ReportExecutionRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Report execution request code");

  return {
    requestCode: input.requestCode,
    reportCode: input.report.reportCode,
    status: "blocked_runtime_disabled",
    queryPlanned: false,
    executed: false,
    resultMaterialized: false,
    canonicalDataMutated: false,
  };
}

export function requestAnalyticsExport(input: {
  readonly permission: ReportsAnalyticsPermission;
  readonly requestCode: string;
  readonly report: ReportDefinition;
  readonly requiresApproval?: boolean;
}): AnalyticsExportRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Analytics export request code");

  return {
    requestCode: input.requestCode,
    reportCode: input.report.reportCode,
    status: "review_required",
    approvalVerified: false,
    artifactGenerated: false,
    delivered: false,
    rawRowsStored: false,
  };
}
