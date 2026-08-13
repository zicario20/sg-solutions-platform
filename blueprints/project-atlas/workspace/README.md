# SG Solutions Platform

- Owner: Product Owner
- Status: Bounded construction; M003 at PO Acceptance with external activation deferred
- Update rule: revise after every accepted checkpoint and link its evidence

SG Solutions Platform is one professional web application for selling and operating SG Solutions
services. `Project Atlas` is an internal project name. The repository contains the approved
architecture/tooling baseline plus locally verified M001–M003 product slices. Nothing is deployed,
provider-connected or `Operational`.

Start with the repository-root `AGENTS.md`, then read `PRODUCT_DEFINITION.md`, `PROJECT_CONTEXT.md`,
`PROJECT_STATE.md`, `SOURCE_OF_TRUTH.md`, `ARCHITECTURE.md` and the relevant module PRD/ADRs.

Decision 028 authorizes sequential local/staging Build only for M003, M004 and M005. M003 is at PO
Acceptance; M004 is next after its exact closure commit. Every other feature still requires an
explicit Product Owner `GENERATE`/Build gate. Archived E1–E3 artifacts under
`../archive/pre-roadmap-2026-08-02/` are historical and non-executable.

## Current scaffold

The approved workspace shape is pnpm/Turborepo with Astro under `apps/www`, Next.js under
`apps/app`, and focused packages under `packages/`. Package manifests and contract tests validate
tooling boundaries only; they are not evidence that authentication, CRM, billing, portal,
scheduling or other product behavior exists.

Local skill repositories are development tools outside this workspace and are not installed product
dependencies.

## Repository and module validation

Install the exact dependency graph and validate the documentary/tooling scaffold with:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm scaffold:validate
```

`apps/app` remains an intentionally empty scaffold, so do not add placeholder routes merely to make
the whole-monorepo build green. Each authorized module PCR records its real app build, tests,
browser/security review and limitations.

The optional local Postgres container requires `ATLAS_POSTGRES_PASSWORD` in an untracked local
`.env`; tracked examples deliberately contain no embedded database credential.
