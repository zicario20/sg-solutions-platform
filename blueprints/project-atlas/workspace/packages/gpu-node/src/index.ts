export const GPU_NODE_MODULE = "M095" as const;

export const GPU_NODE_PERMISSIONS = [
  "gpu_node.node.create",
  "gpu_node.device.create",
  "gpu_node.runtime.create",
  "gpu_node.model_profile.create",
  "gpu_node.resource_budget.create",
  "gpu_node.readiness.evaluate",
  "gpu_node.inference.request",
  "gpu_node.tool_request.create",
  "gpu_node.model_load.request",
] as const;

export type GpuNodePermission = (typeof GPU_NODE_PERMISSIONS)[number];

export const GPU_NODE_RUNTIME = {
  driverInstallation: false,
  cudaInstallation: false,
  gpuDiscovery: false,
  modelArtifactDownload: false,
  modelLoad: false,
  inferenceGateway: false,
  inferenceExecution: false,
  scheduler: false,
  toolExecution: false,
  gpuEscalation: false,
  cloudFallback: false,
  telemetry: false,
} as const;

export type GpuWorkloadClass = "heavy_reasoning" | "multimodal_documents" | "vision_extraction" | "embeddings" | "reranking" | "image_generation" | "video_generation" | "audio_generation" | "model_evaluation" | "experimental_fine_tuning";
export type GpuVramClass = "24gb_class" | "other";

export interface GPUNode {
  readonly module: typeof GPU_NODE_MODULE;
  readonly nodeCode: string;
  readonly homelabNodeReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly ready: false;
  readonly schedulerConnected: false;
}

export interface GPUDevice {
  readonly deviceCode: string;
  readonly nodeCode: string;
  readonly modelReference: "RTX_3090_TI_REFERENCE" | "OTHER_REFERENCE";
  readonly vramClass: GpuVramClass;
  readonly status: "draft";
  readonly active: false;
  readonly driverCompatible: false;
  readonly rawSerialStored: false;
}

export interface GPURuntime {
  readonly runtimeCode: string;
  readonly nodeCode: string;
  readonly engineReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly driverVerified: false;
  readonly cudaVerified: false;
  readonly endpointExposed: false;
}

export interface GPUModelProfile {
  readonly modelProfileCode: string;
  readonly runtimeCode: string;
  readonly workloadClasses: readonly GpuWorkloadClass[];
  readonly artifactChecksumReference: string;
  readonly status: "draft";
  readonly active: false;
  readonly workloadCertified: false;
  readonly toolAuthorityGranted: false;
}

export interface GPUResourceBudget {
  readonly budgetCode: string;
  readonly nodeCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly thermalLimitsVerified: false;
  readonly powerLimitsVerified: false;
  readonly vramReserveVerified: false;
}

export interface GPUNodeReadinessResult {
  readonly nodeCode: string;
  readonly status: "review_required";
  readonly ready: false;
  readonly gpuVisible: false;
  readonly driverVerified: false;
  readonly modelChecksumVerified: false;
  readonly memoryBudgetVerified: false;
  readonly workloadEnabled: false;
}

export interface GPUInferenceRequest {
  readonly requestCode: string;
  readonly nodeCode: string;
  readonly workloadClass: GpuWorkloadClass;
  readonly modelProfileCode: string;
  readonly contextReferences: readonly string[];
  readonly status: "draft";
  readonly dispatched: false;
  readonly modelCalled: false;
}

export interface GPUInferenceResponse {
  readonly requestCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly responseGenerated: false;
  readonly businessActionCompleted: false;
  readonly rawPromptLogged: false;
}

export interface GPUAIToolRequest {
  readonly toolRequestCode: string;
  readonly requestedToolReference: string;
  readonly status: "draft";
  readonly toolExecuted: false;
  readonly modelTextTrustedForExecution: false;
}

export interface GPUModelLoadRequest {
  readonly requestCode: string;
  readonly nodeCode: string;
  readonly modelProfileCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly loaded: false;
  readonly driverInstalled: false;
  readonly gpuMemoryAllocated: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: GpuNodePermission): void {
  if (!GPU_NODE_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported GPU-node permission: ${permission}.`);
  }
}

export function createGPUNode(input: {
  readonly permission: GpuNodePermission;
  readonly nodeCode: string;
  readonly homelabNodeReference: string;
}): GPUNode {
  requirePermission(input.permission);
  requireIdentifier(input.nodeCode, "GPU node code");
  requireIdentifier(input.homelabNodeReference, "GPU homelab node reference");

  return { module: GPU_NODE_MODULE, nodeCode: input.nodeCode, homelabNodeReference: input.homelabNodeReference, status: "draft", active: false, ready: false, schedulerConnected: false };
}

export function createGPUDevice(input: {
  readonly permission: GpuNodePermission;
  readonly deviceCode: string;
  readonly node: GPUNode;
  readonly modelReference: "RTX_3090_TI_REFERENCE" | "OTHER_REFERENCE";
  readonly vramClass: GpuVramClass;
  readonly includesRawSerial?: boolean;
}): GPUDevice {
  requirePermission(input.permission);
  requireIdentifier(input.deviceCode, "GPU device code");
  if (input.includesRawSerial) {
    throw new Error("GPU device profiles store safe inventory references, not raw serial numbers.");
  }

  return { deviceCode: input.deviceCode, nodeCode: input.node.nodeCode, modelReference: input.modelReference, vramClass: input.vramClass, status: "draft", active: false, driverCompatible: false, rawSerialStored: false };
}

export function createGPURuntime(input: {
  readonly permission: GpuNodePermission;
  readonly runtimeCode: string;
  readonly node: GPUNode;
  readonly engineReference: string;
  readonly includesRawSecret?: boolean;
}): GPURuntime {
  requirePermission(input.permission);
  requireIdentifier(input.runtimeCode, "GPU runtime code");
  requireIdentifier(input.engineReference, "GPU runtime engine reference");
  if (input.includesRawSecret) {
    throw new Error("GPU runtimes cannot store raw secrets or provider credentials.");
  }

  return { runtimeCode: input.runtimeCode, nodeCode: input.node.nodeCode, engineReference: input.engineReference, status: "draft", active: false, driverVerified: false, cudaVerified: false, endpointExposed: false };
}

export function createGPUModelProfile(input: {
  readonly permission: GpuNodePermission;
  readonly modelProfileCode: string;
  readonly runtime: GPURuntime;
  readonly workloadClasses: readonly GpuWorkloadClass[];
  readonly artifactChecksumReference: string;
  readonly includesUnverifiedArtifact?: boolean;
}): GPUModelProfile {
  requirePermission(input.permission);
  requireIdentifier(input.modelProfileCode, "GPU model profile code");
  requireIdentifier(input.artifactChecksumReference, "GPU model artifact checksum reference");
  if (input.workloadClasses.length === 0 || input.includesUnverifiedArtifact) {
    throw new Error("GPU model profiles require verified artifacts and explicit workload classes.");
  }

  return {
    modelProfileCode: input.modelProfileCode,
    runtimeCode: input.runtime.runtimeCode,
    workloadClasses: input.workloadClasses,
    artifactChecksumReference: input.artifactChecksumReference,
    status: "draft",
    active: false,
    workloadCertified: false,
    toolAuthorityGranted: false,
  };
}

export function createGPUResourceBudget(input: {
  readonly permission: GpuNodePermission;
  readonly budgetCode: string;
  readonly node: GPUNode;
}): GPUResourceBudget {
  requirePermission(input.permission);
  requireIdentifier(input.budgetCode, "GPU resource budget code");

  return { budgetCode: input.budgetCode, nodeCode: input.node.nodeCode, status: "draft", active: false, thermalLimitsVerified: false, powerLimitsVerified: false, vramReserveVerified: false };
}

export function evaluateGPUNodeReadiness(input: {
  readonly permission: GpuNodePermission;
  readonly node: GPUNode;
}): GPUNodeReadinessResult {
  requirePermission(input.permission);

  return {
    nodeCode: input.node.nodeCode,
    status: "review_required",
    ready: false,
    gpuVisible: false,
    driverVerified: false,
    modelChecksumVerified: false,
    memoryBudgetVerified: false,
    workloadEnabled: false,
  };
}

export function requestGPUInference(input: {
  readonly permission: GpuNodePermission;
  readonly requestCode: string;
  readonly node: GPUNode;
  readonly workloadClass: GpuWorkloadClass;
  readonly modelProfile: GPUModelProfile;
  readonly contextReferences: readonly string[];
  readonly includesRawClientData?: boolean;
}): GPUInferenceRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "GPU inference request code");
  if (input.contextReferences.length === 0 || input.includesRawClientData) {
    throw new Error("GPU inference requests require minimized safe context references without raw client data.");
  }

  return { requestCode: input.requestCode, nodeCode: input.node.nodeCode, workloadClass: input.workloadClass, modelProfileCode: input.modelProfile.modelProfileCode, contextReferences: input.contextReferences, status: "draft", dispatched: false, modelCalled: false };
}

export function executeGPUInference(input: {
  readonly permission: GpuNodePermission;
  readonly request: GPUInferenceRequest;
}): GPUInferenceResponse {
  requirePermission(input.permission);

  return { requestCode: input.request.requestCode, status: "blocked_runtime_disabled", responseGenerated: false, businessActionCompleted: false, rawPromptLogged: false };
}

export function createGPUAIToolRequest(input: {
  readonly permission: GpuNodePermission;
  readonly toolRequestCode: string;
  readonly requestedToolReference: string;
  readonly freeFormModelTextDrivesExecution?: boolean;
}): GPUAIToolRequest {
  requirePermission(input.permission);
  requireIdentifier(input.toolRequestCode, "GPU AI tool request code");
  requireIdentifier(input.requestedToolReference, "GPU requested tool reference");
  if (input.freeFormModelTextDrivesExecution) {
    throw new Error("Free-form GPU model text cannot directly execute tools.");
  }

  return { toolRequestCode: input.toolRequestCode, requestedToolReference: input.requestedToolReference, status: "draft", toolExecuted: false, modelTextTrustedForExecution: false };
}

export function requestGPUModelLoad(input: {
  readonly permission: GpuNodePermission;
  readonly requestCode: string;
  readonly node: GPUNode;
  readonly modelProfile: GPUModelProfile;
}): GPUModelLoadRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestCode, "GPU model load request code");

  return { requestCode: input.requestCode, nodeCode: input.node.nodeCode, modelProfileCode: input.modelProfile.modelProfileCode, status: "blocked_runtime_disabled", loaded: false, driverInstalled: false, gpuMemoryAllocated: false };
}
