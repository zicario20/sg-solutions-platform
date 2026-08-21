import { authRlsHardeningSql } from "@atlas/database";
import { describe, expect, it } from "vitest";

describe("M007 restricted-role RLS boundary", () => {
  it("forces RLS and prevents browser roles from receiving table privileges", () => {
    expect(authRlsHardeningSql).toContain("FORCE ROW LEVEL SECURITY");
    expect(authRlsHardeningSql).toContain("REVOKE ALL");
  });
});
