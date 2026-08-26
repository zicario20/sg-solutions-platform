import type {
  ServiceCommercialProfile,
  ServiceDurationProfile,
  ServiceWorkflowBinding,
} from "./service-registry.ts";

export type ServiceDocumentRequirement = Readonly<{
  code: string;
  level: "required" | "optional" | "conditional";
  stage: "before_quote" | "before_payment" | "before_start" | "during_service";
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  alternativeGroup: string | null;
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
    | "other";
  placement: "public_page" | "intake" | "quote" | "checkout" | "before_start";
  version: string;
  required: boolean;
}>;

export type ServiceIntakeBinding = Readonly<{
  definitionReference: string;
  version: string;
  mode: "progressive" | "full" | "staff_assisted";
  requiresAuthentication: boolean;
  dataClasses: readonly ("public" | "internal" | "confidential" | "restricted")[];
}>;

export type ServiceJurisdictionRule = Readonly<{
  code: string;
  type: "include" | "exclude" | "review_required" | "provider_dependency";
  jurisdiction: string;
  publicMessage: string;
}>;

function reference(value: string | null, label: string, required: boolean): void {
  if (value === null) {
    if (required) throw new TypeError(label + " required");
    return;
  }
  if (value.trim().length === 0 || value.length > 180) throw new TypeError(label + " invalid");
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
  return Object.freeze(structuredClone(value));
}

export function validateDocumentRequirements(
  value: readonly ServiceDocumentRequirement[],
): readonly ServiceDocumentRequirement[] {
  if (value.length === 0) throw new TypeError("document requirements required");
  for (const item of value) {
    if (!/^[A-Z][A-Z0-9_]{2,63}$/u.test(item.code) || item.instructions.trim().length === 0)
      throw new TypeError("document requirement invalid");
  }
  return Object.freeze(structuredClone(value));
}

export function validateDisclosureSet(
  value: readonly ServiceDisclosure[],
): readonly ServiceDisclosure[] {
  if (value.length === 0) throw new TypeError("disclosures required");
  for (const item of value) {
    if (item.code.trim().length === 0 || item.version.trim().length === 0)
      throw new TypeError("disclosure invalid");
  }
  return Object.freeze(structuredClone(value));
}

export function validateIntakeBinding(value: ServiceIntakeBinding): ServiceIntakeBinding {
  if (value.definitionReference.trim().length === 0 || value.version.trim().length === 0)
    throw new TypeError("intake binding invalid");
  if (value.dataClasses.includes("restricted") && !value.requiresAuthentication)
    throw new TypeError("restricted intake requires authentication");
  return Object.freeze(structuredClone(value));
}

export function validateJurisdictionRules(
  value: readonly ServiceJurisdictionRule[],
): readonly ServiceJurisdictionRule[] {
  for (const item of value) {
    if (item.code.trim().length === 0 || item.jurisdiction.trim().length === 0)
      throw new TypeError("jurisdiction rule invalid");
  }
  return Object.freeze(structuredClone(value));
}
