import { createDisabledIdentityProvider, type PasswordSignInCommand } from "@atlas/auth";
import { readAuthRuntimeConfig } from "@atlas/config";
import { parseLoginRequest } from "@atlas/validation";
import { describe, expect, it } from "vitest";

describe("M007 auth contracts", () => {
  it("normalizes login input and rejects browser-supplied authority", () => {
    expect(parseLoginRequest({ email: " USER@example.com ", password: "secret" }).email).toBe(
      "user@example.com",
    );
    expect(() => parseLoginRequest({ email: "x", password: "p", role: "Owner" })).toThrow();
  });

  it("defaults runtime configuration and identity delivery to disabled", async () => {
    const command: PasswordSignInCommand = {
      email: "user@example.com",
      password: "secret",
    };

    await expect(createDisabledIdentityProvider().signInWithPassword(command)).resolves.toEqual({
      kind: "unavailable",
      reason: "provider_disabled",
    });
    expect(readAuthRuntimeConfig({}).runtimeState).toBe("disabled");
  });
});
