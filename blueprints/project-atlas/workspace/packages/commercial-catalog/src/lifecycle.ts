import { CatalogControlError, evaluateCatalogCommand } from "./governance.ts";
import type { ServiceJurisdictionRule } from "./commercial-bindings.ts";
import {
  type ServiceDefinition,
  type ServiceOrderCatalogSnapshot,
  type ServicePublicationReadiness,
  type ServiceVersion,
  validateServicePublication,
} from "./service-registry.ts";

export type ServicePublicationChannel = "public_web" | "client_portal" | "admin_console";
export type ServicePublicationRecord = Readonly<{
  id: string;
  serviceVersionId: string;
  channel: ServicePublicationChannel;
  status: "scheduled" | "published" | "unpublished" | "paused" | "expired";
  scheduledFor: string | null;
  publishedAt: string | null;
  unpublishedAt: string | null;
  approvalReferences: readonly string[];
  rollbackVersionId: string | null;
  createdAt: string;
}>;

export type ServiceCtaConfiguration = Readonly<{
  type: "create_lead_interest" | "request_quote" | "request_consultation" | "join_waitlist";
  target: "lead_management" | "pricing" | "appointments" | "waitlist";
  locale: "es" | "en";
}>;

export type ServiceCtaDecision =
  | Readonly<{ kind: "available"; configuration: ServiceCtaConfiguration }>
  | Readonly<{
      kind: "blocked";
      reason:
        | "service_not_discoverable"
        | "availability_unconfirmed"
        | "waitlist_required"
        | "provider_dependency_disabled";
    }>;

export type ServiceLeadInterestReference = Readonly<{
  serviceDefinitionId: string;
  serviceVersionId: string;
  serviceCode: string;
  sourceChannel: "public_web" | "client_portal" | "crm" | "staff";
  locale: "es" | "en";
  createdAt: string;
}>;

export type ServiceBundleComponent = Readonly<{
  serviceDefinitionId: string;
  serviceVersionId: string | null;
  required: boolean;
  removable: boolean;
  quantity: number;
  sortOrder: number;
}>;

export type ServiceBundleDefinition = Readonly<{
  serviceDefinitionId: string;
  serviceVersionId: string;
  bundleType: "fixed" | "configurable" | "tiered" | "coordinated";
  components: readonly ServiceBundleComponent[];
}>;

export type ServiceChangeImpact = Readonly<{
  classification: "none" | "editorial" | "material" | "high_risk";
  changedAreas: readonly string[];
  requiresNewVersion: boolean;
  activeOrders: "preserve_existing_snapshot" | "requires_explicit_amendment";
  newOrders: "use_current_version" | "blocked_pending_review";
}>;

export type ServiceDeprecationPlan = Readonly<{
  serviceDefinitionId: string;
  deprecatedVersionId: string;
  replacementServiceDefinitionId: string | null;
  replacementVersionId: string | null;
  newOrderBehavior: "block" | "redirect_to_replacement" | "manual_review";
  activeOrderBehavior: "preserve_snapshot_and_support";
  effectiveAt: string;
}>;

export type JurisdictionReadiness =
  | Readonly<{ kind: "ready" }>
  | Readonly<{ kind: "manual_review"; reason: "review_required" | "provider_dependency" }>
  | Readonly<{ kind: "blocked"; reason: "jurisdiction_excluded" }>
  | Readonly<{ kind: "unknown"; reason: "no_matching_rule" }>;

export type ServiceOrderReadiness =
  | Readonly<{ kind: "ready" }>
  | Readonly<{
      kind: "blocked";
      reasons: readonly (
        | "catalog_not_ready"
        | "payment_not_verified"
        | "human_authorization_required"
      )[];
    }>;

function assertIso(value: string | null, label: string): void {
  if (value !== null && (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z")))
    throw new TypeError(label + " invalid");
}

function readinessReason(readiness: ServicePublicationReadiness): ServiceCtaDecision | null {
  if (readiness.kind === "ready") return null;
  if (readiness.reasons.includes("provider_disabled"))
    return Object.freeze({ kind: "blocked", reason: "provider_dependency_disabled" });
  if (readiness.reasons.includes("availability_unknown"))
    return Object.freeze({ kind: "blocked", reason: "availability_unconfirmed" });
  return Object.freeze({ kind: "blocked", reason: "service_not_discoverable" });
}

export function evaluatePublicationTarget(
  definition: ServiceDefinition,
  version: ServiceVersion,
  input: Readonly<{ channel: ServicePublicationChannel; at: string }>,
): Readonly<{ kind: "ready" } | { kind: "blocked"; reasons: readonly string[] }> {
  assertIso(input.at, "publication target time");
  const readiness = validateServicePublication(definition, version);
  if (readiness.kind === "blocked") return Object.freeze(readiness);
  const requiredSurface =
    input.channel === "public_web"
      ? "public"
      : input.channel === "client_portal"
        ? "client"
        : "admin";
  if (!definition.surfaces.includes(requiredSurface))
    return Object.freeze({ kind: "blocked", reasons: ["surface_not_enabled"] });
  if (
    version.effectiveTo !== undefined &&
    version.effectiveTo !== null &&
    Date.parse(version.effectiveTo) <= Date.parse(input.at)
  )
    return Object.freeze({ kind: "blocked", reasons: ["version_expired"] });
  return Object.freeze({ kind: "ready" });
}

export function createServicePublicationRecord(
  input: ServicePublicationRecord & Readonly<{ actorType: "staff" | "owner" | "service_account" }>,
): ServicePublicationRecord {
  evaluateCatalogCommand({
    actorType: input.actorType,
    action: input.status === "published" ? "publish" : "unpublish",
    sourceIds: [input.serviceVersionId, ...input.approvalReferences],
  });
  if (input.status === "published" && input.approvalReferences.length === 0)
    throw new CatalogControlError("service publication requires approval evidence");
  assertIso(input.scheduledFor, "scheduledFor");
  assertIso(input.publishedAt, "publishedAt");
  assertIso(input.unpublishedAt, "unpublishedAt");
  assertIso(input.createdAt, "createdAt");
  return Object.freeze({
    id: input.id,
    serviceVersionId: input.serviceVersionId,
    channel: input.channel,
    status: input.status,
    scheduledFor: input.scheduledFor,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
    approvalReferences: Object.freeze([...input.approvalReferences]),
    rollbackVersionId: input.rollbackVersionId,
    createdAt: input.createdAt,
  });
}

export function evaluateServiceCta(
  definition: ServiceDefinition,
  version: ServiceVersion,
  configuration: ServiceCtaConfiguration,
): ServiceCtaDecision {
  const readiness = readinessReason(validateServicePublication(definition, version));
  if (readiness !== null) return readiness;
  if (!definition.surfaces.includes("public") || version.publicationStatus !== "published")
    return Object.freeze({ kind: "blocked", reason: "service_not_discoverable" });
  if (definition.availability.status === "waitlist" && configuration.type !== "join_waitlist")
    return Object.freeze({ kind: "blocked", reason: "waitlist_required" });
  if (
    definition.availability.status !== "available" &&
    definition.availability.status !== "limited" &&
    definition.availability.status !== "waitlist"
  )
    return Object.freeze({ kind: "blocked", reason: "availability_unconfirmed" });
  return Object.freeze({
    kind: "available",
    configuration: Object.freeze(structuredClone(configuration)),
  });
}

export function createLeadServiceInterestReference(
  definition: ServiceDefinition,
  version: ServiceVersion,
  input: Omit<
    ServiceLeadInterestReference,
    "serviceDefinitionId" | "serviceVersionId" | "serviceCode"
  >,
): ServiceLeadInterestReference {
  const decision = evaluateServiceCta(definition, version, {
    type: "create_lead_interest",
    target: "lead_management",
    locale: input.locale,
  });
  if (decision.kind !== "available")
    throw new CatalogControlError("service interest handoff blocked");
  assertIso(input.createdAt, "lead interest createdAt");
  return Object.freeze({
    serviceDefinitionId: definition.id,
    serviceVersionId: version.id,
    serviceCode: definition.code,
    sourceChannel: input.sourceChannel,
    locale: input.locale,
    createdAt: input.createdAt,
  });
}

export function createServiceBundleDefinition(
  value: ServiceBundleDefinition,
): ServiceBundleDefinition {
  if (value.components.length === 0) throw new TypeError("bundle requires components");
  const componentIds = new Set<string>();
  for (const component of value.components) {
    if (!Number.isInteger(component.quantity) || component.quantity < 1)
      throw new TypeError("bundle quantity invalid");
    if (!Number.isInteger(component.sortOrder) || component.sortOrder < 0)
      throw new TypeError("bundle sort order invalid");
    if (component.serviceDefinitionId === value.serviceDefinitionId)
      throw new TypeError("bundle cannot include itself");
    const key = component.serviceDefinitionId + "@" + (component.serviceVersionId ?? "current");
    if (componentIds.has(key)) throw new TypeError("bundle component duplicate");
    componentIds.add(key);
  }
  return Object.freeze(structuredClone(value));
}

export function evaluateServiceChangeImpact(
  previous: ServiceVersion,
  next: ServiceVersion,
): ServiceChangeImpact {
  if (previous.serviceDefinitionId !== next.serviceDefinitionId)
    throw new TypeError("service version definition mismatch");
  const comparisons = [
    ["translations", previous.translations, next.translations, "editorial"],
    ["seo", previous.seo, next.seo, "editorial"],
    ["commercialProfile", previous.commercialProfile, next.commercialProfile, "high_risk"],
    [
      "documentRequirements",
      previous.documentRequirementSetReference,
      next.documentRequirementSetReference,
      "material",
    ],
    ["duration", previous.durationProfile, next.durationProfile, "editorial"],
    ["disclosures", previous.disclosureSetReference, next.disclosureSetReference, "high_risk"],
    ["intake", previous.intakeDefinitionReference, next.intakeDefinitionReference, "material"],
    ["workflow", previous.workflowBinding, next.workflowBinding, "high_risk"],
    [
      "jurisdiction",
      previous.jurisdictionRuleSetReference,
      next.jurisdictionRuleSetReference,
      "high_risk",
    ],
    ["prerequisites", previous.servicePrerequisites, next.servicePrerequisites, "material"],
    ["dependencies", previous.dependencyCodes, next.dependencyCodes, "material"],
  ] as const;
  const changed = comparisons.filter(
    ([, left, right]) => JSON.stringify(left) !== JSON.stringify(right),
  );
  const classification = changed.some((item) => item[3] === "high_risk")
    ? "high_risk"
    : changed.some((item) => item[3] === "material")
      ? "material"
      : changed.length > 0
        ? "editorial"
        : "none";
  return Object.freeze({
    classification,
    changedAreas: Object.freeze(changed.map(([area]) => area)),
    requiresNewVersion: classification !== "none",
    activeOrders:
      classification === "none" || classification === "editorial"
        ? "preserve_existing_snapshot"
        : "requires_explicit_amendment",
    newOrders: classification === "high_risk" ? "blocked_pending_review" : "use_current_version",
  });
}

export function planServiceDeprecation(value: ServiceDeprecationPlan): ServiceDeprecationPlan {
  if (
    value.newOrderBehavior === "redirect_to_replacement" &&
    (value.replacementServiceDefinitionId === null || value.replacementVersionId === null)
  )
    throw new TypeError("replacement service required for redirect");
  if (value.replacementServiceDefinitionId === value.serviceDefinitionId)
    throw new TypeError("replacement service must differ");
  assertIso(value.effectiveAt, "deprecation effectiveAt");
  return Object.freeze(structuredClone(value));
}

export function evaluateJurisdictionReadiness(
  jurisdiction: string,
  rules: readonly ServiceJurisdictionRule[],
  at: string,
): JurisdictionReadiness {
  assertIso(at, "jurisdiction readiness time");
  const active = rules.filter((rule) => {
    const beforeStart =
      rule.effectiveFrom !== null &&
      rule.effectiveFrom !== undefined &&
      Date.parse(at) < Date.parse(rule.effectiveFrom);
    const afterEnd =
      rule.effectiveTo !== null &&
      rule.effectiveTo !== undefined &&
      Date.parse(at) >= Date.parse(rule.effectiveTo);
    return !beforeStart && !afterEnd && rule.jurisdiction === jurisdiction;
  });
  if (active.some((rule) => rule.type === "exclude"))
    return Object.freeze({ kind: "blocked", reason: "jurisdiction_excluded" });
  if (active.some((rule) => rule.type === "provider_dependency"))
    return Object.freeze({ kind: "manual_review", reason: "provider_dependency" });
  if (active.some((rule) => rule.type === "review_required"))
    return Object.freeze({ kind: "manual_review", reason: "review_required" });
  if (active.some((rule) => rule.type === "include")) return Object.freeze({ kind: "ready" });
  return Object.freeze({ kind: "unknown", reason: "no_matching_rule" });
}

export function evaluateServiceOrderReadiness(
  definition: ServiceDefinition,
  version: ServiceVersion,
  input: Readonly<{ paymentVerified: boolean; humanAuthorized: boolean }>,
): ServiceOrderReadiness {
  const reasons: ("catalog_not_ready" | "payment_not_verified" | "human_authorization_required")[] =
    [];
  if (validateServicePublication(definition, version).kind !== "ready")
    reasons.push("catalog_not_ready");
  if (version.workflowBinding?.requiresPaymentConfirmation && !input.paymentVerified)
    reasons.push("payment_not_verified");
  if (version.workflowBinding?.requiresHumanAuthorization && !input.humanAuthorized)
    reasons.push("human_authorization_required");
  return reasons.length === 0
    ? Object.freeze({ kind: "ready" })
    : Object.freeze({ kind: "blocked", reasons: Object.freeze(reasons) });
}

export function preserveActiveOrderSnapshot(
  snapshot: ServiceOrderCatalogSnapshot,
  proposedVersion: ServiceVersion,
): Readonly<{
  preservedSnapshot: ServiceOrderCatalogSnapshot;
  proposedVersionId: string;
  requiresAmendment: true;
}> {
  return Object.freeze({
    preservedSnapshot: snapshot,
    proposedVersionId: proposedVersion.id,
    requiresAmendment: true,
  });
}
