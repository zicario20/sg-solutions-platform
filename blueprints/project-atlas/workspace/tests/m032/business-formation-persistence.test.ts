import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const migrationPath = resolve(root, "drizzle/0040_m032_business_formation.sql");
const schemaPath = resolve(root, "packages/database/src/schema/business-formation.ts");

describe("M032 persistence boundary", () => {
  it("models versioned requirements, immutable filing outcomes and idempotent handoffs", () => {
    const migration = readFileSync(migrationPath, "utf8").toLowerCase();
    const schema = readFileSync(schemaPath, "utf8").toLowerCase();

    for (const table of [
      "formation_cases",
      "formation_requirement_versions",
      "formation_requirement_snapshots",
      "formation_packages",
      "formation_filing_attempts",
      "formation_filing_outcomes",
      "formation_handoffs",
      "formation_audit_events",
    ]) {
      expect(migration).toContain(`public.${table}`);
      expect(schema).toContain(`"${table}"`);
    }

    expect(migration).toContain("formation_filing_attempts_case_idempotency_unique");
    expect(migration).toContain("formation_handoffs_case_destination_approval_unique");
    expect(migration).toContain("formation_filing_outcomes_immutable");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("atlas_formation_gateway nologin nobypassrls");
  });
});
