export interface SupervisorRuntimeControls {
  readonly supervisorEnabled: boolean;
  readonly delegationEnabled: boolean;
  readonly providerCallsEnabled: boolean;
}

export interface SupervisorBlockedResult {
  readonly status: "blocked";
  readonly reason: "supervisor_execution_not_implemented" | "supervisor_runtime_disabled";
}

export interface DisabledSupervisorRuntime {
  readonly start: (input: { readonly planReference: string }) => Promise<SupervisorBlockedResult>;
  readonly dispatchHandoff: (input: {
    readonly handoffReference: string;
  }) => Promise<SupervisorBlockedResult>;
  readonly reroute: (input: { readonly taskReference: string }) => Promise<SupervisorBlockedResult>;
}

export interface SupervisorLoopGuardResult {
  readonly action: "continue" | "human_escalation";
  readonly reasons: readonly ("no_progress" | "routing_loop")[];
}

export function createDisabledSupervisorRuntime(
  controls: SupervisorRuntimeControls,
): DisabledSupervisorRuntime {
  const reason =
    controls.supervisorEnabled && controls.delegationEnabled && controls.providerCallsEnabled
      ? "supervisor_execution_not_implemented"
      : "supervisor_runtime_disabled";
  const blocked = async (): Promise<SupervisorBlockedResult> => ({ status: "blocked", reason });

  return Object.freeze({
    start: async (_input: { readonly planReference: string }) => blocked(),
    dispatchHandoff: async (_input: { readonly handoffReference: string }) => blocked(),
    reroute: async (_input: { readonly taskReference: string }) => blocked(),
  });
}

export function evaluateLoopGuard(input: {
  readonly routingHistory: readonly string[];
  readonly maximumRepeatedRoutePairs: number;
  readonly noProgressEvents: number;
  readonly maximumNoProgressEvents: number;
}): SupervisorLoopGuardResult {
  const reasons: ("no_progress" | "routing_loop")[] = [];
  const routePairs = new Map<string, number>();
  for (let index = 1; index < input.routingHistory.length; index += 1) {
    const pair = `${input.routingHistory[index - 1]}->${input.routingHistory[index]}`;
    routePairs.set(pair, (routePairs.get(pair) ?? 0) + 1);
  }
  if ([...routePairs.values()].some((count) => count > input.maximumRepeatedRoutePairs))
    reasons.push("routing_loop");
  if (input.noProgressEvents > input.maximumNoProgressEvents) reasons.push("no_progress");
  return { action: reasons.length === 0 ? "continue" : "human_escalation", reasons };
}
