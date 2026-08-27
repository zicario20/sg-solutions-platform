import type { CustomerSupportRuntime, CustomerSupportRuntimeResult } from "./contracts.js";
import { assertM052RuntimeDisabled } from "./policy.js";

function disabledResult(requestedAction: string): CustomerSupportRuntimeResult {
  assertM052RuntimeDisabled();
  return {
    status: "disabled",
    requestedAction,
    executionPermitted: false,
    writesPerformed: false,
    providerCallsPerformed: false,
    messageDispatchPerformed: false,
    nextSafeAction: "request_authorized_runtime_activation",
  };
}

export function createCustomerSupportRuntime(): CustomerSupportRuntime {
  return {
    prepareAction: (input) => disabledResult(input.requestedAction),
  };
}
