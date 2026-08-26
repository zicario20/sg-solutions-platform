import { describe, expect, it } from "vitest";
import {
  CatalogControlError,
  assertPublishedVersionImmutable,
  assertServiceDependencyGraph,
  buildServiceDiscoveryIndex,
  createServiceDefinition,
  createServiceOrderCatalogSnapshot,
  createServiceVersion,
  evaluateCatalogCommand,
  projectServiceForSurface,
  validateServicePublication,
} from "@atlas/commercial-catalog";

const now = "2026-08-26T00:00:00.000Z";

const definition = {
  id: "service-42",
  code: "BUSINESS_FUNDING_READINESS",
  categoryCode: "BUSINESS_FUNDING",
  serviceType: "assessment",
  lifecycleStatus: "approved",
  primaryDomain: "business_funding",
  fulfillmentMode: "internal_guidance",
  availability: {
    status: "available",
    jurisdictions: ["US"],
    excludedJurisdictions: [],
    lastVerifiedAt: now,
  },
  audiences: ["prospect", "client"],
  surfaces: ["public", "client", "admin"],
  providerRequirements: [],
  partnerRequirements: [],
  createdAt: now,
  updatedAt: now,
};

const version = {
  id: "service-version-42",
  serviceDefinitionId: definition.id,
  version: "1.0.0",
  publicationStatus: "approved",
  effectiveFrom: now,
  translations: {
    es: {
      name: "Evaluación de preparación para financiamiento empresarial",
      summary: "Organiza información financiera antes de conversar con un proveedor.",
      benefits: ["Claridad sobre la preparación", "Lista de documentos relevantes"],
      limitations: ["No es una aprobación de financiamiento"],
      ctaLabel: "Agenda una evaluación",
    },
    en: {
      name: "Business funding readiness assessment",
      summary: "Organize financial information before speaking with a provider.",
      benefits: ["Preparation clarity", "Relevant document checklist"],
      limitations: ["This is not a funding approval"],
      ctaLabel: "Schedule an evaluation",
    },
  },
  commercialProfile: {
    billingMode: "quote_required",
    pricingReference: "price-profile-funding-v1",
    depositPolicyReference: null,
    paymentScheduleReference: null,
    cancellationPolicyReference: "policy-cancellation-v1",
  },
  documentRequirementSetReference: "documents-funding-v1",
  durationProfile: {
    type: "estimate",
    unit: "business_days",
    minimum: 3,
    maximum: 7,
    confidence: "estimated",
    sourceReference: "internal-reviewed-estimate",
  },
  disclosureSetReference: "funding-disclosures-v1",
  intakeDefinitionReference: "funding-intake-v1",
  workflowBinding: {
    workflowCode: "BUSINESS_FUNDING_READINESS_V1",
    startTrigger: "human_authorization",
    requiresPaymentConfirmation: false,
    requiresHumanAuthorization: true,
  },
  jurisdictionRuleSetReference: "funding-us-v1",
  servicePrerequisites: [],
  dependencyCodes: [],
  relatedServiceCodes: ["BUSINESS_CREDIT_PREPARATION"],
  seo: {
    canonicalPath: "/services/business-funding-readiness",
    title: "Business funding readiness | SG Solutions",
    description: "Prepare to discuss business funding with a provider.",
  },
  configurationHash: "configuration-hash-42-v1",
  createdAt: now,
};

describe("M042 Service Catalog", () => {
  it("owns stable service definitions and creates versioned, bilingual commercial configuration", () => {
    expect(createServiceDefinition(definition, [])).toEqual(definition);
    expect(() => createServiceDefinition({ ...definition, id: "other-service" }, [definition])).toThrow(
      "unique",
    );

    expect(createServiceVersion(version, [])).toEqual(version);
    expect(() => createServiceVersion({ ...version, id: "duplicate-version" }, [version])).toThrow(
      "unique",
    );
  });

  it("blocks publication until binding, disclosure, availability and bilingual content readiness exist", () => {
    expect(validateServicePublication(definition, version)).toEqual({ kind: "ready" });

    expect(
      validateServicePublication(
        { ...definition, availability: { ...definition.availability, status: "unknown" } },
        { ...version, disclosureSetReference: null },
      ),
    ).toEqual({
      kind: "blocked",
      reasons: ["availability_unknown", "disclosure_required"],
    });
  });

  it("does not allow a published catalog version to be edited in place", () => {
    expect(() =>
      assertPublishedVersionImmutable(version, {
        ...version,
        commercialProfile: { ...version.commercialProfile, pricingReference: "new-price-profile" },
      }),
    ).toThrow("immutable");

    expect(
      assertPublishedVersionImmutable(version, {
        ...version,
        id: "service-version-42-v2",
        version: "1.1.0",
        configurationHash: "configuration-hash-42-v2",
      }),
    ).toMatchObject({ version: "1.1.0" });
  });

  it("creates an immutable catalog snapshot for an order instead of referring to mutable configuration", () => {
    const snapshot = createServiceOrderCatalogSnapshot(definition, version);

    expect(snapshot).toMatchObject({
      serviceCode: definition.code,
      catalogVersion: version.version,
      commercialProfile: version.commercialProfile,
      configurationHash: version.configurationHash,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("indexes only publishable public services and never invents availability", () => {
    expect(
      buildServiceDiscoveryIndex([
        { definition, version: { ...version, publicationStatus: "published" } },
        {
          definition: {
            ...definition,
            code: "PAUSED_PRIVATE_SERVICE",
            availability: { ...definition.availability, status: "unknown" },
            surfaces: ["admin"],
          },
          version: { ...version, id: "version-private", publicationStatus: "published" },
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        code: "BUSINESS_FUNDING_READINESS",
        availability: "available",
        canonicalPath: "/services/business-funding-readiness",
      }),
    ]);
  });

  it("uses one definition with purpose-bound public, client and admin projections", () => {
    const publicProjection = projectServiceForSurface(definition, version, {
      surface: "public",
      locale: "es",
      authorized: true,
      purpose: "public_discovery",
      clientHasServiceGrant: false,
    });
    expect(publicProjection).toMatchObject({
      code: definition.code,
      name: version.translations.es.name,
      availability: "available",
    });
    expect(publicProjection).not.toHaveProperty("commercialProfile");
    expect(publicProjection).not.toHaveProperty("workflowBinding");

    expect(() =>
      projectServiceForSurface(definition, version, {
        surface: "client",
        locale: "en",
        authorized: true,
        purpose: "client_service_detail",
        clientHasServiceGrant: false,
      }),
    ).toThrow("service grant");

    expect(() =>
      projectServiceForSurface(definition, version, {
        surface: "admin",
        locale: "en",
        authorized: false,
        purpose: "catalog_administration",
        clientHasServiceGrant: false,
      }),
    ).toThrow("authorization");
  });

  it("rejects dependency cycles and autonomous AI catalog actions", () => {
    expect(() =>
      assertServiceDependencyGraph([
        { serviceCode: "A", dependencyCodes: ["B"] },
        { serviceCode: "B", dependencyCodes: ["A"] },
      ]),
    ).toThrow("cycle");

    expect(() =>
      evaluateCatalogCommand({
        actorType: "ai",
        action: "publish",
        sourceIds: ["service-42", "service-version-42"],
      }),
    ).toThrow(CatalogControlError);

    expect(
      evaluateCatalogCommand({
        actorType: "staff",
        action: "validate_readiness",
        sourceIds: ["service-42", "service-version-42"],
      }),
    ).toEqual({ allowed: true });
  });
});
