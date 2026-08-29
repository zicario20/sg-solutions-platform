export const DEPLOYMENTS_MODULE = "M099" as const;

export const DEPLOYMENT_PERMISSIONS = [
  "deployment.system.configure",
  "deployment.environment.manage",
  "deployment.artifact.register",
  "deployment.release.create",
  "deployment.release.approve",
  "deployment.plan.manage",
  "deployment.rollout.request",
  "deployment.rollback.request",
  "deployment.runtime.activate",
] as const;
export type DeploymentPermission = (typeof DEPLOYMENT_PERMISSIONS)[number];

export const DEPLOYMENT_RUNTIME = {
  buildIntegration: false,
  artifactRegistryConnection: false,
  artifactVerification: false,
  targetDiscovery: false,
  releasePromotion: false,
  deploymentExecution: false,
  trafficShifting: false,
  migrationExecution: false,
  healthGateEvaluation: false,
  rollbackExecution: false,
  providerConnections: false,
  telemetry: false,
} as const;

export type DeploymentEnvironmentType = "development" | "test" | "staging" | "production" | "sandbox" | "recovery" | "local";
export type DeploymentArtifactType = "container_image" | "app_bundle" | "static_bundle" | "worker_bundle" | "migration_bundle" | "config_schema_bundle" | "ai_runtime_bundle" | "gpu_runtime_bundle" | "voice_runtime_bundle";
export type DeploymentStrategy = "all_at_once" | "rolling" | "canary" | "blue_green" | "shadow" | "feature_flag_assisted" | "manual_stage";

export interface DeploymentSystem {
  readonly module: typeof DEPLOYMENTS_MODULE;
  readonly code: string;
  readonly status: "draft";
  readonly active: false;
  readonly artifactRegistryConnected: false;
  readonly runtimeEnabled: false;
  readonly businessAuthority: false;
}
export interface DeploymentEnvironment {
  readonly code: string;
  readonly systemCode: string;
  readonly type: DeploymentEnvironmentType;
  readonly infrastructureReference: string;
  readonly configScopeReference: string;
  readonly secretScopeReference: string;
  readonly status: "draft";
  readonly isolated: false;
  readonly reachable: false;
  readonly productionDataAllowed: false;
}
export interface DeploymentArtifact {
  readonly code: string;
  readonly systemCode: string;
  readonly type: DeploymentArtifactType;
  readonly buildReference: string;
  readonly sourceRevisionReference: string;
  readonly checksum: string;
  readonly status: "draft";
  readonly integrityVerified: false;
  readonly releaseEligible: false;
  readonly published: false;
}
export interface DeploymentConfigBinding {
  readonly code: string;
  readonly environmentCode: string;
  readonly workloadReference: string;
  readonly configVersionReference: string;
  readonly status: "draft";
  readonly rawSecretStored: false;
}
export interface DeploymentSecretBinding {
  readonly code: string;
  readonly environmentCode: string;
  readonly workloadReference: string;
  readonly secretReference: string;
  readonly injectionMode: "reference_only";
  readonly status: "draft";
  readonly secretResolved: false;
  readonly rawSecretStored: false;
}
export interface DeploymentMigrationPlan {
  readonly code: string;
  readonly environmentCode: string;
  readonly migrationReferences: readonly string[];
  readonly strategy: "expand_contract" | "roll_forward_only" | "manual_review";
  readonly irreversible: boolean;
  readonly status: "draft";
  readonly executed: false;
}
export interface ReleaseCandidate {
  readonly code: string;
  readonly systemCode: string;
  readonly artifactCodes: readonly string[];
  readonly configBindingCodes: readonly string[];
  readonly secretBindingCodes: readonly string[];
  readonly migrationPlanCodes: readonly string[];
  readonly compatibilityReference: string;
  readonly status: "draft";
  readonly approved: false;
  readonly deployed: false;
  readonly healthy: false;
}
export interface DeploymentPlan {
  readonly code: string;
  readonly releaseCandidateCode: string;
  readonly environmentCode: string;
  readonly targetReferences: readonly string[];
  readonly strategy: DeploymentStrategy;
  readonly healthGateReferences: readonly string[];
  readonly rollbackTargetReference: string;
  readonly status: "draft";
  readonly executionAllowed: false;
  readonly trafficChanged: false;
  readonly migrationsExecuted: false;
}
export interface DeploymentExecutionRequest {
  readonly code: string;
  readonly deploymentPlanCode: string;
  readonly status: "blocked_runtime_disabled";
  readonly targetContacted: false;
  readonly trafficChanged: false;
  readonly migrationExecuted: false;
}
export interface RollbackRequest {
  readonly code: string;
  readonly deploymentPlanCode: string;
  readonly status: "review_required";
  readonly rollbackStarted: false;
  readonly trafficRestored: false;
}
export interface DeploymentReadinessResult {
  readonly deploymentPlanCode: string;
  readonly ready: false;
  readonly status: "not_ready";
  readonly reasons: readonly string[];
}

function permission(value: DeploymentPermission): void {
  if (!DEPLOYMENT_PERMISSIONS.includes(value)) throw new Error("Unsupported deployment permission.");
}
function code(value: string, field: string): void {
  if (!/^[A-Z][A-Z0-9_:-]{2,127}$/u.test(value)) throw new Error(`${field} must be a stable safe identifier.`);
}
function reference(value: string, field: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/@-]{2,255}$/u.test(value)) throw new Error(`${field} must be a safe reference.`);
}
function references(values: readonly string[], field: string, required = false): readonly string[] {
  if (required && values.length === 0) throw new Error(`${field} requires at least one reference.`);
  for (const value of values) reference(value, field);
  return [...new Set(values)];
}
function rejectRawCredential(value: string | undefined, field: string): void {
  if (value !== undefined && /(-----BEGIN|authorization:|bearer\s|password\s*=|api[_-]?key\s*=|token\s*=|sk_(?:live|test)_)/iu.test(value)) {
    throw new Error(`${field} cannot contain raw credential material.`);
  }
}

export function createDeploymentSystem(input: { permission: DeploymentPermission; code: string }): DeploymentSystem {
  permission(input.permission); code(input.code, "Deployment system code");
  return { module: DEPLOYMENTS_MODULE, code: input.code, status: "draft", active: false, artifactRegistryConnected: false, runtimeEnabled: false, businessAuthority: false };
}
export function defineDeploymentEnvironment(input: { permission: DeploymentPermission; code: string; system: DeploymentSystem; type: DeploymentEnvironmentType; infrastructureReference: string; configScopeReference: string; secretScopeReference: string }): DeploymentEnvironment {
  permission(input.permission); code(input.code, "Deployment environment code");
  reference(input.infrastructureReference, "Infrastructure reference"); reference(input.configScopeReference, "Configuration scope reference"); reference(input.secretScopeReference, "Secret scope reference");
  return { code: input.code, systemCode: input.system.code, type: input.type, infrastructureReference: input.infrastructureReference, configScopeReference: input.configScopeReference, secretScopeReference: input.secretScopeReference, status: "draft", isolated: false, reachable: false, productionDataAllowed: false };
}
export function registerDeploymentArtifact(input: { permission: DeploymentPermission; code: string; system: DeploymentSystem; type: DeploymentArtifactType; buildReference: string; sourceRevisionReference: string; checksum: string; rawCredentialMaterial?: string }): DeploymentArtifact {
  permission(input.permission); code(input.code, "Deployment artifact code"); reference(input.buildReference, "Build reference"); reference(input.sourceRevisionReference, "Source revision reference");
  if (!/^(?:sha256:)?[A-Fa-f0-9]{16,128}$/u.test(input.checksum)) throw new Error("Checksum must be SHA-compatible.");
  rejectRawCredential(input.rawCredentialMaterial, "Deployment artifact");
  return { code: input.code, systemCode: input.system.code, type: input.type, buildReference: input.buildReference, sourceRevisionReference: input.sourceRevisionReference, checksum: input.checksum, status: "draft", integrityVerified: false, releaseEligible: false, published: false };
}
export function bindDeploymentConfig(input: { permission: DeploymentPermission; code: string; environment: DeploymentEnvironment; workloadReference: string; configVersionReference: string; rawCredentialMaterial?: string }): DeploymentConfigBinding {
  permission(input.permission); code(input.code, "Deployment config binding code"); reference(input.workloadReference, "Workload reference"); reference(input.configVersionReference, "Config version reference"); rejectRawCredential(input.rawCredentialMaterial, "Deployment config binding");
  return { code: input.code, environmentCode: input.environment.code, workloadReference: input.workloadReference, configVersionReference: input.configVersionReference, status: "draft", rawSecretStored: false };
}
export function bindDeploymentSecret(input: { permission: DeploymentPermission; code: string; environment: DeploymentEnvironment; workloadReference: string; secretReference: string; rawCredentialMaterial?: string }): DeploymentSecretBinding {
  permission(input.permission); code(input.code, "Deployment secret binding code"); reference(input.workloadReference, "Workload reference"); reference(input.secretReference, "Secret reference"); rejectRawCredential(input.rawCredentialMaterial, "Deployment secret binding");
  return { code: input.code, environmentCode: input.environment.code, workloadReference: input.workloadReference, secretReference: input.secretReference, injectionMode: "reference_only", status: "draft", secretResolved: false, rawSecretStored: false };
}
export function createDeploymentMigrationPlan(input: { permission: DeploymentPermission; code: string; environment: DeploymentEnvironment; migrationReferences: readonly string[]; strategy: DeploymentMigrationPlan["strategy"]; irreversible: boolean }): DeploymentMigrationPlan {
  permission(input.permission); code(input.code, "Deployment migration plan code");
  return { code: input.code, environmentCode: input.environment.code, migrationReferences: references(input.migrationReferences, "Migration references", true), strategy: input.strategy, irreversible: input.irreversible, status: "draft", executed: false };
}
export function createReleaseCandidate(input: { permission: DeploymentPermission; code: string; system: DeploymentSystem; artifacts: readonly DeploymentArtifact[]; configBindings: readonly DeploymentConfigBinding[]; secretBindings: readonly DeploymentSecretBinding[]; migrationPlans?: readonly DeploymentMigrationPlan[]; compatibilityReference: string }): ReleaseCandidate {
  permission(input.permission); code(input.code, "Release candidate code"); if (!input.artifacts.length || !input.configBindings.length || !input.secretBindings.length) throw new Error("Release candidates require artifact, configuration and secret bindings."); reference(input.compatibilityReference, "Compatibility reference");
  return { code: input.code, systemCode: input.system.code, artifactCodes: [...new Set(input.artifacts.map((item) => item.code))], configBindingCodes: [...new Set(input.configBindings.map((item) => item.code))], secretBindingCodes: [...new Set(input.secretBindings.map((item) => item.code))], migrationPlanCodes: [...new Set((input.migrationPlans ?? []).map((item) => item.code))], compatibilityReference: input.compatibilityReference, status: "draft", approved: false, deployed: false, healthy: false };
}
export function planDeployment(input: { permission: DeploymentPermission; code: string; releaseCandidate: ReleaseCandidate; environment: DeploymentEnvironment; targetReferences: readonly string[]; strategy: DeploymentStrategy; healthGateReferences: readonly string[]; rollbackTargetReference: string }): DeploymentPlan {
  permission(input.permission); code(input.code, "Deployment plan code"); reference(input.rollbackTargetReference, "Rollback target reference");
  return { code: input.code, releaseCandidateCode: input.releaseCandidate.code, environmentCode: input.environment.code, targetReferences: references(input.targetReferences, "Deployment targets", true), strategy: input.strategy, healthGateReferences: references(input.healthGateReferences, "Health gates", true), rollbackTargetReference: input.rollbackTargetReference, status: "draft", executionAllowed: false, trafficChanged: false, migrationsExecuted: false };
}
export function requestDeployment(input: { permission: DeploymentPermission; code: string; plan: DeploymentPlan }): DeploymentExecutionRequest {
  permission(input.permission); code(input.code, "Deployment request code");
  return { code: input.code, deploymentPlanCode: input.plan.code, status: "blocked_runtime_disabled", targetContacted: false, trafficChanged: false, migrationExecuted: false };
}
export function requestRollback(input: { permission: DeploymentPermission; code: string; plan: DeploymentPlan }): RollbackRequest {
  permission(input.permission); code(input.code, "Rollback request code");
  return { code: input.code, deploymentPlanCode: input.plan.code, status: "review_required", rollbackStarted: false, trafficRestored: false };
}
export function evaluateDeploymentReadiness(input: { plan: DeploymentPlan; candidate: ReleaseCandidate; environment: DeploymentEnvironment }): DeploymentReadinessResult {
  const reasons = ["deployment_runtime_disabled", "release_not_approved", "artifact_integrity_unverified", "environment_unreachable", "health_gates_unevaluated", "recovery_readiness_missing"];
  if (input.plan.releaseCandidateCode !== input.candidate.code) reasons.push("release_candidate_mismatch");
  if (input.plan.environmentCode !== input.environment.code) reasons.push("environment_mismatch");
  return { deploymentPlanCode: input.plan.code, ready: false, status: "not_ready", reasons };
}