import { describe, expect, it } from "vitest";
import {
  projectCommunicationsTelemetryEvent,
  recordCommunicationsTelemetryEvent,
} from "@atlas/observability";

const BASE_EVENT = {
  operation: "dispatch",
  result: "accepted",
  correlationId: "correlation_0123456789abcdef",
  durationBucket: "under_500ms",
} as const;

describe("communications observability contract", () => {
  it("projects only the closed low-cardinality operations contract", () => {
    expect(
      projectCommunicationsTelemetryEvent({
        ...BASE_EVENT,
        connectionState: "disabled",
      }),
    ).toEqual({
      ...BASE_EVENT,
      connectionState: "disabled",
    });
    expect(recordCommunicationsTelemetryEvent(BASE_EVENT)).toEqual(BASE_EVENT);

    for (const invalid of [
      { ...BASE_EVENT, operation: "message_body" },
      { ...BASE_EVENT, result: "provider_123456" },
      { ...BASE_EVENT, durationBucket: "347ms" },
      { ...BASE_EVENT, connectionState: "connected" },
      { ...BASE_EVENT, correlationId: "+15555550123" },
    ]) {
      expect(() => projectCommunicationsTelemetryEvent(invalid)).toThrow(
        "COMMUNICATIONS_TELEMETRY_INVALID",
      );
    }
  });

  it("supports every approved operation without registering external transport", () => {
    for (const operation of ["webhook", "inbound_job", "dispatch", "reconciliation"] as const) {
      const projected = recordCommunicationsTelemetryEvent({ ...BASE_EVENT, operation });
      expect(projected.operation).toBe(operation);
      expect(Object.keys(projected).sort()).toEqual(
        ["correlationId", "durationBucket", "operation", "result"].sort(),
      );
    }
  });
});
