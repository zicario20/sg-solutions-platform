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
3. **Resource access:** membership links identity to a client but grants no case/profile access;
   explicit case/resource grants and, when approved, an M007 self-profile-root grant determine which
   records a client may access.

An explicit active case grant inherits only to client-visible child resources within that case.
Internal notes never inherit visibility. Highly sensitive documents/fields may require an additional
grant. Any resource may block inherited visibility. Revocation propagates to derived access and signed URLs
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

M012 proposes one authenticated secure-portal messaging authority over the shared conversation
kernel. Every conversation has one account-support, ServiceOrder or CaseFile root; participant and
assignment records never grant access. Client messages and conversation-local internal notes use
separate records, commands, DTOs, events and UI controls. Gap-free client-message sequence/client-
writability/visible-time is distinct from private staff message/note activity sequence/version/time,
so notes cannot alter Client order, cursor, ETag or errors. Posts atomically commit authorization,
applicable counters, encrypted initial immutable revision/current pointer, aggregate, idempotency
receipt and outbox/audit; any failure rolls back every row/counter/reservation. M011 owns all attachment bytes and safe delivery;
M013/M014/M023/M067 own their typed actions; M026 owns notifications; M025 owns a content-free unified
cross-channel inbox projection; M047–M060 own AI/model/tool behavior subordinate to M076 compliance
policy and human decisions. M018 owns client-level operational notes, M022 owns case-level notes,
M017 owns CRM internal notes and M012 owns conversation-local notes. A final M007/ADR 004 resource
fence governs body, counts, cursors, read evidence and writes. Protected transcript content never
enters logs, telemetry, notification payloads or browser persistence. Proposed ADR 016 records this
boundary; no route, table/RLS policy, provider, AI, notification or real message is authorized.

M013 proposes one appointment authority inside the modular monolith. It owns versioned appointment
types/availability policies, holds, appointments, client/public projections, cancellation/
rescheduling, attendance/structured outcomes and Google/meeting projections; M024 owns only the
internal calendar experience and calls M013 ports. A static-first Astro `/book` shell uses a narrow
same-origin Public Scheduling Gateway with no DB/provider credential; dynamic actor-bound responses
are private/no-store, a credential-free Origin/Fetch-Metadata bootstrap creates the opaque server-
side session and later browser mutations require Origin + CSRF. Gateway→app calls use a rotating
workload signature bound to environment/audience/service/method/path/body/time/nonce/key version and
RecoveryEpoch, with replay rejection, inner quotas and fail-closed outage. M020/M078 reserve scheduling-only
prospect context and finalize it atomically with the winning appointment. Slot derivation uses UTC
instants plus IANA evidence, versioned policy and independently complete/fresh external calendar
sources. Positive-duration half-open capacity, single-use holds, Postgres transactions, expected
versions and opaque-only digest-bound idempotency decide conflicts; browser/Google never do. Pending
prerequisites retain or release capacity only under APT-006, and rescheduling secures the new interval
before releasing the old. Appointment, prerequisite/payment, attendance, structured outcome,
provider sync and reminder axes stay separate. Google OAuth and push use one-time/pending transactions;
provider credentials/secrets stay in vault boundaries, per-source cursors/coverage fail closed,
calendar projections default to zero attendees/no provider mail and meetings launch through an exact
HTTPS allowlist. M003–M006/M012/M051 use M013 contracts, not channel calendars or direct AI authority.
M014/M042–M046 retain catalog/pricing/money/verification/entitlement authority, M026 delivery, M077
audit, M085 retention and M092 reporting. Proposed
ADR 017 records this boundary; no route, schema/RLS policy, calendar, credential, provider traffic or
real appointment is authorized.

M014 proposes the client billing projection/action boundary over one shared Billing bounded context;
it is not a portal-owned payment model. M021 retains `ServiceOrder` and human approval-to-start,
M042 catalog, M043 Stripe/provider objects and mutations, M044 verified-payment qualification and
reconciliation, M045 entitlements, and M046 versioned prices/discounts/waivers. Accepted quotes and
payment obligations bind immutable line-item, terms and policy versions using integer minor-unit
money plus currency. `QuoteAcceptanceOrchestrator` commits acceptance, M021 order create-or-bind, one
obligation and one composite receipt atomically. Every Checkout/refund/provider mutation reserves a
semantic Postgres operation with a canonical digest, exact protected/reproducible provider token and
opaque non-PII SG correlation before the adapter call; bound object evidence or bounded correlation
lookup resolves uncertainty, while provider-key expiry/ambiguity quarantines rather than reissuing.
Stripe is external
financial authority, while Postgres owns operational facts, allocations, approvals, access and
recovery. Signed raw-body webhooks enter a generation-bound composite account/environment/event
inbox; every event triggers canonical provider-object retrieval and object/fact dedupe before provider
fact, operational journal/allocation, obligation projection, audit and outbox commit atomically.
Duplicate/out-of-order or ambiguous state reconciles instead of using last-event-wins. Browser return,
payer email, provider
customer and payment never prove payment identity, membership, grant or service approval.
Client/Public/Staff DTOs are structurally separate and every read/handoff/mutation final-fences one
explicit service-order/case root. Checkout/receipt/invoice/Customer Portal destinations are transient
bearer-like handoffs validated against exact activated HTTPS provider scheme/host/path/object policy,
not stored authorization. Public entry/return secrets are distinct, inert on GET/HEAD and exchanged
through controlled POST/OTP into a clean host-only session. Restore fences old-generation webhook
acknowledgement, advances a protected generation, opens new ingress before mutation egress and
requires bounded Stripe reconciliation before newly satisfying a financial prerequisite. Proposed
ADR 018 records this boundary; BIZ-001–003 and PAY-001–PAY-020 gate prices, policy, Build and all
Stripe traffic.

### M015 purpose-bound profile boundary

M015 owns reusable typed profile facts, immutable revisions, provenance, verification/freshness,
corrections/conflicts and minimized purpose projections. It does not absorb M007 identity/grants,
M017 CRM relationship/contact projection, M020 Lead/deduplication, M018 Person/Household/Client or their relationships, M019
Organization/business relationships, M021 ServiceOrder, M022 CaseFile, M011 documents/bytes or
specialist credit/tax/funding/housing records. Its household/business context extends authorized
M018/M019 projections, never a second relationship or business registry.

Client and staff access requires an explicit self-profile or service/case resource relationship plus
permission, purpose/consent, classification, assurance and final resource/access-epoch fences.
Household/business relation, role, email, payment and matching contact data grant nothing. Services
consume versioned allowlisted DTOs; no full-profile contract exists. Forms, document/OCR outputs,
providers and AI can only propose revisions. Verified/document-supported facts use immutable
revision/conflict review, never last-write-wins. Proposed ADR 019 records the boundary, and
PFL-001–PFL-020 gate all fields, policies, Build and live processing.

M007 owns profile/resource grants and M078 consent; M015 owns purpose-field policy only. Every M015
access snapshot, capability and job binds a monotonic `ProfileRecoveryEpoch` protected outside a
restored database generation. Recovery advances it, rejects all old artifacts and blocks protected
profile access until grants/consent revocations are reconciled from independent post-checkpoint
evidence or explicitly reissued. A restored Postgres snapshot cannot validate itself.

### M016 role-scoped administrative composition boundary

M016 owns one authenticated Admin dashboard aggregation/BFF contract, versioned widget definitions,
deterministic operational-priority composition, freshness/coverage/partial-failure semantics and
optional derived preferences/snapshots. Canonical owners retain client, business, lead, order, case,
task, document, communication, appointment, financial, approval, risk, analytics and observability
state. M016 consumes typed minimized projection ports and cannot import provider SDKs or mutate those
records.

One canonical server-derived authorization fingerprint inseparably binds actor/account, session plus
auth epoch/assurance, membership, exact permission/role/team/assignment, exact resource grants/access
epochs, purpose, classification ceiling/clearance, dashboard/widget/owner-contract/policy versions,
normalized filters/period/locale/IANA zone, source version and external recovery generation. Every
source request, snapshot/cache lookup and final response requires exact equality; a missing or changed
dimension misses/purges/fails closed even with delayed invalidation. The opaque digest never enters a
client DTO, URL, log or analytics. Authorization is evaluated per widget and final response; the
browser never receives a broad result for local filtering. Values carry source, definition, period,
freshness and coverage. A confirmed zero never stands in for partial, stale, unavailable, suppressed
or denied. Drill-down passes only allowlisted filters/opaque references and every destination
reauthorizes. Proposed ADR 020 records the boundary; `ADM-001`–`ADM-020` gate exact widgets,
policies, schemas and Build/live behavior.

A future M016 recent-activity widget consumes only a minimized versioned M077/canonical-owner event
projection with event allowlist, exact resource authorization, freshness/coverage and reauthorized
drill-down. It is not raw audit history and excludes invalidation payloads, technical/private events
and event content.

### M017 party, CRM and conversion boundary

M017 owns `CrmRelationship`, `Opportunity`, durable versioned `OpportunityRelation`, versioned `PipelineDefinition` and
`PipelineStageDefinition`, assignment history, CRM-authored activities/internal notes, controlled
source attribution and CRM data-quality orchestration. M018 remains the canonical Person,
Household, Client and contact-method owner; M019 owns Organization/business relationships; M020 owns
Lead/capture duplicate handling; M021/M022/M023 own ServiceOrder/CaseFile/Task. M017 composes those
owners through typed, minimized, freshness-aware ports and reauthorizes every drill-down rather than
copying records or bodies.
Contact 360 accepts only a closed versioned section registry and authorizes each named owner port
independently with exact refs/versions/purpose/classification/grants/access epochs/freshness. M020
owns Lead qualification. Optional Task links and Opportunity organization context final-fence the
current M023/M019 owner-issued relationship/purpose/visibility/classification/access receipt; owner
correction/revoke/end/reassignment invalidates the minimized link without fallback or owner mutation.
Protected reveal values remain transient/no-store and separate from value-free M077 attempt receipts.

The M017 application facade lives inside the modular monolith. It derives the complete actor/session/
membership/permission/role/team/assignment/grant/purpose/classification context server-side,
authorizes before matching/counting/pagination and applies RLS as defense in depth. Postgres remains
durable state authority; Inngest coordinates bounded retries/reconciliation only. No Redis, generic
event bus, microservice or external CRM is introduced by this candidate.

The CRM root is identity-neutral and has only current/superseded state. Each exact purpose binding
owns its commercial engagement lifecycle, assignment and pre-Opportunity next action; ordinary work
never mutates those fields across bindings. A separately authorized minimized proposal-review path
is the only way to inspect/activate/reject a bootstrap proposal before it becomes ordinary CRM work.
Opportunity list/detail/pipeline, activity/note/quality queues, configuration and import/export status
use explicit server-side query contracts; presentation never reads tables directly.

Opportunity, Client, ServiceOrder, payment, entitlement, approval-to-start and CaseFile axes remain
independent. Conversion records versioned, idempotent owner results and cannot manufacture success
from a partial/ambiguous response. M020/M017 may surface duplicate evidence, while M018/M019 retain
canonical resolution. Protected email/phone matching uses domain-separated keyed tokens whose key
and version live outside Postgres/backups; name-only, unkeyed-hash and AI-only merges are prohibited.
High-risk resolution uses dry-run impact/conflicts, expected versions, aliases/tombstones, audit and
recovery. Enhanced execute binds the exact approved plan ID/version/digest/unused state, complete
final scope, current assurance and applicable SoD; read-only reconcile and enhanced resume use
stable step IDs, current closed scope and recovery epoch so accepted/ambiguous effects cannot replay.
Opportunity duplicate resolution is separate from canonical party merge and final-fences
both purpose epochs plus downstream owner inventory; it preserves owner facts/history and blocks
incompatible or concurrent conversion. Its candidate is review workflow; the resulting immutable,
acyclic `OpportunityRelation` remains the commercial relation authority after review. Proposed ADR
021 and `CRM-001`–`CRM-023` gate Build/live behavior.

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
