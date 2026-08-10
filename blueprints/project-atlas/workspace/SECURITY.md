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
  M012 conversation notes and M018 client/case notes are separate non-copying authorities. M092/M097
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
  consent context is reserved by M020/M078 and finalized only with the winning appointment, so
  rollback cannot leave an orphan Lead/Contact or reusable consent.

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
