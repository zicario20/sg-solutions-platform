# M042 - Service Catalog

- Owner: Product Owner
- Status: controlled technical foundation implemented; Product Owner acceptance pending
- Source: Product Owner-provided M042 specification, four parts
- Scope: canonical service registry and configuration foundation
- External activation: disabled

## Purpose

M042 evolves the existing \`@atlas/commercial-catalog\` package. It is not a second catalog, a Stripe product registry, a storefront, a pricing engine, an order workflow, a CRM replacement or a provider runtime.

The catalog answers what SG Solutions can describe and configure, for whom, on which surface, with which versioned prerequisites, commercial references and operational bindings. M021 continues to own the existing commercial catalog foundation; M042 adds the versioned service-registry and governance layer in the same bounded context.

## Part 1 - Registry, versions and surfaces

Implemented:

- Stable service and category codes.
- One service definition with explicit category, domain owner, fulfillment mode, availability, audiences, surfaces and provider/partner requirements.
- Immutable version objects with bilingual Spanish and English translations.
- Version lifecycle and effective-date fields.
- Public, client and admin surfaces generated from the same definition/version pair.
- Availability states that preserve \`unknown\`; unknown availability cannot enter public discovery.
- Dependency-cycle detection.
- Service order catalog snapshots that preserve the purchased/configured version instead of looking up mutable current configuration.

## Part 2 - Commercial, document and workflow bindings

Implemented as versioned references, not active integrations:

- Billing, pricing, deposit, payment-schedule and cancellation-policy references.
- Document requirement sets, requirement classification, stages, alternatives and instructions.
- Estimated-duration profiles with units, confidence and source references.
- Versioned disclosure sets and intake bindings.
- Workflow bindings with deterministic payment and human-authorization gates.
- Jurisdiction-rule contracts.

The catalog stores references only. M014 owns payment authority, M011 owns documents, M006 owns form processing, M013 owns appointments and M020B owns workflow execution. M042 never starts a checkout, uploads a document, schedules an appointment or starts work.

## Part 3 - Publication, discovery and lifecycle

Implemented:

- Deterministic publication-readiness validation.
- Public discovery documents for published, public and known-available service versions only.
- Purpose-bound public, client and admin projections.
- Related-service and bundle persistence boundaries.
- Publication, rollback and deprecation evidence structures.
- Change-request records that preserve version history.

Not activated:

- Public publishing jobs, cache invalidation, SEO publishing, service pages, live search, CTA handoffs, quote creation, ServiceOrder creation and client portal UI.
- A public service cannot be made available merely by a configuration record. The applicable owner module and Product Owner publishing gate must authorize the action.

## Part 4 - Governance, security and continuity

Implemented:

- Command policy that blocks AI approval, publication, retirement, price, workflow and disclosure changes.
- Change-request, governance-record and data-quality-finding persistence.
- Data lineage, migration-record and configuration-hash fields.
- RLS deny-by-default migration policies for catalog tables.
- Controlled admin projection boundary and source/correlation evidence contracts.

Not activated:

- Automation engine, AI provider calls, provider routing, queue workers, alert delivery, analytics export, break-glass execution, migration import/export jobs, recovery operations or catalog administration UI.

## Security and data boundaries

- Catalog configuration stores references, never provider credentials, card data, tax data, identity data, document bytes or client PII.
- Prices are references to M014/M021-approved pricing rules; a browser cannot supply the final amount.
- A service version must not be edited in place after approval. Material changes create a new version and preserve prior order snapshots.
- Client projections require a service grant. Public projections do not expose workflow, commercial or internal configuration.
- Provider-dependent services remain blocked when their provider requirements are not activated through M041.
- The SQL migration is authored only. It has not been applied to a database.

## Validation evidence

- \`corepack pnpm --filter @atlas/commercial-catalog typecheck\`
- \`corepack pnpm --filter @atlas/database typecheck\`
- \`corepack pnpm exec vitest run tests/m042/service-catalog.test.ts\`
- \`corepack pnpm exec vitest run tests/m042/service-catalog-persistence.test.ts\`

## Product Owner decisions still required

- Approve the first concrete service/category records and public claims.
- Approve public availability, publication channels, CTAs and service-specific disclosure wording.
- Approve price books, taxes, deposits, refunds and checkout behavior with M014.
- Approve live workflow, intake, document, appointment and entitlement bindings.
- Approve catalog RLS policies using the real authorization model before migration.
- Approve provider/partner activation through M040/M041.
- Approve production migration, deployment and acceptance.
