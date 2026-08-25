import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("apps/app/src/app/admin/bookkeeping/page.tsx", "utf8");
const workspace = readFileSync(
  "apps/app/src/app/admin/bookkeeping/BookkeepingAdminClient.tsx",
  "utf8",
);

describe("M031 administrative workspace", () => {
  it("requires the report permission before rendering records", () => {
    expect(page).toContain("admin.bookkeeping.report");
    expect(page).toContain("notFound");
    expect(page).toContain("createConfiguredBookkeepingRuntime");
  });

  it("loads no-store data from the protected API without storage or provider behavior", () => {
    expect(workspace).toContain("/api/admin/bookkeeping");
    expect(workspace).toContain('cache: "no-store"');
    expect(workspace).not.toMatch(/localStorage|sessionStorage|quickbooks|xero|bank[ _-]?feed/i);
  });

  it("shows provider-disabled boundaries and accessible loading and book-selection states", () => {
    expect(workspace).toContain("Provider connections are disabled");
    expect(workspace).toContain('role="status"');
    expect(workspace).toContain("aria-pressed");
    expect(workspace).toContain("Trial balance for the selected bookkeeping book");
  });
});
