# Task 3 Report: Validation, bilingual safe-copy contracts and deterministic channel policy

## Scope

- Worktree: `D:\SG Solutions\SG Solutions\.worktrees\m004-whatsapp-recovery`
- Branch: `codex/m004-whatsapp-recovery`
- Base: `70179d3d1b616c13f80ac044d833115f55b0d7a7`
- Implementation commit: `ee500b8f210fe8772868c44fd6a310e901d72b81`

## RED evidence

- `corepack pnpm exec vitest run tests/m004/whatsapp-validation.test.ts tests/m004/channel-policy.test.ts`
  initially failed as intended because the WhatsApp validator/export and channel-policy module did not exist.
- The hardening RED cycle reported 3 expected failures: missing canonical timestamp was accepted, partial
  bilingual copy could resolve, and a mismatched injected lexicon version could request withdrawal.

## GREEN evidence

- Focused suite: `corepack pnpm exec vitest run tests/m004/whatsapp-validation.test.ts tests/m004/channel-policy.test.ts`
  passed: 2 files, 33 tests.
- `corepack pnpm --filter @atlas/validation typecheck` passed.
- `corepack pnpm --filter @atlas/domain typecheck` passed.

## Full-suite evidence

- `corepack pnpm test` passed: 34 files passed, 2 skipped; 400 tests passed, 5 skipped.

## Files

- `blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts`
- `blueprints/project-atlas/workspace/packages/validation/src/index.ts`
- `blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts`
- `blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts`
- `blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts`

## Self-review

- Protected input is never interpolated into validation errors or policy decisions; rejection results are
  fixed codes only.
- NFKC is used only for unsafe-control detection before the existing prohibited-content inspection.
- Runtime safe copy is empty and cannot resolve incomplete bilingual catalogs.
- Runtime opt-out matching remains disabled without a WA-004 policy and exact injected lexicon-version match.
- Marketing is denied first; outbound authorization requires current consent and owning-domain receipts,
  binding revalidation/freshness, policy version/fence, active connection, eligible template, and matching
  destination key.
- Authority-changing operations require current, typed identity or consent receipts. Ambiguous opt-out never
  mutates consent and routes to manual review.
- The implementation commit includes only the five Task 3 source and test files listed above. No provider,
  activation, merge, push, deployment, production copy, or runtime opt-out commands were added.

## Concerns

- The toolchain emits an engine warning because the workspace requests Node `24.18.1` while this run used
  Node `24.19.0`; all recorded checks still passed.
- Approved production WA-004 lexicon/copy content is intentionally absent. Runtime remains fail-closed until
  the owning policy authority supplies it.
