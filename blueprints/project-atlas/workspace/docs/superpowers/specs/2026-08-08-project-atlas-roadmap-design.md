# Project Atlas Roadmap Design

- Owner: Product Owner
- Status: Approved design specification; implementation authorization withheld
- Date: 2026-08-08
- Update rule: revise only through Product Owner review and synchronize canonical product, roadmap, catalog, dependencies and decisions

## Purpose

This specification turns the approved product vision into a maintainable roadmap and governance system. It defines what SG Solutions Platform is, how its conceptual capabilities fit together and how a module becomes operational. It deliberately contains no implementation plan or code authorization.

## Canonical product model

SG Solutions Platform is one professional web application that sells and operates SG Solutions services. `Project Atlas` and `SG Solutions Operating System` are internal names/metaphors. The product is not licensed to other organizations, installable software, a real operating system, a multi-tenant platform, 110 applications or a microservice estate.

The product exposes three coherent logical surfaces:

1. **Public Website `/`:** sells, explains, captures leads, accepts forms, supports appointments and initial payments, and orients visitors.
2. **Client Portal `/client`:** shows services, process status, missing items, next step, documents, appointments, messages, payments, help and settings.
3. **Admin/Internal `/admin`:** operates clients, CRM, services, marketplace, documents, calendar, communications, AI assistance, approvals, reports and configuration.

The approved Astro `apps/www` and Next.js `apps/app` split remains physical architecture, not a product boundary.

## Information architecture

Public navigation keeps Inicio, About/SG Solutions, Servicios, Precios, FAQ/Help Center, Contacto, Public Forms and Public Chat understandable. Service verticals are grouped under Servicios instead of becoming a crowded top-level menu.

Client navigation has exactly nine primary areas: Inicio; Mis servicios; Estado de procesos; Documentos; Citas; Mensajes; Pagos; Centro de ayuda; Configuración. Tareas appears contextually inside Inicio, Mis servicios or Estado; Perfil belongs to Configuración.

Admin navigation targets twelve primary areas: Dashboard; Clientes; CRM; Servicios; Marketplace; Documentos; Calendario; Comunicaciones; AI Hub; Aprobaciones; Reportes; Configuración. Detailed operational inventories nest under these areas instead of expanding the primary navigation.

## Architecture design

The default architecture is a modular monolith with one central Postgres transactional database. Shared primitives are `Client`, `Person`, `Household`, `Organization`, `Business`, `ServiceOrder`, `CaseFile`, `Document`, `Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` and `Workflow`.

Every service vertical links domain-specific extensions to the shared primitives. It does not create a parallel client, case, document, task, payment, consent or audit model. Business Formation is the first complete vertical and validates the reusable pattern before later verticals.

Microservice extraction is exceptional. An ADR must prove an independent boundary in scale, security, deployment, hardware, failure isolation or runtime. Preference, team fashion or future speculation is insufficient.

## Providers, money and authority

All external integrations use provider interfaces and adapters. Provider-specific payloads stop at the adapter boundary; domain state remains provider-neutral where practical.

Stripe is external financial authority and Postgres is operational truth. Events can repeat and arrive out of order, so operational records require idempotency and reconciliation. A confirmed payment can satisfy a payment condition but cannot issue a human approval automatically.

AI is a platform capability, not an authority. It can classify, draft, retrieve and recommend within consent and access boundaries. Human approval remains required for consequential financial, legal, compliance, access and service decisions.

## Pricing design

The foundation includes one pricing engine shared by public, client and admin surfaces. Each service selects one mode:

- `public`: approved exact price.
- `from`: approved starting price with conditions.
- `quote`: personalized quote.
- `consultation`: evaluation before pricing.

All publication is off by default. The Product Owner activates every public display. Partner rates and prices record source, effective date and required disclosures. The policy supersedes the earlier absolute no-public-price decision while retaining its historical record.

## Roadmap design

Phase 0 closes blueprint, architecture, catalog, dependencies, PRDs, UX/UI and governance. Release 1 — Production Foundation then proceeds through Platform Foundation, Public Sales Engine, Internal Operations Core, Business Formation Vertical, and Client Portal & Launch.

Later releases add Credit; Taxes & Accounting; Funding & Home Buying; Marketplace & Partners; Knowledge & Documents; Communications & Automation; AI Operations; Scale & Hybrid Infrastructure; and Mobile & Expansion. The sequence is cloud-first. Provider, marketplace and partner seams exist from foundation, but complete future behavior is not built early.

The module catalog registers 110 conceptual capabilities across these horizons. A module is a governed capability, not an application, deployment unit or service boundary.

## Module governance

Every catalog row records ID, name, group, surface, domain, primary release, dependencies, shared primitives, extension entities, providers, data sensitivity, human approvals, security concerns, PRD requirement, status and maturity.

The lifecycle is:

`Registered → Specified → Ready → In Progress → Verification → PO Acceptance → Operational`

Registration permits roadmap discussion only. It does not permit code. Movement is controlled by six gates:

1. Product: problem, user, outcome and scope.
2. Architecture: primitives, boundaries, dependencies, data and providers.
3. UX/Security: important-screen approval and applicable security/privacy design.
4. Build: explicit authorization and ready dependencies.
5. Quality: automated evidence and independent reviews.
6. Release: recovery, observability, documentation and required acceptance.

## Completion and independent assurance

Every module reaching Operational produces a PCR. The same closure updates `PROJECT_STATE.md`, appends `PROJECT_MEMORY.md`, updates `DECISIONS.md` when a decision changed and records `CHANGELOG.md`.

No code is written before an approved module PRD. Important screens receive UI/UX approval first. Cyber Neo performs independent read-only security auditing for sensitive work and pre-release assurance; a separate corrector resolves confirmed findings and a separate review verifies the result.

## Current outcome

Phase 0 documentary roadmap is prepared for Product Owner review. Implementation has not started and is not authorized. The next decision is whether the Product Owner accepts this documentary baseline or requests revisions.

## Self-review record

- Product definition uses one platform and three surfaces consistently.
- Release 1 naming, Business Formation priority and cloud-first sequencing are explicit.
- Pricing modes and Decision 002 supersession are explicit.
- Registration and implementation authorization are separated.
- No implementation plan, code task or technology change is introduced.
