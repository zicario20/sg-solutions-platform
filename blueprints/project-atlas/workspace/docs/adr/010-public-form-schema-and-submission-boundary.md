# ADR 010 — Public form schema and same-origin submission boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; not approved for Build or activation
- Date: 2026-08-09
- Scope: M006 Public Forms

## Context

SG Solutions needs bilingual public contact/evaluation forms on Astro marketing pages. Browser-to-
vendor or browser-to-database integrations would expose provider semantics, weaken validation and
consent evidence, complicate CORS and make external delivery a false source of truth. A full dynamic
form application would also undermine the static-first public-site architecture.

Form rules and consent/routing are operational policy rather than merely editorial content. Sanity
may provide public explanatory copy but cannot own submission state, consent evidence or executable
form rules. Detailed private intake belongs in the authenticated portal.

## Decision proposed

Use immutable versioned form definitions owned by domain services/Postgres. Publish a bounded public
projection for rendering. Keep Astro pages prerendered and add only narrowly scoped on-demand
session/submission routes in `apps/www` as a same-origin Public Form Gateway.

The gateway:

- validates exact canonical-HTTPS same-origin transport, Fetch Metadata, trusted proxy context,
  pre-materialization request bounds and anonymous nonce;
- applies local rate/anti-abuse controls and generic response shaping;
- calls a typed `apps/app` facade using a least-privilege service identity; and
- has no direct Postgres, CRM, Supabase service-role, email or provider credential.

The application/domain layer revalidates the authoritative schema, conditions and consent, then
atomically persists submission/consent, consumes the nonce and claims idempotency. An `accepted`
submission appends audit plus the M020 lead-candidate outbox record. A `risk_review` submission
appends only audit/manual-review work and returns neutral non-success wording; it cannot hand off a
lead until an authorized expected-version transition to `accepted` atomically creates the single
idempotent M020 outbox record. Rejection or a stale/competing review decision creates no lead work.

M020 owns leads/deduplication; M078 owns consent; M077 owns audit. Scheduling, payments, uploads,
notifications, partners and AI are separate gated handoffs. Postgres owns internal operational state,
while external systems own only their external state.

Release 1A stores no Confidential answer draft in browser persistent storage or anonymous server
draft. A nonce-expiry warning and user-controlled renewal preserve only current-page in-memory
answers without transmitting them. Approved Confidential submissions may enter bounded
`risk_review`; suspected Highly Sensitive/prohibited content is discarded or redacted before
durability and leaves only a content-free reason code. Raw forensic quarantine is not part of
Release 1A. Public uploads are rejected. Exact form inventory, fields, copy, routing and retention
remain Product Owner decisions.

## Rationale

- Preserves the approved Astro static-first performance/SEO model.
- Makes the public security boundary same-origin and provider-neutral.
- Prevents browser/vendor state from becoming CRM or consent truth.
- Gives historical submissions an immutable definition/copy/consent version.
- Centralizes validation, minimization, idempotency and recovery.
- Supports compatible Release 1B extensions without a disposable endpoint.

## Consequences

- `apps/www` gains a small runtime boundary under a future Build gate but remains otherwise static.
- Public form responses use `no-store`; blank versioned projections may be cached safely.
- Definition publication needs separation of duties and bilingual parity.
- The constrained condition language must be versioned and cannot execute arbitrary code.
- Downstream provider work requires transactional outbox/reconciliation and separate activation.
- Persistent drafts, anti-bot vendors, uploads, attribution cookies and AI require later decisions.
- Any administrative schema publisher must use the same domain contracts and cannot bypass review.
- Repeated-payload correlation, if approved, uses a purpose/form/version/time/key-epoch scoped
  server-secret HMAC with short TTL; unkeyed answer checksums are prohibited.

## Alternatives rejected

1. **Direct browser-to-CRM/email/provider:** leaks trust and creates provider coupling.
2. **Astro handler writes directly to Postgres:** mixes transport and domain authority and enlarges the
   public credential boundary.
3. **Sanity owns dynamic forms/submissions:** confuses public editorial truth with business policy/
   operational state.
4. **Next.js renders the entire marketing/form surface:** unnecessary change to the approved split.
5. **Detailed anonymous specialist intake:** collects too much before authentication/authorization.
6. **Wait for provider accounts:** accounts are not needed to define safe contracts; ADR 006 keeps
   activation separate.

## Security conditions

- Each unsafe request must carry an `Origin` exactly matching an allowlisted canonical HTTPS
  scheme/host/port. Missing, `null`, sibling, wildcard or mismatched origins fail closed; Fetch
  Metadata is additional defense and permissive credentialed CORS is prohibited.
- Trust only exact approved edge sources and hop counts. The edge strips inbound forwarding headers
  and rebuilds them. Raw `Host`, `Forwarded` and `X-Forwarded-*` never determine allowed origin or
  rate identity.
- Short-lived form/version/locale/purpose nonce with atomic single-use and idempotent receipt replay.
- Provide an accessible expiry warning and user-controlled renew/extend action that transmits no
  answers and preserves only in-page memory; require a documented exception and equivalent human
  path if WCAG timing cannot be met.
- Use a byte- and deadline-bounded raw/stream parser before object materialization. Do not call
  ordinary `request.json()`/`JSON.parse()` first. Reject runtimes that cannot enforce the boundary,
  duplicate/prototype keys, excessive depth/width/string/array counts and ambiguous encodings.
- Authoritative server schema; copy stable validated fields into null-prototype domain structures;
  reject unknown fields, mass assignment and type confusion.
- Any repeated-payload digest is a short-lived, scoped server-secret HMAC over a canonical
  length-prefixed envelope; never persist an unkeyed answer checksum or reuse a digest across
  purposes.
- No PII/answers/full URL in logs, analytics, traces, cache keys, redirects or provider diagnostics.
- Generic receipts/errors and uniform dedupe behavior prevent existence enumeration.
- Public uploads fail closed; suspected Highly Sensitive/prohibited values are discarded or
  redacted before durable state, outbox, logs or telemetry. Only a content-free reason may persist;
  Release 1A has no raw forensic quarantine.
- Future Build requires independent security/privacy/accessibility review and negative tests.

## Approval and supersession

Product Owner approval would authorize this architecture decision only. It would not approve exact
fields/copy, code, tables, provider accounts, traffic, deployment or publication. A future change to
permit direct browser-provider calls, persistent public sensitive drafts, arbitrary executable form
logic or gateway database credentials requires a superseding ADR and Product Owner approval.
