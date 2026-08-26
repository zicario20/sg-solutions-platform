import type {
  ServiceCommercialProfile,
  ServiceDurationProfile,
  ServiceWorkflowBinding,
} from "./service-registry.ts";

export type ServiceDocumentRequirement = Readonly<{
  code: string;
  level: "required" | "optional" | "conditional";
  stage: "before_quote" | "before_payment" | "before_start" | "during_service";
  appliesTo?: "client" | "organization" | "case" | "service_order";
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  alternativeGroup: string | null;
  conditionRuleReference?: string | null;
  freshnessDays?: number | null;
  missingBehavior?: "block" | "manual_review" | "continue_with_warning";
  instructions: string;
}>;

export type ServiceDisclosure = Readonly<{
  code: string;
  type:
    | "no_guarantee"
    | "provider_boundary"
    | "external_fee"
    | "consent"
    | "professional_scope"
    | "price"
    | "duration"
    | "jurisdiction"
    | "other";
  placement: "public_page" | "intake" | "quote" | "checkout" | "before_start";
  version: string;
  required: boolean;
  acknowledgmentRequired?: boolean;
  signatureRequired?: boolean;
  contentReference?: string | null;
}>;

export type ServiceIntakeBinding = Readonly<{
  definitionReference: string;
  version: string;
  mode: "progressive" | "full" | "staff_assisted";
  surface?: "public" | "client" | "admin";
  requiresAuthentication: boolean;
  dataClasses: readonly ("public" | "internal" | "confidential" | "restricted")[];
  stepReferences?: readonly string[];
}>;

export type ServiceJurisdictionRule = Readonly<{
  code: string;
  type: "include" | "exclude" | "review_required" | "provider_dependency";
  jurisdiction: string;
  publicMessage: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  dependencyReference?: string | null;
}>;

function reference(value: string | null | undefined, label: string, required: boolean): void {
  if (value === null || value === undefined) {
    if (required) throw new TypeError(label + " required");
    return;
  }
  if (value.trim().length === 0 || value.length > 180) throw new TypeError(label + " invalid");
}

function assertIso(value: string | null | undefined, label: string): void {
  if (
    value !== null &&
    value !== undefined &&
    (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
  )
    throw new TypeError(label + " invalid");
}

export function validateCommercialProfile(
  value: ServiceCommercialProfile,
): ServiceCommercialProfile {
  if (
    !["direct_checkout", "quote_required", "consultation_required", "no_payment"].includes(
      value.billingMode,
    )
  )
    throw new TypeError("billing mode invalid");
  reference(value.pricingReference, "pricing reference", value.billingMode !== "no_payment");
  reference(value.depositPolicyReference, "deposit policy reference", false);
  reference(value.paymentScheduleReference, "payment schedule reference", false);
  reference(value.cancellationPolicyReference, "cancellation policy reference", true);
  if (
    value.publicPriceDisplayMode !== undefined &&
    ![
      "exact_price",
      "starting_at",
      "quote_required",
      "consultation_required",
      "not_public",
      "unknown",
    ].includes(value.publicPriceDisplayMode)
  )
    throw new TypeError("public price display mode invalid");
  if (value.billingMode === "quote_required" && value.publicPriceDisplayMode === "exact_price")
    throw new TypeError("quote required service cannot display exact price");
  return Object.freeze(structuredClone(value));
}

export function validateDurationProfile(
  value: ServiceDurationProfile | null,
): ServiceDurationProfile {
  if (value === null || value.type === "unknown") throw new TypeError("duration profile required");
  if (!["business_days", "calendar_days", "weeks", "months"].includes(value.unit))
    throw new TypeError("duration unit invalid");
  if (
    !Number.isInteger(value.minimum) ||
    !Number.isInteger(value.maximum) ||
    value.minimum === null ||
    value.maximum === null ||
    value.minimum < 0 ||
    value.maximum < value.minimum
  )
    throw new TypeError("duration range invalid");
  reference(value.sourceReference, "duration source reference", true);
  if (value.components !== undefined && new Set(value.components).size !== value.components.length)
    throw new TypeError("duration components duplicate");
  return Object.freeze(structuredClone(value));
}

export function validateWorkflowBinding(
  value: ServiceWorkflowBinding | null,
): ServiceWorkflowBinding {
  if (value === null || value.workflowCode.trim().length === 0)
    throw new TypeError("workflow binding required");
  if (value.requiresHumanAuthorization && value.startTrigger !== "human_authorization")
    throw new TypeError("human authorization start trigger required");
  if (value.requiresPaymentConfirmation && value.startTrigger === "manual")
    throw new TypeError("payment trigger invalid");
  if (
    value.requiresPaymentConfirmation &&
    value.requiresHumanAuthorization &&
    value.startTrigger !== "human_authorization"
  )
    throw new TypeError("payment and human authorization require human gate");
  reference(value.workflowVersion, "workflow version", false);
  reference(value.clientStatusMappingReference, "client status mapping reference", false);
  reference(value.inputMappingReference, "workflow input mapping reference", false);
  return Object.freeze(structuredClone(value));
}

export function validateDocumentRequirements(
  value: readonly ServiceDocumentRequirement[],
): readonly ServiceDocumentRequirement[] {
  if (value.length === 0) throw new TypeError("document requirements required");
  const codes = new Set<string>();
  for (const item of value) {
    if (!/^[A-Z][A-Z0-9_]{2,63}$/u.test(item.code) || item.instructions.trim().length === 0)
      throw new TypeError("document requirement invalid");
    if (codes.has(item.code)) throw new TypeError("document requirement duplicate");
    codes.add(item.code);
    if (item.level === "conditional" && !item.conditionRuleReference)
      throw new TypeError("conditional document rule reference required");
    if (
      item.freshnessDays !== undefined &&
      item.freshnessDays !== null &&
      (!Number.isInteger(item.freshnessDays) || item.freshnessDays < 0)
    )
      throw new TypeError("document freshness invalid");
  }
  return Object.freeze(structuredClone(value));
}

export function validateDisclosureSet(
  value: readonly ServiceDisclosure[],
): readonly ServiceDisclosure[] {
  if (value.length === 0) throw new TypeError("disclosures required");
  const codes = new Set<string>();
  for (const item of value) {
    if (item.code.trim().length === 0 || item.version.trim().length === 0)
      throw new TypeError("disclosure invalid");
    if (codes.has(item.code + "@" + item.version)) throw new TypeError("disclosure duplicate");
    codes.add(item.code + "@" + item.version);
    reference(item.contentReference, "disclosure content reference", false);
    if (item.signatureRequired && !item.acknowledgmentRequired)
      throw new TypeError("disclosure signature requires acknowledgment");
  }
  return Object.freeze(structuredClone(value));
}

export function validateIntakeBinding(value: ServiceIntakeBinding): ServiceIntakeBinding {
  if (value.definitionReference.trim().length === 0 || value.version.trim().length === 0)
    throw new TypeError("intake binding invalid");
  if (value.dataClasses.includes("restricted") && !value.requiresAuthentication)
    throw new TypeError("restricted intake requires authentication");
  if (value.surface === "public" && value.dataClasses.includes("restricted"))
    throw new TypeError("public intake cannot collect restricted data");
  if (
    value.stepReferences !== undefined &&
    (value.stepReferences.length === 0 ||
      value.stepReferences.some((step) => step.trim().length === 0))
  )
    throw new TypeError("intake steps invalid");
  return Object.freeze(structuredClone(value));
}

export function validateJurisdictionRules(
  value: readonly ServiceJurisdictionRule[],
): readonly ServiceJurisdictionRule[] {
  const ruleKeys = new Set<string>();
  for (const item of value) {
    if (
      item.code.trim().length === 0 ||
      item.jurisdiction.trim().length === 0 ||
      item.publicMessage.trim().length === 0
    )
      throw new TypeError("jurisdiction rule invalid");
    assertIso(item.effectiveFrom, "jurisdiction effectiveFrom");
    assertIso(item.effectiveTo, "jurisdiction effectiveTo");
    if (
      item.effectiveFrom !== null &&
      item.effectiveFrom !== undefined &&
      item.effectiveTo !== null &&
      item.effectiveTo !== undefined &&
      Date.parse(item.effectiveTo) < Date.parse(item.effectiveFrom)
    )
      throw new TypeError("jurisdiction effective range invalid");
    if (item.type === "provider_dependency" && !item.dependencyReference)
      throw new TypeError("provider dependency reference required");
    const key = item.jurisdiction + "|" + item.type;
    if (ruleKeys.has(key)) throw new TypeError("jurisdiction rule duplicate");
    ruleKeys.add(key);
  }
  return Object.freeze(structuredClone(value));
}
