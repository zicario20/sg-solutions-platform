import { AuthApplicationFacade, createAuthRuntime } from "../../apps/app/src/lib/auth/runtime.ts";
import { describe, expect, it } from "vitest";

describe("M007 application facade", () => {
  it("rejects hostile origins and missing session composition", async () => {
    await expect(new AuthApplicationFacade("https://app.example").postLogin("https://hostile.example")).resolves.toEqual({ status: 403, body: { kind: "denied" } });
    expect(createAuthRuntime(undefined)).toEqual({ kind: "unavailable" });
  });
});
