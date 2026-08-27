import type { SchedulerRuntime, SchedulerRuntimeResult } from "./contracts.js";
import { assertM051RuntimeDisabled } from "./policy.js";

function disabledResult(requestedAction: string): SchedulerRuntimeResult {
  assertM051RuntimeDisabled();
  return {
    status: "disabled",
    requestedAction,
    executionPermitted: false,
    writesPerformed: false,
    providerCallsPerformed: false,
    notificationDispatchPerformed: false,
    nextSafeAction: "request_authorized_runtime_activation",
  };
}

export function createSchedulerRuntime(): SchedulerRuntime {
  return {
    prepareAction: (input) => disabledResult(input.requestedAction),
  };
}
