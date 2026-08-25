import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");

describe("M031 reporting and close-readiness gateway", () => {
  it("reads only posted double-entry data within the authorized book", () => {
    expect(gateway).toContain("async getTrialBalance");
    expect(gateway).toContain("entry.status='posted'");
    expect(gateway).toContain("group by account.id,account.code,account.name,account.category");
  });

  it("exposes close blockers without closing a period", () => {
    expect(gateway).toContain("async getCloseReadiness");
    expect(gateway).toContain("reconciliation_sessions");
    expect(gateway).toContain("review_required");
    expect(gateway).not.toMatch(/status='hard_closed'|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
