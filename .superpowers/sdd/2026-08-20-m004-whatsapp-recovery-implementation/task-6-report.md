# Task 6 Report: Bounded Next.js Webhook Ingress

- Status: Implemented and committed; exact Turbopack build command is host-policy blocked, with the
  Next.js-recommended webpack build completing successfully.
- Branch: `codex/m004-whatsapp-recovery`
- Approved base: `d0ab15c07ad7934ed0e0fd08a9c1c08f3ed7e0fa`
- Task 6 commit: `33fdc1ec5c9fc05a31e7ce2e303e315b1735db48`
- Commit subject: `feat(app): add bounded WhatsApp webhook ingress`
- Candidate commits `91eff04` and `cc4d7e2`: not cherry-picked or used as implementation source.

## Implemented boundary

- Added a dependency-injected pure ingress handler with deterministic clock, bounded semaphore and
  fixed-window rate-budget ports.
- Enforced method, literal provider gate, connection syntax, exact content type, supported content
  encoding, declared length, concurrency, rate, authority receipt, credentials, streamed length,
  read timeout and total timeout before parsing.
- Reused Task 5 raw-byte HMAC verification with `maxRawBodyBytes` and its opaque verification
  capability before invoking the inactive Meta adapter.
- Added a bounded webhook connection authority receipt and rejected invalid, expired,
  cross-connection or multiply-owning authority before credential lookup.
- Awaited the injected durable canonical `acceptInbound` port and returned 200 only for `accepted`
  or `duplicate`; replay mismatch returns bounded 409 and dependency/durability failure returns
  bounded 503.
- Added no-store, non-reflective text responses with generated opaque correlation IDs and exact,
  minimized telemetry fields.
- Added the thin Node.js App Router GET/POST route. Its real runtime uses
  `WhatsAppConfig.providerTrafficAllowed`, whose current type/value is literal `false`, and wires
  only unreachable fail-closed dependencies.
- Added server module-resolution coverage for ingress, runtime and route exports.

## Files committed

- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts`
- `blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts`
- `blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts`
- `blueprints/project-atlas/workspace/tests/contract/module-resolution.ts`

The report is an external SDD artifact and was written after the commit so it could record the
final SHA. It is not part of the Task 6 code commit, consistent with the prior untracked task-report
workflow.

## TDD evidence

### RED

Command:

```text
corepack pnpm exec vitest run tests/m004/whatsapp-ingress.test.ts
```

Result: exit 1. Vitest failed at the intended missing production boundary:
`Cannot find module '../../apps/app/src/lib/whatsapp/ingress.ts'`. No Task 6 production file existed
at that point.

### GREEN

Final focused command:

```text
corepack pnpm exec vitest run tests/m004/whatsapp-ingress.test.ts
```

Result: exit 0; 1 test file passed; 22 tests passed. Coverage includes controlled ReadableStream
declared/streamed oversize, slow read cancellation, total timeout, semaphore exhaustion, rate
exhaustion, malformed UTF-8/JSON, invalid signature ordering, authority-before-credentials,
durability failure, duplicate acknowledgement, delayed durable success, and actual disabled/local/
staging route fail-closure for POST body and GET challenge.

Two harness defects were corrected during GREEN without changing the behavioral contract:

- Task 5 freezes its adapter, so the test now delegates through a `vi.fn` wrapper rather than
  redefining `normalizeVerifiedEvent`.
- Durable-commit synchronization now uses an explicit deferred invocation signal rather than an
  arbitrary microtask count.

## Typecheck, module resolution and build evidence

### App typecheck

```text
corepack pnpm --filter @atlas/app typecheck
```

Result: exit 0.

### Server module resolution

```text
corepack pnpm contract:imports
```

Result: exit 0.

### Eleven sequential workspace typechecks

Each workspace script ran one at a time and exited 0:

```text
TYPECHECK_RUN_1 @atlas/app PASS
TYPECHECK_RUN_2 @atlas/www PASS
TYPECHECK_RUN_3 @atlas/auth PASS
TYPECHECK_RUN_4 @atlas/config PASS
TYPECHECK_RUN_5 @atlas/database PASS
TYPECHECK_RUN_6 @atlas/design-tokens PASS
TYPECHECK_RUN_7 @atlas/domain PASS
TYPECHECK_RUN_8 @atlas/i18n PASS
TYPECHECK_RUN_9 @atlas/observability PASS
TYPECHECK_RUN_10 @atlas/ui PASS
TYPECHECK_RUN_11 @atlas/validation PASS
```

The root Turbo wrapper was also attempted but failed before invoking a compiler with Windows
`spawn UNKNOWN`; the explicit sequential package matrix above avoids that blocked launcher and
executes all 11 actual TypeScript targets.

### App build

Required command:

```text
corepack pnpm --filter @atlas/app build
```

Result: exit 1 due to host Application Control blocking
`@next/swc-win32-x64-msvc`. Next.js loaded WASM, but Turbopack requires the blocked native binding
and instructed use of webpack on this platform.

Next.js-recommended fallback:

```text
corepack pnpm --filter @atlas/app exec next build --webpack
```

Result: exit 0. Next.js 16.2.12 compiled successfully, completed TypeScript, generated pages and
listed `/api/integrations/whatsapp/meta/[connectionId]` as a dynamic server route. The build's
generated `apps/app/next-env.d.ts` rewrite was restored and excluded from the Task 6 commit.

## Full-suite evidence

Untouched Task 5 baseline:

```text
corepack pnpm test
```

Result: exit 0; 38 files passed, 2 skipped; 565 tests passed, 5 skipped.

Final suite after self-review:

```text
corepack pnpm test
```

Result: exit 0; 39 files passed, 2 skipped; 587 tests passed, 5 skipped.

`git diff --cached --check` and post-commit `git show --check HEAD` both exited 0.

## Self-review

- Reviewed the exact cached five-file Task 6 diff; no Critical or Important correctness/security
  finding remained.
- Added an explicit real-route GET challenge fail-closed assertion for disabled, local and staging
  after noticing the initial matrix proved POST body non-read but did not separately exercise GET.
- Confirmed connection syntax precedes authority/credential lookup; headers, concurrency and rate
  precede body access; signature precedes adapter normalization and durable acceptance; and the
  semaphore releases through all terminal paths.
- Confirmed bounded response bodies and telemetry never include request body, signature, credential,
  connection ID, authority details or caught error text. The only reflected value is the bounded GET
  challenge after exact token verification, as required by the provider contract.
- Confirmed the real route cannot activate any dependency in current configuration because the
  provider gate runs before connection, query, credentials or body and the Build config supplies
  literal `false`.
- Confirmed no network, credentials, merge, push, deploy or activation occurred. No subagent or
  independent reviewer was used, per Product Owner direction.

## Concerns and limitations

- The exact Turbopack build command remains blocked by Windows Application Control. Source and route
  build correctness were verified with Next.js's webpack fallback, but the requested exact command
  does not have a passing exit on this host.
- The repository pins Node `24.18.1`; the active runtime is `24.19.0`, so pnpm emits an existing
  unsupported-engine warning on commands.
- Provider traffic remains intentionally impossible. The real runtime authority, credential,
  adapter and persistence dependencies are fail-closed placeholders until a future separately
  authorized activation/build task replaces the literal-false contract.
- Independent review was intentionally omitted because Task 6 explicitly prohibited subagents and
  reviewers; this report is implementer self-review only.

## Fix Round 1 of 5

- Status: All four Important review findings addressed with deterministic regressions and committed.
- Base Task 6 commit: `33fdc1ec5c9fc05a31e7ce2e303e315b1735db48`
- Fix Round 1 commit: `1c887cf96e68fae565dec0accf41716e38651c32`
- Commit subject: `fix(app): harden webhook ingress cleanup`

### Finding resolutions

1. The real route now explicitly exports `OPTIONS`, `HEAD`, `PUT`, `PATCH` and `DELETE` in addition
   to `GET` and `POST`. Every unsupported method reaches the same ingress-owned 405 response with
   `Allow: GET, POST`, `Cache-Control: no-store`, an opaque correlation ID and no reflected route or
   request data. Direct real-module tests include OPTIONS so Next cannot substitute its synthesized
   response, and the executable module-resolution contract imports every supported export.
2. `Content-Encoding` is now valid only when the header is absent. Present `identity`, empty,
   unsupported, comma-separated and duplicated values all return 415 before authority, credentials
   or body access.
3. One request-scoped `AbortController` now propagates the same `AbortSignal` through webhook
   authority resolution, verification credential resolution, verified normalization and durable
   acceptance. A total timeout aborts the active operation and responds immediately, but the
   concurrency permit remains owned until that operation settles. A dependency that ignores abort
   therefore consumes one bounded permit rather than creating an untracked straggler. Permit release
   is idempotent.
4. Read timeout now wins the response race before best-effort `reader.cancel()` starts. The response
   does not await cancellation, while permit and reader-lock cleanup wait for both the outstanding
   read and cancellation to settle. A never-settling cancellation holds capacity; deterministic
   resolution proves eventual single release and request recovery.

Signature-before-normalization, durable ACK ordering, provider-disabled real runtime behavior,
no-store responses and non-reflection remain unchanged.

### RED evidence

```text
corepack pnpm exec vitest run tests/m004/whatsapp-ingress.test.ts
```

Result: exit 1; 5 expected failures and 24 passes. Failures independently proved that the old code:

- accepted present `Content-Encoding: identity` and reached signature handling (403 instead of 415);
- passed no AbortSignal to the unresolved authority dependency;
- awaited never-settling stream cancellation instead of returning the 408 response;
- passed no AbortSignal to durable acceptance; and
- exported no explicit OPTIONS handler.

```text
corepack pnpm contract:imports
```

Result: exit 1 with an ESM named-export error because the real route did not export `DELETE`.

### GREEN and focused evidence

```text
corepack pnpm exec vitest run tests/m004/whatsapp-ingress.test.ts
```

Result: exit 0; 1 file passed; 29 tests passed.

```text
corepack pnpm contract:imports
corepack pnpm exec vitest run tests/contract/module-resolution.test.ts
corepack pnpm --filter @atlas/app typecheck
```

Results: all exit 0; module-resolution focused test 1/1 passed.

### Build and sequential typecheck evidence

```text
corepack pnpm --filter @atlas/app exec next build --webpack
```

Result: exit 0. Next.js 16.2.12 compiled successfully, completed TypeScript/static generation and
listed `/api/integrations/whatsapp/meta/[connectionId]` as a dynamic route. The known Windows
Application Control SWC warning remains; the generated `next-env.d.ts` rewrite was restored and is
not in the commit.

All 11 workspace typechecks ran sequentially and passed:

```text
TYPECHECK_RUN_1 @atlas/app PASS
TYPECHECK_RUN_2 @atlas/www PASS
TYPECHECK_RUN_3 @atlas/auth PASS
TYPECHECK_RUN_4 @atlas/config PASS
TYPECHECK_RUN_5 @atlas/database PASS
TYPECHECK_RUN_6 @atlas/design-tokens PASS
TYPECHECK_RUN_7 @atlas/domain PASS
TYPECHECK_RUN_8 @atlas/i18n PASS
TYPECHECK_RUN_9 @atlas/observability PASS
TYPECHECK_RUN_10 @atlas/ui PASS
TYPECHECK_RUN_11 @atlas/validation PASS
```

### Full-suite and commit evidence

```text
corepack pnpm test
```

Result: exit 0; 39 files passed, 2 skipped; 594 tests passed, 5 skipped.

`git diff --cached --check` and `git show --check HEAD` both exited 0. The fix commit contains only:

- `apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts`
- `apps/app/src/lib/whatsapp/ingress.ts`
- `tests/contract/module-resolution.ts`
- `tests/m004/whatsapp-ingress.test.ts`

### Fix Round 1 self-review and concerns

- Timeout rejection is queued before abort/cancel starts, preventing cancellation from making an
  empty read win the race and fall through to signature handling.
- Late operation rejection is absorbed by cleanup settlement, and timed-out operations cannot
  resume the ingress pipeline after the rejected race.
- `releaseOnce` plus the semaphore's idempotent release prevents double capacity return.
- An abort-ignoring dependency can intentionally hold one permit indefinitely. At the configured
  concurrency bound, enough such dependencies exhaust ingress fail-closed until they settle or the
  process is recycled; this is the required bounded-straggler behavior and remains an operational
  monitoring concern for future activation.
- The existing Node engine mismatch remains: repository pin `24.18.1`, active runtime `24.19.0`.
- No subagents, reviewers, credentials, live traffic, external network, merge, push, deploy or
  provider activation were used.
