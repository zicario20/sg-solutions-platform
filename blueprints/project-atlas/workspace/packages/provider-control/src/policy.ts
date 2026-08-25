import type { ProviderRegistration, ProviderUseDecision } from "./contracts.ts";
export function evaluateProviderUse(
  provider: ProviderRegistration,
  capability: string,
): ProviderUseDecision {
  if (provider.status !== "enabled")
    return { allowed: false, reason: "The provider is disabled or not activated." };
  if (!provider.ownerApproved)
    return { allowed: false, reason: "Product Owner approval is required." };
  if (!provider.secretReferenceConfigured || !provider.sandboxValidated)
    return { allowed: false, reason: "Provider readiness evidence is incomplete." };
  if (!provider.killSwitchEnabled)
    return { allowed: false, reason: "A kill switch is required before provider use." };
  if (!provider.capabilities.includes(capability))
    return { allowed: false, reason: "The provider capability is not allowlisted." };
  return { allowed: true, reason: "Provider use is permitted by the recorded registration." };
}
