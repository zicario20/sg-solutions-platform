import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);

describe("M031 lifecycle audit evidence", () => {
  it("records provider-disabled registry and review workflow lifecycle events", () => {
    expect(gateway).toContain("financial_account_registered");
    expect(gateway).toContain("source_transaction_recorded");
    expect(gateway).toContain("reconciliation_session_created");
    expect(gateway).toContain("insert into bookkeeping_audit_events");
  });
});
