# M007 Authentication and Client Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single provider-disabled SG Solutions client identity, account, session and authorization foundation without activating external providers.

**Architecture:** Expand `@atlas/auth` as the sole IAM bounded context. Supabase Auth remains credential/provider authority; Postgres owns account/application-session/access state; Next.js mediates all browser traffic; domain owner ports and forced RLS enforce resource access.

**Tech Stack:** Existing pinned Node 24.18.1, pnpm 11.18.0, TypeScript 6.0.3, Next.js App Router, React, Supabase JS, Zod, Drizzle/Postgres, Vitest, Radix UI/Tailwind.

## Global Constraints

- Work only in `D:\SG Solutions\worktrees\m007-auth-account` on `codex/m007-auth-account-rebuild`.
- Application root is `blueprints/project-atlas/workspace`.
- Execute tasks sequentially. Obtain architecture and Cyber Neo review before closure.
- Keep `AUTH_RUNTIME_STATE=disabled` by default. No network, live provider, credentials or deploy.
- Do not create a second user model or local password hash. Supabase Auth is credential authority.
- Passwords, OTPs, OAuth codes, tokens and cookies never enter logs, analytics, fixtures or snapshots.
- Browser state contains only an opaque host-only HttpOnly application-session handle.
- Backend authorization requires permission plus current resource/organization relationship.
- Owner/provider uncertainty fails closed. Synthetic adapters are test-only.
- ES/EN copy is externalized and all UI is keyboard/screen-reader/mobile accessible.
- Use focused tests and affected package typechecks only during tasks; do not run broad suites by default.

## File map

- `packages/auth/src/*`: canonical identity/account/session/authorization domain.
- `packages/config/src/auth.ts`: fail-closed provider-disabled configuration.
- `packages/validation/src/auth.ts`: bounded public/admin DTO schemas.
- `packages/database/src/schema/auth.ts`: Drizzle IAM schema and RLS declarations.
- `packages/database/src/auth-repository.ts`: Postgres repositories and transaction fences.
- `apps/app/src/lib/auth/*`: runtime composition and authoritative facade.
- `apps/app/src/app/client/*`: bilingual auth, portal security and settings UI.
- `apps/app/src/app/admin/users/*`: authorized user administration.
- `apps/app/src/app/api/auth/*`: same-origin route handlers.
- `packages/i18n/src/auth.ts` and `packages/ui/src/auth/*`: bilingual copy and accessible components.
- `packages/observability/src/auth.ts`: allowlisted metadata-only events.
- `tests/m007/*`: focused unit, integration, RLS, UI and security contracts.

### Task 1: Canonical contracts, configuration and secret-safe primitives

**Files:**
- Create: `packages/auth/src/contracts.ts`
- Create: `packages/auth/src/crypto.ts`
- Create: `packages/auth/src/providers.ts`
- Create: `packages/auth/src/disabled-provider.ts`
- Create: `packages/config/src/auth.ts`
- Create: `packages/validation/src/auth.ts`
- Test: `tests/m007/auth-contracts.test.ts`
- Modify: `packages/auth/src/index.ts`, `packages/config/src/index.ts`, `packages/validation/src/index.ts`, package manifests only for workspace dependencies actually consumed

**Interfaces:**
- Produces `AuthAccountStatus`, `AuthenticationLevel`, `IdentityProvider`, `MfaProvider`, `AuthRuntimeConfig`, `digestOpaqueProof`, `hmacIdentifier` and bounded request parsers.
- No interface accepts a role, permission, verification fact or price from browser input.

- [ ] **Step 1: Write failing contract tests**

```ts
expect(parseLoginRequest({ email: " USER@example.com ", password: "secret" }).email)
  .toBe("user@example.com");
expect(() => parseLoginRequest({ email: "x", password: "p", role: "Owner" }))
  .toThrow();
expect(disabledIdentityProvider.signInWithPassword(command))
  .resolves.toEqual({ kind: "unavailable", reason: "provider_disabled" });
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `corepack pnpm vitest run tests/m007/auth-contracts.test.ts`
Expected: FAIL because M007 contracts and parsers do not exist.

- [ ] **Step 3: Implement minimal contracts and disabled adapters**

Define closed unions for account/session/link/provider states, provider ports, no-secret DTOs,
purpose-separated HMAC/digest helpers and a config parser that defaults to disabled and rejects
enabled composition without explicit canonical origin, key references and provider settings.

- [ ] **Step 4: Run focused GREEN and affected typechecks**

Run: `corepack pnpm vitest run tests/m007/auth-contracts.test.ts && corepack pnpm --filter @atlas/auth typecheck && corepack pnpm --filter @atlas/validation typecheck`
Expected: PASS with no provider/network call.

- [ ] **Step 5: Commit**

```bash
git add packages/auth packages/config packages/validation tests/m007/auth-contracts.test.ts
git commit -m "feat(auth): define M007 identity contracts"
```

### Task 2: Drizzle schema, repositories and forced-RLS boundary

**Files:**
- Create: `packages/database/src/schema/auth.ts`
- Create: `packages/database/src/auth-repository.ts`
- Create: `tests/m007/auth-schema.test.ts`
- Create: `tests/m007/auth-repository.test.ts`
- Create: `tests/m007/auth-rls-regression.test.ts`
- Generate: `drizzle/0023_m007_auth_account.sql` and `drizzle/meta/0023_snapshot.json`
- Create forward hardening migration if generation cannot express forced RLS: `drizzle/0024_m007_auth_rls_hardening.sql`
- Modify: `packages/database/src/schema/index.ts`, `packages/database/src/index.ts`, `packages/database/package.json`

**Interfaces:**
- Consumes Task 1 states.
- Produces `AuthRepository` operations for accounts, identities, links, sessions, vault records,
  transactions, proofs, invitations, RBAC, organizations, MFA projections, service accounts, rate
  buckets, immutable security events and durable outbox.

- [ ] **Step 1: Write failing schema/repository tests**

```ts
expect(authTables).toContain("auth_accounts");
expect(authTables).not.toContain("auth_local_credentials");
await expect(repository.consumeProofTwice(proof)).resolves.toEqual([
  { kind: "consumed" },
  { kind: "replay_denied" },
]);
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-schema.test.ts tests/m007/auth-repository.test.ts tests/m007/auth-rls-regression.test.ts`
Expected: FAIL because schema/repository and restricted-role policies are absent.

- [ ] **Step 3: Implement schema and atomic repository**

Add constrained `auth_*` tables, optimistic versions, unique provider subject, keyed token digests,
session family/generation CAS, immutable event sequence, outbox leases and exact indexes. Enable and
force RLS. Restrict runtime roles and derive transaction-local context only from validated sessions.

- [ ] **Step 4: Generate migrations**

Run: `corepack pnpm db:generate -- --name m007_auth_account`
Expected: next Drizzle migration and metadata represent only M007 schema changes. Add a forward
hardening migration only for FORCE RLS/grants not emitted by Drizzle; never edit old migrations.

- [ ] **Step 5: Run focused GREEN and database typecheck**

Run: `corepack pnpm vitest run tests/m007/auth-schema.test.ts tests/m007/auth-repository.test.ts tests/m007/auth-rls-regression.test.ts && corepack pnpm --filter @atlas/database typecheck`
Expected: PASS; forged actor GUC, inactive session and cross-account reads are denied in contracts.

- [ ] **Step 6: Commit**

```bash
git add packages/database drizzle tests/m007/auth-schema.test.ts tests/m007/auth-repository.test.ts tests/m007/auth-rls-regression.test.ts
git commit -m "feat(auth): add M007 persistence and RLS"
```

### Task 3: Account lifecycle, invitations and CRM linking conflicts

**Files:**
- Create: `packages/auth/src/account-service.ts`
- Create: `packages/auth/src/invitations.ts`
- Create: `packages/auth/src/party-linking.ts`
- Create: `packages/auth/src/memory-repository.ts`
- Test: `tests/m007/account-lifecycle.test.ts`
- Test: `tests/m007/account-linking.test.ts`
- Modify: `packages/auth/src/index.ts`

**Interfaces:**
- Produces `AccountService.registerProspect`, `InvitationService.issue/accept/revoke`,
  `PartyResolutionPort.resolve` and `AccountPartyLinkDecision`.
- Strong owner receipts may link; partial/conflict/unavailable outcomes grant no protected access.

- [ ] **Step 1: Write failing lifecycle/link tests**

```ts
expect((await service.registerProspect(command)).resourceGrants).toEqual([]);
expect(await linking.resolve(conflictingEvidence)).toEqual({ kind: "manual_review" });
expect(await invitations.consume(scannerGetAttempt)).toEqual({ kind: "inert" });
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/account-lifecycle.test.ts tests/m007/account-linking.test.ts`
Expected: FAIL because lifecycle and owner-link policy are absent.

- [ ] **Step 3: Implement minimal lifecycle and owner ports**

Implement versioned states, scanner-safe invitations, exact one-time POST consumption, limited
prospect accounts, owner-issued relationship receipts and conflict preservation. Do not create or
merge CRM records.

- [ ] **Step 4: Run focused GREEN**

Run: `corepack pnpm vitest run tests/m007/account-lifecycle.test.ts tests/m007/account-linking.test.ts && corepack pnpm --filter @atlas/auth typecheck`
Expected: PASS with no protected grant from registration, email or phone match.

- [ ] **Step 5: Commit**

```bash
git add packages/auth tests/m007/account-lifecycle.test.ts tests/m007/account-linking.test.ts
git commit -m "feat(auth): add account and CRM linking lifecycle"
```

### Task 4: Application sessions, cookies, CSRF, password flows and recovery

**Files:**
- Create: `packages/auth/src/session-service.ts`
- Create: `packages/auth/src/password-flows.ts`
- Create: `packages/auth/src/one-time-proofs.ts`
- Create: `apps/app/src/lib/auth/cookies.ts`
- Test: `tests/m007/auth-session.test.ts`
- Test: `tests/m007/auth-password-recovery.test.ts`
- Test: `tests/m007/auth-csrf.test.ts`
- Modify: `packages/auth/src/index.ts`

**Interfaces:**
- Produces `ApplicationSessionService.establish/refresh/revoke/revokeOthers`,
  `PasswordFlowService.signIn/requestRecovery/completeRecovery` and `assertSameOriginCsrf`.

- [ ] **Step 1: Write failing session/security tests**

```ts
expect(cookie.serialize()).toContain("__Host-atlas_auth=");
expect(cookie.serialize()).toContain("HttpOnly");
expect(cookie.serialize()).toContain("Secure");
expect(await refresh(reusedGeneration)).toEqual({ kind: "family_revoked" });
expect(await requestRecovery(knownEmail)).toEqual(await requestRecovery(unknownEmail));
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-session.test.ts tests/m007/auth-password-recovery.test.ts tests/m007/auth-csrf.test.ts`
Expected: FAIL because session, neutral recovery and CSRF code do not exist.

- [ ] **Step 3: Implement opaque session and password-provider orchestration**

Implement pre-auth binding, login rotation, keyed handle storage, encrypted provider-vault port,
family/generation CAS, idle/absolute policy injection, revocation, exact Origin/CSRF checks, neutral
login/recovery results and provider-disabled email/password outcomes. Never store a password hash.

- [ ] **Step 4: Run focused GREEN and typecheck**

Run: `corepack pnpm vitest run tests/m007/auth-session.test.ts tests/m007/auth-password-recovery.test.ts tests/m007/auth-csrf.test.ts && corepack pnpm --filter @atlas/auth typecheck`
Expected: PASS; no token is returned to browser DTOs.

- [ ] **Step 5: Commit**

```bash
git add packages/auth apps/app/src/lib/auth/cookies.ts tests/m007/auth-session.test.ts tests/m007/auth-password-recovery.test.ts tests/m007/auth-csrf.test.ts
git commit -m "feat(auth): add opaque sessions and recovery"
```

### Task 5: Google OAuth transaction and identity-link reconciliation

**Files:**
- Create: `packages/auth/src/oauth-transactions.ts`
- Create: `packages/auth/src/supabase-provider.ts`
- Create: `packages/auth/src/identity-linking.ts`
- Test: `tests/m007/auth-oauth.test.ts`
- Test: `tests/m007/auth-identity-link.test.ts`
- Modify: `packages/auth/src/index.ts`, `packages/auth/package.json` only if an existing workspace pin is required

**Interfaces:**
- Produces `OAuthTransactionService.begin/consume`,
  `SupabaseIdentityProvider.beginGoogle/completeGoogle` and
  `IdentityLinkService.link/reconcile/unlink`.

- [ ] **Step 1: Write failing OAuth/reconciliation tests**

```ts
expect(await callback({ ...valid, state: "wrong" })).toEqual({ kind: "denied" });
expect(await callback(validTwice)).toEqual({ kind: "replay_denied" });
expect(await link(providerAutoLinkedWithoutLocalRecord)).toEqual({ kind: "reconciling" });
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-oauth.test.ts tests/m007/auth-identity-link.test.ts`
Expected: FAIL because state/nonce/PKCE and link-operation fences are absent.

- [ ] **Step 3: Implement provider-disabled official adapter boundary**

Bind provider, purpose, exact callback, canonical return intent, browser/session, state, nonce, PKCE
reference, issuer/audience verification outcome, provider subject, expiry and CAS version. Keep live
network disabled; synthetic responses must be signed by the test adapter and production composition
must reject it.

- [ ] **Step 4: Run focused GREEN**

Run: `corepack pnpm vitest run tests/m007/auth-oauth.test.ts tests/m007/auth-identity-link.test.ts && corepack pnpm --filter @atlas/auth typecheck`
Expected: PASS with substitution, replay, stale callback and ambiguous provider result denied.

- [ ] **Step 5: Commit**

```bash
git add packages/auth tests/m007/auth-oauth.test.ts tests/m007/auth-identity-link.test.ts
git commit -m "feat(auth): add Google OAuth and identity linking"
```

### Task 6: RBAC, resource/organization authorization, step-up, MFA and service accounts

**Files:**
- Create: `packages/auth/src/authorization.ts`
- Create: `packages/auth/src/step-up.ts`
- Create: `packages/auth/src/mfa.ts`
- Create: `packages/auth/src/service-identities.ts`
- Test: `tests/m007/auth-authorization.test.ts`
- Test: `tests/m007/auth-idor.test.ts`
- Test: `tests/m007/auth-mfa-service.test.ts`
- Modify: `packages/auth/src/index.ts`
- Modify later in this task: `apps/app/src/lib/voice/service-auth.ts` to delegate without changing its exported protocol

**Interfaces:**
- Produces `AuthorizationService.authorize`, `StepUpService.begin/consume`,
  `MfaService.beginEnrollment/challenge/remove` and `ServiceIdentityVerifier.verify`.

- [ ] **Step 1: Write failing authorization/IDOR tests**

```ts
expect(await authorize(clientA, "client.case.read", caseB)).toEqual({ kind: "denied" });
expect(await authorize(ownerRoleFromBrowser, "admin.user.manage", target)).toEqual({ kind: "denied" });
expect(await mfa.challenge(disabledProvider)).toEqual({ kind: "unavailable" });
expect(await serviceIdentity.verify(overScopedToken)).toEqual({ kind: "denied" });
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-authorization.test.ts tests/m007/auth-idor.test.ts tests/m007/auth-mfa-service.test.ts`
Expected: FAIL because authorization, MFA and canonical service verification are absent.

- [ ] **Step 3: Implement backend policy and compatibility adapter**

Require active session/account, exact permission scope, owner-issued party/resource/organization
receipt, entitlement when applicable, assurance and final access-epoch fence. Implement one-time
step-up, internal `aal2` policy, disabled MFA/passkey ports and exact service scopes. Adapt M005 to
call the canonical verifier while preserving existing callers.

- [ ] **Step 4: Run focused GREEN and affected typechecks**

Run: `corepack pnpm vitest run tests/m007/auth-authorization.test.ts tests/m007/auth-idor.test.ts tests/m007/auth-mfa-service.test.ts tests/m005/voice-facade.test.ts && corepack pnpm --filter @atlas/auth typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS; no UI/middleware-only permission and no M005 protocol regression.

- [ ] **Step 5: Commit**

```bash
git add packages/auth apps/app/src/lib/voice/service-auth.ts tests/m007 tests/m005/voice-facade.test.ts
git commit -m "feat(auth): enforce M007 authorization and service identity"
```

### Task 7: Next.js authoritative facade, route handlers and fail-closed owner adapters

**Files:**
- Create: `apps/app/src/lib/auth/facade.ts`
- Create: `apps/app/src/lib/auth/runtime.ts`
- Create: `apps/app/src/lib/auth/owner-ports.ts`
- Create: `apps/app/src/lib/auth/http.ts`
- Create: `apps/app/src/proxy.ts`
- Create route handlers under `apps/app/src/app/api/auth/{bootstrap,register,login,logout,verify,recovery,oauth/google,start,oauth/google/callback,sessions,step-up}/route.ts`
- Test: `tests/m007/auth-facade.test.ts`
- Test: `tests/m007/auth-routes.integration.test.ts`

**Interfaces:**
- Consumes Tasks 1-6.
- Produces `AuthApplicationFacade` and stable HTTP envelopes. Route handlers never expose provider
  errors, tokens, account existence, roles or raw owner IDs.

- [ ] **Step 1: Write failing facade/route tests**

```ts
expect((await postLogin(hostileOrigin)).status).toBe(403);
expect((await getClientCase(withOnlyCookiePresence)).status).toBe(403);
expect(await runtimeWithMissingSessionStore()).toEqual({ kind: "unavailable" });
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-facade.test.ts tests/m007/auth-routes.integration.test.ts`
Expected: FAIL because composition and endpoints are absent.

- [ ] **Step 3: Implement facade and disabled runtime**

Compose database repositories, disabled provider/delivery/MFA adapters, synthetic owner ports only
in tests, exact-origin HTTP parsing, private/no-store responses and server-derived actor context.
`proxy.ts` may redirect on absent cookie only; every operation reauthorizes in the facade.

- [ ] **Step 4: Run focused GREEN and app typecheck**

Run: `corepack pnpm vitest run tests/m007/auth-facade.test.ts tests/m007/auth-routes.integration.test.ts && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS with all unavailable/ambiguous owner paths fail closed.

- [ ] **Step 5: Commit**

```bash
git add apps/app/src/lib/auth apps/app/src/app/api/auth apps/app/src/proxy.ts tests/m007/auth-facade.test.ts tests/m007/auth-routes.integration.test.ts
git commit -m "feat(auth): add M007 application facade and routes"
```

### Task 8: Bilingual accessible auth, security, sessions and admin UI

**Files:**
- Create: `packages/i18n/src/auth.ts`
- Create: `packages/ui/src/auth/{AuthShell,AuthField,AuthErrorSummary,SecurityPanel,SessionList,UserStatusTable}.tsx`
- Create: `apps/app/src/app/layout.tsx`
- Create: `apps/app/src/app/globals.css`
- Create pages under `apps/app/src/app/client/{sign-in,register,verify-email,recovery,reset-password,security,settings/account}/page.tsx`
- Create: `apps/app/src/app/admin/users/page.tsx`
- Create: `apps/app/src/app/admin/users/[accountId]/page.tsx`
- Test: `tests/m007/auth-ui.test.ts`
- Test: `tests/m007/auth-i18n.test.ts`
- Modify: `packages/i18n/src/index.ts`, `packages/ui/src/index.ts`

**Interfaces:**
- Consumes Task 7 facade/view models.
- Produces accessible ES/EN routes/components with no credential persistence in browser storage.

- [ ] **Step 1: Write failing UI/i18n contract tests**

```ts
expect(renderedLogin).toContain('autocomplete="current-password"');
expect(renderedRegister).toContain('autocomplete="new-password"');
expect(esKeys).toEqual(enKeys);
expect(renderedSecurity).not.toContain("sessionToken");
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-ui.test.ts tests/m007/auth-i18n.test.ts`
Expected: FAIL because UI and copy do not exist.

- [ ] **Step 3: Implement SG Solutions auth experience**

Use the existing navy/cobalt/cyan/green/gold variables, Manrope/Inter, responsive trust panel/auth
card, visible labels, focused error summary, status live region, 44px controls, reduced motion and
honest provider-disabled states. Admin actions require facade authorization and never edit password.

- [ ] **Step 4: Run focused GREEN and UI typechecks**

Run: `corepack pnpm vitest run tests/m007/auth-ui.test.ts tests/m007/auth-i18n.test.ts && corepack pnpm --filter @atlas/ui typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: PASS with ES/EN key/route parity and accessible semantic contracts.

- [ ] **Step 5: Commit**

```bash
git add packages/i18n packages/ui apps/app/src/app tests/m007/auth-ui.test.ts tests/m007/auth-i18n.test.ts
git commit -m "feat(auth): add bilingual client account UI"
```

### Task 9: Audit, outbox, rate/risk controls and synthetic integrations

**Files:**
- Create: `packages/auth/src/jobs.ts`
- Create: `packages/auth/src/synthetic-ports.ts`
- Create: `packages/observability/src/auth.ts`
- Create: `tests/m007/auth-outbox.test.ts`
- Create: `tests/m007/auth-observability.test.ts`
- Create: `tests/m007/auth-synthetic.integration.test.ts`
- Modify: `packages/auth/src/index.ts`, `packages/observability/src/index.ts`

**Interfaces:**
- Produces `dispatchAuthOutbox`, `reconcileAuthOutbox`, `expireAuthArtifacts`,
  `recordAuthTelemetry` and test-only owner/provider harnesses.

- [ ] **Step 1: Write failing recovery/telemetry tests**

```ts
expect(await dispatch(disabledEmailCommand)).toEqual({ kind: "pending" });
expect(await reconcile(unknownProviderResult)).toEqual({ kind: "manual_review" });
expect(() => recordAuthTelemetry({ event: "login_failed", email: "a@b.com" })).toThrow();
```

- [ ] **Step 2: Run focused RED**

Run: `corepack pnpm vitest run tests/m007/auth-outbox.test.ts tests/m007/auth-observability.test.ts tests/m007/auth-synthetic.integration.test.ts`
Expected: FAIL because durable jobs and telemetry allowlists are absent.

- [ ] **Step 3: Implement durable provider-disabled recovery**

Use dispatch/reconcile lease purpose, idempotency, timeout below lease, bounded concurrency and
query-before-retry semantics. Expire proofs/invitations/sessions/rate buckets by policy. Telemetry
accepts only event/outcome/policy/latency/correlation metadata.

- [ ] **Step 4: Run focused GREEN and affected typechecks**

Run: `corepack pnpm vitest run tests/m007/auth-outbox.test.ts tests/m007/auth-observability.test.ts tests/m007/auth-synthetic.integration.test.ts && corepack pnpm --filter @atlas/auth typecheck && corepack pnpm --filter @atlas/observability typecheck`
Expected: PASS without provider/network effects.

- [ ] **Step 5: Commit**

```bash
git add packages/auth packages/observability tests/m007/auth-outbox.test.ts tests/m007/auth-observability.test.ts tests/m007/auth-synthetic.integration.test.ts
git commit -m "feat(auth): add M007 recovery and observability"
```

### Task 10: Focused security gate, independent audits and closure documentation

**Files:**
- Create: `tests/m007/auth-security-regression.test.ts`
- Create: `tests/support/run-m007-integration.mjs`
- Create after implementation: `docs/phases/M007-PHASE-COMPLETION-REPORT.md`
- Modify after evidence: `docs/modules/m007-authentication-client-account.md`, `PROJECT_STATE.md`, `PROJECT_MEMORY.md`, `ROADMAP.md` and `DECISIONS.md`

**Interfaces:**
- Consumes all tasks.
- Produces a provider-disabled evidence package and PCR. It does not activate any provider or certify
  its own independent review.

- [ ] **Step 1: Add adversarial regression cases**

Cover account enumeration, CSRF, session fixation/replay, OAuth state/nonce/PKCE substitution, open
redirect, proof scanner/replay, brute force/OTP abuse, provider auto-link, IDOR, cross-organization,
stale role/access epoch, service over-scope, AI role mutation, secret telemetry and disabled-provider
fail closed.

- [ ] **Step 2: Run only the M007 focused gate**

Run: `corepack pnpm vitest run tests/m007 && corepack pnpm --filter @atlas/auth typecheck && corepack pnpm --filter @atlas/database typecheck && corepack pnpm --filter @atlas/app typecheck`
Expected: all M007 focused tests and affected typechecks PASS. Record exact counts; do not claim a
full repository suite or build unless separately executed.

- [ ] **Step 3: Request independent architecture review**

Reviewer verifies PRD/ADR/implementation parity, one user system, backend authority, no provider
activation, migration/RLS design and every observable acceptance criterion. Remediate material
findings with focused regression tests.

- [ ] **Step 4: Request read-only Cyber Neo audit**

Audit secrets, dependencies, password/token handling, OAuth, cookies/CSRF, enumeration/rate limits,
session races, RBAC/IDOR, RLS, service accounts, logs and provider-disabled composition. Remediate
Critical/High/Medium findings and re-audit.

- [ ] **Step 5: Write evidence-limited PCR and commit**

Record exact commits/tests/typechecks/audits, limitations, migration status, rollback and all
activation blockers. Do not claim live PostgreSQL, provider, deploy, merge or Operational status.

```bash
git add tests/m007 tests/support/run-m007-integration.mjs docs/phases/M007-PHASE-COMPLETION-REPORT.md docs/modules/m007-authentication-client-account.md PROJECT_STATE.md PROJECT_MEMORY.md ROADMAP.md DECISIONS.md
git commit -m "docs(auth): close M007 provider-disabled build"
```

## Self-review coverage

- Every Product Owner acceptance criterion maps to Tasks 1-10.
- Password hashing is intentionally delegated to existing Supabase Auth; no second credential store
  or unverified Argon2 claim is present.
- Google, email, OTP, MFA, KMS, CRM owners and all external providers remain disabled.
- Exact file ownership prevents a parallel user/CRM/consent/entitlement system.
- Each task has a focused RED/GREEN cycle, observable result, affected typecheck and commit.
- Legal, provider and production-policy decisions remain blockers rather than invented defaults.
