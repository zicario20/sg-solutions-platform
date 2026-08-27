# M051 Scheduler Agent Runbook

## Current mode

M051 is provider-disabled and non-operational. Do not represent a slot, hold, booking request,
reschedule request, cancellation request, waitlist request, or agent statement as a confirmed
appointment.

## Safe behavior

- Request an explicit time zone when a verified profile preference is unavailable.
- Use only opaque references and client-safe summaries.
- Hand off to a human scheduler when availability, ownership, prerequisites, policy, accessibility,
  or provider state cannot be verified safely.
- Preserve an existing appointment record; never create a replacement appointment locally.
- Do not request or disclose calendar credentials, private host calendars, participant details,
  conference links, payment information, or sensitive case data.

## Security escalation

Escalate with minimal evidence for cross-client scheduling requests, expired or leaked management
tokens, timezone ambiguity for a material booking, attempted authorization bypass, alleged booking
confirmation without an M013/M024 authoritative result, or provider/calendar security incidents.

## Future activation checklist

1. Product Owner activation approval and M047 tool release are recorded.
2. M013/M024 owner contracts and reconciliation behavior are verified.
3. Time-zone, DST, ownership, entitlement, consent, capacity, concurrency, and idempotency tests pass.
4. M041 provider adapters and M025/M026 delivery paths have independent security evidence.
5. Migration backup, rollback, execution, and RLS evidence are approved.
6. All M051 flags are changed only through an approved controlled change.
