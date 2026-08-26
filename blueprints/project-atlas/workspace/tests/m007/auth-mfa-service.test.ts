import { MfaService, ServiceIdentityVerifier } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 MFA and service identities", () => {
  it("fails closed for disabled MFA and over-scoped service credentials", async () => {
    await expect(new MfaService().challenge()).resolves.toEqual({ kind: "unavailable" });
    await expect(
      new ServiceIdentityVerifier().verify(
        { audience: "voice", scopes: ["voice.read", "admin.user.manage"] },
        { audience: "voice", scopes: ["voice.read"] },
      ),
    ).resolves.toEqual({ kind: "denied" });
  });
});
