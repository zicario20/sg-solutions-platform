import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reportsRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/reports/route.ts"),
  "utf8",
);

describe("M031 bookkeeping report endpoint", () => {
  it("requires M007 report authorization before returning a report", () => {
    expect(reportsRoute).toContain('permission: "admin.bookkeeping.report"');
    expect(reportsRoute).toContain("unauthorized");
  });

  it("offers only read-only financial statements from the ledger", () => {
    expect(reportsRoute).toContain('"trial_balance"');
    expect(reportsRoute).toContain('"profit_and_loss"');
    expect(reportsRoute).toContain('"balance_sheet"');
    expect(reportsRoute).toContain('"general_ledger"');
    expect(reportsRoute).toContain("getTrialBalance");
    expect(reportsRoute).toContain("getProfitAndLoss");
    expect(reportsRoute).toContain("getBalanceSheet");
    expect(reportsRoute).toContain("getGeneralLedger");
    expect(reportsRoute).not.toMatch(/quickbooks|xero|bank[ _-]?feed|createCheckout/i);
  });
});
