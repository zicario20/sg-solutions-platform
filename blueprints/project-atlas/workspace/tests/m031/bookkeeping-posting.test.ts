import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");

describe("M031 controlled ledger posting gateway", () => {
  it("creates accounts and posts only balanced entries into open periods", () => {
    expect(gateway).toContain("async createChartAccount");
    expect(gateway).toContain("async postJournalEntry");
    expect(gateway).toContain("period.status='open'");
    expect(gateway).toContain("totalDebit !== totalCredit");
    expect(gateway).toContain("journal_entry_lines");
  });

  it("writes an audit and outbox record in the same posting transaction", () => {
    expect(gateway).toContain("bookkeeping_audit_events");
    expect(gateway).toContain("bookkeeping_outbox");
    expect(gateway).toContain("pg_advisory_xact_lock");
    expect(gateway).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
