# M046 Pricing Architecture

## Canonical flow

`M042 service version -> M046 profile/version -> authoritative M046 calculation
snapshot -> M043 payment-plan reference -> M044 verification decision -> M045
entitlement decision -> M068 workflow`

Each arrow is a bounded reference, not permission to mutate the next owner. The current
implementation ends at safe, immutable contracts. Runtime handoffs are disabled.

## Authoritative model

`@atlas/pricing` is the M046 authority. It contains typed contracts, deterministic
calculation, policy checks, in-memory repository contracts, quote/version primitives,
disabled runtime controls, governance records, and audience-safe views. The legacy
`@atlas/commercial-catalog` price calculator is now a compatibility adapter only; it
does not own a second calculation engine.

The storage model has separate records for pricing definitions, profiles, price books,
entries, rules, discounts, promotions/codes/redemptions, schedule policies, snapshots,
quotes/versions, audits, outbox records, and data-quality findings. Historical snapshots
are immutable so a later price-book change cannot silently alter a prior quote or order.

## Price resolution

1. Validate actor, context, catalog profile/version pair, currency, and effective dates.
2. Resolve a versioned price book and matching entries server-side.
3. Add approved service and external-fee components with explicit labels.
4. Evaluate allowed promotion rules and reserve a promotion idempotently where needed.
5. Apply floor and cap controls, deposit policy, balance rule, and schedule projection.
6. Persist or hand off a calculation only as an immutable snapshot with a content hash.

The browser may identify a service, variant, configured options, or promotion code. It
cannot select a price book, set an amount, apply a manual discount, or assert eligibility.

## Future CMS and provider compatibility

Commercial text and catalog selection remain in M042. M046 binds stable profile and
version references instead of embedding provider-specific product data. M043 may map an
approved M046 snapshot to a provider object later, but provider IDs and credentials are
not pricing truth and are not stored in M046 calculation contracts.

## Non-goals

M046 does not process a card, call a provider, verify payment, create an entitlement,
start a service, issue a refund, perform a tax calculation, or publish a catalog entry.
