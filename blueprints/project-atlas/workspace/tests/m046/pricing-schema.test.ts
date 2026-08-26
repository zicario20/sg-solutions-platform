import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = resolve(import.meta.dirname, "../..");

describe("M046 pricing persistence and catalog binding", () => {
  it("authors a deny-all pricing persistence boundary without provider execution SQL", () => {
    const schema = readFileSync(
      resolve(workspace, "packages/database/src/schema/pricing.ts"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(workspace, "drizzle/0056_m046_pricing_controlled_foundation.sql"),
      "utf8",
    );

    expect(schema).toContain("pricingDefinitions");
    expect(schema).toContain("commercialPricingSnapshots");
    expect(schema).toContain("promotionRedemptions");
    expect(schema).toContain(".enableRLS()");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("USING (false)");
    expect(migration).toContain("WITH CHECK (false)");
    expect(migration).not.toContain("stripe.");
    expect(migration).not.toContain("grant_entitlement");
    expect(migration).not.toContain("start_operational_workflow");
  });

  it("requires M42 commercial pricing profile references to carry a valid version pair", async () => {
    const catalog = await import("@atlas/commercial-catalog");
    const definition = {
      id: "service-046-binding",
      code: "PRICING_BINDING_TEST",
      categoryCode: "COMMERCIAL",
      serviceType: "consultation",
      lifecycleStatus: "approved",
      primaryDomain: "commercial",
      fulfillmentMode: "internal_guidance",
      availability: {
        status: "available",
        jurisdictions: ["US"],
        excludedJurisdictions: [],
        lastVerifiedAt: "2026-08-26T12:00:00.000Z",
      },
      audiences: ["prospect"],
      surfaces: ["admin"],
      providerRequirements: [],
      partnerRequirements: [],
      createdAt: "2026-08-26T12:00:00.000Z",
      updatedAt: "2026-08-26T12:00:00.000Z",
    };
    const version = {
      id: "service-046-binding-v1",
      serviceDefinitionId: definition.id,
      version: "1.0.0",
      publicationStatus: "approved",
      effectiveFrom: "2026-08-26T12:00:00.000Z",
      translations: {
        es: {
          name: "Prueba de precio",
          summary: "Prueba de referencia de precio.",
          benefits: ["Referencia controlada"],
          limitations: ["No ejecuta pagos"],
          ctaLabel: "Solicita una cotizacion",
        },
        en: {
          name: "Pricing binding test",
          summary: "Tests a controlled pricing reference.",
          benefits: ["Controlled reference"],
          limitations: ["Does not execute payments"],
          ctaLabel: "Request a quote",
        },
      },
      commercialProfile: {
        billingMode: "quote_required",
        pricingReference: "pricing-profile-046-v1",
        pricingProfileReference: "pricing-profile-046-v1",
        pricingProfileVersion: 1,
        depositPolicyReference: null,
        paymentScheduleReference: null,
        cancellationPolicyReference: "cancellation-policy-046-v1",
        publicPriceDisplayMode: "quote_required",
      },
      documentRequirementSetReference: "documents-046-v1",
      durationProfile: {
        type: "estimate",
        unit: "business_days",
        minimum: 1,
        maximum: 2,
        confidence: "estimated",
        sourceReference: "internal-source-046",
      },
      disclosureSetReference: "disclosure-046-v1",
      intakeDefinitionReference: "intake-046-v1",
      workflowBinding: {
        workflowCode: "PRICING_BINDING_TEST_V1",
        startTrigger: "human_authorization",
        requiresPaymentConfirmation: false,
        requiresHumanAuthorization: true,
      },
      jurisdictionRuleSetReference: "jurisdiction-046-v1",
      servicePrerequisites: [],
      dependencyCodes: [],
      relatedServiceCodes: [],
      seo: null,
      configurationHash: "pricing-binding-hash-v1",
      createdAt: "2026-08-26T12:00:00.000Z",
    };

    expect(catalog.createServiceVersion(version, [])).toMatchObject({
      commercialProfile: {
        pricingProfileReference: "pricing-profile-046-v1",
        pricingProfileVersion: 1,
      },
    });
    expect(() =>
      catalog.createServiceVersion(
        {
          ...version,
          id: "service-046-binding-invalid",
          commercialProfile: {
            ...version.commercialProfile,
            pricingProfileVersion: null,
          },
        },
        [],
      ),
    ).toThrow("pricing profile version");
  });
});
