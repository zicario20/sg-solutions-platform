import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { BookkeepingServiceType } from "../../packages/bookkeeping/src/contracts.ts";

describe("M031 bookkeeping service catalog", () => {
  it("keeps every approved internal service type available without enabling providers", () => {
    const serviceTypes = [
      "monthly_bookkeeping",
      "quarterly_bookkeeping",
      "annual_cleanup",
      "catch_up_bookkeeping",
      "cleanup_bookkeeping",
      "bookkeeping_cleanup",
      "tax_ready_books",
      "transaction_categorization",
      "bank_reconciliation",
      "financial_reporting",
      "custom_bookkeeping_service",
    ] satisfies readonly BookkeepingServiceType[];

    expect(serviceTypes).toHaveLength(11);
    const contract = readFileSync(
      resolve(process.cwd(), "packages/bookkeeping/src/contracts.ts"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(process.cwd(), "drizzle/0038_m031_controlled_bookkeeping.sql"),
      "utf8",
    );

    for (const serviceType of serviceTypes) {
      expect(contract).toContain(`"${serviceType}"`);
      expect(migration).toContain(`'${serviceType}'`);
    }
    expect(
      readFileSync(resolve(process.cwd(), "packages/bookkeeping/src/service.ts"), "utf8"),
    ).toContain("serviceType: BookkeepingServiceType;");
    expect(
      readFileSync(resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"), "utf8"),
    ).toContain("serviceType: BookkeepingServiceType;");
  });
});
