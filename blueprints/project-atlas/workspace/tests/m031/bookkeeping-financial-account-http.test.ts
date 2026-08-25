import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const financialAccountRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/financial-accounts/route.ts"),
  "utf8",
);

describe("M031 financial-account registry command", () => {
  it("requires management authority and mutation proof", () => {
    expect(financialAccountRoute).toContain('permission: "admin.bookkeeping.manage"');
    expect(financialAccountRoute).toContain("validBookkeepingMutationProof");
    expect(financialAccountRoute).toContain("registerFinancialAccount");
  });

  it("keeps the registry disconnected from external account providers", () => {
    expect(financialAccountRoute).toContain("idempotencyKey");
    expect(financialAccountRoute).not.toMatch(/plaid|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
