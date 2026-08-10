# M006 Public Forms — architecture and experience design

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Draft for Product Owner review
- Date: 2026-08-09
- Gate: Product/Architecture documentation only; no `GENERATE`, Build, traffic or provider activation
- Related module: `M006 Gestión de formularios públicos`

## 1. Outcome

M006 provides one professional bilingual public-form capability for SG Solutions. It supports
contact, evaluation, callback and minimal service-interest requests while keeping private intake in
the authenticated portal. A visitor receives a generic success receipt only after the exact
submission and required consent evidence are durably accepted. Lead creation, appointment booking,
payment, provider delivery and partner sharing remain separate authoritative operations.

The design keeps Astro static-first. A very small same-origin runtime in `apps/www` terminates public
session/submission requests and calls a typed least-privilege application facade. It never accesses
Postgres, CRM, email or external providers directly.

## 2. Approaches considered

### Selected: static pages plus same-origin form gateway

Service/marketing pages remain prerendered. An on-demand form gateway issues bounded anonymous
session nonces, validates the public transport boundary and forwards only a typed command to the
domain application. The domain owns registry, schema validation, consent evidence, durable receipt,
idempotency and downstream outbox.

This avoids cross-origin browser integrations, hides infrastructure, centralizes security and keeps
the public site fast.

### Rejected: browser calls the CRM/provider directly

Direct JavaScript integrations expose vendor semantics/keys, weaken validation, leak attribution or
PII, and turn a provider response into a competing source of truth.

### Rejected: put all forms in Sanity

Sanity may store public editorial copy, but form rules, required fields, consent evidence and routing
are operational policy. They belong to the domain/version registry, not an editorial CMS. The public
projection may reference approved Sanity content without making Sanity submission truth.

### Rejected: full no-code workflow builder

Arbitrary expressions and routing create an executable policy surface before SG Solutions has staff
or governance to operate it. M006 uses a constrained declarative schema. A future publisher remains
a Product Owner decision.

### Rejected: specialist intake on the public web

Detailed credit, tax, funding or home-buying forms would collect too much data before authentication,
service authorization and case-level access. The public form captures only a broad need and moves
detailed work to the portal.

## 3. System boundary

```text
Astro static page / progressive form UI
          ↕ same-origin HTTPS
apps/www Public Form Gateway
  ├─ method/content/origin/fetch-metadata bounds
  ├─ anonymous form-session nonce
  ├─ request size/rate/anti-abuse controls
  └─ generic error/receipt projection
          ↕ scoped server-to-server identity
apps/app Public Form Application Facade
  ├─ FormRegistry + FormValidator
  ├─ SubmissionService + Postgres/Drizzle
  ├─ ConsentEvidenceService (M078)
  ├─ Audit (M077)
  └─ transactional outbox
          ↓
M020 Lead service / M026 notifications / M013 scheduler /
M042–M045 quote-payment / M011 documents / M040 partners
          ↓
provider adapters only after their own activation gates
```

Postgres owns internal submission/consent/lead-handoff state. M020 owns leads. Provider delivery
systems own only their external state. Inngest coordinates retries but owns no durable business
state. Sanity owns public editorial content only.

## 4. Definition and publication model

A form has a stable `formCode` and immutable version. A definition includes purpose, steps, field
codes/types, constraints, conditions, locale projections, disclosure/consent references, routing
policy and enabled handoffs. It contains no JavaScript, SQL, URL, credential or arbitrary provider
instruction.

Publication flow:

`draft → review_pending → approved → published → superseded|retired`

- Publishing records author, approver, definition hash, copy/consent hashes and parity result.
- A published version never changes in place; every material change creates a new version.
- New sessions use the current version. In-flight short-lived sessions may complete only while that
  version remains accepted by its retirement policy.
- Historical submissions retain the exact definition/copy evidence under retention policy.
- Spanish/English meaning and behavior must match before publication.

The Product Owner must choose code-reviewed configuration or an administrative publisher before
Build. Both options use the same registry and approval contract.

## 5. Public projection

The browser receives only what it needs to render:

- form code/version/locale/purpose;
- ordered steps and stable field codes;
- localized labels/help/options/error-message IDs;
- constrained client hints and conditional projection;
- approved disclosures/consent actions and hashes;
- capability flags such as `schedulingAfterSubmit=false`.

The projection excludes internal routing, lead rules, abuse thresholds, data mappings, permissions,
provider identifiers, staff destinations and secrets. Client validation improves UX; the domain
reapplies all rules against the authoritative definition.

## 6. Anonymous session and anti-replay

The gateway issues a cryptographically random, short-lived session/nonce bound to form code,
version, locale and purpose. Its stored metadata contains no answers. Committing either a durable
`accepted` receipt or neutral `risk_review` receipt atomically consumes it with the idempotency
claim.

It is not authentication and cannot query records. A retry with the same exact idempotency scope may
receive the original generic receipt; a different payload under the same key is rejected. The nonce
never appears in analytics or durable business URLs.

Release 1A keeps answers in the current page's in-memory state only. Confidential answers do not
enter localStorage/sessionStorage. Browser refresh/navigation can lose progress, and the UI states
that honestly. Before the nonce expires, the page provides an accessible warning and a
user-controlled renew/extend action. Renewal transmits no answers, preserves the current page's
in-memory answers, keeps the same form/version/locale/purpose binding and may be repeated within
server limits. If that control cannot meet WCAG timing requirements, the affected form requires a
documented security exception plus an equivalent human-assisted path before publication.
Persistent draft/resume requires its named Product Owner decision.

## 7. Submission envelope and atomic acceptance

The envelope carries form code/version, locale, purpose, field-code map, consent actions,
attribution projection, session nonce and idempotency key. It carries no browser-generated routing,
price, role or condition truth.

Acceptance transaction:

1. validate nonce/version/replay and server-side conditions;
2. normalize and validate allowed answers;
3. run local risk/prohibited-data decision;
4. for `accepted`, or `risk_review` containing only approved Confidential fields, record the
   submission and exact consent evidence;
5. consume nonce and claim idempotency;
6. always append audit; for `accepted`, append the M020 lead-candidate outbox record, while
   `risk_review` appends only manual-review work and never lead handoff; and
7. return an opaque generic receipt after commit: `request_received` for `accepted` or the neutral
   `request_received_for_review` for `risk_review`, with no assignment, risk-reason or response-time
   claim.

If the transaction fails, no success is shown and no partial consent/lead exists. M020 failure after
acceptance leaves the submission durable in `lead_pending|lead_failed`; the visitor need not submit
again and the system does not claim a CRM result.

`risk_review` is a bounded manual-review state for approved Confidential fields under the normal
access, retention and audit controls. Suspected Highly Sensitive or otherwise prohibited content is
discarded or redacted before durable submission/consent/outbox persistence; only a content-free
reason code may survive. Release 1A has no raw forensic quarantine for prohibited form content.

An authorized reviewer resolves `risk_review → accepted|rejected` with expected state/version,
actor, reason and audit evidence in one compare-and-set transaction. Only the successful transition
to `accepted` appends the single idempotent M020 command. A rejected, stale or competing decision
has no lead side effect. Future tests must pause concurrent decisions before compare-and-set, before
outbox commit and after commit to prove no premature or duplicate promotion.

## 8. Progressive and conditional UX

Forms use the smallest number of meaningful steps. A first step never harvests an email merely to
unlock public information. Each step has a clear title, short reason, visible progress and Back/
Continue actions. Final review uses plain labels and supports correction.

Conditions use a server-defined declarative subset such as equality or membership over approved
prior enum/boolean answers. The server independently evaluates them. Hidden/ineligible answers are
rejected or discarded by policy and never mapped downstream.

Conditional insertion preserves reading/focus order and announces material changes. No question is
shown solely to profile behavior or simulate professional eligibility.

## 9. Field and data-minimization policy

Release 1A defaults to:

- preferred name;
- approved contact methods/value;
- preferred language;
- broad service interest;
- high-level reason/next-step selection; and
- purpose-specific contact consent.

Exact fields require Product Owner approval. Free text is off by default. Public schemas cannot
contain SSN/ITIN, card/bank/account credentials, passwords, government IDs, tax documents, credit
reports, detailed income/debt or document upload fields.

Accidental protected data detection occurs before normal persistence/model/analytics. The UI never
echoes suspected content, provides a secure portal/human path and records only a content-free reason.

## 10. Consent architecture

Consent actions are purpose-specific:

- necessary response/contact request;
- optional marketing;
- optional partner sharing/application; and
- future recording/cookie purposes where separately applicable.

Optional actions are unchecked and never required to request service contact. Evidence includes the
exact version/hash, locale, purpose, visible action, presented/action times and bounded context.
M078 remains consent truth and manages withdrawal. Form definitions reference policy versions; they
do not embed mutable consent booleans as proof.

## 11. Lead and deduplication boundary

M006 sends a `LeadCandidate` command to M020. The response is a generic receipt category, not a lead
record. M020 owns source attribution, status, assignment, duplicate candidates and conversion.

Normalized email/phone may locate exact or ambiguous candidates internally. The system never tells
the visitor whether a record exists, changes response wording/timing materially, overwrites a
contact, merges records or upgrades consent automatically. Authorized staff resolves candidates
with audit.

## 12. Abuse controls

Layered local controls are the baseline:

- strict transport/JSON limits before expensive parsing;
- form/version nonce and atomic replay protection;
- bounded network/session/form-purpose rate buckets;
- server-known honeypot and plausible-timing signals;
- optional repeated-payload signals using only a server-secret HMAC over a canonical,
  length-prefixed envelope bound to purpose, form/version, bounded time bucket and key epoch; and
- `allow|challenge|risk_review|reject` risk outcome.

An unkeyed answer checksum is prohibited because low-entropy values can be guessed offline and a
global digest can correlate submissions across purposes. Only the scoped digest, key version and
short expiry may be stored. Keys remain outside the database, rotate by epoch and deletion follows
the approved abuse-evidence TTL. A digest for one purpose/form/version/time scope must never match
or authorize work in another.

No raw device fingerprint or cross-site graph is permitted by default. An external challenge
requires privacy/vendor approval, a non-visual accessible alternative and a circuit breaker. If the
provider fails, the gateway uses local/manual review when safe or fails honestly; it does not accept
unbounded traffic or silently exclude disabled users.

## 13. Attribution and analytics

Attribution is first-party and allowlisted. It may record landing/referrer category and approved UTM
values. Full referrer/query URLs, answers, contact data and sensitive parameters are excluded.

Ad-platform click IDs, cookies, conversion APIs and destination events require the Product Owner's
privacy/consent decision. Operational metrics use form/version/locale, step code, content-free error
code, broad source category and outcome. PostHog/Sentry/OTel receive no form answers, consent text,
email, phone, free text or internal IDs.

## 14. Scheduling, payment, uploads and partner handoffs

Each is separate and disabled by default:

- Scheduling starts after an accepted form receipt and calls M013; M024 is internal calendar UI only, and the form never writes Google
  directly and booking receipt remains distinct.
- Quote/payment handoff calls M042–M045 with a server-approved catalog reference; browser prices or
  products are ignored and Stripe remains financial truth.
- Public uploads are reject-all until M011 quarantine/scan/private-storage capability and a separate
  field/purpose decision exist.
- Partner/Marketplace sharing uses M040 and purpose-specific consent. No form submission itself
  constitutes a product application or approval.

Failure preserves the accepted form receipt and shows an honest alternative. It never rewrites the
form result as booking/payment/referral success.

## 15. Failure and reconciliation

Downstream commands use transactional outbox and stable idempotency. A timeout enters
`dispatch_unknown → reconciling → confirmed|not_sent|manual_review`; no blind retry.

Public behavior is deliberately generic:

- invalid form/session: safe reload/contact path;
- field error: accessible summary and field association;
- accepted submission: request received only;
- downstream pending/failure: no internal/provider detail;
- system unavailable before durable acceptance: no success claim;
- email failure: receipt page remains authoritative;
- scheduler/payment/partner unavailable: hide or mark next step unavailable with fallback.

## 16. Security boundary

- Unsafe requests must present an `Origin` that exactly matches an allowlisted canonical HTTPS
  origin, including scheme, host and non-default port when present. Missing, `null`, sibling-domain,
  wildcard or mismatched origins fail closed. Fetch Metadata is an additional signal, never a
  substitute. Permissive credentialed CORS is prohibited.
- Proxy trust names exact approved edge sources and hop counts. The edge strips inbound forwarding
  headers and rebuilds the canonical forwarding context. Neither allowed origin nor rate identity
  may be derived from raw `Host`, `X-Forwarded-*`, `Forwarded` or other client-controlled headers.
- POST only with approved content type; reject files and ambiguous encodings.
- A byte- and deadline-bounded raw/stream parser enforces body size before object materialization,
  then rejects duplicate keys, prototype properties and excessive depth, width, string or array
  counts. Ordinary `request.json()` or `JSON.parse()` may not run first; if the runtime cannot
  enforce these controls, it rejects the request. Stable validated fields are copied explicitly
  into null-prototype domain structures; raw objects are never spread or mass-assigned.
- Bound headers, concurrency and rates before expensive work; reject unknown fields, ambiguous
  encoding and type confusion.
- Encode at output and parameterize persistence; answer text never selects headers, templates,
  redirects, URLs, queries or workflow expressions.
- `Cache-Control: no-store` on session/submission/error responses; no answer in URL/referrer/cache.
- Gateway has only a scoped application identity, never database or provider-admin credentials.
- Generic errors/receipts prevent client/lead/dedupe/status enumeration.
- Publication, export, routing, retention, deletion and consent changes are permissioned/audited.

## 17. Accessibility and responsive behavior

The design uses approved Manrope/Inter and Project Atlas tokens with restrained motion. It must meet
WCAG 2.2 AA, keyboard/switch/screen-reader access, reflow/zoom, 44-by-44 targets and reduced motion.

Labels remain visible. Error summary receives focus and links to fields; field errors use stable IDs.
Status updates use concise live regions. Conditions never steal focus. Required/optional and consent
meaning are explicit. Challenges have accessible alternatives. Success/failure is not color-only.
Mobile keyboards/autocomplete match the field, while canonical validation remains server-side.
Nonce expiry warnings and renew/extend controls are keyboard and screen-reader operable, preserve
in-memory answers without transmitting them and satisfy WCAG timing/extension requirements.

## 18. Bilingual behavior

Spanish and English share stable field/purpose codes and independently reviewed copy. Form,
validation, disclosure, consent, review, success, challenge and fallback behavior maintain parity.
Locale is recorded explicitly. Switching language requires re-review if consent meaning/hash changes.
No runtime machine translation is source of truth.

## 19. Test strategy for a future Build

- Definition/version publication and immutable-history tests.
- Client/server parity with server-authoritative negative cases.
- Exact-origin tests cover missing/`null` origins, sibling domains, hostile `Host`, spoofed
  forwarding chains, unexpected hops, permissive-CORS regressions and valid trusted-edge requests.
- CSRF/fetch-metadata, replay/idempotency and concurrency tests.
- Pre-materialization parser tests cover oversize/slow bodies, duplicate/prototype/deep/wide JSON,
  mass assignment, Unicode, XSS/header/redirect injection and runtimes lacking bounded parsing.
- Request-depth/size/slow-body/rate exhaustion tests.
- Scoped-HMAC tests cover canonicalization, purpose/form/version/time separation, expiry, key
  rotation and absence of unkeyed answer digests.
- Nonce-expiry warning/renewal accessibility tests verify answer preservation with zero answer
  transmission or persistence and a documented fallback when extension is unavailable.
- Consent separation, hash/version, decline/withdrawal and bilingual parity tests.
- Dedupe oracle/timing and silent-overwrite negative tests.
- `risk_review` tests prove neutral non-success copy, no M020 outbox/dispatch before approval,
  atomic authorized acceptance/rejection and no duplicate promotion under concurrent/stale review.
- Prohibited Highly Sensitive value and public-upload zero-persistence/zero-propagation tests,
  including durable-store, outbox, log, telemetry and manual-review paths.
- Downstream timeout/reconciliation and no-blind-retry tests.
- Keyboard, focus, screen-reader, zoom/reflow, touch-target and mobile browser tests.
- No-PII telemetry snapshots and no-store/cache/referrer tests.

## 20. Activation sequence

1. Product Owner approves PRD/design/ADR 010 and resolves decisions required for the chosen slice.
2. A separate explicit `GENERATE` and Build gate authorizes implementation.
3. Implement registry/domain/gateway using synthetic data and inactive adapters.
4. Execute full tests, privacy/security review and retention/deletion exercises.
5. Configure approved form inventory, bilingual copy, routing and manual triage.
6. Activate each email/CRM/calendar/payment/anti-abuse/analytics/partner dependency separately.
7. Run controlled synthetic end-to-end submissions with kill switch and recovery.
8. Product Owner approves publication and records non-sensitive evidence.

Mocks, inactive adapters and a local receipt never make M006 Operational.

## 21. Design acceptance

This design is ready for Product Owner architecture review only when the M006 PRD, ADR 010,
activation register, authority documents and independent architecture/security reports describe the
same boundary with zero open material inconsistency. It remains non-executable until a separate
Build gate.
