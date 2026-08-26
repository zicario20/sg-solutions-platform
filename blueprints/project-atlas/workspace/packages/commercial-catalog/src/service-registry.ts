import {
  validateCommercialProfile,
  validateDurationProfile,
  validateWorkflowBinding,
} from "./commercial-bindings.ts";

export const SERVICE_CATALOG_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/u;
export const SERVICE_CATALOG_VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;

export type ServiceCatalogLocale = "es" | "en";
export type ServiceContentLocale = "es-US" | "en-US";
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
  | "scheduled"
  | "active"
  | "limited"
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
  | "scheduled"
  | "expired"
  | "retired";
export type ServiceSurface = "public" | "client" | "admin" | "backend";
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
  availableFrom?: string | null;
  availableUntil?: string | null;
  capacityReference?: string | null;
  sourceReference?: string | null;
}>;

export type ServiceFulfillmentConfiguration = Readonly<{
  caseRequired: boolean;
  serviceOrderRequired: boolean;
  workflowRequired: boolean;
  appointmentRequired: boolean;
  documentCollectionRequired: boolean;
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
  requiredStaffRoles?: readonly string[];
  professionalScope?:
    | "education"
    | "administrative_assistance"
    | "document_preparation"
    | "referral"
    | "professional_service"
    | "regulated_activity";
  fulfillmentConfiguration?: ServiceFulfillmentConfiguration;
  createdAt: string;
  updatedAt: string;
}>;

export type ServiceTranslationStatus =
  | "draft"
  | "machine_generated"
  | "human_review_required"
  | "approved"
  | "published"
  | "outdated";

export type ServiceTranslation = Readonly<{
  name: string;
  summary: string;
  benefits: readonly string[];
  limitations: readonly string[];
  ctaLabel: string;
  internalName?: string;
  publicName?: string;
  clientDisplayName?: string;
  translationStatus?: ServiceTranslationStatus;
  reviewedByReference?: string | null;
  reviewedAt?: string | null;
}>;

export type ServiceCommercialProfile = Readonly<{
  billingMode: "direct_checkout" | "quote_required" | "consultation_required" | "no_payment";
  pricingReference: string | null;
  depositPolicyReference: string | null;
  paymentScheduleReference: string | null;
  cancellationPolicyReference: string | null;
  publicPriceDisplayMode?:
    | "exact_price"
    | "starting_at"
    | "quote_required"
    | "consultation_required"
    | "not_public"
    | "unknown";
}>;

export type ServiceDurationProfile = Readonly<{
  type: "estimate" | "target_window" | "unknown";
  unit: "business_days" | "calendar_days" | "weeks" | "months";
  minimum: number | null;
  maximum: number | null;
  confidence: "estimated" | "verified" | "unknown";
  sourceReference: string | null;
  components?: readonly (
    | "SG_processing"
    | "client_response"
    | "partner_processing"
    | "external_authority"
  )[];
  displayMode?: "range" | "starting_from" | "contact_for_estimate" | "not_displayed";
}>;

export type ServiceWorkflowBinding = Readonly<{
  workflowCode: string;
  workflowVersion?: string;
  startTrigger:
    | "payment_confirmation"
    | "payment_verified"
    | "human_authorization"
    | "intake_completion"
    | "manual";
  requiresPaymentConfirmation: boolean;
  requiresHumanAuthorization: boolean;
  clientStatusMappingReference?: string | null;
  inputMappingReference?: string | null;
}>;

export type ServiceVersion = Readonly<{
  id: string;
  serviceDefinitionId: string;
  version: string;
  publicationStatus: ServicePublicationStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
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
  servicePrerequisites: readonly string[];
  dependencyCodes: readonly string[];
  translations: Readonly<Record<ServiceCatalogLocale, ServiceTranslation>>;
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

function assertOptionalIso(value: string | null | undefined, label: string): void {
  if (value !== null && value !== undefined) assertIso(value, label);
}

function assertCodeList(value: readonly string[], label: string): void {
  if (new Set(value).size !== value.length) throw new TypeError(label + " duplicate");
  for (const item of value) {
    if (!SERVICE_CATALOG_CODE_PATTERN.test(item)) throw new TypeError(label + " invalid");
  }
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
  for (const [label, candidate] of [
    ["internalName", value.internalName],
    ["publicName", value.publicName],
    ["clientDisplayName", value.clientDisplayName],
  ] as const) {
    if (candidate !== undefined) assertText(candidate, "translations." + locale + "." + label);
  }
  if (
    value.translationStatus !== undefined &&
    ![
      "draft",
      "machine_generated",
      "human_review_required",
      "approved",
      "published",
      "outdated",
    ].includes(value.translationStatus)
  )
    throw new TypeError("translation status invalid");
  assertOptionalIso(value.reviewedAt, "translation reviewedAt");
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
  assertOptionalIso(value.availability.lastVerifiedAt, "availability.lastVerifiedAt");
  assertOptionalIso(value.availability.availableFrom, "availability.availableFrom");
  assertOptionalIso(value.availability.availableUntil, "availability.availableUntil");
  if (
    value.availability.availableFrom !== null &&
    value.availability.availableFrom !== undefined &&
    value.availability.availableUntil !== null &&
    value.availability.availableUntil !== undefined &&
    Date.parse(value.availability.availableUntil) < Date.parse(value.availability.availableFrom)
  )
    throw new TypeError("availability effective range invalid");
  if (value.audiences.length === 0 || value.surfaces.length === 0)
    throw new TypeError("audience and surface required");
  if (new Set(value.surfaces).size !== value.surfaces.length)
    throw new TypeError("service surfaces duplicate");
  if (value.availability.status !== "unknown" && value.availability.jurisdictions.length === 0)
    throw new TypeError("availability jurisdiction required");
  assertCodeList(value.providerRequirements, "provider requirements");
  assertCodeList(value.partnerRequirements, "partner requirements");
  if (
    value.requiredStaffRoles !== undefined &&
    value.requiredStaffRoles.some((role) => role.trim().length === 0)
  )
    throw new TypeError("required staff role invalid");
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
  assertOptionalIso(value.effectiveTo, "effectiveTo");
  if (
    value.effectiveTo !== undefined &&
    value.effectiveTo !== null &&
    Date.parse(value.effectiveTo) < Date.parse(value.effectiveFrom)
  )
    throw new TypeError("effective range invalid");
  assertIso(value.createdAt, "createdAt");
  validateTranslation(value.translations.es, "es");
  validateTranslation(value.translations.en, "en");
  assertCodeList(value.servicePrerequisites, "service prerequisites");
  assertCodeList(value.dependencyCodes, "service dependencies");
  assertCodeList(value.relatedServiceCodes, "related services");
  if (value.seo !== null) {
    if (!value.seo.canonicalPath.startsWith("/") || value.seo.canonicalPath.includes("//"))
      throw new TypeError("seo canonical path invalid");
    assertText(value.seo.title, "seo title");
    assertText(value.seo.description, "seo description");
  }
  assertText(value.configurationHash, "configurationHash");
  return deepFreeze(structuredClone(value));
}

export function assertPublishedVersionImmutable(
  current: ServiceVersion,
  candidate: ServiceVersion,
): ServiceVersion {
  if (current.id === candidate.id && !sameValue(current, candidate))
    throw new TypeError("published service version is immutable; create a new version");
  if (
    current.id !== candidate.id &&
    current.serviceDefinitionId === candidate.serviceDefinitionId &&
    current.version === candidate.version
  )
    throw new TypeError("replacement service version must advance version");
  return deepFreeze(structuredClone(candidate));
}

export function validateServicePublication(
  definition: ServiceDefinition,
  version: ServiceVersion,
): ServicePublicationReadiness {
  const reasons: NonNullable<
    Extract<ServicePublicationReadiness, { kind: "blocked" }>["reasons"]
  >[number][] = [];

  if (!["approved", "active", "limited", "published"].includes(definition.lifecycleStatus))
    reasons.push("service_not_approved");
  if (!["approved", "published", "scheduled"].includes(version.publicationStatus))
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
  capturedAt = version.createdAt,
): ServiceOrderCatalogSnapshot {
  const readiness = validateServicePublication(definition, version);
  if (readiness.kind !== "ready") throw new TypeError("service catalog version is not order-ready");
  assertIso(capturedAt, "capturedAt");
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
    servicePrerequisites: structuredClone(version.servicePrerequisites),
    dependencyCodes: structuredClone(version.dependencyCodes),
    translations: structuredClone(version.translations),
    capturedAt,
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

export function assertServiceCategoryHierarchy(
  categories: readonly Readonly<{ code: string; parentCategoryCode: string | null }>[],
): void {
  const parentByCode = new Map(
    categories.map((category) => [category.code, category.parentCategoryCode]),
  );
  for (const category of categories) {
    if (!SERVICE_CATALOG_CODE_PATTERN.test(category.code))
      throw new TypeError("category code invalid");
    if (category.parentCategoryCode !== null && !parentByCode.has(category.parentCategoryCode))
      throw new TypeError("category parent missing");
  }
  for (const category of categories) {
    const seen = new Set<string>();
    let current: string | null = category.code;
    while (current !== null) {
      if (seen.has(current)) throw new TypeError("service category cycle detected");
      seen.add(current);
      current = parentByCode.get(current) ?? null;
    }
  }
}
