# Module PRD — Audit and Activity History

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M077 and cross-cutting audit capability

## 1. Purpose

Create trustworthy, minimized evidence of security-sensitive and operational actions without copying
protected business content into logs.

## 2. Business value

Support accountability, investigations, client-service history, payment reconciliation, compliance
review and safe recovery as SG Solutions grows beyond one operator.

## 3. Scope

Append-only audit events; actor/agent/session/correlation; action/resource/result; policy/version;
before/after summaries for approved fields; privileged-read/download/export events; activity views;
retention/legal hold; integrity/tamper detection; export approval and audit-query access.

## 4. Explicit out of scope

Storing full document/message/note content, replacing observability logs, blockchain/event sourcing,
client-visible internal audit, employee surveillance beyond security/operational need and retroactive
reconstruction of unrecorded events.

## 5. Actors

Authenticated user, service identity, approved AI agent, provider callback, background job,
Compliance Reviewer, Owner/admin and independent auditor.

## 6. User journeys

1. A sensitive command records intent/result with the same correlation ID as the transaction.
2. Staff views a chronological case activity projection appropriate to role.
3. Compliance filters privileged actions, failed authorization or downloads for review.
4. An incident owner exports a bounded, approved evidence set.
5. Retention jobs delete eligible events unless legal hold applies and record the operation.

## 7. States and transitions

Audit events are immutable after append: `accepted` or `rejected` at ingestion. Export requests use
`requested → approved|denied → generated → expired|deleted`. Legal holds use
`active → released`. Correction of erroneous business data creates a new event; it never edits prior
evidence.

## 8. Business rules

- Audit write belongs to the same transactional outcome or a fail-safe durable outbox.
- Event content is allowlisted and classified before persistence.
- Business free text and secrets are never copied into audit payloads.
- Read events are required for Highly Sensitive values/documents, exports and privileged admin views.
- Clock, actor and policy versions must be attributable; automated agents identify model/tool/run.
- Absence of an audit event for a required mutation is a failed operation or incident, not success.

## 9. Authorization rules

Clients do not access internal audit events; separate client-safe activity timelines are projections.
Compliance/Owner permissions are required for broad searches/exports. Normal staff can see bounded
case activity only within their resource scope. No actor can modify/delete events outside approved
retention/legal-hold workflows.

## 10. Data requirements

Event ID; occurred/recorded timestamps; actor type/ID; session/service/run ID; action; resource type/
opaque ID; case/client scope; outcome/reason code; authorization/policy version; correlation/
idempotency/provider event ID; approved change summary; source IP/session metadata when justified;
hash/integrity metadata; classification; retention/hold reference. No secrets or protected content.

## 11. API or service contracts

- `AuditService.append(eventDraft, transactionContext) → EventId`.
- `AuditQueryService.search(actor, filters, cursor) → redacted events`.
- `ActivityProjectionService.forCase|forClient` with field allowlists.
- `AuditExportService.request|approve|generate|expire`.
- `LegalHoldService.apply|release`.

## 12. Events and background jobs

Audit consumes security/business events through a transactional outbox where direct append is not
possible. Jobs verify chain/integrity markers, apply retention, expire exports and detect missing
required event pairs. Jobs are idempotent and cannot rewrite accepted history.

## 13. Error states and recovery

Audit storage unavailable, schema/allowlist rejection, duplicate correlation, missing actor,
retention conflict and integrity mismatch. Sensitive mutations fail closed when required evidence
cannot be recorded. Asynchronous integrations remain pending/manual-review until audit persistence
succeeds. Integrity mismatch escalates as a security incident.

## 14. Security and privacy requirements

Append-only permissions, separation of write/query/export roles, encryption at rest, strict
redaction, query rate limiting, audited audit-access, no PostHog replication, protected exports,
legal-hold enforcement and independent tests for injection/tampering/cross-client filtering.

## 15. UX and accessibility requirements

Chronological views distinguish human, automated and provider actions; show clear outcome/reason;
offer keyboard filters and accessible tables; never expose raw JSON by default; display time zone;
and explain redacted fields. Export/hold actions require confirmation and status feedback.

## 16. Bilingual requirements

Stable codes are locale-neutral. Approved event labels/outcome explanations in staff/client-safe
projections require English/Spanish. Evidence exports retain original user-authored language without
machine translation.

## 17. Acceptance criteria

- Required mutations cannot report success without durable audit evidence.
- Audit records never contain configured secret/sensitive-content patterns.
- Authorized reviewers can trace grant, payment and document-download histories by correlation.
- Events are immutable; corrections append new events.
- Unauthorized users cannot search/export broad audit history.
- Retention respects active legal hold and produces evidence.

## 18. Negative acceptance criteria

- No document bytes, message/note bodies, SSN, token or raw request body in audit.
- No client access to internal audit data.
- No event update/delete through ordinary application services.
- No analytics tool used as the audit source of truth.

## 19. Dependencies

Identity/Access, data classification/encryption, Postgres transaction/outbox design, retention/legal
hold policy, observability redaction and every sensitive module.

## 20. Risks

Sensitive overcollection, missing evidence, tampering, excessive retention, misleading timestamps
and privileged export abuse. Mitigate with allowlists, transactional durability, integrity checks,
least privilege and retention/hold controls.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve audit retention by event class and legal-hold authority.]
- [NEEDS PRODUCT OWNER DECISION: approve which staff roles may query or export audit evidence.]
- [NEEDS PRODUCT OWNER DECISION: define which source-IP/session attributes are justified for
  operational and legal needs.]
