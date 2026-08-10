# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-09

Version: `0.1.0-alpha.15`

Current phase: **M013 Client Appointments — independently audited documentary candidate**

Authorized work: M013 documentary closure/validation and the sequential M014 documentary gate after
the clean M013 commit under Decision 025; no M013 `GENERATE`, Build gate, route, schema/RLS policy,
Google OAuth/calendar, meeting/notification/payment provider, real appointment, merge or deployment
is authorized

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003–M012 are independently reviewed architecture candidates awaiting Product Owner decisions.
M013 has a 21-section PRD, branded responsive Public/Client/Admin experience, proposed ADR 017 and
20 explicit Product Owner decisions `APT-001`–`APT-020`; independent architecture/accessibility
review has zero open findings and Cyber Neo documentary risk is `0/100`

Repository/tooling scaffold: exists and remains reproducible; it is not proof of provider or product
operation

Architecture documentation: M013 proposes one Postgres appointment authority for versioned types/
availability, holds, conflict-safe booking, client/public projection, lifecycle/attendance and
Google Calendar projection/reconciliation. M024 owns only the internal calendar UI. UTC instants
retain source IANA wall-time/offset evidence; database capacity invariants and idempotent
transactions—not the browser or Google—decide conflicts. Rescheduling secures the new interval
before releasing the old. Appointment, prerequisite/payment, attendance, provider-sync and reminder
states remain separate. Google Calendar OAuth is independent of identity and external events are
minimized rebuildable projections. All channel, CRM, payment, task, notification, audit, retention
and reporting owners remain separate.

Production product behavior: M001/M002 static public behavior is implemented and verified locally
but is not deployed or Operational. No M003–M013 provider or production product behavior exists

Feature implementation: no active feature implementation gate; M013 code remains unauthorized until
its specification/ADR are approved and the Product Owner separately opens its Build gate

Active executable product queue: none

Module catalog: 110 conceptual modules registered; M001/M002 are at PO Acceptance; M003–M013 remain
Registered; none are Operational

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation

First complete vertical: Business Formation remains the Release 1 vertical goal

Current priority: preserve the clean M013 evidence, create its isolated commit and then open only the
M014 documentary worktree authorized by Decision 025

Next gate: M014 may open in its own worktree only after the clean M013 commit. Product Owner approval
of M013 plus a separately recorded `GENERATE`/Build decision is still required before implementation;
Decision 025 authorizes only sequential documentary M012–M014 work

Quality evidence: M013 began from audited M012 commit `4fcbf425`. Its complete source was normalized
without product/dependency changes. Independent review reports zero open findings; Cyber Neo's final
post-contrast passes report zero Critical/High/Medium/Low findings and risk `0/100`. Lint/format checks
143 files; 11-package typecheck, 20 test files/131 tests with three deliberate skips, import contracts
and the 226-page Astro build pass. The final candidate has 55 local links with zero broken, clean
whitespace and no secrets/PII/private URLs/local paths/media/binaries or non-Markdown changes. The
lockfile SHA-256 remains
`C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists

Blockers: no documentary blocker. Twenty Product Owner decisions block only their affected Build/
live behavior: appointment types, booking actors, hours, holds, cancellation/reschedule/no-show,
prerequisites, public identity/consent, staffing, Google policy, reminders, modality/location,
owner handoffs, notes/summaries, external event copy, retention, analytics, abuse, fallback,
AI tools and production Google activation must not be invented

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
