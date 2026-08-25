# M037 - Financial Marketplace

## Status

Controlled technical foundation implemented. No provider, partner adapter, redirect, referral submission, data-sharing path, webhook, commission feed, or provider credential is enabled.

## Scope delivered

M037 expands the existing Marketplace foundation rather than creating a parallel store. The shared marketplace package now provides a versioned catalog, categories, provider profiles, source and freshness controls, bilingual listing content, availability, minimal eligibility context, explainable potential-fit records, comparisons, scoped consent, idempotent journeys, referral handoff gates, conversion records, commission candidates, adjustments, reversals, partner action isolation, safe client projections, and governance controls.

## Commercial separation

- Marketplace listings represent third-party information or referral offers; they are not SG Solutions services.
- A provider decides availability, eligibility, terms, underwriting, application outcome, and any external payment.
- Marketplace commissions are distinct from client payments, Service Orders, refunds, and SG Solutions service revenue.
- Provider pricing is represented as provider-published information or provider quote required. No estimated provider terms, approvals, rates, or savings are invented.

## Provider and referral boundary

Every provider defaults to disabled. A reviewed provider may have a limited information listing, but its CTA is disabled and it cannot receive a referral, redirect, client data, or partner action. Future activation requires a separate Product Owner decision plus agreement, verification, privacy review, security review, adapter, credentials, operational ownership, tested kill switch, and evidence of sandbox validation.

Consent is provider-specific, listing-version-specific, purpose-specific, time-bounded, and data-minimized. A consent record never enables data sharing by itself. Data sharing remains fail-closed until the external integration is activated and independently authorized.

## Journey and conversion controls

Marketplace journeys use a deterministic idempotency key. Duplicate journey creation is rejected. A referral handoff validates provider state and scoped consent immediately before the attempted action. External submission remains disabled. Unknown external outcomes do not cause retries or create duplicate leads.

Partner conversions must contain a unique external event reference. A commission candidate requires a verified conversion, partner contract reference, and versioned calculation rule. Recognition preserves the original candidate; a reversal records lifecycle change without deleting the source commission.

## Ranking, personalization, and AI

Personalization requires active scoped consent. Anonymous browsing remains separate from authenticated profile data. Matching rejects protected or sensitive criteria, requires an explanation, and returns a potential-fit status rather than an approval or universal recommendation. Sponsored or compensation-influenced placement must be explicitly labeled.

AI is limited to source-grounded explanation, disclosure explanation, missing-information identification, and draft support content. It cannot self-approve, enable a provider, submit a referral, share data, make an application, determine an external decision, or change commissions.

## Client and partner views

The projection layer uses the existing client-portal architecture and exposes only safe listing data and a limited journey status. It never exposes commission terms, credentials, partner configuration, raw external payloads, sensitive financial context, or another client's referral. Partner actions validate that a provider can act only on its own journey.

## Data model and migration

The database schema adds marketplace provider, category, listing, listing-version, consent, journey, conversion, and commission tables. The authored migration includes restrictive RLS posture and a database constraint that forbids enabled provider status. It has not been executed.

## Deferred capabilities

The following remain provider-disabled and need future authorization:

- provider contracts and actual provider profiles;
- IdentityIQ, Tradeline Supply, CreditCardBroker, financial-provider, or affiliate adapters;
- signed redirects, referrals, lead submissions, webhooks, status reconciliation, and provider dashboards;
- data sharing, document sharing, user invitation, and partner credentials;
- commission synchronization, reconciliation, payments, tax handling, and revenue recognition policies;
- marketplace public pages, client portal activation, notifications, analytics, operational queues, and production deployment.
