import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("apps/app/src/app/api/client/bookkeeping/route.ts", "utf8");
const admission = readFileSync("apps/app/src/app/api/client/bookkeeping/admission.ts", "utf8");

describe("M031 bookkeeping client API", () => {
  it("uses authenticated admission and no-store responses", () => {
    expect(admission).toContain("admitBookkeepingRequest");
    expect(route).toContain("export async function GET");
    expect(route).toContain("export async function POST");
    expect(route).toContain("bookkeeping_mutations_not_enabled");
    expect(route).toContain("}, 405)");
    expect(admission).toContain('Cache-Control": "private, no-store');
  });

  it("keeps mutation commands unavailable until an administrative authorization adapter exists", () => {
    expect(route).toContain("bookkeeping_mutations_not_enabled");
    expect(route).not.toContain("createEngagement");
    expect(route).not.toContain("createBook");
    expect(route).not.toMatch(/quickbooks|xero|bank[ _-]?feed|credential/i);
  });
});
