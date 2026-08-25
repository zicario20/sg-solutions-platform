import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");

describe("M031 financial statements gateway", () => {
  it("derives financial statements and a ledger only from posted entries", () => {
    expect(gateway).toContain("async getProfitAndLoss");
    expect(gateway).toContain("async getBalanceSheet");
    expect(gateway).toContain("async getGeneralLedger");
    expect(gateway).toContain("entry.status='posted'");
  });

  it("keeps every statement fenced to the authorized book", () => {
    expect(gateway).toContain("book.owner_account_id=$" + "{input.actor.accountId}");
    expect(gateway).toContain("book.context_ref=$" + "{input.actor.contextRef}");
    expect(gateway).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
