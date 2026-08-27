# M049 - Reception Agent

## Status

M049 is implemented as a controlled, provider-disabled reception foundation. Product Owner
acceptance, operational release, provider activation, CRM writes, secure-link issuance, channel
dispatch, and deployment remain pending.

## Scope implemented

- A bilingual public-reception contract for bounded channels, stages, locale, anonymous/authenticated
  posture, deterministic intent classification, and client-safe routing decisions.
- Data-minimizing sessions, interaction digests, lead-capture requests, secure-link requests,
  handoff packages, human-transfer records, outbox/audit/finding/incident contracts, and RLS schema.
- A deterministic classifier that detects sensitive public input and prompt-injection-like text,
  then selects secure-channel or human-review handling without retaining visitor message content.
- Prepared-only handoffs to M050 Intake, M051 Scheduling, M052 authenticated support, M048
  Supervisor, or a human queue. A prepared handoff is not dispatch authority.
- M047 manifest binding, M048 minimized supervisor-envelope conversion, tool allowlisting,
  governance controls, tamper-evident audit events, migration, tests, documentation, and flags.

## Boundaries

M049 reuses the existing public-chat surface as an ingress surface; it does not replace M003 public
chat, M020 CRM, M022 forms, M013/M051 appointments, M011 documents, M043 payments, M048
supervision, or future M050/M052 agent owners. It does not collect raw sensitive data, create a
lead, send a message, schedule a meeting, issue a URL, access a case, confirm payment, quote,
approve, grant an entitlement, or execute a workflow.

The only permitted current behavior is deterministic classification and preparation of bounded,
reference-only requests. Model calls, provider calls, egress, CRM writes, secure-link issuance,
handoff dispatch, and follow-up are disabled.

## Future activation prerequisites

1. Product Owner approval for a reviewed M047 manifest, M049 policy, public knowledge source,
   channel policy, human queue, data retention, consent, rate-limit, and fallback policy.
2. M050/M051/M052 owner contracts and availability evidence for any direct handoff target.
3. CRM, appointment, document, payment, and secure-link adapters with authorization, idempotency,
   audit, RLS, sandbox, operational support, rollback, and independent security evidence.
4. Staging simulations for English and Spanish public flows, sensitive-data rejection, cross-channel
   continuity, human handoff, expired requests, duplicate commands, and service degradation.
