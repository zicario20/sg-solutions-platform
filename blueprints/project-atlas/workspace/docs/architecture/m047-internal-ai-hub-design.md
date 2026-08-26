# M047 Internal AI Hub Architecture

## Canonical control path

`M047 workspace -> versioned agent manifest -> exact model/prompt/tool/knowledge policy
references -> M047 release gate -> disabled runtime contract -> future M048/M072/M094/M095
handoff`

M047 is a control plane. It records what a future run would be allowed to use, not a
mechanism to execute it. A model never selects an endpoint, tool, permission, approval,
or data scope for itself.

## Boundary model

- M041: provider interface/adapter authority.
- M047: AI policy, compatibility, evidence, and safe contract ownership.
- M048: supervisor strategy and delegation decisions constrained by M047 manifests.
- M061-M064: skill, knowledge, retrieval, ingestion, and source-authority ownership.
- M072: durable jobs and dead-letter handling.
- M076: human/compliance approval authority.
- M083: secret lifecycle and references.
- M094/M095: local/GPU/cloud node placement and capacity.

## Data minimization

The schema stores references, hashes, statuses, policy configuration, and audit evidence.
It does not store provider credentials, raw documents, private reasoning, or customer
payloads. Context sessions hold approved source references and fields only. Future
runtime input/output persistence must remain owned by the appropriate document, message,
case, or observability module.

## Model and tool control

Model routing is local-first when policy asks for local placement, but it returns an
eligible candidate marked `runtime_disabled`. A local Ollama profile is metadata only.
Cloud models require their own future approved provider profile and egress policy.
Prompts, manifests, and knowledge bindings require exact versions. Tools require explicit
permissions, approvals, idempotency for side effects, and a restrictive network policy;
the current adapter blocks every call.

## Release and runtime

No agent version moves to an enabled runtime from an artifact alone. Release gates require
evaluation/safety references and human approvals; active blocking findings stop the gate.
Run plans, steps, handoffs, and approvals use immutable or optimistic-concurrency shaped
contracts. A handoff carries facts/sources, not an inherited permission set or full context.
