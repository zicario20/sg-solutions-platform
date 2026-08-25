import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("packages/database/src/postgres-bookkeeping-permissions.ts", "utf8");

describe("M031 administrative permission adapter", () => {
  it("uses M007 role assignments and requires MFA for bookkeeping administration", () => {
    expect(source).toContain("class PostgresBookkeepingPermissionGateway");
    expect(source).toContain("auth_role_assignments");
    expect(source).toContain("auth_role_permissions");
    expect(source).toContain('input.assurance !== "aal2"');
  });

  it("fails closed and does not introduce provider access", () => {
    expect(source).toContain('kind: "denied"');
    expect(source).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
