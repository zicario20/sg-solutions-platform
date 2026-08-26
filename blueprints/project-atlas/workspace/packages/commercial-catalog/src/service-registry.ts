import {
  validateCommercialProfile,
  validateDurationProfile,
  validateWorkflowBinding,
} from "./commercial-bindings.ts";

export const SERVICE_CATALOG_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/u;
export const SERVICE_CATALOG_VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;

export type ServiceCatalogLocale = "es" | "en";
export type ServiceAvailabilityStatus =
  | "available"
  | "limited"
  | "waitlist"
  | "unavailable"
  | "unknown";
export type ServiceLifecycleStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "paused"
  | "deprecated"
  | "retired"
  | "archived";
export type ServicePublicationStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "unpublished"
  | "retired";
export type ServiceSurface = "public" | "client" | "admin";
export type ServiceFulfillmentMode =
  | "internal_guidance"
  | "internal_operation"
  | "partner_referral"
  | "provider_assisted"
  | "informational";

export type ServiceAvailability = Readonly<{
  status: ServiceAvailabilityStatus;
  jurisdictions: readonly string[];
  excludedJurisdictions: readonly string[];
  lastVerifiedAt: string | null;
}>;

export type ServiceDefinition = Readonly<{
  id: string;
  code: string;
  categoryCode: string;
  serviceType: string;
  lifecycleStatus: ServiceLifecycleStatus;
  primaryDomain: string;
  fulfillmentMode: ServiceFulfillmentMode;
  availability: ServiceAvailability;
  audiences: readonly string[];
  surfaces: readonly ServiceSurface[];
  providerRequirements: readonly string[];
  partnerRequirements: readonly string[];
  createdAt: string;
  updatedAt: string;
}>;

export type ServiceTranslation = Readonly<{
  name: string;
  summary: string;
  benefits: readonly string[];
  limitations: readonly string[];
  ctaLabel: string;
}>;

export type ServiceCommercialProfile = Readonly<{
  billingMode: "direct_checkout" | "quote_required" | "consultation_required" | "no_payment";
  pricingReference: string | null;
  depositPolicyReference: string | null;
  paymentScheduleReference: string | null;
  cancellationPolicyReference: string | null;
}>;

export type ServiceDurationProfile = Readonly<{
  type: "estimate" | "target_window" | "unknown";
  unit: "business_days" | "calendar_days" | "weeks" | "months";
  minimum: number | null;
  maximum: number | null;
  confidence: "estimated" | "verified" | "unknown";
  sourceReference: string | null;
}>;

export type ServiceWorkflowBinding = Readonly<{
  workflowCode: string;
  startTrigger: "payment_confirmation" | "human_authorization" | "intake_completion" | "manual";
  requiresPaymentConfirmation: boolean;
  requiresHumanAuthorization: boolean;
}>;

export type ServiceVersion = Readonly<{
  id: string;
  serviceDefinitionId: string;
  version: string;
  publicationStatus: ServicePublicationStatus;
  effectiveFrom: string;
  translations: Readonly<Record<ServiceCatalogLocale, ServiceTranslation>>;
  commercialProfile: ServiceCommercialProfile;
  documentRequirementSetReference: string | null;
  durationProfile: ServiceDurationProfile | null;
  disclosureSetReference: string | null;
  intakeDefinitionReference: string | null;
  workflowBinding: ServiceWorkflowBinding | null;
  jurisdictionRuleSetReference: string | null;
  servicePrerequisites: readonly string[];
  dependencyCodes: readonly string[];
  relatedServiceCodes: readonly string[];
  seo: Readonly<{ canonicalPath: string; title: string; description: string }> | null;
  configurationHash: string;
  createdAt: string;
}>;

export type ServicePublicationReadiness =
  | Readonly<{ kind: "ready" }>
  | Readonly<{
      kind: "blocked";
      reasons: readonly (
        | "service_not_approved"
        | "version_not_approved"
        | "translation_required"
        | "availability_unknown"
        | "commercial_profile_required"
        | "document_requirements_required"
        | "duration_required"
        | "disclosure_required"
        | "intake_required"
        | "workflow_required"
        | "jurisdiction_required"
        | "provider_disabled"
      )[];
    }>;

export type ServiceOrderCatalogSnapshot = Readonly<{
  serviceDefinitionId: string;
  serviceVersionId: string;
  serviceCode: string;
  catalogVersion: string;
  configurationHash: string;
  fulfillmentMode: ServiceFulfillmentMode;
  commercialProfile: ServiceCommercialProfile;
  documentRequirementSetReference: string | null;
  durationProfile: ServiceDurationProfile | null;
  disclosureSetReference: string | null;
  intakeDefinitionReference: string | null;
  workflowBinding: ServiceWorkflowBinding | null;
  jurisdictionRuleSetReference: string | null;
  capturedAt: string;
}>;

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f);
}

function assertText(value: string, label: string): void {
  if (value.trim().length === 0 || value.length > 500 || hasControlCharacter(value))
    throw new TypeError(label + " invalid");
}

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
    throw new TypeError(label + " invalid");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateTranslation(value: ServiceTranslation, locale: ServiceCatalogLocale): void {
  assertText(value.name, "translations." + locale + ".name");
  assertText(value.summary, "translations." + locale + ".summary");
  assertText(value.ctaLabel, "translations." + locale + ".ctaLabel");
  if (value.benefits.length === 0 || value.limitations.length === 0)
    throw new TypeError("translations." + locale + " content incomplete");
  for (const item of [...value.benefits, ...value.limitations])
    assertText(item, "translation item");
}

export function createServiceDefinition(
  value: ServiceDefinition,
  existing: readonly ServiceDefinition[],
): ServiceDefinition {
  if (!SERVICE_CATALOG_CODE_PATTERN.test(value.code)) throw new TypeError("service code invalid");
  if (!SERVICE_CATALOG_CODE_PATTERN.test(value.categoryCode))
    throw new TypeError("category code invalid");
  if (existing.some((item) => item.code === value.code))
    throw new TypeError("service code must be unique");
  assertText(value.serviceType, "serviceType");
  assertText(value.primaryDomain, "primaryDomain");
  assertIso(value.createdAt, "createdAt");
  assertIso(value.updatedAt, "updatedAt");
  if (value.audiences.length === 0 || value.surfaces.length === 0)
    throw new TypeError("audience and surface required");
  if (value.availability.jurisdictions.length === 0)
    throw new TypeError("availability jurisdiction required");
  return deepFreeze(structuredClone(value));
}

export function createServiceVersion(
  value: ServiceVersion,
  existing: readonly ServiceVersion[],
): ServiceVersion {
  if (!SERVICE_CATALOG_VERSION_PATTERN.test(value.version))
    throw new TypeError("service version invalid");
  if (
    existing.some(
      (item) =>
        item.serviceDefinitionId === value.serviceDefinitionId && item.version === value.version,
    )
  )
    throw new TypeError("service version must be unique");
  assertIso(value.effectiveFrom, "effectiveFrom");
  assertIso(value.createdAt, "createdAt");
  validateTranslation(value.translations.es, "es");
  validateTranslation(value.translations.en, "en");
  assertText(value.configurationHash, "configurationHash");
  return deepFreeze(structuredClone(value));
}

export function assertPublishedVersionImmutable(
  current: ServiceVersion,
  candidate: ServiceVersion,
): ServiceVersion {
  if (current.id === candidate.id && !sameValue(current, candidate))
    throw new TypeError("published service version is immutable; create a new version");
  return deepFreeze(structuredClone(candidate));
}

export function validateServicePublication(
  definition: ServiceDefinition,
  version: ServiceVersion,
): ServicePublicationReadiness {
  const reasons: NonNullable<
    Extract<ServicePublicationReadiness, { kind: "blocked" }>["reasons"]
  >[number][] = [];

  if (!["approved", "published"].includes(definition.lifecycleStatus))
    reasons.push("service_not_approved");
  if (!["approved", "published"].includes(version.publicationStatus))
    reasons.push("version_not_approved");
  try {
    validateTranslation(version.translations.es, "es");
    validateTranslation(version.translations.en, "en");
  } catch {
    reasons.push("translation_required");
  }
  if (definition.availability.status === "unknown") reasons.push("availability_unknown");
  try {
    validateCommercialProfile(version.commercialProfile);
  } catch {
    reasons.push("commercial_profile_required");
  }
  if (version.documentRequirementSetReference === null)
    reasons.push("document_requirements_required");
  try {
    validateDurationProfile(version.durationProfile);
  } catch {
    reasons.push("duration_required");
  }
  if (version.disclosureSetReference === null) reasons.push("disclosure_required");
  if (version.intakeDefinitionReference === null) reasons.push("intake_required");
  try {
    validateWorkflowBinding(version.workflowBinding);
  } catch {
    reasons.push("workflow_required");
  }
  if (version.jurisdictionRuleSetReference === null) reasons.push("jurisdiction_required");
  if (definition.providerRequirements.length > 0) reasons.push("provider_disabled");

  return reasons.length === 0
    ? deepFreeze({ kind: "ready" })
    : deepFreeze({ kind: "blocked", reasons: Array.from(new Set(reasons)) });
}

export function createServiceOrderCatalogSnapshot(
  definition: ServiceDefinition,
  version: ServiceVersion,
): ServiceOrderCatalogSnapshot {
  const readiness = validateServicePublication(definition, version);
  if (readiness.kind !== "ready") throw new TypeError("service catalog version is not order-ready");
  return deepFreeze({
    serviceDefinitionId: definition.id,
    serviceVersionId: version.id,
    serviceCode: definition.code,
    catalogVersion: version.version,
    configurationHash: version.configurationHash,
    fulfillmentMode: definition.fulfillmentMode,
    commercialProfile: structuredClone(version.commercialProfile),
    documentRequirementSetReference: version.documentRequirementSetReference,
    durationProfile: structuredClone(version.durationProfile),
    disclosureSetReference: version.disclosureSetReference,
    intakeDefinitionReference: version.intakeDefinitionReference,
    workflowBinding: structuredClone(version.workflowBinding),
    jurisdictionRuleSetReference: version.jurisdictionRuleSetReference,
    capturedAt: version.createdAt,
  });
}

export function assertServiceDependencyGraph(
  dependencies: readonly Readonly<{ serviceCode: string; dependencyCodes: readonly string[] }>[],
): void {
  const graph = new Map(dependencies.map((item) => [item.serviceCode, item.dependencyCodes]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (code: string): void => {
    if (visiting.has(code)) throw new TypeError("service dependency cycle detected");
    if (visited.has(code)) return;
    visiting.add(code);
    for (const dependency of graph.get(code) ?? []) visit(dependency);
    visiting.delete(code);
    visited.add(code);
  };

  for (const code of graph.keys()) visit(code);
}
