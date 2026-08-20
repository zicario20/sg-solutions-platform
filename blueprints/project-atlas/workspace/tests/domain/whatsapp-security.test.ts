import { describe, expect, it } from "vitest";
import { projectCommunicationsTelemetryEvent } from "@atlas/observability";

const SAFE_EVENT = {
  operation: "webhook",
  result: "rejected",
  correlationId: "correlation_fedcba9876543210",
  connectionState: "disabled",
  durationBucket: "under_100ms",
} as const;

describe("communications telemetry security", () => {
  it("rejects sensitive fields, arbitrary attributes, and nested metadata", () => {
    const prohibited = {
      phoneNumber: "+15555550123",
      messageText: "synthetic private message",
      templateText: "synthetic template",
      contactId: "contact_123",
      clientId: "client_123",
      prospectId: "prospect_123",
      providerId: "provider_123",
      receiptId: "receipt_123",
      token: "secret_token_123",
      secret: "secret_value_123",
      rawBody: "{synthetic:true}",
      mediaUrl: "https://media.invalid/private",
      protectedValue: "1234.56",
      metadata: { nested: "not_allowed" },
    };

    for (const [key, value] of Object.entries(prohibited)) {
      expect(() =>
        projectCommunicationsTelemetryEvent({ ...SAFE_EVENT, [key]: value }),
      ).toThrow("COMMUNICATIONS_TELEMETRY_INVALID");
    }
  });

  it("emits only safe markers and never preserves raw payload fragments", () => {
    const event = projectCommunicationsTelemetryEvent(SAFE_EVENT);
    const serialized = JSON.stringify(event);

    expect(event).toEqual(SAFE_EVENT);
    expect(serialized).not.toMatch(/phone|message|template|contact|client|prospect/i);
    expect(serialized).not.toMatch(/provider|receipt|token|secret|rawBody|mediaUrl/i);
    expect(Object.isFrozen(event)).toBe(true);
  });
});
