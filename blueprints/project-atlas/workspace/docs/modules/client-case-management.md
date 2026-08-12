# Module PRD — Client and Case Management

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Cross-module architecture summary; M018 has a dedicated implementation-ready candidate;
  open Product Owner decisions remain; no Build gate
- Catalog modules: M018, M019, M021, M022, M023

## 1. Purpose

Create the durable operational record for clients, businesses, service orders, cases, tasks and
their separately owned operational notes across every service vertical. M018 owns only
`ClientOperationalNote`; M022 owns `CaseOperationalNote`; M012 owns conversation-local notes; and
M017 owns `CrmInternalNote`. No authority mutates or copies another note family.

The exhaustive M018 contract is [`m018-client-management.md`](m018-client-management.md), with its
party/lifecycle/representation/aggregate boundary proposed in
[`ADR 022`](../adr/022-client-party-lifecycle-representation-and-aggregate-boundary.md). This file
remains a compact cross-module summary and must not override that dedicated PRD.

## 2. Business value

Give SG Solutions one trustworthy view of each relationship and process while avoiding duplicated
client/case logic as new services are added.

## 3. Scope

Canonical M018 Person/Household/formal Client relationship and M019 Organization/business records
and their respective relationships; service orders; case files;
task/checklist execution; assignment; case milestones/status; internal notes; next step; deadlines;
case/client history; archive/cancel; links to documents, appointments, messages, payments, consent,
approvals and vertical extensions. M015 separately owns reusable typed financial/business profile
facts, provenance, revisions/conflicts and purpose-limited projections.

## 4. Explicit out of scope

Service-specific tax/credit/funding/home-buying calculations, partner underwriting, automatic case
decisions, M007 account/authentication-identity creation, payment processing and document-byte
storage. Canonical natural-person resolution and formal Client lifecycle remain M018-owned exactly
as defined by the dedicated M018 PRD; this summary does not redefine them.

## 5. Actors

Owner, Administrator, authorized specialists/support staff, Compliance Reviewer, Read Only, Client
through delegated portal projections and background workflow coordinator.

## 6. User journeys

1. An authorized M017/M020/M021 handoff requests M018 creation/reuse of the formal client
   relationship with canonical-resolution review; the caller does not create Client directly.
2. Staff creates a service order from an approved catalog item/quote.
3. After the separately evaluated financial prerequisite and human approval prerequisites, staff
   opens a case and assigns responsibility.
4. Staff and workflows create tasks, request documents and update milestones.
5. The client sees only the approved status, missing items and next action.
6. Staff completes, cancels or archives the case while preserving audit/history.

## 7. States and transitions

- ServiceOrder commercial state records accepted scope, internal review, approval, activation,
  completion or cancellation only; it never encodes `paid`, `refunded` or provider state.
- M044 financial assessment is an orthogonal axis:
  `pending|confirmed|reversed|unconfirmed`; obligation lifecycle remains Billing-owned.
- M074/M021 human approval is an orthogonal axis: `pending|approved|rejected|revoked` under its
  approved policy. Financial confirmation cannot transition it.
- Case fulfillment is an orthogonal operational axis such as
  `intake_started|information_incomplete|pending_review|in_progress|waiting_documents|
  waiting_external|completed|cancelled`; exact vertical mappings require their approved PRDs. It
  never contains `payment_pending|payment_confirmed`.
- Refund, dispute, reversal or cancellation on one axis emits a typed fact for human policy review;
  it never automatically chooses a transition on another axis.
- Task: `open → in_progress → blocked → completed|cancelled`; reopen requires reason.
- M018 Client lifecycle and operational-attention axes use only the versioned states/transitions in
  the dedicated M018 PRD §7 and `CLM-005`; this summary defines no reduced `active/archived` model.
  M019 separately owns Organization/business lifecycle after its PRD. Archival never erases cases or
  audit evidence.

## 8. Business rules

- One canonical Person/formal ClientRelationship may have multiple service orders and cases;
  vertical data extends the case without another Person/Client record.
- A confirmed payment can satisfy a prerequisite but cannot authorize sensitive work.
- Every non-terminal case has a responsible owner, visible internal next action and optionally a
  separately approved client-facing next action.
- Internal notes default internal and cannot be published by merely changing UI location.
- Task completion records evidence and actor; automated tasks identify their originating workflow.
- Case deletion is prohibited in normal operation; cancellation/archive preserve history.

## 9. Authorization rules

Staff permissions combine role, assigned/resource scope, purpose and section/field authorization.
Clients require explicit current self/service/case/resource grants under M007/ADR 004 and see only
client-visible projections; email or formal Client status alone grants nothing. Internal notes,
staff-only tasks, approval rationale and audit events never inherit portal visibility. Highly
Sensitive resources may require explicit additional access. Writes use optimistic version checks
and authorization before mutation.

## 10. Data requirements

Opaque M018 Person/ClientRelationship and M019 Organization references; ServiceDefinition and price
snapshot; ServiceOrder amounts/status/prerequisites; CaseFile service type/status/owner/next
steps/milestones; Task type/priority/assignee/due/dependencies/evidence; Note classification and
visibility; links to consent, approvals, documents, payments, appointments and audit. Money uses
minor units/currency; time uses UTC plus IANA zone where local meaning matters.

## 11. API or service contracts

- M018 Client Management queries/commands and events are defined exclusively in the dedicated M018
  PRD §§11–12 and proposed ADR 022; this summary introduces no second `ClientService` shorthand.
- M019 will exclusively define Organization/business queries, commands, relationships and events;
  this summary does not pre-authorize a `BusinessService` contract.
- `ProfileProjectionPort.getPurposeSubset` is consumed only when an approved M015 purpose policy is
  active; client/case services never query profile tables or request a full profile.
- `ServiceOrderService.createOrBindFromAcceptedQuote`, `transition`, `cancel`. The first is an
  M021-owned port invoked by the Billing application orchestrator inside one Postgres transaction
  that commits quote acceptance, exactly one ServiceOrder, exactly one obligation and a composite
  idempotency receipt or rolls all of them back.
- `CaseService.open`, `transition`, `setNextAction`, `assign`, `close`.
- `TaskService.create`, `transition`, `completeWithEvidence`.
- `ClientNoteService.addInternal` creates only M018 `ClientOperationalNote` and
  `CaseNoteService.addInternal` creates only M022 `CaseOperationalNote`. Neither can create, revise,
  redact or delete M012 conversation notes or M017 CRM notes; opaque typed links/projections may
  connect them without copying content or inheriting visibility. Any future client-visible message
  uses Messaging, not a note flag.
- All mutations require actor, expected version and idempotency key where retryable.

## 12. Events and background jobs

M018 events are defined exclusively by its PRD §12. M021/M022/M023 own ServiceOrder/CaseFile/Task
events respectively; this summary does not create alternative dotted event codes. Jobs may generate
reminders, detect overdue work and materialize portal-safe projections only through those owners;
durable state remains Postgres.

## 13. Error states and recovery

Duplicate person/business, stale version, invalid transition, missing prerequisite, disabled
assignee, circular task dependency, case already closed and provider reference unavailable.
Conflicts return 409 with refresh guidance. Manual recovery can reassign, reopen with reason or
reconcile provider state without deleting evidence.

## 14. Security and privacy requirements

Least privilege, RLS, visibility classification, audit of reads/exports and all mutations, no
sensitive notes in telemetry, redacted search/list responses, retention/legal-hold support,
application encryption for fields required by ADR 005 and enhanced review before release.

## 15. UX and accessibility requirements

Client and case headers show identity, service, status, owner and next action without dense text.
Status timelines expose history; forms autosave drafts where safe; destructive transitions require
confirmation/reason; keyboard and mobile operation are complete; loading/empty/error/conflict states
are explicit; dates display with named time zone.

## 16. Bilingual requirements

Client-visible service/status/milestone/task labels and instructions require approved English and
Spanish. Internal notes remain in their authored language. Stable codes, not translated labels, are
stored in data/events.

## 17. Acceptance criteria

- An M018 Person/formal ClientRelationship and separately owned M019 Organization can each be reused
  across multiple service orders without duplication or conflation.
- Opening a case requires all configured prerequisites and a separate human authorization state.
- Invalid transitions and stale writes fail atomically.
- Internal notes never appear in portal projections.
- Every active case shows owner, current status and next action.
- Case cancellation/archive preserves tasks, documents, payments, approvals and audit links.
- A Cartesian state matrix proves ServiceOrder commercial, M044 financial, human approval and Case
  fulfillment axes remain independent; cancellation/refund/dispute/reversal never auto-transition a
  different axis.
- Duplicate/stale quote acceptance and injected failure at every orchestration boundary produce no
  partial acceptance, ServiceOrder or obligation; same-key/same-digest returns the original complete
  receipt and changed semantics conflict.

## 18. Negative acceptance criteria

- No `CreditClient`, `TaxClient` or other duplicate shared primitive.
- No payment event autonomously starts sensitive work.
- No hard delete of active/referenced cases in normal UI.
- No client access based solely on Client ID, email or route knowledge.
- No automated workflow becomes the durable authority for case state.

## 19. Dependencies

Identity/Access, CRM/Pipeline, audit/activity, service catalog/pricing, billing, document center,
scheduling, consent/approvals and each service-specific vertical PRD.

## 20. Risks

Duplicate identities, over-generalized case model, vertical leakage into shared primitives, hidden
client status mismatch, accidental note publication and long-lived stale assignments. Mitigate with
bounded extensions, portal projections, transition invariants, visibility tests and audit.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the Release 1A case status labels and which are shown to
  clients verbatim versus mapped to simpler client-facing labels.]
- [NEEDS PRODUCT OWNER DECISION: define case cancellation/reopening authority and required reasons.]
- [NEEDS PRODUCT OWNER DECISION: approve task priority levels and overdue escalation policy.]
- [NEEDS PRODUCT OWNER DECISION: resolve natural-person/household matching and merge under M018
  `CLM-022`; M019 must separately define Organization/business resolution and cross-owner
  coordination without a shared generic merge authority.]
