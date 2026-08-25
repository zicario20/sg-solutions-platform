import { describe, expect, it } from "vitest";

import {
  authorizeComplianceExport,
  createComplianceBreakGlassGrant,
  createComplianceMigrationRecord,
  createComplianceRenewalPlan,
  createLicenseComplianceRecord,
  evaluateCompliancePartnerCapability,
} from "../../packages/business-compliance/src/index.ts";

describe("M034 maintenance and security operations", () => {
  it("keeps licenses and renewals sourced, idempotent, and non-executable", () => {
    const license = createLicenseComplianceRecord({
      organizationRef: "org-34",
      jurisdictionCode: "IL",
      licenseTypeCode: "local_business_license",
      status: "renewal_due",
      sourceReference: "official-license-source",
      expirationDate: "2026-12-31",
    });
    const renewal = createComplianceRenewalPlan({
      organizationRef: "org-34",
      sourceRecordRef: license.recordId,
      dueDate: "2026-12-31",
      dueDateConfidence: "verified",
    });
    expect(renewal.canExecuteExternally).toBe(false);
    expect(renewal.idempotencyKey).toContain(license.recordId);
  });

  it("denies partner sharing by default and governs sensitive exports and break-glass", () => {
    expect(
      evaluateCompliancePartnerCapability({
        capability: {
          partnerRef: "partner-34",
          jurisdictionCode: "IL",
          capability: "license_support",
          status: "disabled",
          supportsDataSharing: false,
          requiresSpecificConsent: true,
          canShareDataAutomatically: false,
        },
        provider: {
          providerCode: "partner-34",
          status: "disabled",
          supportsSubmission: false,
          supportsStatusLookup: false,
          killSwitchEnabled: true,
        },
        dataScope: [],
        consentPresent: false,
      }),
    ).toEqual({ allowed: false, reason: "PARTNER_DISABLED" });
    expect(() =>
      authorizeComplianceExport({
        actorRef: "staff-34",
        resourceScope: ["org-34"],
        purpose: "support",
        reauthenticated: false,
        elevatedPermission: true,
        now: "2026-08-25T00:00:00.000Z",
        ttlSeconds: 60,
      }),
    ).toThrow("COMPLIANCE_EXPORT_NOT_AUTHORIZED");
    expect(
      createComplianceBreakGlassGrant({
        ownerRef: "owner-34",
        scope: ["org-34"],
        reason: "incident",
        reauthenticated: true,
        mfaVerified: true,
        now: "2026-08-25T00:00:00.000Z",
        ttlSeconds: 60,
      }).auditRequired,
    ).toBe(true);
  });

  it("marks imported history as non-SG evidence", () => {
    const migration = createComplianceMigrationRecord({
      organizationRef: "org-34",
      sourceSystem: "legacy",
      cutoffDate: "2026-08-01",
      importedRequirementRefs: ["req-34"],
      importedObligationRefs: ["obl-34"],
      verificationStatus: "review_required",
      historicalStatus: "historical_unknown",
    });
    expect(migration.canClaimSgProcessedHistory).toBe(false);
  });
});
