import type {
  ClientEntitlementView,
  EntitlementDecision,
  EntitlementDecisionStatus,
} from "./contracts.ts";

type ClientViewOptions = Readonly<{
  displayName: string;
  serviceOrderReference?: string;
  locale?: "en" | "es";
}>;

function availabilityFor(
  status: EntitlementDecisionStatus,
): ClientEntitlementView["availabilityStatus"] {
  switch (status) {
    case "allow":
      return "available";
    case "allow_with_limits":
      return "available_with_limits";
    case "allow_read_only":
      return "read_only";
    case "action_required":
      return "action_required";
    case "manual_review_required":
    case "unknown":
      return "under_review";
    case "suspended":
      return "temporarily_unavailable";
    case "deny":
    case "not_applicable":
      return "unavailable";
  }
}

function clientSafeReason(status: EntitlementDecisionStatus, locale: "en" | "es"): string {
  const messages = {
    en: {
      available: "This service action is available.",
      action_required: "A required step needs attention before this action is available.",
      unavailable: "This action is not available for this service right now.",
      review: "This action is being reviewed.",
      temporary: "This action is temporarily unavailable.",
    },
    es: {
      available: "Esta acción del servicio está disponible.",
      action_required: "Hay un paso requerido pendiente antes de que esta acción esté disponible.",
      unavailable: "Esta acción no está disponible para este servicio en este momento.",
      review: "Esta acción está en revisión.",
      temporary: "Esta acción no está disponible temporalmente.",
    },
  } as const;
  const copy = messages[locale];
  if (status === "allow" || status === "allow_with_limits" || status === "allow_read_only")
    return copy.available;
  if (status === "action_required") return copy.action_required;
  if (status === "manual_review_required" || status === "unknown") return copy.review;
  if (status === "suspended") return copy.temporary;
  return copy.unavailable;
}

/** Removes policy internals, deny reasons, provider state, and audit identifiers. */
export function toClientEntitlementView(
  decision: EntitlementDecision,
  options: ClientViewOptions,
): ClientEntitlementView {
  const locale = options.locale ?? "en";
  const status = availabilityFor(decision.status);
  return Object.freeze({
    entitlementKey: decision.entitlementKey,
    displayName: options.displayName,
    ...(options.serviceOrderReference === undefined
      ? {}
      : { serviceOrderReference: options.serviceOrderReference }),
    availabilityStatus: status,
    allowedActions:
      status === "available" || status === "available_with_limits" || status === "read_only"
        ? [decision.entitlementKey]
        : [],
    limits:
      decision.limits.usageRemaining === undefined
        ? {}
        : { usageRemaining: decision.limits.usageRemaining },
    ...(decision.expiresAt === undefined ? {} : { expiresAt: decision.expiresAt }),
    nextActions: decision.nextActions,
    clientSafeReason: clientSafeReason(decision.status, locale),
    lastEvaluatedAt: decision.decidedAt,
  });
}
