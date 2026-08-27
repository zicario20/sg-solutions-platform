# M051 Scheduler Agent Architecture

## Decision

M051 is scheduling behavior over authoritative owners. It has no parallel calendar, appointment
store, provider SDK, or confirmation authority.

    M049 prepared scheduling intent
      -> M051 minimum scheduler session
      -> M013 appointment type and appointment authority
      -> M024 current availability authority
      -> precondition and time-zone checks
      -> prepared booking request or human handoff
      -> M013/M024 authoritative result in a future activated adapter

## Boundaries

- A slot reference is opaque and is not a hold, booking, or confirmation.
- A booking request is prepared only; M051 never creates an authoritative appointment.
- Time zones from a device hint or calendar policy require explicit confirmation before booking.
- Ownership, identity, consent, payment, entitlement, intake, capacity, and policy checks remain
  server-side owner responsibilities.
- M051 does not send reminders, create conferences, calculate cancellation fees, issue refunds,
  assign hosts, or approve exceptions.
- Provider-specific code remains behind M041/M024 adapters.

## Persistence

The authored schema stores only references, policy/version metadata, idempotency keys, client-safe
handoff summaries, runtime state, and audit evidence. It stores no provider token, calendar ID,
raw calendar event, conference secret, participant list, or private reasoning.

## Future adapter shape

A separately approved runtime can use owner-port adapters for M013 appointment commands, M024
availability and calendar reconciliation, M025/M026 notifications, M044/M045 prerequisites, M078
consent, and M041 provider capabilities. Every mutation must revalidate current policy,
authorization, ownership, freshness, capacity, and idempotency before sending an owner command.
