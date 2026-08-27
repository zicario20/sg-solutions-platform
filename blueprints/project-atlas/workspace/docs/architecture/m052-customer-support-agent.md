# M052 Customer Support Agent Architecture

## Decision

M052 is authenticated operational support, not a universal agent. It consumes only client-safe
owner projections and never upgrades a client claim, cached summary, or AI inference into an
authoritative mutation or result.

    authenticated client and ownership context
      -> client-safe support session
      -> issue classification and explicit routing
      -> owner-module read or prepared request in a future activation
      -> authoritative owner result
      -> client-safe explanation

## Boundaries

- M049 owns unauthenticated reception; M050 owns intake; M051 owns scheduling behavior.
- M053-M060 retain specialist and compliance decisions.
- M012/M025/M026 own messaging and notifications; M011/M058 own attachments.
- M043/M044/M046 own payments, verification, refunds, and pricing.
- M068 owns workflow transitions and M22 owns professional case files.
- Stale or unavailable sources remain unknown. No false payment, document, booking, or completion status is generated.
- All private reads and writes require owner authorization in a future runtime. The foundation performs neither.

## Persistence and future adapter shape

The prepared tables store opaque references, status, policy/version metadata, idempotency context,
and audit evidence only. They exclude private transcripts, attachment bytes, payment details,
secrets, internal notes, and private reasoning.

An activated adapter must revalidate identity, tenant, client/resource ownership, representative
scope, purpose, current source freshness, entitlement, approval, and workflow stage server-side
before invoking an owner module.
