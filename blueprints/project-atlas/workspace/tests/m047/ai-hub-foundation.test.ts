import {
  AgentGraphError,
  assertAgentVersionImmutable,
  createAgentDefinition,
  createAgentDependencyGraph,
  createAgentManifest,
  createAgentVersion,
  createAIHubWorkspace,
  resolveAgentRollout,
  validateAgentSurfaceBinding,
} from "@atlas/ai-control-plane";
import { describe, expect, it } from "vitest";

describe("M047 Internal AI Hub foundation", () => {
  const workspace = createAIHubWorkspace({
    id: "workspace-047",
    tenantId: "tenant-047",
    code: "INTERNAL_AI_HUB",
    environment: "test",
    productionDataAccess: false,
    status: "active",
    createdAt: "2026-08-26T12:00:00.000Z",
  });

  const definition = createAgentDefinition({
    id: "agent-definition-047",
    workspaceId: workspace.id,
    code: "INTERNAL_SUMMARY",
    displayName: "Internal summary agent",
    agentType: "internal_assistant",
    lifecycleStatus: "draft",
    deploymentStatus: "not_deployed",
    ownerReference: "team:operations",
    riskTier: "medium",
    purpose: "Prepare an internal factual summary for human review.",
    scopeBoundary: "No external action, payment, entitlement, or workflow authority.",
    createdAt: "2026-08-26T12:00:00.000Z",
  });

  const version = createAgentVersion({
    id: "agent-version-047",
    agentDefinitionId: definition.id,
    version: 1,
    status: "approved",
    capabilities: [
      {
        code: "SUMMARIZE_CASE_FACTS",
        type: "answer",
        preconditions: ["authorized_context", "human_review"],
      },
    ],
    createdAt: "2026-08-26T12:00:00.000Z",
  });

  it("isolates environments and preserves immutable published agent versions", () => {
    expect(workspace.productionDataAccess).toBe(false);
    expect(() =>
      createAIHubWorkspace({
        ...workspace,
        id: "invalid-test-workspace",
        productionDataAccess: true,
      }),
    ).toThrow("production data");

    const published = { ...version, status: "published" as const };
    expect(() =>
      assertAgentVersionImmutable(published, { ...published, capabilities: [] }),
    ).toThrow("immutable");
  });

  it("keeps agent manifests exact, internal, and cycle-free", () => {
    expect(() =>
      createAgentManifest({
        id: "manifest-invalid",
        agentVersionId: version.id,
        modelPolicyReference: "latest",
        promptBundleReference: "prompt-bundle@1",
        toolPolicyReference: "tool-policy@1",
        skillSetReference: "skills@1",
        knowledgeBindingReference: "knowledge@1",
        humanApprovalPolicyReference: "approval@1",
        dataHandlingPolicyReference: "data@1",
        loggingPolicyReference: "logging@1",
        resourceBudgetReference: "budget@1",
        fallbackPolicyReference: "fallback@1",
        createdAt: "2026-08-26T12:00:00.000Z",
      }),
    ).toThrow("exact version");

    const manifest = createAgentManifest({
      id: "manifest-047",
      agentVersionId: version.id,
      modelPolicyReference: "model-policy@1",
      promptBundleReference: "prompt-bundle@1",
      toolPolicyReference: "tool-policy@1",
      skillSetReference: "skills@1",
      knowledgeBindingReference: "knowledge@1",
      humanApprovalPolicyReference: "approval@1",
      dataHandlingPolicyReference: "data@1",
      loggingPolicyReference: "logging@1",
      resourceBudgetReference: "budget@1",
      fallbackPolicyReference: "fallback@1",
      createdAt: "2026-08-26T12:00:00.000Z",
    });
    expect(manifest.modelPolicyReference).toBe("model-policy@1");

    expect(() =>
      createAgentDependencyGraph([
        { sourceAgentVersionId: "a", targetAgentVersionId: "b" },
        { sourceAgentVersionId: "b", targetAgentVersionId: "a" },
      ]),
    ).toThrow(AgentGraphError);
  });

  it("separates surfaces and blocks random rollout for high-risk agents", () => {
    expect(() =>
      validateAgentSurfaceBinding({
        agentVersionId: version.id,
        surface: "public",
        capabilityCodes: ["SUMMARIZE_CASE_FACTS"],
        requiredPermissions: [],
        requiredEntitlements: [],
        ownershipRequired: false,
      }),
    ).toThrow("public surface");

    expect(() =>
      resolveAgentRollout({
        agentVersionId: version.id,
        riskTier: "high",
        channel: "stable",
        rolloutPercentage: 10,
        rollbackAgentVersionId: "agent-version-prior",
      }),
    ).toThrow("high-risk");
  });
});
