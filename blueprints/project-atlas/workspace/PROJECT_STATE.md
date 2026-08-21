# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-21

Version: `0.1.0-alpha.25`

Current phase: **M007 Authentication and Client Account provider-disabled implementation complete,
independently approved and formally accepted by the Product Owner under Decision 037.**

## Accepted predecessor

M006 Public Forms is formally accepted at documentary head `3bbf8ef` under Decision 035. Its
implementation remains provider-disabled. Merge, deployment, release, live PostgreSQL, providers,
credentials, sensitive uploads and `Operational` status remain pending or blocked.

## Current M007 gate

Decision 036 authorizes M007 only in
`D:\SG Solutions\worktrees\m007-auth-account` on branch
`codex/m007-auth-account-rebuild` from accepted M006 base `3bbf8ef`.

Tasks T1-T9 are complete in provider-disabled scope. The branch contains the sole `@atlas/auth` IAM
boundary, durable account/identity/CRM/invitation/session controls, server-side Supabase email and
Google OAuth protocols, RBAC/resource/organization/service/MFA boundaries, rate/audit/outbox
controls, migrations `0023`-`0035`, restricted-role/RLS contracts, real route composition and
accessible ES/EN auth/account-security UI.

The final architecture review is `APPROVED`: AR-001 through AR-009 are closed (`9/9`) with no open
Critical or Important finding. Cyber Neo's final focused re-audit through `f8a4806` is `APPROVED`
with `0` Critical, `0` High and `0` Medium findings. Latest focused evidence is `16/16`, with
passing auth/database/app/observability typechecks. Evidence is checkpoint-scoped; no full suite,
full build, live PostgreSQL/RLS, provider, deployment or release result is claimed.

## Blockers

Apply and verify M007 migrations `0023`-`0035` and the restricted-role RLS harness against an
authorized disposable PostgreSQL instance. Supabase/Google OAuth/JWKS/email/OTP/CRM providers,
credentials, KMS and production configuration remain disabled. Legal texts, retention/deletion/
export/legal-hold policy, exact operational policy values, deploy, merge and release remain pending.
The local Node runtime evidence used `24.19.0` while the repository pin remains `24.18.1`, so the
pinned environment still requires revalidation. Decision 037 records Product Owner acceptance at
documentary head `e66bd6f`; merge, push completion, deployment, activation and release remain
separate pending gates.

## Role model

The Product Owner decides. Codex Architecture directs. A separate implementation agent writes code.
Independent reviewers and Cyber Neo audit work they did not implement.
