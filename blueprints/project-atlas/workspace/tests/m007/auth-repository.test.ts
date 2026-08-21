import { MemoryAuthRepository } from "@atlas/database";
import { describe, expect, it } from "vitest";

describe("M007 auth repository", () => {
  it("consumes each opaque proof only once", async () => {
    const repository = new MemoryAuthRepository();

    await expect(repository.consumeProofTwice("proof_digest")).resolves.toEqual([
      { kind: "consumed" },
      { kind: "replay_denied" },
    ]);
  });
});
