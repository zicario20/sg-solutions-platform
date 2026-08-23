# M010 Estado de mi proceso - Implementation Plan

- Date: 2026-08-23
- Design: docs/superpowers/specs/2026-08-23-m010-process-status-design.md
- PRD: docs/modules/m010-process-status.md
- ADR: ADR 014
- Base: M009 commit 6667872
- Gate: Decision 042, provider-disabled only
- Executor: separate Implementation Agent
- M011: blocked

## Constraints

No providers/credentials/seeds/fake data. No M010 schema/table/writer/materializer/job. Do not
duplicate M009 list/detail or M008 priority. Do not expose internals. Payment never starts service.
No M011 work. Independent Architect and Cyber Neo review are required. Tool errors are NO VALIDADO.

## Exact proposed application manifest

### New package

- packages/client-process-status/package.json
- packages/client-process-status/tsconfig.json
- packages/client-process-status/src/contracts.ts
- packages/client-process-status/src/ports.ts
- packages/client-process-status/src/authorization.ts
- packages/client-process-status/src/eligibility.ts
- packages/client-process-status/src/source-registry.ts
- packages/client-process-status/src/status-policy.ts
- packages/client-process-status/src/priority-policy.ts
- packages/client-process-status/src/timeline-policy.ts
- packages/client-process-status/src/query-service.ts
- packages/client-process-status/src/serialization.ts
- packages/client-process-status/src/cache.ts
- packages/client-process-status/src/index.ts

### M009 narrow integration

- packages/client-services/src/ports.ts
- packages/client-services/src/query-service.ts
- packages/client-services/src/index.ts

Only expose nonrecursive authorized choice/root ports. No M009-to-M010 dependency and no complete
M009 list/detail call from M010.

### App

- apps/app/src/app/client/status/page.tsx
- apps/app/src/app/client/status/[serviceRef]/page.tsx
- apps/app/src/app/api/client/process-status/route.ts
- apps/app/src/app/api/client/process-status/[serviceRef]/route.ts
- apps/app/src/lib/process-status/admission.ts
- apps/app/src/lib/process-status/auth-adapter.ts
- apps/app/src/lib/process-status/client-services-adapter.ts
- apps/app/src/lib/process-status/configured-runtime.ts
- apps/app/src/lib/process-status/http.ts
- apps/app/src/lib/process-status/page-context.ts

### UI/i18n/observability

- packages/ui/src/process-status/ProcessStatusLanding.tsx
- packages/ui/src/process-status/ProcessStatusView.tsx
- packages/ui/src/process-status/ProcessStatusHeader.tsx
- packages/ui/src/process-status/ProcessNextAction.tsx
- packages/ui/src/process-status/ProcessMilestones.tsx
- packages/ui/src/process-status/ProcessTimeline.tsx
- packages/ui/src/process-status/ProcessSections.tsx
- packages/ui/src/process-status/ProcessStatusStates.tsx
- packages/ui/src/process-status/ProcessStatus.module.css
- packages/ui/src/index.ts
- packages/i18n/src/process-status.ts
- packages/i18n/src/index.ts
- packages/observability/src/process-status.ts
- packages/observability/src/index.ts
- packages/client-services/src/components/ClientServiceDetail.tsx

### Tests

- tests/m010/client-process-status-contracts.test.ts
- tests/m010/client-process-status-eligibility.test.ts
- tests/m010/client-process-status-authorization.test.ts
- tests/m010/client-process-status-source-registry.test.ts
- tests/m010/client-process-status-policy.test.ts
- tests/m010/client-process-status-priority.test.ts
- tests/m010/client-process-status-timeline.test.ts
- tests/m010/client-process-status-query.test.ts
- tests/m010/client-process-status-http.test.ts
- tests/m010/client-process-status-runtime.test.ts
- tests/m010/client-process-status-ui.test.tsx
- tests/m010/client-process-status-i18n.test.ts
- tests/m010/client-process-status-security.test.ts
- tests/m010/client-process-status-architecture.test.ts

No other application file is approved. Deviations return to PO/Architect.

## Tasks

1. Write contracts/dependency tests, then package contracts. Separate business state from
   availability and reject IDs, percentages, raw payloads, free text, signed URLs and provider IDs.
2. Add narrow M009 choice/root ports preserving eligibility-before-limit, zero/one/many, no totals,
   disambiguation, version binding, cursors and final fences. Test N-1/N/N+1 and revocation.
3. Adapt M007 admission and closed source registry. Test grants, deny, context, assurance,
   tombstones and revocation during delayed reads.
4. Implement closed status/action policies using M008 ordering. Test all approved states,
   impossible/incomplete inputs, payment/activation separation and missing higher sources.
5. Implement request-scoped owner-event timeline with zero mappings by default. Test provenance,
   ordering, duplicates, collisions, corrections, cycles, scope, cursor and revocation. Fail if a
   M010 table, migration, writer, materializer or job appears.
6. Compose query under one critical read cut, apply final fence and minimal serialization. Test
   partial failure, absence fences, stale facts, timeouts and provider-disabled runtime.
7. Replace /client/status placeholder and add opaque detail/API routes. Test auth, IDOR,
   cross-context, malformed refs, no-store and safe error equivalence.
8. Implement existing-portal UI and M009 handoff. Test mobile/tablet/desktop, zoom, keyboard,
   screen reader, focus, reduced motion, forced colors, ES/EN and all truthful failure states.
9. Add i18n/observability allowlists and test semantic parity and forbidden telemetry fields.
10. Run focused tests, typecheck, lint, format, build, diff check and required suite when tooling
    permits. Record commands/results. Obtain independent Architect and Cyber Neo reviews, correct
    findings, rerun and request PO acceptance.

Do not commit, push, merge, deploy, configure providers or begin M011 without separate PO authority.
