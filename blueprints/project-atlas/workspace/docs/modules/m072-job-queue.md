# M072 - Job Queue

- Status: controlled foundation implemented; queue provider disabled.
- Operational activation: pending Product Owner approval, queue backend selection, worker isolation, security review, and deployment validation.

## Scope implemented

M072 provides versioned job definitions, payload-reference contracts, job requests, queue and worker profiles, attempts, unknown-outcome records, reconciliation records, and dead-letter records. It preserves at-least-once-safe and idempotency boundaries without connecting to a physical queue.

## Authority boundaries

- M068 owns durable business workflow state and business timers.
- M069, M070, M071, and domain modules own their respective execution and outcome truth.
- Job completion, a lease, a retry, a dead letter, or a worker signal never proves a business outcome.
- Unknown external effects require reconciliation before requeue or a fallback side effect.

## Disabled capabilities

No queue backend, worker, lease, scheduler, retry dispatcher, dead-letter consumer, callback, result delivery, or arbitrary handler execution is active. Payload contracts permit references only and reject raw secrets, binary data, and private reasoning.

## Activation prerequisites

1. Select and secure an approved queue backend with persistent storage, backups, monitoring, and dead-letter recovery.
2. Deploy least-privilege worker pools with explicit allowlists and tenant isolation.
3. Bind versioned typed handlers to owner-module APIs, idempotency, and reconciliation contracts.
4. Validate outbox/inbox, retries, timeouts, cancellation, rate limits, backpressure, recovery, and audit.
5. Obtain independent security review and Product Owner approval before enabling dispatch.
