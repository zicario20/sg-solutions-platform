# M013 Client Appointments — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Public Website `/book`; Client Portal `/client/appointments`; bounded M024 Admin contribution
- Related requirements: `docs/modules/m013-client-appointments.md`
- Proposed architecture decision: ADR 017

This specification describes the branded, responsive and accessible appointment experience. It is
not a Figma file, route/component implementation, final business copy, provider activation or
authorization to accept real bookings.

## 1. Experience objective

Within one viewport, a person should understand:

1. what type of appointment they are choosing;
2. the exact localized time and named time zone;
3. whether the time is merely selected, held, requested or confirmed;
4. what they must do next;
5. how to recover safely if no slot or provider is available.

The experience feels like a calm professional consultation flow—not an airline seat map or complex
staff calendar. The system is powerful internally and simple externally.

## 2. Brand and art direction

Use the approved SG Solutions logo exactly as supplied. Do not redraw, regenerate, recolor or use
the promotional banner as the appointment background.

- Premium financial-services clarity, generous white space and subtle motion.
- Navy structure, cobalt primary actions, cyan decorative information accents, green only for durable
  confirmed/completed evidence and gold decorative attention accents. Cyan/gold never carry normal
  text or essential state/icon/border meaning on a light surface without a separately validated
  contrast-safe foreground/background pairing.
- Avoid calendar-grid overload, glassmorphism, animated countdown pressure, decorative clocks,
  fake scarcity, provider logos as primary branding and unverified success confetti.
- Appointment cards resemble professional service commitments with clear timing and next action.

| Role | Token/value | Use |
|---|---|---|
| Heading | Manrope | Page and appointment headings |
| Body/control | Inter | Dates, policies, instructions and controls |
| Primary ink | Navy `#0A2540` | Structure and text |
| Primary action | Cobalt `#0B63CE` | Continue, confirm and save |
| Information accent | Cyan `#00A3E0` | Decorative accent/background only on light surfaces; guidance text and essential icon/border use a contrast-validated foreground token |
| Verified state | Green `#2E7D32` | Confirmed/completed only |
| Attention accent | Gold `#B7791F` | Decorative accent/background only on light surfaces; pending text and essential icon/border use a contrast-validated foreground token |
| Surface | `#F7F9FC` | App background |

Light mode ships first. Dark tokens remain unpublished in 1A. Reduced motion removes decorative
transitions without removing state or focus information.

On white or `#F7F9FC`, cyan `#00A3E0` and gold `#B7791F` are not normal-text colors. Cyan is also
prohibited as the sole essential graphical/control boundary on white. All normal text meets at least
4.5:1; large text and essential icons/control boundaries meet at least 3:1. Status components pair
decorative cyan/gold surfaces or accents with a tested navy/other semantic foreground, visible text
and icon; automated and manual contrast checks approve every exact combination before Build.

## 3. Information architecture and routes

Routes are documentary targets and use opaque public references:

- `/book` and `/en/book` — one M001-canonical public booking route key per Spanish/English locale;
  final names await Build, and the allowlisted type/reason code stays in no-store server-side POST/
  session state;
- `/appointments/manage` and localized equivalent — separately gated clean prospect-management bootstrap shell; it accepts
  no secret in path/query and does not exist while APT-007 is off;
- `/client/appointments/new` — M007-authenticated client booking; it uses Client-only type/slot DTOs
  and never the Public Scheduling Gateway or PublicBookingSession;
- `/client/appointments` — authorized upcoming/history list;
- `/client/appointments/[publicAppointmentRef]` — reauthorized detail;
- `/client/services/[publicServiceRef]/appointments` — service-scoped handoff/list.

M024 owns `/admin/calendar`; M013 contributes authorized appointment details and commands there but
does not create a second Admin calendar route. Final route names require Build approval.

Authenticated clients manage appointments only under `/client/appointments/...`. A future APT-007
prospect flow must deliver a short-lived one-time code out of band, submit it in a no-store POST and
immediately exchange it for a narrow HttpOnly Secure SameSite session before redirecting to a clean
URL. Ordinary state stores only the purpose-keyed verifier/digest. Bounded crash-safe M026 delivery
may use only the approved short-TTL envelope-encrypted vault object/ref; it is purged or revoked on
successful delivery, consumption, cancellation or expiry. The code is action/audience/version bound,
expires/revokes and is rate-limited. It is prohibited from path, query, fragment, Referrer, browser history, analytics,
logs, prefetch and screenshots/support tooling. No prospect management UI/route exists until that
flow, copy and threat tests are approved.

The public page is a static-first Astro shell backed by a narrow same-origin on-demand scheduling
gateway. Availability, hold, booking, management, Client and Staff payloads are dynamic
`private, no-store`; they are not ISR/static output, CDN/service-worker/offline/browser-cached or
queued offline or stored in browser-readable response/PII storage. GET/HEAD are inert. The sole
credential-free bootstrap POST accepts no booking/contact input and ignores/revokes/atomically
overwrites any ambient stale handle rather than authenticating from it. It requires exact Origin +
Fetch Metadata + bounded abuse controls, rotates fixation state and returns CSRF no-store;
every later mutation requires exact Origin and session-bound CSRF. The pre-booking host-only session contains only an opaque handle
and server-side purpose/locale/zone/type/CSRF state—never contact PII.

## 4. Public booking flow

Use one task per step with a visible progress label, back action and preserved safe values:

1. **Type/reason code:** plain-language localized choice and duration where approved; no free text.
2. **Modality:** only configured phone/video/in-person choices.
3. **Time zone:** detected suggestion plus explicit IANA named selection/confirmation.
4. **Date and time:** list-first accessible slots grouped by day; optional calendar is secondary.
5. **Your details:** minimum approved fields and language/consent.
6. **Review:** type, modality, exact date/time/zone, policy and pending prerequisites.
7. **Result:** `Confirmed` only from an M013 receipt; otherwise clearly `Request received`,
   `Payment required`, `Review required` or recovery.

A selected slot uses `Selected — not booked yet`. A hold explains expiry without false pressure or
client-side-only countdown authority. On expiry, announce the change and provide fresh slots.
Minimum details and scheduling consent first create an M020/M078-owned short-lived reservation; the
UI must never claim a Lead, Contact or appointment exists until the winning transaction finalizes it.
If that transaction fails, show a safe retry and do not imply marketing consent from scheduling.

### Authenticated client booking

The client starts only from `/client/appointments/new` inside the authenticated Next.js portal.
M007 identity/session, the exact client/service/case grant and current eligibility are established
before any type or slot metadata. The flow reuses the accessible type/modality/zone/slot/review/result
sequence, but calls the Client-specific type and availability contracts and supplies an
`authorized_client` `BookingSubjectContext`. It never bootstraps a public session, reserves a Lead/
Contact context or assumes that a public type is client-eligible. Revocation or eligibility change
at any step returns a uniform unavailable/recovery result and creates no appointment.

## 5. Slot selector

- Always provide a semantic list of buttons with full accessible names such as `Tuesday, August 18,
  2026 at 10:00 AM, Central Time`.
- Group by localized day with Previous/Next range controls; no horizontal swipe-only interface.
- Display named zone near the heading and again in review/confirmation.
- For a repeated DST time, include the distinguishing offset/standard/daylight wording.
- Disabled/busy times are omitted rather than exposing why they are unavailable.
- Loading uses stable skeleton geometry; no fake slots.
- No-availability state offers another range/type or approved callback/human path.

## 6. Client appointment list

Primary navigation remains:

1. Home
2. My Services
3. Process Status
4. Documents
5. Appointments
6. Messages
7. Payments
8. Help Center
9. Settings

The list defaults to `Upcoming`, with `Past` as a secondary tab. Each card contains:

- localized type label;
- confirmed/requested/cancelled client-safe state;
- exact date, time and named zone;
- modality and approved generic APT-001/011 type/modality copy;
- related service label when independently authorized;
- one primary action, usually `View appointment`.

Counts and tabs include only post-authorization records. Missing/incomplete sources never render a
false zero or expose another appointment through count/timing differences.

## 7. Appointment detail

Stable semantic order:

1. State banner with plain-language next step.
2. Date/time/zone and modality.
3. Approved generic APT-001/011 type/modality copy and owner-projected preparation requirements;
   appointment/client-specific instructions remain absent until APT-013.
4. Related service handoff, separately authorized by M009/M010.
5. Available actions: attendance confirmation, reschedule or cancel, only when policy receipt allows.
6. Help/recovery path.
7. Minimal change history visible to the client, if APT policy approves it.

After APT-014 only, an authenticated `Add to calendar` control may request a fresh generic ICS after
the final access fence. It is hidden for prospects and whenever current access is revoked. Copy must
say that the file is a point-in-time, non-revocable snapshot—not live sync—and contains only generic
SG Solutions appointment label, start/end/named zone and opaque UID. A download failure shows retry/
support without a provider query-link template or cached file.

Internal notes, staff calendar state, provider sync/debug state and protected reason codes are never
present in the Client DOM, hidden attributes, response cache or analytics.

## 8. Reschedule experience

The current appointment remains visibly protected while the person chooses a replacement:

- Explain `Your current appointment stays reserved until the new time is confirmed`.
- Show current time/zone and approved policy before opening fresh slots.
- If APT-005 requires a rationale, show only its current allowlisted localized reason-code choices;
  reject stale/unknown choices and never render a free-text rationale before APT-013.
- Use the same accessible slot list and review screen.
- Conflict/expiry returns fresh slots while preserving the original appointment.
- Success shows old and new public time in a bounded change confirmation.
- Do not present provider-sync completion as the booking result.

## 9. Cancellation experience

- Show the approved policy and public consequence before confirmation.
- Make clear that cancelling the appointment does not cancel the SG Solutions service.
- Optional/required rationale is an allowlisted localized reason-code choice driven by policy;
  free-text narrative is structurally absent before APT-013.
- Destructive action uses explicit label `Cancel appointment`, not `Continue`.
- After success, offer approved rescheduling or support and preserve accessible confirmation.
- If money is involved, say it will be reviewed under the payment policy; never promise refund.

## 10. State language

| Canonical fact | Client copy direction |
|---|---|
| hold active | Selected — complete booking before the hold expires |
| requested | Request received |
| pending confirmation | Waiting for SG Solutions confirmation |
| requirement pending | Action needed before confirmation |
| confirmed | Appointment confirmed |
| client attendance confirmed | You confirmed that you plan to attend |
| completed | Appointment completed |
| no-show | Appointment marked as not attended; contact us if this is incorrect |
| cancelled by client | Appointment cancelled |
| cancelled by staff | SG Solutions cancelled this appointment; choose a recovery option |
| provider sync pending/failed | Do not expose technical state; show internal appointment truth and support only if needed |

Green is reserved for durable `confirmed|completed`. Pending/selected states may use cyan/gold only as
decorative accent/background with a contrast-validated foreground plus visible text and essential
icon; they never use cyan/gold as normal text, the sole essential boundary or color-only meaning.

## 11. Prerequisites and payments

Requirements display as separate typed cards:

- `Complete intake`
- `Upload requested document`
- `Payment required`
- `Waiting for SG Solutions review`

Each card links only to its owning module and reauthorizes there. A Checkout return page, uploaded
file or completed form cannot switch the appointment UI to confirmed without the M013 receipt.

## 12. Phone, video and in-person

- Phone is the only default Release 1A modality: explain who calls, approximate authorized window and masked destination; verify identity
  during the call according to policy.
- Video: absent for public/prospect flows in Release 1A. After APT-011 and authenticated M007 access,
  a final-fenced control may request a just-in-time launch inside the approved window. The normalized
  destination must match an exact provider HTTPS origin/path allowlist. Never place the raw link in
  an SG route/query, persistent browser storage, Referrer, prefetch, email/SMS/WhatsApp reminder,
  calendar title, analytics, DOM before authorization, response/access logs, traces or support copy.
  The URL exists transiently only in secret-boundary memory and final browser handoff. Use no-store/no-referrer and
  `noopener noreferrer`; acknowledge that the provider destination may appear in browser history.
- In-person: hidden until Product Owner approves a legitimate client-facing location, hours and
  accessibility/instructions. Do not infer that a registered-agent/mail address is a meeting place.
- If a modality provider is unavailable, present approved alternate modality/reschedule/help rather
  than a broken link.

## 13. Admin/M024 contribution

M024 calendar uses responsive day/list views and receives only authorized appointment projection.
On mobile, the schedule becomes a vertical agenda; it never compresses into an unreadable desktop
grid. M024 owns this shell, M090 owns Settings placement and M013 owns appointment-type/availability
editors and commands. An appointment panel may offer:

- confirm/request review;
- reassign eligible staff only after APT-008/Release 1B; the control is structurally absent in 1A,
  and future copy explains that original assignment remains until atomic success;
- reschedule/cancel;
- mark attendance/outcome;
- create manual block;
- inspect generic provider sync health;
- open related authorized CRM/service/case owners.

The permissioned scheduling settings include localized type name, duration, buffers, modality,
prerequisites, audience/activation, working hours, holidays/vacation/emergency closure, notice/
horizon, manual blocks and staff eligibility. Configuration uses draft preview, effective date,
immutable version, review/publish, stale/unsaved-conflict recovery and no retroactive rewrite. Quick
book-on-behalf and authorized search/filter cover date, type, modality, assignee, state and client/
business context. Every override requires an allowlisted localized reason-code choice, assurance and
clear conflict warning; no free-text override rationale exists before APT-013.

Google connection management is a separate step-up-protected M090/M091/M013 panel, hidden until
APT-009 and APT-020. Meeting-provider configuration is a different panel hidden until APT-011's
complete provider-activation evidence; neither gate activates the other. These panels show only their
approved direction/scope/status, exact allowlists, disconnect impact/fail-closed warning and
reconciliation/manual-recovery state; never tokens or raw calendar/account IDs.
If a previously active provider is deactivated or in recovery, exact cleanup permission reveals only
minimum `deactivation|recovery_required` status and disconnect/revoke/cleanup actions; reconnect,
create, rotate and launch remain absent so credentials, watches, events or links are not orphaned.
Appointment/client-specific instruction, internal/client/compliance note,
summary and transcript controls
are entirely absent until APT-013; after approval their owners and DTOs stay structurally separate,
never a visibility toggle.

All admin counts/search/results are permission filtered. Mobile uses a complete list fallback;
unauthorized users cannot infer connection status, appointment types or hidden record counts.

## 14. Empty, loading, partial and error states

- **No upcoming appointments:** `You don't have an upcoming appointment.` CTA only if booking is
  currently allowed.
- **No history:** `Your completed and cancelled appointments will appear here.`
- **No availability:** offer approved alternative; never fake a slot.
- **Slot conflict:** announce that the time was just taken and move focus to fresh results.
- **Hold expired:** explain and keep safe non-sensitive fields; require a new slot.
- **Provider delayed:** keep internal appointment truth; do not expose Google errors.
- **Permission changed:** clear protected state and provide support without confirming existence.
- **Offline/unknown:** do not queue a booking command in browser storage; require authoritative retry.

## 15. Responsive behavior

### Mobile 320–767px

- One-column progressive flow, sticky primary action only when it does not obscure content/focus.
- Slot buttons use full width and at least 44px target height.
- Cards/actions stack; no horizontal calendar scroll as the sole interaction.
- Long zone/type translations wrap without truncating the decisive time.

### Tablet 768–1023px

- Booking content remains a focused readable column; optional summary beside it when space permits.
- Client list may use two columns only if reading/focus order remains logical.

### Desktop 1024px+

- Booking form and persistent review summary may form a balanced two-column layout.
- Client list/detail preserves generous whitespace and avoids dense operations dashboards.
- M024 may show calendar plus detail rail; keyboard reading order follows DOM, not visual columns.

At 200% zoom every action remains reachable without two-dimensional scrolling except an optional
data grid with an accessible alternate view.

## 16. Accessibility

- WCAG 2.2 AA for keyboard, focus visible, contrast, target size, labels, errors and status messages.
- Calendar widgets implement correct grid semantics only if used; an accessible list is always
  available.
- Dynamic slot/expiry/conflict updates use polite live regions and never steal focus unexpectedly.
- Date abbreviation is not the only time information; screen-reader labels contain the full date,
  time and named zone.
- Progress step meaning is available in text; animation and color convey no unique information.
- Error summary links focus to the first invalid field; entered values remain where safe.
- Reduced motion disables slide/scale effects and uses immediate state changes.

## 17. Bilingual content contract

Every surface ships with semantic English/Spanish parity. Translation keys cover type names,
modalities, time-zone guidance, policy summaries, progress, empty/error/recovery states,
confirmation and reminders. Before APT-010, external confirmation/reminder copy is absent. After
approval, its maximum recipient-specific payload is a generic SG Solutions appointment label plus
date/time/named zone; the meeting launch remains behind authenticated portal access. Dates use locale
formatting but keep the explicit named zone. Copy review must confirm that neither language promises
approval, provider synchronization, refund, service execution or response time.

## 18. Analytics and privacy

Before APT-016 approval, no M092/PostHog product events or session replay are emitted. M097 may
receive only independently approved content-free, identifier-free operational/security measures.

Future analytics may count coarse funnel transitions only after allowlist review. Never capture
contact fields, appointment type when sensitive, date/time, slot token, URL capability, staff,
service/case reference, meeting link, notes, payment, DOM text or free-form reason.

## 19. Component inventory for a future Build gate

- `AppointmentTypeCard`
- `TimeZoneSelector`
- `AvailabilityRangePicker`
- `AccessibleSlotList`
- `SlotHoldNotice`
- `AppointmentReviewCard`
- `AppointmentStateBanner`
- `AppointmentSummaryCard`
- `AppointmentRequirementCard`
- `AppointmentPolicySummary`
- `RescheduleFlow`
- `CancelAppointmentDialog`
- `AppointmentEmptyState`
- `AppointmentRecoveryPanel`
- `AdminAppointmentPanel`
- `AppointmentTypeEditor`
- `AvailabilityPolicyEditor`
- `SchedulingDraftPreview`
- `SchedulingPublishReview`
- `CalendarConnectionSettings` (owned jointly by the M090 shell and M013 contract)
- `MeetingConnectionSettings` (independent APT-011/provider-activation gate; never nested under or
  activated by `CalendarConnectionSettings`)
- `ClientCalendarExportAction` (absent before APT-014)

Components use design-system primitives and expose no provider-specific names unless needed in
approved user instructions.

## 20. Design acceptance checklist

- [ ] Selected, held, requested and confirmed are visually/semantically distinct.
- [ ] Every displayed time includes an unambiguous named zone.
- [ ] Accessible list path works without a visual calendar or pointer.
- [ ] Reschedule protects the original appointment until success.
- [ ] Cancellation explains service/payment separation.
- [ ] Public/client DOM contains no staff calendar, provider or other-client metadata.
- [ ] Exactly one clean M001-canonical route key per locale accepts booking steps; the separately
  localized management bootstrap is absent until APT-007, and no locale route places semantic type/
  contact/capability in URL/history/referrer.
- [ ] All actor-bound responses are no-store; the credential-free bootstrap uses Origin/Fetch
  Metadata/fixation controls, every later mutation uses Origin + CSRF and only the opaque HttpOnly
  handle persists in the browser.
- [ ] Public video is absent in 1A; authenticated launch validates exact HTTPS provider destination.
- [ ] Admin type/availability/version/publish and provider-connection UX has explicit ownership,
  permission filtering, mobile fallback and failure recovery.
- [ ] Google Calendar and meeting-provider settings are separate components with independent gates,
  permissions, connection states and recovery; enabling or disconnecting one never implies the other.
- [ ] Gate-off/incident state for a previously active provider offers only authorized minimum cleanup
  status and disconnect/revoke/stop; it cannot reconnect/create/update/rotate/launch.
- [ ] Staff reassignment is absent in 1A; after APT-008 it secures new-owner capacity before release,
  and conflict/rollback leaves the original assignment visibly unchanged.
- [ ] APT-013 appointment/client-specific instruction, note, summary and transcript controls are
  structurally absent before approval; generic APT-001/011 type/modality copy remains separate.
- [ ] APT-014 calendar export is authenticated/current-access-fenced, generic/no-store, disclosed as
  a non-revocable snapshot and has failure/revocation recovery without provider query links.
- [ ] Mobile 320px and 200% zoom preserve all actions and decisive time text.
- [ ] Focus/live-region behavior is specified for slot, expiry, conflict and confirmation changes.
- [ ] ES/EN copy is complete and equivalent.
- [ ] Reduced motion preserves all meaning.
- [ ] M013 and M024 navigation/responsibility do not create duplicate calendar products.
- [ ] Logo and approved brand tokens are used without altering the supplied mark.
- [ ] No disabled placeholder claims an unapproved provider, address, reminder, payment or AI feature.

No component or route may be implemented until the Product Owner approves the M013 requirements,
relevant `APT-*` decisions and a separate `GENERATE`/Build gate.
