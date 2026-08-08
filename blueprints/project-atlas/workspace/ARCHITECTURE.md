# Architecture

- Owner: Product Architect
- Status: Approved modular-monolith baseline
- Update rule: synchronize with ADRs, product definition, dependency map and decisions before architecture-sensitive work

## System shape

SG Solutions Platform is one cloud-first application with three logical surfaces: Public Website `/`, Client Portal `/client` and Admin/Internal `/admin`. The approved monorepo split remains `apps/www` (Astro) and `apps/app` (Next.js App Router). Hosting routes surfaces without redefining them as separate products.

The backend is a modular monolith with clear domain boundaries and one central Postgres transactional database. A microservice is an exception requiring an ADR with evidence of a scale, security, deployment, hardware, failure-isolation or runtime boundary.

## Shared primitives

`Client`, `Person`, `Household`, `Organization`, `Business`, `ServiceOrder`, `CaseFile`, `Document`, `Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` and `Workflow` form the shared domain language. Verticals store domain extensions linked to these records; they do not duplicate them. Business Formation is the first end-to-end vertical.

## Authorities and adapters

- Supabase Auth supplies identity; role and resource authorization live in domain services, RLS and Storage policies.
- Drizzle is the sole schema and migration authority.
- Postgres owns durable operational state.
- Stripe is authoritative for external financial state; idempotency and reconciliation mirror it operationally.
- Payment confirmation is an event, not human authorization.
- Sanity contains public content only.
- Inngest coordinates work; durable workflow/job state remains in Postgres.
- Integrations enter through provider interfaces and adapters.
- AI is a capability constrained by permissions, consent, provenance, human review and audit; it is never authority.

Marketplace, partners and provider abstractions are reserved from the initial architecture. Their full behavior belongs to later releases. Homelab, local AI/GPU nodes and hybrid operation are R9 concerns and do not block the cloud-first foundation.
