import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { describe, expect, it } from "vitest";

describe("AR-008 auth form runtime wiring", () => {
  it("accepts a same-origin named CSRF field from a real revoke-others form", async () => {
    let revoked = 0;
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", controlPlane: { admit: async () => ({ kind: "accepted" as const }), revokeCurrent: async () => ({ kind: "denied" as const }), revokeOthers: async () => { revoked += 1; return { kind: "revoked" as const }; } } });
    const response = await runtime.handle("sessions", new Request("https://portal.example/api/auth/sessions", { method: "POST", headers: { origin: "https://portal.example", cookie: "__Host-atlas_auth=handle; __Host-atlas_csrf=csrf", "content-type": "application/x-www-form-urlencoded" }, body: "csrf=csrf" }));
    expect(response.status).toBe(204);
    expect(revoked).toBe(1);
  });
});
