import { createDurableOAuthTransactionService, digestOpaqueProof } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 OAuth transactions", () => {
  it("denies state substitution and callback replay", async () => {
    let stateDigest = ""; let consumed = false;
    const oauth = createDurableOAuthTransactionService({ issue: async (input) => { stateDigest = input.stateDigest; }, consume: async (input) => input.stateDigest !== stateDigest ? { kind: "denied" } : consumed ? { kind: "replay_denied" } : (consumed = true, { kind: "consumed" }) });
    const transaction = await oauth.begin({ provider: "google", purpose: "sign_in", callbackUrl: "https://portal.example/api/auth/oauth/google/callback", browserBinding: "browser", returnIntent: "/client" });

    expect(stateDigest).toBe(digestOpaqueProof(transaction.state));
    await expect(oauth.consume({ ...transaction, state: "wrong", callbackUrl: "https://portal.example/api/auth/oauth/google/callback", browserBinding: "browser" })).resolves.toEqual({ kind: "denied" });
    await expect(oauth.consume({ ...transaction, callbackUrl: "https://portal.example/api/auth/oauth/google/callback", browserBinding: "browser" })).resolves.toEqual({ kind: "consumed" });
    await expect(oauth.consume({ ...transaction, callbackUrl: "https://portal.example/api/auth/oauth/google/callback", browserBinding: "browser" })).resolves.toEqual({ kind: "replay_denied" });
  });
});
