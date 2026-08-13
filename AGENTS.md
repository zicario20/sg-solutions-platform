# SG Solutions universal repository governance

- Owner: Product Owner
- Status: Universal and authoritative governance entry point
- Scope: Every file, developer, AI agent, automation and tool used in this repository
- Update rule: Changes require Product Owner approval and a synchronized entry in
  `blueprints/project-atlas/workspace/DECISIONS.md`

This file is the primary instruction file for Project Atlas. It governs how work is authorized and
reviewed across the repository. It does not replace approved product requirements or architecture;
it tells every participant how to locate and obey them.

## Current gate

Project Atlas has a **bounded Phase 1 construction gate for M003–M005** under Decision 028.

- Repository and tooling scaffold exists; M001/M002 have verified local implementations.
- The Product Owner explicitly authorized `GENERATE` for M003, then M004, then M005 only.
- Construction must be sequential, use isolated worktrees, TDD, independent review, Cyber Neo and
  separate validated commits. M003 is at PO Acceptance after a provider-disabled local/staging
  Build; M004 is the next gate after its exact closure commit, and M005 remains blocked until M004
  closes.
- Local/staging product code, Drizzle migrations, RLS policies, synthetic provider-contract tests,
  provider adapters and inactive feature flags/configuration are authorized within each approved
  module PRD.
- Real provider accounts, credentials, phone numbers, approved templates, live webhooks, live
  traffic, production deployment, public channel activation and `Operational` status remain
  prohibited until separate Product Owner activation decisions.
- Public WhatsApp and telephone entry points must remain hidden while their activation flags are
  disabled. A disabled adapter must fail closed and must never simulate external success.
- Modules outside M003–M005 retain their existing documentary or acceptance gates.
- Do not invoke `/architect-next` or treat archived planning artifacts as active instructions.

This gate does not authorize invented business/legal policy, secrets, real client data, provider
activation, merge to the default branch or production release.

## Permanent role model

### Product Owner

The user is the Product Owner and final authority. The Product Owner approves scope, priorities,
business policy, architecture-sensitive changes, implementation phases, merges and production
releases. No agent, tool, test or reviewer may override the Product Owner.

### Codex Architecture Agent

Codex, using the approved architecture skill, is the project architect. This role owns system and
data architecture, module boundaries, ADR proposals, implementation sequencing, integration and
security architecture, and architecture consistency. The architect proposes; the Product Owner
decides. The architect must not invent missing business policy.

### Codex Implementation Agent

When implementation is authorized, a separate Codex responsibility implements the approved work,
writes tests and migrations, integrates providers and updates documentation. The implementer must
not redefine product scope or architecture and may not certify its own work as independently
audited.

### Independent Auditor

ChatGPT is the independent auditor. The auditor reviews architecture, documentation,
implementation reports and repository evidence; identifies risks, defects and omissions; and does
not define architecture, implement code, make final business decisions or approve its own work.
Audit findings are recommendations and risk assessments for the Product Owner.

### Automated Review Agents

Automated reviewers may inspect code, tests, security and documentation. They may request
corrections but may not redefine business requirements, override the architect or Product Owner, or
independently approve work they produced.

## Authority hierarchy

When instructions conflict, apply this order:

1. Recorded Product Owner decisions.
2. Approved product requirements.
3. Approved architecture decisions.
4. This `AGENTS.md` governance contract.
5. Module PRDs and ADRs within their approved scope.
6. Implementation code.
7. Tool-specific instructions.

Tool-specific files and skills provide usage technique only. They may not redefine product scope,
roles, business policy, architecture authority, governance or sources of truth.

## Sources of truth

Read [SOURCE_OF_TRUTH.md](blueprints/project-atlas/workspace/SOURCE_OF_TRUTH.md) for complete
authority boundaries. The minimum reading order is:

1. [PRODUCT_DEFINITION.md](blueprints/project-atlas/workspace/PRODUCT_DEFINITION.md) and
   [MASTER_PRD.md](blueprints/project-atlas/workspace/MASTER_PRD.md).
2. [PROJECT_CONTEXT.md](blueprints/project-atlas/workspace/PROJECT_CONTEXT.md) and
   [PROJECT_STATE.md](blueprints/project-atlas/workspace/PROJECT_STATE.md).
3. [ARCHITECTURE.md](blueprints/project-atlas/workspace/ARCHITECTURE.md), the relevant module PRD
   and applicable ADRs.
4. [ROADMAP.md](blueprints/project-atlas/workspace/ROADMAP.md),
   [EXTERNAL_ACTIVATION_REGISTER.md](blueprints/project-atlas/workspace/EXTERNAL_ACTIVATION_REGISTER.md),
   security documentation and the current approved change scope.

`PROJECT_MEMORY.md` is chronological history; it never overrides current approved state.

Architecture approval, local implementation and external activation are separate evidence gates.
Provider accounts, contracts, credentials, business prerequisites and activation tests are tracked
in `EXTERNAL_ACTIVATION_REGISTER.md` under ADR 006. The register contains no secrets, does not
authorize Build and cannot make a provider or module `Operational` without the applicable review and
Product Owner approval.

## Authorization and implementation workflow

No agent may redefine business scope or invent missing business policy. Unresolved policy must be
written as `[NEEDS PRODUCT OWNER DECISION: ...]` and escalated.

After a future Build gate, every implementation follows this sequence:

1. Confirm the approved module PRD, ADRs, dependencies, files in scope and acceptance criteria.
2. Obtain Product Owner approval for architecture-sensitive changes and the explicit Build gate.
3. Complete UI/UX approval before implementing important visual surfaces.
4. Work on an isolated branch; never implement directly on `main` or `master`.
5. Use test-driven implementation and preserve compatible evolution from Release 1A to 1B.
6. Run the complete automated verification suite.
7. Obtain an independent review from an agent that did not implement the change.
8. Correct or explicitly reject every material finding with evidence and a regression test.
9. Re-run verification and independent review.
10. Obtain Product Owner merge/release approval where required and produce a PCR at completion.

No implementation may merge directly into the default branch. Passing tests do not constitute an
independent audit or Product Owner acceptance.

## Enhanced review

The following always require enhanced, independent security review and Product Owner approval:

- authentication, session management, MFA, roles, permissions, RLS or Storage policies;
- payments, refunds, invoices, Stripe events or financial reconciliation;
- sensitive documents, PII, tax, credit, identity or banking data;
- schema changes, data backfills and destructive migrations;
- encryption, secrets, retention, deletion, backup or recovery;
- CI/CD, production configuration, provider credentials and deployment;
- telemetry or AI access to client data;
- architecture boundaries, new providers, new dependencies or service extraction.

Cyber Neo is a strictly read-only security auditor. It may write only its external report, must not
modify the target repository or expose secret values, and cannot replace independent human/legal
review where that review is required.

## Documentation rules

- Approved changes update all affected requirements, ADRs and source-of-truth documents together.
- `PROJECT_STATE.md` contains current state only and must remain readable in under two minutes.
- `PROJECT_MEMORY.md` is append-only chronological history.
- Important decisions are appended to `DECISIONS.md`; historical decisions are superseded, not
  erased.
- A completed phase or operational module produces a Phase Completion Report with executed
  evidence, limitations, rollback and pending decisions.
- Conversation history is not authority until reconciled into approved repository documentation.
- No document may claim behavior is implemented without fresh validation evidence.

## Escalation rules

Stop and ask the Product Owner when work requires a missing business decision, changes approved
scope, replaces an approved stack component, changes a security/architecture boundary, requires a
destructive action, or cannot satisfy an acceptance criterion. Present the issue, impact,
recommended option and alternatives; do not silently choose.

## Definition of done

A change is done only when its authorized scope is complete, required tests/lint/format/type/build
checks pass, security and architecture reviews are satisfied, documentation is synchronized,
unresolved decisions are surfaced, no secrets or sensitive data were added, `git diff --check`
passes, and required Product Owner acceptance is recorded. The implementer may report evidence but
may not self-certify independent approval.

## Repository-specific boundary

Local skill directories are development tools, not SG Solutions application modules, workspace
packages or runtime dependencies. The active documentary authorities live under
`blueprints/project-atlas/workspace/`; archived E1–E3 material is historical and non-executable.
