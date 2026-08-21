import { AuthorizationService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 IDOR", () => {
  it("denies a resource whose owner receipt belongs to another account", async () => {
    await expect(new AuthorizationService().authorize({ activeSession: true, accountId: "client-a", permissions: ["client.case.read"], resourceReceipt: { accountId: "client-b", organizationId: "org-b", accessVersion: 1 } }, "client.case.read")).resolves.toEqual({ kind: "denied" });
  });
});
