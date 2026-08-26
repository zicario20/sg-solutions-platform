import type {
  AIModelDefinition,
  AIModelProviderProfile,
  AIModelVersion,
  AIToolDefinition,
  ModelRoutingDecision,
  ModelSelectionRequest,
  PromptVersion,
  ResourceBudget,
  ToolExecutionDecision,
} from "./contracts.ts";
import {
  AI_HUB_PROHIBITED_ACTIONS,
  assertExactVersionReference,
  assertIso,
  assertNoInstructionInjection,
  assertPositiveInteger,
  assertText,
  deepFreeze,
} from "./foundation.ts";

export function createModelProviderProfile(value: AIModelProviderProfile): AIModelProviderProfile {
  assertText(value.id, "model provider id", 160);
  assertText(value.workspaceId, "model provider workspace", 160);
  assertText(value.code, "model provider code", 96);
  if (value.providerKind === "ollama_local") {
    const endpoint = new URL(value.endpointReference);
    if (
      !/^https?:$/u.test(endpoint.protocol) ||
      !["127.0.0.1", "localhost"].includes(endpoint.hostname)
    )
      throw new TypeError("local model endpoint invalid");
  } else if (!value.endpointReference.startsWith("https://")) {
    throw new TypeError("model endpoint must be allowlisted HTTPS reference");
  }
  if (value.secretReference?.match(/(?:sk-|token=|password=|api[_-]?key=)/iu))
    throw new TypeError("model provider stores secret references only");
  if (value.status !== "disabled") throw new TypeError("model provider runtime remains disabled");
  assertIso(value.createdAt, "model provider createdAt");
  return deepFreeze(value);
}

export function createAIModelDefinition(value: AIModelDefinition): AIModelDefinition {
  assertText(value.id, "model definition id", 160);
  assertText(value.code, "model definition code", 96);
  assertText(value.providerProfileId, "model provider profile", 160);
  if (value.dataClassifications.length === 0)
    throw new TypeError("model data classifications required");
  assertIso(value.createdAt, "model definition createdAt");
  return deepFreeze(value);
}

export function createAIModelVersion(value: AIModelVersion): AIModelVersion {
  assertText(value.id, "model version id", 160);
  assertText(value.modelDefinitionId, "model definition reference", 160);
  assertText(value.exactModelId, "exact model id", 240);
  if (value.exactModelId.toLowerCase() === "latest")
    throw new TypeError("model version requires exact version");
  assertPositiveInteger(value.version, "model version");
  assertPositiveInteger(value.contextWindow, "model contextWindow");
  assertPositiveInteger(value.maximumOutputTokens, "model maximumOutputTokens");
  if (value.maximumOutputTokens > value.contextWindow)
    throw new TypeError("model output exceeds context");
  assertIso(value.createdAt, "model version createdAt");
  return deepFreeze(value);
}

export function createModelSelectionRequest(value: ModelSelectionRequest): ModelSelectionRequest {
  assertText(value.id, "model selection id", 160);
  assertText(value.agentVersionId, "model selection agent", 160);
  if (value.requiredCapabilities.length === 0) throw new TypeError("model capabilities required");
  assertIso(value.createdAt, "model selection createdAt");
  return deepFreeze(value);
}

export function routeModelSelection(
  request: ModelSelectionRequest,
  providers: readonly AIModelProviderProfile[],
  models: readonly AIModelDefinition[],
  versions: readonly AIModelVersion[],
): ModelRoutingDecision {
  const orderedProviders = [...providers].sort((left, right) => {
    const leftLocal =
      request.preferredPlacement === "local" && left.providerKind === "ollama_local" ? -1 : 0;
    const rightLocal =
      request.preferredPlacement === "local" && right.providerKind === "ollama_local" ? -1 : 0;
    return leftLocal - rightLocal;
  });
  for (const provider of orderedProviders) {
    const model = models.find(
      (item) =>
        item.providerProfileId === provider.id &&
        item.lifecycleStatus === "approved" &&
        item.dataClassifications.includes(request.dataClassification),
    );
    const version = model
      ? versions.find((item) => item.modelDefinitionId === model.id && item.status === "approved")
      : undefined;
    if (version)
      return deepFreeze({
        status: "blocked",
        reason: "runtime_disabled",
        candidateModelVersionId: version.id,
      });
  }
  return deepFreeze({
    status: "blocked",
    reason: "no_eligible_model",
    candidateModelVersionId: null,
  });
}

export function createPromptVersion(value: PromptVersion): PromptVersion {
  assertText(value.id, "prompt version id", 160);
  assertText(value.promptDefinitionId, "prompt definition reference", 160);
  assertPositiveInteger(value.version, "prompt version");
  assertExactVersionReference(value.templateReference, "prompt template reference");
  if (value.variableNames.length === 0) throw new TypeError("prompt variables required");
  value.variableNames.forEach((name) => {
    assertText(name, "prompt variable", 96);
  });
  assertIso(value.createdAt, "prompt version createdAt");
  return deepFreeze(value);
}

export function assertPromptVariablesSafe(values: Readonly<Record<string, string>>): void {
  Object.entries(values).forEach(([name, value]) => {
    assertText(name, "prompt variable name", 96);
    assertNoInstructionInjection(value);
  });
}

export function createAIToolDefinition(value: AIToolDefinition): AIToolDefinition {
  assertText(value.id, "tool id", 160);
  assertText(value.code, "tool code", 96);
  assertPositiveInteger(value.version, "tool version");
  if (AI_HUB_PROHIBITED_ACTIONS.has(value.code.toLowerCase()))
    throw new TypeError("tool is prohibited for AI control plane");
  if (value.sideEffectClass !== "read_only" && !value.idempotencyRequired)
    throw new TypeError("material tool requires idempotency");
  if (value.sideEffectClass === "external_write" && value.networkPolicy !== "sandbox_only")
    throw new TypeError("external tool requires sandbox-only policy");
  assertIso(value.createdAt, "tool createdAt");
  return deepFreeze(value);
}

export function evaluateToolExecution(
  tool: AIToolDefinition,
  input: Readonly<{
    actorType: "ai" | "human" | "service";
    permissions: readonly string[];
    approvals: readonly string[];
    idempotencyKey: string | null;
  }>,
): ToolExecutionDecision {
  if (tool.requiredPermissions.some((permission) => !input.permissions.includes(permission)))
    return deepFreeze({ status: "blocked", reason: "permission_missing" });
  if (tool.requiredApprovals.some((approval) => !input.approvals.includes(approval)))
    return deepFreeze({ status: "requires_review", reason: "approval_missing" });
  if (
    tool.idempotencyRequired &&
    (input.idempotencyKey === null || input.idempotencyKey.trim().length === 0)
  )
    return deepFreeze({ status: "blocked", reason: "idempotency_required" });
  return deepFreeze({ status: "blocked", reason: "runtime_disabled" });
}

export function assertDataEgressAllowed(
  dataCategories: readonly string[],
  providerKind: AIModelProviderProfile["providerKind"],
): void {
  if (
    dataCategories.some((category) =>
      [
        "restricted",
        "credit_report",
        "tax_return",
        "identity",
        "secret",
        "document_bytes",
      ].includes(category),
    )
  )
    throw new TypeError("data egress blocked by data classification");
  if (providerKind !== "ollama_local")
    throw new TypeError("external model data egress is not authorized");
}

export function createResourceBudget(value: ResourceBudget): ResourceBudget {
  assertText(value.id, "resource budget id", 160);
  assertText(value.code, "resource budget code", 96);
  if (value.costStatus === "unknown" && value.amountMinor === 0)
    throw new TypeError("unknown cost cannot be represented as zero");
  if (
    value.amountMinor !== null &&
    (!Number.isSafeInteger(value.amountMinor) || value.amountMinor < 0)
  )
    throw new TypeError("resource budget amount invalid");
  return deepFreeze(value);
}
