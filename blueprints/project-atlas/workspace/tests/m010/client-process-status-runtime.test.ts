import { describe, expect, it } from "vitest";
import { createConfiguredProcessStatusRuntime } from "../../apps/app/src/lib/process-status/configured-runtime.ts";

describe("M010 runtime", () => {
  it("is provider-disabled and fail-closed without explicit ports", async () => {
    const runtime = createConfiguredProcessStatusRuntime();
    expect(
      await runtime.admit("process_status_ssr", new Request("https://atlas.test/client/status")),
    ).toBe(false);
    expect(runtime.query).toBeUndefined();
  });
});
