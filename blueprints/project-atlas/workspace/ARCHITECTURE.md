# Architecture

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Approved modular-monolith baseline; Phase 0 hardening in progress
- Update rule: synchronize ADRs, product definition, dependency map and decisions before any
  architecture-sensitive work

## System shape

SG Solutions Platform is one cloud-first product with Public Website `/`, Client Portal `/client`
and Admin/Internal `/admin` surfaces. The monorepo physically separates `apps/www` (Astro) and
`apps/app` (Next.js App Router), but the surfaces share one domain model and are not separate
products or tenants.

The backend begins as a modular monolith with clear domain boundaries and one Supabase-managed
Postgres transactional database. A separately deployed worker, voice gateway or GPU/browser worker
is allowed only for a demonstrated runtime or isolation need and does not convert every domain into
a microservice. Any extraction requires an ADR and Product Owner approval.

## Approved baseline

| Layer | Approved technology | Boundary |
|---|---|---|
| Workspace | pnpm and Turborepo | Reproducible monorepo; local skills are not workspace dependencies. |
| Public web | Astro | Content-first, bilingual and low-JavaScript marketing/education surface. |
| Authenticated web | Next.js App Router | Server-first client/admin experience. |
| Identity/data/storage | Supabase Auth, Postgres and private Storage | Auth proves identity; domain/RLS/Storage policies authorize. |
| Schema/migrations | Drizzle | Sole authority; no production dashboard edits. |
| Public CMS | Sanity | Public bilingual editorial content only. |
| Payments | Stripe Checkout, Invoices and signed webhooks | External financial authority; Postgres reconciles operational state. |
| Scheduling | Internal narrow engine plus Google Calendar adapter | Postgres is scheduling authority; Google is an external calendar projection. |
| Background work | Inngest | Coordinates durable jobs whose state remains in Postgres. |
| Telemetry | Sentry, OpenTelemetry and minimized PostHog | Sensitive payloads prohibited. |
| Deployment | Vercel and Supabase | Cloud-first baseline. |

No approved stack component may be replaced silently. A blocking technical issue is documented with
impact, alternatives and a Product Owner decision request.

## Shared domain primitives

`Client`, `Person`, `Household`, `Organization`, `Business`, `ServiceOrder`, `CaseFile`, `Document`,
`Task`, `Appointment`, `Message`, `Payment`, `Consent`, `Approval`, `AuditEvent` and `Workflow` form
the shared language. Service verticals store extensions linked to these records and never create
parallel client, case, document, task, payment or audit models.

## Authorization architecture

Authorization has three independent dimensions:

1. **Identity:** Supabase Auth resolves the authenticated subject and session assurance.
2. **Internal role:** role/permission assignments constrain staff actions using least privilege.
3. **Resource access:** explicit client membership and case grants determine which records a client
   may access.

An explicit active case grant inherits only to client-visible child resources within that case.
Internal notes never inherit visibility. Highly sensitive documents may require an additional grant.
Any resource may block inherited visibility. Revocation propagates to derived access and signed URLs
expire independently. Domain services enforce the decision before I/O; RLS and Storage policies
provide defense in depth. See ADR 004 and the Identity and Access PRD.

## Provider and state authority

Provider-specific payloads stop at adapters. Supabase Auth is identity truth; Postgres is internal
operational truth; Stripe is external financial transaction truth; Sanity is public editorial truth;
Inngest coordinates but owns no durable business state. Provider callbacks are authenticated,
idempotent and order-independent, and reconciliation repairs missed or delayed events.

Architecture, local implementation and external activation are separate gates under ADR 006.
`EXTERNAL_ACTIVATION_REGISTER.md` records provider accounts, contracts, business prerequisites and
non-sensitive activation evidence. An interface, disabled adapter, mock or local contract test never
proves a provider is active or a module is `Operational`.

M003 proposes a same-origin Public Chat Gateway as Astro on-demand server routes inside `apps/www`,
while existing marketing/content pages remain prerendered. Shared conversation/domain services stay
in workspace packages; later authenticated client/admin adapters enter through `apps/app` and never
turn a claimed public identity into authorization. ADR 007 records the proposed runtime decision for
Product Owner approval before Build.

## Data protection

Data follows `DATA_CLASSIFICATION.md`. Managed encryption at rest is necessary but insufficient for
Highly Sensitive structured fields; those use application-level envelope encryption at documented
service boundaries. Private documents follow the quarantine/scan/promotion lifecycle in
`FILE_UPLOAD_SECURITY.md`. Backups and restore evidence follow `BACKUP_AND_RECOVERY.md`.

## Design architecture

The visual system uses three token layers: primitive, semantic and component. Manrope is the heading
font and Inter the body font. Approved primitives include navy `#0A2540`, cobalt `#0B63CE`, cyan
`#00A3E0`, green `#2E7D32`, gold `#B7791F` and surface `#F7F9FC`. The product is light-first with
subtle motion, WCAG 2.2 AA, reduced-motion support and a tokenized but unpublished v1 dark theme.

## Evolution and release slices

Release 1A and 1B use the same domain primitives, identifiers, authorization model, migrations and
provider boundaries. Release 1A deliberately limits behavior but is not disposable. Release 1B adds
operational maturity through compatible migrations, new states/adapters and expanded workflows.
