import { IdentityLinkService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 identity linking", () => {
  it("reconciles provider auto-links that lack a local approved link", async () => {
    await expect(new IdentityLinkService().reconcile({ localLink: false })).resolves.toEqual({ kind: "reconciling" });
  });
});
