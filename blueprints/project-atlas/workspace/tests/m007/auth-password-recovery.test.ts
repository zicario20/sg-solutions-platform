import { PasswordFlowService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 password recovery", () => {
  it("returns an indistinguishable recovery result for known and unknown email", async () => {
    const flows = new PasswordFlowService();
    await expect(flows.requestRecovery("known@example.com")).resolves.toEqual(
      await flows.requestRecovery("unknown@example.com"),
    );
  });
});
