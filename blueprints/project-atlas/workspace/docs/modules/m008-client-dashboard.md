# Module PRD — M008 Dashboard del cliente

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture candidate; no Build gate
- Surface: Client Portal Home `/client`
- Workstream: R1.5 Client Portal & Launch
- Release target: Release 1A minimum dashboard with compatible Release 1B extensions
- Source: complete Product Owner-supplied M008 corpus, normalized to the approved stack
- Related catalog modules: M008; consumes M007/M009–M014/M018/M021–M026/M042–M045/M077/M080–M081
- Proposed ADR: ADR 012

This PRD defines a client-safe home projection. It does not authorize product code, routes,
database schema, RLS or Storage policies, external-provider traffic, merge, deployment or
`GENERATE`.

## 1. Purpose

Give an authenticated, explicitly authorized SG Solutions client a trustworthy answer to two
questions within seconds:

1. **What is happening with my services?**
2. **What do I need to do next?**

M008 is the `Home` view of the existing Client Portal. It is not a second portal, an administrative
dashboard, a system of record or an AI console. It composes minimized, client-visible projections
from the domains that own services, cases, tasks, documents, appointments, payments, messages and
notifications.

## 2. Business value

- Reduce avoidable status calls and uncertainty without exposing internal operations.
- Make the client's next safe action obvious on desktop and mobile.
- Help the owner-operator identify missing client inputs while keeping the portal simple.
- Preserve trust by distinguishing payment, review and authorization states accurately.
- Provide one consistent home experience as SG Solutions adds service verticals and staff.
- Create a compatible Release 1A foundation for richer Release 1B portal workflows without a
  second dashboard model or provider-specific UI.

## 3. Scope

### Release 1A architecture

- Authenticated Client Portal Home at `/client`.
- Bilingual greeting and minimized active personal/business context label.
- A single deterministic `PriorityAction`, or an explicit no-action state.
- Client-visible active service summaries using `ServiceOrder` and approved case projections.
- Public status, real milestones and a safe next-step summary per service.
- Required or due-soon client tasks.
- Missing, received and correction-required document summaries without document content.
- The next authorized appointment summary with IANA time-zone display.
- Payment-obligation summary based on the reconciled operational projection, with secure navigation
  to M014 rather than provider data in the dashboard.
- Unread-message and notification counts derived only from authorized client-visible records.
- Bounded quick links to the owning portal areas.
- Approved contextual Help Center suggestions filtered by locale, service, status, audience and
  freshness.
- Per-section freshness and safe partial-degradation behavior.
- Server-side aggregation, authorization and data minimization under proposed ADR 012.
- Responsive web/mobile layouts, WCAG 2.2 AA, reduced motion and English/Spanish parity.
- Coarse, optional first-party operational metrics with no protected content.

### Compatible Release 1B extensions

- Approved dashboard preferences and widget ordering.
- More notification workflows and client-safe service milestones.
- Expanded message, appointment and billing summaries through their owning modules.
- Approved client-safe recommendations or cross-sell placements with suppression rules.
- Authorized representative/household context switching after M007/IAM policy approval.
- A separately governed, read-only staff support projection that can reproduce a client's view.
- Performance projections or typed section snapshots only after freshness and security evidence.

Release 1A identifiers, DTOs, authorization decisions and priority-policy versions must extend into
1B compatibly. A disposable dashboard table or duplicate service/case model is prohibited.

## 4. Explicit out of scope

- A new application, portal, microservice or independent database.
- Client self-registration, account recovery or identity linking; M007 owns those flows.
- Detailed service pages, complete timelines or full requirements; M009/M010 own them.
- Upload, preview, download or document review behavior; M011 owns it.
- Full message bodies, attachments or conversation actions; M012 owns them.
- Booking, cancellation or rescheduling logic; M013 owns it. M024 is internal calendar UI only.
- Checkout, invoice, receipt, refund or dispute operations; M014/M043–M045 own them.
- CRM records, internal notes, staff tasks, risk scores, approval rationale, AI reasoning, prompts,
  tool output, raw audit events or legal strategy.
- Live queries to Stripe, Google Calendar, Storage, Sanity or another provider from the browser.
- A fabricated progress percentage or a dashboard-owned service status.
- Autonomous prioritization or state changes by an LLM.
- Personalized professional advice, guaranteed outcomes or aggressive cross-selling.
- Silent impersonation or administrative actions through a “view as client” mode.
- Persistent personalized caching or a serialized dashboard snapshot in Release 1A.
- Final business thresholds, public status copy, recommendations or analytics policy without
  Product Owner approval.

## 5. Actors

### Active client

Has an active M007 account and membership plus at least one separately authorized resource context.
Sees only client-visible resources granted under ADR 004 and applicable entitlements.

### Client with multiple services

May have several authorized service orders/cases. The dashboard prioritizes one action while still
showing a bounded summary of other active services.

### Authorized business representative

May use a business context only through an explicit active relationship and grants. This actor is a
Release 1B-compatible extension until M007/IAM delegation policy is approved.

### Registered prospect

Represents a possible future authenticated account without an operational client relationship.
Release 1A remains invitation-first and does not create a prospect dashboard or imply case access.

### Owner or authorized staff

Publishes client-visible statuses/actions through the owning domains. Staff does not edit dashboard
output directly. A future support “view as client” mode requires separate permission, reason,
short duration, visible banner and audit.

### Dashboard aggregation service

Builds the minimized response from authorized domain projections. It owns neither business state
nor provider state and cannot broaden the actor's access. It also loads the closed, versioned
registry of sources capable of producing a priority action; it cannot infer source completeness
from whichever ports happened to return data.

### AI assistant

May later explain an already selected, client-safe action or approved help content. It cannot
select priority, infer status, authorize access, retrieve hidden records or mutate any resource.

## 6. User journeys

### Normal home load

1. The client enters `/client` through an active M007 application session.
2. The server derives the actor and resolves the requested or default authorized context.
3. The aggregation service freezes a complete authorization snapshot covering account, session,
   membership, context, grant set, entitlement set and policy versions plus locale and a trusted
   server timestamp.
4. The service loads the policy-versioned registry of every active source capable of producing a
   priority action. Domain ports return field-allowlisted projections for only that context against
   the same request snapshot.
5. The deterministic priority engine selects one eligible action.
6. The server revalidates every frozen authorization fence before serialization.
7. The client receives a private, non-shared response showing the priority action, service
   summaries and authorized supporting sections.

### Complete the priority action

1. The client reads the action title, reason, due information and owning service.
2. The action links to the canonical owning route, such as Documents, Payments or Appointments.
3. The owning module reauthorizes the action and any required step-up; the dashboard link itself
   grants nothing.
4. After successful completion, the owning domain changes state and emits its event.
5. A later dashboard request recomputes priority from current authoritative projections.

### Multiple active services

1. The client sees one action across all authorized services.
2. Service cards show approved status, latest real milestone, next client-visible step and a link to
   M009/M010.
3. Ties follow the versioned deterministic policy; card order does not decide authorization or
   mutate service priority.

### Partial dependency failure

1. The dashboard obtains identity/context and some, but not all, authorized fragments.
2. Every fragment is validated independently and assigned a safe freshness outcome.
3. A failed section displays an explicit unavailable/retry state; it is never rendered as zero,
   complete, paid or no-action.
4. The priority engine consults the closed source registry rather than returned data alone. If a
   failed, missing or unknown source could tie or outrank the tentative result, the page states that
   the next action cannot be confirmed and offers refresh and human support.

### Context switch

1. A user with multiple approved relationships chooses a context through M007.
2. The server validates the opaque context reference against active membership and grants.
3. Every dashboard fragment is recomputed under one new context and policy version.
4. Old-context content is removed before new-context content becomes interactive; mixed-context
   rendering is prohibited.

### No active obligation

1. All authorized sources respond successfully and produce no eligible client action.
2. The dashboard shows a calm “No action is required right now” state plus latest authorized
   service context and approved support/help links.
3. The state does not promise completion, approval or an external response date.

## 7. States and transitions

### Dashboard request

`received → session_resolved → context_authorized → aggregating → ready|partial`

Any non-terminal state may end as `unauthenticated`, `context_unavailable`, `policy_changed` or
`temporarily_unavailable`. A retry creates a new request; a failed request is never resumed with an
old actor context.

### Authorized section presentation

`loading → fresh|empty|stale|unavailable`

- `fresh`: source version and freshness policy permit normal display and actions.
- `empty`: the authorized source responded successfully and contains no applicable item.
- `stale`: a last-known, authorized noncritical summary may display with `asOf`, warning and
  disabled risky actions.
- `unavailable`: absence cannot be interpreted as zero or completion; show recovery.
- Authorization denial is a server decision and normally removes the resource/section from the
  payload. The client is not told that another resource exists.

### Priority action

Candidate lifecycle: `eligible|suppressed|expired|completed|invalid`.

Presentation: `required|upcoming|informational|none|unconfirmed`.

Only `eligible` candidates from fresh-enough, authorized projections participate. `unconfirmed` is
used when a failed critical source prevents a trustworthy “none” or lower-priority conclusion.

### Client-facing service status

The candidate vocabulary is:

`intake_started`, `information_incomplete`, `payment_pending`, `payment_processing`,
`payment_confirmed`, `pending_internal_review`, `approved_to_start`, `in_progress`,
`waiting_for_client`, `waiting_for_external_response`, `documents_required`,
`document_under_review`, `appointment_required`, `signature_required`, `completed`, `cancelled`,
`refunded`, `on_hold`.

These are stable codes, not approval of final wording or a direct copy of every internal case state.
The mapping is versioned and Product Owner-approved before Build.

### Supporting status vocabularies

- Client task: `pending`, `in_progress`, `submitted`, `under_review`, `completed`, `expired`,
  `cancelled`.
- Client document: `received`, `under_review`, `accepted`, `needs_correction`, `expired`,
  `replaced`.
- Client payment: `payment_pending`, `processing`, `paid`, `partially_paid`, `failed`, `refunded`,
  `partially_refunded`, `disputed`, `cancelled`.

The owning modules remain authoritative for their complete internal/provider state graphs.

## 8. Business rules

1. M008 is a read model. It does not write service, case, task, document, appointment, payment,
   message, consent, notification or authorization state.
2. One dashboard response belongs to exactly one active authorized context.
3. Every count and card includes only resources the actor may currently know exist.
4. `PriorityAction` is selected by a versioned deterministic policy, never an LLM.
5. The same policy version owns a closed `PrioritySourceRegistry` mapping every active producer to
   the highest-priority band it can emit and whether a trustworthy empty result is required. A
   missing, unknown or incomplete required source cannot be ignored.
6. Candidate priority bands are, in order:
   1. security or identity action required for safe access;
   2. payment obligation that blocks an approved next step;
   3. expired required document;
   4. pending signature;
   5. overdue or policy-defined due-soon client task;
   6. policy-defined imminent appointment;
   7. missing required information;
   8. general client action;
   9. no action.
7. Within a band, blocking precedes nonblocking, then the earliest applicable due instant, then the
   owning workflow's approved priority, then creation instant, then an opaque stable action ID.
   Time windows and service/workflow priority remain Product Owner decisions.
8. A security action may explain a required verification but cannot expose risk rules, factor
   secrets or account-existence information.
9. Payment `processing` is not `paid`; `paid` is not `approved_to_start`; and neither state executes
   a sensitive service automatically.
10. The dashboard reads the Postgres reconciled financial projection. Stripe remains external
   financial authority; stale/missing reconciliation cannot be inferred from a return URL, client
   parameter or cached dashboard value.
11. Google Calendar is never queried from the browser. The appointment summary uses only current
    M013 Postgres appointment truth and M013 client-projection freshness. External sync failure is an
    internal M013 recovery concern and never becomes a false Client appointment state.
12. Service progress uses real milestones and named stages. Fabricated percentages are prohibited.
13. Timeline previews contain only explicitly client-visible events and never internal notes,
    prompts, risk signals, tool output, legal strategy or raw audit events.
14. Message summaries expose sender-safe label, timestamp and unread state; full sensitive body and
    attachments remain in M012.
15. Document summaries expose obligation/status only—never object keys, permanent URLs, scan
    internals, OCR text or unrelated filenames.
16. Quick links use an allowlisted route key resolved server-side; arbitrary URLs and provider URLs
    are prohibited.
17. Approved help recommendations come only from current, published public content for the active
    locale/audience/service/status. Missing critical translation fails closed.
18. Cross-sell is absent from Release 1A. A future placement must be relevant, separately labeled,
    consent-aware and suppressed during complaints, payment problems, disputes, sensitive recovery
    or system errors.
19. Dashboard appearance never grants an entitlement or changes a service state.

## 9. Authorization rules

- M007 must resolve an active session, account and membership before M008 begins aggregation.
- The server derives the actor and treats a browser context reference only as a request.
- Client membership grants no case access. Active case/resource grants and ADR 004 control each
  client-visible descendant.
- M045 entitlements may narrow a service capability but never replace a case/resource grant.
- Every domain fragment authorizes before I/O; Postgres RLS enforces the same scope as defense in
  depth. User-facing reads use the restricted session-derived role, never `service_role`, owner or
  `BYPASSRLS`.
- Internal notes, staff tasks, hidden milestones, approval rationale and raw audit events are not
  selected and cannot be recovered through counts, timing or error differences.
- Highly Sensitive resource summaries require the applicable assurance and explicit grant; the
  dashboard should prefer a generic required-action projection over sensitive metadata.
- The aggregator binds all fragments to one `AuthorizationSnapshot`: account, session family,
  membership, context, grant set, entitlement set, security-policy version and request epoch. Every
  input has a current version or equivalent revocation fence. A changed, expired or revoked fence
  before response discards the projection; checking only session/context/policy is insufficient.
- Priority-affecting Postgres fragments use one read-only consistent snapshot with transaction-
  local M007 actor context. Parallel reads are permitted only if they prove that same database and
  authorization snapshot; otherwise the result fails closed rather than mixing time cuts.
- Owning routes reauthorize every mutation or download. A dashboard route or opaque resource
  reference is not a capability token.
- Future staff “view as client” cannot reuse a client session. It requires an approved staff
  permission, reason, time-bound read-only projection, persistent visible banner and audit; payment,
  signature and security mutations remain blocked.

## 10. Data requirements

### Request-scoped read model

`ClientDashboardProjection` contains only:

- schema version, generated timestamp, locale and safe display time zone;
- opaque account/context reference and approved context label;
- authorization-policy version and projection freshness summary;
- one `PriorityActionProjection`;
- bounded `ClientServiceSummary[]`;
- bounded task/document/payment/notification counts and previews;
- at most the approved number of appointment/message/help previews;
- section outcomes and safe recovery codes.

The internal request envelope also carries the complete `AuthorizationSnapshot`, trusted server
time, consistent-read identifier and `PrioritySourceRegistry` version. These controls are never
serialized to the client. Each registered port returns a closed result envelope with
`complete|empty|stale|unavailable`, its declared maximum priority band, source version, `asOf` and
the authorization snapshot reference it used.

Each domain fragment includes its opaque source reference, source version, `asOf`, freshness class
and classification. The aggregator strips those fields from the public DTO unless the client needs
an approved `last updated` value.

### Projection boundaries

- `ClientServiceSummary`: service display key, public status code, real public milestone, safe next
  step, action-required flag and owning route key.
- `PriorityActionProjection`: stable action key/category, presentation state, localized message
  keys, safe due instant/zone where applicable, owning service label and allowlisted route key.
- `ClientObligationSummary`: authorized counts by safe state; no hidden-resource totals.
- `ClientAppointmentSummary`: appointment type label, instant, IANA zone, channel-safe label and
  M013 client-projection version/freshness; no Google/provider reconciliation state or unrelated
  calendar data.
- `ClientPaymentSummary`: amount/currency only when already authorized and owned by M014, safe
  obligation state and canonical portal route; no client secret, card data or raw Stripe object.
- `ClientMessageSummary`: unread count and bounded metadata; no body or attachment content.

Release 1A does not persist a monolithic `ClientDashboardSnapshot`. A future materialized projection
must use typed, section-scoped records with explicit TTL/version/classification and may not include
critical identity, payment or authorization truth. `DashboardPreference` is a future account-
scoped record only after its editable fields are approved.

## 11. API or service contracts

### Query contract

`ClientDashboardQueryService.getHome(actor, requestedContextRef?, locale) →
ClientDashboardProjection`

The service:

1. resolves and freezes the complete authorization snapshot and trusted server time;
2. loads the closed priority-source registry for the same policy version;
3. requests bounded projections through domain-owned query ports against one consistent request
   snapshot where required;
4. validates source registration, completeness, context, authorization snapshot, classification,
   source version and freshness for every fragment;
5. selects one deterministic priority action or `unconfirmed` when completeness is not proven;
6. minimizes and localizes the response;
7. revalidates account/session/membership/context/grant/entitlement/policy fences before returning.

The `now` used for expiry, due-soon, imminence and freshness comes only from the trusted server
clock captured in the request envelope. Client time, time zone or query values cannot advance or
delay priority.

Candidate domain ports are provider-neutral:

- `ClientSecurityActionProjectionPort.getRequiredAction`;
- `ClientServiceProjectionPort.listAuthorized`;
- `ClientTaskProjectionPort.listActionable`;
- `ClientDocumentProjectionPort.listObligations`;
- `ClientSignatureProjectionPort.listPending`;
- `ClientAppointmentProjectionPort.getNext`;
- `ClientPaymentProjectionPort.getObligations`;
- `ClientMessageProjectionPort.getUnreadSummary`;
- `ClientNotificationProjectionPort.listCurrent`;
- `ClientHelpProjectionPort.listApproved`.

These are logical contracts, not authorization for route names, packages or schemas.

### HTTP boundary candidate

An authenticated `GET /api/v1/client/dashboard` may expose the single aggregated DTO. The active
context is an opaque request value and is rederived server-side. The response uses private,
non-shared, `no-store` behavior in Release 1A; experimental private caching is not an approved
production dependency.

Stable outcomes:

- `200`: complete or explicitly partial projection;
- `401`: invalid/expired application session;
- `404`: requested context unavailable, without confirming its existence;
- `409`: context or authorization-policy version changed; refresh safely;
- `429`: bounded rate protection;
- `503`: a trustworthy dashboard cannot be assembled.

Section failures inside `200` use allowlisted codes such as `temporarily_unavailable`,
`refresh_required` or `verification_required`; provider/internal details are absent. Pagination or
strict preview limits apply to every list. An unbounded dashboard payload is prohibited.

## 12. Events and background jobs

M008 consumes, but does not own, events including:

- `account.security_action_required`, `membership.revoked`, `grant.revoked`;
- `service_order.updated`, `case.client_projection_changed`, `case.next_action_changed`;
- `task.client_action_changed`, `document_request.published|satisfied|expired`,
  `document_review.correction_requested|accepted`, `document.client_visible_version_changed`;
- `signature.requested`, `signature.completed`, `signature.expired`;
- `appointment.client_projection_changed` (opaque refs/versions only; reauthorize and reread M013);
- `payment.updated`, `payment.reconciled`, `invoice.updated`;
- `entitlement.changed`, `priority_policy.activated`;
- `message.created`, `notification.created|dismissed` and `content.published|stale`.

Release 1A can compute from current Postgres projections without a dashboard-owned worker. Owning
modules remain responsible for Stripe/Google/document/message reconciliation. Future invalidation or
materialization jobs must be idempotent, retry-bounded, reconstructable from authoritative state and
manually recoverable. Inngest coordinates work but never owns dashboard or business state.

An optional coarse `client_dashboard.viewed` event may record route, locale, result class and opaque
correlation only after analytics policy approval. It contains no resource IDs, status details,
amounts, counts tied to identity, message/document data or client profile fields.

## 13. Error states and recovery

- **Session/account/context unavailable:** render no personalized dashboard; return to the M007 safe
  authentication/recovery path.
- **Authorization changes during aggregation:** an account/session/membership/context/grant-set/
  entitlement-set/policy fence mismatch discards the assembled response and retries once under a
  new request epoch; repeated change returns a safe refresh/sign-in response.
- **Priority source missing or unregistered:** treat the registry/port mismatch as a configuration
  failure, never as an empty source; return `unconfirmed` when a safe partial response exists or
  `503` when no trustworthy priority can be assembled, and alert operations without source detail
  in the client response.
- **Case/service projection unavailable:** show that service information cannot be confirmed; do not
  show a false completed/no-service state.
- **Task source unavailable:** do not claim that nothing is due. Priority becomes `unconfirmed` if
  tasks could outrank the selected action.
- **Document source unavailable:** do not hide obligations or expose scan/provider errors; show a
  safe retry/support path.
- **Payment projection stale/unavailable:** never infer paid, unpaid or amount. Disable payment-state
  claims and direct the user to a safe refresh/M014 support route.
- **M013 appointment projection stale/unavailable:** a last-known appointment may display only with
  an approved `asOf` label and non-destructive actions disabled; otherwise show unavailable. Google/
  external-calendar staleness is not a Client DTO field and cannot falsify or hide Postgres appointment
  truth; M013 creates the staff recovery path while every client action reauthorizes directly in M013.
- **Messages/notifications unavailable:** preserve core action/service content and label only the
  failed section; a zero badge is prohibited.
- **Help content stale/missing locale:** omit unsafe guidance and provide a neutral Help Center link.
- **Timeout/partial failure:** use bounded per-port timeouts and section-level recovery. A critical
  source failure that could change priority prevents a definitive `none` state.
- **Offline after render:** already displayed data is labeled with its last verified time; no write
  is queued from M008. Refresh and owning-module actions require reconnection.

Recovery copy never reveals provider names, internal exceptions, other resources or security
thresholds. Correlation references are opaque and safe to share with support.

## 14. Security and privacy requirements

- Apply M007/ADR 011 session controls and ADR 004 authorization inheritance before aggregation.
- Use field-allowlisted domain projections; never serialize domain rows and delete fields afterward.
- Execute user reads with session-derived restricted Postgres context and RLS; no browser direct
  database/Storage/provider access and no privileged service role on user routes.
- Prevent BOLA/IDOR with server-derived context, opaque references and positive/negative/cross-client
  contract tests.
- Bind every port to the complete authorization snapshot and revalidate all revocation fences before
  serialization; grant or entitlement changes must invalidate an in-flight result.
- Require the policy-versioned priority-source registry and reject unknown, duplicate, missing or
  band-incompatible producers. Returned data alone never proves source completeness.
- Use private/no-store authenticated responses and prohibit shared/CDN/ISR dashboard caching.
- Do not use localStorage/sessionStorage, offline caches, service-worker caches or browser analytics
  to persist the personalized projection.
- Do not return signed document URLs, Stripe client secrets, OAuth tokens, provider event IDs,
  Storage keys, internal IDs, hidden counts or raw error payloads.
- Reauthorize at every owning route; apply step-up for actions required by M007 policy.
- Rate-limit and bound aggregation fan-out, list sizes, query cost and timeouts to prevent an
  authorized account from exhausting shared capacity.
- Logs/traces/Sentry/PostHog use opaque correlation, port name, duration and outcome only. Client
  name, contact, context label, amounts, status, counts, due dates, message/document metadata and
  free text are prohibited.
- Session replay and DOM autocapture are prohibited throughout authenticated portal surfaces.
- Audit context selection, privileged support projection and sensitive downstream navigation where
  required without copying dashboard content.
- A mixed or stale cross-context response is a security incident, not a normal partial state.

## 15. UX and accessibility requirements

- The visual hierarchy is: critical alert, priority action, active services, client tasks,
  document obligations, next appointment, payment summary, messages/notifications, help/support.
- The first viewport should answer status and next action without dense explanatory text.
- Use the approved SG Solutions logo unchanged, Manrope headings, Inter body copy and the navy,
  cobalt, cyan, green, gold and light-surface token system.
- Use restrained white space, small status surfaces and subtle motion; avoid a generic credit-site
  aesthetic, decorative finance imagery inside the portal or oversized marketing copy.
- Desktop uses the portal navigation shell and a bounded content grid. Mobile uses one column with
  the priority action first and no horizontal data tables.
- Cards are not clickable containers when they contain multiple actions; provide explicit links or
  buttons with clear names.
- Status uses text and icon in addition to color. Real milestone progress uses named steps, not a
  misleading percentage.
- Every section defines loading, empty, stale, unavailable and retry behavior. Skeletons do not
  announce false content.
- Keyboard order follows the visual task sequence; focus moves to a section status only after a
  user-triggered refresh or error.
- Core content reflows at 320 CSS pixels and remains usable at 200% zoom. Touch targets are at least
  44×44 CSS pixels as the project baseline.
- Live regions announce priority/section changes without repeating the entire dashboard.
- Dates show localized date/time plus named time zone when material; money uses locale and currency.
- Reduced motion removes nonessential transitions; no urgency is conveyed through pulsing,
  countdown animation or sound alone.
- The page title and `h1` identify `Inicio`; regions have meaningful headings and a skip link.

The detailed execution specification is
`docs/superpowers/specs/2026-08-09-m008-client-dashboard-design.md`.

## 16. Bilingual requirements

- Every navigation label, status, priority-action explanation, empty/error/recovery state, date/
  amount label, notification and help link has English/Spanish semantic parity.
- Stable codes and message keys remain locale-neutral; translated text is never persisted as state.
- Critical instructions never silently fall back to the other language. Missing parity produces an
  unavailable safe state plus a neutral support path.
- User-authored messages and original document names remain in their original language.
- Service names and milestones use the approved localized catalog/projection, not machine
  translation at request time.
- Locale switching preserves the active authorized context and route while forcing a fresh,
  reauthorized projection.

## 17. Acceptance criteria

1. An active client with one authorized case receives one context-bound dashboard and one
   deterministic priority action.
2. Membership without a case/resource grant yields no service, task, document, payment, appointment
   or count from that case.
3. A client with two contexts cannot receive mixed cards, counts or stale interactive controls after
   switching.
4. Internal notes, staff tasks, risk/approval rationale, raw audit, provider payloads and hidden
   resource counts are absent from queries and serialized DTOs.
5. Repeated aggregation over the same versions/policy/time yields the same priority action.
6. Equal-band candidates follow the approved deterministic tie-break order.
7. An unavailable critical source cannot produce a definitive lower-priority or no-action result.
8. A payment return URL, query parameter or client value cannot mark a payment paid or change
   priority.
9. `paid` and `approved_to_start` remain visually and technically separate.
10. A stale appointment or payment summary is labeled/disabled according to policy and never
    presented as current without evidence.
11. Owning-route navigation reauthorizes the action and rejects a revoked grant or stale session.
12. Dashboard responses are dynamic/private/no-store and are never served from shared cache to
    another session.
13. A 320px/200%-zoom mobile view presents the priority action first without two-dimensional
    scrolling or hidden controls.
14. Keyboard and screen-reader users can identify the current context, priority action, every
    section state and recovery action in both languages.
15. Locale parity tests cover every stable status/action/error key.
16. Analytics, logs, traces and error reports contain no protected dashboard content or personal
    identifiers.
17. Provider/domain partial failures have explicit safe behavior and a human recovery route.
18. No M008 operation directly mutates an owning domain or calls an external provider from the
    browser.
19. A future support projection cannot perform payment, signature, security or service mutations and
    is visibly/auditably distinct from a real client session.
20. No persisted monolithic dashboard snapshot exists in Release 1A.
21. Revoking a grant or entitlement during aggregation invalidates the full response even when the
    session and security-policy version did not change.
22. Every active priority band has an approved registered producer; missing, duplicate, unknown or
    incomplete source registration fails closed and cannot yield a lower action or `none`.
23. Security/identity and signature candidates are obtained through their explicit provider-neutral
    ports and are subject to the same authorization, freshness and completeness rules.
24. Client-controlled time cannot alter expiry, due-soon, imminence, tie-breaking or freshness.

## 18. Negative acceptance criteria

- No access from email, phone, payment, CRM status, client ID, route knowledge or UI visibility.
- No direct `SELECT *`, raw domain entity serialization or client-supplied actor/context authority.
- No zero badge, “all caught up,” “paid,” “complete” or “no action” when its source is unavailable.
- No fake percentage, guaranteed completion date or professional-outcome promise.
- No payment confirmation interpreted as human authorization.
- No internal note, raw message body, document content/name, Stripe object, calendar detail, prompt,
  AI reasoning or risk score in the dashboard payload.
- No shared cache, ISR, public CDN cache, browser storage or session replay of personalized content.
- No LLM decides priority, status, access or entitlement.
- No arbitrary destination URL or provider-hosted link accepted from dashboard data.
- No hidden cross-sell during complaints, disputes, payment failures, sensitive recovery or system
  errors.
- No admin impersonation presented as the actual client and no mutable “view as client” mode.
- No full M009–M014 behavior duplicated inside M008.

## 19. Dependencies

- M007 and proposed ADR 011 for authenticated actor, active context and session assurance.
- M080/M081 for RBAC/least privilege; M091 for future support/admin actions.
- ADR 004 for case/resource inheritance and revocation.
- M045 for service entitlements and their revocation/version fence.
- M018/M021/M022/M023 for client, service order, case and task projections.
- M009/M010 for detailed services and process status.
- M011/Document Center for document obligations and secure owning routes.
- M012/M025/M026 for message and notification summaries.
- M013 for appointment truth/client projection and provider reconciliation; M024 only consumes an
  internal UI projection, while M008 receives no Google/provider reconciliation state.
- M014/M042–M045 for authorized payment projection, catalog and entitlements.
- M067 for signature obligations and their client-visible projection.
- M002/M062–M064 for approved current bilingual help content.
- M077 for minimized audit/activity evidence.
- M086–M088 for information architecture, design system and UX principles.
- Postgres/Drizzle, i18n, observability minimization and provider abstractions.

M008 must not make unavailable downstream modules appear operational. In Release 1A a missing
approved owning capability is omitted or shown as unavailable—not simulated.

## 20. Risks

| Risk | Control |
|---|---|
| Cross-client or cross-context leakage | Complete authorization snapshot, per-port authorization, consistent RLS read snapshot, final revocation fence and adversarial tests. |
| Misleading priority after partial failure | Critical-source completeness rule and `unconfirmed` state. |
| Missing producer silently lowers priority | Closed policy-versioned source registry and fail-closed configuration tests. |
| Stale financial/M013 client projection | Reconciled Postgres financial facts, M013-owned client-projection freshness and disabled risky actions. |
| Dashboard becomes a second domain model | Read-only projection ports, no mutation ownership and ADR 012. |
| Fan-out latency or exhaustion | One bounded aggregator, parallel domain ports, limits/timeouts and no live provider fan-out. |
| Sensitive telemetry/cache leakage | Field allowlists, no-store, no browser persistence, redaction tests and no portal autocapture. |
| Cognitive overload | One priority action, bounded previews, progressive disclosure and owning-route navigation. |
| Translation changes meaning | Stable codes, reviewed semantic parity and fail-closed critical copy. |
| Cross-sell damages trust | Absent in 1A; future explicit suppression/consent/disclosure policy. |
| Sole-operator support ambiguity | Honest support copy with no invented response-time promise. |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the client-facing service status vocabulary, internal-to-
  public mapping and bilingual wording.]
- [NEEDS PRODUCT OWNER DECISION: approve due-soon/imminent time windows, workflow/service priority
  inputs, the active source registry for each release and the final deterministic priority policy.]
- [NEEDS PRODUCT OWNER DECISION: approve which payment amounts, balances and invoice details may
  appear in the M008 summary versus only inside M014.]
- [NEEDS PRODUCT OWNER DECISION: approve whether the responsible staff member's name/contact may be
  shown on a service card and under what availability policy.]
- [NEEDS PRODUCT OWNER DECISION: approve notification defaults, dismissal behavior and channels;
  M008 itself will not send messages.]
- [NEEDS PRODUCT OWNER DECISION: approve per-section freshness/staleness windows and the exact
  client copy for unconfirmed/partial states.]
- [NEEDS PRODUCT OWNER DECISION: decide whether authenticated prospect accounts without an active
  client relationship receive any Release 1B dashboard or only an evaluation status page.]
- [NEEDS PRODUCT OWNER DECISION: approve authorized business-representative/household contexts and
  their delegation/revocation policy before enabling context switching.]
- [NEEDS PRODUCT OWNER DECISION: approve whether dashboard widget preferences enter Release 1B and
  which fields may persist.]
- [NEEDS PRODUCT OWNER DECISION: approve any future contextual recommendation/cross-sell policy,
  consent, disclosures and suppression conditions.]
- [NEEDS PRODUCT OWNER DECISION: approve whether a staff “view as client” support projection is
  needed, which roles may use it and the required reason/duration.]
- [NEEDS PRODUCT OWNER DECISION: approve dashboard analytics events, retention and who may view
  aggregate operational metrics.]
- [NEEDS PRODUCT OWNER DECISION: approve the help/support channels and any service-hour or response-
  time wording; no availability promise will be invented.]
- [NEEDS PRODUCT OWNER DECISION: approve the maximum number/order of service cards and previews at
  Release 1A launch after UX testing.]

## Reference basis

- [Next.js caching guidance](https://nextjs.org/docs/app/guides/caching-without-cache-components)
  supports explicit dynamic/no-store handling for personalized request-time data; the experimental
  private-cache directive is not adopted by this candidate.
- [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)
  supports database-enforced row isolation in addition to domain authorization.
- [Stripe webhook guidance](https://docs.stripe.com/webhooks) documents duplicate and out-of-order
  delivery, reinforcing reconciled financial projections rather than dashboard inference.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and its
  [Reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) define the accessibility
  baseline used by the responsive design.
