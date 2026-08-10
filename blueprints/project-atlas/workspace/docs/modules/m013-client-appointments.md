# M013 Client Appointments — Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready documentary candidate; open Product Owner decisions remain; no Build gate
- Surface: Public Website `/book`, Client Portal `/client/appointments`, bounded contribution to M024 Admin Calendar
- Catalog module: M013
- Related modules: M003–M006, M007–M012, M014, M017–M018, M020–M026, M041, M043–M045,
  M047, M051, M068, M072–M078, M080–M085, M090–M092, M097–M099
- Proposed architecture decision: ADR 017

This PRD normalizes the Product Owner's complete M013 source into the approved Astro/Next.js,
Supabase/Postgres, Drizzle and Inngest baseline. It specifies architecture and experience only. It
does not create routes, tables, RLS policies, Google OAuth credentials, calendars, notifications,
payments, meetings, real appointments or product behavior.

## 1. Purpose

Define one safe appointment capability through which prospects and authorized clients can discover
real availability, request or confirm an appointment, manage permitted changes and understand the
next step without exposing staff calendars or relying on a provider as business authority.

M013 owns the appointment aggregate, availability calculation, holds, conflict-safe booking,
client/public appointment projection and appointment-management policy enforcement. M024 owns the
internal calendar workspace and its cross-domain display. Google Calendar is a provider adapter and
rebuildable projection; it is never the SG Solutions appointment system of record.

The cross-domain `PublicBookingOrchestrator` lives in the application layer, not inside M013. It
transiently separates raw minimum contact/consent toward M020/M078 reservation and passes only the
opaque context receipt plus opaque booking facts to M013, coordinating finalization with the winning
transaction. Its transit DTO is never persisted, logged, traced, analyzed or emitted by M013.

## 2. Business value

- Convert public interest into a verifiable evaluation or callback without inventing availability.
- Give clients one clear, bilingual place to see and manage authorized appointments.
- Prevent double booking, time-zone mistakes and provider drift.
- Relate appointments to the correct lead, client, service order or case without granting access by
  association.
- Preserve a secure manual operating path while SG Solutions begins with one internal operator and
  before Google, video, messaging or payment providers are activated.
- Let public chat, WhatsApp, voice, forms and secure messaging reuse one scheduling authority rather
  than create per-channel calendars.

## 3. Scope

### Release 1A architecture

- Versioned appointment types with localized name/description, duration, buffers, eligible channel,
  authentication/prerequisite flags and activation state.
- Versioned working windows, closures and manual blocks using IANA time zones.
- Deterministic bounded slot derivation from internal appointments, active holds, buffers, staff
  eligibility and admitted external busy projections.
- Public evaluation flow and authenticated Client Portal appointment list/detail.
- Expiring holds and atomic conflict-safe booking with idempotency.
- Client/staff cancellation and rescheduling under approved policies.
- Client attendance confirmation; authorized staff completion and no-show commands.
- Phone plus approved virtual/in-person presentation only when the exact modality is configured.
- Postgres authority, outbox, audit and durable manual recovery.
- Provider-neutral `CalendarProvider`, `MeetingProvider` and notification handoff contracts, with
  provider activation disabled until their gates pass.
- A static-first Astro booking shell backed by a narrow same-origin Public Scheduling Gateway; all
  actor-bound scheduling responses are dynamic, private and non-cacheable.
- Basic Google free/busy and appointment-event projection architecture without requiring Google for
  internal operation.

### Compatible Release 1B extensions

- Advanced incremental Google synchronization, webhook renewal and broader reconciliation.
- Additional calendars, staff capacity rules and eligible-team assignment.
- Approved payment-required appointment flows through M014/M043–M045.
- More reminder channels, waitlist, round-robin and richer follow-up automation.
- Approved video providers and enhanced operational reporting.

Every 1A identifier, state axis, contract, policy version and adapter extends compatibly into 1B.
No disposable scheduler or provider-specific domain model is permitted.

## 4. Explicit out of scope

- A standalone calendar product, second scheduling application or calendar per acquisition channel.
- A complete Calendly replacement, arbitrary recurring appointment creation, group classes, rooms,
  equipment/resource scheduling or calendar subscriptions.
- M024 internal calendar navigation, task/deadline aggregation or staff workload UI.
- M026 notification delivery, contact preference authority or provider templates.
- M014/M043–M045 quote, price, invoice, payment, refund or Stripe authority.
- M017/M020 CRM/lead creation, deduplication or conversion authority.
- M021 ServiceOrder creation/activation; an appointment never starts a service.
- M023 task ownership, M011 document ownership or M012 message ownership.
- Professional service execution, eligibility decisions, legal/tax/credit advice or filing.
- AI-selected unconfirmed time, AI override, auto-no-show or AI authorization.
- Google sign-in as implicit consent to Google Calendar scopes.
- Publishing an unverified address, personal calendar data, staff identity or provider availability.
- Production Google/meeting/notification/Stripe credentials or traffic before separate activation.

## 5. Actors

### Anonymous prospect

May view only allowlisted public appointment types and derived opaque slots, create a bounded hold
and submit minimum contact/consent evidence. The actor cannot enumerate staff, calendars, events,
clients or internal blocks.

### Authorized client

May list and read only appointments independently authorized to the active account/context and may
confirm, cancel or reschedule only when current policy permits.

### Authorized representative

May act only under an explicit, current, purpose-bound representative grant. Matching a business,
email, phone, household or appointment participant does not create authority.

### Owner or authorized staff

May configure permitted types/windows/blocks, book on behalf of a person, assign an eligible staff
member, change an appointment, record attendance/outcome and perform an override when exact
permissions, an allowlisted `reasonCode` and assurance are present.

### Scheduling worker

Expires holds, requests projections/reminders, reconciles providers and creates restricted recovery
tasks. It has a scoped service identity and cannot change business policy.

### Calendar or meeting adapter

Receives minimized provider commands and returns normalized facts. It owns no SG appointment,
authorization, client or service state.

### AI or channel adapter

May call allowlisted scheduling tools only after its own module/policy gate. It cannot query the
database directly, invent slots, select a final slot without confirmation or claim success without
the M013 receipt.

## 6. User journeys

### 6.1 Public booking

1. Visitor enters the clean `/book` route and chooses an allowlisted type/reason code and modality. No
   appointment type, contact value or bearer capability is encoded in a path, query or fragment.
2. The Public Scheduling Gateway validates locale, viewer IANA zone, appointment-type version and
   eligibility through the typed M013 application facade.
3. M013 returns bounded opaque slots only; no staff/calendar/event details are serialized.
4. Visitor selects a slot; M013 re-derives availability and creates an expiring hold.
5. Visitor supplies the approved minimum contact, language, zone and consent evidence. Before any
   appointment commit, the Gateway calls only `PublicSchedulingFacade.requestBooking`. After workload/
   session validation, that facade delegates internally to `PublicBookingOrchestrator`, which
   idempotently asks M020/M078 for a short-lived scheduling-purpose `ProspectContextReservation`.
   The Gateway never calls CRM/consent ports; M013 receives only the opaque receipt and versions. If
   unavailable, booking fails closed. The reservation is finalized only with the winning appointment
   transaction; rollback/expiry leaves no durable orphan Lead, Contact or reusable consent.
6. `BookingService.request` consumes the hold and, in one conflict-safe transaction, commits either
   a `requested|pending_confirmation` appointment or a `confirmed` appointment, together with its
   closed `BookingSubjectContext`, capacity decision, idempotency receipt, outbox and audit evidence.
7. When prerequisites remain, APT-006 determines whether the pending appointment keeps the exact
   capacity and for how long, or releases it and later requires a fresh hold. `confirmPending` never
   reuses the consumed hold and requires a complete, fresh owner-evidence set plus CAS.
8. Post-commit jobs request provider projection, notification and CRM activity through owning ports.
   A later CRM activity outage does not roll back the durable appointment; the precommit M020/M078
   outage in step 5 does.
9. The visitor receives an honest durable status and only an approved, scoped management path.

### 6.2 Authenticated client books an appointment

1. The client enters `/client/appointments/new` inside the M007-authenticated Next.js portal; the
   Astro Public Scheduling Gateway and PublicBookingSession are not used.
2. `AppointmentTypeQueryService.listClient` returns only types currently eligible for the client's
   exact audience, grant and service/case context.
3. `AvailabilityService.listClientSlots` returns a separate Client DTO and opaque short-lived
   availability receipt; it never falls back to the public contract for private types.
4. The client selects a slot, reviews the named zone/policy/prerequisites and creates a hold under
   the existing authenticated account/session and canonical access root.
5. `BookingService.request` receives the `authorized_client` `BookingSubjectContext`, reauthorizes the
   complete grant/eligibility snapshot and commits the same conflict-safe durable receipt used by
   every booking channel. It never creates or reserves a public Lead/Contact/consent context.

### 6.3 Authorized staff books on behalf of a client

1. Staff enters the M024/M013 quick-book contribution with exact book-on-behalf permission and
   required assurance; the subject is selected through an independently authorized M017/M018 owner
   query, not by raw contact input or an appointment association.
2. `AppointmentTypeQueryService.listStaff` and `AvailabilityService.listStaffSlots` return separate
   minimized Staff DTOs for only the eligible subject, type, owner/capacity context and policy.
3. Staff selects an opaque slot, creates a hold and reviews the authorized subject display, type,
   exact time/named zone, policy, prerequisites and allowlisted reason/purpose codes.
4. `BookingService.request` receives only the closed `staff_on_behalf` context. It creates no public
   prospect/Lead/Contact reservation and exposes no raw contact/calendar/provider detail.
5. Fresh subject/root authorization, assurance, eligibility, conflict and idempotency fences run at
   commit. The atomic receipt is the only success; each linked service/case/client view reauthorizes
   independently and failure leaves no appointment or partial association.

### 6.4 Client views appointments

1. M007 establishes active identity, account, membership and assurance.
2. M013 independently authorizes each appointment through current direct/resource/representative
   evidence and appointment policy.
3. The client sees upcoming and past appointments using localized dates and an explicit named zone.
4. A detail view exposes only approved generic type/modality copy under APT-001/011, management actions and related
   service handoff; it never returns internal notes or provider/calendar metadata.

### 6.5 Client reschedules

1. Client chooses `Reschedule`; M013 reauthorizes and returns a policy receipt plus current slots.
2. A new hold is created without releasing the original appointment.
3. The command supplies the original expected version, hold receipt, the APT-005 policy-required
   allowlisted `reasonCode` when applicable and idempotency key; no free-text rationale exists.
4. One transaction secures the new interval, records immutable prior/new timing evidence, releases
   the old interval and commits the new version/outbox/audit.
5. If the new slot cannot be secured, the original appointment remains unchanged.

### 6.6 Client or staff cancels

1. M013 returns the applicable versioned policy and public consequence.
2. Actor confirms the action and optional/required allowlisted `reasonCode` according to policy;
   cancellation free text is structurally absent before APT-013.
3. M013 reauthorizes, changes appointment state with compare-and-set and releases capacity.
4. Provider, reminder, payment-review and follow-up effects are post-commit owner handoffs.
5. Cancelling an appointment never cancels a service or creates/refunds a payment by implication.

### 6.7 Staff records attendance and outcome

Authorized staff concludes the appointment and records `attended` or `no_show` against the current
version. After APT-012, a separate M013-owned structured outcome may select only approved result,
next-action and tag codes. Typed, idempotent owner handoffs may then request an M023 follow-up, M011
document request, M012 message or M021 service-order review. Free text, notes, transcripts and AI
summaries cannot trigger downstream work and remain in their separate APT-013-gated owners.

### 6.8 Google/provider failure

The internal appointment remains valid. M013 marks the separate projection as pending/failed,
prevents unsafe assumptions, schedules bounded reconciliation and exposes a restricted manual task.
Clients receive operational appointment truth without technical/provider detail.

## 7. States and transitions

States are separate axes. No single `status` may collapse booking, prerequisites, attendance,
provider sync, reminders or payment.

### Appointment lifecycle

`requested -> pending_confirmation -> confirmed -> in_progress -> concluded`

Terminal/alternate transitions:

- `requested|pending_confirmation|confirmed -> cancelled_by_client|cancelled_by_staff` when policy
  and time allow;
- rescheduling is an atomic appointment revision/event, not a terminal lifecycle state;
- `draft` is an internal command/session concept and is not client-visible durable truth.

### Hold lifecycle

`active -> consumed|expired|released|invalidated`

Only one active hold may claim the same exclusive staff interval. A consumed hold records exactly
one historical winning appointment, never blocks independently and cannot be reused. A hold is not
a confirmed appointment and expires against a trusted server clock.

### Requirement lifecycle

`not_required|pending -> satisfied|waived|failed|expired`

Intake, document, payment and manual-approval requirements have typed owner references and separate
evidence. `satisfied` makes the request eligible for booking confirmation; it does not itself
confirm an appointment.

### Attendance axes

- Intent: `unknown -> client_confirmed|client_declined`; intent may change under policy and is never
  proof of attendance.
- Optional presence evidence: `not_checked_in -> checked_in -> in_session`; Release 1A may omit it.
- Outcome: `unrecorded -> attended|no_show`, recorded only by authorized staff after the scheduled
  boundary. No client intent is a prerequisite: unknown/declined clients may attend, and a confirmed
  client may be a no-show.

Authorized staff concludes an appointment and records exactly one outcome in the same transaction.
Client copy derives `Completed|No-show` from `concluded + outcome`; lifecycle never stores `no_show`.
Impossible pairs and concurrent conclude/outcome attempts fail atomically.

### Calendar projection lifecycle

`not_required|not_connected|pending -> synced -> stale|conflict|failed|disconnected -> reconciling ->
synced|manual_action`

Projection failure cannot regress appointment lifecycle. External event deletion/change is input to
reconciliation, not automatic business-state authority.

### Reminder lifecycle

`planned -> queued -> sent|suppressed|failed|cancelled`

Reminder delivery is M026 evidence and is never appointment confirmation or client comprehension.

## 8. Business rules

1. Postgres is the appointment, hold, availability-policy and reconciliation authority. Drizzle is
   the future schema/migration authority after a Build gate.
2. All channels call the same M013 ports. Chat, WhatsApp, voice, forms and messaging cannot maintain
   their own availability or booking state.
3. Store instants in UTC; retain the source local wall time, explicit IANA zone, resolved offset,
   time-zone database/version evidence and applicable policy version for audit.
4. A nonexistent DST wall time yields no slot. A repeated wall time yields distinguishable options
   with offset/zone and must preserve the chosen instant; the system cannot silently choose one.
5. Slot derivation intersects the exact appointment-type version, eligible assignee/capacity,
   effective working window, closures, blocks, existing appointments, active holds, buffers,
   minimum notice, horizon, modality and admitted external busy projections.
6. Slot responses are short-lived observations, not reservations. Confirmation always re-derives and
   rechecks in the database transaction.
   Every admitted external-busy source contributes a versioned coverage receipt with connection/
   calendar, covered horizon, sync cursor/version, `lastCompleteAt`, freshness limit and
   `complete|partial|stale|unavailable` state. Slot, hold and confirmation receipts bind the exact
   required coverage set/digest. If a required admitted source is partial, stale, disconnected or
   does not fully cover the interval, M013 exposes no slot and fails closed to a manual block/
   recovery path; it never silently omits that source. Internal-only operation remains available
   when no external source has been admitted by policy.
7. Capacity exclusion is enforced by a Postgres range exclusion/unique invariant or equivalent
   serializable/advisory-lock design scoped to one eligible scheduling-owner/capacity key. Occupancy
   is a positive-duration UTC half-open interval `[start - bufferBefore, end + bufferAfter)`; zero or
   negative duration, timestamp/buffer overflow and inconsistent endpoint semantics are rejected.
   UI checks are never sufficient.
8. Hold creation and booking use server-issued opaque receipts, trusted expiry, canonical input
   digest and idempotency. Same key/digest returns the prior receipt; key reuse with different input
   conflicts.
   Confirmation locks and claims exactly one still-active hold, verifies trusted expiry, actor/
   session, type/policy/coverage/owner/interval digest and authorization, acquires/inserts the
   appointment capacity, marks the hold `consumed` with its winning appointment ref and commits the
   idempotency receipt/outbox/audit in one Postgres transaction. The consumed hold ceases to block
   independently because the appointment now owns the interval. Any failure rolls back the claim,
   appointment, capacity, receipt and events. A different idempotency key cannot reuse the hold.
9. Expiry, cancellation and rescheduling release capacity predictably. A job may clean stale holds,
   but reads/booking treat an expired hold as inactive even before cleanup runs. Policy, coverage,
   recovery-epoch or authorization invalidation marks the hold `invalidated`; an explicit abandoned-
   flow/cancellation path marks it `released`. Both transitions append a closed reason code/evidence and can never
   return the hold to an active or reusable state. Browser unload, navigation, GET or an unreliable
   beacon is never release authority; explicit authenticated release is best-effort optimization and
   trusted expiry remains the fallback.
10. Rescheduling secures the new slot and records the revision before releasing the old capacity in
    one atomic transition. Failure preserves the original.
11. Types, hours, buffers, notice, horizon, cancellation/reschedule and prerequisite policies are
    versioned. Existing appointments retain accepted policy evidence; policy edits are not retroactive
    without an explicit audited migration/override.
12. Staff override requires exact permission, step-up when policy requires it, expected version,
    conflict summary, an allowlisted `reasonCode` and audit. It cannot bypass client/resource
    authorization or accept free-text rationale before APT-013.
13. Appointment type/assignee eligibility may consider service, language, approved credential,
    location and hours. AI may suggest; domain policy selects.
14. Release 1A supports manual/default assignment for SG Solutions' current solo operation.
    Round-robin/team capacity is inactive until APT-008 is approved.
15. Public responses expose slots, generic modality and versioned generic type/modality copy approved
    under APT-001/011 only. They never expose appointment-specific/client-specific instructions before
    APT-013, and never expose
    staff names unless approved, busy/free detail, event titles, other attendees, block reasons,
    personal calendars or capacity counts.
16. An appointment has exactly one closed `AppointmentAccessBinding`: either a direct appointment
    grant or one canonical ServiceOrder/CaseFile root with explicit audience, inheritance allow/
    block and resource/authorization epochs. Lead, Client, Contact, Business and additional service/
    case associations are non-authoritative business links and never enter the grant predicate.
    When more than one association exists, only the canonical root controls appointment access and
    every displayed linked resource independently reauthorizes. Relinking requires authorization
    over old/new roots, CAS, deny-wins checks, epoch bump and audit; it cannot create an access window.
17. Payment, document, intake or approval prerequisites remain owner facts. Stripe confirmation can
    satisfy an approved payment prerequisite but cannot authorize or execute a sensitive service.
    APT-006 must define whether a pending request retains its exact capacity and the trusted expiry,
    or releases capacity and requires a fresh hold for later confirmation. `confirmPending` locks the
    appointment, reauthorizes, CAS-checks its version, verifies the complete current owner-evidence
    set and either confirms retained capacity or atomically consumes a new hold. The original
    single-use hold is never reused; the fresh hold must match the pending appointment's requested
    interval/owner/type/policy unless an explicit reschedule command first changes that request.
    Unavailable released capacity leaves the request pending and surfaces a new-selection path; it is
    never silently moved. Duplicate/out-of-order evidence cannot confirm twice.
18. Only after APT-009 plus productive APT-020 and the external-event APT-014 gate may Google Calendar
    receive a minimized event. `SG Solutions Appointment — <opaque ref>` is a documentary candidate,
    not approved copy; APT-014 must approve the exact generic allowlist. No client name, service detail,
    tax/credit fact, document, amount or internal note is permitted.
19. Free/busy reads collect only bounded availability facts for approved calendars/horizons. Raw
    unrelated event bodies/attendees are neither retained nor logged.
20. Google Calendar push has no signed body. Before `watch`, M013 creates a `pending_watch` record
    containing a unique channel ID, high-entropy channel-token digest, intended connection/source,
    direction, environment, exact request fingerprint and expiry—but no resource binding that Google
    has not yet returned. An early `sync` notification may validate only ID/token, exact pending
    request and `sync` state, record a quarantined keyed digest/allowlist result for the claimed URI
    and queue no business mutation. Only the authenticated `watch` response may atomically bind the
    provider resource ID and canonical URI-comparison digest after it matches the pending transaction.
    Later notifications require the bound tuple; timeout, response/header mismatch or watch failure
    fails closed and stops/expires the channel. Raw resource URIs/calendar identifiers never enter
    ordinary fields, events, audit or telemetry. Message number is non-sequential dedupe evidence
    only. Renewal overlap, duplicate/delayed/dropped notifications and stale channels cannot regress
    state.
21. Inngest coordinates post-commit retry/reconciliation. Each job has an idempotency key, retry cap,
    terminal state and manual recovery path; it never owns durable appointment state.
22. Before APT-010, external confirmation/reminder delivery is off and the portal is the fallback.
    After approval, a recipient-specific M026 template may receive only the generic `Appointment
    with SG Solutions` label, appointment instant and intended display IANA zone; it excludes type/
    service/case, staff, notes, contact value, meeting/management link and all other sensitive facts.
23. Cancelling an appointment does not cancel a service. Completing an appointment does not create
    or begin a service. Marking no-show is not an AI inference.
24. If no slot is available, show honest alternatives: another range/type, approved callback or
    human contact. Never invent availability or promise a response time.
25. The public booking runtime is a static-first Astro shell plus a narrow, same-origin, on-demand
    Public Scheduling Gateway in `apps/www`. That gateway has no database, Google, Supabase service,
    CRM or provider credential; it calls the typed `apps/app` M013 facade using a least-privilege
    service identity. It accepts only the canonical HTTPS origin and trusted edge/proxy/host evidence,
    never raw forwarding headers, and applies bounded parsing, rate and bot controls.
    The gateway signs each internal facade request with a scoped, rotating workload credential over
    environment, issuer, exact audience, service, method, canonical path, transient body digest,
    timestamp, nonce and key version. The verifier recomputes the body digest in memory; no raw body,
    digest, signature or auth header is persisted/logged. The application verifies freshness, canonicalization, exact operation
    allowlist and one-time nonce in a server-side replay store before parsing domain input; it rejects
    ordinary browser/internet calls, unknown audiences and stale/replayed signatures. Rotation has a
    bounded overlap and fails closed on credential/replay-store outage. The inner facade enforces its
    own per-service/session/IP-risk quotas and still performs full domain/session authorization.
26. GET/HEAD are inert. The sole session-bootstrap exception is a same-origin, credential-free
    `POST /public-scheduling/session`: exact canonical Origin, Fetch Metadata, trusted edge/host,
    bounds/rate/bot controls and fixation rotation create the host-only PublicBookingSession and
    return its CSRF token in a private/no-store response. It does not authenticate or derive input
    from an ambient cookie: any existing/stale handle is ignored, revoked where resolvable and
    atomically overwritten with a fresh one. It accepts no booking/contact input. Every later browser mutation uses an unsafe method plus exact Origin and
    session-bound CSRF proof. SameSite, idempotency, opaque refs and capability possession do not
    replace CSRF. Provider callbacks/OAuth use provider-specific authenticated-channel/state proof;
    Google push does not imply a signed body.
27. Actor-bound availability, hold, booking, prospect-management, Client and Staff responses are
    dynamic `private, no-store`: no ISR/static generation, shared CDN cache, service worker/offline
    cache or browser-readable response/PII persistence. Bootstrap/code-exchange/OAuth/callback
    responses are also no-store; cache keys never vary on untrusted actor/resource identifiers. The
    sole application-session browser persistence is a host-only opaque HttpOnly cookie handle for a
    bounded server-side session; it contains no PII, token body or authorization data. Separately,
    user-initiated/gated APT-014 ICS download may be saved as the disclosed non-revocable snapshot,
    and APT-011 meeting navigation may expose provider destination/history as disclosed above; neither
    exception permits API response bodies/PII in browser-readable application storage or caches.
28. Public booking uses one clean route key per approved M001 locale (documentary examples `/book`
    for Spanish and `/en/book` for English; final names await Build). The separately gated localized
    prospect-management bootstrap is not a booking route and remains absent until APT-007.
    Appointment-type selection resides in a no-store server session
    or POST state; semantic type codes are never URL-addressable or copied to history/referrers/logs.
29. The booking/idempotency digest is built from an allowlisted canonical command projection with
    opaque context refs and versions only. It never contains or bare-hashes normalized name, email or
    phone. If an approved flow cannot avoid a low-entropy sensitive value, it uses a purpose-scoped
    keyed HMAC with controlled custody, key version/rotation and zero telemetry.
30. Release 1A phone is the only default modality. Video remains unavailable to public/prospect flows
    until APT-011 and authenticated M007 access are approved; a future APT-007/011 decision may allow
    a separately scoped prospect launch session. Meeting-provider state is a rebuildable projection,
    never appointment or authorization authority.
31. After APT-014 permits an external event, provider projections contain zero attendees and suppress
    provider-generated create, update, delete and reconciliation notifications by default
    (`sendUpdates=none` or equivalent). Enabling invitations/mail additionally requires coordinated
    APT-010 plus APT-014 approval of delivery ownership, exact content, consent, wrong-recipient and
    duplicate/update/cancel semantics.
32. M013 alone owns availability and booking commands. After APT-019, M051 under M047 may call only
    allowlisted receipt-bound tools. M076 supplies compliance/human decisions, M041 shared adapter
    conventions and M013 its domain ports. AI never decides capacity, payment, attendance/no-show,
    note publication or authorization.
33. APT-013-gated appointment/client-specific instruction, note, summary and transcript fields,
    controls, DTOs, persistence and events are structurally absent before approval—not merely hidden.
    This does not include generic versioned type/modality copy governed by APT-001/011. APT-012
    structured outcome codes are separate and cannot carry free text.
34. M020/M078 reserve public context under a scheduling-only purpose and remain aggregate owners. A
    cross-domain application transaction finalizes that reservation with the winning M013 commit;
    injected failure after reservation but before commit cancels/expires it. A durable abandoned lead
    is forbidden unless a distinct Product Owner-approved lead-contact consent purpose exists.
35. APT-007 management-code delivery uses a short-TTL envelope-encrypted vault object and opaque
    delivery ref so M026 can retry idempotently after a crash. Only the scoped delivery worker and
    one-time exchange boundary may access plaintext; success, consumption, cancellation or expiry
    purges/revokes it. Ordinary state and backups contain no plaintext code.
    Verification stores a purpose-scoped keyed HMAC/pepper with key version and controlled rotation,
    never a bare hash; APT-007 chooses an approved high-entropy or human-enterable format plus TTL,
    per-capability/recipient/network risk limits and distributed-attempt response.
36. Every `EphemeralAuthorityReceipt` binds a protected `RecoveryEpoch` maintained outside the
    restored database generation. Restore increments it and invalidates every pre-restore session,
    capability, code/OAuth/watch transaction, active hold, availability/context/bootstrap receipt
    and gateway replay proof regardless of TTL. Durable command idempotency receipts/outbox/audit are
    restored and preserve same-key/same-digest results so recovery cannot repeat logical effects.
    Every meeting projection/launch eligibility also binds the recovery epoch and secret version.
    Before restored traffic, all snapshot meeting projections become `recovery_required`, their vault
    refs/launch receipts are revoked and launch fails closed. Provider revoke/reconcile retries with a
    restricted manual path; only a newly created/reconciled secret under the current epoch and a fresh
    final authorization fence can enable launch. Provider meeting state never changes appointment truth.
37. The workload nonce is claimed by an atomic unique insert/CAS over
    `(issuer,audience,keyVersion,recoveryEpoch,nonce)` before any domain read/write. Mutating facade
    calls bind that claim to the command unit of work; a failed command leaves the nonce consumed and
    requires a newly signed request. Claims are bounded by TTL/capacity and shared across instances;
    replay-store uncertainty, restart or outage fails closed.
38. Raw IP/device fingerprints never become scheduling/domain data. Anti-abuse state uses a purpose-
    scoped keyed network digest/key version, coarse risk bucket, bounded TTL and opaque CAPTCHA/
    provider receipt where approved. It remains separate from analytics and cannot grant/deny alone;
    APT-017 governs thresholds, NAT/shared-network treatment, human review and appeal.

## 9. Authorization rules

### Required decision inputs

Every list/detail/command evaluates current:

- identity/session/account status and assurance;
- internal role/permission or client/representative authority;
- exactly one `AppointmentAccessBinding`: either an appointment direct grant or one authorized
  ServiceOrder/CaseFile root where inheritance is allowed; additional associations never form OR
  predicates;
- participant eligibility, appointment type/policy version and lifecycle;
- sensitivity, modality and staff-assignment restrictions;
- authorization/policy epochs and expected appointment version;
- requested action, time window and prerequisite evidence.

### Client inheritance

- Active M007 membership links identity; it grants no appointment by itself.
- An explicit case/service grant may inherit to an ordinary client-visible appointment within that
  exact root when the appointment permits inheritance and no block applies.
- Public/prospect management uses a separate temporary, random, audience/action-bound capability; it
  cannot enumerate or become a client account/resource grant. Before APT-007 approval it is absent;
  after approval, a one-time out-of-band code is exchanged only through a no-store POST for a narrow
  HttpOnly Secure SameSite session and never appears in a path, query or fragment.
- That session is a `ProspectAppointmentSession`, not M007 membership. Its host-only `__Host-` cookie
  contains only an opaque handle; the server stores a digest, exact appointment/action scope,
  policy/authorization epochs, absolute and inactivity expiry, rotation/revocation and approved
  device/replay policy. Code exchange atomically consumes the code and creates the session under
  Origin/CSRF/fixation controls; logout, expiry, epoch change or revocation deny future actions.
- Internal/compliance notes, sensitive staff details, external calendar facts, security events and
  inheritance-blocked appointments never inherit client visibility.
- Highly Sensitive instructions/artifacts require their owning module's explicit extra grant and
  cannot be embedded into appointment DTOs.
- Revocation, expiry, case closure or representative removal invalidates future reads/actions and
  bumps authorization evidence predictably.

### Enforcement

Domain services authorize before data/provider access; restricted Postgres RLS mirrors the
relationship boundary. Client/Public/Staff DTOs and query paths are structurally separate. A final
authorization fence immediately before serialization or commit rechecks session, grant, policy and
resource versions. Failure is uniform and does not reveal appointment existence.

Every appointment query/command resolves only its single access binding and applies its current
root resource/authorization epoch. Client/business/contact/service/case association refs are display
or workflow context only. A final fence also reauthorizes any separately linked resource before it is
serialized; no association can compensate for a revoked canonical root.

## 10. Data requirements

Conceptual only; no schema is authorized.

### `AppointmentTypeDefinition`

Opaque ID/code, localized content refs, duration, buffers, permitted modalities, eligibility,
prerequisite flags, notice/horizon, policy-version refs, effective interval, active state and
definition version.

### `AvailabilityPolicyVersion`

Owner kind/ref, appointment-type scope, IANA zone, weekly windows, effective interval, closure
calendar refs, capacity rule, version, approval evidence and supersession.

### `AvailabilityBlock`

Scheduling-owner ref, UTC interval, source (`manual|internal|external_busy`), internal reason code,
public generic reason where approved, lifecycle/version and creator/audit refs. External busy
projections contain no event content.

### `ExternalBusyCoverage`

Admitted connection/calendar/direction, covered-from/through UTC horizon, source sync cursor/version,
policy/freshness version, `lastCompleteAt`, derived time, `complete|partial|stale|unavailable` state
and coverage digest. Required-source designation comes from APT-009 policy. Availability/hold/
booking receipts bind the complete required coverage set; a missing/stale receipt fails closed.

### `AppointmentHold`

Opaque hold ref, appointment-type/policy versions, eligible scheduling-owner ref, UTC interval,
viewer zone/resolved offset, actor/session binding, canonical digest, trusted expiry, lifecycle,
idempotency receipt, claim/version and created/consumed evidence. A consumed hold records exactly one
winning appointment ref; it cannot be claimed again under another idempotency key.

### `Appointment`

Opaque public ref, type/policy versions, lifecycle/version, source channel, one access-binding ref,
non-authoritative client/contact/lead/business/service/case association refs, assigned user/team
refs, UTC interval, source local wall time, client/staff IANA zones and offsets, modality, generic
type/modality-copy version governed by APT-001/011, requirement/attendance summaries, created/changed/cancelled/concluded evidence
and appointment authorization epoch.

### `AppointmentAccessBinding`

Exactly one root kind/ref (`direct_appointment|service_order|case_file`), audience, inheritance
allowed/blocked, sensitivity/assurance policy, root resource/authorization epochs, direct-grant ref
where applicable, binding version and link/relink/revoke evidence. Deny/block wins. Participant,
contact, CRM and noncanonical business associations are invalid authorization inputs.

### `AppointmentParticipant`

Appointment ref, participant kind, authorized identity/contact ref, role, participation state,
verification/representative evidence and lifecycle. It is not an access grant.

### `AppointmentAttendance`

Appointment ref, independent client-intent state/evidence, optional check-in/session evidence and
staff-only outcome `unrecorded|attended|no_show` with actor/allowlisted reason code/trusted time/
version. Concluding the
appointment and recording the single outcome is one CAS transaction; intent never gates outcome.

### `AppointmentOutcome`

Available only after APT-012. Appointment ref/version, closed result code, closed next-action code,
approved tag codes, human actor/review evidence, outcome version and typed idempotent downstream
handoff refs. It contains no free text, note, transcript or summary. M013 owns this structured record;
APT-013 bodies remain in their separate owning modules and cannot drive automation.

### `AppointmentRevision`

Immutable prior/new timing/type/modality/assignment evidence, actor, reason code, accepted policy
version, expected/new aggregate version and audit/outbox correlation.

### `AppointmentRequirement`

Typed owner (`intake|document|payment|approval`), opaque owner ref, requirement-definition flag,
instance lifecycle `not_required|pending|satisfied|waived|failed|expired`, policy version and safe
client projection. It stores no payment, document or form payload.

### `CalendarConnection`

Authorized staff ref, provider connection ref, credential secret ref, exact scope/version,
connection state and expiry/revocation evidence. External account/calendar identifiers live only as
protected per-source secret/digest bindings, never raw connection fields. Connection
state carries no shared sync cursor; each admitted calendar/source has independent synchronization.
OAuth tokens are Highly Sensitive secrets, not table/log/DTO plaintext.

### `CalendarSource`

Connection ref, opaque internal source ref backed by a protected provider-identifier secret/digest,
admitted direction/purpose, exact immutable query/filter
fingerprint and version, pagination/full-sync generation, provider sync cursor secret ref, covered
horizon, `complete|partial|stale|unavailable` coverage state, freshness deadline and last complete
receipt. Each calendar/source advances independently; changing query parameters invalidates the old
cursor and requires a bounded full paginated sync before publishing complete coverage.

### `CalendarOAuthTransaction`

One-time state/code-flow transaction digest, authorized staff session/assurance, intended internal
connection, expected provider account/source secret/digest bindings, environment, exact scope set, canonical callback/
return intent, browser/PKCE binding, issued/expires/consumed evidence and mismatch/manual-review
result. Credential persistence occurs only after atomic consumption and provider account/scope
verification.

### `CalendarWatchChannel`

Connection/source/direction, unique channel ID, high-entropy channel-token digest, exact watch-request
fingerprint, requested/effective expiry and lifecycle `pending_watch|bound|stopping|expired|failed`.
`pending_watch` holds no provider resource binding. After a matching authenticated watch response,
the record may retain only the minimum provider resource ID needed to stop/bind the channel plus a
keyed digest/canonical allowlist result for resource-URI comparison, renewal predecessor/successor,
last accepted non-sequential message-number evidence and reconciliation state. A raw resource URI,
calendar/account identifier, channel token or header never persists in ordinary fields, audit, logs,
events or telemetry.

### `AppointmentCalendarProjection`

Appointment ref, provider connection, opaque event ref, projection version/hash, ETag/provider
version, sync state, last attempt/success, retry count and conflict/manual-action evidence.

### `AppointmentMeetingProjection`

Appointment ref, provider, opaque external meeting ref, provider lifecycle, allowed launch window,
vault secret ref, projection version, last attempt/success, retry/reconciliation/manual-action and
cleanup evidence. It never stores a raw join URL in an ordinary field or confers appointment access.

### `MeetingProviderConfiguration`

Provider/configuration ref, exact provider kind, allowed appointment types/modalities, approved
initial HTTPS scheme/host/port/path/query-shape policy, secret/vault refs, connection lifecycle,
effective interval, configuration/version, Product Owner activation evidence and disconnect/rotation
impact state. Raw credentials and join URLs never enter ordinary fields, DTOs, events or audit.

### `AppointmentReminderPlan`

Appointment ref, policy/template/channel refs, scheduled instant, preference/consent evidence,
lifecycle and M026 delivery receipt. It contains no rendered body or direct contact data.

### `AppointmentManagementCapability`

Store only a purpose-scoped keyed HMAC/pepper verifier plus key version and appointment/action/
audience/policy/version binding, issued/
expires/revoked/consumed evidence and attempt controls. For APT-007-gated asynchronous delivery, the
raw code may exist in SG-controlled durable state only in a short-TTL envelope-encrypted one-time
vault object; the outbox stores
only its opaque secret ref and delivery idempotency ref. A scoped M026 worker retrieves the same code
for bounded idempotent retry, then purges/revokes it on successful delivery, expiry or cancellation.
Plaintext never enters ordinary Postgres state, events, audit, logs, telemetry, analytics, support or
backups and does not survive successful POST exchange to a narrow secure session. M026 transport and
the intended recipient necessarily receive plaintext; APT-007 therefore gates DPA, mailbox/provider
retention, forwarding/reassigned-recipient risk and disabling/minimizing message-body retention where
controllable.

### `ProspectAppointmentSession`

Server-side digest keyed by a host-only opaque cookie handle, exact appointment/action scope,
policy/authorization epochs, absolute/inactivity expiry, rotation/revocation, CSRF state and approved
device/replay evidence. It is not identity membership, contains no contact value and cannot expand
scope after code exchange.

### `PublicBookingSession`

Pre-booking, server-side session keyed by a host-only `__Host-` cookie containing only an opaque
handle. The server record stores its digest, scheduling purpose, locale/IANA zone, opaque type
selection, CSRF binding, absolute/inactivity expiry and fixation-rotation evidence. It contains no
raw contact PII, lives in no browser/shared/offline cache and binds availability/hold/context receipts
so another session cannot replay them.

### `RecoveryEpoch`

Protected monotonic cutover value stored outside the restored database generation and bound into all
ephemeral sessions, capabilities, codes, OAuth/watch transactions, active holds, availability/
context/bootstrap receipts and gateway workload/replay proofs. Restore advances it before traffic;
stale epochs fail uniformly.

### `EphemeralAuthorityReceipt` and `DurableCommandReceipt`

Ephemeral authority receipts are short-lived, RecoveryEpoch-bound evidence that cannot authorize
after restore. Durable command receipts are part of the appointment transaction, keyed by purpose/
actor/idempotency/canonical digest, and restore with outbox/audit so matching retries return the
recorded result and changed digests conflict. A durable receipt is evidence of a past command result,
not current authorization; every new read/action still reauthorizes.

### `GatewayRequestProof`

Ephemeral verification evidence for the internal Public Scheduling Gateway call: environment,
issuer, exact audience/service/method/canonical path, transient in-memory body digest, timestamp,
nonce, key version and RecoveryEpoch. The scoped signing secret remains in the approved secret
boundary. The verifier recomputes the digest in memory; raw body, digest, signature and auth headers
are never stored/logged. Only nonce, issuer, audience, key version, recovery epoch and expiry enter
the bounded replay store through atomic unique claim; audit retains content-free result/correlation.

### `SchedulingAbuseEvidence`

Purpose/surface, purpose-scoped keyed network digest and key version, coarse risk/attempt counters,
window/expiry, explicit `RecoveryEpoch`, optional opaque CAPTCHA/provider receipt and closed review/
appeal result code. It stores no raw IP,
device fingerprint, contact value or browser text; it is server-only, TTL-bounded, not product
analytics and cannot by itself create identity, consent, a lead or permanent denial.

### `ProspectContextReservation` / `PublicBookingContextReceipt`

M020/M078-owned short-lived reservation and opaque receipt containing purpose-limited provisional
contact/consent refs, their versions, scheduling-only purpose, locale, expiry and idempotency evidence.
It contains no raw contact value. The cross-domain application transaction finalizes the reservation
only with the winning appointment commit; rollback or expiry cleans it without leaving a durable Lead,
Contact or reusable consent. Retaining an abandoned lead requires separately approved lead-contact
purpose and consent and cannot be inferred from scheduling consent. M013 cannot create, deduplicate or
independently finalize CRM/contact/consent data.

### `BookingSubjectContext`

Closed union with exactly one variant:

- `public_prospect`: one M020/M078 `PublicBookingContextReceipt`, finalized only with the winning
  appointment transaction;
- `authorized_client`: current M007 identity/account/membership plus one direct or canonical-root
  grant/ref, resource/authorization epochs and approved scheduling-consent/policy evidence;
- `staff_on_behalf`: current staff identity, exact permission/step-up, opaque Person/Client subject
  ref, allowlisted reason/purpose codes, policy and authorization versions.

Each variant has its own owner evidence and cannot be combined as authorization OR logic. Client or
staff booking never creates a prospect/Lead reservation by implication; subject/contact association
never grants appointment access.

### `ClientCalendarExportReceipt`

Short-lived issuance evidence only: appointment ref/version, actor/access/policy epochs, generic
template version and issued time. The generated ICS is never durably cached by SG Solutions and is a
non-revocable snapshot once downloaded, not a synchronization feed.

### Minimized evidence

M077 receives who/what/when/result/allowlisted-reason-code/correlation evidence, not event titles, token values,
contact details, notes or sensitive context. M092 product analytics is separately gated; M097 may
receive content-free operational/security measures under its own policy.

## 11. API or service contracts

Contracts are conceptual domain ports, not HTTP endpoints or implementation authorization.

- `AppointmentQueryService.listClient(actor, filter, opaqueCursor)` returns post-authorization
  `ClientAppointmentSummary` records and source-completeness metadata.
- `AppointmentQueryService.getClientDetail(actor, publicAppointmentRef)` returns one reauthorized
  Client DTO or a uniform unavailable result.
- `AppointmentTypeQueryService.listPublic(publicBookingSession, locale)` returns only published,
  active, APT-001-approved public type projections with opaque refs/version and no staff/client-only/
  sensitive type enumeration.
- `AppointmentTypeQueryService.listClient(actor, locale)` final-fences current M007 identity/context,
  exact grant/eligibility/audience and type version, returning only active public-or-client-eligible
  projections. Staff-only/ineligible types and hidden counts remain absent.
- `AppointmentTypeQueryService.listStaff(actor, boundedSubjectOwnerContext, locale)` requires exact
  staff book-on-behalf permission, subject/owner eligibility, active/effective policy versions and a
  separate minimized Staff DTO. It exposes no hidden totals/private configuration and does not imply
  `ScheduleAdminQueryService` configuration permission.
- `StaffAppointmentQueryService.list|getDetail(actor, boundedFilter, opaqueCursor)` requires exact
  Staff permissions/classification scope, returns a structurally separate Staff DTO/bounded M024
  projection, has no hidden totals and final-fences every result. Filters are allowlisted date, type,
  modality, assignee, lifecycle and independently authorized client/business context.
- `AvailabilityService.listPublicSlots(actorContext, typeRef, range, viewerIanaZone,
  modality)` returns an opaque short-lived availability receipt and slots.
- `AvailabilityService.listClientSlots(actor, eligibleTypeRef, range, viewerIanaZone, modality)`
  final-fences the current client grant/eligibility/audience and may return public-or-client-eligible
  slots only; it cannot reuse the Public DTO to enumerate private types, staff or capacity.
- `AvailabilityService.listStaffSlots(actor, eligibleTypeRef, boundedOwnerCriteria, range,
  viewerIanaZone, modality)` requires exact Staff scheduling permission/classification and returns a
  separate minimized Staff DTO with only eligible opaque owner/capacity choices needed for authorized
  book-on-behalf. It exposes no unrelated busy detail, event content or hidden counts.
- `BookingService.createHold(actorContext, availabilityReceipt, slotToken, idempotencyKey)` returns
  `HoldReceipt` only after fresh derivation and capacity admission.
- `BookingService.releaseHold(actorContext, holdRefOrReceipt, expectedVersion, reasonCode,
  idempotencyKey)` atomically changes only a matching active, same-session/actor hold to `released`,
  releases its capacity and appends receipt/outbox/audit. Duplicate same-digest release returns the
  recorded result; release racing confirmation/expiry/invalidation has one terminal winner and can
  never undo a consumed hold. Cross-session/actor replay fails uniformly.
- `PublicBookingContextPort.reserve(minimumInput, consentInput, idempotencyKey)` is implemented by
  M020/M078 and returns a short-lived `PublicBookingContextReceipt`; the cross-domain application
  unit of work calls `finalizeWithAppointment` only in the winning appointment transaction, while
  rollback/expiry cancels the reservation. Unavailable/invalid context aborts without a durable lead,
  contact, consent or appointment.
- `PublicBookingOrchestrator.request(transientContactConsentInput, opaqueBookingInput,
  idempotencyKey)` verifies the gateway proof/session, sends raw input only to M020/M078 reserve,
  calls M013 with only the opaque receipt/booking facts and finalizes both owners atomically. Its DTO
  cannot be represented by M013 domain types/events and is never persisted/logged/telemetried. It is
  an internal application coordinator invoked only after `PublicSchedulingFacade.requestBooking`
  validates the external workload/session envelope; the Gateway cannot call it directly.
- `BookingService.request(actorContext, holdReceipt, bookingSubjectContext, bookingInput,
  prerequisiteEvidence, idempotencyKey)` single-use consumes the hold and returns an honest
  `requested|pending_confirmation|confirmed` `AppointmentReceipt` under APT-006 capacity policy.
- `BookingService.confirmPending(actor, appointmentRef, expectedVersion, completeOwnerEvidence,
  optionalFreshHoldReceipt, idempotencyKey)` CAS-confirms the existing pending appointment; it never
  reuses its original consumed hold.
- `AppointmentRequirementService.reconcileOwnerEvidence(actorOrServiceIdentity, appointmentRef,
  ownerKind, ownerRef, ownerVersion, evidence, idempotencyKey)` authenticates the exact M011/M014/
  intake/approval owner, validates purpose/version/revocation and idempotently updates only that
  requirement axis plus summary/outbox/audit. It never confirms or moves the appointment. A later
  `confirmPending` re-reads and CAS-validates the complete current owner-evidence set under APT-006.
- `BookingService.cancel(actor, appointmentRef, expectedVersion, policyReceipt, reasonCode,
  idempotencyKey)` returns a transition receipt.
- `BookingService.reschedule(actor, appointmentRef, expectedVersion, policyReceipt, newHoldReceipt,
  reasonCode, idempotencyKey)` returns the atomic new appointment revision. APT-005 decides whether
  the allowlisted reason code is optional/required; unknown/stale codes and free text are rejected.
- `BookingService.reassign(actor, appointmentRef, expectedVersion, eligibleNewOwnerRef,
  policyReceipt, reasonCode, idempotencyKey)` is absent in Release 1A and gated by APT-008/Release 1B.
  When active it secures eligible new-owner capacity before releasing old capacity in one transaction,
  then appends revision/outbox/audit; conflict or failure leaves the original assignment unchanged.
- `AttendanceService.confirmClient(actor, appointmentRef, expectedVersion, response)` records only
  the client response.
- `AttendanceService.recordStaff(actor, appointmentRef, expectedVersion, outcome, reasonCode)` requires
  exact staff permission and scheduled-time eligibility.
- `AppointmentOutcomeService.recordStructured(actor, appointmentRef, expectedVersion, resultCode,
  nextActionCode, tagCodes, reviewEvidence, idempotencyKey)` exists only after APT-012 and creates
  closed-code, human-approved, idempotent owner handoffs; it accepts no free text.
- `ScheduleAdminQueryService.listTypes|getType|listAvailability|getAvailability|listBlocks` requires
  exact staff permission/classification scope, bounded filters/cursors, final fencing and a separate
  Staff DTO. It returns immutable version/effective-state metadata without client/contact/provider
  secrets, hidden totals or command authority. `listBlocks` returns only authorized `manual|internal`
  blocks. External busy is represented only by content-free source-coverage health; no interval,
  pattern, event or reconstructable filter/cursor/count/timing signal enters an Admin detail DTO.
- `ScheduleAdminService.saveTypeDraft|previewType|publishType|saveAvailabilityDraft|
  previewAvailability|publishAvailability` uses immutable draft/published versions, expected
  versions, effective dates, approval evidence and audit. Preview is side-effect-free and never
  makes capacity bookable.
- `ScheduleAdminService.createBlock|cancelBlock|override` requires exact permission, expected
  aggregate/policy version, allowlisted `reasonCode`, idempotency and audit. `cancelBlock` operates
  only on an authorized `manual|internal` block, then recalculates or invalidates affected derived
  availability and receipts before releasing bookable capacity. An `external_busy` block changes
  only through source reconciliation/fingerprint/policy; removal or uncertainty invalidates source
  coverage and receipts and fails closed until complete coverage is republished. Admin override/
  cancel cannot suppress external busy. GET/HEAD never mutates a block.
- `CalendarProvider.getBusy|syncChanges|refreshCredential` is gated by APT-009 plus productive
  APT-020 activation, accepts minimized provider commands and returns normalized bounded busy/source
  facts. `upsertProjection` and outward external-event reconciliation additionally require APT-014
  approval of exact generic event/confidentiality semantics. Every external-event create/update/
  reconcile command defaults to zero attendees and provider notification suppression;
  provider-generated invitations/mail additionally require coordinated APT-010 plus APT-014.
  `cancelProjection`/delete/stop is a scoped idempotent audited teardown permitted only for a previously
  bound SG projection/channel even after APT-014/020 deactivation; it cannot create/update/rebind or
  emit invitations and is the rollback path for external artifacts.
- `CalendarReconciliationService.reconcile(connectionRef|appointmentRef, trigger)` compares internal
  authority with provider projection and never silently chooses an unsafe winner.
- `CalendarConnectionService.beginOAuth|completeCallback|admitSource|disconnect|changeScopes` is gated
  by APT-009/020. `beginOAuth`, source/scope changes and disconnect are step-up browser POST commands
  with Origin+CSRF, CAS, expected account/scope/source and audit; only callback uses one-time state/
  PKCE instead of CSRF. Failure/partial grants persist no credential, and disconnect atomically
  invalidates affected source coverage/watch state before availability can use it.
  Security disconnect/watch-stop remains permitted after feature deactivation with scoped service/
  staff authority, idempotency and audit, solely to revoke an existing bound connection/channel.
- `CalendarConnectionQueryService.list|getStatus` is gated by APT-009/020 and exact Staff
  permission/classification. It returns a bounded separate Staff DTO containing only opaque
  connection/source refs, approved direction/scope/status codes, allowlist versions, content-free
  reconciliation/recovery state and an APT-009-approved staff-facing alias per source. The alias is
  independent reviewed copy, never copied from a provider email, account/calendar ID or URI. No
  token, raw identifier, provider URI, hidden total or command authority is returned. After prior
  activation is disabled or an incident occurs, exact cleanup permission may still read only an
  opaque `deactivation|recovery_required` DTO needed to disconnect/revoke/stop; reconnect/admit/create
  controls and ordinary provider detail remain absent.
- `MeetingConnectionService.configure|disconnect|rotate` is gated by APT-011, step-up, exact provider/
  HTTPS allowlist, expected version, secret custody, impact review and audit; ordinary appointment UI
  cannot call it.
- `MeetingConnectionQueryService.list|getStatus` is independently gated by APT-011's provider-
  activation evidence, with exact Staff permission/classification and final fencing. Its
  bounded separate Staff DTO exposes only opaque config/provider refs, approved modality/status/
  allowlist version and content-free recovery state—never secret refs, credentials, join URLs, raw
  account IDs, hidden totals or Google connection state. After prior activation is disabled or an
  incident occurs, exact cleanup permission may still read only opaque `deactivation|recovery_required`
  state and invoke disconnect/revoke cleanup; configure/create/rotate/launch controls remain absent.
- `MeetingProvider.create|revoke|rotate|cancel|reconcile` accepts minimized idempotent projection
  commands and returns opaque normalized facts; raw join secrets stay in the vault boundary. Create,
  rotate and outward reconcile require the complete APT-011 provider-activation evidence. Scoped
  revoke/cancel teardown for a previously bound projection remains permitted after deactivation or
  during restore with service identity, idempotency and audit; it cannot create, launch, rotate,
  update or reactivate a meeting.
- `MeetingLaunchService.launch(actorContext, appointmentRef, expectedVersion)` accepts only POST with
  exact Origin + session-bound CSRF, then performs the final
  authorization fence and issues a just-in-time no-store/no-referrer launch only inside the approved
  access window. It additionally requires complete active APT-011 provider/configuration evidence,
  current `RecoveryEpoch` plus secret/config versions and fails closed after deactivation or recovery-
  required state. It decrypts and normalizes the destination inside the secret boundary, then enforces
  the APT-011 provider-specific exact HTTPS scheme/host/port/path/query-shape allowlist; credentials/
  userinfo, CRLF and lookalike hosts are rejected. SG never server-fetches, resolves or follows the
  join URL; the browser performs the no-referrer/noopener navigation. Any downstream provider redirect
  is an APT-011 vendor-trust/due-diligence condition, not an SG-enforceable redirect-chain guarantee.
  Public/prospect launch is absent in Release 1A.
- `ProspectManagementService.requestCode|exchangeCode|get|cancel|reschedule|logout` uses the scoped
  sessions. `requestCode` is an anti-enumeration PublicBookingSession POST with Origin+CSRF and no
  browser-supplied appointment/contact identifier: it uses only refs already bound server-side to the
  session and booking receipt. It applies abuse controls/uniform response, revokes prior live codes
  and requests idempotent M026 delivery. If that binding/session expired, recovery is uniform staff/
  support-only; M013 never accepts raw contact or guessable refs. Booking changes delegate to
  `BookingService`.
- `ManagementCodeDeliveryPort.request(opaqueContactRef, opaqueSecretRef, deliveryIdempotencyRef)` is
  M026-owned and may retrieve the one-time envelope only with a scoped service identity. It sends
  generic manage context plus the code, reports a content-free receipt and never returns plaintext to
  M013; crash/retry reuses the same bounded delivery until terminal purge/revocation.
- `ClientCalendarExportService.issueIcs(actorContext, appointmentRef, expectedVersion)` exists only
  after APT-014, accepts only POST with exact Origin + session-bound CSRF, reauthorizes current access
  and emits a no-store ICS containing only generic
  `SG Solutions Appointment`, start/end/display zone and an opaque UID. It protects ICS folding,
  CRLF and filename/header injection and includes no staff/client/service/location/meeting/manage data.
- `PublicSchedulingFacade.bootstrapSession|listTypes|listSlots|createHold|releaseHold|requestBooking|
  requestManagementCode|exchangeManagementCode|manage` is the sole least-privilege application
  boundary callable by the Astro Public Scheduling Gateway. `requestBooking` alone accepts the
  bounded transient contact/consent envelope and delegates internally to `PublicBookingOrchestrator`;
  no Gateway operation can invoke the orchestrator or M013 domain service directly. Before body
  parsing it authenticates the rotating workload proof, exact operation allowlist, audience,
  timestamp/nonce/recovery epoch and replay state; it rejects ordinary browser/internet calls and
  enforces inner quotas plus full domain/session authorization.
- `AppointmentProjectionPort.getSafeSummary(root, actor)` supports M008/M009/M012/M024 with the
  current M013 client-projection version/freshness and no provider-reconciliation state; it grants no
  action authority.
- `AppointmentProjectionPort.listClientTimelineFacts(root, actor, sinceVersionOrOpaqueCursor)`
  returns a bounded, stable, authorized cut of immutable M013 transition evidence for M010. Each fact
  carries one allowlisted client-safe transition code plus server-held producer/aggregate-scoped
  `SourceEventKey`, source/version, mapping/correction provenance and stable ordering evidence. The
  port preserves multiple transitions between invalidation/reread cycles, reauthorizes every page
  and exposes no raw event, provider/calendar fact, internal reason, hidden count or command.

### Command envelope

Every mutation includes actor/service identity, session/assurance, requested purpose, opaque refs,
expected aggregate/policy/authorization versions, trusted request time, locale/IANA zone where
applicable, idempotency key and correlation ref. Server code derives price, eligibility, duration,
staff, policy and time interval from authoritative configuration; browser values are untrusted.
The credential-free bootstrap POST does not authenticate/derive input from an ambient cookie; any
existing/stale handle is ignored, revoked where resolvable and atomically overwritten. It accepts no
booking/contact input and uses exact Origin + Fetch Metadata + trusted edge/host + bounds/rate/bot controls to create/rotate a session and
return its CSRF token private/no-store. All subsequent browser commands additionally require unsafe
methods, exact canonical Origin and session-bound CSRF proof. Provider webhooks/OAuth callbacks use
their own channel/state proofs and remain separate.

### Error contract

Use stable reason codes such as `UNAVAILABLE`, `SLOT_CONFLICT`, `HOLD_EXPIRED`, `POLICY_CHANGED`,
`STALE_VERSION`, `REQUIREMENT_PENDING`, `ACTION_NOT_ALLOWED`, `INVALID_LOCAL_TIME`,
`PROVIDER_PENDING` and `RATE_LIMITED`. Public/client errors do not reveal whether another person,
staff event, block, calendar or protected appointment exists.

## 12. Events and background jobs

### Canonical M013 events

`appointment.hold_created|expired|released|invalidated|consumed`,
`appointment.requested|confirmed|rescheduled|cancelled`,
`appointment.attendance_intent_changed`, atomically paired `appointment.concluded` and
`appointment.attendance_outcome_recorded`, `appointment.structured_outcome_recorded`,
`appointment.requirement_changed`, `appointment.projection_requested|changed`,
`appointment.client_projection_changed`, `calendar.connection_changed|source_coverage_changed|
sync_failed|conflict_detected|reconciled`.

Events are schema-versioned, post-commit and contain purpose-bound opaque refs, transition codes,
versions and correlation only. No client name/contact, notes, service details, amounts, event title,
token, URL or provider credential appears in outbox, analytics or observability payloads.
Attendance intent carries only `client_confirmed|client_declined`; outcome carries only
`attended|no_show`. Consumers always reauthorize and reread M013. The safe
`appointment.client_projection_changed` event is emitted after any client-visible change, contains
only opaque refs/versions and replaces any generic `appointment.changed` convention. It is an
invalidation hint, not timeline history; M010 retrieves every immutable client-safe transition fact
through `AppointmentProjectionPort.listClientTimelineFacts` so multiple changes before a reread are
not collapsed.

### Owner handoffs

- M017/M020 receives a minimized appointment activity/reference; M013 never creates/converts leads.
- For public booking, M020/M078 must first return an idempotent `PublicBookingContextReceipt`; failure
  before commit creates no appointment. Post-commit CRM activity retries independently.
- M021/M022 receive typed appointment facts; references grant no service/case access.
- M023 may create an authorized follow-up task from structured evidence.
- M026 receives a content-minimized notification request: purpose-bound opaque recipient/event refs
  and, only after APT-010, the allowlisted generic label, instant and intended display zone. It
  resolves preferences/contact/template and never receives service/case/type, notes or bearer links.
- Separately after APT-007, an opaque management-code delivery request carries only M020 contact ref,
  short-TTL vault ref and delivery idempotency ref. Only the scoped M026 worker retrieves plaintext;
  this narrow verification transport is not an APT-010 appointment reminder or management link.
- M014/M043–M045 own payment requirements and return signed/authoritative prerequisite evidence.
- M011/M014/intake/approval owners deliver typed requirement evidence only through
  `AppointmentRequirementService`; duplicate/out-of-order/stale/revoked evidence cannot confirm an
  appointment, and M013 never reads owner payloads directly.
- M024 consumes a content-minimized internal calendar projection and calls M013 commands.
- M077 owns immutable audit; M092 owns approved reporting; M097 owns operational/security telemetry.

### Jobs

- Expire holds and management capabilities using trusted time.
- Release abandoned holds and invalidate holds affected by policy, coverage, authorization or
  `RecoveryEpoch` changes; append closed reason-code/evidence, emit the matching idempotent event and prove
  that no released, invalidated, expired or consumed hold can become active or reusable.
- Reconcile authenticated owner requirement evidence through an idempotent inbox/command; update only
  requirement state and let a separate `confirmPending` reread the complete current set.
- Purge expired/consumed one-time code vault objects and reconcile delivery receipts without copying
  plaintext into retries, outbox, backups or observability.
- Create/update/cancel provider projections with zero attendees and provider notifications suppressed.
- Create/renew Google watch channels through `pending_watch -> bound`; quarantine early `sync` hints,
  bind only after the authenticated watch response and tolerate bounded old/new overlap.
- Synchronize every admitted `CalendarSource` independently; on cursor expiry/Google 410, query-
  fingerprint change or restore, invalidate coverage and complete a full bounded paginated sync before
  publishing a new complete epoch.
- Expand admitted recurring external busy intervals only within the scheduling horizon.
- Reconcile duplicate, delayed, missing or invalid-token provider changes.
- Revoke/reconcile orphaned meeting projections and vault secrets without exposing raw join URLs.
- On restore, synchronously mark every meeting projection `recovery_required`, revoke restored vault
  refs/launch receipts and block launch before traffic; retry provider revocation/reconciliation and
  require a current-epoch fresh secret plus final fence before re-enabling.
- Request consented reminders through M026 and suppress them after state/policy changes.
- Raise restricted manual tasks after retry exhaustion.

Every job has a canonical idempotency key, retry cap, backoff, terminal state, stale-input/version
check and manual recovery route. Inngest is the coordinator, not state authority.

## 13. Error states and recovery

| Condition | Safe behavior |
|---|---|
| Slot became unavailable | Return `SLOT_CONFLICT` with a fresh bounded availability receipt; do not disclose cause. |
| Hold expired/abandoned | Treat capacity as free immediately, reject confirmation and offer fresh slots. |
| DST gap/ambiguous time | Reject invalid selection or require explicit offset choice; never reinterpret silently. |
| Duplicate command | Return original receipt for matching digest; reject key reuse with different digest. |
| M020/M078 precommit context unavailable | Fail closed with no appointment or orphan contact; permit a safe retry with the same idempotency key. |
| Post-commit CRM activity unavailable | Keep the appointment; retain the typed handoff and retry without duplicating Person/Lead/activity. |
| Pending prerequisite incomplete/expired | Keep or release capacity only under APT-006; reject confirmation until a complete fresh owner-evidence set and any required fresh hold pass CAS. |
| Original changed during reschedule | Preserve original and return `STALE_VERSION`; no partial release. |
| Google unavailable/quota | Keep internal appointment, mark projection pending/failed and create bounded recovery. |
| Duplicate/delayed webhook | Deduplicate, compare provider/internal versions and no-op or reconcile without regression. |
| Google push missing/empty/untrusted | Require exact active bound channel/token/resource tuple; ignore body and reread canonical provider API. |
| Sync arrives before watch response | Validate only the exact `pending_watch` ID/token/request and `sync` state, quarantine claimed resource digests, mutate no business state, then wait for authenticated response binding. |
| Watch response missing/mismatched/timed out after early sync | Fail/expire and stop the channel; discard quarantine evidence and publish no coverage. |
| Renewal overlap/stale channel | Accept only active bounded channel records, dedupe overlap and stop/expire stale channels. |
| Dropped/non-sequential notifications | Never infer completeness from message numbers; periodic/bounded reconciliation closes gaps. |
| Invalid/expired sync token or query fingerprint changed | Invalidate that source coverage and run a bounded full paginated resync; expose no dependent slot until a new complete epoch is published. |
| OAuth access token expired | Refresh through secret boundary; if refresh fails mark disconnected/manual action. |
| External event changed/deleted | Record conflict; never cancel/reschedule SG appointment silently. |
| Recurring event changed | Re-expand only configured horizon, compare versions and re-evaluate future availability. |
| Notification unavailable | Keep appointment; show portal receipt and retry/surface M026 failure without false delivery. |
| Payment provider unavailable | Do not confirm a payment-required appointment; retain/release hold only by approved policy. |
| CRM/service owner unavailable after commit | Persist appointment durably, keep typed handoff pending and reconcile later. |
| Meeting provider unavailable | Keep appointment if alternate approved modality exists; otherwise task/reschedule path. |
| Prospect code/session invalid, reused or revoked | Uniform failure, revoke any partial session and require a fresh out-of-band verification path. |
| Crash/provider failure before one-time code delivery | Retry the same opaque delivery against its short-TTL vault object; on terminal failure/expiry purge and revoke, then require fresh issuance. |
| Calendar export requested without current access | Emit no ICS; a previously downloaded ICS remains an acknowledged non-revocable snapshot. |
| AI unavailable | Deterministic human/public flow remains fully usable. |

## 14. Security and privacy requirements

### Access and isolation

- Domain authorization and restricted RLS enforce every resource operation; UI visibility is not a
  control.
- Prevent IDOR across client, service, case, appointment, staff, calendar connection and provider
  event references.
- Public management capabilities are random, short-lived, action/audience/version-bound, stored as
  keyed purpose-scoped HMAC/pepper verifier, rate-limited and revocable; uniform errors prevent
  enumeration and offline bare-hash brute force. After APT-007, M026 may
  deliver the one-time code independently of reminder policy APT-010: M026 resolves the destination
  from an opaque M020 contact ref and sends only the raw code plus generic manage-appointment context.
  No appointment ID/time/type/service/contact echo appears. Reassigned-recipient, forwarding,
  retry/duplicate/out-of-order, expiry and revocation behavior must be approved and tested.
- Representative and staff authority requires current evidence; participant/contact matching grants
  nothing.
- Every browser mutation uses an unsafe method, exact canonical Origin and session-bound CSRF proof;
  GET/HEAD are inert. This includes code exchange, hold, request/confirm, cancel, reschedule and
  attendance, meeting launch, ICS issue and OAuth initiation. Only OAuth/provider callbacks use
  separate state/channel validation instead of CSRF.
- All actor-bound scheduling responses are dynamic `private, no-store`, excluded from ISR/static
  generation, shared CDN caches, service workers/offline caches and browser-readable response/PII
  persistence. The application-session exception is the approved opaque HttpOnly session handle;
  gated user-initiated ICS download and meeting destination/history have their separately disclosed
  boundaries and never authorize a later API action.

### OAuth/provider security

- Google Calendar authorization is separate from authentication and requests minimum approved
  scopes for exact calendars/directions.
- State/PKCE/callback binding, safe redirects, credential rotation/revocation and environment
  separation are mandatory before activation.
- Refresh/access tokens live only in the approved secret/encryption boundary and never in browser,
  URLs, Postgres plaintext, logs, traces, Sentry, PostHog or audit payloads.
- OAuth necessarily returns a short-lived authorization code plus high-entropy opaque `state` through
  the exact callback URL/browser. They contain no PII, use PKCE, private/no-store/no-referrer and edge/
  app query-log redaction, are consumed once immediately and redirect/replace to a clean URL. Their
  unavoidable provider/browser/network exposure is bounded; they never enter analytics, support,
  application history or durable state, and replay fails.
- Google push is an authenticated-channel hint, not a signed event: require high-entropy channel-
  token digest plus exact active channel/resource/connection/expiry/state, ignore body, deduplicate
  and reread canonical provider API. An early `sync` hint is accepted only against `pending_watch`,
  quarantines claimed identifiers and cannot mutate business state; authenticated watch response
  binding is mandatory. Provider notification alone never authorizes a state change, and secret
  headers, raw resource URIs/calendar IDs and token values are never logged.
- OAuth `state`/browser and PKCE transaction is one-time and bound to the authorized staff session,
  intended SG connection/account/calendar, environment, scopes, exact callback/return and expiry.
  Consume before credential persistence; verify granted scopes and provider account through an
  approved claim/API; mismatch/unverifiable ownership fails closed to manual review.

### Privacy/minimization

- Appointment/client/contact details are Confidential; OAuth tokens and any embedded identity,
  tax, credit or banking data are Highly Sensitive. Free-text notes are minimized and separated into
  client-visible and internal/compliance owners.
- No appointment/contact/capability/session/credential data in URLs, HTML metadata, calendar titles/descriptions, logs, analytics, traces,
  previews or session replay. External reminders/confirmations are off before APT-010; afterward only
  its recipient-specific generic label + instant + display-zone allowlist may cross to M026. Service/
  case/type, staff, notes, contact values and meeting/management links remain prohibited.
- Public availability cannot become a staff-work-pattern oracle; ranges, counts, rate and error
  semantics are bounded.
- Staff download/export of appointment evidence and calendar credential changes are audited.
- Google projections default to no attendees and suppress provider-generated messages. A raw meeting
  URL is an unavoidable transient secret-boundary memory plus launch-response/provider/browser
  exposure only after the final fence. It never appears in an SG route/query, persistent application/
  browser storage, Referrer, prefetch, notification, analytics, log/trace/access-log/support copy or
  DOM before the fence; launch response headers are redacted from observability. Launch uses
  `private, no-store`, `Referrer-Policy: no-referrer` and `noopener noreferrer` or equivalent; the
  destination/browser-history exposure is explicitly included in the threat model.
- ICS export, when APT-014 allows it, is generated only after a current access fence, never cached,
  contains a generic allowlist and no bearer secret, and is disclosed as a non-revocable snapshot.

### Abuse and integrity

- Protect availability/hold/booking/manage/cancel endpoints with layered rate limits, bot controls,
  canonical input validation and idempotency. The Public Scheduling Gateway accepts only its
  canonical HTTPS origin and trusted edge/proxy/host evidence and never trusts raw forwarding
  headers; it has no database or external-provider credentials.
- Test slot tampering, time-zone manipulation, policy/version replay, duplicate booking, CSRF,
  open redirect, fake webhook, OAuth replay, cross-client reads and privilege escalation.
- Security-sensitive changes require independent review under `AGENTS.md`.

## 15. UX and accessibility requirements

- The experience uses the approved SG Solutions brand, Manrope/Inter, navy/cobalt/cyan/green/gold
  tokens, generous white space and restrained motion; light mode only in 1A.
- Public flow is short and progressive: allowlisted type/reason code, modality, time zone, slot, minimum details,
  policy/consent and durable confirmation.
- Client navigation remains Home, My Services, Process Status, Documents, Appointments, Messages,
  Payments, Help Center and Settings. No extra top-level calendar product appears.
- Every date/time displays an unambiguous localized value and named zone. Time-zone changes update
  the list before selection and are confirmed again before commit.
- Provide an accessible slot list; a visual calendar cannot be the only control. Keyboard navigation,
  programmatic labels, status announcements, focus restoration, 44px targets, contrast, 320px
  reflow, 200% zoom and reduced motion meet WCAG 2.2 AA.
- Conflict/expiry recovery preserves only the still-safe form values and provides fresh choices.
- Upcoming/past/empty/error states explain the next action without exposing provider failures.
- Sensitive staff/admin complexity uses progressive disclosure; the client sees only their action,
  policy and honest result.

### Admin scheduling contribution

M024 owns the calendar/agenda shell and responsive list fallback; M090 owns Settings navigation and
global configuration placement; M013 owns appointment-type/availability publishing and appointment
commands. The permissioned M013 surfaces cover:

- appointment-type editor for localized name, duration, buffers, modality, prerequisites, audience
  and activation, with APT-001/004/006 gates;
- working hours, holidays, vacation, emergency closures, notice/horizon and manual blocks under
  APT-003/004;
- quick book-on-behalf and list/calendar search/filter by date, type, modality, assignee, lifecycle
  and authorized client/business context under APT-002/008;
- draft preview, effective date, immutable version, review/publish, stale/unsaved conflict recovery
  and explicit non-retroactivity; staff overrides require an allowlisted reason code and assurance;
- attendance intent/outcome controls, while all note/summary/transcript controls and data remain
  structurally absent until APT-013.

Google connection is a separate step-up-protected M090/M091/M013 connection-management panel,
never the ordinary M024 appointment panel. It is hidden until APT-009 and APT-020 and shows only
approved connection direction/scope/status, exact calendar allowlist, disconnect impact/fail-closed
warning and reconciliation/manual-recovery state—never tokens or raw calendar/account identifiers.
Meeting-provider configuration is a separate panel hidden until APT-011's complete provider-
activation evidence; it cannot become visible merely because Google Calendar is active. If a
previously active provider is deactivated or in recovery, authorized cleanup staff see only minimum
`deactivation|recovery_required` state plus disconnect/revoke/cleanup—never reconnect/create/launch.
Disconnect and scope changes require reauthentication, confirmation
and audit.

All admin surfaces provide mobile list alternatives, keyboard/screen-reader operation, permission-
filtered counts/search and honest save/conflict/recovery states. Unauthorized users cannot infer
counts, provider connection status, appointment types or hidden fields.

## 16. Bilingual requirements

- All appointment type labels, instructions, statuses, policy summaries, dates, time-zone guidance,
  empty/error/recovery states, CTAs, confirmations and reminder templates require English/Spanish
  parity before activation.
- Internal codes, instants, IANA zones, reason keys and provider facts remain locale-neutral.
- Locale formatting never removes the named zone/offset needed to disambiguate time.
- Translations are versioned with the governing appointment/policy content; fallback is approved
  source-language copy, not machine-invented service policy.

## 17. Acceptance criteria

- [ ] One Postgres-backed M013 authority serves public, Client and channel scheduling contracts.
- [ ] M013/M024 ownership is proven: M013 owns appointment commands/state; M024 owns internal calendar UI.
- [ ] Two concurrent confirmations for the same exclusive owner/interval yield at most one winner.
- [ ] Holds expire predictably and cannot confirm after expiry or conflict.
- [ ] Confirmation single-use claims the hold and transfers capacity to exactly one winning
  appointment atomically; same-hold/different-key and expiry/rollback races cannot duplicate or lose capacity.
- [ ] Capacity property tests cover exact half-open boundaries, adjacent intervals, zero/negative
  duration, overnight intervals, buffer overlap/overflow and DST-derived UTC instants.
- [ ] Booking/reschedule/cancel retries are idempotent and digest-bound.
- [ ] Reschedule failure preserves the original appointment and its capacity.
- [ ] Staff reassignment is structurally absent in 1A; after APT-008, eligibility/CAS/race/conflict/
  rollback tests prove new-owner capacity is secured before old-owner release and reason-code/audit/
  idempotency evidence is complete.
- [ ] DST gaps yield no invalid slot and repeated times require an explicit unambiguous instant.
- [ ] Buffers, closures, manual blocks, notice, horizon and eligible staff remove conflicting slots.
- [ ] Policy/type edits are versioned and do not silently rewrite prior appointment evidence.
- [ ] Public availability reveals no staff name, event, attendee, block reason or other appointment.
- [ ] Admitted `external_busy` intervals, coverage and source projections remain Confidential and
  server-only; Public/Client/Admin-detail DTOs, logs, traces, analytics, support exports and backups
  outside APT-015 retention contain none of those interval patterns. Admin block filters, cursors,
  counts and timing cannot reconstruct external-busy patterns; only content-free coverage health is
  visible under exact permission.
- [ ] Public type-list tests expose only active/published APT-001 public projections for the locale;
  inactive, staff-only, client-only and sensitive types are absent, and version change invalidates
  stale selection without enumeration.
- [ ] Client type-list tests enforce current identity/context/grant/eligibility/audience/version and
  omit staff-only/ineligible types/counts; public and client routes cannot cross-replay receipts.
- [ ] Staff type-list tests require exact book-on-behalf permission and subject/owner eligibility,
  expose only active/effective eligible Staff DTOs and prove Admin configuration permission plus
  cross-audience refs/receipts are never inferred.
- [ ] Client list/detail/action paths reauthorize identity, grant, participant, policy and version.
- [ ] Revoked/expired resource or representative access removes future appointment access predictably.
- [ ] Management token tampering, expiry, replay and cross-appointment use fail uniformly.
- [ ] Public booking session tests cover cross-site/bootstrap rejection, exact Origin/Fetch Metadata,
  credential-free bootstrap with missing/existing/stale cookie, atomic handle overwrite, fixation/
  CSRF rotation, cross-session hold/receipt replay, absolute/
  inactivity expiry and zero CDN/service-worker/browser-readable response/PII persistence; only the
  opaque host-only HttpOnly handle may persist.
- [ ] Prospect management tests cover concurrent code exchange, wrong/reassigned recipient, duplicate/
  out-of-order delivery, fixation, cookie theft/replay, scope/epoch change, CSRF, logout and revocation.
- [ ] Code request accepts no browser appointment/contact ref, uses only current server-bound booking
  context, fails uniformly across expired/cross-session/unknown inputs and routes expired-session
  recovery to authorized staff/support without enumeration.
- [ ] Management-code delivery tests cover crash between commit/send, idempotent retry, duplicate,
  provider failure, expiry/purge, restore behavior and prove plaintext is absent from ordinary state,
  outbox, audit, logs, telemetry and backups.
- [ ] Code-verifier tests cover purpose/key-version binding, rotation, offline dictionary resistance,
  per-capability/recipient/network distributed attempts, TTL, uniform errors and zero value logging.
- [ ] Injected failure after prospect-context reservation but before appointment commit leaves no
  orphan/duplicate durable Contact, Lead or reusable consent; finalization and expiry are idempotent.
- [ ] Closed subject-context tests cover public prospect, authorized client and staff-on-behalf,
  reject mixed/cross-variant evidence, create no duplicate prospect for client/staff, and prove that
  subject/contact association grants no appointment or root authority.
- [ ] Application contract tests prove raw public name/email/phone/consent flows only through the
  transient orchestrator DTO to M020/M078; M013 types, ports, events, audit and telemetry cannot
  represent or receive it, and injected failure leaves no transit copy.
- [ ] Google outage/disconnection never deletes or falsely changes the internal appointment.
- [ ] Multiple calendar sources maintain independent cursors/coverage; query-fingerprint change,
  Google 410/expired cursor and partial pagination invalidate only the correct source and require a
  full complete epoch before slots return.
- [ ] Required external-busy coverage that is partial, stale, disconnected, expired or changes
  between list→hold→confirm fails closed; no required calendar is silently omitted.
- [ ] Duplicate/out-of-order callbacks and retrying projection jobs do not duplicate/regress state.
- [ ] Google tests cover sync-before-watch-response, exact channel-token/resource binding, empty/
  ignored bodies, non-sequential/dropped messages, renewal overlap and stale channel rejection.
- [ ] Google watch tests cover forged early headers with valid/invalid token, watch failure after
  early sync, response/header mismatch, pending timeout, raw calendar-email URI non-persistence and
  no business mutation before `pending_watch -> bound`.
- [ ] OAuth tests cover state/PKCE/session/connection/environment/scope/callback binding, single use,
  account mismatch, safe return, code/state callback query redaction/no-referrer/no durable app-
  history, immediate clean redirect, replay and credential non-persistence on failure.
- [ ] Connection-command tests cover step-up POST/Origin/CSRF initiation, callback mismatch, partial
  scope grant, CAS, source allowlist, concurrent disconnect/sync, immediate coverage/watch
  invalidation and no credential persistence on failure; meeting configuration has equivalent
  permission/version/secret-impact tests.
- [ ] Separate Calendar/Meeting connection-query tests enforce their independent gates, exact Staff
  permissions/classification, bounded DTOs/final fence and zero token/raw account/calendar/URI/join-
  URL/hidden-count leakage; one provider's state cannot activate or populate the other panel. Calendar
  source aliases come only from APT-009-approved copy and reject provider email/PII/identifier echoes.
- [ ] Recurring external events block only correct instances in the admitted horizon.
- [ ] Provider events contain only approved generic copy and opaque correlation.
- [ ] Calendar provider commands use zero attendees and suppress provider-generated create/update/
  delete/reconciliation email by default and on every retry.
- [ ] Busy read/sync/credential refresh requires APT-009+APT-020; external event create/update/outward
  reconciliation additionally fails closed without APT-014, and invitations/mail additionally fail
  closed without coordinated APT-010+APT-014. Gate-off/rollback still cancels/deletes/stops only
  previously bound Calendar/Meeting artifacts through scoped idempotent audited teardown and cannot
  create/update/rebind/launch anything.
- [ ] Payment/intake/document/approval facts remain separate prerequisites and cannot imply booking.
- [ ] Requirement reconciliation authenticates the exact owner/version/purpose, rejects duplicate-
  changed-content, out-of-order, stale and revoked evidence, updates only the requirement axis and
  cannot confirm; `confirmPending` succeeds only after rereading the complete current owner set.
- [ ] Pending confirmation tests cover APT-006 retained/released capacity, fresh-hold requirement,
  complete owner evidence, payment webhook duplicate/out-of-order delivery, expiry, approval races,
  same consumed-hold reuse, capacity conflict and provider outage.
- [ ] Appointment lifecycle, attendance intent and attendance outcome are separate; no-response or
  declined clients can still be recorded attended/no-show, and only `concluded + attended|no_show`
  produces the public result. Impossible/concurrent pairs are rejected.
- [ ] Attendance event tests cover confirmed, declined, no-response, concurrent conclude/outcome and
  atomic `appointment.concluded` + `appointment.attendance_outcome_recorded` delivery.
- [ ] APT-012 structured outcomes reject unauthorized result/next-action/tag codes and free text;
  duplicate/concurrent commands create at most one version; owner handoffs use at-least-once delivery
  plus owner inbox/idempotency for one logical M023/M011/M012/M021 effect without note leakage.
- [ ] Outcome-handoff tests inject duplicate/out-of-order delivery and crashes before/after consumer
  commit and prove one logical effect with safe replay/recovery.
- [ ] Exactly one access binding controls each appointment; mixed business associations, root relink,
  closure/block and representative revocation cannot produce association-based OR access.
- [ ] Cancellation never cancels a ServiceOrder; completion never starts one.
- [ ] AI/channel tools cannot invent or bypass availability and require an M013 success receipt.
- [ ] AI tests cover prompt/tool injection, permission/receipt bypass, stale reauthorization and prove
  no AI authority over capacity, payments, attendance, notes or authorization.
- [ ] Notifications remain off before APT-010; afterward contract tests permit only generic label,
  instant and display zone, prohibit all other appointment/sensitive/bearer fields and prove M026
  consent/state/template enforcement.
- [ ] Client/Public/Staff DTO contract tests prove structural field allowlists and no cross-audience leak.
- [ ] Cancellation, reschedule, attendance, override, block and future reassignment commands reject arbitrary
  narrative and unknown reason codes; free-text reason fields are structurally absent before APT-013.
- [ ] `cancelBlock` and override reject `external_busy`; external removal/uncertainty invalidates
  coverage/receipts and no slot is returned until a bounded complete source sync is republished.
- [ ] Hold lifecycle tests cover explicit release plus policy/coverage/authorization/recovery-epoch
  invalidation, idempotent `hold_released|hold_invalidated` events and permanent non-reusability after
  every terminal transition.
- [ ] Explicit hold release tests cover duplicate/same-digest retry, changed digest, release versus
  confirm/expire/invalidate race, cross-session replay and prove GET/unload/beacon cannot release;
  trusted expiry remains the safe cleanup fallback.
- [ ] All actor-bound browser responses prove `private, no-store`, no ISR/CDN/service-worker/offline
  or browser-readable application response/PII persistence; the opaque HttpOnly session handle plus
  separately gated/disclosed user-initiated ICS and meeting destination/history are the only bounded
  exceptions. The
  credential-free bootstrap POST proves Origin/Fetch Metadata/fixation controls, every later mutation
  proves Origin + session-bound CSRF, and GET/HEAD remain inert.
- [ ] Gateway tests cover wrong environment/issuer/audience/service/method/path/body digest/key
  version/recovery epoch, stale timestamp, nonce replay, rotation overlap/outage, direct internet/
  browser call, inner rate limit and mandatory domain/session reauthorization. Concurrent replay
  across instances, restart and rotation yields exactly one atomic nonce claim; uncertainty fails closed.
- [ ] Gateway privacy tests prove raw contact body, body digest, signature and auth headers never enter
  replay state, logs, audit, traces, analytics or error reports; only the bounded nonce tuple persists.
- [ ] APT-017 abuse tests cover purpose-keyed network digest/rotation, bounded TTL, distributed
  attempts, NAT/shared IP, CAPTCHA/provider failure, false positive/review/appeal and zero raw IP/
  device/contact/provider-token leakage to domain state, analytics or ordinary telemetry. Prior-epoch
  evidence is rejected/purged after restore and cannot reinstate an expired or appealed denial.
- [ ] Public booking-route tests prove exactly one clean M001-canonical route key per locale accepts
  booking steps; the separately gated localized management bootstrap is absent until APT-007. No
  semantic type/contact/capability
  enters URL, history, referrer, logs or analytics.
- [ ] Booking digest tests prove no raw or bare-hashed contact value enters hold/receipt/event/audit/log
  and approved keyed-HMAC key-version rotation preserves explicit idempotency policy.
- [ ] Meeting tests cover provider outage, idempotent create/revoke/reconcile, cleanup, launch-window
  authorization, rotation/revocation, exact initial HTTPS scheme/host/port/path/query validation,
  userinfo/CRLF/lookalike rejection, no server fetch/follow and no raw URL outside transient secret-
  boundary memory plus the final no-store browser handoff. Response header/access-log/trace redaction,
  downstream vendor-risk evidence and public/prospect video ineligibility are proven.
- [ ] Meeting launch fails closed without active complete APT-011 provider/config evidence, current
  RecoveryEpoch and current secret/config versions, including after deactivation/recovery-required;
  cleanup-only visibility cannot acquire launch authority.
- [ ] Meeting launch and ICS issuance reject GET/prefetch/cross-site/clickjacking attempts, require
  POST + exact Origin + session-bound CSRF + final access fence and cause zero provider/download
  handoff when any proof fails.
- [ ] APT-014 ICS tests cover current-access/revocation fences, generic field allowlist, no caching,
  non-revocable-snapshot disclosure and CRLF/folding/filename/header injection.
- [ ] APT-013 appointment/client-specific instruction, note, summary and transcript fields, controls,
  ports and events are structurally absent before approval; generic APT-001/011 type/modality copy
  remains a distinct immutable definition, and approved client/internal/compliance bodies are
  separated and human-reviewed.
- [ ] Admin UX tests cover type/policy draft-preview-version-publish, effective date, stale/unsaved
  conflict, block create/cancel plus derived-availability invalidation, override reason code, provider settings
  permission/step-up, separately gated Google and meeting panels, no count/ID/token leakage, mobile
  list fallback and save/recovery failures.
- [ ] Staff query tests prove exact permission/classification, bounded filters/cursor, no hidden totals,
  separate Staff DTO, final fence and no provider/contact leak through M024 projection.
- [ ] `appointment.client_projection_changed` consumers always reauthorize/reread; unknown/raw provider
  events, revoked roots and stale grants cannot refresh or expose a client projection. M010 timeline
  contract tests retain ordered provenance for multiple M013 changes before a reread, exact duplicate,
  out-of-order delivery and correction without collapsing or inventing transitions.
- [ ] UI passes keyboard, screen reader, contrast, reflow, zoom, target-size and reduced-motion checks.
- [ ] English and Spanish paths preserve policy meaning and unambiguous date/time.
- [ ] Provider/notification/payment/CRM/AI failures have tested safe manual recovery.
- [ ] Snapshot-before-revocation restore tests prove every pre-restore session, capability, code,
  active hold/ephemeral receipt, CSRF proof, OAuth/watch transaction and signed gateway request fails
  after the `RecoveryEpoch` advance while confirmed appointments retain correct capacity.
- [ ] Snapshot-before-meeting-link rotation/revocation restore tests prove restored projection, launch
  receipt and vault secret are unusable before traffic, provider revoke/reconcile has bounded retry/
  manual recovery, only a fresh current-epoch link can launch after final fencing and appointment
  truth remains unchanged.
- [ ] Durable request/reschedule/cancel/outcome/handoff idempotency receipts restore with outbox/audit;
  same-key/same-digest retry returns the original result and never repeats a logical effect.
- [ ] No route/schema/provider/real appointment exists until a separate Build/activation gate.

## 18. Negative acceptance criteria

- No per-channel calendar, provider-owned appointment truth or direct browser/provider write.
- No client/visitor sees another person's appointment, event metadata or staff calendar topology.
- No frontend-only conflict check, role check, price check or policy check is accepted.
- No booking success is inferred from slot display, hold, form receipt, Checkout success page,
  calendar event, notification or AI response.
- No Google login silently requests Calendar permission.
- No access/refresh token, management/session handle, meeting secret, contact value or sensitive
  service context enters URL/log/analytics/trace/event payload. The sole OAuth callback exception is
  the transient authorization code + opaque state under the controls above.
- No actor-bound response is statically generated, stored in shared/offline cache or mutated by GET;
  no browser mutation relies on SameSite/idempotency/capability possession instead of Origin + CSRF.
- No semantic appointment type or management capability appears in a public URL.
- No pending prerequisite reuses a consumed hold or confirms from incomplete/stale owner evidence.
- No Google projection includes an attendee or triggers provider-generated mail before coordinated
  APT-010/APT-014 approval.
- No meeting launch accepts a non-HTTPS, credential-bearing, CRLF or lookalike initial destination,
  and SG never server-fetches/resolves/follows a join URL.
- No external event deletion silently cancels an SG appointment.
- No staff override lacks exact permission, allowlisted reason code, expected version and audit evidence.
- No invalid/ambiguous local time is silently normalized.
- No reschedule drops the old slot before the new one is atomically secured.
- No appointment reference grants a service, case, document, payment, message or task right.
- No unapproved charge, late fee, cancellation penalty, reminder schedule, address or SLA is invented.
- No AI marks payment, attendance, no-show, completion or authorization from natural language.
- No attempt is made to implement all Calendly features or extract a scheduling microservice in 1A.

## 19. Dependencies

- M007 and M080/M081: identity, session, IAM/RBAC and assurance.
- ADR 004, M009/M010, M017–M018/M021–M022: client/service/case/resource authority.
- M003–M006/M012: channel handoffs; they never own slots or bookings.
- M011/M014/M023/M026/M067: document, billing, task, notification and signature owners.
- M024: internal calendar experience and cross-domain operational projection.
- M041: provider-adapter conventions; M013 retains Calendar/Meeting domain-port ownership.
- M047/M051 and M076: AI Hub/Scheduler Agent tool boundary and compliance/human decisions after APT-019.
- M068/M072/M073: workflow/queue coordination and safe fallback.
- M077/M078/M085: audit, consent and retention/deletion.
- M090/M091: system configuration and staff administration.
- M092/M097: product reporting versus minimized operational/security telemetry.
- ADRs 001–006, approved data classification/encryption/backup/upload security policies.
- Google Workspace/Calendar account, OAuth application, admitted calendars and evidence only at a
  separately approved external-activation gate.

## 20. Risks

| Risk | Mitigation |
|---|---|
| Double booking/race | Database capacity invariant, transaction, holds, expected versions and idempotency |
| DST/time-zone error | UTC instant plus IANA/wall-time/offset/version evidence and explicit ambiguity handling |
| Provider drift/outage | Postgres authority, separate projection state, reconciliation and manual blocks |
| Google token compromise | Least scopes, secret boundary, rotation/revocation, no telemetry or browser exposure |
| Calendar privacy leak | Free/busy minimization, generic event copy, audience-specific DTOs and contract tests |
| Public availability abuse | Bounded horizon/results, rate limits, bot controls and uniform errors |
| Policy changed retroactively | Immutable policy versions and explicit audited migration/override |
| Reschedule loses appointment | Atomic secure-new/release-old transition |
| Reminder leaks or duplicates | APT-010-gated M026 minimized allowlist, consent/state recheck and idempotency |
| Payment/appointment confusion | Separate prerequisite/lifecycle axes and M014 authoritative receipt |
| AI/channel invents availability | Typed tool contract, M013 receipt and deterministic fallback |
| Solo operator overload | Narrow 1A types/hours, manual queue, honest copy and no public SLA |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: APT-001 — approve Release 1A appointment types, localized names,
  duration, buffers, modalities and which types are public, client-only or staff-only.]
- [NEEDS PRODUCT OWNER DECISION: APT-002 — approve who may book each type, whether public email/
  phone verification is required, authorized-representative evidence and which appointments inherit
  case/service access.]
- [NEEDS PRODUCT OWNER DECISION: APT-003 — approve SG Solutions business hours, America/Chicago
  baseline, holidays, closures, vacation and emergency-block policy.]
- [NEEDS PRODUCT OWNER DECISION: APT-004 — approve minimum notice, booking horizon, slot granularity,
  hold duration, abandoned-hold treatment and stale availability receipt lifetime.]
- [NEEDS PRODUCT OWNER DECISION: APT-005 — approve cancellation/rescheduling windows, maximum
  changes, late/no-show policy, allowlisted reason-code requirements, exceptions and who may override;
  APT-013 separately governs whether any free-text narrative is ever allowed and its owner/retention.]
- [NEEDS PRODUCT OWNER DECISION: APT-006 — approve which types require intake, documents, manual
  confirmation or payment; whether each pending request retains exact capacity and until when or
  releases it and requires a fresh hold; and owner-evidence expiry/failure rules.]
- [NEEDS PRODUCT OWNER DECISION: APT-007 — approve minimum public booking fields, consent/
  verification evidence, scheduling-only prospect reservation/finalization, management-code actions/
  format/entropy, expiry, keyed-verifier/rotation, attempts, M026 one-time-code delivery/wrong-
  recipient/replay policy and contact-masking copy.]
- [NEEDS PRODUCT OWNER DECISION: APT-008 — approve staff/team eligibility, visible staff identity,
  manual/default assignment, future round-robin/capacity rules and override assurance.]
- [NEEDS PRODUCT OWNER DECISION: APT-009 — approve which Google calendars/directions contribute
  busy/projection data, scope allowlist, expected provider-account verification, conflict winner/
  escalation policy, synchronization horizon, watch renewal/reconciliation cadence, staff-facing
  non-PII source aliases and manual owner. An alias may not copy an account/calendar email, raw
  provider ID or URI.]
- [NEEDS PRODUCT OWNER DECISION: APT-010 — approve confirmation/reminder events, timings, channels,
  quiet hours, preferences/consent, templates, retry/escalation and the exact recipient-specific
  allowlist; proposed maximum is generic SG Solutions appointment label, instant and display zone,
  with no type/service/case/staff/note/contact value or meeting/management link.]
- [NEEDS PRODUCT OWNER DECISION: APT-011 — approve phone caller responsibility, virtual meeting
  provider, link visibility, any in-person location and accessibility/instruction copy; no physical
  address is public by default. For Meeting provider activation this same decision must approve
  account ownership, environment separation, exact API permissions/scopes where applicable,
  credential custody/rotation, DPA/terms/retention, sandbox-to-production rehearsal, monitoring and
  rollback; modality copy alone never authorizes provider traffic.]
- [NEEDS PRODUCT OWNER DECISION: APT-012 — approve CRM/service/case linkage rules, activity fields,
  structured outcomes, follow-up triggers and which actions require human review.]
- [NEEDS PRODUCT OWNER DECISION: APT-013 — approve appointment/client-specific instructions/notes, internal and
  compliance note ownership, post-appointment summaries, AI draft review and transcript use.]
- [NEEDS PRODUCT OWNER DECISION: APT-014 — approve exact external calendar event title/body,
  attendee invitations, organizer identity, update/cancellation copy, confidentiality setting and
  generic ICS export. Provider mail remains suppressed and attendees remain empty unless coordinated
  explicitly with APT-010.]
- [NEEDS PRODUCT OWNER DECISION: APT-015 — approve appointment, hold, capability, provider cursor,
  reminder, note, audit, admitted external-busy interval, coverage and source-projection retention/
  deletion/legal-hold periods after Illinois/legal review, including backup expiry/purge authority.]
- [NEEDS PRODUCT OWNER DECISION: APT-016 — approve M092 appointment analytics/metrics, viewers,
  fields, retention and PostHog boundary; default is no product analytics and no session replay.]
- [NEEDS PRODUCT OWNER DECISION: APT-017 — approve public rate limits, CAPTCHA/verification
  thresholds, repeat-booking/cancellation/distributed-attempt rules, purpose-keyed network evidence/
  TTL, NAT/shared-network treatment, temporary blocks, provider sharing, review, deletion and appeal.]
- [NEEDS PRODUCT OWNER DECISION: APT-018 — approve no-availability fallback: callback, alternate
  type/range, human message and any future waitlist fields/priority/notification.]
- [NEEDS PRODUCT OWNER DECISION: APT-019 — approve if/when each public or internal AI agent may call
  scheduling tools, permitted types/actions, confirmation language, evaluation and human takeover.]
- [NEEDS PRODUCT OWNER DECISION: APT-020 — approve Google Calendar production activation, account
  ownership, environments, OAuth session/account/scope/callback binding, credential custody/
  rotation, HTTPS push endpoint, channel-token custody/renewal, dropped-notification monitoring,
  reconciliation rehearsal and rollback evidence.]

Approval of this PRD, ADR 017 and any `APT-*` policy does not authorize product implementation or
external activation. A separate Product Owner `GENERATE`/Build gate remains mandatory.
