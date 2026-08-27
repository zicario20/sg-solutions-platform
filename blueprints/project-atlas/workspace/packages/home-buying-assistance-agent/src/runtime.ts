import type { HomeBuyingRuntime } from "./contracts.ts";

export function createHomeBuyingRuntime(): HomeBuyingRuntime {
  return {
    status: "disabled",
    providerCallsEnabled: false,
    programRuleLookupEnabled: false,
    propertyEligibilityLookupEnabled: false,
    automatedAffordabilityEnabled: false,
    applicationPreparationEnabled: false,
    providerHandoffEnabled: false,
    mortgageSubmissionEnabled: false,
    aiExecutionEnabled: false,
  };
}
