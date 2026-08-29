# M095 - GPU Node (RTX 3090 Ti)

## Status

Controlled foundation implemented. No NVIDIA driver, CUDA toolkit, GPU discovery, model artifact, memory allocation, scheduler, endpoint, inference, tool execution or fallback is active. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/gpu-node` defines GPU-node, device, runtime, model-profile, resource-budget, readiness, inference, tool-request and model-load contracts.
- The RTX 3090 Ti appears only as the `RTX_3090_TI_REFERENCE` with a `24gb_class` VRAM profile. This is not a detection claim, installed driver claim or readiness certification.
- GPU readiness requires future driver, CUDA, artifact, memory, thermal, power and workload checks; host availability or visible VRAM alone is insufficient.
- Model profiles require verified artifact references and explicit workload classes. No model is certified or loaded.
- GPU inference and model-load requests return `blocked_runtime_disabled`; neither produces business truth nor performs an external action.
- Free-form GPU model output cannot execute tools, expand scopes or bypass approval/human gates.

## Boundaries

- M093 owns physical host, network, storage, power and cooling. M094 owns lightweight inference. M47-M61 own agent semantics, M081/M082/M083 own security, M097 observability and M099 deployments.
- The module stores no raw prompts, sensitive documents, secret values, driver installation commands, model binaries or GPU telemetry.

## Persistence preparation

`packages/database/src/schema/gpu-node.ts` prepares lifecycle metadata for GPU nodes, safe device references, runtimes, model profiles, budgets, requests and blocked loads. It contains no GPU memory state, model cache or credential.

## Future activation prerequisites

1. Product Owner approves the hardware setup, power/cooling controls and GPU workload scope.
2. Driver/CUDA/runtime compatibility, artifacts, VRAM budget, security controls, benchmarks, certification and rollback are validated.
3. M093 readiness and M081/M082/M083/M084/M097/M099 integrations are tested before serving workload traffic.

## Test coverage added

`tests/m095/gpu-node.test.ts` captures the RTX reference boundary, no-ready-by-default behavior, raw-context rejection and blocked model/inference execution. The test file was added but not executed in this change.
