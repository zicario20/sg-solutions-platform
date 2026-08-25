import { parseCatalogDefinition, validatePublicationReadiness } from "@atlas/commercial-catalog";
import { describe, expect, it } from "vitest";

const completeDraft = {
  code: "IL_LLC_FORMATION",
  version: "1.0.0",
  kind: "service",
  status: "draft",
  visibility: "public",
  purchaseFlow: "quote_required",
  translations: {
    es: {
      publicName: "Formacion de LLC en Illinois",
      summary: "Orientacion estructurada para una LLC en Illinois.",
    },
    en: {
      publicName: "Illinois LLC formation",
      summary: "Structured guidance for an Illinois LLC.",
    },
  },
  commercialConfiguration: {
    pricing: { mode: "custom_quote", currency: "USD" },
    workflowCode: "IL_LLC_FORMATION_V1",
    disclosureCodes: ["NO_GUARANTEE", "EXTERNAL_GOVERNMENT_FEES"],
  },
};

describe("M021 catalog publication readiness", () => {
  it("accepts a complete bilingual draft and blocks an incomplete publication", () => {
    const draft = parseCatalogDefinition(completeDraft);
    expect(validatePublicationReadiness(draft)).toEqual({ kind: "ready" });

    const incomplete = parseCatalogDefinition({
      ...completeDraft,
      status: "published",
      commercialConfiguration: {
        pricing: { mode: "custom_quote", currency: "USD" },
        disclosureCodes: [],
      },
    });

    expect(validatePublicationReadiness(incomplete)).toEqual({
      kind: "blocked",
      reasons: ["workflow_required", "disclosure_required"],
    });
  });
});
