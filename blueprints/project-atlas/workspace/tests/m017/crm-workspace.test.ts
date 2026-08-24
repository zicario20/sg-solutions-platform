import {
  assertCrmOpportunityTransition,
  type CrmAuthorizationPort,
  type CrmProjectionPort,
  CrmWorkspaceQueryService,
} from "@atlas/crm";
import { describe, expect, it } from "vitest";

const snapshot = {
  accountId: "staff-a",
  sessionId: "session-a",
  role: "sales" as const,
  permissions: ["crm.relationship.read", "crm.opportunity.read"],
  purposeBindingRefs: ["purpose-a"],
  authorizationEpoch: "1",
  purposeAccessEpoch: "1",
  locale: "es" as const,
  capturedAt: new Date(),
};
const authorization: CrmAuthorizationPort = {
  authorize: async () => snapshot,
  revalidate: async () => true,
};
describe("M017 CRM workspace", () => {
  it("renders only purpose-authorized CRM sections and suppresses the rest", async () => {
    const projections: CrmProjectionPort = {
      query: async ({ section }) => ({
        state: "complete",
        items: [{ relationshipRef: section.section, displayLabel: "Relacion autorizada" }],
      }),
    };
    const result = await new CrmWorkspaceQueryService(authorization, projections).query({
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
  it("turns prohibited CRM projection data into unavailable evidence", async () => {
    const projections: CrmProjectionPort = {
      query: async () => ({
        state: "complete",
        items: [{ relationshipRef: "r", email: "person@example.com" }],
      }),
    };
    const result = await new CrmWorkspaceQueryService(authorization, projections).query({
      sessionHandle: "s",
      locale: "es",
    });
    if (result.kind !== "authorized") throw new Error("expected authorization");
    expect(result.dto.sections[0]).toMatchObject({
      state: "unavailable",
      safeReason: "source_unavailable",
    });
  });
  it("requires a current purpose binding and exact pipeline version for a valid stage transition", () => {
    expect(() =>
      assertCrmOpportunityTransition({
        current: "qualified",
        next: "proposal",
        expectedPipelineVersion: "2",
        suppliedPipelineVersion: "2",
        purposeBindingRef: "purpose",
        purposeAccessEpoch: "4",
      }),
    ).not.toThrow();
    expect(() =>
      assertCrmOpportunityTransition({
        current: "qualified",
        next: "closed_won",
        expectedPipelineVersion: "2",
        suppliedPipelineVersion: "1",
        purposeBindingRef: "",
        purposeAccessEpoch: "4",
      }),
    ).toThrow("CRM_OPPORTUNITY_TRANSITION_REJECTED");
  });
});
