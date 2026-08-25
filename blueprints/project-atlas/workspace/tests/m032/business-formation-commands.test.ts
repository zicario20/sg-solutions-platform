import {
  createFormationCommandService,
  type FormationAuthorizationPort,
  type FormationCase,
  type FormationCommandStore,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

const actor = { accountId: "account-1", assurance: "aal2" as const };

function store(): FormationCommandStore & { readonly cases: Map<string, FormationCase> } {
  const cases = new Map<string, FormationCase>();
  return {
    cases,
    async findCase(caseId) {
      return cases.get(caseId) ?? null;
    },
    async saveCase(value) {
      cases.set(value.caseId, value);
    },
    async appendAudit() {},
  };
}

const allow: FormationAuthorizationPort = {
  async authorize() {
    return { allowed: true };
  },
};

describe("M032 formation commands", () => {
  it("creates cases only through an authorized command and emits a minimal audit event", async () => {
    const memory = store();
    const service = createFormationCommandService({
      store: memory,
      authorization: allow,
      now: () => "2026-08-25T00:00:00.000Z",
    });

    const created = await service.createCase(actor, {
      caseId: "formation-1",
      caseNumber: "BF-001",
      clientRef: "client-1",
      serviceOrderRef: "order-1",
      productCode: "IL_LLC_FORMATION",
      entityType: "limited_liability_company",
      formationJurisdiction: "IL",
      deliveryModel: "sg_service",
    });

    expect(created.status).toBe("intake_pending");
    expect(memory.cases.get("formation-1")).toEqual(created);
  });

  it("does not save a case when the command permission is denied", async () => {
    const memory = store();
    const service = createFormationCommandService({
      store: memory,
      authorization: {
        async authorize() {
          return { allowed: false, reason: "FORMATION_PERMISSION_DENIED" };
        },
      },
      now: () => "2026-08-25T00:00:00.000Z",
    });

    await expect(
      service.createCase(actor, {
        caseId: "formation-2",
        caseNumber: "BF-002",
        clientRef: "client-1",
        serviceOrderRef: "order-1",
        productCode: "IL_CORPORATION_FORMATION",
        entityType: "corporation",
        formationJurisdiction: "IL",
        deliveryModel: "sg_service",
      }),
    ).rejects.toThrow("FORMATION_PERMISSION_DENIED");
    expect(memory.cases).toHaveLength(0);
  });
});
