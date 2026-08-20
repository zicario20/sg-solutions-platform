# Task 4 report: Canonical communications repository and application behavior

- Status: Complete locally on the provider-disabled recovery branch
- Branch: `codex/m004-whatsapp-recovery`
- Approved Task 3 base: `69a97d10d670cf992bf178562372f5dc28beea80`
- Task 4 commit: `5aac723e2ea8df9323b197f457b511fd70ef75ce`
- Commit subject: `feat(domain): add canonical communications repository`
- Scope: Task 4 only; no merge, push, deploy, provider activation or external I/O

## Implemented behavior

- Added the provider-neutral `CommunicationsRepository` and `MessageTemplateService` contracts.
- Added an executable memory reference repository using canonical Task 2 Conversation, Participant,
  Message and related communications entities; no WhatsApp-specific transcript or state store was
  created.
- Added atomic inbound replay deduplication by connection/provider identity plus body digest, with
  fail-closed mismatched replay and atomic `opt_out_pending` establishment.
- Added durable outbound command and dispatch-attempt persistence before provider I/O.
- Added one-binding serialization for withdrawal and dispatch claim, with a deterministic lock
  boundary used by concurrency tests.
- Added lease owner/version completion gates, durable non-retryable `dispatch_unknown`, recovery
  discovery, and monotonic exactly-once provider status handling.
- Added receipt-gated consent grant/re-consent, ambiguous opt-out resolution, binding revalidation
  and internal template approval.
- Preserved Task 2 neutral `linked_contact` semantics and Task 3 closed runtime opt-out/template
  policy and copy gates.
- Added monotonic provider template projections that never substitute for SG internal approval.
- Added bounded service ports for provider dispatch, public knowledge and handoff dependencies;
  unavailable dependencies return explicit manual/unavailable results and no receipt is fabricated.
- Added active plus bounded-prior endpoint digest-key resolution with communications-only domain
  separation, fail-closed invalid/unavailable rings and no persisted/logged key or raw endpoint.

## Files committed

- `blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts`

This report was written after the implementation commit so it could record the exact SHA. It was
not added to the implementation commit, preserving the Task 4 code/test allowlist.

## TDD evidence

### RED

Command:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: exit 1. Vitest loaded both test files without import/syntax errors and reported 19/19
expected assertion failures because the existing communications index did not yet export
`MemoryCommunicationsRepository`, `CommunicationsService` or
`CanonicalMessageTemplateService`.

```text
Test Files  2 failed (2)
Tests       19 failed (19)
```

### GREEN

The same focused command passed after the minimal implementation:

```text
Test Files  2 passed (2)
Tests       19 passed (19)
```

After the targeted TypeScript-only correction, the focused command was rerun and remained green:

```text
Test Files  2 passed (2)
Tests       19 passed (19)
```

The tests cover accepted/duplicate/mismatched inbound replay, atomic opt-out priority, stale policy,
disabled dependencies, absent handoff receipt, prohibited copy, consent and re-consent receipts,
binding suspension/revalidation, internal/provider template gates, digest key rotation/failure,
destination failure, controlled withdrawal/dispatch locking, durable attempts, lease ownership,
ambiguous non-retryable dispatch recovery and delayed/duplicate provider statuses.

## Typecheck evidence

Initial domain typecheck correctly exposed three compile-time defects in the memory repository:

```text
src/communications/memory-repository.ts(136,48): TS2345 connection seed inferred as never
src/communications/memory-repository.ts(305,38): TS2339 state on never
src/communications/memory-repository.ts(482,9): TS2322 failure code inferred as undefined
```

The smallest correction gave the connection map its existing explicit `{ channel, state }` shape
and derived `blockedCode` from `Extract<OutboundClaimResult, { status: "not_claimed" }>["code"]`.
No public interface, branch, result code or runtime behavior changed; no `any`, suppression or cast
was introduced.

Domain command:

```text
corepack pnpm --filter @atlas/domain typecheck
```

Result: exit 0.

Sequential workspace command:

```text
corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
```

Result: exit 0; 11 of 12 workspace projects ran sequential `tsc -p tsconfig.json --noEmit` checks.

The first Turbo wrapper attempt, `corepack pnpm exec turbo run typecheck --concurrency=1`, failed
before launching package checks with Windows `spawn UNKNOWN`. The environment was running Node
`24.19.0` while the repository pins `24.18.1`. The pnpm recursive one-at-a-time runner supplied the
requested sequential workspace evidence without code/configuration changes.

## Full-suite evidence

The full suite was run exactly once after focused GREEN and typechecks:

```text
corepack pnpm test
```

Result: exit 0.

```text
Test Files  36 passed | 2 skipped (38)
Tests       426 passed | 5 skipped (431)
```

## Self-review

- `git diff --cached --check` passed with no whitespace errors.
- The staged allowlist contained exactly the six files listed above.
- Reviewed replay, opt-out, dispatch fence, lease, ambiguous outcome, status, receipt, binding,
  template, disabled dependency and digest rotation branches against the Task 4 brief.
- Confirmed production Task 4 files contain no `WhatsAppConversation`, `WhatsAppMessage`,
  transcript store, TypeScript suppression, `any` workaround, logging, environment access,
  embedded endpoint or server-key literal.
- Confirmed raw endpoint and digest keys are confined to service-port calls and synthetic test
  fixtures; memory reference state contains digests only.
- No material self-review finding remained open.
- No subagent or reviewer was used, as directed.

## Concerns and limitations

- Node is `24.19.0`, not the repository-pinned `24.18.1`; this produced the engine warning and the
  Turbo wrapper `spawn UNKNOWN` failure described above. Direct domain and sequential workspace
  TypeScript checks passed.
- The full suite retains 2 skipped files / 5 skipped tests from the existing workspace; Task 4 did
  not alter or unskip them.
- This memory implementation is the executable reference contract. Durable Postgres conformance,
  migration and restricted-principal evidence belong to later approved tasks.
- Provider registration/activation, runtime template registration, deployment, merge and push
  remain intentionally absent.

## Fix Round 1 of 5

- Date: 2026-08-20
- Status: Complete locally
- Fix commit: `1522d10a66a1c55b67f5404924f42fbddac5ae7f`
- Commit subject: `fix(domain): harden communications recovery fences`
- Scope: all 2 Critical and 7 Important findings; Minor findings remain controller-deferred

### Corrections

- Inbound and outbound completion now require finite completion/lease dates and `now` strictly
  before `leaseExpiresAt`; expired or malformed completion conflicts without changing state.
- Every service path checks durable completion. A lost inbound or dispatch completion returns an
  explicit `recovery_required` result and cannot report accepted, answered or handoff success.
- Provider status and dispatch completion serialize on the binding. A status that advances a
  dispatching command atomically closes its active attempt; an accepted completion racing behind a
  successful status converges idempotently, while contradictory/expired completion conflicts.
- Added typed `reconcileOutbound` repository/application behavior for `dispatch_unknown`,
  `reconciliation_required` and expired `dispatching` work. Provider-lookup or manual-authority
  receipts bind command, attempt, outcome, correlation and validity window. Outcomes converge to
  `reconciled_accepted`, `confirmed_not_sent` or terminal `failed`; dispatch never auto-resends.
- Outbound queueing now persists a canonical `draft` command/message before destination or endpoint
  digest-key resolution. Resolution/key failure closes that draft as durable `failed` evidence with
  a safe reason code and command ID. Fingerprint, policy/fence, endpoint digests and dispatch receipt
  are added only by successful finalization.
- Provider template projections now require a typed reconciliation receipt bound to owner,
  operation, template, locale, definition version, provider version/state, issue/expiry and
  correlation. Provider projection still cannot substitute for internal approval.
- Internal template approval now binds both command and receipt to exact template ID, locale and
  definition version.
- Contact withdrawal now rejects missing/invalid owning evidence and stores withdrawal history.
  Authority evidence is binding/time/correlation scoped; inbound evidence additionally references
  an existing same-binding canonical inbound event and matches its correlation.
- Ambiguous opt-out resolution changes only the contact policy to `normal_after_review`; it returns
  the unchanged consent state/version. Withdrawn consent remains withdrawn until a separate valid
  `grantConsentFromReceipt` re-consent operation.
- Binding locks now also serialize inbound claim versus opt-out acceptance, provider status versus
  dispatch completion and competing reconciliation receipts.

### Deterministic concurrency coverage

Controlled promise gates, with no sleeps or timing loops, cover:

- withdrawal before dispatch claim;
- dispatch claim before withdrawal;
- expired/non-finite owner completion;
- provider status before dispatch completion;
- inbound opt-out acceptance versus processing a prior event;
- competing reconciliation receipts.

### RED evidence

First focused RED command:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: exit 1 with 10 expected failures and 19 existing passes. Failures demonstrated accepted
expired completion, false service success after completion conflict, stranded active attempt,
unserialized inbound opt-out processing, missing reconciliation, under-bound template/withdrawal
evidence, false granted consent after opt-out review and missing draft failure evidence.

Self-review added an inbound-event correlation regression test. Its RED run exited 1 with 1 expected
failure and 29 passes because mismatched receipt/event correlation was accepted.

### GREEN and verification evidence

Final focused command:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: exit 0.

```text
Test Files  2 passed (2)
Tests       30 passed (30)
```

Domain command:

```text
corepack pnpm --filter @atlas/domain typecheck
```

Result: exit 0.

Sequential workspace command:

```text
corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
```

Result: exit 0; all 11 workspace projects exposing typecheck ran one at a time.

Final full-suite command:

```text
corepack pnpm test
```

Result: exit 0.

```text
Test Files  36 passed | 2 skipped (38)
Tests       437 passed | 5 skipped (442)
```

### Files committed

- `blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts`

### Self-review and concerns

- `git diff --check` and staged `git diff --cached --check` passed.
- The commit contained exactly the five files listed above.
- Production scans found no TypeScript suppression, `any` workaround, reconciliation result cast,
  provider-specific transcript/state store, logging or environment access.
- No subagent or reviewer was used, as directed.
- Minor review findings remain intentionally deferred for the controller's final review.
- Node remains `24.19.0` while the repository pins `24.18.1`; the existing engine warning remains.
- The full suite retains 2 skipped files / 5 skipped tests from the existing workspace.

## Fix Round 2/5 - 2026-08-20

### Status

PASS. All four open findings were corrected in focused Task 4 scope and committed as `0bad313c17dcc842a4f77a624608a56c796851c0` (`fix(communications): close task 4 review gaps round 2`).

### RED evidence

Command:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: expected failure, exit 1. 2 test files failed; 5 new regression tests failed and 29 existing focused tests passed. The failures demonstrated the prior behavior precisely:

- ambiguous opt-out resolution still returned consent `state` and `version`;
- failed and unresolved outbound duplicates still returned generic `duplicate` success;
- contradictory reconciliation returned `reconciliation_state_invalid` rather than a settlement conflict;
- altered reuse of a receipt ID still returned idempotent duplicate.

### GREEN evidence

Focused service and deterministic concurrency tests:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: PASS, exit 0. 2 files passed; 34/34 tests passed.

Domain typecheck:

```text
corepack pnpm --filter @atlas/domain typecheck
```

Result: PASS, exit 0.

Sequential workspace typechecks:

```text
corepack pnpm -r --workspace-concurrency=1 --if-present run typecheck
```

Result: PASS, exit 0. Scope reported 11 of 12 workspace projects and all 11 TypeScript typechecks completed successfully.

Full suite, run once after focused and typecheck gates:

```text
corepack pnpm test
```

Result: PASS, exit 0. 36 files passed, 2 skipped; 441 tests passed, 5 skipped.

Whitespace gate:

```text
git diff --check
```

Result: PASS with no output.

### Corrections

- Ambiguous opt-out resolution now exposes only `normal_after_review` and the contact-policy version. It neither selects nor reports consent state/version, and the regression test proves consent history is unchanged.
- Dispatch reconciliation receipts now include the canonical binding. Reconciliation validates command-attempt ownership, binding, correlation, resource IDs, receipt currency, and authority before replay handling.
- Receipt dedupe now stores a canonical identity covering receipt ID, authority fields, source, binding, command, attempt, outcome, issued/expiry times, and correlation. Altered receipt-ID reuse fails closed.
- Distinct contradictory receipts are serialized by the canonical binding lock. Exactly one settles; the second returns `reconciliation_already_settled` without mutation. Identical replay remains a separate idempotent path.
- Outbound duplicate repository results expose stored command state and a durable failure/unresolved reason. The service accepts only queued duplicates, reports drafts/dispatching as in progress, reports unknown reconciliation work as recovery required, reports failures as unavailable, and does not rerun resolution or reactivate stored work.

### Files committed

- `blueprints/project-atlas/workspace/packages/domain/src/communications/repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/memory-repository.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/service.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-service.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts`

### Self-review

- Reviewed the complete Task 4 Fix Round 2 diff for public result honesty, receipt identity completeness, canonical lock ownership, mutation ordering, idempotency separation, deterministic interleaving, and scope containment.
- Confirmed no `any` widening, type suppression, defect-masking cast, timing loop, retry of unknown work, provider activation, WhatsApp-specific transcript/state store, merge, push, or deployment was introduced.
- Confirmed the commit contains only the five intended Task 4 code/test files. Existing untracked SDD artifacts were not staged.
- No material Fix Round 2 defect found. Controller-deferred minor findings remain outside this round by instruction.

### Concerns

- The workspace continues to warn that `package.json` requests Node `24.18.1` while validation ran on Node `24.19.0`; every requested command nevertheless exited 0.
- No additional implementation concern identified for the four Fix Round 2 findings.

## Fix Round 3/5 - 2026-08-20

### Status

PASS. The remaining Critical finding was closed with focused deterministic regression evidence and no production change. Commit: `4d037f87e2827972217eb8e0500b80b2dca56a20` (`test(communications): prove reconciliation pair ownership`).

### Regression evidence

This round was evidence-only against the accepted runtime, so no production RED failure was expected or observed. The new test passed on its first focused execution and proves:

- command A and command B each own a valid dispatch-unknown attempt;
- a structurally valid receipt naming command A with attempt B fails closed as `reconciliation_binding_mismatch`;
- the reverse command B with attempt A pairing fails identically;
- neither invalid pairing mutates either command or either attempt;
- neither invalid pairing enters a reconciliation binding lock;
- each rejected receipt ID remains unconsumed and later reconciles successfully on its canonical command-attempt pair;
- valid command A reconciliation locks `binding_1`, and valid command B reconciliation locks `binding_2`.

Focused repository/service and concurrency tests:

```text
corepack pnpm test tests/m004/communications-service.test.ts tests/m004/communications-concurrency.test.ts
```

Result: PASS, exit 0. 2 files passed; 35/35 tests passed.

Affected domain typecheck:

```text
corepack pnpm --filter @atlas/domain typecheck
```

Result: PASS, exit 0.

Full suite, run once:

```text
corepack pnpm test
```

Result: PASS, exit 0. 36 files passed, 2 skipped; 442 tests passed, 5 skipped.

Whitespace gate:

```text
git diff --check
```

Result: PASS with no output.

### Files committed

- `blueprints/project-atlas/workspace/tests/m004/communications-concurrency.test.ts`

### Scope and concerns

- No production code changed because the regression confirmed the accepted runtime behavior.
- No timing loop, subagent, reviewer, merge, push, deployment, provider activation, or out-of-worktree action was used.
- The workspace continues to warn that it requests Node `24.18.1` while validation ran on Node `24.19.0`; all requested gates exited 0.
- No open implementation concern was found for the remaining Critical finding.
