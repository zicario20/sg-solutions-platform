import { describe, expect, it } from "vitest";

import { createEinCommandService } from "../../packages/ein-business-documents/src/index.ts";

describe("M033 EIN command authorization", () => {
  it("checks authentication and permission before creating a case", async () => {
    const records = new Map();
    const service = createEinCommandService({
      authorization: { authenticate: async () => true, allows: async () => false },
      cases: {
        get: async (id) => records.get(id),
        save: async (value) => {
          records.set(value.caseId, value);
        },
        update: async () => undefined,
      },
      audit: { append: async () => undefined },
    });
    await expect(
      service.createCase(
        { actorRef: "staff-1", subjectRef: "staff-1" },
        {
          caseId: "ein-case-5",
          caseNumber: "EIN-1005",
          clientRef: "client-5",
          organizationRef: "org-5",
          serviceOrderRef: "order-5",
          deliveryModel: "sg_service",
          createdAt: "2026-08-25T00:00:00.000Z",
        },
      ),
    ).rejects.toThrow("EIN_PERMISSION_DENIED");
  });
});
