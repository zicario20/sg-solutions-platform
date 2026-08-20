# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md

## Task 8: Implement the Postgres communications repository

**Files:**

- Create: `packages/database/src/postgres-communications-store.ts`
- Create: `packages/database/src/communications-repository.ts`
- Modify: `packages/database/src/index.ts`
- Modify: `packages/database/src/schema.ts`
- Modify: `packages/database/src/postgres-public-chat-store.ts`
- Modify: `packages/database/src/public-chat-repository.ts`
- Create: Drizzle custom parity/FK cutover `drizzle/0009_m004_communications_cutover_guard.sql`
- Create: generated structural removal `drizzle/0010_*.sql`
- Modify: generated `drizzle/meta/_journal.json`
- Create: generated `drizzle/meta/0009_snapshot.json`
- Create: generated `drizzle/meta/0010_snapshot.json`
- Test: `tests/m004/communications-repository.test.ts`
- Test: `tests/m004/communications-postgres.integration.test.ts`
- Test: `tests/m003/public-chat-postgres.integration.test.ts`

**Requirements:**

- Mirror the Task 4 memory contract; memory and Postgres implementations must pass one shared
  repository conformance suite.
- Keep M003 public chat behavior on the same canonical Conversation/Participant/Message/Handoff/Audit
  tables through an M003 compatibility adapter; no read/write path may continue using superseded
  transcript tables.
- Generate 0009 with `drizzle-kit generate --custom --name m004_communications_cutover_guard`. It
  proves migrated count, IDs, ordinals, states, audit sequence and references match, changes M003
  citation/idempotency foreign keys to canonical targets and aborts on any mismatch. Then change the
  final schema to canonical-only and generate 0010 structurally with Drizzle to remove superseded
  tables. Never hand-edit snapshots/journal.
- Every request executes in a transaction that proves the current login is non-superuser,
  non-`BYPASSRLS`, a member of `atlas_communications_gateway`, and sets only that role locally.
- Accept inbound atomically with deduplication and opt-out fence.
- Claim/lease inbox and outbox work with `FOR UPDATE SKIP LOCKED`, bounded lease and owner token hash.
- Dispatch claim locks the binding/policy row and rechecks expected policy version immediately before
  returning permission to perform I/O.
- Completion requires active lease and optimistic version. Crash/expired lease remains recoverable.
- Store only minimized result codes/digests; no raw request/response/phone/token/body in attempts,
  audit or telemetry.
- Integration test runs only when `M004_POSTGRES_INTEGRATION_URL` is explicitly supplied and must use
  the restricted runtime principal.

- [ ] Extract the shared conformance cases and run them against an intentionally incomplete Postgres
  adapter to capture RED evidence.
- [ ] Implement the minimal store/repository transaction paths.
- [ ] Generate/inspect custom 0009 plus structural 0010, run memory + Postgres contract tests, and
  execute both 0000→0010 fresh and populated 0000→0005→0010 upgrade when a disposable runtime is
  available. Report skipped
  evidence honestly otherwise and do not close M004 without the real migration gate.
- [ ] Run database/domain typecheck; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.


