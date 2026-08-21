import { PartyLinkingService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 account-party linking", () => {
  it("preserves conflicting owner evidence for manual review", async () => {
    const linking = new PartyLinkingService();
    await expect(linking.resolve({ kind: "conflict" })).resolves.toEqual({ kind: "manual_review" });
  });
});
