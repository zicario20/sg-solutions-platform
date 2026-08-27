import type { BusinessFundingRuntime } from "./contracts.ts";

export function createBusinessFundingRuntime(): BusinessFundingRuntime {
  return {
    status: "disabled",
    providerCallsEnabled: false,
    underwritingEnabled: false,
    applicationPreparationEnabled: false,
    applicationSubmissionEnabled: false,
    fundsActionsEnabled: false,
    aiExecutionEnabled: false,
  };
}
