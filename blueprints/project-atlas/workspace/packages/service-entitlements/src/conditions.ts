import type {
  EntitlementConditionResult,
  EntitlementConditionType,
  EntitlementContext,
  EntitlementPolicy,
} from "./contracts.ts";
import { unknownBehaviorFor } from "./policy.ts";

const nextActionByCondition: Partial<Record<EntitlementConditionType, string>> = {
  payment_gate: "complete_payment",
  payment_verification: "complete_payment",
  human_authorization: "wait_for_review",
  document_readiness: "upload_documents",
  intake_status: "finish_intake",
  consent_status: "provide_consent",
  identity_verification: "verify_identity",
  jurisdiction: "contact_support",
  service_order_status: "contact_support",
  partner_availability: "wait_for_review",
  provider_capability: "wait_for_review",
};

const sourceVersionAliases: Readonly<Record<string, string>> = {
  m044: "payment",
  m074: "approval",
  m011: "documents",
  m078: "consent",
  m080: "identity",
  m040: "partner",
  m041: "provider",
};

function sourceFor(condition: EntitlementConditionType): string {
  if (condition === "payment_gate" || condition === "payment_verification") return "m044";
  if (condition === "human_authorization") return "m074";
  if (condition === "document_readiness") return "m011";
  if (condition === "consent_status") return "m078";
  if (condition === "identity_verification" || condition === "client_relationship") return "m080";
  if (condition === "partner_availability") return "m040";
  if (condition === "provider_capability") return "m041";
  return "m045_context";
}

function sourceVersionFor(
  context: EntitlementContext,
  source: string,
  conditionType: EntitlementConditionType,
): string {
  return (
    context.sourceVersions[source] ??
    context.sourceVersions[conditionType] ??
    context.sourceVersions[sourceVersionAliases[source] ?? source] ??
    "unknown"
  );
}

function valueFor(
  condition: EntitlementConditionType,
  context: EntitlementContext,
): "satisfied" | "unsatisfied" | "unknown" | "manual_review_required" {
  switch (condition) {
    case "payment_gate":
    case "payment_verification":
      return ["satisfied", "satisfied_with_conditions"].includes(context.paymentGate)
        ? "satisfied"
        : context.paymentGate === "manual_review_required"
          ? "manual_review_required"
          : context.paymentGate === "unknown"
            ? "unknown"
            : "unsatisfied";
    case "human_authorization":
      return context.humanAuthorization === "authorized"
        ? "satisfied"
        : context.humanAuthorization === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "document_readiness":
      return context.documentReadiness === "ready"
        ? "satisfied"
        : context.documentReadiness === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "intake_status":
      return context.intakeStatus === "complete"
        ? "satisfied"
        : context.intakeStatus === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "consent_status":
      return context.consentStatus === "granted"
        ? "satisfied"
        : context.consentStatus === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "identity_verification":
    case "client_relationship":
      return context.identityStatus === "verified"
        ? "satisfied"
        : context.identityStatus === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "jurisdiction":
      return context.jurisdictionStatus === "allowed"
        ? "satisfied"
        : context.jurisdictionStatus === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "service_order_exists":
      return context.serviceOrderStatus === "unknown" ? "unknown" : "satisfied";
    case "service_order_status":
      return context.serviceOrderStatus === "active" ||
        context.serviceOrderStatus === "waiting_on_client"
        ? "satisfied"
        : context.serviceOrderStatus === "unknown"
          ? "unknown"
          : "unsatisfied";
    case "partner_availability":
      return context.partnerAvailability === "available"
        ? "satisfied"
        : context.partnerAvailability === "unknown" || context.partnerAvailability === undefined
          ? "unknown"
          : "unsatisfied";
    case "provider_capability":
      return context.providerCapability === "available"
        ? "satisfied"
        : context.providerCapability === "unknown" || context.providerCapability === undefined
          ? "unknown"
          : "unsatisfied";
    case "cancellation":
      return ["cancelled", "closed"].includes(context.serviceOrderStatus)
        ? "unsatisfied"
        : "satisfied";
    case "refund":
    case "dispute":
      return context.serviceOrderStatus === "refunded_or_adjusted_context"
        ? "unsatisfied"
        : "satisfied";
    case "time_window":
    case "service_stage":
    case "manual_review":
    case "custom":
      return "satisfied";
  }
}

export function evaluateEntitlementConditions(
  policy: EntitlementPolicy,
  context: EntitlementContext,
  observedAt: string,
): readonly EntitlementConditionResult[] {
  return Object.freeze(
    policy.requiredConditions.map((conditionType) => {
      const freshness = context.conditionFreshness?.[conditionType] ?? "current";
      const source = sourceFor(conditionType);
      const sourceVersion = sourceVersionFor(context, source, conditionType);
      const rawStatus = valueFor(conditionType, context);
      const status =
        freshness === "stale" || freshness === "unknown"
          ? freshness
          : sourceVersion === "unknown"
            ? "unknown"
            : rawStatus;
      const nextAction =
        status === "satisfied"
          ? undefined
          : (nextActionByCondition[conditionType] ?? "contact_support");
      return Object.freeze({
        conditionType,
        status,
        blocking: true,
        source,
        sourceVersion,
        observedAt,
        ...(nextAction === undefined ? {} : { nextAction }),
        ...(status === "unknown" || status === "stale"
          ? { unknownBehavior: unknownBehaviorFor(policy, conditionType) }
          : {}),
      }) as EntitlementConditionResult;
    }),
  );
}
