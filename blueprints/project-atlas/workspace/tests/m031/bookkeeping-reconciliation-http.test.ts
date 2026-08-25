import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reconciliationRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/reconciliations/route.ts"),
  "utf8",
);

describe("M031 manual reconciliation command", () => {
  it("requires management authority and mutation proof", () => {
    expect(reconciliationRoute).toContain('permission: "admin.bookkeeping.manage"');
    expect(reconciliationRoute).toContain("validBookkeepingMutationProof");
    expect(reconciliationRoute).toContain("createReconciliationSession");
  });

  it("creates a review-required local session without a feed", () => {
    expect(reconciliationRoute).toContain("statementEndingBalanceMinor");
    expect(reconciliationRoute).toContain("differenceMinor");
    expect(reconciliationRoute).toContain("idempotencyKey");
    expect(reconciliationRoute).not.toMatch(/plaid|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
