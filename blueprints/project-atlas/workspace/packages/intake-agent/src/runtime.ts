import type { IntakeRuntime, IntakeRuntimeResult } from "./contracts.js";
import { assertM050RuntimeDisabled } from "./policy.js";

function disabledResult(requestedAction: string): IntakeRuntimeResult {
  assertM050RuntimeDisabled();
  return {
    status: "disabled",
    executionPermitted: false,
    writesPerformed: false,
    dispatchPerformed: false,
    providerCallsPerformed: false,
    requestedAction,
    nextSafeAction: "request_authorized_runtime_activation",
  };
}

export function createIntakeRuntime(): IntakeRuntime {
  return {
    prepareSubmission: (input) => disabledResult(input.requestedAction),
  };
}
