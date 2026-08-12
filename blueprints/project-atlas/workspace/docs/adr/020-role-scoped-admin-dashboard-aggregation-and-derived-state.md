# ADR 020 — Role-scoped admin dashboard aggregation and derived-state boundary

- Status: Proposed; Product Owner decision required before Build
- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Date: 2026-08-12
- Scope: M016 and its boundaries with M007, M011–M014, M017–M026, M042–M046, M074, M077, M079, M089, M092 and M097
- Supersedes: none
- Related: ADR 004, ADR 006, ADR 012 and M016 Administrative Dashboard PRD

## Context

The SG Solutions internal dashboard must summarize work from CRM, clients, businesses, orders,
cases, tasks, documents, appointments, communications, billing, approvals, risks and technical
operations. A browser that queries every owner directly would duplicate authorization, expose timing
and count side channels, create inconsistent snapshots and couple the UI to many schemas. A single
denormalized dashboard table would become a competing source of truth and make stale or restored
state look authoritative.

Different staff roles may see different widgets, rows and even aggregate counts. Some source systems
can be temporarily stale or unavailable while others remain healthy. A zero result, denied result,
suppressed result and failed result have materially different meanings. The design must remain useful
without weakening least privilege or presenting derived data as canonical.

## Decision proposed

### 1. M016 owns composition, not source-domain truth

M016 owns:

- the authenticated dashboard query/composition boundary;
- widget definitions and versioned response contracts;
- role preset and optional preference references;
- deterministic operational-priority composition;
- freshness, coverage, suppression and partial-failure semantics;
- derived metric snapshots/caches and their invalidation metadata when later authorized.

Owner modules retain their canonical records and business commands. In particular, M017/M020 own
CRM/Lead, M018/M019 own client/business records, M021/M022 own order/case, M023 tasks, M011 documents,
M012/M025 communications, M013/M024 appointments/calendar, M014/M042–M046 billing/payment, M074
approvals, M079 risk, M092 reporting and M097 observability. M016 cannot modify those records or
redefine their states.

A future “recent activity” widget consumes a minimized versioned projection from M077 and canonical
owners under an approved event-type allowlist. It is not raw audit history, does not reuse
invalidation payloads as display facts and excludes technical/private/content events. M077/owners
retain provenance, retention and resource authorization.

### 2. Use one server-side aggregation/BFF contract

The authenticated application calls one versioned M016 dashboard query per composition. The service:

1. derives the actor, session, role/team/assignment and resource scope on the server;
2. selects the allowed widget definitions;
3. invokes typed, minimal owner-module projection ports;
4. applies purpose, permission, minimum-aggregation, sensitivity and freshness policy per widget;
5. returns independently typed widget results and a page-level composition state.

The browser never fans out directly to owner tables/providers and never receives broad datasets to
filter locally. Ports are domain contracts, not direct cross-schema queries from presentation code.

### 3. Freeze an authorization context and reauthorize destinations

One composition freezes one canonical `DashboardAuthorizationFingerprint`. Its inseparable,
server-canonicalized input contains actor/account ID; session ID plus authentication/session epoch
and assurance; membership ID/version; exact permission-set/version, role, team and assignment
IDs/versions; exact resource-grant IDs/versions and access epochs; explicit purpose code/version;
classification ceiling and clearance version; dashboard/widget definition, owner-contract and policy
versions; normalized filters, period, locale and IANA time zone; source projection/version; and the
external recovery generation. Each owner port, snapshot/cache lookup and final response fence
validates the exact digest and applicable dimensions. Missing, changed or unknown input is a miss and
fails closed even if invalidation is delayed.

The digest is server-derived and opaque; it is never accepted from the client or serialized to URLs,
DTOs, logs or analytics. A reduced role/scope-only fingerprint is prohibited.

Drill-down destinations receive only allowlisted filters or opaque resource identifiers. The owning
module reauthorizes and fetches its canonical data. Dashboard visibility never grants destination
access, and hiding a widget is not the authorization control.

### 4. Represent result state explicitly

Every widget returns exactly one transport state:

- `complete` — source-confirmed derived result with complete authorized coverage within freshness
  policy; it remains advisory and cannot satisfy an owner command invariant;
- `partial` — some allowed inputs are absent/failed and coverage is stated;
- `stale` — a prior result exists outside freshness target;
- `unavailable` — no trustworthy result can be produced;
- `suppressed` — policy intentionally withholds the result/count;
- `denied` — actor is not authorized; normally omitted from UI.

Values include definition/version, source owner, period/time-zone, computed/source timestamps,
freshness and coverage. Zero is returned only when the authoritative source confirms zero for the
entire authorized scope and period. Failures never coerce to zero, empty, paid, completed or healthy.

### 5. Keep priority deterministic and explainable

The priority queue is produced from approved source facts using a versioned deterministic policy:
severity, due/overdue state, age, dependency/blocker state, assignment and approved service priority.
Every item carries human-readable reason codes. An LLM may not be the sole ranker, invent urgency or
alter owner state. Policy factors, weights and tie-breakers remain `ADM-004`.

### 6. Treat caches and snapshots as disposable derived state

Cache/snapshot entries carry the exact canonical fingerprint digest/version above. Lookup and final
serialization compare it exactly; purpose, assurance, permission, grant/access epoch, classification,
owner/source contract or any presentation/scope dimension cannot be omitted. They contain only the
minimized widget projection. They are never business-state authority, never shared across
incompatible contexts and cannot outlive an access revocation, policy change, source invalidation or
recovery generation. Revocation purges affected entries in addition to the mandatory lookup fence.

Critical alerts and authorization-sensitive states default to request-time/fresh projections unless
`ADM-009` approves a stricter cache contract. After backup restore, all old dashboard capabilities,
snapshots and jobs are rejected. Rebuilding derived state is safe and does not create business facts.

### 7. Degrade by widget, not by page or false certainty

Owner-port failures are isolated. Successful widgets remain available; affected widgets become
`partial`, `stale` or `unavailable` according to policy. The page-level state summarizes those
results. Responses use bounded deadlines and do not wait indefinitely for a noncritical source.

Diagnostics contain correlation, source owner and coarse error class only. They exclude client data,
document/message contents, query results, financial values, tokens and provider payloads.

### 8. Keep commands in owner modules

Release 1A M016 is read-oriented. A future quick action is an allowlisted affordance that calls the
owning command service with fresh authorization, validation, idempotency and audit. M016 cannot mark
payments, approve work, change a case, send messages, delete documents or execute sensitive bulk
actions. Exports, bulk actions and impersonation are off until separately approved.

### 9. Use provider-neutral freshness and update mechanics

M016 may consume internal events for invalidation or refresh hints, but the durable state remains in
the owner domains. Polling/manual refresh is sufficient for Release 1A. A future realtime transport
is an adapter choice under `ADM-016`; it does not change the query or state model. SignalR, WebSocket
or any vendor-specific mechanism is not selected by this ADR.

## Consequences

### Positive

- One clear internal dashboard boundary without duplicating operational truth.
- Least-privilege responses and lower cross-client/count-inference risk.
- Honest partial failure and freshness behavior.
- Owner modules can evolve behind typed projections.
- Release 1A can remain narrow and extend compatibly into Release 1B.
- Derived state can be rebuilt after incident/restore without financial or operational corruption.

### Costs

- Owner modules must expose deliberate minimal projection ports.
- Widget definition, metric, freshness and authorization policies need versioning and tests.
- Aggregate count privacy and cache keys require more care than browser-side filtering.
- Cross-module contract and restore tests are mandatory.

## Alternatives rejected

### Browser fan-out to every module

Rejected because it duplicates authorization and error handling, leaks topology/count timing and
couples the UI to many schemas.

### One canonical dashboard snapshot table

Rejected because it creates a competing source of truth and can survive revocation, policy changes
or restore with misleading values.

### Direct read-only database queries from UI/server components

Rejected because “read-only” does not provide purpose, resource-scope, metric-definition, freshness
or final-response authorization guarantees.

### Generic analytics/BI dashboard

Rejected for Release 1A because M016 is operational attention/navigation. Historical analysis,
arbitrary slicing and charting belong to M092 with separately approved privacy controls.

### One global role-filtered cache

Rejected because role alone does not capture team, assignment, resource grant, policy, locale,
period or revocation differences.

### LLM-ranked work queue

Rejected because unexplained probabilistic urgency cannot be the authority for sensitive work.

## Required controls before Build

- Product Owner resolution of `ADM-001`–`ADM-020` for the affected slice.
- Approved owner-port and metric-definition registry.
- Role/team/assignment/resource-scope matrix and count-inference thresholds.
- RLS and domain-service final-fence design with cross-client and full-fingerprint negative tests.
- Bounded failure, freshness, cache invalidation, recovery-generation and restore tests.
- Telemetry allowlist/redaction and no-session-replay proof.
- UX/UI visual acceptance and bilingual content approval.
- Independent architecture/security review and explicit `GENERATE` plus M016 Build gate.

## Validation obligations after a future Build

1. Prove unauthorized widgets, rows, counts and drill-downs never appear.
2. Vary purpose, assurance, permission version, grant/access epoch, classification clearance,
   role/team/assignment, owner/source contract and recovery generation independently; prove every
   mismatch misses/purges/fails closed even with delayed invalidation.
3. Prove owner failure produces partial/stale/unavailable, never zero or success.
4. Prove zero requires full authoritative coverage for the authorized period/scope.
5. Prove all drill-down destinations reauthorize independently.
6. Prove M016 cannot execute owner commands directly or broaden filters client-side.
7. Prove analytics/traces/errors contain no PII, message/document content or financial values.
8. Prove EN/ES, keyboard, screen-reader, contrast, zoom/reflow and reduced-motion behavior.
9. Prove future recent activity uses only allowlisted, resource-authorized M077/owner projections,
   declares freshness/coverage and excludes raw audit, invalidation, technical/private events and
   content; every drill-down reauthorizes.

## Open decisions

The complete decision set is maintained one-to-one as `ADM-001`–`ADM-020` in the M016 PRD and
`EXTERNAL_ACTIVATION_REGISTER.md`. This ADR proposes the boundary; it does not approve a widget,
metric, role, threshold, cache, export, action, provider, schema or production activation.
