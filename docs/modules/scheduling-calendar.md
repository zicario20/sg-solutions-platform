# Module PRD — Scheduling and Google Calendar Integration

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M013, M024

## 1. Purpose

Provide a narrow SG Solutions booking engine that owns appointment state and safely synchronizes
busy/appointment projections with Google Calendar.

## 2. Business value

Let prospects/clients book reliable evaluations while preventing double booking and preserving a
manual path when Google or automation fails.

## 3. Scope

Appointment types; staff availability; IANA time zones; manual blocks; buffers; slot derivation;
public/client booking; cancellation; rescheduling; no-show recording; concurrency protection; Google
OAuth mapping, event write/read, recurring busy events, webhooks/incremental sync, reconciliation,
staff override, reminders and audit.

## 4. Explicit out of scope

A full Calendly replacement, group events, round-robin teams, resource/room scheduling, paid
calendar subscriptions, arbitrary recurrence creation, automated professional advice and Google as
the operational source of truth.

## 5. Actors

Anonymous prospect with consent, authorized client, Owner/authorized staff, Google Calendar adapter,
scheduler/reconciliation worker and support recovery operator.

## 6. User journeys

1. Staff configures an appointment type, duration, location/channel and availability.
2. Visitor/client selects locale/time zone and receives currently derived slots.
3. Booking transaction reserves exactly one slot and records the appointment in Postgres.
4. Google projection is created asynchronously and conflicts are reconciled.
5. User cancels/reschedules within policy; the old slot and external event are updated safely.
6. Staff adds a manual block/override, records no-show or resolves a sync failure.

## 7. States and transitions

- Appointment: `tentative → confirmed → completed|cancelled|no_show`; `confirmed → rescheduling →
  confirmed` creates an immutable change record.
- External sync: `not_required|pending → synced → stale|failed → reconciling → synced|manual_action`.
- Availability block: `active → cancelled|expired`.
- A booking hold expires automatically and cannot transition to confirmed after its slot is taken.

## 8. Business rules

- Store instants in UTC and retain the chosen IANA zone plus source local time for audit/display.
- Slot derivation intersects appointment-type duration, working windows, buffers, manual blocks,
  existing internal appointments and known external busy periods.
- Daylight-saving gaps produce no invalid slot; ambiguous repeated times are resolved explicitly and
  shown with zone/offset.
- Confirmation uses a database uniqueness/exclusion invariant or equivalent serializable lock; UI
  availability is advisory.
- Postgres owns appointment state. Google events are projections and cannot silently cancel or
  create an SG appointment.
- Staff override requires permission, reason and conflict warning/audit.

## 9. Authorization rules

Public booking can only create bounded evaluation types and cannot list staff calendar details.
Clients may view/cancel/reschedule only granted appointments linked to their membership/case. Staff
configuration/override needs schedule permission. Google tokens are restricted to the integration
service and never exposed to users/logs.

## 10. Data requirements

AppointmentType, duration, buffer before/after, allowed channel/location, staff owner, availability
rule/window, IANA zone, manual block, booking hold/expiry, Appointment instant/zone/status/version,
attendee/client/lead link, cancellation/no-show reason, external calendar/account/event IDs, ETag,
sync token/cursor, webhook/channel metadata, reconciliation status, idempotency key and audit.

Recurring external events are stored as bounded busy projections or expanded instances for the
configured scheduling horizon; raw unrelated event content is not retained.

## 11. API or service contracts

- `AvailabilityService.listSlots(actorContext, appointmentTypeId, range, viewerZone)`.
- `BookingService.reserve(input, idempotencyKey) → Appointment` in one conflict-safe transaction.
- `BookingService.cancel(actor, appointmentId, expectedVersion, reason)`.
- `BookingService.reschedule(actor, appointmentId, targetSlot, expectedVersion, idempotencyKey)`.
- `ScheduleAdminService.setAvailability|createBlock|overrideConflict`.
- `GoogleCalendarAdapter.upsertEvent|cancelEvent|getBusy|syncChanges|refreshCredential`.
- `CalendarReconciliationService.reconcile(accountId|appointmentId)`.

## 12. Events and background jobs

`appointment.held`, `appointment.confirmed`, `appointment.cancelled`,
`appointment.rescheduled`, `appointment.no_show`, `calendar.sync_requested`,
`calendar.sync_failed`, `calendar.conflict_detected` and `calendar.reconciled`. Jobs expire holds,
send consented reminders, renew webhook channels, perform incremental/full reconciliation and
surface exhausted retries. Every job has an idempotency key, retry cap and manual route.

## 13. Error states and recovery

Slot taken during checkout, hold expired, DST-invalid time, stale appointment version, external busy
conflict, duplicated/delayed webhook, expired Google access/refresh token, invalid sync token,
recurring-event change, API quota/outage and local/external mismatch. Booking conflicts return 409
with fresh slots. Google failure leaves the internal appointment valid but flagged, blocks unsafe
external assumptions and creates a recovery task. Invalid sync token triggers bounded full resync.

## 14. Security and privacy requirements

OAuth tokens in approved secret/encrypted storage; least Google scope; signed/validated callbacks;
no event titles/descriptions from unrelated calendars in telemetry; rate limits; consented reminders;
audit of bookings, cancellations, overrides and credential changes; RLS/case-grant enforcement;
provider tokens redacted; independent security review.

## 15. UX and accessibility requirements

Slots display date, time and named zone; time-zone change updates them predictably. Keyboard and
screen-reader users can select a slot without a visual-only calendar. Error/conflict recovery
preserves entered contact data safely and offers fresh slots. Cancellation/reschedule copy explains
effect before confirmation. Mobile, 200% zoom, focus, target size and reduced motion meet WCAG 2.2 AA.

## 16. Bilingual requirements

Appointment names/descriptions, zone guidance, confirmation, reminders, cancellation, rescheduling,
no-availability and recovery messages require approved English/Spanish parity. Stored status/reason
codes remain locale-neutral.

## 17. Acceptance criteria

- Concurrent attempts for the same staff/time produce at most one confirmed appointment.
- DST gaps/overlaps never create an appointment at a different unintended local time.
- Buffers and manual blocks remove conflicting slots.
- Duplicated/out-of-order Google notifications do not duplicate or regress internal state.
- Expired sync tokens trigger deterministic reconciliation; expired credentials create manual action.
- Rescheduling is atomic: it cannot lose the original appointment without securing the new slot.
- External recurring busy events block the correct instances within the configured horizon.

## 18. Negative acceptance criteria

- No client sees external calendar titles, attendees or unrelated details.
- No Google event is treated as sole proof of an internal appointment.
- No staff override occurs without permission, reason and audit.
- No cancellation/reschedule rule is invented by implementation.
- No attempt to reproduce every Calendly feature in Release 1.

## 19. Dependencies

Identity/Access, lead/consent, case management, audit/activity, notification consent, provider
abstraction, Inngest/Postgres job model, Google OAuth security and data classification.

## 20. Risks

DST errors, race conditions, provider drift, token expiry, quota outages, webhook loss/duplication,
recurrence expansion bugs and staff override abuse. Mitigate with internal authority, transactional
booking, version checks, bounded horizons, reconciliation and manual recovery.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve Release 1A appointment types, durations, buffers and
  booking horizon.]
- [NEEDS PRODUCT OWNER DECISION: approve cancellation/rescheduling windows and late/no-show policy.]
- [NEEDS PRODUCT OWNER DECISION: decide which external Google calendars contribute busy time.]
- [NEEDS PRODUCT OWNER DECISION: approve reminder timing/channels and required communication consent.]
