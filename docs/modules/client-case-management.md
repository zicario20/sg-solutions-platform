# Module PRD — Client and Case Management

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M018, M019, M021, M022, M023

## 1. Purpose

Create the durable operational record for clients, businesses, service orders, cases, tasks and
internal notes across every service vertical.

## 2. Business value

Give SG Solutions one trustworthy view of each relationship and process while avoiding duplicated
client/case logic as new services are added.

## 3. Scope

Person/client/business profiles; service orders; case files; task/checklist execution; assignment;
case milestones/status; internal notes; next step; deadlines; case/client history; archive/cancel;
links to documents, appointments, messages, payments, consent, approvals and vertical extensions.

## 4. Explicit out of scope

Service-specific tax/credit/funding/home-buying calculations, partner underwriting, automatic case
decisions, client identity creation, payment processing and document-byte storage.

## 5. Actors

Owner, Administrator, authorized specialists/support staff, Compliance Reviewer, Read Only, Client
through delegated portal projections and background workflow coordinator.

## 6. User journeys

1. Staff converts a qualified lead or creates a client with duplicate review.
2. Staff creates a service order from an approved catalog item/quote.
3. After payment/approval prerequisites, staff opens a case and assigns responsibility.
4. Staff and workflows create tasks, request documents and update milestones.
5. The client sees only the approved status, missing items and next action.
6. Staff completes, cancels or archives the case while preserving audit/history.

## 7. States and transitions

- Service order: `draft → quoted|payment_pending → paid_pending_approval → approved → active →
  completed|cancelled|refunded` with payment and approval as separate facts.
- Case: `intake_started → information_incomplete → payment_pending → payment_confirmed →
  pending_review → authorized_to_begin → in_progress → waiting_documents|waiting_external →
  completed|cancelled`.
- Task: `open → in_progress → blocked → completed|cancelled`; reopen requires reason.
- Client/business records use active/archived status; archival never erases cases or audit evidence.

## 8. Business rules

- One Person/Client may have multiple service orders and cases; vertical data extends the case.
- A confirmed payment can satisfy a prerequisite but cannot authorize sensitive work.
- Every non-terminal case has a responsible owner, visible internal next action and optionally a
  separately approved client-facing next action.
- Internal notes default internal and cannot be published by merely changing UI location.
- Task completion records evidence and actor; automated tasks identify their originating workflow.
- Case deletion is prohibited in normal operation; cancellation/archive preserve history.

## 9. Authorization rules

Staff permissions combine role and assigned/resource scope. Clients require active case grant and
see only client-visible projections. Internal notes, staff-only tasks, approval rationale and audit
events never inherit portal visibility. Highly Sensitive resources may require explicit access.
Writes use optimistic version checks and authorization before mutation.

## 10. Data requirements

Person/client identifiers and contact references; Business/entity metadata; ServiceDefinition and
price snapshot; ServiceOrder amounts/status/prerequisites; CaseFile service type/status/owner/next
steps/milestones; Task type/priority/assignee/due/dependencies/evidence; Note classification and
visibility; links to consent, approvals, documents, payments, appointments and audit. Money uses
minor units/currency; time uses UTC plus IANA zone where local meaning matters.

## 11. API or service contracts

- `ClientService.createOrMatch`, `updateProfile`, `archive`.
- `BusinessService.create`, `update`, `associateMember`.
- `ServiceOrderService.createFromQuote`, `transition`, `cancel`.
- `CaseService.open`, `transition`, `setNextAction`, `assign`, `close`.
- `TaskService.create`, `transition`, `completeWithEvidence`.
- `NoteService.addInternal`; any future client-visible message uses Messaging, not a note flag.
- All mutations require actor, expected version and idempotency key where retryable.

## 12. Events and background jobs

`client.created`, `service_order.created`, `service_order.approved`, `case.opened`,
`case.status_changed`, `case.next_action_changed`, `task.assigned`, `task.due`, `task.completed` and
`case.closed`. Jobs generate reminders, detect overdue work and materialize portal-safe projections;
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

- A client and business can be reused across multiple service orders without duplication.
- Opening a case requires all configured prerequisites and a separate human authorization state.
- Invalid transitions and stale writes fail atomically.
- Internal notes never appear in portal projections.
- Every active case shows owner, current status and next action.
- Case cancellation/archive preserves tasks, documents, payments, approvals and audit links.

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
- [NEEDS PRODUCT OWNER DECISION: define client/business duplicate-resolution authority.]
