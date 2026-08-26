import {
  assertServiceCategoryHierarchy,
  createCatalogBreakGlassRequest,
  createLeadServiceInterestReference,
  createServiceBundleDefinition,
  createServiceOrderCatalogSnapshot,
  detectCatalogDrift,
  evaluateCatalogDataQuality,
  evaluateJurisdictionReadiness,
  evaluatePublicationTarget,
  evaluateServiceChangeImpact,
  evaluateServiceCta,
  evaluateServiceOrderReadiness,
  planServiceDeprecation,
  projectServiceForSurface,
  validateCatalogAiOutput,
  verifyCatalogRecovery,
} from "@atlas/commercial-catalog";
import { describe, expect, it } from "vitest";

const now = "2026-08-26T00:00:00.000Z";
const definition = {
  id: "service-42-complete",
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
} as const;
const version = {
  id: "service-version-42-complete",
  serviceDefinitionId: definition.id,
  version: "1.0.0",
  publicationStatus: "published",
  effectiveFrom: now,
  translations: {
    es: {
      name: "Evaluación de preparación para financiamiento empresarial",
      summary: "Organiza información financiera antes de conversar con un proveedor.",
      benefits: ["Claridad sobre preparación", "Lista de documentos relevantes"],
      limitations: ["No representa una aprobación de financiamiento."],
      ctaLabel: "Agenda una evaluación",
    },
    en: {
      name: "Business funding readiness assessment",
      summary: "Organize financial information before speaking with a provider.",
      benefits: ["Preparation clarity", "Relevant document checklist"],
      limitations: ["This is not a funding approval."],
      ctaLabel: "Schedule an evaluation",
    },
  },
  commercialProfile: {
    billingMode: "quote_required",
    pricingReference: "pricing-profile-funding-v1",
    depositPolicyReference: null,
    paymentScheduleReference: null,
    cancellationPolicyReference: "cancellation-policy-v1",
    publicPriceDisplayMode: "quote_required",
  },
  documentRequirementSetReference: "documents-funding-v1",
  durationProfile: {
    type: "estimate",
    unit: "business_days",
    minimum: 3,
    maximum: 7,
    confidence: "estimated",
    sourceReference: "reviewed-estimate-v1",
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
  configurationHash: "configuration-hash-42-complete-v1",
  createdAt: now,
} as const;

describe("M042 Service Catalog completion controls", () => {
  it("controls category hierarchy, publication, CTA and lead-interest handoff without creating a client", () => {
    expect(() =>
      assertServiceCategoryHierarchy([
        { code: "CREDIT", parentCategoryCode: "PERSONAL" },
        { code: "PERSONAL", parentCategoryCode: "CREDIT" },
      ]),
    ).toThrow("cycle");
    expect(
      evaluatePublicationTarget(definition, version, { channel: "public_web", at: now }),
    ).toEqual({ kind: "ready" });
    expect(
      evaluateServiceCta(definition, version, {
        type: "create_lead_interest",
        target: "lead_management",
        locale: "es",
      }),
    ).toMatchObject({ kind: "available" });
    expect(
      createLeadServiceInterestReference(definition, version, {
        sourceChannel: "public_web",
        locale: "es",
        createdAt: now,
      }),
    ).toEqual({
      serviceDefinitionId: definition.id,
      serviceVersionId: version.id,
      serviceCode: definition.code,
      sourceChannel: "public_web",
      locale: "es",
      createdAt: now,
    });
  });

  it("protects active orders through snapshots, impact analysis and explicit deprecation", () => {
    const snapshot = createServiceOrderCatalogSnapshot(definition, version, now);
    const nextVersion = {
      ...version,
      id: "service-version-42-complete-v2",
      version: "1.1.0",
      configurationHash: "configuration-hash-42-complete-v2",
      disclosureSetReference: "funding-disclosures-v2",
    };
    expect(evaluateServiceChangeImpact(version, nextVersion)).toMatchObject({
      classification: "high_risk",
      activeOrders: "requires_explicit_amendment",
    });
    expect(snapshot.translations.es.name).toBe(version.translations.es.name);
    expect(
      planServiceDeprecation({
        serviceDefinitionId: definition.id,
        deprecatedVersionId: version.id,
        replacementServiceDefinitionId: "replacement-service",
        replacementVersionId: "replacement-version",
        newOrderBehavior: "redirect_to_replacement",
        activeOrderBehavior: "preserve_snapshot_and_support",
        effectiveAt: now,
      }),
    ).toMatchObject({ activeOrderBehavior: "preserve_snapshot_and_support" });
  });

  it("keeps payment and human authorization separate, and resolves jurisdiction deterministically", () => {
    const paymentAndHumanVersion = {
      ...version,
      workflowBinding: {
        ...version.workflowBinding,
        requiresPaymentConfirmation: true,
        requiresHumanAuthorization: true,
      },
    };
    expect(
      evaluateServiceOrderReadiness(definition, paymentAndHumanVersion, {
        paymentVerified: false,
        humanAuthorized: false,
      }),
    ).toEqual({
      kind: "blocked",
      reasons: ["payment_not_verified", "human_authorization_required"],
    });
    expect(
      evaluateJurisdictionReadiness(
        "CA",
        [
          {
            code: "CA_EXCLUDED",
            type: "exclude",
            jurisdiction: "CA",
            publicMessage: "Not available in California.",
          },
        ],
        now,
      ),
    ).toEqual({ kind: "blocked", reason: "jurisdiction_excluded" });
  });

  it("models bundles and keeps client projections clear of internal references", () => {
    expect(
      createServiceBundleDefinition({
        serviceDefinitionId: "PACKAGE_SERVICE",
        serviceVersionId: "package-version",
        bundleType: "fixed",
        components: [
          {
            serviceDefinitionId: definition.id,
            serviceVersionId: version.id,
            required: true,
            removable: false,
            quantity: 1,
            sortOrder: 0,
          },
        ],
      }),
    ).toMatchObject({ bundleType: "fixed" });
    const clientProjection = projectServiceForSurface(definition, version, {
      surface: "client",
      locale: "en",
      authorized: true,
      purpose: "client_service_detail",
      clientHasServiceGrant: true,
    });
    expect(clientProjection).not.toHaveProperty("workflowBinding");
    expect(clientProjection).not.toHaveProperty("documentRequirementSetReference");
    expect(clientProjection).not.toHaveProperty("disclosureSetReference");
  });

  it("fails closed for unsupported AI claims, drift, incomplete recovery and unapproved break-glass execution", () => {
    expect(
      validateCatalogAiOutput({
        outputType: "draft_copy",
        content: "We guarantee loan approval.",
        sourceReferences: ["catalog-source-42"],
      }),
    ).toMatchObject({ status: "blocked" });
    expect(
      detectCatalogDrift(
        { configurationHash: version.configurationHash, publicFields: ["name", "summary"] },
        {
          configurationHash: "unexpected-hash",
          publicFields: ["name", "summary", "workflowBinding"],
        },
      ).map((finding) => finding.type),
    ).toEqual(expect.arrayContaining(["configuration_hash", "public_field_exposure"]));
    expect(
      verifyCatalogRecovery([createServiceOrderCatalogSnapshot(definition, version, now)], []),
    ).toMatchObject({ safeToResume: false });
    expect(
      createCatalogBreakGlassRequest({
        actorType: "owner",
        action: "publish",
        reason: "Urgent safe catalog containment.",
        scopeReferences: [definition.id],
        mfaVerified: true,
        requestedAt: now,
        expiresAt: "2026-08-26T01:00:00.000Z",
        status: "pending_human_confirmation",
      }).status,
    ).toBe("pending_human_confirmation");
  });

  it("raises deterministic data quality findings before unsafe publication is accepted", () => {
    expect(
      evaluateCatalogDataQuality([
        { definition, version, activeOrderSnapshotCount: 0 },
        {
          definition: { ...definition, id: "duplicate-definition" },
          version: { ...version, id: "duplicate-version" },
          activeOrderSnapshotCount: 0,
        },
      ]).map((finding) => finding.type),
    ).toContain("duplicate_service_code");
  });
});
