import {
  createCommunicationsCorrelationId,
  projectCommunicationsTelemetryEvent,
  recordCommunicationsTelemetryEvent,
} from "@atlas/observability";
import { describe, expect, it } from "vitest";

function baseEvent(correlationId: unknown = createCommunicationsCorrelationId()) {
  return {
    operation: "dispatch",
    result: "accepted",
    correlationId,
    durationBucket: "under_500ms",
  } as const;
}

describe("communications observability contract", () => {
  it("projects only the closed low-cardinality operations contract", () => {
    const input = { ...baseEvent(), connectionState: "disabled" } as const;
    const projected = projectCommunicationsTelemetryEvent(input);
    expect(projected).toEqual({
      ...input,
      correlationId: expect.stringMatching(/^correlation_[0-9a-f]{32}$/u),
      connectionState: "disabled",
    });
    expect(recordCommunicationsTelemetryEvent(input)).toEqual(projected);

    for (const invalid of [
      { ...baseEvent(), operation: "message_body" },
      { ...baseEvent(), result: "provider_123456" },
      { ...baseEvent(), durationBucket: "347ms" },
      { ...baseEvent(), connectionState: "connected" },
      { ...baseEvent(), correlationId: "+15555550123" },
    ]) {
      expect(() => projectCommunicationsTelemetryEvent(invalid)).toThrow(
        "COMMUNICATIONS_TELEMETRY_INVALID",
      );
    }
  });

  it("rejects forged and hex-sensitive values while preserving factory-minted correlation reuse", () => {
    const correlationId = createCommunicationsCorrelationId();
    const first = projectCommunicationsTelemetryEvent(baseEvent(correlationId));
    const second = recordCommunicationsTelemetryEvent({
      ...baseEvent(correlationId),
      operation: "inbound_job",
    });

    expect(first.correlationId).toMatch(/^correlation_[0-9a-f]{32}$/u);
    expect(second.correlationId).toBe(first.correlationId);
    for (const correlationId of [
      "correlation_client_12345678",
      "correlation_token_123456789",
      "correlation_provider_12345678",
      "correlation_0123456789abcdef0123456789abcdef",
      "correlation_746f6b656e5f70726f76696465725f31",
      first.correlationId,
    ]) {
      expect(() => projectCommunicationsTelemetryEvent(baseEvent(correlationId))).toThrow(
        "COMMUNICATIONS_TELEMETRY_INVALID",
      );
    }
  });

  it("supports every approved operation without registering external transport", () => {
    const correlationId = createCommunicationsCorrelationId();
    for (const operation of ["webhook", "inbound_job", "dispatch", "reconciliation"] as const) {
      const projected = recordCommunicationsTelemetryEvent({
        ...baseEvent(correlationId),
        operation,
      });
      expect(projected.operation).toBe(operation);
      expect(Object.keys(projected).sort()).toEqual(
        ["correlationId", "durationBucket", "operation", "result"].sort(),
      );
    }
  });
});
