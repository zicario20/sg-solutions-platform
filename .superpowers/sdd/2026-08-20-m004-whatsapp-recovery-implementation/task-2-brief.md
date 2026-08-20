# Task 2 brief: Extract the canonical communications kernel from M003

Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md

## Files
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts`
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts`
- Create `blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts`
- Modify `blueprints/project-atlas/workspace/packages/domain/src/index.ts`
- Modify M003 public-chat contracts, state machine and service only as required for compatibility.
- Create `blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts`
- Modify `blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts`

## Required behavior
- Canonical provider-neutral unions for channel kind, locale, connection, inbound event, outbound command, contact policy/consent, template lifecycle, conversation ownership and binding trust.
- Canonical InboundChannelEvent, OutboundMessageCommand, OutboundDispatchAttempt, ChannelContactPolicy, ContactChannelBinding, ChannelConversation, ChannelMessage, ChannelParticipant, ChannelHandoffReceipt, CanonicalMediaReference, DomainReceipt, ProviderCapabilitySnapshot, MessageTemplateProjection and minimized ChannelAuditEvent.
- No domain type contains Meta/WABA fields, raw phone numbers, credentials, arbitrary URLs, client/case facts or payment state.
- M003 public types remain compatibility aliases or bounded wrappers. Preserve every M003 transition, visitor-safe projection, session ownership and idempotency behavior.
- Shared state cannot depend on a public-chat session; that is an M003 participant binding.
- Pure exhaustive transition functions; monotonic delivery precedence; explicit terminal checks. Unknown/regressive callbacks return result codes rather than mutating through exceptions.
- `quarantined` exists but is unreachable while KMS/quarantine is disabled.

## TDD and acceptance
- First add table-driven failing tests for every allowed/forbidden transition, duplicate semantics, out-of-order precedence, terminal behavior and exhaustive M003 equivalence.
- Add serialization tests proving no provider-specific field names.
- Run focused RED, implement minimal contracts/state machines, run focused GREEN plus M003 regression and domain typecheck, then full suite once.
- Candidate commits `c6236b0` and `f6c6e0f` are reference material only. Selectively reproduce compliant behavior; do not merge later tasks.
- Commit only Task 2 files.

## Report
Write `.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-2-report.md` with RED/GREEN/full-suite evidence, files, self-review, commit SHA and concerns.