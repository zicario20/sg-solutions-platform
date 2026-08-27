import type { BusinessFormationRuntime } from "./contracts.ts";

export function createBusinessFormationRuntime(): BusinessFormationRuntime {
  return {
    status: "disabled",
    providerCallsEnabled: false,
    nameSearchEnabled: false,
    filingPackageAssemblyEnabled: false,
    filingSubmissionEnabled: false,
    einActionsEnabled: false,
    aiExecutionEnabled: false,
  };
}
