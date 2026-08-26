# M048 - Supervisor Agent

## Status

M048 technical control-plane foundation is implemented. Runtime execution, specialist delegation,
provider calls, automatic rerouting, parallel work, and automation are disabled by default. Product
Owner acceptance, provider activation, operational release, and deployment remain pending.

## Scope implemented

- Minimal task envelopes with tenant, ownership, consent, entitlement, locale, and idempotency boundaries.
- Deterministic classification inputs, specialist registry, eligibility gates, candidate exclusions, and
  routing decisions.
- Prepared-only sequential and parallel orchestration plans with dependency-cycle detection, context
  minimization, private-reasoning rejection, conflict holding, and human escalation.
- Disabled runtime adapter, loop/no-progress guard, human fallback, governance change controls, and a
  tamper-evident audit-event chain.
- RLS-protected persistence contracts, migration, tests, documentation, and provider-disabled flags.

## Boundaries

M048 consumes M047 manifest references. It does not duplicate the Internal AI Hub, call a model,
select a provider, dispatch a tool, grant an entitlement, modify pricing, approve an action, send a
filing, submit a return, share data, or expose a public supervisor surface. A routing decision is not
an execution authorization.

## Future activation prerequisites

1. Product Owner approval for a reviewed routing policy, specialist manifest, data scope, human queue,
   budget, SLA, fallback, and rollback plan.
2. M047 model/provider/asset release gate and a separate security review.
3. Authorization, consent, tenant ownership, monitoring, incident response, and recovery evidence.
4. Staging simulation and explicit feature-flag approval. No switch may be enabled merely by deployment.
