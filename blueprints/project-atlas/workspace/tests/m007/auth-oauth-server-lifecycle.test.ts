import { createServerOAuthLifecycle } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 server OAuth lifecycle", () => {
  it("creates a session only after a one-time verified callback with non-conflicting CRM evidence", async () => {
    let consumed = false; let sessions = 0;
    const oauth = createServerOAuthLifecycle({ enabled: true, transactions: { begin: async () => ({ state: "s", nonce: "n", pkceVerifier: "p" }), consume: async () => consumed ? { kind: "replay_denied" as const } : (consumed = true, { kind: "consumed" as const }) }, verify: async () => ({ subject: "sub", emailVerified: true, issuer: "issuer", audience: "aud", expiresAt: Date.now() + 1_000 }), identities: { resolve: async () => ({ accountId: "a", crm: "linked" as const }) }, sessions: { create: async () => { sessions += 1; return { handle: "h" }; } }, issuer: "issuer", audience: "aud" });
    await expect(oauth.start()).resolves.toEqual({ kind: "started", state: "s", nonce: "n", pkceVerifier: "p" });
    await expect(oauth.callback({ state: "s", nonce: "n", pkceVerifier: "p" })).resolves.toEqual({ kind: "authenticated", handle: "h" });
    await expect(oauth.callback({ state: "s", nonce: "n", pkceVerifier: "p" })).resolves.toEqual({ kind: "denied" });
    expect(sessions).toBe(1);
  });
});
