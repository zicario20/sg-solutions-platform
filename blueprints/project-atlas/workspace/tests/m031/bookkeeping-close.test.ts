import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gateway = readFileSync("packages/database/src/postgres-bookkeeping.ts", "utf8");
const migration = readFileSync("drizzle/0038_m031_controlled_bookkeeping.sql", "utf8");

describe("M031 controlled close workflow", () => {
  it("persists a reviewable close request and requires a different reviewer", () => {
    expect(migration).toContain("accounting_close_requests");
    expect(gateway).toContain("async requestPeriodClose");
    expect(gateway).toContain("async approvePeriodClose");
    expect(gateway).toContain("reviewerAccountId === request.requested_by_account_id");
  });

  it("never hard-closes a period and records an auditable soft-close transition", () => {
    expect(gateway).toContain("'soft_closed'");
    expect(gateway).toContain("'accounting_period_soft_closed'");
    expect(gateway).not.toMatch(/status='hard_closed'|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
