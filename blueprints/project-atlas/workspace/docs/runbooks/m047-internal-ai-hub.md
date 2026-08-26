# M047 Internal AI Hub Runbook

## Current operating mode

M047 is provider-disabled, internal-only, and deny-by-default. Do not enable an M047
flag, apply migration 0057, connect Ollama/Qwen or a cloud provider, store a secret,
execute a prompt/tool/run, dispatch a job, persist automatic memory, expose a Hub UI, or
delegate to M048 without a separately approved activation change.

## Safe responses

| Condition | Required response |
| --- | --- |
| Mutable or missing manifest reference | Reject the manifest; require an exact version. |
| Public/client request for internal asset | Deny; do not reveal the asset or its policy. |
| Restricted data, secret, document bytes, or private reasoning in context | Remove/deny the request and preserve a safe audit reference. |
| Provider/model endpoint is unavailable or unapproved | Return runtime-disabled or manual handoff; never silently route to another provider. |
| Tool requests a sensitive or material action | Block pending the owning module's authorization and human approval. |
| Knowledge lacks an authorized fresh source | Return unsupported or review-required; do not invent an answer. |
| Safety finding remains open | Block the release gate and preserve the finding. |
| Handoff requires broad context or inherited permissions | Reject; send only approved facts/sources through a new scoped contract. |

## Pre-activation checklist

1. Product Owner approves the intended agent, model/provider, data classification, tool,
   human approval, budget, release, and rollback policy.
2. M041/M083/M061-M064/M072/M076/M094/M095 integration owners approve their contracts.
3. Model/model-policy, prompts, tools, knowledge bindings, citations, retention, and
   data-egress rules are versioned, evaluated, and independently reviewed.
4. Sandbox evidence covers prompt injection, cross-tenant access, tool abuse, approval
   binding, fallback/degraded mode, quota, red-team, Spanish/English, and rollback.
5. Database migration backup/restore, RLS, monitoring, incident/support, kill switch, and
   limited rollout procedures are approved.

## Rollback posture

Before activation, every M047 flag remains `false`. If a future enabled path becomes
unsafe, disable the provider/tool/job/handoff flag, stop new runs, preserve run/audit/
evaluation evidence, and transfer control to the owning human or module. Do not rewrite
agent versions, release evidence, approvals, or related service records to conceal an
incident.
