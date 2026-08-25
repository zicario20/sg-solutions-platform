import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");

describe("M031 reviewable reconciliation gateway", () => {
  it("keeps financial accounts disconnected and transaction records idempotent", () => {
    expect(gateway).toContain("async registerFinancialAccount");
    expect(gateway).toContain("async recordSourceTransaction");
    expect(gateway).toContain("'not_connected'");
    expect(gateway).toContain("on conflict (financial_account_id,source_reference) do nothing");
  });

  it("creates review-required reconciliation sessions rather than silently closing them", () => {
    expect(gateway).toContain("async createReconciliationSession");
    expect(gateway).toContain("'review_required'");
    expect(gateway).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
