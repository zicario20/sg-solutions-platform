# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-12

Version: `0.1.0-alpha.21`

Current phase: **M018 Client Management — independently reviewed documentary candidate**

Authorized work: Decision 027 permits sequential Product/Architecture documentation for M016,
M017 and M018 in isolated worktrees. M016 is clean/audited/committed at `de4e35b`; M017 is
clean/audited/committed at `667e020`; M018 opened from that exact commit in
`codex/m018-client-management`. No `GENERATE`, Build gate, product route, table/schema/migration/RLS
policy, real person/client/household/representative data, merge, export, impersonation, lifecycle
effect, provider, AI behavior or deployment is authorized.

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003–M018 are independently reviewed Product/Architecture candidates awaiting applicable Product
Owner decisions. M018 has a complete-source 21-section PRD, branded responsive UX/UI design,
proposed ADR 022 and 23 explicit decisions `CLM-001`–`CLM-023`; final independent architecture and
Cyber Neo review both passed with zero open findings.

Repository/tooling scaffold: exists and remains reproducible; it is not proof of product/provider
operation.

Architecture documentation: M018 owns canonical Person/contact-method/Household, formal
ClientRelationship lifecycle/history, client assignments, scoped representatives, client flags/
restrictions, onboarding/offboarding coordination and ClientOperationalNote. M019 Organization,
M021 ServiceOrder, M022 CaseFile, M023 Task, M011 Document, M014 Billing, M013 Appointment,
M012/M025 Communication, M078 Consent, M007 account/grants and M015 profile facts remain canonical.
Client 360 is a closed, typed, minimized owner composition with per-section authorization,
freshness/result state and reauthorized drill-down.

Production product behavior: M001/M002 static public behavior is implemented and verified locally
but not deployed or Operational. No M003–M018 provider or production product behavior exists.

Feature implementation: no active feature implementation gate. M018 code remains unauthorized until
the PRD/design/ADR/decisions are approved and the Product Owner separately records `GENERATE` plus
the applicable Build gate.

Active executable product queue: none.

Module catalog: 110 conceptual modules registered. M001/M002 are at PO Acceptance; M003–M018 are
independently reviewed Product/Architecture candidates; none is Operational.

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation. Business Formation remains the first
complete service vertical.

Current priority: commit the clean independently reviewed M018 candidate and stop under Decision
027. No later module is authorized by that decision.

Next gate: Product Owner documentary review/decisions for M018 after clean audit evidence. Any
product Build requires a separate explicit Product Owner decision.

Quality evidence: M018 inherited clean M017 commit `667e020`. Final independent review reports
P0/P1/P2/P3 all zero. Cyber Neo reports Critical/High/Medium/Low all zero and documentary risk
`0/100`. Biome checked 143 files; 11-package typecheck passed; 20 test files/131 tests passed with
three deliberate skips; import contracts passed; direct Astro build produced 226 pages; 193 active
local links passed; two frozen offline installs preserved the lock hash; `git diff --check` passed.
The intentionally route-less Next scaffold has no applicable standalone product build.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists.

Blockers: `CLM-001`–`CLM-023` block only their affected Build/live behavior: inventory, route,
activation, client/subject types, lifecycle, onboarding/offboarding, assignments, representatives,
flags/restrictions/high-risk lifecycle, notes, preferences/consent projections, portal admin/
impersonation, protected reveal, export, AI, analytics, readiness, freshness/cache, client reference,
canonical matching/merge and temporary/global access. The raw M001–M021 source remains an external
attachment; M018 was compared fully against it, but future repository-only review cannot reproduce
that comparison without the same attachment.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
