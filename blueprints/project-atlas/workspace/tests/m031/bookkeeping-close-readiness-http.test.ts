import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readinessRoute = readFileSync(
  resolve(process.cwd(), "apps/app/src/app/api/admin/bookkeeping/close-readiness/route.ts"),
  "utf8",
);

describe("M031 close readiness endpoint", () => {
  it("requires report authority and exposes readiness without a state mutation", () => {
    expect(readinessRoute).toContain('permission: "admin.bookkeeping.report"');
    expect(readinessRoute).toContain("getCloseReadiness");
    expect(readinessRoute).not.toContain("approvePeriodClose");
    expect(readinessRoute).not.toContain("requestPeriodClose");
  });
});
