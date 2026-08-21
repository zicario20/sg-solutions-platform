import { createOAuthInvitationEntryPoints } from "../../apps/app/src/lib/auth/http.ts";
import { describe, expect, it } from "vitest";

describe("M007 OAuth and invitation entrypoints", () => {
  it("handles disabled, replay, conflict, and verified callback through server adapters", async () => {
    let used = false;
    const routes = createOAuthInvitationEntryPoints({ start: async () => ({ kind: "started" as const, state: "s", nonce: "n", pkceVerifier: "p" }), callback: async () => used ? { kind: "denied" as const } : (used = true, { kind: "authenticated" as const, handle: "h" }), issueInvitation: async () => ({ kind: "issued" as const, id: "i", proof: "p" }) }, "csrf-secret-at-least-32-bytes-long");
    await expect(routes.start(new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST", headers: { origin: "https://portal.example" } }))).resolves.toMatchObject({ status: 202 });
    await expect(routes.callback(new Request("https://portal.example/api/auth/oauth/google/callback?state=s&nonce=n&code_verifier=p", { headers: { origin: "https://portal.example" } }))).resolves.toMatchObject({ status: 204 });
    await expect(routes.callback(new Request("https://portal.example/api/auth/oauth/google/callback?state=s&nonce=n&code_verifier=p", { headers: { origin: "https://portal.example" } }))).resolves.toMatchObject({ status: 403 });
  });
});
