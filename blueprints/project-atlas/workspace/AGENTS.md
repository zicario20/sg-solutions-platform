# Project Atlas workspace adapter

- Owner: Product Owner
- Status: Path adapter; not an independent governance authority
- Scope: `blueprints/project-atlas/workspace/**`

The universal repository contract is [../../../AGENTS.md](../../../AGENTS.md). Read and obey it
before changing this workspace. If this file conflicts with the root contract, the root contract
prevails.

Workspace-specific reading order:

1. `PRODUCT_DEFINITION.md`, `PROJECT_CONTEXT.md` and `PROJECT_STATE.md`.
2. `MASTER_PRD.md`, `ARCHITECTURE.md`, `SOURCE_OF_TRUTH.md` and `ROADMAP.md`.
3. The relevant `docs/modules/` PRD and every applicable `docs/adr/` decision.
4. `SECURITY.md`, `DATA_CLASSIFICATION.md` and any specialized security/runbook document.

This directory contains the repository/tooling scaffold and bounded locally verified module code.
Decision 028 authorizes sequential local/staging Build only for M003–M005; M003 is at PO Acceptance
and M004 is next after the exact closure commit. No provider activation, production deployment,
default-branch merge or `Operational` status is implied. Tool-specific instructions cannot override
the root `AGENTS.md`.
