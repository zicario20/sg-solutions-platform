# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md`nSpec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md
# Task 4 brief: Canonical communications repository and application behavior

## Files
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts`
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts`
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
- Modify communications index.
- Create `blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts`
- Create `blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts`

## Required repository interface
Accept/claim/complete inbound; create/claim/complete outbound; apply provider status; grant consent from receipt; withdraw contact; resolve ambiguous opt-out from receipt; suspend/revalidate binding; reconcile templates; find recovery work.

## Atomic behavior
- Deduplicate inbound by connection and provider identity/body digest; mismatched replay fails closed.
- Persist one replayable canonical envelope before ACK and establish opt_out_pending atomically.
- Durable outbound command and attempt precede I/O; withdrawal/dispatch serialize on one binding.
- Lease ownership/version gates completion; ambiguous dispatch is non-retryable pending reconciliation.
- Provider statuses are monotonic and exactly-once.
- Consent history is receipt-gated; stale/reassigned bindings suspend and clear only by authenticated receipt.
- Template projection is monotonic and never substitutes for internal approval.
- EndpointDigestKeyResolver supplies active and bounded prior server-only keys, domain-separated from every other key; unavailable keys fail closed and never persist/log.
- Reuse canonical entities from Task 2. Do not create WhatsApp-specific transcript/state stores.

## TDD
Write RED service/concurrency tests for replay mismatch, opt-out priority, stale policy, controlled lock race, ambiguous attempt, delayed statuses, consent receipts, binding expiry/reassignment, template reconciliation, disabled dependencies, absent receipts, prohibited text and digest-key rotation/failure. Implement memory repository as executable reference. Run focused GREEN, domain typecheck and full suite. Candidate commits `ecd45d2`, `680c02f`, `0a5ade1` are reference only. Commit only Task 4 files.

## Report
Write `.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-4-report.md` with RED/GREEN/full-suite evidence, files, self-review, SHA and concerns.