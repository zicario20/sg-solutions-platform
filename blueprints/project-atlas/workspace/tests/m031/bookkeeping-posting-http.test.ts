import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const postingRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/journal-entries/route.ts"),
  "utf8",
);

describe("M031 controlled journal-entry command", () => {
  it("requires a distinct M007 posting permission and a mutation proof", () => {
    expect(postingRoute).toContain('permission: "admin.bookkeeping.post"');
    expect(postingRoute).toContain("validBookkeepingMutationProof");
    expect(postingRoute).toContain("forbidden");
  });

  it("delegates all accounting validation to the atomic ledger gateway", () => {
    expect(postingRoute).toContain("postJournalEntry");
    expect(postingRoute).toContain("idempotencyKey");
    expect(postingRoute).toContain('createHash("sha256")');
    expect(postingRoute).toContain("correlationId");
    expect(postingRoute).not.toMatch(/stripe|quickbooks|xero|bank[ _-]?feed/i);
  });
});
