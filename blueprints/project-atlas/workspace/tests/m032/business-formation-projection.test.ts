import { toClientFormationSummary } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 client-safe formation projection", () => {
  it("returns a bilingual, public summary without internal provider or filing details", () => {
    const summary = toClientFormationSummary(
      {
        caseId: "formation-1",
        caseNumber: "BF-001",
        clientRef: "client-1",
        serviceOrderRef: "order-1",
        productCode: "IL_LLC_FORMATION",
        entityType: "limited_liability_company",
        formationJurisdiction: "IL",
        deliveryModel: "sg_service",
        status: "signature_pending",
        version: 3,
        filingAllowed: false,
      },
      "es",
    );

    expect(summary).toEqual({
      formationCaseRef: "formation-1",
      statusLabel: "Firma pendiente",
      nextStepLabel: "Revisa y firma los documentos solicitados.",
      state: "awaiting_client",
    });
    expect(JSON.stringify(summary)).not.toContain("provider");
    expect(JSON.stringify(summary)).not.toContain("IL_LLC_FORMATION");
  });
});
