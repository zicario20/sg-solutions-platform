import {
  createComplianceProfile,
  createComplianceSnapshot,
  validateComplianceRequirement,
} from "../../packages/business-compliance/src/index.ts";

export const now = "2026-08-25T00:00:00.000Z";

export const profile = createComplianceProfile({
  organizationRef: "org-34",
  entityType: "limited_liability_company",
  formationJurisdiction: "IL",
  formationDate: "2025-06-10",
  activityCodes: ["general_services"],
  businessLocationJurisdictions: ["IL"],
  employeeStates: [],
  taxJurisdictions: ["IL"],
  verificationStatus: "verified",
  sourceReferences: ["formation-case-34"],
  version: 1,
  capturedAt: now,
});

export const requirement = validateComplianceRequirement(
  {
    requirementId: "requirement-34",
    requirementCode: "IL_ANNUAL_REPORT",
    requirementType: "annual_report",
    jurisdictionCode: "IL",
    entityTypes: ["limited_liability_company"],
    activityCodes: ["general_services"],
    source: {
      sourceType: "official_government",
      authority: "Illinois Secretary of State",
      reference: "official-source-34",
      retrievedAt: now,
      verifiedAt: now,
      verifiedBy: "staff-34",
    },
    freshness: "current_verified",
    status: "active",
    effectiveFrom: "2020-01-01T00:00:00.000Z",
    version: 1,
    deadlineRule: {
      ruleType: "anniversary",
      intervalMonths: 12,
      weekendHolidayAdjustment: "none",
      timezone: "America/Chicago",
    },
    requiresProfessionalReview: false,
    serviceScopeDefault: "monitor_only",
  },
  now,
);

export const snapshot = createComplianceSnapshot({
  profile,
  requirementSetVersion: "compliance-2026.08",
  evaluatedAt: now,
});
