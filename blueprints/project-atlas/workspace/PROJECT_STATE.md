# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-12

Version: `0.1.0-alpha.22`

Current phase: **M003 Public Chat — approved Build specification and TDD planning**

Authorized work: Decision 028 explicitly authorizes `GENERATE` and sequential local/staging Build
for M003, then M004, then M005 in isolated worktrees. Construction may include product code, tests,
Drizzle migrations, authorization policies, synthetic provider contracts and inactive adapters.
Real accounts, credentials, numbers, templates, provider traffic, production deployment, public
channel activation, default-branch merge and `Operational` status remain unauthorized.

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions.
M003–M005 have independently reviewed architecture candidates and a Product Owner-approved bounded
construction sequence. M006–M018 remain documentary candidates without a Build gate.

Repository/tooling scaffold: exists and remains reproducible; it is not proof of product/provider
operation.

Architecture documentation: M003 owns public conversation/orientation policy and reuses M002
knowledge plus canonical M020 lead, M025 communication, M078 consent and M077 audit boundaries.
M004 adds a direct Meta channel adapter over that kernel; M005 adds a Twilio adapter and bounded M096
real-time media boundary. Provider delivery receipts do not replace durable Postgres business state.

Production product behavior: M001/M002 static public behavior is implemented and verified locally
but not deployed or Operational. No live M003–M018 provider or production behavior exists.

Feature implementation: M003 is the only active feature gate. M004 is authorized but blocked on a
clean, audited M003 commit; M005 is authorized but blocked on a clean, audited M004 commit.

Active executable product queue: `M003 → M004 → M005`, strictly sequential.

Module catalog: 110 conceptual modules registered. M001/M002 are at PO Acceptance; M003 is Build
active; M004/M005 are Build queued; M006–M018 remain documentary candidates; none is Operational.

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation. Business Formation remains the first
complete service vertical.

Current priority: obtain Product Owner review of the persisted M003–M005 Build specification, then
write and execute the M003 TDD implementation plan.

Next gate: Product Owner review of the persisted Build specification; then M003 TDD implementation.
External activation remains a later, separate gate.

Quality evidence: the M003 build worktree inherits clean M018 commit `ca885c3`. Before product
changes, Biome lint checked 143 files, 11-package typecheck passed, 20 test files/131 tests passed
with three deliberate skips and import contracts passed. A fresh online install was unavailable in
the current environment; the existing validated workspace toolchain is temporarily linked and the
frozen-install gate remains mandatory before module completion.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists.

Blockers: no blocker prevents deterministic local M003 construction. Unresolved M003 transcript
retention, legal copy, staffed handoff, production model/provider terms and resume policy block only
their affected durable/live behavior and must remain disabled. M004 and M005 are sequencing-blocked
until their predecessors close; their external activation decisions remain deferred.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
