# Task 2 Report: Canonical Communications Kernel

## Status

Committed Task 2 on `codex/m004-whatsapp-recovery`.

- Commit: `4a2c824b7503b70c3a7c666bc0fef018546ea6b4`
- Commit message: `feat(domain): extract canonical communications kernel`
- Task 1 files were not modified.

## TDD evidence

### RED

Command:

```text
corepack pnpm exec vitest run tests/m004/communications-contracts.test.ts
```

Result: expected failure, exit `1`. Vitest could not resolve
`../../packages/domain/src/communications/index.ts`, which did not yet exist. The failure occurred
at the intended new kernel boundary; no production implementation existed when the test was added.

### GREEN

Commands and results:

```text
corepack pnpm exec vitest run tests/m004/communications-contracts.test.ts
# 1 file passed, 6 tests passed

corepack pnpm exec vitest run tests/m003/public-chat-domain.test.ts
# 1 file passed, 43 tests passed

corepack pnpm --filter @atlas/domain typecheck
# passed

corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
# 11 workspace package typechecks passed sequentially
```

The M004 suite covers exhaustive allowed/forbidden transition matrices for connection, inbound,
outbound, consent, policy, template, binding and ownership lifecycles; duplicate, terminal,
regressive delivery and disabled-quarantine outcomes; canonical serialization boundaries; and M003
ownership parity. The M003 suite adds a full nine-state equivalence matrix against the canonical
ownership machine.

### Full suite

Final command:

```text
corepack pnpm test
```

Result: exit `0`; 32 test files passed, 2 skipped; 366 tests passed, 5 skipped.

The full suite was run once before the final self-review correction and once again afterward. The
result above is the final post-review evidence.

## Files committed

- `blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/index.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/public-chat/contracts.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/public-chat/state-machine.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts`
- `blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts`

## Self-review

- Reviewed the staged Task 2 diff and ran `git diff --check`; no whitespace errors.
- Confirmed the staged commit contained only the eight files listed above.
- Confirmed public-chat locale and ownership status are canonical aliases, and public-chat message,
  conversation and projection types are bounded wrappers over canonical records.
- Confirmed public-chat service/session ownership/idempotency implementation remains unchanged.
- Reviewed the permitted candidate contracts only to validate the bounded-wrapper boundary; no merge
  or cherry-pick was performed.

## Concerns

- `corepack pnpm typecheck` could not start Turbo because Node `v24.19.0` returned `spawn UNKNOWN`
  from Turbo's native child-process launcher. `corepack pnpm exec turbo --version` reproduced the
  same failure before task execution. The sequential pnpm workspace typechecks completed
  successfully instead.
- pnpm emitted an engine warning because the workspace requests Node `24.18.1` while the environment
  supplied `24.19.0`.
- No provider activation, external traffic, deployment, merge or push was performed.

## Fix Round 1

### Scope

- Replaced `linked_prospect` and `linked_client` with the neutral `linked_contact` binding-trust
  state. No CRM, prospect or client classification remains in the communications kernel.
- Guarded the shared transition helper with an own-property check before table lookup. Malformed
  runtime source states now return `{ state, code: "unknown_state" }` and do not throw.

### RED

```text
corepack pnpm exec vitest run tests/m004/communications-contracts.test.ts
```

Result: exit `1`; 2 failures as expected.

- `candidate_match -> linked_contact` returned `invalid_transition` before the neutral binding
  lifecycle was implemented.
- A malformed runtime source state threw `TypeError: Cannot read properties of undefined
  (reading 'includes')` before the transition-table guard was implemented.

### GREEN and verification

```text
corepack pnpm exec vitest run tests/m004/communications-contracts.test.ts
# 1 file passed, 7 tests passed

corepack pnpm exec vitest run tests/m003/public-chat-domain.test.ts
# 1 file passed, 43 tests passed

corepack pnpm --filter @atlas/domain typecheck
# passed

corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
# 11 workspace package typechecks passed sequentially

corepack pnpm test
# 32 files passed, 2 skipped; 367 tests passed, 5 skipped
```

### Files committed

- `blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts`

### Self-review

- Reviewed the staged three-file diff and ran `git diff --check`; no whitespace errors.
- Confirmed the commit contains only the neutral trust-state change, safe unknown-state guard and
  regression tests.
- Left the controller-owned `task-2-review-package.md` unmodified and unstaged.

### Commit

`70179d3d1b616c13f80ac044d833115f55b0d7a7` — `fix(domain): harden communications transitions`

### Concerns

- The existing Node engine warning remains: the workspace requests Node `24.18.1` while the
  environment provides `24.19.0`.
