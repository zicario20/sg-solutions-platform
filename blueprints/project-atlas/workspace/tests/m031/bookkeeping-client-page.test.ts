import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("apps/app/src/app/client/bookkeeping/page.tsx", "utf8");

describe("M031 client bookkeeping page", () => {
  it("renders authorized bookkeeping records with a safe provider-disabled state", () => {
    expect(page).toContain("createConfiguredBookkeepingRuntime");
    expect(page).toContain("listAuthorizedBooks");
    expect(page).toContain("Connections stay disabled");
    expect(page).toContain("Las conexiones permanecen deshabilitadas");
  });

  it("does not create, post, or connect financial data from the client view", () => {
    expect(page).not.toMatch(
      /createEngagement|createBook|postJournalEntry|bank[ _-]?feed|quickbooks|xero/i,
    );
  });

  it("does not render opaque entity references or raw bookkeeping status codes to the client", () => {
    expect(page).not.toContain("{item.accountingEntityRef}");
    expect(page).toContain("bookkeepingStatusLabel");
    expect(page).toContain("bookkeepingBasisLabel");
  });
});
