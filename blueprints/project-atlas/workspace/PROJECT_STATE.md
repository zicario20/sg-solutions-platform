# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-09

Version: `0.1.0-alpha.14`

Current phase: **M012 Mensajería segura — independently audited documentary candidate awaiting Product Owner review**

Authorized work: M012 Product/Architecture documentation and read-only independent/security review
under Decision 025; no M012 `GENERATE`, Build gate, route, schema/RLS policy, provider, AI,
notification, real message, merge or deployment is authorized

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003–M011 are independently reviewed architecture candidates awaiting Product Owner decisions.
M012 has a 21-section PRD, responsive branded Client/Staff design, proposed ADR 016 and 20 explicit
Product Owner decisions. Independent review has zero open findings and Cyber Neo is
`SECURITY-CLEAR` at documentary risk `0/100`

Repository/tooling scaffold: exists and remains reproducible; it is not proof of provider or product
operation

Architecture documentation: M012 proposes one authenticated secure-message authority over the
shared conversation kernel. Every conversation has one account/service/case root; participation
does not grant access. Client messages and internal notes use separate records, commands, DTOs and
events. Gap-free Client message order/version/time is separate from private staff activity. Each
accepted aggregate, encrypted immutable revision/current pointer, applicable counters, idempotency
receipt and outbox/audit commit atomically; all reads/writes final-fence M007/ADR 004 grants. M011
owns attachment bytes, M025 a content-free inbox projection, M026 notifications, M047–M060 AI
behavior and M076 compliance/human decisions. No transcript content enters telemetry,
notifications or browser persistence.

Production product behavior: M001 and M002 static public behavior is implemented and verified
locally but is not deployed or Operational. No M003–M012 provider or product behavior exists.

Feature implementation: no active feature implementation gate; M012 code remains unauthorized until
its specification is approved and the Product Owner separately opens its Build gate

Active executable product queue: none

Module catalog: 110 conceptual modules registered; M001/M002 are at PO Acceptance; M003–M012 remain
Registered; none are Operational

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation

First complete vertical: Business Formation remains the Release 1 vertical goal

Current priority: commit the fully audited/validated M012 branch, then open M013 in its own worktree
under Decision 025

Next gate: M013 may open in its own worktree only after the clean audited M012 commit. Product Owner
approval of M012 and a separately recorded `GENERATE`/Build decision remain required before any
implementation; Decision 025 authorizes only the sequential documentary M012–M014 work

Quality evidence: M012 is based on independently audited M011 commit `f58dcfd`. A frozen offline
install passed twice with pnpm 11.18.0 and unchanged lockfile SHA-256
`C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`; lint/format checked 143
files, typecheck passed 11/11 packages, tests passed 20 files/131 tests with 1 file/3 tests skipped,
import contracts passed and Astro built 226 pages. Final hygiene found 125 local links with zero
broken, no candidate secrets/PII/local paths and `git diff --check` passed. Independent architecture
review has zero open findings and Cyber Neo is security-clear at risk 0/100. The empty authenticated Next.js scaffold has no
`app/` or `pages/`, so the monorepo build remains intentionally unavailable until a Product Owner
Build gate; no route will be invented to mask that limitation.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists

Blockers: no documentary blocker. Twenty Product Owner decisions block only their affected Build/
live behavior: initiation/states/participants, edits/internal notes, content/attachment limits,
sensitivity, queues, AI/templates/translation, notifications/SLA, retention/read receipts,
search/encryption, analytics, cross-channel continuity and abuse handling must not be invented.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
