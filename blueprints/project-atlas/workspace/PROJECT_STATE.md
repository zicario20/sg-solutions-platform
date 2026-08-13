# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-13

Version: `0.1.0-alpha.23`

Current phase: **M003 Public Chat — provider-disabled local/staging Build complete; external
activation deferred**

Module status: **PO Acceptance**. M003 product code, Drizzle migrations, security controls, tests,
runbook and completion evidence exist in its isolated branch. This is not deployment, provider
activation, production verification or `Operational` status.

Authorized sequence: Decision 028 authorizes `M003 → M004 → M005` only, using isolated worktrees,
TDD, independent review, Cyber Neo and clean validated commits. M004 is the next Build after the
exact clean audited M003 closure commit. M005 remains blocked until M004 closes equivalently.

Implemented locally for M003: bilingual chat UI and full-page routes; same-origin Astro gateway;
opaque host-only sessions, CSRF/origin controls and layered rate limits; deterministic M002-grounded
orientation; sensitive-input rejection; durable idempotent conversation metadata, handoff and audit
state; RLS-forced Drizzle schema; expiry/reconciliation contracts; accessibility and browser tests.

External/live state: no live model, moderation, translation, CRM, scheduling, payment, inbox or
analytics provider; no transcript-body retention in production; no real client data, credentials,
public activation, production database, deployment, merge or release. Provider-disabled behavior
and honest manual fallbacks are the only verified runtime mode.

Other modules: M001/M002 remain at PO Acceptance. M004 is Build ready under Decision 028; M005 is
Build queued after M004. M006–M018 remain documentary candidates. None is `Operational`.

Current priority: Product Owner acceptance decision for M003, then begin M004 in its own worktree if
directed. External activation remains a separate later gate.

Open M003 decisions: `CHAT-001`–`CHAT-007` remain in `EXTERNAL_ACTIVATION_REGISTER.md`. They block
only affected production retention, legal copy, staffed handoff, provider use, anonymous resume,
authenticated status and payment-link behavior.

Quality evidence: see `docs/phases/M003-PHASE-COMPLETION-REPORT.md`,
`docs/reviews/M003-CODE-REVIEW.md` and `docs/reviews/M003-SECURITY-BUILD-REVIEW.md`.

Known repository limitation: `apps/app` remains an intentionally empty Next.js scaffold, so the
whole-monorepo product build is not yet a valid acceptance command. M003 closes on the public-app
build plus the complete configured test/type/lint/format/import/migration/browser gates documented
in its PCR.

Role model: Product Owner decides; Codex Architecture Agent architects; separately scoped Codex
Implementation Agents implement approved work; ChatGPT/independent reviewers audit and do not
architect or self-approve implementation.
