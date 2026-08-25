import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = resolve(import.meta.dirname, "../..");
const migrationPath = resolve(workspace, "drizzle/0038_m031_controlled_bookkeeping.sql");

describe("M031 controlled bookkeeping schema", () => {
  it("creates protected bookkeeping tables without seed data", () => {
    const migration = readFileSync(migrationPath, "utf8").toLowerCase();

    for (const table of [
      "bookkeeping_engagements",
      "accounting_books",
      "accounting_periods",
      "chart_accounts",
      "financial_account_registry",
      "source_transactions",
      "journal_entries",
      "journal_entry_lines",
      "reconciliation_sessions",
      "bookkeeping_audit_events",
      "bookkeeping_outbox",
    ]) {
      expect(migration).toContain(`create table public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(migration).toContain("create role atlas_bookkeeping_gateway");
    expect(migration).toContain("amount_minor bigint");
    expect(migration).toContain("bookkeeping_journal_entries_posted_immutable");
    expect(migration).not.toMatch(/insert\s+into\s+public\./u);
  });
});
