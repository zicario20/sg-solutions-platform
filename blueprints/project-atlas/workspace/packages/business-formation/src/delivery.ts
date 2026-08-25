import type { FormationDeliveryModel } from "./contracts.ts";

export type FormationDeliveryResult = Readonly<{
  available: boolean;
  mode: "internal" | "provider_managed" | "referral_only" | "unavailable";
}>;

export function evaluateFormationDelivery(
  input: Readonly<{
    deliveryModel: FormationDeliveryModel;
    provider?: Readonly<{
      status: "disabled" | "sandbox_pending" | "enabled" | "paused" | "degraded";
      supportsSubmission: boolean;
      killSwitchEnabled: boolean;
    }>;
  }>,
): FormationDeliveryResult {
  if (input.deliveryModel === "sg_service") return { available: true, mode: "internal" };
  if (input.deliveryModel === "marketplace_referral")
    return { available: true, mode: "referral_only" };
  if (
    input.deliveryModel !== "sg_managed_with_partner" ||
    !input.provider ||
    input.provider.status !== "enabled" ||
    !input.provider.supportsSubmission ||
    input.provider.killSwitchEnabled
  ) {
    return { available: false, mode: "unavailable" };
  }
  return { available: true, mode: "provider_managed" };
}
