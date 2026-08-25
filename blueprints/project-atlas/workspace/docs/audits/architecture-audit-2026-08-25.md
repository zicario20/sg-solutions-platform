# Architecture Audit - 2026-08-25

## Scope

Architecture review of the current Project Atlas worktree, focused on cross-module contract
integrity and the M032 Business Formation foundation.

## Evidence reviewed

- Workspace package graph and TypeScript project references.
- M032 domain contracts, deterministic formation rules, persistence migration, and client surface.
- Cross-workspace type checking, unit tests, contract import checks, and production builds.
- Provider-disabled and audit boundaries for sensitive formation actions.

## Findings corrected

1. `@atlas/business-formation` lacked a package-level `typecheck` command. The package now follows
   the workspace verification convention.
2. The M032 requirement selector used a non-null assertion despite an empty-list guard. It now uses
   an explicit fail-closed branch.
3. The M032 database schema carried an unused `boolean` import.
4. The M032 provider-disabled client route attempted to introduce an unapproved dashboard navigation
   key. It now uses the established `services` navigation section and retains a closed route contract.

## Architecture decisions validated

- Formation rules, ownership validation, document hashes, requirements, and readiness are
  deterministic and do not depend on AI.
- Filing preparation fails closed when providers are disabled or the kill switch is active.
- Filing outcomes are immutable and record official evidence requirements for approval.
- Fees remain separated by SG Solutions, government, and partner origin in minor units.
- Handoffs are idempotent and do not activate downstream services.
- The client surface requires dashboard authentication and does not offer filing execution.

## Repository-wide result

- Typecheck: passed for all workspace packages.
- Tests: passed: 1,289; skipped: 25.
- Import contract test: passed.
- Production build: passed.
- M032 focused Biome check: passed.

## Outstanding repository debt

The global Biome lint and format checks currently fail on pre-existing files outside M032:

- Lint: 100 errors, 180 warnings, 40 informational diagnostics.
- Format check: 643 errors, 180 warnings, 40 informational diagnostics.

This audit intentionally did not mass-reformat hundreds of existing files because that would create
an unrelated, high-blast-radius change. The affected pre-existing code must be remediated in a
dedicated formatting and lint stabilization change with ownership and review.

## Environment note

The workspace pins Node 24.18.1; this audit ran with Node 24.19.0. All tests, typechecks, and
builds passed, but CI or release validation should use the pinned version for exact parity.
