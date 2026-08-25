import { toFormationAddressSummary } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation address privacy", () => {
  it("does not expose a street address in a client-safe registered-agent summary", () => {
    expect(
      toFormationAddressSummary({
        kind: "registered_agent",
        street: "123 Main Street",
        city: "Chicago",
        state: "IL",
      }),
    ).toEqual({ status: "on_file", localityLabel: "Chicago, IL" });
  });
});
