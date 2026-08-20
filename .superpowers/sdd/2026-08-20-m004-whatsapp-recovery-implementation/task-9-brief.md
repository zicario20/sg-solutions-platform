# Task 9 Brief: Recovery Jobs

## Status and boundaries
- Task 8 code scope is independently approved at `e16204c1c8af5b0596c6268637f683171b1cc506`.
- Live disposable PostgreSQL and external migration-ledger attestation remain environment blockers; do not require or bypass them here.
- Provider remains disabled. No deploy, push, merge, credential use, external network, Meta activation, marketing scheduler, or production behavior.
- Implement only Task 9. Do not begin Tasks 10-12.

## Files in scope
- Create `packages/domain/src/communications/jobs.ts`.
- Create `apps/app/src/lib/whatsapp/jobs.ts`.
- Add/update focused tests: `tests/domain/whatsapp-inbound-processing.test.ts`, `tests/domain/whatsapp-dispatch.test.ts`, `tests/domain/whatsapp-reconciliation.test.ts`.
- Make only minimal package export/config changes strictly required for these files.

## Required operations
- `processInboundChannelEvent`
- `dispatchOutboundMessage`
- `reconcileUnknownDispatch`
- `reconcileMessageTemplate`
- `expireChannelRecoveryState`

## Functional contract
- Jobs are deterministic orchestration over the approved communications kernel/repository/adapter; preserve idempotency, leases, bounded retries, explicit reconciliation and manual recovery.
- Inbound processing evaluates opt-out before any public orientation.
- Preserve M002 source provenance.
- Protected or sensitive intents return a portal-safe response or handoff; never expose protected data in channel.
- Use owning-domain receipts for appointments, leads, payments, documents and human handoffs. Do not invent ownership in communications.
- Intake remains disabled and media must not be fetched.
- Dispatch rechecks policy under lock, records the attempt before adapter invocation, applies a bounded adapter timeout, and durably records the result.
- `dispatch_unknown` is manual-recovery-only: never auto-resend.
- Template reconciliation is monotonic and stale events cannot regress state.
- Wrong-person signals suspend automation safely.
- Recovery expiry is explicit, bounded and idempotent.
- No marketing scheduler, bulk-send workflow, provider activation, credentials, external network or production job registration.

## Test discipline
- Use TDD with focused tests only.
- Run only the three focused Task 9 test files and affected domain/app typechecks.
- Do not run the repository-wide suite, all workspace typechecks, build, audit or repeated diff checks.
- Commit implementation once and provide focused evidence plus known limitations.
