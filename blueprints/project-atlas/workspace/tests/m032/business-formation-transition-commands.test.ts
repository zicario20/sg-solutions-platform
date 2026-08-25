import {
  createFormationTransitionCommandService,
  type FormationAuthorizationPort,
  type FormationTransitionCommandStore,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

const caseValue = {
  caseId: "formation-1",
  caseNumber: "BF-001",
  clientRef: "client-1",
  serviceOrderRef: "order-1",
  productCode: "IL_LLC_FORMATION",
  entityType: "limited_liability_company" as const,
  formationJurisdiction: "IL",
  deliveryModel: "sg_service" as const,
  status: "payment_pending" as const,
  version: 3,
  filingAllowed: false as const,
};

describe("M032 controlled transitions", () => {
  it("moves to ready-to-file only after trusted readiness gates and records the expected version", async () => {
    const updates: unknown[] = [];
    const store: FormationTransitionCommandStore = {
      async getTransitionContext() {
        return {
          formationCase: caseValue,
          readiness: { score: 100, complete: true, missing: [] },
          reviewApproved: true,
          clientAuthorization: {
            documentHash: "a".repeat(64),
            acceptedAt: "2026-08-25T00:00:00.000Z",
          },
          requirementSnapshotCurrent: true,
          paymentReady: true,
          filingChannelReady: true,
        };
      },
      async updateCase(value, expectedVersion) {
        updates.push({ value, expectedVersion });
      },
      async appendAudit() {},
    };
    const service = createFormationTransitionCommandService({
      store,
      authorization: {
        async authorize() {
          return { allowed: true };
        },
      } satisfies FormationAuthorizationPort,
      now: () => "2026-08-25T00:00:00.000Z",
    });

    const result = await service.transition(
      { accountId: "account-1", assurance: "aal2" },
      { formationCaseRef: "formation-1", target: "ready_to_file" },
    );

    expect(result).toMatchObject({
      kind: "moved",
      formationCase: { status: "ready_to_file", version: 4 },
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ expectedVersion: 3 });
  });

  it("rejects a direct filing transition without persisting any change", async () => {
    const updates: unknown[] = [];
    const store: FormationTransitionCommandStore = {
      async getTransitionContext() {
        return {
          formationCase: { ...caseValue, status: "intake_pending" as const },
          readiness: { score: 0, complete: false, missing: ["documents"] },
          reviewApproved: false,
          requirementSnapshotCurrent: false,
          paymentReady: false,
          filingChannelReady: false,
        };
      },
      async updateCase(value) {
        updates.push(value);
      },
      async appendAudit() {},
    };
    const service = createFormationTransitionCommandService({
      store,
      authorization: {
        async authorize() {
          return { allowed: true };
        },
      } satisfies FormationAuthorizationPort,
      now: () => "2026-08-25T00:00:00.000Z",
    });

    await expect(
      service.transition(
        { accountId: "account-1", assurance: "aal2" },
        { formationCaseRef: "formation-1", target: "filing_in_progress" },
      ),
    ).resolves.toMatchObject({ kind: "blocked" });
    expect(updates).toHaveLength(0);
  });
});
