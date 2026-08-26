import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("M045 database contract", () => {
  const schema = readFileSync(
    new URL("../../packages/database/src/schema/service-entitlements.ts", import.meta.url),
    "utf8",
  );
  const migration = readFileSync(
    new URL(
      "../../drizzle/0055_m045_service_entitlements_controlled_foundation.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("defines an auditable entitlement authority with deny-by-default RLS", () => {
    expect(schema).toContain("entitlementDefinitions");
    expect(schema).toContain("entitlementDecisions");
    expect(schema).toContain("entitlementUsageCounters");
    expect(schema).toContain(".enableRLS()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("USING (false)");
    expect(migration).not.toContain("stripe.");
    expect(migration).not.toContain("start_operational_workflow");
  });
});
