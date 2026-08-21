import { createDurableAuthHttpFactory } from "../../apps/app/src/lib/auth/http.ts";
import { describe, expect, it } from "vitest";

describe("M007 durable HTTP lifecycle wiring", () => {
  it("routes session listing, rotation, and invitation acceptance through the injected durable adapter", async () => {
    const calls: string[] = [];
    const handler = createDurableAuthHttpFactory({
      sessions: { list: async () => { calls.push("list"); return [{ id: "s1" }]; }, rotate: async () => { calls.push("rotate"); return { kind: "rotated" as const, handle: "next" }; }, revokeCurrent: async () => ({ kind: "revoked" as const }), revokeOthers: async () => ({ kind: "revoked" as const }) },
      invitations: { accept: async (input) => { calls.push(`${input.contactId}:${input.scope}:${input.identityEvidenceId}`); return { kind: "consumed" as const }; } },
    });
    const cookie = { origin: "https://portal.example", cookie: "__Host-atlas_auth=handle; __Host-atlas_csrf=csrf", "x-atlas-csrf": "csrf" };
    await expect(handler.sessions(new Request("https://portal.example/api/auth/sessions", { headers: cookie }))).resolves.toMatchObject({ status: 200 });
    await expect(handler.rotate(new Request("https://portal.example/api/auth/sessions", { method: "POST", headers: cookie }))).resolves.toMatchObject({ status: 204 });
    await expect(handler.acceptInvitation(new Request("https://portal.example/api/auth/invitations/accept", { method: "POST", headers: { origin: "https://portal.example", "content-type": "application/x-www-form-urlencoded" }, body: "id=i&proof=p&contact_id=c&scope=org%3Aread&identity_evidence_id=e" }))).resolves.toMatchObject({ status: 202 });
    expect(calls).toEqual(["list", "rotate", "c:org:read:e"]);
  });
});
