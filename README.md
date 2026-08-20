# SG Solutions Platform

- Owner: Product Owner
- Status: Phase 0 documentary baseline and repository/tooling scaffold
- Update rule: revise after every accepted checkpoint and link its evidence

SG Solutions Platform is one professional web application for selling and operating SG Solutions
services. `Project Atlas` is an internal project name. The repository currently contains architecture
documentation and a non-product monorepo/tooling scaffold; it contains no production product
behavior.

Start with the repository-root `AGENTS.md`, then read `PRODUCT_DEFINITION.md`, `PROJECT_CONTEXT.md`,
`PROJECT_STATE.md`, `SOURCE_OF_TRUTH.md`, `ARCHITECTURE.md` and the relevant module PRD/ADRs.

Feature implementation remains unauthorized until the Product Owner explicitly authorizes
`GENERATE` and the applicable Build gate. Archived E1–E3 artifacts under
`../archive/pre-roadmap-2026-08-02/` are historical and non-executable.

## Current scaffold

The approved workspace shape is pnpm/Turborepo with Astro under `apps/www`, Next.js under
`apps/app`, and focused packages under `packages/`. Package manifests and contract tests validate
tooling boundaries only; they are not evidence that authentication, CRM, billing, portal,
scheduling or other product behavior exists.

Local skill repositories are development tools outside this workspace and are not installed product
dependencies.

## Phase 0 validation

Install the exact dependency graph and validate the documentary/tooling scaffold with:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm scaffold:validate
```

`corepack pnpm build` is the real product build. It is intentionally not the Phase 0 acceptance
command because neither `apps/www` nor `apps/app` contains product routes before the Product Owner
authorizes `GENERATE`. Do not add placeholder product pages merely to make that build green.

The optional local Postgres container requires `ATLAS_POSTGRES_PASSWORD` in an untracked local
`.env`; tracked examples deliberately contain no embedded database credential.
