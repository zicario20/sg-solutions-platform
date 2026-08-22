# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-21

Version: `0.1.0-alpha.26`

Current phase: **M008 Client Dashboard provider-disabled implementation T1-T9 complete and ready
for Product Owner acceptance; acceptance has not been granted.**

## Accepted predecessor

M007 Authentication and Client Account is formally accepted at `3c1bd4e` under Decision 037. Its
implementation remains provider-disabled. `@atlas/auth` is the sole IAM boundary; Supabase Auth is
credential authority, while backend authorization and Postgres RLS own access decisions. Merge,
deployment, provider activation, live PostgreSQL/RLS and `Operational` remain pending or blocked.

## Current M008 status

Decision 038 accepts ADR 012 and authorized M008 only in
`D:\SG Solutions\SG Solutions\.worktrees\m008-client-dashboard` on branch
`codex/m008-client-dashboard-rebuild` from accepted M007 base `3c1bd4e`.

T1-T9 implement one backend-authoritative `@atlas/dashboard` read model and the existing Next.js
`/client` surface. M007 owns sessions, account/context authorization, CSRF and revocation fences;
M008 adds minimized DTOs, deterministic priority, explicit freshness/partial failure, disabled
cache contracts, safe analytics, durable HTTP/SSR admission and accessible responsive ES/EN UI.
Runtime owner/provider ports remain `unavailable`; synthetic adapters are test-only.

Architecture is `APPROVED` with `8/8` findings closed and `0` Critical/Important open. Cyber Neo is
`APPROVED` with `0` Critical/High/Medium/Low. Checkpoint evidence is recorded without summing
overlapping runs: initial `31/31`, architecture `9/9`, AR4/AR5 `4/4`, Cyber `5/5`, SSR final `3/3`.
The lockfile is deterministically synchronized and covered by a passing contract test.

## Blockers

Product Owner acceptance is pending. Migration `0036` has not been applied to live/disposable
PostgreSQL and live RLS/rate SQL has not been exercised. DB, provider and owner integrations;
rate-HMAC secrets and trusted-proxy topology; visual verification at 320px; full suite, full build
and final post-Cyber typecheck; pinned Node/tooling; and legal/privacy/retention/production config
remain blocked or pending. Final typecheck/build are `NO VALIDATED` because worktree dependency
resolution/Corepack encountered `EPERM`. No merge, deployment, release, real client data, provider
traffic or `Operational` state is authorized.

## Role model

The Product Owner decides. Codex Architecture directs. A separate implementation agent writes code.
Independent reviewers and Cyber Neo audit work they did not implement.
