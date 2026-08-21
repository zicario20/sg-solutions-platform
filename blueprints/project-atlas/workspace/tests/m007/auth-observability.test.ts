import { recordAuthTelemetry } from "@atlas/observability";
import { describe, expect, it } from "vitest";

describe("M007 auth telemetry", () => {
  it("rejects contact identifiers and accepts metadata-only events", () => {
    expect(() => recordAuthTelemetry({ event: "login_failed", email: "a@b.com" } as never)).toThrow();
    expect(recordAuthTelemetry({ event: "login_failed", outcome: "denied", correlationId: "cor-1" })).toEqual({ event: "login_failed", outcome: "denied", correlationId: "cor-1" });
  });
});
