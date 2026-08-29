import { describe, expect, it } from "vitest";
import { DEPLOYMENT_RUNTIME, bindDeploymentConfig, bindDeploymentSecret, createDeploymentSystem, createReleaseCandidate, defineDeploymentEnvironment, evaluateDeploymentReadiness, planDeployment, registerDeploymentArtifact, requestDeployment } from "../../packages/deployments/src/index";

describe("M099 controlled deployments", () => {
  it("models a plan without reaching a target", () => {
    const system = createDeploymentSystem({ permission: "deployment.system.configure", code: "DEPLOYMENT_SYSTEM" });
    const environment = defineDeploymentEnvironment({ permission: "deployment.environment.manage", code: "STAGING_ENV", system, type: "staging", infrastructureReference: "M093_TARGET_STAGING", configScopeReference: "M090_SCOPE_STAGING", secretScopeReference: "M083_SCOPE_STAGING" });
    const artifact = registerDeploymentArtifact({ permission: "deployment.artifact.register", code: "WEB_ARTIFACT", system, type: "container_image", buildReference: "BUILD_001", sourceRevisionReference: "git:abc123def456", checksum: "sha256:0123456789abcdef0123456789abcdef" });
    const config = bindDeploymentConfig({ permission: "deployment.plan.manage", code: "WEB_CONFIG", environment, workloadReference: "WORKLOAD_WEB", configVersionReference: "M090_CONFIG_V1" });
    const secret = bindDeploymentSecret({ permission: "deployment.plan.manage", code: "WEB_SECRET", environment, workloadReference: "WORKLOAD_WEB", secretReference: "M083_SECRET_REF_1" });
    const candidate = createReleaseCandidate({ permission: "deployment.release.create", code: "WEB_CANDIDATE", system, artifacts: [artifact], configBindings: [config], secretBindings: [secret], compatibilityReference: "COMPATIBILITY_WEB_V1" });
    const plan = planDeployment({ permission: "deployment.plan.manage", code: "WEB_PLAN", releaseCandidate: candidate, environment, targetReferences: ["M093_TARGET_STAGING"], strategy: "canary", healthGateReferences: ["M097_HEALTH_GATE_WEB"], rollbackTargetReference: "WEB_PREVIOUS_RELEASE" });
    const request = requestDeployment({ permission: "deployment.rollout.request", code: "WEB_REQUEST", plan });
    expect(DEPLOYMENT_RUNTIME.deploymentExecution).toBe(false);
    expect(request.status).toBe("blocked_runtime_disabled");
    expect(request.targetContacted).toBe(false);
    expect(evaluateDeploymentReadiness({ plan, candidate, environment }).ready).toBe(false);
  });
  it("rejects raw credentials", () => {
    const system = createDeploymentSystem({ permission: "deployment.system.configure", code: "DEPLOYMENT_SYSTEM_2" });
    const environment = defineDeploymentEnvironment({ permission: "deployment.environment.manage", code: "LOCAL_ENV", system, type: "local", infrastructureReference: "M093_TARGET_LOCAL", configScopeReference: "M090_SCOPE_LOCAL", secretScopeReference: "M083_SCOPE_LOCAL" });
    expect(() => bindDeploymentSecret({ permission: "deployment.plan.manage", code: "INVALID_SECRET", environment, workloadReference: "WORKLOAD_API", secretReference: "M083_SECRET_REF_2", rawCredentialMaterial: "api_key=not_allowed" })).toThrow("raw credential material");
  });
});