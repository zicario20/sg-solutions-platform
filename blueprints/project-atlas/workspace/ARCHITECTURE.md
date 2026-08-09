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

M004 proposes an official provider-neutral WhatsApp adapter over the same conversation/handoff
kernel. Provider-to-server callbacks enter through a narrowly scoped Next.js integration ingress in
`apps/app`, are authenticated and durably persisted before normalized domain processing, and use a
transactional inbox/outbox plus reconciliation. A phone/contact binding is never Supabase identity
or a resource grant; the initial client-specific path is a secure portal link. Postgres owns
operational messaging state, while the activated provider owns external account/template/delivery
state. ADR 008 records the proposed boundary; provider/number/template activation remains deferred.

M005 proposes a bilingual reception capability that also reuses the shared conversation, lead,
scheduling, handoff, consent and audit primitives. Durable call policy and state remain in the
TypeScript/Postgres modular monolith. M096 is a proposed, separately deployable cloud boundary only
for validated carrier media, ephemeral audio sessions and approved STT/model/TTS adapters. It has no
general database credentials or business-state authority. Caller ID is not identity; recording and
transcription are disabled until explicit policy approval. ADR 009 records this candidate boundary,
while every provider, number, runtime and live-call decision remains deferred.

M006 proposes immutable server-authoritative public form definitions and a narrow same-origin
gateway in `apps/www`; the rest of Astro remains static-first. The gateway validates anonymous
transport/session/abuse boundaries and calls a least-privilege `apps/app` facade without database or
provider credentials. Domain services atomically accept the submission, consent evidence,
idempotency and outbox before a generic receipt. M020 owns leads/deduplication, M078 owns consent and
M077 owns audit. Detailed private intake, public uploads, persistent drafts and every external
handoff stay gated. ADR 010 records the proposed boundary.

M007 proposes invitation-first client activation through the Next.js authenticated application.
Supabase Auth remains identity/credential authority; Postgres owns SG Solutions account,
membership, application-session revocation and audit state. Email/password and future-activated
Google are methods of one identity, and no email, phone, payment or CRM match grants access. A
same-origin server-mediated PKCE/session boundary puts only an opaque application handle in the
HttpOnly browser cookie and keeps provider credentials in a server-only envelope-encrypted vault,
prohibits shared caching and requires a pinned-version compatibility proof before Build. Provider
automatic linkage grants nothing until the explicit local link/invitation transaction commits.
User routes run through session-derived restricted RLS context and never `service_role`/owner/
`BYPASSRLS`; private Storage uses server-derived keys and scoped signed capabilities. ADR 011 records
the proposed linking/session boundary; ADR 004 still controls case/resource inheritance and
M080/M081 own RBAC.

M008 proposes one request-scoped Client Dashboard aggregation service inside the modular monolith.
It reads typed, minimized projections from the domains that own security, services, cases, tasks,
documents, signatures, appointments, payments, messages, notifications and content; it owns no
business state and performs no provider fan-out. One complete account/session/membership/context/
grant/entitlement/policy authorization snapshot governs every fragment, and a final authorization
fence discards mixed or revoked results. A closed priority-source registry plus deterministic,
versioned policy selects the sole client priority action; a missing registered source yields `unconfirmed`, never a
false lower action or no-action state. Release 1A persists no monolithic dashboard snapshot and uses
private/no-store personalized responses. Proposed ADR 012 records this candidate boundary.

M009 proposes one request-scoped Client Services query boundary for the contracted-service
directory and service-detail shell. Every visible item is a real `ServiceOrder`; operational work
uses its governing `CaseFile`, and neither becomes a portal-owned duplicate. An explicit service or
case grant is required—client/participant/email/payment relationships grant nothing. The accepted
service-definition, scope, workflow/milestone and pricing versions remain bound to the order, while
a deterministic versioned policy synthesizes client presentation from canonically owned
ServiceOrder commercial/activation, Billing/Stripe financial and CaseFile/workflow fulfillment
subfacts. Typed owning-domain summaries reuse the complete M007/M008
authorization snapshot and final fence. That fence also revalidates each serialized resource's
authorization epoch—parent linkage, visibility/inheritance, classification, tombstone and accepted-
definition binding—before any body, count, cursor or route metadata leaves the boundary. M009 owns
no mutations, live provider fan-out or personalized shared cache. Proposed ADR 013 records this
candidate boundary.

M010 proposes one request-scoped Client Process query boundary. Its top-level landing server-side
consumes only M009's nonrecursive `AuthorizedServiceChoicePort` for zero/one/many opaque choices,
without a parallel directory, recursive full-list/detail dependency or persisted default; detail
remains beneath an explicitly granted M009 service. The port uses M009's paginated no-total cursor
contract and approved safe instance labels; ambiguous labels fail closed without IDs. Every
authorized-root page applies a closed accepted service-definition/workflow eligibility policy
before ordering/pagination and binds its version into the cursor; ineligible roots leak nothing.
Detail validates that same policy before any process read or metadata and revalidates it at the
final fence.
Every registered Postgres source that can change status, milestone, action or blocker—including
ServiceOrder, Case, Task, Document and Billing—shares one MVCC request snapshot/restricted RLS
actor, or the outcome is `unconfirmed`. It projects,
but never owns, the canonical ServiceOrder commercial/activation,
Billing/Stripe financial and CaseFile/accepted-workflow fulfillment facts. A closed, versioned
status/source policy produces the public state, real named milestones, blockers and process-local
next action; missing critical input yields `unconfirmed`. The client timeline is a governed
derivative of allowlisted real source events, not raw audit history, and retains immutable
provenance, mapping version and correction/supersession links. M010 reuses the complete M007–M009
authorization snapshot, consistent core cut, per-resource authorization epochs and final fence.
Personalized output is private/no-store, normal render is provider-free and exact command ownership
remains Task→M023, Document/deliverable→M011, Message→M012, Appointment→M013, Billing→M014 and
Signature→M067. M010 hands off only to those reauthorizing owners. Proposed ADR 014 records this
candidate boundary. Release 1A derives timeline pages request-scoped from durable owner events/state
and has no M010 projection table, writer or background job; any materializer needs a separate ADR
and Build gate. Until PROC-010 approval, M010 Billing output is only semantic obligation/payment
state, freshness and M014 route, without invoice or transaction detail.

M011 proposes one document domain inside the modular monolith. `DocumentRequest`, logical
`Document`, immutable `DocumentVersion`, explicit context links, review and disposition evidence
live in Postgres; approved Supabase private Storage holds only bytes. The source corpus's MinIO
prescription is normalized to the approved stack and retained only as a future provider possibility
behind `StorageProvider`, never as a parallel Release 1 store. Upload receipt, content safety,
quarantine promotion, operational review, visibility, immutable version lineage and retention/legal
hold are separate axes. Every inbound object follows authorize → quarantine → content/parser
validation → checksum → scan → proven promotion → separately authorized review/delivery. Scanner or
promotion uncertainty fails closed. One M007/ADR 004 resource snapshot plus final parent/
visibility/classification/assurance/lifecycle/version fence governs list, upload, preview, download,
review and disposition. Signed URLs are bounded byte handoffs rather than authority. Inngest
coordinates idempotent jobs while Postgres/outbox state remains durable truth. M065 owns OCR and
extraction, M066 generation, M067 signature, M023 task state, M077 audit and M085 retention. Proposed
ADR 015 records this boundary; no document route, table, bucket or provider is authorized by it.

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
