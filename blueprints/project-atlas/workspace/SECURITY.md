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
