# M046 Pricing, Discounts, and Promotions

## Current status

M046 is a controlled technical foundation. It is not a live pricing, checkout,
promotion, payment, refund, or workflow system. Product Owner acceptance and every
runtime activation remain pending.

## Ownership boundary

M046 owns deterministic commercial calculation contracts:

- versioned pricing definitions, profiles, price books, entries, and rules;
- service fees, separately labelled external fees, discounts, deposits, balances,
  and payment-schedule projections;
- promotion-code normalization, reservation, redemption, and idempotency contracts;
- immutable calculation and quote snapshots; and
- public, client, and internal-safe projections.

M042 owns catalog service/version selection. M043 owns provider-facing payment plans and
evidence, M044 owns payment verification, M045 owns entitlements, and M068 owns
operational workflow execution. A quote acceptance is never payment confirmation,
entitlement activation, or service authorization.

## Safety controls

- All monetary values use integer minor units and an ISO currency code. Floating-point
  calculations and client-submitted final amounts are rejected.
- `unknown`, `pending_definition`, and `quote_required` states do not resolve to a
  zero-price offer. Only an explicit `no_charge` configuration resolves to zero.
- Pricing context rejects protected traits and amount/discount fields supplied by a
  browser, chat, or AI caller.
- AI actors cannot calculate, approve, publish, override, reserve discounts, or change
  prices.
- Promotion reservations are deterministic and idempotent. A retry for the same
  correlation reference preserves its reservation; another consumer cannot exceed a cap.
- Public and client views omit internal cost information and rule implementation details.
- The authored database schema is RLS deny-by-default. Migration
  `0056_m046_pricing_controlled_foundation.sql` is not applied.

## Runtime posture

Every M046 runtime control remains `false`. `DisabledPricingRuntimeAdapter` fails closed
for checkout handoff, quote dispatch, promotion dispatch, and payment-plan dispatch.
No Stripe call, provider call, checkout, payment plan, manual discount, refund,
catalog publication, entitlement, workflow, queue worker, or administration UI is
activated by this module.

## Required activation evidence

1. Product Owner approval of real catalog profiles, currencies, prices, fees, discount
   policy, quote policy, and customer-facing disclosures.
2. Approved authorization/RLS policy, migration backup, rollback, and independently
   reviewed migration evidence.
3. M042 versioned profile binding, M043 checkout contract, M044 payment-obligation
   contract, M045 entitlement boundary, and M068 workflow handoff tested end to end.
4. Approved manual-price, discount, refund, tax, reconciliation, audit, retention,
   incident, and rollout procedures.
5. Sandbox validation and independent finance/security review before any live provider
   or customer-facing activation.

## Product Owner decisions still required

- Which services, currencies, price books, external fees, deposits, schedules, and
  promotions may become active.
- Whether quotes may expire, be amended, or be accepted by a particular channel.
- Manual pricing and discount approver roles, thresholds, and separation of duties.
- Tax handling, refund policy, payment-plan policy, and customer disclosures.
