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

Supabase Auth is the identity source. Domain services plus Postgres RLS and Storage policies enforce
authorization. Drizzle owns schema and migrations. Sanity stores public bilingual content only.
Stripe owns external financial transaction state; Postgres owns internal operational state. Inngest
coordinates work but owns no business state. AI is assistive, permission-bound and non-authoritative.

Release 1 is the Production Foundation, delivered compatibly as Release 1A and Release 1B. The 110
catalog entries are conceptual capabilities; registration does not authorize implementation.

The repository/tooling scaffold exists. Architecture and documentation are in progress. No
production product behavior has been implemented, and feature implementation remains unauthorized
until the Product Owner explicitly authorizes `GENERATE`.
