import { describe, expect, it } from "vitest";
import { createConfiguredBookkeepingRuntime } from "../../apps/app/src/lib/bookkeeping/runtime.ts";

describe("M031 bookkeeping runtime", () => {
  it("fails closed unless internal bookkeeping runtime prerequisites are configured", () => {
    expect(createConfiguredBookkeepingRuntime({})).toEqual({ kind: "unavailable" });
    expect(
      createConfiguredBookkeepingRuntime({
        M031_BOOKKEEPING_ENABLED: "true",
        DATABASE_URL: "postgres://atlas.test/bookkeeping",
      }),
    ).toEqual({ kind: "unavailable" });
  });
});
