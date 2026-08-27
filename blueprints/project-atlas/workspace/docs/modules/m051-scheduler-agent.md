# M051 - Scheduler Agent

## Status

- Technical foundation: implemented and provider-disabled.
- Product Owner acceptance: pending.
- Production activation: not approved.
- Database migration: prepared as 0061_m051_scheduler_agent_controlled_foundation.sql; not executed.

## Purpose

M051 guides a scheduling interaction. It does not own appointment records, calendar state, or
provider credentials. M013 remains the authoritative owner for client appointments and M024
remains the authoritative owner for internal calendar and availability state.

## Implemented controlled contracts

- Versioned configuration, minimal sessions, explicit time-zone resolution, and booking-request
  contracts.
- Deterministic precondition assessment for appointment type, current availability, identity,
  ownership, prerequisites, and time-zone confirmation.
- Opaque slot-token references only; a displayed slot is never a booked appointment.
- Prepared client-safe human handoffs with no dispatch capability.
- Reference-only schema, idempotency keys, audit metadata, and a non-executed additive migration.
- Runtime response that is always disabled and performs no writes, provider calls, notification
  dispatch, hold, booking, reschedule, cancellation, waitlist, conference, or AI operation.

## Canonical ownership

| Concern | Owner | M051 behavior |
| --- | --- | --- |
| Agent registration and tools | M047 | References policies only |
| Reception intent | M049 | Consumes prepared scheduling handoffs only |
| Intake prerequisites | M050 | Consumes canonical references only |
| Appointments | M013 | Remains authoritative |
| Calendar and availability | M024 | Remains authoritative |
| Notifications | M025/M026 | M051 never dispatches |
| Payment and entitlement gates | M044/M045 | M051 never determines them |
| Provider adapters | M041 | No vendor SDK is introduced |

## Activation prerequisites

Product Owner approval is required before activation, together with M013/M024 canonical contract
evidence, server-side authorization, time-zone/DST tests, provider-adapter security review,
idempotency and reconciliation evidence, notification/consent policy evidence, migration backup
and rollback evidence, and an independent security review.
