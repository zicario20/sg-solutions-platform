# SG Solutions Platform

SG Solutions Platform is a bilingual operating system for SG Solutions services across three connected surfaces:

- Public website for education, acquisition, and service discovery
- Client portal for documents, messaging, appointments, billing, and progress tracking
- Admin workspace for CRM, service operations, bookkeeping, governance, and internal workflows

This repository contains the product workspace, architecture, database layer, local development tooling, and implementation scaffolding used to build that platform.

## What Is In This Repo

- `apps/www`: Astro application for the public site, portal routes, admin routes, and local API endpoints
- `apps/app`: Next.js application scaffold reserved for future product surface expansion
- `packages/database`: Drizzle + Postgres package with schema, migrations, and seed script
- `packages/*`: shared config, domain, validation, UI, i18n, and observability packages
- `docs/`: architecture decisions, module documentation, reviews, runbooks, and roadmap material
- `tests/`: contract, unit, and end-to-end validation coverage

## Current Focus

The workspace currently includes:

- Public and bilingual site structure
- Client and admin route scaffolding
- Local admin API routes for core operational modules
- Database package and local Postgres workflow
- Documentation and governance artifacts for phased delivery

This project is under active development. It is not yet a production deployment.

## Tech Stack

- `Astro` for the main web experience
- `Next.js` for the app scaffold
- `TypeScript` across apps and packages
- `pnpm` + `Turborepo` for workspace orchestration
- `Drizzle ORM` + `Postgres` for persistence
- `Vitest` and `Playwright` for validation
- `Biome` for linting and formatting

## Monorepo Layout

```text
workspace/
├─ apps/
│  ├─ www/
│  └─ app/
├─ packages/
│  ├─ database/
│  ├─ config/
│  ├─ domain/
│  ├─ validation/
│  └─ ...
├─ docs/
├─ drizzle/
├─ scripts/
└─ tests/
```

## Getting Started

### 1. Install dependencies

```powershell
corepack pnpm install --frozen-lockfile
```

### 2. Start local development

```powershell
corepack pnpm dev
```

### 3. Run workspace validation

```powershell
corepack pnpm scaffold:validate
```

## Database Workflow

Generate migrations:

```powershell
corepack pnpm db:generate
```

Run migrations:

```powershell
corepack pnpm db:migrate
```

Seed local data:

```powershell
corepack pnpm db:seed
```

Optional local Postgres startup script:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-local-db.ps1
```

Tracked examples are safe to publish. Real credentials stay local in `.env`.

## Validation Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e:www
```

## Project Status

The platform is being built in modules with supporting architecture, governance, and operational documentation. The repository already contains meaningful implementation scaffolding and local workflows, but some product capabilities are still in-progress or demo-backed while external integrations and deployment credentials remain intentionally local.

## Notes

- `Project Atlas` is the internal project codename
- Local temporary files, snapshots, secrets, and installed dependencies are excluded from version control
- This public repository is intended to show the actual workspace and development direction without exposing confidential environment data
