import {
  createFormationHandoffCommandService,
  type FormationAuthorizationPort,
  type FormationHandoffCommandStore,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 post-formation handoffs", () => {
  it("creates idempotent, non-executing handoff plans after post-formation approval", async () => {
    const saved: unknown[] = [];
    const store: FormationHandoffCommandStore = {
      async getHandoffContext() {
        return { status: "post_formation", approvalReference: "approval-1" };
      },
      async savePlans(plans) {
        saved.push(...plans);
      },
      async appendAudit() {},
    };
    const service = createFormationHandoffCommandService({
      store,
      authorization: {
        async authorize() {
          return { allowed: true };
        },
      } satisfies FormationAuthorizationPort,
      now: () => "2026-08-25T00:00:00.000Z",
    });

    const result = await service.plan(
      { accountId: "account-1", assurance: "aal2" },
      { formationCaseRef: "formation-1", destinations: ["ein", "bookkeeping"] },
    );

    expect(result).toHaveLength(2);
    expect(saved).toHaveLength(2);
    expect(result.every((plan) => plan.canExecuteExternally === false)).toBe(true);
  });
});
