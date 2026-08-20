# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-20

Version: `0.1.0-alpha.23`

Current phase: **M004 WhatsApp Business recovery design — Product Owner written-spec review**

Module status: **M004 In Progress**. M001–M003 have implementation evidence and remain at Product
Owner Acceptance. M004 has an independently reviewed documentary architecture and a substantial
partial Build candidate, but its transferred branch is not complete or accepted.

Authorized sequence: Decisions 028 and 030 authorize recovery of M004 from clean M003 commit
`1187f6ac4859679216290048df9964f269ac765d`, followed strictly by one module per worktree. M005 and
all later modules remain blocked until M004 closes and the Product Owner approves advancement.

M004 recovery direction: selectively port the communications kernel, fail-closed channel policy,
inactive Meta Cloud adapter, bounded webhook ingress, canonical persistence, Drizzle migrations and
candidate tests. Re-review every imported change against current architecture; do not inherit later
prototypes or unverified completion claims.

External/live state: no Meta account, credentials, number, templates, public endpoint, provider
traffic, production database, deployment, merge or release is authorized. M004 remains local/staging
and provider-disabled. External activation is a separate future gate.

Other modules: M005–M018 are documentary candidates only. M019–M037 transferred prototypes do not
count as canonical implementations. The future CRM/analytics brief is assigned to M016, M017, M020
and M092 under Decision 031. None of the 110 modules is `Operational`.

Current priority: Product Owner review of the written M004 recovery specification, followed by its
TDD implementation plan and selective recovery in the isolated
`codex/m004-whatsapp-recovery` worktree.

Open external decisions: M003 `CHAT-001`–`CHAT-007` and M004 activation decisions remain in
`EXTERNAL_ACTIVATION_REGISTER.md`. They block only affected production/legal/provider behavior and
do not justify simulated success.

Quality evidence: the clean base is documented by
`docs/phases/M003-PHASE-COMPLETION-REPORT.md`, `docs/reviews/M003-CODE-REVIEW.md` and
`docs/reviews/M003-SECURITY-BUILD-REVIEW.md`. M004 requires fresh evidence; inherited test names and
historical outputs are not current passes.

Known recovery limitation: seven required M004 PostgreSQL fresh/upgrade/RLS/conformance validations
were previously deferred. They must be executed with disposable local databases or remain explicit
blockers to M004 closure; they cannot be converted into passes by documentation.

Role model: Product Owner decides; Codex Architecture Agent architects; separately scoped Codex
Implementation Agents implement approved work; ChatGPT/independent reviewers audit and do not
architect or self-approve implementation.
