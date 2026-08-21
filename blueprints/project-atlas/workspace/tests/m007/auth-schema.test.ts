import { authTables } from "@atlas/database";
import { describe, expect, it } from "vitest";

describe("M007 auth schema", () => {
  it("contains account state but never local credentials", () => {
    expect(authTables).toContain("auth_accounts");
    expect(authTables).not.toContain("auth_local_credentials");
  });
});
