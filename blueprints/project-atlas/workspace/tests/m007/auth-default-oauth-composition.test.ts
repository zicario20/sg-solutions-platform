import { describe, expect, it } from "vitest";
import { createDefaultOAuthAdapter } from "../../apps/app/src/lib/auth/http.ts";

describe("M007 default OAuth composition", () => {
  it("fails closed without allowlisted Supabase configuration and accepts an injected authoritative verifier", async () => {
    await expect(createDefaultOAuthAdapter({}).start()).resolves.toEqual({ kind: "unavailable" });
    const adapter = createDefaultOAuthAdapter(
      { SUPABASE_OAUTH_ENABLED: "true", SUPABASE_ISSUER: "issuer", SUPABASE_AUDIENCE: "aud" },
      {
        start: async () => ({
          kind: "started" as const,
          state: "s",
          nonce: "n",
          pkceVerifier: "p",
        }),
        callback: async () => ({ kind: "authenticated" as const, handle: "h" }),
        issueInvitation: async () => ({ kind: "issued" as const, id: "i", proof: "p" }),
      },
    );
    await expect(adapter.callback({ state: "s", nonce: "n", pkceVerifier: "p" })).resolves.toEqual({
      kind: "authenticated",
      handle: "h",
    });
  });
});
