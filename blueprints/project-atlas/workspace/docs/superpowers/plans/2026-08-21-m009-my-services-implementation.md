# M009 Mis Servicios - Provider-disabled implementation plan

- Architect: Codex Architecture Agent
- Implementer: separate Superpowers implementation agent
- Security auditor: read-only Cyber Neo
- Base: accepted M008 `09c9403`
- Worktree: `D:\SG Solutions\SG Solutions\.worktrees\m009-my-services`
- Branch: `codex/m009-my-services-rebuild`
- Gate: Decision 040 and ADR 013
- Execution: sequential TDD; no M010 until Product Owner accepts M009

## 1. Non-negotiable constraints

- Reuse `/client`, `/client/services`, M007 and M008; no second portal or dashboard.
- No real/seeded service definitions, service orders, clients, cases, prices, milestones or partners.
- Synthetic state exists only in `tests/m009`.
- Configured service and child-owner ports remain unavailable during this gate.
- No POST/PATCH/DELETE service endpoint and no payment/workflow/provider command.
- No browser database/provider access, arbitrary URL, shared personalized cache or sensitive telemetry.
- Do not open M010 until M009 implementation, focused verification, independent architecture review,
  Cyber Neo review, documentation closure and Product Owner acceptance are complete.

## 2. Exact proposed file manifest

### New domain/application package

- `packages/client-services/package.json`
- `packages/client-services/tsconfig.json`
- `packages/client-services/src/index.ts`
- `packages/client-services/src/contracts.ts`
- `packages/client-services/src/authorization.ts`
- `packages/client-services/src/status-policy.ts`
- `packages/client-services/src/ports.ts`
- `packages/client-services/src/query-service.ts`
- `packages/client-services/src/serialization.ts`
- `packages/client-services/src/cache.ts`

### Database contracts

- `packages/database/src/schema/client-services.ts`
- `packages/database/src/postgres-client-services.ts`
- `drizzle/0037_m009_client_services.sql`
- `packages/database/src/schema/index.ts` (modify exports only)
- `packages/database/src/schema.ts` (modify exports only)
- `packages/database/src/index.ts` (modify exports only if required by existing convention)

### Next.js composition

- `apps/app/src/lib/client-services/configured-runtime.ts`
- `apps/app/src/lib/client-services/auth-adapter.ts`
- `apps/app/src/lib/client-services/postgres-repository.ts`
- `apps/app/src/lib/client-services/http.ts`
- `apps/app/src/lib/client-services/admission.ts`
- `apps/app/src/lib/client-services/page-context.ts`
- `apps/app/src/lib/client-services/dashboard-adapter.ts`
- `apps/app/src/app/api/client/services/route.ts`
- `apps/app/src/app/api/client/services/[serviceRef]/route.ts`
- `apps/app/src/app/client/services/page.tsx` (replace placeholder)
- `apps/app/src/app/client/services/loading.tsx`
- `apps/app/src/app/client/services/error.tsx`
- `apps/app/src/app/client/services/[serviceRef]/page.tsx`
- `apps/app/src/lib/dashboard/configured-runtime.ts` (inject M009 summary port only)
- `apps/app/src/lib/dashboard/owner-ports.ts` (preserve all non-service unavailable ports)
- `apps/app/package.json` (add workspace dependency only)

### UI, language and observability

- `packages/ui/src/client-services/ClientServicesDirectory.tsx`
- `packages/ui/src/client-services/ClientServiceCard.tsx`
- `packages/ui/src/client-services/ClientServiceDetail.tsx`
- `packages/ui/src/client-services/ClientServiceStates.tsx`
- `packages/ui/src/client-services/ClientServiceFilters.tsx`
- `packages/ui/src/index.ts` (exports only)
- `packages/i18n/src/client-services.ts`
- `packages/i18n/src/index.ts` (exports only)
- `packages/observability/src/client-services.ts`
- `packages/observability/src/index.ts` (exports only)

### Focused tests and dependency metadata

- `tests/m009/vitest.config.mjs`
- `tests/m009/fixtures.ts`
- `tests/m009/client-services-contracts.test.ts`
- `tests/m009/client-services-status-policy.test.ts`
- `tests/m009/client-services-authorization.test.ts`
- `tests/m009/client-services-query.test.ts`
- `tests/m009/client-services-http.test.ts`
- `tests/m009/client-services-runtime.test.ts`
- `tests/m009/client-services-dashboard-adapter.test.ts`
- `tests/m009/client-services-ui.test.ts`
- `tests/m009/client-services-security.integration.test.ts`
- `tests/m009/client-services-schema.test.ts`
- `pnpm-lock.yaml` (workspace importer only; no new external dependency expected)

### Closure documentation after implementation

- `docs/reviews/M009-ARCHITECTURE-IMPLEMENTATION-REVIEW.md`
- external Cyber Neo report under ignored `.worktrees/reports/`
- `docs/phases/M009-PHASE-COMPLETION-REPORT.md`
- `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `ROADMAP.md`, `DECISIONS.md`

No other file is in scope without Architecture Agent approval.

## 3. Sequential build order

### T1 - Package contracts and strict parsing

Files: `packages/client-services/package.json`, `tsconfig.json`, `src/contracts.ts`, `src/ports.ts`,
`src/serialization.ts`, `src/index.ts`, contract tests and lockfile importer.

WHEN list/detail/owner input contains an unknown field, internal identifier, arbitrary URL or
oversized collection, THE SYSTEM SHALL reject it or omit it before serialization.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-contracts.test.ts`

Checkpoint: strict DTOs and closed envelopes only; no repository or UI.

### T2 - Deterministic state and next-step policy

Files: `src/status-policy.ts`, status-policy tests and synthetic fixtures.

WHEN commercial, financial, activation and fulfillment subfacts are supplied, THE SYSTEM SHALL map
them deterministically without treating paid as approved/started; unknown/conflicting input SHALL
return unconfirmed.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-status-policy.test.ts`

Checkpoint: policy version is explicit; no real service type or copy is introduced.

### T3 - Authorization snapshot and query orchestration

Files: `src/authorization.ts`, `src/query-service.ts`, authorization/query tests.

WHEN a list/detail query runs, THE SYSTEM SHALL reuse an M008-compatible M007 snapshot, require
`client.service.read` plus an explicit active resource grant and revalidate all identity/context/
grant/entitlement/resource epochs before returning any body or metadata.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-authorization.test.ts tests/m009/client-services-query.test.ts`

Checkpoint: delayed-port revocation and hidden-resource counts/cursors are covered.

### T4 - Unseeded schema, RLS and repository contracts

Files: database schema/repository files, migration `0037`, schema tests and exports.

WHEN migration/schema contracts are inspected, THE SYSTEM SHALL define version-bound service roots,
explicit grants and append-only public history with forced RLS, restricted functions and no seed or
provider data.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-schema.test.ts`

Checkpoint: migration is generated/reviewed but not applied to live PostgreSQL in this gate.

### T5 - Fail-closed app runtime, HTTP and SSR admission

Files: `apps/app/src/lib/client-services/**`, both API GET routes, HTTP/runtime tests.

WHEN runtime lacks an explicitly injected approved service source, THE SYSTEM SHALL return
provider-disabled/unavailable; guessed service refs SHALL produce generic not-found and all
responses SHALL be private no-store.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-http.test.ts tests/m009/client-services-runtime.test.ts`

Checkpoint: no configured provider/Postgres activation flag and no mutation endpoint.

### T6 - M008 services-owner adapter

Files: dashboard adapter plus the two narrow M008 app wiring modifications and adapter tests.

WHEN M009 supplies a fresh authorized summary, THE SYSTEM SHALL map no more than the existing M008
service limit; WHEN M009 is unavailable/stale, THE SYSTEM SHALL preserve that state and SHALL NOT
report empty.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-dashboard-adapter.test.ts`

Checkpoint: `@atlas/dashboard` contracts remain unchanged unless an architect-approved correction
is unavoidable.

### T7 - ES/EN accessible directory UI

Files: directory/card/filter/state UI, i18n module/exports and `/client/services` page/loading/error.

WHEN the directory renders in either locale, THE SYSTEM SHALL preserve the portal shell, distinguish
contracted services from catalog links and provide keyboard-readable complete/empty/partial/
unavailable states without fabricated cards.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-ui.test.ts`

Checkpoint: synthetic visual states are test fixtures only.

### T8 - ES/EN accessible detail UI

Files: detail UI and `/client/services/[serviceRef]/page.tsx`; extend UI/security tests.

WHEN an authorized detail renders, THE SYSTEM SHALL show separate payment/approval/fulfillment facts,
one deterministic next step and real named milestones while each unavailable child remains explicit.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-ui.test.ts tests/m009/client-services-security.integration.test.ts`

Checkpoint: related actions only navigate to allowlisted owning routes.

### T9 - Metadata-only observability and complete focused security matrix

Files: observability module/exports and security integration tests.

WHEN M009 emits an operational event, THE SYSTEM SHALL include only allowlisted operation/outcome/
version/latency buckets and no identity, context, service, count, amount, date, URL or free text.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs tests/m009/client-services-security.integration.test.ts`

Checkpoint: product analytics remains disabled.

### T10 - Focused verification, independent audits and closure

Files: review/PCR/state/memory/roadmap/decision documents only after implementation evidence exists.

WHEN T1-T9 are complete, THE SYSTEM SHALL pass the focused M009 suite and affected typechecks, then
receive an independent architecture review and read-only Cyber Neo review with every material
finding corrected and retested before Product Owner acceptance is requested.

Verify: `corepack pnpm exec vitest run --config tests/m009/vitest.config.mjs && corepack pnpm --filter @atlas/client-services typecheck && corepack pnpm --filter @atlas/database typecheck && corepack pnpm --filter @atlas/app typecheck && corepack pnpm --filter @atlas/ui typecheck && corepack pnpm --filter @atlas/i18n typecheck && corepack pnpm --filter @atlas/observability typecheck`

Checkpoint: report focused evidence honestly; do not claim live DB, provider, full-suite, deploy or
Operational validation unless separately executed and authorized.

## 4. Required negative tests

- cross-account, cross-context and membership-only service access;
- email/phone/contact/payment/participant/entitlement-only privilege attempts;
- guessed opaque reference and filter/cursor hidden-count inference;
- session, context, grant, entitlement, policy and resource-epoch revocation during assembly;
- root reparenting, visibility change, tombstone, accepted-version change and child inheritance deny;
- paid plus pending review/no case; cancellation/refund/dispute combinations;
- stale/unavailable child converted incorrectly to zero/complete/no-action;
- internal field, provider payload, object key, signed URL or arbitrary route injection;
- personalized cache headers/browser persistence and telemetry leakage;
- synthetic fixture accidentally reachable from configured runtime.

## 5. Rollback

Each task is additive and checkpointed. Before Product Owner merge approval, rollback means removing
the isolated M009 branch/worktree only; accepted M008 `09c9403` remains unchanged. Migration `0037`
must be forward-only and unapplied in this gate. If later applied in an authorized disposable
environment, rollback uses a separately reviewed compensating migration, never destructive ad hoc
SQL.

## 6. Completion boundary

Passing focused tests is implementation evidence, not independent approval. M009 completes only
after architecture and Cyber Neo reviews close, documentation is synchronized, no secrets/data were
added, Product Owner accepts the provider-disabled scope, and the authorized commit is pushed. It
does not authorize M010, merge, deployment, provider activation or production release.
