# M046 Pricing Runbook

## Current operating mode

M046 is provider-disabled and deny-by-default. Do not enable an M046 flag, apply
`0056_m046_pricing_controlled_foundation.sql`, seed real customer prices, connect M043,
or create a customer-facing quote/checkout flow without a separately approved activation
change.

## Safe responses

| Condition | Required response |
| --- | --- |
| Price is unknown, pending, or requires a quote | Show no amount and route to approved review; never treat it as free. |
| Promotion cap or eligibility cannot be resolved | Reject the reservation and preserve the audit reference. |
| Pricing snapshot is stale, altered, or mismatched | Fail closed; recalculate from authorized current inputs only when policy permits. |
| Browser, chat, or AI supplies a final amount or discount | Reject the input and record a scope violation. |
| External fee source is missing or stale | Do not include it as a confirmed fee; route for approved review. |
| Payment, entitlement, workflow, or provider action is requested | Reject; those are M043/M044/M045/M068-owned activation paths. |

## Pre-activation checklist

1. Product Owner approves live price books, pricing profiles, fee sources, promotions,
   deposit/schedule/refund policies, and commercial disclosures.
2. Finance, compliance, and security approve role separation, manual exception policy,
   audit retention, tax treatment, and customer communication.
3. Database migration backup, rollback, real authorization/RLS policy, and restoration
   evidence are approved.
4. M042, M043, M044, M045, and M068 contracts are integration-tested in a sandbox.
5. Reconciliation, incident response, discount-cap recovery, quote expiry, retry, and
   rollback owners are assigned.
6. Product Owner approves a staged rollout and explicit kill-switch conditions.

## Rollback posture

Before activation, rollback is every M046 flag remaining `false`. If a future enabled
consumer produces an unsafe result, disable the handoff, stop new quote/checkouts,
preserve immutable snapshots and audit evidence, and let the owning payment or workflow
module manage its own state. Never rewrite historical price, payment, entitlement, or
order evidence to hide an incident.
