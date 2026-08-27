import type { MarketplaceAssistantRuntime } from "./contracts.ts";

export function createMarketplaceAssistantRuntime(): MarketplaceAssistantRuntime {
  return {
    status: "disabled",
    providerCallsEnabled: false,
    recommendationExecutionEnabled: false,
    referralCreationEnabled: false,
    redirectGenerationEnabled: false,
    applicationSubmissionEnabled: false,
    statusReconciliationEnabled: false,
    commissionHandlingEnabled: false,
    aiExecutionEnabled: false,
  };
}
