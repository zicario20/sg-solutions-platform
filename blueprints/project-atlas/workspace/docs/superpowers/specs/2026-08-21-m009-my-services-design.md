# M009 Mis Servicios - Provider-disabled design

- Owner: Codex Architecture Agent
- Approved specification: Product Owner M009 v1.0.0
- Accepted base: M008 `09c9403`
- Decision: 040
- ADR: 013
- Surface: existing `/client/services`
- Implementation mode: isolated, sequential, provider-disabled

## 1. Outcome

M009 replaces the current provider-disabled `/client/services` placeholder with one authorized,
read-only directory and detail experience. Every displayed item must come from a real persisted
`ServiceOrder`; because this gate authorizes no real records or service definitions, configured
runtime must honestly render unavailable/empty outcomes and synthetic data may exist only in tests.

The module reuses the existing Client Portal, M007 identity/session/context controls and M008
authorization snapshot, final fence, admission, route keys, priority semantics and no-store rules.
It does not create another portal, catalog, CRM, case engine or provider gateway.

## 2. Brownfield audit findings

| Area | Evidence at `09c9403` | M009 decision |
|---|---|---|
| Portal | Next.js `/client` and shared `ClientPortalShell` exist | Reuse; no alternate shell or route root. |
| Services route | `/client/services/page.tsx` renders `ProviderDisabledPortalPage` | Replace this page; retain canonical route. |
| Authentication | M007 sessions, CSRF, organization context, assurance and revocation exist | Derive actor server-side; never trust account/context IDs from the browser. |
| Dashboard | `@atlas/dashboard` has one services fragment, opaque refs, final revalidation and priority | Reuse contracts; add an adapter rather than duplicate dashboard aggregation. |
| Service authority | No ServiceOrder/service-definition/case runtime schema or repository | Add unseeded generic contracts; do not seed or invent service types. |
| Related owners | Tasks/documents/payments/appointments/messages/workflows/entitlements are absent or unavailable | Typed ports return unavailable until their own gates activate. |
| Database | Drizzle/Postgres and forced-RLS patterns exist | Follow existing migration/schema conventions; no live application in this gate. |
| UI/i18n | Shared UI, tokens and ES/EN modules exist | Extend existing visual language and accessibility rules. |
| Tests | Vitest module-scoped configuration is established | Use focused synthetic M009 suites only during implementation. |

## 3. Architecture

```text
/client/services and /client/services/[serviceRef]
                 |
       Next.js server composition
                 |
      ClientServicesQueryService
        |        |          |
 M007/M008   core read   bounded owner ports
 auth/fence   adapter    (unavailable by default)
        |        |          |
        +---- minimized DTO serializer ----+
                         |
                  private/no-store UI
```

`@atlas/client-services` is a pure application/domain read-model package. It owns contracts,
status synthesis, query orchestration and serialization but no provider, payment, case, workflow or
command state. The app package owns HTTP/SSR composition. Database adapters remain in
`@atlas/database`/app composition and are disabled by default.

## 4. Canonical state ownership

| Dimension | Authority | M009 behavior |
|---|---|---|
| Commercial relationship and accepted versions | `ServiceOrder` | Read-only input. |
| Payment/refund/dispute | Billing projection; Stripe external authority | Read-only generic state or unavailable. |
| Human approval to start | `ServiceOrder` plus approval evidence | Read-only input; payment never substitutes. |
| Fulfillment/milestones/next step | `CaseFile` and approved workflow | Read-only projection; no case is valid for preliminary orders. |

`ClientServiceStatusPolicy` is deterministic and versioned. Unknown combinations, missing accepted
versions and owner conflicts return `unconfirmed|unavailable`; they never guess. No LLM participates
in status, priority, access or action selection.

## 5. Data boundary

The unseeded schema may define:

- `service_definition_versions` for immutable accepted display/scope/workflow bindings;
- `service_orders` for commercial lifecycle and activation facts;
- `service_order_access_grants` for explicit account/context/resource visibility;
- `service_status_history` for append-only mapped transitions;
- `service_milestones` for real version-bound public stages;
- `service_deliverables` for metadata-only availability.

No M009 command endpoint writes these entities. No seed contains a service name, price, client,
partner or milestone. Synthetic repositories live under `tests/m009`, never runtime packages.

`CaseFile`, payments, documents, tasks, appointments, messages and entitlements stay behind typed
owner ports. M009 must not create substitute tables for them.

## 6. Authorization and non-enumeration

Each request must:

1. obtain an active M007 session and M008-compatible context snapshot;
2. require `client.service.read` and an explicit active order/case grant;
3. query only after authorization using a restricted RLS role;
4. filter unauthorized roots before counts, filters and cursors;
5. bind every root/child to its resource authorization epoch;
6. revalidate session, context, membership, grants, entitlements, policy and resource epochs;
7. discard the complete response on any fence change;
8. return generic 404/deny outcomes for guessed resources.

Email, phone, CRM contact, payment, participant relationship, opaque ref and entitlement alone grant
nothing. Route references are navigation hints, not capability tokens.

## 7. DTOs

`ClientServiceListDto` contains locale, active opaque context, filter result, bounded cards, cursor
metadata and freshness. A card contains opaque reference, public reference, approved display key,
category key, context label, four-axis public presentation, current real milestone, safe next step,
generic obligation summaries and last verified time.

`ClientServiceDetailDto` adds accepted-scope metadata, public milestones and bounded section
envelopes for tasks, documents, payments, appointments, messages, timeline, agreements and
deliverables.

DTOs exclude internal IDs/statuses, staff names unless policy-approved, notes, risk, prompts,
provider payloads, storage keys, signed/permanent URLs, document/message content, card details,
hidden counts and arbitrary URLs. Final serialization is an explicit field allowlist.

## 8. Routes and HTTP behavior

- `GET /api/client/services`: normalized bounded search/filter/cursor; private no-store response.
- `GET /api/client/services/[serviceRef]`: opaque reference; generic not-found for unauthorized or
  absent resources.
- `GET /client/services`: server-rendered directory using the same query service.
- `GET /client/services/[serviceRef]`: server-rendered detail using the same query service.

No M009 mutation endpoint is authorized. Related CTAs use existing allowlisted portal route keys and
reauthorize in the owning module. HTTP and SSR reuse M008 trusted admission patterns and charge one
bounded request admission each.

## 9. M008 integration

The M009 dashboard adapter maps at most four authorized, fresh service summaries into the existing
`ServiceDashboardItem` contract. It uses the same authorization snapshot and never calls M009's
public HTTP route. If the M009 source is disabled/stale/unavailable, the dashboard fragment preserves
that state. It never emits an empty service list unless the authorized source proved empty.

## 10. UX structure

Directory order:

1. portal header and active context;
2. concise title/explanation;
3. bounded search and approved filters;
4. active/action-required cards;
5. completed/cancelled history;
6. clearly separated public catalog link.

Detail order:

1. service identity and public state;
2. one deterministic next step;
3. named milestone progress;
4. task/document obligations;
5. payment, appointment and message summaries;
6. timeline, agreements, deliverables and help links when available.

Cards never resemble marketing offers. Payment, approval and fulfillment are visually separate.
Progress uses named milestones/counts, not invented percentages. Desktop uses a bounded grid; tablet
uses two columns where safe; mobile uses one column with next action first. All status information
has text, keyboard focus, semantic headings/lists, 44px controls, 320px reflow and reduced-motion
support.

## 11. Internationalization

Stable internal codes map to reviewed ES/EN message keys. Critical status text fails closed if either
language is missing. Dates, money and time zones are locale-formatted without changing source
values. Service definitions reference versioned public display keys; the implementation supplies no
real service names or contractual copy.

## 12. Failure and cache policy

- Missing core source: service list/detail unavailable; no fabricated state.
- Missing child source: only that section unavailable; never zero.
- Missing next-action source: `unconfirmed` under ADR 012.
- Missing accepted version: configuration incident; current catalog is not substituted.
- Changed authorization/resource epoch: discard response and retry from new authorization.
- Configured runtime without approved source: provider-disabled view.

All personalized HTML/RSC/API data is dynamic, private and no-store. No service projection enters
ISR, CDN/shared caches, service workers, localStorage or sessionStorage.

## 13. Observability

Operational events may contain operation, outcome, policy/schema version, section-state bucket and
latency bucket. They must not contain account/context/service references, service names, statuses
linked to identity, counts, amounts, dates, free text, URLs or provider payloads. Product analytics
remain disabled pending a separate policy decision.

## 14. Exact implementation delta

The implementation plan is authoritative for the full manifest. Its bounded blast radius is:

- new `packages/client-services/**`;
- M009 schema/repository additions under `packages/database/**` and `drizzle/0037_*`;
- M009 app composition under `apps/app/src/lib/client-services/**`, two API GET routes and the
  existing `/client/services` route plus one detail route;
- M009 UI/i18n/observability modules and exports;
- a narrow M008 owner-port wiring change;
- focused `tests/m009/**`, lockfile and closure documentation.

No public website, CRM, provider adapter, payment command, workflow command or later-module route is
in the blast radius.

## 15. Acceptance summary

The Build is acceptance-ready only when focused tests prove authorized real-root semantics,
non-enumeration, final fences, deterministic four-axis status, accepted-version integrity, honest
partial failures, provider-disabled runtime, minimized serialization, M008 compatibility, ES/EN
accessibility and no-store behavior; architecture and Cyber Neo reviews then close all material
findings. Test fixtures do not constitute real service data or provider validation.

## 16. Material-review implementation clarification

- `ServiceOrder` is the sole commercial authority and binds one immutable accepted
  `ServiceDefinitionVersion`; financial, activation and fulfillment facts remain owned by their
  canonical records. `client_service_read_models` stores only opaque lookup and source-version
  evidence and is always rebuildable.
- The restricted `atlas_client_services_reader` role is `NOBYPASSRLS`. Server-derived M007/M008
  account, context and epochs scope every read; grants are relationally bound to the same
  ServiceOrder owner and enforce expiration and resource epochs.
- Serialization requires one final CAS proof over ServiceOrder, accepted definition, grant and all
  child resource fences. Child owners receive an abort signal and timeout; unavailable critical
  task, document or payment evidence makes status and next action unconfirmed.
- Public references use the purpose/version prefix `csr1_` with 192 random bits. Public DTO v2
  contains localized display labels, authorized personal/organization context and version-bound
  milestones, never domain translation keys.
- M009 telemetry is operational health metadata only and has no default emitter. Provider, DB and
  product-analytics activation remain outside this gate.
