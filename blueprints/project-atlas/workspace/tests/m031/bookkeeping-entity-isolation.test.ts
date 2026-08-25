import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gateway = readFileSync(
  resolve(process.cwd(), "packages/database/src/postgres-bookkeeping.ts"),
  "utf8",
);
const migration = readFileSync(
  resolve(process.cwd(), "drizzle/0038_m031_controlled_bookkeeping.sql"),
  "utf8",
);
const schema = readFileSync(
  resolve(process.cwd(), "packages/database/src/schema/bookkeeping.ts"),
  "utf8",
);

describe("M031 accounting entity isolation", () => {
  it("requires an authorized accounting entity before engagement and book setup", () => {
    expect(gateway).toContain("select id from accounting_entities");
    expect(gateway).toContain(
      "engagement.accounting_entity_ref=" + "$" + "{input.accountingEntityRef}",
    );
    expect(gateway).toContain("join accounting_entities entity");
  });

  it("makes entity references durable foreign-key boundaries in the authored migration", () => {
    expect(migration).toContain("bookkeeping_engagements_accounting_entity_fk");
    expect(migration).toContain("accounting_books_accounting_entity_fk");
    expect(migration).toContain("bookkeeping_cases_accounting_entity_fk");
    expect(schema).toContain("references(() => accountingEntities.id");
  });
});
