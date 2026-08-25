import type { EntitlementConsumptionResult, EntitlementGrantSnapshot } from "./contracts.ts";
export function activateEntitlement(
  grant: EntitlementGrantSnapshot,
  approvedToStart: boolean,
): EntitlementGrantSnapshot {
  return grant.status === "pending" && approvedToStart ? { ...grant, status: "active" } : grant;
}
export function consumeEntitlement(
  grant: EntitlementGrantSnapshot,
  quantity = 1,
): EntitlementConsumptionResult {
  if (!Number.isInteger(quantity) || quantity <= 0)
    return { accepted: false, grant, reason: "Quantity must be a positive integer." };
  if (grant.status !== "active")
    return { accepted: false, grant, reason: "Only active entitlements can be consumed." };
  if (grant.quantityUsed + quantity > grant.quantityGranted)
    return { accepted: false, grant, reason: "Insufficient entitlement balance." };
  const next = { ...grant, quantityUsed: grant.quantityUsed + quantity };
  return {
    accepted: true,
    grant: next.quantityUsed === next.quantityGranted ? { ...next, status: "consumed" } : next,
  };
}
export function revokeEntitlement(grant: EntitlementGrantSnapshot): EntitlementGrantSnapshot {
  return grant.status === "consumed" ? grant : { ...grant, status: "revoked" };
}
