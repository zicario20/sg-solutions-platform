import { ApplicationSessionService, MemorySessionStore } from "@atlas/auth";
import { createAuthSessionCookie } from "../../apps/app/src/lib/auth/cookies.ts";
import { describe, expect, it } from "vitest";

describe("M007 application sessions", () => {
  it("serializes only a secure host-only opaque handle", () => {
    const cookie = createAuthSessionCookie("opaque-handle").serialize();
    expect(cookie).toContain("__Host-atlas_auth=opaque-handle");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  it("revokes a session family when an old generation is reused", async () => {
    const sessions = new ApplicationSessionService(new MemorySessionStore());
    const established = await sessions.establish({ accountId: "account-1" });
    await sessions.refresh(established.handle);

    await expect(sessions.refresh(established.handle)).resolves.toEqual({ kind: "family_revoked" });
  });
});
