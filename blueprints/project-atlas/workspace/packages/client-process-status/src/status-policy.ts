import type { ClientServiceAxesDto } from "@atlas/client-services";
import {
  PROCESS_STATUS_POLICY_VERSION,
  type ProcessBlockerDto,
  type ProcessStatusCode,
} from "./contracts.ts";

export { PROCESS_STATUS_POLICY_VERSION } from "./contracts.ts";
export type ProcessStatusResult =
  | {
      kind: "confirmed";
      code: ProcessStatusCode;
      policyVersion: typeof PROCESS_STATUS_POLICY_VERSION;
    }
  | { kind: "unconfirmed"; policyVersion: typeof PROCESS_STATUS_POLICY_VERSION };
export function resolveClientProcessStatus(
  a: ClientServiceAxesDto,
  facts: { blockers?: readonly Pick<ProcessBlockerDto, "effect">[] } = {},
): ProcessStatusResult {
  const u = (): ProcessStatusResult => ({
    kind: "unconfirmed",
    policyVersion: PROCESS_STATUS_POLICY_VERSION,
  });
  if (
    !["preliminary", "active", "cancelled"].includes(a.commercial) ||
    ![
      "unpaid",
      "processing",
      "paid",
      "partially_refunded",
      "refunded",
      "disputed",
      "cancelled",
      "unavailable",
    ].includes(a.financial) ||
    !["pending_review", "approved", "declined", "not_required", "unavailable"].includes(
      a.activation,
    ) ||
    ![
      "not_started",
      "in_progress",
      "waiting_client",
      "waiting_external",
      "completed",
      "cancelled",
      "unavailable",
    ].includes(a.fulfillment)
  )
    return u();
  if (
    a.financial === "unavailable" ||
    a.activation === "unavailable" ||
    a.fulfillment === "unavailable"
  )
    return u();
  if (a.financial === "refunded")
    return { kind: "confirmed", code: "refunded", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  if (a.commercial === "cancelled" || a.fulfillment === "cancelled")
    return { kind: "confirmed", code: "cancelled", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  if (
    ["in_progress", "waiting_client", "waiting_external", "completed"].includes(a.fulfillment) &&
    a.activation !== "approved" &&
    a.activation !== "not_required"
  )
    return u();
  if (
    a.financial === "disputed" ||
    a.financial === "partially_refunded" ||
    a.financial === "cancelled" ||
    a.activation === "declined"
  )
    return u();
  if (a.fulfillment === "completed")
    return { kind: "confirmed", code: "completed", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  if (facts.blockers?.some((x) => x.effect === "on_hold"))
    return { kind: "confirmed", code: "on_hold", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  if (facts.blockers?.some((x) => x.effect === "action_required"))
    return {
      kind: "confirmed",
      code: "action_required",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (a.fulfillment === "waiting_client")
    return {
      kind: "confirmed",
      code: "waiting_for_client",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (a.fulfillment === "waiting_external")
    return {
      kind: "confirmed",
      code: "waiting_for_external_party",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (a.fulfillment === "in_progress")
    return { kind: "confirmed", code: "in_progress", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  if (a.activation === "pending_review")
    return {
      kind: "confirmed",
      code: "under_review",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (a.financial === "unpaid" || a.financial === "processing")
    return {
      kind: "confirmed",
      code: "waiting_for_payment",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (
    a.commercial === "active" &&
    a.financial === "paid" &&
    (a.activation === "approved" || a.activation === "not_required") &&
    a.fulfillment === "not_started"
  )
    return {
      kind: "confirmed",
      code: "approved_to_start",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    };
  if (a.commercial === "preliminary" && a.fulfillment === "not_started")
    return { kind: "confirmed", code: "not_started", policyVersion: PROCESS_STATUS_POLICY_VERSION };
  return u();
}
