# M013 Client Appointments Runbook

## Status

Core implementation evidence only. M013 is not deployed, migrated, provider-active or accepted by
the Product Owner.

## Safe enablement prerequisites

1. Obtain Product Owner approval for the applicable `APT-*` decisions in the M013 PRD, especially
   appointment types, business hours, cancellation policy and reminders.
2. Generate and review the Drizzle migration from `packages/database/src/schema/appointments.ts`.
   Take and verify a database backup before applying it. Drizzle remains the schema authority.
3. Provision only the `atlas_appointment_gateway` database role and verify real RLS policies with
   integration tests. Do not grant browser, public API or provider accounts direct table access.
4. Configure `DATABASE_URL`, the existing M007 dashboard/auth secrets and
   `M013_APPOINTMENTS_ENABLED=true` in the protected server environment. Do not expose these values
   to client JavaScript.
5. Configure appointment types and availability windows through a future authorized internal M024/M090
   workflow. Do not seed pretend availability for a production launch.

## Operational invariants

- Postgres appointment records are the source of truth. Google Calendar and other providers are
  projections only.
- Every booking and reschedule first consumes a short-lived, account/context/authorization-bound
  hold. The booking result, not the displayed slot or external event, is the only confirmation.
- Mutations require the authenticated M007 session, exact context, exact origin and the session-bound
  CSRF token. API responses are private and no-store.
- Hold expiry is evaluated at command time. A future M072 worker may mark stale active holds as
  expired; it must not confirm or recreate an appointment.
- The `appointment_handoff_outbox` only requests a projection or notification. M024/M026/provider
  failures must be retried or recovered manually without changing the appointment result.

## Failure handling

- If availability is unavailable, retain the current appointment and show a safe support route; do
  not display static or provider-guessed times.
- If a booking or reschedule loses the capacity race, return unavailable. For a reschedule, the old
  appointment remains intact.
- If an outbox consumer fails, retain the pending row and investigate using the appointment audit
  event. Do not manually edit an appointment to make a provider display look correct.
- If authorization or context changes, reject old holds and require a fresh authenticated flow.

## Provider activation boundary

Calendar projection, video/phone meeting delivery, reminders, public booking, payments and staff
workspace configuration are deliberately disabled. Activating any of them requires its owning module
gate, provider-specific security review, rollback plan and Product Owner approval.
