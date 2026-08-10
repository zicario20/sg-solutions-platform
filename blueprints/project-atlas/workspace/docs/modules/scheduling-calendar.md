# Scheduling and Calendar — Capability Boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Documentary umbrella; no Build gate
- Catalog modules: M013 Client Appointments and M024 Internal Calendar

This file preserves the shared scheduling boundary. The dedicated
[M013 Client Appointments PRD](m013-client-appointments.md) is authoritative for appointment types,
availability, holds, bookings, appointment lifecycle, public/client projection, Google Calendar
adapter and reconciliation. A future M024 PRD will be authoritative for the internal calendar
workspace, multi-domain calendar display, staff agenda and operational navigation.

## Ownership

| Capability | Owner |
|---|---|
| Appointment type and policy version | M013 |
| Availability derivation, buffers, closures and appointment blocks | M013 |
| Hold, request/pending confirmation, reschedule, cancel, attendance and structured outcome | M013 |
| Client/Public appointment query and management | M013 |
| Google per-source busy input, appointment projection and reconciliation | M013 behind `CalendarProvider` |
| Meeting projection and just-in-time launch | M013 behind `MeetingProvider`; inactive by default |
| Internal calendar/agenda UI and cross-domain display | M024 |
| Task/deadline state shown in the calendar | M023 and applicable owner; M024 projects only |
| Reminder delivery and contact preferences | M026 |
| Payment prerequisite | M014/M043–M045 |
| Lead/CRM activity | M017/M020 |
| Public scheduling-purpose prospect/consent reservation | M020/M078; finalized with M013 commit |
| Audit, retention and reporting | M077, M085 and M092 respectively |

M024's R1.3 task/agenda shell can operate without M013. Only after the later R1.5 M013 capability is
approved/active may M024 call its command/query ports and render its authorized projection; M024
cannot write appointment rows or redefine availability.
M003–M006/M012 use the same M013 ports and cannot create channel-specific agendas.

## Shared invariants

- Postgres is scheduling authority; Google is a minimized, rebuildable projection.
- Instants use UTC plus source wall time, IANA zone and resolved offset evidence.
- DST gaps/overlaps, buffers, holds and concurrent confirmations are backend/database concerns.
- Public/Client/Staff DTOs are structurally separate and disclose no unrelated calendar facts.
- Public runtime is a static-first shell plus least-privilege gateway; actor-bound responses are
  private/no-store and browser mutations require exact Origin plus CSRF.
- Booking, payment, intake, service authorization, attendance and provider-sync states remain separate.
- Each admitted external calendar has independent cursor/coverage; incomplete/stale/restore state
  fails closed. Provider projections default to zero attendees and suppressed provider mail.
- Inngest coordinates idempotent retry/reconciliation but owns no durable scheduling state.
- Release 1A is a narrow production foundation, not a disposable Calendly clone.

## Active documentary authority

- `docs/modules/m013-client-appointments.md`
- `docs/adr/017-appointment-authority-availability-concurrency-and-calendar-projection.md`
- `docs/superpowers/specs/2026-08-09-m013-client-appointments-design.md`
- `EXTERNAL_ACTIVATION_REGISTER.md` entries `APT-001`–`APT-020`

No route, schema, calendar, OAuth credential, webhook, provider traffic or real appointment is
authorized by this umbrella.
