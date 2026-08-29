import { describe, expect, it } from "vitest";

import {
  aggregateM097ServiceHealth,
  createM097ObservabilitySystem,
  defineM097OperationalMetric,
  projectM097StructuredLog,
  registerM097TelemetrySource,
  requestM097TelemetryQuery,
} from "../../packages/observability/src/index";

describe("M097 observability controlled foundation", () => {
  it("does not ingest or execute telemetry queries", () => {
    const system = createM097ObservabilitySystem({
      permission: "observability.system.configure",
      code: "OBSERVABILITY_PRIMARY",
    });
    const source = registerM097TelemetrySource({
      permission: "observability.source.register",
      code: "VOICE_GATEWAY_SOURCE",
      system,
      ownerModuleReference: "M096",
      environment: "staging",
      signalTypes: ["metric", "health"],
      safeResourceAttributes: ["service", "environment", "version"],
    });
    const query = requestM097TelemetryQuery({
      permission: "observability.query.request",
      code: "OBSERVABILITY_QUERY_001",
      source,
      environment: "staging",
    });

    expect(source.sourceIdentityVerified).toBe(false);
    expect(query.status).toBe("blocked_runtime_disabled");
    expect(query.executed).toBe(false);
    expect(query.rawSensitiveDataReturned).toBe(false);
  });

  it("blocks sensitive labels and raw log content", () => {
    const system = createM097ObservabilitySystem({
      permission: "observability.system.configure",
      code: "OBSERVABILITY_PRIVACY",
    });
    const source = registerM097TelemetrySource({
      permission: "observability.source.register",
      code: "BACKUP_SOURCE",
      system,
      ownerModuleReference: "M098",
      environment: "test",
      signalTypes: ["metric", "log"],
      safeResourceAttributes: ["service", "environment"],
    });

    expect(() =>
      defineM097OperationalMetric({
        permission: "observability.metric.define",
        code: "UNSAFE_METRIC",
        source,
        unit: "count",
        metricType: "counter",
        labelKeys: ["client_id"],
      }),
    ).toThrow("cannot identify or contain sensitive telemetry data");
    expect(() =>
      projectM097StructuredLog({
        permission: "observability.pipeline.configure",
        code: "UNSAFE_LOG",
        source,
        severity: "info",
        eventName: "backup_started",
        safeFieldKeys: ["service"],
        rawMessageOrSensitiveContent: "token=unsafe",
      }),
    ).toThrow("not raw message content");
  });

  it("does not convert an unknown critical dependency into healthy state", () => {
    const health = aggregateM097ServiceHealth({
      serviceReference: "VOICE_GATEWAY_RUNTIME",
      observedState: "healthy",
      hasUnknownCriticalDependency: true,
    });

    expect(health.state).toBe("unknown");
    expect(health.businessOutcomeKnown).toBe(false);
  });
});
