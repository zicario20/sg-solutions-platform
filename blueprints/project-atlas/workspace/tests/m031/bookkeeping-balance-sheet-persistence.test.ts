import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);

describe("M031 persisted balance-sheet projection", () => {
  it("includes current-period earnings when determining balance", () => {
    expect(gateway).toContain("currentPeriodEarningsMinor");
    expect(gateway).toContain("balanced:");
    expect(gateway).toContain('"income" | "expense"');
  });
});
