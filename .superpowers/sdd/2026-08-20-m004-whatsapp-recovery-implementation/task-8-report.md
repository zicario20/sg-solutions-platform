# Task 8 Report: Postgres Communications Repository and Canonical M003 Cutover

## Status

- Implementation status: COMMITTED
- Code status: COMPLETE FOR AUTHORIZED TASK 8 STATIC AND CONTRACT SCOPE
- Closure status: BLOCKED ON LIVE DISPOSABLE POSTGRESQL VALIDATION AND EXTERNAL MIGRATION-LEDGER ATTESTATION
- Branch: `codex/m004-whatsapp-recovery`
- Approved base: `02736394999146f746d62d4897248d7331ba7d50`
- Task 8 commit: `099a74eb12ebaa70ff1639f794e82a9ae467e7ff`
- Commit subject: `feat(database): add Postgres communications repository`

No merge, push, deploy, migration execution, activation, external database access, subagent or independent reviewer was used.

## Scope delivered

- Added a PostgreSQL implementation of the current Task 4 `CommunicationsRepository` contract.
- Added one shared repository conformance suite used by memory and PostgreSQL adapters.
- Hardened the memory repository to the same metadata-only and finite-lease contract.
- Added restricted-principal transaction attestation and `SET LOCAL ROLE atlas_communications_gateway`.
- Added `FOR UPDATE SKIP LOCKED` claims, policy/binding locks before dispatch permission, finite leases, owner hashing and optimistic lease versions.
- Added exact command-attempt and command-binding reconciliation receipt foreign keys.
- Added provider status receipt idempotency and provider-reference digest retention.
- Cut M003 PostgreSQL compatibility over to canonical communication conversations, participants, messages, handoffs and audit events.
- Retained M003 session, rate-limit, citation and idempotency tables with canonical FKs and session-scoped RLS.
- Generated custom `0009` and structural `0010` through repository-local Drizzle tooling.

Candidate commits `f82f6d2`, `ef5bdad` and `68ffa20` were used only as reference. Current Task 4 lease, receipt, reconciliation, metadata and idempotency contracts remained authoritative; weaker candidate schema changes were not adopted.

## TDD evidence

### RED

Command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts --reporter=dot
```

Result:

- Test files: 1 failed.
- Tests: 9 failed, 3 passed, 12 total.
- Duration: 230 ms.
- Six PostgreSQL conformance cases failed with `POSTGRES_COMMUNICATIONS_REPOSITORY_NOT_IMPLEMENTED`.
- Memory failures proved plaintext/lease-owner retention, invalid lease acceptance and raw provider-reference retention before correction.

### GREEN correction sequence

The first domain/database typecheck identified one stale memory lease field, optional receipt narrowing and diagnostic row-shape casts. These were corrected without changing the public contract.

The first focused run after implementation produced 31 passes, 12 PostgreSQL skips and one static failure because the prior journal assertion ended at `0008`. The assertion was strengthened to require generator-owned `0009` and `0010` metadata.

The first full suite then produced 698 passes, 16 skips and four failures. One prior assertion expected retained inbound plaintext, contrary to Task 8 metadata-only requirements. Three duplicate-draft failures exposed idempotency comparison against a scrubbed body. The memory repository now retains only a SHA-256 body identity digest and compares that digest for replay identity.

### Final focused GREEN

Command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-postgres.integration.test.ts tests/m004/communications-schema.test.ts tests/m003/public-chat-postgres.integration.test.ts tests/m003/public-chat-schema.test.ts --reporter=dot
```

Result:

- Test files: 3 passed, 2 skipped, 5 total.
- Tests: 32 passed, 12 skipped, 44 total.
- Duration: 509 ms.

## Shared conformance evidence

The same `communicationsRepositoryConformance` suite covers memory and PostgreSQL:

1. Atomic metadata-only inbound acceptance, exact replay and opt-out fencing.
2. Rejection of non-finite, inactive and overlong leases.
3. Active lease-owner hash and optimistic version enforcement for inbound completion.
4. One durable outbound attempt with no raw body, lease owner or provider reference.
5. Current binding/policy recheck before dispatch attempt creation.
6. Exact command-attempt reconciliation receipt binding.

Memory executed all six cases and passed. PostgreSQL is wired to the same suite but all six cases were skipped because `M004_POSTGRES_INTEGRATION_URL` was absent. No fallback or external credential was requested.

Static transaction tests passed for:

- exact restricted principal `atlas_communications_runtime`;
- rejection of superuser, bypass-RLS, inherited and excessive role membership;
- `SET LOCAL ROLE atlas_communications_gateway` and post-switch role/session-user attestation;
- inbound and outbound `FOR UPDATE SKIP LOCKED` claim SQL;
- binding and policy `FOR UPDATE` locks before dispatch permission.

## Migration evidence

### Drizzle generation

The initial generator invocation from the repository root failed with `ERR_PNPM_RECURSIVE_EXEC_NO_PACKAGE`; no artifact was created there. Generation was immediately rerun from `blueprints/project-atlas/workspace`.

Custom guard generation:

```text
corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --custom --name m004_communications_cutover_guard
```

Generated `drizzle/0009_m004_communications_cutover_guard.sql` and generator-owned `0009` metadata. The custom SQL:

- locks legacy and canonical M003 tables;
- refuses to fabricate missing owner-receipt provenance for existing outbound commands;
- proves conversation, session ownership, participant, ordinal, message, handoff, audit and retained-child parity;
- rejects unexpected dependencies;
- retargets retained citation/idempotency FKs to canonical parents before legacy drops.

Structural generation:

```text
corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --name m004_communications_canonical_cutover
```

At Drizzle's two rename-disambiguation prompts, `create table` was selected for:

- `communication_dispatch_reconciliation_receipts`
- `communication_provider_status_receipts`

Generated `drizzle/0010_m004_communications_canonical_cutover.sql`, `drizzle/meta/0010_snapshot.json` and journal entry. Neither snapshot nor `_journal.json` was hand edited.

The generated structural migration creates receipt tables, drops legacy M003 tables after the `0009` guard, adds lease/fence/digest fields, adds exact composite FKs and installs scoped retained-table policies.

### Migration history safety

No local repository or environment evidence showed that a Task 7 or Task 8 migration hash had been applied externally. External operator/migration-ledger attestation was unavailable.

If any evidence appears that prior or current `0006` through `0010` bytes/hashes were applied externally, stop. Do not rewrite applied history. Restore the exact applied bytes and implement any correction as a new forward migration after Product Owner and security review.

## Exact PostgreSQL skips and closure blockers

The focused run's 12 skips were:

- Six shared PostgreSQL repository conformance cases.
- One M003 canonical PostgreSQL compatibility/revocation case.
- Five inherited live PostgreSQL gates:

1. Idempotent restricted-role bootstrap in two databases on the same PostgreSQL cluster.
2. Fresh PostgreSQL migration from `0000` through the current Task 8 migration chain.
3. Populated PostgreSQL upgrade from `0000` through `0005` to the current chain, including bidirectional M003/canonical parity and FK cutover.
4. Live rejection of null-required and invalid foreign-key records, including exact command-attempt-receipt integrity.
5. Restricted-principal RLS, FORCE RLS, cross-session isolation and cross-channel denial.

All five live gates remain closure blockers. The external migration-ledger/operator attestation is an additional blocker. Skips are not represented as passes.

## Final validation

### Domain and database typechecks

```text
corepack pnpm --dir packages/domain typecheck
corepack pnpm --dir packages/database typecheck
```

Result: PASS for both packages.

### Sequential workspace typechecks

```text
corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
```

Result: PASS, 11 of 12 workspace projects, all 11 TypeScript invocations exited zero.

### Full suite

```text
corepack pnpm test
```

Result:

- Test files: 43 passed, 3 skipped, 46 total.
- Tests: 702 passed, 16 skipped, 718 total.
- Duration: 1.08 s.

### Diff integrity

- Final working diff check before staging: PASS.
- Final staged `git diff --cached --check`: PASS.
- Exact staged set: 18 Task 8 files.
- Pre-existing untracked SDD artifacts were not staged or committed.

The repository pins Node `24.18.1`. Validation ran on Node `24.19.0` with pnpm `11.18.0` and emitted the existing unsupported-engine warning; all direct requested typecheck and test commands completed successfully.

## Files committed

1. `blueprints/project-atlas/workspace/drizzle/0009_m004_communications_cutover_guard.sql`
2. `blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql`
3. `blueprints/project-atlas/workspace/drizzle/meta/0009_snapshot.json`
4. `blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json`
5. `blueprints/project-atlas/workspace/drizzle/meta/_journal.json`
6. `blueprints/project-atlas/workspace/packages/database/src/communications-repository.ts`
7. `blueprints/project-atlas/workspace/packages/database/src/index.ts`
8. `blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts`
9. `blueprints/project-atlas/workspace/packages/database/src/postgres-public-chat-store.ts`
10. `blueprints/project-atlas/workspace/packages/database/src/schema.ts`
11. `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
12. `blueprints/project-atlas/workspace/tests/m003/public-chat-postgres.integration.test.ts`
13. `blueprints/project-atlas/workspace/tests/m003/public-chat-schema.test.ts`
14. `blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts`
15. `blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts`
16. `blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts`
17. `blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts`
18. `blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts`

## Self-review

- Confirmed transaction entry attests the restricted principal before and after `SET LOCAL ROLE`.
- Confirmed claim paths use skip-locked work selection and finite active leases.
- Confirmed dispatch locks and reads the current binding and policy before permission and attempt creation.
- Confirmed lease owners and provider references are stored only as SHA-256 digests.
- Confirmed canonical message persistence uses metadata-only bodies for communications.
- Confirmed reconciliation rows are constrained to the exact attempt-command and command-binding pairs.
- Confirmed M003 reads/writes canonical tables and retained child tables use canonical FKs plus session-scoped RLS.
- Confirmed `0009` precedes destructive cutover and proves parity/dependency safety.
- Confirmed Drizzle alone changed snapshots and journal.
- Confirmed no unrelated tracked or untracked file entered the commit.
- Material self-review findings after correction: none.

## Concerns

1. Task 8 is not validation-closed until the five live PostgreSQL gates, six PostgreSQL conformance cases and M003 canonical compatibility case pass against an isolated disposable PostgreSQL environment.
2. External migration-ledger/operator attestation remains mandatory before any migration execution or history decision.
3. Formal closure evidence should be repeated on pinned Node `24.18.1`.
4. Enhanced independent security review is still required by repository governance before merge/release. It was not performed because Task 8 explicitly prohibited reviewers/subagents.
5. No merge, push, deploy, migration activation or external database operation was performed.

## Fix Round 1

### Status

Static, domain, memory, schema, migration-artifact, and shared-conformance fixes are implemented and committed. Task 8 closure remains blocked by the brief-defined five live PostgreSQL gates and external migration-ledger attestation.

### Commit

- SHA: 6e9016fa1a37e2051457952f34644f60fb1ad7e7
- Subject: fix(database): harden communications repository parity
- Scope: exactly 15 Task 8 fix files; this report and unrelated SDD artifacts were not committed.

### RED evidence

- Command: corepack pnpm exec vitest run tests/m004/communications-repository.test.ts --reporter=dot
- Result before implementation: 1 failed file; 9 failed and 6 passed tests, 15 total.
- RED covered canonical destination persistence, binding-scoped replay/idempotency, positive inbound processing version, exact dispatch/reconciliation vocabularies, outbound receipt validation, consent provenance, withdrawal evidence, and receipt-table hardening.

### GREEN and shared conformance evidence

- Shared suite: tests/support/communications-repository-conformance.ts is used by memory and PostgreSQL harnesses.
- Memory repository: 15/15 conformance and static repository tests passed.
- Focused M004/M003 run: 4 files passed, 2 files skipped; 59 passed and 16 skipped tests, 75 total.
- Schema/service/PostgreSQL entrypoint run: 2 files passed, 1 skipped; 36 passed and 15 skipped tests.
- Concurrency regression file after canonical-receipt fixture correction: 15/15 passed.
- Domain typecheck: passed.
- Database typecheck: passed.
- Sequential workspace typechecks: 11/11 passed with workspace-concurrency=1.
- Full suite: 43 files passed, 3 skipped; 709 passed and 20 skipped tests, 729 total.
- Diff checks: git diff --check and git diff --cached --check passed.
- Runtime warning: repository pins Node 24.18.1; validation ran on Node 24.19.0 with pnpm 11.18.0.

### Exact skips and blockers

- tests/m004/communications-postgres.integration.test.ts: 15 skipped because M004_POSTGRES_INTEGRATION_URL is absent.
- tests/m003/public-chat-postgres.integration.test.ts: 1 skipped because M004_POSTGRES_INTEGRATION_URL is absent.
- tests/contract/production-gate.test.ts: 4 baseline Phase 0 production-gate artifact tests are intentionally skipped and are separate from Task 8 PostgreSQL closure.
- No disposable PostgreSQL instance or external credentials were used, as required.
- The five brief-defined live PostgreSQL gates remain unexecuted: restricted principal plus SET LOCAL role, FOR UPDATE SKIP LOCKED contention, binding/policy locking before dispatch permission, finite lease plus optimistic version fencing, and canonical receipt/integrity/metadata-only behavior through the live migration path.
- External migration-ledger attestation remains absent.
- No migration-hash application evidence was found in the Task 8 database/migration diff; the security-sensitive stop condition was not triggered.

### Migration evidence

- Structural 0010 was dropped and regenerated through Drizzle after schema changes.
- Custom 0011_m004_receipt_security_hardening was generated through drizzle-kit generate --custom and then populated with forward-only SQL.
- Drizzle generated the 0010/0011 snapshots and journal entries; snapshots and journal were not hand-edited.
- 0011 applies ENABLE and FORCE RLS, PUBLIC/browser/conditional migration-runtime/gateway revokes, and SELECT plus INSERT grants only to atlas_communications_gateway for both receipt tables.
- 0010 uses exact Task 4 reconciliation source/outcome checks and command-scoped receipt policies.
- Live migration application, cutover parity/FK execution, and external ledger attestation remain blocked without PostgreSQL.

### Implemented fixes

- Positive initial inbound processing version and race-safe max-plus-one message ordinals under conversation lock.
- Binding-first replay/idempotency checks, body identity digest persistence, binding-scoped uniqueness, and honest race re-read outcomes.
- Shared canonical endpoint_ref destination helper and exhaustive domain-to-database dispatch outcome mapping.
- Exact Task 4 reconciliation receipt source/outcome vocabulary.
- Actual typed outbound authorization receipt persistence and policy evaluation at finalization and locked claim.
- Canonical owning resource/reference only; no raw destination or correlation surrogate.
- Transactional withdrawal evidence/history with inbound owner, operation, binding, event, and correlation validation.
- Consent provenance/version advancement for new receipts and exact same-receipt replay behavior.
- Template reconciliation receipt binding to the locked current definition version.
- Actual locked prior/resulting policy versions in audit records.
- Shared memory/PostgreSQL conformance expansion and deterministic static SQL/schema assertions.

### Files committed

- blueprints/project-atlas/workspace/drizzle/0010_m004_communications_canonical_cutover.sql
- blueprints/project-atlas/workspace/drizzle/0011_m004_receipt_security_hardening.sql
- blueprints/project-atlas/workspace/drizzle/meta/0010_snapshot.json
- blueprints/project-atlas/workspace/drizzle/meta/0011_snapshot.json
- blueprints/project-atlas/workspace/drizzle/meta/_journal.json
- blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
- blueprints/project-atlas/workspace/packages/database/src/schema.ts
- blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
- blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
- blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts
- blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts

### Self-review

- Reviewed the complete staged file list and generated/custom migration boundaries.
- Checked SQL placeholder alignment, binding/conversation/policy lock order, race re-read behavior, canonical receipt persistence, outcome round-trip mapping, reconciliation command-attempt pairing, RLS policies, revokes, and grants.
- Found and corrected one skipped-PostgreSQL parity issue during self-review: withdrawal reference state now maps storage authority metadata back to the Task 4 inbound_event/authority source vocabulary, with a static assertion.
- Confirmed no independent reviewer, subagent, external database, merge, push, deploy, or activation was used.

### Concerns

- Task 8 cannot be reported closed until all five live PostgreSQL gates pass against a disposable database and external migration-ledger attestation is supplied.
- Generated 0010/0011 have not been applied to PostgreSQL in this round.
- The Node patch-version mismatch warning remains environmental and did not fail tests or typechecks.

## Fix Round 2

### Status

Round 2 restores the authoritative Task 4 memory lease contract and closes all static/memory findings from this review. Task 8 closure remains blocked by live PostgreSQL execution and external migration-ledger attestation.

### Commit

- SHA: 381c30fdc6d10106521eabb7876382b3803c4cf6
- Subject: fix(database): restore task 4 communications parity
- Scope: exactly 10 round-2 files; report and unrelated SDD artifacts were not committed.

### RED evidence

- Command: corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-schema.test.ts tests/m004/communications-concurrency.test.ts --reporter=dot
- Result before implementation: 3 failed files; 6 failed, 43 passed, and 5 skipped tests, 54 total.
- RED failures covered persisted processing version 0, generated nonnegative schema/migration metadata, first-claim version 1, locale identity, receipt-only replay locks, method-local lock order, and withdrawn consent projection parity.

### GREEN and conformance evidence

- RED suite after implementation: 3 files passed; 49 passed and 5 skipped tests.
- Formal focused repository/schema/service/concurrency/PostgreSQL run: 4 files passed and 1 skipped; 69 passed and 18 skipped tests, 87 total.
- Shared memory/PostgreSQL conformance now covers initial 0, first claim 1, expired re-claim 2, locale mismatch, opposite cross-binding replay, same-identity concurrent creation, altered-identity concurrent creation, and exact granted-to-withdrawn consent history.
- Task 4 concurrency regressions: 15/15 passed within the focused run.
- Domain typecheck: passed.
- Database typecheck: passed.
- Sequential workspace typechecks: 11/11 passed with workspace-concurrency=1.
- Full suite: 43 files passed and 3 skipped; 712 passed and 23 skipped tests, 735 total.
- Diff checks: git diff --check and git diff --cached --check passed.
- Runtime warning: repository pins Node 24.18.1; validation ran on Node 24.19.0 with pnpm 11.18.0.

### Exact skips and blockers

- tests/m004/communications-schema.test.ts: 5 live PostgreSQL schema/migration gates skipped because no disposable PostgreSQL URL is available.
- tests/m004/communications-postgres.integration.test.ts: 13 PostgreSQL repository/shared-conformance cases skipped because M004_POSTGRES_INTEGRATION_URL is absent.
- tests/m003/public-chat-postgres.integration.test.ts: 1 canonical M003 compatibility case skipped because M004_POSTGRES_INTEGRATION_URL is absent.
- tests/contract/production-gate.test.ts: 4 baseline Phase 0 production-gate artifact tests intentionally skipped and separate from Task 8 database closure.
- External migration-ledger attestation remains absent.
- No external credentials or database were used.
- No migration-hash application evidence appeared; the security-sensitive stop condition was not triggered.

### Implemented fixes

- Restored memory inbound processing version 0 without otherwise rewriting the Task 4 contract.
- PostgreSQL now inserts processing version 0 and atomically increments it on claim to 1, then 2 on a later expired-lease claim.
- Drizzle schema now permits nonnegative processing versions with an explicit processing-version constraint.
- Outbound duplicate equivalence now includes persisted command locale in initial and uniqueness-race comparisons.
- Withdrawal authority versions now increment from latest purpose-local consent evidence, independent of contact-policy version.
- Withdrawal receipts remain durable in evidence history while withdrawn consent projection clears authorityReceiptId to undefined like memory.
- Initial replay lookup locks only communication_provider_event_receipts, preventing opposite binding lock inversion.
- Static lock-order assertions now slice acceptInbound/createOutbound method bodies instead of comparing unrelated global source occurrences.
- Shared conformance now proves deterministic one-winner duplicate/conflict behavior for concurrent outbound creation.

### Migration evidence

- Drizzle generated 0012_m004_inbound_processing_version_parity.sql.
- 0012 drops communication_provider_event_receipts_version_positive and adds communication_provider_event_receipts_processing_version_nonnegative with processing_version >= 0.
- Drizzle generated meta/0012_snapshot.json and the idx 12 journal entry; neither snapshot nor journal was hand-edited.
- Live migration execution and ledger attestation remain blocked.

### Files committed

- blueprints/project-atlas/workspace/drizzle/0012_m004_inbound_processing_version_parity.sql
- blueprints/project-atlas/workspace/drizzle/meta/0012_snapshot.json
- blueprints/project-atlas/workspace/drizzle/meta/_journal.json
- blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts
- blueprints/project-atlas/workspace/packages/database/src/schema.ts
- blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts
- blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts
- blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts
- blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts

### Self-review

- Compared PostgreSQL withdrawal sequencing directly against the authoritative memory implementation.
- Reviewed SQL parameter alignment, receipt-only FOR UPDATE scope, method-local lock order, initial/claim version transitions, locale checks in both duplicate paths, purpose-local authority sequencing, and undefined withdrawn receipt projection.
- Reviewed generated 0012 SQL and tooling-owned journal metadata.
- Confirmed no independent reviewer, subagent, external database, merge, push, deploy, or activation was used.

### Concerns

- The five live PostgreSQL gates, 13 PostgreSQL conformance cases, and M003 compatibility case remain unexecuted without a disposable database.
- External migration-ledger attestation is still required for Task 8 closure.
- Generated 0012 has not been applied to PostgreSQL in this round.
- The Node patch-version mismatch warning remains environmental.

## Fix Round 3

### Status

Implemented the single authoritative contact-withdrawal evidence model and committed it on `codex/m004-whatsapp-recovery` at `35c865ffc3cee25fd424df2cb523a831a068cdcf`.

One receipt now owns exactly one durable `contact_withdrawal_recorded` contact-level event per binding/receipt. Every affected purpose-local `consent_withdrawn` projection references that event through a same-binding composite foreign key, increments from its own latest consent authority version, and clears receipt-owner fields to match the Task 4 memory contract.

### RED evidence

- Initial focused repository/schema run: 2 failed files, 4 failed tests, 32 passed tests, 5 skipped tests, 41 total.
- Failures covered the absent contact-level event shape, per-purpose duplication of the globally unique withdrawal receipt, missing linked receipt-free projections, and missing `0013` migration artifacts.

### GREEN and conformance evidence

- Focused repository/schema/service/concurrency/Postgres entrypoint: 4 passed files, 1 skipped file; 71 passed tests, 19 skipped tests, 90 total.
- Shared memory conformance includes two distinct consent purposes, divergent purpose-local versions, eligible queued work, one authoritative withdrawal receipt, atomic all-purpose withdrawal, history parity, one withdrawal evidence event, policy fencing, queued-work cancellation, exact duplicate idempotency, and altered same-receipt replay rejection.
- The same shared case is registered for PostgreSQL and is skipped only because no disposable PostgreSQL URL is available.
- Task 4 service and concurrency regressions passed within the focused run; the authoritative memory lease/version behavior was not changed.
- `@atlas/domain` typecheck passed.
- `@atlas/database` typecheck passed.
- Sequential workspace typechecks passed for 11 of 12 workspace projects, all 11 scripts successful.
- Full suite: 43 passed files, 3 skipped files; 714 passed tests, 24 skipped tests, 738 total.
- `git diff --check` and staged `git diff --cached --check` passed.

### Migration and schema evidence

- Added Drizzle-generated structural migration `0013_m004_contact_withdrawal_evidence.sql` and Drizzle-generated `0013_snapshot.json`/journal entry.
- The latest migration was dropped and regenerated through Drizzle after constraint hardening; snapshot and journal files were never hand-edited.
- The generated forward SQL contains the explicit legacy reshape, creates one contact-level receipt owner, inserts receipt-free purpose projections, preserves purpose-local authority versions, and orders the composite unique key before its same-binding self-reference foreign key.
- Static schema/SQL assertions cover the contact-wide event discriminator, global receipt uniqueness, one repository insert strategy with conflict handling, receipt-free linked projections, same-binding foreign key, and contact-event reference-state query.
- No migration-hash application evidence was found. The sole search match was the design document rule prohibiting mutation of applied migration history.

### Exact skips and closure blockers

- 14 shared PostgreSQL repository/conformance cases skipped: no disposable PostgreSQL URL.
- 5 live PostgreSQL security/migration gates skipped: no disposable PostgreSQL URL.
- 1 canonical M003 live parity/FK migration gate skipped: no disposable PostgreSQL URL and no external migration-ledger attestation.
- 4 production-database gates skipped: external production/live credentials and activation are prohibited for this task.
- Total full-suite skips: 24.
- The five live PostgreSQL gates and external migration-ledger attestation remain explicit Task 8 closure blockers.

### Files committed

- `blueprints/project-atlas/workspace/drizzle/0013_m004_contact_withdrawal_evidence.sql`
- `blueprints/project-atlas/workspace/drizzle/meta/0013_snapshot.json`
- `blueprints/project-atlas/workspace/drizzle/meta/_journal.json`
- `blueprints/project-atlas/workspace/packages/database/src/postgres-communications-store.ts`
- `blueprints/project-atlas/workspace/packages/database/src/schema.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-postgres.integration.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-repository.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts`
- `blueprints/project-atlas/workspace/tests/support/communications-repository-conformance.ts`

### Self-review

- Confirmed the receipt is owned only by the contact-level event and cannot be duplicated per purpose.
- Confirmed purpose projections clear authority receipt fields while retaining independent purpose-local versions and the shared evidence-event reference.
- Confirmed withdrawal validation compares binding, authority domain/role, source event, correlation, issue time, and expiry before idempotent duplicate handling.
- Confirmed policy updates, projection history, single evidence insertion, and queued command cancellation share one transaction under the binding/policy locks.
- Confirmed only the ten Task 8 round-3 files were committed; pre-existing untracked SDD files were excluded.
- No subagent, independent reviewer, external database, merge, push, deploy, or activation was used.

### Concerns

- PostgreSQL behavior and migration execution remain unproven against a live disposable database until the blocked gates can run.
- External migration-ledger parity/attestation remains unavailable, so canonical M003 cutover cannot be closed.
- Verification ran on Node `24.19.0` while the repository requests `24.18.1`; pnpm emitted an engine warning, but every executed test and typecheck passed.

## Fix Round 4

### Status

Implemented and committed both remaining Important receipt-integrity findings on
`codex/m004-whatsapp-recovery` at `aa361074437355a27f90d1f25460f9aadb46fd01`.

The memory repository now retains the complete withdrawal receipt identity, including `owner`,
`operation`, `issuedAt` and `expiresAt`, and compares every retained field before returning an exact
duplicate. The database now enforces that every `consent_withdrawn` projection references a
same-binding `contact_withdrawal_recorded` event through a fixed discriminator and typed composite
foreign key.

### Commit

- SHA: `aa361074437355a27f90d1f25460f9aadb46fd01`
- Subject: `fix(database): enforce withdrawal receipt integrity`
- Scope: exactly 10 Fix Round 4 files; the accumulated untracked SDD artifacts and this report were
  excluded from the commit.

### RED evidence

Receipt-window and typed-relation RED command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-schema.test.ts --reporter=dot
```

Result before implementation:

- Test files: 2 failed.
- Tests: 4 failed, 33 passed and 5 skipped, 42 total.
- Both still-valid altered receipt windows returned `duplicate` instead of
  `{ status: "denied", code: "withdrawal_evidence_invalid" }`.
- The schema lacked the fixed discriminator check, generated `0014` journal/snapshot metadata and
  typed composite relation SQL.

Migration-order RED command:

```text
corepack pnpm exec vitest run tests/m004/communications-schema.test.ts --reporter=dot
```

Result after initial generation and before SQL ordering correction:

- Test files: 1 failed.
- Tests: 1 failed, 16 passed and 5 skipped, 22 total.
- The generator placed the typed FK before its referenced composite unique key; the static order
  assertion observed the unique key at byte 922 and the FK at byte 549.

### Focused GREEN evidence

Final repository/schema/shared-conformance command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-postgres.integration.test.ts tests/m004/communications-schema.test.ts --reporter=dot
```

Result:

- Test files: 2 passed and 1 skipped, 3 total.
- Tests: 37 passed and 19 skipped, 56 total.
- The shared conformance case executes both altered `issuedAt` and altered `expiresAt` replays and
  requires exact mismatch rejection.

Memory regression command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts --reporter=dot
```

Result: 3 files passed and 55 tests passed with no skips.

Affected package typechecks:

```text
corepack pnpm --dir packages/domain typecheck
corepack pnpm --dir packages/database typecheck
```

Result: PASS for both packages with `tsc --noEmit`.

### Product Owner validation ruling

The Product Owner narrowed Fix Round 4 validation after the focused and memory runs. Per that ruling,
the full monorepo suite, all 11 sequential workspace typechecks, build, audit and diff-check loop were
not run. One complete validation matrix is explicitly deferred to final M004 closure. This changes
process evidence only and does not relax the receipt-integrity implementation requirements.

### Migration and schema evidence

- Ran `corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --name
  m004_typed_withdrawal_evidence` from the workspace root.
- Drizzle generated `0014_m004_typed_withdrawal_evidence.sql`, `0014_snapshot.json` and journal entry
  `idx: 14`; the snapshot and journal were not hand-edited.
- `contact_evidence_event_kind` is non-null, defaults to and is CHECK-fixed as
  `contact_withdrawal_recorded`.
- The parent key is unique on `(id, binding_id, event_kind)` and the projection FK uses
  `(contact_evidence_event_id, binding_id, contact_evidence_event_kind)`.
- Scoped self-review caught the generator's FK-before-unique ordering. A failing static regression
  was added first, then only the generated SQL statement order was corrected so the referenced
  unique key is installed before the FK.
- The live disposable-PostgreSQL test accepts a correctly typed projection and rejects projections
  targeting a consent-grant event or themselves when `M004_POSTGRES_FRESH_URL` is supplied.

### Self-review

- Confirmed memory compares binding, source, owner, operation, event, correlation, issue time and
  expiry before the withdrawn-policy duplicate branch.
- Confirmed PostgreSQL reference state exposes the same retained receipt identity fields.
- Confirmed the composite FK cannot resolve a grant, self-reference or other event kind because its
  child discriminator is fixed to `contact_withdrawal_recorded`.
- Confirmed the exact staged set contained only the 10 Fix Round 4 files.
- Material scoped self-review findings after the migration-order correction: none.
- No subagent, independent reviewer, external database, merge, push, deploy, activation or audit was
  used.

### Exact skips and closure blockers

- 14 PostgreSQL repository/shared-conformance cases remained skipped because
  `M004_POSTGRES_INTEGRATION_URL` was absent.
- 5 live PostgreSQL schema/migration gates remained skipped because no disposable PostgreSQL URL was
  supplied.
- Live PostgreSQL execution and external migration-ledger attestation remain Task 8 closure blockers.
- The complete monorepo validation matrix is deferred by Product Owner ruling to final M004 closure.

## Fix Round 5

### Status

Implemented and committed the final migration-order and memory timestamp-ownership findings on
`codex/m004-whatsapp-recovery` at `e16204c1c8af5b0596c6268637f683171b1cc506`.

### Commit

- SHA: `e16204c1c8af5b0596c6268637f683171b1cc506`
- Subject: `fix(database): make withdrawal migration forward-safe`
- Scope: exactly 4 Fix Round 5 files; Drizzle snapshot/journal metadata, accumulated SDD artifacts
  and this report were excluded from the commit.

### RED evidence

Command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-schema.test.ts --reporter=dot
```

Result before implementation:

- Test files: 2 failed.
- Tests: 2 failed, 36 passed and 5 skipped, 43 total.
- Memory returned `denied` after caller-owned receipt `Date` objects were mutated post-persistence,
  while an immutable PostgreSQL receipt would return the exact duplicate result.
- The migration-order assertion found the old unique-key drop at byte 52 before the dependent
  foreign-key drop at byte 203.

### Focused GREEN evidence

Final command:

```text
corepack pnpm exec vitest run tests/m004/communications-repository.test.ts tests/m004/communications-postgres.integration.test.ts tests/m004/communications-schema.test.ts --reporter=dot
```

Result:

- Test files: 2 passed and 1 skipped, 3 total.
- Tests: 38 passed and 20 skipped, 58 total.
- The shared conformance mutation case is registered for memory and PostgreSQL; memory executed and
  passed, while PostgreSQL remained skipped without its explicit integration URL.
- The migration test enforces `drop FK -> drop old unique -> add typed unique -> add typed FK` against
  the actual `0014` SQL.

Affected package typechecks:

```text
corepack pnpm --dir packages/domain typecheck
corepack pnpm --dir packages/database typecheck
```

Result: PASS for both packages with `tsc --noEmit`.

### Implemented fixes

- Memory now clones `issuedAt` and `expiresAt` when persisting a withdrawal history record, so later
  caller mutation cannot rewrite durable receipt identity.
- Shared conformance mutates both caller-owned dates after persistence, replays fresh original date
  values, requires an exact duplicate, and verifies retained original timestamps.
- Generated migration `0014_m004_typed_withdrawal_evidence.sql` now drops the dependent untyped FK
  before dropping its referenced unique key, then installs the typed unique key before the typed FK.
- Drizzle snapshot and journal metadata were not hand-edited or changed in this round.

### Validation boundary and blockers

- Per Product Owner ruling, no broad monorepo suite, workspace-wide typecheck matrix, build, audit or
  diff-check loop was run.
- 15 PostgreSQL repository/shared-conformance cases remained skipped because
  `M004_POSTGRES_INTEGRATION_URL` was absent.
- 5 live PostgreSQL schema/migration gates remained skipped because no disposable PostgreSQL URL was
  supplied.
- Live PostgreSQL migration execution and external migration-ledger attestation remain Task 8 closure
  blockers.
- No external database, subagent, reviewer, merge, push, deploy, provider activation or audit was
  used.
