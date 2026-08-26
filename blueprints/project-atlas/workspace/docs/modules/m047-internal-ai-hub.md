# M047 Internal AI Hub

## Current status

M047 is a controlled internal AI control-plane foundation. It is not a public chatbot,
client AI console, deployed agent fleet, model runtime, tool executor, queue worker, or
provider integration. Product Owner acceptance and all runtime activation remain pending.

## Ownership boundary

M047 owns versioned policy contracts for:

- internal AI workspaces, environments, assets, agent definitions, agent versions,
  manifests, capabilities, surface bindings, risk tiers, ownership, release channels,
  rollout, and rollback;
- model provider metadata, model/prompt/tool versions, selection/routing decisions,
  data-egress policy, budget, and resource limits;
- bindings to M061-M064 skills, knowledge, RAG, and source authority without duplicating
  those stores;
- context provenance, purpose-limited memory policy, datasets, evaluations, red-team
  results, safety findings, and release gates; and
- immutable run/plan/step/handoff/approval/tool-record/incident contracts.

M048 owns supervisor behavior. M041 owns provider abstraction, M072 owns durable job
queues, M083 owns secret management, M094/M095 own runtime nodes, M068 owns commercial
workflow execution, and M076 owns human/compliance authority. M047 never absorbs those
owners or grants them AI authority.

## Safety controls

- Agent, model, prompt, tool, policy, skill, and knowledge references must pin an exact
  version; mutable `latest` references are rejected.
- Published agent versions are immutable. Lifecycle, deployment, and rollout are distinct.
- Public, client, admin, and backend surfaces have separate capability and permission
  gates. The Internal AI Hub has no public or client route.
- Local-first selection may identify a future local provider such as Ollama, but all
  provider calls remain disabled. No local or cloud model call is made.
- Tools require an allowlist, permissions, approvals where configured, idempotency for
  material side effects, and a restrictive network policy. M047 blocks execution.
- Protected/restricted data egress, actual secret values, unrestricted endpoints, and
  private chain-of-thought storage are prohibited.
- Knowledge is scoped by surface, tenant, purpose, classification, and exact collection
  reference. Grounded answers require citations; unsupported answers remain unsupported.
- Sensitive/personal memory cannot be written automatically. Datasets require provenance;
  open blocking safety findings block release progression.
- Handoffs transfer minimized facts and sources, not complete context or private reasoning.

## Runtime posture

All M047 flags are `false`. `DisabledAIHubRuntimeAdapter` blocks run start, tool dispatch,
job dispatch, and agent handoff. No provider, Ollama, Qwen, cloud model, secret, prompt
execution, tool call, network egress, automatic memory, supervisor delegation, job,
workflow, or user-facing AI feature is activated.

Migration `0057_m047_internal_ai_hub_controlled_foundation.sql` is authored only and
starts every M047 table with deny-by-default RLS. It has not been applied.

## Required activation evidence

1. Product Owner approval of the first agents, provider type, model policy, allowed data
   classes, tool policy, and customer/staff disclosure boundaries.
2. M041/M083 provider and secret-management evidence, environment isolation, endpoint
   allowlists, data-egress review, and no-secret-in-prompt evidence.
3. M061-M064 knowledge/source authority integration, citation/freshness evidence,
   M072 queue evidence, M076 approval policy, and M094/M095 placement controls.
4. Approved evaluation, privacy, multilingual, red-team, safety, incident, support,
   monitoring, rollback, and limited-rollout evidence.
5. Authorized migration/RLS policy, backup/restore evidence, independent AI/security
   review, sandbox validation, and Product Owner production activation.

## Product Owner decisions still required

- Whether and when a local Ollama/Qwen node may be connected, and which exact model
  versions/data classes are approved.
- Agent ownership, risk classification, human approvers, tool scope, budget, retention,
  and support responsibility.
- Which internal surfaces may receive an AI Hub UI after authorization.
- Evaluation thresholds, release-gate exceptions, telemetry retention, and deployment
  rollout/rollback policy.
