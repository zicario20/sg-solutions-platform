import { resolveClientServicePublicState } from "@atlas/client-services";
import { describe, expect, it } from "vitest";

describe("M009 exhaustive approved/not-started financial matrix", () => {
  it.each([
    ["unpaid", "payment_pending"],
    ["processing", "payment_pending"],
    ["paid", "approved_to_start"],
    ["partially_refunded", "partially_refunded"],
    ["refunded", "refunded"],
    ["disputed", "disputed"],
    ["cancelled", "unconfirmed"],
    ["unavailable", "unconfirmed"],
  ] as const)("maps %s without permissive fallthrough", (financial, expected) =>
    expect(
      resolveClientServicePublicState({
        commercial: "active",
        financial,
        activation: "approved",
        fulfillment: "not_started",
      }),
    ).toBe(expected),
  );
  it("fails closed for unknown future owner values", () =>
    expect(
      resolveClientServicePublicState({
        commercial: "active",
        financial: "future" as never,
        activation: "approved",
        fulfillment: "not_started",
      }),
    ).toBe("unconfirmed"));
  it.each(["pending_review", "declined", "unavailable", "future"] as const)(
    "never publishes active fulfillment while activation is %s",
    (activation) => {
      for (const fulfillment of [
        "in_progress",
        "waiting_client",
        "waiting_external",
        "completed",
      ] as const)
        expect(
          resolveClientServicePublicState({
            commercial: "active",
            financial: "paid",
            activation: activation as never,
            fulfillment,
          }),
        ).toBe("unconfirmed");
    },
  );
});
