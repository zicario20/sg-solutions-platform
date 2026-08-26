# M044 - Payment Verification

- Owner: Product Owner
- Status: Controlled technical foundation complete; Product Owner acceptance pending
- Runtime state: Provider disabled
- Last updated: 2026-08-26

## Purpose

M044 is the provider-neutral financial verification boundary. It turns bounded provider or
reconciliation evidence into an immutable SG Solutions payment-verification decision. M043 may
produce evidence candidates, but neither M043, a browser return, an amount coincidence, a client
message nor AI can confirm payment.

## Authority boundaries

| Concern | Canonical owner |
| --- | --- |
| Offer, payment/deposit requirement and service version | M042 Service Catalog |
| Price, fee, discount, schedule and immutable price snapshot | M046 Pricing |
| Provider objects and signed Stripe evidence | M043 Stripe Payments |
| Verified payment fact, sufficiency and payment-start gate | M044 Payment Verification |
| Human service-start approval | M024 and M074 |
| Client entitlement grant, use, revocation and expiry | M045 |
| Commercial and operational workflow state | M020B and M068 |
| Audit, consent, secrets and security incident policy | M077, M078, M083 and M089 |

## Implemented controlled foundation

- Provider-neutral contracts for payment obligations, candidates, evidence, policies, verification
  cases, immutable/superseding decisions, rule evaluations, sufficiency, payment-start gates,
  manual-review queues, override proposals, inbox/outbox, audit events and dormant downstream
  handoffs.
- A deterministic engine validates provider/environment identity, object relationships, client and
  service-order ownership, amount, currency, verified event state and evidence freshness.
- Amounts use non-negative integer USD minor units. Deposit, installment, partial payment,
  overpayment, refund, dispute and reversal facts remain distinct.
- Every effective decision has an idempotency key based on obligation, provider state version,
  policy version and evidence hash. Replays return the original decision.
- Refund, dispute and reversal outcomes create new decisions that supersede, but never alter or
  delete, earlier decisions.
- The M043 adapter maps Stripe evidence only to limited, unknown-freshness M044 candidates. It
  cannot by itself produce a verified-paid decision.
- A payment-start gate can reach only payment_satisfied_pending_human_approval. It never approves
  start, grants an entitlement or starts a workflow.
- Drizzle schema and migration 0054 are authored only and deny all rows by default.

## Security and compliance invariants

- Required evidence checks include client, obligation, transaction/service-order and provider
  environment mapping. Matching an amount alone is insufficient.
- Processing, required-action, missing, stale, conflicting or unknown evidence cannot count as paid.
- Manual external evidence always requires a manual review; overrides are proposals requiring a
  separate approval reference and never mutate a decision.
- AI is blocked from verification, amount changes, payment gates, overrides, entitlement grants and
  service starts.
- No raw provider payload, card data, PAN, CVV, secret, signed URL or client payment details are
  placed in M044 DTOs, audits or schema fields.
- Client summaries omit raw evidence, provider object references and internal review data.

## Runtime and activation gate

The pure domain engine is testable, but all runtime ingress, provider retrieval, automatic
verification, M045 entitlement handoff and M068 workflow handoff are disabled.

Activation requires all of the following:

1. Product Owner approval of the active policy, proof thresholds, refund/dispute behavior,
   manual-review roles and separation-of-duties thresholds.
2. M043 signed ingress and current-object retrieval, M046 price snapshots, M045 entitlement
   policy, M024/M074 approval policy, M077 audit, M078 consent and M083 secrets integration.
3. Migration 0054 review, backups, non-production execution, production-role RLS evidence and a
   tested rollback/recovery procedure.
4. Sandbox tests for duplicate and delayed events, stale evidence, refunds, disputes, reversals,
   partial/overpayment, manual evidence, policy change, concurrency and outage recovery.
5. Independent financial/security review and a Product Owner rollout decision.

## Explicit non-goals

M044 does not activate Stripe, call a provider, retrieve a live object, apply a migration, create a
checkout, collect payment, alter prices, issue a refund, start a service, grant/revoke an
entitlement, make a human approval, dispatch an outbox event, deploy an environment or represent
Product Owner acceptance.
