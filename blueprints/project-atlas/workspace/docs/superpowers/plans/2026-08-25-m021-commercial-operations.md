# M021 Commercial Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the provider-disabled M021A Service Order commercial core and M021B Marketplace core without activating external commerce, partners or operational execution.

**Architecture:** `@atlas/commercial-catalog` models immutable commercial configuration and deterministic price/eligibility decisions. `@atlas/commercial-workflows` separates commercial order state from operational state and protects approval/entitlement transitions. `@atlas/marketplace` keeps third-party products, disclosures, consent and safe redirects isolated from SG Solutions services.

**Tech Stack:** TypeScript, pnpm workspace packages, Zod validation, Drizzle/Postgres migration artifacts, Next.js App Router, React, Vitest and existing Atlas authorization/UI primitives.

**Spec:** `docs/architecture/M021_COMMERCIAL_OPERATIONS_DESIGN.md`

## Global Constraints

- Use integer minor units for every monetary value; browser totals are never authoritative.
- Published versions are immutable; orders retain configuration snapshots.
- All provider runtimes fail closed and make no external call by default.
- No Stripe, partner, payment, referral, data-sharing, AI, filing or workflow execution activation.
- No new canonical Person, Client, Organization, Lead, Payment, Consent, Task, CaseFile or Audit owner.
- UI copy is bilingual and does not claim a service, price, referral or approval is active.

---

### Task 1: Commercial catalog contracts and publication readiness

**Files:**
- Create: `packages/commercial-catalog/package.json`
- Create: `packages/commercial-catalog/src/contracts.ts`
- Create: `packages/commercial-catalog/src/validation.ts`
- Create: `packages/commercial-catalog/src/publication.ts`
- Create: `packages/commercial-catalog/src/index.ts`
- Test: `tests/m021/catalog-publication.test.ts`

**Interfaces:**
- Produces `parseCatalogDefinition`, `validatePublicationReadiness` and immutable `CatalogDefinition`/`CatalogVersion` types.
- Consumed by pricing, workflows, marketplace and Admin DTO routes.

- [ ] Write a failing test that accepts a complete bilingual draft but rejects a published service missing a workflow, disclosure, translations or price policy.
- [ ] Run `corepack pnpm exec vitest run tests/m021/catalog-publication.test.ts` and confirm it fails because the catalog package does not exist.
- [ ] Implement closed enums, stable codes, bounded text, immutable version fields and publication blocking errors.
- [ ] Run the same command and confirm it passes.
- [ ] Commit with `feat(m021): add catalog publication contracts`.

### Task 2: Deterministic pricing, availability and preliminary eligibility

**Files:**
- Create: `packages/commercial-catalog/src/pricing.ts`
- Create: `packages/commercial-catalog/src/eligibility.ts`
- Create: `packages/commercial-catalog/src/availability.ts`
- Test: `tests/m021/catalog-pricing-eligibility.test.ts`

**Interfaces:**
- Produces `calculateCatalogPrice(input, snapshot)`, `evaluateEligibility(input, rules)` and `evaluateAvailability(input, rules)`.
- Pricing input accepts codes and context only; result returns a versioned breakdown in USD minor units.

- [ ] Write failing tests for rejected frontend amounts, add-on dependency/incompatibility denial, non-stackable promotion handling, excluded-state availability and `potentially_eligible` output.
- [ ] Run `corepack pnpm exec vitest run tests/m021/catalog-pricing-eligibility.test.ts` and confirm expected failures.
- [ ] Implement integer-only calculation, version-bound breakdowns, allowlisted promotion rules and explicit preliminary eligibility explanations.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(m021): add deterministic commercial rules`.

### Task 3: Commercial workflows, approvals and entitlements

**Files:**
- Create: `packages/commercial-workflows/package.json`
- Create: `packages/commercial-workflows/src/contracts.ts`
- Create: `packages/commercial-workflows/src/state-machine.ts`
- Create: `packages/commercial-workflows/src/entitlements.ts`
- Create: `packages/commercial-workflows/src/events.ts`
- Create: `packages/commercial-workflows/src/index.ts`
- Test: `tests/m021/commercial-workflows.test.ts`

**Interfaces:**
- Produces `transitionCommercialOrder`, `grantEntitlement` and versioned `CommercialEvent` contracts.
- Consumes immutable catalog snapshots and an explicit actor/approval context.

- [ ] Write failing tests proving payment confirmation stops at `pending_internal_review`, invalid state jumps fail, duplicate commands are idempotent and a pending entitlement cannot grant staff permission.
- [ ] Run `corepack pnpm exec vitest run tests/m021/commercial-workflows.test.ts` and confirm expected failures.
- [ ] Implement the closed transition table, idempotency-key validation, approval gate and entitlement state rules.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(m021): add commercial workflow safeguards`.

### Task 4: Provider-disabled persistence and owner-port boundaries

**Files:**
- Create: `drizzle/0038_m021_commercial_foundation.sql`
- Create: `packages/database/src/m021-commercial-repository.ts`
- Create: `packages/commercial-workflows/src/ports.ts`
- Create: `packages/marketplace/src/ports.ts`
- Test: `tests/m021/commercial-persistence-boundary.test.ts`

**Interfaces:**
- Produces migration artifacts and repositories that store versioned commercial facts/outbox records only through narrow interfaces.
- Does not run a migration or activate a runtime provider.

- [ ] Write failing tests proving no repository accepts client-provided prices, partner URLs, payment states or unrestricted owner identifiers.
- [ ] Run `corepack pnpm exec vitest run tests/m021/commercial-persistence-boundary.test.ts` and confirm expected failures.
- [ ] Implement `schema/commercial.ts`, `postgres-commercial-repository.ts` and the `0038_m021_commercial_foundation.sql` migration artifact with immutable snapshots, authorization fences, outbox/inbox identifiers and provider-disabled defaults.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(m021): add commercial persistence boundaries`.

### Task 5: Marketplace contracts and safe referral handoff

**Files:**
- Create: `packages/marketplace/package.json`
- Create: `packages/marketplace/src/contracts.ts`
- Create: `packages/marketplace/src/referrals.ts`
- Create: `packages/marketplace/src/providers.ts`
- Create: `packages/marketplace/src/index.ts`
- Test: `tests/m021/marketplace-referrals.test.ts`

**Interfaces:**
- Produces `createReferralDraft`, `createSafePartnerRedirect` and `MarketplacePartnerProvider`.
- Consumes active partner/product/disclosure/consent evidence from ports; default adapter is disabled.

- [ ] Write failing tests for third-party labeling, disclosure/consent requirement, revoked grant denial, allowlisted HTTPS redirect and unknown external status.
- [ ] Run `corepack pnpm exec vitest run tests/m021/marketplace-referrals.test.ts` and confirm expected failures.
- [ ] Implement closed product/status enums, data-minimization declarations, opaque references and a disabled provider adapter.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(m021): add safe marketplace contracts`.

### Task 6: Admin-safe application integration

**Files:**
- Modify: `apps/app/package.json`
- Create: `apps/app/src/lib/commercial/configured-runtime.ts`
- Create: `apps/app/src/lib/marketplace/configured-runtime.ts`
- Create: `apps/app/src/app/admin/commercial/page.tsx`
- Create: `apps/app/src/app/admin/marketplace/page.tsx`
- Create: `apps/app/src/app/api/admin/commercial/route.ts`
- Create: `apps/app/src/app/api/admin/marketplace/route.ts`
- Modify: `packages/ui/src/...` only for focused bilingual provider-disabled panels
- Test: `tests/m021/commercial-admin-routes.test.ts`

**Interfaces:**
- Produces permission-fenced Admin read DTOs and unavailable-by-default runtime responses.
- Reuses M007 auth evidence and M016 Admin shell; does not create a parallel admin application.

- [ ] Write failing tests for anonymous denial, insufficient permission denial, no provider activation and bilingual unavailable states.
- [ ] Run `corepack pnpm exec vitest run tests/m021/commercial-admin-routes.test.ts` and confirm expected failures.
- [ ] Add workspace dependencies, configured runtimes, server routes and responsive accessible panels.
- [ ] Run the focused test and confirm it passes.
- [ ] Commit with `feat(m021): add provider-disabled commercial admin surfaces`.

### Task 7: Documentation, catalog reconciliation and audit coverage

**Files:**
- Create: `docs/modules/m021-commercial-operations.md`
- Modify: `PROJECT_CONTEXT.md`
- Modify: `ARCHITECTURE.md`
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `DECISIONS.md`
- Modify: `docs/roadmap/MODULE_CATALOG.md`
- Modify: `docs/runbooks/PROVIDER_AND_FUTURE_CONNECTIONS.md`
- Test: `tests/m021/commercial-contracts-audit.test.ts`

**Interfaces:**
- Documents M021A/M021B ownership, provider gates, prohibited AI actions and explicit split from M020 Leads.

- [ ] Write failing audit tests for no hardcoded prices, no active provider, no open redirect, no automatic service start and no AI critical mutation tool.
- [ ] Run `corepack pnpm exec vitest run tests/m021/commercial-contracts-audit.test.ts` and confirm expected failures.
- [ ] Update canonical documentation and provider inventory with the approved numbering decision and implementation evidence.
- [ ] Run the focused audit test and confirm it passes.
- [ ] Commit with `docs(m021): record commercial operations foundation`.

### Task 8: Module verification and independent review handoff

**Files:**
- Create: `docs/reviews/M021-ARCHITECTURE-REVIEW.md`
- Create: `docs/reviews/M021-SECURITY-REVIEW.md`

- [ ] Run `corepack pnpm exec vitest run tests/m021`.
- [ ] Run `corepack pnpm typecheck`.
- [ ] Run `corepack pnpm lint` and `corepack pnpm format:check`.
- [ ] Run `git diff --check`.
- [ ] Record exact evidence, limitations, provider-disabled status and Product Owner acceptance gap in the reviews.
- [ ] Commit with `docs(m021): record verification evidence`.
