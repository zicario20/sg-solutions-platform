import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { describe, expect, it } from "vitest";

describe("M007 server-only auth runtime", () => {
  it("uses injected durable control-plane dependencies per request and never a memory fallback", async () => {
    let admitted = 0;
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      controlPlane: {
        admit: async () => { admitted += 1; return { kind: "accepted" as const }; },
        bootstrap: async () => ({ handle: "h", csrf: "c" }),
        revoke: async () => ({ kind: "revoked" as const }),
      },
    });
    const response = await runtime.handle("recovery", new Request("https://portal.example/api/auth/recovery", { method: "POST", headers: { origin: "https://portal.example" } }));
    expect(response.status).toBe(202);
    expect(admitted).toBe(1);
  });

  it("fails closed when server durable dependencies are absent", async () => {
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example" });
    await expect(runtime.handle("login", new Request("https://portal.example/api/auth/login", { method: "POST", headers: { origin: "https://portal.example" } }))).resolves.toMatchObject({ status: 503 });
  });

  it("routes the OAuth callback through an injected server verifier", async () => {
    let callbacks = 0;
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", oauthProvider: { completeGoogle: async () => { callbacks += 1; return { kind: "verified" as const, subject: "supabase-subject" }; } } });
    const response = await runtime.handle("oauth_callback", new Request("https://portal.example/api/auth/oauth/google/callback?state=s&nonce=n&code_verifier=p", { headers: { origin: "https://portal.example" } }));
    expect(response.status).toBe(202);
    expect(callbacks).toBe(1);
  });
});
