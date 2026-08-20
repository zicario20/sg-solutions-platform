# Task 5 Implementation Report

- Task: Inactive direct Meta Cloud API adapter and webhook verifier
- Branch: `codex/m004-whatsapp-recovery`
- Approved base: `4d037f87e2827972217eb8e0500b80b2dca56a20`
- Task commit: `04c0de46a11a5f18e39abc97294bb4ef1cdf36ea`
- Status: Implemented and locally verified; provider activation remains closed

## Scope delivered

- Added an opaque webhook-verification capability bound to the exact raw bytes verified by
  timing-safe HMAC-SHA256 comparison.
- Added strict GET challenge validation with exact mode/token checks, duplicate-field rejection and
  a bounded challenge.
- Added bounded, duplicate-key-rejecting JSON normalization for supported text, interactive reply,
  message status and media-reference metadata callbacks.
- Added strict WABA and phone-number connection matching. WABA-level template callbacks remain
  minimized manual-review results because this gate cannot safely map them to one phone connection.
- Added an immutable provider capability snapshot recording unsupported idempotency/lookup/
  reconciliation/template projection behavior.
- Added injected-fetch dispatch with one exact Graph endpoint, bearer authentication, JSON
  allowlists, caller AbortSignal propagation and bounded accepted/rejected/ambiguous outcomes.
- Added fail-closed production credential resolution and unsupported reconciliation for dispatch,
  messages and templates.
- Added only the existing internal `@atlas/domain` workspace edge; no SDK or external dependency was
  added.

## RED evidence

Command:

```text
corepack pnpm exec vitest run tests/m004/meta-webhook.test.ts tests/m004/meta-adapter.test.ts
```

Result before production files existed: exit `1`; `2` suites failed for the expected missing Task 5
modules (`credentials.ts` and `meta-webhook.ts`). The approved Task 4 baseline had already passed
with `36` files passed, `2` skipped, `442` tests passed and `5` skipped.

## GREEN evidence

Focused tests:

```text
corepack pnpm exec vitest run tests/m004/meta-webhook.test.ts tests/m004/meta-adapter.test.ts
```

Result: exit `0`; `2` files passed; `66/66` tests passed.

App typecheck:

```text
corepack pnpm --filter @atlas/app typecheck
```

Result: exit `0`.

Dependency audit:

```text
corepack pnpm audit --prod --audit-level high
```

Result: exit `0`; no known vulnerabilities found.

Sequential workspace typechecks: exit `0` for all `11` packages with a `typecheck` script:
`@atlas/app`, `@atlas/www`, `@atlas/auth`, `@atlas/config`, `@atlas/database`,
`@atlas/design-tokens`, `@atlas/domain`, `@atlas/i18n`, `@atlas/observability`, `@atlas/ui` and
`@atlas/validation`.

## Full-suite evidence

Final pre-commit command:

```text
corepack pnpm test
```

Result: exit `0`; `38` files passed, `2` skipped; `508` tests passed, `5` skipped.

The skipped tests were pre-existing gated tests. The run emitted the pre-existing engine warning:
the repository requests Node `24.18.1` while the local runtime is Node `24.19.0`.

## Files committed

- `blueprints/project-atlas/workspace/apps/app/package.json`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts`
- `blueprints/project-atlas/workspace/pnpm-lock.yaml`
- `blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts`

## Self-review

- `git diff --cached --check` passed before commit.
- Staged scope contained exactly the eight Task 5 files listed above; pre-existing untracked SDD
  artifacts were not staged.
- No source path reads provider credentials from environment variables or selects an adapter from
  runtime configuration.
- The adapter accepts only injected `fetch`; reconciliation makes no provider request and returns
  `activation_review_required`.
- Signature verification occurs over a raw-byte snapshot before JSON parsing. The resulting context
  is opaque, frozen, unforgeable by structural copy and bound to the verified digest.
- Error and unsupported results are bounded reason/status projections. Tests prove invalid body,
  provider response, credential, endpoint and identifier markers are not reflected or logged.
- Dispatch performs one request only. Network loss, redirects, server failure, malformed/oversized
  success and multiple references become `dispatch_unknown`; no delivery state is manufactured.
- Known WABA-level template callbacks remain manual review; unknown callbacks cannot activate a
  template. Dispatch/message/template reconciliation remains unsupported.
- No live Meta request, credential, provider account, merge, push, deployment or activation occurred.

## Concerns

- The pinned Biome `2.5.6` executable could not run because Windows Application Control blocked the
  binary. Both the package wrapper and direct executable invocation were attempted; neither produced
  a formatting or lint diagnostic. `git diff --check`, focused tests, app and sequential workspace
  typechecks, dependency audit and the full suite all passed.
- The offline lockfile-only refresh initially lacked cached registry metadata for a transitive
  package. The subsequent normal pnpm resolution completed with zero downloads and updated only the
  `apps/app` importer for the internal `@atlas/domain` workspace link.
- Provider traffic and all reconciliation/template activation remain intentionally unavailable until
  a separate Product Owner activation review.

## Fix Round 1

- Review source: controller-owned read-only `task-5-review-package.md`
- Parent commit: `04c0de46a11a5f18e39abc97294bb4ef1cdf36ea`
- Fix commit: `a1a852419ea5722f0839825800616bd96f1f56f6`
- Status: all five Important findings addressed with regression coverage

### Changes

- Normalizes one exact complete official-contract-shaped synthetic template callback into the
  canonical `MessageTemplateProjection` boundary, including provider reference, EN/ES locale,
  category, bounded components, canonical state/status, positive provider version and plausible
  provider timestamp. Complete approved/rejected/paused/disabled callbacks map to their exact
  states; unknown, pending/regressive, incomplete, zero-version, non-canonical-locale and invalid-
  timestamp callbacks return minimized `template_manual_review`. Lookup reconciliation remains
  `activation_review_required`.
- Replaced broad non-success classification with the documented conservative pre-acceptance
  rejection allowlist: `400`, `401`, `403`, `404`, `405`, `406`, `410`, `411`, `413`, `414`, `415`
  and `422`. Status `0`, informational, redirects, `408`, `409`, unknown `4xx`, `429`, `>=500`,
  out-of-range/non-integer/non-finite statuses and transport/abort failures after invocation become
  `dispatch_unknown`.
- Requires exact ten-digit Unix-second message/status timestamps and safe integer Unix-second entry
  timestamps. The documented plausibility range begins at `2020-01-01T00:00:00Z` and permits at
  most five minutes beyond the verified receipt time. Milliseconds, overflow, legacy implausible and
  far-future values are rejected.
- Added mandatory positive safe-integer `maxRawBodyBytes` verification input. Oversized bodies are
  rejected before raw-byte snapshot or HMAC work; Task 6 streaming limits remain additive.
- Cancels every non-success/redirect/ambiguous HTTP response body before any body reader is obtained.
  Controlled `ReadableStream` tests carry private marker bytes and prove one cancellation, zero
  reads and zero result leakage. Successful responses retain bounded reading.

### RED evidence

```text
corepack pnpm exec vitest run tests/m004/meta-webhook.test.ts tests/m004/meta-adapter.test.ts
```

Result before source fixes: exit `1`; `2` files failed; `42` regression tests failed and `61`
existing tests passed. Failures matched the five findings: missing projection capability/output,
unbounded timestamps, absent webhook byte gate, broad status classification and absent body
cancellation.

### GREEN and verification evidence

- Focused tests: exit `0`; `2` files passed; `107/107` tests passed.
- App typecheck: `corepack pnpm --filter @atlas/app typecheck`; exit `0`.
- Production dependency audit: `corepack pnpm audit --prod --audit-level high`; exit `0`; no known
  vulnerabilities found.
- Offline dependency integrity: `corepack pnpm install --lockfile-only --offline --frozen-lockfile`;
  exit `0`; all `12` workspace projects were already up to date.
- Sequential typechecks: all `11` packages with a typecheck script passed in order.
- Final full suite: `corepack pnpm test`; exit `0`; `38` files passed, `2` skipped; `549` tests
  passed, `5` skipped.
- `git diff --cached --check`: exit `0` before commit.

### Files in Fix Round 1 commit

- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-contracts.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-webhook.ts`
- `blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/meta-webhook.test.ts`

### Fix Round 1 self-review

- Exact commit scope is five Task 5 source/test files; no manifest, lockfile, runtime config,
  `.superpowers` brief/report/review package or unrelated file was committed.
- Template projection remains bound to the opaque verified context and exact WABA ID. Only complete,
  unambiguous allowlisted fields can produce a projection; all other template content is minimized.
- Provider approval is never inferred for unknown/pending/regressive or incomplete callbacks, and
  non-approved known statuses cannot activate a template.
- Only explicit pre-acceptance rejection statuses can authorize `confirmed_not_sent`; every uncertain
  outcome remains non-retryable/manual through `dispatch_unknown`.
- Non-success response bodies are cancelled unread and never logged. No new console, environment,
  global fetch, provider-traffic configuration or reconciliation request path was added.
- No subagent, reviewer, live Meta request, credential, merge, push, deployment or activation was
  used.

### Fix Round 1 concerns and deferrals

- Minor JSON-whitespace behavior is controller-deferred and unchanged in this fix round.
- The existing Node engine mismatch remains: repository `24.18.1`, local runtime `24.19.0`.
- Windows Application Control still prevents the pinned Biome executable from running; this
  environment limitation is controller-deferred. Compiler, tests, dependency audit and diff checks
  passed.
- Provider lookup reconciliation remains intentionally unsupported/manual until activation review.

## Fix Round 2 - 2026-08-20

### Status

Complete. Both Important findings were corrected with synthetic official-contract-shaped regression coverage. Template reconciliation remains unsupported/manual, production credential resolution remains fail-closed, and no live provider traffic or activation path was introduced.

### Changes

- Replaced prototype-bearing template event/category allowlist objects and `in` checks with typed `Map` lookups. `constructor`, `toString`, `__proto__`, inherited, unknown, regressive, and incomplete payloads remain `template_manual_review` and cannot emit canonical projection fields.
- Added `MetaTemplateConnectionAuthority` to the credential/connection boundary. Projection now requires an exact own-key receipt binding connection ID, WABA ID, correlation ID, bounded receipt identity/version, validity window, and exactly one canonical template-owning connection.
- Validated authority evidence against the verified webhook context before projection. Missing, ambiguous, wrong-connection, wrong-WABA, wrong-correlation, future, stale, malformed, or non-unique evidence fails closed to `template_manual_review`.
- Kept the production resolver fail-closed for authority resolution and preserved unsupported/manual template reconciliation.

### TDD evidence

- RED: `pnpm exec vitest run tests/m004/meta-adapter.test.ts` - 15 failed, 84 passed. Failures proved authority was not consulted and prototype keys emitted function/object canonical values.
- GREEN adapter: `pnpm exec vitest run tests/m004/meta-adapter.test.ts` - 99 passed.
- Focused adapter/webhook/template path: `pnpm exec vitest run tests/m004/meta-webhook.test.ts tests/m004/meta-adapter.test.ts` - 123 passed.
- App typecheck: `pnpm --filter @atlas/app typecheck` - passed.
- Dependency audit: `pnpm audit --prod --audit-level high` - no known vulnerabilities.
- Sequential workspace typechecks: `pnpm -r --workspace-concurrency=1 typecheck` - 11 of 12 workspace projects passed sequentially.
- Full suite: `pnpm test` - 38 files passed, 2 skipped; 565 tests passed, 5 skipped.
- Whitespace: `git diff --check` - passed before commit.

### Files committed

- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/credentials.ts`
- `blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/meta-adapter.ts`
- `blueprints/project-atlas/workspace/tests/m004/meta-adapter.test.ts`

### Commit

`d0ab15c07ad7934ed0e0fd08a9c1c08f3ed7e0fa` (`fix(whatsapp): require trusted template authority`)

### Self-review

No material findings. Allowlist selection cannot traverse object prototypes; canonical status/category values are typed strings from `Map`. Authority validation requires exact own fields, exact verified context identity, one owner, positive bounded version, bounded identifier, and a current validity interval no longer than 24 hours. Failure envelopes are minimized and do not reflect receipt, WABA, connection, payload, phone, token, or body data. No dependency, runtime provider configuration, reconciliation, deployment, or activation behavior changed.

### Concerns and limitations

- No blocking concern.
- Controller-deferred environment limitation remains: local Node `24.19.0` differs from the pinned `24.18.1`; all required checks passed.
- Controller-deferred minor JSON-whitespace limitation remains unchanged.
- Trusted authority production resolution intentionally remains unavailable until activation review; therefore production template callbacks remain manual review by design.
