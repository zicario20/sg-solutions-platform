import { describe, expect, it } from "vitest";

import {
  createLightweightAINode,
  createLightweightAIToolRequest,
  createLightweightContextPackage,
  createLightweightInferenceGateway,
  createLightweightModelProfile,
  createLocalAIRuntime,
  executeLightweightInference,
  requestLightweightInference,
} from "../../packages/lightweight-local-ai-node/src/index";

describe("M094 lightweight local AI node controlled foundation", () => {
  it("does not call a model or complete a business action", () => {
    const node = createLightweightAINode({ permission: "lightweight_ai.node.create", nodeCode: "light-local-01", homelabNodeReference: "node:light-local-01" });
    const runtime = createLocalAIRuntime({ permission: "lightweight_ai.runtime.create", runtimeCode: "LOCAL_RUNTIME", engineReference: "engine:local-ai" });
    const model = createLightweightModelProfile({ permission: "lightweight_ai.model_profile.create", modelProfileCode: "ROUTER_3B", runtime, capabilityTier: "router", taskClasses: ["service_inquiry"], artifactChecksumReference: "checksum:model-router-3b" });
    const gateway = createLightweightInferenceGateway({ permission: "lightweight_ai.gateway.create", gatewayCode: "LOCAL_GATEWAY", node });
    const context = createLightweightContextPackage({ permission: "lightweight_ai.context.create", contextCode: "SAFE_CONTEXT", contextReferences: ["rag:chunk-1"] });
    const request = requestLightweightInference({ permission: "lightweight_ai.inference.request", requestCode: "INFERENCE_001", gateway, taskClass: "service_inquiry", modelProfile: model, context });
    const response = executeLightweightInference({ permission: "lightweight_ai.inference.request", request });

    expect(response.status).toBe("blocked_runtime_disabled");
    expect(response.responseGenerated).toBe(false);
    expect(response.businessActionCompleted).toBe(false);
  });

  it("rejects unverified artifacts and raw client context", () => {
    const runtime = createLocalAIRuntime({ permission: "lightweight_ai.runtime.create", runtimeCode: "RUNTIME_SAFE", engineReference: "engine:local" });
    expect(() =>
      createLightweightModelProfile({ permission: "lightweight_ai.model_profile.create", modelProfileCode: "UNSAFE_MODEL", runtime, capabilityTier: "faq_rag", taskClasses: ["support"], artifactChecksumReference: "checksum:unsafe", includesUnverifiedArtifact: true }),
    ).toThrow("require verified artifacts");

    expect(() =>
      createLightweightContextPackage({ permission: "lightweight_ai.context.create", contextCode: "UNSAFE_CONTEXT", contextReferences: ["context:1"], includesRawClientData: true }),
    ).toThrow("without raw client data");
  });

  it("does not trust model text to execute a tool", () => {
    expect(() =>
      createLightweightAIToolRequest({ permission: "lightweight_ai.tool_request.create", toolRequestCode: "UNSAFE_TOOL", requestedToolReference: "tool:payment-refund", freeFormModelTextDrivesExecution: true }),
    ).toThrow("cannot directly execute tools");
  });
});
