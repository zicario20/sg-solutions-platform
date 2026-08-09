# ADR 011 — Client authentication, identity linking and session boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; no Build or activation authority
- Date: 2026-08-09
- Extends: ADR 001 and ADR 004; does not supersede either
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M007 must let clients use email/password and Google identity while preventing duplicate accounts,
email-based authorization, browser token exposure and cross-client access. Supabase Auth is the
approved identity provider, while the application uses Next.js App Router, Postgres domain state,
RLS and private Storage.

The Product Owner's source also requires HttpOnly cookies, revocable sessions, invitation linkage,
account recovery, staff MFA and future passkeys. Current Supabase SSR guidance uses cookie-based PKCE
and recommends a per-request client, but some helper patterns permit browser JavaScript to access
session material. The architecture therefore must define the intended security outcome rather than
silently inherit a helper default.

## Decision proposed

### 1. Invitation-first account activation

Release 1A client activation begins with a single-use, expiring, revocable invitation tied to an
intended canonical client/person/business membership. Open self-registration does not create an
operational client, membership, case, service order, entitlement or grant.

Email URLs are inert on GET/HEAD: scanners, previews and prefetch cannot consume proof or mutate
identity/access. A high-entropy proof is consumed once only by explicit CSRF-protected POST or an
approved user-entered OTP after browser binding. Invitation activation rechecks an immutable
intended membership and either the exact pre-bound Auth subject or the provider-verified channel
HMAC; mismatches fail closed to reissue/manual review.

### 2. Separate authorities

- Supabase Auth owns authentication subjects, credentials, provider identity, factors and provider
  session issuance.
- Postgres owns SG Solutions account state, membership, role/grant references, security-policy
  version, application revocation metadata and audit evidence.
- Domain services authorize before I/O; RLS and Storage policies enforce compatible row/object
  isolation.
- ADR 004 controls case-to-child visibility inheritance.

No domain table stores a password, OTP, MFA secret, recovery/invitation secret or raw provider
access/refresh token.

### 3. One account, multiple authentication methods

The application account references one immutable Supabase subject. External identity links use the
provider's immutable subject identifier. A verified email may identify a candidate but never grants
membership or resource access.

Adding Google to an existing password identity requires recent authentication and an explicit,
audited link action. Conflicts fail closed to manual review. Removing the last usable method is
prohibited.

Supabase automatic identity linking is not application authorization. A provider identity may not
receive an SG Solutions application session unless an active local `ExternalIdentityLink` was
already proven or the exact invitation/link transaction commits it atomically. Unexpected provider-
only linkage enters durable reconciliation/manual review and remains denied.

### 4. Server-mediated browser boundary

Authentication and account mutations enter same-origin Next.js server boundaries. External sign-in
uses PKCE plus state/nonce/provider validation, exact redirect allowlists and immediate server-side
code exchange. The callback ends with a clean redirect and is private/no-store.

Every OAuth/link flow has a high-entropy, one-time `AuthTransaction` bound to purpose, provider,
canonical callback, return intent, browser/session, state, nonce, PKCE verifier digest, expiry and
version. It is compare-and-swap consumed before a provider result can create an application session.

The proposed Release 1A target places only a random opaque application-session handle in a
`Secure`, `HttpOnly`, host-only cookie (`__Host-` where compatible). Provider access/refresh material
never enters browser cookies, HTML, localStorage/sessionStorage or application JavaScript; it lives
only in an envelope-encrypted server credential vault whose key is outside Postgres and the
repository under ADR 005. The browser does not call privileged Supabase data APIs directly. A new
server/provider client is created per request.

Raw OAuth/email-proof ingress loads no analytics or third-party assets, redacts proof/query values
before access/error telemetry, uses restrictive CSP, `Referrer-Policy: no-referrer` and private/no-
store behavior, then issues a 303 redirect to a clean URL.

Before Build, a pinned-version compatibility spike must prove session refresh, cookie rotation,
sign-out, callback caching and Next.js behavior. If the approved Supabase adapter cannot preserve
this target, work stops for an ADR/Product Owner decision. A helper-library default may not silently
weaken the boundary.

### 5. Application session registry

Postgres retains an application session registry and encrypted server credential vault. The
registry stores only opaque references, family/generation/version, revocation/risk state and
minimized metadata. The vault is an application-level encrypted credential boundary, not a second
identity provider; ciphertext alone is never treated as protection without KMS/key-custody,
rotation, deletion and backup controls.

Refresh is a fenced state machine. One generation/version CAS marks a family rotating; only the
winner may update provider material, commit the next encrypted generation and emit a replacement
opaque cookie. Old-generation reuse, a concurrent loser, revocation/recovery/suspension fence or an
ambiguous provider result blocks/revokes the family and emits no cookie until safe reconciliation.

Every protected action re-evaluates active account, session, membership, role/permission,
entitlement when applicable and resource grant. An access token alone is insufficient.

### 6. Assurance and recovery

Staff privileged access requires Supabase `aal2` under M080/M081. Sensitive client actions require
recent authentication and may require `aal2` after policy approval. Recovery may change credentials
but never relinks a client, grants a role or bypasses MFA. Support can start a controlled review; it
cannot edit passwords, view secrets or create a session.

Every step-up uses a short-lived one-time intent bound to the exact actor, session, authentication
method, action, resource, payload HMAC, target/policy versions and idempotency key. The protected
mutation consumes that authorization once after a fresh policy check; intent replay or target/
payload substitution fails closed. Password recovery revokes all pre-recovery session families as
a mandatory minimum.

### 7. Cache and telemetry boundary

Authenticated, callback and refresh responses are not eligible for ISR or shared/CDN caching and
use private/no-store behavior. Auth payloads, cookies, credentials, provider responses and contact
identifiers are prohibited from PostHog, Sentry payloads, trace attributes, logs and AI context.

Low-entropy identifiers used for throttling or correlation use purpose- and environment-separated
HMAC with key epoch held outside the database; a plain/unsalted digest of email, phone or IP is not
acceptable.

### 8. Database and Storage enforcement

The opaque cookie resolves server-side to an active application registry row and encrypted provider
session. The server validates provider subject, issuer, audience, expiry and exact provider-session
reference, then derives immutable actor context; browser identity/account/assurance values are
ignored.

User-facing transactions run as a restricted non-owner `NOBYPASSRLS` role. A private initializer
accepts only the active application-session reference, revalidates it in Postgres and sets
transaction-local actor context from database state. User routes never use `service_role`, owner or
`BYPASSRLS`. Command-scoped service identities accept exact purpose and server-derived normalized
resources, not arbitrary browser account/resource IDs.

Transaction context is `SET LOCAL`-scoped and integrity-sealed with a private database-held key or
equivalent non-forgeable mechanism. Policies read it only through a private verifier. Arbitrary
`SET`/`set_config`, direct initializer invocation, rollback/commit and pooled-connection reuse cannot
forge or retain an actor; future negative tests must prove these properties.

Private Storage denies direct browser list/read/write. A narrow server adapter authorizes through
the domain, derives the canonical object key, creates a short-lived single-purpose signed capability
and audits staff downloads. Domain, RLS and Storage parity tests cover revoked/risk-blocked sessions,
stale policy, inactive membership, cross-client IDs, internal/inheritance-blocked resources and
Highly Sensitive step-up failures.

### 9. Canonical origin and break-glass boundary

Each environment freezes one external `(scheme, host, port)` and exact trusted proxy hops/headers;
the application never derives URLs from arbitrary `Host`/forwarding values. Conflicting, duplicated,
malformed or untrusted forwarding headers fail closed. State changes require exact canonical
`Origin`; absent/null Origin is rejected except documented safe navigation and one-time callback
paths.

Before privileged production use, break-glass must use a separate recovery identity/factor custody,
documented two-step invocation, least-time/least-privilege elevation, immutable alert/audit,
post-use rotation and revocation, evidence review and a tested restoration path. The Product Owner
must still designate the custodian; ordinary support can never substitute for this control.

## Rationale

- Invitation proof binds activation to business intent without turning a contact attribute into
  authorization.
- Supabase remains the approved identity authority while SG Solutions retains explicit business
  access policy.
- Server mediation limits credential exposure and creates one auditable control point.
- A fenced application registry plus encrypted server vault gives predictable revocation while
  keeping provider credentials outside the browser.
- Compatible provider abstractions allow Google, passkeys or future providers to evolve without
  replacing the account model.

## Consequences

### Positive

- Strong separation of identity, account, membership and resource access.
- No second password store or email-only linkage.
- Private portal routes cannot be safely cached as public content.
- Account/security UX can remain consistent across providers and languages.
- Release 1B can add passkeys, client MFA and additional relationships compatibly.

### Costs and constraints

- The opaque-cookie/server-vault target and Supabase automatic-link containment need an early
  pinned-version compatibility proof.
- Session review/revocation requires synchronized provider and application metadata.
- Google/email delivery cannot be called active until external configuration and end-to-end tests
  exist.
- Manual conflict/recovery processes and a break-glass runbook must exist before production.
- RLS/Storage/domain authorization parity increases test obligations.

## Alternatives rejected

### Open self-registration creates a client

Rejected because it can create orphan/duplicate clients and contradicts the approved evaluation-
first acquisition flow.

### Email or phone automatically links CRM access

Rejected because a contact match is not proof of authorization.

### Separate Google and password accounts

Rejected because it fragments identity and risks duplicate case access.

### Browser-local tokens and direct database access by default

Rejected for the proposed Release 1A boundary because it expands token exposure and duplicates
authorization concerns in the browser.

### Custom credential store

Rejected because Supabase Auth is the approved identity provider and custom password handling adds
security risk without business value.

### Middleware/UI authorization only

Rejected because hidden navigation and edge checks cannot replace domain/RLS/Storage enforcement.

## Security conditions before acceptance

1. Threat model invitation theft, OAuth login CSRF, code/token leakage, session fixation, refresh
   races, proof scanners/prefetch, enumeration, credential stuffing, recovery abuse, automatic/
   explicit identity mislinking, step-up substitution and IDOR.
2. Prove the pinned opaque-cookie/server-vault design with no provider tokens in browser state or
   shared cache, accepted KMS/key custody and safe failure behavior.
3. Prove automatic provider linkage cannot create an application session without active local link
   state, and link/unlink partial failures reconcile fail closed.
4. Define cookie names/scope/flags, canonical origin/trusted proxy rules, callback allowlists,
   return-intent format, scanner-safe email ingress and cache/referrer/CSP headers.
5. Define refresh family/generation, session expiration/revocation and recent-authentication policy.
6. Approve staff/client MFA and recovery policy, designate sole-owner break-glass custody and pass a
   recovery tabletop.
7. Test restricted-role/domain/RLS/Storage parity for cross-client, revocation, inheritance blocks
   and Highly Sensitive resources.
8. Prove auth/PII exclusion and raw-ingress redaction before logs, analytics, traces, Sentry and AI
   context.
9. Test one-winner CAS and replay denial for invitation/email proof, OAuth transaction, refresh
   generation, identity link operation and step-up intent.
10. Approve bilingual transactional/security copy and provider configuration.
11. Complete independent architecture and Cyber Neo review with no open material finding.

## External activation

ADR 006 applies. A local adapter, schema, test double or passing test is not an active identity
provider configuration. Production Supabase, transactional email, Google OAuth and MFA activation
require separate evidence in `EXTERNAL_ACTIVATION_REGISTER.md` and Product Owner approval.

## Approval and supersession

This ADR is a candidate only. Product Owner approval would accept the architecture; it would not
authorize `GENERATE`, schema changes, routes, provider accounts, credentials, migration, merge,
deployment or production traffic. A future contradictory decision must supersede this ADR
explicitly and preserve its rationale.
