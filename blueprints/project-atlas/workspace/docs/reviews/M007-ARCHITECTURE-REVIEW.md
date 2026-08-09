# M007 Client Authentication and Account — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `affe681d8c21692afb4e8edd2d83a14f8d93bd25`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the M007 PRD, architecture/experience design, proposed ADR 011, shared IAM
PRD, architecture/security/data-classification authorities, roadmap/state, dependency and external-
activation registers, governance indexes and the complete candidate delta.

The final candidate preserves:

- one SG Solutions organization and invitation-first client activation;
- Supabase Auth as identity authority, with business authorization in domain services and Postgres
  RLS/Storage;
- one account with email/password and future-activated Google methods;
- explicit client/case/resource access rather than authorization by email, phone, CRM or payment;
- an opaque application cookie with provider credentials in an envelope-encrypted server vault;
- bilingual, branded desktop/mobile UX under the approved design system;
- 21 required PRD sections, 16 explicit Product Owner decisions and 14 deferred IAM activation
  items; and
- documentary status only, with no Build, provider activation, merge or deployment authority.

## Findings and closure

### IA-001 — provider automatic linking could bypass explicit application linking — Closed

Supabase provider-side linkage is now explicitly non-authoritative for SG Solutions access. An
application session requires an already active local `ExternalIdentityLink` or the exact one-time
invitation/link transaction to commit. Unexpected provider-only linkage remains denied and enters
durable reconciliation/manual review.

### IA-002 — account lifecycle contracts were incomplete — Closed

The PRD now defines invitation bootstrap, scanner-safe email proof, verification, password recovery
and change, MFA enrollment/challenge/removal, session revocation, provider link/unlink convergence,
step-up and account closure contracts. Mutations derive their actor/purpose, use expected versions
and idempotency, and sensitive mutations consume a one-time action-bound authorization.

### IA-003 — email scanners and browser prefetch could consume proofs — Closed

GET/HEAD ingress is inert. Explicit CSRF-protected POST or an approved OTP consumes the browser-
bound proof once. Raw ingress has no third-party assets/analytics, redacts proof/query material,
uses no-referrer/private-no-store/CSP headers and redirects with 303 to a clean URL.

### IA-004 — browser cookie and credential-vault boundary was contradictory — Closed

Only a random opaque application handle may exist in the `Secure`, `HttpOnly`, host-only cookie.
Provider access/refresh material never enters the browser and may exist only as envelope-encrypted
ciphertext in the isolated server vault under ADR 005/011 and approved KMS custody. Acceptance
criteria preserve these two narrow exceptions while prohibiting plaintext, ordinary-table and
browser-readable persistence.

### IA-005 — provider/local link and unlink convergence was undefined — Closed

`IdentityLinkOperation` now gives link/unlink a durable state, actor, purpose, versions,
idempotency, reconciliation and manual-recovery path. Ambiguous or partial provider outcomes grant
no new application session and never silently remove the last usable method.

### IA-006 — canonical origin and proxy trust were underspecified — Closed

Each environment freezes one canonical `(scheme, host, port)`, exact trusted proxy hops/headers and
return/callback allowlists. Conflicting, malformed, duplicated or untrusted forwarding/origin input
fails closed; URLs are never derived from arbitrary host headers.

### IA-007 — low-entropy digests exposed identifiers — Closed

Email, phone and IP correlation/throttling use purpose- and environment-separated HMAC with key
epoch, rotation and TTL. Plain or unsalted digests are prohibited; random high-entropy proofs may
use a one-way digest.

### IA-008 — session and membership state graphs were inconsistent — Closed

M007 and the shared IAM PRD now use the same canonical application-session graph:
`establishing → active`, repeated `active → rotating → active`, terminal
`expired|revoked|risk_blocked`, and `risk_blocked → revoked`. Membership uses
`pending → active → revoked`; expiration is a revocation reason rather than a competing state.

### IA-009 — unresolved MFA policy was presented as decided — Closed

Staff MFA remains mandatory, but exact factors and recovery policy remain Product Owner decisions.
The design recommends phishing-resistant methods where supported and rejects SMS as the sole
administrator baseline without presenting TOTP or another factor as approved.

### IA-010 — browser form-progress wording conflicted with the storage boundary — Closed

Auth screens retain non-secret input only in volatile component memory. They do not write
localStorage/sessionStorage. An authenticated business form may save an approved server-side draft
only under its owning module's classification, purpose, authorization and TTL.

### IA-011 — anonymous Google initiation lacked a typed contract — Closed

`ExternalInitiatorContext` is a closed union and matrix: `AnonymousSignIn` is permitted only for
`sign_in`; `InvitationBootstrap` requires the exact invitation; `AuthenticatedLink` requires an
active session plus one-time step-up. Crossed purpose/context combinations fail before provider I/O.

### IA-012 — acceptance criteria contradicted the approved encrypted exceptions — Closed

The criteria now distinguish prohibited plaintext/ordinary-table/browser-readable storage from the
approved encrypted server-vault ciphertext and opaque HttpOnly application handle.

### IA-013 — the shared IAM document retained a legacy session graph — Closed

The legacy `issued → refreshed` graph was replaced with M007's canonical repeatable rotation and
risk-blocking states, preventing competing enums/jobs/RLS assumptions.

### IA-014 — MFA enrollment start did not consume one-time step-up — Closed

`beginEnrollment` now consumes `AuthorizedOneTimeIntent` before creating provider factor state or
revealing seed/QR/setup material. Negative tests cover another session, insufficient assurance,
replay, stale version, concurrent enrollment and duplicate POST.

## Security-review reconciliation

Cyber Neo independently closed CN-001–CN-010 and returned `0/100 — Secure documentarily`, with zero
Critical, High, Medium or Low findings. See
[M007 Security Architecture Review](M007-SECURITY-REVIEW.md).

## Consistency checks

- Supabase identity and SG Solutions authorization are separate authorities.
- User routes cannot use `service_role`, database owner or `BYPASSRLS`.
- Transaction-local RLS actor context is database-derived, integrity-sealed and cleared across
  commit, rollback and pool reuse.
- Private Storage uses domain authorization, server-derived keys and scoped signed capabilities.
- Refresh, link/unlink, email-proof and step-up operations have one durable winner and fail closed
  on replay, ambiguity or concurrency.
- No unresolved business policy was invented; all 16 decisions remain explicitly marked.
- No document claims live authentication, credentials, schema, RLS, route or provider behavior.

## Verification snapshot

The independent final pass confirmed:

- all four final Medium consistency findings closed and no new regression;
- 83 local Markdown links checked with none broken;
- 21/21 PRD sections, 16 Product Owner decisions and 14 deferred IAM rows;
- documentation plus the root LF-governance file only, with no product code; and
- `git diff --check` exit 0.

## Limitations

This is a documentary architecture review. It did not validate a live Supabase project, Next.js
session adapter, KMS, email scanner, Google OAuth client, database role, RLS/Storage policy, browser
flow, MFA factor, accessibility runtime or incident runbook. Those require an explicit Build/
activation gate, controlled evidence and independent review.

The reviewer did not modify the repository. The Product Owner remains the final architecture
authority and must approve or revise the PRD/design/ADR before any separate Build gate.
