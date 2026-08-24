import {
  assertOrganizationProposal,
  assertOrganizationTransition,
  type OrganizationAuthorizationPort,
  OrganizationManagementQueryService,
  type OrganizationProjectionPort,
} from "@atlas/organization-management";
import { describe, expect, it } from "vitest";

const snapshot = {
  accountId: "staff-a",
  sessionId: "session-a",
  permissions: ["organization.read", "organization.relationship.read"],
  organizationRelationshipRefs: ["org-rel"],
  purposeAccessEpoch: "3",
  authorizationEpoch: "2",
  locale: "es" as const,
  capturedAt: new Date(),
};
const authorization: OrganizationAuthorizationPort = {
  authorize: async () => snapshot,
  revalidate: async () => true,
};
describe("M019 organization management", () => {
  it("requires an authorized organization relationship and suppresses unrelated sections", async () => {
    const projections: OrganizationProjectionPort = {
      query: async ({ section }) => ({
        state: "complete",
        items: [{ organizationRef: "org-r", publicReference: section.section }],
      }),
    };
    const result = await new OrganizationManagementQueryService(authorization, projections).query({
      sessionHandle: "s",
      locale: "es",
    });
    if (result.kind !== "authorized") throw new Error("expected authorization");
    expect(result.dto.sections.map((section) => section.state)).toEqual([
      "complete",
      "complete",
      "suppressed",
      "suppressed",
    ]);
  });
  it("rejects sensitive organization identifiers from summary projections", async () => {
    const projections: OrganizationProjectionPort = {
      query: async () => ({
        state: "complete",
        items: [{ organizationRef: "org-r", ein: "12-3456789" }],
      }),
    };
    const result = await new OrganizationManagementQueryService(authorization, projections).query({
      sessionHandle: "s",
      locale: "es",
    });
    if (result.kind !== "authorized") throw new Error("expected authorization");
    expect(result.dto.sections[0]).toMatchObject({
      state: "unavailable",
      safeReason: "source_unavailable",
    });
  });
  it("does not allow a proposed organization to file, create an EIN, or activate access", () => {
    expect(() =>
      assertOrganizationProposal({
        proposedOrganizationRef: "org-r",
        requestedState: "proposed",
        submitsFiling: false,
        createsEin: false,
        activatesClientAccess: false,
      }),
    ).not.toThrow();
    expect(() =>
      assertOrganizationProposal({
        proposedOrganizationRef: "org-r",
        requestedState: "active",
        submitsFiling: true,
        createsEin: true,
        activatesClientAccess: true,
      }),
    ).toThrow("ORGANIZATION_PROPOSAL_REJECTED");
  });
  it("requires reauthentication and exact version for organization state changes", () => {
    expect(() =>
      assertOrganizationTransition({
        current: "active",
        next: "inactive",
        organizationRef: "org-r",
        expectedVersion: "2",
        suppliedVersion: "2",
        purposeAccessEpoch: "3",
        reauthenticated: true,
      }),
    ).not.toThrow();
    expect(() =>
      assertOrganizationTransition({
        current: "active",
        next: "dissolved",
        organizationRef: "org-r",
        expectedVersion: "2",
        suppliedVersion: "1",
        purposeAccessEpoch: "3",
        reauthenticated: false,
      }),
    ).toThrow("ORGANIZATION_TRANSITION_REJECTED");
  });
});
