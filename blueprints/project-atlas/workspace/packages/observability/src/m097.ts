export const M097_OBSERVABILITY_MODULE = "M097" as const;

export const M097_OBSERVABILITY_PERMISSIONS = [
  "observability.system.configure",
  "observability.source.register",
  "observability.metric.define",
  "observability.pipeline.configure",
  "observability.alert.define",
  "observability.query.request",
  "observability.runtime.activate",
] as const;

export type M097ObservabilityPermission = (typeof M097_OBSERVABILITY_PERMISSIONS)[number];

export const M097_OBSERVABILITY_RUNTIME = {
  sourceOnboarding: false,
  telemetryIngest: false,
  telemetryPersistence: false,
  telemetryExport: false,
  alertEvaluation: false,
  queryExecution: false,
  dashboardRefresh: false,
  syntheticProbes: false,
  providerConnections: false,
} as const;

export type M097SignalType = "metric" | "log" | "trace" | "span" | "event" | "health" | "synthetic_probe";

export type M097Environment = "production" | "staging" | "development" | "test" | "sandbox" | "local";

export type M097HealthState = "healthy" | "degraded" | "overloaded" | "restricted" | "unavailable" | "unknown";

export interface M097ObservabilitySystem {
  readonly module: typeof M097_OBSERVABILITY_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly telemetryAccepted: false;
  readonly alertsActive: false;
  readonly businessStateAuthority: false;
}

export interface M097TelemetrySource {
  readonly code: string;
  readonly systemCode: string;
  readonly ownerModuleReference: string;
  readonly environment: M097Environment;
  readonly signalTypes: readonly M097SignalType[];
  readonly safeResourceAttributes: readonly string[];
  readonly status: "draft";
  readonly sourceIdentityVerified: false;
  readonly active: false;
}

export interface M097OperationalMetricDefinition {
  readonly code: string;
  readonly sourceCode: string;
  readonly unit: string;
  readonly metricType: "counter" | "gauge" | "histogram" | "derived_ratio";
  readonly labelKeys: readonly string[];
  readonly status: "draft";
  readonly active: false;
  readonly businessTruthAuthority: false;
}

export interface M097StructuredLogProjection {
  readonly code: string;
  readonly sourceCode: string;
  readonly severity: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  readonly eventName: string;
  readonly safeFieldKeys: readonly string[];
  readonly status: "draft";
  readonly persisted: false;
  readonly auditEvent: false;
}

export interface M097TelemetryPipeline {
  readonly code: string;
  readonly systemCode: string;
  readonly sourceCode: string;
  readonly status: "draft";
  readonly redactionRequired: true;
  readonly ingestEnabled: false;
  readonly storageEnabled: false;
  readonly businessCommandsAccepted: false;
}

export interface M097AlertRule {
  readonly code: string;
  readonly metricCode: string;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly status: "draft";
  readonly active: false;
  readonly incidentConfirmed: false;
  readonly remediationAuthorized: false;
}

export interface M097ServiceHealth {
  readonly serviceReference: string;
  readonly state: M097HealthState;
  readonly hasUnknownCriticalDependency: boolean;
  readonly businessOutcomeKnown: false;
}

export interface M097TelemetryQueryRequest {
  readonly code: string;
  readonly sourceCode: string;
  readonly environment: M097Environment;
  readonly status: "blocked_runtime_disabled";
  readonly executed: false;
  readonly rawSensitiveDataReturned: false;
}

function requireIdentifier(value: string, field: string): void {
  if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) {
    throw new Error(`${field} must be a stable safe identifier.`);
  }
}

function requirePermission(permission: M097ObservabilityPermission): void {
  if (!M097_OBSERVABILITY_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported M097 observability permission: ${permission}.`);
  }
}

function requireSafeFieldKey(value: string, field: string): void {
  if (!/^[a-z][a-z0-9_]{1,63}$/u.test(value)) throw new Error(`${field} must be a safe field key.`);
  if (/(user|client|contact|email|phone|document|token|secret|password|ssn|ein|card|audio|transcript|prompt|query|body|url)/iu.test(value)) {
    throw new Error(`${field} cannot identify or contain sensitive telemetry data.`);
  }
}

export function createM097ObservabilitySystem(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
}): M097ObservabilitySystem {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 observability system code");

  return {
    module: M097_OBSERVABILITY_MODULE,
    code: input.code,
    status: "draft",
    active: false,
    telemetryAccepted: false,
    alertsActive: false,
    businessStateAuthority: false,
  };
}

export function registerM097TelemetrySource(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly system: M097ObservabilitySystem;
  readonly ownerModuleReference: string;
  readonly environment: M097Environment;
  readonly signalTypes: readonly M097SignalType[];
  readonly safeResourceAttributes: readonly string[];
  readonly includesCredentialMaterial?: boolean;
}): M097TelemetrySource {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 telemetry source code");
  requireIdentifier(input.ownerModuleReference, "M097 telemetry source owner reference");
  if (input.signalTypes.length === 0) throw new Error("M097 telemetry sources require signal types.");
  if (input.includesCredentialMaterial) throw new Error("M097 telemetry sources cannot include credential material.");
  for (const key of input.safeResourceAttributes) requireSafeFieldKey(key, "Telemetry resource attribute");

  return {
    code: input.code,
    systemCode: input.system.code,
    ownerModuleReference: input.ownerModuleReference,
    environment: input.environment,
    signalTypes: [...new Set(input.signalTypes)],
    safeResourceAttributes: [...new Set(input.safeResourceAttributes)],
    status: "draft",
    sourceIdentityVerified: false,
    active: false,
  };
}

export function defineM097OperationalMetric(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly source: M097TelemetrySource;
  readonly unit: string;
  readonly metricType: M097OperationalMetricDefinition["metricType"];
  readonly labelKeys: readonly string[];
}): M097OperationalMetricDefinition {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 operational metric code");
  requireIdentifier(input.unit.toUpperCase(), "M097 operational metric unit");
  for (const key of input.labelKeys) requireSafeFieldKey(key, "Metric label");

  return {
    code: input.code,
    sourceCode: input.source.code,
    unit: input.unit,
    metricType: input.metricType,
    labelKeys: [...new Set(input.labelKeys)],
    status: "draft",
    active: false,
    businessTruthAuthority: false,
  };
}

export function projectM097StructuredLog(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly source: M097TelemetrySource;
  readonly severity: M097StructuredLogProjection["severity"];
  readonly eventName: string;
  readonly safeFieldKeys: readonly string[];
  readonly rawMessageOrSensitiveContent?: string;
}): M097StructuredLogProjection {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 structured log code");
  requireSafeFieldKey(input.eventName, "M097 structured log event name");
  if (input.rawMessageOrSensitiveContent !== undefined) {
    throw new Error("M097 structured log projections accept stable event names, not raw message content.");
  }
  for (const key of input.safeFieldKeys) requireSafeFieldKey(key, "Structured log field");

  return {
    code: input.code,
    sourceCode: input.source.code,
    severity: input.severity,
    eventName: input.eventName,
    safeFieldKeys: [...new Set(input.safeFieldKeys)],
    status: "draft",
    persisted: false,
    auditEvent: false,
  };
}

export function createM097TelemetryPipeline(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly system: M097ObservabilitySystem;
  readonly source: M097TelemetrySource;
}): M097TelemetryPipeline {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 telemetry pipeline code");

  return {
    code: input.code,
    systemCode: input.system.code,
    sourceCode: input.source.code,
    status: "draft",
    redactionRequired: true,
    ingestEnabled: false,
    storageEnabled: false,
    businessCommandsAccepted: false,
  };
}

export function createM097AlertRule(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly metric: M097OperationalMetricDefinition;
  readonly severity: M097AlertRule["severity"];
}): M097AlertRule {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 alert rule code");

  return {
    code: input.code,
    metricCode: input.metric.code,
    severity: input.severity,
    status: "draft",
    active: false,
    incidentConfirmed: false,
    remediationAuthorized: false,
  };
}

export function aggregateM097ServiceHealth(input: {
  readonly serviceReference: string;
  readonly observedState: M097HealthState;
  readonly hasUnknownCriticalDependency: boolean;
}): M097ServiceHealth {
  requireIdentifier(input.serviceReference, "M097 service reference");

  return {
    serviceReference: input.serviceReference,
    state: input.hasUnknownCriticalDependency ? "unknown" : input.observedState,
    hasUnknownCriticalDependency: input.hasUnknownCriticalDependency,
    businessOutcomeKnown: false,
  };
}

export function requestM097TelemetryQuery(input: {
  readonly permission: M097ObservabilityPermission;
  readonly code: string;
  readonly source: M097TelemetrySource;
  readonly environment: M097Environment;
}): M097TelemetryQueryRequest {
  requirePermission(input.permission);
  requireIdentifier(input.code, "M097 telemetry query request code");

  return {
    code: input.code,
    sourceCode: input.source.code,
    environment: input.environment,
    status: "blocked_runtime_disabled",
    executed: false,
    rawSensitiveDataReturned: false,
  };
}
