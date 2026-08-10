# M013 Client Appointments — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `4fcbf42576fc6227c5444d797ee2660d1d23da74`
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the final post-contrast M013 PRD, design, ADR 017 and synchronized authorities for
BOLA/RLS/final fences, CSRF, workload authentication/replay, availability/concurrency, public
contact minimization, OAuth/watch integrity, Calendar/Meeting gates and teardown, vault/secrets,
RecoveryEpoch, retention, telemetry, backup/restore and repository hygiene. The audit was read-only
and changed no repository file.

## Security properties verified

- Exactly one resource/direct access binding controls an appointment; deny/block wins, associations
  never grant and domain authorization plus restricted RLS and final fences protect every result.
- The same-origin Gateway has no database/CRM/provider credential and calls only a signed,
  audience-bound `PublicSchedulingFacade`; raw contact/consent reaches only M020/M078 through the
  internal application orchestrator.
- Credential-free bootstrap uses exact Origin, Fetch Metadata, trusted edge/host and fixation
  rotation; every later browser mutation uses exact Origin plus session-bound CSRF and GET/HEAD is
  inert.
- Internal workload proof binds environment, issuer, audience, service, method, path, transient body
  digest, timestamp, nonce, key version and RecoveryEpoch. Nonce claim is atomic and uncertainty
  fails closed.
- Holds are single-use, digest/idempotency-bound and protected by Postgres conflict invariants;
  confirmation/reschedule/teardown commit complete state, receipt, outbox and audit atomically.
- OAuth uses one-time state/PKCE and clean no-store redirects. Google `pending_watch` cannot bind an
  unverified resource or mutate business state from an early push notification.
- Calendar projection defaults to zero attendees/no provider mail. Meeting launch validates the
  initial exact HTTPS destination, never server-fetches/resolves/follows it and requires current
  provider/config/secret/RecoveryEpoch evidence.
- One-time management codes use purpose-keyed verifier evidence and only a short-TTL encrypted vault
  object for bounded delivery; plaintext is absent from ordinary state, logs, audit and backups.
- Restores invalidate all ephemeral authority, provider coverage, meeting launch authority and stale
  abuse evidence before traffic while durable idempotency receipts preserve one logical effect.
- `external_busy`, provider identifiers, appointment/contact details and sensitive times follow
  Confidential/Highly Sensitive minimization, telemetry, export, retention and backup controls.
- Product analytics and session replay remain off; required operational telemetry is content-free
  and separately owned.

## Repository hygiene and supply chain

The definitive post-contrast pass inspected 32 Markdown paths: 29 modified and three new. It counted
2,731 exact delta lines, 251 deleted lines and 12,612 candidate-body lines. Results:

- zero secrets, credentials, OAuth/Calendar/Meeting values, PII, private URLs, absolute local paths,
  remote attachments, media or binaries;
- 55 local links and zero broken links; five external/anchor links were public documentation;
- no code, manifest, dependency, lockfile or provider-configuration change;
- `git diff --check` passed and Cyber Neo's workspace secret scan covered 281 files with zero active-
  workspace findings;
- `pnpm-lock.yaml` retained SHA-256
  `C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A` and the lock checker reported
  zero findings.

An optional whole-repository scan matched eleven historical loopback/test PostgreSQL fixture strings
inside the unchanged non-executable `archive/pre-roadmap-2026-08-02` area. They are outside the M013
delta and active workspace; no value was copied into this candidate.

## Accessibility security note

The final design explicitly prevents cyan/gold light-surface contrast from carrying normal text or
sole essential state. It requires 4.5:1 for normal text and 3:1 for large text/icons/controls plus
exact automated/manual validation. Cyber Neo independently confirmed that this correction closes the
previous ambiguity without weakening any security boundary.

## Limitations and activation gates

`0/100` is a documentary assessment, not proof of runtime security. M013 has no implementation on
which to perform functional SAST/DAST. Build still requires resolved Product Owner policies,
accepted ADRs, implemented domain/RLS/secrets controls, malicious-input/race/failure-injection/
restore/accessibility tests and independent review of actual code/configuration.

This report does not approve ADR 017, `GENERATE`, Build, Google/Meeting/notification/payment
activation, merge, deployment or production use. The Product Owner remains final authority.
