# Data Classification

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Security architecture baseline
- Update rule: classify every new data element before implementation; stricter module rules prevail

Every record, field, document, event and backup receives the highest applicable classification. A
mixed payload inherits the most restrictive class it contains.

## Public

- **Examples:** approved marketing pages, public service descriptions, published academy content,
  public FAQs, approved prices and disclosures.
- **Allowed storage:** Sanity public datasets/CDN, public web assets and Postgres metadata when useful.
- **Encryption:** TLS in transit; managed encryption at rest where stored.
- **Access:** public read only after editorial approval; authenticated publishing.
- **Logging/analytics/tracing:** page identifiers and coarse events allowed; never include form text
  or data from a higher class.
- **Retention/deletion:** retained while published or historically required; unpublish and purge CDN
  caches through the editorial process.

## Internal

- **Examples:** internal procedures, non-client configuration, feature flags, non-sensitive system
  metrics, draft public content and operational runbooks.
- **Allowed storage:** private repository, Postgres, private Sanity drafts or approved configuration
  stores according to purpose.
- **Encryption:** TLS and managed encryption at rest.
- **Access:** authenticated staff with job need; not client-visible by inheritance.
- **Logging/analytics/tracing:** identifiers and bounded metadata allowed; free text minimized.
- **Retention/deletion:** business need plus documented cleanup; remove obsolete drafts/configuration.

## Confidential

- **Examples:** client contact details, appointment details, service/case metadata, internal notes,
  invoices, consent evidence, partner contracts and operational reports.
- **Allowed storage:** Postgres, private Storage and approved provider systems with contracts;
  prohibited from public Sanity datasets.
- **Encryption:** TLS, managed encryption at rest and application-level encryption when ADR 005 or a
  module threat model requires it.
- **Access:** least-privilege staff role plus resource scope; clients only through active delegated
  access to client-visible resources.
- **Logging/analytics/tracing:** opaque identifiers and result codes only; no notes, addresses,
  amounts tied to identity, message bodies or document content.
- **Retention/deletion:** governed by service, legal and consent rules; deletion is auditable and
  backups expire on their normal protected schedule.

## Highly Sensitive

- **Examples:** SSN/ITIN, tax returns, credit reports, government IDs, bank account/routing data,
  income/debt evidence, authentication secrets, encryption keys and identity-verification artifacts.
- **Allowed storage:** approved private Postgres fields with required application-level encryption,
  private quarantined/promoted Storage, or a purpose-specific provider. Never Sanity, client-side
  persistence, analytics or general-purpose logs.
- **Encryption:** TLS; managed encryption at rest; application-level envelope encryption for the
  structured fields named by ADR 005; keys remain outside the database and application repository.
- **Access:** explicit purpose, least privilege, session assurance and resource scope; highly
  sensitive documents may require an additional explicit grant. Staff reads/downloads are audited.
- **Logging/analytics/tracing:** values and content prohibited. Only opaque resource IDs, operation,
  result, policy version and correlation ID may be emitted after redaction.
- **Retention/deletion:** shortest approved legal/business period, legal-hold support, scheduled
  deletion and verifiable object/metadata cleanup.

### Authentication-secret browser boundary

Provider access/refresh tokens, passwords, OTPs, MFA seeds, recovery/invitation proofs and decrypted
server-vault material are never permitted in browser cookies, HTML, browser-readable storage or
client telemetry. Under an accepted session ADR, a random opaque application-session bearer handle
may exist only as an ephemeral `Secure`, `HttpOnly`, host-only cookie (`__Host-` where compatible),
with no identity or provider credential encoded in it and no localStorage/sessionStorage copy.

Any retained provider session material is Highly Sensitive and requires purpose-specific envelope
encryption in a server-only credential vault under ADR 005: key custody outside Postgres/repository,
explicit decrypt boundary, rotation/deletion behavior, backup implications, access audit and safe
failure when KMS is unavailable. A ciphertext column or `_encrypted` suffix alone is not approval.

### Document-specific boundary

M011 assigns every logical document/version the highest classification of its bytes, extracted
content, protected filename/metadata and linked purpose. Government IDs, tax returns, credit
reports, bank/income/debt evidence and identity artifacts are Highly Sensitive. Quarantine never
downgrades classification. A derivative, redaction, OCR result, preview or generated document is a
separate governed artifact and cannot inherit a lower class merely because fields were hidden.
A derivative, redaction, OCR result, preview or generated document containing new bytes also
receives its own immutable provenance/checksum, content/parser validation, scan under a versioned
policy and promotion before use; provider evidence or a prior artifact's verdict cannot substitute
for that lifecycle.
Document bytes, filenames, comments, extraction text, storage keys and signed URLs are prohibited
from Sanity, analytics, logs, traces, error reports, agent chat history and client-side persistence.
Only opaque IDs and stable minimized result/policy codes may enter authorized audit evidence.

## Universal prohibitions

- Never store full payment-card numbers, CVV or magnetic-stripe data.
- Never infer protection from a field suffix such as `_encrypted`.
- Never downgrade a classification to improve analytics, search or developer convenience.
- Never copy Confidential or Highly Sensitive content into tickets, developer/agent chat histories,
  test fixtures, error reports or an unapproved external messaging system.
- A purpose-specific first-party production conversation store may retain `Confidential` content
  only when its approved module PRD defines purpose, consent/identity conditions, least-privilege
  access, provider-sharing limits, retention, legal hold, deletion and audit. This exception does not
  allow `Highly Sensitive` content in public chat and does not authorize production retention before
  its Product Owner/legal decision.

M012 secure-portal message bodies and conversation-local internal notes are at least Confidential.
Tax, credit, banking, identity, security and legal content may be Highly Sensitive and must follow
exact purpose/grants/assurance and M085 retention policy. Because free text may contain unexpected
Highly Sensitive data, every accepted M012 message, note, revision body and derived free-text
handoff/translation summary uses ADR 005 application-level envelope encryption before durable
persistence. Encryption/KMS failure rejects the write; plaintext cannot be durably staged in
drafts, rejected-input records, outbox, audit, logs or backups. Subjects, snippets and search
metadata cannot copy protected body content.
Message bodies, quotes, translations, typed protected references and decrypted content are
prohibited from notification payloads, analytics, logs, traces, error reports, session replay,
browser persistence and external-channel copies. A participant or channel address never changes
classification or authorization.

M013 appointment/contact/participant details, exact times linked to a person, client-visible
instructions, internal notes and service/case relationships are at least Confidential. OAuth access
and refresh tokens, management/meeting secrets and any tax, credit, banking, identity or legal
content embedded in an appointment context are Highly Sensitive. Calendar connection IDs,
provider event IDs and per-source sync cursors are Internal or higher and remain server-only. A raw
Google resource URI may contain a calendar/account email and is Confidential; M013 retains only the
minimum resource ID needed to stop/bind plus a keyed canonical URI-comparison digest and never puts
the raw URI in ordinary state, audit, telemetry or recoverable logs/backups. A one-time management
code is Highly Sensitive: SG-controlled durable state may contain it only as a short-TTL envelope-
encrypted vault object excluded from ordinary backups, while the approved M026 transport/recipient
necessarily receives plaintext under APT-007 DPA/retention/recipient-risk controls. Public
availability contains only opaque bounded slot receipts and generic modality/time facts. Raw
external event titles, bodies, attendees and unrelated free/busy context are not retained. Calendar
source-approved normalized `external_busy` intervals, `ExternalBusyCoverage` and source-projection
metadata are Confidential server-only availability evidence: purpose/source/horizon bounded, exact-
permission restricted and absent from Public/Client DTOs, ordinary Admin detail, analytics, tracing,
error reports and support exports. They follow APT-015 retention/purge/legal-hold rules and backup
retention cannot exceed that approved policy.
Calendar
and appointment content, capability/session handles, access/refresh tokens, contact values and
sensitive times are prohibited from URLs, logs, analytics, traces, error reports and session replay.
The sole SG callback/query-string exception is the transient OAuth callback authorization code +
high-entropy opaque state:
no PII, exact callback, PKCE, no-store/no-referrer, edge/app query-log redaction, immediate one-time
consumption and clean redirect/replace; they are not application-durable data. Appointment
confirmations/reminders are off before APT-010; after approval, a recipient-specific M026 delivery
may contain only a generic SG Solutions appointment label, instant and intended display zone under
current consent/preferences. The sole pre-APT-010 exception is APT-007 one-time management-code
transport described above; management links/session handles remain prohibited. Type/service/case/
staff/note/contact echoes, meeting/management links and provider metadata remain prohibited from
notifications. Secret values use the approved secret/envelope-encryption boundary;
an `_encrypted` name is never evidence of protection. All actor-bound scheduling responses are
`private, no-store` and prohibited from ISR/CDN/service-worker/offline or browser-readable response/
PII persistence. The application-session exception is an approved opaque host-only HttpOnly cookie
handle for bounded server-side state. Separately gated/user-initiated APT-014 ICS download may persist
as a disclosed non-revocable snapshot, and APT-011 meeting destination/history has its disclosed
provider/browser exposure; neither is reusable SG authorization or permission for general API/PII
browser storage.

M013 `RecoveryEpoch`, workload-proof metadata and accepted replay nonces are Internal, server-only,
content-free integrity/availability controls with bounded retention. The monotonic epoch is protected
outside the restored database generation and may never decrease or restore from the same snapshot.
Replay state stores only nonce, issuer, audience, key version, recovery epoch and expiry; raw body,
body digest, signature and auth headers are prohibited. The workload signing/pepper keys are Highly
Sensitive secrets held outside database/repository under approved custody, rotation and recovery.

`SchedulingAbuseEvidence` is Confidential security data: purpose-scoped keyed network digest/key
version, coarse risk counters, bounded TTL, explicit `RecoveryEpoch`, closed review/appeal result and
opaque CAPTCHA/provider refs only. Raw IP, device
fingerprint, contact text and provider token are prohibited from domain state, product analytics and
ordinary telemetry. Access is limited to scheduling/security enforcement and approved review/appeal;
expiry or epoch cutover deletes/rebuilds it under APT-017; restored prior-epoch evidence cannot make
an allow, denial or challenge decision.

M014 quote terms, accepted line items, obligations, invoices, client-visible amounts, refunds,
disputes, external-payment evidence and payer/resource relationships are at least Confidential.
Provider object IDs, webhook/inbox facts, idempotency/operation data, reconciliation issues and masked
payment-method summaries are Internal or Confidential according to whether they can link to a client
or transaction; they remain server-only except for the exact approved client projection. Stripe/API/
webhook secrets, raw capability values, payment client secrets and full card/authentication data are
Highly Sensitive or prohibited: SG stores no PAN, CVV or magnetic-stripe data at all.

The exact provider idempotency token is Highly Sensitive operational integrity material. It is
either envelope-protected and retrievable or deterministically reproducible from immutable operation
identity through a domain-separated secret and retained key version; a comparison hash cannot be the
recovery mechanism. Opaque SG operation correlation and provider request/object references are
Internal or Confidential and exclude PII. Key versions/recovery material follow PAY-013 retention,
rotation, backup and incident controls; ambiguity never permits a replacement financial mutation.

Accepted quote/obligation/provider facts and allocations are immutable operational evidence. Amounts
use integer minor units plus currency and never enter product analytics when tied to identity. Quote/
invoice text, line items, provider IDs/payloads, dispute evidence, failure details, Checkout/receipt/
hosted-invoice/Customer Portal URLs and client-sensitive service descriptions are prohibited from
Sanity, ordinary logs, traces, error reports, PostHog, session replay, notification payloads and
browser-readable persistence. M026 notifications remain generic and link back to the authorized
portal. Provider destinations exist only as transient private/no-store handoffs after exact resource
authorization and exact activated HTTPS provider scheme/host/path/object validation; arbitrary or
tampered destinations are prohibited.

The default durable webhook record is a signed/verified normalized minimal inbox fact plus payload
hash, provider-account/environment/event composite identity, processing lease and recovery generation.
It is an invalidation signal: each asynchronous projection retrieves canonical provider object(s),
and a provider-object/fact-version application key prevents different event IDs from duplicating an
effect. Raw webhook bytes may be retained only if PAY-013 expressly approves a purpose-specific,
envelope-encrypted, least-privilege, short-TTL incident/reprocessing store excluded from ordinary
telemetry and exports. Stripe/provider secrets remain in approved secret management by environment,
outside Postgres/repository/backups unless the secret platform's separately approved recovery process
applies. Billing entry capabilities and provider return handles are distinct and store only high-
entropy digests in ordinary state; any raw value is one-time/short-lived, excluded from logs/
analytics/backups and invalidated by use, expiry, revocation or recovery-generation change. GET/HEAD
is inert; an interactive POST/OTP exchange establishes an opaque host-only session. Token transport
is removed by clean redirect/history replacement before personalized render/subresources, uses no-
referrer and is redacted/excluded at edge/app logs, analytics, errors, caches and service workers.

PAY-013 defines retention, deletion and legal hold for quotes, invoices, financial facts, inbox,
idempotency, reconciliation, refund/dispute and audit evidence after applicable review. Deletion of
ordinary client projections does not rewrite legally/operationally retained immutable financial
facts; access suppression, retention and final disposal remain separately audited. Post-restore
financial state is untrusted for new prerequisite promotion until Stripe reconciliation completes
under ADR 018.

[NEEDS PRODUCT OWNER DECISION: approve service-specific retention periods and legal-hold authority
after Illinois/legal counsel review.]
