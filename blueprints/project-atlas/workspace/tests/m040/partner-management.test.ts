import {
  assertPartnerExternalOperationsDisabled,
  completeOnboarding,
  createBlockedAssignment,
  createEconomicCandidate,
  createPartner,
  createPartnerAiDraft,
  evaluatePartnerGate,
  type Partner,
  type PartnerAgreement,
  type PartnerAuthorization,
  type PartnerCapability,
  type PartnerJurisdiction,
  suspendPartner,
} from "@atlas/partner-management";
import { describe, expect, it } from "vitest";

const now = "2026-08-25T00:00:00.000Z";
const source = {
  id: "source",
  type: "official" as const,
  observedAt: now,
  verification: "verified" as const,
};
const partner: Partner = {
  id: "partner",
  organizationId: "organization",
  code: "EXAMPLE_PARTNER",
  legalName: "Example Partner LLC",
  displayName: "Example Partner",
  partnerType: "affiliate_network",
  status: "active",
  verificationStatus: "verified",
  riskTier: "moderate",
  createdAt: now,
  updatedAt: now,
};
const capability: PartnerCapability = {
  id: "capability",
  partnerId: partner.id,
  code: "accept_referral",
  domain: "marketplace",
  status: "active",
  conditions: [],
  source,
  verifiedAt: now,
  effectiveFrom: now,
  effectiveTo: null,
};
const jurisdiction: PartnerJurisdiction = {
  id: "jurisdiction",
  partnerId: partner.id,
  country: "US",
  state: "IL",
  county: null,
  scopeType: "statewide",
  status: "active",
  source,
  verifiedAt: now,
};
const agreement: PartnerAgreement = {
  id: "agreement",
  partnerId: partner.id,
  type: "affiliate",
  code: "AGREEMENT",
  version: 1,
  status: "active",
  source,
  effectiveFrom: now,
  effectiveTo: null,
  commercialTermsReference: "restricted-reference",
};
const authorization: PartnerAuthorization = {
  id: "authorization",
  partnerId: partner.id,
  type: "receive_referrals",
  capabilityId: capability.id,
  jurisdictionId: jurisdiction.id,
  agreementId: agreement.id,
  status: "approved",
  source,
  approvedBy: "reviewer",
  effectiveFrom: now,
  effectiveTo: null,
};
describe("M040 Partner Management", () => {
  it("creates one Organization-bound partner registry record", () => {
    expect(createPartner(partner, [])).toEqual(partner);
    expect(() => createPartner({ ...partner, id: "other" }, [partner])).toThrow("unique");
  });
  it("requires verified onboarding evidence", () => {
    expect(
      completeOnboarding(
        {
          id: "onboarding",
          partnerId: partner.id,
          type: "new_partner",
          status: "approval",
          ownerId: "owner",
          blockingFindingIds: [],
          startedAt: now,
          completedAt: null,
        },
        [{ onboardingId: "onboarding", required: true, status: "verified" }],
      ).status,
    ).toBe("active");
  });
  it("gates material actions by partner capability jurisdiction authorization and agreement", () => {
    expect(
      evaluatePartnerGate({
        partner,
        capability,
        jurisdiction,
        authorization,
        agreement,
        requiredAuthorization: "receive_referrals",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluatePartnerGate({
        partner: { ...partner, status: "suspended" },
        capability,
        jurisdiction,
        authorization,
        agreement,
        requiredAuthorization: "receive_referrals",
      }).allowed,
    ).toBe(false);
  });
  it("creates idempotent blocked assignments for every consuming module", () => {
    const assignment = createBlockedAssignment(
      {
        id: "assignment",
        partnerId: partner.id,
        sourceModule: "m039",
        sourceResourceId: "ccb-offer",
        idempotencyKey: "m039:ccb-offer",
        createdAt: now,
      },
      [],
    );
    expect(assignment.status).toBe("blocked");
    expect(() => createBlockedAssignment({ ...assignment, id: "another" }, [assignment])).toThrow(
      "replay",
    );
  });
  it("suspends new work but preserves active journeys", () => {
    const result = suspendPartner(partner, {
      id: "finding",
      partnerId: partner.id,
      type: "expired_license",
      severity: "critical",
      status: "open",
      blocking: true,
      source,
      createdAt: now,
    });
    expect(result).toMatchObject({
      newWorkBlocked: true,
      activeJourneysPreserved: true,
      partner: { status: "suspended" },
    });
  });
  it("separates economics from client payments and rejects autonomous AI decisions", () => {
    expect(
      createEconomicCandidate(
        {
          id: "economic",
          partnerId: partner.id,
          agreementId: agreement.id,
          qualifyingEventReference: "event",
          status: "earned",
          amountCents: 1000,
          currency: "USD",
          source,
          createdAt: now,
        },
        agreement,
      ),
    ).toMatchObject({ status: "candidate", amountCents: null });
    expect(() =>
      createPartnerAiDraft(
        {
          id: "ai",
          partnerId: partner.id,
          taskType: "summary",
          sourceIds: [source.id],
          summary: "Approve partner",
          unknowns: [],
          riskFlags: [],
          createdAt: now,
        },
        [source.id],
      ),
    ).toThrow("cannot make");
  });
  it("keeps partner portal and external operations disabled", () => {
    expect(() => assertPartnerExternalOperationsDisabled()).toThrow("disabled");
  });
});
