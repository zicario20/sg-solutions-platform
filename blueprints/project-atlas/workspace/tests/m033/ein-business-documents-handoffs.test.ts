import { describe, expect, it } from "vitest";

import { createEinCase, planEinHandoffs } from "../../packages/ein-business-documents/src/index.ts";

describe("M033 EIN handoffs", () => {
  it("creates deterministic downstream references without including a full EIN", () => {
    const einCase = createEinCase({
      caseId: "ein-case-4",
      caseNumber: "EIN-1004",
      clientRef: "client-4",
      organizationRef: "org-4",
      serviceOrderRef: "order-4",
      deliveryModel: "sg_service",
      createdAt: "2026-08-25T00:00:00.000Z",
    });
    const issuance = {
      issuanceId: "issuance-4",
      einCaseRef: einCase.caseId,
      issuanceEvidenceDocumentRef: "doc-4",
      fullEinSecureRef: "secure-ein-4",
      verificationStatus: "verified" as const,
      issuedAt: "2026-08-25T00:00:00.000Z",
      immutable: true as const,
    };
    const handoffs = planEinHandoffs({
      einCase,
      issuance,
      destinations: ["banking", "tax", "compliance"],
    });
    expect(handoffs).toHaveLength(3);
    expect(
      handoffs.every(
        (handoff) => handoff.containsFullEin === false && handoff.canExecuteExternally === false,
      ),
    ).toBe(true);
    expect(() =>
      planEinHandoffs({ einCase, issuance, destinations: ["banking", "banking"] }),
    ).toThrow("EIN_HANDOFF_DUPLICATE_DESTINATION");
  });
});
