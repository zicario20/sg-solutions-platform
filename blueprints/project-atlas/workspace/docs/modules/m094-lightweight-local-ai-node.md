# M094 - Lightweight Local AI Node

## Status

Controlled foundation implemented. No local AI runtime, model artifact, Ollama-compatible service, endpoint, inference, RAG retrieval, tool execution, escalation, cloud fallback, memory or telemetry is active. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/lightweight-local-ai-node` defines node, runtime, model-profile, gateway, minimized-context, inference, tool-request and GPU-escalation contracts.
- Models are described by pinned artifact-checksum references and explicit task classes; availability never grants reliability, tool authority or business authority.
- Context packages require safe references and reject raw client data and private chain-of-thought.
- Inference returns `blocked_runtime_disabled`; no model call, endpoint exposure, response generation or business action occurs.
- Tool requests are structured metadata only. Free-form model text cannot execute any tool.
- A GPU escalation is `review_required`, remains inactive and cannot broaden data or tool scope.

## Boundaries

- M093 owns the host/network/storage/power substrate; M095 owns heavy GPU workloads; M47-M61 own agents/skills; M63 owns retrieval; M081 and M083 retain authorization and secrets.
- The module does not become CRM memory, a supervisor, an approval system or a provider integration.

## Persistence preparation

`packages/database/src/schema/lightweight-local-ai-node.ts` prepares non-secret metadata for node, runtime, profiles, gateways, minimized context references and blocked requests. It stores no prompts, completions, model bytes, RAG content or client payloads.

## Future activation prerequisites

1. Product Owner approves the runtime/model/provider choice and task classes.
2. Artifact verification, model certification, resource limits, privacy, tool allowlists and rollback evidence are reviewed.
3. M093 host readiness and M081/M082/M083/M084/M097/M099 controls are connected and validated.

## Test coverage added

`tests/m094/lightweight-local-ai-node.test.ts` captures inactive inference, context minimization, verified-model requirements and the tool-execution boundary. The test file was added but not executed in this change.
