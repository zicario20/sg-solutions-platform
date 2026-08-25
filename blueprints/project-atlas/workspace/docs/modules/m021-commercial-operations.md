# M021 Commercial Operations - Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Provider-disabled technical foundation in progress; not accepted, not operational and not deployed
- Scope: M021A Service Orders/Catalog/Commercial Workflows and M021B Marketplace

## Product Owner numbering decision

M020 remains the canonical Lead domain. M021 is one commercial module with two complementary parts:
M021A owns service-order commercial definition, catalog, pricing, preliminary eligibility, commercial workflows, approvals and entitlements. M021B owns marketplace partner products, disclosures, consent-gated referrals, safe redirects and commission records.

## Current implemented foundation

- Typed bilingual catalog definitions with immutable versions.
- Publication readiness validation requiring a workflow and disclosures.
- Integer-minor-unit pricing calculation from server-owned configuration.
- Add-on dependency validation, basic promotion calculation, state availability and preliminary explainable eligibility.
- Deterministic commercial state and entitlement contracts, plus consent-gated marketplace referral drafts and allowlisted HTTPS redirect validation.

## Explicitly disabled

- Catalog persistence and migration execution.
- Real services, prices, fees, promotions, capacity or publication approvals.
- Stripe Products, Prices, Checkout, webhooks and payment processing.
- Service order activation, CaseFile creation, operational workflow execution and entitlement grants.
- Partner agreements, partner APIs, IdentityIQ, Tradeline Supply, CreditCardBroker, redirects, data sharing, referrals and commission reconciliation.
- AI commercial mutations, scheduled jobs, deployment and production traffic.

Provider-disabled code must fail closed. A disabled adapter, local contract or passing unit test does not prove a provider is active or that M021 is operational.
