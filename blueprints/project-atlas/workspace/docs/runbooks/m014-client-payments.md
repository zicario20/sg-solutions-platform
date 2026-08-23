# M014 Client Payments and Billing Runbook

## Current mode

M014 is provider-disabled. `M014_PAYMENTS_ENABLED=false` and
`M014_STRIPE_CHECKOUT_ENABLED=false` are required defaults. No checkout, payment, invoice, refund,
dispute or webhook processing is active in this mode.

## Activation prerequisites

1. Product Owner approves service-price, quote, deposit, refund, external-payment and tax policies.
2. Drizzle migration and RLS evidence are reviewed against a non-production database.
3. Stripe restricted credentials and per-environment webhook secrets are injected outside the repository.
4. Stripe Checkout success and cancel paths are verified to be inert; only a signed webhook may record
   a provider payment fact.
5. A finance role reviews reconciliation, refund and dispute queues.

## Security invariants

- Card data, PAN, CVV, provider client secrets and complete checkout URLs are never persisted or logged.
- Amounts are integer minor units from a server-owned obligation snapshot.
- Each payment order is scoped to an account, active context and authorization/policy epochs.
- A provider payment fact cannot approve or start a service. Human internal approval remains separate.
- Stripe signatures are evaluated against the raw body and a short timestamp window before parsing.
- Duplicate provider event identifiers are idempotent; delayed events cannot regress a paid state.

## Incident response

- Invalid webhook signature: return a generic client-safe rejection, retain no payload and investigate the
  environment secret outside application logs.
- Provider outage or delayed webhook: keep the obligation unconfirmed or processing; never mark it paid
  from a browser return, support claim or screenshot.
- Reconciliation mismatch, refund or dispute: create a finance-review record. No agent or automated
  workflow may change price, issue a refund or waive an obligation.

## Deferred decisions

- [NEEDS PRODUCT OWNER DECISION: price publication, quote acceptance, deposits and payment-plan rules]
- [NEEDS PRODUCT OWNER DECISION: refund approval thresholds and allowed reasons]
- [NEEDS PRODUCT OWNER DECISION: external payment evidence and reviewer policy]
- [NEEDS PRODUCT OWNER DECISION: Stripe Customer Portal, subscriptions and tax activation]
