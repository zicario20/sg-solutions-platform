# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-12

Version: `0.1.0-alpha.19`

Current phase: **M017 CRM — independently audited documentary candidate awaiting Product Owner
review**

Authorized work: Decision 027 permits sequential Product/Architecture documentation for M016,
M017 and M018 in isolated worktrees. M016 is clean, audited and committed at
`de4e35b5dde4bf0b7ac780c95a13fc3ee3cc3db2`; M017 opened from that exact commit and is ready for its
isolated commit. No `GENERATE`,
Build gate, product route, table/schema/migration/RLS policy, real CRM/person/client data, merge,
import/export, campaign, provider, AI/automation behavior or deployment is authorized.

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003–M017 are independently reviewed Product/Architecture candidates awaiting applicable Product
Owner decisions. M017 has a 21-section implementation-ready PRD, branded responsive CRM UX/UI
specification, proposed ADR 021 and 23 explicit decisions `CRM-001`–`CRM-023`; independent review
reports zero P0–P3 and Cyber Neo reports zero Critical/High/Medium/Low at documentary risk `0/100`.

Repository/tooling scaffold: exists and remains reproducible; it is not proof of product/provider
operation.

Architecture documentation: M017 owns CRM relationship, Opportunity, versioned Pipeline/Stage,
assignment history and bounded CRM-authored activity. M018 Person/Household/formal Client/contact
methods, M019 Organization, M020 Lead/qualification, M021 ServiceOrder, M022 CaseFile, M023 Task,
M078 Consent and other domain records remain canonical. Contact 360 is closed/typed/minimized and
reauthorizes owner drill-down. Task/organization links require current owner receipts. Opportunity
`won`, client activation, payment, entitlement, approval-to-start and case progress remain
independent. High-risk operations are idempotent, reviewed and recoverable; automatic/name-only/
unkeyed-hash/AI-only merge is prohibited.

Production product behavior: M001/M002 static public behavior is implemented and verified locally
but not deployed or Operational. No M003–M017 provider or production product behavior exists.

Feature implementation: no active feature implementation gate. M017/M018 code remains unauthorized
until specifications/designs/ADRs/decisions are approved and the Product Owner separately records
`GENERATE` plus the applicable Build gate.

Active executable product queue: none.

Module catalog: 110 conceptual modules registered; M001/M002 are at PO Acceptance; M003–M017 remain
Registered as independently reviewed Product/Architecture candidates; none are Operational.

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation. Business Formation remains the first
complete service vertical.

Current priority: commit the clean M017 candidate in `codex/m017-crm`, then open M018 Client
Management from that exact commit in a separate worktree under Decision 027.

Next gate: create M018 Client Management in a separate worktree from the clean audited M017 commit.
Any product Build requires a separate explicit Product Owner decision.

Quality evidence: final M017 evidence passed Biome over 143 files, 11-package typecheck, 20 passing
test files/131 tests with three deliberate skips, import contracts, a 226-page Astro build, 188 local
links across 155 active Markdown files with zero broken and whitespace checks. Two frozen offline
lockfile-only installations preserved SHA-256
`C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`. The authenticated Next.js
package remains an intentionally route-less scaffold, so product build is not applicable before an
authorized route exists.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists.

Blockers: `CRM-001`–`CRM-023` block only their affected Build/live behavior: entity/view inventory,
route, relationship/client lifecycle, conversion, pipeline, access, next-action, activity, notes,
attribution, matching, merge, assignment, consent/preference, metadata, import/export, AI,
analytics, per-record retention/deletion/legal-hold/backup/restore, and the data-quality issue types/
severity/lifecycle/rules/reviewer/owner-resolution policy must not be invented. The raw M001–M021 source remains an
external attachment; M017 was compared fully against it, but future repository-only review cannot
reproduce that comparison without the same attachment.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
