# M059 - Marketplace Assistant

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance, independent review,
listing synchronization, personalized ranking, provider calls, referrals, redirects, applications,
status reconciliation, commissions, accounting handoffs, AI execution, and deployment remain
pending.

## Purpose

M059 provides controlled contracts for a future Marketplace Assistant. It supports public generic
and purpose-authorized reference-only sessions, listing references, candidate sets, neutrality
checks, referral intents, and human marketplace specialist handoffs. It does not create a parallel
marketplace or recommendation engine.

## Explicitly disabled

- Provider and listing synchronization calls.
- Raw sensitive-client context, client profiling, personalized ranking, eligibility, and approval
  decisions.
- Recommendations, referrals, redirects, external applications, partner data sharing, status
  reconciliation, commissions, accounting, and AI execution.
- Any hiding of sponsored placement, compensation influence on fit, or bypass of specialist or
  compliance controls.

## Safety model

1. Public sessions are generic and cannot use client context or service-scoped personalization.
2. Personalized sessions require verified identity, authorized purpose, current scoped
   authorization, and an opaque context reference.
3. Service-scoped context separately requires an entitlement.
4. Listing references cannot include raw client context or provider credentials.
5. Candidate sets are not recommendations, eligibility, applications, approvals, or provider
   outcomes; compensation cannot influence their core fit.
6. Sponsored listings require visible labels and materially relevant alternatives before review.
7. Referral intents remain blocked or review_required and never generate a redirect, referral, or
   application.

## Canonical boundaries

- M037 owns marketplace listings and journeys.
- M038 owns recommendation governance.
- M039-M041 own partner and provider operations.
- M042-M046 own SG services and prices.
- M047 owns AI policy.
- M053-M057 own specialist reasoning.
- M060 owns compliance.
- M063-M064 own source provenance and freshness.
- M068 owns workflow execution.
- M074-M075 own approvals.

## Future activation gates

[NEEDS PRODUCT OWNER DECISION: approve the provider portfolio, disclosures, compensation policy,
source freshness, personalization scope, consent/data-sharing controls, specialist review,
security review, sandbox validation, and rollback evidence before activation.]
