# Master PRD — SG Solutions Platform

- Owner: Product Owner
- Status: Approved product and roadmap baseline; module specifications remain gated
- Update rule: change requirements only through a recorded decision and synchronize product definition, roadmap, catalog and affected module PRDs

## Product definition

SG Solutions Platform is one professional web application used to sell and operate SG Solutions services. It serves SG Solutions, its staff and explicitly delegated clients. It is not licensed to third parties, multi-tenant, white-label, installable software or a real operating system. `Project Atlas` and `SG Solutions Operating System` are internal names only. [PRODUCT_DEFINITION.md](PRODUCT_DEFINITION.md) is the canonical definition.

## Product surfaces

- **Public Website `/`:** marketing, education, services, prices when individually approved, FAQ/help, contact, forms, chat, appointments and lead capture.
- **Client Portal `/client`:** services, process status, documents, appointments, secure messages, payments, help and settings.
- **Admin/Internal `/admin`:** dashboard, clients, CRM, services, marketplace, documents, calendar, communications, AI Hub, approvals, reports and configuration.

These are logical surfaces of one platform. The approved physical split remains Astro `apps/www` plus Next.js `apps/app`.

## Acquisition and operating flow

Public Website → Lead → CRM/Pipeline → ServiceOrder/CaseFile → Internal Operations → Client Portal.

Primary CTA: **Agenda una evaluación**. Secondary CTA: **Solicita una cotización**. A client account follows a commercial relationship.

## Architecture and domain model

The platform is a modular monolith with a central transactional database. Shared primitives are `Client`, `Person`, `Household`, `Organization`, `Business`, `ServiceOrder`, `CaseFile`, `Document`, `Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` and `Workflow`. Service verticals extend these primitives rather than duplicating them.

Integrations use provider abstractions and adapters. Postgres is operational truth; Stripe is external financial authority. Payment confirmation does not equal human authorization. AI assists but never becomes business, compliance, financial or access authority.

## Release strategy

The first delivery is **Release 1 — Production Foundation**, built for real clients and durable extension. Its sequence is R1.1 Platform Foundation, R1.2 Public Sales Engine, R1.3 Internal Operations Core, R1.4 Business Formation Vertical and R1.5 Client Portal & Launch. Business Formation is the first complete vertical. Later horizons are governed by [ROADMAP.md](ROADMAP.md).

## Pricing

The foundation includes a price engine with `public`, `from`, `quote` and `consultation` modes. Publication defaults to off and requires per-service Product Owner activation. Partner rates/prices require source, effective date and disclosures. Quotes, deposits, one-time payments, plans, invoices and service-linked subscriptions remain supported.

## Scope and governance

The catalog contains 110 conceptual modules, not 110 applications or microservices. Cloud-first operation precedes later homelab/hybrid options. Marketplace, partner and provider boundaries are reserved from the architecture baseline without prebuilding their full release.

Every module begins `Registered`, which never authorizes implementation. It advances only through Product, Architecture, UX/Security, Build, Quality and Release gates. No code is permitted before the module PRD is approved. Every completed module produces a PCR and updates project state, memory, decisions when applicable and changelog.
