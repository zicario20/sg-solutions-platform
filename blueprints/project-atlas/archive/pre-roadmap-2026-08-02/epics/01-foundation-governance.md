# Epic 01 — Foundation & Governance

**Objetivo:** formalizar Phase 0 y dejar dos shells productivos, sistema visual, datos Drizzle, identidad y autorización delegada.  
**Stack:** Node 24.18.1, pnpm 11.18.0, TypeScript 6.0.3, Turbo 2.10.8, Next 16.2.12, React 19.2.8, Astro 7.1.6, PostgreSQL 17.10, Drizzle ORM 0.45.2.  
**Límites:** una organización; Supabase Auth identifica; dominio, RLS y Storage autorizan; Drizzle es la única autoridad de esquema.

## Subárbol y contratos

`apps/app` y `apps/www` consumen paquetes mediante el patrón canónico `packages/*/src/index.ts`. `profiles`, `staff_roles`, `clients` y `resource_grants` separan identidad, rol y acceso a recurso. Los endpoints de salud son `GET /api/health` en el puerto 3000 y `GET /health` en el 4321.

## Tareas

### E1-T1 — Formalizar el cierre documental de Phase 0

**Dependencias:** ninguna.  
**Archivos:** `MASTER_PRD.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATE.md`, `DECISIONS.md`, `tests/contract/phase-zero-governance.test.ts`.

Actualizar los cuatro documentos scaffolded con el mismo snapshot de Phase 0 y crear fixtures locales que prueben autorización documental y forma del PCR.

**Criterios de aceptación**

- WHEN the Phase 0 contract runs THE SYSTEM SHALL find the same product model, tenancy model, architecture status, and current phase in all four governed documents.
- WHEN the module authorization contract runs THE SYSTEM SHALL map every implementation task E1-T2 through E3-T6 to an existing `Approved baseline` PRD in `docs/modules/INDEX.md` and classify every missing or unapproved mapping as `module_not_authorized`.
- WHEN the phase-completion fixture omits a required PCR section THE SYSTEM SHALL reject the fixture and identify every missing section.

**Verify**

```bash
corepack pnpm exec vitest run tests/contract/phase-zero-governance.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 1: formalize phase zero governance"
git tag step-01-phase-zero-governance
```

### E1-T2 — Crear shells y endpoints de salud

**Dependencias:** E1-T1.  
**Archivos:** `apps/www/src/pages/health.astro`, `apps/app/app/layout.tsx`, `apps/app/app/page.tsx`, `apps/app/app/api/health/route.ts`, `tests/e2e/health.spec.ts`.

Implementar los shells mínimos. Ambos importan `@atlas/config`. El E2E usa los web servers productivos declarados en `playwright.config.ts`, nunca servidores dev.

**Criterios de aceptación**

- WHEN `corepack pnpm install --frozen-lockfile` runs THE SYSTEM SHALL exit 0 without changing `pnpm-lock.yaml`.
- WHEN the shared import contract runs under TypeScript, Vitest, tsx, Next, and Astro THE SYSTEM SHALL resolve `@atlas/config` to `packages/config/src/index.ts` in every runner.
- WHEN the production smoke runs after `corepack pnpm build` THE SYSTEM SHALL start Next production and Astro preview, receive 200 from `/api/health` and `/health`, and terminate both servers.

**Verify**

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec vitest run tests/contract/module-resolution.test.ts
corepack pnpm exec tsx --tsconfig tsconfig.json tests/contract/module-resolution.ts
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/health.spec.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 2: add production shells"
git tag step-02-production-shells
```

### E1-T3 — Implementar tokens y primitiva UI

**Dependencias:** E1-T2.  
**Archivos:** `packages/design-tokens/src/index.css`, `packages/ui/src/index.ts`, `apps/app/app/globals.css`, `apps/app/app/layout.tsx`, `tests/unit/tokens.test.ts`.

Implementar las tres capas de tokens y un Button accesible exportado desde el entry canónico. Las demás primitivas se añaden en tareas consumidoras sin duplicar tokens.

**Criterios de aceptación**

- WHEN the token contract runs THE SYSTEM SHALL report zero component color literals outside `packages/design-tokens/src/index.css`.
- WHEN contrast assertions run THE SYSTEM SHALL enforce 4.5:1 for normal text, 3:1 for large text and component boundaries, and reject cyan or gold as normal text on white or surface backgrounds.
- WHEN reduced motion is requested THE SYSTEM SHALL reduce nonessential transitions to zero duration while preserving state changes.

**Verify**

```bash
corepack pnpm exec vitest run tests/unit/tokens.test.ts
corepack pnpm typecheck
corepack pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 3: add design system foundation"
git tag step-03-design-system
```

### E1-T4 — Establecer esquema Drizzle y migración inicial

**Dependencias:** E1-T2.  
**Archivos:** `packages/database/src/schema.ts`, `packages/database/src/index.ts`, `tests/integration/schema.test.ts`, `DATABASE.md`. Drizzle Kit produce una migración con nombre elegido por la herramienta; se añade al mismo checkpoint sin predecir su ruta.

Definir el esquema inicial y ejecutar `DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:generate`. Revisar el único artefacto generado y migrar mediante la URL directa local explícita.

**Criterios de aceptación**

- WHEN migrations run against an empty local Postgres database THE SYSTEM SHALL create every schema object defined by Drizzle and report zero schema drift.
- WHEN the identical migration command runs a second time THE SYSTEM SHALL exit 0 without altering existing rows.
- WHEN the destructive-change fixture is classified THE SYSTEM SHALL return `expand_migrate_contract_required` and execute zero migration statements.

**Verify**

```bash
docker compose up -d --wait postgres
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
corepack pnpm exec vitest run tests/integration/schema.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "step 4: establish drizzle authority"
git tag step-04-database-authority
```

### E1-T5 — Integrar identidad y roles internos

**Dependencias:** E1-T4.  
**Archivos:** `packages/auth/src/index.ts`, `apps/app/proxy.ts`, `apps/app/app/login/page.tsx`, `tests/integration/auth.test.ts`, `SECURITY.md`.

Integrar sesión server-side de Supabase, actor interno, permisos de rol y MFA para personal. Ningún metadato controlado por el usuario concede permisos.

**Criterios de aceptación**

- WHEN an anonymous request reaches a protected app route THE SYSTEM SHALL redirect to sign-in without exposing protected content.
- WHEN an authenticated client attempts a staff-only action THE SYSTEM SHALL return 403 and write no domain rows.
- WHEN the MFA recovery fixture is processed THE SYSTEM SHALL expose no recovery code in application logs or telemetry.

**Verify**

```bash
corepack pnpm exec vitest run tests/integration/auth.test.ts
corepack pnpm typecheck
```

**Checkpoint**

```bash
git add -A && git commit -m "step 5: add identity and internal roles"
git tag step-05-identity-roles
```

### E1-T6 — Aplicar delegación explícita y RLS

**Dependencias:** E1-T5.  
**Archivos:** `packages/domain/src/authorization.ts`, `packages/database/src/schema.ts`, `packages/auth/src/index.ts`, `tests/integration/rls-delegation.test.ts`, `SECURITY.md`.

Implementar grants revocables por tipo/id de recurso, autorización de dominio y políticas RLS equivalentes. Las pruebas ejercen identidades autorizadas y no autorizadas contra Postgres.

**Criterios de aceptación**

- WHEN a client authenticates with an email matching a record THE SYSTEM SHALL receive zero access until an explicit resource grant exists.
- WHEN a client has a case grant but no document grant THE SYSTEM SHALL read the case summary and receive 404 for the document.
- WHEN a direct database request bypasses the UI THE SYSTEM SHALL still enforce identity, internal role, and explicit resource access through RLS and domain authorization.

**Verify**

```bash
corepack pnpm exec vitest run tests/integration/rls-delegation.test.ts
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
```

**Checkpoint**

```bash
git add -A && git commit -m "step 6: enforce delegated authorization"
git tag step-06-delegated-authorization
```

## Gate ejecutable del epic

- WHEN the Epic 01 gate runs THE SYSTEM SHALL complete all six task verifications against the committed workspace and local Postgres without a failed command.

```bash
corepack pnpm exec vitest run tests/contract/phase-zero-governance.test.ts
corepack pnpm exec vitest run tests/contract/module-resolution.test.ts tests/unit/tokens.test.ts tests/integration/schema.test.ts tests/integration/auth.test.ts tests/integration/rls-delegation.test.ts
corepack pnpm exec tsx --tsconfig tsconfig.json tests/contract/module-resolution.ts
docker compose up -d --wait postgres
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/health.spec.ts
```
