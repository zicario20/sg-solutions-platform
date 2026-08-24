import {
  assertClientLifecycleTransition,
  assertRepresentativeProposal,
  type ClientManagementAuthorizationPort,
  type ClientManagementProjectionPort,
  ClientManagementQueryService,
} from "@atlas/client-management";
import { describe, expect, it } from "vitest";

const snapshot = {
  accountId: "staff-a",
  sessionId: "session-a",
  permissions: ["client.relationship.read", "client.representative.read"],
  clientRelationshipRefs: ["client-r"],
  purposeAccessEpoch: "3",
  authorizationEpoch: "2",
  locale: "en" as const,
  capturedAt: new Date(),
};
const authorization: ClientManagementAuthorizationPort = {
  authorize: async () => snapshot,
  revalidate: async () => true,
};
describe("M018 client management", () => {
  it("requires a formal ClientRelationship scope and suppresses unauthorized 360 sections", async () => {
    const projections: ClientManagementProjectionPort = {
      query: async ({ section }) => ({
        state: "complete",
        items: [{ clientRelationshipRef: "client-r", publicReference: section.section }],
      }),
    };
    const result = await new ClientManagementQueryService(authorization, projections).query({
      sessionHandle: "s",
      locale: "en",
    });
    if (result.kind !== "authorized") throw new Error("expected authorization");
    expect(result.dto.sections.map((section) => section.state)).toEqual([
      "complete",
      "suppressed",
      "complete",
      "suppressed",
    ]);
  });
  it("rejects PII and account-shaped data from a client summary projection", async () => {
    const projections: ClientManagementProjectionPort = {
      query: async () => ({
        state: "complete",
        items: [{ clientRelationshipRef: "client-r", accountId: "account-a" }],
      }),
    };
    const result = await new ClientManagementQueryService(authorization, projections).query({
      sessionHandle: "s",
      locale: "en",
    });
    if (result.kind !== "authorized") throw new Error("expected authorization");
    expect(result.dto.sections[0]).toMatchObject({
      state: "unavailable",
      safeReason: "source_unavailable",
    });
  });
  it("does not let an invitation grant representative portal access", () => {
    expect(() =>
      assertRepresentativeProposal({
        clientRelationshipRef: "client-r",
        representativeRef: "person-r",
        requestedState: "invited",
        grantsPortalAccess: false,
      }),
    ).not.toThrow();
    expect(() =>
      assertRepresentativeProposal({
        clientRelationshipRef: "client-r",
        representativeRef: "person-r",
        requestedState: "active",
        grantsPortalAccess: true,
        approvalReceiptRef: "x",
      }),
    ).toThrow("CLIENT_REPRESENTATIVE_PROPOSAL_REJECTED");
  });
  it("keeps client lifecycle state distinct and version-fenced", () => {
    expect(() =>
      assertClientLifecycleTransition({
        current: "onboarding",
        next: "active",
        clientRelationshipRef: "client-r",
        expectedVersion: "1",
        suppliedVersion: "1",
        purposeAccessEpoch: "2",
      }),
    ).not.toThrow();
    expect(() =>
      assertClientLifecycleTransition({
        current: "former",
        next: "restricted",
        clientRelationshipRef: "client-r",
        expectedVersion: "1",
        suppliedVersion: "0",
        purposeAccessEpoch: "2",
      }),
    ).toThrow("CLIENT_LIFECYCLE_TRANSITION_REJECTED");
  });
});
