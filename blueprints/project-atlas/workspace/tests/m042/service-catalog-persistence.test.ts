import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("M042 Service Catalog persistence foundation", () => {
  it("keeps catalog configuration, historical versions and governance records behind RLS", () => {
    const schema = readFileSync(
      resolve(process.cwd(), "packages/database/src/schema/service-catalog.ts"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(process.cwd(), "drizzle/0050_m042_service_catalog.sql"),
      "utf8",
    );

    for (const table of [
      "serviceCatalogDefinitions",
      "serviceCatalogVersions",
      "serviceCatalogCommercialProfiles",
      "serviceCatalogDocumentRequirementSets",
      "serviceCatalogWorkflowBindings",
      "serviceCatalogPublications",
      "serviceCatalogDiscoveryDocuments",
      "serviceCatalogChangeRequests",
      "serviceCatalogGovernanceRecords",
      "serviceCatalogDataQualityFindings",
    ]) {
      expect(schema).toContain(table);
    }

    for (const table of [
      "service_catalog_definitions",
      "service_catalog_versions",
      "service_catalog_commercial_profiles",
      "service_catalog_publications",
      "service_catalog_governance_records",
    ]) {
      expect(migration).toContain(table);
    }

    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("service_catalog_deny_all");
  });
});
