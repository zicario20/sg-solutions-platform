# Epic 02 — Acquisition & Operations

**Objetivo:** convertir tráfico bilingüe en leads trazables y operar documentos, CRM, casos y citas con autorización delegada.  
**Stack:** Astro/Next server-first, Sanity público, Supabase Storage privado, Drizzle/Postgres y Playwright/Vitest.  
**Límites:** sin Stripe, portal completo, IA ni agenda generalista; PostHog recibe solo propiedades allowlisted.

## Subárbol y contratos

Los módulos viven en archivos cohesionados bajo `packages/domain/src/`. Las rutas HTTP validan, construyen actor y llaman dominio. `documents`, `leads`, `consent_events`, `lead_attributions`, `cases`, `case_notes`, `tasks`, `availability_rules`, `availability_blocks` y `appointments` permanecen en Postgres.

## Tareas

### E2-T1 — Proteger documentos privados

**Dependencias:** E1-T6.  
**Archivos:** `packages/domain/src/documents.ts`, `apps/app/app/api/v1/documents/route.ts`, `packages/database/src/schema.ts`, `tests/integration/storage-access.test.ts`, `docs/modules/document-center.md`.

Crear bucket privado versionado, metadatos opacos, grants exactos y firma server-only con auditoría.

**Criterios de aceptación**

- WHEN a client requests a delegated document THE SYSTEM SHALL return a signed URL with a short expiry and append one audit event.
- WHEN a signed URL expires THE SYSTEM SHALL deny the object request without changing the underlying grant.
- WHEN a user lacks the exact document grant THE SYSTEM SHALL return 404 even when the object path is known.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/storage-access.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 7: protect private documents"
git tag step-07-private-documents
```

### E2-T2 — Construir sitio público bilingüe

**Dependencias:** E1-T3.  
**Archivos:** `apps/www/src/pages/index.astro`, `apps/www/src/pages/es/index.astro`, `apps/www/src/lib/sanity.ts`, `packages/i18n/src/index.ts`, `tests/contract/public-content.test.ts`.

Crear las dos landing pages, metadatos, hreflang, CTA y adaptador Sanity con allowlist pública.

**Criterios de aceptación**

- WHEN a public route is requested in English or Spanish THE SYSTEM SHALL return localized HTML with a unique title, description, canonical URL, and language alternates.
- WHEN the Sanity schema contract runs THE SYSTEM SHALL allow only public content fields and reject client, tax, credit, document, or financial record fields.
- WHEN the public route contract runs THE SYSTEM SHALL find `Agenda una evaluación` as the primary CTA and `Solicita una cotización` as the secondary CTA on both localized landing pages.

**Verify**
```bash
corepack pnpm exec vitest run tests/contract/public-content.test.ts
corepack pnpm --filter @atlas/www build
```
**Checkpoint**
```bash
git add -A && git commit -m "step 8: add bilingual public acquisition"
git tag step-08-public-content
```

### E2-T3 — Capturar leads y atribución minimizada

**Dependencias:** E1-T4, E2-T2.  
**Archivos:** `apps/www/src/components/EvaluationForm.astro`, `apps/app/app/api/v1/leads/route.ts`, `packages/domain/src/leads.ts`, `packages/database/src/schema.ts`, `tests/integration/lead-capture.test.ts`.

Registrar consentimiento, first/last touch, idempotencia y redacción analítica en un solo contrato de integración.

**Criterios de aceptación**

- WHEN a valid evaluation request includes UTM parameters THE SYSTEM SHALL create one lead, one consent event, and normalized first-touch and last-touch attribution.
- WHEN the same idempotency key is submitted twice THE SYSTEM SHALL return the original response and create no duplicate lead.
- WHEN analytics events are emitted THE SYSTEM SHALL exclude free text, identifiers, documents, tax data, credit data, and case details.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/lead-capture.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 9: capture leads and attribution"
git tag step-09-lead-attribution
```

### E2-T4 — Implementar CRM y pipeline

**Dependencias:** E1-T6, E2-T3.  
**Archivos:** `apps/app/app/staff/crm/page.tsx`, `packages/domain/src/crm.ts`, `packages/database/src/schema.ts`, `tests/integration/crm-pipeline.test.ts`, `tests/e2e/crm.spec.ts`.

Crear vista staff, filtros URL-driven y transiciones explícitas con historial inmutable.

**Criterios de aceptación**

- WHEN staff advances a lead THE SYSTEM SHALL record the new stage, actor, timestamp, and prior stage in audit history.
- WHEN a stage transition violates the configured pipeline THE SYSTEM SHALL return 409 and preserve the current stage.
- WHEN CRM filters are encoded in the URL THE SYSTEM SHALL reproduce the same result ordering after reload.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/crm-pipeline.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/crm.spec.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 10: add crm pipeline"
git tag step-10-crm-pipeline
```

### E2-T5 — Gestionar casos tareas y notas

**Dependencias:** E2-T4.  
**Archivos:** `apps/app/app/staff/cases/page.tsx`, `packages/domain/src/cases.ts`, `packages/database/src/schema.ts`, `tests/integration/cases.test.ts`, `tests/e2e/case-workspace.spec.ts`.

Convertir leads transaccionalmente y separar notas internas de información compartible.

**Criterios de aceptación**

- WHEN staff converts a qualified lead THE SYSTEM SHALL create one client and one case while preserving attribution and pipeline history.
- WHEN a case note is marked internal THE SYSTEM SHALL expose it through neither client-portal queries nor analytics payloads.
- WHEN a case status changes THE SYSTEM SHALL append an immutable audit event and expose the current stage only to explicitly granted clients.

**Verify**
```bash
corepack pnpm exec vitest run tests/integration/cases.test.ts
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/case-workspace.spec.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 11: add case operations"
git tag step-11-case-operations
```

### E2-T6 — Implementar agenda transaccional

**Dependencias:** E1-T6, E2-T5.  
**Archivos:** `packages/domain/src/appointments.ts`, `apps/app/app/api/v1/appointments/route.ts`, `packages/database/src/schema.ts`, `tests/unit/availability.test.ts`, `tests/integration/booking-concurrency.test.ts`.

Derivar slots sin materializarlos y confirmar con transacción/constraint; reprogramar preservando historia.

**Criterios de aceptación**

- WHEN availability is requested THE SYSTEM SHALL derive slots from rules, blocks, appointments, buffers, notice, horizon, and `America/Chicago` without storing slot rows.
- WHEN concurrent requests target one capacity-one slot THE SYSTEM SHALL confirm exactly one appointment and return 409 for every conflicting request.
- WHEN an appointment is rescheduled THE SYSTEM SHALL cancel and replace it atomically while retaining `rescheduled_from_id` history.

**Verify**
```bash
corepack pnpm exec vitest run tests/unit/availability.test.ts
corepack pnpm exec vitest run tests/integration/booking-concurrency.test.ts
```
**Checkpoint**
```bash
git add -A && git commit -m "step 12: add appointment engine"
git tag step-12-appointment-engine
```

## Gate ejecutable del epic

- WHEN the Epic 02 gate runs THE SYSTEM SHALL complete document, public-content, lead, CRM, case, and appointment checks with zero failed assertion.

```bash
corepack pnpm exec vitest run tests/integration/storage-access.test.ts tests/contract/public-content.test.ts tests/integration/lead-capture.test.ts tests/integration/crm-pipeline.test.ts tests/integration/cases.test.ts tests/unit/availability.test.ts tests/integration/booking-concurrency.test.ts
corepack pnpm --filter @atlas/www build
corepack pnpm build
corepack pnpm exec playwright test tests/e2e/crm.spec.ts tests/e2e/case-workspace.spec.ts
```
