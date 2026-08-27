# M049 Reception Agent Runbook

## Current safe state

All M049 switches are false. The module can validate its contracts and prepare reference-only
decisions in code, but no public channel, model, provider, CRM write, secure-link issuance, handoff,
follow-up, migration, or deployment behavior is active.

## Disabled flags

- M049_RECEPTION_AGENT_ENABLED
- M049_RECEPTION_PROVIDER_CALLS_ENABLED
- M049_RECEPTION_LEAD_WRITES_ENABLED
- M049_RECEPTION_SECURE_LINK_ISSUANCE_ENABLED
- M049_RECEPTION_HANDOFF_DISPATCH_ENABLED
- M049_RECEPTION_FOLLOW_UP_ENABLED

## Safe handling

- Do not request or accept SSNs, EINs, card numbers, bank details, passwords, credentials, tax
  returns, credit reports, or documents on a public channel.
- Do not treat a lead request, secure-link request, appointment handoff, or route as completed.
- Do not disclose whether an account, case, payment, document, appointment, or client exists before
  authentication and authorization by its owner module.
- Do not enable an M049 flag to bypass M047/M048, consent, authorization, ownership, or a human
  review boundary.

## Future incident response

For sensitive-data detection, malicious input, public-source failure, stale policy, wrong handoff,
duplicate request, invalid consent, runtime degradation, or a future provider error: block the
operation, retain the audit chain, avoid retrying an external action automatically, present the
configured safe fallback, and route to the authorized human or owner-module queue after review.
