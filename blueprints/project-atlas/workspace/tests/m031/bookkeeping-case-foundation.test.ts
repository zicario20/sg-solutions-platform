import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const contracts = readFileSync(resolve(root, "packages/bookkeeping/src/contracts.ts"), "utf8");
const schema = readFileSync(resolve(root, "packages/database/src/schema/bookkeeping.ts"), "utf8");
const migration = readFileSync(
  resolve(root, "drizzle/0038_m031_controlled_bookkeeping.sql"),
  "utf8",
);
const gateway = readFileSync(
  resolve(root, "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);

describe("M031 bookkeeping case foundation", () => {
  it("models an isolated accounting entity and controlled case lifecycle", () => {
    expect(contracts).toContain("export type BookkeepingCaseStatus");
    expect(contracts).toContain('"setup_pending"');
    expect(contracts).toContain("export interface AccountingEntity");
    expect(contracts).toContain("export interface BookkeepingCase");
    expect(schema).toContain("export const accountingEntities");
    expect(schema).toContain("export const bookkeepingCases");
    expect(migration).toContain("CREATE TABLE public.accounting_entities");
    expect(migration).toContain("CREATE TABLE public.bookkeeping_cases");
    expect(schema).toContain('bookkeepingFrequency: varchar("bookkeeping_frequency"');
    expect(schema).toContain('bookStartOn: timestamp("book_start_on"');
    expect(schema).toContain('reportingFrequency: varchar("reporting_frequency"');
    expect(migration).toContain("bookkeeping_frequency varchar(16) NOT NULL");
    expect(migration).toContain("book_start_on timestamptz NOT NULL");
    expect(migration).toContain("reporting_frequency varchar(16) NOT NULL");
    expect(migration).toContain("bookkeeping_cases_server_gateway_only");
    expect(gateway).toContain("async createAccountingEntity");
    expect(gateway).toContain("async createBookkeepingCase");
    expect(gateway).toContain("bookkeeping_case_created");
  });
});
