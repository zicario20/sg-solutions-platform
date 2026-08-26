# M043 - Stripe Payments

- Owner: Product Owner
- Status: Controlled technical foundation complete; Product Owner acceptance pending
- Runtime state: Provider disabled
- Last updated: 2026-08-26

## Purpose

M043 provides the Stripe-facing payment boundary for SG Solutions. It models payment-provider
objects, preserves evidence, protects the PCI boundary, and produces verification candidates for
M044. It does not verify payment, calculate price, start a service, grant an entitlement, issue a
provider refund, or activate a Stripe account.

## Ownership boundaries

| Concern | Canonical owner |
| --- | --- |
| Service definition, version and offer reference | M042 Service Catalog |
| Authoritative price, discount, fee, deposit and currency snapshot | M046 Pricing |
| Provider-facing payment object and signed event evidence | M043 Stripe Payments |
| Payment verification decision | M044 Payment Verification |
| Client entitlement grant or revocation | M045 Entitlements |
| Commercial and operational workflow transitions | M020B and M068 |
| Consent, audit, approval and secrets policy | M078, M077, M024 and M083 |

## Implemented controlled foundation

- Typed contracts for Stripe account profiles, API-version policies, credential references,
  customer mappings, checkout sessions, payment/setup intents, payment-method references,
  invoices, installment snapshots, refunds, disputes, event inbox records, dead letters,
  reconciliation, audit records and client/admin DTOs.
- Server-side checkout preparation accepts only a catalog reference from M042 and an immutable
  pricing snapshot from M046. Monetary amounts are integer USD minor units.
- Checkout plans are idempotent and use approved application-relative redirect profiles. No
  browser amount, discount, URL or service-state transition is authoritative.
- The Stripe adapter is deliberately fail-closed. Its capabilities are false and every attempted
  external provider operation rejects.
- Inbound event evidence is deduplicated by environment and provider event identifier. A
  normalized Stripe event can create only a PaymentVerificationCandidate for M044.
- Refund requests require an approval reference and remain awaiting approval. They do not submit a
  provider refund, cancel a service, or mutate entitlement state.
- Signature verification uses raw request bytes, a bounded timestamp window and supports a
  rotated signing secret when ingress is later enabled.
- Drizzle schema and migration 0053 are authored only. They use RLS and start deny-by-default.

## Runtime and user experience

The existing client payments and payment-return pages remain honest provider-disabled surfaces in
English and Spanish. They do not show a successful charge, create checkout, store a card, or
start service execution. The payment-return page is not a verification authority.

No public Stripe route, client checkout, payment method setup, invoice delivery, billing portal,
subscription, refund, dispute response, webhook persistence or reconciliation job is active.

## Security invariants

- Never store PAN, CVV, raw card data, provider client secrets, webhook secrets, complete signed
  URLs or raw payloads in business records or logs.
- Persist credential references only. Runtime secrets remain outside the repository and database.
- Test and live environments are separate in every provider object and event key.
- Webhook processing requires bounded raw bytes, Stripe signature verification, event deduplication
  and durable inbox handling before any later candidate projection.
- Provider evidence is not payment verification. Only M044 may confirm payment facts.
- Payment facts do not start sensitive work. Human approval and workflow gates remain separate.
- AI cannot create checkout, change prices, issue refunds, mark payment verified, resolve a
  dispute, or activate the provider.

## Readiness and activation gate

M043 must remain disabled until all of the following are approved and evidenced:

1. Product Owner authorizes a Stripe environment, account profile, products, payment methods and
   rollout scope.
2. M046 produces approved pricing snapshots and M044 verification is implemented and reviewed.
3. M045, M024, M077, M078 and M083 integration contracts are ready for entitlements, approvals,
   audit, consent and secrets.
4. Migration 0053 is reviewed, backed up, executed in a non-production environment and validated
   with actual RLS evidence.
5. Restricted Stripe credentials and current/previous webhook signing secrets are provisioned
   outside Git with rotation evidence.
6. Checkout, webhook, replay, delayed-event, refund, dispute, reconciliation, recovery, load,
   accessibility and incident-response tests pass in an approved sandbox.
7. An independent security review and rollback plan are completed.

## Explicit non-goals

M043 does not activate Stripe, create a Stripe account, create a product or Price, collect a
payment, perform a refund, receive a live webhook, apply a migration, connect a billing portal,
create subscriptions, send a receipt, deploy an environment, or represent Product Owner
acceptance.
