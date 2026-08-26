# M048 Supervisor Agent Architecture

## Purpose

The Supervisor Agent is a deterministic coordination boundary. It classifies a minimized task envelope,
selects only eligible specialist candidates, prepares non-executable plans, and sends ambiguity, conflict,
failure, no-progress, and policy-sensitive work to an authorized human queue.

## Boundaries

```text
Caller or domain event
  -> Supervisor task envelope
  -> Deterministic classification and eligibility
  -> M047 manifest-bound specialist registry
  -> Routing decision
  -> Prepared orchestration plan
  -> Human review or explicitly authorized future runtime
```

M047 owns AI assets, providers, prompts, tools, model routing, and run controls. M048 does not repeat
those concerns. M048 owns only cross-specialist task classification, candidate selection, plan safety,
handoff boundaries, route loops, fallback, governance, and audit provenance.

## Security and execution posture

- Inputs use references and bounded classifications; they do not carry unrestricted client profiles.
- Ownership, authorization, entitlement, consent, locale, jurisdiction, risk, and sensitivity gates run
  before routing.
- High-risk outcomes and privileged actions fail closed.
- Public and client surfaces are indirect only. No client can select a hidden specialist or submit a
  free-form internal action.
- Plans are `prepared` and `executionPermitted=false`. The disabled runtime cannot dispatch handoffs or
  invoke providers.
- Parallel planning requires explicit approval, low risk, isolated context, and no dependency edge.
- Handoffs reject private reasoning and require minimized facts plus source references.
- Governance changes require a human approval reference; self-modification and self-approval are rejected.
- Every storage table is RLS-protected with a deny-by-default migration policy.

## Operational model after future approval

A future execution release must be a separately authorized change. It will bind M047 agent versions,
M068 workflows, M072 jobs, M074/M075 approvals, notifications, and human queues through adapters. The
durable business state remains in the domain modules, not in a supervisor model or provider.
