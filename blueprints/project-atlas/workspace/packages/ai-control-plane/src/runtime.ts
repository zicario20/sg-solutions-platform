import type {
  AgentHandoffRequest,
  AgentRunStep,
  AIAgentRun,
  AIHubRuntimeHandoff,
  ExecutionPlan,
  HumanApprovalRequest,
} from "./contracts.ts";
import {
  assertExactVersionReference,
  assertIso,
  assertNoPrivateReasoning,
  assertPositiveInteger,
  assertText,
  deepFreeze,
} from "./foundation.ts";

const blocked: AIHubRuntimeHandoff = Object.freeze({
  status: "blocked",
  reason: "activation_not_authorized",
});

export function createAIAgentRun(value: AIAgentRun): AIAgentRun {
  assertText(value.id, "agent run id", 160);
  assertText(value.tenantId, "agent run tenant", 160);
  assertText(value.agentVersionId, "agent run version", 160);
  assertExactVersionReference(
    value.invocationAuthorizationReference,
    "run authorization reference",
  );
  assertExactVersionReference(value.inputSnapshotReference, "run input snapshot reference");
  assertExactVersionReference(value.contextSnapshotReference, "run context snapshot reference");
  assertIso(value.createdAt, "agent run createdAt");
  return deepFreeze(value);
}

export function createExecutionPlan(value: ExecutionPlan): ExecutionPlan {
  assertText(value.id, "execution plan id", 160);
  assertText(value.runId, "execution plan run", 160);
  assertText(value.actionScopeHash, "execution plan action scope", 240);
  if (value.requestedToolCodes.some((tool) => !value.allowedToolCodes.includes(tool)))
    throw new TypeError("requested tool is not allowed by execution plan");
  return deepFreeze(value);
}

const transitions: Readonly<Record<AgentRunStep["status"], readonly AgentRunStep["status"][]>> = {
  queued: ["running", "cancelled"],
  running: ["waiting", "completed", "failed", "cancelled"],
  waiting: ["running", "cancelled", "failed"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function transitionAgentRunStep(
  current: AgentRunStep,
  target: AgentRunStep["status"],
  expectedVersion: number,
): AgentRunStep {
  assertPositiveInteger(expectedVersion, "run step expected version");
  if (current.version !== expectedVersion) throw new TypeError("run step concurrency conflict");
  if (!transitions[current.status].includes(target))
    throw new TypeError("run step transition invalid");
  return deepFreeze({ ...current, status: target, version: current.version + 1 });
}

export function createAgentHandoffRequest(value: AgentHandoffRequest): AgentHandoffRequest {
  assertText(value.id, "handoff id", 160);
  assertText(value.sourceRunId, "handoff source run", 160);
  assertText(value.targetAgentVersionId, "handoff target agent", 160);
  assertText(value.purpose, "handoff purpose", 240);
  if (value.factReferences.length === 0 || value.sourceReferences.length === 0)
    throw new TypeError("handoff requires minimized facts and sources");
  [...value.factReferences, ...value.sourceReferences].forEach((reference) => {
    assertNoPrivateReasoning(reference, "handoff reference");
  });
  return deepFreeze(value);
}

export function createHumanApprovalRequest(value: HumanApprovalRequest): HumanApprovalRequest {
  assertText(value.id, "human approval id", 160);
  assertText(value.runId, "human approval run", 160);
  assertText(value.actionType, "human approval action", 120);
  assertText(value.parameterHash, "human approval parameters", 240);
  if (value.requiredApproverRoles.length === 0) throw new TypeError("human approval role required");
  assertIso(value.expiresAt, "human approval expiresAt");
  return deepFreeze(value);
}

export class DisabledAIHubRuntimeAdapter {
  startRun(): AIHubRuntimeHandoff {
    return blocked;
  }

  dispatchTool(): AIHubRuntimeHandoff {
    return blocked;
  }

  dispatchJob(): AIHubRuntimeHandoff {
    return blocked;
  }

  dispatchHandoff(): AIHubRuntimeHandoff {
    return blocked;
  }
}
