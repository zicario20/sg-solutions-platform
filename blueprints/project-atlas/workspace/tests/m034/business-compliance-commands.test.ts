import { describe, expect, it } from "vitest";

import { createComplianceCommandService } from "../../packages/business-compliance/src/index.ts";

describe("M034 command authorization", () => {
  it("denies compliance profile writes without a server-side permission", async () => {
    const service = createComplianceCommandService({
      authorization: { authenticate: async () => true, allows: async () => false },
      profiles: { get: async () => undefined, save: async () => undefined },
      cases: {
        get: async () => undefined,
        save: async () => undefined,
        update: async () => undefined,
      },
      audit: { append: async () => undefined },
    });
    await expect(
      service.saveProfile(
        { actorRef: "staff-34", subjectRef: "staff-34" },
        {
          organizationRef: "org-34",
          entityType: "limited_liability_company",
          formationJurisdiction: "IL",
          formationDate: "2025-06-10",
          activityCodes: [],
          businessLocationJurisdictions: ["IL"],
          employeeStates: [],
          taxJurisdictions: ["IL"],
          verificationStatus: "verified",
          sourceReferences: ["source-34"],
          version: 1,
          capturedAt: "2026-08-25T00:00:00.000Z",
        },
        "update_profile",
      ),
    ).rejects.toThrow("COMPLIANCE_PERMISSION_DENIED");
  });
});
