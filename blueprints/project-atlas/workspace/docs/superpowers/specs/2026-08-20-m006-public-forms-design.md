# M006 Public Forms Design

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Approved Build design, provider-disabled only
- Base: M005 accepted at `b8db282`
- Scope: public Website form capability within the existing Project Atlas workspace

## Decision summary

M006 adds one reusable, bilingual public-form engine. It is not a collection of bespoke pages,
a second CRM, a public intake portal, or a provider integration. The existing repository contains
the relevant public Astro surface, public-chat security/UI conventions, TypeScript domain packages,
Drizzle migrations, and provider-disabled voice/communications patterns. It has no existing public
form engine, CRM lead implementation, calendar, Stripe, upload, analytics, or anti-abuse runtime to
extend. M006 therefore establishes the sole form foundation and exposes narrow owner ports for the
later modules rather than duplicating their state.

## Brownfield map and preserved conventions

| Area | Existing boundary | M006 decision |
| --- | --- | --- |
| Public UI | Astro pages/components in `apps/www`, data attributes and plain TypeScript enhancement | Add Astro form route/components and one DOM script; preserve `BaseLayout`, locale paths and CSS token language. |
| Public security | M003 same-origin bootstrap, CSRF header, session binding, generic envelopes | Reuse that posture with a distinct `public_forms` cookie/nonce scope; no chat token or conversation identity becomes a form grant. |
| Domain | `packages/domain` pure contracts/services, memory stores and typed ports | Add `public-forms` submodule; no browser or route owns business rules. |
| Validation | `packages/validation` has Zod-oriented public boundary validation | Add allowlisted dynamic-definition and submission validators; frontend uses the same safe projection, backend re-evaluates it. |
| Persistence | Drizzle schema/migrations plus memory/Postgres repositories | Add M006 tables, repository and generated migration; public web has no database credentials. |
| Language/UI | `packages/i18n`, public ES and `/en` routes, accessible chat behavior | Require ES/EN definition parity before publication; preserve visible labels, error summary, live regions and focus handling. |
| Channel handoff | Public chat, WhatsApp and voice each use typed queues/ports | Forms create only a consent-qualified handoff intent through synthetic ports; no provider dispatch. |

## Target architecture

```text
Astro form route + renderer
  -> bootstrap/submit same-origin gateway
  -> restricted application facade
  -> public-form domain service + Postgres repository
  -> atomic submission/consent/idempotency/audit/outbox
  -> synthetic CRM/calendar/payment/channel/analytics ports
```

`apps/www` may read only a published public projection and issue/submit a scoped nonce. The
application facade receives a bounded normalized envelope and calls `PublicFormsService`; it is the
only path that commits a receipt. A receipt means the request was durably accepted, never that a
lead, appointment, payment, notification or service exists. Port implementations remain disabled
or synthetic until their owner module and activation gate are complete.

## Definition and rendering model

`FormDefinitionVersion` is immutable once published and includes `formCode`, semantic version,
locale, audience, purpose, lifecycle, schema hash, UI hash, disclosure references, retention class
and approved owner actions. A form has matching ES/EN versions with identical field and condition
structure; translation text is supplied only through approved content records, never invented in
code. Publication rejects missing parity, an unapproved disclosure reference, unsafe field types or
an executable condition.

`FormFieldDefinition` has a stable `fieldCode`, `fieldType`, `step`, required flag, option codes,
bounded rule set, conditional AST, and sensitivity classification. The server accepts only
`public`, `basic_personal`, and explicitly allowlisted coarse `financial` values such as range/band
answers. It rejects identity, restricted, tax, credit-report, credential, payment-card, account and
document fields before publication and submission. Conditions are a closed `all|any|not|equals|
present` AST over fields in the same version; unknown/hidden fields are ignored and never persisted.

The renderer has progressive steps, semantic `fieldset`/`legend`, visible labels, `aria-describedby`,
an error summary with focus transfer, `aria-live` status, non-color errors, review before submit,
keyboard back/next behavior, 320px reflow and reduced motion. Values live only in page memory. An
encrypted, server-side anonymous draft is optional per definition, bound to the opaque session token,
expires under the retained draft policy, never enters a URL or browser storage, and has no automatic
recovery message.

## Authoritative submission protocol

1. `POST /api/public/forms/bootstrap` verifies same-origin/fetch metadata and issues an opaque,
   short-lived, form/version/locale/purpose-bound nonce plus CSRF token/cookie.
2. The browser submits `formCode`, `formVersion`, `locale`, nonce, idempotency key, answers,
   consent choices and minimized attribution. The client cannot submit definitions, actions,
   sensitivity, prices, owner IDs, status, lead IDs, payment facts, or hidden data.
3. Gateway enforces content type, duplicate-key rejection, request-size limit, origin/fetch metadata,
   CSRF, nonce binding/expiry, session/IP-derived privacy-preserving rate buckets, honeypot and
   bounded abuse decision before forwarding a typed command.
4. Domain re-loads the published version, evaluates conditions, validates/normalizes every answer,
   encrypts confidential-at-rest permitted answers, persists submission, separated consent evidence,
   idempotency receipt, audit event and transactional outbox atomically.
5. A replay returns the original generic opaque receipt. A validation, abuse or downstream failure
   does not reveal lead/client existence, internal IDs, provider state or risk reason.

## Records, authority, retention and RLS

M006 owns `form_definitions`, immutable `form_definition_versions`, `form_submissions`, encrypted
`form_responses`, `form_consent_evidence`, `form_attribution`, `form_submission_receipts`,
`form_drafts`, `form_outbox` and minimal `form_audit_events`. Database values that can identify a
visitor are envelope-encrypted with key references kept server-side; normalized contact matching
values are purpose-scoped keyed digests for the M020 port, not analytics identifiers. IP and user
agent do not enter submissions, analytics or ordinary logs; abuse controls retain only bounded,
rotating opaque bucket keys.

Postgres RLS is forced on every M006 table. Anonymous traffic uses no direct table policy; only the
restricted facade transaction can write. Staff reads require exact permissions and purpose-limited
views. Definition publication, routing/retention configuration, submission review, export and
deletion are separate permissions with audited separation of duties. Retention uses explicit
expires-at/deletion/legal-hold states; encrypted answers and drafts are deleted by a bounded job,
never retained indefinitely.

## Owner ports and provider-disabled behavior

| Port | Command/result | M006 behavior now |
| --- | --- | --- |
| `LeadCandidatePort` | `accept(candidate, receipt)` -> `linked|duplicate_review|pending` | Synthetic/M020-ready only; no direct lead/client merge. |
| `ConsentEvidencePort` | `record(evidence)` -> versioned receipt | M006 records evidence; M078 adapter remains a mock contract. |
| `AppointmentIntentPort` | `request(preference)` -> `unavailable|queued` | Capture approved preference only; never display slots or book. |
| `PaymentHandoffPort` | `request(submissionRef)` -> `unavailable|pending` | Ignore browser price/product; never create Checkout or mark paid. |
| `ChannelHandoffPort` | `queue(consentedIntent)` -> `queued|unavailable` | Synthetic chat/WhatsApp/voice intent only after explicit relevant consent. |
| `AnalyticsPort` | `record(metric)` -> void | Emits codes/counts/timing buckets with no answer, contact, nonce, receipt or PII. |
| `NotificationPort` | `request(genericReceipt)` -> `unavailable|queued` | Does not send email/SMS/WhatsApp. |

Uploads are absent from all public projections and endpoints. The renderer directs sensitive intake
to the authenticated portal when that portal capability is available; until then it provides only
approved generic alternative-contact copy. AI summaries, abandoned-form messaging, behavioral
fingerprinting, live CAPTCHA, live scheduling, Stripe, calendar, channel delivery and service start
remain disabled.

## Initial inventory and rollout

The shipped registry contains contact, consultation, callback, and minimal service-interest forms
for Credit, Taxes, Business Formation, Business Funding, Home Buying and Marketplace. All labels,
help text, disclosures and next-step language use approved ES/EN content entries. A staff-only
preview renders a draft definition with synthetic values and an explicit unpublished banner; it
cannot create, change, publish or submit a definition.

Build is additive. There is no form migration or legacy cutover in the accepted base. A disabled
definition and route fallback are the rollback: stop issuing nonces, preserve accepted evidence,
drain/reconcile outbox entries, and leave CRM/calendar/payment/channel owners untouched.

## Acceptance evidence

- Definition/version publication rejects unsafe sensitivity, invalid condition AST, non-parity locale
  and disclosure gaps.
- Public renderer proves ES/EN step parity, keyboard/error/focus/live-region behavior and no values
  in URL/storage.
- Gateway and domain tests prove CSRF/origin/nonce/idempotency/rate/honeypot/size enforcement,
  mass-assignment rejection, server-only condition evaluation, separated consent evidence and generic
  response privacy.
- Repository/schema tests prove atomic receipt/outbox persistence, encryption boundary, RLS contract,
  expiry/deletion behavior and no direct anonymous policy.
- Synthetic integration proves contact-to-receipt-to-port flow plus CRM/calendar/payment/channel
  unavailable paths without HTTP provider traffic or a service start.

