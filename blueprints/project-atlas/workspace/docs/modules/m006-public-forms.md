# Module PRD — M006 Gestión de formularios públicos

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Draft for Product Owner review; `Registered`, not approved for Build
- Date: 2026-08-09
- Catalog module: `M006`
- Surface: Public Website with Backend/domain handoff
- Release horizon: R1.2 Public Sales Engine; compatible Release 1A/1B slices
- Risk: Moderate by catalog; Confidential-data and consent boundary
- Gate: Product/Architecture documentation only under Decision 019

This PRD normalizes the complete Product Owner-supplied M006 source into Project Atlas. It replaces
obsolete `.NET`/FluentValidation assumptions with the approved Astro, Next.js, TypeScript, Zod,
Postgres and Drizzle architecture. No route, form, database table, provider, email, CRM behavior,
cookie, tracking script, upload, live submission or external connection is authorized here.

## 1. Purpose

M006 defines the reusable bilingual public-form capability through which a visitor can request
contact, an evaluation, a callback or an approved service-specific next step. It safely transforms
an anonymous public interaction into a versioned submission and a generic receipt, then delegates
lead creation/deduplication to M020 and consent authority to M078.

The module provides progressive, conditional and accessible forms without exposing the internal CRM
or duplicating client intake. It asks only what is necessary for the stated public purpose. Detailed
tax, credit, identity, financial or documentary intake moves to the authenticated client portal
after authorization.

## 2. Business value

- Convert Google Ads, Meta ads and organic social/content traffic into attributable prospects.
- Give visitors a professional Spanish/English path that works on mobile and assistive technology.
- Preserve evidence of what disclosure and consent a visitor saw and accepted.
- Reduce staff re-entry while avoiding silent duplicate clients or inaccurate AI-created facts.
- Support multiple services through one governed capability instead of bespoke form logic per page.
- Keep vendor activation and business policies configurable without disposable implementations.
- Provide honest recovery when CRM, email, calendar, payment or anti-abuse providers are unavailable.

Success means a visitor receives a truthful, accessible receipt for the exact action durably
accepted by SG Solutions. It does not mean that a lead was contacted, an appointment was booked, a
service was approved, a payment was made or professional eligibility was determined.

## 3. Scope

### Release 1A architecture

- A versioned form-definition registry with immutable published versions.
- Server-authoritative public projections for approved fields, options, copy and disclosures.
- Spanish and English forms with explicit locale and version parity.
- General contact, evaluation/consultation request and callback forms.
- Minimal service-interest selection for Credit, Taxes, Business Formation, Business Funding, Home
  Buying and Marketplace without specialist intake or eligibility decisions.
- Progressive steps, conditional fields, back navigation within the current page and final review.
- Server-side validation/normalization through approved shared validation and domain services.
- Same-origin public-form gateway with request bounds, origin controls, anti-automation layers,
  idempotency and generic responses.
- Durable submission receipt before any public success claim.
- M020 lead candidate handoff, deduplication and manual-review states.
- Purpose-specific M078 consent evidence, including independent contact, marketing and partner scopes.
- First-party attribution envelope with strict minimization and no sensitive data.
- Accessible status, validation, retry and alternative contact paths.
- Administrative configuration concepts and audit requirements; no admin UI is authorized now.
- Safe degraded/manual paths when downstream capabilities are inactive.

### Release 1B-compatible extensions

- Additional governed form types and conditional schema controls.
- Approved anonymous draft/resume and abandonment recovery if privacy/retention decisions permit.
- Embedded scheduling after an accepted submission through M013; M024 is internal calendar UI only.
- Server-issued payment/quote handoff through M042–M045 when service policy permits.
- Risk-based external bot challenge after vendor/privacy approval.
- Expanded attribution and consented campaign measurement.
- M011-governed public-upload initiation only if separately approved.
- Optional M047/M060 classification/summary assistance with human review and no source-of-truth role.

Every 1A record, version, state, identifier and contract evolves into 1B through compatible
migrations and optional fields. There is no disposable form endpoint or temporary lead store.

## 4. Explicit out of scope

- Authenticated client intake, profile editing or secure portal forms owned by M007/M015.
- Direct creation, overwrite or merge of a client, case, service order or entitlement.
- Credit reports, bureau credentials, SSN/ITIN, government IDs, bank/card/account values, tax forms,
  detailed income/debt, signatures or protected documents.
- Public file uploads in Release 1A; links disguised as uploads are also prohibited.
- Professional advice, tax conclusions, credit disputes, underwriting, loan/mortgage eligibility,
  lender selection, guaranteed results or automated service execution.
- Direct database, Stripe, Google Calendar, email, WhatsApp, voice, partner or ad-platform calls from
  the browser.
- Public pricing, discount, deposit or refund policy not approved in M042/M046.
- Calendar slot ownership, appointment writes or Google synchronization.
- Payment creation, invoice state, financial reconciliation or service authorization.
- Marketing messages based only on a service request; marketing opt-in is independent.
- Partner sharing/application submission without an explicit separate purpose and consent.
- Behavioral fingerprinting, session replay, transcript capture or sensitive analytics.
- Persistent anonymous drafts, abandonment emails/SMS, AI summaries and CAPTCHA vendor activation
  until their named Product Owner gates close.
- A general no-code survey builder or arbitrary executable condition language.
- Any M006 implementation, provider activation, deployment or Operational claim in this phase.

## 5. Actors

- Anonymous visitor or prospect using Spanish or English.
- Returning anonymous visitor in the same active page session; not treated as authenticated.
- Existing client who arrives at a public form and must be routed to the secure portal for protected
  work rather than exposed or confirmed.
- Product Owner approving form inventory, fields, routing, copy, consent and retention policy.
- Authorized intake/support staff reviewing accepted submissions and potential duplicates.
- Marketing/content staff proposing public copy and placement without access to raw protected data.
- Compliance reviewer approving disclosure, consent and data-minimization boundaries.
- Operations administrator publishing/superseding future form versions under separation of duties.
- M020 lead service and CRM operators.
- M078 consent authority and M077 audit service.
- M013 scheduling, M026 notification, M042–M045 payment/quote and M011 document capabilities,
  each behind its own future gate.
- Security, privacy, observability and incident-response operators.
- Optional anti-abuse, email, analytics or model providers after separate activation approval.

## 6. User journeys

### General contact or evaluation request

1. A public page renders the approved form purpose, expected use and alternative contact route.
2. The gateway issues a short-lived, form/version/locale-bound submission nonce. This is not login.
3. The visitor completes progressive fields and can review/correct them before submission.
4. Required consent text is shown beside its action; optional marketing/partner choices remain
   unchecked and independent.
5. The browser sends the versioned envelope once with an idempotency key and attribution projection.
6. Ingress validates origin/fetch metadata, nonce, size/rate bounds, schema version and anti-abuse
   signals before expensive work.
7. The domain validates and normalizes allowlisted fields, persists a durable receipt/submission and
   consent evidence atomically, then returns a generic receipt.
8. M020 asynchronously or transactionally accepts a lead candidate using the same idempotency key.
9. The visitor sees only “request received” plus the approved next-step expectation; no lead/client
   existence, internal ID, SLA or downstream success is exposed.

### Service-interest form

1. The visitor selects one or more approved service-interest categories.
2. Only minimal, purpose-relevant public fields appear. Detailed specialist questions are not asked.
3. The form makes clear that information is preliminary and does not determine eligibility/results.
4. Service-specific answers are stored as versioned submission answers, not as authoritative credit,
   tax, funding, business or home-buying profiles.
5. Authorized staff may later promote confirmed facts through the owning intake workflow.

### Potential duplicate

1. M020 normalizes approved email/phone values and searches within authorized internal scope.
2. Exact or ambiguous similarity creates a candidate relation and review state; no public response
   reveals whether a record exists.
3. New information never silently overwrites a lead/client/contact or changes communication consent.
4. An authorized staff member links, merges or keeps separate records using audited CRM behavior.

### Scheduling next step

1. A submission must first reach `accepted` and receive an authoritative submission receipt.
2. If M013 is later active and the form/version allows it, the UI may request real slots using a
   separate scheduling contract.
3. Slot selection and booking use the scheduler's concurrency/idempotency rules.
4. Form receipt and appointment receipt remain distinct; a failed booking does not erase the form.
5. When scheduling is unavailable, the UI offers an honest callback/preference path or verified
   contact instructions without inventing availability.

### Payment or quote next step

1. Only an approved service/catalog/quote policy may expose the payment option.
2. M006 sends an opaque submission/lead reference to an authorized server-side application service.
3. M042–M045 returns a server-issued secure link/receipt; browser-provided price/product is ignored.
4. Payment state never comes from M006, query parameters, a thank-you page or caller assertion.
5. A form/payment failure does not automatically start a sensitive service.

### Validation or anti-abuse challenge

1. Inline client validation provides immediate accessible guidance but is not authoritative.
2. Server validation returns stable field codes and a generic form error without echoing sensitive
   values into URLs/logs.
3. Low-risk local controls are preferred. A future external challenge appears only at the risk step
   and has a non-visual/accessibility alternative.
4. Provider failure uses a bounded local/manual-review path when durable ingress remains safe;
   otherwise the gateway fails honestly and shows verified alternative contact instructions.

### Existing client needs protected help

1. The public form does not confirm a client relationship.
2. It directs protected document, case, payment or profile work to the authenticated portal.
3. A generic callback request may be accepted without exposing a case.
4. Public answers never inherit a case grant or client authorization.

## 7. States and transitions

### Form definition

`draft → review_pending → approved → published → superseded|retired`

- A published version is immutable. Changes create a new version and content/consent hashes.
- Only one current published version exists per form code and locale pairing unless an approved
  experiment explicitly defines mutually exclusive audiences.
- `retired` prevents new nonces/submissions but preserves evidence required by retention policy.
- Spanish/English parity is validated before publication; exceptions require Product Owner approval.

### Anonymous form session

`issued → active → review → submitting → succeeded|review_pending|validation_failed|challenge_required|expired|abandoned`

- Session/nonce is form/version/locale/purpose bound, short-lived and single-use when a durable
  `accepted|risk_review` receipt commits.
- Release 1A state exists in server nonce metadata and current-page memory only. Confidential answers
  do not enter localStorage/sessionStorage or URL parameters.
- Back navigation inside the current page is supported; refresh/navigation may lose answers and the
  UI states this honestly until persistent drafts are approved.
- Before expiry, an accessible warning offers user-controlled renewal. Renewal transmits no answers,
  preserves current-page memory and issues a new nonce with the same form/version/locale/purpose
  binding. It may repeat while policy permits. If a security/abuse rule denies renewal, a documented
  WCAG security exception and equivalent human/contact path are required; ordinary completion never
  has an unavoidable time limit.

### Submission

`received → validating → rejected|risk_review|accepted`

`risk_review → accepted|rejected`

`accepted → lead_pending → lead_linked|duplicate_review|manual_review|lead_failed`

`accepted|lead_* → retained → deletion_pending|legal_hold → deleted`

- `received` is not public success. A generic success receipt follows only durable `accepted` state
  plus required consent evidence.
- `risk_review` returns only a neutral `request_received_for_review` receipt. It does not disclose
  the risk reason, claim lead creation/assignment or use accepted/success wording.
- Duplicate/idempotent submission returns the original generic receipt without repeating side effects.
- Unsupported/retired schema, invalid nonce or binding mismatch is rejected without partial lead data.
- `risk_review` may retain only otherwise approved Confidential answers under normal submission
  controls while withholding lead promotion. Suspected prohibited/Highly Sensitive content is
  discarded or irreversibly redacted before durable persistence; only an opaque content-free
  incident reason survives. No raw forensic quarantine is authorized.
- An authorized staff decision moves `risk_review` to `accepted|rejected` using expected-state and
  version compare-and-set, reason, actor and audit evidence. Only the atomic transition to
  `accepted` appends the M020 lead-candidate outbox record; competing/stale decisions have no side
  effect. A transition to `rejected` never schedules M020 work.
- `lead_failed` preserves the accepted submission and creates bounded retry/manual recovery; it does
  not make the visitor resubmit or claim CRM success.

### Consent evidence

`presented → accepted|declined → withdrawn|expired|superseded`

- Required service-contact consent and optional marketing/partner consents are distinct purposes.
- A visitor can submit when optional consent is declined.
- Withdrawal changes future processing/communication; immutable evidence of the historical action is
  retained only under the approved policy.

### Deduplication candidate

`none → exact_candidate|ambiguous_candidate → linked|kept_separate|merge_approved|dismissed`

- Only authorized staff/domain services transition candidates.
- A similarity signal never modifies source records or becomes a public existence oracle.

### Downstream delivery

`not_required|pending → dispatched → accepted_external|dispatch_unknown|failed_terminal`

`dispatch_unknown → reconciling → confirmed|not_sent|manual_review`

- Durable outbox and stable idempotency precede any external provider attempt.
- A timeout is reconciled and never retried blindly.

## 8. Business rules

- Every submission names a server-known `formCode`, immutable `formVersion`, locale and purpose.
- The client never defines fields, types, requiredness, condition logic, routing, prices or consent.
- Server validation is authoritative and rejects unknown fields, duplicated keys and type confusion.
- Conditional hidden fields are cleared/ignored server-side unless their server-evaluated condition is
  true for that same definition version.
- Only NFC-normalized bounded Unicode text is accepted; control/bidi/invisible characters follow a
  documented field policy and never reach headers, logs or queries unsafely.
- Email/telephone/address normalization preserves original user-provided display value separately
  from canonical matching values when policy permits.
- Free text is disabled by default and, when approved, has strict length, purpose and redaction rules.
- No SSN/ITIN, card/bank/account credential, password, report credential, tax document or government
  ID field exists in a public schema.
- A public submission is preliminary caller-provided information, not a verified client fact.
- Contact consent required to respond is purpose-specific. Marketing and partner consent are optional,
  separate and unchecked.
- Consent evidence includes exact copy/version/hash, locale, purpose, action, timestamp, form version
  and delivery context; a checkbox alone is insufficient evidence.
- M020 owns lead creation/deduplication. M006 never directly creates/merges a client.
- M013 owns slots/bookings; M024 owns only internal calendar UI. M006 never invents an appointment.
- M042–M045 owns quotes/payments. M006 never trusts price/product/payment state from the browser.
- M078 owns consent state; M006 collects an evidence envelope under an approved policy.
- M077 owns audit evidence; analytics events are not audit records.
- Server receipt is opaque, non-sequential, non-enumerable and reveals no internal record identity.
- Duplicate submissions with the same idempotency scope return the same generic receipt.
- Browser, network, bot-challenge, CRM, email or provider failure never produces fake success.
- Public forms display no unapproved price, address, phone, hours, SLA, license, testimonial or result.
- Any real provider or destination remains disabled until its activation row is closed.

## 9. Authorization rules

- Anonymous visitors may read only the active public form projection and submit only its allowlisted
  fields/purposes through the same-origin gateway.
- A form nonce is anti-replay context, not authentication, identity, client membership or grant.
- Origin/fetch metadata, nonce and cookies are defense layers; none turns browser input into trust.
- Public responses are generic and cannot query whether an email, phone, lead or client exists.
- The gateway authenticates to a narrow application facade and has no database, Supabase service-role,
  Storage, Stripe, CRM-admin or provider-general credential.
- Domain services authorize definition version, purpose, routing and every downstream command.
- Staff permissions separate `form:read_submission`, `form:triage`, `lead:link`, `consent:read_evidence`,
  `form:publish`, `form:configure_routing`, `form:export` and `form:delete`.
- Marketing/content roles may edit public editorial copy but cannot view raw submissions unless they
  also hold the exact operational permission.
- Publication and consent/routing changes require separation of duties and audit; the author cannot
  silently publish a materially different sensitive schema.
- Exports, bulk access, retention override, legal hold and deletion require enhanced review and are
  fully audited.
- Client/case authorization is never inferred from a public submission or contact match.

## 10. Data requirements

### Shared primitives reused

`Person`, `ContactPoint`, `Lead`, `Consent`, `Appointment`, `Task`, `Message`, `Payment`, `AuditEvent`,
`Workflow`, `ProviderConnection`, `ExternalEventReceipt` and `AttributionTouch` where approved.

### FormDefinition

- stable form code and immutable version;
- status, purpose, owner and Release slice;
- locale support and translation-parity state;
- field/step/condition schema using a constrained declarative language;
- server validators, normalizers, limits and sensitive-class prohibition;
- disclosure/consent policy references and copy hashes;
- routing policy identifier, enabled downstream capabilities and fallback behavior;
- publication/retirement timestamps, approver and audit references.

No definition contains executable JavaScript, arbitrary SQL, provider credential or arbitrary URL.

### FormFieldDefinition

- stable field code, data type, classification, purpose and step;
- localized label, help/error IDs and autocomplete semantics;
- min/max/pattern/enum constraints and normalization policy;
- server-evaluated visibility/required condition;
- analytics prohibition/default and retention class;
- allowed downstream mapping identifier.

### PublicFormSession

- opaque session/nonce reference, form/version/locale/purpose binding;
- issued/expiry/consumed timestamps and replay state;
- privacy-minimized abuse/rate bucket and policy version;
- no answer values in Release 1A.

### FormSubmission

- opaque internal ID and public generic receipt token/hash;
- form/version/locale/purpose and lifecycle state;
- submitted answer envelope referencing stable field codes;
- normalization/validation version and optional scoped payload-HMAC reference;
- created/accepted/rejected/retention/deletion timestamps;
- idempotency scope/key hash, source session and processing attempt;
- consent-evidence references, attribution envelope reference and audit linkage;
- downstream lead/dedup/outbox receipt references without duplicating their truth.

Answers are Confidential unless a stricter class applies. The public schema prohibits Highly
Sensitive values; detected prohibited content enters a fail-closed isolation/redaction/manual
incident path rather than ordinary lead/model/analytics processing.

An unkeyed deterministic answer/contact checksum is prohibited. If payload equivalence is necessary
for idempotency or abuse defense, compute a server-secret HMAC over a canonical length-prefixed
envelope bound to purpose, form code/version and a bounded time/key epoch. Store only the scoped
digest/key version/expiry, never reuse it across purposes, rotate the key and delete it at its TTL.

### FormConsentEvidence

- submission, policy, purpose, locale and form-version references;
- exact disclosure/action copy hash and rendered-version identifier;
- presented and action timestamps; accepted/declined/withdrawn state;
- approved source/channel context and minimised technical evidence;
- downstream communication/partner scope and expiry where applicable.

### FormAttributionEnvelope

- first-party landing/referrer category and allowlisted UTM/campaign identifiers;
- normalized ad-platform click identifier only if approved by consent/privacy policy;
- first/last touch timestamps and policy version;
- no answer, email, phone, free text, client/case/payment value or sensitive URL/query.

### SubmissionRiskAssessment

- opaque submission/session, policy version and content-free signals;
- decision `allow|challenge|risk_review|reject` and content-free reason codes;
- provider receipt only after activation; no device fingerprint raw attributes;
- retention/expiry and reviewer outcome.

### LeadCandidateReceipt

- submission, M020 command/idempotency and generic outcome category;
- potential duplicate review reference hidden from the visitor;
- accepted/unknown/failed/reconciled timestamps and manual owner.

### Classification and prohibited persistence

- Public: labels, approved options, instructions, disclosures and generic receipt language.
- Internal: schema publication metadata and non-identifying aggregate metrics.
- Confidential: contact data, answers, consent evidence, attribution, IP/network abuse evidence,
  receipts and deduplication candidates.
- Highly Sensitive: prohibited for public schema; accidental detection uses the incident boundary.

Never persist full URL query strings, cookies, auth headers, passwords, card/bank/SSN/ITIN/government
IDs, credit-monitoring credentials, raw bot-provider payloads, hidden honeypot values in business
records, or form answers in logs/traces/analytics/URLs.

## 11. API or service contracts

Contracts are conceptual until an explicit Build gate authorizes executable types.

### Public gateway

- `GET PublicFormProjection(formCode, locale) → PublishedFormProjection|NotAvailable`
- `POST FormSessionIssue(formCode, version, locale, purpose) → BoundedSessionReceipt`
- `POST FormSessionRenew(sessionRef, currentBinding) → BoundedSessionReceipt|Denied`
- `POST PublicFormSubmit(envelope, sessionNonce, idempotencyKey) → GenericAcceptedReceipt|GenericReviewReceipt|GenericError`
- `GET PublicSubmissionStatus(publicReceipt, proof) → GenericPending|GenericAccepted|GenericUnavailable`
  only if Product Owner approves status lookup; absent in default Release 1A.

### Domain services

- `FormRegistry.getPublished(formCode, locale, at) → AuthoritativeFormDefinition`
- `FormValidator.validate(definition, answers) → ValidatedAnswers|ValidationDecision`
- `ConsentEvidenceService.record(command) → ConsentEvidenceReceipt`
- `SubmissionService.receive(command, idempotencyKey) → AcceptedReceipt|RiskReviewReceipt|Rejected`
- `SubmissionRiskService.assess(context) → RiskDecision`
- `RiskReviewService.resolve(reviewRef, expectedVersion, accepted|rejected, actor, reason) → AcceptedReceipt|Rejected|Conflict`
- `LeadCapturePort.submitCandidate(acceptedSubmissionRef, idempotencyKey) → LeadCandidateReceipt`
- `SchedulingHandoffPort.create(submissionRef, purpose) → SchedulingSessionReceipt|Unavailable`
- `QuotePaymentHandoffPort.create(submissionRef, approvedOfferRef) → SecureHandoffReceipt|Unavailable`
- `NotificationPort.queueSubmissionNotice(submissionRef, approvedTemplate) → DispatchReceipt`
- `DocumentIntakePort.requestUpload(submissionRef, purpose) → SecurePortalRoute|Unavailable`
- `PartnerReferralPort.prepare(submissionRef, purpose, consentRef) → ReferralDraftReceipt|Denied`

### Envelope contract

- Required: form code/version, locale, purpose, field-code map, consent actions, attribution version,
  session nonce and idempotency key.
- Reject: unknown/duplicate keys, client-defined conditions/requiredness, unbounded nesting, files,
  binary content, HTML, executable expressions, provider IDs not allowlisted and stale/retired version.
- A byte/deadline-bounded raw-body parser or streaming validation stage rejects duplicate/prototype
  keys and enforces depth/key/string/array/count limits before object materialization. If the
  deployed runtime cannot provide this property, the endpoint must not accept the request.
- Never call an ordinary `request.json()`/`JSON.parse()` path before those checks and never merge or
  spread a raw parsed object. After schema validation, map stable field codes into a domain-owned
  null-prototype structure.
- The server evaluates conditional visibility and drops/rejects answers not eligible for that state.
- Stable validation codes map to localized copy; raw exception/provider text is never public.

### Same-origin/server boundary

Astro remains static-first. Only narrowly scoped form session/submission routes run on demand in
`apps/www`. They enforce same-origin policy and call a typed `apps/app` application facade using a
least-privilege service identity. They never connect directly to Postgres, M020, email or providers.

Provider-specific payloads stop at adapters. Browser success follows a durable internal receipt,
not email delivery, analytics, CRM UI visibility or an external provider response.

## 12. Events and background jobs

### Durable domain events

- `public_form.definition_published|superseded|retired`
- `public_form.session_issued|expired|consumed`
- `public_form.submission_received|accepted|rejected|risk_review`
- `public_form.risk_review_requested|approved|rejected`
- `public_form.consent_recorded|declined|withdrawn`
- `public_form.lead_candidate_requested|linked|duplicate_review|failed`
- `public_form.risk_challenge_requested|passed|failed|manual_review`
- `public_form.scheduling_handoff_created|failed`
- `public_form.payment_handoff_created|failed`
- `public_form.notification_requested|delivered|failed`
- `public_form.retention_due|deleted|legal_hold`

### Jobs

- Submit only accepted candidates to M020 using stable idempotency and bounded retries. A
  `risk_review` row cannot produce or dispatch a lead command until an authorized compare-and-set
  transition to `accepted` commits the lead outbox record.
- Reconcile `dispatch_unknown` with provider/domain lookup; never blindly duplicate a lead/message.
- Route potential duplicates/manual reviews to an authorized queue.
- Send internal/client acknowledgements only through approved M026 templates and destinations.
- Expire sessions, risk metadata and future drafts according to approved TTLs.
- Apply submission/consent/attribution retention, deletion and legal-hold transitions.
- Aggregate content-free funnel metrics only after analytics policy.
- Detect stale accepted submissions without lead/manual ownership and alert operations.
- Future: classify/summarize through M047/M060 only with minimized approved fields and human review.

Every job has durable Postgres state, stable idempotency, bounded exponential retry, terminal failure,
manual recovery and audit. Inngest coordinates but owns no submission, consent or lead truth.

## 13. Error states and recovery

| Failure | Public behavior | Durable recovery |
|---|---|---|
| Form unavailable/retired | Generic unavailable plus verified contact route | Operator inspects publication state; never serve stale sensitive schema |
| Unsupported version | Do not accept partial values; request safe reload | Audit/content-free metric; old published evidence remains |
| Invalid/expired/replayed nonce | Generic session error; issue fresh form when safe | No side effects; rate/replay observation |
| Oversized/malformed request | Reject before expensive parsing | Bounded abuse reason; no raw body persistence |
| Validation failure | Focus summary and field codes; preserve current-page safe values | No submission/lead side effect |
| Prohibited sensitive value suspected | Do not echo; fail closed to secure portal/human | Discard/redact before durability; content-free incident reason only, no raw forensic quarantine/model/analytics |
| Approved Confidential submission needs risk review | Neutral received-for-review receipt; no risk detail or success/assignment claim | Manual-review outbox only; no M020 command until authorized versioned acceptance |
| Duplicate idempotency key | Return original generic receipt | No repeated consent/lead/notification side effect |
| Anti-abuse provider unavailable | Local controls/manual review if safe, otherwise honest failure | Circuit breaker and operator alert; no automatic deny claim |
| Submission transaction unavailable | No success claim; bounded retry instruction | No partial consent/lead; operator incident |
| M020 unavailable | Form remains accepted; say only request received | Outbox retry/manual review; no duplicate resubmission required |
| Lead result uncertain | Keep `dispatch_unknown` | Capability-aware reconciliation; no blind retry |
| Notification/email unavailable | Receipt page remains authoritative | M026 retry/manual follow-up; never claim email delivered |
| Scheduler unavailable/conflict | Preserve form receipt; offer callback/contact route | Scheduler owns retry/new slots; no fake booking |
| Payment/quote unavailable | Preserve request; hide/disable payment action honestly | M042–M045 reconciliation/manual follow-up |
| Analytics unavailable | No user impact | Drop bounded non-critical metric; never block acceptance |

Recovery screens distinguish received, pending, unavailable and failed. They never reveal internal
IDs, duplicate state, abuse score, another person's record or provider diagnostics.

## 14. Security and privacy requirements

- Same-origin public gateway; production allows only exact configured canonical HTTPS origins
  (`scheme + host + port`) with no wildcard or sibling-subdomain inheritance. Unsafe browser
  requests with absent, `null` or mismatched `Origin` fail closed. Fetch Metadata is an additional
  layer, and credentialed/permissive CORS is forbidden.
- Trust only the documented deployed edge and exact proxy hop/source configuration. Strip inbound
  `Forwarded`/`X-Forwarded-*` from untrusted sources and rebuild canonical scheme/host/client-network
  values at the trusted edge. Never derive allowed origin, redirect host or rate identity from raw
  `Host` or forwarding headers.
- Form/version/locale/purpose-bound nonce with high entropy, short TTL and atomic single-use
  consumption when either an `accepted` or `risk_review` durable receipt commits. Replay returns the
  original matching accepted/review receipt only within the exact idempotency scope; otherwise it
  fails closed.
- Request limits before expensive work: method, content type/encoding, raw bytes, header count,
  streaming/total deadlines, JSON depth/keys/strings/arrays, concurrency and rate buckets.
- Parsing rejects duplicate/prototype keys and structural excess before materializing an object;
  validated field codes are copied into a domain-owned null-prototype structure without raw spreads.
- Server-authoritative schema and conditional logic; reject mass assignment, prototype keys,
  duplicate JSON keys/type confusion and unknown fields.
- Layered abuse controls: honeypot, bounded timing/rate signals and risk decision. No external
  CAPTCHA, cookie-based fingerprint or device graph until approved.
- Never expose duplicate/client existence through response, timing category, validation or status.
- Values are encoded at output and parameterized in persistence; free text never becomes HTML,
  email header, redirect, query, template name, workflow expression or log field.
- URLs/redirects/templates/routing/provider destinations are server allowlists, not form answers.
- Do not place PII/answers/consent text in query strings, referrers, analytics, Sentry context,
  OpenTelemetry attributes, logs, cache keys, public CDN bodies or model prompts.
- Apply `Cache-Control: no-store` to session/submission/error responses and any page containing
  returned answer state; static blank form projection may be publicly cached by version.
- Secrets remain in approved secret management; `apps/www` receives only a scoped facade identity.
- Use field/class retention and deletion. Legal hold is explicit, permissioned and audited.
- Detect prohibited protected values before normal persistence/downstream processing; do not echo.
- Public uploads are rejected at route/content-type level until M011 and its malware lifecycle are
  separately active.
- Consent evidence is tamper-evident through immutable version/hash/audit references, not a mutable
  checkbox column.
- Security tests after Build cover CSRF/cross-origin, replay/concurrency, mass assignment, duplicate
  keys, prototype pollution, Unicode/control injection, XSS/header injection, status/dedupe oracle,
  rate-limit bypass, oversized/slow bodies, stale schema, consent mismatch and downstream timeout.

## 15. UX and accessibility requirements

- Use SG Solutions' approved light-first design tokens, Manrope headings, Inter body and high-trust
  professional presentation; no generic credit-site visual language.
- Design mobile-first with one clear purpose, concise intro, progress indicator and visible next step.
- Prefer few meaningful steps. Never split a form merely to inflate progress or collect data early.
- Labels remain visible; placeholders are examples, not labels. Required/optional status is explicit.
- Validation occurs on blur/submit without punishing typing; error summary links/focuses each field.
- Focus moves to the error summary or success heading after submission; live regions are concise and
  do not repeatedly announce every keystroke.
- Keyboard, switch and screen-reader flows work without drag, hover or time pressure.
- Touch targets are at least 44 by 44 CSS pixels; zoom/reflow works at WCAG 2.2 AA expectations.
- Conditional fields announce appearance appropriately and preserve logical reading/focus order.
- Input types and `autocomplete` values match the purpose; do not disable paste/password managers
  on ordinary contact values.
- Every challenge has a non-visual accessible alternative and a human/contact fallback.
- Review step shows plain-language labels, not internal field codes, and permits correction.
- Success copy states exactly what was received and what is not yet confirmed.
- Reduced motion is respected; progress/error/success never relies on animation or color alone.
- Page/session expiry gives advance notice only if answers would be lost and provides a safe restart.
- Nonce expiry provides a keyboard/screen-reader accessible warning and user-controlled renewal that
  preserves current-page answers without transmitting or persistently storing them. No ordinary
  completion time limit is imposed.
- No manipulative consent, prechecked optional box, bundled marketing agreement or disguised partner
  application.

## 16. Bilingual requirements

- Spanish and English are first-class authored experiences, not runtime machine translations.
- One canonical field/purpose code maps to separately reviewed locale copy.
- Labels, help, options, errors, disclosures, consent actions, review and success/failure states have
  functional parity before publication.
- Locale is explicit in form/session/submission evidence and never inferred solely from browser
  language after the visitor chooses.
- Switching locale before submission loads the equivalent immutable version and requires the user
  to re-review consent copy when its hash changes.
- Names, emails and addresses preserve Unicode safely; validation does not impose English-only
  assumptions.
- Dates/telephone/address examples are locale-aware, while canonical storage remains unambiguous.
- Staff receives the visitor's preferred language and must not assume bilingual support is immediate
  unless the approved routing policy says so.
- Translation changes create a new approved version when they alter meaning or consent.

## 17. Acceptance criteria

Architecture acceptance requires:

1. M006 is one reusable public-form capability, not a second CRM or specialist-intake system.
2. Astro remains static-first; a narrow same-origin gateway owns anonymous session/submission ingress.
3. The browser and `apps/www` do not access Postgres, CRM or providers directly.
4. Form definitions are server-authoritative, constrained, versioned and immutable once published.
5. All 21 PRD sections and unresolved decisions are complete and internally consistent.
6. Release 1A accepts only minimal public contact/service-interest data and rejects public files.
7. Consent purposes/copy hashes and attribution are separate, minimized and auditable.
8. M020 owns lead/dedup state; the public response never exposes existing records.
9. Durable acceptance precedes success; downstream failure uses outbox/manual recovery.
10. Idempotency/replay/out-of-order/unknown states prevent duplicate side effects.
11. `risk_review` creates only audit/manual-review work; concurrent or stale review decisions cannot
    promote a lead, and only its authorized atomic transition to `accepted` creates one M020 outbox
    command.
12. Canonical-origin/proxy spoofing, pre-materialization parser limits, schema injection,
    prohibited-sensitive-input and resource-exhaustion paths fail closed.
13. Public receipt/status cannot enumerate submissions, leads or clients.
14. Scheduling, payment, notifications, uploads, partners and AI remain separate gated handoffs.
15. Spanish/English, responsive, keyboard, screen-reader and WCAG 2.2 AA requirements are testable.
16. External accounts, providers, copy, routing and retention decisions remain explicitly deferred.
17. No code, database, provider, form traffic, merge, deployment or Operational status is created by
    this documentary package.

Future Build acceptance additionally requires contract/unit/browser/accessibility/security tests,
threat-model review, migration/rollback plan, controlled rate/concurrency evidence, data-deletion
tests and independent review. External activation requires its register evidence.

## 18. Negative acceptance criteria

- No `.NET`, FluentValidation or unapproved runtime/dependency is added by documentation.
- No public form route, component, API, database table, email, cookie or tracking pixel is created.
- No SSN/ITIN/card/bank/password/credential/government ID/credit report/tax document is requested.
- No public file upload or base64/binary answer is accepted.
- No hidden/conditional browser value bypasses server-side condition/allowlist evaluation.
- No client-defined price, product, route, role, consent copy, required field or redirect is trusted.
- No lead/client/case/contact is silently created, merged, overwritten or revealed.
- No marketing or partner consent is prechecked, bundled or inferred from service-contact consent.
- No form answer, PII, full URL, referrer query or provider payload enters logs/analytics/traces/errors.
- No browser calls Stripe, Google, CRM, email, WhatsApp, voice, Storage, model or partner API directly.
- No “appointment booked”, “payment received”, “approved”, “eligible”, “case started” or response-time
  claim appears without its owning authoritative receipt/policy.
- No anti-spam vendor, device fingerprint, abandonment recovery, persistent draft, public upload or AI
  classification is activated by architecture approval.
- No external provider test double or generic receipt is reported as a live integration.
- No M006 implementation starts without Product Owner approval of the PRD/ADR and explicit Build gate.

## 19. Dependencies

### Required for architecture

M001 Public Website; M002 Help Center; M017 CRM relationships; M018 canonical people/contact
methods; M020 leads; M025 communications; M026
notifications; M041 provider abstraction; M077 audit; M078 consent; M080/M081 IAM/RBAC; M082 PII;
M084 integration security; M085 retention; M086 information architecture; M087/M088 design/UX; M090
configuration; M092 analytics; M097 observability; M098 recovery; M099 deployment; existing
`marketing-leads-consent.md` umbrella PRD.

### Required before future Build

Approved M006 PRD/design/ADR 010; explicit `GENERATE` and Build gate; approved Release 1A form/field/
routing/consent inventory; threat model; Zod/domain contract design; migration/rollback plan; test
strategy; accessibility design; retention/deletion configuration; manual triage path.

### Required only for affected activation

Institutional email/domain/delivery; CRM destinations; approved disclosures/consents; form ownership
and staff routing; anti-abuse provider if selected; analytics/cookie policy; ad-platform settings;
calendar/payment/provider accounts; partner agreements; secure upload capability; AI provider/evals.

The absence of those accounts does not block provider-neutral architecture, but no affected behavior
may be described as live.

## 20. Risks

| Risk | Control |
|---|---|
| Public form becomes a PII collection dump | Purpose/field allowlist, progressive minimization, sensitive-field prohibition |
| Browser bypasses conditional/required rules | Server-authoritative immutable schema and condition evaluation |
| Bot floods CRM/email | Preparse bounds, local layered abuse controls, risk/manual review and rate limits |
| Proxy/Host poisoning bypasses origin/rate policy | Exact canonical origin allowlist, trusted hop/source config and header rebuilding |
| Duplicate/deep JSON bypasses Zod after parsing | Bounded raw/stream parser before materialization; null-prototype domain mapping |
| CSRF/cross-origin spam | Same-origin gateway, Origin/Fetch Metadata, bounded nonce and no permissive CORS |
| Replay creates duplicate leads/messages | Atomic nonce/idempotency receipt, outbox and original generic receipt |
| Dedupe leaks client existence | Generic response, internal-only candidates and timing/result normalization |
| Consent cannot be proven | Exact locale/purpose/copy hash/version/action evidence and immutable audit |
| Optional consent becomes coerced | Independent unchecked controls; submission works when declined |
| Answers leak through telemetry/referrer | POST body only, no-store, allowlist/redaction and prohibited observability fields |
| Schema edit changes historical meaning | Immutable published versions and preserved evidence |
| CRM/provider timeout triggers blind retry | `dispatch_unknown`, lookup/reconciliation and manual review |
| Public upload brings malware | Reject uploads until M011 quarantine/scan gate exists |
| Detailed service intake creates legal/privacy risk | Minimal public fields; authenticated vertical intake later |
| AI invents or mutates facts | Disabled by default; bounded classification, versioned output and human review |
| Ads attribution creates surveillance | First-party minimization, separate consent/cookie decision and no sensitive values |
| Anonymous draft exposes shared-device data | No persistent draft/browser storage in 1A |
| Short nonce penalizes disability or slow completion | User-controlled renewal with in-memory preservation; WCAG exception only for proven security need |
| Answer checksum enables offline guessing/correlation | No unkeyed digest; scoped rotating HMAC with bounded TTL only when necessary |
| Bilingual versions diverge | Parity publication gate and semantic version/hash review |
| Success copy overpromises | Durable receipt terminology and owning-module receipts only |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the exact Release 1A public form inventory, service-interest
  routing owners, business-hours expectation and bilingual response copy/SLA; the baseline makes no
  response-time promise.]
- [NEEDS PRODUCT OWNER DECISION: approve the exact field allowlist, option values, free-text use and
  classification for every form; the default is minimal contact plus broad service interest.]
- [NEEDS PRODUCT OWNER DECISION: choose whether form definitions are initially code-reviewed
  configuration or an approved admin publisher; no arbitrary no-code executable rules are allowed.]
- [NEEDS PRODUCT OWNER DECISION: approve Spanish/English privacy, automated-processing, contact,
  marketing and partner consent/disclosure copy, purpose, versioning and withdrawal behavior after
  applicable review.]
- [NEEDS PRODUCT OWNER DECISION: approve retention, deletion and legal-hold periods for sessions,
  submissions, rejected/risk-review metadata and approved Confidential answers, content-free
  prohibited-data incident reasons, consent evidence, attribution, scoped HMAC/idempotency and
  deduplication candidates; raw Highly Sensitive quarantine is not authorized.]
- [NEEDS PRODUCT OWNER DECISION: approve anti-spam/rate thresholds, IP/network evidence TTL,
  challenge provider if any, cookie/fingerprinting prohibition or use, accessibility alternative and
  provider privacy terms.]
- [NEEDS PRODUCT OWNER DECISION: approve whether anonymous server/browser draft resume is permitted,
  which fields, encryption/token model, TTL, shared-device warning and deletion; default is no
  persistent draft or local/session storage of Confidential answers.]
- [NEEDS PRODUCT OWNER DECISION: approve whether abandoned-form recovery is permitted, its qualifying
  consent, delay/cadence/suppression, allowed fields and deletion; default is disabled.]
- [NEEDS PRODUCT OWNER DECISION: approve whether any public upload initiation is allowed in a later
  slice and its file allowlist, size, consent and M011 quarantine/scan path; default is reject-all.]
- [NEEDS PRODUCT OWNER DECISION: approve which accepted forms may offer embedded scheduling versus a
  callback/redirect and the required M013 fallback; no slot or booking is implied now.]
- [NEEDS PRODUCT OWNER DECISION: approve which accepted forms may receive a quote/payment handoff,
  catalog/price authority, copy and M042–M045 eligibility; browser-defined prices are forbidden.]
- [NEEDS PRODUCT OWNER DECISION: approve any partner/Marketplace sharing purpose, exact fields,
  agreement, disclosure, consent, revocation and evidence; default is no sharing/application.]
- [NEEDS PRODUCT OWNER DECISION: approve attribution fields, retention, cookie/consent mode, ad click
  identifiers and conversion destinations after privacy review; default excludes external scripts
  and sensitive/full URL data.]
- [NEEDS PRODUCT OWNER DECISION: approve whether AI may classify/summarize accepted submissions, the
  field allowlist, provider/data terms, retention/no-training, evaluations and human review; default
  is deterministic/manual only.]

These decisions block only their affected Build or activation behavior. They do not block approval
of the safe provider-neutral form architecture.

## Delivery and activation record

- Architecture: candidate prepared for Product Owner review on 2026-08-09.
- Local implementation: not authorized and not started.
- External activation: deferred; see `EXTERNAL_ACTIVATION_REGISTER.md`.
- Operational status: not eligible.
