# M052 Customer Support Agent Runbook

## Current mode

M052 is provider-disabled and non-operational. It may not read private client data, create a support
case, send a message, attach a document, invoke a workflow, or claim that an owner-module action
completed.

## Safe behavior

- Require authenticated identity and owner-scoped authorization for private support.
- Treat stale, unavailable, conflicting, or unknown information as unknown.
- Use M051 for appointment issues, M050 for intake, and the named specialist for domain work.
- Escalate privacy, security, high-risk, or cross-domain issues to the correct human/compliance/supervisor path.
- Never disclose internal notes, credentials, attachment bytes, payment details, or private reasoning.
- Never treat a refund, cancellation, correction, or complaint request as an approved outcome.

## Future activation checklist

1. Product Owner activation approval and M047 tool release are recorded.
2. Client-safe projections and server-side identity/ownership/step-up adapters are verified.
3. Messaging, document, payment, workflow, and specialist owner contracts are approved.
4. Support-case retention, RLS, audit, idempotency, reconciliation, and escalation evidence is complete.
5. The migration has backup, rollback, and execution approval.
