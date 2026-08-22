import type { ClientServiceAxesDto, ClientServicePublicState } from "./contracts.ts";

export const CLIENT_SERVICE_STATUS_POLICY_VERSION = "m009.status.v1" as const;

export function resolveClientServicePublicState(axes: ClientServiceAxesDto): ClientServicePublicState {
  if (axes.financial === "unavailable" || axes.activation === "unavailable" || axes.fulfillment === "unavailable") return "unconfirmed";
  if (axes.commercial === "preliminary" && axes.fulfillment !== "not_started") return "unconfirmed";
  if (axes.commercial === "cancelled") {
    if (axes.fulfillment !== "not_started" && axes.fulfillment !== "cancelled") return "unconfirmed";
    return axes.financial === "refunded" ? "refunded" : "cancelled";
  }
  if (["in_progress", "waiting_client", "waiting_external", "completed"].includes(axes.fulfillment) && axes.activation !== "approved" && axes.activation !== "not_required") return "unconfirmed";
  if (axes.financial === "disputed") return "disputed";
  if (axes.financial === "refunded") return "refunded";
  if (axes.financial === "partially_refunded") return "partially_refunded";
  if (axes.fulfillment === "completed") return "completed";
  if (axes.fulfillment === "waiting_client") return "waiting_client";
  if (axes.fulfillment === "waiting_external") return "waiting_external";
  if (axes.fulfillment === "in_progress") return axes.activation === "approved" || axes.activation === "not_required" ? "in_progress" : "unconfirmed";
  if (axes.activation === "pending_review") return "pending_review";
  if (axes.activation === "approved" || axes.activation === "not_required") {
    if (axes.financial === "unpaid" || axes.financial === "processing") return "payment_pending";
    if (axes.financial === "paid" && axes.commercial === "active" && axes.fulfillment === "not_started") return "approved_to_start";
    return "unconfirmed";
  }
  if (axes.commercial === "preliminary") return "preliminary";
  return "unconfirmed";
}
