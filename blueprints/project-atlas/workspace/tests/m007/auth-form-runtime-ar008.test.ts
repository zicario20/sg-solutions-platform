import { describe, expect, it } from "vitest";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { deriveSessionCsrfToken } from "../../packages/auth/src/crypto.ts";

describe("AR-008 auth form runtime wiring", () => {
  it("accepts a same-origin named CSRF field from a real revoke-others form", async () => {
    let revoked = 0;
    const secret = "csrf-secret-at-least-32-bytes-long";
    const csrf = deriveSessionCsrfToken(secret, "handle");
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      csrfSecret: secret,
      controlPlane: {
        admit: async () => ({ kind: "accepted" as const }),
        revokeCurrent: async () => ({ kind: "denied" as const }),
        revokeOthers: async () => {
          revoked += 1;
          return { kind: "revoked" as const };
        },
      },
    });
    const response = await runtime.handle(
      "sessions",
      new Request("https://portal.example/api/auth/sessions", {
        method: "POST",
        headers: {
          origin: "https://portal.example",
          cookie: `__Host-atlas_auth=handle; __Host-atlas_csrf=${csrf}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: `csrf=${csrf}`,
      }),
    );
    expect(response.status).toBe(204);
    expect(revoked).toBe(1);
  });

  it("expires both session-bound cookies after current-session logout", async () => {
    const secret = "csrf-secret-at-least-32-bytes-long";
    const csrf = deriveSessionCsrfToken(secret, "handle");
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      csrfSecret: secret,
      controlPlane: {
        admit: async () => ({ kind: "accepted" as const }),
        revokeCurrent: async () => ({ kind: "revoked" as const }),
        revokeOthers: async () => ({ kind: "denied" as const }),
      },
    });
    const response = await runtime.handle(
      "logout",
      new Request("https://portal.example/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "https://portal.example",
          cookie: `__Host-atlas_auth=handle; __Host-atlas_csrf=${csrf}`,
          "x-atlas-csrf": csrf,
        },
      }),
    );
    expect(response.status).toBe(204);
    const cookies = response.headers.get("set-cookie") ?? "";
    expect(cookies).toContain("__Host-atlas_auth=");
    expect(cookies).toContain("__Host-atlas_csrf=");
    expect(cookies.match(/Max-Age=0/gu)).toHaveLength(2);
  });
});
