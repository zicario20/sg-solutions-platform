import { AuthorizationService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 authorization", () => {
  it("denies browser-supplied roles and authorization without an active receipt", async () => {
    await expect(
      new AuthorizationService().authorize(
        { activeSession: true, permissions: [], resourceReceipt: undefined },
        "admin.user.manage",
      ),
    ).resolves.toEqual({ kind: "denied" });
  });
});
