import { describe, expect, it } from "vitest";

import {
  createGPUDevice,
  createGPUModelProfile,
  createGPUNode,
  createGPURuntime,
  evaluateGPUNodeReadiness,
  executeGPUInference,
  requestGPUInference,
  requestGPUModelLoad,
} from "../../packages/gpu-node/src/index";

describe("M095 GPU node controlled foundation", () => {
  it("models the RTX 3090 Ti reference without treating the node as ready", () => {
    const node = createGPUNode({ permission: "gpu_node.node.create", nodeCode: "gpu-heavy-01", homelabNodeReference: "node:gpu-heavy-01" });
    const device = createGPUDevice({ permission: "gpu_node.device.create", deviceCode: "GPU_REFERENCE", node, modelReference: "RTX_3090_TI_REFERENCE", vramClass: "24gb_class" });
    const readiness = evaluateGPUNodeReadiness({ permission: "gpu_node.readiness.evaluate", node });

    expect(device.vramClass).toBe("24gb_class");
    expect(device.driverCompatible).toBe(false);
    expect(readiness.ready).toBe(false);
    expect(readiness.workloadEnabled).toBe(false);
  });

  it("does not load a model or execute GPU inference", () => {
    const node = createGPUNode({ permission: "gpu_node.node.create", nodeCode: "gpu-heavy-02", homelabNodeReference: "node:gpu-heavy-02" });
    const runtime = createGPURuntime({ permission: "gpu_node.runtime.create", runtimeCode: "GPU_RUNTIME", node, engineReference: "engine:gpu" });
    const model = createGPUModelProfile({ permission: "gpu_node.model_profile.create", modelProfileCode: "VISION_7B", runtime, workloadClasses: ["multimodal_documents"], artifactChecksumReference: "checksum:vision-7b" });
    const request = requestGPUInference({ permission: "gpu_node.inference.request", requestCode: "GPU_INFERENCE_001", node, workloadClass: "multimodal_documents", modelProfile: model, contextReferences: ["document:projection-1"] });
    const response = executeGPUInference({ permission: "gpu_node.inference.request", request });
    const load = requestGPUModelLoad({ permission: "gpu_node.model_load.request", requestCode: "GPU_LOAD_001", node, modelProfile: model });

    expect(response.status).toBe("blocked_runtime_disabled");
    expect(response.responseGenerated).toBe(false);
    expect(load.loaded).toBe(false);
    expect(load.gpuMemoryAllocated).toBe(false);
  });

  it("rejects raw client data from GPU context", () => {
    const node = createGPUNode({ permission: "gpu_node.node.create", nodeCode: "gpu-heavy-03", homelabNodeReference: "node:gpu-heavy-03" });
    const runtime = createGPURuntime({ permission: "gpu_node.runtime.create", runtimeCode: "GPU_RUNTIME_SAFE", node, engineReference: "engine:gpu" });
    const model = createGPUModelProfile({ permission: "gpu_node.model_profile.create", modelProfileCode: "SAFE_MODEL", runtime, workloadClasses: ["heavy_reasoning"], artifactChecksumReference: "checksum:safe" });

    expect(() =>
      requestGPUInference({ permission: "gpu_node.inference.request", requestCode: "UNSAFE_GPU_CONTEXT", node, workloadClass: "heavy_reasoning", modelProfile: model, contextReferences: ["context:1"], includesRawClientData: true }),
    ).toThrow("without raw client data");
  });
});
