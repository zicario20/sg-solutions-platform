import { describe, expect, it } from "vitest";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { deriveSessionCsrfToken } from "../../packages/auth/src/crypto.ts";

describe("M007 third-pass auth runtime", () => {
  it("keeps the current session when revoking other sessions", async () => {
    let current = 0;
    let others = 0;
    const secret = "csrf-secret-at-least-32-bytes-long";
    const csrf = deriveSessionCsrfToken(secret, "current");
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      csrfSecret: secret,
      controlPlane: {
        admit: async () => ({ kind: "accepted" as const }),
        revokeCurrent: async () => {
          current += 1;
          return { kind: "revoked" as const };
        },
        revokeOthers: async () => {
          others += 1;
          return { kind: "revoked" as const };
        },
      },
    });
    const headers = {
      origin: "https://portal.example",
      cookie: `__Host-atlas_auth=current; __Host-atlas_csrf=${csrf}`,
      "x-atlas-csrf": csrf,
    };
    await expect(
      runtime.handle(
        "sessions",
        new Request("https://portal.example/api/auth/sessions", { method: "POST", headers }),
      ),
    ).resolves.toMatchObject({ status: 204 });
    expect(others).toBe(1);
    expect(current).toBe(0);
  });

  it("returns a neutral rate-limit outcome rather than admitting over the limit", async () => {
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      controlPlane: {
        admit: async () => ({ kind: "rate_limited" as const }),
        revokeCurrent: async () => ({ kind: "denied" as const }),
        revokeOthers: async () => ({ kind: "denied" as const }),
      },
    });
    const response = await runtime.handle(
      "recovery",
      new Request("https://portal.example/api/auth/recovery", {
        method: "POST",
        headers: { origin: "https://portal.example" },
      }),
    );
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ kind: "accepted" });
  });
});
