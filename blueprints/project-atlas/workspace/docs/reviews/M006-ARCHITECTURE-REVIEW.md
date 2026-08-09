# M006 Public Forms — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `953b1a13f0c40070f94b98c44c44c9b744a55fe0`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer read the current M006 worktree authorities and all modified/untracked Markdown paths,
including the PRD, architecture/experience design, ADR 010, state, roadmap, decisions, dependency
map, activation register, earlier channel ownership references, indexes and Cyber Neo evidence.

The final candidate preserves:

- 21 required PRD sections;
- 14 explicit Product Owner decisions mirrored by 14 deferred `FORM-*` activation rows;
- Draft/Registered status with no `GENERATE`, Build, route, data, provider or deployment authority;
- the approved Astro/Next/TypeScript/Postgres modular-monolith baseline;
- M006 ownership of public form/evidence capture, M078 consent truth, M020 lead/deduplication and
  M077 audit;
- Product Owner as final authority, Codex as architect and independent reviewers as auditors; and
- minimal bilingual Release 1A capture with no public uploads or persistent anonymous Confidential
  drafts.

## Findings and closure

### IA-001 — prohibited-data quarantine contradicted zero persistence — Closed

Initial risk: one retention path could be read as preserving quarantined prohibited content even
though the security boundary required Highly Sensitive public-form content to leave no durable
copy.

Closure:

- `risk_review` may contain only approved Confidential fields under normal access/retention controls;
- suspected Highly Sensitive or prohibited content is discarded or irreversibly redacted before
  submission, consent, outbox, log, telemetry or model persistence;
- only an opaque content-free incident reason may survive; and
- Release 1A has no raw forensic quarantine. Any future forensic retention needs a separate enhanced
  security, privacy and Product Owner gate.

### IA-002 — unkeyed answer checksum exposed correlation/guessing — Closed

Initial risk: a deterministic content checksum could permit offline guesses for low-entropy answers
or correlate people across unrelated purposes.

Closure:

- unkeyed answer/contact checksums are prohibited;
- optional repeated-payload evidence uses a server-secret HMAC over a canonical length-prefixed
  envelope;
- the envelope is scoped to purpose, form/version, bounded time bucket and key epoch;
- only scoped digest, key version and short expiry may persist; and
- rotation, deletion and negative cross-purpose tests are required.

### IA-003 — nonce expiry lacked an accessible extension path — Closed

Initial risk: a short-lived nonce could impose an inaccessible time limit on a visitor completing a
form slowly.

Closure:

- an accessible warning precedes expiry;
- the visitor controls renew/extend and can repeat it within the bounded server policy;
- renewal preserves only current-page memory and transmits/persists no answers;
- the binding remains form/version/locale/purpose specific; and
- an unavailable extension requires a documented WCAG security exception and equivalent human path
  before publication.

### IA-004 — M006/M078/M020 ownership references were stale — Closed

Initial risk: M001 and M003 references grouped form capture, consent and lead responsibilities,
which could let a later implementation assign consent truth to M020.

Closure: M001 and M003 now state M006 form/evidence capture, M078 consent authority and M020 lead/
deduplication authority explicitly.

### IA-005 — `risk_review` could imply premature lead handoff — Closed

Initial risk: the first design appended a lead outbox in the same generic transaction used for
`risk_review`, despite the PRD saying that review withholds lead promotion. It also lacked an
authorized review transition.

Closure:

- `risk_review` produces only a neutral non-success review receipt, audit and manual-review work;
- it emits no M020 outbox or dispatch;
- `RiskReviewService.resolve` requires actor, reason, expected state/version and compare-and-set;
- only the successful atomic `risk_review → accepted` transition appends one idempotent M020 command;
- rejection, stale work and concurrent losing decisions have no lead side effect;
- `LeadCapturePort` accepts only an `acceptedSubmissionRef`; and
- future tests pause concurrent decisions before CAS, before commit and after commit to prove no
  premature or duplicate promotion.

### IA-006 — prior channel PRDs still grouped authorities — Closed

Initial risk: M004/M005 and related designs/ADR 008 still used `M006/M020` shorthand for capture,
consent and promotion, contradicting the newly explicit ownership boundary.

Closure: M003–M005 designs, M004/M005 PRDs, ADR 008 and the public-growth capability map now name
M006 capture/evidence, M078 consent and M020 lead/deduplication separately. Historical review reports
remain historical evidence and do not override the current module authorities.

### GOV-001 — nonce-consumption wording was narrower than review state — Closed

The PRD/design formerly said the nonce was consumed only at final/accepted submission, while the
atomic flow correctly consumed it for durable `risk_review`. The current contract consumes the
nonce when either durable `accepted` or `risk_review` receipt commits and returns only the original
matching receipt within the exact idempotency scope.

### GOV-002 — documentation index had stale review status — Closed

The documentation index now links the Cyber Neo report and records its `SECURITY-CLEAR` result. This
independent report replaces the remaining pending-review statement.

## Security-review reconciliation

Cyber Neo revalidated the complete post-remediation candidate after IA-005/006 and reconfirmed:

- CN-001 exact canonical HTTPS origin/trusted-proxy boundary remains closed;
- CN-002 bounded raw/stream parsing before object materialization remains closed;
- `risk_review` cannot promote a lead before an authorized atomic acceptance;
- cross-channel authority references create no alternate promotion route; and
- final documentary risk is `0/100 — Secure`, with no Critical/High/Medium/Low finding.

See [M006 Security Architecture Review](M006-SECURITY-REVIEW.md).

## Consistency checks

- M006 is one shared capability in SG Solutions Platform, not another CRM or specialist intake app.
- Astro stays static-first and the proposed gateway has no direct database/provider authority.
- Detailed/private intake and document upload remain outside the public Release 1A boundary.
- Durable internal acceptance precedes truthful receipt copy; external delivery is never truth.
- Missing form inventory, fields, copy, retention and provider policies remain explicit Product
  Owner decisions rather than invented defaults.
- The approved technical stack and single-organization product model remain unchanged.
- No file claims M006 code, traffic, provider connectivity, deployment or Operational status exists.

## Verification snapshot

The independent final pass covered 25 candidate paths and 6,536 lines before this report was added.
It confirmed:

- PRD 21/21 required sections;
- 14 Product Owner decision markers and 14 deferred `FORM-*` rows;
- 83 local Markdown links checked with none broken;
- no trailing whitespace, conflict marker, TODO/TBD/FIXME, apparent secret or local absolute path;
  and
- `git diff --check` passed.

## Limitations

This was a documentary review. It did not validate a deployed proxy, Astro parser, browser flow,
Postgres transaction/RLS, multi-instance nonce/CAS behavior, CRM/email provider, accessibility
runtime, retention job or real submission. Build and controlled activation require separate Product
Owner authorization, implementation evidence and independent review.

The independent reviewer did not modify the repository. The Product Owner remains the final
architecture authority.
