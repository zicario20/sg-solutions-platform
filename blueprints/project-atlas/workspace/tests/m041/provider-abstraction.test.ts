import {
  assertExternalProviderCallDisabled,
  classifyRetry,
  createInterface,
  createProvider,
  createProviderAiDraft,
  createRequest,
  INITIAL_PROVIDER_INTERFACES,
  normalizeResponse,
  PROVIDER_RUNTIME_DISABLED,
  ProviderAbstractionError,
  selectProviderRoute,
  validateAdapter,
  validateConfiguration,
  validateEndpoint,
} from "@atlas/provider-abstraction";
import { describe, expect, it } from "vitest";

const now = "2026-08-26T00:00:00.000Z";

const provider = {
  id: "provider-41",
  code: "MOCK_MARKETPLACE",
  displayName: "Mock marketplace provider",
  category: "financial_marketplace" as const,
  organizationId: "organization-40",
  partnerId: "partner-40",
  ownershipType: "external_partner" as const,
  status: "testing" as const,
  createdAt: now,
  updatedAt: now,
};

const marketplaceInterface = {
  id: "interface-41",
  code: "FinancialMarketplaceProvider" as const,
  version: 1,
  domain: "marketplace",
  status: "stable" as const,
  schemaVersion: "v1",
};

const capability = {
  id: "capability-41",
  providerId: provider.id,
  capabilityCode: "financial_marketplace.list_products",
  supportStatus: "supported" as const,
  adapterVersion: "v1",
  constraints: {},
  effectiveFrom: now,
  effectiveTo: null,
};

const request = {
  id: "request-41",
  providerId: provider.id,
  capabilityCode: capability.capabilityCode,
  sourceModule: "m039" as const,
  sourceResourceId: "marketplace-product-41",
  environment: "sandbox" as const,
  purpose: "Display an approved partner offer",
  fields: { locale: "en" },
  idempotencyKey: "m041-list-products-41",
  correlationId: "correlation-41",
  createdAt: now,
};

describe("M041 provider abstraction controlled foundation", () => {
  it("keeps technical providers distinct from partner records and rejects duplicate provider codes", () => {
    expect(createProvider(provider, [])).toEqual(provider);
    expect(provider.partnerId).toBe("partner-40");
    expect(provider.organizationId).toBe("organization-40");

    expect(() => createProvider({ ...provider, id: "provider-duplicate" }, [provider])).toThrow(
      ProviderAbstractionError,
    );
  });

  it("defines versioned canonical interfaces without importing vendor SDK contracts", () => {
    expect(INITIAL_PROVIDER_INTERFACES).toContain("FinancialMarketplaceProvider");
    expect(createInterface(marketplaceInterface, [])).toEqual(marketplaceInterface);
    expect(() =>
      createInterface({ ...marketplaceInterface, id: "interface-duplicate", schemaVersion: "v2" }, [
        marketplaceInterface,
      ]),
    ).toThrow("already exists");
  });

  it("rejects plaintext secrets and production activation in provider configuration", () => {
    expect(() =>
      validateConfiguration({
        id: "configuration-secret-41",
        providerId: provider.id,
        environment: "sandbox",
        region: null,
        status: "disabled",
        configuration: { apiKey: "not-allowed" },
        secretReferences: [],
        effectiveFrom: now,
        effectiveTo: null,
      }),
    ).toThrow("secret references");

    expect(() =>
      validateConfiguration({
        id: "configuration-production-41",
        providerId: provider.id,
        environment: "production",
        region: null,
        status: "validated",
        configuration: {},
        secretReferences: ["secret://provider/mock-marketplace/production"],
        effectiveFrom: now,
        effectiveTo: null,
      }),
    ).toThrow("not activatable");
  });

  it("permits only verified HTTPS endpoints on an explicit provider allowlist", () => {
    expect(() =>
      validateEndpoint(
        {
          id: "endpoint-http-41",
          providerId: provider.id,
          environment: "sandbox",
          endpointType: "api",
          baseUrl: "http://provider.example",
          status: "verified",
          verifiedAt: now,
        },
        ["provider.example"],
      ),
    ).toThrow("allowlisted");

    expect(() =>
      validateEndpoint(
        {
          id: "endpoint-unexpected-41",
          providerId: provider.id,
          environment: "sandbox",
          endpointType: "api",
          baseUrl: "https://unexpected.example",
          status: "verified",
          verifiedAt: now,
        },
        ["provider.example"],
      ),
    ).toThrow("allowlisted");

    expect(
      validateEndpoint(
        {
          id: "endpoint-verified-41",
          providerId: provider.id,
          environment: "sandbox",
          endpointType: "api",
          baseUrl: "https://provider.example",
          status: "verified",
          verifiedAt: now,
        },
        ["provider.example"],
      ),
    ).toMatchObject({ baseUrl: "https://provider.example" });
  });

  it("validates canonical capability requests, rejects sensitive fields, and records idempotency", () => {
    expect(createRequest(request, capability, [], ["ssn", "ein"])).toEqual(request);
    expect(() =>
      createRequest({ ...request, id: "request-duplicate" }, capability, [request], ["ssn"]),
    ).toThrow("idempotency");
    expect(() =>
      createRequest(
        {
          ...request,
          id: "request-sensitive",
          idempotencyKey: "m041-sensitive-41",
          fields: { ssn: "not-allowed" },
        },
        capability,
        [],
        ["ssn"],
      ),
    ).toThrow("prohibited");
  });

  it("preserves raw provider details but normalizes unverified states to unknown and blocks unsafe retries", () => {
    const response = normalizeResponse(request, {
      rawStatus: "PENDING_PROVIDER_REVIEW",
      rawCode: "PENDING",
      payloadReference: "provider-payload-redacted",
      receivedAt: now,
    });

    expect(response.canonicalStatus).toBe("unknown");
    expect(response.rawStatus).toBe("PENDING_PROVIDER_REVIEW");
    expect(() =>
      classifyRetry(
        { ...request, capabilityCode: "financial_marketplace.submit_application" },
        response,
      ),
    ).toThrow("stateful external work");
  });

  it("allows only disabled adapters and never selects a live provider route", () => {
    const adapter = {
      id: "adapter-41",
      providerId: provider.id,
      interfaceId: marketplaceInterface.id,
      adapterCode: "mock-marketplace-adapter",
      adapterVersion: "v1",
      runtime: "sandbox" as const,
      status: "provider_disabled" as const,
      configurationProfileId: null,
    };
    const schema = {
      id: "schema-41",
      providerId: null,
      interfaceId: marketplaceInterface.id,
      type: "canonical_request" as const,
      version: "v1",
      contentHash: "content-hash-41",
      compatibility: "backward_compatible" as const,
      status: "active" as const,
    };

    expect(validateAdapter(adapter, schema)).toEqual(adapter);
    expect(() => validateAdapter({ ...adapter, status: "tested" }, schema)).toThrow("disabled");

    expect(
      selectProviderRoute(
        [
          {
            id: "route-41",
            providerId: provider.id,
            capabilityCode: capability.capabilityCode,
            environment: "sandbox",
            priority: 1,
            status: "approved",
            sticky: false,
          },
        ],
        [
          {
            providerId: provider.id,
            capabilityCode: capability.capabilityCode,
            environment: "sandbox",
            status: "healthy",
            observedAt: now,
            source: "mock",
          },
        ],
        capability.capabilityCode,
        "sandbox",
      ),
    ).toEqual({ selected: null, reason: "provider_disabled" });
  });

  it("blocks external execution and requires human review for safe AI provider drafts", () => {
    expect(PROVIDER_RUNTIME_DISABLED).toBe(true);
    expect(() => assertExternalProviderCallDisabled()).toThrow("disabled");

    expect(
      createProviderAiDraft(
        {
          id: "ai-draft-41",
          taskType: "health_summary",
          providerId: provider.id,
          sourceIds: ["provider-41", "schema-41"],
          summary: "Summarize the disabled provider health configuration.",
          unknowns: [],
          riskFlags: [],
          createdAt: now,
        },
        ["provider-41", "schema-41"],
      ),
    ).toMatchObject({ humanReviewRequired: true, sourceIds: ["provider-41", "schema-41"] });

    expect(() =>
      createProviderAiDraft(
        {
          id: "ai-draft-activation-41",
          taskType: "routing_explanation",
          providerId: provider.id,
          sourceIds: ["provider-41"],
          summary: "Activate provider routing immediately.",
          unknowns: [],
          riskFlags: [],
          createdAt: now,
        },
        ["provider-41"],
      ),
    ).toThrow("cannot change");
  });
});
