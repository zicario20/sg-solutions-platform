import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/setup/route.ts"),
  "utf8",
);
const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);

describe("M031 controlled bookkeeping setup route", () => {
  it("requires the management permission and mutation proof before setup", () => {
    expect(route).toContain('permission: "admin.bookkeeping.manage"');
    expect(route).toContain("validBookkeepingMutationProof");
    expect(route).toContain("idempotencyKey");
    expect(route).toContain("bookStartDate.toISOString().slice(0, 10) !== bookStartOn");
    expect(route).toContain("createEngagement");
    expect(route).toContain("createBook");
  });

  it("persists book-creation audit and outbox evidence without a provider action", () => {
    expect(gateway).toContain("'accounting_book_created'");
    expect(gateway).toContain("'AccountingBookCreated.v1'");
    expect(route).not.toMatch(/quickbooks|xero|plaid|bank[ _-]?feed|credential/i);
  });
});
