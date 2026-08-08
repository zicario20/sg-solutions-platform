# SG Solutions Platform — Documentary Blueprint Index

- Owner: Product Owner
- Status: Phase 0 documentary baseline under Product Owner review
- Implementation authorization: withheld
- Update rule: keep this index synchronized with the canonical documents linked below

## Product

SG Solutions Platform is one professional web application for selling and operating SG Solutions services. `Project Atlas` and `SG Solutions Operating System` are internal names only. The platform is not licensed to third parties, multi-tenant software, an installable operating system, 110 applications or a microservice estate.

The complete canonical definition, business model and pricing policy live in [PRODUCT_DEFINITION.md](workspace/PRODUCT_DEFINITION.md) and [MASTER_PRD.md](workspace/MASTER_PRD.md).

## Logical surfaces

| Surface | Logical route | Purpose |
|---|---|---|
| Public Website | `/` | Explain services, educate, capture leads, receive forms, schedule and support approved initial payments. |
| Client Portal | `/client` | Show services, process status, missing items, next action, documents, appointments, messages and payments. |
| Admin/Internal | `/admin` | Operate clients, CRM, services, marketplace, documents, calendar, communications, approvals, reports and configuration. |

These are three surfaces of one platform. The approved physical split remains Astro `apps/www` plus Next.js `apps/app`; it does not create separate products.

## Architecture

The approved default is a modular monolith with clear domain boundaries and one central Postgres transactional database. Shared primitives cover clients, people, households, organizations, businesses, service orders, cases, documents, tasks, appointments, messages, payments, consent, approvals, audit events and workflows. Verticals extend these primitives instead of duplicating them.

Integrations use provider abstractions and adapters. Postgres is operational truth; Stripe is external financial authority. Payment confirmation and AI output never replace required human authorization. A microservice requires an approved ADR demonstrating a scale, security, deployment, hardware, failure-isolation or runtime boundary.

Architecture authority: [ARCHITECTURE.md](workspace/ARCHITECTURE.md) and [Dependency Map](workspace/docs/roadmap/DEPENDENCY_MAP.md).

## Catalog and roadmap

The [Module Catalog](workspace/docs/roadmap/MODULE_CATALOG.md) registers 110 conceptual modules. They are capabilities, not applications, repositories or deployment units. Every module starts `Registered`, which does not authorize implementation.

The [Roadmap](workspace/ROADMAP.md) progresses through Phase 0 — Blueprint & Design; Release 1 — Production Foundation with R1.1 Platform Foundation, R1.2 Public Sales Engine, R1.3 Internal Operations Core, R1.4 Business Formation Vertical and R1.5 Client Portal & Launch; then R2 through R10. Business Formation is the first complete vertical. The strategy is cloud-first; homelab and hybrid infrastructure are later concerns.

Release outcomes: [RELEASE_HORIZONS.md](workspace/docs/roadmap/RELEASE_HORIZONS.md).

## Governance and gates

Modules advance through `Registered → Specified → Ready → In Progress → Verification → PO Acceptance → Operational`. Product, Architecture, UX/Security, Build, Quality and Release gates control transitions. The complete model is in [STATUS_MODEL.md](workspace/docs/roadmap/STATUS_MODEL.md).

No product code may be written before an approved module PRD, satisfied dependencies and explicit Build gate authorization from the Product Owner. Important screens require approved UI/UX first. Cyber Neo remains an independent read-only security auditor. Every operational module produces a PCR and updates current state, memory, decisions when applicable and changelog.

Agent rules: [AGENTS.md](workspace/AGENTS.md). Current status: [PROJECT_STATE.md](workspace/PROJECT_STATE.md). Product principles: [PROJECT_PRINCIPLES.md](workspace/PROJECT_PRINCIPLES.md). Decisions: [DECISIONS.md](workspace/DECISIONS.md).

## Current state and next step

Phase 0 documentary review is active. Product implementation has not started and is not authorized. The next step is **Product Owner review of the documentary roadmap and design specification**.

A future executable plan may be generated only from approved module PRDs after the module has passed its Build gate and the Product Owner has explicitly authorized implementation. The archived E1–E3 material under `archive/pre-roadmap-2026-08-02/` is historical and must not be executed.
