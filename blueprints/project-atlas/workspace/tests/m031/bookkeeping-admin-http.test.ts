import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("apps/app/src/app/api/admin/bookkeeping/route.ts", "utf8");

describe("M031 administrative bookkeeping API", () => {
  it("checks the M007 permission gateway before any internal command", () => {
    expect(route).toContain("runtime.permissions.authorize");
    expect(route).toContain("admin.bookkeeping.report");
    expect(route).toContain("admin.bookkeeping.close");
    expect(route).toContain("validBookkeepingMutationProof");
  });

  it("accepts explicit commands and keeps providers outside the route", () => {
    expect(route).toContain('action === "request_close"');
    expect(route).toContain('action === "approve_close"');
    expect(route).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
