/**
 * M047 is a control plane. These records describe AI assets and their
 * authorization boundaries; they never execute a model, tool, or provider call.
 */

export type AgentAccess = "public" | "authenticated_client" | "internal" | "owner";
export type AgentRunStatus =
  | "draft"
  | "blocked"
  | "requires_review"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";
export type AiTool =
  | "get_service_catalog"
  | "check_service_availability"
  | "evaluate_preliminary_eligibility"
  | "create_lead_candidate"
  | "create_intake_link"
  | "get_appointment_options"
  | "get_referral_public_status";

/** Legacy M025 contract retained while consumers migrate to M047 manifests. */
export interface AgentDefinition {
  code: string;
  version: string;
  access: AgentAccess;
  enabled: boolean;
  providerMode: "disabled" | "local_future" | "cloud_future";
  allowedTools: readonly AiTool[];
  requiresHumanReview: boolean;
}

export interface AgentRunRequest {
  agentCode: string;
  actorScope: AgentAccess;
  requestedTool?: string;
  containsSensitiveContent: boolean;
}

export interface AgentRunDecision {
  status: AgentRunStatus;
  reason: string;
}

export type AIHubEnvironment = "development" | "test" | "staging" | "production";
export type AIAssetType =
  | "agent"
  | "model_policy"
  | "prompt"
  | "tool"
  | "skill_binding"
  | "knowledge_binding"
  | "evaluation"
  | "dataset"
  | "runtime_configuration";
export type AgentLifecycleStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "paused"
  | "retired";
export type AgentDeploymentStatus =
  | "not_deployed"
  | "configured"
  | "shadow"
  | "canary"
  | "disabled"
  | "deployed";
export type AgentRiskTier = "low" | "medium" | "high" | "critical";
export type AgentCapabilityType =
  | "answer"
  | "classify"
  | "summarize"
  | "retrieve"
  | "prepare_action"
  | "request_human_review"
  | "suggest_handoff";
export type AgentSurface = "public" | "client" | "admin" | "backend";
export type ExactVersionReference = string;

export type AIHubWorkspace = Readonly<{
  id: string;
  tenantId: string;
  code: string;
  environment: AIHubEnvironment;
  productionDataAccess: boolean;
  status: "active" | "paused" | "archived";
  createdAt: string;
}>;

export type AIAssetDefinition = Readonly<{
  id: string;
  workspaceId: string;
  assetType: AIAssetType;
  code: string;
  ownerReference: string;
  status: "draft" | "approved" | "published" | "retired";
  createdAt: string;
}>;

export type AIHubAgentDefinition = Readonly<{
  id: string;
  workspaceId: string;
  code: string;
  displayName: string;
  agentType:
    | "internal_assistant"
    | "support"
    | "credit"
    | "tax"
    | "business_formation"
    | "business_funding"
    | "home_buying"
    | "supervisor"
    | "future_specialist";
  lifecycleStatus: AgentLifecycleStatus;
  deploymentStatus: AgentDeploymentStatus;
  ownerReference: string;
  riskTier: AgentRiskTier;
  purpose: string;
  scopeBoundary: string;
  createdAt: string;
}>;

export type AgentCapability = Readonly<{
  code: string;
  type: AgentCapabilityType;
  preconditions: readonly string[];
}>;

export type AgentVersion = Readonly<{
  id: string;
  agentDefinitionId: string;
  version: number;
  status: "draft" | "approved" | "published" | "retired";
  capabilities: readonly AgentCapability[];
  createdAt: string;
}>;

export type AgentSurfaceBinding = Readonly<{
  agentVersionId: string;
  surface: AgentSurface;
  capabilityCodes: readonly string[];
  requiredPermissions: readonly string[];
  requiredEntitlements: readonly string[];
  ownershipRequired: boolean;
}>;

export type AgentManifest = Readonly<{
  id: string;
  agentVersionId: string;
  modelPolicyReference: ExactVersionReference;
  promptBundleReference: ExactVersionReference;
  toolPolicyReference: ExactVersionReference;
  skillSetReference: ExactVersionReference;
  knowledgeBindingReference: ExactVersionReference;
  humanApprovalPolicyReference: ExactVersionReference;
  dataHandlingPolicyReference: ExactVersionReference;
  loggingPolicyReference: ExactVersionReference;
  resourceBudgetReference: ExactVersionReference;
  fallbackPolicyReference: ExactVersionReference;
  createdAt: string;
}>;

export type AgentDependencyEdge = Readonly<{
  sourceAgentVersionId: string;
  targetAgentVersionId: string;
}>;

export type AgentRollout = Readonly<{
  agentVersionId: string;
  riskTier: AgentRiskTier;
  channel: "development" | "shadow" | "canary" | "stable";
  rolloutPercentage: number;
  rollbackAgentVersionId: string;
}>;

export type ModelProviderKind = "ollama_local" | "openai_future" | "cloud_future" | "self_hosted";
export type AIModelProviderProfile = Readonly<{
  id: string;
  workspaceId: string;
  code: string;
  providerKind: ModelProviderKind;
  environment: AIHubEnvironment;
  endpointReference: string;
  secretReference: string | null;
  status: "disabled" | "configured" | "approved" | "retired";
  health: "healthy" | "degraded" | "unhealthy" | "unknown";
  createdAt: string;
}>;

export type AIModelDefinition = Readonly<{
  id: string;
  code: string;
  providerProfileId: string;
  lifecycleStatus: "draft" | "approved" | "retired";
  dataClassifications: readonly ("public" | "internal" | "confidential" | "restricted")[];
  createdAt: string;
}>;

export type AIModelVersion = Readonly<{
  id: string;
  modelDefinitionId: string;
  exactModelId: string;
  version: number;
  contextWindow: number;
  maximumOutputTokens: number;
  status: "draft" | "approved" | "retired";
  createdAt: string;
}>;

export type ModelSelectionRequest = Readonly<{
  id: string;
  agentVersionId: string;
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  preferredPlacement: "local" | "cloud" | "hybrid";
  requiredCapabilities: readonly string[];
  createdAt: string;
}>;

export type ModelRoutingDecision = Readonly<{
  status: "blocked" | "eligible_but_disabled";
  reason: "runtime_disabled" | "no_eligible_model" | "data_policy_blocked";
  candidateModelVersionId: string | null;
}>;

export type PromptVersion = Readonly<{
  id: string;
  promptDefinitionId: string;
  version: number;
  templateReference: ExactVersionReference;
  variableNames: readonly string[];
  locale: "es" | "en";
  status: "draft" | "approved" | "published" | "retired";
  createdAt: string;
}>;

export type AIToolSideEffectClass =
  | "read_only"
  | "internal_write"
  | "external_write"
  | "restricted";
export type AIToolDefinition = Readonly<{
  id: string;
  code: string;
  version: number;
  sideEffectClass: AIToolSideEffectClass;
  requiredPermissions: readonly string[];
  requiredApprovals: readonly string[];
  networkPolicy: "none" | "allowlisted" | "sandbox_only";
  idempotencyRequired: boolean;
  status: "draft" | "approved" | "retired";
  createdAt: string;
}>;

export type ToolExecutionDecision = Readonly<{
  status: "blocked" | "requires_review";
  reason: "runtime_disabled" | "permission_missing" | "approval_missing" | "idempotency_required";
}>;

export type ResourceBudget = Readonly<{
  id: string;
  code: string;
  period: "daily" | "monthly" | "per_run";
  amountMinor: number | null;
  currency: "USD";
  costStatus: "known" | "unknown";
  status: "draft" | "approved" | "retired";
}>;

export type KnowledgeBinding = Readonly<{
  id: string;
  agentVersionId: string;
  collectionReference: ExactVersionReference;
  accessScope: "public" | "client" | "internal";
  surface: AgentSurface;
  freshnessPolicyReference: ExactVersionReference;
}>;

export type RetrievalRequest = Readonly<{
  id: string;
  tenantId: string;
  agentVersionId: string;
  purpose: string;
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  jurisdiction: string | null;
  allowedCollectionReferences: readonly ExactVersionReference[];
  createdAt: string;
}>;

export type GroundedAnswer = Readonly<{
  status: "grounded" | "unsupported" | "requires_review";
  content: string;
  citationReferences: readonly string[];
  unsupportedClaims: readonly string[];
}>;

export type ContextSession = Readonly<{
  id: string;
  tenantId: string;
  agentVersionId: string;
  purpose: string;
  sourceReferences: readonly string[];
  contextFields: readonly string[];
  expiresAt: string;
}>;

export type MemoryWrite = Readonly<{
  memoryType: "conversation" | "case" | "service" | "personal";
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  automatic: boolean;
  policyReference: ExactVersionReference;
}>;

export type DatasetVersion = Readonly<{
  id: string;
  datasetDefinitionId: string;
  version: number;
  provenanceReferences: readonly string[];
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  split: "training" | "validation" | "holdout";
  status: "draft" | "approved" | "retired";
}>;

export type AIReleaseGate = Readonly<{
  id: string;
  agentVersionId: string;
  evaluationSuiteReferences: readonly ExactVersionReference[];
  safetyTestReferences: readonly ExactVersionReference[];
  requiredHumanApprovals: readonly string[];
}>;

export type AIReleaseFinding = Readonly<{
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  blocking: boolean;
  status: "open" | "resolved" | "accepted_risk";
}>;

export type AIReleaseGateDecision = Readonly<{
  status: "blocked" | "requires_human_approval";
  blockingFindingIds: readonly string[];
}>;

export type AIAgentRun = Readonly<{
  id: string;
  tenantId: string;
  agentVersionId: string;
  invocationType: "interactive" | "background_job" | "shadow" | "evaluation";
  invocationAuthorizationReference: ExactVersionReference;
  inputSnapshotReference: ExactVersionReference;
  contextSnapshotReference: ExactVersionReference;
  status:
    | "draft"
    | "queued"
    | "running"
    | "waiting_approval"
    | "blocked"
    | "completed"
    | "failed"
    | "cancelled";
  createdAt: string;
}>;

export type ExecutionPlan = Readonly<{
  id: string;
  runId: string;
  allowedToolCodes: readonly string[];
  requestedToolCodes: readonly string[];
  actionScopeHash: string;
}>;

export type AgentRunStep = Readonly<{
  id: string;
  runId: string;
  ordinal: number;
  stepType:
    | "reasoning_boundary"
    | "retrieval"
    | "tool_request"
    | "handoff"
    | "approval"
    | "response";
  status: "queued" | "running" | "waiting" | "completed" | "failed" | "cancelled";
  version: number;
}>;

export type AgentHandoffRequest = Readonly<{
  id: string;
  sourceRunId: string;
  targetAgentVersionId: string;
  purpose: string;
  factReferences: readonly string[];
  sourceReferences: readonly string[];
  status: "requested" | "approved" | "blocked" | "completed" | "cancelled";
}>;

export type HumanApprovalRequest = Readonly<{
  id: string;
  runId: string;
  actionType: string;
  parameterHash: string;
  requiredApproverRoles: readonly string[];
  expiresAt: string;
  status: "pending" | "approved" | "rejected" | "expired" | "invalidated";
}>;

export type AIHubRuntimeControls = Readonly<{
  aiHubEnabled: false;
  modelProviderCallsEnabled: false;
  toolExecutionEnabled: false;
  jobDispatchEnabled: false;
  externalEgressEnabled: false;
  automaticMemoryWritesEnabled: false;
  supervisorDelegationEnabled: false;
}>;

export type AIHubRuntimeHandoff = Readonly<{
  status: "blocked";
  reason: "activation_not_authorized";
}>;

export class AgentGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentGraphError";
  }
}
