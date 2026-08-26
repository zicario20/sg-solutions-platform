import type {
  AgentCapability,
  AgentDependencyEdge,
  AgentManifest,
  AgentRollout,
  AgentSurfaceBinding,
  AgentVersion,
  AIAssetDefinition,
  AIHubAgentDefinition,
  AIHubWorkspace,
} from "./contracts.ts";
import { AgentGraphError } from "./contracts.ts";
import {
  AI_HUB_PROHIBITED_ACTIONS,
  assertExactVersionReference,
  assertIso,
  assertPositiveInteger,
  assertText,
  deepFreeze,
  sameValue,
} from "./foundation.ts";

const codePattern = /^[A-Z][A-Z0-9_]{2,95}$/u;

export function createAIHubWorkspace(value: AIHubWorkspace): AIHubWorkspace {
  assertText(value.id, "workspace id", 160);
  assertText(value.tenantId, "workspace tenant", 160);
  if (!codePattern.test(value.code)) throw new TypeError("workspace code invalid");
  if (value.environment !== "production" && value.productionDataAccess)
    throw new TypeError("production data is not permitted outside production");
  assertIso(value.createdAt, "workspace createdAt");
  return deepFreeze(value);
}

export function createAIAssetDefinition(value: AIAssetDefinition): AIAssetDefinition {
  assertText(value.id, "asset id", 160);
  assertText(value.workspaceId, "asset workspace", 160);
  if (!codePattern.test(value.code)) throw new TypeError("asset code invalid");
  assertText(value.ownerReference, "asset owner", 160);
  assertIso(value.createdAt, "asset createdAt");
  return deepFreeze(value);
}

export function createAgentDefinition(value: AIHubAgentDefinition): AIHubAgentDefinition {
  assertText(value.id, "agent definition id", 160);
  assertText(value.workspaceId, "agent workspace", 160);
  if (!codePattern.test(value.code)) throw new TypeError("agent code invalid");
  assertText(value.displayName, "agent displayName", 180);
  assertText(value.ownerReference, "agent owner", 160);
  assertText(value.purpose, "agent purpose", 1_000);
  assertText(value.scopeBoundary, "agent scope boundary", 1_000);
  assertIso(value.createdAt, "agent createdAt");
  return deepFreeze(value);
}

function validateCapability(value: AgentCapability): AgentCapability {
  if (!codePattern.test(value.code)) throw new TypeError("agent capability code invalid");
  if (AI_HUB_PROHIBITED_ACTIONS.has(value.code.toLowerCase()))
    throw new TypeError("agent capability is prohibited");
  if (value.preconditions.length === 0)
    throw new TypeError("agent capability preconditions required");
  value.preconditions.forEach((item) => {
    assertText(item, "agent capability precondition", 160);
  });
  return deepFreeze(value);
}

export function createAgentVersion(value: AgentVersion): AgentVersion {
  assertText(value.id, "agent version id", 160);
  assertText(value.agentDefinitionId, "agent definition reference", 160);
  assertPositiveInteger(value.version, "agent version");
  if (value.capabilities.length === 0) throw new TypeError("agent capabilities required");
  const capabilities = value.capabilities.map(validateCapability);
  if (new Set(capabilities.map((item) => item.code)).size !== capabilities.length)
    throw new TypeError("agent capabilities duplicate");
  assertIso(value.createdAt, "agent version createdAt");
  return deepFreeze({ ...value, capabilities });
}

export function assertAgentVersionImmutable(
  current: AgentVersion,
  candidate: AgentVersion,
): AgentVersion {
  if (current.status === "published" && !sameValue(current, candidate))
    throw new TypeError("published agent version is immutable");
  return deepFreeze(candidate);
}

export function validateAgentSurfaceBinding(value: AgentSurfaceBinding): AgentSurfaceBinding {
  assertText(value.agentVersionId, "surface agent version", 160);
  if (value.capabilityCodes.length === 0) throw new TypeError("surface capabilities required");
  if (
    value.surface === "public" &&
    value.capabilityCodes.some((code) => !/^(ANSWER|COLLECT|EXPLAIN)_/u.test(code))
  )
    throw new TypeError("public surface permits only answer, explain, or collect capabilities");
  if (
    value.surface === "client" &&
    (!value.ownershipRequired || value.requiredEntitlements.length === 0)
  )
    throw new TypeError("client surface requires ownership and entitlement");
  if (value.surface === "admin" && value.requiredPermissions.length === 0)
    throw new TypeError("admin surface requires RBAC permission");
  if (value.surface === "backend" && value.requiredPermissions.length === 0)
    throw new TypeError("backend surface requires service permission");
  return deepFreeze(value);
}

export function createAgentManifest(value: AgentManifest): AgentManifest {
  assertText(value.id, "agent manifest id", 160);
  assertText(value.agentVersionId, "manifest agent version", 160);
  const references = [
    value.modelPolicyReference,
    value.promptBundleReference,
    value.toolPolicyReference,
    value.skillSetReference,
    value.knowledgeBindingReference,
    value.humanApprovalPolicyReference,
    value.dataHandlingPolicyReference,
    value.loggingPolicyReference,
    value.resourceBudgetReference,
    value.fallbackPolicyReference,
  ];
  references.forEach((reference) => {
    assertExactVersionReference(reference, "manifest reference");
  });
  assertIso(value.createdAt, "manifest createdAt");
  return deepFreeze(value);
}

export function createAgentDependencyGraph(
  edges: readonly AgentDependencyEdge[],
): readonly AgentDependencyEdge[] {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    assertText(edge.sourceAgentVersionId, "dependency source", 160);
    assertText(edge.targetAgentVersionId, "dependency target", 160);
    if (edge.sourceAgentVersionId === edge.targetAgentVersionId)
      throw new AgentGraphError("agent delegation cycle detected");
    graph.set(edge.sourceAgentVersionId, [
      ...(graph.get(edge.sourceAgentVersionId) ?? []),
      edge.targetAgentVersionId,
    ]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): void => {
    if (visiting.has(node)) throw new AgentGraphError("agent delegation cycle detected");
    if (visited.has(node)) return;
    visiting.add(node);
    (graph.get(node) ?? []).forEach(visit);
    visiting.delete(node);
    visited.add(node);
  };
  [...graph.keys()].forEach(visit);
  return deepFreeze([...edges]);
}

export function resolveAgentRollout(value: AgentRollout): AgentRollout {
  assertText(value.agentVersionId, "rollout agent version", 160);
  assertText(value.rollbackAgentVersionId, "rollback agent version", 160);
  if (
    !Number.isInteger(value.rolloutPercentage) ||
    value.rolloutPercentage < 0 ||
    value.rolloutPercentage > 100
  )
    throw new TypeError("rollout percentage invalid");
  if (
    ["high", "critical"].includes(value.riskTier) &&
    value.rolloutPercentage > 0 &&
    value.rolloutPercentage < 100
  )
    throw new TypeError("high-risk agent requires non-random rollout");
  if (value.channel === "stable" && value.rolloutPercentage !== 100)
    throw new TypeError("stable rollout must be complete");
  return deepFreeze(value);
}
