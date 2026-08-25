# M031 Controlled Bookkeeping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the internal, controlled bookkeeping workflow for M031 while retaining provider-disabled bank, accounting and tax boundaries.

**Architecture:** M031 will retain accounting facts in PostgreSQL through a Drizzle-owned schema and a server-only gateway. Domain services remain the source of ledger policy; the PostgreSQL repository makes idempotent, version-fenced commands atomic and writes minimal audit/outbox evidence in the same transaction. Admin and client projections use the existing dashboard session, context, epoch and no-store response patterns.

**Tech Stack:** TypeScript, Next.js 16, React 19, PostgreSQL, Drizzle ORM, postgres.js, Vitest, Biome.

## Global Constraints

- Drizzle remains the sole schema and migration authority.
- Store money only in integer USD minor units; never use floating point values.
- Posted journal entries are immutable; correction uses a controlled reversing entry.
- Every command revalidates actor, context, authorization epoch and policy epoch in the repository transaction.
- Financial records are private, are never included in URLs/analytics/log payloads, and responses use `Cache-Control: private, no-store`.
- Bank feeds, QuickBooks, Xero, tax filing, automated posting, tax-deductibility decisions and external posting stay disabled.
- Provider adapters must fail closed and no provider credential is added in this change.
- All sensitive mutations require CSRF validation; hard-close, reopening and export commands require the existing AAL2/step-up boundary.
- No production deployment, data migration from an external provider or real-client import is part of this plan.

---

### Task 1: M031 PostgreSQL schema and migration

**Files:**
- Create: `packages/database/src/schema/bookkeeping.ts`
- Modify: `packages/database/src/schema/index.ts`
- Modify: `packages/database/src/index.ts`
- Create: `drizzle/0038_m031_controlled_bookkeeping.sql`
- Test: `tests/m031/bookkeeping-schema.test.ts`

**Interfaces:**
- Produces `bookkeepingEngagements`, `accountingBooks`, `accountingPeriods`, `chartAccounts`, `financialAccountRegistry`, `sourceTransactions`, `journalEntries`, `journalEntryLines`, `reconciliationSessions`, `bookkeepingAuditEvents`, `bookkeepingOutbox`.
- Every client-scoped table carries `owner_account_id`, `context_ref`, `authorization_epoch`, `policy_epoch` and has RLS enabled.

- [ ] Write a failing SQL contract test asserting RLS, server-gateway role, immutable posted-entry trigger, integer money checks, idempotency uniqueness and no seed data.
- [ ] Run `corepack pnpm exec vitest run tests/m031/bookkeeping-schema.test.ts` and confirm it fails because migration `0038` is absent.
- [ ] Implement the Drizzle schema and migration with foreign keys, owner/context indexes, closed-period checks and server-only policies.
- [ ] Run the schema test and direct database typecheck; confirm they pass.

### Task 2: Durable bookkeeping repository

**Files:**
- Create: `packages/database/src/postgres-bookkeeping.ts`
- Modify: `packages/database/src/index.ts`
- Create: `tests/m031/bookkeeping-repository.test.ts`

**Interfaces:**
- Consumes `BookkeepingCommandActor { accountId, contextRef, authorizationEpoch, policyEpoch, assurance }`.
- Produces `PostgresBookkeepingGateway.createEngagement`, `createBook`, `registerFinancialAccount`, `importSourceTransaction`, `postJournalEntry`, `startReconciliation`, `requestPeriodClose`, `listAuthorizedBooks`.

- [ ] Write failing repository tests for owner/context/epoch predicates, advisory locking, idempotency receipt reuse and immutable posted entries.
- [ ] Run the repository test and confirm it fails because `PostgresBookkeepingGateway` is absent.
- [ ] Implement parameterized postgres.js queries that perform every mutation in `sql.begin`, lock command receipts and write minimal audit/outbox events.
- [ ] Run repository tests, direct package typecheck and the M031 package tests; confirm they pass.

### Task 3: Application domain command and query services

**Files:**
- Create: `packages/bookkeeping/src/service.ts`
- Create: `packages/bookkeeping/src/ports.ts`
- Modify: `packages/bookkeeping/src/index.ts`
- Create: `tests/m031/bookkeeping-service.test.ts`

**Interfaces:**
- Consumes repository ports, authorization receipts and command DTOs.
- Produces `BookkeepingCommandService` and `BookkeepingQueryService`; callers request named commands rather than arbitrary status or amount changes.

- [ ] Write failing tests that reject direct status mutation, unbalanced posting, stale version commands and provider-enabled commands.
- [ ] Run the service test and confirm it fails because the command/query services are absent.
- [ ] Implement command dispatch using existing M031 policy functions, explicit command names, expected versions and minimized client/admin DTOs.
- [ ] Run service tests and direct TypeScript checks; confirm they pass.

### Task 4: Configured runtime and API routes

**Files:**
- Create: `apps/app/src/lib/bookkeeping/runtime.ts`
- Create: `apps/app/src/app/api/admin/bookkeeping/route.ts`
- Create: `apps/app/src/app/api/client/bookkeeping/route.ts`
- Create: `apps/app/src/app/api/admin/bookkeeping/[bookRef]/close/route.ts`
- Create: `tests/m031/bookkeeping-http.test.ts`

**Interfaces:**
- Consumes `DASHBOARD_SESSION_COOKIE`, dashboard actor resolution, CSRF verification and `M031_BOOKKEEPING_ENABLED`.
- Produces fail-closed no-store endpoints that return `404` for unauthenticated or unauthorized access.

- [ ] Write failing HTTP tests for missing session, disabled runtime, stale CSRF, unauthorized context and private no-store headers.
- [ ] Run HTTP tests and confirm they fail because M031 routes are absent.
- [ ] Implement the configured runtime and route handlers; allow only internal controlled commands and retain provider endpoints disabled.
- [ ] Run HTTP tests and app typecheck; confirm they pass.

### Task 5: Admin and client workspace projections

**Files:**
- Create: `apps/app/src/app/admin/bookkeeping/page.tsx`
- Create: `apps/app/src/app/client/bookkeeping/page.tsx`
- Create: `packages/ui/src/bookkeeping-workspace.tsx`
- Modify: `packages/ui/src/index.ts`
- Create: `tests/m031/bookkeeping-workspace.test.tsx`

**Interfaces:**
- Consumes minimized `BookkeepingAdminDto` and `ClientBookkeepingSummaryDto`.
- Produces bilingual, keyboard-accessible, no-sensitive-detail workspace views with explicit empty, unavailable and review-required states.

- [ ] Write failing view tests for bilingual labels, empty/unavailable states, no provider CTA and no sensitive account or transaction data in client summaries.
- [ ] Run workspace tests and confirm they fail because the views are absent.
- [ ] Implement existing-design-system views and pages; use server-side loading and `notFound()` on unauthorized access.
- [ ] Run workspace tests, accessibility checks and app typecheck; confirm they pass.

### Task 6: Controlled close, export and audit operations

**Files:**
- Create: `packages/bookkeeping/src/audit.ts`
- Modify: `packages/bookkeeping/src/service.ts`
- Modify: `packages/database/src/postgres-bookkeeping.ts`
- Create: `tests/m031/bookkeeping-close-security.test.ts`

**Interfaces:**
- Consumes close checklist, reconciliation state, AAL2 receipt and export purpose.
- Produces versioned close requests, audit-only export requests and outbox events with no financial payload.

- [ ] Write failing tests for hard-close without AAL2, reopen without independent approval, export without MFA and audit event payload rejection.
- [ ] Run the security test and confirm it fails because durable close/audit operations are absent.
- [ ] Implement version-fenced close/reopen commands, minimum audit envelopes and export-request-only behavior.
- [ ] Run security tests, repository tests and M031 tests; confirm they pass.

### Task 7: Contract, migration and end-to-end verification

**Files:**
- Create: `tests/m031/bookkeeping-e2e.test.ts`
- Modify: `docs/modules/m031-bookkeeping-accounting.md`
- Modify: `docs/architecture/M031_BOOKKEEPING_PROVIDER_DISABLED_FOUNDATION.md`
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `DECISIONS.md`

**Interfaces:**
- Validates the sequence `setup -> source transaction -> reviewed proposal -> balanced post -> reconciliation -> close review -> tax-ready handoff`.
- Proves that every provider-facing action remains disabled.

- [ ] Write a failing end-to-end test with an in-memory gateway that exercises the controlled internal flow and verifies provider commands are rejected.
- [ ] Run the test and confirm it fails because the complete command sequence is absent.
- [ ] Implement only the missing command wiring needed for the sequence; do not add a provider adapter.
- [ ] Run focused M031 tests, schema contracts, Biome, direct typechecks and `git diff --check`; update documentation with exact evidence and remaining non-operational boundaries.

## Spec coverage review

This plan covers M031 Parts 1–4 for the controlled internal ledger: entities/books/accounts/periods, source transactions and reconciliation, close/report/tax handoff, and disabled integration/audit/administration boundaries. It intentionally excludes provider activation, bank credentials, QuickBooks/Xero synchronization, tax calculation or filing, payment initiation, external financial exports and production deployment because Decision 061 keeps those capabilities disabled.

## Execution mode

The Product Owner authorized inline execution. Work proceeds task-by-task with TDD in this isolated branch; each task requires focused verification before the next task starts.
