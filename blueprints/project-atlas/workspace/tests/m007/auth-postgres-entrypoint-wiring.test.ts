import { createAuthEntryPoints } from "../../apps/app/src/lib/auth/http.ts";
import { deriveSessionCsrfToken } from "../../packages/auth/src/crypto.ts";
import { describe, expect, it } from "vitest";

describe("M007 PostgreSQL auth entrypoint wiring", () => {
  it("uses the injected durable adapter for real session and invitation routes", async () => {
    const calls: string[] = [];
    const secret = "csrf-secret-at-least-32-bytes-long"; const csrf = deriveSessionCsrfToken(secret, "h");
    const entrypoints = createAuthEntryPoints(async () => ({ sessions: { list: async () => { calls.push("list"); return []; }, rotate: async () => { calls.push("rotate"); return { kind: "family_revoked" as const }; }, revokeCurrent: async () => ({ kind: "revoked" as const }), revokeOthers: async () => ({ kind: "revoked" as const }) }, invitations: { accept: async () => { calls.push("accept"); return { kind: "consumed" as const }; } } }), secret, "https://portal.example");
    const session = await entrypoints.get(new Request("https://portal.example/api/auth/sessions", { headers: { origin: "https://portal.example", cookie: `__Host-atlas_auth=h; __Host-atlas_csrf=${csrf}`, "x-atlas-csrf": csrf } }));
    const rotate = await entrypoints.post(new Request("https://portal.example/api/auth/sessions", { method: "POST", headers: { origin: "https://portal.example", cookie: `__Host-atlas_auth=h; __Host-atlas_csrf=${csrf}`, "x-atlas-csrf": csrf, "x-atlas-session-action": "rotate" } }));
    const invite = await entrypoints.post(new Request("https://portal.example/api/auth/invitations/accept", { method: "POST", headers: { origin: "https://portal.example", cookie: `__Host-atlas_auth=h; __Host-atlas_csrf=${csrf}`, "x-atlas-csrf": csrf, "content-type": "application/x-www-form-urlencoded" }, body: "id=i&code=p" }));
    expect(session.status).toBe(200); expect(rotate.status).toBe(403); expect(invite.status).toBe(202); expect(calls).toEqual(["list", "rotate", "accept"]);
  });
});
