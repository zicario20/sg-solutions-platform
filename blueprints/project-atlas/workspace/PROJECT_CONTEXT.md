# Project Context

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Approved stable context
- Update rule: update only when stable product, market or architecture context changes

SG Solutions LLC is an Illinois services business, initially operated by its owner. SG Solutions
Platform is one cloud-first professional web application that sells and operates its services for SG
Solutions and explicitly delegated clients. It is not software licensed to other firms and has no
multi-company tenancy or white-label scope.

The product has three logical surfaces: Public Website `/`, Client Portal `/client` and
Admin/Internal `/admin`. Astro is approved for `apps/www`; Next.js App Router is approved for
authenticated surfaces in `apps/app`. They remain one product and share a modular domain model.

The architecture is a modular monolith with a central Postgres transactional database and shared
business primitives. Verticals extend common clients, businesses, service orders, cases, documents,
tasks, appointments, messages, payments, consent, approvals, audit and workflows. Business
Formation remains the first complete service vertical.

Reusable client/profile facts are purpose-bound and provenance-aware. Canonical identity, contact,
client, organization, service order, case and document ownership remain separate; consumers receive
only approved service-specific projections, never a full profile.

The Admin Dashboard is a role-scoped operational composition surface, not another source of truth.
It derives minimized widgets and deterministic priority from owner-domain projections, preserves
explicit freshness/coverage/partial-failure state and reauthorizes every drill-down in the owning
module. Derived metrics, preferences and caches cannot grant access or change operational state.

The CRM is the authorized commercial-relationship workspace inside the Admin surface. M017 owns
CRM relationships, opportunities, versioned pipelines, assignments and CRM-authored activities;
M018 owns Person/Household/formal Client, M019 Organization, M020 Lead, M021 ServiceOrder, M022
CaseFile and M023 Task. Contact 360 composes minimized owner projections and reauthorizes every
drill-down. Opportunity `won`, payment, client activation, entitlement, authorization to start and
case progress are independent facts. Duplicate candidates never merge people automatically.

Client Management is the authorized operational home for a formal client relationship. M018 owns
canonical natural-person/contact-method/household facts, formal Client lifecycle, client
assignments, scoped representatives, client-level flags/restrictions, onboarding/offboarding and
client operational notes. The client 360 is a request-scoped composition: Organization, services,
cases, tasks, documents, billing, appointments, communications, consent, portal/security and profile
facts remain in their owners. Formal Client, account, payment, service authorization and case
progress are independent. Representative or staff access always requires explicit current resource,
purpose and field/section authorization.

Supabase Auth is the identity source. Domain services plus Postgres RLS and Storage policies enforce
authorization. Drizzle owns schema and migrations. Sanity stores public bilingual content only.
Stripe owns external financial transaction state; Postgres owns internal operational state. Inngest
coordinates work but owns no business state. AI is assistive, permission-bound and non-authoritative.

Release 1 is the Production Foundation, delivered compatibly as Release 1A and Release 1B. The 110
catalog entries are conceptual capabilities; registration does not authorize implementation.

The repository/tooling scaffold exists. M001–M003 have locally verified product slices and remain
undeployed at Product Owner acceptance; no module is `Operational`. Decision 028 authorizes the
bounded sequential M003–M005 Build only. External providers, credentials, real client data,
production release and all other feature implementation require their own Product Owner gates.
