import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("M042 Service Catalog persistence foundation", () => {
  it("keeps catalog configuration, historical versions and governance records behind RLS", () => {
    const schema = [
      readFileSync(
        resolve(process.cwd(), "packages/database/src/schema/service-catalog.ts"),
        "utf8",
      ),
      readFileSync(
        resolve(process.cwd(), "packages/database/src/schema/service-catalog-completion.ts"),
        "utf8",
      ),
    ].join("\n");
    const migration = [
      readFileSync(resolve(process.cwd(), "drizzle/0050_m042_service_catalog.sql"), "utf8"),
      readFileSync(
        resolve(process.cwd(), "drizzle/0052_m042_service_catalog_completion.sql"),
        "utf8",
      ),
    ].join("\n");

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
      "serviceCatalogOrderSnapshots",
      "serviceCatalogDeprecations",
      "serviceCatalogAiOutputs",
      "serviceCatalogBreakGlassRequests",
      "serviceCatalogDriftFindings",
      "serviceCatalogRecoveryVerifications",
      "serviceCatalogMetricDefinitions",
      "serviceCatalogWorkQueueItems",
      "serviceCatalogSecurityIncidents",
    ]) {
      expect(schema).toContain(table);
    }

    for (const table of [
      "service_catalog_definitions",
      "service_catalog_versions",
      "service_catalog_commercial_profiles",
      "service_catalog_publications",
      "service_catalog_governance_records",
      "service_catalog_order_snapshots",
      "service_catalog_deprecations",
      "service_catalog_ai_outputs",
      "service_catalog_break_glass_requests",
      "service_catalog_drift_findings",
      "service_catalog_recovery_verifications",
      "service_catalog_metric_definitions",
      "service_catalog_work_queue_items",
      "service_catalog_security_incidents",
    ]) {
      expect(migration).toContain(table);
    }

    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("service_catalog_deny_all");
  });
});
