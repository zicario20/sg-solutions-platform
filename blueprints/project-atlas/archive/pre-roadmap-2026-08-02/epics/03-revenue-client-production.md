# Epic 03 — Revenue, Client Portal & Production

**Objetivo:** cerrar calendario, cotizaciones, Stripe, portal, jobs/telemetría y evidencia de producción.  
**Stack:** Google Calendar API, Stripe 22.4.0, Inngest 4.14.0, Sentry 10.69.0, PostHog 1.409.5, OpenTelemetry 1.9.1/0.221.0, Vercel y GitHub Actions.  
**Límites:** proveedores externos no son fuente operacional; sin auto-merge ni conexión automática de dominios/producción.

## Subárbol y contratos

Las citas locales siguen siendo canónicas frente a Google. Stripe es autoridad financiera externa; el ledger operacional, deduplicación y recovery viven en Postgres. Inngest coordina jobs cuyos estados, intentos y dead letters son durables. El portal compone exclusivamente grants de caso, documento, factura y cita.

## Tareas

### E3-T1 — Sincronizar Google Calendar

**Dependencias:** E2-T6.  
**Archivos:** `packages/domain/src/calendar.ts`, `packages/database/src/schema.ts`, `apps/app/app/api/v1/calendar/route.ts`, `tests/integration/google-calendar.test.ts`, `.env.example`.

Implementar OAuth server-side, free-busy, mapeo, etag y sincronización incremental con recuperación acotada.

**Criterios de aceptación**

- WHEN Google free-busy reports an overlap THE SYSTEM SHALL remove the affected slot before confirmation.
- WHEN an external event is updated THE SYSTEM SHALL use stored mapping and `etag` with `If-Match` to prevent blind overwrites.
- WHEN a sync token expires THE SYSTEM SHALL perform a bounded full resync, persist the replacement token, and mark conflicting deletions for manual review instead of cancelling appointments.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/google-calendar.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 13: add calendar synchronization"
git tag step-13-calendar-sync
```

### E3-T2 — Crear cotizaciones y facturas

**Dependencias:** E2-T5.  
**Archivos:** `packages/domain/src/billing.ts`, `apps/app/app/staff/billing/page.tsx`, `packages/database/src/schema.ts`, `tests/integration/quotes-invoices.test.ts`, `docs/modules/billing.md`.

Persistir versiones, importes minor-unit, expiración, aceptación y conversión transaccional. El motor admite `public`, `from`, `quote` y `consultation`; la publicación permanece off hasta activación del Product Owner.

**Criterios de aceptación**

- WHEN staff issues a quote THE SYSTEM SHALL persist immutable line amounts in integer minor units and a versioned acceptance snapshot.
- WHEN a client accepts an expired or superseded quote THE SYSTEM SHALL return 409 and create no invoice.
- WHEN an accepted quote is converted THE SYSTEM SHALL create one operational invoice linked to the client, case, and quote.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/quotes-invoices.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 14: add quotes and invoices"
git tag step-14-quotes-invoices
```

### E3-T3 — Integrar Stripe y reconciliación

**Dependencias:** E3-T2.  
**Archivos:** `apps/app/app/api/webhooks/stripe/route.ts`, `packages/domain/src/payments.ts`, `packages/database/src/schema.ts`, `tests/integration/stripe-webhooks.test.ts`, `tests/integration/stripe-reconciliation.test.ts`.

Usar firma raw-body, event ledger, idempotency keys, refetch autoritativo y recovery items durables.

**Criterios de aceptación**

- WHEN a valid Stripe event is replayed THE SYSTEM SHALL return 200, process the external event id once, and leave the operational invoice state converged with Stripe.
- WHEN Stripe events arrive out of order THE SYSTEM SHALL refetch the authoritative external object before updating local financial status.
- WHEN reconciliation detects a mismatch THE SYSTEM SHALL create a durable recovery item without silently overwriting the operational record.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/stripe-webhooks.test.ts
corepack pnpm exec vitest run tests/integration/stripe-reconciliation.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 15: add stripe reliability"
git tag step-15-stripe-reliability
```

### E3-T4 — Construir portal cliente delegado

**Dependencias:** E2-T1, E3-T1, E3-T3.  
**Archivos:** `apps/app/app/client/portal/page.tsx`, `packages/domain/src/portal.ts`, `tests/integration/portal-access.test.ts`, `tests/e2e/client-portal.spec.ts`, `docs/modules/client-portal.md`.

Componer recursos grant-filtered server-side y revalidar acceso en cada request; nunca serializar notas internas.

**Criterios de aceptación**

- WHEN a client opens the portal THE SYSTEM SHALL list only explicitly granted cases, documents, invoices, and appointments.
- WHEN a resource grant is revoked THE SYSTEM SHALL remove access on the next server request and refuse every newly requested signed URL.
- WHEN the portal is tested at 320 CSS pixels and 200 percent zoom THE SYSTEM SHALL expose no horizontal page scroll and retain a visible focus indicator.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/portal-access.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/client-portal.spec.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 16: add delegated client portal"
git tag step-16-client-portal
```

### E3-T5 — Añadir jobs durables y observabilidad privada

**Dependencias:** E2-T3, E3-T1, E3-T3.  
**Archivos:** `packages/domain/src/jobs.ts`, `packages/observability/src/index.ts`, `packages/database/src/schema.ts`, `tests/integration/jobs.test.ts`, `tests/unit/telemetry-redaction.test.ts`.

Antes de importar SDKs, ejecutar el install congelado sobre manifests que fijan `inngest@4.14.0`, `@sentry/nextjs@10.69.0`, `posthog-js@1.409.5`, `@opentelemetry/sdk-node@0.221.0`, `@opentelemetry/api@1.9.1` y `@opentelemetry/exporter-trace-otlp-http@0.221.0`.

**Criterios de aceptación**

- WHEN an Inngest job is delivered twice THE SYSTEM SHALL execute one durable side effect under its idempotency key and retain Postgres as the source of status.
- WHEN retries are exhausted THE SYSTEM SHALL create a dead-letter record with a manual recovery path and a redacted request id.
- WHEN telemetry is emitted THE SYSTEM SHALL keep `sendDefaultPii` false and exclude documents, tax data, identifiers, case notes, credit reports, and portal free text from Sentry, PostHog, logs, and traces.

**Verify**
```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec vitest run tests/integration/jobs.test.ts
corepack pnpm exec vitest run tests/unit/telemetry-redaction.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 17: add durable jobs and private telemetry"
git tag step-17-operations-observability
```

### E3-T6 — Cerrar CI despliegue y Phase Completion Report

**Dependencias:** E3-T4, E3-T5.  
**Archivos:** `.github/workflows/ci.yml`, `apps/www/vercel.json`, `apps/app/vercel.json`, `docs/phases/PCR-001-production-foundation.md`, `PROJECT_STATE.md`.

Crear CI con Node/pnpm pinned, Postgres `postgres:17.10-alpine3.24` en `55432` y el gate global. `apps/www/vercel.json` usa `framework: astro`, install `cd ../.. && corepack pnpm install --frozen-lockfile`, build `cd ../.. && corepack pnpm --filter @atlas/www build` y output `dist`; `apps/app/vercel.json` usa `framework: nextjs`, el mismo install y build `cd ../.. && corepack pnpm --filter @atlas/app build`. No incluir `env` ni secretos. El PCR usa literalmente `## Verification evidence` y `## Rollback`. Las conexiones reales de proyectos, dominios y protección de rama pertenecen a §20.1.

**Criterios de aceptación**

- WHEN the CI policy fixture contains a failed lint, typecheck, test, accessibility, security, or build job THE SYSTEM SHALL classify the merge gate as `blocked`.
- WHEN the Vercel configuration contract runs THE SYSTEM SHALL find separate reproducible build settings for `apps/www` and `apps/app` with no embedded secret values.
- WHEN the release-document contract runs THE SYSTEM SHALL find a Phase Completion Report and current-state record containing verification evidence and rollback instructions.

**Verify**
```bash
RELEASE_GATE=true corepack pnpm exec vitest run tests/contract/production-gate.test.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e
corepack pnpm exec playwright test tests/e2e/health.spec.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 18: add production evidence gate"
git tag step-18-production-gate
```

## Gate ejecutable del epic

- WHEN the Epic 03 gate runs THE SYSTEM SHALL complete calendar, billing, Stripe, portal, jobs, telemetry, release-contract, build, and production-smoke checks with zero failed command.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec vitest run tests/integration/google-calendar.test.ts tests/integration/quotes-invoices.test.ts tests/integration/stripe-webhooks.test.ts tests/integration/stripe-reconciliation.test.ts tests/integration/portal-access.test.ts tests/integration/jobs.test.ts tests/unit/telemetry-redaction.test.ts
RELEASE_GATE=true corepack pnpm exec vitest run tests/contract/production-gate.test.ts
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/client-portal.spec.ts tests/e2e/health.spec.ts
```
