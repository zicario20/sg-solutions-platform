import { describe, expect, it } from "vitest";
import { createDurableAuthHttpFactory } from "../../apps/app/src/lib/auth/http.ts";
import { deriveSessionCsrfToken } from "../../packages/auth/src/crypto.ts";

describe("M007 durable HTTP lifecycle wiring", () => {
  it("routes session listing, rotation, and invitation acceptance through the injected durable adapter", async () => {
    const calls: string[] = [];
    const handler = createDurableAuthHttpFactory(
      {
        sessions: {
          list: async () => {
            calls.push("list");
            return [{ id: "s1" }];
          },
          rotate: async () => {
            calls.push("rotate");
            return { kind: "rotated" as const, handle: "next" };
          },
          revokeCurrent: async () => ({ kind: "revoked" as const }),
          revokeOthers: async () => ({ kind: "revoked" as const }),
        },
        invitations: {
          accept: async (input) => {
            calls.push(input.sessionHandle);
            return { kind: "consumed" as const };
          },
        },
      },
      "csrf-secret-at-least-32-bytes-long",
      { canonicalOrigin: "https://portal.example" },
    );
    const csrf = deriveSessionCsrfToken("csrf-secret-at-least-32-bytes-long", "handle");
    const cookie = {
      origin: "https://portal.example",
      cookie: `__Host-atlas_auth=handle; __Host-atlas_csrf=${csrf}`,
      "x-atlas-csrf": csrf,
    };
    await expect(
      handler.sessions(
        new Request("https://portal.example/api/auth/sessions", { headers: cookie }),
      ),
    ).resolves.toMatchObject({ status: 200 });
    await expect(
      handler.rotate(
        new Request("https://portal.example/api/auth/sessions", {
          method: "POST",
          headers: cookie,
        }),
      ),
    ).resolves.toMatchObject({ status: 204 });
    await expect(
      handler.acceptInvitation(
        new Request("https://portal.example/api/auth/invitations/accept", {
          method: "POST",
          headers: {
            origin: "https://portal.example",
            cookie: `__Host-atlas_auth=handle; __Host-atlas_csrf=${csrf}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: `id=i&code=p&csrf=${csrf}`,
        }),
      ),
    ).resolves.toMatchObject({ status: 202 });
    expect(calls).toEqual(["list", "rotate", "handle"]);
  });
});
