# M068 - Workflow Engine

## Status

Controlled, runtime-disabled foundation implemented. Product Owner acceptance and operational
activation remain pending.

## Implemented foundation

- Stable workflow-definition and immutable-version contracts.
- Typed start, wait, signal, side-effect-plan, and outbox contracts.
- Idempotency keys, tenant/correlation checks, and blocking of unverified or ambiguous signals.
- Separation between workflow orchestration and domain, approval, job, n8n, agent, and provider truth.
- Database contracts and regression tests for disabled starts, signals, and outbox publication.

## Boundaries and activation

M68 is the future durable workflow-state owner, not a CRM, job queue, n8n wrapper, approval system,
task system, or domain-state replacement. No workflows start, scheduler runs, timers fire, signals
advance, outbox publishes, n8n executes, jobs dispatch, or side effects occur. Activation requires
durable migrations, transactional outbox/inbox, M72/M74/M75 integration, locks, reconciliation,
audit/observability, security review, staging evidence, rollback, and Product Owner authorization.
