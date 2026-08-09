# M012 Mensajería segura — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `f58dcfd8ae1f15fb0582a6672787cbf42207f488`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete Product Owner-supplied M012 source, the 21-section PRD,
responsive Client/Staff design, proposed ADR 016, all twenty `MSG-001`–`MSG-020` gates and every
synchronized architecture, API, security, recovery, activation, roadmap and ownership document in
the fresh candidate delta. The review was read-only and changed no repository file.

M012 remains one authenticated secure-portal capability inside the modular monolith. It is not an
omnichannel provider, parallel CRM/case-note store, document authority, notification service,
analytics platform, compliance authority, AI agent or independently deployed application.

## Findings and closure

### IA-001 — Attachment UX bypassed its activation gate — Closed

`Attach securely`, its status region, preflight and upload-intent call are now absent until MSG-007
and every applicable M011 DOC gate are active. Gate-off behavior is explicit in the PRD, journey,
design and regression criteria.

### IA-002 — Priority and tag policy was missing from MSG-009 — Closed

MSG-009 now owns queue/routing plus priority bands, ties, defaults, change authority, tag taxonomy
and human/rule/AI-suggestion acceptance. No priority or tag activates by implication.

### IA-003 — Quoted reply targets lacked nested-resource authorization — Closed

`replyToRef` must resolve before commit to an eligible current client-visible revision in the same
authorized conversation and is bound into the command digest. Cross-client/context/thread,
internal, redacted and withdrawn targets fail uniformly without an excerpt or existence signal.

### IA-004 — Public-message and private-note ordering conflicted — Closed

Gap-free `clientMessageSequence` governs Client order/read/count/cursors. Private
`staffActivitySequence` orders authorized staff messages and notes. Client DTOs never receive staff
gaps, counters or timestamps. Conversation notes have their own immutable revision records and no
duplicate body on the aggregate.

### IA-005 — M012 and M018 internal-note ownership overlapped — Closed

M012 owns only conversation-local notes; M018 owns client/case operational notes. Neither service
creates, revises, redacts, deletes or copies the other's type. Only opaque typed links or authorized
projections cross the boundary, and neither note family inherits Client visibility.

### IA-006 — Analytics and observability ownership was incomplete — Closed

M092/PostHog product analytics remains off until MSG-018. M097 independently owns required content-
free, identifier-free operational/security telemetry under its own readiness controls. M077 retains
restricted reference-bearing audit/incident evidence. None receives transcript or session replay.

### IA-007 — “PII-free” falsely described opaque recipient references — Closed

Notification/domain contracts now acknowledge that opaque references are pseudonymous identifiers.
M026 may receive only purpose-bound recipient/event references inside the first-party boundary and
rejects direct contact PII, protected content and business-resource identifiers.

### IA-008 — Internal-note UI bypassed MSG-005 — Closed

The note body, control, route state, service call and revision events are absent until MSG-005 is
active. There is no fallback generic audience/visibility toggle.

### IA-009 — One aggregate CAS leaked hidden-note activity — Closed

Client replies use a separate client-writability version plus lifecycle/block/grant fences; notes
use a staff-activity version. Note-only writes cannot alter Client order, last-visible time, cursor,
ETag, response, error or timing. Close, block and revoke still abort Client writes.

### IA-010 — Initial encrypted revision atomicity was incomplete — Closed

Aggregate, applicable counters, encrypted immutable initial revision/current pointer, idempotency
receipt and outbox/audit evidence commit in one transaction. Encryption, revision, pointer or outbox
failure rolls back every row, counter and reservation; recovery preserves the same invariant.

### IA-011 — AI compliance ownership overreached M076 — Closed

M047–M060 own AI/model/tool/evaluation behavior only. M060 remains subordinate to M076 compliance
policy and human-required decisions. AI/service identities cannot grant note access, approve,
redact, export or replace human authority.

### IA-012 — M012 administrator overreached role authority — Closed

M012 may contribute approved domain policy/template configuration through M090. M080/M081/M091
retain IAM, RBAC and staff-role administration; M012 administration cannot assign a role or widen
its own transcript scope.

### IA-013 — M025 projection could become a second transcript store — Closed

The M025 list/assignment projection schema cannot represent bodies, notes, quotes, translations,
attachment titles or protected subjects. Staff detail is a request-scoped fresh M012 query and
leaves no M025 protected-content copy or cache.

## Final architecture properties

- One governing account-support, ServiceOrder or CaseFile root controls each conversation.
- Participation and assignment never grant access; M007/ADR 004 plus domain/RLS/final fences do.
- Public Message and private ConversationInternalNote are structurally distinct at record, command,
  revision, permission, event, DTO and UI boundaries.
- Two ordering/CAS/time domains preserve deterministic staff history without leaking hidden notes.
- All bodies and derived free-text summaries are encrypted before persistence and immutable by
  revision; accepted partial aggregates are impossible by contract.
- M011 owns attachment bytes, M018 case notes, M025 content-free inbox projection, M026 delivery,
  M076 compliance, M077 audit, M092 analytics consumption and M097 observability transport.
- Twenty unresolved policies remain one-to-one `MSG-001`–`MSG-020` Product Owner decisions.

## Verification snapshot

The final independent pass reported zero open architecture, authorization, accessibility or
documentary-consistency findings. It verified 21 required PRD sections, 20 Product Owner markers and
one occurrence each of `MSG-001`–`MSG-020`. `corepack pnpm format:check` checked 143 files without
changes and `git diff --check` passed. No code, manifest, dependency or lockfile was changed.

## Limitations

This review does not validate routes, database schema, RLS, encryption/KMS implementation,
concurrent runtime behavior, providers, notifications, AI, accessibility in a browser or real
messages. Those require Product Owner decisions, a separate Build gate, implemented controls and
independent runtime review.

This report permits only Product Owner documentary review. It does not accept ADR 016 or authorize
`GENERATE`, Build, provider activation, merge, deployment or production use.
