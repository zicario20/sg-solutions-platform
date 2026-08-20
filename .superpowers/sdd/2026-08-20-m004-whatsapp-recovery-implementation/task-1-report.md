# Task 1 Report: Fail-Closed M004 Runtime Configuration

## Status

Implemented and committed as Task 1 only.

## Files changed

- `blueprints/project-atlas/workspace/packages/config/src/whatsapp.ts`
- `blueprints/project-atlas/workspace/packages/config/src/index.ts`
- `blueprints/project-atlas/workspace/.env.example`
- `blueprints/project-atlas/workspace/turbo.json`
- `blueprints/project-atlas/workspace/tests/m004/whatsapp-config.test.ts`
- `blueprints/project-atlas/workspace/tests/contract/production-gate.test.ts`

## RED evidence

Command:

```text
corepack pnpm exec vitest run tests/m004/whatsapp-config.test.ts
```

The first attempt was blocked by dependency provisioning because `esbuild@0.28.1` failed its
Windows postinstall with `spawnSync ... esbuild.exe UNKNOWN`. After dependency installation with
`corepack pnpm install --ignore-scripts`, the same focused command ran and failed as expected:

```text
Test Files  1 failed (1)
Tests       15 failed (15)
TypeError: readWhatsAppConfig is not a function
```

## GREEN evidence

Command:

```text
corepack pnpm exec vitest run tests/m004/whatsapp-config.test.ts tests/contract/production-gate.test.ts
```

Output:

```text
Test Files  1 passed | 1 skipped (2)
Tests       15 passed | 4 skipped (19)
```

The skipped tests are the existing release-gate block because `RELEASE_GATE` was not enabled.

## Typecheck evidence

Command:

```text
corepack pnpm typecheck
```

Result: failed before TypeScript execution when Turbo attempted to spawn a child process:

```text
Error: spawn UNKNOWN
syscall: 'spawn'
code: 'UNKNOWN'
```

This is an environment/process-spawn failure, not a TypeScript diagnostic. Node was `v24.19.0`
while the repository requests `24.18.1`.

## Full-suite evidence

Command:

```text
corepack pnpm test
```

Output:

```text
Test Files  31 passed | 2 skipped (33)
Tests       359 passed | 5 skipped (364)
```

## Self-review

- `providerTrafficAllowed`, `mediaDownloadEnabled`, `marketingEnabled` and
  `preliminaryIntakeEnabled` are literal `false` values and ignore activation-looking input.
- Runtime state accepts only `disabled`, `local` and `staging`; enabled application behavior is
  limited to local/staging.
- Provider selection accepts only `meta_cloud`; test adapters are not environment-selectable.
- Graph API version has no guessed default and is required outside disabled mode, matching
  `^v[1-9][0-9]*\\.[0-9]+$`.
- Webhook numeric bounds are covered at both boundaries and reject invalid values.
- `.env.example` contains only empty configuration names and no credentials or account/number IDs.
- Production-gate assertions preserve provider-disabled behavior and remain release-gate scoped.
- `git diff --check` passed.
- Commit contains exactly the six scoped Task 1 files; no provider calls, credentials, activation,
  deployment, merge or push were performed.

## Commit

`f56a71571e34064518d05260f6cfba6d170617c8`

## Concerns

- Required Turbo typecheck remains unverified because of the environment-level Windows
  `spawn UNKNOWN` failure and Node patch-version mismatch. Focused tests and the complete Vitest
  suite pass.

## Fix Round 1

### Direct TypeScript verification

Turbo was not retried or represented as passing. The changed package was typechecked directly with
its installed TypeScript compiler, and the workspace project covering the changed config and test
imports was typechecked directly as well.

Command 1:

```text
corepack pnpm --filter @atlas/config exec tsc -p tsconfig.json --noEmit
```

Output:

```text
. | [WARN] Unsupported engine: wanted: {"node":"24.18.1"} (current: {"node":"v24.19.0"})
exit=0
```

Command 2:

```text
corepack pnpm exec tsc -p packages/config/tsconfig.json --noEmit
```

Output:

```text
exit=0
```

Both direct invocations ran TypeScript 6.0.3 with no diagnostics. Node remains `v24.19.0` rather
than the repository-requested `v24.18.1`; this is an environment limitation, not a code failure.

### Production-gate assertion

Command:

```text
$env:RELEASE_GATE='true'; corepack pnpm exec vitest run tests/contract/production-gate.test.ts -t "keeps provider traffic disabled"
```

Output:

```text
Test Files  1 passed (1)
Tests       1 passed | 3 skipped (4)
exit=0
```

The new provider-disabled assertion executed with `RELEASE_GATE=true` and passed. The three
unrelated release-artifact assertions were excluded by the test-name filter because the
documentary worktree does not contain those legacy release files.

### Fix Round 1 status

No production code changed. Evidence is now sufficient for the changed package/config and test
imports through direct `tsc` invocations; Turbo itself remains unverified and is not claimed as
passing.
