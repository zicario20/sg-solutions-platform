import { describe, expect, it } from "vitest";

import { proposeTransferMatch } from "../../packages/bookkeeping/src/transactions.ts";

describe("M031 transfer matching", () => {
  it("proposes equal absolute movements in opposite directions for human review", () => {
    expect(
      proposeTransferMatch({
        first: { sourceId: "outgoing", amountMinor: 12500, direction: "outflow" },
        second: { sourceId: "incoming", amountMinor: 12500, direction: "inflow" },
      }),
    ).toEqual({
      status: "proposed",
      sourceTransactionIds: ["incoming", "outgoing"],
      requiresHumanReview: true,
    });
  });

  it("does not propose different amounts or a movement paired with itself", () => {
    expect(
      proposeTransferMatch({
        first: { sourceId: "same", amountMinor: 12500, direction: "outflow" },
        second: { sourceId: "same", amountMinor: 12500, direction: "inflow" },
      }).status,
    ).toBe("not_a_match");
    expect(
      proposeTransferMatch({
        first: { sourceId: "one", amountMinor: 12500, direction: "outflow" },
        second: { sourceId: "two", amountMinor: 12499, direction: "inflow" },
      }).status,
    ).toBe("not_a_match");
  });
});
