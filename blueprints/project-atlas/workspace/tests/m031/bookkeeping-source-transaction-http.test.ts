import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const transactionRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/source-transactions/route.ts"),
  "utf8",
);

describe("M031 manual source-transaction command", () => {
  it("requires management authority and mutation proof", () => {
    expect(transactionRoute).toContain('permission: "admin.bookkeeping.manage"');
    expect(transactionRoute).toContain("validBookkeepingMutationProof");
    expect(transactionRoute).toContain("recordSourceTransaction");
  });

  it("records a bounded manual input without external ingestion", () => {
    expect(transactionRoute).toContain("sourceReference");
    expect(transactionRoute).toContain("occurredOn");
    expect(transactionRoute).toContain("Number.isSafeInteger");
    expect(transactionRoute).not.toMatch(/plaid|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
