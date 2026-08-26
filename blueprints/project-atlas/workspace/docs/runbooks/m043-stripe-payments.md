# M043 Stripe Payments Runbook

- Status: Provider disabled
- Last updated: 2026-08-26

## Current operating mode

M043 is not connected to Stripe. M043_STRIPE_PAYMENTS_ENABLED and
M043_STRIPE_WEBHOOK_INGRESS_ENABLED must remain false. The StripePaymentAdapter rejects every
operation. No Stripe credential value, checkout session, payment intent, invoice, refund, billing
portal, subscription, webhook event, reconciliation job or migration is active.

## Emergency containment

If any payment behavior is suspected:

1. Keep both M043 flags false.
2. Keep M014_PAYMENTS_ENABLED false.
3. Do not retry provider calls from a shell, browser, script or AI tool.
4. Preserve only non-sensitive incident metadata and open a human security/finance review.
5. Do not mark any order paid, refunded, completed or started from a browser return, screenshot,
   support claim or unverified webhook.

## Future activation checklist

Before a sandbox activation:

1. Product Owner approves the Stripe account, country/jurisdiction scope, payment methods,
   checkout copy, refunds, disputes, receipts, subscriptions and customer portal policy.
2. M046, M044, M045, M024, M077, M078 and M083 integration gates are implemented and reviewed.
3. Migration 0053 is backed up, tested, reviewed and applied only in a non-production environment.
4. The environment has distinct test account and webhook secret references. No secret value is
   committed, copied into tickets or exposed in logs.
5. The event inbox, idempotency, dead-letter, replay authorization, reconciliation and audit
   paths have integration evidence.
6. Security validates raw-body signature verification, secret rotation, body limits, replay,
   out-of-order delivery, IDOR, CSRF, redirect allowlists and RLS.
7. Finance validates amount/currency matching, refund approvals, invoice/receipt policy, disputes
   and reconciliation.
8. Product Owner approves a bounded sandbox rollout and rollback owner.

## Future webhook procedure

When explicitly activated, accept a webhook only after:

1. Verifying the raw byte body and Stripe signature with the current or rotating previous secret.
2. Rejecting oversize, unsigned, stale or invalid requests.
3. Saving a minimal event-inbox record with environment, provider event identifier, event type,
   payload digest, timing and correlation reference.
4. Deduplicating before business processing.
5. Creating an M043 evidence candidate, not a verified payment.
6. Sending the candidate to M044 through a versioned, idempotent contract.

## Future recovery and rollback

- Pause Stripe ingress before replaying or changing credentials.
- Inspect dead-letter entries and reconciliation findings without logging raw payloads or secrets.
- Replays require a documented operator, reason, idempotency key and audit record.
- Rotate secrets outside the repository. Maintain current and previous signing-secret references for
  a controlled overlap period.
- A provider outage or unknown result remains unconfirmed until reconciliation and M044 review.
- Do not use a rollback to mutate historical payment evidence or erase refund/dispute records.
