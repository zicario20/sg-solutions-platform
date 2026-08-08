# Decisions

- Owner: Product Architect
- Status: Active decision record
- Update rule: append numbered, dated decisions with reason and impact; never delete history

## 2026-08-02 — Decision 001

Decision: Project Atlas serves only SG Solutions and its clients; multi-tenancy and white-label are excluded.

Reason: no commercial licensing requirement exists and premature tenancy would multiply authorization complexity.

Impact: one organization context, internal roles and explicit client resource grants.

## 2026-08-02 — Decision 002 (historical; superseded by Decision 005)

Decision histórica: se prohibió publicar precios de servicios.

Reason: services require personalized evaluation.

Impact at the time: the system used quotes, deposits, one-time payments, plans, invoices and service-linked subscriptions. Decision 005 later replaced the absolute restriction with governed publication modes.

## 2026-08-02 — Decision 003

Decision: adopt local role-specific skills: Superpowers for implementation and correction, UI/UX Pro Max for design, and Cyber Neo for security auditing.

Reason: role-specific workflows preserve design quality, test discipline and independent security review without allowing one agent to self-certify.

Impact: visual work requires a persisted design handoff; implementation requires isolated planning, TDD and fresh verification; Cyber Neo remains strictly read-only and a separate corrector fixes confirmed findings. Missing required skill availability blocks its phase. Skills never override approved product documentation or Product Owner authority.

## 2026-08-08 — Decision 004

Decision: define SG Solutions Platform as one professional web application with Public Website, Client Portal and Admin/Internal surfaces. `Project Atlas` and `SG Solutions Operating System` remain internal names/metaphors only.

Reason: the product must be understandable as one operating platform for SG Solutions, not a third-party SaaS, real operating system, collection of applications or microservice estate.

Impact: routes are logically `/`, `/client` and `/admin`; the approved Astro plus Next physical split remains. The catalog registers conceptual modules without granting implementation authority. Multi-tenancy and white-label remain excluded.

## 2026-08-08 — Decision 005 (supersedes Decision 002)

Decision: include a price engine from foundation with modes `public`, `from`, `quote` and `consultation`. Publication is off by default and the Product Owner activates each public price. Partner rates/prices require source, effective date and disclosures.

Reason: SG Solutions needs flexible service merchandising without treating every service as fixed-price or exposing unapproved amounts.

Impact: Decision 002 remains historical but its absolute prohibition is superseded. Quotes and consultations remain default options; public display is an explicit per-service decision.

## 2026-08-08 — Decision 006

Decision: adopt a modular monolith with one transactional database, shared business primitives and provider adapters. Business Formation is the first complete vertical; cloud-first precedes later hybrid infrastructure.

Reason: common operations require transactional consistency and reuse, while vertical extensions preserve domain clarity. Premature services or local infrastructure would add operational cost without evidence.

Impact: a microservice requires an ADR proving a scale, security, deployment, hardware, failure-isolation or runtime boundary. Stripe remains external financial authority; Postgres remains operational truth; AI and payment confirmation never replace required human authority.

## 2026-08-08 — Decision 007

Decision: archive the E1–E3 blueprint, task queue and epics as superseded, non-executable history. No active `tasks.json` will exist until approved module PRDs, the applicable Build gate and explicit Product Owner authorization permit a new executable queue.

Reason: the E1–E3 sequence predates and is incomplete against the approved R1.1–R1.5 roadmap. In particular, it did not deliver R1.4 Business Formation with EIN, business compliance and electronic signature, nor govern the canonical M001–M110 catalog.

Impact: the bundle root contains a documentary index only. Historical files live under `../archive/pre-roadmap-2026-08-02/` and must not be executed. The next step remains Product Owner review of the documentary roadmap.
