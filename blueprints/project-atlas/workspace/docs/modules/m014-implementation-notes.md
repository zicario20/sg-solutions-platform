# M014 Implementation Notes

## Implemented foundation

- A dedicated billing package models server-owned obligations, integer USD minor units, account and
  context fencing, checkout idempotency and monotonic provider-event application.
- Stripe signature verification consumes the raw request body and rejects invalid or stale signatures.
- The Postgres schema uses separate quote, payment-order, transaction, invoice, refund, dispute and
  webhook-event tables. Direct client access is prohibited by the billing gateway role and RLS.
- The client payment surface and return route are bilingual, private and explicitly non-authoritative:
  neither browser return nor UI can mark a payment paid.

## Deliberately inactive

- No pricing policy, quote acceptance, payment order creation, Stripe Checkout traffic, webhook
  persistence, receipt delivery, refund processing, dispute decision, external payment review,
  subscription, tax or provider portal is activated.
- No migration has been applied and no financial record, card data, Stripe credential or provider URL
  is stored in the repository.

## Validation status

The focal Vitest command could not start because the worktree dependency linker failed with an
existing generated workspace symlink. This is environment evidence only, not proof of passing tests.
The lockfile policy check completed before that linker error.
