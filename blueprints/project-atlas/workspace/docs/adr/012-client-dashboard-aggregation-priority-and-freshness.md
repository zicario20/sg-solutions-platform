# ADR 012 — Client dashboard aggregation, priority and freshness boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted for the M008 provider-disabled Build under Decision 038
- Date: 2026-08-09
- Extends: ADR 004 and proposed ADR 011; does not supersede either
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M008 must combine client-visible information from services, cases, tasks, documents, appointments,
payments, messages, notifications and content. If the browser coordinates those sources, if a
dashboard table duplicates their state, or if one partial failure becomes a false zero/no-action
result, the client can receive inconsistent or unauthorized information.

The dashboard also needs one reliable next action. An LLM, display order or mutable widget layout
cannot be allowed to determine obligations, financial state or access. Personalized portal data
must not enter shared caches, and normal dashboard rendering should not depend on live external
provider calls.

## Decision

### 1. M008 is a request-scoped application read model

The dashboard is composed by one `ClientDashboardQueryService` inside the modular monolith. It does
not own a business entity, write state or bypass the modules that own each record. Domain query
ports return typed, field-allowlisted client projections; raw rows and provider payloads are not
accepted inputs.

Release 1A does not persist a monolithic serialized `ClientDashboardSnapshot`. A future materialized
projection requires a separate reviewed decision and must use typed, section-scoped records with
explicit classification, version, TTL, invalidation and rebuild semantics. Critical identity,
authorization and financial truth cannot be made authoritative by such a projection.

### 2. One frozen authorization context governs the response

The server derives the actor from the active M007 application session. A browser-supplied context
reference is only a request. Before querying, the service creates an `AuthorizationSnapshot` that
freezes the account, session family, membership, active context, applicable case/resource grant
set, entitlement set, security-policy version, locale, trusted server time and request epoch. The
snapshot carries the current version or equivalent revocation fence for every authorization input;
the browser cannot supply any of them.

Each domain port authorizes before I/O and uses the session-derived restricted Postgres/RLS context.
The aggregator verifies that every fragment belongs to the same frozen authorization snapshot and
permitted classification. Immediately before serialization it revalidates the account, session,
membership, context, grant-set, entitlement-set and policy fences. Any change, expiry or revocation
discards the assembled response and returns a safe retry/session outcome. Rechecking only session
or policy while ignoring grants or entitlements is prohibited.

Unauthorized resources are omitted at the query boundary; their existence cannot be inferred from
counts, empty states, latency or error details. `service_role`, owner and `BYPASSRLS` are prohibited
on the user-facing dashboard path.

### 3. Priority is deterministic and policy-versioned

Owning domains emit eligible client-action candidates with stable type, resource scope, blocking
flag, due instant, approved workflow priority, source version, freshness and canonical route key.
The dashboard does not infer candidates from prose.

Every approved policy version includes a closed `PrioritySourceRegistry`. Each active source maps
one domain port to the highest-priority band it can produce and declares whether a trustworthy
empty result is required. Release 1A includes explicit sources for M007 security/identity actions,
payment obligations, document obligations, M067 signatures, tasks, appointments, missing
information and general actions. A source is not silently omitted because its feature, adapter or
data is unavailable. Activating or retiring a source changes the policy version and requires the
approved release policy; an unregistered producer is a configuration defect.

The priority bands are:

1. required security/identity action;
2. payment obligation blocking an approved next step;
3. expired required document;
4. pending signature;
5. overdue or approved due-soon task;
6. approved imminent appointment;
7. missing information;
8. general client action;
9. no action.

Within a band, blocking precedes nonblocking, then earliest applicable due instant, approved
workflow priority, creation instant and opaque stable action ID. Thresholds and business priorities
remain Product Owner-approved configuration. The policy has a version recorded with the response
and tests. An LLM may explain an already selected safe action but may not create, rank, suppress,
route or complete it.

### 4. Section freshness and failure are explicit

Every authorized fragment has `sourceVersion`, `asOf`, classification and one internal outcome:
`fresh`, `empty`, `stale` or `unavailable`. Authorization denial is not serialized as a client
section outcome.

- `fresh` may participate normally.
- `empty` is valid only after an authorized source successfully proves zero applicable items.
- `stale` may display only for approved noncritical summaries, with `asOf` and risky actions
  disabled.
- `unavailable` never becomes zero, complete, paid or no action.

The `PrioritySourceRegistry`, rather than observed data alone, determines whether an unavailable or
stale source could produce an action at or above the tentative winner. In that case the overall
priority is `unconfirmed`. An absent required source, unknown source registration or incomplete
port result has the same fail-closed result. The UI offers refresh and human support instead of
guessing. Payment, session, grant and other critical truth never silently use a stale dashboard
value.

### 5. No provider fan-out during normal render

The dashboard reads current operational projections from Postgres through owning domain ports.
Stripe remains external financial authority, but billing webhooks/reconciliation update the
Postgres projection before M008 uses it. Google remains an external calendar projection, while the
internal scheduler and reconciliation state feed M008. Storage signed URLs and message/document
content are never returned by the dashboard.

Normal rendering does not call Stripe, Google, Storage, Sanity or an AI provider from the browser.
Public Help Center content may use its independent public-content cache and is then filtered through
the dashboard's current locale/audience/freshness boundary.

### 6. Authenticated responses are dynamic and non-shared

Release 1A dashboard HTML/RSC/data responses use private, non-shared, `no-store` behavior. They are
not eligible for ISR, CDN/shared cache, service-worker/offline cache, localStorage or
sessionStorage. Static hashed shell assets retain their normal caching.

The experimental Next.js `use cache: private` behavior is not adopted as a production dependency by
this ADR. Any later personalized caching requires pinned-version evidence, a context/policy-aware
key, bounded TTL, immediate authorization revocation behavior and a new reviewed decision.

### 7. Bounded fan-out and graceful degradation

The aggregation service calls a fixed allowlist of domain ports with per-port result limits,
timeouts and resource budgets. Postgres-backed fragments that can affect priority execute against
one read-only consistent request snapshot with transaction-local M007 actor context; they are not
assembled from unrelated independently timed database views. Parallelism is allowed only when the
implementation can prove the same snapshot and authorization fences across the participating
reads. Optional non-Postgres public content is separately versioned and cannot be priority-critical
in Release 1A. The service does not open a distributed transaction or call another service for each
rendered row. One failed optional port does not erase valid sections. One failed registered source
that could tie or outrank the tentative action prevents a definitive result.

The response is bounded and indicates only safe section recovery codes. Provider/internal errors
remain server-side and are redacted before logs, traces, Sentry and analytics.

### 8. M008 has no mutation authority

Dashboard controls navigate to canonical owning routes. Those routes reauthorize and execute their
own command. A route key or opaque resource reference is not a capability token. The dashboard
cannot mark a task complete, accept a document, change an appointment, mark a payment, dismiss a
notification or alter service state unless a future owning-module command is explicitly designed
and separately authorized.

## Rationale

- One aggregation boundary produces a coherent client response and avoids browser-side security
  duplication.
- Typed projections prevent accidental serialization of internal domain fields.
- A complete authorization snapshot plus final account/session/membership/grant/entitlement/policy
  fencing prevents mixed-context and post-revocation results.
- Deterministic priority is testable, auditable and independent of AI or layout.
- Explicit partial failure avoids dangerous false reassurance.
- Operational projections avoid making portal availability depend on live providers.
- No-store Release 1A behavior is simpler and safer than premature personalized caching.

## Consequences

### Positive

- M008 remains a thin client-experience capability rather than a new source of truth.
- Cross-client, cross-context and stale-data behavior is testable as a contract.
- Release 1A can remain narrow while M009–M014 mature independently.
- Provider outages degrade through known local projections and manual paths.
- Priority behavior can be reviewed by the Product Owner without changing UI code.

### Costs and constraints

- Each owning domain must publish a deliberate client projection and candidate-action contract.
- The aggregator must track completeness and freshness, not only data values.
- Final action cannot stream before all higher-priority sources reach a trustworthy outcome.
- Private/no-store rendering increases request-time work and requires bounded query budgets.
- Status mappings, thresholds, stale windows and preview limits require explicit policy approval.

## Alternatives rejected

### Browser calls every module directly

Rejected because it duplicates authorization, exposes inconsistent partial states and increases
client-side credentials, caching and timing-leak risk.

### One dashboard table stores copies of every current value

Rejected for Release 1A because it creates a second mutable truth, stale financial/access state and
complex revocation/invalidation behavior before evidence justifies it.

### Query external providers on every dashboard load

Rejected because provider latency/outage would control portal availability and could expose
credentials or inconsistent states. Owning adapters reconcile external authority into Postgres.

### LLM chooses the next action

Rejected because priority affects security, financial obligations and service progress and must be
deterministic, testable and policy-controlled.

### Show last known values without source-specific rules

Rejected because stale payment, appointment, document or grant information can mislead the client.

### Cache personalized output under a general user key

Rejected because context, membership, grants, entitlements and policy versions can change
independently; a broad key creates leakage and revocation risk.

## Security conditions before acceptance

1. Threat-model BOLA/IDOR, cross-context cache/data leakage, grant revocation during aggregation,
   hidden-count inference, priority manipulation, stale financial/calendar state and fan-out denial
   of service.
2. Define typed portal DTOs and prove internal fields cannot enter them.
3. Prove all domain ports use the same complete `AuthorizationSnapshot`, restricted RLS role and,
   for priority-affecting Postgres reads, the same consistent read snapshot.
4. Test final authorization fencing when account, session, membership, context, grant set,
   entitlement set or policy changes during aggregation.
5. Test every priority band/tie, every active `PrioritySourceRegistry` entry, unknown/missing source
   configuration and the fail-closed `unconfirmed` rule.
6. Define and approve per-section freshness budgets and stale-action restrictions.
7. Prove personalized output is absent from shared/CDN/browser/offline caches and back/forward state
   after sign-out or context switch.
8. Prove no live provider fan-out, provider credential, signed URL or protected content reaches the
   browser, logs, traces, Sentry, PostHog or AI context.
9. Bound every port/list/timeout and test partial dependency failure and rate limiting.
10. Complete independent architecture, accessibility and Cyber Neo review with no open material
    finding.

## Reference basis

- [Next.js caching guidance](https://nextjs.org/docs/app/guides/caching-without-cache-components)
  documents dynamic/no-store options for request-time data. The separate private-cache directive
  is experimental and therefore not adopted here.
- [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
  supports database row policies as defense in depth.
- [Stripe webhook guidance](https://docs.stripe.com/webhooks) states that events can be duplicate and
  out of order, supporting durable reconciliation before portal projection.

## Approval and supersession

Decision 038 accepts this ADR and authorizes only the isolated M008 provider-disabled Build. It
permits local contracts, synthetic test fixtures, focused tests, fail-closed Next.js composition and
accessible ES/EN portal UI. It does not authorize live PostgreSQL, provider calls, real client data,
credentials, shared personalized caching, merge, deployment, release or production use. A
contradictory future decision must supersede this ADR and preserve its rationale.
