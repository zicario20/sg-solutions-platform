# M015 Package C Provider-Disabled Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fail-closed, encrypted, purpose-bound home-buying financial proposal slice to M015.

**Architecture:** The existing @atlas/client-profile service owns policy and proposal validation. An injected data-protection port encrypts the two approved C1 values before persistence; an absent provider prevents all sensitive submission. The app route reuses the M007/M008 personal-context, origin and CSRF boundary, and PostgreSQL stores ciphertext-only proposal metadata.

**Tech Stack:** TypeScript, Vitest, Drizzle/PostgreSQL, Next.js route handlers, React and Biome.

## Global constraints

- C1 accepts only monthly gross income, monthly recurring debt, USD and monthly cadence.
- No SSN, address, document, credit-report, tax, business, provider, AI, notification or analytics data.
- Default feature and KMS modes remain disabled; unavailable dependencies fail closed.
- Client values are proposals, never verified/current facts or eligibility decisions.
- Every write requires authenticated personal context, same origin, CSRF and a 2 KB body limit.
- No production migration, KMS, deployment or external provider is activated.

### Task 1: Purpose policy and encrypted proposal domain

**Files:** packages/client-profile/src/contracts.ts, packages/client-profile/src/service.ts,
packages/client-profile/src/memory-repository.ts and tests/m015/profile.test.ts.

**Produces:** HomeBuyingFinancialProposal, ProfileDataProtector and
ProfileService.submitHomeBuyingFinancialProposal.

1. Write a failing test that proves unavailable protection rejects the proposal.
2. Run the M015 test and confirm the failure.
3. Implement exact USD/monthly integer validation, purpose acknowledgement, personal-context
   authorization and proposal-only state.
4. Run the test and confirm it passes.
5. Commit the isolated domain change.

### Task 2: Ciphertext-only PostgreSQL boundary

**Files:** packages/client-profile/src/data-protection.ts,
packages/database/src/schema/client-profile.ts, packages/database/src/postgres-client-profile.ts and
tests/m015/profile.test.ts.

**Produces:** ProfileDataProtector.encrypt, EncryptedProfilePayload and
saveHomeBuyingFinancialProposal.

1. Write a failing test that receives only a minimized preliminary DTI receipt.
2. Run the test and confirm the failure.
3. Add an encrypted-proposal table with opaque ciphertext, key version, purpose, epochs, status and
   timestamps; never add plaintext amount columns.
4. Add a test-only protector in memory and an unavailable runtime protector.
5. Run the test and confirm it passes.
6. Commit the persistence boundary.

### Task 3: Protected client API and portal form

**Files:** apps/app/src/lib/client-profile/runtime.ts,
apps/app/src/app/api/client/profile/route.ts, packages/i18n/src/client-profile.ts,
packages/ui/src/profile/ClientProfilePortal.tsx, apps/app/src/app/globals.css and
tests/m015/profile.test.ts.

**Produces:** A bounded C1 form only when configuration is present; otherwise client-safe unavailable
copy.

1. Write a failing test for non-USD, non-monthly and invalid acknowledgement payloads.
2. Run the test and confirm the failure.
3. Implement action submit_home_buying_financial_proposal through the existing admission, CSRF,
   origin and bounded JSON path.
4. Add bilingual purpose copy, acknowledgement, form validation and non-decisional DTI result UI.
5. Run the test and confirm it passes.
6. Commit the protected portal change.

### Task 4: Governance, security evidence and closure

**Files:** .env.example, docs/runbooks/m015-client-profile.md,
docs/decision-packets/m015-profile-activation.md, DECISIONS.md, PROJECT_STATE.md,
PROJECT_MEMORY.md and CHANGELOG.md.

1. Document M015_HOME_BUYING_FINANCIAL_ENABLED=false and KMS-unavailable fail-closed behavior.
2. Record the C1 PFL policy: narrow inventory, no secondary use, 30-day freshness, no export,
   notification or analytics, and preliminary DTI disclaimer.
3. Run frozen offline install, the two focused typechecks, M015 tests, Biome and git diff --check.
4. Commit and push the complete provider-disabled slice.