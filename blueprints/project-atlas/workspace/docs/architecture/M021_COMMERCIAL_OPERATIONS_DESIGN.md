# M021 Commercial Operations Design

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Provider-disabled technical foundation in progress; not accepted, not operational and not deployed
- Date: 2026-08-25

## Numbering decision

The Product Owner confirmed the compatible commercial decomposition:

- M020 remains the canonical Lead domain.
- M021A owns the Service Order commercial definition: catalog, versioned offers, prices, availability, preliminary eligibility, commercial state, approvals, workflow instances and entitlements.
- M021B owns Marketplace capabilities: partner-product configuration, disclosures, consent-gated referral drafts, safe redirects, referral state, commissions and partner provider adapters.

M021A and M021B are one commercial module divided by responsibility. Marketplace product records remain distinct from SG Solutions service definitions. M021 does not own Person/Client, Organization, CRM relationship, Payment, Appointment, Document, CaseFile, Task, Consent or Audit canonical state; it consumes typed owner ports and emits typed commands/events for their owners.

## Architecture

Two workspace packages provide domain boundaries:

- `@atlas/commercial-catalog` owns configuration contracts, immutable versions, publication readiness, deterministic pricing and preliminary eligibility.
- `@atlas/commercial-workflows` owns commercial-state transition validation, version-bound workflow instances, approval gates, entitlement grants and durable event contracts.

Marketplace contracts live in `@atlas/marketplace` and consume only catalog/eligibility projections. A `MarketplacePartnerProvider` adapter can create a provider-specific redirect or normalize a callback only after a later activation gate. The default runtime is disabled and returns safe unavailable/denied results.

The authenticated application exposes narrow Admin routes only. The server validates authorization, commands, ownership references and current versions. Browser input can select opaque service, variant, add-on and promotion codes but never a price, discount amount, status, partner URL or entitlement. Monetary values are integer USD minor units. Publishing, approval, manual discounts, referrals and any sensitive execution require explicit permission and remain unavailable without configured owner ports.

## Boundaries and safety rules

- Payment confirmation can move a commercial order only to `pending_internal_review`; it cannot start operational execution.
- A workflow transition is a named command, not a client-provided target status.
- Entitlements are commercial access facts, never staff permissions.
- A published configuration is immutable. New changes create a new version; existing orders keep their snapshot.
- Eligibility is deterministic, explainable and preliminary. It never returns an external approval.
- Partner products require visible disclosure, current consent and an allowlisted HTTPS domain before a redirect can be generated.
- AI has no mutation tool for pricing, publication, approval, entitlement grants, refunds, filing, applications or data sharing.
- External providers, scheduled jobs, Stripe synchronization, payment processing, partner APIs, storage and production migrations remain disabled.

## Initial implementation scope

The foundation includes typed contracts, invariant parsers, price/eligibility/state engines, provider-disabled repositories/runtime adapters, Postgres/Drizzle migration artifacts, admin-safe DTOs/routes/UI shells, audit/event interfaces and focused tests. It deliberately contains no live offer, real price, partner, redirect URL, Stripe identifier, credential, financial application, external call or automatic service activation.

## Deferred activation decisions

- Real catalog content, pricing, fees, promotions, taxes, capacity and publication approvals.
- Service-order, Lead, CaseFile, Task, Consent, Audit and Notification owner-port activation.
- Stripe account, Product/Price synchronization, checkout and webhooks.
- Partner agreements, disclosures, data-sharing policy, domains, credentials, webhook signing and commission reconciliation.
- Workflow worker/queue implementation, production rollout, monitoring and recovery operations.
