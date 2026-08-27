import type { TaxSpecialistRuntime } from "./contracts.ts";

export function createTaxSpecialistRuntime(): TaxSpecialistRuntime {
  return {
    status: "disabled",
    providerCallsEnabled: false,
    taxDocumentIngestionEnabled: false,
    taxRuleEvaluationEnabled: false,
    calculationEnabled: false,
    returnAssemblyEnabled: false,
    eFileEnabled: false,
    paymentActionsEnabled: false,
    refundActionsEnabled: false,
    aiExecutionEnabled: false,
  };
}
