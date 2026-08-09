# M012 Mensajería segura — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the M012 PRD, design, ADR 016 and synchronized authorities for BOLA/RLS/final
fences, Client/Internal serialization, ordering, read evidence, idempotency, encryption, cursors,
attachments, links/XSS/SSRF, AI/human handoff, telemetry, retention, recovery and repository
hygiene. The audit was read-only and changed no repository file.

## Finding closure

### CN-001 — Generic Message audience could represent staff-only content — Closed

Every `Message` is client-visible by invariant and carries only `authorKind`. Staff/compliance
content exists exclusively in the separate ConversationInternalNote family.

### CN-002 — Read advancement accepted an untrusted future sequence — Closed

Advancement now requires a server-issued actor/participant/conversation/page/epoch receipt, visible
upper bounds, monotonicity and current authorization. Staff-activity sequences are invalid inputs.

### CN-003 — Unexpected PII in ordinary free text lacked a cryptographic fallback — Closed

Every accepted message, note, revision and derived free-text handoff/translation summary enters
application envelope encryption before persistence. KMS failure is atomic/fail-closed and leaves no
plaintext draft, rejection, summary, outbox, audit or backup artifact.

### CN-004 — Initial conversation creation lacked pre-reference idempotency — Closed

Start reserves actor/canonical-root/reason/policy/idempotency plus digest before a conversation
reference exists, in the same transaction as the complete aggregate and evidence. Same digest
returns the original; changed digest conflicts.

### CN-005 — Pagination cursor scope and integrity were undefined — Closed

Cursors are opaque and authenticated, bound to actor/account/scope/filter/order/snapshot/policy/
authorization epochs and expiry. Tamper, cross-scope replay, changed filter, revocation and expiry
fail uniformly without counts or existence leakage.

### CN-006 — Handoff summaries could copy Highly Sensitive text outside encryption — Closed

Structured reason/pointers are preferred. Any derived free text follows the same pre-persistence
encryption, minimization, telemetry, search, retention and backup controls as its protected source.

## Final security properties

- Domain authorization plus restricted RLS and final fences protect list/detail/count/cursor/body/
  write receipts; no user flow uses service-role or BYPASSRLS authority.
- Reply targets, typed owner links and M011 attachments each reauthorize in their owning boundary.
- Plain-text rendering, no active Markdown/HTML/unfurl and typed links bound XSS, redirect, SSRF and
  phishing exposure.
- Separate Client/staff sequences and CAS/time domains prevent hidden-note gap/timing/version leaks.
- Initial revisions/current pointers/receipts/counters/outbox commit atomically and restore together.
- M025 cannot store protected content; M092 analytics is gated; M097 telemetry is content- and
  identifier-free; M026 receives no direct contact PII or protected content.
- AI treats user text as untrusted data and loses publish authority atomically to human takeover.

## Repository hygiene and supply chain

- Candidate secret/credential/token/PII/private-URL/local-path/media scan: zero findings.
- Candidate files are Markdown only; no manifest, dependency, lockfile or workspace configuration
  changed.
- `pnpm-lock.yaml` remained SHA-256
  `C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`.
- `git diff --check` passed; lockfile and active-workspace secret checks passed.
- Semgrep, Trivy and Gitleaks were unavailable; Cyber Neo performed manual documentary SAST.
- Eleven localhost/test PostgreSQL strings exist in archived pre-roadmap files. They predate M012,
  are outside this delta and were not reproduced or changed; future archive hygiene may redact them.

## Limitations and activation gates

`0/100` is a documentary assessment, not proof of runtime security. Build still requires resolved
Product Owner policies, accepted ADRs, implemented domain/RLS/encryption controls, malicious-input/
race/failure-injection/restore tests and independent review of actual code/configuration.

This report does not approve ADR 016, `GENERATE`, Build, external activation, merge, deployment or
production use. The Product Owner remains final authority.
