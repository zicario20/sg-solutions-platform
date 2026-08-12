# M016 Administrative Dashboard — Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Product/Architecture candidate; no Build gate
- Version: 1.0.0-candidate
- Date: 2026-08-12
- Surfaces: Admin Portal and bounded backend aggregation services
- Related modules: M007, M013–M015, M017–M026, M042–M046, M047–M060, M068, M072,
  M074, M077–M081, M089–M092 and M097–M099
- Governing ADRs: ADR 004, ADR 006 and proposed ADR 020

This PRD normalizes the complete Product Owner-supplied M016 source into the approved Project Atlas
modular-monolith architecture. It specifies a future production module; it does not authorize an
Admin route, schema, materialized view, cache, provider, real employee/client data or product code.

## 1. Purpose

M016 is the role-aware operational home for authorized SG Solutions staff. It answers what requires
attention, why it matters, how fresh and complete the evidence is and which owning module must be
opened next. It aggregates summaries and exceptions without becoming a second CRM, case manager,
billing ledger, approval engine, reporting warehouse or infrastructure console.

Every visible widget must answer one operational question and declare:

1. its owning source module and contract version;
2. the actor, role, team and resource scope used for authorization;
3. whether it represents current state or a selected historical period;
4. source-as-of time, aggregation time, completeness and freshness;
5. the safe drill-down destination and required permission;
6. whether the value is exact, partial, suppressed, stale or unavailable.

M016 never converts a metric, cached value, notification, model suggestion or visual control into
authority to perform a sensitive action.

## 2. Business value

- Give the owner and future team one reliable starting point for daily operations.
- Reduce time spent searching across leads, clients, cases, tasks, approvals and communications.
- Surface blockers, overdue work and provider degradation before they harm a client.
- Preserve least privilege by tailoring the dashboard to the user's exact assignment and purpose.
- Distinguish zero from missing, partial, stale and unavailable data.
- Route work to the correct module instead of duplicating operational workflows.
- Establish stable metric/source contracts for future reporting without treating estimates as
  accounting truth.
- Remain useful when AI, analytics or one downstream module is unavailable.

## 3. Scope

### Release 1A documentary target

- One Admin home destination within the existing authenticated Next.js application.
- Server-side dashboard shell plus independently authorized widget projections.
- Initial role presets for Owner and Administrator, while the initial one-person operation may use
  only Owner.
- Critical-alert summary, priority work queue and bounded operational summaries.
- Summary widgets for leads, clients, service orders/cases, tasks, approvals, documents,
  appointments, communications and payment/reconciliation exceptions.
- Per-widget `complete | partial | stale | unavailable | suppressed` evidence.
- Allowlisted drill-down descriptors into the owning Admin destination.
- Explicit empty, unavailable, denied and partial states.
- Server-side period/filter validation and safe saved-view/layout preference contracts.
- Manual refresh and bounded polling only where approved; the dashboard functions without realtime.
- Bilingual responsive and accessible Admin experience.
- Content-free audit and operational telemetry.

Release 1A is an operations surface. Historical business intelligence, broad exports, employee
performance scoring, impersonation, bulk sensitive actions and live provider control are excluded.

### Compatible Release 1B extensions

- Additional specialist presets for Support, Credit, Tax, Business, Funding, Home Buying,
  Compliance and read-only audit roles after their modules and policies exist.
- Source-owned trends and charts with approved metric definitions.
- A minimized “recent activity” projection from M077 plus canonical owner events using an approved
  event-type allowlist, resource authorization, freshness and drill-down rules. It is not raw audit
  history and excludes technical/noise/private events.
- Governed operational-alert acknowledgement, additional saved views and constrained exports.
- M026-owned internal announcements/notices projected read-only into M016; authoring, scheduling and
  expiry remain in their owning configuration/notification workflow.
- Near-real-time invalidation for selected event classes after recovery and privacy testing.
- Workload/capacity projections and additional integration-health summaries.

### Future extensions

- Executive reporting handoff to M092, AI Hub status from M047 and approved technical status from
  M097.
- Safe `view as client` workflow only after explicit impersonation policy, audit and implementation.
- Approved bulk operations that remain commands of their owning modules.

## 4. Explicit out of scope

- A second Admin application, frontend, CRM, task system, approval engine or reporting database.
- Direct SQL, Supabase dashboard access, raw logs, secrets, tokens or provider payloads.
- Editing clients, cases, payments, filings, disputes, tax returns or documents inside a widget.
- Refund, filing, dispute, partner-share, financial-application or service-start approval from a
  dashboard card.
- Automatic state changes based on score, threshold, chart, AI output or cached data.
- Full documents, full messages, tax/credit records, SSN/ITIN/EIN or detailed bank/financial data.
- Cross-team or organization-wide access merely because a person has an internal role.
- A generic BI builder, arbitrary query language or unrestricted CSV export.
- Hidden-widget APIs that continue returning unauthorized data.
- SignalR or any other realtime dependency without an approved adapter and activation gate.
- Manual alteration of computed metric values or source truth.
- Production behavior before an explicit `GENERATE` and M016 Build decision.

## 5. Actors

### Owner

May receive approved organization summaries, risks, financial semantics, workload and operational
exceptions. Owner status does not bypass purpose, classification, resource scope, reauthentication
or segregation-of-duties rules.

### Administrator

May receive approved operational, user/configuration and integration summaries. Provider secrets,
protected client content and raw infrastructure telemetry remain unavailable.

### Support specialist

Receives assigned/scoped leads, conversations, callbacks, appointments and support tasks. It does
not receive full tax, credit, identity or financial context.

### Service specialist

Receives only assigned/granted cases, tasks, documents, appointments and approvals for the
authorized service domain and purpose.

### Compliance reviewer

Receives approved risks, exceptions and approval summaries. The underlying sensitive review occurs
in M074/M076/M079, not M016.

### Read-only auditor

Receives authorized immutable summaries and drill-downs without mutation controls.

### Background coordinator

May refresh derived metrics and invalidate caches. Inngest coordinates work; Postgres and owning
modules retain durable authority.

### AI capability

May later suggest prioritization explanations from an approved minimized DTO. It cannot select
visibility, alter score, dismiss alerts or issue commands.

## 6. User journeys

### 6.1 Open the Admin home

1. M007 resolves staff identity, active session, assurance, role, team and resource grants.
2. M016 loads only widget descriptors for which the actor has the exact required permission.
3. The aggregation service requests minimized projections from each owner under the same scope.
4. The response renders critical alerts and priority items first, then available summaries.
5. Each widget declares source time, aggregation time and completeness.
6. An unavailable module fails only its widget and cannot become a zero.

### 6.2 Apply filters or a period

1. The client submits allowlisted filter codes and an IANA-zone-aware period request.
2. The backend validates every dimension against the actor's permitted scope.
3. Current-state widgets ignore incompatible historical periods and say so explicitly.
4. Compatible metric widgets recompute under one normalized filter contract.
5. Filter manipulation cannot expand the authorization envelope.

### 6.3 Open a priority item

1. The widget returns an opaque resource reference plus allowlisted destination code, never a raw
   arbitrary URL.
2. The client navigates to the owning module.
3. That module independently reauthorizes the actor and rereads current source state.
4. Dashboard cache, score and possession of the reference grant nothing.

### 6.4 Use a quick action

1. M016 displays only actions allowed by the approved registry and current permission.
2. A safe action opens the owning module or submits a typed intent to its command service.
3. The owner performs fresh authorization, validation, idempotency and audit.
4. M016 receives only a receipt/invalidation and cannot claim completion from click state.

### 6.5 One source is unavailable

1. The aggregator enforces a bounded per-widget timeout and records a content-free correlation ID.
2. Other widgets continue.
3. The affected widget returns `unavailable` with last confirmed as-of only when policy permits.
4. No stale value is labeled current and no action is enabled from the stale projection.
5. Retry is scoped to that widget.

### 6.6 Customize the dashboard

1. The user reorders or hides only configurable nonmandatory widgets.
2. Critical mandatory alerts remain visible.
3. Preference input contains widget codes and layout metadata, never data or permission claims.
4. On the next read, current permissions are applied before the saved layout.
5. Revoked widgets disappear even when a stale saved view references them.

### 6.7 Review a small-count metric

1. The source classifies the metric and dimension combination.
2. M016 applies the approved minimum aggregation/privacy rule.
3. A sensitive small count becomes `suppressed`, not `0`, absent or an exact number.
4. Drill-down is omitted unless direct resource access is independently authorized.

### 6.8 Review recent operational activity (Release 1B)

1. M016 requests a bounded allowlisted activity projection for the actor's exact authorized scope.
2. M077 and the canonical owner validate resource access and return semantic event code, safe label,
   event time/source version, freshness and optional opaque drill-down reference.
3. Client creation, verified payment, accepted document receipt, appointment, service/case change,
   approval, escalation, authorized filing milestone or refund may appear only when its owner event
   and disclosure policy are approved.
4. Raw audit payloads, internal-note/message/document content, technical retries, cache events,
   provider payloads and irrelevant system activity never appear.
5. Partial/unavailable owners are declared; missing partitions never become “no recent activity.”

## 7. States and transitions

### Widget result

`not_requested → loading → complete | partial | stale | unavailable | suppressed | denied`

- `complete`: all required source partitions for the authorized scope responded.
- `partial`: at least one approved partition is missing; the exact coverage is named safely.
- `stale`: a previously confirmed value is outside its freshness policy.
- `unavailable`: no permissible value can be asserted.
- `suppressed`: a value exists but privacy/aggregation policy forbids disclosure.
- `denied`: internal service result only; ordinary UI omits the widget or shows a generic boundary.

Zero is valid only with `complete` evidence and a source-defined zero semantic.

### Dashboard request

`received → authorized → collecting → assembled | partially_assembled | failed`

No single source failure changes another source result. An invalid global authorization fails the
whole request before owner-domain I/O.

### Saved view

`draft → active → superseded | revoked | deleted`

Loading an active view always intersects its stored filters/widgets with current authorization and
current widget definitions.

### Operational alert projection

`projected_new → projected_acknowledged → projected_in_progress → projected_resolved | expired`

The source module owns the real incident/risk/exception state. M016 cannot independently resolve or
dismiss it. Any acknowledgement command is routed to that owner.

### Metric snapshot

`queued → computing → available | partial | failed → superseded | expired`

Snapshots are immutable derived evidence. They never authorize a command and are rebuilt after
restore or source-version change.

## 8. Business rules

1. M016 owns dashboard composition, widget definitions, safe layouts/preferences and aggregation
   contracts; owning modules retain all underlying business truth and commands.
2. Every widget has one primary owner, permission set, classification ceiling, source contract,
   freshness policy, privacy threshold and drill-down mapping.
3. Widget authorization occurs before source query, during projection and at final serialization.
4. Internal role alone never grants every client, case, team or sensitive metric.
5. Filters can only narrow an authorized scope; missing filters never widen it.
6. The dashboard never queries provider APIs from the browser or during ordinary page render.
7. A dashboard value cannot approve, refund, file, dispute, share, start or complete work.
8. All owner commands reauthorize and reread source state; dashboard values are hints for
   navigation/prioritization only.
9. Priority is deterministic, explainable, versioned and policy-controlled. AI cannot be its sole
   source.
10. Metric code, definition version, unit, period semantics, source owner, coverage and as-of are
    inseparable.
11. Current-state widgets and period metrics remain distinct; changing period cannot rewrite a
    current exception count.
12. Missing, unauthorized, suppressed, partial, stale and unavailable are never serialized as zero.
13. Money uses integer minor units and ISO currency. Different currencies are never combined
    without an approved conversion/reporting policy.
14. “Revenue,” “net,” “confirmed,” “estimated,” “pending,” fees, refunds and partner/state amounts
    use separately approved definitions; M016 is not an accounting ledger.
15. Sensitive small groups are suppressed under an approved threshold; suppression cannot be
    bypassed through filter differencing or repeated queries.
16. Saved views/layouts store only allowlisted codes and versions and never preserve revoked access.
17. Critical mandatory alerts cannot be hidden. M016 does not own their dismissal or resolution.
18. Charts require an accessible table/summary and approved metric definition; decoration alone is
    not a reason to add a chart.
19. Personal productivity/quality metrics cannot trigger employment actions or automated penalties.
20. Realtime is optional optimization. Manual refresh and deterministic operations remain usable.
21. M089 owns global search; M092 owns durable reporting/product analytics; M097 owns technical
    observability; M016 consumes minimized projections.
22. M074 owns approvals, M079 risks, M026 notifications, M023 tasks, M013 appointments, M014/M043–
    M044 billing facts and M017/M018 CRM/client facts.
23. M016 emits its own preference/snapshot/receipt facts only after durable local change. Owner
    invalidations are consumed as reread hints, not republished as source truth.
24. Postgres remains durable state authority; cache/materialized views are disposable projections.
25. Global search is an M089 capability and internal announcement delivery is an M026 capability;
    M016 may host their authorized entry/projection but cannot become either authority.
26. Recent activity is a minimized read-only M077/owner-event projection. M016 cannot expose raw
    audit history, invent an activity fact or treat a projected event as current owner state.

## 9. Authorization rules

Every widget request requires:

`authenticated staff session + exact widget permission + role/team assignment + allowed resource`
`scope + purpose + classification clearance + current policy/grant/access/recovery versions`.

One canonical `DashboardAuthorizationFingerprint` is used without optional security dimensions for
source requests, snapshot/cache provenance, lookup and final serialization. Its server-canonicalized
input contains:

1. actor/account ID;
2. session ID plus authentication/session epoch and assurance level;
3. organization membership ID/version;
4. exact permission-set/version, role, team and assignment IDs/versions;
5. exact resource-grant IDs/versions and access epochs;
6. explicit purpose code/version;
7. classification ceiling and actor clearance version;
8. dashboard/widget definition, owner-contract and policy versions;
9. normalized filters, period, locale and IANA time zone;
10. source projection/version and external recovery generation.

The fingerprint is a server-derived opaque digest, never a client claim, URL, DTO, analytics or log
field. Lookup and final fence require exact digest/dimension equality. Any missing, changed or
unknown dimension is a cache miss and fails closed; revocation purges affected entries even when an
invalidation is delayed.

- M007 supplies identity/session/assurance and resource grants.
- M080/M081 define identity/role/permission controls; role is necessary but insufficient.
- Owner modules enforce resource/assignment rules and RLS before returning a projection.
- M016 cannot ask an owner for a broader DTO and then hide fields in React.
- The canonical `DashboardAuthorizationFingerprint` above is the only cache/snapshot authorization
  provenance; reduced role-only or scope-only keys are prohibited.
- A final fence rechecks all relevant epochs before serialization/export/drill-down receipt.
- Counts, empty states, filters, autocomplete, chart series, errors and timing cannot reveal hidden
  resources.
- Saved views, layout preferences, raw query parameters and widget visibility never grant access.
- Read-only auditors receive no command affordances.
- Highly Sensitive source content is excluded from M016; the source module remains the only reveal
  boundary.

## 10. Data requirements

### M016-owned conceptual records

- `DashboardDefinition`: stable code, audience, version and default layout.
- `DashboardWidgetDefinition`: code, owner, permission, classification ceiling, data contract,
  refresh/freshness/privacy policy and drill-down code.
- `AdminDashboardPreference`: user, dashboard version, allowlisted layout/widget/filter codes,
  compact mode, optimistic version and timestamps.
- `SavedDashboardView`: owner, scope-safe filter codes, period preset, visible widgets, version and
  lifecycle.
- `DashboardMetricSnapshot`: metric/source/policy versions, canonical authorization-fingerprint
  digest/version, typed value, unit/currency, period, coverage, generated/source-as-of and expiry.
- `DashboardInvalidationReceipt`: source event identity/version, affected widget codes, recovery
  generation and processing evidence.

### Read-only projections from owners

- `PriorityItemProjection`, `OperationalAlertProjection`, `TaskSummary`, `ApprovalSummary`,
  `LeadSummary`, `ClientSummary`, `ServiceSummary`, `DocumentQueueSummary`,
  `AppointmentSummary`, `CommunicationSummary`, `BillingExceptionSummary`,
  `IntegrationHealthSummary`, `RiskSummary` and future `RecentOperationalActivityProjection`.

These records contain opaque IDs, safe labels, semantic states and destinations only. They exclude
document/message content, full identifiers, tax/credit detail, secrets and raw provider errors.

### Index and integrity needs

- Unique widget/dashboard code plus version.
- Preference/saved-view uniqueness by user and dashboard code where approved.
- Snapshot uniqueness by metric/source/scope/period/policy/recovery generation.
- Expiry, source-as-of and invalidation indexes.
- Foreign keys to M007 users and typed owner references; weak unchecked polymorphic IDs are
  prohibited.
- RLS/ownership policies independent from frontend visibility.

Drizzle remains the only schema/migration authority after Build approval.

## 11. API or service contracts

### Query services

```text
AdminDashboardQuery.compose(AdminDashboardRequest) -> AdminDashboardComposition
AdminDashboardQuery.refresh(AdminDashboardRefreshRequest) -> AdminDashboardComposition
AdminDashboardQuery.listDefinitions(AdminDashboardContext) -> WidgetDescriptor[]
```

`AdminDashboardRequest` includes a server-built `AdminDashboardContext` containing every canonical
`DashboardAuthorizationFingerprint` input: actor/account, session/auth epoch/assurance, membership,
permission/role/team/assignment, exact grants/access epochs, purpose, classification/clearance,
dashboard/widget/owner-contract/policy versions, normalized filters/period/locale/IANA zone, source
version and recovery generation. `compose` is one bounded server-side fan-in; it is not a browser
loop over widget endpoints.

`WidgetResult` includes widget code/version, owner/source contract version, status, typed safe data,
coverage, source-as-of, aggregated-at, expires-at, safe error/retry metadata and allowlisted
drill-down descriptors. It contains no raw URL or owner command payload.

### Preference commands

```text
AdminDashboardPreferences.saveLayout(command, expectedVersion) -> PreferenceReceipt
AdminDashboardPreferences.saveView(command, expectedVersion) -> SavedViewReceipt
AdminDashboardPreferences.deleteView(command, expectedVersion) -> DeletionReceipt
```

Commands reject unknown/unauthorized widget/filter/destination codes and cannot store protected
values or authority evidence.

### Owner ports

Each owner implements a minimal versioned `DashboardProjectionPort`. M016 cannot import provider
SDKs or owner repositories directly. Ports accept an already bounded scope but independently
authorize it and return only their typed projection.

### Quick-action and drill-down contracts

M016 returns a destination code plus opaque bounded reference. The application router maps that code
to an allowlisted route. Any quick action calls the owning application service under a fresh command
authorization; M016 never exposes a generic mutation endpoint.

## 12. Events and background jobs

### Exact event namespace

- `dashboard.preference.saved.v1`
- `dashboard.saved_view.created.v1`
- `dashboard.saved_view.deleted.v1`
- `dashboard.snapshot.generated.v1`
- `dashboard.snapshot.failed.v1`
- `dashboard.invalidation.applied.v1`

Owner events such as `crm.*`, `case.*`, `task.*`, `billing.*`, `document.*`, `appointment.*`,
`message.*`, `approval.*`, `risk.*` and `integration.*` are invalidation facts only. M016 rereads
canonical owner state instead of trusting event payloads as the metric value.

For a future recent-activity view, M077 and each canonical owner expose an independently authorized,
versioned allowlist projection rather than reusing invalidation payloads or raw audit records. Event
types/copy, resource scope, retention, freshness and drill-down remain `ADM-001`, `ADM-003`,
`ADM-005`, `ADM-008`, `ADM-017` and M077 policy gates.

### Jobs

- refresh approved snapshots;
- expire snapshots and saved-view references to removed definitions;
- consume/deduplicate owner invalidations;
- reconcile missed invalidations after outage/restore;
- generate an approved bounded export through M011 when future ADM-012 is enabled.

Every job has a stable idempotency key, bounded input, lease, retry limit, recovery generation,
durable receipt and manual recovery route. Inngest coordinates; Postgres owns state.

## 13. Error states and recovery

| Condition | Required behavior | Recovery |
|---|---|---|
| Global authorization unavailable | No dashboard data or counts. | Opaque denial/unavailable and safe reauthentication. |
| One owner times out | Only that widget becomes unavailable. | Bounded retry; other widgets remain. |
| Partial owner coverage | Mark partial and name safe coverage. | Reconcile missing partitions; do not assert total. |
| Stale snapshot | Mark stale and disable source-state actions. | Refresh/rebuild from owner. |
| Invalid filter or period | Reject deterministically. | Reset to approved default without widening scope. |
| Saved view references revoked widget | Remove it after current authorization. | Persist a sanitized new version only with user action. |
| Any fingerprint dimension missing/mismatched | Never serve the entry or protected fallback. | Evict, purge affected scope and recompute only under the exact current fingerprint. |
| Owner state changes after render | Dashboard receipt becomes advisory only. | Destination/command owner rereads current state. |
| Worker exhausts retries | Durable failed receipt and operational alert. | Authorized manual replay after cause review. |
| Restore occurs | Derived state is untrusted. | Advance recovery generation, purge cache and rebuild. |
| Metric definition changes | Old snapshot remains historical/superseded. | Generate under new version; never relabel old value. |
| Recent-activity owner/partition unavailable | Mark projection partial/unavailable; never assert no activity. | Reread authorized M077/owner projection; exclude raw audit/invalidation payload. |

M016 binds cache entries, snapshots, pagination, exports and invalidation receipts to a monotonic
recovery generation outside the restored database snapshot. Restore cutover invalidates earlier
generations and blocks “current” claims until source owners and grants are reconciled.

## 14. Security and privacy requirements

- Treat aggregate counts, financial semantics, workload and alert categories according to the
  highest source classification and inference risk.
- Never include SSN/ITIN/EIN, full DOB, bank/card data, document/message bodies, tax/credit details,
  provider secrets, raw errors or stack traces.
- Server creates audience-specific DTOs; masking in CSS is not a control.
- Cache is private, segmented and version/epoch-bound. Shared/public caching is prohibited.
- Snapshot/cache lookup and final serialization compare the exact canonical authorization digest;
  purpose, assurance, permission, grant/access epoch and classification changes fail closed even
  when source invalidation is delayed.
- Prevent IDOR, scope widening, filter differencing, count inference, mass assignment, saved-view
  privilege persistence and quick-action privilege escalation.
- CSP, CSRF/Origin/Fetch Metadata, secure cookies, rate limits and M007 session/step-up controls apply.
- Logs/traces/Sentry contain widget code, status, duration and content-free correlation only.
- PostHog/session replay receive no client/resource IDs, values, filters, employee performance or
  alert detail.
- Export, impersonation, bulk action, technical widget, financial metric and AI behavior remain off
  until their decisions close.
- Every Admin access and drill-down uses content-free enhanced audit appropriate to sensitivity.

## 15. UX and accessibility requirements

- Desktop uses the approved Admin shell and a responsive 12-column grid; tablet reduces to two
  columns and mobile to one.
- The order is critical alerts, priority actions, operational summary, approvals/work, then secondary
  status. Role-inapplicable sections do not leave confusing gaps.
- A persistent page heading names the dashboard, current scope and last overall refresh.
- Filters use a labeled drawer on mobile and an explicit Apply/Reset flow; no filter changes state
  merely by focus.
- Widget cards show title, safe value, state, as-of, coverage and one primary drill-down.
- `0`, unavailable, partial, stale, suppressed and permission-denied use distinct copy and semantics.
- Skeletons never show fake numeric values. Errors remain localized with retry and correlation ID.
- Priority rows explain rule factors without exposing hidden client/security detail.
- Charts are absent from Release 1A unless an approved metric requires one; any future chart has an
  equivalent accessible table/summary.
- Reordering has keyboard controls; drag-and-drop is never the only method.
- Critical alerts cannot be visually hidden behind customization.
- Minimum target size is 44×44 CSS px; visible focus, semantic headings/landmarks, live status,
  accessible names, 200%/400% zoom and reduced motion meet WCAG 2.2 AA.
- The visual language uses Manrope headings, Inter body, navy/cobalt hierarchy, cyan accents, green
  confirmed states and restrained gold warnings on light surfaces.
- Full interaction details live in
  `docs/superpowers/specs/2026-08-12-m016-admin-dashboard-design.md`.

## 16. Bilingual requirements

- Every title, metric label, filter, period, alert, state, CTA, error, freshness/coverage note and
  accessibility label has approved Spanish/English semantic parity.
- Stable widget/metric/status codes are locale-neutral.
- Client, business, legal and user-entered names are not translated.
- Locale changes presentation only; filter values, units, currency, timestamps and access scope do
  not change.
- Dates render from UTC using the approved IANA zone. Currency always names ISO currency.
- `confirmed`, `estimated`, `partial`, `stale`, `suppressed`, `unavailable` and `reconciled` cannot
  be translated into stronger/weaker claims.
- Missing bilingual copy blocks a widget's publication instead of leaking internal codes.

## 17. Acceptance criteria

1. M016 lives inside the existing Admin surface and creates no second application.
2. It owns composition/preferences only and duplicates no CRM, case, task, approval or billing truth.
3. Every widget names an owner, contract version, permission, scope, freshness and privacy policy.
4. Backend omits unauthorized widgets and filters owner projections before serialization.
5. Role, team and resource scope are enforced independently of UI visibility.
6. Filters only narrow access and cannot expose counts or resources outside current grants.
7. Zero, partial, stale, suppressed and unavailable remain distinguishable.
8. Every value names its period/unit/source-as-of/coverage where applicable.
9. Priority is deterministic, explainable and versioned without LLM dependency.
10. Sensitive small counts are suppressed and resistant to filter-difference inference.
11. Owner/source failure is localized; the remaining dashboard stays usable.
12. Cache/snapshots are private, scope/version/recovery-bound and never action authority.
13. Purpose, assurance, permission, grant/access epoch or classification change causes an exact
    fingerprint mismatch, cache miss/purge and no protected stale fallback.
14. Drill-down uses allowlisted destinations and the owner reauthorizes/rereads.
15. No sensitive action executes directly from a widget or one accidental click.
16. Mandatory critical alerts cannot be hidden or independently resolved by M016.
17. Saved views/preferences cannot persist revoked access or store protected data.
18. No protected content, secret, raw provider error or full document/message reaches UI/telemetry.
19. The dashboard functions without AI, analytics, realtime and any single downstream source.
20. UI is responsive, bilingual and WCAG 2.2 AA with accessible alternatives to visual data.
21. Audit/telemetry are content-free and distinguish view, drill-down, preference and failure.
22. Restore invalidates derived/cache generations and rebuilds from reconciled authorities.
23. Product Owner decisions ADM-001–ADM-020 close before their affected Build/live behavior.
24. Approving `ADM-018` without `ADM-006` never exposes alert acknowledge/dismiss/resolve controls;
    mandatory critical alerts remain visible until their owner state changes under approved policy.
25. Approving quality gate `ADM-020` without `ADM-017` emits no nonessential dashboard analytics or
    telemetry event; analytics remains default-off.
26. A future recent-activity list contains only allowlisted resource-authorized M077/owner
    projections with freshness/coverage; it exposes no raw audit, technical/private event or content.

### Future executable test matrix

- Authorization: roles, teams, assignments, revoked grants, hidden widget API, manipulated filters,
  IDOR, stale permission/cache and final-fence races; vary purpose, assurance, permission version,
  grant/access epoch and classification independently while invalidation is delayed and prove every
  mismatch misses/purges/fails closed.
- Aggregation: owner timeout, partial coverage, mixed freshness, current versus period semantics,
  exact zero and suppression/differencing.
- Contracts: owner DTO allowlists, no raw URLs, no protected fields, event namespace/version and
  unknown widget/filter/action rejection.
- State: saved-view optimistic concurrency, definition removal, snapshot supersession and recovery
  generation.
- UX/E2E: Owner/limited role, desktop/tablet/mobile, keyboard reorder, screen reader, zoom, ES/EN,
  long text, no data, many alerts and reduced motion.
- Recovery/performance: large queues, cache miss, owner latency, invalidation replay, restore rebuild
  and independent widget timeouts.
- Gate consistency: exercise each ADM decision independently; prove `ADM-018` cannot dismiss an alert
  without `ADM-006`, and `ADM-020` cannot emit analytics/telemetry without `ADM-017`.
- Recent activity: test event allowlist, exact resource authorization, M077/owner provenance,
  partial/unavailable/freshness, safe drill-down reauthorization and exclusion of raw audit,
  invalidation, technical/private events and content.

## 18. Negative acceptance criteria

M016 is not acceptable if it:

- creates or depends on a second Admin frontend;
- returns all organization data then filters in the browser;
- treats role, email, saved view or widget visibility as resource authorization;
- queries provider SDKs directly or exposes provider health payloads/secrets;
- serializes missing/failed/suppressed data as zero;
- aggregates money across currencies or labels estimates as accounting truth;
- enables a sensitive command from cached/snapshot state;
- embeds arbitrary route URLs or generic command payloads;
- allows an alert to be dismissed/resolved outside its owner workflow;
- exposes small sensitive counts through filtering, charts, errors or timing;
- stores client/resource/filter values in PostHog, traces, Sentry or ordinary logs;
- uses AI as the only priority source or allows AI to change visibility/state;
- equates a passing dashboard test with owner-domain correctness;
- claims a live widget/provider while its source is synthetic, unavailable or ungated;
- implements product code before a separately recorded `GENERATE`/Build decision.

## 19. Dependencies

### Required before any Build

- Product Owner approval of this PRD, responsive design, proposed ADR 020 and affected ADM decisions.
- A separately recorded `GENERATE`/M016 Build gate.
- M007 staff identity/session/assurance and ADR 004 resource-grant contracts.
- M080/M081 role/permission policy and M077 audit contract.
- Approved owner projection contracts for every enabled widget.
- Drizzle schema/migration/RLS plan for M016-owned preferences/snapshots; no dashboard edits.
- M086/M087/M088 Admin information architecture, design-system and UX acceptance.

### Owner capability dependencies

- M017/M020 CRM/Lead; M018/M019 Client/Business; M021/M022 ServiceOrder/Case; M023 Task.
- M011 Documents; M012/M025 Communications; M013/M024 Appointments/Calendar.
- M014/M043/M044 Billing/payment verification; M074 Approvals; M079 Risks.
- M026 Notifications; M089 Global Search; M090 Configuration; M091 Users; M092 Reports.
- M047 AI Hub and M097 Observability only through gated minimized projections.
- M068/M072 for future workflow/job summaries; M098/M099 for recovery/deployment evidence.

An absent dependency yields an unavailable/omitted widget. M016 does not create a substitute source.

## 20. Risks

| Risk | Consequence | Control |
|---|---|---|
| Dashboard becomes source of truth | Incorrect sensitive actions | Read-only projections, owner commands and fresh reauthorization. |
| Role-wide data leakage | Cross-client/team exposure | Exact resource scope, owner RLS and final fences. |
| Aggregate inference | Sensitive category disclosure | Classification ceilings, thresholds and differencing tests. |
| Stale cache drives action | Wrong approval/payment/client handling | Visible freshness, generation-bound cache and owner reread. |
| Metric semantic drift | Misleading decisions | Versioned registry, unit/period/source/coverage contracts. |
| Partial data shown as zero | False confidence | Explicit result-state algebra and negative tests. |
| One slow module blocks page | Unusable operations | Per-widget timeout, parallel bounded collection and partial response. |
| Too many widgets | Cognitive overload | Role presets, mandatory priorities and Product Owner inventory gate. |
| Personal metrics misuse | Unfair automated employment decisions | Contextual reporting only; no punitive automation. |
| Saved view preserves access | Post-revocation leakage | Reauthorize before applying preferences and epoch-bound caches. |
| Technical detail exposure | Secret/infrastructure leakage | M097 minimized projection and technical-role gate. |
| Premature realtime/BI | Complexity and privacy debt | Manual refresh/operational core first; separate activation gates. |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: ADM-001 approve Release 1A roles, exact widget inventory, mandatory
  widgets and which unavailable dependencies cause omission versus an unavailable card.]
- [NEEDS PRODUCT OWNER DECISION: ADM-002 approve canonical Admin home route, navigation label and
  whether `/admin` or `/admin/dashboard` is the public internal URL.]
- [NEEDS PRODUCT OWNER DECISION: ADM-003 approve each metric definition, owner/source contract,
  unit, period semantics, coverage and version-change process.]
- [NEEDS PRODUCT OWNER DECISION: ADM-004 approve priority factors, weights, tie-breakers, explanation
  copy, configuration authority and excluded sensitive uses.]
- [NEEDS PRODUCT OWNER DECISION: ADM-005 approve staff role/team/assignment/resource-scope matrix and
  organization-wide exceptions, if any.]
- [NEEDS PRODUCT OWNER DECISION: ADM-006 approve operational-alert taxonomy, severity, source owner,
  acknowledgement/resolution authority, SLA and critical-alert dismissal policy.]
- [NEEDS PRODUCT OWNER DECISION: ADM-007 approve period presets, custom-range limits, reporting IANA
  zone, currency/geography and current-state versus historical-widget behavior.]
- [NEEDS PRODUCT OWNER DECISION: ADM-008 approve freshness/partial/stale/unavailable thresholds and
  whether last-confirmed data may appear for each widget class.]
- [NEEDS PRODUCT OWNER DECISION: ADM-009 approve cache/snapshot eligibility, TTLs, key scope,
  invalidation/recovery generation and materialized-view policy.]
- [NEEDS PRODUCT OWNER DECISION: ADM-010 approve personalization, mandatory widgets, saved filters,
  sharing, layout limits and preference retention.]
- [NEEDS PRODUCT OWNER DECISION: ADM-011 approve Release 1A quick actions, owning command services,
  step-up/confirmation needs and actions prohibited from dashboard entry.]
- [NEEDS PRODUCT OWNER DECISION: ADM-012 approve any export dataset, roles, purpose/reason, format,
  delivery/expiry, PII treatment, rate limits and audit.]
- [NEEDS PRODUCT OWNER DECISION: ADM-013 approve any bulk actions, maximum batch, preview,
  confirmation, rollback/compensation and explicitly prohibited operations.]
- [NEEDS PRODUCT OWNER DECISION: ADM-014 approve whether staff impersonation will ever exist and, if
  so, roles, reason, read-only scope, banner, expiry, audit and prohibited actions.]
- [NEEDS PRODUCT OWNER DECISION: ADM-015 approve integration/AI/system health widgets, technical-role
  audience, safe fields, provider activation evidence and secret/error exclusions.]
- [NEEDS PRODUCT OWNER DECISION: ADM-016 approve polling/realtime event classes, transport adapter,
  frequency, recovery behavior and notification interaction; default is manual refresh.]
- [NEEDS PRODUCT OWNER DECISION: ADM-017 approve charts, product/business metrics, operational and
  product analytics/telemetry event schemas and allowlists, viewers, attribution, retention and the
  M016/M092 boundary; all nonessential dashboard analytics/telemetry defaults off.]
- [NEEDS PRODUCT OWNER DECISION: ADM-018 approve threshold rules, minimum aggregation, suppression,
  differencing protection and who may configure each threshold.]
- [NEEDS PRODUCT OWNER DECISION: ADM-019 approve dashboard preference/snapshot/audit retention,
  deletion, legal hold and backup/restore periods.]
- [NEEDS PRODUCT OWNER DECISION: ADM-020 approve measurable dashboard performance/accessibility SLOs,
  supported devices, widget count/load budget and acceptance evidence; this gate does not activate
  analytics or telemetry.]
