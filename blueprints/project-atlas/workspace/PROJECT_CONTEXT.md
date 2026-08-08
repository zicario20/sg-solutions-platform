# Project Context

- Owner: Product Architect
- Status: Approved stable context
- Update rule: update only when stable product, market or architecture context changes

SG Solutions LLC is an Illinois services business, initially operated by its owner. SG Solutions Platform is one cloud-first professional web application that sells and operates its services for SG Solutions and explicitly delegated clients. It is not software licensed to other firms and has no multi-company tenancy.

The platform has three logical surfaces: Public Website `/`, Client Portal `/client` and Admin/Internal `/admin`. Astro powers the approved public application in `apps/www`; Next.js App Router powers authenticated surfaces in `apps/app`. They remain one product and share one modular domain model.

The architecture is a modular monolith with a central Postgres transactional database and shared business primitives. Verticals add extensions instead of duplicate clients, businesses, orders, cases, documents, tasks, appointments, messages, payments, consent, approvals, audit or workflows. Business Formation is the first complete vertical.

Supabase Auth owns identity. Domain services plus Postgres RLS and Storage policies own authorization. Drizzle owns schema and migrations. Sanity stores public content only. Providers are adapters. Stripe owns external financial state; Postgres owns operational state. AI is assistive, not authoritative.

Release 1 — Production Foundation is the first delivery. The catalog registers 110 conceptual modules across Phase 0 and R1–R10; registration does not authorize implementation. Current work is documentary Phase 0 only.
