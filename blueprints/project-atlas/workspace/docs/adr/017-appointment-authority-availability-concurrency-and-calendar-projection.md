# ADR 017 — Appointment authority, availability, concurrency and calendar projection

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; no Build authority
- Date: 2026-08-09
- Extends: ADRs 001–006 and proposed ADRs 007–016; does not supersede them
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M013 must support public and authenticated appointment journeys without creating a calendar per
channel, exposing internal calendars or allowing two users to win the same time. It must also work
when Google Calendar is disconnected, delayed or inconsistent. The supplied source names M013 and
M024 together in places; the 110-module catalog separates Client Appointments (M013) from the
internal Calendar (M024), so ownership must be explicit.

Time is a security and integrity boundary. IANA/DST ambiguity, stale slot displays, holds,
rescheduling, duplicate commands, external recurring events and out-of-order callbacks can all
produce incorrect or leaked availability if treated as frontend/provider concerns.

## Decision proposed

### 1. M013 owns appointment behavior; M024 owns the internal calendar experience

M013 is the single authority for appointment types, versioned availability policies, holds,
appointments, client/public projections, cancellation/rescheduling, attendance and calendar
projection/reconciliation. M024 consumes a minimized internal calendar projection and invokes M013
commands with current authorization. It may also display M023 tasks/deadlines and other approved
calendar facts, but cannot redefine or write appointment state directly.

M003–M006 and M012 call M013 ports. They may collect a preference, present opaque slots or relay a
receipt, but cannot own availability or booking truth. M017/M020 own lead/CRM activity; M021/M022 own
service/case state; M014/M043–M045 own money; M026 owns notification delivery.

Public booking requires an M020/M078-owned, scheduling-purpose `ProspectContextReservation` before
commit. A cross-domain application transaction finalizes it only with the winning M013 appointment;
rollback/expiry leaves no durable orphan Lead, Contact or reusable consent. Retaining an abandoned
lead requires separately approved lead-contact purpose/consent. M013 owns no raw contact/consent.
M051 under M047 may later call allowlisted M013 tools only after APT-019; M076 supplies compliance/
human decisions and no AI agent acquires appointment authority.

### 2. Postgres is operational authority; Google is a minimized projection

Postgres owns the accepted appointment, availability/block policy, hold and reconciliation state.
Google Calendar is accessed through a provider-neutral `CalendarProvider` and contributes only
approved bounded busy facts. A rebuildable generic external event projection exists only after
APT-009+APT-020 and APT-014 approve it and its exact copy/confidentiality allowlist. Google event existence,
deletion, time or notification is never sole proof of an SG appointment or permission to change it.

Each admitted external calendar is a distinct `CalendarSource` with its own immutable query/filter
fingerprint, pagination/full-sync generation, cursor and completeness/freshness receipt. A connection
does not share one cursor across calendars. Query changes, Google 410/expired cursor, partial pages,
restore or disconnection invalidate only the applicable source; dependent slots fail closed until a
new full paginated complete epoch is published.

External events use generic, opaque copy and no client/service/financial detail. Free/busy ingestion
does not retain unrelated title, body, attendee or meeting data. Provider outage leaves internal
appointments valid and creates separate sync/recovery state.

Google authentication/identity and Google Calendar OAuth are separate grants. Calendar access uses
the minimum approved scopes, explicit admitted calendar IDs/directions, secret/encryption custody,
environment separation, verified callbacks and revocation. Access/refresh tokens never cross into
browser, URL, domain event, audit, log, analytics or trace. The OAuth authorization-code flow
necessarily returns a short-lived code plus high-entropy opaque `state` through the exact callback
URL/browser; they contain no PII, use PKCE, no-store/no-referrer and query redaction at edge/app logs,
are consumed once immediately and redirect/replace to a clean URL. Provider/browser/network exposure
is acknowledged and bounded; neither value enters application history, telemetry or durable state.

Provider projections default to zero attendees and provider-generated notifications suppressed for
create, update, cancellation and reconciliation. APT-009 plus APT-020 permits only approved busy/
sync/credential operations; any external event create/update/outward reconcile additionally requires
APT-014. Attendee invitations/provider mail require coordinated APT-010/APT-014 approval. Scoped
idempotent audited cancel/delete/stop/revoke of a previously bound Calendar/Meeting artifact remains
permitted for deactivation, rollback and restore, but cannot create/update/rebind/launch. Meeting
providers are separate rebuildable projections: raw join destinations stay
inside the vault boundary, and an authorized just-in-time launch validates an exact provider HTTPS
origin/path allowlist before redirect.

### 3. Availability is a deterministic, versioned derivation

The service derives slots from an exact appointment-type and availability-policy version, eligible
scheduling owner, effective working windows, closures, blocks, existing appointments, active holds,
buffers, notice, horizon, modality and admitted external busy projections. Responses contain
opaque, short-lived slot receipts only and reveal no staff/event topology.

Every admitted external-busy source has versioned complete coverage evidence for a bounded horizon,
including cursor/source version, `lastCompleteAt`, maximum staleness and status. Availability, hold
and confirmation bind the exact required coverage set/digest. Once a source is admitted as required,
partial, stale, disconnected, unavailable or uncovered data fails closed for its affected interval;
the source is never silently omitted. Manual/internal-only scheduling remains valid when policy has
admitted no external source.

All instants persist in UTC while source local wall time, IANA zone, resolved offset and relevant
time-zone/policy version remain evidence. DST gaps yield no slot. DST overlaps require an explicit
unambiguous offset/instant and never silently normalize.

### 4. Holds and database invariants decide concurrency

Selecting a slot does not reserve it. Hold creation re-derives availability, binds an opaque receipt
to actor/session, policy, owner, interval, digest and trusted expiry, and competes under a database
capacity invariant. Booking confirmation reauthorizes and rechecks every input in one transaction.

A Postgres range-exclusion/unique invariant or equivalent serializable/advisory-lock design prevents
overlapping confirmed/held capacity for one scheduling-owner/capacity key using a positive-duration
UTC half-open occupancy interval `[start - bufferBefore, end + bufferAfter)`. Zero/negative duration,
timestamp/buffer overflow and inconsistent endpoints are rejected. Expired holds are inactive by
query semantics even if cleanup is delayed. Commands are digest-bound and idempotent: a matching
retry returns the original receipt; key reuse with another command conflicts.

Confirmation single-use locks/claims one active hold, reauthorizes and revalidates expiry, policy,
external-coverage digest, owner and interval, inserts/acquires appointment capacity, marks the hold
consumed with the winning appointment reference and commits receipt/outbox/audit in one transaction.
The appointment replaces the consumed hold as the interval blocker. A different idempotency key
cannot reuse that hold; any failure rolls back every claim/capacity/receipt/event.

Rescheduling atomically secures the new interval, appends immutable prior/new timing evidence,
changes the appointment and releases the old interval. If any step fails, the original appointment
and capacity remain unchanged.

### 5. Appointment, prerequisite, attendance, projection and delivery states remain separate

Appointment lifecycle cannot encode payment, intake, document, approval, attendance, Google sync or
reminder delivery. Client attendance intent (`unknown|confirmed|declined`) is separate from staff-
recorded outcome (`unrecorded|attended|no_show`), and intent never gates outcome. Lifecycle ends in
`concluded`; authorized staff atomically records exactly one outcome. Public `Completed|No-show` is
a derived mapping, never duplicate lifecycle truth, and impossible/concurrent pairs fail. An
APT-012-gated M013 structured outcome holds closed result/next-action/tag codes plus human review and
typed idempotent handoffs; free-text notes/summaries/transcripts are separate APT-013-owned data and
cannot trigger work. Each axis otherwise has owner evidence. A Stripe webhook may satisfy an
approved payment prerequisite; it does not confirm an appointment without the M013 transaction and
never authorizes a service. A client attendance confirmation is not proof of attendance. A Google
event is not confirmation. A reminder receipt is not proof of reading.

APT-006 must select one pending-capacity policy: retain the exact interval until a trusted deadline,
or release it and require a new hold before confirmation. `BookingService.request` consumes the
original hold once. `confirmPending` CAS-locks the pending appointment, reauthorizes, verifies the
complete current owner-evidence set and either confirms retained capacity or atomically consumes a
fresh hold matching the requested interval/owner/type/policy. If released capacity is unavailable,
the request remains pending and requires an explicit new selection/reschedule; it never moves
silently. Duplicate/out-of-order owner events never confirm twice or reuse the original hold.

Policy definitions are immutable/versioned. Existing appointments retain the policy they accepted;
a later configuration change requires explicit audited transition/migration and cannot apply
silently.

### 6. Authorization is resource-based and final-fenced

Active identity/membership is necessary but does not grant appointment access. Every appointment
has exactly one `AppointmentAccessBinding`: a direct appointment grant or one canonical
ServiceOrder/CaseFile root with audience, inheritance allow/block and root/authorization epochs.
Additional Lead/Client/Contact/Business/service/case associations grant nothing. Deny/block wins;
relinking authorizes old/new roots, uses CAS, advances epochs and cannot open an intermediate access
window. Direct prospect management is absent before APT-007. After approval it uses
a temporary random action/audience/version-bound one-time code delivered out of band and stored only
as a digest in ordinary state. For bounded asynchronous M026 delivery, plaintext exists only in a
short-TTL envelope-encrypted one-time vault object within SG-controlled durable state and referenced
opaquely by the outbox; scoped retries
reuse it idempotently, then success/consumption/expiry/cancellation purges and revokes it. It never
enters ordinary DB state, events, audit, telemetry, support or backups. A no-store POST exchanges it
for a narrow HttpOnly Secure SameSite session and
redirects to a clean URL; no secret enters a path, query, fragment, referrer, history, log, analytics
or prefetch. Participation, email, phone, business or calendar reference grants nothing.
The approved M026 transport/provider and intended recipient necessarily receive plaintext; APT-007
must approve DPA, provider/mailbox retention, forwarding/reassigned-recipient risk and controllable
message-body retention minimization before activation.

The post-exchange `ProspectAppointmentSession` is server-side, exactly appointment/action scoped and
bound to policy/authorization epochs, absolute/inactivity expiry, rotation, revocation and CSRF; its
host-only `__Host-` cookie contains only an opaque handle. A separate pre-booking
`PublicBookingSession` binds clean `/book` POST state, locale/zone, opaque type choice, holds and CSRF
without contact PII. Neither is M007 membership. M026 can deliver the one-time code after APT-007
independently of reminders, using an opaque M020 contact ref and generic context only.

Domain services authorize before I/O; restricted RLS mirrors scope. Client/Public/Staff query/DTO
paths are structurally separate. Immediately before serialization or commit, a final fence rechecks
session, membership, resource grant, representative evidence, appointment policy/lifecycle,
sensitivity, authorization epoch and expected version. Uniform failures prevent enumeration.

The public runtime is a static-first Astro shell with a narrow same-origin on-demand Public
Scheduling Gateway in `apps/www`; the gateway has no direct database, Supabase service-role, CRM or
provider credentials and calls only a least-privilege typed M013 application facade using its scoped
service identity. Every internal call carries a rotating workload signature bound to environment,
issuer, exact audience/service/method/canonical path/body digest/timestamp/nonce/key version and
RecoveryEpoch. The app rejects direct browser/internet calls, stale/replayed/wrong-audience proofs
and disallowed operations before parsing domain input; it maintains a bounded replay store, inner
quotas, full domain/session reauthorization and fail-closed rotation/outage.

The browser gateway validates canonical HTTPS Origin plus trusted edge/proxy/host evidence and never
raw forwarding headers. GET/HEAD are inert. A credential-free same-origin bootstrap POST accepts no
booking/contact input and does not authenticate/derive input from an ambient cookie; an existing or
stale handle is ignored, revoked where resolvable and atomically overwritten. Origin + Fetch Metadata
+ bounds/rate/bot controls create/rotate the host-only session and return CSRF private/no-store. Every later mutation requires
the session-bound CSRF proof. Actor-bound scheduling/OAuth/bootstrap responses are dynamic
`private, no-store`, excluded from ISR/CDN/service-worker/offline or browser-readable response/PII
persistence; the application-session browser value is the opaque HttpOnly cookie handle. Public
booking uses one clean M001-canonical route key per approved locale (documentary `/book` and
`/en/book`); semantic type and capability values remain in server-side POST state. A separately
localized clean prospect-management bootstrap remains absent until APT-007 and accepts no booking-
type/contact/capability value in its URL.

Every ephemeral session, capability, code/OAuth/watch transaction, active hold, availability/context/
bootstrap receipt and workload/replay proof binds a `RecoveryEpoch` stored outside the restored
database generation. Recovery increments it, expires/releases all restored ephemeral authority,
marks restored meeting projections recovery-required, revokes their vault/launch authority before
traffic and requires a current-epoch fresh meeting secret plus final fence before launch,
clears replay/CSRF state and requires fresh issuance before traffic. Durable command idempotency
receipts/outbox/audit restore with the aggregate and preserve one logical effect on retry; they never
serve as current authorization.

### 7. Provider ingress and asynchronous work are replay-safe

Google Calendar push has no signed body. Before creating `watch`, M013 stores a `pending_watch`
transaction with unique channel ID, high-entropy channel-token digest, intended connection/source/
direction/environment, exact request fingerprint and expiry—but no resource binding Google has not
returned. An early `sync` notification may validate only ID/token, exact pending request and `sync`
state; it quarantines a keyed URI digest/allowlist result and queues no business mutation. Only a
matching authenticated `watch` response atomically binds the minimum provider resource ID required
to stop/bind plus canonical URI-comparison digest. Later ingress requires the exact bound tuple.
Timeout, response/header mismatch or watch failure fails closed and stops/expires the channel. Raw
resource URIs/calendar identifiers, channel tokens and secret headers never enter ordinary fields,
events, audit, logs or telemetry.

The body is ignored. `X-Goog-Message-Number` is non-sequential deduplication evidence only, never
complete ordering or proof that no notification was lost. A bound accepted notification schedules a
canonical API reread/reconciliation and does not contain or authorize a business change. Renewal
permits bounded old/new channel overlap with distinct IDs/tokens and idempotent reconciliation.
Dropped notices, stale channels, per-source invalid cursors and disconnection are handled by
periodic/bounded full pagination and manual recovery; provider push is never relied on for
completeness.

Calendar OAuth uses a one-time transaction bound to the currently authorized staff session,
intended SG `CalendarConnection`, expected provider account/calendar, environment, exact requested
scope set, canonical callback/return intent and expiry. `state`/browser binding and PKCE protect the
code flow. Callback code/state are transient query values subject to no-store/no-referrer, log/query
redaction, one-time immediate consumption and clean redirect/replace; replay fails. The transaction
is consumed before credentials persist. Granted scopes and provider
account are verified through an approved claim/API, and mismatch or unverifiable ownership fails
closed to manual review rather than connecting the account. Redirect targets are exact allowlisted
HTTPS values, never browser-supplied redirects.

Provider time/order is evidence only. Duplicate, missing, delayed and out-of-order notifications
cannot duplicate or regress internal state. Invalid per-source sync cursors trigger bounded full
paginated synchronization and a new coverage epoch; expired credentials produce a restricted
recovery path.

Post-commit outbox events are minimized, opaque and schema-versioned. Inngest coordinates jobs with
idempotency, retry caps and manual recovery, but never owns appointment state. Client-facing success
exists only after the canonical Postgres commit, independent of provider/notification completion.

### 8. Release 1A remains narrow and provider-optional

The durable design supports future staff/teams, paid appointments, reminders, waitlists and video,
but Release 1A activates only Product Owner-approved types, hours, modalities and policies. Manual
blocks/default assignment and a safe human fallback are sufficient for the initial solo operator.
Round-robin, group/resource scheduling and broad Calendly parity are excluded.
Phone is the only default modality. Video is absent for public/prospect booking until APT-011 and
authenticated M007 access are approved; any future prospect launch requires a separate APT-007/011
session decision. Generic ICS export is absent until APT-014 and, once issued, is disclosed as a
non-revocable snapshot rather than a sync feed.

Client-visible transitions emit only `appointment.client_projection_changed` with opaque refs and
versions; consumers reauthorize and reread M013. Attendance publishes separate intent changes and an
atomic concluded/outcome pair. No generic `appointment.changed`, raw provider event or free-text
outcome can drive a client refresh or downstream action.

## Consequences

- All acquisition channels converge on one reusable scheduling domain.
- Internal operation can continue securely without Google, and provider state can be rebuilt.
- Time and concurrency require more explicit evidence than a simple start/end table, but eliminate
  silent DST and double-booking failures.
- M024 can present a unified staff calendar without becoming a second appointment authority.
- Payment, document, service, case and messaging owners remain independent and cannot be mutated by
  appointment text or references.
- Twenty operating/activation policies remain explicit `APT-001`–`APT-020` Product Owner decisions.

## Rejected alternatives

- **Google Calendar as source of truth:** provider drift/outage and weak domain authorization could
  lose or expose appointments.
- **Calendar per channel:** creates conflicting availability and duplicate bookings.
- **Frontend slot disabling as concurrency control:** stale clients can still race.
- **Release old slot before securing reschedule:** can destroy a valid appointment.
- **One appointment status for all axes:** conflates confirmation, payment, attendance and sync.
- **Store full external events:** collects unrelated personal/calendar data without need.
- **Participant/contact match as authorization:** enables horizontal access and identity collision.
- **Generic mutable policy rows:** retroactively changes client commitments without evidence.
- **Scheduling microservice in Release 1:** adds distributed failure/authorization complexity without
  demonstrated scaling, runtime or isolation need.
- **Full Calendly clone:** expands scope beyond real-client operational needs.

## Validation required before acceptance

1. Independent architecture review validates M013/M024 and cross-module authority.
2. Security review validates IDOR, token/OAuth, privacy, concurrency, event and telemetry boundaries.
3. Contract/state/property tests are planned for DST gaps/overlaps, holds, capacity conflicts,
   half-open boundaries, idempotency, pending confirmation, atomic reschedule, policy versions and
   uniform failures.
4. Provider tests cover duplicate/out-of-order callbacks, recurring events, disconnect, expired
   credentials/per-source sync cursor, partial pagination, `pending_watch` races, zero-attendee/no-
   mail projection defaults, meeting launch allowlist, outage and reconciliation.
5. UX/accessibility review covers public/client/staff responsive ES/EN flows and nonvisual slot list.
6. Security tests cover Origin/CSRF, no-store boundaries, session fixation/replay, clean URLs,
   prospect-reservation rollback, digest minimization and client-projection reauthorization.
7. Product Owner approves each required `APT-*` policy and later opens a separate Build gate.

## Deferred activation

Google OAuth, calendars, webhooks, meeting providers, notifications, Stripe prerequisites and real
appointment handling remain `External activation deferred` under ADR 006 and
`EXTERNAL_ACTIVATION_REGISTER.md`.
