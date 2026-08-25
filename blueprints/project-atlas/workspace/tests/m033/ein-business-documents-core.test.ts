import { describe, expect, it } from "vitest";

import {
  createEinApplicationDraft,
  createEinCase,
  createOrganizationIdentitySnapshot,
  evaluateExistingEin,
  selectCurrentEinRequirements,
  validateResponsibleParty,
} from "../../packages/ein-business-documents/src/index.ts";

const now = "2026-08-25T00:00:00.000Z";
const einCase = createEinCase({
  caseId: "ein-case-1",
  caseNumber: "EIN-1001",
  clientRef: "client-1",
  organizationRef: "org-1",
  serviceOrderRef: "order-1",
  formationCaseRef: "formation-1",
  deliveryModel: "sg_service",
  createdAt: now,
});
const snapshot = createOrganizationIdentitySnapshot({
  organizationRef: "org-1",
  legalName: "Example LLC",
  entityType: "limited_liability_company",
  formationJurisdiction: "IL",
  sourceRefs: ["formation-1"],
  capturedAt: now,
});
const requirements = selectCurrentEinRequirements({
  einCaseRef: einCase.caseId,
  at: now,
  requirements: [
    {
      requirementId: "req-1",
      ruleKey: "ss4",
      ruleValue: {},
      verificationStatus: "verified",
      sourceReference: "official-source-1",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      version: 1,
    },
  ],
});
const responsibleParty = {
  responsiblePartyRef: "rp-1",
  personRef: "person-1",
  role: "member" as const,
  identifierSecureRef: "secure-ref-1",
  verificationStatus: "verified" as const,
  verifiedAt: now,
};

describe("M033 EIN core", () => {
  it("uses formation and organization references without copying a tax identifier", () => {
    const application = createEinApplicationDraft({
      einCase,
      formVersion: "SS4-2026-v1",
      organizationSnapshot: snapshot,
      requirementSnapshot: requirements,
      responsibleParty: validateResponsibleParty(responsibleParty),
      nonSensitiveApplicationData: { reason: "started_new_business", employeeIntent: false },
      createdAt: now,
    });
    expect(application.applicationHash).toHaveLength(64);
    expect(JSON.stringify(application)).not.toContain("secure-ref-1");
  });

  it("blocks a verified existing EIN and routes uncertain answers to review", () => {
    expect(evaluateExistingEin("verified")).toEqual({
      kind: "blocked",
      reason: "EXISTING_EIN_VERIFIED",
    });
    expect(evaluateExistingEin("suspected").kind).toBe("manual_review_required");
  });
});
