export const LIGHTWEIGHT_LOCAL_AI_NODE_MODULE = "M094" as const;

export const LIGHTWEIGHT_LOCAL_AI_NODE_PERMISSIONS = [
  "lightweight_ai.node.create",
  "lightweight_ai.runtime.create",
  "lightweight_ai.model_profile.create",
  "lightweight_ai.gateway.create",
  "lightweight_ai.context.create",
  "lightweight_ai.inference.request",
  "lightweight_ai.tool_request.create",
  "lightweight_ai.escalation.request",
] as const;

export type LightweightLocalAiNodePermission = (typeof LIGHTWEIGHT_LOCAL_AI_NODE_PERMISSIONS)[number];

export const LIGHTWEIGHT_LOCAL_AI_NODE_RUNTIME = {
  modelArtifactDownload: false,
  modelLoad: false,
  inferenceGateway: false,
  inferenceExecution: false,
  ragRetrieval: false,
  toolExecution: false,
  gpuEscalation: false,
  cloudFallback: false,
  conversationMemory: false,
  telemetry: false,
} as const;

export type LightweightCapabilityTier = "router" | "classifier" | "faq_rag" | "summarizer" | "structured_extractor" | "light_chat" | "tool_request_formatter" | "unsupported_heavy_reasoning";
export type LightweightTaskClass = "service_inquiry" | "appointment_question" | "document_question" | "payment_question" | "support" | "escalation" | "multi_intent" | "unknown";

export interface LightweightAINode {
  readonly module: typeof LIGHTWEIGHT_LOCAL_AI_NODE_MODULE;
  readonly nodeCode: string;
  readonly homelabNodeReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly ready: false;
  readonly runtimeConnected: false;
}

export interface LocalAIRuntime {
  readonly runtimeCode: string;
  readonly engineReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly endpointExposed: false;
  readonly modelLoaded: false;
}

export interface LightweightModelProfile {
  readonly modelProfileCode: string;
  readonly runtimeCode: string;
  readonly capabilityTier: LightweightCapabilityTier;
  readonly taskClasses: readonly LightweightTaskClass[];
  readonly artifactChecksumReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly taskCertified: false;
  readonly toolAuthorityGranted: false;
}

export interface LightweightInferenceGateway {
  readonly gatewayCode: string;
  readonly nodeCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly endpointActive: false;
  readonly authorizationEnforced: false;
}

export interface LightweightContextPackage {
  readonly contextCode: string;
  readonly contextReferences: readonly string[];
  readonly status: "draft";
  readonly minimized: true;
  readonly rawClientDataStored: false;
  readonly privateChainOfThoughtStored: false;
}

export interface LightweightInferenceRequest {
  readonly requestCode: string;
  readonly gatewayCode: string;
  readonly taskClass: LightweightTaskClass;
  readonly modelProfileCode: string;
  readonly contextCode: string;
  readonly status: "draft";
  readonly dispatched: false;
  readonly modelCalled: false;
}

export interface LightweightInferenceResponse {
  readonly requestCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly responseGenerated: false;
  readonly businessActionCompleted: false;
  readonly rawPromptLogged: false;
}

export interface LightweightAIToolRequest {
  readonly toolRequestCode: string;
  readonly requestedToolReference: string;
  readonly status: "draft";
  readonly toolExecutionRequested: false;
  readonly modelTextTrustedForExecution: false;
}

export interface LightweightGpuEscalationRequest {
  readonly requestCode: string;
  readonly sourceRequestCode: string;
  readonly targetModule: "M095";
  readonly status: "review_required";
  readonly escalated: false;
  readonly dataScopeExpanded: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: LightweightLocalAiNodePermission): void {
  if (!LIGHTWEIGHT_LOCAL_AI_NODE_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported lightweight-local-ai-node permission: ${permission}.`);
  }
}

export function createLightweightAINode(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly nodeCode: string;
  readonly homelabNodeReference: string;
}): LightweightAINode {
  requirePermission(input.permission);
  requireIdentifier(input.nodeCode, "Lightweight AI node code");
  requireIdentifier(input.homelabNodeReference, "Homelab node reference");

  return {
    module: LIGHTWEIGHT_LOCAL_AI_NODE_MODULE,
    nodeCode: input.nodeCode,
    homelabNodeReference: input.homelabNodeReference,
    status: "draft",
    active: false,
    ready: false,
    runtimeConnected: false,
  };
}

export function createLocalAIRuntime(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly runtimeCode: string;
  readonly engineReference: string;
  readonly includesRawSecret?: boolean;
}): LocalAIRuntime {
  requirePermission(input.permission);
  requireIdentifier(input.runtimeCode, "Local AI runtime code");
  requireIdentifier(input.engineReference, "Local AI runtime engine reference");
  if (input.includesRawSecret) {
    throw new Error("Local AI runtimes cannot store raw secrets or provider credentials.");
  }

  return { runtimeCode: input.runtimeCode, engineReference: input.engineReference, status: "draft", active: false, endpointExposed: false, modelLoaded: false };
}

export function createLightweightModelProfile(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly modelProfileCode: string;
  readonly runtime: LocalAIRuntime;
  readonly capabilityTier: LightweightCapabilityTier;
  readonly taskClasses: readonly LightweightTaskClass[];
  readonly artifactChecksumReference: string;
  readonly includesUnverifiedArtifact?: boolean;
}): LightweightModelProfile {
  requirePermission(input.permission);
  requireIdentifier(input.modelProfileCode, "Lightweight model profile code");
  requireIdentifier(input.artifactChecksumReference, "Model artifact checksum reference");
  if (input.taskClasses.length === 0 || input.includesUnverifiedArtifact) {
    throw new Error("Lightweight model profiles require verified artifacts and explicit task classes.");
  }

  return {
    modelProfileCode: input.modelProfileCode,
    runtimeCode: input.runtime.runtimeCode,
    capabilityTier: input.capabilityTier,
    taskClasses: input.taskClasses,
    artifactChecksumReference: input.artifactChecksumReference,
    status: "draft",
    active: false,
    taskCertified: false,
    toolAuthorityGranted: false,
  };
}

export function createLightweightInferenceGateway(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly gatewayCode: string;
  readonly node: LightweightAINode;
}): LightweightInferenceGateway {
  requirePermission(input.permission);
  requireIdentifier(input.gatewayCode, "Lightweight inference gateway code");

  return { gatewayCode: input.gatewayCode, nodeCode: input.nodeCode, status: "draft", active: false, endpointActive: false, authorizationEnforced: false };
}

export function createLightweightContextPackage(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly contextCode: string;
  readonly contextReferences: readonly string[];
  readonly includesRawClientData?: boolean;
  readonly includesPrivateChainOfThought?: boolean;
}): LightweightContextPackage {
  requirePermission(input.permission);
  requireIdentifier(input.contextCode, "Lightweight context package code");
  if (input.contextReferences.length === 0 || input.includesRawClientData || input.includesPrivateChainOfThought) {
    throw new Error("Lightweight context packages require minimized safe references without raw client data or private reasoning.");
  }

  return {
    contextCode: input.contextCode,
    contextReferences: input.contextReferences,
    status: "draft",
    minimized: true,
    rawClientDataStored: false,
    privateChainOfThoughtStored: false,
  };
}

export function requestLightweightInference(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly requestCode: string;
  readonly gateway: LightweightInferenceGateway;
  readonly taskClass: LightweightTaskClass;
  readonly modelProfile: LightweightModelProfile;
  readonly context: LightweightContextPackage;
  readonly includesRawSecret?: boolean;
}): LightweightInferenceRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Lightweight inference request code");
  if (input.includesRawSecret) {
    throw new Error("Lightweight inference requests cannot include raw secrets.");
  }

  return {
    requestCode: input.requestCode,
    gatewayCode: input.gateway.gatewayCode,
    taskClass: input.taskClass,
    modelProfileCode: input.modelProfile.modelProfileCode,
    contextCode: input.context.contextCode,
    status: "draft",
    dispatched: false,
    modelCalled: false,
  };
}

export function executeLightweightInference(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly request: LightweightInferenceRequest;
}): LightweightInferenceResponse {
  requirePermission(input.permission);

  return { requestCode: input.request.requestCode, status: "blocked_runtime_disabled", responseGenerated: false, businessActionCompleted: false, rawPromptLogged: false };
}

export function createLightweightAIToolRequest(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly toolRequestCode: string;
  readonly requestedToolReference: string;
  readonly freeFormModelTextDrivesExecution?: boolean;
}): LightweightAIToolRequest {
  requirePermission(input.permission);
  requireIdentifier(input.toolRequestCode, "Lightweight AI tool request code");
  requireIdentifier(input.requestedToolReference, "Requested tool reference");
  if (input.freeFormModelTextDrivesExecution) {
    throw new Error("Free-form model text cannot directly execute tools.");
  }

  return { toolRequestCode: input.toolRequestCode, requestedToolReference: input.requestedToolReference, status: "draft", toolExecutionRequested: false, modelTextTrustedForExecution: false };
}

export function requestLightweightGpuEscalation(input: {
  readonly permission: LightweightLocalAiNodePermission;
  readonly requestCode: string;
  readonly sourceRequest: LightweightInferenceRequest;
  readonly expandsDataScope?: boolean;
}): LightweightGpuEscalationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "Lightweight GPU escalation request code");
  if (input.expandsDataScope) {
    throw new Error("GPU escalation cannot broaden context, data or tool permissions.");
  }

  return { requestCode: input.requestCode, sourceRequestCode: input.sourceRequest.requestCode, targetModule: "M095", status: "review_required", escalated: false, dataScopeExpanded: false };
}
