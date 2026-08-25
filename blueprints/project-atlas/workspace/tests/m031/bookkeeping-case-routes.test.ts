import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const entityRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/entities/route.ts"),
  "utf8",
);
const caseRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/cases/route.ts"),
  "utf8",
);

describe("M031 controlled entity and case commands", () => {
  it("requires management authority, a CSRF proof, and idempotency for entity setup", () => {
    expect(entityRoute).toContain('permission: "admin.bookkeeping.manage"');
    expect(entityRoute).toContain("validBookkeepingMutationProof");
    expect(entityRoute).toContain("idempotencyKey");
    expect(entityRoute).toContain("createAccountingEntity");
    expect(entityRoute).not.toMatch(/taxIdentifier[^T]|ein|ssn/i);
  });

  it("creates a bookkeeping case only through its authorized prerequisites", () => {
    expect(caseRoute).toContain('permission: "admin.bookkeeping.manage"');
    expect(caseRoute).toContain("validBookkeepingMutationProof");
    expect(caseRoute).toContain("createBookkeepingCase");
    expect(caseRoute).toContain("prerequisite_not_found");
    expect(caseRoute).not.toMatch(/plaid|quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
