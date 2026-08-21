# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-21

Version: `0.1.0-alpha.25`

Current phase: **M007 Authentication and Client Account architecture and provider-disabled Build
plan approved; implementation has not started.**

## Accepted predecessor

M006 Public Forms is formally accepted at documentary head `3bbf8ef` under Decision 035. Its
implementation remains provider-disabled. Merge, deployment, release, live PostgreSQL, providers,
credentials, sensitive uploads and `Operational` status remain pending or blocked.

## Current M007 gate

Decision 036 authorizes M007 only in
`D:\SG Solutions\worktrees\m007-auth-account` on branch
`codex/m007-auth-account-rebuild` from accepted M006 base `3bbf8ef`.

Authorized scope expands `@atlas/auth` as the sole IAM boundary; retains Supabase Auth as credential
authority; designs account/profile/invitation/link/session/RBAC/organization/resource authorization,
service identities and audit; prepares disabled official email/password/Google/MFA adapters; and
plans Drizzle/RLS, focused tests and accessible ES/EN client/admin UI.

No M007 application code exists yet. This branch currently contains only the approved PRD, ADR,
design and implementation plan.

## Blockers

Supabase, Google, email/OTP/MFA accounts and credentials; exact redirects and policy durations;
Terms/Privacy/consent copy; phone/VoIP, MFA/break-glass and CRM linking policy; KMS, distributed
rate/session infrastructure and trusted proxies; retention/deletion/export/legal hold; production
PostgreSQL/RLS evidence; deployment/runbooks; independent runtime review and Product Owner release
approval remain blocked. Affected behavior stays disabled or fails closed.

## Role model

The Product Owner decides. Codex Architecture directs. A separate implementation agent writes code.
Independent reviewers and Cyber Neo audit work they did not implement.

