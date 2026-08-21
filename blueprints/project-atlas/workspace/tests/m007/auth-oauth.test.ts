import { OAuthTransactionService } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 OAuth transactions", () => {
  it("denies state substitution and callback replay", async () => {
    const oauth = new OAuthTransactionService();
    const transaction = await oauth.begin({ browserBinding: "browser", returnIntent: "/client" });

    await expect(oauth.consume({ ...transaction, state: "wrong" })).resolves.toEqual({ kind: "denied" });
    await expect(oauth.consume(transaction)).resolves.toEqual({ kind: "consumed" });
    await expect(oauth.consume(transaction)).resolves.toEqual({ kind: "replay_denied" });
  });
});
