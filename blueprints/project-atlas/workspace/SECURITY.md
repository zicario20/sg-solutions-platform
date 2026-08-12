# Security Architecture

- Owner: Codex Architecture Agent
- Security approver: Product Owner until a delegated security owner is appointed
- Status: Phase 0 approved baseline with open policy decisions in module PRDs
- Update rule: update for every identity, authorization, storage, payment, encryption, retention,
  integration or sensitive-data change

## Core controls

- Identity, internal role and resource access are separate controls.
- Email matching, UI hiding or client status never grants resource access.
- Case grants may inherit only to client-visible child resources under ADR 004.
- Internal resources fail closed; highly sensitive documents may require additional explicit access.
- Authorization executes in domain services and Postgres RLS, with Storage policies for objects.
- Private files use quarantine, content validation, malware scanning, promotion and short-lived
  signed URLs under `FILE_UPLOAD_SECURITY.md`.
- Drizzle is the sole authority for schemas, indexes, RLS policies and migrations.
- Secrets remain in approved environment/secret stores, never source control.
- Stripe webhooks are signature-verified, idempotent, repeatable and reconciled.
- Logs, analytics, traces and error reports exclude sensitive documents, identifiers, tax/credit
  data, notes, portal free text, raw request bodies and secrets.
- M007 client activation is invitation-first. Supabase Auth credentials remain provider-managed;
  email, phone, payment and CRM status never create membership or grants. The proposed ADR 011
  requires scanner-safe one-time email/OAuth ingress, server-mediated PKCE, private/no-store
  authenticated responses, per-request provider clients, application revocation/refresh fencing,
  local-link containment of provider automatic linking and a pre-Build proof that only an opaque
  application handle reaches the browser while provider credentials remain in the envelope-
  encrypted server vault. User routes cannot use `service_role`, owner or `BYPASSRLS`; RLS actor
  context and Storage object keys are derived server-side from the validated application session.
- M008 dashboard reads freeze one session-derived account/session/membership/context/grant-set/
  entitlement-set/policy authorization snapshot across every domain fragment and revalidate every
  revocation fence before serialization. Unauthorized resources are omitted before
  aggregation; counts cannot reveal them. Personalized responses are private/no-store, no critical
  registered source failure becomes zero/no-action/paid/completed, no live provider is called by the
  browser, and portal DOM/session replay or protected dashboard telemetry is prohibited. A closed
  source registry makes missing/unknown security, signature or other priority producers fail closed.
- M009 service directory/detail reads require an explicit active ServiceOrder or governing CaseFile
  grant; client, participant, email, phone, payment, CRM or route relationships grant nothing.
  Directory counts/filters/cursors are post-authorization, and every detail uses one complete M007
  authorization snapshot plus final account/session/membership/context/grant/entitlement/assurance/
  policy fence. Every serialized root/child also carries a resource authorization epoch for parent
  linkage, visibility/inheritance, classification, tombstone and accepted-definition binding; any
  concurrent change discards the whole response before body, counts, cursors or route metadata.
  ServiceOrder commercial/activation, Billing/Stripe financial and CaseFile/workflow fulfillment
  subfacts retain canonical ownership; accepted definition/workflow versions cannot be replaced
  with current catalog data. Typed child summaries expose no provider
  payload, signed URL, internal note or hidden count, and personalized responses remain
  private/no-store under proposed ADR 013.
- M010 landing/detail reads require the same explicit ServiceOrder/governing CaseFile grant and complete
  M007–M009 authorization snapshot. Every root, milestone, blocker, child summary and public event
  carries a resource authorization epoch; the final fence discards all body/count/cursor/route
  metadata after any session/grant/parent/visibility/classification/assurance/tombstone/accepted-
  workflow change. A closed source registry fails critical absence to `unconfirmed`. Raw audit
  events, internal notes/statuses, provider webhooks and user free text never become a client
  timeline directly: a public event requires authenticated durable provenance, an allowlisted
  source/version, deterministic mapping version, idempotency and append-only correction semantics.
  Personalized process responses are private/no-store, normal rendering performs no provider fan-
  out and protected process content is prohibited from logs, traces, Sentry, PostHog and AI context
  under proposed ADR 014. The top-level selector consumes only M009's nonrecursive authorized-root
  choice port, persists no last/default service and cannot reveal hidden names/counts/timing or
  recurse through full M009/M010 aggregators. Its opaque pagination has no total/silent truncation,
  and duplicate service/context labels require approved safe bilingual disambiguation or fail
  closed without IDs. An approved eligibility policy filters accepted definition/workflow versions
  before ordering/pagination and binds its version into the cursor; ineligible roots leak no label,
  count or timing. Direct detail validates and final-fences the same policy before any process read
  or metadata. Every registered priority/status/milestone/blocker-affecting Postgres source,
  including ServiceOrder/Case/Task/Document/Billing, shares one MVCC request snapshot/restricted RLS
  actor or yields `unconfirmed`. Exact command ownership is
  Task→M023, Document/deliverable→M011, Message→M012, Appointment→M013, Billing→M014 and
  Signature→M067; every destination reauthorizes in that owning module. Release 1A derives timeline
  pages request-scoped and permits no M010 projection table/writer/job without a separate approved
  ADR and Build gate. Until PROC-010 approval, Billing output is limited to semantic obligation/
  payment state, freshness and M014 route; references, amounts, balances, deposits, due dates,
  methods, receipts and refund details are prohibited.
- M011 requires explicit case/document scope before any metadata or object I/O. Membership, email,
  CRM/client relation, payment, route reference, object key, checksum or signed URL grants nothing.
  Ordinary case inheritance reaches only client-visible linked documents; internal/compliance/
  draft, inheritance-blocked and designated Highly Sensitive resources fail closed. Every
  list/detail/cursor/upload-finalize/replacement/preview/download/review/classify/reclassify/
  visibility/client-visible-version/context-link/share/disposition action reauthorizes and
  final-fences session/context/grant, parent links, visibility, classification/assurance,
  lifecycle/hold and resource/version epochs. Exposure-changing commands use expected-version CAS,
  epoch invalidation and minimized audit/outbox; link/unlink authorizes both resource sides.
  Link/unlink, replacement and reclassification recompute the effective classification ceiling in
  the same transaction; unlink cannot create a lower-class window, and post-commit events never
  grant access or replace a canonical Postgres reread.
  Untrusted bytes land only in private quarantine and
  cannot reach normal staff/client preview, OCR, AI or accepted storage until content/parser limits,
  checksum and malware policy yield a clean verdict and promotion reconciles. Safety clean is not
  business acceptance, request/task completion or client visibility. Versions are immutable;
  signed URLs are one-object/read-only/short-lived but may remain reusable until provider expiry.
  Preview uses a credentialless dedicated origin and opaque sandbox, not the authenticated app
  origin; transformed/generated/signed-return bytes repeat independent validation, scan and
  promotion before use.
  Filenames, keys, bytes, OCR text, comments, scanner payloads and signed URLs are prohibited from
  logs, Sentry, OpenTelemetry, PostHog, DOM capture, AI history and shared/offline cache. Proposed
  ADR 015 and DOC-001–DOC-020 gate exact policies and all provider activation.
- M012 requires a fresh authenticated account/service/case grant on every conversation/message
  list, detail and command; participant, assignment, email, phone, CRM relation, payment or prior
  access grants nothing. Client messages and internal/compliance notes have separate records,
  commands, permissions, events and DTOs. Every Message is client-visible by type and carries only
  `authorKind`, so no frontend audience/visibility toggle can publish a private note. Initial-start
  idempotency binds actor/canonical root/reason/policy/digest before a conversation exists; reply
  idempotency binds actor/conversation/digest and any quoted target must be an eligible current
  client-visible revision in that same authorized conversation. Read advancement requires a current server-issued
  actor/participant/page receipt and monotonic visible bounds. Cursors are opaque, authenticated and
  actor/scope/query/snapshot/authorization-epoch/expiry bound. Posts use bounded plain text, escaped
  rendering and no automatic URL unfurl. Gap-free client-message order plus client-writability/
  visible-activity state is separate from private staff message/note activity order/version/time;
  note-only activity cannot change Client order/cursor/ETag/error/timing. Close/block/revoke still
  final-fences client writes. Every message/note/revision body and derived free-text handoff/translation summary is
  application-envelope encrypted before durable persistence; KMS failure cannot leave plaintext
  draft/rejection/summary/outbox/audit/backup state. Attachment bytes,
  keys and access stay wholly in M011; typed task/appointment/billing/signature references grant no
  owner-domain action. Future AI treats user text as untrusted data, receives no internal notes or
  unrelated content and loses publish authority atomically on human takeover. Message/note bodies,
  subjects, quotes, protected references, filenames, signed URLs and decrypted content are
  prohibited from logs, audit payloads, traces, Sentry, PostHog, notification payloads, URLs,
  browser persistence and shared/offline cache. Proposed ADR 016 and MSG-001–MSG-020 gate exact
  message, search/encryption, retention, notification, channel and AI policies.
  M012 conversation notes, M018 client-level notes and M022 case-level notes are separate non-copying
  authorities. M092/M097
  cannot receive transcript/protected identifiers/session replay, and M026 receives only purpose-
  bound opaque recipient/event refs—not direct contact PII or protected content/resource IDs.
- M013 authorizes every public/client/staff appointment read and command against current identity,
  exactly one access binding, participant/representative evidence, policy/lifecycle, assurance,
  epochs and expected version. The Astro Public Scheduling Gateway is same-origin/least-privilege,
  has no DB/provider credential and calls only the typed M013 facade. GET/HEAD are inert; the sole
  credential-free bootstrap POST accepts no booking/contact input and does not authenticate/derive
  input from an ambient cookie; an existing/stale handle is ignored, revoked where resolvable and
  atomically overwritten. It requires exact Origin, Fetch Metadata, trusted edge/host, bounds/rate/bot controls and fixation rotation before
  returning CSRF private/no-store. Every later browser mutation requires an unsafe method, exact
  Origin and session-bound CSRF. Actor-bound availability/hold/booking/manage/client/staff and OAuth/
  bootstrap responses are dynamic `private, no-store`, never ISR/CDN/service-worker/offline or
  browser-readable application response/PII persisted; the opaque host-only HttpOnly session handle
  is the session exception, while separately gated/user-initiated ICS and meeting destination/history
  retain only their disclosed boundaries. Exactly one clean M001-canonical booking route key per
  approved locale accepts public booking steps; a separately localized clean management bootstrap is
  absent until APT-007. Type/contact/capability values never enter any locale URL. Holds are session-bound, single-use and
  use opaque-only canonical digests; positive-duration UTC half-open database capacity and
  transactions—not browser checks—prevent double booking and rescheduling loss. Public prospect/
  consent context is reserved by M020/M078 and finalized only with the winning appointment. Owner
  receipts and explicit compensation prevent an orphan M020 Lead, an unauthorized M017 handoff/
  proposed purpose binding or reusable consent; the appointment flow never implies rollback of an
  M018 Person/contact method.

- Every `apps/www`→`apps/app` scheduling-facade request uses a rotating scoped workload signature
  bound to environment, issuer, exact audience/service/method/canonical path/body digest/timestamp/
  nonce/key version and RecoveryEpoch. The app rejects direct browser/internet, wrong-audience,
  stale/replayed and disallowed calls before domain parsing; a bounded nonce store, inner service/
  session/risk quotas and full reauthorization remain mandatory. Rotation/replay-store/credential
  outage fails closed. Restore increments the externally protected RecoveryEpoch, clears replay/CSRF
  state and invalidates every pre-restore scheduling session/capability/code/OAuth/watch transaction,
  hold and receipt regardless of TTL.

- M013 management capabilities are action/audience/version-bound, expiring, revocable and rate-
  limited. Ordinary state stores only the code digest. After APT-007, a raw code may be held in SG-
  controlled durable state only as a short-TTL envelope-encrypted one-time vault object referenced
  opaquely for bounded idempotent M026 delivery; it is purged/revoked on success, consumption,
  cancellation or expiry and excluded from ordinary DB/events/audit/logs/telemetry/backups. M026 and
  the approved transport/recipient necessarily see plaintext; activation therefore requires DPA,
  recipient/reassigned-address/forwarding risk and provider-retention policy, with message-body
  retention disabled/minimized where controllable. Code exchange creates a host-only, server-side,
  scope/epoch/expiry/CSRF-bound prospect session—not M007 membership.

- Google login grants no Calendar scope. OAuth binds staff session, intended connection/account/
  calendar, environment, exact scopes/callback/return, state/browser and PKCE; mismatch fails closed.
  Access/refresh tokens never enter browser/URL. The necessary transient callback code + opaque state
  contain no PII, use exact callback, no-store/no-referrer and edge/app query-log redaction, are
  consumed once immediately and redirect/replace to a clean URL; replay and durable app history fail.
  Every admitted calendar has an independent query fingerprint, cursor and complete/fresh coverage.
  Google push begins `pending_watch` with ID/token/request only; early `sync` may quarantine claimed
  identifier digests but cannot mutate business state. Only a matching authenticated watch response
  binds the minimum resource ID plus URI-comparison digest; raw calendar/email URI and secret headers
  never persist or enter telemetry. Renewal overlap, Google 410/cursor expiry, partial pagination,
  restore and dropped messages invalidate coverage and require full bounded per-source reconciliation.
  Calendar projection commands default to zero attendees and suppress provider-generated messages.

- Meeting joins remain bearer secrets. Release 1A public/prospect video is off. A future authenticated
  final-fenced launch decrypts/normalizes inside the secret boundary, enforces exact initial provider
  HTTPS scheme/host/port/path/query shape and rejects userinfo, CRLF and lookalike hosts. SG never
  server-fetches, resolves or follows the join URL; downstream provider redirects remain an APT-011
  vendor-trust/due-diligence risk, not an enforceable SG guarantee. Browser navigation uses
  no-store/no-referrer/non-prefetched handoff. Raw URL exists transiently only in secret-boundary
  memory and the final launch response/browser; it never appears in an SG route/query, persistent app/
  browser storage, Referrer, notification, DOM before authorization, analytics, response/access logs,
  trace or support copy. The unavoidable launch/provider/browser-history exposure is in the threat model.
  Notifications remain off before APT-010; afterward only a recipient-specific generic label, instant
  and display zone may enter M026. Proposed ADR 017 and APT-001–APT-020 gate all live activation.

- M014 client billing uses one explicit M007/ADR 004 service-order/case access root. Payment,
  provider customer, payer email, receipt possession or CRM relationship never establishes identity,
  delegation, membership or a grant. Client/Public/Staff services and DTOs are structurally separate;
  every quote/payment/invoice list/detail, Checkout, return, document handoff and finance mutation
  final-fences parent linkage, classification, visibility/block, resource/financial/access/recovery
  epochs before response or side effect. Public billing capability remains off until PAY-016 and then
  is one-resource, purpose/audience/version/use/expiry/environment/recovery-bound with no portal or
  history access.

- Stripe-hosted Checkout is the preferred Release 1A card collection boundary. SG application code,
  chat, WhatsApp, voice, email, forms, support notes, logs and analytics may never receive/store PAN,
  CVV, magnetic-stripe data or full payment-method detail. Test/staging/production Stripe accounts,
  endpoint secrets, idempotency namespaces and records are isolated. Secret/restricted keys and
  webhook secrets stay in approved secret management with least privilege, custody, rotation,
  recovery and revocation; no secret or raw provider payload enters repository, browser, Sanity,
  documentation or ordinary Postgres state.

- Provider mutations reserve a server-owned semantic operation and canonical digest in Postgres
  before egress, then use one exact Stripe idempotency token that is protected/retrievable or
  deterministically reproducible through domain separation and a retained key version; a hash alone
  is insufficient. Every mutation also binds a non-PII opaque SG operation correlation. Uncertain
  results use bound object/request evidence or type/account/environment/time-bounded paginated lookup;
  provider key expiry never permits blind reissue and ambiguity is quarantined. Webhook ingress bounds
  exact raw bytes, validates the account/environment-specific Stripe signature before trusted
  persistence, inserts one recovery-generation-bound receipt under composite account/environment/
  event identity and acknowledges only after durable acceptance. Every event is an invalidation
  signal: projection retrieves canonical provider objects, uses leases and deduplicates both Event ID
  and provider-object/fact version. Provider fact, operational journal/allocation, obligation
  projection, audit and outbox commit atomically.

- Checkout, receipt, hosted-invoice and Customer Portal URLs and payment client secrets are bearer-
  like secrets. The app stores opaque provider object references and creates/recovers a transient
  private/no-store/no-referrer/non-prefetched handoff only after exact authorization. Raw URLs,
  provider IDs/payloads, quote/invoice detail, amount tied to identity, dispute evidence and payment
  failure details are prohibited from analytics, traces, errors, session replay, browser persistence,
  notifications and ordinary logs. PAY-013 governs any exceptional encrypted short-TTL raw webhook
  incident material; default domain state is normalized/minimized.

- Every browser handoff is server-validated against the activated HTTPS provider scheme, exact host/
  path policy and bound provider object; arbitrary/user/database-supplied destinations fail closed.
  Public entry capabilities and provider return handles are distinct. GET/HEAD is inert and an
  explicit POST/OTP exchange with exact Origin, Fetch Metadata and CSRF/bootstrap controls establishes
  only a host-only SameSite session. Before personalized rendering or third-party subresources, a
  clean redirect/history replacement removes token transport under `Referrer-Policy: no-referrer`;
  edge/app logs, analytics, errors, caches and service workers exclude it. Link scanners, prefetch,
  forwarding, replay, concurrency and unavoidable provider exposure are in PAY-016's threat model.

- Financial incident controls disable new Checkout/refund/public-capability operations. At restore
  cutover, old-generation webhook handlers return retryable non-2xx unless a durable insert and final
  external-generation fence both succeed; receipts bind the generation. New-generation ingress opens
  before mutation egress, provider retries drain and checkpointed reconciliation covers the recovery
  interval. Prior application billing capabilities/return handles are invalidated and no newly
  satisfied financial prerequisite or provider mutation resumes until PAY-020 approval. Proposed ADR
  018 and BIZ-001–003/PAY-001–PAY-020 gate Build and all real prices, policies, credentials, events
  and money movement.

## Data and cryptography

`DATA_CLASSIFICATION.md` controls storage, access, telemetry, retention and deletion. ADR 005 defines
application-level envelope encryption for selected Highly Sensitive structured fields and separates
it from provider-managed encryption at rest. Full payment-card data is never stored or processed by
SG Solutions application code.

M015 full SSN/ITIN/EIN, full DOB, approved government identifiers and approved banking identifiers
use ADR 005 application-level envelope encryption before persistence. Masking occurs in backend DTOs;
full values are not sent to ordinary browsers or hidden only with CSS. Decrypt/reveal, export,
sharing, verification and conflict resolution are distinct purpose-bound, step-up and enhanced-audit
actions when enabled. M015 cannot mutate household or business relationships: it consumes only
reauthorized M018/M019 relationship projections. Relationship mutation remains an audited,
owner-domain step-up action. KMS failure rejects protected writes and reveals without staging
plaintext.

Profile authorization combines exact permission, explicit self-profile or service/case relationship,
purpose/consent, household/business scope, classification, assurance and resource/access epochs.
Role/email/contact/payment/relationship evidence alone grants nothing. Domain services authorize
before I/O, RLS defends every row operation and a final fence protects response/mutation/export.
Every consumer uses a minimal versioned DTO; full-profile APIs and direct provider/AI writes are
prohibited.

## Defense in depth

Authorization is checked before queries, encoded in RLS and applied to Storage objects. Every
sensitive read, export, download, grant, revocation, role change, payment mutation and destructive
administrative action emits a minimized audit event. Audit events record who, what, when, result and
correlation identifiers without copying protected content.

## Enhanced review boundary

Authentication, MFA, sessions, RBAC/RLS, client grants, Storage, uploads, encryption, payments,
financial reconciliation, sensitive data, telemetry, AI data access, migrations, CI/deploy and
recovery require independent security review. Cyber Neo remains strictly read-only and supplements,
but never replaces, professional legal/compliance review.

## Incident readiness

Security incidents use a safe manual path: contain access, revoke sessions/credentials, preserve
audit evidence, isolate affected data, notify the Product Owner, assess legal obligations, restore
from validated recovery points if needed and document lessons learned. Detailed provider playbooks
are created before each sensitive integration reaches its Release gate.

## M016 administrative dashboard

- M016 derives one canonical server-side authorization fingerprint from actor/account, session/auth
  epoch/assurance, membership, exact permission/role/team/assignment, exact grants/access epochs,
  purpose, classification ceiling/clearance, dashboard/widget/owner-contract/policy versions,
  normalized filters/period/locale/IANA zone, source version and recovery generation. No security
  dimension is optional.
- Authorization is evaluated per widget and rechecked at final serialization. A browser never
  receives broad data for local filtering, and a visible widget never grants owner-module access.
- Aggregate counts use approved minimum-population/suppression rules. Denied, hidden, suppressed,
  unavailable and zero states cannot be probed through timing, pagination, filters or error copy.
- Cache/snapshot lookup and final serialization require the exact opaque fingerprint digest/version.
  Missing or changed dimensions miss and fail closed; revocation purges affected entries even when
  source invalidation is delayed. The digest is never client-supplied, logged or analyzed.
- M016 excludes client PII, protected profile values, document/message/internal-note contents, raw
  financial/provider data, tokens, credentials and technical logs. Diagnostics are coarse and
  content-free.
- Drill-downs carry only allowlisted route keys and opaque bounded references. Every destination
  performs fresh owner-domain authorization; M016 never exposes a generic command endpoint.
- Quick, bulk, export and impersonation actions are off until their ADM gates, enhanced review and
  Product Owner approval. Payment, approval, document, communication and case changes remain owner
  commands with fresh authorization, idempotency and audit.
- Authenticated Admin analytics/autocapture/session replay is off by default. `ADM-017` must approve
  minimized product/operational analytics and telemetry event schemas/allowlists, viewers and
  retention before anything beyond essential content-free security/performance diagnostics.
  `ADM-020` sets quality SLOs only and cannot activate collection.

## M017 CRM

- M017 owns commercial relationship/opportunity/pipeline/assignment state, not M018 person/client,
  M019 organization, M020 lead, M021/M022 order/case, M023 task, M078 consent or owner-domain detail.
  Contact 360 accepts only a closed section registry and invokes typed owner ports with exact refs/
  versions/purpose/classification/grants/access epochs/freshness. Sections authorize independently,
  incomplete results remain incomplete, and every opaque destination reauthorizes. M020—not CRM
  stage/tag/score—owns Lead qualification.
- Every list, match, count, cursor, detail and mutation checks server-derived session/membership/
  permission/role/team/assignment/resource/purpose/classification state before access; Postgres RLS
  is defense in depth. Email, phone, name, company, payment, opportunity or tag grants nothing.
- Protected matching uses server-only domain-separated keyed tokens and key versions outside
  Postgres/backups. Unkeyed email/phone hashes, name-only matching and automatic/AI-only merges are
  prohibited.
- Canonical resolution is enhanced-review work: current versions, dry-run graph, conflicts,
  explicit reason/authority, idempotency, aliases/tombstones, access/session re-evaluation, audit and
  recovery are required. Ambiguity preserves separate records.
- Purpose-binding activation/revocation/supersession, Opportunity duplicate resolution, conversion,
  pipeline-version migration execute, import apply, any reconciliation that commands an owner,
  import compensation, export, internal-note redaction/retention disposition
  and protected-field reveal are separate enhanced capabilities. Each requires exact binding/owner
  versions, current assurance, approved reason/evidence, final authorization fence and any approved
  separation of duties; possessing one never implies another.
- Every enhanced execute binds the exact approved plan ID/version/digest/unused state, final closed
  inventory, current assurance and applicable SoD receipt. Reconcile is read-only by stable ambiguous
  steps/current scope/recovery epoch; resume requires an approved recovery plan+digest, only proven-
  not-started steps, final scope, current assurance/SoD and current recovery epoch.
- Optional M023 Task links and M019 Opportunity organization context require current owner-issued
  target/relationship, purpose, visibility/classification and access-epoch receipts on mutation and
  read. Owner correction/deletion/end/reassignment/revocation invalidates the link; M017 neither
  mutates the owner record nor falls back to another Task/organization.
- Protected reveal returns transient values separately from an opaque M077 receipt. M077 records
  allowed, denied and failed attempts using minimized metadata only; values and replayable references
  never enter audit, M017 persistence, logs, telemetry or caches.
- Internal-note redaction additionally requires the independent destructive capability, exact note/
  target/binding revision and epoch, current assurance, CRM-010/022 plus M085 retention/deletion/
  legal-hold authority and a durable disposition receipt. A hold or unmet retention minimum denies
  tombstone/crypto-shred; ordinary note supersede permission is insufficient.
- General bulk CRM-record mutation is absent in 1A/1B/Future until a later concrete Product Owner-
  approved PRD/gate defines preview, batch limits, per-item authorization/versions/idempotency,
  partial receipts, SoD and recovery. Export and M025/M026/M078 campaign delivery are distinct and do
  not grant bulk record mutation.
- Opportunity duplicate dry-run binds both Opportunities/purpose epochs and every known conversion,
  order/case/task/quote/payment/entitlement/approval owner ref/version. It preserves both histories
  and attribution, never rewires owner facts, blocks incompatible downstream effects and prevents a
  concurrent duplicate owner effect: a superseded member cannot convert; related members with the
  same canonical commercial intent/version + owner effect/service/scope deduplicate, while related
  members with different immutable intent/effect scope may convert independently. Keep-both creates
  no blocking relation.
- Approved Opportunity relations are durable, versioned and acyclic; candidate workflow is not the
  relation authority. Relation-group queries and close/reopen/conversion final-fence every member.
- Export requests are actor/account-owned versioned intents. Equivalent requests never deduplicate
  across actors; each receipt/artifact/capability remains current-session/assurance-bound and non-
  transferable.
- Opportunity `won`, Client activation, payment, entitlement, approval to start and case progress
  are independent owner states. Conversion records each owner result and reconciles partial/unknown
  outcomes before retry.
- Internal notes and import text are untrusted, encrypted where approved, excluded from client DTOs,
  telemetry and AI by default, and protected against stored XSS, formula and prompt injection.
- Imports require M011 quarantine/content validation/malware scanning before parsing. Exports require
  fresh row/field authorization, approved reason/assurance, formula neutralization, private short-
  lived delivery, revocation and generation/download audit.
- Consent M078 and preference M026 are checked fresh at communication time. CRM history, tag or old
  opt-in cannot authorize marketing. Unavailable consent fails closed.
- M017 distinguishes full human actor context from signed, short-lived, least-privilege workload
  capabilities. Every variant's envelope binds environment/SG organization/issuer/audience/service/
  exact action, `iat`/`nbf`/`exp`, signing-key version, recovery epoch and nonce under a verifier/key
  ring pinned per environment+audience+action. Normal variants additionally bind exact targets,
  binding-set epochs, payload, expected versions, idempotency and source receipt; they are command-
  only, cannot enumerate/list/export/merge, and revalidate an
  original human authorization receipt when applicable. There is no network-location/trusted-worker
  bypass; forgery, wrong audience/action, replay, expiry or revoked source fails closed and audits.
- `CRM-001`–`CRM-023`, independent security review, Product Owner approval and a separate Build gate
  precede any route, schema, data, merge, import/export, automation or provider activation.

## M018 Client Management

- Formal Client is not an account role, CRM outcome, payment or service authorization. M018 owns
  Person/contact-method/household and formal-client lifecycle; every other 360 section remains in its
  canonical owner and independently authorizes rows, fields, purpose, classification and drill-down.
- Staff access requires current membership, permission, assignment/resource scope, purpose,
  classification and access epoch. Client/representative access uses M007 explicit grants; email,
  family/professional label, public reference or staff status alone grants nothing.
- The closed section registry returns explicit complete/partial/stale/unavailable/suppressed/denied/
  unknown/not-applicable state. Hidden data/counts never reach the browser, and owner failure never
  becomes zero, paid, complete or no action.
- Household/co-applicant/member relationships never inherit access or consent; every visible person,
  resource, field and action needs current explicit scope, and hidden members/counts are suppressed.
  Individual-with-business requires a current exact M019 relationship/version/effective-scope
  receipt; cross-organization, revoked, denied, superseded or unavailable context fails closed.
- List/search/filter/sort and attention route only to owners the actor may query. Protected matching
  is keyed; generic risk filtering is rejected. A denied payment/compliance/document/task/other fact
  cannot affect a value, option, order, count, cursor or timing; durable attention is content-free.
- Representative invitations are signed, short-lived, one-use and exact subject/scope/audience/
  policy/nonce bound. Activation is separate from grant issuance. Revocation/expiry advances access
  epochs and invalidates grants, sessions/capabilities and caches while preserving attributed history.
- Flags do not enforce. Restrictions and suspension/block/deceased/offboarding require reviewed exact
  scope, reason/evidence, current assurance/approval/SoD, expected versions, semantic idempotency,
  owner receipts, audit and recovery. AI cannot execute them.
- Restriction effects are closed owner mappings. Apply, revoke and expiry consume the same reviewed
  current-policy plan. Unknown/unavailable owners fail closed; partial/ambiguous results reconcile by
  stable step. A scoped effect cannot widen into whole-client suspension or automatically restore
  previous access; receipt/history access is independent.
- Canonical party/contact mutations exist only behind M018 ports; caller table writes and
  contact-verification-to-identity/consent/account/client inference are forbidden. Published workflow
  definitions are immutable/frozen per instance. Note redaction requires an independent destructive
  capability, preview/approval/SoD, M085 hold receipt, final fence, tombstone and reconciliation.
- Protected reveal is one-field/purpose-bound and `no-store`; export is actor-owned, row/field
  reauthorized, redacted, formula-neutralized and privately time-limited through M011. Values/bodies
  never enter audit, telemetry, analytics, URLs, errors or browser persistence.
- Ordinary M018 export excludes internal notes, flag/restriction rationale, identity/security/audit,
  score/risk/evaluation and AI material by default. A legal dataset is separately M085-authorized
  with approval/SoD; ordinary export authority cannot broaden it.
- Temporary access is an M018 exact-scope/purpose/reason/TTL request/approval/revocation receipt plus
  M007 owner grant/invalidation outcome. SoD/step-up/current epochs apply; M018 never mutates grants
  or sessions, and expiry/revocation clears caches/capabilities. Portal admin and preference changes
  are typed M007/M080 and M026 owner actions, never generic M018 mutation.
- Alert and quick-action registries are closed/versioned. Owner alerts retain source/version/
  freshness/visibility and reauthorized owner CTA; M018 flags are review signals only. No generic
  launcher, hidden count, partial-as-empty state or copied owner fact is permitted.
- Canonical matching uses domain-separated keyed tokens with key/version outside Postgres/backups.
  Name-only, unkeyed-hash, score-only, automatic and AI-only merge are prohibited. Merge freezes the
  complete known owner graph and uses reviewed preview, final fences and reconciliation.
- `CLM-001`–`CLM-023`, independent security review, Product Owner approval and a separate Build gate
  precede any route, schema/RLS policy, real client data, reveal/export/merge/AI or lifecycle action.
