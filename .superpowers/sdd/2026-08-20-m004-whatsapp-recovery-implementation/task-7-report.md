# Task 7 Implementation Report

## Status

- Implementation status: COMMITTED
- Closure status: BLOCKED ON DISPOSABLE POSTGRESQL VALIDATION AND EXTERNAL MIGRATION-LEDGER ATTESTATION
- Branch: `codex/m004-whatsapp-recovery`
- Approved base: `1c887cf96e68fae565dec0accf41716e38651c32`
- Task 7 commit: `33f06fcc9231b043d99702563a9216a2c1da0d9a`
- Commit subject: `feat(database): add canonical communications persistence`
- Merge, push, deploy, route activation and external database access: NOT PERFORMED
- Independent reviewer/subagent: NOT USED, per Product Owner instruction for this task

The implementation adds the canonical Drizzle schema, generated forward migration chain, metadata-only canonical event envelope persistence, replayable contact-control evidence and least-privilege communications runtime role. Existing M003 tables and read paths remain present and unchanged by Task 7 migrations.

## Requirements and authority used

- Task brief: `.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-7-brief.md`
- Current source-of-truth, product, architecture, state, roadmap, ADR and M004 review documents were read before implementation.
- Candidate commits `316685e`, `f82f6d2`, `ef5bdad` and later database candidate `68ffa20` were treated as reference material only and ported selectively.
- Current Task 2-6 contracts were retained, including neutral `linked_contact`, closed policy/copy gates, receipt validity windows, authority receipts, provider-I/O capability evidence, reconciliation integrity, pre-HMAC bounds and inactive routing.
- No evidence in the repository or configured environment indicated that a Task 7 migration hash had already been applied externally. External operator/migration-ledger attestation was unavailable and remains a closure blocker.

## TDD evidence

### RED

Command:

```text
corepack pnpm exec vitest run tests/m004/communications-schema.test.ts tests/m004/communications-envelope-codec.test.ts tests/m004/communications-contact-evidence.test.ts
```

Expected RED result:

- 3 test suites failed during import.
- 0 tests ran.
- Missing production schema/codec/contact-evidence/runtime-script modules demonstrated that Task 7 behavior was absent before implementation.

### GREEN

Focused command:

```text
corepack pnpm exec vitest run tests/m004/communications-schema.test.ts tests/m004/communications-envelope-codec.test.ts tests/m004/communications-contact-evidence.test.ts --reporter=dot
```

Final focused result:

- Test files: 3 passed.
- Tests: 48 passed, 5 skipped, 53 total.
- Duration: 475 ms.
- The 5 skipped tests require live disposable PostgreSQL and are closure blockers, not passes.

During GREEN, tests identified ambiguous candidate physical names `template_state` and `template_version`. The schema was corrected to explicit `template_provider_state` and `template_provider_version` while retaining separate internal template-authority fields. Local unapplied `0007` and `0008` artifacts were dropped through Drizzle tooling and regenerated; snapshots and journal were never hand-edited.

## Migration and Drizzle tooling evidence

The migration order is exactly:

1. `0006_m004_communications_role_bootstrap`: custom role bootstrap.
2. `0007_m004_communications_schema`: generated structural migration.
3. `0008_m004_communications_backfill`: custom lock/backfill/parity/RLS/grant migration.

Generation used repository-local Drizzle tooling:

```text
corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --custom --name m004_communications_role_bootstrap
corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --name m004_communications_schema
corepack pnpm exec drizzle-kit generate --config packages/database/drizzle.config.ts --custom --name m004_communications_backfill
```

After the explicit provider-column correction, `drizzle-kit drop` was used interactively to remove only the local, unapplied `0008` and `0007` artifacts before regenerating them in the same order. No applied or shared migration was rewritten.

Artifact audit:

| Artifact | SHA-256 | Audit summary |
| --- | --- | --- |
| `drizzle/0006_m004_communications_role_bootstrap.sql` | `127058be5f6be53ac8b519b89db42b646608adbcad8873b110bcb3a4cf3a0865` | Idempotent NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOINHERIT, NOREPLICATION, NOBYPASSRLS role bootstrap |
| `drizzle/0007_m004_communications_schema.sql` | `2ae61ca91ca9cacafbf09d543907cc00c11856b60190ae9bb500356ad5a39b6a` | 15 new tables, 15 RLS enables, 21 generated policies, no FORCE step |
| `drizzle/0008_m004_communications_backfill.sql` | `d94b0ae83996719edc2bd3255a8b0929e7ac9de5c971869fbea529d75a373f60` | M003 locks, synthetic-safe backfill, bidirectional parity, 15 FORCE RLS operations and least-privilege grants |
| `drizzle/meta/0006_snapshot.json` | `6918897072aeaa70dbb9a029a21f0ff7ef46f3bc3deae23bdcc21d6e2e1dd60c` | 8 tables; predecessor is `0005` snapshot |
| `drizzle/meta/0007_snapshot.json` | `bbb5046b415b577b2e370034a866289d31fff5c0806f47c16fb43f82abfb4137` | 23 tables; predecessor is `0006` snapshot |
| `drizzle/meta/0008_snapshot.json` | `7c8d0e499a94d51ed7883f00a0ada57e4c56492583b9d3e9714b14b919a54d10` | 23 tables; predecessor is `0007` snapshot |

The Drizzle journal ends with indexes/tags `6/0006_m004_communications_role_bootstrap`, `7/0007_m004_communications_schema` and `8/0008_m004_communications_backfill`.

Static migration audit results:

- No `DROP`, `TRUNCATE` or `ALTER TABLE` operation targets an M003 table.
- No raw endpoint, URL, payload, secret, credential, access-token or payment-card column was introduced.
- The structural migration creates all 15 protected tables and enables RLS on each.
- The final custom migration forces RLS on all 15 protected tables.
- Runtime grants revoke broad/public access and omit `DELETE` for the communications gateway.
- The backfill aborts if canonical targets are non-empty, locks M003 sources, maps zero-based M003 message ordinals to positive canonical ordinals, and performs bidirectional parity checks before completing.
- M003 tables and read paths are not dropped or changed in Task 7.

## Canonical persistence evidence

- Canonical envelope validation is allowlist-only and rejects unknown keys or null required values.
- Text persistence defaults to metadata-only non-reversible evidence; retained text requires an explicit retention policy.
- Sender identity is persisted as a binding reference and keyed endpoint digest evidence, never as a raw endpoint.
- All current canonical event variants, including `sticker`, are handled exhaustively.
- Internal template authority state/version/time and provider projection state/version/time are stored on separate explicit axes.
- Receipt validity windows, provider-I/O capability hash/start evidence, reconciliation fields and current trust-state vocabulary are represented in schema and tests.
- Contact-control state is reconstructed deterministically from append-only receipt evidence, including revocation, wrong-person and reassignment-risk histories.

## Verification evidence

### Package typechecks

Commands, run sequentially:

```text
corepack pnpm --filter @atlas/database typecheck
corepack pnpm --filter @atlas/app typecheck
```

Result: PASS for both packages.

The first database typecheck correctly failed because the new CLI scripts were included without Node ambient types. `packages/database/tsconfig.json` was corrected with package-local `types: ["node"]`; the repeated database and app checks passed.

### Sequential workspace typechecks

The requested Turbo command failed before running a package check:

```text
corepack pnpm exec turbo run typecheck --concurrency=1
```

Failure: Node child-process `spawn UNKNOWN` under installed Node `24.19.0`.

Sequential fallback:

```text
corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
```

Result: PASS, 11 of 12 workspace projects executed sequentially.

### Full suite

Command:

```text
corepack pnpm test
```

Result:

- Test files: 42 passed, 2 skipped, 44 total.
- Tests: 642 passed, 10 skipped, 652 total.
- Duration: 930 ms.

### Diff and commit integrity

- `git diff --check`: PASS before staging.
- Exact staged-set comparison: PASS, 22 expected Task 7 files and no unrelated file.
- `git diff --cached --check`: PASS.
- Commit created: `33f06fcc9231b043d99702563a9216a2c1da0d9a`.

## Exact PostgreSQL skips and closure blockers

No live database integration was represented as passing.

Environment evidence:

- `COMMUNICATIONS_DATABASE_URL`: not configured.
- `psql`: unavailable.
- Docker CLI: installed.
- Docker Linux daemon: unavailable; connection to `dockerDesktopLinuxEngine` failed because the named pipe did not exist.
- External database credentials: not requested or used.

The following five focused integration checks were skipped and remain closure blockers:

1. Idempotent restricted-role bootstrap in two databases on the same PostgreSQL cluster.
2. Fresh PostgreSQL migration from `0000` through `0008`.
3. Populated PostgreSQL upgrade from `0000` through `0005` to `0008`, including bidirectional M003/canonical parity.
4. Live PostgreSQL rejection of null-required and invalid foreign-key records.
5. Restricted-principal RLS, FORCE RLS, cross-session isolation and cross-channel denial.

Additional closure blocker:

- Product Owner/operator attestation against the external migration ledger is still required before any migration-history amendment or execution decision. The repository and current environment contain no evidence that these hashes were applied externally, but absence of local evidence is not external attestation.

## Files committed

1. `blueprints/project-atlas/workspace/apps/app/package.json`
2. `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts`
3. `blueprints/project-atlas/workspace/drizzle/0006_m004_communications_role_bootstrap.sql`
4. `blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql`
5. `blueprints/project-atlas/workspace/drizzle/0008_m004_communications_backfill.sql`
6. `blueprints/project-atlas/workspace/drizzle/meta/0006_snapshot.json`
7. `blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json`
8. `blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json`
9. `blueprints/project-atlas/workspace/drizzle/meta/_journal.json`
10. `blueprints/project-atlas/workspace/package.json`
11. `blueprints/project-atlas/workspace/packages/database/package.json`
12. `blueprints/project-atlas/workspace/packages/database/scripts/provision-communications-runtime.ts`
13. `blueprints/project-atlas/workspace/packages/database/scripts/validate-communications-runtime.ts`
14. `blueprints/project-atlas/workspace/packages/database/src/communication-contact-evidence.ts`
15. `blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts`
16. `blueprints/project-atlas/workspace/packages/database/src/index.ts`
17. `blueprints/project-atlas/workspace/packages/database/src/schema.ts`
18. `blueprints/project-atlas/workspace/packages/database/tsconfig.json`
19. `blueprints/project-atlas/workspace/pnpm-lock.yaml`
20. `blueprints/project-atlas/workspace/tests/m004/communications-contact-evidence.test.ts`
21. `blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts`
22. `blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts`

This report remains an out-of-commit SDD artifact so it can record the final commit SHA. Pre-existing untracked SDD files were not staged or modified.

## Self-review

- Reviewed scope against the Task 7 brief and current Task 2-6 contracts.
- Compared candidate database changes selectively rather than cherry-picking candidate commits.
- Confirmed no Task 8 repository cutover, M003 drop, route activation or provider network behavior was ported.
- Confirmed generated snapshots/journal were created and repaired only through Drizzle tooling.
- Confirmed schema/migration naming makes internal template authority distinct from provider projection authority.
- Confirmed protected tables are RLS-enabled structurally and FORCE RLS is applied in the security migration.
- Confirmed no unrelated tracked or untracked file entered the commit.
- Material implementation findings after correction: none.

## Concerns

1. Task 7 must not be considered validation-closed until all five PostgreSQL checks execute successfully against a disposable local cluster.
2. External migration-ledger/operator attestation is required before treating `0006`-`0008` as safe to execute outside an isolated test database.
3. The repository pins Node `24.18.1`; validation ran on Node `24.19.0`. Direct TypeScript and test commands passed, but Turbo failed with `spawn UNKNOWN`, so the pinned runtime should be used for formal closure evidence.
4. Enhanced independent security review remains required by repository governance before merge or release. It was not performed here because the Product Owner explicitly prohibited subagents/reviewers for Task 7.

## Fix Round 1

### Status and commit

- Fix status: COMMITTED
- Fix commit: `02736394999146f746d62d4897248d7331ba7d50`
- Commit subject: `fix(database): harden communications envelope codec`
- Findings addressed: all three Important codec findings in the controller ruling
- PostgreSQL/environment closure blockers: unchanged and still blockers
- Merge, push, deploy, activation, external database access, subagents and reviewers: NOT PERFORMED

### Finding 1: metadata-only provider text

- Removed `textRetentionPolicy` from `ProviderEnvelopePersistenceContext`.
- Removed `approved` and `synthetic_local_text` from the canonical event persistence record type.
- Runtime context validation now rejects unknown keys, including attempted legacy retention keys.
- Text serialization always emits `canonicalText: null` and `bodyRetentionPolicy: metadata_only`.
- Text deserialization is always `not_reversible`; the public safe-envelope union has no available plaintext text variant.
- SQL retention and typed-shape checks now require metadata-only policy and null canonical text.
- Regression tests use synthetic input text but assert that serialized output and its JSON form contain no plaintext.

### Finding 2: strict reference grammars

The Meta conversion boundary now validates each reference before conversion:

- Event references: exact `meta_evt_` plus 32-64 lowercase hexadecimal characters.
- Message and status-message references: exact `wamid.` prefix plus a bounded provider-safe body.
- Media and template Graph references: 6-32 decimal digits with no leading zero.
- URL schemes, token-bearing URLs, delimiters, query/userinfo forms, plus/hyphen phone forms, whitespace, control/NUL characters, excessive lengths and wrong provider shapes are rejected.

The provider-neutral database validator independently applies its canonical opaque-reference grammar to every canonical event/message/media/template reference:

- 1-128 characters.
- First character alphanumeric.
- Remaining characters limited to alphanumeric, period and underscore.
- No URL, query, userinfo, whitespace, control, NUL, plus or hyphen syntax.

The generated SQL adds strict Meta event-reference validation to provider receipts and bounded provider-neutral reference validation to canonical envelope fields.

### Finding 3: one supported schema version

- Added shared `SUPPORTED_COMMUNICATION_EVENT_SCHEMA_VERSIONS` with the sole value `meta-envelope.v1`.
- Added the `CommunicationEventSchemaVersion` union and shared runtime predicate.
- Both the Meta boundary and provider-neutral database validator reject empty, unknown and case-variant versions.
- Generated SQL checks require exact `meta-envelope.v1` on provider receipts and canonical event envelopes.

### TDD evidence

RED command:

```text
corepack pnpm exec vitest run tests/m004/communications-envelope-codec.test.ts tests/m004/communications-schema.test.ts --reporter=dot
```

RED result:

- Test files: 2 failed.
- Tests: 55 failed, 34 passed, 5 skipped, 94 total.
- Failures covered legacy retention acceptance, unsafe/wrong-shape references at both validators and absent version/retention SQL checks.

Final focused GREEN result for the same command:

- Test files: 2 passed.
- Tests: 89 passed, 5 skipped, 94 total.
- Duration: 473 ms.
- The 5 PostgreSQL-dependent skips remain closure blockers, not passes.

### Drizzle generation and migration evidence

The local, unapplied branch artifacts were synchronized through Drizzle tooling:

1. Backed up only the custom `0008` SQL body outside the workspace.
2. Used `drizzle-kit drop` to remove local `0008`, then local `0007`.
3. Regenerated structural `0007` through `drizzle-kit generate`.
4. Regenerated the custom `0008` slot through `drizzle-kit generate --custom`.
5. Restored the unchanged custom backfill/parity/security body into that custom SQL slot.

Snapshots and `_journal.json` were generated only by Drizzle and were not hand-edited. No `0009` or Task 8 cutover artifact was created.

Current artifact hashes:

| Artifact | Fix Round 1 SHA-256 | Result |
| --- | --- | --- |
| `0006_m004_communications_role_bootstrap.sql` | `127058be5f6be53ac8b519b89db42b646608adbcad8873b110bcb3a4cf3a0865` | Unchanged |
| `0007_m004_communications_schema.sql` | `317b5ea60c144e37474b9e6884c0b0e06c199a0dbb4a632cb2a12a07c3660a0a` | Regenerated with retention/reference/version checks |
| `0008_m004_communications_backfill.sql` | `d94b0ae83996719edc2bd3255a8b0929e7ac9de5c971869fbea529d75a373f60` | Custom SQL body unchanged |
| `0007_snapshot.json` | `f0ec841f04111d54c9f8dbdc20dca42e3e7ad782508d12a04aa4b6d3760dae0b` | Drizzle regenerated, 23 tables |
| `0008_snapshot.json` | `a0480eec614b201f9039c712aa4e303d95e2d745ff3fd2498655b8b78f07c359` | Drizzle regenerated, 23 tables |

The journal remains ordered as `0006`, `0007`, `0008`. Static audit found two schema-version checks, two canonical/provider reference checks, no destructive M003 table operation, 15 FORCE RLS operations in `0008`, and no later migration.

### Migration-history safety warning

THIS REPORT DOES NOT CLAIM THAT THE REGENERATED MIGRATIONS ARE SAFE TO DEPLOY.

External migration-ledger/operator attestation remains absent. The original Task 7 structural `0007` SQL hash was `2ae61ca91ca9cacafbf09d543907cc00c11856b60190ae9bb500356ad5a39b6a`; Fix Round 1 replaces it with `317b5ea60c144e37474b9e6884c0b0e06c199a0dbb4a632cb2a12a07c3660a0a` only in this local branch history.

If any evidence shows that the original or regenerated `0006`-`0008` migration hashes were applied to any external database, stop. Restore migration history to the exact bytes/hash recorded as applied, do not rewrite that history, and implement these corrections in a new forward migration. Operator attestation and disposable PostgreSQL execution are required before any deployment decision.

### Final verification

- Database package typecheck: PASS.
- App package typecheck: PASS.
- Sequential workspace typechecks: PASS, 11 of 12 projects with concurrency 1.
- Full suite: 42 test files passed, 2 skipped; 694 tests passed, 10 skipped; 704 total.
- `git diff --check`: PASS.
- Exact staged-set guard: PASS, 9 expected fix files.
- `git diff --cached --check`: PASS.

### Files in Fix Round 1 commit

1. `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/provider-envelope-persistence.ts`
2. `blueprints/project-atlas/workspace/drizzle/0007_m004_communications_schema.sql`
3. `blueprints/project-atlas/workspace/drizzle/meta/0007_snapshot.json`
4. `blueprints/project-atlas/workspace/drizzle/meta/0008_snapshot.json`
5. `blueprints/project-atlas/workspace/drizzle/meta/_journal.json`
6. `blueprints/project-atlas/workspace/packages/database/src/communication-event-envelope.ts`
7. `blueprints/project-atlas/workspace/packages/database/src/schema.ts`
8. `blueprints/project-atlas/workspace/tests/m004/communications-envelope-codec.test.ts`
9. `blueprints/project-atlas/workspace/tests/m004/communications-schema.test.ts`

### Remaining concerns

1. The five PostgreSQL integration checks remain unexecuted because no disposable database URL, `psql` or running Docker daemon is available. They remain closure blockers.
2. External migration-ledger/operator attestation remains a closure blocker.
3. Formal validation should be repeated on pinned Node `24.18.1`; this round ran on Node `24.19.0` and emitted the existing engine warning.
4. Independent security review remains required before merge/release but was excluded from this round by Product Owner instruction.
