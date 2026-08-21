import { createSyntheticIdentityProvider } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 synthetic ports", () => {
  it("marks synthetic identity adapters as test-only", async () => {
    await expect(createSyntheticIdentityProvider().signInWithPassword({ email: "test@example.com", password: "test" })).resolves.toMatchObject({ kind: "synthetic" });
  });
});
