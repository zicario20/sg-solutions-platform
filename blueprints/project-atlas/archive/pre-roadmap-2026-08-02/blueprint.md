# Project Atlas — Blueprint documental

> Generado con The Architect el 2026-08-02  
> Forma: plataforma operativa web + sitio público de marketing y educación  
> Emisión: bundle; implementación de aplicación no autorizada  
> Versiones verificadas: 2026-08-02 — §11

## 1. Project Overview & Non-Goals

### Visión

SG Solutions Platform es una aplicación web profesional para vender y operar los servicios de SG Solutions LLC. `Project Atlas` es un nombre interno. La plataforma une Public Website `/`, Client Portal `/client` y Admin/Internal `/admin` como superficies lógicas de un solo producto. Atiende una sola organización de Illinois; no se licencia a otras firmas.

Flujo: Marketing Website → Lead Generation → CRM/Pipeline → Operations Platform → Client Portal. El CTA principal es **Agenda una evaluación** y el secundario **Solicita una cotización**. La cuenta se crea como consecuencia de una relación comercial.

### Usuarios

| Persona | Trabajo principal |
|---|---|
| Owner/operator | Captar, calificar y atender clientes; controlar ingresos y riesgos |
| Personal futuro | Trabajar leads, casos, documentos, facturas y citas asignadas |
| Cliente | Ver únicamente recursos delegados y la siguiente acción |
| Visitante | Aprender, evaluar encaje y solicitar evaluación/cotización |
| Aprobador de contenido | Revisar contenido público inglés/español |

### Objetivos de Release 1 — Production Foundation

1. Operar con clientes reales y documentos sensibles desde el primer release.
2. Capturar demanda Google/Meta/social con atribución y consentimiento.
3. Dar al cliente claridad sin conceder acceso implícito.
4. Cobrar servicios mediante Stripe sin vender una suscripción al software.
5. Mantener documentación autosuficiente y una base extensible, no desechable.

### Non-Goals

| No se construye en Release 1 | Razón | Condición de revisión |
|---|---|---|
| Multi-tenancy o white-label | Solo SG Solutions usa el sistema | Contrato comercial de licencia |
| Asistente IA runtime | Falta PRD y control de datos específico | Core estable y PRD de IA autorizado |
| App móvil nativa | La web responsive cubre la operación inicial | Evidencia de limitación web |
| LMS completo | La academia pública valida primero la demanda | Cursos/cuentas financiados |
| Calendly generalista | La agenda solo cubre el flujo propio | Necesidad operativa medida |
| BI warehouse avanzado | Postgres y analítica minimizada bastan al inicio | Carga/reporting excede vistas operativas |
| Operación de seguros/hipotecas | Requiere alcance legal y de licencias | PRD y revisión profesional |
| Resultados financieros garantizados | Viola principios y eleva riesgo | Nunca |

### Métricas iniciales

- Cero lecturas entre clientes en pruebas RLS/dominio.
- Cero efectos financieros duplicados en ledger y reconciliación.
- Cero double-bookings en pruebas concurrentes.
- LCP ≤2.5 s, INP ≤200 ms y CLS ≤0.1 p75 en el sitio público.
- Cero violaciones automatizadas serious/critical; revisión manual antes del launch.
- Funnel medido desde la primera campaña sin inventar target de conversión.

## 2. Tech Stack

| Capa | Elección | Motivo |
|---|---|---|
| Runtime | TypeScript/Node | Un lenguaje tipado para superficies, dominio, jobs y tests |
| Sitio público | Astro | HTML/content-first y JavaScript mínimo |
| Aplicación | Next.js App Router | Server-first para autenticación y operación privada |
| Monorepo | pnpm + Turborepo | Paquetes cohesionados sin cajón `shared` |
| UI | Tailwind + tokens CSS + Radix | Rendimiento, accesibilidad y control de marca |
| Base de datos | Supabase PostgreSQL | Constraints, Auth/RLS/Storage alineados |
| Esquema | Drizzle solamente | Migraciones versionadas y revisables |
| Identidad | Supabase Auth | Identidad integrada; no autorización de negocio |
| Contenido | Sanity mediante HTTP | Solo contenido público; no SDK adicional necesario |
| Pagos | Stripe Checkout/Invoices/webhooks | Cobro por servicios y autoridad financiera externa |
| Jobs | Inngest + ledger Postgres | Coordinación con estado durable local |
| Agenda | Motor propio estrecho + Google Calendar | Control transaccional sin clonar Calendly |
| Analítica/errores | PostHog, Sentry, OpenTelemetry | Observabilidad allowlisted y minimizada |
| Hosting | Vercel + Supabase | Dos proyectos web, una base gestionada |

Compatibilidad: Node 24 satisface Next/Astro y el engine `>=20` de Inngest 4.14.0. React 19.2.8 satisface Next 16.2.12. Sentry 10.69.0 declara peer compatible con Next 16. OpenTelemetry SDK/exporter 0.221.0 usa API 1.9.1, dentro de `>=1.3 <1.10`.

## 3. Directory Structure

```text
apps/
  app/                         # Next privada; paquete @atlas/app
  www/                         # Astro público; paquete @atlas/www
packages/
  ui/                          # @atlas/ui
  design-tokens/               # @atlas/design-tokens
  domain/                      # @atlas/domain
  database/                    # @atlas/database
  auth/                        # @atlas/auth
  validation/                  # @atlas/validation
  observability/               # @atlas/observability
  i18n/                        # @atlas/i18n
  config/                      # @atlas/config
drizzle/                       # nombres de migración elegidos por Drizzle Kit
docs/
  adr/
  api/
  branding/
  diagrams/
  legal/
  meeting-notes/
  modules/
  phases/
  user-flows/
  wireframes/
tests/
  contract/
  e2e/
  integration/
  unit/
.claude/
  rules/
  skills/
.github/
  workflows/
blueprints/project-atlas/      # bundle documental, excluido por herramientas
```

Cada manifest `@atlas/*` exporta literalmente `./src/index.ts`. TypeScript, Vitest y tsx resuelven el mismo patrón `packages/*/src/index.ts`; Next y Astro lo ejercen en Step 2.

## 4. Data Model

Drizzle define tablas, columnas, índices, constraints, RLS y migraciones. El dashboard Supabase no altera producción.

| Grupo | Tablas y campos esenciales |
|---|---|
| Identidad | `profiles(id auth UUID PK, email_normalized, locale, status, created_at)`; `staff_roles(profile_id, role, active)` |
| Clientes/acceso | `clients(id, legal_name, contact fields encrypted where needed)`; `resource_grants(id, grantee_profile_id, resource_type, resource_id, capability, granted_at, revoked_at)` |
| Captación | `leads(id, status, source, assigned_to, created_at)`; `consent_events(lead_id, purpose, version, captured_at)`; `lead_attributions(lead_id, touch_type, source, medium, campaign, content, term, occurred_at)` |
| CRM | `pipeline_stages(id, key, position, active)`; `lead_stage_events(lead_id, from_stage, to_stage, actor_id, occurred_at)` |
| Casos | `cases(id, client_id, service_type, status, owner_id)`; `case_notes(id, case_id, visibility, body_encrypted, author_id)`; `tasks(id, case_id, assignee_id, status, due_at)` |
| Documentos | `documents(id, client_id, case_id, bucket, object_path, media_type, checksum, status)`; grants exactos controlan lectura |
| Agenda | `appointment_types`; `availability_rules`; `availability_blocks`; `appointments(id, starts_at, ends_at, timezone, status, rescheduled_from_id)` |
| Calendario | `calendar_connections(profile_id, encrypted_refresh_token, sync_token)`; `external_event_mappings(appointment_id, external_id, etag)` |
| Cotizaciones | `quotes(id, client_id, case_id, status, expires_at)`; `quote_versions`; `quote_lines(amount_minor, currency, quantity)`; `quote_acceptances(snapshot, accepted_at)` |
| Facturación | `invoices(id, quote_id, client_id, case_id, operational_status, external_id)`; `payments(invoice_id, amount_minor, currency, external_id, status)` |
| Stripe | `stripe_events(external_event_id UNIQUE, type, created_at, processed_at, payload_digest)`; `reconciliation_items(id, object_type, external_id, local_state, external_state, status)` |
| Jobs | `jobs(idempotency_key UNIQUE, type, state, max_attempts, next_attempt_at)`; `job_attempts`; `dead_letters(job_id, reason_code, recovery_status)` |
| Auditoría | `audit_events(actor_id, action, resource_type, resource_id, request_id, occurred_at, metadata_redacted)` |

Índices: grants activos por `(grantee_profile_id, resource_type, resource_id)`; leads por estado/asignación/fecha; citas por intervalo; eventos externos únicos; jobs por estado/fecha. Dinero usa minor units enteros y moneda ISO. Instantes se almacenan UTC y reglas conservan zona IANA. Retención y cifrado por campo se documentan antes de producción.

Migraciones: expand → backfill verificable → contract. Step 4 ejecuta `drizzle-kit generate`; el filename resultante se descubre del output y se commitea, nunca se predice en este documento.

## 5. API Design

| Método/ruta | Actor | Contrato |
|---|---|---|
| `GET /health` | Público | 200 y estado no sensible de Astro |
| `GET /api/health` | Público | 200 y estado no sensible de Next |
| `POST /api/v1/leads` | Público | Validación, consentimiento, rate limit e idempotencia |
| `GET /api/v1/documents` | Cliente/staff | Lista solo metadatos autorizados |
| `POST /api/v1/documents/signed-url` | Cliente/staff | Grant exacto, URL corta y auditoría |
| `GET /api/v1/appointments/availability` | Público/autenticado | Slots derivados; no filas slot |
| `POST /api/v1/appointments` | Público/autenticado | Confirmación transaccional; 409 conflicto |
| `POST /api/v1/calendar/sync` | Staff | Sync incremental/recovery |
| `POST /api/webhooks/stripe` | Stripe | Raw body, firma, persistencia y deduplicación |

Errores: 400 validación, 401 identidad ausente, 403 acción conocida no permitida, 404 recurso privado oculto, 409 conflicto de estado/capacidad, 429 abuso. Las escrituras aceptan idempotency key; respuestas no incluyen stack ni datos internos.

## 6. Frontend Architecture

- Astro entrega HTML localizado y usa islas solo para interacción necesaria.
- Next usa Server Components por defecto; componentes cliente solo en hojas interactivas.
- Route handlers autentican, construyen actor, autorizan y llaman dominio.
- Estado de filtros/paginación vive en URL; formularios locales viven en componente; datos remotos se vuelven a consultar desde servidor.
- `packages/ui` depende de tokens, no de dominio/database. Apps consumen paquetes; database no importa apps.
- Cargas privadas nunca pasan por Sanity ni por props serializadas no filtradas.

## 7. Design System

| Token | Claro | Uso |
|---|---:|---|
| navy | `#0A2540` | Marca, navegación; 15.54:1 sobre blanco |
| cobalt | `#0B63CE` | Acción; 5.69:1 sobre blanco |
| cyan | `#00A3E0` | Acento; 2.87:1, no texto normal sobre blanco |
| green | `#2E7D32` | Éxito; 5.13:1 sobre blanco |
| gold | `#B7791F` | Acento; 3.64:1, no texto normal sobre blanco |
| ink | `#102033` | Texto; 16.45:1 sobre blanco |
| surface | `#F7F9FC` | Panel claro |

Sobre surface: navy 14.73, cobalt 5.40, cyan 2.72, green 4.86, gold 3.45 e ink 15.60. Normal text ≥4.5:1; texto grande y límites ≥3:1. Tipografía: Manrope headings, Inter body, con fallbacks del sistema. Espaciado 4/8/12/16/24/32/48/64; radios 10 control y 16 card. Movimiento 150–240 ms, solo transform/opacity, y cero duración no esencial con reduced motion.

## 8. Authentication & Authorization

Tres niveles independientes:

1. **Identidad:** Supabase Auth prueba quién es el actor.
2. **Rol interno:** `staff_roles` determina capacidades del personal.
3. **Acceso al expediente:** `resource_grants` delega casos, documentos, facturas y citas concretos.

Coincidencia de email no concede nada. Dominio decide antes de I/O; RLS y Storage vuelven a decidir ante acceso directo. El portal recibe 404 para recursos privados no concedidos. Service role solo existe server-side y nunca sustituye autorización. MFA es obligatorio para personal antes del launch.

## 9. BUILD ORDER

Cada bloque se ejecuta desde la raíz futura. No se amplían archivos trackeados fuera de la allowlist; los outputs de migración nombrados por Drizzle son la única excepción generada y trackeada. Los metadatos automáticos de framework (`next-env.d.ts`, `.astro/`, `.next/`, `*.tsbuildinfo`) están excluidos antes del primer checkpoint y nunca se añaden al repositorio.

### Step 1 — Formalizar Phase 0

**Files:** `MASTER_PRD.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATE.md`, `DECISIONS.md`, `tests/contract/phase-zero-governance.test.ts`.

- WHEN the Phase 0 contract runs THE SYSTEM SHALL find the same product model, tenancy model, architecture status, and current phase in all four governed documents.
- WHEN the module authorization contract runs THE SYSTEM SHALL map every implementation task E1-T2 through E3-T6 to an existing `Approved baseline` PRD in `docs/modules/INDEX.md` and classify every missing or unapproved mapping as `module_not_authorized`.
- WHEN the phase-completion fixture omits a required PCR section THE SYSTEM SHALL reject the fixture and identify every missing section.

```bash
corepack pnpm exec vitest run tests/contract/phase-zero-governance.test.ts
```
```bash
git add -A && git commit -m "step 1: formalize phase zero governance"
git tag step-01-phase-zero-governance
```

### Step 2 — Crear shells productivos

**Files:** `apps/www/src/pages/health.astro`, `apps/app/app/layout.tsx`, `apps/app/app/page.tsx`, `apps/app/app/api/health/route.ts`, `tests/e2e/health.spec.ts`.

- WHEN `corepack pnpm install --frozen-lockfile` runs THE SYSTEM SHALL exit 0 without changing `pnpm-lock.yaml`.
- WHEN the shared import contract runs under TypeScript, Vitest, tsx, Next, and Astro THE SYSTEM SHALL resolve `@atlas/config` to `packages/config/src/index.ts` in every runner.
- WHEN the production smoke runs after `corepack pnpm build` THE SYSTEM SHALL start Next production and Astro preview, receive 200 from `/api/health` and `/health`, and terminate both servers.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec vitest run tests/contract/module-resolution.test.ts
corepack pnpm exec tsx --tsconfig tsconfig.json tests/contract/module-resolution.ts
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/health.spec.ts
```
```bash
git add -A && git commit -m "step 2: add production shells"
git tag step-02-production-shells
```

### Step 3 — Implementar sistema visual base

Antes de escribir la primitiva, ejecutar `corepack pnpm dlx shadcn@4.16.1 --help` para resolver el CLI verificado sin generar archivos adicionales.

**Files:** `packages/design-tokens/src/index.css`, `packages/ui/src/index.ts`, `apps/app/app/globals.css`, `apps/app/app/layout.tsx`, `tests/unit/tokens.test.ts`.

- WHEN the token contract runs THE SYSTEM SHALL report zero component color literals outside `packages/design-tokens/src/index.css`.
- WHEN contrast assertions run THE SYSTEM SHALL enforce 4.5:1 for normal text, 3:1 for large text and component boundaries, and reject cyan or gold as normal text on white or surface backgrounds.
- WHEN reduced motion is requested THE SYSTEM SHALL reduce nonessential transitions to zero duration while preserving state changes.

```bash
corepack pnpm exec vitest run tests/unit/tokens.test.ts
corepack pnpm typecheck
corepack pnpm lint
```
```bash
git add -A && git commit -m "step 3: add design system foundation"
git tag step-03-design-system
```

### Step 4 — Establecer Drizzle/Postgres

Ejecutar `DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:generate`; añadir el único migration output reportado por Drizzle junto con los cuatro archivos listados.

**Files:** `packages/database/src/schema.ts`, `packages/database/src/index.ts`, `tests/integration/schema.test.ts`, `DATABASE.md`.

- WHEN migrations run against an empty local Postgres database THE SYSTEM SHALL create every schema object defined by Drizzle and report zero schema drift.
- WHEN the identical migration command runs a second time THE SYSTEM SHALL exit 0 without altering existing rows.
- WHEN the destructive-change fixture is classified THE SYSTEM SHALL return `expand_migrate_contract_required` and execute zero migration statements.

```bash
docker compose up -d --wait postgres
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
corepack pnpm exec vitest run tests/integration/schema.test.ts
```
```bash
git add -A && git commit -m "step 4: establish drizzle authority"
git tag step-04-database-authority
```

### Step 5 — Integrar identidad y roles

**Files:** `packages/auth/src/index.ts`, `apps/app/proxy.ts`, `apps/app/app/login/page.tsx`, `tests/integration/auth.test.ts`, `SECURITY.md`.

- WHEN an anonymous request reaches a protected app route THE SYSTEM SHALL redirect to sign-in without exposing protected content.
- WHEN an authenticated client attempts a staff-only action THE SYSTEM SHALL return 403 and write no domain rows.
- WHEN the MFA recovery fixture is processed THE SYSTEM SHALL expose no recovery code in application logs or telemetry.

```bash
corepack pnpm exec vitest run tests/integration/auth.test.ts
corepack pnpm typecheck
```
```bash
git add -A && git commit -m "step 5: add identity and internal roles"
git tag step-05-identity-roles
```

### Step 6 — Aplicar delegación y RLS

**Files:** `packages/domain/src/authorization.ts`, `packages/database/src/schema.ts`, `packages/auth/src/index.ts`, `tests/integration/rls-delegation.test.ts`, `SECURITY.md`.

- WHEN a client authenticates with an email matching a record THE SYSTEM SHALL receive zero access until an explicit resource grant exists.
- WHEN a client has a case grant but no document grant THE SYSTEM SHALL read the case summary and receive 404 for the document.
- WHEN a direct database request bypasses the UI THE SYSTEM SHALL still enforce identity, internal role, and explicit resource access through RLS and domain authorization.

```bash
corepack pnpm exec vitest run tests/integration/rls-delegation.test.ts
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
```
```bash
git add -A && git commit -m "step 6: enforce delegated authorization"
git tag step-06-delegated-authorization
```

### Step 7 — Proteger documentos

**Files:** `packages/domain/src/documents.ts`, `apps/app/app/api/v1/documents/route.ts`, `packages/database/src/schema.ts`, `tests/integration/storage-access.test.ts`, `docs/modules/document-center.md`.

- WHEN a client requests a delegated document THE SYSTEM SHALL return a signed URL with a short expiry and append one audit event.
- WHEN a signed URL expires THE SYSTEM SHALL deny the object request without changing the underlying grant.
- WHEN a user lacks the exact document grant THE SYSTEM SHALL return 404 even when the object path is known.

```bash
corepack pnpm exec vitest run tests/integration/storage-access.test.ts
```
```bash
git add -A && git commit -m "step 7: protect private documents"
git tag step-07-private-documents
```

### Step 8 — Construir sitio bilingüe

**Files:** `apps/www/src/pages/index.astro`, `apps/www/src/pages/es/index.astro`, `apps/www/src/lib/sanity.ts`, `packages/i18n/src/index.ts`, `tests/contract/public-content.test.ts`.

- WHEN a public route is requested in English or Spanish THE SYSTEM SHALL return localized HTML with a unique title, description, canonical URL, and language alternates.
- WHEN the Sanity schema contract runs THE SYSTEM SHALL allow only public content fields and reject client, tax, credit, document, or financial record fields.
- WHEN the public route contract runs THE SYSTEM SHALL find `Agenda una evaluación` as the primary CTA and `Solicita una cotización` as the secondary CTA on both localized landing pages.

```bash
corepack pnpm exec vitest run tests/contract/public-content.test.ts
corepack pnpm --filter @atlas/www build
```
```bash
git add -A && git commit -m "step 8: add bilingual public acquisition"
git tag step-08-public-content
```

### Step 9 — Capturar leads y atribución

**Files:** `apps/www/src/components/EvaluationForm.astro`, `apps/app/app/api/v1/leads/route.ts`, `packages/domain/src/leads.ts`, `packages/database/src/schema.ts`, `tests/integration/lead-capture.test.ts`.

- WHEN a valid evaluation request includes UTM parameters THE SYSTEM SHALL create one lead, one consent event, and normalized first-touch and last-touch attribution.
- WHEN the same idempotency key is submitted twice THE SYSTEM SHALL return the original response and create no duplicate lead.
- WHEN analytics events are emitted THE SYSTEM SHALL exclude free text, identifiers, documents, tax data, credit data, and case details.

```bash
corepack pnpm exec vitest run tests/integration/lead-capture.test.ts
```
```bash
git add -A && git commit -m "step 9: capture leads and attribution"
git tag step-09-lead-attribution
```

### Step 10 — Implementar CRM

**Files:** `apps/app/app/staff/crm/page.tsx`, `packages/domain/src/crm.ts`, `packages/database/src/schema.ts`, `tests/integration/crm-pipeline.test.ts`, `tests/e2e/crm.spec.ts`.

- WHEN staff advances a lead THE SYSTEM SHALL record the new stage, actor, timestamp, and prior stage in audit history.
- WHEN a stage transition violates the configured pipeline THE SYSTEM SHALL return 409 and preserve the current stage.
- WHEN CRM filters are encoded in the URL THE SYSTEM SHALL reproduce the same result ordering after reload.

```bash
corepack pnpm exec vitest run tests/integration/crm-pipeline.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/crm.spec.ts
```
```bash
git add -A && git commit -m "step 10: add crm pipeline"
git tag step-10-crm-pipeline
```

### Step 11 — Gestionar casos

**Files:** `apps/app/app/staff/cases/page.tsx`, `packages/domain/src/cases.ts`, `packages/database/src/schema.ts`, `tests/integration/cases.test.ts`, `tests/e2e/case-workspace.spec.ts`.

- WHEN staff converts a qualified lead THE SYSTEM SHALL create one client and one case while preserving attribution and pipeline history.
- WHEN a case note is marked internal THE SYSTEM SHALL expose it through neither client-portal queries nor analytics payloads.
- WHEN a case status changes THE SYSTEM SHALL append an immutable audit event and expose the current stage only to explicitly granted clients.

```bash
corepack pnpm exec vitest run tests/integration/cases.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/case-workspace.spec.ts
```
```bash
git add -A && git commit -m "step 11: add case operations"
git tag step-11-case-operations
```

### Step 12 — Implementar agenda

**Files:** `packages/domain/src/appointments.ts`, `apps/app/app/api/v1/appointments/route.ts`, `packages/database/src/schema.ts`, `tests/unit/availability.test.ts`, `tests/integration/booking-concurrency.test.ts`.

- WHEN availability is requested THE SYSTEM SHALL derive slots from rules, blocks, appointments, buffers, notice, horizon, and `America/Chicago` without storing slot rows.
- WHEN concurrent requests target one capacity-one slot THE SYSTEM SHALL confirm exactly one appointment and return 409 for every conflicting request.
- WHEN an appointment is rescheduled THE SYSTEM SHALL cancel and replace it atomically while retaining `rescheduled_from_id` history.

```bash
corepack pnpm exec vitest run tests/unit/availability.test.ts
corepack pnpm exec vitest run tests/integration/booking-concurrency.test.ts
```
```bash
git add -A && git commit -m "step 12: add appointment engine"
git tag step-12-appointment-engine
```

### Step 13 — Sincronizar Google Calendar

**Files:** `packages/domain/src/calendar.ts`, `packages/database/src/schema.ts`, `apps/app/app/api/v1/calendar/route.ts`, `tests/integration/google-calendar.test.ts`, `.env.example`.

- WHEN Google free-busy reports an overlap THE SYSTEM SHALL remove the affected slot before confirmation.
- WHEN an external event is updated THE SYSTEM SHALL use stored mapping and `etag` with `If-Match` to prevent blind overwrites.
- WHEN a sync token expires THE SYSTEM SHALL perform a bounded full resync, persist the replacement token, and mark conflicting deletions for manual review instead of cancelling appointments.

```bash
corepack pnpm exec vitest run tests/integration/google-calendar.test.ts
```
```bash
git add -A && git commit -m "step 13: add calendar synchronization"
git tag step-13-calendar-sync
```

### Step 14 — Crear cotizaciones/facturas

**Files:** `packages/domain/src/billing.ts`, `apps/app/app/staff/billing/page.tsx`, `packages/database/src/schema.ts`, `tests/integration/quotes-invoices.test.ts`, `docs/modules/billing.md`.

- WHEN staff issues a quote THE SYSTEM SHALL persist immutable line amounts in integer minor units and a versioned acceptance snapshot.
- WHEN a client accepts an expired or superseded quote THE SYSTEM SHALL return 409 and create no invoice.
- WHEN an accepted quote is converted THE SYSTEM SHALL create one operational invoice linked to the client, case, and quote.

```bash
corepack pnpm exec vitest run tests/integration/quotes-invoices.test.ts
```
```bash
git add -A && git commit -m "step 14: add quotes and invoices"
git tag step-14-quotes-invoices
```

### Step 15 — Integrar Stripe

**Files:** `apps/app/app/api/webhooks/stripe/route.ts`, `packages/domain/src/payments.ts`, `packages/database/src/schema.ts`, `tests/integration/stripe-webhooks.test.ts`, `tests/integration/stripe-reconciliation.test.ts`.

- WHEN a valid Stripe event is replayed THE SYSTEM SHALL return 200, process the external event id once, and leave the operational invoice state converged with Stripe.
- WHEN Stripe events arrive out of order THE SYSTEM SHALL refetch the authoritative external object before updating local financial status.
- WHEN reconciliation detects a mismatch THE SYSTEM SHALL create a durable recovery item without silently overwriting the operational record.

```bash
corepack pnpm exec vitest run tests/integration/stripe-webhooks.test.ts
corepack pnpm exec vitest run tests/integration/stripe-reconciliation.test.ts
```
```bash
git add -A && git commit -m "step 15: add stripe reliability"
git tag step-15-stripe-reliability
```

### Step 16 — Construir portal delegado

**Files:** `apps/app/app/client/portal/page.tsx`, `packages/domain/src/portal.ts`, `tests/integration/portal-access.test.ts`, `tests/e2e/client-portal.spec.ts`, `docs/modules/client-portal.md`.

- WHEN a client opens the portal THE SYSTEM SHALL list only explicitly granted cases, documents, invoices, and appointments.
- WHEN a resource grant is revoked THE SYSTEM SHALL remove access on the next server request and refuse every newly requested signed URL.
- WHEN the portal is tested at 320 CSS pixels and 200 percent zoom THE SYSTEM SHALL expose no horizontal page scroll and retain a visible focus indicator.

```bash
corepack pnpm exec vitest run tests/integration/portal-access.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/client-portal.spec.ts
```
```bash
git add -A && git commit -m "step 16: add delegated client portal"
git tag step-16-client-portal
```

### Step 17 — Añadir jobs y observabilidad

Los manifests ya fijan los seis SDKs. Antes de cualquier import ejecutar literalmente:

```bash
corepack pnpm install --frozen-lockfile
```

**Files:** `packages/domain/src/jobs.ts`, `packages/observability/src/index.ts`, `packages/database/src/schema.ts`, `tests/integration/jobs.test.ts`, `tests/unit/telemetry-redaction.test.ts`.

- WHEN an Inngest job is delivered twice THE SYSTEM SHALL execute one durable side effect under its idempotency key and retain Postgres as the source of status.
- WHEN retries are exhausted THE SYSTEM SHALL create a dead-letter record with a manual recovery path and a redacted request id.
- WHEN telemetry is emitted THE SYSTEM SHALL keep `sendDefaultPii` false and exclude documents, tax data, identifiers, case notes, credit reports, and portal free text from Sentry, PostHog, logs, and traces.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec vitest run tests/integration/jobs.test.ts
corepack pnpm exec vitest run tests/unit/telemetry-redaction.test.ts
```
```bash
git add -A && git commit -m "step 17: add durable jobs and private telemetry"
git tag step-17-operations-observability
```

### Step 18 — Cerrar evidencia productiva

**Files:** `.github/workflows/ci.yml`, `apps/www/vercel.json`, `apps/app/vercel.json`, `docs/phases/PCR-001-production-foundation.md`, `PROJECT_STATE.md`.

`ci.yml` usa Node/pnpm pinned, Postgres `postgres:17.10-alpine3.24` publicado en `55432` y ejecuta el gate automatizado de §20.1. `apps/www/vercel.json` declara `framework: astro`, `installCommand: cd ../.. && corepack pnpm install --frozen-lockfile`, `buildCommand: cd ../.. && corepack pnpm --filter @atlas/www build` y `outputDirectory: dist`. `apps/app/vercel.json` declara `framework: nextjs`, el mismo install y `buildCommand: cd ../.. && corepack pnpm --filter @atlas/app build`. Ninguno contiene `env` ni secretos. El PCR incluye literalmente los headings `## Verification evidence` y `## Rollback`, seguidos por evidencia ejecutada y un procedimiento reversible.

- WHEN the CI policy fixture contains a failed lint, typecheck, test, accessibility, security, or build job THE SYSTEM SHALL classify the merge gate as `blocked`.
- WHEN the Vercel configuration contract runs THE SYSTEM SHALL find separate reproducible build settings for `apps/www` and `apps/app` with no embedded secret values.
- WHEN the release-document contract runs THE SYSTEM SHALL find a Phase Completion Report and current-state record containing verification evidence and rollback instructions.

```bash
RELEASE_GATE=true corepack pnpm exec vitest run tests/contract/production-gate.test.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm exec playwright test tests/e2e/health.spec.ts
```
```bash
git add -A && git commit -m "step 18: add production evidence gate"
git tag step-18-production-gate
```

### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced.

## 10. Environment Setup

### Prerrequisitos

Git Bash en Windows, Git, Node 24.18.1, pnpm 11.18.0, Docker Desktop y cuentas de Supabase, Vercel, Stripe, Sanity, Google Cloud, Inngest, Sentry, PostHog y proveedor de correo.

### Variables

| Variable | Propósito | Fuente | Primera necesidad | Secreta |
|---|---|---|---:|---|
| `NODE_ENV` | Modo runtime/build | Vercel o shell local | 2 | no |
| `TZ` | Pruebas deterministas `America/Chicago` | Repo/CI | bootstrap | no |
| `CI` | Modo estricto Playwright | GitHub Actions (`true`) | 2 | no |
| `PLAYWRIGHT_BASE_URL` | Base de browser tests | Repo/CI | 2 | no |
| `RELEASE_GATE` | Activa el contrato final solo en Step 18/CI release | Comando/CI (`true`) | 18 | no |
| `APP_BASE_URL` | URL privada | Vercel/local | 2 | no |
| `WWW_BASE_URL` | URL pública | Vercel/local | 2 | no |
| `DATABASE_URL` | Conexión pool de aplicación | Supabase/Vercel | 4 | sí |
| `DIRECT_DATABASE_URL` | Drizzle CLI directo; local usa literal 55432 | Supabase/Vercel o comando | 4 | sí en producción |
| `TEST_DATABASE_URL` | Postgres de tests; setup local usa literal 55432 | CI/comando | 4 | no local |
| `NEXT_PUBLIC_SUPABASE_URL` | Endpoint público Supabase | Supabase | 5 | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública Supabase | Supabase | 5 | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Operación server-only excepcional | Supabase/Vercel | 5 | sí |
| `SANITY_PROJECT_ID` | Proyecto CMS público | Sanity | 8 | no |
| `SANITY_DATASET` | Dataset público | Sanity | 8 | no |
| `STRIPE_SECRET_KEY` | API server Stripe | Stripe | 15 | sí |
| `STRIPE_WEBHOOK_SECRET` | Firma webhook | Stripe | 15 | sí |
| `RESEND_API_KEY` | Correo transaccional HTTP | Resend | 17 | sí |
| `EMAIL_FROM` | Remitente verificado | Resend | 17 | no |
| `GOOGLE_CLIENT_ID` | OAuth Calendar | Google Cloud | 13 | no |
| `GOOGLE_CLIENT_SECRET` | OAuth Calendar | Google Cloud | 13 | sí |
| `INNGEST_EVENT_KEY` | Envío de eventos | Inngest | 17 | sí |
| `INNGEST_SIGNING_KEY` | Verificación Inngest | Inngest | 17 | sí |
| `SENTRY_DSN` | Errores/trazas | Sentry | 17 | sí |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analítica allowlisted | PostHog | 9 | no |
| `NEXT_PUBLIC_POSTHOG_HOST` | Host PostHog | PostHog | 9 | no |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Export traces | Proveedor OTLP | 17 | sí |

### Bootstrap idempotente

El bundle permanece dentro del repo. Copiar workspace no sobrescribe archivos existentes y el guard path termina 0. `.gitignore` llega antes del primer `git add`.

```bash
set -e
node -e "const fs=require('node:fs');const src='blueprints/project-atlas/workspace';if(fs.existsSync('.workspace-applied'))process.exit(0);const copy=(from,to)=>{const s=fs.statSync(from);if(s.isDirectory()){fs.mkdirSync(to,{recursive:true});for(const n of fs.readdirSync(from))copy(from+'/'+n,to+'/'+n)}else if(!fs.existsSync(to))fs.copyFileSync(from,to)};for(const n of fs.readdirSync(src))copy(src+'/'+n,n);fs.writeFileSync('.workspace-applied','v2\n')"
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main
git rev-parse HEAD >/dev/null 2>&1 || { git add -A && git commit -m "chore: scaffold project atlas" --allow-empty; }
corepack prepare pnpm@11.18.0 --activate
corepack pnpm install --lockfile-only
git add pnpm-lock.yaml
git diff --cached --quiet || git commit -m "chore: lock workspace dependencies"
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
docker compose up -d --wait postgres
corepack pnpm lint
```

Desde Step 4, migración local/CI determinista:

```bash
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
```

Producción recibe `DIRECT_DATABASE_URL` desde Vercel/Supabase. `packages/database/drizzle.config.ts` lee esa variable directamente y no carga `.env`. Vitest recibe `TEST_DATABASE_URL` desde `tests/setup.ts` o el comando inline.

## 11. Dependencies

Todos los pins se verificaron el 2026-08-02 y están en manifests workspace o en el comando indicado antes de imports.

| Paquete | Pin | Fuente | Instalación/uso |
|---|---:|---|---|
| Node | 24.18.1 | `https://nodejs.org/dist/v24.18.1/` | prerrequisito/`.nvmrc` |
| pnpm | 11.18.0 | `https://registry.npmjs.org/pnpm/latest` | bootstrap/packageManager |
| TypeScript | `~6.0.3` | `https://registry.npmjs.org/typescript/latest` | root manifest/bootstrap |
| turbo | 2.10.8 | `https://registry.npmjs.org/turbo/latest` | root manifest/bootstrap |
| next | 16.2.12 | `https://registry.npmjs.org/next/latest` | `apps/app/package.json`/bootstrap |
| react/react-dom | 19.2.8 | `https://registry.npmjs.org/react/latest` | app/ui manifests/bootstrap |
| astro | 7.1.6 | `https://registry.npmjs.org/astro/latest` | www manifest/bootstrap |
| tailwindcss | 4.3.3 | `https://registry.npmjs.org/tailwindcss/latest` | app/www manifests/bootstrap |
| `@tailwindcss/postcss` | 4.3.3 | `https://registry.npmjs.org/@tailwindcss%2fpostcss/latest` | app manifest/bootstrap |
| `@tailwindcss/vite` | 4.3.3 | `https://registry.npmjs.org/@tailwindcss%2fvite/latest` | www manifest/bootstrap |
| postcss | 8.5.25 | `https://registry.npmjs.org/postcss/latest` | app manifest/bootstrap |
| radix-ui | 1.6.7 | `https://registry.npmjs.org/radix-ui/latest` | ui manifest/bootstrap |
| react-hook-form | 7.84.0 | `https://registry.npmjs.org/react-hook-form/latest` | ui manifest/bootstrap |
| shadcn CLI | 4.16.1 | `https://registry.npmjs.org/shadcn/latest` | Step 3 `corepack pnpm dlx shadcn@4.16.1 --help` |
| drizzle-orm | 0.45.2 | `https://registry.npmjs.org/drizzle-orm/latest` | database manifest/bootstrap |
| drizzle-kit | 0.31.10 | `https://registry.npmjs.org/drizzle-kit/latest` | root manifest/bootstrap |
| postgres | 3.4.9 | `https://registry.npmjs.org/postgres/latest` | database manifest/bootstrap |
| zod | 4.4.3 | `https://registry.npmjs.org/zod/latest` | auth/domain/database/validation manifests |
| `@supabase/supabase-js` | 2.111.0 | `https://registry.npmjs.org/@supabase%2fsupabase-js/latest` | auth manifest/bootstrap |
| stripe | 22.4.0 | `https://registry.npmjs.org/stripe/latest` | domain manifest/bootstrap |
| inngest | 4.14.0 | `https://registry.npmjs.org/inngest/latest` | domain manifest; Step 17 frozen install before import |
| `@sentry/nextjs` | 10.69.0 | `https://registry.npmjs.org/@sentry%2fnextjs/latest` | observability manifest; Step 17 frozen install |
| posthog-js | 1.409.5 | `https://registry.npmjs.org/posthog-js/latest` | observability manifest; Step 17 frozen install |
| `@opentelemetry/api` | 1.9.1 | `https://registry.npmjs.org/@opentelemetry%2fapi/latest` | observability manifest; Step 17 frozen install |
| `@opentelemetry/sdk-node` | 0.221.0 | `https://registry.npmjs.org/@opentelemetry%2fsdk-node/latest` | observability manifest; Step 17 frozen install |
| `@opentelemetry/exporter-trace-otlp-http` | 0.221.0 | `https://registry.npmjs.org/@opentelemetry%2fexporter-trace-otlp-http/latest` | observability manifest; Step 17 frozen install |
| `@biomejs/biome` | 2.5.6 | `https://registry.npmjs.org/@biomejs%2fbiome/latest` | root manifest/bootstrap |
| Vitest | 4.1.10 | `https://registry.npmjs.org/vitest/latest` | root manifest/bootstrap |
| `@playwright/test` | 1.62.1 | `https://registry.npmjs.org/@playwright%2ftest/latest` | root manifest/bootstrap |
| `@types/node` | 24.13.3 | `https://www.npmjs.com/package/@types/node?activeTab=versions` | root manifest/bootstrap; Node 24 line |
| `@types/react` | 19.2.17 | `https://www.npmjs.com/package/@types/react` | root manifest/bootstrap |
| `@types/react-dom` | 19.2.3 | `https://www.npmjs.com/package/@types/react-dom?activeTab=versions` | root manifest/bootstrap |
| tsx | 4.23.1 | `https://registry.npmjs.org/tsx/latest` | root manifest/bootstrap |
| Postgres image | `postgres:17.10-alpine3.24` | `https://hub.docker.com/_/postgres` | docker compose |

Sanity, Google Calendar y Resend usan HTTP server-side para evitar pins SDK no verificados.

`pnpm-workspace.yaml` mantiene `strictDepBuilds` por defecto y una allowlist explícita: `esbuild`, `sharp` y `@sentry/cli` pueden ejecutar sus scripts fijados por lockfile; `core-js` y `protobufjs` quedan denegados explícitamente. Toda nueva dependencia con lifecycle script requiere revisión de supply chain y una decisión `true`/`false`, nunca aprobación interactiva durante CI.

## 12. Deployment Strategy

Dos proyectos Vercel: `apps/www` y `apps/app`. Supabase hospeda Postgres/Auth/Storage. Preview por PR; producción desde `main` tras §20.1. Migración expand-compatible ocurre antes del deploy consumidor. Rollback revierte aplicación y desactiva flags; nunca destruye datos automáticamente. Conexión real de proyectos, dominios y variables es launch gate manual.

## 13. Testing Strategy

- Unit: tokens, disponibilidad y redacción.
- Contract: documentos, contenido, resolución `@atlas/*`, CI/Vercel/PCR.
- Integration: Postgres real, RLS, idempotencia, webhooks, jobs y calendarios con fixtures HTTP.
- E2E: Next `start` + Astro `preview`, CRM, casos, portal, 320 px y 200% zoom.
- Security: acceso negativo, firma, replay, secretos y dependencia auditada en CI.
- No network real en tests; providers usan fixtures deterministas.

## 14. Security & Secrets

Secretos solo en entornos Vercel/GitHub/provider. `.env` se ignora; `.env.example` no contiene secretos. Service role, Stripe secret, refresh tokens y contenido sensible nunca llegan al cliente. CSP, cookies Secure/HttpOnly/SameSite, CSRF/origin checks, rate limit, uploads restringidos y audit events forman el baseline. Sanity rechaza campos privados. PostHog portal desactiva autocapture/replay. Sentry mantiene `sendDefaultPii:false`.

## 15. Accessibility

Objetivo WCAG 2.2 AA: semántica, skip link, headings, teclado, foco visible, nombres accesibles, errores asociados, live regions moderadas, zoom 200%, reflow 320 CSS px, contraste y reduced motion. Automatización no sustituye la revisión manual indicada en launch gates.

## 16. Observability & Cost

Request ID y trace context cruzan app, domain, providers y jobs. Logs estructurados usan allowlist. Sentry recibe errores redacted; PostHog recibe eventos de funnel públicos y un conjunto mínimo del portal; OpenTelemetry exporta trazas sin payloads. Alertas: webhooks/reconciliation, dead letters, fallos sync, auth anomalies y health. Presupuestos iniciales se revisan mensualmente; no se inventan importes sin cotizaciones de proveedores.

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime.

## 18. Skills to Use During Build

Las skills locales son capacidades de proceso, no dependencias de runtime. Antes de una fase, el agente confirma que la ruta requerida existe y lee su `SKILL.md` completo. Si falta una skill obligatoria, la fase queda bloqueada y se reporta; no existe fallback silencioso. Ninguna skill prevalece sobre el Master PRD, ADRs, `AGENTS.md` o una decisión del Product Owner.

| Capacidad | Ruta local | Uso autorizado | Límite obligatorio |
|---|---|---|---|
| Arquitectura | `the-architect-main/` | PRDs, arquitectura, roadmap y gates documentales | No autoriza código ni cambia decisiones del Product Owner |
| UI/UX Pro Max | `ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/` | Sistema de diseño, overrides por página, responsive, accesibilidad, motion y revisión visual | No cambia requisitos de negocio; no hay UI sin handoff persistido |
| Superpowers | `superpowers-main/` | Planes de implementación, worktrees, TDD, verificación y recepción/revisión técnica | Solo después de PRD aprobado; no autoaudita ni altera arquitectura |
| Cyber Neo | `cyber-neo-main/skills/cyber-neo/` | Auditoría SCA/SAST/secrets/authz/crypto/config/CI/supply-chain contra OWASP/CWE | Estrictamente solo lectura; no ejecuta app, instala/fija paquetes, modifica el proyecto ni revela secretos |

### 18.1 Secuencia obligatoria

1. Arquitectura y PRD del módulo aprobados.
2. Para toda superficie visual, UI/UX Pro Max detecta Astro o Next, genera primero el design system y lo persiste en `design-system/project-atlas/MASTER.md`; los overrides viven en `design-system/project-atlas/pages/`.
3. Superpowers convierte el PRD en un plan autocontenido bajo `docs/superpowers/plans/`, prepara un worktree aislado y verifica un baseline limpio.
4. El implementador sigue red-green-refactor: prueba fallida observada, implementación mínima, prueba verde y refactor con el gate verde.
5. CI aporta evidencia fresca; un auditor independiente revisa requisitos, arquitectura, accesibilidad, seguridad, casos límite y pruebas.
6. Cyber Neo ejecuta una auditoría separada y de solo lectura para cambios sensibles.
7. Un corrector distinto verifica cada hallazgo, corrige los defectos confirmados con pruebas de regresión y solicita retest y reauditoría.
8. El Product Owner conserva los gates humanos de §20.1 para auth, pagos, base de datos, seguridad, arquitectura y producción.

Cyber Neo es obligatorio para autenticación/autorización/RLS/Storage, Stripe y webhooks, documentos o datos personales/fiscales/crédito, migraciones, CI/CD y despliegue, observabilidad/analítica e IA que acceda a datos del cliente. Su informe no sustituye asesoría legal ni revisión de cumplimiento normativo.

Las carpetas locales de skills se excluyen de Biome, TypeScript, Vitest y Playwright para impedir que código de terceros contamine los gates del producto; no se copian dentro del scaffold emitido y no forman parte del build.

## 19. Agent Workspace

### 19.1 CLAUDE.md

Se emite `workspace/CLAUDE.md` (menos de 200 líneas, comandos primero). Apunta a `blueprints/project-atlas/tasks.json` y al epic coincidente bajo `blueprints/project-atlas/epics/`.

### 19.2 Documentación viva

El workspace emite README, MASTER_PRD, PROJECT_CONTEXT, PROJECT_MEMORY, PROJECT_STATE, AGENTS, ROADMAP, CHANGELOG, ARCHITECTURE, DATABASE, API, SECURITY, CONTENT_GUIDELINES, SEO_STRATEGY, UX_UI_GUIDELINES, CONTRIBUTING, VISION, PROJECT_PRINCIPLES, DECISIONS y TEAM_ROLES. Cada documento declara Owner, Status y Update rule. También emite ADRs, module PRDs, PCR template y READMEs especializados.

### 19.3 Permissions

`workspace/.claude/settings.json` permite todos los comandos Verify y, tras la copia inicial, los comandos bootstrap de git, Corepack, lockfile y browser: corepack pnpm install/build/typecheck/lint/test/test:e2e, Vitest, Playwright, tsx contract, shadcn pin check, www build, Docker Postgres y los comandos DB inline literales. Niega secrets, push, reset hard, volume delete y DB reset.

### 19.4 Skills/rules locales

`phase-completion` genera PCR y sincroniza estado/memoria. `independent-audit` exige revisión read-only inicial. Rules path-scoped cubren database, security, payments, UI y documentation. No existe `.claude/commands/`.

### 19.5 Manifests y exports

Se emiten manifests reales para las dos apps y los nueve paquetes. `@atlas/domain` existe antes de Stripe/Inngest; `@atlas/observability` fija los cinco SDKs de observabilidad. Todos exportan `src/index.ts`; esos entrypoints existen en workspace.

### 19.6 Emitted artifacts and reconciliation

| Artefacto emitido | Función | Exclusión bundle |
|---|---|---|
| `package.json` + `pnpm-workspace.yaml` | scripts/workspaces/pins | `!blueprints/**` en workspace resolver |
| `apps/app/package.json`, `apps/www/package.json` | package names/build/start/preview | apps no recorren raíz; tsconfigs excluyen `../../blueprints/**` |
| nueve `packages/*/package.json` | names/exports/pins | resolver pnpm excluye bundle |
| `tsconfig.json` | alias `@atlas/*` | `blueprints/**` |
| `apps/app/tsconfig.json`, `apps/www/tsconfig.json` | runners app | `../../blueprints/**` |
| `vitest.config.ts` | alias regex y setup | `blueprints/**` |
| `playwright.config.ts` | production web servers | `**/blueprints/**` |
| `biome.json` | lint/format | `!!blueprints/**` |
| `turbo.json` | build/typecheck graph | `!blueprints/**` en inputs |
| `packages/database/drizzle.config.ts` | schema exact/env direct | n/a: lee un path literal, no recorre bundle |
| `docker-compose.yml` | Postgres local | n/a: no recorre árbol |
| `.gitignore` | secretos/outputs | bundle permanece trackeado |
| skills locales en raíz | proceso de arquitectura/diseño/implementación/auditoría | Biome, TypeScript, Vitest y Playwright las excluyen literalmente; no entran al build |

**Cross-artifact value reconciliation**

| Valor | Copias comparadas | Compared |
|---|---|---|
| DB local | compose 55432; setup; `.env.example`; tasks; epics; §9/§10/§20.1; CLAUDE/AGENTS | yes |
| Next puerto/ruta | Playwright 3000 `/api/health`; Step 2; test E2E | yes |
| Astro puerto/ruta | Playwright 4321 `/health`; Step 2; test E2E | yes |
| Package entry | manifests `./src/index.ts`; TS paths; Vitest regex; tsx contract | yes |
| Package names | manifests; filters; imports; directory tree | yes |
| Task count | tasks 18; epics 3×6; §9 18 | yes |
| Checkpoint tags | tasks; §9; epics | yes |
| Provider pins | §11; manifests; Step 17 | yes |
| Bundle exclusion | pnpm, Turbo, TS configs, Biome, Vitest, Playwright | yes |
| Production smoke | Playwright config; Step 2; Step 18; CI contract; §20.1 | yes |
| Skill governance | §18; `AGENTS.md`; `CLAUDE.md`; `TEAM_ROLES.md`; `PROJECT_STATE.md`; `DECISIONS.md`; reglas UI/security | yes |
| Skill exclusions | Biome; TypeScript; Vitest; Playwright | yes |

**Resolution prueba cruzada:** `tests/contract/module-resolution.ts` se ejecuta con tsx/tsconfig; el `.test.ts` con Vitest; Step 2 importa el mismo package desde ambas apps y construye ambas.

**Byte-exact reconciliation:** NOT APPLICABLE — el blueprint no dicta snapshots/goldens binarios o mensajes de runtime.

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance and launch gates

**Gate automatizado reproducible** — ejecutar después de todos los checkpoints:

```bash
corepack pnpm install --frozen-lockfile
docker compose up -d --wait postgres
DIRECT_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test TEST_DATABASE_URL=postgresql://atlas:atlas@127.0.0.1:55432/atlas_test corepack pnpm db:migrate
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
RELEASE_GATE=true corepack pnpm exec vitest run tests/contract/production-gate.test.ts
corepack pnpm exec playwright test tests/e2e/health.spec.ts
corepack pnpm test:e2e
```

**Launch gates externos — no bloquean ninguna tarea local y no los certifica el builder:**

1. Product Owner aprueba alcance, contenido, PCR y release candidate.
2. Auditor independiente revisa diff completo; hallazgos materiales se corrigen o rechazan con evidencia; re-audit finaliza.
3. GitHub real configura branch protection de `main`, required checks, revisión obligatoria y prohibición de push directo.
4. Se conectan manualmente dos proyectos Vercel a `apps/www` y `apps/app`, dominios, variables y ambientes protegidos.
5. Se revisan legalmente privacidad, términos, consentimientos, disclaimers, retención y alcance regulatorio.
6. Owner/staff activa MFA y ejecuta restauración/rollback tabletop antes del primer cliente.

### 20.2 Riesgos

| Riesgo | Mitigación |
|---|---|
| Acceso cruzado | grants + dominio + RLS + tests negativos |
| Evento Stripe duplicado/desordenado | ledger, idempotencia, refetch y reconciliación |
| Doble cita | constraint/transacción y test concurrente |
| Filtración telemetría | allowlists, tests de redacción, replay/autocapture off |
| Complejidad para operador único | fases estrechas y recuperación manual |
| Dependencia provider | adapters, estado durable local y runbooks |

### 20.3 Decisiones fijadas

- Una organización, sin multi-tenancy.
- Production-ready foundation, sin prototipo desechable.
- Astro `www` + Next `app`.
- Drizzle único dueño de schema/migrations.
- Supabase Auth identifica; dominio/RLS autorizan.
- Sanity público únicamente.
- Stripe externo financiero; Postgres operacional.
- Inngest coordina, no posee estado.
- Agenda de Release 1 estrecha con Google Calendar.
- Motor de precios desde foundation con publicación off por defecto y modos `public`, `from`, `quote` y `consultation`; cada publicación requiere activación del Product Owner.
- Monolito modular con base transaccional central, primitivas compartidas y provider adapters; microservicios solo mediante ADR justificado.
- Business Formation es el primer vertical completo; cloud-first precede homelab/hybrid.

### 20.4 Después de Release 1

Automatizaciones ampliadas, academia autenticada, reporting avanzado, IA bajo PRD específico, servicios futuros y app móvil se evalúan con métricas y decisiones nuevas; no se anticipan en la fundación.
