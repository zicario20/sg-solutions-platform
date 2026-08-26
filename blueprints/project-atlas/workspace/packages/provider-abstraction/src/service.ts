import {
  type CanonicalProviderRequest,
  type CanonicalProviderResponse,
  type Provider,
  ProviderAbstractionError,
  type ProviderAdapter,
  type ProviderAiDraft,
  type ProviderCapability,
  type ProviderConfiguration,
  type ProviderEndpoint,
  type ProviderHealth,
  type ProviderInterface,
  type ProviderRoute,
  type ProviderSchema,
} from "./contracts.ts";
export const PROVIDER_RUNTIME_DISABLED = true;
export const INITIAL_PROVIDER_INTERFACES = [
  "CreditMonitoringProvider",
  "TradelineProvider",
  "FinancialMarketplaceProvider",
  "TaxFilingProvider",
  "PaymentProvider",
  "TelephonyProvider",
  "MessagingProvider",
  "IdentityProvider",
  "StorageProvider",
  "ModelProvider",
] as const;
export const createProvider = (value: Provider, existing: readonly Provider[]) => {
  if (
    !value.code ||
    existing.some((item) => item.code === value.code) ||
    (value.organizationId && value.organizationId === value.partnerId)
  )
    throw new ProviderAbstractionError(
      "INVALID_PROVIDER",
      "Provider identity is invalid or duplicated.",
    );
  return value;
};
export const createInterface = (
  value: ProviderInterface,
  existing: readonly ProviderInterface[],
) => {
  if (existing.some((item) => item.code === value.code && item.version === value.version))
    throw new ProviderAbstractionError("DUPLICATE", "Interface version already exists.");
  return value;
};
export const validateConfiguration = (value: ProviderConfiguration): ProviderConfiguration => {
  if (
    Object.keys(value.configuration).some((key) =>
      /secret|token|password|private.?key|api.?key|access.?key|credential/i.test(key),
    )
  )
    throw new ProviderAbstractionError(
      "INVALID_CONFIGURATION",
      "Configuration stores secret references only.",
    );
  if (value.environment === "production" && value.status === "validated")
    throw new ProviderAbstractionError(
      "PROVIDER_DISABLED",
      "Production provider configuration is not activatable in this foundation.",
    );
  return value;
};
export const validateEndpoint = (value: ProviderEndpoint, hosts: readonly string[]) => {
  let url: URL;
  try {
    url = new URL(value.baseUrl);
  } catch {
    throw new ProviderAbstractionError("ENDPOINT_BLOCKED", "Provider endpoint URL is invalid.");
  }
  if (url.protocol !== "https:" || !hosts.includes(url.hostname) || value.status !== "verified")
    throw new ProviderAbstractionError(
      "ENDPOINT_BLOCKED",
      "Endpoint is not allowlisted and verified.",
    );
  return value;
};
export const createRequest = (
  value: CanonicalProviderRequest,
  capability: ProviderCapability,
  existing: readonly CanonicalProviderRequest[],
  prohibitedFields: readonly string[],
) => {
  if (
    capability.providerId !== value.providerId ||
    capability.capabilityCode !== value.capabilityCode ||
    capability.supportStatus !== "supported"
  )
    throw new ProviderAbstractionError("INVALID_PROVIDER", "Provider capability is not supported.");
  if (existing.some((item) => item.idempotencyKey === value.idempotencyKey))
    throw new ProviderAbstractionError("DUPLICATE", "Provider request idempotency conflict.");
  if (Object.keys(value.fields).some((field) => prohibitedFields.includes(field)))
    throw new ProviderAbstractionError(
      "DATA_EGRESS_BLOCKED",
      "Request contains a prohibited data field.",
    );
  return value;
};
export const normalizeResponse = (
  request: CanonicalProviderRequest,
  raw: Readonly<{
    rawStatus: string | null;
    rawCode: string | null;
    payloadReference: string | null;
    receivedAt: string;
  }>,
): CanonicalProviderResponse => ({
  requestId: request.id,
  providerReference: null,
  canonicalStatus: "unknown",
  rawStatus: raw.rawStatus,
  rawCode: raw.rawCode,
  payloadReference: raw.payloadReference,
  receivedAt: raw.receivedAt,
});
export const assertExternalProviderCallDisabled = (): never => {
  throw new ProviderAbstractionError(
    "PROVIDER_DISABLED",
    "Provider adapter calls, webhooks, polling, file exchange and external retries are disabled.",
  );
};
export const classifyRetry = (
  request: CanonicalProviderRequest,
  response: CanonicalProviderResponse,
) => {
  if (
    response.canonicalStatus === "unknown" ||
    /submit|create|delete|send/i.test(request.capabilityCode)
  )
    throw new ProviderAbstractionError(
      "UNSAFE_RETRY",
      "Potentially stateful external work requires reconciliation, not retry.",
    );
  return { safe: false as const, reason: "provider_disabled" as const };
};
export const selectProviderRoute = (
  routes: readonly ProviderRoute[],
  health: readonly ProviderHealth[],
  capabilityCode: string,
  environment: ProviderRoute["environment"],
) => {
  const eligible = routes.filter(
    (route) =>
      route.capabilityCode === capabilityCode &&
      route.environment === environment &&
      route.status === "approved" &&
      health.some(
        (item) =>
          item.providerId === route.providerId &&
          item.capabilityCode === capabilityCode &&
          item.status === "healthy",
      ),
  );
  return eligible.length
    ? { selected: null, reason: "provider_disabled" as const }
    : { selected: null, reason: "no_eligible_provider" as const };
};
export const validateAdapter = (adapter: ProviderAdapter, schema: ProviderSchema) => {
  if (
    adapter.status !== "provider_disabled" ||
    schema.status !== "active" ||
    schema.compatibility === "breaking"
  )
    throw new ProviderAbstractionError(
      "INVALID_PROVIDER",
      "Adapters must be disabled and schema-compatible.",
    );
  return adapter;
};
export const createProviderAiDraft = (
  value: Omit<ProviderAiDraft, "humanReviewRequired">,
  allowedSourceIds: readonly string[],
): ProviderAiDraft => {
  if (
    !value.sourceIds.length ||
    value.sourceIds.some((id) => !allowedSourceIds.includes(id)) ||
    /activate|rotate secret|switch provider|failover|retire/i.test(value.summary)
  )
    throw new ProviderAbstractionError(
      "UNSUPPORTED_AI_ACTION",
      "AI cannot change provider production state.",
    );
  return { ...value, humanReviewRequired: true };
};
